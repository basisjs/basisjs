var Index = require('./Index.js');

/**
* @class
*/
module.exports = Index.subclass({
  className: 'basis.data.index.Count',

 /**
  * @inheritDoc
  */
  valueGetter: basis.fn.$true,

 /**
  * @inheritDoc
  */
  add_: function(value){
    this.value += value;
  },

 /**
  * @inheritDoc
  */
  remove_: function(value){
    this.value -= value;
  },

 /**
  * @inheritDoc
  */
  normalize: function(value){
    return Boolean(value);
  },

 /**
  * @inheritDoc
  */
  update_: function(newValue, oldValue){
    this.set(this.value - Boolean(oldValue) + Boolean(newValue));
  }
});
