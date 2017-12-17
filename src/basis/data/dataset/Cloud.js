var $self = basis.fn.$self;
var $undef = basis.fn.$undef;
var ReadOnlyDataset = require('../../data.js').ReadOnlyDataset;
var DatasetWrapper = require('../../data.js').DatasetWrapper;
var KeyObjectMap = require('../../data.js').KeyObjectMap;
var setAccumulateState = require('../../data.js').Dataset.setAccumulateState;
var SourceDataset = require('./SourceDataset.js');
var createKeyMap = require('./createKeyMap.js');
var createRuleEvents = require('./createRuleEvents.js');
var getDelta = require('./getDelta.js');


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
module.exports = SourceDataset.subclass({
  className: 'basis.data.dataset.Cloud',

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
  rule: basis.getter($undef),

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
