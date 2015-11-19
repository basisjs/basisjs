var iterate = basis.object.iterate;
var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;
var SourceDataset = require('basis.data.dataset').SourceDataset;
var createRuleEvents = require('basis.data.dataset').createRuleEvents;
var Index = require('./Index.js');
var IndexWrapper = require('./IndexWrapper.js');
var IndexedCalc = require('./IndexedCalc.js');

var indexMapRecalcShedule = basis.asap.schedule(function(indexMap){
  indexMap.recalc();
});

var INDEXMAP_SOURCE_HANDLER = {
  itemsChanged: function(sender, delta){
    var deleted = [];
    var array;

    if (array = delta.inserted)
      for (var i = 0; i < array.length; i++)
      {
        var sourceObject = array[i];
        var sourceObjectId = sourceObject.basisObjectId;

        this.awaitToAdd_[sourceObjectId] = sourceObject;
        this.scheduleRecalc();
      }

    // TODO: make member deleting async
    if (array = delta.deleted)
      for (var i = 0; i < array.length; i++)
      {
        var sourceObject = array[i];
        var sourceObjectId = sourceObject.basisObjectId;
        var memberInfo = this.sourceMap_[sourceObjectId];

        if (memberInfo)
        {
          var member = memberInfo.member;

          deleted.push(member);

          if (this.listen.member)
            member.removeHandler(this.listen.member, this);

          if (this.recalcEvents)
            sourceObject.removeHandler(this.recalcEvents, this);

          delete this.sourceMap_[sourceObjectId];
        }
        else
        {
          delete this.awaitToAdd_[sourceObjectId];
        }
      }

    if (deleted.length)
    {
      this.emit_itemsChanged({
        deleted: deleted
      });

      for (var i = 0; i < deleted.length; i++)
      {
        var member = deleted[i];
        member.source = null;
        member.destroy();
      }
    }
  }
};

/**
* @class
*/
module.exports = SourceDataset.subclass({
  className: 'basis.data.index.IndexMap',

  calcs: null,
  copyDataFromSource: true,

  indexes: null,
  indexValues: null,
  indexUpdated: false,

  awaitToAdd_: null,
  itemClass: DataObject,

  listen: {
    source: INDEXMAP_SOURCE_HANDLER
  },

  recalcEvents: createRuleEvents(
    function(sender){
      this.sourceMap_[sender.basisObjectId].updated = true;
      this.scheduleRecalc();
    },
    'update'
  ),


  init: function(){
    var indexes = this.indexes;
    var calcs = this.calcs;

    this.calcs = {};
    this.indexes = {};
    this.indexValues = {};
    this.awaitToAdd_ = {};

    SourceDataset.prototype.init.call(this);

    iterate(indexes, this.addIndex, this);

    for (var name in calcs)
    {
      var calcCfg = calcs[name];

      if (calcCfg instanceof IndexedCalc)
      {
        iterate(calcCfg.indexes, this.addIndex, this);
        calcCfg = calcCfg.calc;
      }

      this.calcs[name] = calcCfg;
    }

    // TODO: Probably we should make recalc async
    this.recalc();
  },

  addIndex: function(key, IndexClass){
    if (!IndexClass || IndexClass.prototype instanceof Index === false)
    {
      /** @cut */ basis.dev.warn('basis.data.IndexMap#addIndex(): `IndexClass` should be subclass of `basis.data.index.Index`');
      return;
    }

    if (this.indexes[key])
    {
      /** @cut */ basis.dev.warn('basis.data.IndexMap#addIndex(): Index `' + key + '` already exists');
      return;
    }

    var index = new IndexWrapper(Value.from(this, 'sourceChanged', 'source'), IndexClass);
    this.indexes[key] = index;
    this.indexValues[key] = index.value;

    index.link(this, function(value){
      this.indexValues[key] = value;
      this.indexUpdated = true;
      this.scheduleRecalc();
    });
  },
  removeIndex: function(key){
    var index = this.indexes[key];

    if (index)
    {
      delete this.indexes[key];
      delete this.indexValues[key];

      index.destroy();
    }
  },

  lock: function(){
    for (var indexId in this.indexes)
      this.indexes[indexId].lock();
  },
  unlock: function(){
    for (var indexId in this.indexes)
      this.indexes[indexId].unlock();
  },

  scheduleRecalc: function(){
    indexMapRecalcShedule.add(this);
  },
  recalc: function(){
    // recalc existed members
    for (var id in this.sourceMap_)
      this.calcMember(this.sourceMap_[id]);

    // add new members
    var inserted = [];
    var items = this.awaitToAdd_;

    this.awaitToAdd_ = {};

    for (var id in items)
    {
      var sourceObject = items[id];
      var data = {};
      var member;

      for (var calcName in this.calcs)
        data[calcName] = this.calcs[calcName](sourceObject.data, this.indexValues, sourceObject);

      if (this.copyDataFromSource)
        for (var key in sourceObject.data)
          if (!this.calcs.hasOwnProperty(key))
            data[key] = sourceObject.data[key];

      member = new this.itemClass({
        data: data,
        // proxy update to sourceObject
        update: sourceObject.update.bind(sourceObject)
      });

      if (this.listen.member)
        member.addHandler(this.listen.member, this);

      if (this.recalcEvents)
        sourceObject.addHandler(this.recalcEvents, this);

      this.sourceMap_[id] = {
        sourceObject: sourceObject,
        member: member,
        updated: false
      };

      inserted.push(member);
    }

    if (inserted.length)
      this.emit_itemsChanged({
        inserted: inserted
      });

    this.indexUpdated = false;
    indexMapRecalcShedule.remove(this);
  },

  calcMember: function(memberInfo){
    var member = memberInfo.member;

    if (memberInfo.updated || this.indexUpdated)
    {
      var sourceObject = memberInfo.sourceObject;
      var delta = {};
      var newValue;
      var oldValue;
      var update;

      for (var calcName in this.calcs)
      {
        newValue = this.calcs[calcName](sourceObject.data, this.indexValues, sourceObject);
        oldValue = member.data[calcName];
        if (oldValue !== newValue && (newValue === newValue || oldValue === oldValue))
        {
          delta[calcName] = newValue;
          update = true;
        }
      }

      if (this.copyDataFromSource)
      {
        for (var key in sourceObject.data)
          if (!this.calcs.hasOwnProperty(key))
          {
            newValue = sourceObject.data[key];
            oldValue = member.data[key];
            if (oldValue !== newValue && (newValue === newValue || oldValue === oldValue))
            {
              delta[key] = newValue;
              update = true;
            }
          }

        for (var key in member.data)
          if (!this.calcs.hasOwnProperty(key) && !sourceObject.data.hasOwnProperty(key))
          {
            delta[key] = undefined;
            update = true;
          }
      }

      if (update)
        // call update from itemClass prototype, as instance update
        // method is proxy to source object update
        this.itemClass.prototype.update.call(member, delta);

      memberInfo.updated = false;
    }
  },

  getMember: function(sourceObject){
    var memberInfo = sourceObject && this.sourceMap_[sourceObject.basisObjectId];
    return memberInfo ? memberInfo.member : null;
  },

  destroy: function(){
    iterate(this.indexes, this.removeIndex, this);

    SourceDataset.prototype.destroy.call(this);

    indexMapRecalcShedule.remove(this);

    this.awaitToAdd_ = null;
    this.calcs = null;
    this.indexes = null;
    this.indexValues = null;
  }
});
