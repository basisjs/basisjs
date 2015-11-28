var Index = require('./Index.js');

function binarySearchPos(array, value){
  if (!array.length)  // empty array check
    return 0;

  var pos;
  var cmpValue;
  var l = 0;
  var r = array.length - 1;

  do
  {
    pos = (l + r) >> 1;
    cmpValue = array[pos] || 0;

    if (value < cmpValue)
      r = pos - 1;
    else
      if (value > cmpValue)
        l = pos + 1;
      else
        return value == cmpValue ? pos : 0;
  }
  while (l <= r);

  return pos + (cmpValue < value);
}

/**
* @class
*/
module.exports = Index.subclass({
  className: 'basis.data.index.VectorIndex',

 /**
  * function to fetch item from vector
  * @type {function(object)}
  */
  vectorGetter: basis.fn.$null,

 /**
  * Values vector
  * @type {Array}
  */
  vector_: null,

 /**
  * @inheritDocs
  */
  value: undefined,

 /**
  * @inheritDoc
  */
  init: function(){
    this.vector_ = [];
    Index.prototype.init.call(this);
  },

 /**
  * @inheritDoc
  */
  add_: function(value){
    if (value !== null)
    {
      this.vector_.splice(binarySearchPos(this.vector_, value), 0, value);
      this.value = this.vectorGetter(this.vector_);
    }
  },

 /**
  * @inheritDoc
  */
  remove_: function(value){
    if (value !== null)
    {
      this.vector_.splice(binarySearchPos(this.vector_, value), 1);
      this.value = this.vectorGetter(this.vector_);
    }
  },

 /**
  * @inheritDoc
  */
  update_: function(newValue, oldValue){
    if (oldValue !== null)
      this.vector_.splice(binarySearchPos(this.vector_, oldValue), 1);

    if (newValue !== null)
      this.vector_.splice(binarySearchPos(this.vector_, newValue), 0, newValue);

    this.set(this.vectorGetter(this.vector_));
  },

 /**
  * @inheritDoc
  */
  normalize: function(value){
    return typeof value == 'string' || typeof value == 'number' ? value : null;
  },

 /**
  * @inheritDoc
  */
  destroy: function(){
    Index.prototype.destroy.call(this);
    this.vector_ = null;
  }
});
