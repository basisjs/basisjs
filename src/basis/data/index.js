
 /**
  * @see ./demo/defile/data_index.html
  * @namespace basis.data.index
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var iterate = basis.object.iterate;

  var basisData = require('basis.data');
  var Value = basisData.Value;
  var DataObject = basisData.Object;

  var basisDataset = require('basis.data.dataset');
  var SourceDataset = basisDataset.SourceDataset;
  var createRuleEvents = basisDataset.createRuleEvents;

  var Index = require('./index/Index.js');
  var VectorIndex = require('./index/VectorIndex.js');
  var Count = require('./index/Count.js');
  var Sum = require('./index/Sum.js');
  var Avg = require('./index/Avg.js');
  var Min = require('./index/Min.js');
  var Max = require('./index/Max.js');
  var Distinct = require('./index/Distinct.js');
  var IndexWrapper = require('./index/IndexWrapper.js');

  var createIndexConstructor = require('./index/constructor.js');
  var getDatasetIndex = Index.getDatasetIndex;
  var removeDatasetIndex = Index.removeDatasetIndex;


  //
  // Build basic index constructors
  //

  var count = createIndexConstructor(Count, basis.fn.$true);
  var sum = createIndexConstructor(Sum);
  var avg = createIndexConstructor(Avg);
  var min = createIndexConstructor(Min);
  var max = createIndexConstructor(Max);
  var distinct = createIndexConstructor(Distinct);


  //
  // IndexMap
  //

  var indexMapRecalcShedule = basis.asap.schedule(function(indexMap){
    indexMap.recalc();
  });
  var calcIndexPresetSeed = 1;
  function getUniqueCalcIndexId(){
    return 'calc-index-preset-' + basis.number.lead(calcIndexPresetSeed++, 8);
  }

 /**
  * @class
  */
  var CalcIndexPreset = function(indexes, calc){
    this.indexes = indexes;
    this.calc = calc;
  };

  //
  // index map helpers
  //
  function percentOfRange(events, getter){
    var minIndex = 'min_' + getUniqueCalcIndexId();
    var maxIndex = 'max_' + getUniqueCalcIndexId();
    var indexes = {};

    indexes[minIndex] = min(events, getter);
    indexes[maxIndex] = max(events, getter);
    getter = basis.getter(getter || events);

    return new CalcIndexPreset(indexes, function(data, index, object){
      return (getter(object) - index[minIndex]) / (index[maxIndex] - index[minIndex]);
    });
  }

  function percentOfMax(events, getter){
    var maxIndex = 'max_' + getUniqueCalcIndexId();
    var indexes = {};

    indexes[maxIndex] = max(events, getter);
    getter = basis.getter(getter || events);

    return new CalcIndexPreset(indexes, function(data, index, object){
      return getter(object) / index[maxIndex];
    });
  }

  function percentOfSum(getter, events){
    var sumIndex = 'sum_' + getUniqueCalcIndexId();
    var indexes = {};

    indexes[sumIndex] = sum(events, getter);
    getter = basis.getter(getter || events);

    return new CalcIndexPreset(indexes, function(data, index, object){
      return getter(object) / index[sumIndex];
    });
  }

  var INDEXMAP_SOURCE_HANDLER = {
    itemsChanged: function(sender, delta){
      var deleted = [];
      var array;

      if (array = delta.inserted)
        for (var i = 0; i < array.length; i++)
        {
          var sourceObject = array[i];
          var sourceObjectId = sourceObject.basisObjectId;

          this.awaitToAdd_[sourceObjectId] = sourceObject;
          this.scheduleRecalc();
        }

      if (array = delta.deleted)
        for (var i = 0; i < array.length; i++)
        {
          var sourceObject = array[i];
          var sourceObjectId = sourceObject.basisObjectId;
          var memberInfo = this.sourceMap_[sourceObjectId];

          if (memberInfo)
          {
            var member = memberInfo.member;

            deleted.push(member);

            if (this.listen.member)
              member.removeHandler(this.listen.member, this);

            if (this.recalcEvents)
              sourceObject.removeHandler(this.recalcEvents, this);

            delete this.sourceMap_[sourceObjectId];
          }
          else
          {
            delete this.awaitToAdd_[sourceObjectId];
          }
        }

      if (deleted.length)
      {
        this.emit_itemsChanged({
          deleted: deleted
        });

        for (var i = 0; i < deleted.length; i++)
        {
          var member = deleted[i];
          member.source = null;
          member.destroy();
        }
      }
    }
  };

 /**
  * @class
  */
  var IndexMap = Class(SourceDataset, {
    className: namespace + '.IndexMap',

    calcs: null,
    copyDataFromSource: true,

    indexes: null,
    indexValues: null,
    indexUpdated: false,

    awaitToAdd_: null,
    itemClass: DataObject,

    listen: {
      source: INDEXMAP_SOURCE_HANDLER
    },

    recalcEvents: createRuleEvents(
      function(sender){
        this.sourceMap_[sender.basisObjectId].updated = true;
        this.scheduleRecalc();
      },
      'update'
    ),


    init: function(){
      var indexes = this.indexes;
      this.indexes = {};
      this.indexValues = {};
      this.awaitToAdd_ = {};

      var calcs = this.calcs;
      this.calcs = {};

      SourceDataset.prototype.init.call(this);

      iterate(indexes, this.addIndex, this);
      for (var name in calcs)
      {
        var calcCfg = calcs[name];
        if (calcCfg instanceof CalcIndexPreset)
        {
          iterate(calcCfg.indexes, this.addIndex, this);
          calcCfg = calcCfg.calc;
        }

        this.calcs[name] = calcCfg;
      }

      // TODO: Probably we should make recalc async
      this.recalc();
    },

    // TODO: Probably we should left adding members on source change async
    setSource: function(source){
      var curSource = this.source;

      SourceDataset.prototype.setSource.call(this, source);

      if (curSource !== this.source)
        this.recalc();
    },

    addIndex: function(key, IndexClass){
      if (!IndexClass || IndexClass.prototype instanceof Index === false)
      {
        /** @cut */ basis.dev.warn('basis.data.IndexMap#addIndex(): `IndexClass` should be subclass of `basis.data.index.Index`');
        return;
      }

      if (this.indexes[key])
      {
        /** @cut */ basis.dev.warn('basis.data.IndexMap#addIndex(): Index `' + key + '` already exists');
        return;
      }

      var index = new IndexWrapper(Value.from(this, 'sourceChanged', 'source'), IndexClass);
      this.indexes[key] = index;
      this.indexValues[key] = index.value;

      index.link(this, function(value){
        this.indexValues[key] = value;
        this.indexUpdated = true;
        this.scheduleRecalc();
      });
    },
    removeIndex: function(key){
      var index = this.indexes[key];

      if (index)
      {
        delete this.indexes[key];
        delete this.indexValues[key];

        index.destroy();
      }
    },

    lock: function(){
      for (var indexId in this.indexes)
        this.indexes[indexId].lock();
    },
    unlock: function(){
      for (var indexId in this.indexes)
        this.indexes[indexId].unlock();
    },

    scheduleRecalc: function(){
      indexMapRecalcShedule.add(this);
    },
    recalc: function(){
      // recalc existed members
      for (var id in this.sourceMap_)
        this.calcMember(this.sourceMap_[id]);

      // add new members
      var inserted = [];
      var items = this.awaitToAdd_;

      this.awaitToAdd_ = {};

      for (var id in items)
      {
        var sourceObject = items[id];
        var data = {};
        var member;

        for (var calcName in this.calcs)
          data[calcName] = this.calcs[calcName](sourceObject.data, this.indexValues, sourceObject);

        if (this.copyDataFromSource)
          for (var key in sourceObject.data)
            if (!this.calcs.hasOwnProperty(key))
              data[key] = sourceObject.data[key];

        member = new this.itemClass({
          data: data
        });

        if (this.listen.member)
          member.addHandler(this.listen.member, this);

        if (this.recalcEvents)
          sourceObject.addHandler(this.recalcEvents, this);

        this.sourceMap_[id] = {
          sourceObject: sourceObject,
          member: member,
          updated: false
        };

        inserted.push(member);
      }

      if (inserted.length)
        this.emit_itemsChanged({
          inserted: inserted
        });

      this.indexUpdated = false;
      indexMapRecalcShedule.remove(this);
    },

    calcMember: function(memberInfo){
      var member = memberInfo.member;

      if (memberInfo.updated || this.indexUpdated)
      {
        var sourceObject = memberInfo.sourceObject;
        var delta = {};
        var newValue;
        var oldValue;
        var update;

        for (var calcName in this.calcs)
        {
          newValue = this.calcs[calcName](sourceObject.data, this.indexValues, sourceObject);
          oldValue = member.data[calcName];
          if (oldValue !== newValue && (newValue === newValue || oldValue === oldValue))
          {
            delta[calcName] = newValue;
            update = true;
          }
        }

        if (this.copyDataFromSource)
        {
          for (var key in sourceObject.data)
            if (!this.calcs.hasOwnProperty(key))
            {
              newValue = sourceObject.data[key];
              oldValue = member.data[key];
              if (oldValue !== newValue && (newValue === newValue || oldValue === oldValue))
              {
                delta[key] = newValue;
                update = true;
              }
            }

          for (var key in member.data)
            if (!this.calcs.hasOwnProperty(key) && !sourceObject.data.hasOwnProperty(key))
            {
              delta[key] = undefined;
              update = true;
            }
        }

        if (update)
          member.update(delta);

        memberInfo.updated = false;
      }
    },

    getMember: function(sourceObject){
      var memberInfo = sourceObject && this.sourceMap_[sourceObject.basisObjectId];
      return memberInfo ? memberInfo.member : null;
    },

    destroy: function(){
      iterate(this.indexes, this.removeIndex, this);

      SourceDataset.prototype.destroy.call(this);

      indexMapRecalcShedule.remove(this);

      this.awaitToAdd_ = null;
      this.calcs = null;
      this.indexes = null;
      this.indexValues = null;
    }
  });


  //
  // export names
  //

  module.exports = {
    createIndexConstructor: createIndexConstructor,

    getDatasetIndex: getDatasetIndex,
    removeDatasetIndex: removeDatasetIndex,

    Index: Index,
    VectorIndex: VectorIndex,
    Count: Count,
    Sum: Sum,
    Avg: Avg,
    Min: Min,
    Max: Max,
    Distinct: Distinct,

    count: count,
    sum: sum,
    avg: avg,
    max: max,
    min: min,
    distinct: distinct,

    CalcIndexPreset: CalcIndexPreset,
    percentOfRange: percentOfRange,
    percentOfMax: percentOfMax,
    percentOfSum: percentOfSum,

    IndexMap: IndexMap
  };
