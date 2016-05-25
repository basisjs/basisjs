var Index = require('./Index.js');

 /**
  * @class
  */
module.exports = Index.subclass({
  className: 'basis.data.index.Sum',

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
  update_: function(newValue, oldValue){
    this.set(this.value - oldValue + newValue);
  }
});
