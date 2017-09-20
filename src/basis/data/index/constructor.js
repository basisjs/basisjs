var Class = basis.Class;
var ReadOnlyDataset = require('../../data.js').ReadOnlyDataset;
var DatasetWrapper = require('../../data.js').DatasetWrapper;
var chainValueFactory = require('../../data.js').chainValueFactory;
var Index = require('./Index.js');
var IndexWrapper = require('./IndexWrapper.js');

var PREFIX = 'basisjsIndexConstructor' + basis.genUID();
var constructors = {};

var SOURCE_INDEXWRAPPER_HANDLER = {
  destroy: function(indexWrapper){
    indexWrapper.source[this.indexId] = null;
  }
};


/**
* @function
*/
function getIndexConstructor(BaseClass, events, getter){
  if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(Index))
    throw 'Wrong class for index constructor';

  getter = basis.getter(getter);
  events = events || 'update';

  if (typeof events != 'string')
    throw 'Events must be a event names space separated string';

  events = events.trim().split(' ').sort();

  var indexId = PREFIX + [BaseClass.basisClassId_, getter[basis.getter.ID], events].join('_');
  var indexConstructor = constructors[indexId];

  if (!indexConstructor)
  {
    var events_ = {};
    for (var i = 0; i < events.length; i++)
      events_[events[i]] = true;

    indexConstructor = constructors[indexId] = BaseClass.subclass({
      /** @cut */ indexName: BaseClass.className.split('.').pop(),
      indexId: indexId,
      updateEvents: events_,
      valueGetter: getter
    });
    indexConstructor.indexId = indexId;
  }

  return indexConstructor;
}

module.exports = function createIndexConstructor(IndexClass, defGetter){
  return function create(source, events, getter){
    // should return factory if source is factory
    if (basis.fn.isFactory(source))
    {
      var factory = source;
      return chainValueFactory(function(target){
        return create(factory(target), events, getter, true);
      });
    }

    if (typeof source == 'function' || typeof source == 'string')
    {
      getter = events;
      events = source;
      source = null;
    }

    if (!getter)
    {
      getter = events;
      events = '';
    }

    var indexConstructor = getIndexConstructor(IndexClass, events, getter || defGetter);

    if (!source)
      return indexConstructor;

    if (source instanceof ReadOnlyDataset ||
        source instanceof DatasetWrapper)
    {
      var index = Index.getDatasetIndex(source, indexConstructor);
      index.explicit = true;
      return index;
    }

    if (source.bindingBridge)
    {
      var indexWrapper = source[indexConstructor.indexId];

      if (!indexWrapper)
      {
        indexWrapper = new IndexWrapper(source, indexConstructor);
        source[indexConstructor.indexId] = indexWrapper;
        indexWrapper.addHandler(SOURCE_INDEXWRAPPER_HANDLER, indexConstructor);
      }

      return indexWrapper;
    }

    /** @cut */ basis.dev.warn(IndexClass.className + ': wrong source value for index (should be instance of basis.data.ReadOnlyDataset, basis.data.DatasetWrapper or bb-value)');
    return null;
  };
};
