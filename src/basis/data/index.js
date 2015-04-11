
 /**
  * @see ./demo/defile/data_index.html
  * @namespace basis.data.index
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var basisData = require('basis.data');
  var Value = basisData.Value;
  var DataObject = basisData.Object;
  var KeyObjectMap = basisData.KeyObjectMap;
  var ReadOnlyDataset = basisData.ReadOnlyDataset;
  var DatasetWrapper = basisData.DatasetWrapper;
  var resolveDataset = basisData.resolveDataset;

  var basisDataset = require('basis.data.dataset');
  var MapFilter = basisDataset.MapFilter;
  var createRuleEvents = basisDataset.createRuleEvents;


  //
  // Main part
  //

  function binarySearchPos(array, value){
    if (!array.length)  // empty array check
      return 0;

    var pos;
    var cmpValue;
    var l = 0;
    var r = array.length - 1;

    do
    {
      pos = (l + r) >> 1;
      cmpValue = array[pos] || 0;

      if (value < cmpValue)
        r = pos - 1;
      else
        if (value > cmpValue)
          l = pos + 1;
        else
          return value == cmpValue ? pos : 0;
    }
    while (l <= r);

    return pos + (cmpValue < value);
  }


  //
  // Index
  //

 /**
  * Base class for indexes.
  * @class
  */
  var Index = Class(Value, {
    className: namespace + '.Index',

   /**
    * Explicit declared
    * @type {boolean}
    */
    explicit: false,

   /**
    * Count of wrapper indexes
    * @type {number}
    */
    wrapperCount: 0,

   /**
    * Map of current values
    * @type {Object}
    * @private
    */
    indexCache_: null,

   /**
    * @type {function(object)}
    */
    valueGetter: basis.fn.$null,

   /**
    * Event names map when index must check for updates.
    * @type {Object}
    */
    updateEvents: {},

   /**
    * @inheritDocs
    */
    value: 0,

   /**
    * @inheritDocs
    */
    setNullOnEmitterDestroy: false,

   /**
    * @constructor
    */
    init: function(){
      this.indexCache_ = {};

      Value.prototype.init.call(this);
    },

   /**
    * Add value to index
    */
    add_: function(value){
    },

   /**
    * Remove value to index
    */
    remove_: function(value){
    },

   /**
    * Change value
    */
    update_: function(newValue, oldValue){
    },

   /**
    * Normalize value to be computable.
    */
    normalize: function(value){
      return Number(value) || 0;
    },

    destroy: function(){
      Value.prototype.destroy.call(this);

      this.indexCache_ = null;
    }
  });


 /**
  * @class
  */
  var Sum = Class(Index, {
    className: namespace + '.Sum',

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.value += value;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.value -= value;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.set(this.value - oldValue + newValue);
    }
  });


 /**
  * @class
  */
  var Count = Class(Index, {
    className: namespace + '.Count',

   /**
    * @inheritDoc
    */
    valueGetter: basis.fn.$true,

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.value += value;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.value -= value;
    },

   /**
    * @inheritDoc
    */
    normalize: function(value){
      return !!value;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.set(this.value - !!oldValue + !!newValue);
    }
  });


 /**
  * @class
  */
  var Avg = Class(Index, {
    className: namespace + '.Avg',
    sum_: 0,
    count_: 0,

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.sum_ += value;
      this.count_ += 1;
      this.value = this.sum_ / this.count_;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.sum_ -= value;
      this.count_ -= 1;
      this.value = this.count_ ? this.sum_ / this.count_ : 0;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.sum_ += newValue - oldValue;
      this.set(this.sum_ / this.count_);
    }
  });


 /**
  * @class
  */
  var VectorIndex = Class(Index, {
    className: namespace + '.VectorIndex',

   /**
    * function to fetch item from vector
    * @type {function(object)}
    */
    vectorGetter: basis.fn.$null,

   /**
    * Values vector
    * @type {Array}
    */
    vector_: null,

   /**
    * @inheritDocs
    */
    value: undefined,

   /**
    * @inheritDoc
    */
    init: function(){
      this.vector_ = [];
      Index.prototype.init.call(this);
    },

   /**
    * @inheritDoc
    */
    add_: function(value){
      if (value !== null)
      {
        this.vector_.splice(binarySearchPos(this.vector_, value), 0, value);
        this.value = this.vectorGetter(this.vector_);
      }
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      if (value !== null)
      {
        this.vector_.splice(binarySearchPos(this.vector_, value), 1);
        this.value = this.vectorGetter(this.vector_);
      }
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      if (oldValue !== null)
        this.vector_.splice(binarySearchPos(this.vector_, oldValue), 1);

      if (newValue !== null)
        this.vector_.splice(binarySearchPos(this.vector_, newValue), 0, newValue);

      this.set(this.vectorGetter(this.vector_));
    },

   /**
    * @inheritDoc
    */
    normalize: function(value){
      return typeof value == 'string' || typeof value == 'number' ? value : null;
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      Index.prototype.destroy.call(this);
      this.vector_ = null;
    }
  });


 /**
  * @class
  */
  var Min = Class(VectorIndex, {
    className: namespace + '.Min',
    vectorGetter: function(vector){
      return vector[0];
    }
  });


 /**
  * @class
  */
  var Max = Class(VectorIndex, {
    className: namespace + '.Max',
    vectorGetter: function(vector){
      return vector[vector.length - 1];
    }
  });


 /**
  * @class
  */
  var Distinct = Class(Index, {
    className: namespace + '.Distinct',

   /**
    * Values map
    * @type {object}
    */
    map_: null,

   /**
    * @inheritDoc
    */
    init: function(){
      this.map_ = {};
      Index.prototype.init.call(this);
    },

   /**
    * @inheritDoc
    */
    add_: function(value){
      if (!this.map_.hasOwnProperty(value)) // new key
        this.map_[value] = 0;

      if (++this.map_[value] == 1)
        this.value += 1;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      if (--this.map_[value] == 0)
        this.value -= 1;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      var delta = 0;

      // add
      if (!this.map_.hasOwnProperty(newValue))  // new key
        this.map_[newValue] = 0;

      if (++this.map_[newValue] == 1)
        delta += 1;

      // remove
      if (--this.map_[oldValue] == 0)
        delta -= 1;

      // apply delta
      if (delta)
        this.set(this.value + delta);
    },

   /**
    * @inheritDoc
    */
    normalize: String,

   /**
    * @inheritDoc
    */
    destroy: function(){
      Index.prototype.destroy.call(this);
      this.map_ = null;
    }
  });


  var INDEXWRAPPER_HANDLER = {
    destroy: function(){
      Value.prototype.set.call(this, this.initValue);
      this.index = null;
    }
  };

 /**
  * @class
  */
  var IndexWrapper = Value.subclass({
    className: namespace + '.IndexWrapper',

    extendConstructor_: false,
    source: null,
    dataset: null,
    datasetRA_: null,
    indexConstructor: null,
    index: null,

    init: function(source, indexConstructor){
      this.source = source;
      this.indexConstructor = indexConstructor;
      this.value = indexConstructorCache[indexConstructor.indexId].indexClass.prototype.value;

      Value.prototype.init.call(this);

      source.bindingBridge.attach(source, basis.fn.$undef, this, this.destroy);
      this.setDataset(source);
      this.source[indexConstructor.indexId] = this;
    },
    setDataset: function(source){
      var oldDataset = this.dataset;
      var newDataset = resolveDataset(this, this.setDataset, source, 'sourceRA_');

      if (newDataset !== oldDataset)
      {
        var index = this.index;

        if (index)
        {
          index.removeHandler(INDEXWRAPPER_HANDLER, this);
          index.wrapperCount -= 1;
          if (!index.wrapperCount && !index.explicit)
            index.destroy();
        }

        if (newDataset)
        {
          index = getDatasetIndex(newDataset, this.indexConstructor);
          index.wrapperCount += 1;
          index.link(this, Value.prototype.set);
          index.addHandler(INDEXWRAPPER_HANDLER, this);
        }
        else
        {
          index = null;
          Value.prototype.set.call(this, this.initValue);
        }

        this.dataset = newDataset;
        this.index = index;
      }
    },
    set: function(){
      /** @cut */ basis.dev.warn(this.className + ': value can\'t be set as IndexWrapper is read only');
    },
    destroy: function(){
      this.source.bindingBridge.detach(this.source, basis.fn.$undef, this);
      this.setDataset();

      Value.prototype.destroy.call(this);

      delete this.source[this.indexConstructor.indexId];
      this.source = null;
      this.indexConstructor = null;
    }
  });


  //
  // Index builder
  //

  var indexConstructorIdPrefix = 'basisjsIndexConstructor' + basis.genUID();
  var indexConstructorCache = {};
  var resolveIndexCache = {};

  var DATASET_INDEX_HANDLER = {
    destroy: function(object){
      removeDatasetIndex(this, object);
    }
  };

 /**
  * @class
  */
  function IndexConstructor(indexId){
    this.indexId = indexId;
  }

 /**
  * @function
  */
  function getIndexConstructor(BaseClass, getter, events){
    if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(Index))
      throw 'Wrong class for index constructor';

    getter = basis.getter(getter);
    events = events || 'update';

    if (typeof events != 'string')
      throw 'Events must be a event names space separated string';

    events = events.trim().split(' ').sort();

    var indexId = indexConstructorIdPrefix + [BaseClass.basisClassId_, getter[basis.getter.ID], events].join('_');
    var indexConstructor = indexConstructorCache[indexId];

    if (indexConstructor)
      return indexConstructor.owner;

    //
    // Create new constructor
    //

    var events_ = {};
    for (var i = 0; i < events.length; i++)
      events_[events[i]] = true;

    indexConstructor = new IndexConstructor(indexId);
    indexConstructorCache[indexId] = {
      owner: indexConstructor,
      indexClass: BaseClass.subclass({
        indexId: indexId,
        updateEvents: events_,
        valueGetter: getter
      })
    };

    return indexConstructor;
  }

  var createIndexConstructor = function(IndexClass, defGetter){
    return function(source, events, getter){
      if (typeof source == 'function' || typeof source == 'string')
      {
        getter = events;
        events = source;
        source = null;
      }

      if (!getter)
      {
        getter = events;
        events = '';
      }

      var indexConstructor = getIndexConstructor(IndexClass, getter || defGetter, events);

      if (!source)
        return indexConstructor;

      if (source instanceof ReadOnlyDataset || source instanceof DatasetWrapper)
      {
        var index = getDatasetIndex(source, indexConstructor);
        index.explicit = true;
        return index;
      }

      if (source.bindingBridge)
        return source[indexConstructor.indexId] || new IndexWrapper(source, indexConstructor);

      /** @cut */ basis.dev.warn(IndexClass.className + ': wrong source value for index (should be instance of basis.data.ReadOnlyDataset, basis.data.DatasetWrapper or bb-value)');
      return null;
    };
  };

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
  // Extend datasets to support aggregates
  //

  function applyIndexDelta(index, inserted, deleted){
    var indexCache = index.indexCache_;
    var objectId;

    // lock index to prevent multiple events
    index.lock();

    if (inserted)
      for (var i = 0, object; object = inserted[i++];)
      {
        var newValue = index.normalize(index.valueGetter(object));

        indexCache[object.basisObjectId] = newValue;
        index.add_(newValue);
      }

    if (deleted)
      for (var i = 0, object; object = deleted[i++];)
      {
        objectId = object.basisObjectId;
        index.remove_(indexCache[objectId]);
        delete indexCache[objectId];
      }

    // unlock index - fire event if value was changed
    index.unlock();
  }

  var ITEM_INDEX_HANDLER = {
    '*': function(event){
      var oldValue;
      var newValue;
      var index;
      var eventType = event.type;
      var object = event.sender;
      var objectId = object.basisObjectId;
      var indexes = datasetIndexes[this.basisObjectId];

      for (var indexId in indexes)
      {
        index = indexes[indexId];

        if (index.updateEvents[eventType])
        {
          // fetch oldValue
          oldValue = index.indexCache_[objectId];

          // calc new value
          newValue = index.normalize(index.valueGetter(object));

          // update if value has changed
          if (newValue !== oldValue)
          {
            index.update_(newValue, oldValue);
            index.indexCache_[objectId] = newValue;
          }
        }
      }
    }
  };

  var DATASET_WITH_INDEX_HANDLER = {
    itemsChanged: function(object, delta){
      var array;

      // add handler to new source object
      if (array = delta.inserted)
        for (var i = array.length; i-- > 0;)
          array[i].addHandler(ITEM_INDEX_HANDLER, this);

      // remove handler from old source object
      if (array = delta.deleted)
        for (var i = array.length; i-- > 0;)
          array[i].removeHandler(ITEM_INDEX_HANDLER, this);

      // apply changes for indexes
      var indexes = datasetIndexes[this.basisObjectId];
      for (var indexId in indexes)
        applyIndexDelta(indexes[indexId], delta.inserted, delta.deleted);
    },

    destroy: function(){
      var indexes = datasetIndexes[this.basisObjectId];
      for (var indexId in indexes)
      {
        var index = indexes[indexId];
        removeDatasetIndex(this, index);
        index.destroy();
      }
    }
  };

 //
 // getDatasetIndex/removeDatasetIndex
 //

 var datasetIndexes = {};

 /**
  * @param {basis.data.ReadOnlyDataset} dataset
  * @param {basis.data.index.IndexConstructor} indexConstructor
  * @return {basis.data.index.Index} indexConstructor instance
  */
  function getDatasetIndex(dataset, indexConstructor){
    if (indexConstructor instanceof IndexConstructor == false)
      throw 'indexConstructor must be an instance of IndexConstructor';

    var datasetId = dataset.basisObjectId;
    var indexes = datasetIndexes[datasetId];

    if (!indexes)
    {
      indexes = datasetIndexes[datasetId] = {};

      dataset.addHandler(DATASET_WITH_INDEX_HANDLER);
      DATASET_WITH_INDEX_HANDLER.itemsChanged.call(dataset, dataset, {
        inserted: dataset.getItems()
      });
    }

    var indexId = indexConstructor.indexId;
    var index = indexes[indexId];

    if (!index)
    {
      indexConstructor = indexConstructorCache[indexId];
      if (!indexConstructor)
        throw 'Wrong index constructor';

      index = new indexConstructor.indexClass();
      index.addHandler(DATASET_INDEX_HANDLER, dataset);

      indexes[indexId] = index;
      applyIndexDelta(index, dataset.getItems());
    }

    return index;
  }

 /**
  * @param {basis.data.ReadOnlyDataset} dataset
  * @param {basis.data.index.Index} index
  */
  function removeDatasetIndex(dataset, index){
    var indexes = datasetIndexes[dataset.basisObjectId];
    if (indexes && indexes[index.indexId])
    {
      delete indexes[index.indexId];
      index.removeHandler(DATASET_INDEX_HANDLER, dataset);

      // if any index in dataset nothing to do
      for (var key in indexes)
        return;

      // if no indexes - delete indexes storage and remove handlers
      dataset.removeHandler(DATASET_WITH_INDEX_HANDLER);
      DATASET_WITH_INDEX_HANDLER.itemsChanged.call(dataset, dataset, {
        deleted: dataset.getItems()
      });
      delete datasetIndexes[dataset.basisObjectId];
    }
  }


  //
  // IndexMap
  //

 /**
  * @class
  */
  var CalcIndexPreset = Class(null, {
    className: namespace + '.CalcIndexPreset',
    extendConstructor_: true,
    indexes: {},
    calc: basis.fn.$null
  });

  var calcIndexPresetSeed = 1;
  function getUniqueCalcIndexId(){
    return 'calc-index-preset-' + basis.number.lead(calcIndexPresetSeed++, 8);
  }

  function percentOfRange(events, getter){
    var minIndex = 'min_' + getUniqueCalcIndexId();
    var maxIndex = 'max_' + getUniqueCalcIndexId();
    var indexes = {};

    indexes[minIndex] = min(events, getter);
    indexes[maxIndex] = max(events, getter);
    getter = basis.getter(getter || events);

    var calc = function(data, index, object){
      return (getter(object) - index[minIndex]) / (index[maxIndex] - index[minIndex]);
    };

    return calc.preset = new CalcIndexPreset({
      indexes: indexes,
      calc: calc
    });
  }

  function percentOfMax(events, getter){
    var maxIndex = 'max_' + getUniqueCalcIndexId();
    var indexes = {};

    indexes[maxIndex] = max(events, getter);
    getter = basis.getter(getter || events);

    var calc = function(data, index, object){
      return getter(object) / index[maxIndex];
    };

    return calc.preset = new CalcIndexPreset({
      indexes: indexes,
      calc: calc
    });
  }

  function percentOfSum(getter, events){
    var sumIndex = 'sum_' + getUniqueCalcIndexId();
    var indexes = {};

    indexes[sumIndex] = sum(events, getter);
    getter = basis.getter(getter || events);

    var calc = function(data, index, object){
      return getter(object) / index[sumIndex];
    };

    return calc.preset = new CalcIndexPreset({
      indexes: indexes,
      calc: calc
    });
  }


 /**
  * @class
  */
  var IndexMap = Class(MapFilter, {
    className: namespace + '.IndexMap',

    calcs: null,

    indexes: null,
    indexes_: null,
    indexesBind_: null,

    timer_: undefined,
    indexUpdated: null,
    indexValues: null,
    memberSourceMap: null,
    keyMap: null,

    map: function(item){
      return this.keyMap.get(item, true);
    },

    addMemberRef: function(member, sourceObject){
      this.memberSourceMap[member.basisObjectId] = sourceObject.basisObjectId;

      if (this.listen.member)
        member.addHandler(this.listen.member, this);

      this.sourceMap_[sourceObject.basisObjectId].updated = true;

      if (member.subscriberCount > 0)
        this.calcMember(member);
    },

    removeMemberRef: function(member){
      delete this.memberSourceMap[member.basisObjectId];

      if (this.listen.member)
        member.removeHandler(this.listen.member, this);
    },

    emit_sourceChanged: function(oldSource){
      MapFilter.prototype.emit_sourceChanged.call(this, oldSource);

      for (var indexName in this.indexes_)
      {
        var index = this.indexes_[indexName];

        if (oldSource)
        {
          this.removeIndex(indexName);
          removeDatasetIndex(oldSource, this.indexes[indexName]);
        }

        if (this.source)
          this.addIndex(indexName, getDatasetIndex(this.source, index));
      }
    },

    listen: {
      index: {
        change: function(sender){
          var indexMap = this.indexMap;

          indexMap.indexValues[this.key] = sender.value;
          indexMap.indexUpdated = true;
          indexMap.recalcRequest();
        }
      },
      member: {
        subscribersChanged: function(object){
          if (object.subscriberCount > 0)
            this.calcMember(object);
        }
      }
    },

    /** looks like a hack */
    ruleEvents: createRuleEvents(
      function(sender, delta){
        MapFilter.prototype.ruleEvents.update.call(this, sender, delta);

        this.sourceMap_[sender.basisObjectId].updated = true;
        this.recalcRequest();
      },
      'update'
    ),


    init: function(){
      this.recalc = this.recalc.bind(this);

      this.indexUpdated = false;
      this.indexesBind_ = {};
      this.memberSourceMap = {};

      var indexes = this.indexes;
      this.indexes = {};
      this.indexes_ = {};
      this.indexValues = {};

      var calcs = this.calcs;
      this.calcs = {};

      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(basis.object.complete({
          create: function(key, config){
            return new this.itemClass(config);
          }
        }, this.keyMap));

      MapFilter.prototype.init.call(this);

      basis.object.iterate(indexes, this.addIndex, this);
      basis.object.iterate(calcs, this.addCalc, this);
    },

    addIndex: function(key, index){
      if (!this.indexes[key])
      {
        if (index instanceof IndexConstructor)
        {
          if (!this.indexes_[key])
          {
            this.indexes_[key] = index;
            index = this.source ? getDatasetIndex(this.source, index) : null;
          }
          else
          {
            /** @cut */ basis.dev.warn('Index `' + key + '` already exists');
            return;
          }
        }

        if (index instanceof Index)
        {
          this.indexValues[key] = index.value;
          this.indexes[key] = index;
          this.indexesBind_[key] = {
            key: key,
            indexMap: this
          };

          var listenHandler = this.listen.index;
          if (listenHandler)
          {
            index.addHandler(listenHandler, this.indexesBind_[key]);

            if (listenHandler.change)
              listenHandler.change.call(this.indexesBind_[key], index, index.value);
          }
        }
        else
        {
          /** @cut */ basis.dev.warn('Index should be instance of `basis.data.index.Index`');
        }
      }
      else
      {
        /** @cut */ basis.dev.warn('Index `' + key + '` already exists');
      }
    },

    removeIndex: function(key){
      if (this.indexes_[key] || this.indexes[key])
      {
        if (this.indexes[key] && this.listen.index)
          this.indexes[key].removeHandler(this.listen.index, this.indexesBind_[key]);

        delete this.indexValues[key];
        delete this.indexesBind_[key];
        delete this.indexes[key];
        delete this.indexes_[key];
      }
    },

    addCalc: function(name, calcCfg){
      if (calcCfg instanceof CalcIndexPreset)
      {
        this.calcs[name] = calcCfg.calc;
        for (var indexName in calcCfg.indexes)
          this.addIndex(indexName, calcCfg.indexes[indexName]);
      }
      else
        this.calcs[name] = calcCfg;

      this.recalcRequest();
    },
    removeCalc: function(name){
      var calcCfg = this.calcs[name];

      if (calcCfg && calcCfg.preset instanceof CalcIndexPreset)
      {
        var indexes = calcCfg.preset.indexes;
        for (var indexName in indexes)
          this.removeIndex(indexName, indexes[indexName]);
      }

      delete this.calcs[name];
    },

    lock: function(){
      for (var indexId in this.indexes)
        this.indexes[indexId].lock();
    },
    unlock: function(){
      for (var indexId in this.indexes)
        this.indexes[indexId].unlock();
    },

    recalcRequest: function(){
      if (!this.timer_)
        this.timer_ = basis.setImmediate(this.recalc);
    },

    recalc: function(){
      for (var idx in this.items_)
        this.calcMember(this.items_[idx]);

      this.indexUpdated = false;
      this.timer_ = basis.clearImmediate(this.timer_);
    },

    calcMember: function(member){
      var sourceObject = this.sourceMap_[this.memberSourceMap[member.basisObjectId]];

      if (member.subscriberCount && (sourceObject.updated || this.indexUpdated))
      {
        sourceObject.updated = false;

        var data = {};
        var newValue;
        var oldValue;
        var update;
        for (var calcName in this.calcs)
        {
          newValue = this.calcs[calcName](sourceObject.sourceObject.data, this.indexValues, sourceObject.sourceObject);
          oldValue = member.data[calcName];
          if (member.data[calcName] !== newValue && (typeof newValue != 'number' || typeof oldValue != 'number' || !isNaN(newValue) || !isNaN(oldValue)))
          {
            data[calcName] = newValue;
            update = true;
          }
        }

        if (update)
          member.update(data);
      }
    },

    getMember: function(sourceObject){
      return this.keyMap.get(sourceObject, true);
    },

    destroy: function(){
      for (var indexName in this.indexes)
        this.removeIndex(indexName);

      MapFilter.prototype.destroy.call(this);

      this.keyMap.destroy();
      this.keyMap = null;

      this.timer_ = basis.clearImmediate(this.timer_);
      this.calcs = null;
      this.indexes = null;
      this.indexes_ = null;
      this.indexValues = null;
      this.memberSourceMap = null;
      this.indexesBind_ = null;
    }
  });


  //
  // export names
  //

  module.exports = {
    IndexConstructor: IndexConstructor,
    createIndexConstructor: createIndexConstructor,

    getDatasetIndex: getDatasetIndex,
    removeDatasetIndex: removeDatasetIndex,

    Index: Index,
    Count: Count,
    Sum: Sum,
    Avg: Avg,
    VectorIndex: VectorIndex,
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
