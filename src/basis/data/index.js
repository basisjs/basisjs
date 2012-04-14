/**
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  'use strict';

  basis.require('basis.timer');
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.data.property');


 /**
  * @see ./demo/defile/data_index.html
  * @namespace basis.data.index
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  
  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var KeyObjectMap = nsData.KeyObjectMap;
  var AbstractDataset = nsData.AbstractDataset;

  var Property = basis.data.property.Property;
  var MapReduce = basis.data.dataset.MapReduce;


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
  var Index = Class(Property, {
    className: namespace + '.Index',
    autoDestroy: true,

   /**
    * Map of current values 
    * @type {Object}
    * @private
    */
    indexCache_: null,

   /**
    * @type {function(object):any}
    */
    valueGetter: Function.$null,

   /**
    * Event names map when index must check for updates.
    * @type {Object}
    */
    updateEvents: {},
   
   /**
    * @constructor
    */
    init: function(){
      this.indexCache_ = {};

      Property.prototype.init.call(this, 0);
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

    destroy: function(){
      Property.prototype.destroy.call(this);

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
    valueGetter: Function.$true,

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.value += !!value;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.value -= !!value;
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
    * @type {function(vector)}
    */
    itemGetter: Function.$null,

   /**
    * Values vector
    * @type {Array.<any>}
    */
    vector_: null,

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
      this.vector_.splice(binarySearchPos(this.vector_, value), 0, value);
      this.value = this.vectorGetter(this.vector_);
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.vector_.splice(binarySearchPos(this.vector_, value), 1);
      this.value = this.vectorGetter(this.vector_);
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.vector_.splice(binarySearchPos(this.vector_, oldValue), 1);
      this.vector_.splice(binarySearchPos(this.vector_, newValue), 0, newValue);
      this.set(this.vectorGetter(this.vector_));
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      Index.prototype.destroy.call(this)
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


  //
  // Index builder
  //

  var indexConstructors_= {};

  var DATASET_INDEX_HANDLER = {
    destroy: function(object){
      this.deleteIndex(object);
    }
  };

  function IndexConstructor(BaseClass, getter, events){
    if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(Index))
      throw 'Wrong class for index constructor';

    getter = Function.getter(getter);
    events = events || 'update';

    if (typeof events != 'string')
      throw 'Events must be a event names space separated string';

    events = events.qw().sort();

    var indexId = [BaseClass.basisClassId_, getter.basisGetterId_, events].join('_');
    var indexConstructor = indexConstructors_[indexId];

    if (indexConstructor)
      return indexConstructor.owner;

    //
    // Create new constructor
    //

    var events_ = {};
    for (var i = 0; i < events.length; i++)
      events_[events[i]] = true;

    indexConstructors_[indexId] = {
      owner: this,
      indexClass: BaseClass.subclass({
        indexId: indexId,
        updateEvents: events_,
        valueGetter: getter
      })
    };

    this.indexId = indexId;
  };

  var createIndexConstructor = function(IndexClass){
    return function(getter, events){
      return new IndexConstructor(IndexClass, getter, events);
    }
  }

  //
  // Build basic index constructors
  //

  var count = createIndexConstructor(Count);
  var sum = createIndexConstructor(Sum);
  var avg = createIndexConstructor(Avg);
  var min = createIndexConstructor(Min);
  var max = createIndexConstructor(Max);


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
        var newValue = index.valueGetter(object);
        indexCache[object.eventObjectId] = newValue;
        index.add_(newValue);
      }

    if (deleted)
      for (var i = 0, object; object = deleted[i++];)
      {
        objectId = object.eventObjectId;
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
      var object = event.args[0];
      var objectId = object.eventObjectId;

      for (var indexId in this.indexes)
      {
        index = this.indexes[indexId];

        if (index.updateEvents[eventType])
        {
          // fetch oldValue
          oldValue = index.indexCache_[objectId];

          // calc new value
          newValue = index.valueGetter(object);

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
    datasetChanged: function(object, delta){
      var array;

      // add handler to new source object
      if (array = delta.inserted)
        for (var i = array.length; i --> 0;)
          array[i].addHandler(ITEM_INDEX_HANDLER, this);

      // remove handler from old source object
      if (array = delta.deleted)
        for (var i = array.length; i --> 0;)
          array[i].removeHandler(ITEM_INDEX_HANDLER, this);

      // apply changes for indexes
      for (var indexId in this.indexes)
        applyIndexDelta(this.indexes[indexId], delta.inserted, delta.deleted);
    },
    
    destroy: function(){
      var indexes = Object.values(this.indexes);
      for (var indexId in indexes)
        this.deleteIndex(indexes[indexId]);
    }
  };


 /**
  * Extend for basis.data.AbstractDataset
  * @namespace basis.data.AbstractDataset
  */
  AbstractDataset.extend({
   /**
    * @type {Object}
    */
    indexes: null,

   /**
    * @param
    */ 
    getIndex: function(indexConstructor){
      if (indexConstructor instanceof IndexConstructor == false)
      {
        ;;;if (typeof console != 'undefined') console.warn('indexConstructor must be an instance of IndexConstructor');
        return;
      }

      if (!this.indexes)
      {
        this.indexes = {};

        this.addHandler(DATASET_WITH_INDEX_HANDLER);
        DATASET_WITH_INDEX_HANDLER.datasetChanged.call(this, this, {
          inserted: this.getItems()
        });
      }

      var indexId = indexConstructor.indexId;
      var index = this.indexes[indexId];

      if (!index)
      {
        indexConstructor = indexConstructors_[indexId];
        if (!indexConstructor)
          throw 'Wrong index constructor';

        index = new indexConstructor.indexClass();
        index.addHandler(DATASET_INDEX_HANDLER, this);

        this.indexes[indexId] = index;
        applyIndexDelta(index, this.getItems());
      }

      return index; 
    },

   /**
    * @param {basis.data.index.IndexConstructor|basis.data.index.Index}
    */
    deleteIndex: function(index){
      if (this.indexes && this.indexes[index.indexId])
      {
        delete this.indexes[index.indexId];
        index.removeHandler(DATASET_INDEX_HANDLER, this);
        index.destroy();

        // if any index in dataset nothing to do
        for (var key in this.indexes)
          return;

        // if no indexes - delete indexes storage and remove handlers
        this.removeHandler(DATASET_WITH_INDEX_HANDLER);
        this.indexes = null;
      }
    }
  });


 /**
  * @class
  */
  var IndexMap = Class(MapReduce, {
    className: namespace + '.IndexMap',

    calcs: null,

    indexes: null,
    indexes_: null,

    timer_: undefined,
    indexUpdated: null,
    memberSourceMap: null,
    keyMap: null,

    map: function(item){
      return this.keyMap.get(item, true);
    },

    addMemberRef: function(member, sourceObject){
      this.memberSourceMap[member.eventObjectId] = sourceObject.eventObjectId;

      if (this.listen.member)
        member.addHandler(this.listen.member, this);

      this.sourceMap_[sourceObject.eventObjectId].updated = true;

      if (member.subscriberCount > 0)
        this.calcMember(member);
    },

    removeMemberRef: function(member, sourceObject){
      delete this.memberSourceMap[member.eventObjectId];

      if (this.listen.member)
        member.removeHandler(this.listen.member, this);
    },

    event_sourceChanged: function(dataset, oldSource){
      MapReduce.prototype.event_sourceChanged.call(this, dataset, oldSource);
      
      var index;

      for (var indexName in this.indexes_)
      {
        index = this.indexes_[indexName];
        if (oldSource)
        { 
          this.deleteIndex(indexName);
          oldSource.deleteIndex(this.indexes[indexName]);
        }

        if (this.source)
          this.addIndex(indexName, this.source.getIndex(index));
      }
    },

    listen: {
      index: {
        change: function(value){
          var indexMap = this.indexMap;

          indexMap.indexValues[this.key] = value;
          indexMap.indexUpdated = true;
          indexMap.recalcRequest();
        }
      },
      member: {
        subscribersChanged: function(object, oldCount){
          if (object.subscriberCount > 0 && oldCount == 0)
            this.calcMember(object);
        }
      }
    },

    ruleEvents: Class.oneFunctionProperty(
      function(sourceObject, delta){
        MapReduce.prototype.ruleEvents.update.call(this, sourceObject, delta);

        this.sourceMap_[sourceObject.eventObjectId].updated = true;
        this.recalcRequest();
      },
      {
        update: true
      }
    ),


    init: function(config){
      this.recalc = this.recalc.bind(this);

      this.indexUpdated = false;
      this.indexesBind_ = {};
      this.memberSourceMap = {};

      var indexes = this.indexes;
      this.indexes = {};
      this.indexes_ = {};

      this.calcs = this.calcs || {};
      this.indexValues = {};

      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(Object.complete({
          create: function(key, config){
            return new this.itemClass(config);
          }
        }, this.keyMap));

      MapReduce.prototype.init.call(this, config);

      Object.iterate(indexes, this.addIndex, this);
    },

    addIndex: function(key, index){
      if (!this.indexes[key])
      {
        if (index instanceof IndexConstructor)
        {
          if (!this.indexes_[key])
          {
            this.indexes_[key] = index;
            index = this.source && this.source.getIndex(index);
          }
          else
          {
            /** @cut */ if (typeof console != 'undefined') console.warn('Index `{0}` already exists'.format(key));
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
              listenHandler.change.call(this.indexesBind_[key], index.value);
          }
        }
        else
        {
          return; // warn
        }
      }
      /** @cut */else if (typeof console != 'undefined') console.warn('Index `{0}` already exists'.format(key));
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

    addCalc: function(name, calc){
      this.calcs[name] = calc;
      this.recalcRequest();
    },
    removeCalc: function(name){
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
        this.timer_ = setTimeout(this.recalc, 0);
    },

    recalc: function(){
      for (var idx in this.item_)
        this.calcMember(this.item_[idx]);

      this.indexUpdated = false;
      this.timer_ = clearTimeout(this.timer_);
    },

    calcMember: function(member){
      var sourceObject = this.sourceMap_[this.memberSourceMap[member.eventObjectId]];

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
      this.timer_ = clearTimeout(this.timer_);
      this.calcs = null;
      this.indexUpdated = null;
      this.memberSourceMap = null;
      this.indexesBind_ = null;

      this.keyMap.destroy();
      this.keyMap = null;

      for (var indexName in this.indexes)
        this.removeIndex(indexName);

      MapReduce.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    IndexConstructor: IndexConstructor,
    createIndexConstructor: createIndexConstructor,

    Index: Index,
    Count: Count,
    Sum: Sum,
    Avg: Avg,
    VectorIndex: VectorIndex,
    Min: Min,
    Max: Max,

    count: count,
    sum: sum,
    avg: avg,
    max: max,
    min: min,

    IndexMap: IndexMap
  });
