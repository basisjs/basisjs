var extend = basis.object.extend;
var KeyObjectMap = require('../../data.js').KeyObjectMap;


module.exports = function createKeyMap(config, keyGetter, ItemClass, SubsetClass){
  return new KeyObjectMap(extend({
    keyGetter: keyGetter,
    itemClass: ItemClass,
    create: function(key, object){
      var datasetWrapper = KeyObjectMap.prototype.create.call(this, key, object);
      datasetWrapper.ruleValue = key;
      datasetWrapper.setDataset(new SubsetClass({
        ruleValue: key
      }));
      return datasetWrapper;
    }
  }, config));
};
