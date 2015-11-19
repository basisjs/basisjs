var Value = require('basis.data').Value;
var Index = require('./Index.js');
var resolveDataset = require('basis.data').resolveDataset;

var INDEXWRAPPER_HANDLER = {
  destroy: function(){
    Value.prototype.set.call(this, this.initValue);
    this.index = null;
  }
};

/**
* @class
*/
module.exports = Value.subclass({
  className: 'basis.data.index.IndexWrapper',

  extendConstructor_: false,

  source: null,
  sourceRA_: null,
  dataset: null,
  indexConstructor: null,
  index: null,

  init: function(source, indexConstructor){
    this.source = source;
    this.indexConstructor = indexConstructor;
    this.value = indexConstructor.prototype.value;

    Value.prototype.init.call(this);

    source.bindingBridge.attach(source, basis.fn.$undef, this, this.destroy);
    this.setDataset(source);
  },
  setDataset: function(source){
    var oldDataset = this.dataset;
    var newDataset = resolveDataset(this, this.setDataset, source, 'sourceRA_');

    if (newDataset !== oldDataset)
    {
      var index = this.index;

      if (index)
      {
        index.removeHandler(INDEXWRAPPER_HANDLER, this);
        index.wrapperCount -= 1;
        if (!index.wrapperCount && !index.explicit)
          index.destroy();
        else
          index.unlink(this, Value.prototype.set);
      }

      if (newDataset)
      {
        index = Index.getDatasetIndex(newDataset, this.indexConstructor);
        index.wrapperCount += 1;
        index.link(this, Value.prototype.set);
        index.addHandler(INDEXWRAPPER_HANDLER, this);
      }
      else
      {
        index = null;
        Value.prototype.set.call(this, this.initValue);
      }

      this.dataset = newDataset;
      this.index = index;
    }
  },
  set: function(){
    /** @cut */ basis.dev.warn(this.className + ': value can\'t be set as IndexWrapper is read only');
  },
  destroy: function(){
    this.source.bindingBridge.detach(this.source, basis.fn.$undef, this);
    this.setDataset();

    Value.prototype.destroy.call(this);

    this.source = null;
    this.indexConstructor = null;
  }
});
