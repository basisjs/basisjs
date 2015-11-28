var VectorIndex = require('./VectorIndex.js');

/**
* @class
*/
module.exports = VectorIndex.subclass({
  className: 'basis.data.index..Max',
  vectorGetter: function(vector){
    return vector[vector.length - 1];
  }
});
