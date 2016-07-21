/** @cut */ var devWrap = require('basis.data').devWrap;
var Value = require('basis.data').Value;

/**
* Base class for indexes.
* @class
*/
var Index = Value.subclass({
  className: 'basis.data.index.Index',

  propertyDescriptors: {
    explicit: false,
    wrapperCount: false,
    updateEvents: false
  },

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


//
// Dataset integration
//

var datasetIndexes = {};

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

var DATASET_INDEX_HANDLER = {
  destroy: function(object){
    removeDatasetIndex(this, object);
  }
};

var DATASET_WITH_INDEX_HANDLER = {
  itemsChanged: function(object, delta){
    var array;

    // add handler to new source object
    if (array = delta.inserted)
      for (var i = 0; i < array.length; i++)
        array[i].addHandler(ITEM_INDEX_HANDLER, this);

    // remove handler from old source object
    if (array = delta.deleted)
      for (var i = 0; i < array.length; i++)
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

var ITEM_INDEX_HANDLER = {
  '*': function(event){
    var eventType = event.type;
    var object = event.sender;
    var objectId = object.basisObjectId;
    var indexes = datasetIndexes[this.basisObjectId];
    var oldValue;
    var newValue;
    var index;

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

/**
* @param {basis.data.ReadOnlyDataset} dataset
* @param {class} IndexClass Subclass of basis.data.index.Index
* @return {basis.data.index.Index} IndexClass instance
*/
function getDatasetIndex(dataset, IndexClass){
  if (!IndexClass || IndexClass.prototype instanceof Index === false)
    throw 'IndexClass must be an instance of IndexClass';

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

  var indexId = IndexClass.indexId;
  var index = indexes[indexId];

  if (!index)
  {
    index = new IndexClass();
    index.addHandler(DATASET_INDEX_HANDLER, dataset);

    /** @cut */ basis.dev.setInfo(index, 'sourceInfo', {
    /** @cut */   type: index.indexName,
    /** @cut */   source: dataset,
    /** @cut */   events: Object.keys(index.updateEvents),
    /** @cut */   transform: index.valueGetter
    /** @cut */ });

    indexes[indexId] = index;
    applyIndexDelta(index, dataset.getItems());
  }
  /** @cut */ else
  /** @cut */   index = devWrap(index);

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
    for (var index in indexes)
      return;

    // if no indexes - delete indexes storage and remove handlers
    dataset.removeHandler(DATASET_WITH_INDEX_HANDLER);
    DATASET_WITH_INDEX_HANDLER.itemsChanged.call(dataset, dataset, {
      deleted: dataset.getItems()
    });
    delete datasetIndexes[dataset.basisObjectId];
  }
};


//
// export
//

Index.getDatasetIndex = getDatasetIndex;
Index.removeDatasetIndex = removeDatasetIndex;

module.exports = Index;
