
 /**
  * Namespace overview:
  * - Classes:
  *   {basis.data.dataset.Merge},
  *   {basis.data.dataset.Subtract},
  *   {basis.data.dataset.SourceDataset},
  *   {basis.data.dataset.MapFilter},
  *   {basis.data.dataset.Filter},
  *   {basis.data.dataset.Split},
  *   {basis.data.dataset.Slice}
  *   {basis.data.dataset.Cloud},
  *   {basis.data.dataset.Extract}
  *
  * @see ./demo/defile/dataset.html
  *
  * @namespace basis.data.dataset
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var oneFunctionProperty = Class.oneFunctionProperty;

  var extend = basis.object.extend;
  var values = basis.object.values;
  var objectSlice = basis.object.slice;
  var arrayAdd = basis.array.add;
  var arrayRemove = basis.array.remove;
  var getter = basis.getter;
  var $self = basis.fn.$self;
  var $true = basis.fn.$true;
  var $false = basis.fn.$false;
  var $undef = basis.fn.$undef;
  var arrayFrom = basis.array.from;

  var basisEvent = require('basis.event');
  var createEvent = basisEvent.create;
  var createEventHandler = basisEvent.createHandler;
  var Emitter = basisEvent.Emitter;

  var basisData = require('basis.data');
  var SUBSCRIPTION = basisData.SUBSCRIPTION;
  var Value = basisData.Value;
  var DataObject = basisData.Object;
  var KeyObjectMap = basisData.KeyObjectMap;
  var ReadOnlyDataset = basisData.ReadOnlyDataset;
  var Dataset = basisData.Dataset;
  var DatasetWrapper = basisData.DatasetWrapper;
  var resolveDataset = basisData.resolveDataset;
  var setAccumulateState = Dataset.setAccumulateState;


  //
  // New subscription types
  //

  SUBSCRIPTION.add(
    'SOURCE',
    {
      sourceChanged: function(object, oldSource){
        if (oldSource)
          SUBSCRIPTION.unlink('source', object, oldSource);
        if (object.source)
          SUBSCRIPTION.link('source', object, object.source);
      },
      sourcesChanged: function(object, delta){
        var array;

        if (array = delta.inserted)
          for (var i = 0, item; item = array[i]; i++)
            SUBSCRIPTION.link('source', object, array[i]);

        if (array = delta.deleted)
          for (var i = 0, item; item = array[i]; i++)
            SUBSCRIPTION.unlink('source', object, array[i]);
      }
    },
    function(action, object){
      var sources = object.sources || (object.source ? [object.source] : []);

      for (var i = 0, source; source = sources[i++];)
        action('source', object, source);
    }
  );

  SUBSCRIPTION.addProperty('minuend');
  SUBSCRIPTION.addProperty('subtrahend');


 /**
  * Returns delta object
  * @param {Array.<basis.data.Object>} inserted
  * @param {Array.<basis.data.Object>} deleted
  * @return {object|boolean}
  */
  function getDelta(inserted, deleted){
    var delta = {};
    var result;

    if (inserted && inserted.length)
      result = delta.inserted = inserted;

    if (deleted && deleted.length)
      result = delta.deleted = deleted;

    if (result)
      return delta;
  }

 /**
  * Create ruleEvents property.
  * @param {function(sender, ..args)} fn
  * @param {string|Array.<string>} events
  */
  function createRuleEvents(fn, events){
    return (function createRuleEventsExtend(events){
      if (!events)
        return null;

      if (events.__extend__)
        return events;

      if (typeof events != 'string' && !Array.isArray(events))
        events = null;

      return extend(createEventHandler(events, fn), {
        __extend__: createRuleEventsExtend
      });
    })(events);
  }

 /**
  *
  */
  function createKeyMap(config, keyGetter, ItemClass, SubsetClass){
    return new KeyObjectMap(extend({
      keyGetter: keyGetter,
      itemClass: ItemClass,
      create: function(key, object){
        var datasetWrapper = KeyObjectMap.prototype.create.call(this, key, object);
        datasetWrapper.ruleValue = key;
        datasetWrapper.setDataset(new SubsetClass({
          ruleValue: key
        }));
        return datasetWrapper;
      }
    }, config));
  }

  //
  // Merge dataset
  //

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
  var Merge = Class(ReadOnlyDataset, {
    className: namespace + '.Merge',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.SOURCE,

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
    rule: function(count, sourceCount){
      return count > 0;
    },

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
      rule = getter(rule || Merge.UNION);

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

        if (isMember != objectId in this.items_)
        {
          if (isMember)
            // not in items -> insert
            inserted.push(memberCounter.object);
          else
            // already in items -> delete
            deleted.push(memberCounter.object);
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

      // inherit
      ReadOnlyDataset.prototype.destroy.call(this);

      this.sourceValues_ = null;
      this.sourcesMap_ = null;
      this.sourceDelta_ = null;
      this.sources = null;
    }
  });

 /**
  * ANY source INCLUDE item
  * (by default)
  */
  Merge.UNION = Merge.prototype.rule;

 /**
  * ALL sources must INCLUDE item
  */
  Merge.INTERSECTION = function(count, sourceCount){
    return count == sourceCount;
  };

 /**
  * ONLY ONE source INCLUDE item
  */
  Merge.DIFFERENCE = function(count, sourceCount){
    return count == 1;
  };

 /**
  * MORE THAT ONE source INCLUDE item
  * make sence for more than one source (if one source - no filter)
  * for 2 sources it equal INTERSECTION
  * for 3 and more sources it equivalent UNION / DIFFERENCE (subtract)
  */
  Merge.MORE_THAN_ONE_INCLUDE = function(count, sourceCount){
    return sourceCount == 1 || count > 1;
  };

 /**
  * AT LEAST ONE source EXCLUDE item
  * make sence for more than one source (if one source - no filter)
  * for 2 sources it equal DIFFERENCE
  * for 3 and more sources it equivalent UNION / INTERSECTION (subtract)
  */
  Merge.AT_LEAST_ONE_EXCLUDE = function(count, sourceCount){
    return sourceCount == 1 || count < sourceCount;
  };


  //
  // Subtract
  //

  var datasetAbsentFilter = function(item){
    return !this.has(item);
  };

  var SUBTRACTDATASET_MINUEND_HANDLER = {
    itemsChanged: function(dataset, delta){
      if (!this.subtrahend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.inserted && delta.inserted.filter(datasetAbsentFilter, this.subtrahend),
        /* deleted */  delta.deleted  && delta.deleted.filter(this.has, this)
      );

      if (newDelta)
        this.emit_itemsChanged(newDelta);
    },
    destroy: function(){
      if (!this.minuendRA_)
        this.setMinuend(null);
    }
  };

  var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
    itemsChanged: function(dataset, delta){
      if (!this.minuend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.deleted  && delta.deleted.filter(this.minuend.has, this.minuend),
        /* deleted */  delta.inserted && delta.inserted.filter(this.has, this)
      );

      if (newDelta)
        this.emit_itemsChanged(newDelta);
    },
    destroy: function(){
      if (!this.subtrahendRA_)
        this.setSubtrahend(null);
    }
  };


 /**
  * @class
  */
  var Subtract = Class(ReadOnlyDataset, {
    className: namespace + '.Subtract',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.MINUEND + SUBSCRIPTION.SUBTRAHEND,

   /**
    * @type {basis.data.ReadOnlyDataset}
    */
    minuend: null,

   /**
    * Minuend wrapper
    * @type {basis.data.ResolveAdapter}
    */
    minuendRA_: null,

   /**
    * Fires when minuend changed.
    * @param {basis.data.ReadOnlyDataset} oldMinuend Value of {basis.data.dataset.Subtract#minuend} before changes.
    * @event
    */
    emit_minuendChanged: createEvent('minuendChanged', 'oldMinuend'),

   /**
    * @type {basis.data.ReadOnlyDataset}
    */
    subtrahend: null,

   /**
    * Subtrahend wrapper
    * @type {basis.data.ResolveAdapter}
    */
    subtrahendRA_: null,

   /**
    * Fires when subtrahend changed.
    * @param {basis.data.ReadOnlyDataset} oldSubtrahend Value of {basis.data.dataset.Subtract#subtrahend} before changes.
    * @event
    */
    emit_subtrahendChanged: createEvent('subtrahendChanged', 'oldSubtrahend'),

   /**
    * @inheritDoc
    */
    listen: {
      minuend: SUBTRACTDATASET_MINUEND_HANDLER,
      subtrahend: SUBTRACTDATASET_SUBTRAHEND_HANDLER
    },

   /**
    * @constructor
    */
    init: function(){
      // inherit
      ReadOnlyDataset.prototype.init.call(this);

      // init part
      var minuend = this.minuend;
      var subtrahend = this.subtrahend;

      this.minuend = null;
      this.subtrahend = null;

      if (minuend || subtrahend)
        this.setOperands(minuend, subtrahend);
    },

   /**
    * Set new minuend & subtrahend.
    * @param {basis.data.ReadOnlyDataset=} minuend
    * @param {basis.data.ReadOnlyDataset=} subtrahend
    * @return {object|boolean} Delta if changes happend
    */
    setOperands: function(minuend, subtrahend){
      var delta;
      var operandsChanged = false;

      minuend = resolveDataset(this, this.setMinuend, minuend, 'minuendRA_');
      subtrahend = resolveDataset(this, this.setSubtrahend, subtrahend, 'subtrahendRA_');

      var oldMinuend = this.minuend;
      var oldSubtrahend = this.subtrahend;

      // set new minuend if changed
      if (oldMinuend !== minuend)
      {
        operandsChanged = true;
        this.minuend = minuend;

        var listenHandler = this.listen.minuend;
        if (listenHandler)
        {
          if (oldMinuend)
            oldMinuend.removeHandler(listenHandler, this);

          if (minuend)
            minuend.addHandler(listenHandler, this);
        }

        this.emit_minuendChanged(oldMinuend);
      }

      // set new subtrahend if changed
      if (oldSubtrahend !== subtrahend)
      {
        operandsChanged = true;
        this.subtrahend = subtrahend;

        var listenHandler = this.listen.subtrahend;
        if (listenHandler)
        {
          if (oldSubtrahend)
            oldSubtrahend.removeHandler(listenHandler, this);

          if (subtrahend)
            subtrahend.addHandler(listenHandler, this);
        }

        this.emit_subtrahendChanged(oldSubtrahend);
      }

      if (!operandsChanged)
        return false;

      // apply changes
      if (!minuend || !subtrahend)
      {
        if (this.itemCount)
          this.emit_itemsChanged(delta = {
            deleted: this.getItems()
          });
      }
      else
      {
        var deleted = [];
        var inserted = [];

        for (var key in this.items_)
          if (!minuend.items_[key] || subtrahend.items_[key])
            deleted.push(this.items_[key]);

        for (var key in minuend.items_)
          if (!this.items_[key] && !subtrahend.items_[key])
            inserted.push(minuend.items_[key]);

        if (delta = getDelta(inserted, deleted))
          this.emit_itemsChanged(delta);
      }

      return delta;
    },

   /**
    * @param {basis.data.ReadOnlyDataset} minuend
    * @return {Object} Delta if changes happend
    */
    setMinuend: function(minuend){
      return this.setOperands(
        minuend,
        this.subtrahendRA_ ? this.subtrahendRA_.source : this.subtrahend
      );
    },

   /**
    * @param {basis.data.ReadOnlyDataset} subtrahend
    * @return {Object} Delta if changes happend
    */
    setSubtrahend: function(subtrahend){
      return this.setOperands(
        this.minuendRA_ ? this.minuendRA_.source : this.minuend,
        subtrahend
      );
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.setOperands();

      ReadOnlyDataset.prototype.destroy.call(this);
    }
  });


  //
  // Source dataset mixin
  //

 /**
  * @class
  */
  var SourceDataset = Class(ReadOnlyDataset, {
    className: namespace + '.SourceDataset',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.SOURCE,

   /**
    * Data source.
    * @type {basis.data.ReadOnlyDataset}
    */
    source: null,

   /**
    * Fires when source changed.
    * @param {basis.data.ReadOnlyDataset} oldSource Previous value for source property.
    * @event
    */
    emit_sourceChanged: createEvent('sourceChanged', 'oldSource'),

   /**
    * Source wrapper
    * @type {basis.data.ResolveAdapter}
    */
    sourceRA_: null,

   /**
    * Map of source objects.
    * @type {object}
    * @private
    */
    sourceMap_: null,

   /**
    * @inheritDoc
    */
    listen: {
      source: {
        destroy: function(){
          if (!this.sourceRA_)
            this.setSource();
        }
      }
    },

   /**
    * @constructor
    */
    init: function(){
      this.sourceMap_ = {};

      ReadOnlyDataset.prototype.init.call(this);

      var source = this.source;
      if (source)
      {
        this.source = null;
        this.setSource(source);
      }
    },

   /**
    * Set new source dataset.
    * @param {basis.data.ReadOnlyDataset} source
    */
    setSource: function(source){
      source = resolveDataset(this, this.setSource, source, 'sourceRA_');

      // sync with source
      if (this.source !== source)
      {
        var oldSource = this.source;
        var listenHandler = this.listen.source;

        this.source = source;

        if (listenHandler)
        {
          var itemsChangedHandler = listenHandler.itemsChanged;
          setAccumulateState(true);

          if (oldSource)
          {
            oldSource.removeHandler(listenHandler, this);

            if (itemsChangedHandler)
              itemsChangedHandler.call(this, oldSource, {
                deleted: oldSource.getItems()
              });
          }

          if (source)
          {
            source.addHandler(listenHandler, this);

            if (itemsChangedHandler)
              itemsChangedHandler.call(this, source, {
                inserted: source.getItems()
              });
          }
          setAccumulateState(false);
        }

        this.emit_sourceChanged(oldSource);
      }
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.setSource();

      // inherit
      ReadOnlyDataset.prototype.destroy.call(this);

      this.sourceMap_ = null;
    }
  });


  //
  // MapFilter
  //

  var MAPFILTER_SOURCEOBJECT_UPDATE = function(sourceObject){
    var newMember = this.map ? this.map(sourceObject) : sourceObject; // fetch new member ref

    if (newMember instanceof DataObject == false || this.filter(newMember))
      newMember = null;

    var sourceMap = this.sourceMap_[sourceObject.basisObjectId];
    var curMember = sourceMap.member;

    // if member ref is changed
    if (curMember !== newMember)
    {
      var memberMap = this.members_;
      var delta;
      var inserted;
      var deleted;

      // update member
      sourceMap.member = newMember;

      // if here is ref for member already
      if (curMember)
      {
        var curMemberId = curMember.basisObjectId;

        // call callback on member ref add
        if (this.removeMemberRef)
          this.removeMemberRef(curMember, sourceObject);

        // decrease ref count, and check is this ref for member last
        if (--memberMap[curMemberId] == 0)
        {
          // last ref for member

          // delete from map
          delete memberMap[curMemberId];

          // add to delta
          deleted = [curMember];
        }
      }

      // if new member exists, update map
      if (newMember)
      {
        var newMemberId = newMember.basisObjectId;

        // call callback on member ref add
        if (this.addMemberRef)
          this.addMemberRef(newMember, sourceObject);

        if (memberMap[newMemberId])
        {
          // member is already in map -> increase ref count
          memberMap[newMemberId]++;
        }
        else
        {
          // add to map
          memberMap[newMemberId] = 1;

          // add to delta
          inserted = [newMember];
        }
      }

      // fire event, if any delta
      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);
    }
  };

  var MAPFILTER_SOURCE_HANDLER = {
    itemsChanged: function(source, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.members_;
      var inserted = [];
      var deleted = [];
      var sourceObject;
      var sourceObjectId;
      var member;
      var updateHandler = this.ruleEvents;

      setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          member = this.map ? this.map(sourceObject) : sourceObject;

          if (member instanceof DataObject == false || this.filter(member))
            member = null;

          if (updateHandler)
            sourceObject.addHandler(updateHandler, this);

          sourceMap[sourceObject.basisObjectId] = {
            sourceObject: sourceObject,
            member: member
          };

          if (member)
          {
            var memberId = member.basisObjectId;
            if (memberMap[memberId])
            {
              memberMap[memberId]++;
            }
            else
            {
              memberMap[memberId] = 1;
              inserted.push(member);
            }

            if (this.addMemberRef)
              this.addMemberRef(member, sourceObject);
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0; sourceObject = delta.deleted[i]; i++)
        {
          sourceObjectId = sourceObject.basisObjectId;
          member = sourceMap[sourceObjectId].member;

          if (updateHandler)
            sourceObject.removeHandler(updateHandler, this);

          delete sourceMap[sourceObjectId];

          if (member)
          {
            var memberId = member.basisObjectId;
            if (--memberMap[memberId] == 0)
            {
              delete memberMap[memberId];
              deleted.push(member);
            }

            if (this.removeMemberRef)
              this.removeMemberRef(member, sourceObject);
          }
        }
      }

      setAccumulateState(false);

      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);
    }
  };

 /**
  * @class
  */
  var MapFilter = Class(SourceDataset, {
    className: namespace + '.MapFilter',

   /**
    * Map function for source object, to get member object.
    * @type {function(basis.data.Object):basis.data.Object}
    * @readonly
    */
    map: $self,

   /**
    * Filter function. It should return false, than result of map function
    * become a member.
    * @type {function(basis.data.Object):boolean}
    * @readonly
    */
    filter: $false,

   /**
    * Helper function.
    * @type {function(basis.data.Object):*}
    */
    rule: getter($true),

   /**
    * Fires when rule is changed.
    * @param {function(basis.data.Object):*} oldRule
    * @event
    */
    emit_ruleChanged: createEvent('ruleChanged', 'oldRule'),

   /**
    * Events list when dataset should recompute rule for source item.
    */
    ruleEvents: createRuleEvents(MAPFILTER_SOURCEOBJECT_UPDATE, 'update'),

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.Object, basis.data.Object)}
    * @readonly
    */
    addMemberRef: null,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.Object, basis.data.Object)}
    * @readonly
    */
    removeMemberRef: null,

   /**
    * @inheritDoc
    */
    listen: {
      source: MAPFILTER_SOURCE_HANDLER
    },

    // no special init

   /**
    * Set new transform function and apply new function to source objects.
    * @param {function(basis.data.Object):basis.data.Object} map
    */
    setMap: function(map){
      if (typeof map != 'function')
        map = $self;

      if (this.map !== map)
      {
        this.map = map;
        return this.applyRule();
      }
    },

   /**
    * Set new filter function and apply new function to source objects.
    * @param {function(basis.data.Object):boolean} filter
    */
    setFilter: function(filter){
      if (typeof filter != 'function')
        filter = $false;

      if (this.filter !== filter)
      {
        this.filter = filter;
        return this.applyRule();
      }
    },

   /**
    * Set new filter function.
    * @param {function(item:basis.data.Object):*|string} rule
    * @return {Object} Delta of member changes.
    */
    setRule: function(rule){
      rule = getter(rule || $true);

      if (this.rule !== rule)
      {
        var oldRule = this.rule;

        this.rule = rule;
        this.emit_ruleChanged(oldRule);

        return this.applyRule();
      }
    },

   /**
    * Apply transform for all source objects and rebuild member set.
    * @return {Object} Delta of member changes.
    */
    applyRule: function(){
      var sourceMap = this.sourceMap_;
      var memberMap = this.members_;
      var curMember;
      var newMember;
      var curMemberId;
      var newMemberId;
      var sourceObject;
      var sourceObjectInfo;
      var inserted = [];
      var deleted = [];
      var delta;

      for (var sourceObjectId in sourceMap)
      {
        sourceObjectInfo = sourceMap[sourceObjectId];
        sourceObject = sourceObjectInfo.sourceObject;

        curMember = sourceObjectInfo.member;
        newMember = this.map ? this.map(sourceObject) : sourceObject;

        if (newMember instanceof DataObject == false || this.filter(newMember))
          newMember = null;

        if (curMember != newMember)
        {
          sourceObjectInfo.member = newMember;

          // if here is ref for member already
          if (curMember)
          {
            curMemberId = curMember.basisObjectId;

            // call callback on member ref add
            if (this.removeMemberRef)
              this.removeMemberRef(curMember, sourceObject);

            // decrease ref count
            memberMap[curMemberId]--;
          }

          // if new member exists, update map
          if (newMember)
          {
            newMemberId = newMember.basisObjectId;

            // call callback on member ref add
            if (this.addMemberRef)
              this.addMemberRef(newMember, sourceObject);

            if (newMemberId in memberMap)
            {
              // member is already in map -> increase ref count
              memberMap[newMemberId]++;
            }
            else
            {
              // add to map
              memberMap[newMemberId] = 1;

              // add to delta
              inserted.push(newMember);
            }
          }
        }
      }

      // get deleted delta
      for (curMemberId in this.items_)
        if (memberMap[curMemberId] == 0)
        {
          delete memberMap[curMemberId];
          deleted.push(this.items_[curMemberId]);
        }

      // if any changes, fire event
      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);

      return delta;
    }
  });


  //
  // Filter
  //

 /**
  * @class
  */
  var Filter = Class(MapFilter, {
    className: namespace + '.Filter',

   /**
    * @inheritDoc
    */
    filter: function(object){
      return !this.rule(object);
    }
  });


  //
  // Split
  //

 /**
  * @class
  */
  var Split = Class(MapFilter, {
    className: namespace + '.Split',

   /**
    * Class for subset
    * @type {basis.data.ReadOnlyDataset}
    */
    subsetClass: ReadOnlyDataset,

   /**
    * Class for subset wrapper
    * @type {function}
    */
    subsetWrapperClass: DatasetWrapper,

   /**
    * @type {basis.data.KeyObjectMap}
    */
    keyMap: null,

   /**
    * @inheritDoc
    */
    map: function(sourceObject){
      return this.keyMap.resolve(sourceObject);
    },

   /**
    * @inheritDoc
    */
    rule: getter($undef),

   /**
    * @inheritDoc
    */
    setRule: function(rule){
      rule = getter(rule || $undef);

      if (this.rule !== rule)
      {
        var oldRule = this.rule;

        this.rule = rule;
        this.keyMap.keyGetter = rule;
        this.emit_ruleChanged(oldRule);

        return this.applyRule();
      }
    },

   /**
    * @inheritDoc
    */
    addMemberRef: function(wrapper, sourceObject){
      wrapper.dataset.emit_itemsChanged({
        inserted: [sourceObject]
      });
    },

   /**
    * @inheritDoc
    */
    removeMemberRef: function(wrapper, sourceObject){
      wrapper.dataset.emit_itemsChanged({
        deleted: [sourceObject]
      });
    },

   /**
    * @constructor
    */
    init: function(){
      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = createKeyMap(this.keyMap, this.rule, this.subsetWrapperClass, this.subsetClass);

      // inherit
      MapFilter.prototype.init.call(this);
    },

   /**
    * Fetch subset dataset by some data.
    * @param {basis.data.Object|Object} data
    * @param {boolean} autocreate
    * @return {basis.data.Object}
    */
    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      MapFilter.prototype.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });


  //
  // Slice
  //

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
  var Slice = Class(SourceDataset, {
    className: namespace + '.Slice',

   /**
    * Ordering items function.
    * @type {function(basis.data.Object):*}
    * @readonly
    */
    rule: getter($true),

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
      rule = getter(rule || $true);
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


  //
  // Cloud
  //

  var CLOUD_SOURCEOBJECT_UPDATE = function(sourceObject){
    var sourceMap = this.sourceMap_;
    var memberMap = this.members_;
    var sourceObjectId = sourceObject.basisObjectId;

    var oldList = sourceMap[sourceObjectId].list;
    var newList = sourceMap[sourceObjectId].list = {};
    var list = this.rule(sourceObject);
    var delta;
    var inserted = [];
    var deleted = [];
    var subset;

    if (Array.isArray(list))
      for (var j = 0; j < list.length; j++)
      {
        subset = this.keyMap.get(list[j], true);

        if (subset && !subset.has(sourceObject))
        {
          subsetId = subset.basisObjectId;
          newList[subsetId] = subset;

          if (!oldList[subsetId])
          {
            subset.dataset.emit_itemsChanged({ inserted: [sourceObject] });

            if (!memberMap[subsetId])
            {
              inserted.push(subset);
              memberMap[subsetId] = 1;
            }
            else
              memberMap[subsetId]++;
          }
        }
      }

    for (var subsetId in oldList)
      if (!newList[subsetId])
      {
        var subset = oldList[subsetId];
        subset.dataset.emit_itemsChanged({ deleted: [sourceObject] });

        if (!--memberMap[subsetId])
        {
          delete memberMap[subsetId];
          deleted.push(subset);
        }
      }

    if (delta = getDelta(inserted, deleted))
      this.emit_itemsChanged(delta);
  };

  var CLOUD_SOURCE_HANDLER = {
    itemsChanged: function(dataset, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.members_;
      var updateHandler = this.ruleEvents;
      var array;
      var subset;
      var subsetId;
      var inserted = [];
      var deleted = [];

      setAccumulateState(true);

      if (array = delta.inserted)
        for (var i = 0, sourceObject; sourceObject = array[i]; i++)
        {
          var list = this.rule(sourceObject);
          var sourceObjectInfo = {
            object: sourceObject,
            list: {}
          };

          sourceMap[sourceObject.basisObjectId] = sourceObjectInfo;

          if (Array.isArray(list))
            for (var j = 0, dupFilter = {}; j < list.length; j++)
            {
              subset = this.keyMap.get(list[j], true);

              if (subset && !dupFilter[subset.basisObjectId])
              {
                subsetId = subset.basisObjectId;
                dupFilter[subsetId] = true;
                sourceObjectInfo.list[subsetId] = subset;

                subset.dataset.emit_itemsChanged({ inserted: [sourceObject] });

                if (!memberMap[subsetId])
                {
                  inserted.push(subset);
                  memberMap[subsetId] = 1;
                }
                else
                  memberMap[subsetId]++;
              }
            }

          if (updateHandler)
            sourceObject.addHandler(updateHandler, this);
        }

      if (array = delta.deleted)
        for (var i = 0, sourceObject; sourceObject = array[i]; i++)
        {
          var sourceObjectId = sourceObject.basisObjectId;
          var list = sourceMap[sourceObjectId].list;

          delete sourceMap[sourceObjectId];

          for (var subsetId in list)
          {
            subset = list[subsetId];
            subset.dataset.emit_itemsChanged({ deleted: [sourceObject] });

            if (!--memberMap[subsetId])
            {
              delete memberMap[subsetId];
              deleted.push(subset);
            }
          }

          if (updateHandler)
            sourceObject.removeHandler(updateHandler, this);
        }

      setAccumulateState(false);

      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);
    }
  };

 /**
  * @class
  */
  var Cloud = Class(SourceDataset, {
    className: namespace + '.Cloud',

   /**
    * Class for subset
    * @type {function}
    */
    subsetClass: ReadOnlyDataset,

   /**
    * Class for subset wrapper
    * @type {function}
    */
    subsetWrapperClass: DatasetWrapper,

   /**
    * @type {function(basis.data.Object):*}
    */
    rule: getter($undef),

   /**
    * Events list when dataset should recompute rule for source item.
    */
    ruleEvents: createRuleEvents(CLOUD_SOURCEOBJECT_UPDATE, 'update'),

   /**
    * @type {basis.data.KeyObjectMap}
    */
    keyMap: null,

   /**
    * @inheritDoc
    */
    map: $self,

   /**
    * @inheritDoc
    */
    listen: {
      source: CLOUD_SOURCE_HANDLER
    },

   /**
    * @constructor
    */
    init: function(){
      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = createKeyMap(this.keyMap, this.rule, this.subsetWrapperClass, this.subsetClass);

      // inherit
      SourceDataset.prototype.init.call(this);
    },

   /**
    * Fetch subset dataset by some data.
    * @param {basis.data.Object|Object} data
    * @param {boolean} autocreate
    * @return {basis.data.Object}
    */
    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      SourceDataset.prototype.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });


  //
  // Extract
  //

  var EXTRACT_SOURCEOBJECT_UPDATE = function(sourceObject){
    var sourceObjectInfo = this.sourceMap_[sourceObject.basisObjectId];
    var newValue = this.rule(sourceObject) || null;
    var oldValue = sourceObjectInfo.value;
    var inserted;
    var deleted;
    var delta;

    if (newValue === oldValue)
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
        if (cursor.object === ref)
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
  var Extract = SourceDataset.subclass({
    className: namespace + '.Extract',

   /**
    * Nothing return by default. Behave like proxy.
    * @type {function(item:basis.data.Object):basis.data.Object|basis.data.ReadOnlyDataset}
    */
    rule: getter($undef),

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
      rule = getter(rule || $undef);

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
      var array;
      var delta;

      for (var key in this.sourceMap_)
      {
        var sourceObjectInfo = this.sourceMap_[key];
        var sourceObject = sourceObjectInfo.source;

        if (sourceObject instanceof DataObject)
        {
          var newValue = this.rule(sourceObject) || null;
          var oldValue = sourceObjectInfo.value;

          if (newValue === oldValue)
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


  //
  // export names
  //

  module.exports = {
    getDelta: getDelta,
    createRuleEvents: createRuleEvents,

    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // base source dataset
    SourceDataset: SourceDataset,

    // transform datasets
    MapFilter: MapFilter,
    Filter: Filter,
    Split: Split,
    Extract: Extract,

    // other
    Slice: Slice,
    Cloud: Cloud
  };
