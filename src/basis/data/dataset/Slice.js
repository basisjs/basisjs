var $true = basis.fn.$true;
var values = basis.object.values;
var objectSlice = basis.object.slice;
var createEvent = require('basis.event').create;
var Value = require('basis.data').Value;
var createRuleEvents = require('./createRuleEvents.js');
var getDelta = require('./getDelta.js');
var SourceDataset = require('./SourceDataset.js');


function binarySearchPos(array, map){
  if (!array.length)  // empty array check
    return 0;

  var value = map.value;
  var id = map.object.basisObjectId;
  var cmpValue;
  var cmpId;
  var pos;
  var item;
  var l = 0;
  var r = array.length - 1;

  do
  {
    pos = (l + r) >> 1;

    item = array[pos];
    cmpValue = item.value;

    if (value < cmpValue)
      r = pos - 1;
    else
      if (value > cmpValue)
        l = pos + 1;
      else
      {
        // value == cmpValue, compare id's
        cmpId = item.object.basisObjectId;
        if (id < cmpId)
          r = pos - 1;
        else
          if (id > cmpId)
            l = pos + 1;
          else
            return pos;
      }
  }
  while (l <= r);

  return pos + (cmpValue == value ? cmpId < id : cmpValue < value);
}

var SLICE_SOURCEOBJECT_UPDATE = function(sourceObject){
  var sourceObjectInfo = this.sourceMap_[sourceObject.basisObjectId];
  var newValue = this.rule(sourceObject);
  var index = this.index_;

  if (newValue !== sourceObjectInfo.value)
  {
    var pos = binarySearchPos(index, sourceObjectInfo);
    var prev = index[pos - 1];
    var next = index[pos + 1];

    sourceObjectInfo.value = newValue;

    // update index only if neccessary
    if ((prev && (prev.value > newValue || (prev.value == newValue && prev.object.basisObjectId > sourceObjectInfo.object.basisObjectId))) ||
        (next && (next.value < newValue || (next.value == newValue && next.object.basisObjectId < sourceObjectInfo.object.basisObjectId))))
    {
      index.splice(pos, 1);
      index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
      this.applyRule();
    }
  }
};

function sliceIndexSort(a, b){
  return +(a.value > b.value) ||
         -(a.value < b.value) ||
          (a.object.basisObjectId - b.object.basisObjectId);
}

var SLICE_SOURCE_HANDLER = {
  itemsChanged: function(source, delta){
    var sourceMap = this.sourceMap_;
    var index = this.index_;
    var updateHandler = this.ruleEvents;
    var dropIndex = false;
    var buildIndex = false;
    var sourceObjectInfo;
    var inserted = delta.inserted;
    var deleted = delta.deleted;

    // delete comes first to reduce index size -> insert will be faster
    if (deleted)
    {
      // opitimization: if delete item count greater than items left -> rebuild index
      if (deleted.length > index.length - deleted.length)
      {
        dropIndex = true;
        buildIndex = deleted.length != index.length;
        index.length = 0;
      }

      for (var i = 0, sourceObject; sourceObject = deleted[i]; i++)
      {
        if (!dropIndex)
        {
          sourceObjectInfo = sourceMap[sourceObject.basisObjectId];
          index.splice(binarySearchPos(index, sourceObjectInfo), 1);
        }

        delete sourceMap[sourceObject.basisObjectId];

        if (updateHandler)
          sourceObject.removeHandler(updateHandler, this);
      }

      if (buildIndex)
        for (var key in sourceMap)
        {
          sourceObjectInfo = sourceMap[key];
          index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
        }
    }

    if (inserted)
    {
      // optimization: it makes webkit & gecko slower (depends on object count, up to 2x), but makes ie faster
      buildIndex = !index.length;

      for (var i = 0, sourceObject; sourceObject = inserted[i]; i++)
      {
        sourceObjectInfo = {
          object: sourceObject,
          value: this.rule(sourceObject)
        };
        sourceMap[sourceObject.basisObjectId] = sourceObjectInfo;

        if (!buildIndex)
          index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
        else
          index.push(sourceObjectInfo);

        if (updateHandler)
          sourceObject.addHandler(updateHandler, this);
      }

      if (buildIndex)
        index.sort(sliceIndexSort);
    }

    this.applyRule();
  }
};

/**
* @see ./demo/chart/range.html
* @class
*/
module.exports = SourceDataset.subclass({
  className: 'basis.data.dataset.Slice',

  propertyDescriptors: {
    limit: 'rangeChanged',
    offset: 'rangeChanged',
    orderDesc: 'ruleChanged',
    rule: 'ruleChanged'
  },

 /**
  * Ordering items function.
  * @type {function(basis.data.Object):*}
  * @readonly
  */
  rule: basis.getter($true),

 /**
  * Fires when rule is changed.
  * @param {function(item:basis.data.Object):*} oldRule
  * @param {boolean} oldOrderDesc
  * @event
  */
  emit_ruleChanged: createEvent('ruleChanged', 'oldRule', 'oldOrderDesc'),

 /**
  * Events list when dataset should recompute rule for source item.
  */
  ruleEvents: createRuleEvents(SLICE_SOURCEOBJECT_UPDATE, 'update'),

 /**
  * Calculated source object values
  * @type {Array.<basis.data.Dataset>}
  * @private
  */
  index_: null,

 /**
  * @type {object}
  */
  left_: null,

 /**
  * @type {object}
  */
  right_: null,

 /**
  * Direction of range.
  * @type {boolean}
  * @readonly
  */
  orderDesc: false,

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

 /**
  * @inheritDoc
  */
  listen: {
    source: SLICE_SOURCE_HANDLER
  },

 /**
  * @event
  */
  emit_rangeChanged: createEvent('rangeChanged', 'oldOffset', 'oldLimit'),

 /**
  * @config {function} index Function for index value calculation; values are ordering according to this values.
  * @config {number} offset Initial value of range start.
  * @config {number} limit Initial value of range length.
  * @constructor
  */
  init: function(){
    this.index_ = [];

    // inherit
    SourceDataset.prototype.init.call(this);
  },

 /**
  * Set new range for dataset.
  * @param {number} offset Start of range.
  * @param {number} limit Length of range.
  * @return {object|boolean} Delta of member changes.
  */
  setRange: function(offset, limit){
    var oldOffset = this.offset;
    var oldLimit = this.limit;
    var delta = false;

    if (oldOffset != offset || oldLimit != limit)
    {
      this.offset = offset;
      this.limit = limit;

      delta = this.applyRule();

      this.emit_rangeChanged(oldOffset, oldLimit);
    }

    return delta;
  },

 /**
  * Set new value for offset.
  * @param {number} offset
  * @return {object} Delta of member changes.
  */
  setOffset: function(offset){
    return this.setRange(offset, this.limit);
  },

 /**
  * Set new value for limit.
  * @param {number} limit
  * @return {object} Delta of member changes.
  */
  setLimit: function(limit){
    return this.setRange(this.offset, limit);
  },

 /**
  * Set new rule and order.
  * @param {function(item:basis.data.Object):*|string} rule
  * @param {boolean} orderDesc
  * @return {object} Delta of member changes.
  */
  setRule: function(rule, orderDesc){
    rule = basis.getter(rule || $true);
    orderDesc = !!orderDesc;

    if (this.rule != rule || this.orderDesc != orderDesc)
    {
      var oldRule = this.rule;
      var oldOrderDesc = this.orderDesc;

      // rebuild index only if rule changing
      if (this.rule != rule)
      {
        var index = this.index_;

        for (var i = 0; i < index.length; i++)
          index[i].value = rule(index[i].object);

        index.sort(sliceIndexSort);

        this.rule = rule;
      }

      // set new values
      this.orderDesc = orderDesc;
      this.rule = rule;
      this.emit_ruleChanged(oldRule, oldOrderDesc);

      return this.applyRule();
    }
  },

 /**
  * Recompute slice.
  * @return {Object} Delta of member changes.
  */
  applyRule: function(){
    var start = this.offset;
    var end = start + this.limit;

    if (this.orderDesc)
    {
      start = this.index_.length - end;
      end = start + this.limit;
    }

    var curSet = objectSlice(this.members_);
    var newSet = this.index_.slice(Math.max(0, start), Math.max(0, end));
    var inserted = [];
    var delta;

    for (var i = 0, item; item = newSet[i]; i++)
    {
      var objectId = item.object.basisObjectId;

      if (curSet[objectId])
        delete curSet[objectId];
      else
      {
        inserted.push(item.object);
        this.members_[objectId] = item.object;
      }
    }

    for (var objectId in curSet)
      delete this.members_[objectId];

    // update left tokens
    if (this.left_)
      for (var offset in this.left_)
      {
        var item = this.index_[this.orderDesc ? end + Number(offset) - 1 : start - Number(offset)];
        this.left_[offset].set(item ? item.object : null);
      }

    // update right tokens
    if (this.right_)
      for (var offset in this.right_)
      {
        var item = this.index_[this.orderDesc ? start - Number(offset) : end + Number(offset) - 1];
        this.right_[offset].set(item ? item.object : null);
      }

    // emit event if any delta
    if (delta = getDelta(inserted, values(curSet)))
      this.emit_itemsChanged(delta);

    return delta;
  },

 /**
  * Returns a Value that refer to [start + offset] item in slice (ordered vector).
  * @param {number} offset
  * @return {basis.data.Value}
  */
  left: function(offset){
    offset = parseInt(offset, 10) || 0;

    if (!this.left_)
      this.left_ = {};

    var value = this.left_[offset];
    if (!value)
    {
      var start = this.offset;
      var end = start + this.limit;

      if (this.orderDesc)
      {
        start = this.index_.length - end;
        end = start + this.limit;
      }

      var item = this.index_[this.orderDesc ? end + offset - 1 : start - offset];
      value = this.left_[offset] = new Value({
        value: item ? item.object : null
      });
    }

    return value;
  },

 /**
  * Returns a Value that refer to [start + offset] item in slice (ordered vector).
  * @param {number} offset
  * @return {basis.data.Value}
  */
  right: function(offset){
    offset = parseInt(offset, 10) || 0;

    if (!this.right_)
      this.right_ = {};

    var value = this.right_[offset];
    if (!value)
    {
      var start = this.offset;
      var end = start + this.limit;

      if (this.orderDesc)
      {
        start = this.index_.length - end;
        end = start + this.limit;
      }

      var item = this.index_[this.orderDesc ? start - offset : end + offset - 1];
      value = this.right_[offset] = new Value({
        value: item ? item.object : null
      });
    }

    return value;
  },

 /**
  * @inheritDoc
  */
  destroy: function(){
    // inherit
    SourceDataset.prototype.destroy.call(this);

    if (this.left_)
    {
      for (var offset in this.left_)
        this.left_[offset].destroy();
      this.left_ = null;
    }

    if (this.right_)
    {
      for (var offset in this.right_)
        this.right_[offset].destroy();
      this.right_ = null;
    }

    // destroy index
    this.index_ = null;
  }
});
