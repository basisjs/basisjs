var $self = basis.fn.$self;
var $true = basis.fn.$true;
var $false = basis.fn.$false;
var createEvent = require('basis.event').create;
var createRuleEvents = require('./createRuleEvents.js');
var getDelta = require('./getDelta.js');
var DataObject = require('basis.data').Object;
var setAccumulateState = require('basis.data').Dataset.setAccumulateState;
var SourceDataset = require('./SourceDataset.js');


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
module.exports = SourceDataset.subclass({
  className: 'basis.data.dataset.MapFilter',

  propertyDescriptors: {
    rule: 'ruleChanged',
    addMemberRef: false,
    removeMemberRef: false,
    ruleEvents: false
  },

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
  rule: basis.getter($true),

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

  /** @cut */ init: function(){
  /** @cut */   SourceDataset.prototype.init.call(this);
  /** @cut */   basis.dev.patchInfo(this, 'sourceInfo', {
  /** @cut */     type: this.constructor.className.split('.').pop(),
  /** @cut */     transform: this.rule
  /** @cut */   });
  /** @cut */ },

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
    rule = basis.getter(rule || $true);

    if (this.rule !== rule)
    {
      var oldRule = this.rule;

      this.rule = rule;
      this.emit_ruleChanged(oldRule);

      /** @cut */ basis.dev.patchInfo(this, 'sourceInfo', {
      /** @cut */   transform: this.rule
      /** @cut */ });

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
