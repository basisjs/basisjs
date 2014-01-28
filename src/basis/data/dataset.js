
  basis.require('basis.event');
  basis.require('basis.data');


 /**
  * Namespace overview:
  * - Classes:
  *   {basis.data.dataset.Merge}, {basis.data.dataset.Subtract},
  *   {basis.data.dataset.MapFilter}, {basis.data.dataset.Subset},
  *   {basis.data.dataset.Split}, {basis.data.dataset.Slice}
  *   {basis.data.dataset.Cloud}
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
  var getter = basis.getter;
  var $self = basis.fn.$self;
  var $true = basis.fn.$true;
  var $false = basis.fn.$false;
  var arrayFrom = basis.array.from;
  var createEvent = basis.event.create;

  var SUBSCRIPTION = basis.data.SUBSCRIPTION;
  var DataObject = basis.data.Object;
  var KeyObjectMap = basis.data.KeyObjectMap;
  var AbstractDataset = basis.data.AbstractDataset;
  var Dataset = basis.data.Dataset;
  var DatasetWrapper = basis.data.DatasetWrapper;


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
    return (function createRuleEvents__extend__(events){
      if (!events)
        return null;

      if (events.__extend__)
        return events;

      if (typeof events != 'string' && !Array.isArray(events))
      {
        events = typeof events == 'object' ? basis.object.keys(events) : null;
        /** @cut */ if (events)
        /** @cut */   basis.dev.warn('Using an object for ruleEvents is deprecated, use space separated event names string or array of strings instead.');
      }

      return extend(basis.event.createHandler(events, fn), {
        __extend__: createRuleEvents__extend__
      });
    })(events);
  }

 /**
  *
  */
  function createKeyMap(config, keyGetter, itemClass, SubsetClass){
    return new KeyObjectMap(extend({
      keyGetter: keyGetter,
      itemClass: itemClass,
      create: function(key, object){
        var obj = KeyObjectMap.prototype.create.call(this, key, object);
        obj.setDataset(new SubsetClass({
          ruleValue: key
        }));
        return obj;
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
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };


 /**
  * @class
  */
  var Merge = Class(AbstractDataset, {
    className: namespace + '.Merge',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.SOURCE,

   /**
    * Fires when source set changed.
    * @param {basis.data.AbstractDataset} dataset
    * @param {object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new sources
    * and `deleted` property is array of removed sources.
    * @event
    */
    emit_sourcesChanged: createEvent('sourcesChanged', 'delta'),

   /**
    * @type {Array.<basis.data.AbstractDataset>}
    */
    sources: null,

   /**
    * @type {function(count:number, sourceCount:number):boolean}
    */
    rule: function(count, sourceCount){
      return count > 0;
    },

   /**
    * @inheritDoc
    */
    listen: {
      source: MERGE_DATASET_HANDLER
    },

   /**
    * @config {Array.<basis.data.AbstractDataset>} sources Set of source datasets for aggregate.
    * @constructor
    */
    init: function(){
      // inherit
      AbstractDataset.prototype.init.call(this);

      // init part
      var sources = this.sources;
      this.sources = [];
      if (sources)
        sources.forEach(this.addSource, this);
    },

   /**
    * Set new merge rule for dataset. Some types are available in basis.data.Dataset.Merge
    * @param {function(count:number, sourceCount:number):boolean} rule New rule.
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = Merge.UNION;

      if (this.rule !== rule)
      {
        this.rule = rule;
        this.applyRule();
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

        if (isMember != !!this.items_[objectId])
          (isMember
            ? inserted // not in items -> insert
            : deleted  // already in items -> delete
          ).push(memberCounter.object);

        if (memberCounter.count == 0)
          delete memberMap[objectId];
      }

      // fire event if delta found
      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);

      return delta;
    },

   /**
    * Add source from sources list.
    * @param {basis.data.AbstractDataset} source
    * @return {boolean} Returns true if new source added.
    */
    addSource: function(source){
      if (source instanceof AbstractDataset)
      {
        if (basis.array.add(this.sources, source))
        {
          // add event listeners to source
          if (this.listen.source)
            source.addHandler(this.listen.source, this);

          // process new source objects and update member map
          var memberMap = this.members_;
          for (var objectId in source.items_)
          {
            // check: is this object already known
            if (memberMap[objectId])
            {
              // item exists -> increase source links count
              memberMap[objectId].count++;
            }
            else
            {
              // add to source map
              memberMap[objectId] = {
                count: 1,
                object: source.items_[objectId]
              };
            }
          }

          // build delta and fire event
          this.applyRule();

          // fire sources changes event
          this.emit_sourcesChanged({
            inserted: [source]
          });

          return true;
        }
      }
      else
      {
        ;;;basis.dev.warn(this.constructor.className + '.addSource: source isn\'t instance of AbstractDataset');
      }
    },

   /**
    * Removes source from sources list.
    * @param {basis.data.AbstractDataset} source
    * @return {boolean} Returns true if source removed.
    */
    removeSource: function(source){
      if (basis.array.remove(this.sources, source))
      {
        // remove event listeners from source
        if (this.listen.source)
          source.removeHandler(this.listen.source, this);

        // process removing source objects and update member map
        var memberMap = this.members_;
        for (var objectId in source.items_)
          memberMap[objectId].count--;

        // build delta and fire event
        this.applyRule();

        // fire sources changes event
        this.emit_sourcesChanged({
          deleted: [source]
        });

        return true;
      }
      else
      {
        ;;;basis.dev.warn(this.constructor.className + '.removeSource: source isn\'t in dataset source list');
      }
    },

   /**
    * Synchonize sources list according new list.
    * TODO: optimize, reduce emit_sourcesChanged and emit_itemsChanged count
    * TODO: returns delta of source list changes
    * @param {Array.<basis.data.AbstractDataset>} sources
    */
    setSources: function(sources){
      var exists = arrayFrom(this.sources); // clone list

      for (var i = 0, source; source = sources[i]; i++)
      {
        if (source instanceof AbstractDataset)
        {
          if (!basis.array.remove(exists, source))
            this.addSource(source);
        }
        else
        {
          ;;;basis.dev.warn(this.constructor.className + '.setSources: source isn\'t type of AbstractDataset', source);
        }
      }

      exists.forEach(this.removeSource, this);
    },

   /**
    * Remove all sources. All members are removing as side effect.
    * TODO: optimize, reduce emit_sourcesChanged and emit_itemsChanged count
    */
    clear: function(){
      arrayFrom(this.sources).forEach(this.removeSource, this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

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
      this.setOperands(null, this.subtrahend);
    }
  };

  var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
    itemsChanged: function(dataset, delta){
      if (!this.minuend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.deleted  && delta.deleted.filter(datasetAbsentFilter, this),
        /* deleted */  delta.inserted && delta.inserted.filter(this.has, this)
      );

      if (newDelta)
        this.emit_itemsChanged(newDelta);
    },
    destroy: function(){
      this.setOperands(this.minuend, null);
    }
  };


 /**
  * @class
  */
  var Subtract = Class(AbstractDataset, {
    className: namespace + '.Subtract',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.MINUEND + SUBSCRIPTION.SUBTRAHEND,

   /**
    * @type {basis.data.AbstractDataset}
    */
    minuend: null,

   /**
    * Fires when minuend changed.
    * @param {basis.data.AbstractDataset} oldMinuend Value of {basis.data.dataset.Subtract#minuend} before changes.
    * @event
    */
    emit_minuendChanged: createEvent('minuendChanged', 'oldMinuend'),

   /**
    * @type {basis.data.AbstractDataset}
    */
    subtrahend: null,

   /**
    * Fires when subtrahend changed.
    * @param {basis.data.AbstractDataset} oldSubtrahend Value of {basis.data.dataset.Subtract#subtrahend} before changes.
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
      AbstractDataset.prototype.init.call(this);

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
    * @param {basis.data.AbstractDataset=} minuend
    * @param {basis.data.AbstractDataset=} subtrahend
    * @return {object|boolean} Delta if changes happend
    */
    setOperands: function(minuend, subtrahend){
      var delta;
      var operandsChanged = false;

      if (minuend instanceof AbstractDataset == false)
        minuend = null;

      if (subtrahend instanceof AbstractDataset == false)
        subtrahend = null;

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
    * @param {basis.data.AbstractDataset} minuend
    * @return {Object} Delta if changes happend
    */
    setMinuend: function(minuend){
      return this.setOperands(minuend, this.subtrahend);
    },

   /**
    * @param {basis.data.AbstractDataset} subtrahend
    * @return {Object} Delta if changes happend
    */
    setSubtrahend: function(subtrahend){
      return this.setOperands(this.minuend, subtrahend);
    },

   /**
    * @inheritDoc
    */
    clear: function(){
      this.setOperands();
    }
  });


  //
  // Source dataset mixin
  //

 /**
  * @class
  */
  var SourceDataset = Class(AbstractDataset, {
    className: namespace + '.SourceDataset',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.SOURCE,

   /**
    * Data source.
    * @type {basis.data.AbstractDataset}
    */
    source: null,

   /**
    * Fires when source changed.
    * @param {basis.data.AbstractDataset} oldSource Previous value for source property.
    * @event
    */
    emit_sourceChanged: createEvent('sourceChanged', 'oldSource'),

   /**
    * Source wrapper
    * @type {basis.data.DatasetAdapter}
    */
    sourceAdapter_: null,

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
          if (!this.sourceAdapter_)
            this.setSource();
        }
      }
    },

   /**
    * @constructor
    */
    init: function(){
      this.sourceMap_ = {};

      var source = this.source;
      if (source)
        this.source = null;     // NOTE: reset source before inherit -> prevent double subscription activation
                                // when this.active == true and source is assigned

      AbstractDataset.prototype.init.call(this);

      if (source)
        this.setSource(source);
    },

   /**
    * Set new source dataset.
    * @param {basis.data.AbstractDataset} source
    */
    setSource: function(source){
      source = basis.data.resolveDataset(this, this.setSource, source, 'sourceAdapter_');

      // sync with source
      if (this.source !== source)
      {
        var oldSource = this.source;
        var listenHandler = this.listen.source;

        this.source = source;

        if (listenHandler)
        {
          var itemsChangedHandler = listenHandler.itemsChanged;
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
        }

        this.emit_sourceChanged(oldSource);
      }
    },

   /**
    * Drop dataset. All members are removing as side effect.
    */
    clear: function(){
      this.setSource();
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sourceMap_ = null;
    }
  });


  //
  // MapFilter
  //

  var MAPFILTER_SOURCEOBJECT_UPDATE = function(sourceObject){
    var newMember = this.map ? this.map(sourceObject) : object; // fetch new member ref

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

      Dataset.setAccumulateState(true);

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

      Dataset.setAccumulateState(false);

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
    */
    rule: getter($true),

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
    * @param {function(basis.data.Object):boolean} rule
    * @return {Object} Delta of member changes.
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = $true;

      if (this.rule !== rule)
      {
        this.rule = rule;
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
  // Subset
  //

 /**
  * @class
  */
  var Subset = Class(MapFilter, {
    className: namespace + '.Subset',

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
    * @type {basis.data.AbstractDataset}
    */
    subsetClass: AbstractDataset,

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
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = $true;

      if (this.rule !== rule)
      {
        this.rule = rule;
        this.keyMap.keyGetter = rule;
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
    return +(a.value > b.value)
        || -(a.value < b.value)
        ||  (a.object.basisObjectId - b.object.basisObjectId);
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
    * @type {function(basis.data.Object)}
    * @readonly
    */
    rule: getter($true),

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

      var curSet = basis.object.slice(this.members_);
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

      if (delta = getDelta(inserted, values(curSet)))
        this.emit_itemsChanged(delta);

      return delta;
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      SourceDataset.prototype.destroy.call(this);

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

      Dataset.setAccumulateState(true);

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

      Dataset.setAccumulateState(false);

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
    subsetClass: AbstractDataset,

   /**
    * Class for subset wrapper
    * @type {function}
    */
    subsetWrapperClass: DatasetWrapper,

   /**
    * @type {function(basis.data.Object)}
    */
    rule: getter($false),

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
  // export names
  //

  module.exports = {
    createRuleEvents: createRuleEvents,

    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // base source dataset
    SourceDataset: SourceDataset,

    // transform datasets
    MapFilter: MapFilter,
    Subset: Subset,
    Split: Split,

    // other
    Slice: Slice,
    Cloud: Cloud
  };
