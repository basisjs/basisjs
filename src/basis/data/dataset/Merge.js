var arrayAdd = basis.array.add;
var arrayRemove = basis.array.remove;
var createEvent = require('basis.event').create;
var Emitter = require('basis.event').Emitter;
var resolveDataset = require('basis.data').resolveDataset;
var ReadOnlyDataset = require('basis.data').ReadOnlyDataset;
var getDelta = require('./getDelta.js');
var SUBSCRIPTION = require('../subscription.js');


SUBSCRIPTION.add(
  'SOURCES',
  {
    sourcesChanged: function(object, delta){
      var array;

      if (array = delta.inserted)
        for (var i = 0, item; item = array[i]; i++)
          SUBSCRIPTION.link('source', object, item);

      if (array = delta.deleted)
        for (var i = 0, item; item = array[i]; i++)
          SUBSCRIPTION.unlink('source', object, item);
    }
  },
  function(action, object){
    var sources = object.sources;

    for (var i = 0, source; source = sources[i++];)
      action('source', object, source);
  }
);

/**
* ANY source INCLUDE item (by default)
*/
var UNION = function(count){
  return count > 0;
};

/**
* ALL sources must INCLUDE item
*/
var INTERSECTION = function(count, sourceCount){
  return count == sourceCount;
};

/**
* ONLY ONE source INCLUDE item
*/
var DIFFERENCE = function(count){
  return count == 1;
};

/**
* MORE THAT ONE source INCLUDE item
* make sence for more than one source (if one source - no filter)
* for 2 sources it equal INTERSECTION
* for 3 and more sources it equivalent UNION / DIFFERENCE (subtract)
*/
var MORE_THAN_ONE_INCLUDE = function(count, sourceCount){
  return sourceCount == 1 || count > 1;
};

/**
* AT LEAST ONE source EXCLUDE item
* make sence for more than one source (if one source - no filter)
* for 2 sources it equal DIFFERENCE
* for 3 and more sources it equivalent UNION / INTERSECTION (subtract)
*/
var AT_LEAST_ONE_EXCLUDE = function(count, sourceCount){
  return sourceCount == 1 || count < sourceCount;
};


var MERGE_DATASET_HANDLER = {
  itemsChanged: function(source, delta){
    var memberMap = this.members_;
    var updated = {};

    var object;
    var objectId;

    if (delta.inserted)
    {
      for (var i = 0; object = delta.inserted[i]; i++)
      {
        objectId = object.basisObjectId;

        // check: is this object already known
        if (memberMap[objectId])
        {
          // item exists -> increase source links count
          memberMap[objectId].count++;
        }
        else
        {
          // register in source map
          memberMap[objectId] = {
            count: 1,
            presented: false,
            object: object
          };
        }

        // mark as updated
        updated[objectId] = memberMap[objectId];
      }
    }

    if (delta.deleted)
    {
      for (var i = 0; object = delta.deleted[i]; i++)
      {
        objectId = object.basisObjectId;

        // mark as updated
        updated[objectId] = memberMap[objectId];

        // decrease source counter
        memberMap[objectId].count--;
      }
    }

    // build delta and fire event
    this.applyRule(updated);
  }
};


/**
* @class
*/
var Merge = ReadOnlyDataset.subclass({
  className: 'basis.data.dataset.Merge',

  propertyDescriptors: {
    rule: 'ruleChanged'
  },

  active: basis.PROXY,
  subscribeTo: SUBSCRIPTION.SOURCES,

 /**
  * Fires when source set changed.
  * @param {object} delta Delta of changes. Must have property `inserted`
  * or `deleted`, or both of them. `inserted` property is array of new sources
  * and `deleted` property is array of removed sources.
  * @event
  */
  emit_sourcesChanged: createEvent('sourcesChanged', 'delta'),

 /**
  * @type {Array.<basis.data.ReadOnlyDataset>}
  */
  sources: null,

  sourceValues_: null,
  sourcesMap_: null,
  sourceDelta_: null,

 /**
  * @type {function(count:number, sourceCount:number):boolean}
  */
  rule: UNION,

 /**
  * Fires when rule is changed.
  * @param {function(count:number, sourceCount:number): boolean} oldRule
  * @event
  */
  emit_ruleChanged: createEvent('ruleChanged', 'oldRule'),

 /**
  * @inheritDoc
  */
  listen: {
    source: MERGE_DATASET_HANDLER,
    sourceValue: {
      destroy: function(sender){
        this.removeSource(sender);
      }
    }
  },

 /**
  * @config {Array.<basis.data.ReadOnlyDataset>} sources Set of source datasets for aggregate.
  * @constructor
  */
  init: function(){
    // inherit
    ReadOnlyDataset.prototype.init.call(this);

    // init part
    var sources = this.sources;

    this.sources = [];
    this.sourcesMap_ = {};
    this.sourceValues_ = [];

    if (sources)
      this.setSources(sources);
  },

 /**
  * Set new merge rule for dataset. Some types are available in basis.data.Dataset.Merge
  * @param {function(count:number, sourceCount:number):boolean|string} rule New rule.
  * @return {Object} Delta of member changes.
  */
  setRule: function(rule){
    rule = basis.getter(rule || UNION);

    if (this.rule !== rule)
    {
      var oldRule = this.rule;

      this.rule = rule;
      this.emit_ruleChanged(oldRule);

      return this.applyRule();
    }
  },

 /**
  * Check all members are they match to rule or not.
  * @param {Object=} scope Key map that will be checked. If not passed than all members
  * will be checked.
  * @return {Object} Delta of member changes.
  */
  applyRule: function(scope){
    var memberMap = this.members_;
    var rule = this.rule;
    var sourceCount = this.sources.length;
    var inserted = [];
    var deleted = [];
    var memberCounter;
    var isMember;
    var delta;

    if (!scope)
      scope = memberMap;

    for (var objectId in scope)
    {
      memberCounter = memberMap[objectId];
      isMember = sourceCount && memberCounter.count && rule(memberCounter.count, sourceCount);

      if (isMember != memberCounter.presented)
      {
        if (isMember)
        {
          // not in items -> insert
          memberCounter.presented = true;
          inserted.push(memberCounter.object);
        }
        else
        {
          // already in items -> delete
          memberCounter.presented = false;
          deleted.push(memberCounter.object);
        }
      }

      if (memberCounter.count == 0)
        delete memberMap[objectId];
    }

    // fire event if delta found
    if (delta = getDelta(inserted, deleted))
      this.emit_itemsChanged(delta);

    return delta;
  },

 /**
  * Adds new dataset.
  * @param {basis.data.ReadOnlyDataset=} dataset
  * @private
  */
  addDataset_: function(dataset){
    this.sources.push(dataset);
    // add event listeners to source
    if (this.listen.source)
      dataset.addHandler(this.listen.source, this);

    // process new dataset objects and update member map
    var memberMap = this.members_;
    for (var objectId in dataset.items_)
    {
      // check: is this object already known
      if (memberMap[objectId])
      {
        // item exists -> increase dataset links count
        memberMap[objectId].count++;
      }
      else
      {
        // add to source map
        memberMap[objectId] = {
          count: 1,
          presented: false,
          object: dataset.items_[objectId]
        };
      }
    }

    return true;
  },

 /**
  * Adds new dataset.
  * @param {basis.data.ReadOnlyDataset=} dataset
  * @private
  */
  removeDataset_: function(dataset){
    arrayRemove(this.sources, dataset);

    // remove event listeners from dataset
    if (this.listen.source)
      dataset.removeHandler(this.listen.source, this);

    // process removing dataset objects and update member map
    var memberMap = this.members_;
    for (var objectId in dataset.items_)
      memberMap[objectId].count--;
  },

 /**
  * Update dataset value by source.
  * @param {*} source
  * @private
  */
  updateDataset_: function(source){
    // this -> sourceInfo
    var merge = this.owner;
    var sourcesMap_ = merge.sourcesMap_;
    var dataset = resolveDataset(this, merge.updateDataset_, source, 'adapter', merge);
    var inserted;
    var deleted;
    var delta;

    if (this.dataset === dataset)
      return;

    if (dataset)
    {
      var count = (sourcesMap_[dataset.basisObjectId] || 0) + 1;
      sourcesMap_[dataset.basisObjectId] = count;
      if (count == 1)
      {
        merge.addDataset_(dataset);
        inserted = [dataset];
      }
    }

    if (this.dataset)
    {
      var count = (sourcesMap_[this.dataset.basisObjectId] || 0) - 1;
      sourcesMap_[this.dataset.basisObjectId] = count;
      if (count == 0)
      {
        merge.removeDataset_(this.dataset);
        deleted = [this.dataset];
      }
    }

    this.dataset = dataset;

    // build delta and fire event
    merge.applyRule();

    // fire sources changes event
    if (delta = getDelta(inserted, deleted))
    {
      var setSourcesTransaction = merge.sourceDelta_;
      if (setSourcesTransaction)
      {
        if (delta.inserted)
          delta.inserted.forEach(function(item){
            if (!arrayRemove(this.deleted, item))
              arrayAdd(this.inserted, item);
          }, setSourcesTransaction);

        if (delta.deleted)
          delta.deleted.forEach(function(item){
            if (!arrayRemove(this.inserted, item))
              arrayAdd(this.deleted, item);
          }, setSourcesTransaction);
      }
      else
      {
        merge.emit_sourcesChanged(delta);
      }
    }

    return delta;
  },

 /**
  * Returns array of source values.
  * @return {Array}
  */
  getSourceValues: function(){
    return this.sourceValues_.map(function(item){
      return item.source;
    });
  },

 /**
  * Add source from sources list.
  * @param {basis.data.ReadOnlyDataset|object|function()} source
  * @return {boolean} Returns true if new source added.
  */
  addSource: function(source){
    if (!source || (typeof source != 'object' && typeof source != 'function'))
    {
      /** @cut */ basis.dev.warn(this.constructor.className + '.addSource: value should be a dataset instance or to be able to resolve in dataset');
      return;
    }

    if (this.hasSource(source))
    {
      /** @cut */ basis.dev.warn(this.constructor.className + '.addSource: value is already in source list');
      return;
    }

    var sourceInfo = {
      owner: this,
      source: source,
      adapter: null,
      dataset: null
    };

    this.sourceValues_.push(sourceInfo);
    this.updateDataset_.call(sourceInfo, source);

    if (this.listen.sourceValue && source instanceof Emitter)
      source.addHandler(this.listen.sourceValue, this);
  },

 /**
  * Removes source from sources list.
  * @param {basis.data.ReadOnlyDataset|object|function()} source
  * @return {boolean} Returns true if source removed.
  */
  removeSource: function(source){
    for (var i = 0, sourceInfo; sourceInfo = this.sourceValues_[i]; i++)
      if (sourceInfo.source === source)
      {
        if (this.listen.sourceValue && source instanceof Emitter)
          source.removeHandler(this.listen.sourceValue, this);

        this.updateDataset_.call(sourceInfo, null);
        this.sourceValues_.splice(i, 1);
        return;
      }

    /** @cut */ basis.dev.warn(this.constructor.className + '.removeSource: source value isn\'t found in source list');
  },

 /**
  * Removes source from sources list.
  * @param {basis.data.ReadOnlyDataset|object|function()} source
  * @return {boolean} Returns true if source already added.
  */
  hasSource: function(source){
    for (var i = 0, sourceInfo; sourceInfo = this.sourceValues_[i]; i++)
      if (sourceInfo.source === source)
        return true;

    return false;
  },

 /**
  * Synchonize sources list according new list.
  * @param {Array.<basis.data.ReadOnlyDataset>} sources
  */
  setSources: function(sources){
    var exists = this.sourceValues_.map(function(sourceInfo){
      return sourceInfo.source;
    });
    var inserted = [];
    var deleted = [];
    var delta;

    if (!sources)
      sources = [];

    this.sourceDelta_ = {
      inserted: inserted,
      deleted: deleted
    };

    for (var i = 0; i < sources.length; i++)
    {
      var source = sources[i];
      if (!arrayRemove(exists, source))
        this.addSource(source);
    }

    exists.forEach(this.removeSource, this);

    this.sourceDelta_ = null;
    if (delta = getDelta(inserted, deleted))
      this.emit_sourcesChanged(delta);

    return delta;
  },

 /**
  * @inheritDoc
  */
  destroy: function(){
    this.setSources();

    ReadOnlyDataset.prototype.destroy.call(this);

    this.sourceValues_ = null;
    this.sourcesMap_ = null;
    this.sourceDelta_ = null;
    this.sources = null;
  }
});

Merge.UNION = UNION;
Merge.INTERSECTION = INTERSECTION;
Merge.DIFFERENCE = DIFFERENCE;
Merge.MORE_THAN_ONE_INCLUDE = MORE_THAN_ONE_INCLUDE;
Merge.AT_LEAST_ONE_EXCLUDE = AT_LEAST_ONE_EXCLUDE;

module.exports = Merge;
