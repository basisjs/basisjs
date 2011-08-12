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
  // IndexController
  //

  var getIndexController = (function(){
    var cache = {};

    var INDEX_CONTROLLER_DESTROY_HANDLER = {
      destroy: function(object){
        object.removeHandler(INDEX_CONTROLLER_DESTROY_HANDLER);
        delete cache[this];
      }
    };

    return function(dataSource){
      var dataSourceId = dataSource.eventObjectId;
      var controller = cache[dataSourceId];

      if (!controller)
      {
        controller = cache[dataSourceId] = new IndexController({
          dataSource: dataSource
        });
        controller.addHandler(INDEX_CONTROLLER_DESTROY_HANDLER, dataSourceId);
      }

      return controller;
    }

  })();

  var INDEX_ITEM_HANDLER = {
    update: function(object, delta){
      var oldValue;
      var newValue;
      var objectId = object.eventObjectId;

      for (var i = 0, index; index = this.indexes[i++];)
      {
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

  var INDEX_CONTROLLER_DATASOURCE_HANDLER = {
    datasetChanged: function(object, delta){
      var object;
      var index;
      var objectId;
      var newValue;

      for (var j = 0; index = this.indexes[j++];)
        index.lock();
      
      if (delta.inserted)
        for (var i = 0; object = delta.inserted[i++];)
        {
          objectId = object.eventObjectId;
          object.addHandler(INDEX_ITEM_HANDLER, this);

          for (var j = 0; index = this.indexes[j++];)
          {
            newValue = index.valueGetter(object);
            index.indexCache_[objectId] = newValue;
            index.add(object, newValue);
          }
        }

      if (delta.deleted)
        for (var i = 0; object = delta.deleted[i++];)
        {
          objectId = object.eventObjectId;
          object.removeHandler(INDEX_ITEM_HANDLER, this);
          
          for (var j = 0, index; index = this.indexes[j++];)
          {
            index.remove(object, index.indexCache_[objectId]);
            delete index.indexCache_[objectId];
          }
        }

      for (var j = 0; index = this.indexes[j++];)
        index.unlock();
    },
    destroy: function(){
      this.destroy();
    }
  };

 /**
  * @class
  */
  var IndexController = Class(DataObject, {
    indexes: null,

    init: function(config){
      this.indexes = [];

      // always exists (add handlers to members)
      this.dataSource.addHandler(INDEX_CONTROLLER_DATASOURCE_HANDLER, this);
      INDEX_CONTROLLER_DATASOURCE_HANDLER.datasetChanged.call(this, this.dataSource, {
        inserted: this.dataSource.getItems()
      });

      // inherit
      DataObject.prototype.init.call(this, config);
    },
    
   /**
    * Add new index
    */
    add: function(index){
      this.indexes.add(index);

      if (this.dataSource.itemCount)
      {
        var newValue;
        var items = this.dataSource.getItems();
        
        index.lock();

        for (var i = 0, object; object = items[i]; i++)
        {
          newValue = index.valueGetter(object);
          index.indexCache_[object.eventObjectId] = newValue;
          index.add(object, newValue);
        }

        index.unlock();
      }
    },
    
   /**
    * Remove index
    */
    remove: function(index){
      if (this.indexes.remove(index))
      {
        // if there is no more indexes -> destroy
        if (!this.indexes.length)
          this.destroy();
      }
    },

    destroy: function(){
      // clear indexes
      var index;
      while (index = this.indexes.pop())
        index.setDataSource();  // drop dataSource for indexes

      // always exists (remove handlers from members)
      this.dataSource.removeHandler(INDEX_CONTROLLER_DATASOURCE_HANDLER, this);
      INDEX_CONTROLLER_DATASOURCE_HANDLER.datasetChanged.call(this, this.dataSource, {
        deleted: this.dataSource.getItems()
      });
      this.dataSource = null;

      // inherit
      DataObject.prototype.destroy.call(this);
    }
  });


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
    init: function(valueGetter, dataSource){
      Property.prototype.init.call(this, this.value || 0);

      this.valueGetter = Function.getter(valueGetter);

      if (dataSource)
        this.setDataSource(dataSource);
    },

   /**
    * Set data source
    * @param {Basis.Data.AbstractDataset} dataSource
    */
    setDataSource: function(dataSource){
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
    },

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
    destroy: function(){
      Property.prototype.destroy.call(this);

      // drop datasource
      this.setDataSource();
    }
  });

 /**
  * @class
  */
  var Sum = Class(Index, {
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
  var Avg = Class(Index, {
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
  var Count = Class(Index, {
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
  var Max = Class(Index, {
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(this.stack.binarySearchPos(value), 0, value);
      this.value = this.stack[this.stack.length - 1];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[this.stack.length - 1];
    },
    upd: function(item, newValue, oldValue){
      this.stack.remove(oldValue);
      this.stack.splice(this.stack.binarySearchPos(newValue), 0, newValue);
      this.set(this.stack[this.stack.length - 1]);
    }
  });

 /**
  * @class
  */
  var Min = Class(Index, {
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(this.stack.binarySearchPos(value), 0, value);
      this.value = this.stack[0];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[0];
    },
    upd: function(item, newValue, oldValue){
      this.stack.remove(oldValue);
      this.stack.splice(this.stack.binarySearchPos(newValue), 0, newValue);
      this.set(this.stack[0]);
    }
  });


 /**
  * @class
  */

  var IndexMap = Class(MapReduce, {
    calcs: null,
    indexes: null,
    timer_: null,
    indexUpdated: null,
    memberSourceMap: null,
    keyMap: null,

    event_sourceChanged: function(dataset, oldSource){
      MapReduce.prototype.event_sourceChanged.call(this, dataset, oldSource);
      
      for (var indexName in this.indexes)
        this.indexes[indexName].setDataSource(this.source);
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
        this.indexes[key] = index;
        this.indexValues[key] = index.value;
        this.indexesBind_[key] = {
          key: key,
          context: this
        };
        index.addHandler(this.listen.index, this.indexesBind_[key]);

        if (this.source)
          index.setDataSource(this.source);
      }
      /** @cut */else if (typeof console != 'undefined') console.warn('Index `{0}` already exists'.format(key));
    },

    removeIndex: function(key){
      if (this.indexes[key])
      {
        delete this.indexValues[key];
        this.indexes[key].removeHandler(this.listen.index, this.indexesBind_[key]);
        delete this.indexes[key];
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
        this.removeIndex(indexName);

      MapReduce.prototype.destroy.call(this);
    }
  });



  //
  // export names
  //

  Basis.namespace(namespace).extend({
    IndexedDataset: IndexedDataset,
    Index: Index,
    Sum: Sum,
    Avg: Avg,
    Count: Count,
    Max: Max,
    Min: Min,
    IndexMap: IndexMap
  });

})();