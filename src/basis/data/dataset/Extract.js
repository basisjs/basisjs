var values = basis.object.values;
var $undef = basis.fn.$undef;
var arrayFrom = basis.array.from;
var createEvent = require('basis.event').create;
var DataObject = require('basis.data').Object;
var isEqual = require('basis.data').isEqual;
var ReadOnlyDataset = require('basis.data').ReadOnlyDataset;
var SourceDataset = require('./SourceDataset.js');
var createRuleEvents = require('./createRuleEvents.js');
var getDelta = require('./getDelta.js');


var EXTRACT_SOURCEOBJECT_UPDATE = function(sourceObject){
  var sourceObjectInfo = this.sourceMap_[sourceObject.basisObjectId];
  var newValue = this.rule(sourceObject) || null;
  var oldValue = sourceObjectInfo.value;
  var inserted;
  var deleted;
  var delta;

  if (isEqual(newValue, oldValue))
    return;

  if (newValue instanceof DataObject || newValue instanceof ReadOnlyDataset)
    inserted = addToExtract(this, newValue, sourceObject);

  if (oldValue)
    deleted = removeFromExtract(this, oldValue, sourceObject);

  // update value
  sourceObjectInfo.value = newValue;

  if (delta = getDelta(inserted, deleted))
    this.emit_itemsChanged(delta);
};

var EXTRACT_DATASET_ITEMSCHANGED = function(dataset, delta){
  var inserted = delta.inserted;
  var deleted = delta.deleted;
  var delta;

  if (inserted)
    inserted = addToExtract(this, inserted, dataset);

  if (deleted)
    deleted = removeFromExtract(this, deleted, dataset);

  if (delta = getDelta(inserted, deleted))
    this.emit_itemsChanged(delta);
};

var EXTRACT_DATASET_HANDLER = {
  itemsChanged: EXTRACT_DATASET_ITEMSCHANGED,
  destroy: function(dataset){
    var sourceMap = this.sourceMap_;

    // reset refences for destroyed dataset
    for (var cursor = sourceMap[dataset.basisObjectId]; cursor = cursor.ref;)
      sourceMap[cursor.object.basisObjectId].value = null;

    // make sure dataset be deleted from source map
    delete sourceMap[dataset.basisObjectId];
  }
};

function hasExtractSourceRef(extract, object, marker){
  var sourceObjectInfo = extract.sourceMap_[object.basisObjectId];

  if (sourceObjectInfo && sourceObjectInfo.visited !== marker)
  {
    // use two loops as more efficient way, if object has a source reference
    // going in deep is not required

    // search for source reference
    for (var cursor = sourceObjectInfo; cursor = cursor.ref;)
      if (cursor.object === extract.source)
        return true;

    // object has no source object, go in deep
    sourceObjectInfo.visited = marker; // mark object info by unique for search marker,
                                       // to not check object more than once

    // recursive search for source reference
    for (var cursor = sourceObjectInfo; cursor = cursor.ref;)
      if (hasExtractSourceRef(extract, cursor.object, marker || {}))
        return true;
  }
}

function addToExtract(extract, items, ref){
  var sourceMap = extract.sourceMap_;
  var members = extract.members_;
  var queue = arrayFrom(items);
  var inserted = [];

  for (var i = 0; i < queue.length; i++)
  {
    var item = queue[i];
    var sourceObjectId = item.basisObjectId;

    // if no sourceObjectId -> { object, ref }
    if (!sourceObjectId)
    {
      ref = item.ref;
      item = item.object;
      sourceObjectId = item.basisObjectId;
    }

    var sourceObjectInfo = sourceMap[sourceObjectId];
    if (sourceObjectInfo)
    {
      // if info exists just add reference
      sourceObjectInfo.ref = {
        object: ref,
        ref: sourceObjectInfo.ref
      };
    }
    else
    {
      // create new source object info
      sourceObjectInfo = sourceMap[sourceObjectId] = {
        source: item,
        ref: {
          object: ref,
          ref: null
        },
        visited: null, // used for source reference search
        value: null    // computed value
      };

      if (item instanceof DataObject)
      {
        var value = extract.rule(item) || null;

        if (value instanceof DataObject || value instanceof ReadOnlyDataset)
        {
          sourceObjectInfo.value = value;
          queue.push({
            object: value,
            ref: item
          });
        }

        members[sourceObjectId] = sourceObjectInfo;
        inserted.push(item);

        if (extract.ruleEvents)
          item.addHandler(extract.ruleEvents, extract);
      }
      else
      {
        // if not an object -> dataset
        item.addHandler(EXTRACT_DATASET_HANDLER, extract);

        for (var j = 0, datasetItems = item.getItems(); j < datasetItems.length; j++)
          queue.push({
            object: datasetItems[j],
            ref: item
          });
      }
    }
  }

  return inserted;
}

function removeFromExtract(extract, items, ref){
  var sourceMap = extract.sourceMap_;
  var members = extract.members_;
  var queue = arrayFrom(items);
  var deleted = [];

  for (var i = 0; i < queue.length; i++)
  {
    var item = queue[i];
    var sourceObjectId = item.basisObjectId;

    // if no sourceObjectId -> { object, ref }
    if (!sourceObjectId)
    {
      ref = item.ref;
      item = item.object;
      sourceObjectId = item.basisObjectId;
    }

    var sourceObjectInfo = sourceMap[sourceObjectId];
    var sourceObjectValue = sourceObjectInfo.value;

    // remove reference from object
    for (var cursor = sourceObjectInfo, prevCursor = sourceObjectInfo; cursor = cursor.ref;)
    {
      if (isEqual(cursor.object, ref))
      {
        prevCursor.ref = cursor.ref;
        break;
      }
      prevCursor = cursor;
    }

    if (!sourceObjectInfo.ref)
    {
      if (item instanceof DataObject)
      {
        delete members[sourceObjectId];
        deleted.push(item);

        if (extract.ruleEvents)
          item.removeHandler(extract.ruleEvents, extract);

        if (sourceObjectValue)
          queue.push({
            object: sourceObjectValue,
            ref: item
          });
      }
      else
      {
        // if not an object -> dataset
        item.removeHandler(EXTRACT_DATASET_HANDLER, extract);

        for (var j = 0, datasetItems = item.getItems(); j < datasetItems.length; j++)
          queue.push({
            object: datasetItems[j],
            ref: item
          });
      }

      delete sourceMap[sourceObjectId];
    }
    else
    {
      // happen for multiple references and cycles
      if (sourceObjectValue && !hasExtractSourceRef(extract, item))
      {
        sourceObjectInfo.value = null;
        queue.push({
          object: sourceObjectValue,
          ref: item
        });
      }
    }
  }

  return deleted;
}

/**
* @class
*/
module.exports = SourceDataset.subclass({
  className: 'basis.data.dataset.Extract',

  propertyDescriptors: {
    rule: 'ruleChanged'
  },

 /**
  * Nothing return by default. Behave like proxy.
  * @type {function(item:basis.data.Object):basis.data.Object|basis.data.ReadOnlyDataset}
  */
  rule: basis.getter($undef),

 /**
  * Fires when rule is changed.
  * @param {function(item:basis.data.Object):basis.data.Object|basis.data.ReadOnlyDataset} oldRule
  * @event
  */
  emit_ruleChanged: createEvent('ruleChanged', 'oldRule'),

 /**
  * Events list when dataset should recompute rule for source item.
  */
  ruleEvents: createRuleEvents(EXTRACT_SOURCEOBJECT_UPDATE, 'update'),

 /**
  * @inheritDoc
  */
  listen: {
    source: {
      itemsChanged: EXTRACT_DATASET_ITEMSCHANGED
    }
  },

 /**
  * Set new extract rule.
  * @param {function(basis.data.Object):boolean} rule
  * @return {Object} Delta of member changes.
  */
  setRule: function(rule){
    rule = basis.getter(rule || $undef);

    if (this.rule !== rule)
    {
      var oldRule = this.rule;

      this.rule = rule;
      this.emit_ruleChanged(oldRule);

      return this.applyRule();
    }
  },

 /**
  * Re-apply rule to members.
  * @return {Object} Delta of member changes.
  */
  applyRule: function(){
    var insertedMap = {};
    var deletedMap = {};
    var delta;

    for (var key in this.sourceMap_)
    {
      var sourceObjectInfo = this.sourceMap_[key];
      var sourceObject = sourceObjectInfo.source;

      if (sourceObject instanceof DataObject)
      {
        var newValue = this.rule(sourceObject) || null;
        var oldValue = sourceObjectInfo.value;

        if (isEqual(newValue, oldValue))
          continue;

        if (newValue instanceof DataObject || newValue instanceof ReadOnlyDataset)
        {
          var inserted = addToExtract(this, newValue, sourceObject);
          for (var i = 0; i < inserted.length; i++)
          {
            var item = inserted[i];
            var id = item.basisObjectId;
            if (deletedMap[id])
              delete deletedMap[id];
            else
              insertedMap[id] = item;
          }
        }


        if (oldValue)
        {
          var deleted = removeFromExtract(this, oldValue, sourceObject);
          for (var i = 0; i < deleted.length; i++)
          {
            var item = deleted[i];
            var id = item.basisObjectId;
            if (insertedMap[id])
              delete insertedMap[id];
            else
              deletedMap[id] = item;
          }
        }

        // update value
        sourceObjectInfo.value = newValue;
      }
    }

    if (delta = getDelta(values(insertedMap), values(deletedMap)))
      this.emit_itemsChanged(delta);

    return delta;
  }
});
