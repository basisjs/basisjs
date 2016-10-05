module.exports = {
  name: 'basis.data.dataset.Merge',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var helpers = basis.require('./helpers/dataset.js');
    var range = helpers.range;
    var generate = helpers.generate;
    var cmpDS = helpers.cmpDS;
    var checkValues = helpers.checkValues;
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var ReadOnlyDataset = basis.require('basis.data').ReadOnlyDataset;
    var Value = basis.require('basis.data').Value;
    var DataObject = basis.require('basis.data').Object;
    var Dataset = basis.require('basis.data').Dataset;
    var Merge = basis.require('basis.data.dataset').Merge;

    var eventInfo = {};
    Merge.prototype.debug_emit = function(event){
      var sender = event.sender;
      if (!eventInfo[sender.basisObjectId])
        eventInfo[sender.basisObjectId] = {};
      eventInfo[sender.basisObjectId][event.type] =
        (eventInfo[sender.basisObjectId][event.type] || 0) + 1;
    };

    function eventCount(instance, eventName){
      var info = eventInfo[instance.basisObjectId];
      return info && info[eventName] || 0;
    }
  },

  test: [
    {
      name: 'create',
      test: [
        {
          name: 'with no sources',
          test: function(){
            var merge = new Merge();

            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'with 1 dataset as source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset
              ]
            });

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'with 2 datasets as sources',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var merge = new Merge({
              sources: [
                dataset1,
                dataset2
              ]
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 10);
            assert(merge.sources.length == 2);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with 2 same sources',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset,
                dataset
              ]
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.getSourceValues().length == 1);
            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with value as source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with 2 same value as source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value,
                value
              ]
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.getSourceValues().length == 1);
            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with 2 same value and 2 same dataset as sources',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value,
                dataset,
                value,
                dataset
              ]
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.getSourceValues().length == 2);
            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'create with wrong values',
          test: function(){
            var merge;

            var warnings = catchWarnings(function(){
              merge = new Merge({
                sources: [
                  null,
                  123
                ]
              });
            });

            assert(eventCount(merge, 'sourcesChanged') == 0);
            assert(warnings.length == 2);
            assert(merge.getSourceValues().length == 0);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        }
      ]
    },
    {
      name: 'addSource',
      test: [
        {
          name: 'add dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge();

            merge.addSource(dataset);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'add existing dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset
              ]
            });

            merge.addSource(dataset);
            merge.addSource(dataset);

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.getSourceValues().length == 1);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'add value',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge();

            merge.addSource(value);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'add wrong values',
          test: function(){
            var merge = new Merge();

            var warnings = catchWarnings(function(){
              merge.addSource(null);
              merge.addSource(123);
            });

            assert(eventCount(merge, 'sourcesChanged') == 0);
            assert(warnings.length == 2);
            assert(merge.getSourceValues().length == 0);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'add value and dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            merge.addSource(dataset);
            merge.addSource(value);

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.getSourceValues().length == 2);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        }
      ]
    },
    {
      name: 'change resolving values',
      test: [
        {
          name: 'add dataset',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var value1 = new Value({ value: dataset1 });
            var value2 = new Value({ value: dataset2 });
            var merge = new Merge();

            merge.addSource(value1);
            merge.addSource(value2);

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 2);

            // change value1 -> null
            // removes items of dataset1 from merge
            value1.set(null);

            assert(eventCount(merge, 'sourcesChanged') == 3);
            assert(merge.itemCount == 5);
            assert(checkValues(merge, range(6, 10)) == false);
            assert(merge.sources.length == 1);

            // change value1 -> dataset2
            // nothing happen
            value1.set(dataset2);

            assert(eventCount(merge, 'sourcesChanged') == 3);
            assert(merge.itemCount == 5);
            assert(checkValues(merge, range(6, 10)) == false);
            assert(merge.sources.length == 1);

            // change value2 -> dataset1
            // adds items from dataset1
            value2.set(dataset1);

            assert(eventCount(merge, 'sourcesChanged') == 4);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 2);
          }
        },
        {
          name: 'destroy dataset that value points on',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);

            // destroy dataset
            dataset.destroy();

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);

            // set new dataset to value
            value.set(new Dataset({ items: generate(1, 10) }));

            assert(eventCount(merge, 'sourcesChanged') == 3);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
          }
        },
        {
          name: 'destroy dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset
              ]
            });

            // destroy dataset
            dataset.destroy();

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.getSourceValues().length == 0);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'destroy dataset after remove from source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset
              ]
            });

            // remove dataset
            merge.removeSource(dataset);
            merge.destroy();

            // destroy dataset
            var warnings = catchWarnings(function(){
              dataset.destroy();
            });

            assert(warnings == false);
          }
        },
        {
          name: 'destroy value',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            // destroy dataset
            value.destroy();

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.getSourceValues().length == 0);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'setAccumulateState',
          beforeEach: function(){
            var foo = new DataObject({ data: { text: 'foo' } });
            var bar = new DataObject({ data: { text: 'bar' } });

            var fooDataset = new Dataset({
              items: [
                foo
              ]
            });
            var barDataset = new Dataset({
              items: [
                bar
              ]
            });
          },
          test: [
            {
              name: 'create merge in accumulate state',
              test: function(){
                Dataset.setAccumulateState(true);
                var merge = new Merge({
                  sources: [
                    fooDataset,
                    barDataset
                  ]
                });
                Dataset.setAccumulateState(false);

                assert(merge.itemCount === 2);
                assert(merge.has(foo) === true);
                assert(merge.has(bar) === true);
              },
            },
            {
              name: 'create merge and delete items in accumulate state',
              test: function(){
                Dataset.setAccumulateState(true);
                var merge = new Merge({
                  sources: [
                    fooDataset,
                    barDataset
                  ]
                });
                merge.setRule(Merge.INTERSECTION);
                Dataset.setAccumulateState(false);

                assert(merge.itemCount === 0);
                assert(merge.has(foo) === false);
                assert(merge.has(bar) === false);
              },
            },
            {
              name: 'create merge and change rules in accumulate state',
              test: function(){
                var merge = new Merge({
                  sources: [
                    fooDataset,
                    barDataset
                  ]
                });

                Dataset.setAccumulateState(true);
                merge.setRule(Merge.INTERSECTION);
                merge.setRule(Merge.UNION);
                Dataset.setAccumulateState(false);

                assert(merge.itemCount === 2);
                assert(merge.has(foo) === true);
                assert(merge.has(bar) === true);
              }
            },
            {
              name: 'add and remove in accumulate state',
              test: function(){
                var merge = new Merge({
                  sources: [
                    fooDataset,
                    barDataset
                  ]
                });
                var baz = new DataObject({ data: { text: 'baz' } });

                Dataset.setAccumulateState(true);
                fooDataset.add(baz);
                fooDataset.remove(foo);
                Dataset.setAccumulateState(false);

                assert(merge.itemCount === 2);
                assert(merge.has(foo) === false);
                assert(merge.has(bar) === true);
                assert(merge.has(baz) === true);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'removeSource',
      test: [
        {
          name: 'remove dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset
              ]
            });

            merge.removeSource(dataset);

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'remove dataset added twice',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({
              sources: [
                dataset,
                dataset
              ]
            });

            merge.removeSource(dataset);

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'remove non-existing dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({});

            var warnings = catchWarnings(function(){
              merge.removeSource(dataset);
            });

            assert(eventCount(merge, 'sourcesChanged') == 0);
            assert(warnings.length == 1);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'try to remove resolved dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            var warnings = catchWarnings(function(){
              merge.removeSource(dataset);
            });

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(warnings.length == 1);
            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'remove value',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value,
                value
              ]
            });

            merge.removeSource(value);

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        }
      ]
    },
    {
      name: 'setSources/clear',
      test: [
        {
          name: 'with 2 datasets as sources',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var merge = new Merge();

            merge.setSources([
              dataset1,
              dataset2
            ]);

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 2);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'replace 2 datasets for new 2 datasets',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var dataset3 = new Dataset({ items: generate(11, 15) });
            var dataset4 = new Dataset({ items: generate(16, 20) });
            var merge = new Merge();

            merge.setSources([
              dataset1,
              dataset2
            ]);

            merge.setSources([
              dataset3,
              dataset4
            ]);

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 2);
            assert(checkValues(merge, range(11, 20)) == false);
          }
        },
        {
          name: 'with 2 token that resolves to various datasets',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var value1 = new basis.Token(dataset1);
            var value2 = new basis.Token(dataset2);
            var merge = new Merge();

            merge.setSources([
              value1,
              value2
            ]);

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 2);
            assert(merge.getSourceValues().length == 2);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with 2 values that resolves to various datasets',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var value1 = new Value({ value: dataset1 });
            var value2 = new Value({ value: dataset2 });
            var merge = new Merge();

            merge.setSources([
              value1,
              value2
            ]);

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 10);
            assert(merge.sources.length == 2);
            assert(merge.getSourceValues().length == 2);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'mixed 2 values that resolves to one dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 5) });
            var value = new Value({ value: dataset });
            var merge = new Merge();

            merge.setSources([
              dataset,
              value
            ]);

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 5);
            assert(merge.sources.length == 1);
            assert(merge.getSourceValues().length == 2);
            assert(checkValues(merge, range(1, 5)) == false);
          }
        },
        {
          name: 'set the same but via another value',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 5) });
            var value1 = new Value({ value: dataset });
            var value2 = new Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value1
              ]
            });

            merge.setSources([
              value2
            ]);

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 5);
            assert(merge.sources.length == 1);
            assert(merge.getSourceValues().length == 1);
            assert(checkValues(merge, range(1, 5)) == false);

            merge.setSources([
              dataset
            ]);

            assert(eventCount(merge, 'sourcesChanged') == 1);
            assert(merge.itemCount == 5);
            assert(merge.sources.length == 1);
            assert(merge.getSourceValues().length == 1);
            assert(checkValues(merge, range(1, 5)) == false);
          }
        },
        {
          name: 'call with no value should clear dataset',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var merge = new Merge({
              sources: [
                dataset1,
                dataset2
              ]
            });

            merge.setSources();

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
            assert(merge.getSourceValues().length == 0);
          }
        },
        {
          name: 'call with empty array should clear dataset',
          test: function(){
            var dataset1 = new Dataset({ items: generate(1, 5) });
            var dataset2 = new Dataset({ items: generate(6, 10) });
            var merge = new Merge({
              sources: [
                dataset1,
                dataset2
              ]
            });

            merge.setSources([]);

            assert(eventCount(merge, 'sourcesChanged') == 2);
            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
            assert(merge.getSourceValues().length == 0);
          }
        }
      ]
    }
  ]
};
