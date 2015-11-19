var Value = require('basis.data').Value;

/**
* Base class for indexes.
* @class
*/
module.exports = Value.subclass({
  className: 'basis.data.index.Index',

  propertyDescriptors: {
    explicit: false,
    wrapperCount: false,
    updateEvents: false
  },

 /**
  * Explicit declared
  * @type {boolean}
  */
  explicit: false,

 /**
  * Count of wrapper indexes
  * @type {number}
  */
  wrapperCount: 0,

 /**
  * Map of current values
  * @type {Object}
  * @private
  */
  indexCache_: null,

 /**
  * @type {function(object)}
  */
  valueGetter: basis.fn.$null,

 /**
  * Event names map when index must check for updates.
  * @type {Object}
  */
  updateEvents: {},

 /**
  * @inheritDocs
  */
  value: 0,

 /**
  * @inheritDocs
  */
  setNullOnEmitterDestroy: false,

 /**
  * @constructor
  */
  init: function(){
    this.indexCache_ = {};

    Value.prototype.init.call(this);
  },

 /**
  * Add value to index
  */
  add_: function(value){
  },

 /**
  * Remove value to index
  */
  remove_: function(value){
  },

 /**
  * Change value
  */
  update_: function(newValue, oldValue){
  },

 /**
  * Normalize value to be computable.
  */
  normalize: function(value){
    return Number(value) || 0;
  },

  destroy: function(){
    Value.prototype.destroy.call(this);

    this.indexCache_ = null;
  }
});
