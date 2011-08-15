/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

(function(){

  'use strict';

 /**
  * @namespace Basis.Data.Index
  */
  var namespace = 'Basis.Data.Index';

  var Class = Basis.Class;
  
  var nsData = Basis.Data;
  var DataObject = nsData.DataObject;
  var KeyObjectMap = nsData.KeyObjectMap;
  var Property = nsData.Property.Property;

  var AbstractDataset = nsData.AbstractDataset;
  var MapReduce = nsData.Dataset.MapReduce;

  //
  // IndexedDataset
  //

  function binarySearchPos_(array, value){ 
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


  function binarySearchPos(array, map){ 
    if (!array.length)  // empty array check
      return 0;

    var pos;
    var value;
    var cmpValue;
    var l = 0;
    var r = array.length - 1;

    do 
    {
      pos = (l + r) >> 1;

      cmpValue = array[pos].value || 0;
      if (cmpValue === value)
      {
        cmpValue = array[pos].object.eventObjectId;
        value = map.object.eventObjectId;
      }
      else
        value = map.value || 0;

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


  function rebuild(){
    var curSet = Object.slice(this.item_);
    var newSet = this.index_.slice(this.offset, this.offset + this.limit);
    var inserted = [];
    var delta;

    for (var i = 0, item; item = newSet[i]; i++)
    {
      var objectId = item.object.eventObjectId;
      if (curSet[objectId])
        delete curSet[objectId];
      else
        inserted.push(item.object);
    }

    if (delta = getDelta(inserted, values(curSet)))
      AggregateDataset.prototype.event_datasetChanged.call(this, this, delta);
  }

 /**
  * @class
  */
  var IndexedDataset = Class(AbstractDataset, {
    className: namespace + '.Index',

   /**
    * Ordering items function.
    * @type {function}
    * @readonly
    */
    valueGetter: Function.$true,

   /**
    *
    */
    index_: null,

   /**
    * Start of range.
    * @type {number}
    * @readonly
    */
    offset: 0,

   /**
    * Length of range.
    * @type {number}
    * @readonly
    */
    limit: 10,

    event_datasetChanged: function(dataset, delta){
      var array;

      if (array = delta.inserted)
        for (var i = 0; i < array.length; i++)
        {
          var object = array[i];
          var item = {
            value: this.valueGetter(object),
            object: object
          };
          var pos = binarySearchPos(this.index_, item);
          this.index_.splice(pos, 0, item);
        }

      if (array = delta.deleted)
        for (var i = 0; i < array.length; i++)
        {
          var object = array[i];
          var item = {
            value: this.valueGetter(object),
            object: object
          };
          var pos = binarySearchPos(this.index_, item);
          this.index_.splice(pos, 1);
        }

      rebuild.call(this);
    },

   /**
    * @config {function} index Function for index value calculation; values are ordering according to this values.
    * @config {number} offset Initial value of range start.
    * @config {number} limit Initial value of range length.
    * @constructor
    */
    init: function(config){
      this.index_ = [];

      // inherit
      AggregateDataset.prototype.init.call(this, config);
    },

   /**
    * Set new range for dataset.
    * @param {number} offset Start of range.
    * @param {number} limit Length of range.
    */
    setRange: function(offset, limit){
      this.offset =offset;
      this.limit = limit;

      rebuild.call(this);
    }
  });


  //
  // Index
  //

 /**
  * Base class for indexes.
  * @class
  */
  var Index = Class(Property, {
    autoDestroy: true,

   /**
    * @type {function(object):any}
    */
    valueGetter: Function.$null,

   /**
    * @type {Basis.Data.AbstractDataset}
    */
    dataSource: null,
    
   /**
    * @constructor
    */
    init: function(valueGetter){
      Property.prototype.init.call(this, this.value || 0);

      this.indexCache_ = {};
      this.valueGetter = valueGetter;
    },

   /**
    * Set data source
    * @param {Basis.Data.AbstractDataset} dataSource
    */
    /*setDataSource: function(dataSource){
      if (dataSource instanceof AbstractDataset == false)
        dataSource = null;

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;
        this.dataSource = dataSource;

        if (oldDataSource)
        {
          this.indexCache_ = null;
          getIndexController(oldDataSource).remove(this);
          this.reset();  // Q: should we avoid unnecessary updates?
        }

        if (dataSource)
        {
          this.indexCache_ = {};
          getIndexController(dataSource).add(this);
        }
        else
        {
          if (this.autoDestroy)
            this.destroy();
        }

        // data source changed event?
      }
    },*/

   /**
    * Add value to index
    */
    add: function(item, value){
    },
   /**
    * Remove value to index
    */
    remove: function(item, value){
    },

   /**
    * Change value
    */
    upd: function(item, newValue, oldValue){
    },

   /**
    * @destructor
    */
    /*destroy: function(){
      Property.prototype.destroy.call(this);

      // drop datasource
      this.setDataSource();
    }*/
  });

 /**
  * @class
  */
  Index.Sum = Class(Index, {
    className: 'Index.Sum',
    add: function(item, value){
      this.value += value;
    },
    remove: function(item, value){
      this.value -= value;
    },
    upd: function(item, newValue, oldValue){
      this.set(this.value + newValue - oldValue);
    }
  });

 /**
  * @class
  */
  Index.Avg = Class(Index, {
    className: 'Index.Avg',
    sum_: 0,
    count_: 0,

    add: function(item, value){
      this.sum_ += value;
      this.count_ += 1;
      this.value = this.sum_/this.count_;
    },
    remove: function(item, value){
      this.sum_ -= value;
      this.count_ -= 1;
      this.value = this.count_ ? this.sum_/this.count_ : 0;
    },
    upd: function(item, newValue, oldValue){
      this.sum_ += newValue - oldValue;
      this.set(this.sum_/this.count_);
    }
  });

 /**
  * @class
  */
  Index.Count = Class(Index, {
    valueGetter: Function.$true,
    add: function(item, value){
      if (value)
        this.value += 1;
    },
    remove: function(item, value){
      if (value)
        this.value -= 1;
    },
    upd: function(item, newValue, oldValue){
      this.set(this.value + (newValue ? 1 : -1));
    }
  });

 /**
  * @class
  */
  Index.Max = Class(Index, {
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(binarySearchPos_(this.stack, value), 0, value);
      this.value = this.stack[this.stack.length - 1];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[this.stack.length - 1];
    },
    upd: function(item, newValue, oldValue){
      //this.stack.remove(oldValue);
      this.stack.splice(binarySearchPos_(this.stack, oldValue), 1);
      this.stack.splice(binarySearchPos_(this.stack, newValue), 0, newValue);
      this.set(this.stack[this.stack.length - 1]);
    }
  });

 /**
  * @class
  */
  Index.Min = Class(Index, {
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(binarySearchPos_(this.stack, value), 0, value);
      this.value = this.stack[0];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[0];
    },
    upd: function(item, newValue, oldValue){
      //this.stack.remove(oldValue);
      this.stack.splice(binarySearchPos_(this.stack, oldValue), 1);
      this.stack.splice(binarySearchPos_(this.stack, newValue), 0, newValue);
      this.set(this.stack[0]);
    }
  });

  var indexConstructorCache_= {};

  function IndexConstructor(getter, indexType){
    getter = Function.getter(getter);

    var key = indexType + '_' + getter.getterIdx_;
    var indexConstructor = indexConstructorCache_[key];

    if (!indexConstructor)
    {
      indexConstructor = indexConstructorCache_[key] = this;
      
      this.indexType = indexType;
      this.indexClass = Index[indexType];
      this.getter = getter;
      this.key = key;
      this.createInstance = function(dataset){
        if (dataset instanceof AbstractDataset)
        {
          var result = dataset.indexes && dataset.indexes[this.key];

          if (!result)
          {
            result = new this.indexClass(this.getter);
            result.addHandler(DATASET_INDEX_HANDLER, dataset);
            result.key = this.key;
          }

          return result;
        }
      }
    }

    return indexConstructor;
  }

  var createIndexConstructor = function(indexType){
    return function(getter){
      return new IndexConstructor(getter, indexType);
    }
  }

  var Sum   = createIndexConstructor('Sum');
  var Avg   = createIndexConstructor('Avg');
  var Count = createIndexConstructor('Count');
  var Min   = createIndexConstructor('Min');
  var Max   = createIndexConstructor('Max');



  /*AbstractDataset.prototype.createIndex = function(indexContructor){
    return new indexContructor.indexClass(indexContructor.getter, this);
  } */


  var INDEX_ITEM_HANDLER = {
    update: function(object, delta){
      var oldValue;
      var newValue;
      var index;
      var objectId = object.eventObjectId;

      for (var i in this.indexes)
      {
        index = this.indexes[i];
        // fetch oldValue
        oldValue = index.indexCache_[objectId];

        // calc new value
        newValue = index.valueGetter(object);

        // update if value has changed
        if (newValue !== oldValue)
        {
          index.upd(object, newValue, oldValue);
          index.indexCache_[objectId] = newValue;
        }
      }
    }
  };

  function applyIndexDelta(index, inserted, deleted){
    var cache = index.indexCache_;
    index.lock();

    if (inserted)
      for (var i = 0, object; object = inserted[i++];)
      {
        var newValue = index.valueGetter(object);
        cache[object.eventObjectId] = newValue;
        index.add(object, newValue);
      }

    if (deleted)
      for (var i = 0, object; object = deleted[i++];)
      {
        index.remove(object, cache[object.eventObjectId]);
        delete cache[object.eventObjectId];
      }

    index.unlock();
  }

  var DATASET_WITH_INDEX_HANDLER = {
    datasetChanged: function(object, delta){
      // add handler to new source object
      if (delta.inserted)
        for (var i = 0, object; object = delta.inserted[i++];)
          object.addHandler(INDEX_ITEM_HANDLER, this);

      // remove handler from old source object
      if (delta.deleted)
        for (var i = 0, object; object = delta.deleted[i++];)
          object.removeHandler(INDEX_ITEM_HANDLER, this);

      // apply changes for indexes
      for (var j in this.indexes)
        applyIndexDelta(this.indexes[j], delta.inserted, delta.deleted);
    },
    
    destroy: function(){
      for (var i in this.indexes)
        this.indexes[i].destroy();
    }
  };

  var DATASET_INDEX_HANDLER = {
    destroy: function(object){
      this.removeIndex(object);
    }
  };

  AbstractDataset.prototype.createIndex = function(indexConstructor){
    if (indexConstructor instanceof IndexConstructor == false)
    {
      /** @cut */ if (typeof console != 'undefined') console.warn('indexConstructor must be an instance of IndexConstructor');
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

    var key = indexConstructor.key;
    if (!this.indexes[key])
    {
      var index = indexConstructor.createInstance(this);

      this.indexes[key] = index;

      applyIndexDelta(index, this.getItems());
    }

    return this.indexes[key]; 
  }

  AbstractDataset.prototype.removeIndex = function(index){
    if (this.indexes && this.indexes[index.key])
    {
      delete this.indexes[index.key];

      //index.removeHandler(DATASET_INDEX_HANDLER);
      index.destroy();

      for (var key in this.indexes)
        return;

      this.removeHandler(DATASET_WITH_INDEX_HANDLER);
      delete this.indexes;
    }
  }

 /**
  * @class
  */
  var IndexMap = Class(MapReduce, {
    calcs: null,

    indexes: null,
    indexes_: null,

    timer_: null,
    indexUpdated: null,
    memberSourceMap: null,
    keyMap: null,

    event_sourceChanged: function(dataset, oldSource){
      MapReduce.prototype.event_sourceChanged.call(this, dataset, oldSource);
      
      var index;
      for (var indexName in this.indexes_)
      {
        index = this.indexes_[indexName];
        if (oldSource)
        { 
          this.removeIndex(indexName);
          oldSource.removeIndex(this.indexes[indexName]);
        }

        if (this.source)
          this.addIndex(indexName, this.source.createIndex(index));
      }
    },

    listen: {
      sourceObject: {
        update: function(object, delta){
          MapReduce.prototype.listen.sourceObject.update.call(this, object, delta);

          this.stat.sourceObjectUpdate++;
          this.sourceMap_[object.eventObjectId].updated = true;
          this.fireUpdate();
        }
      },
      index: {
        change: function(value){
          this.context.indexValues[this.key] = value;
          this.context.stat.indexUpdate++;
          this.context.indexUpdated = true;
          this.context.fireUpdate();
        }
      },
      member: {
        subscribersChanged: function(object, oldCount){
          this.stat.subscribersChanged ++;
          if (object.subscriberCount > 0 && oldCount == 0)
          {
            this.stat.subscribersChangedSucc ++;
            this.calcMember(object);
          }
        }
      }
    },

    map: function(item){
      return this.keyMap.get(item, true);
    },

    addMemberRef: function(member, sourceObject){
      this.memberSourceMap[member.eventObjectId] = sourceObject.eventObjectId;
      member.addHandler(this.listen.member, this);

      this.sourceMap_[sourceObject.eventObjectId].updated = true;

      if (member.subscriberCount > 0)
        this.calcMember(member);
    },

    removeMemberRef: function(member, sourceObject){
      delete this.memberSourceMap[member.eventObjectId];
      member.removeHandler(this.listen.member, this);
    },

    init: function(config){
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

      this.stat = {
        applyCount: 0,
        indexUpdate: 0,
        tryCalcMember: 0,
        tryUpdateMember: 0,
        calcCount: 0,
        updateMember: 0,
        fireUpdate: 0,
        fireUpdateSucc: 0,
        subscribersChanged: 0,
        subscribersChangedSucc: 0,
        update: 0,
        sourceObjectUpdate: 0
      };

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
            index = this.source && this.source.createIndex(index);
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
            context: this
          };

          index.addHandler(this.listen.index, this.indexesBind_[key]);
          this.listen.index.change.call(this.indexesBind_[key], index.value);
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
        if (this.indexes[key])
          this.indexes[key].removeHandler(this.listen.index, this.indexesBind_[key]);

        delete this.indexValues[key];
        delete this.indexesBind_[key];
        delete this.indexes[key];
        delete this.indexes_[key];
      }
    },

    addCalc: function(name, calc){
      this.calcs[name] = calc;
      this.fireUpdate();
    },

    removeCalc: function(){
      delete this.calcs[name];
    },

    fireUpdate: function(){
      this.stat.fireUpdate++;
      if (!this.timer_)
      {
        this.stat.fireUpdateSucc++;
        this.timer_ = true;
        Basis.TimeEventManager.add(this, 'apply', Date.now());
      }
    },

    apply: function(){
      this.stat.applyCount++;
      for (var idx in this.item_)
        this.calcMember(this.item_[idx]);

      this.indexUpdated = false;
      this.timer_ = false;
    },

    calcMember: function(member){
      this.stat.tryCalcMember++;
      var sourceObject = this.sourceMap_[this.memberSourceMap[member.eventObjectId]];
      if (member.subscriberCount && (sourceObject.updated || this.indexUpdated))
      {
        this.stat.tryUpdateMember++;
        sourceObject.updated = false;

        var data = {};
        var newValue;
        var update;
        for (var calcName in this.calcs)
        {
          this.stat.calcCount++;
          newValue = this.calcs[calcName](sourceObject.sourceObject.data, this.indexValues);
          if (member.data[calcName] !== newValue && (!isNaN(newValue) || !isNaN(member.data[calcName])))
          {
            data[calcName] = newValue;
            update = true;
          }
        }
            
        if (update)  
        {
          this.stat.updateMember++;
          member.update(data);
        }
      }
    },  

    getMember: function(sourceObject){
      return this.keyMap.get(sourceObject, true);
    },

    destroy: function(){
      this.timer_ = null;
      this.calcs = null;
      this.indexUpdated = null;
      this.memberSourceMap = null;
      this.indexesBind_ = null;

      this.keyMap.destroy();
      this.keyMap = null;

      for (var indexName in this.indexes)
        this.removeIndexConstructor(indexName);

      MapReduce.prototype.destroy.call(this);
    }
  });



  //
  // export names
  //

  Basis.namespace(namespace).extend({
    IndexedDataset: IndexedDataset,
    IndexConstructor: IndexConstructor,
    Index: Index,
    Sum: Sum,
    Avg: Avg,
    Count: Count,
    Max: Max,
    Min: Min,
    IndexMap: IndexMap
  });

})();