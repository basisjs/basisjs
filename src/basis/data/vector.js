
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
  var SourceDataset = basis.data.dataset.SourceDataset;

  var $undef = basis.fn.$undef;
  var $true = basis.fn.$true;
  var defaultRule = basis.getter($undef);


  //
  // main part
  //

 /**
  * Returns delta object
  * @param {Array.<basis.data.DataObject>} inserted
  * @param {Array.<basis.data.DataObject>} deleted
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

  var VectorFn = basis.Class(null, { extendConstructor_: true });

  var Count = VectorFn.subclass({
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

  var fnPreset_ = {};
  function FnConstructor(BaseClass, getter, events){
    if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(VectorFn))
      throw 'Wrong class for index constructor';

    getter = basis.getter(getter);
    events = events || 'update';

    if (typeof events != 'string')
      throw 'Events must be a event names space separated string';

    events = events.qw().sort();

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


  //////////
  //
  //

  function recalcSourceObject(dataset, sourceObjectInfo, member){
    var calcs = dataset.calcs;
    var updateData = {};
    var item = member.item;

    for (var calcName in calcs)
    {
      var calc = calcs[calcName];
      var value = calc.valueGetter(sourceObjectInfo.object);
      updateData[calcName] = calc.update(item.data[calcName], sourceObjectInfo.values[calcName], value, member);
      sourceObjectInfo.values[calcName] = value;
    }

    item.update(updateData); // TODO: store items and update aside
  }

  function changeSourceObjectKey(dataset, newKey, sourceObjectInfo, recalc){
    var objectId = sourceObjectInfo.object.basisObjectId;
    var oldMember = dataset.memberMap_[sourceObjectInfo.key];
    var newMember = dataset.memberMap_[newKey];
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
      delete dataset.memberMap_[sourceObjectInfo.key];
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
      dataset.memberMap_[newKey] = newMember;
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
    }
  }

  var VECTOR_ITEM_HANDLER = {
    update: function(object){
      var sourceObjectInfo = this.sourceMap_[object.basisObjectId];
      var key = this.rule(object);

      if (sourceObjectInfo.key !== key)
        changeSourceObjectKey(this, key, sourceObjectInfo, true);
      else
        recalcSourceObject(this, sourceObjectInfo, this.memberMap_[key]);
    }
  };

  var VECTOR_SOURCE_HANDLER = {
    datasetChanged: function(sender, delta){
      var sourceInserted = delta.inserted;
      var sourceDeleted = delta.deleted;
      var memberMap = this.memberMap_;
      var sourceMap = this.sourceMap_;
      var calcs = this.calcs;
      var inserted = [];
      var deleted = [];

      if (sourceInserted)
        for (var i = 0, object; object = sourceInserted[i]; i++)
        {
          var objectId = object.basisObjectId;
          var key = this.rule(object);
          var member = this.memberMap_[key];
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
            this.memberMap_[key] = member;
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

      if (delta = getDelta(inserted, deleted))
      {
        // fire event
        this.event_datasetChanged(delta);

        // destroy deleted
        deleted.forEach(function(item){
          item.destroy();
        });
      }
    }
  };

  var Item = Class(DataObject, {
    className: namespace + '.Item',
    isTarget: true,
    key: undefined
  });

  var Slot = Class(DataObject, {
    className: namespace + '.Slot'
  });

  var Vector = Class(SourceDataset, {
    className: namespace + '.Vector',
   /**
    * @type {Object}
    */ 
  	calcs: null,
  	slots_: null,

  	rule: defaultRule,

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
  	  var member = this.memberMap_[key];
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
          delta = changeSourceObjectKey(this, newKey, sourceObjectInfo);
          if (delta.inserted)
            inserted.push(delta.inserted);
          if (delta.deleted)
            deleted.push(delta.deleted);
        }
      }

      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(delta);
  	}
  });

  module.exports = {
    Vector: Vector,

    count: count,
    sum: sum
  };
