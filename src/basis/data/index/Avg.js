var Index = require('./Index.js');

/**
* @class
*/
module.exports = Index.subclass({
  className: 'basis.data.index.Avg',
  sum_: 0,
  count_: 0,

 /**
  * @inheritDoc
  */
  add_: function(value){
    this.sum_ += value;
    this.count_ += 1;
    this.value = this.sum_ / this.count_;
  },

 /**
  * @inheritDoc
  */
  remove_: function(value){
    this.sum_ -= value;
    this.count_ -= 1;
    this.value = this.count_ ? this.sum_ / this.count_ : 0;
  },

 /**
  * @inheritDoc
  */
  update_: function(newValue, oldValue){
    this.sum_ += newValue - oldValue;
    this.set(this.sum_ / this.count_);
  }
});
