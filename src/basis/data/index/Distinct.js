var Index = require('./Index.js');

/**
* @class
*/
module.exports = Index.subclass({
  className: 'basis.data.index.Distinct',

 /**
  * Values map
  * @type {object}
  */
  map_: null,

 /**
  * @inheritDoc
  */
  init: function(){
    this.map_ = {};
    Index.prototype.init.call(this);
  },

 /**
  * @inheritDoc
  */
  add_: function(value){
    if (!this.map_.hasOwnProperty(value)) // new key
      this.map_[value] = 0;

    if (++this.map_[value] == 1)
      this.value += 1;
  },

 /**
  * @inheritDoc
  */
  remove_: function(value){
    if (--this.map_[value] == 0)
      this.value -= 1;
  },

 /**
  * @inheritDoc
  */
  update_: function(newValue, oldValue){
    var delta = 0;

    // add
    if (!this.map_.hasOwnProperty(newValue))  // new key
      this.map_[newValue] = 0;

    if (++this.map_[newValue] == 1)
      delta += 1;

    // remove
    if (--this.map_[oldValue] == 0)
      delta -= 1;

    // apply delta
    if (delta)
      this.set(this.value + delta);
  },

 /**
  * @inheritDoc
  */
  normalize: String,

 /**
  * @inheritDoc
  */
  destroy: function(){
    Index.prototype.destroy.call(this);
    this.map_ = null;
  }
});
