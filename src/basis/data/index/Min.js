var VectorIndex = require('./VectorIndex.js');

/**
* @class
*/
module.exports = VectorIndex.subclass({
  className: 'basis.data.index.Min',
  vectorGetter: function(vector){
    return vector[0];
  }
});
