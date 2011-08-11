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

  var namespace = 'Basis.Data.Index';

  var Class = Basis.Class;
  
  var nsData = Basis.Data;
  var DataObject = nsData.DataObject;
  var Property = nsData.Property.Property;

  var AbstractDataset = nsData.AbstractDataset;

  //
  // IndexedDataset
  //

  debugger;

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
  // Indexes
  //

  var INDEX_CONTROLLER_DESTROY_HANDLER = {
    destroy: function(object){
      this.removeHandler(INDEX_CONTROLLER_DESTROY_HANDLER);
      delete indexControlCache[this.dataSourceObjectId];
    }
  }
  var indexControlCache = {};
  function getIndexController(dataSource){
    var objectId = dataSource.eventObjectId;
    var controller = indexControlCache[objectId];
    if (!controller)
    {
      controller = indexControlCache[objectId] = new IndexController({ dataSource: dataSource });
      controller.dataSourceObjectId = objectId;
      controller.addHandler(INDEX_CONTROLLER_DESTROY_HANDLER);
    }
    return controller;
  }

  var INDEX_ITEM_HANDLER = {
    update: function(object, delta){
      var newValue;
      var indexController = this.indexController;
      for (var j = 0, index; index = indexController.indexes[j]; j++)
      {
        newValue = index.valueGetter(this);
        index.upd(this, newValue, indexController.indexValueMap[this.eventObjectId][index.eventObjectId]);
        indexController.indexValueMap[this.eventObjectId][index.eventObjectId] = newValue;
      }
    }
  }

  var INDEX_CONTROLLER_DATASOURCE_HANDLER = {
    datasetChanged: function(object, delta){
      this.indexes.forEach(function(item){ item.lock() });
      
      if (delta.inserted)
      {
        for (var i = 0, item; item = delta.inserted[i]; i++)
        {
          item.addHandler(INDEX_ITEM_HANDLER, item);
          item.indexController = this;

          var newValue;
          this.indexValueMap[item.eventObjectId] = {};
          for (var j = 0, index; index = this.indexes[j]; j++)
          {
            newValue = index.valueGetter(item);
            this.indexValueMap[item.eventObjectId][index.eventObjectId] = newValue;
            index.add(item, newValue);
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, item; item = delta.deleted[i]; i++)
        {
          item.removeHandler(INDEX_ITEM_HANDLER, item);
          delete item.indexController;
          
          for (var j = 0, index; index = this.indexes[j]; j++)
            index.remove(item, this.indexValueMap[item.eventObjectId][index.eventObjectId]);

          delete this.indexValueMap[item.eventObjectId];
        }
      }

      this.indexes.forEach(function(item){ item.unlock() });       
    },
    destroy: function(){
      this.dataSource = null;
      this.destroy();
    }
  }

  var IndexController = Class(DataObject, {
    indexes: null,
    indexMap: null,
    init: function(config){
      this.indexes = [];
      this.indexValueMap = {};

      if (this.dataSource)
        this.dataSource.addHandler(INDEX_CONTROLLER_DATASOURCE_HANDLER, this);

      DataObject.prototype.init.call(this, config);
    },
    
    addIndex: function(index){
      this.indexes.push(index);

      if (this.dataSource.itemCount)
      {
        var newValue;
        var items = this.dataSource.getItems();
        
        index.lock()

        for (var i = 0, item; item = items[i]; i++)
        {
          newValue = index.valueGetter(item);

          if (!this.indexValueMap[item.eventObjectId])
            this.indexValueMap[item.eventObjectId] = {};

          this.indexValueMap[item.eventObjectId][index.eventObjectId] = newValue;
          index.add(item, newValue);
        }

        index.unlock();
      }
    },
    
    removeIndex: function(index){
      this.indexes.remove(index);
      if (!this.indexes.length)
      {
        this.destroy();
        return;
      }

      if (this.dataSource.itemCount)
      {          
        var items = this.dataSource.getItems();
        for (var i = 0, item; item = items[i]; i++)
          delete this.indexValueMap[item.eventObjectId][index.eventObjectId];
      }
    },

    destroy: function(){
      this.indexes = null;
      this.indexValueMap = null;

      if (this.dataSource)
      {
        this.dataSource.removeHandler(INDEX_CONTROLLER_DATASOURCE_HANDLER, this);
        this.dataSource = null;
      }

      DataObject.prototype.destroy.call(this);
    }
  });

  var Index = Class(Property, {
    extendConstructor_: true,

    valueGetter: Function.$null,
    
    add: Function.$undefined,
    remove: Function.$undefined,
    upd: Function.$undefined,

    init: function(config){
      Property.prototype.init.call(this, this.value || 0);

      if (this.dataSource){
        var dataSource = this.dataSource;
        this.dataSource = null;
        this.setDataSource(dataSource);
      }
    },

    setDataSource: function(dataSource){
      if (this.dataSource && this.dataSource != dataSource)
      {
        this.indexController.removeIndex(this);
        this.indexController = null;
        this.dataSource = null;
        this.reset();
      }

      if (dataSource && this.dataSource != dataSource)
      {
        this.dataSource = dataSource;
        this.indexController = getIndexController(dataSource);
        this.indexController.addIndex(this);
      }
    },

    destroy: function(){
      Property.prototype.destroy.call(this);

      this.indexController.removeIndex(this);
      this.indexController = null;
    }
  });

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

  var Avg = Class(Index, {
    init: function(config){
      this.sum = 0;
      this.count = 0;
      Index.prototype.init.call(this, config);
    },
    add: function(item, value){
      this.sum += value;
      this.count++;
      this.value = this.sum / this.count;
    },
    remove: function(item, value){
      this.sum -= value;
      this.count--;
      this.value = this.count ? this.sum/this.count : 0;
    },
    upd: function(item, newValue, oldValue){
      this.sum += newValue - oldValue;
      this.set(this.sum / this.count);
    }
  });

  var Count = Class(Index, {
    valueGetter: Function.$true,
    add: function(item, value){
      if (value)
        this.value++;
    },
    remove: function(item, value){
      if (value)
        this.value--;
    },
    upd: function(item, newValue, oldValue){
      if (newValue != oldValue)
        this.set(this.value + (newValue ? 1 : -1));
    }
  });

  var Max = Class(Index, {
    sortFunction: function(a, b) { return b-a },
    init: function(config){
      this.stack = [];
      Index.prototype.init.call(this, config);
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

  var Min = Class(Index, {
    init: function(config){
      this.stack = [];
      Index.prototype.init.call(this, config);
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
    Min: Min
  });

})();