var $undef = basis.fn.$undef;
var ReadOnlyDataset = require('basis.data').ReadOnlyDataset;
var DatasetWrapper = require('basis.data').DatasetWrapper;
var KeyObjectMap = require('basis.data').KeyObjectMap;
var MapFilter = require('./MapFilter.js');
var createKeyMap = require('./createKeyMap.js');


/**
* @class
*/
module.exports = MapFilter.subclass({
  className: 'basis.data.dataset.Split',

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
  rule: basis.getter($undef),

 /**
  * @inheritDoc
  */
  setRule: function(rule){
    rule = basis.getter(rule || $undef);

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
