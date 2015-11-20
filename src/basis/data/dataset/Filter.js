var MapFilter = require('./MapFilter.js');


/**
* @class
*/
module.exports = MapFilter.subclass({
  className: 'basis.data.dataset.Filter',

 /**
  * @inheritDoc
  */
  filter: function(object){
    return !this.rule(object);
  }
});
