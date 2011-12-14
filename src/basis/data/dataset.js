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

basis.require('basis.data');

!function(){

  'use strict';

 /**
  * Namespace overview:
  * - Classes:
  *   {basis.data.dataset.Merge}, {basis.data.dataset.Subtract},
  *   {basis.data.dataset.MapReduce}, {basis.data.dataset.Subset},
  *   {basis.data.dataset.Split}
  *
  * @namespace basis.data.dataset
  */

  var namespace = 'basis.data.dataset';


  //
  // import names
  //

  var Class = basis.Class;

  var extend = Object.extend;
  var $self = Function.$self;
  var $true = Function.$true;
  var $false = Function.$false;
  var createEvent = basis.EventObject.createEvent;

  var SUBSCRIPTION = basis.data.SUBSCRIPTION;
  var DataObject = basis.data.DataObject;
  var KeyObjectMap = basis.data.KeyObjectMap;
  var AbstractDataset = basis.data.AbstractDataset;
  var Dataset = basis.data.Dataset;


  //
  // New subscription types
  //

  SUBSCRIPTION.add(
    'SOURCE',
    {
      sourceChanged: function(object, oldSource){
        this.remove(object, oldSource);
        this.add(object, object.source);
      },
      sourcesChanged: function(object, delta){
        var array;

        if (array = delta.inserted)
          for (var i = array.length; i --> 0;)
            this.add(object, array[i]);

        if (array = delta.deleted)
          for (var i = array.length; i --> 0;)
            this.remove(object, array[i]);
      }
    },
    function(action, object){
      var sources = object.sources || [object.source];

      for (var i = 0, source; source = sources[i++];)
        action(object, source);
    }
  );

  SUBSCRIPTION.add(
    'MINUEND',
    {
      operandsChanged: function(object, oldMinuend, oldSubtrahend){
        if (this.minuend !== oldMinuend)
        {
          this.remove(object, oldMinuend);
          this.add(object, object.minuend);
        }
      }
    },
    function(action, object){
      action(object, object.minuend);
    }
  );

  SUBSCRIPTION.add(
    'SUBTRAHEND',
    {
      operandsChanged: function(object, oldMinuend, oldSubtrahend){
        if (this.subtrahend !== oldSubtrahend)
        {
          this.remove(object, oldSubtrahend);
          this.add(object, object.subtrahend);
        }
      }
    },
    function(action, object){
      action(object, object.subtrahend);
    }
  );

  
 /**
  * @func
  * Returns delta object
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

  //
  // Merge dataset 
  //

  var MERGE_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var memberMap = this.memberMap_;
      var updated = {};
      var deleted = [];

      var object;
      var objectId;

      if (delta.inserted)
      {
        for (var i = 0; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
        
          // check: is this object already known
          if (memberMap[objectId])
          {
            // item exists -> increase source links count
            memberMap[objectId].count++;
          }
          else
          {
            // registrate in source map
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
          objectId = object.eventObjectId;

          // mark as updated
          updated[objectId] = memberMap[objectId];

          // descrease source counter
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
  * @namespace basis.data.Dataset
  */

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
    event_sourcesChanged: createEvent('sourcesChanged', 'dataset', 'delta'),

   /**
    * @type {Array.<basis.data.AbstractDataset>}
    */
    sources: null,

   /**
    * @type {function(count, sourceCount):boolean}
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
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      // init part
      var sources = this.sources;
      this.sources = [];
      if (sources)
        sources.forEach(this.addSource, this);
    },

   /**
    * Set new merge rule for dataset. Some types are available in basis.data.Dataset.Merge
    * @param {function(count, sourceCount):boolean} rule New rule.
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
    */
    applyRule: function(scope){
      var memberMap = this.memberMap_;
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

        if (isMember != !!this.item_[objectId])
          (isMember
            ? inserted // not in items -> insert
            : deleted  // already in items -> delete
          ).push(memberCounter.object); 

        if (memberCounter.count == 0)
          delete memberMap[objectId];
      }

      // fire event if delta found
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    },

   /**
    * Add source from sources list.
    * @param {basis.data.AbstractDataset} source
    * @return {boolean} Returns true if new source added.
    */
    addSource: function(source){
      if (source instanceof AbstractDataset)
      {
        if (this.sources.add(source))
        {
          // add event listeners to source
          if (this.listen.source)
            source.addHandler(this.listen.source, this);

          // process new source objects and update member map
          var memberMap = this.memberMap_;
          for (var objectId in source.item_)
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
                object: source.item_[objectId]
              };
            }
          }

          // build delta and fire event
          this.applyRule();

          // fire sources changes event
          this.event_sourcesChanged(this, {
            inserted: [source]
          });

          return true;
        }
      }
      else
      {
        ;;;if(typeof console != 'undefined') console.warn(this.className + '.addSource: source isn\'t instance of AbstractDataset');
      }
    },

   /**
    * Removes source from sources list.
    * @param {basis.data.AbstractDataset} source
    * @return {boolean} Returns true if source removed.
    */
    removeSource: function(source){
      if (this.sources.remove(source))
      {
        // remove event listeners from source
        if (this.listen.source)
          source.removeHandler(this.listen.source, this);

        // process removing source objects and update member map
        var memberMap = this.memberMap_;
        for (var objectId in source.item_)
          memberMap[objectId].count--;

        // build delta and fire event
        this.applyRule();

        // fire sources changes event
        this.event_sourcesChanged(this, {
          deleted: [source]
        });

        return true;
      }
      else
      {
        ;;;if(typeof console != 'undefined') console.warn(this.className + '.removeSource: source isn\'t in dataset source list');
      }
    },

   /**
    * Synchonize sources list according new list.
    * TODO: optimize, reduce event_sourcesChanged and event_datasetChanged count
    * TODO: returns delta of source list changes
    * @param {Array.<basis.data.AbstractDataset>} sources
    */
    setSources: function(sources){
      var exists = Array.from(this.sources); // clone list

      for (var i = 0, source; source = sources[i]; i++)
      {
        if (source instanceof AbstractDataset)
        {
          if (!exists.remove(source))
            this.addSource(source);
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.setSources: source isn\'t type of AbstractDataset', source);
        }
      }

      exists.forEach(this.removeSource, this);
    },

   /**
    * Remove all sources. All members are removing as side effect.
    * TODO: optimize, reduce event_sourcesChanged and event_datasetChanged count
    */
    clear: function(){
      Array.from(this.sources).forEach(this.removeSource, this);
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
    datasetChanged: function(dataset, delta){
      if (!this.subtrahend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.inserted && delta.inserted.filter(datasetAbsentFilter, this.subtrahend),
        /* deleted */  delta.deleted  && delta.deleted.filter(this.has, this)
      );
      
      if (newDelta)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      this.setOperands(null, this.subtrahend);
    }
  };

  var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
    datasetChanged: function(dataset, delta){
      if (!this.minuend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.deleted  && delta.deleted.filter(datasetAbsentFilter, this),
        /* deleted */  delta.inserted && delta.inserted.filter(this.has, this)
      );

      if (newDelta)
        this.event_datasetChanged(this, newDelta);
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
    * @type {basis.data.AbstractDataset}
    */
    subtrahend: null,

   /**
    * Fires when minuend or substrahend changed.
    * @param {basis.data.DataObject} object Object which state was changed.
    * @param {object} oldState Object state before changes.
    * @event
    */
    event_operandsChanged: createEvent('operandsChanged', 'dataset', 'oldMinuend', 'oldSubtrahend'),

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
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      // init part
      var minuend = this.minuend;
      var subtrahend = this.subtrahend;

      this.minuend = null;
      this.subtrahend = null;

      if (minuend || subtrahend)
        this.setOperands(minuend, subtrahend);
    },

   /**
    * Set new operands.
    * @param {basis.data.AbstractDataset} minuend
    * @param {basis.data.AbstractDataset} subtrahend
    * @return {Object} Delta if changes happend
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
            minuend.addHandler(listenHandler, this)
        }
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
      }

      if (!operandsChanged)
        return false;

      // emit event
      this.event_operandsChanged(this, oldMinuend, oldSubtrahend);

      // apply changes
      if (!minuend || !subtrahend)
      {
        if (this.itemCount)
          this.event_datasetChanged(this, delta = {
            deleted: this.getItems()
          });
      }
      else
      {
        var deleted = [];
        var inserted = [];

        for (var key in this.item_)
          if (!minuend.item_[key] || subtrahend.item_[key])
            deleted.push(this.item_[key]);

        for (var key in minuend.item_)
          if (!this.item_[key] && !subtrahend.item_[key])
            inserted.push(minuend.item_[key]);

        if (delta = getDelta(inserted, deleted))
          this.event_datasetChanged(this, delta);
      }

      return delta;
    },

    clear: function(){
      this.setOperands();
    }
  });


  //
  // MapReduce
  //

  var MAPREDUCEDATASET_SOURCEOBJECT_HANDLER = {
    update: function(object){
      var newMember = this.map ? this.map(object) : object; // fetch new member ref
      
      if (newMember instanceof DataObject == false || this.reduce(newMember))
        newMember = null;

      var sourceMap = this.sourceMap_[object.eventObjectId];
      var curMember = sourceMap.member;

      // if member ref is changed
      if (curMember != newMember)
      {
        var memberMap = this.memberMap_;
        var delta;
        var inserted;
        var deleted;

        // update member
        sourceMap.member = newMember;

        // if here is ref for member already
        if (curMember)
        {
          var curMemberId = curMember.eventObjectId;

          // call callback on member ref add
          if (this.removeMemberRef)
            this.removeMemberRef(curMember, object);

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
          var newMemberId = newMember.eventObjectId;

          // call callback on member ref add
          if (this.addMemberRef)
            this.addMemberRef(newMember, object);

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
          this.event_datasetChanged(this, delta);
      }
    }
  };

  var MAPREDUCEDATASET_SOURCE_HANDLER = {
    datasetChanged: function(dataset, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var inserted = [];
      var deleted = [];
      var sourceObject;
      var sourceObjectId;
      var member;
      var listenHandler = this.listen.sourceObject;

      Dataset.setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          member = this.map ? this.map(sourceObject) : sourceObject;

          if (member instanceof DataObject == false || this.reduce(member))
            member = null;

          if (listenHandler)
            sourceObject.addHandler(listenHandler, this);

          sourceMap[sourceObject.eventObjectId] = {
            sourceObject: sourceObject,
            member: member
          };

          if (member)
          {
            var memberId = member.eventObjectId;
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
          sourceObjectId = sourceObject.eventObjectId;
          member = sourceMap[sourceObjectId].member;

          if (listenHandler)
            sourceObject.removeHandler(listenHandler, this);

          delete sourceMap[sourceObjectId];

          if (member)
          {
            var memberId = member.eventObjectId;
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
        this.event_datasetChanged(this, delta);
    },
    destroy: function(){
      this.setSource();
    }
  };

 /**
  * @class
  */
  var MapReduce = Class(AbstractDataset, {
    className: namespace + '.MapReduce',

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
    * Fires when source property changed.
    * @param {basis.data.AbstractDataset} dataset Event initiator.
    * @param {basis.data.AbstractDataset} oldSource Previous value for source property.
    * @event
    */
    event_sourceChanged: createEvent('sourceChanged', 'dataset', 'oldSource'),

   /**
    * Map function for source object, to get member object.
    * @type {function(basis.data.DataObject):basis.data.DataObject}
    * @readonly
    */
    map: $self,

   /**
    * Filter function. It should return false, than result of map function
    * become a member.
    * @type {function(basis.data.DataObject):boolean}
    * @readonly
    */
    reduce: $false,

   /**
    * Helper function.
    */
    rule: $false,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.DataObject)}
    * @readonly
    */
    addMemberRef: null,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.DataObject)}
    * @readonly
    */
    removeMemberRef: null,

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
      sourceObject: MAPREDUCEDATASET_SOURCEOBJECT_HANDLER,
      source: MAPREDUCEDATASET_SOURCE_HANDLER
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      ;;;if (this.sources) throw 'basis.data.dataset.MapReduce instances no more support for sources property, use source property instead.';
      ;;;if (this.dataset) throw 'basis.data.dataset.MapReduce instances no more support for dataset property, use source property instead.';

      AbstractDataset.prototype.init.call(this, config);

      this.sourceMap_ = {};

      var source = this.source;
      if (source)
      {
        this.source = null;
        this.setSource(source);
      }
    },

   /**
    * Set new filter function.
    * @param {function(basis.data.DataObject):boolean} filter
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
    * Set new transform function and apply new function to source objects.
    * @param {function(basis.data.DataObject):basis.data.DataObject} transform
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
    * Set new source dataset.
    * @param {basis.data.AbstractDataset} dataset
    */
    setSource: function(source){
      if (source instanceof AbstractDataset == false)
        source = null;

      if (this.source !== source)
      {
        var oldSource = this.source;
        var listenHandler = this.listen.source;

        this.source = source;

        if (listenHandler)
        {
          var datasetChangedHandler = listenHandler.datasetChanged;
          if (oldSource)
          {
            oldSource.removeHandler(listenHandler, this);

            if (datasetChangedHandler)
              datasetChangedHandler.call(this, oldSource, {
                deleted: oldSource.getItems()
              });
          }

          if (source)
          {
            source.addHandler(listenHandler, this);

            if (datasetChangedHandler)
              datasetChangedHandler.call(this, source, {
                inserted: source.getItems()
              });
          }
        }

        this.event_sourceChanged(this, oldSource);
      }
    },

   /**
    * Apply transform for all source objects and rebuild member set.
    * @return {Object} Delta of member changes.
    */
    applyRule: function(){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
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

        if (newMember instanceof DataObject == false || this.reduce(newMember))
          newMember = null;

        if (curMember != newMember)
        {
          sourceObjectInfo.member = newMember;

          // if here is ref for member already
          if (curMember)
          {
            curMemberId = curMember.eventObjectId;

            // call callback on member ref add
            if (this.removeMemberRef)
              this.removeMemberRef(curMember, sourceObject);

            // decrease ref count
            memberMap[curMemberId]--;
          }

          // if new member exists, update map
          if (newMember)
          {
            newMemberId = newMember.eventObjectId;

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
      for (var curMemberId in this.item_)
        if (memberMap[curMemberId] == 0)
        {
          delete memberMap[curMemberId];
          deleted.push(this.item_[curMemberId]);
        }

      // if any changes, fire event
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);

      return delta;
    },

   /**
    * Drop dataset. All members are removing as side effect.
    */
    clear: function(){
      this.setSource();
    },

    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sourceMap_ = null;
    }
  });


  //
  // Subset
  //

 /**
  * @class
  */
  var Subset = Class(MapReduce, {
    className: namespace + '.Subset',

   /**
    * @inheritDoc
    */
    reduce: function(object){
      return !this.rule(object);
    },

   /**
    * @inheritDoc
    */
    rule: $true
  });


  //
  // Split
  //

 /**
  * @class
  */
  var Split = Class(MapReduce, {
    className: namespace + '.Split',

   /**
    * @inheritDoc
    */
    map: function(object){
      return this.keyMap.resolve(object);
    },

   /**
    * @type {function(data):key}
    */
    rule: $true,

   /**
    * @type {basis.data.AbstractDataset}
    */
    subsetClass: AbstractDataset,

   /**
    * @type {basis.data.KeyObjectMap}
    */
    keyMap: null,

   /**
    * @inheritDoc
    */
    addMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { inserted: [sourceObject] });
    },

   /**
    * @inheritDoc
    */
    removeMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { deleted: [sourceObject] });
    },

   /**
    * @config {function} filter Group function.
    * @config {class} groupClass Class for group instances. Should be instance of AbstractDataset.
    * @config {boolean} destroyEmpty Destroy empty groups automaticaly or not.
    * @constructor
    */ 
    init: function(config){
      //this.groupMap_ = {};

      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(extend({
          keyGetter: this.rule,
          itemClass: this.subsetClass
        }, this.keyMap));

      // inherit
      MapReduce.prototype.init.call(this, config);
    },

    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

    destroy: function(){
      // inherit
      MapReduce.prototype.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // transform dataset
    MapReduce: MapReduce,
    Subset: Subset,
    Split: Split
  });

}(basis, this);
