
 /**
  * @see ./demo/defile/data_index.html
  * @namespace basis.data.index
  */

  var Index = require('./index/Index.js');
  var VectorIndex = require('./index/VectorIndex.js');
  var IndexWrapper = require('./index/IndexWrapper.js');
  var IndexMap = require('./index/IndexMap.js');
  var IndexedCalc = require('./index/IndexedCalc.js');
  var createIndexConstructor = require('./index/constructor.js');

  var Count = require('./index/Count.js');
  var Sum = require('./index/Sum.js');
  var Avg = require('./index/Avg.js');
  var Min = require('./index/Min.js');
  var Max = require('./index/Max.js');
  var Distinct = require('./index/Distinct.js');


  //
  // Some presets
  //

  var count = createIndexConstructor(Count, basis.fn.$true);
  var sum = createIndexConstructor(Sum);
  var avg = createIndexConstructor(Avg);
  var min = createIndexConstructor(Min);
  var max = createIndexConstructor(Max);
  var distinct = createIndexConstructor(Distinct);

  function percentOfRange(events, getter){
    var minIndex = IndexedCalc.getId('min');
    var maxIndex = IndexedCalc.getId('max');
    var indexes = {};

    indexes[minIndex] = min(events, getter);
    indexes[maxIndex] = max(events, getter);
    getter = basis.getter(getter || events);

    return new IndexedCalc(indexes, function(data, indexes, object){
      return (getter(object) - indexes[minIndex]) / (indexes[maxIndex] - indexes[minIndex]);
    });
  }

  function percentOfMax(events, getter){
    var maxIndex = IndexedCalc.getId('max');
    var indexes = {};

    indexes[maxIndex] = max(events, getter);
    getter = basis.getter(getter || events);

    return new IndexedCalc(indexes, function(data, indexes, object){
      return getter(object) / indexes[maxIndex];
    });
  }

  function percentOfSum(getter, events){
    var sumIndex = IndexedCalc.getId('sum');
    var indexes = {};

    indexes[sumIndex] = sum(events, getter);
    getter = basis.getter(getter || events);

    return new IndexedCalc(indexes, function(data, indexes, object){
      return getter(object) / indexes[sumIndex];
    });
  }


  //
  // export names
  //

  module.exports = {
    Index: Index,
    VectorIndex: VectorIndex,
    IndexWrapper: IndexWrapper,

    getDatasetIndex: Index.getDatasetIndex,
    removeDatasetIndex: Index.removeDatasetIndex,

    Count: Count,
    Sum: Sum,
    Avg: Avg,
    Min: Min,
    Max: Max,
    Distinct: Distinct,

    createIndexConstructor: createIndexConstructor,
    count: count,
    sum: sum,
    avg: avg,
    max: max,
    min: min,
    distinct: distinct,

    CalcIndexPreset: IndexedCalc,
    percentOfRange: percentOfRange,
    percentOfMax: percentOfMax,
    percentOfSum: percentOfSum,

    IndexMap: IndexMap
  };
