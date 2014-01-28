
  basis.require('basis.data');
  basis.require('basis.data.dataset');


 /**
  * @namespace basis.data.dataset
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DataObject = basis.data.Object;
  var Slot = basis.data.Slot;
  var SourceDataset = basis.data.dataset.SourceDataset;

  var $undef = basis.fn.$undef;
  var $true = basis.fn.$true;
  var defaultRule = basis.getter($undef);


  //
  // main part
  //

 /**
  * Returns delta object
  * @param {Array.<basis.data.Object>} inserted
  * @param {Array.<basis.data.Object>} deleted
  * @return {object|boolean}
  */
  function getDelta(inserted, deleted){
    var delta = {};
    var result;

    if (inserted && inserted.length)
      result = delta.inserted = inserted;

    if (deleted && deleted.length)
      result = delta.deleted = deleted;

    if (result)
      return delta;
  }

  var VectorFn = basis.Class(null, {
    className: namespace + '.Count',
    extendConstructor_: true
  });

  var Count = VectorFn.subclass({
    className: namespace + '.Count',
    add: function(curValue, value){
      return curValue + !!value;
    },
    remove: function(curValue, value){
      return curValue - !!value;
    },
    update: function(curValue, oldValue, newValue){
      return curValue - !!oldValue + !!newValue;
    }
  });

  var Sum = VectorFn.subclass({
    className: namespace + '.Sum',
    add: function(curValue, value){
      return curValue + value;
    },
    remove: function(curValue, value){
      return curValue - value;
    },
    update: function(curValue, oldValue, newValue){
      return curValue - oldValue + newValue;
    }
  });

  var Avg = VectorFn.subclass({
    className: namespace + '.Avg',
    add: function(curValue, value, member){
      return (curValue * (member.count - 1) + (value || 0)) / member.count;
    },
    remove: function(curValue, value, member){
      return (curValue * (member.count + 1) - (value || 0)) / (member.count || 1);
    },
    update: function(curValue, oldValue, newValue, member){
      return ((curValue * member.count) - (oldValue || 0) + (newValue || 0)) / member.count;
    }
  });


  var fnPreset_ = {};
  function FnConstructor(BaseClass, getter, events){
    if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(VectorFn))
      throw 'Wrong class for index constructor';

    getter = basis.getter(getter);
    events = events || 'update';

    if (typeof events != 'string')
      throw 'Events must be a event names space separated string';

    events = events.trim().split(' ').sort();

    var fnId = [BaseClass.basisClassId_, getter.basisGetterId_, events].join('_');
    var fnConstructor = fnPreset_[fnId];

    if (fnConstructor)
      return fnConstructor;

    //
    // Create new constructor
    //

    var eventMap = {};
    for (var i = 0; i < events.length; i++)
      eventMap[events[i]] = true;

    return fnPreset_[fnId] = new BaseClass({
      updateEvents: eventMap,
      valueGetter: getter
    });
  }

  function fnConstructor(FnClass){
    return function(getter, events){
      return new FnConstructor(FnClass, getter || $true, events);
    };
  }

  var sum = fnConstructor(Sum);
  var count = fnConstructor(Count);
  var avg = fnConstructor(Avg);


  //////////
  //
  //

  function recalcSourceObject(dataset, sourceObjectInfo){
    var calcs = dataset.calcs;
    var updateData = {};
    var member = dataset.members_[sourceObjectInfo.key];
    var item = member.item;

    for (var calcName in calcs)
    {
      var calc = calcs[calcName];
      var value = calc.valueGetter(sourceObjectInfo.object);
      updateData[calcName] = calc.update(item.data[calcName] || 0, sourceObjectInfo.values[calcName], value, member);
      sourceObjectInfo.values[calcName] = value;
    }

    item.update(updateData); // TODO: store items and update aside
  }

  function changeSourceObjectKey(dataset, newKey, sourceObjectInfo, recalc){
    var objectId = sourceObjectInfo.object.basisObjectId;
    var oldMember = dataset.members_[sourceObjectInfo.key];
    var newMember = dataset.members_[newKey];
    var calcs = dataset.calcs;
    var inserted;
    var deleted;

    //
    // remove from old member
    //
    var oldItem = oldMember.item;

    // delete references
    delete oldMember[objectId];

    // process member
    if (--oldMember.count == 0)
    {
      // delete
      delete dataset.members_[sourceObjectInfo.key];
      deleted = oldItem;
    }
    else
    {
      // update item
      var updateData = {};

      for (var calcName in calcs)                  // cur value            what remove                 count of values
        updateData[calcName] = calcs[calcName].remove(oldItem.data[calcName], sourceObjectInfo.values[calcName], oldMember);

      oldItem.update(updateData); // TODO: store items and update aside
    }

    //
    // recalc
    //
    if (recalc)
      for (var calcName in calcs)
        sourceObjectInfo.values[calcName] = calcs[calcName].valueGetter(sourceObjectInfo.object);


    //
    // add create or update new member
    //

    var newItem;
    // create member if necessary
    if (!newMember)
    {
      newItem = new Item({
        key: newKey
      });
      newMember = {
        count: 0,
        item: newItem
      };
      dataset.members_[newKey] = newMember;
      inserted = newItem;

      if (dataset.slots_[newKey])
        dataset.slots_[newKey].setDelegate(newItem);
    }
    else
      newItem = newMember.item;

    newMember[objectId] = sourceObjectInfo;
    newMember.count++;

    var updateData = {};

    for (var calcName in calcs)               // cur value                    what remove         count of values
      updateData[calcName] = calcs[calcName].add(newItem.data[calcName] || 0, sourceObjectInfo.values[calcName], newMember);

    newItem.update(updateData); // TODO: store items and update aside


    // update key

    newItem.key = newKey;
    sourceObjectInfo.key = newKey;

    //
    return {
      inserted: inserted,
      deleted: deleted
    };
  }

  var VECTOR_ITEM_HANDLER = {
    update: function(object){
      var sourceObjectInfo = this.sourceMap_[object.basisObjectId];
      var key = this.rule(object);

      if (sourceObjectInfo.key !== key)
      {
        var delta = changeSourceObjectKey(this, key, sourceObjectInfo, true);
        if (delta = getDelta(delta.inserted && [delta.inserted], delta.deleted && [delta.deleted]))
          this.emit_itemsChanged(delta);
      }
      else
        recalcSourceObject(this, sourceObjectInfo);
    }
  };

  var VECTOR_SOURCE_HANDLER = {
    itemsChanged: function(sender, delta){
      var sourceInserted = delta.inserted;
      var sourceDeleted = delta.deleted;
      var memberMap = this.members_;
      var sourceMap = this.sourceMap_;
      var calcs = this.calcs;
      var inserted = [];
      var deleted = [];

      if (sourceInserted)
        for (var i = 0, object; object = sourceInserted[i]; i++)
        {
          var objectId = object.basisObjectId;
          var key = this.rule(object);
          var member = this.members_[key];
          var item;

          // create member if necessary
          if (!member)
          {
            item = new Item({
              key: key
            });
            member = {
              count: 0,
              item: item
            };
            this.members_[key] = member;
            inserted.push(item);

            if (this.slots_[key])
              this.slots_[key].setDelegate(item);
          }
          else
            item = member.item;

          // create source object and registrate it
          var sourceObjectInfo = {
            key: key,
            object: object,
            values: {}
          };

          sourceMap[objectId] = sourceObjectInfo;

          member[objectId] = sourceObjectInfo;
          member.count++;

          // add handler
          object.addHandler(VECTOR_ITEM_HANDLER, this);

          var updateData = {};
          for (var calcName in calcs)
          {
            var calc = calcs[calcName];
            var value = calc.valueGetter(object);
            sourceObjectInfo.values[calcName] = value;
                                    // cur value              what remove         count of values
            updateData[calcName] = calc.add(item.data[calcName] || 0, value, member);
          }

          item.update(updateData); // TODO: store items and update aside
        }

      if (sourceDeleted)
        for (var i = 0, object; object = sourceDeleted[i]; i++)
        {
          var objectId = object.basisObjectId;
          var sourceObjectInfo = sourceMap[objectId];
          var member = memberMap[sourceObjectInfo.key];
          var item = member.item;

          // delete references
          delete sourceMap[objectId];
          delete member[objectId];

          // remove handler
          object.removeHandler(VECTOR_ITEM_HANDLER, this);

          // process member
          if (--member.count == 0)
          {
            // delete
            delete memberMap[sourceObjectInfo.key];
            deleted.push(item);

            if (this.slots_[item.key])
            {
              // update item
              var updateData = {};

              for (var calcName in calcs)          // cur value            what remove                 count of values
                updateData[calcName] = calcs[calcName].remove(item.data[calcName], sourceObjectInfo.values[calcName], member);

              item.update(updateData); // TODO: store items and update aside
            }
          }
          else
          {
            // update item
            var updateData = {};

            for (var calcName in calcs)          // cur value            what remove                 count of values
              updateData[calcName] = calcs[calcName].remove(item.data[calcName], sourceObjectInfo.values[calcName], member);

            item.update(updateData); // TODO: store items and update aside
          }
        }

      // fire event
      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);
    }
  };

  var Item = Class(DataObject, {
    className: namespace + '.Item',
    target: true,
    key: undefined
  });

  var Vector = Class(SourceDataset, {
    className: namespace + '.Vector',
   /**
    * @type {Object}
    */
    calcs: null,
    slots_: null,

    rule: defaultRule,

    emit_itemsChanged: function(delta){
      SourceDataset.prototype.emit_itemsChanged.call(this, delta);

      // destroy deleted
      if (delta.deleted)
        delta.deleted.forEach(function(item){
          item.destroy();
        });
    },

    listen: {
      source: VECTOR_SOURCE_HANDLER
    },

   /**
    * @inheritDoc
    */
    init: function(){
      // process calcs
      var calcs = this.calcs;
      this.calcs = {};
      for (var key in calcs)
      {
        var calc = calcs[key];
        if (calc instanceof VectorFn == false)
          calc = sum(calc);
        this.calcs[key] = calc;
      }

      this.slots_ = {};

      // inherit
      SourceDataset.prototype.init.call(this);
    },

    get: function(key){
      var member = this.members_[key];
      if (member)
        return member.item;
    },
    getSlot: function(key){
      var slot = this.slots_[key];
      if (!slot)
      {
        slot = new Slot({
          key: key,
          delegate: this.get(key)
        });
        this.slots_[key] = slot;
      }
      return slot;
    },

    setRule: function(rule){
      if (typeof rule != 'function')
        rule = defaultRule;

      if (this.rule !== rule)
      {
        this.rule = rule;
        this.applyRule();
      }
    },

    setCalc: function(name, newCalc){
      if (newCalc && newCalc instanceof VectorFn == false)
        newCalc = sum(newCalc);

      var oldCalc = this.calcs[name];
      if (oldCalc != newCalc)
      {
        var sourceMap = this.sourceMap_;

        if (newCalc)
        {
          this.calcs[name] = newCalc;

          var newValues = {};
          for (var objectId in sourceMap)
          {
            var sourceObjectInfo = sourceMap[objectId];
            var key = sourceObjectInfo.key;
            var member = this.members_[key];

            if (!newValues[key])
            {
              newValues[key] = {
                item: member.item,
                count: 0,
                value: 0
              }
            }

            member.count = (newValues[key].count += 1);

            sourceObjectInfo.values[name] = newCalc.valueGetter(sourceObjectInfo.object);
            newValues[key].value = newCalc.add(newValues[key].value || 0, sourceObjectInfo.values[name], member);
          }

          var updateData = {};
          for (var key in newValues)
          {
            updateData[name] = newValues[key].value;
            newValues[key].item.update(updateData);
          }
        }
        else
        {
          delete this.calcs[name];

          for (var objectId in sourceMap)
            delete sourceMap[objectId].values[name];

          var resetData = {};
          resetData[name] = undefined;
          for (var i = 0, item, items = this.getItems(); item = items[i]; i++)
            item.update(resetData);
        }
      }
    },

    applyRule: function(scope){
      var inserted = [];
      var deleted = [];
      var delta;

     if (!scope)
       scope = this.sourceMap_;

      for (var objectId in scope)
      {
        var sourceObjectInfo = scope[objectId];
        var newKey = this.rule(sourceObjectInfo.object);
        if (newKey !== sourceObjectInfo.key)
        {
          delta = changeSourceObjectKey(this, newKey, sourceObjectInfo, true);
          if (delta.inserted)
            inserted.push(delta.inserted);
          if (delta.deleted)
            deleted.push(delta.deleted);
        }
        else
          recalcSourceObject(this, sourceObjectInfo);
      }

      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);
    }
  });

  module.exports = {
    Vector: Vector,

    count: count,
    sum: sum,
    avg: avg
  };
