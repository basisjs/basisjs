module.exports = {
  name: 'basis.data datasets',

  init: function(){
    var dataWrap = basis.require('basis.data').wrap;
    var Value = basis.require('basis.data').Value;
    var DataObject = basis.require('basis.data').Object;
    var Dataset = basis.require('basis.data').Dataset;
    var DatasetWrapper = basis.require('basis.data').DatasetWrapper;
    var resolveDataset = basis.require('basis.data').resolveDataset;
    var SourceDataset = basis.require('basis.data.dataset').SourceDataset;
    var Filter = basis.require('basis.data.dataset').Filter;
    var Slice = basis.require('basis.data.dataset').Slice;
    var Split = basis.require('basis.data.dataset').Split;


    (function(){
      var eventTypeFilter = function(event){
        return event.type == this;
      };
      var proto = basis.require('basis.event').Emitter.prototype;
      var eventsMap = {};
      var seed = 1;

      proto.debug_emit = function(event){
        if (!this.testEventId_)
        {
          this.testEventId_ = seed++;
          eventsMap[this.testEventId_] = [];
        }

        eventsMap[this.testEventId_].push(event);
      };

      window.getEvents = function(object, type){
        var events = eventsMap[object.testEventId_];

        if (events && type)
          events = events.filter(eventTypeFilter, type);

        return events;
      };

      window.eventCount = function(object, type){
        var events = getEvents(object, type);

        return events ? events.length : 0;
      };

      window.getLastEvent = function(object, type){
        var events = getEvents(object, type);

        return events && events[events.length - 1];
      };
    })();
  },

  test: [
    {
      name: 'Accumulate events',
      test: [
        {
          name: 'accumulate events and updates',
          test: function(){
            var inserted = [];
            var deleted = [];
            var insertDoubles = 0;
            var deleteDoubles = 0;

            var items = dataWrap(basis.array.create(10, function(i){
              return i <= 5 ? i : 100;
            }), true);
            var dataset = new Dataset({
              items: items
            });

            var subset = new Filter({
              source: dataset,
              rule: function(obj){
                return obj.data.value % 2;
              }
            });

            var slice = new Slice({
              source: subset,
              rule: 'data.value',
              handler: {
                itemsChanged: function(sender, delta){
                  if (delta.inserted)
                    for (var i = 0; i < delta.inserted.length; i++)
                      insertDoubles += !basis.array.add(inserted, delta.inserted[i]);

                  if (delta.deleted)
                    for (var i = 0; i < delta.deleted.length; i++)
                      deleteDoubles += !basis.array.add(deleted, delta.deleted[i]);
                }
              }
            });

            Dataset.setAccumulateState(true);
            items[6].update({ value: 3 });
            items[5].update({ value: 100 });
            Dataset.setAccumulateState(false);

            assert(insertDoubles === 0);
            assert(deleteDoubles === 0);
          }
        },
        {
          name: 'accumulate events and updates',
          test: function(){
            var inserted = [];
            var deleted = [];
            var insertDoubles = 0;
            var deleteDoubles = 0;

            var items = dataWrap(basis.array.create(10, function(i){
              return i <= 5 ? i : 100;
            }), true);
            var dataset = new Dataset({
              items: items
            });

            var subset = new Filter({
              source: dataset,
              rule: function(obj){
                return obj.data.value % 2;
              }
            });

            var slice = new Slice({
              source: subset,
              rule: 'data.value',
              handler: {
                itemsChanged: function(sender, delta){
                  if (delta.inserted)
                    for (var i = 0; i < delta.inserted.length; i++)
                      insertDoubles += !basis.array.add(inserted, delta.inserted[i]);

                  if (delta.deleted)
                    for (var i = 0; i < delta.deleted.length; i++)
                      deleteDoubles += !basis.array.add(deleted, delta.deleted[i]);
                }
              }
            });

            Dataset.setAccumulateState(true);
            items[5].update({ value: 100 });
            items[6].update({ value: 3 });
            Dataset.setAccumulateState(false);

            assert(insertDoubles === 0);
            assert(deleteDoubles === 0);
          }
        },
        {
          name: 'merge insert events',
          test: function(){
            var dataset = new Dataset();

            Dataset.setAccumulateState(true);
            dataset.add(new DataObject());
            assert(dataset.getItems().length == 0);
            dataset.add(new DataObject());
            assert(dataset.getItems().length == 0);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 2);

            Dataset.setAccumulateState(true);
            dataset.add(new DataObject());
            assert(dataset.getItems().length == 2);
            dataset.add(new DataObject());
            assert(dataset.getItems().length == 2);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 4);
          }
        },
        {
          name: 'merge inserted->deleted events',
          test: function(){
            var dataset = new Dataset();
            var a = new DataObject();
            var b = new DataObject();
            var c = new DataObject();

            Dataset.setAccumulateState(true);
            dataset.add([a, b, c]);
            assert(dataset.getItems().length == 0);
            dataset.remove([a, c]);
            assert(dataset.getItems().length == 0);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 1);
            assert(dataset.has(b));
            assert(dataset.pick() === b);

            Dataset.setAccumulateState(true);
            dataset.add([a, b, c]);
            assert(dataset.getItems().length == 1);
            dataset.remove(b);
            assert(dataset.getItems().length == 1);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 2);
            assert(dataset.has(a));
            assert(dataset.has(c));
          }
        },
        {
          name: 'merge deleted->inserted events',
          test: function(){
            var a = new DataObject();
            var b = new DataObject();
            var c = new DataObject();
            var dataset = new Dataset({
              items: [a, b, c]
            });

            Dataset.setAccumulateState(true);
            dataset.remove([a, b, c]);
            assert(dataset.getItems().length == 3);
            dataset.add([b]);
            assert(dataset.getItems().length == 3);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 1);
            assert(dataset.has(b));
            assert(dataset.pick() === b);

            Dataset.setAccumulateState(true);
            dataset.remove(b);
            assert(dataset.getItems().length == 1);
            dataset.add([a, c]);
            assert(dataset.getItems().length == 1);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 2);
            assert(dataset.has(a));
            assert(dataset.has(c));
          }
        },
        {
          name: 'mixed events flush on third',
          test: function(){
            var a = new DataObject();
            var b = new DataObject();
            var c = new DataObject();
            var d = new DataObject();
            var dataset = new Dataset({ items: [d] });

            Dataset.setAccumulateState(true);
            dataset.add([a, b, c]);
            assert(dataset.getItems().length == 1);
            dataset.remove([a, d]);
            assert(dataset.getItems().length == 1);
            dataset.add(a);
            assert(dataset.getItems().length == 3);
            dataset.add(c);
            assert(dataset.getItems().length == 3);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 3);

            ///

            var dataset = new Dataset({
              items: [a, b, c]
            });

            Dataset.setAccumulateState(true);
            dataset.remove([a, b, c]);
            assert(dataset.getItems().length == 3);
            dataset.add([a, d]);
            assert(dataset.getItems().length == 3);
            dataset.remove(a);
            assert(dataset.getItems().length == 1);
            dataset.remove(d);
            assert(dataset.getItems().length == 1);
            Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 0);
          }
        },
        {
          name: 'edge cases: empty inserted/deleted on mixed events should not to flush',
          test: [
            {
              name: 'edge case: empty inserted/deleted on mixed events should not to flush',
              test: function(){
                var dataset = new Dataset();
                var a = new DataObject();
                var b = new DataObject();
                var c = new DataObject();

                Dataset.setAccumulateState(true);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 0);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 0);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 0);
                Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 3);

                ///

                var dataset = new Dataset({
                  items: [a, b, c]
                });

                Dataset.setAccumulateState(true);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 3);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 3);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 3);
                Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 0);
              }
            },
            {
              name: 'edge case: empty inserted/deleted on mixed events -> no events',
              test: function(){
                var dataset = new Dataset();
                var a = new DataObject();
                var b = new DataObject();
                var c = new DataObject();

                Dataset.setAccumulateState(true);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 0);
                dataset.remove(a);
                assert(dataset.getItems().length == 0);
                dataset.remove(b);
                assert(dataset.getItems().length == 0);
                dataset.remove(c);
                Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 0);
                assert(eventCount(dataset, 'itemsChanged') == 0);

                ///

                var dataset = new Dataset({
                  items: [a, b, c]
                });

                Dataset.setAccumulateState(true);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 3);
                dataset.add(a);
                assert(dataset.getItems().length == 3);
                dataset.add(b);
                assert(dataset.getItems().length == 3);
                dataset.add(c);
                Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 3);
                assert(eventCount(dataset, 'itemsChanged') == 1); // single event on items add on init
              }
            }
          ]
        }
      ]
    },
    {
      name: 'resolveDataset',
      test: [
        {
          name: 'source dataset/null',
          test: function(){
            var log = [];
            var obj = {
              log: function(value){
                this.value = value;
                log.push(value);
              }
            };
            var dataset = new Dataset();
            var adopted = resolveDataset(obj, obj.log, dataset, 'test');

            assert(adopted === dataset);
            assert('test' in obj === false);
            assert([], log);

            adopted = resolveDataset(obj, obj.log, null, 'test');

            assert(adopted === null);
            assert('test' in obj == false);
            assert([], log);
          }
        },
        {
          name: 'source DatasetWrapper',
          test: function(){
            var log = [];
            var obj = {
              log: function(val){
                log.push({
                  context: this,
                  value: resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new Dataset();
            var datasetWrapper = new DatasetWrapper({ dataset: dataset });
            var adopted = resolveDataset(obj, obj.log, datasetWrapper, 'test');

            assert(adopted === dataset);
            assert('test' in obj);
            assert('test' in obj && obj.test.source === datasetWrapper);
            assert([], log);

            // change wrapper's dataset should add record to log
            dataset = new Dataset();
            datasetWrapper.setDataset(dataset);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === datasetWrapper);
            assert(log.length === 1);
            assert(log[0].context === obj);
            assert(log[0].value === dataset);

            // reset dataset
            datasetWrapper.setDataset();

            assert('test' in obj);
            assert('test' in obj && obj.test.source === datasetWrapper);
            assert(log.length === 2);
            assert(log[1].context === obj);
            assert(log[1].value === null);

            // clean up
            adopted = resolveDataset(obj, obj.log, null, 'test');

            assert(adopted === null);
            assert(obj.test === null);
            assert(log.length == 2);

            // change wrapper's dataset should change nothing
            datasetWrapper.setDataset(new Dataset());

            assert(obj.test === null);
            assert(log.length === 2);
          }
        },
        {
          name: 'source Value',
          test: function(){
            var log = [];
            var obj = {
              log: function(val){
                log.push({
                  context: this,
                  value: resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new Dataset();
            var value = new Value({ value: dataset });
            var adopted = resolveDataset(obj, obj.log, value, 'test');

            assert(adopted === dataset);
            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert([], log);

            // change wrapper's dataset should add record to log
            dataset = new Dataset();
            value.set(dataset);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 1);
            assert(log[0].context === obj);
            assert(log[0].value === dataset);

            // reset dataset
            value.set(null);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 2);
            assert(log[1].context === obj);
            assert(log[1].value === null);

            // clean up
            adopted = resolveDataset(obj, obj.log, null, 'test');

            assert(adopted === null);
            assert(obj.test === null);
            assert(log.length === 2);

            // change wrapper's dataset should change nothing
            value.set(new Dataset());

            assert(obj.test === null);
            assert(log.length === 2);
          }
        },
        {
          name: 'source Value -> DatasetWrapper (wrapper changes)',
          test: function(){
            var log = [];
            var obj = {
              log: function(val){
                log.push({
                  context: this,
                  value: resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new Dataset();
            var datasetWrapper = new DatasetWrapper({ dataset: dataset });
            var value = new Value({ value: datasetWrapper });
            var adopted = resolveDataset(obj, obj.log, value, 'test');

            assert(adopted === dataset);
            assert('test' in obj);
            assert([], log);

            // reset dataset
            datasetWrapper.setDataset();

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 1);
            assert(log[0].context === obj);
            assert(log[0].value === null);

            // change wrapper's dataset should add record to log
            dataset = new Dataset();
            datasetWrapper.setDataset(dataset);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 2);
            assert(log[1].context === obj);
            assert(log[1].value === dataset);

            // clean up
            adopted = resolveDataset(obj, obj.log, null, 'test');

            assert(adopted === null);
            assert(obj.test === null);
            assert(log.length === 2);

            // change wrapper's dataset should change nothing
            datasetWrapper.setDataset(new Dataset());

            assert(obj.test === null);
            assert(log.length === 2);
          }
        },
        {
          name: 'source Value -> DatasetWrapper (value changes)',
          test: function(){
            var log = [];
            var obj = {
              log: function(val){
                log.push({
                  context: this,
                  value: resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new Dataset();
            var datasetWrapper = new DatasetWrapper({ dataset: dataset });
            var value = new Value({ value: datasetWrapper });
            var adopted = resolveDataset(obj, obj.log, value, 'test');

            assert(adopted === dataset);
            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert([], log);

            // change wrapper's dataset should add record to log
            dataset = new Dataset();
            value.set(dataset);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 1);
            assert(log[0].context === obj);
            assert(log[0].value === dataset);

            // reset dataset
            value.set(null);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 2);
            assert(log[1].context === obj);
            assert(log[1].value === null);

            // set dataset wrapper
            value.set(datasetWrapper);

            assert('test' in obj);
            assert('test' in obj && obj.test.source === value);
            assert(log.length === 3);
            assert(log[2].context === obj);
            assert(log[2].value === datasetWrapper.dataset);

            // clean up
            adopted = resolveDataset(obj, obj.log, null, 'test');

            assert(adopted === null);
            assert(obj.test === null);
            assert(log.length === 3);

            // change wrapper's dataset should change nothing
            datasetWrapper.setDataset(new Dataset());
            value.set(new Dataset());

            assert(obj.test === null);
            assert(log.length === 3);
          }
        },
        {
          name: 'common use-case of resolveDataset usage',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new Dataset();
            var anotherDataset = new Dataset();
            var value = new Value({ value: dataset });

            obj.setDataset(value);
            assert(obj.dataset === dataset);
            assert(obj.test.source === value);

            value.set(null);
            assert(obj.dataset === null);
            assert(obj.test.source === value);

            value.set(new DatasetWrapper({ dataset: anotherDataset }));
            assert(obj.dataset === anotherDataset);
            assert(obj.test.source === value);

            value.value.setDataset(null);
            assert(obj.dataset === null);
            assert(obj.test.source === value);
          }
        },
        {
          name: 'common use-case of resolveDataset usage long chain',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new Dataset();
            var datasetWrapper1 = new DatasetWrapper({ dataset: dataset });
            var value1 = new Value({ value: datasetWrapper1 });
            var datasetWrapper2 = new DatasetWrapper({ dataset: value1 });
            var value2 = new Value({ value: datasetWrapper2 });

            obj.setDataset(value2);
            assert(obj.dataset === dataset);
            assert(obj.test.source === value2);

            value1.set(null);
            assert(obj.dataset === null);
            assert(obj.test.source === value2);

            value2.set(datasetWrapper1);
            assert(obj.dataset === dataset);
            assert(obj.test.source === value2);

            value2.value.setDataset(null);
            assert(obj.dataset === null);
            assert(obj.test.source === value2);
          }
        },
        {
          name: 'use function as value for resolveDataset',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new Dataset();

            obj.setDataset(function(){
              return dataset;
            });
            assert(obj.dataset === dataset);
            assert('test' in obj === false);
          }
        },
        {
          name: 'use basis.Token as value for resolveDataset',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new Dataset();
            var dataset2 = new Dataset();
            var token = new basis.Token(dataset);

            obj.setDataset(token);
            assert(obj.dataset === dataset);
            assert(obj.test.source === token);

            token.set(dataset2);
            assert(obj.dataset === dataset2);
            assert(obj.test.source === token);

            token.set(null);
            assert(obj.dataset === null);
            assert(obj.test.source === token);

            token.set(dataset2);
            assert(obj.dataset === dataset2);
            assert(obj.test.source === token);

            obj.setDataset(null);
            assert(obj.dataset === null);
            assert(obj.test === null);

            token.set(dataset);
            assert(obj.dataset === null);
            assert(obj.test === null);
          }
        },
        {
          name: 'use basis.data.Value#as as value for resolveDataset',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var split = new Split();
            var selected = new Value({ value: 'foo' });

            obj.setDataset(selected.as(function(val){
              return split.getSubset(val, true);
            }));

            assert(obj.dataset === split.getSubset('foo', true).dataset);
            assert(obj.dataset === resolveDataset({}, null, split.getSubset('foo', true)));

            selected.set('bar');
            assert(obj.dataset === split.getSubset('bar', true).dataset);
            assert(obj.dataset === resolveDataset({}, null, split.getSubset('bar', true)));
          }
        }
      ]
    }
  ]
};
