/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.timer');
basis.require('basis.data');
basis.require('basis.data.dataset');
basis.require('basis.data.property');

!function(basis){

  'use strict';

 /**
  * @see ./demo/defile/data_index.html
  * @namespace basis.data.index
  */

  var namespace = 'basis.data.index';


  //
  // import names
  //

  var Class = basis.Class;
  
  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var KeyObjectMap = nsData.KeyObjectMap;
  var Property = nsData.property.Property;

  var AbstractDataset = nsData.AbstractDataset;
  var MapReduce = nsData.dataset.MapReduce;

  //
  // IndexedDataset
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
    * @type {function(object):any}
    */
    valueGetter: Function.$null,

   /**
    * @type {basis.data.AbstractDataset}
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
    * @param {basis.data.AbstractDataset} dataSource
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
    }

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
  var IndexSum = Class(Index, {
    className: namespace + '.Sum',
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
  var IndexAvg = Class(Index, {
    className: namespace + '.Avg',
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
  var IndexCount = Class(Index, {
    className: namespace + '.Count',
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
  var IndexMax = Class(Index, {
    className: namespace + '.Max',
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(binarySearchPos(this.stack, value), 0, value);
      this.value = this.stack[this.stack.length - 1];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[this.stack.length - 1];
    },
    upd: function(item, newValue, oldValue){
      //this.stack.remove(oldValue);
      this.stack.splice(binarySearchPos(this.stack, oldValue), 1);
      this.stack.splice(binarySearchPos(this.stack, newValue), 0, newValue);
      this.set(this.stack[this.stack.length - 1]);
    }
  });

 /**
  * @class
  */
  var IndexMin = Class(Index, {
    className: namespace + '.Min',
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(binarySearchPos(this.stack, value), 0, value);
      this.value = this.stack[0];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[0];
    },
    upd: function(item, newValue, oldValue){
      //this.stack.remove(oldValue);
      this.stack.splice(binarySearchPos(this.stack, oldValue), 1);
      this.stack.splice(binarySearchPos(this.stack, newValue), 0, newValue);
      this.set(this.stack[0]);
    }
  });

  var indexConstructorCache_= {};

  function IndexConstructor(getter, indexClass){
    getter = Function.getter(getter);

    var key = indexClass.indexClassId + '_' + getter.getterIdx_;
    var indexConstructor = indexConstructorCache_[key];

    if (!indexConstructor)
    {
      indexConstructor = indexConstructorCache_[key] = this;
      
      this.indexClass = indexClass;
      this.getter = getter;
      this.key = key;
      
      this.createInstance = function(dataset){
        if (dataset instanceof AbstractDataset)
        {
          var result = dataset.indexes && dataset.indexes[key];

          if (!result)
          {
            result = new indexClass(getter);
            result.addHandler(DATASET_INDEX_HANDLER, dataset);
            result.key = key;
          }

          return result;
        }
      }
    }

    return indexConstructor;
  }

  var indexClassId = 1;
  var createIndexConstructor = function(indexClass){
    indexClass.indexClassId = indexClassId++;
    return function(getter){
      return new IndexConstructor(getter, indexClass);
    }
  }

  var Sum   = createIndexConstructor(IndexSum);
  var Avg   = createIndexConstructor(IndexAvg);
  var Count = createIndexConstructor(IndexCount);
  var Min   = createIndexConstructor(IndexMin);
  var Max   = createIndexConstructor(IndexMax);



  /*AbstractDataset.prototype.createIndex = function(indexContructor){
    return new indexContructor.indexClass(indexContructor.getter, this);
  } */


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


  var INDEX_ITEM_UPDATE = function(object, delta){
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
  };

  var INDEX_ITEM_HANDLER = {
    update: INDEX_ITEM_UPDATE,
    datasetChanged: INDEX_ITEM_UPDATE
  };

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
    className: namespace + '.IndexMap',

    calcs: null,

    indexes: null,
    indexes_: null,

    timer_: undefined,
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
        update: function(sourceObject, delta){
          MapReduce.prototype.listen.sourceObject.update.call(this, sourceObject, delta);

          this.sourceMap_[sourceObject.eventObjectId].updated = true;
          this.fireUpdate();
        }
      },
      index: {
        change: function(value){
          var indexMap = this.indexMap;

          indexMap.indexValues[this.key] = value;
          indexMap.indexUpdated = true;
          indexMap.fireUpdate();
        }
      },
      member: {
        subscribersChanged: function(object, oldCount){
          if (object.subscriberCount > 0 && oldCount == 0)
            this.calcMember(object);
        }
      }
    },

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

    init: function(config){
      this.apply = this.apply.bind(this);

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
      this.fireUpdate();
    },
    removeCalc: function(name){
      delete this.calcs[name];
    },

    lock: function(){
      Object.values(this.indexes).forEach(function(idx){
        idx.lock();
      });
    },
    unlock: function(){
      Object.values(this.indexes).forEach(function(idx){
        idx.unlock();
      });
    },

    fireUpdate: function(){
      if (!this.timer_)
        this.timer_ = setTimeout(this.apply, 0);
    },

    apply: function(){
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
        this.removeIndexConstructor(indexName);

      MapReduce.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    IndexConstructor: IndexConstructor,
    Index: Index,
    Sum: Sum,
    Avg: Avg,
    Count: Count,
    Max: Max,
    Min: Min,
    IndexMap: IndexMap
  });

}(basis);