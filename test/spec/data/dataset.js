module.exports = {
  name: 'basis.data datasets',

  init: function(){
    basis.require('basis.event');
    basis.require('basis.data');
    basis.require('basis.data.dataset');

    (function(){
      var eventTypeFilter = function(event){ return event.type == this; };
      var proto = basis.event.Emitter.prototype;
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

    var DataObject = basis.data.Object;
    var Dataset = basis.data.Dataset;
    var SourceDataset = basis.data.dataset.SourceDataset;
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

            var items = basis.data.wrap(basis.array.create(10, function(i){ return i <= 5 ? i : 100; }), true);
            var dataset = new basis.data.Dataset({
              items: items
            });

            var subset = new basis.data.dataset.Filter({
              source: dataset,
              rule: function(obj){
                return obj.data.value % 2;
              }
            });

            var slice = new basis.data.dataset.Slice({
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

            basis.data.Dataset.setAccumulateState(true);
            items[6].update({ value: 3 });
            items[5].update({ value: 100 });
            basis.data.Dataset.setAccumulateState(false);

            this.is(0, insertDoubles);
            this.is(0, deleteDoubles);
          }
        },
        {
          name: 'accumulate events and updates',
          test: function(){
            var inserted = [];
            var deleted = [];
            var insertDoubles = 0;
            var deleteDoubles = 0;

            var items = basis.data.wrap(basis.array.create(10, function(i){ return i <= 5 ? i : 100; }), true);
            var dataset = new basis.data.Dataset({
              items: items
            });

            var subset = new basis.data.dataset.Filter({
              source: dataset,
              rule: function(obj){
                return obj.data.value % 2;
              }
            });

            var slice = new basis.data.dataset.Slice({
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

            basis.data.Dataset.setAccumulateState(true);
            items[5].update({ value: 100 });
            items[6].update({ value: 3 });
            basis.data.Dataset.setAccumulateState(false);

            this.is(0, insertDoubles);
            this.is(0, deleteDoubles);
          }
        },
        {
          name: 'merge insert events',
          test: function(){
            var dataset = new basis.data.Dataset();

            basis.data.Dataset.setAccumulateState(true);
            dataset.add(new basis.data.Object());
            assert(dataset.getItems().length == 0);
            dataset.add(new basis.data.Object());
            assert(dataset.getItems().length == 0);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 2);

            basis.data.Dataset.setAccumulateState(true);
            dataset.add(new basis.data.Object());
            assert(dataset.getItems().length == 2);
            dataset.add(new basis.data.Object());
            assert(dataset.getItems().length == 2);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 4);
          }
        },
        {
          name: 'merge inserted->deleted events',
          test: function(){
            var dataset = new basis.data.Dataset();
            var a = new basis.data.Object();
            var b = new basis.data.Object();
            var c = new basis.data.Object();

            basis.data.Dataset.setAccumulateState(true);
            dataset.add([a, b, c]);
            assert(dataset.getItems().length == 0);
            dataset.remove([a, c]);
            assert(dataset.getItems().length == 0);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 1);
            assert(dataset.has(b));
            assert(dataset.pick() === b);

            basis.data.Dataset.setAccumulateState(true);
            dataset.add([a, b, c]);
            assert(dataset.getItems().length == 1);
            dataset.remove(b);
            assert(dataset.getItems().length == 1);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 2);
            assert(dataset.has(a));
            assert(dataset.has(c));
          }
        },
        {
          name: 'merge deleted->inserted events',
          test: function(){
            var a = new basis.data.Object();
            var b = new basis.data.Object();
            var c = new basis.data.Object();
            var dataset = new basis.data.Dataset({
              items: [a, b, c]
            });

            basis.data.Dataset.setAccumulateState(true);
            dataset.remove([a, b, c]);
            assert(dataset.getItems().length == 3);
            dataset.add([b]);
            assert(dataset.getItems().length == 3);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 1);
            assert(dataset.has(b));
            assert(dataset.pick() === b);

            basis.data.Dataset.setAccumulateState(true);
            dataset.remove(b);
            assert(dataset.getItems().length == 1);
            dataset.add([a, c]);
            assert(dataset.getItems().length == 1);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 2);
            assert(dataset.has(a));
            assert(dataset.has(c));
          }
        },
        {
          name: 'mixed events flush on third',
          test: function(){
            var a = new basis.data.Object();
            var b = new basis.data.Object();
            var c = new basis.data.Object();
            var d = new basis.data.Object();
            var dataset = new basis.data.Dataset({ items: [d] });

            basis.data.Dataset.setAccumulateState(true);
            dataset.add([a, b, c]);
            assert(dataset.getItems().length == 1);
            dataset.remove([a, d]);
            assert(dataset.getItems().length == 1);
            dataset.add(a);
            assert(dataset.getItems().length == 3);
            dataset.add(c);
            assert(dataset.getItems().length == 3);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 3);

            ///

            var dataset = new basis.data.Dataset({
              items: [a, b, c]
            });

            basis.data.Dataset.setAccumulateState(true);
            dataset.remove([a, b, c]);
            assert(dataset.getItems().length == 3);
            dataset.add([a, d]);
            assert(dataset.getItems().length == 3);
            dataset.remove(a);
            assert(dataset.getItems().length == 1);
            dataset.remove(d);
            assert(dataset.getItems().length == 1);
            basis.data.Dataset.setAccumulateState(false);

            assert(dataset.getItems().length == 0);
          }
        },
        {
          name: 'edge cases: empty inserted/deleted on mixed events should not to flush',
          test: [
            {
              name: 'edge case: empty inserted/deleted on mixed events should not to flush',
              test: function(){
                var dataset = new basis.data.Dataset();
                var a = new basis.data.Object();
                var b = new basis.data.Object();
                var c = new basis.data.Object();

                basis.data.Dataset.setAccumulateState(true);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 0);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 0);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 0);
                basis.data.Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 3);

                ///

                var dataset = new basis.data.Dataset({
                  items: [a, b, c]
                });

                basis.data.Dataset.setAccumulateState(true);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 3);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 3);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 3);
                basis.data.Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 0);
              }
            },
            {
              name: 'edge case: empty inserted/deleted on mixed events -> no events',
              test: function(){
                var dataset = new basis.data.Dataset();
                var a = new basis.data.Object();
                var b = new basis.data.Object();
                var c = new basis.data.Object();

                basis.data.Dataset.setAccumulateState(true);
                dataset.add([a, b, c]);
                assert(dataset.getItems().length == 0);
                dataset.remove(a);
                assert(dataset.getItems().length == 0);
                dataset.remove(b);
                assert(dataset.getItems().length == 0);
                dataset.remove(c);
                basis.data.Dataset.setAccumulateState(false);

                assert(dataset.getItems().length == 0);
                assert(eventCount(dataset, 'itemsChanged') == 0);

                ///

                var dataset = new basis.data.Dataset({
                  items: [a, b, c]
                });

                basis.data.Dataset.setAccumulateState(true);
                dataset.remove([a, b, c]);
                assert(dataset.getItems().length == 3);
                dataset.add(a);
                assert(dataset.getItems().length == 3);
                dataset.add(b);
                assert(dataset.getItems().length == 3);
                dataset.add(c);
                basis.data.Dataset.setAccumulateState(false);

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
              log: function(){
                log.push(basis.data.resolveDataset({}, function(){}, val));
              }
            };
            var dataset = new basis.data.Dataset();
            var adopted = basis.data.resolveDataset(obj, obj.log, dataset, 'test');

            this.is(true, adopted === dataset);
            this.is(false, 'test' in obj);
            this.is([], log);

            adopted = basis.data.resolveDataset(obj, obj.log, null, 'test');

            this.is(true, adopted === null);
            this.is(false, 'test' in obj);
            this.is([], log);
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
                  value: basis.data.resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new basis.data.Dataset();
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var adopted = basis.data.resolveDataset(obj, obj.log, datasetWrapper, 'test');

            this.is(true, adopted === dataset);
            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === datasetWrapper);
            this.is([], log);

            // change wrapper's dataset should add record to log
            dataset = new basis.data.Dataset();
            datasetWrapper.setDataset(dataset);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === datasetWrapper);
            this.is(1, log.length);
            this.is(obj, log[0].context);
            this.is(true, log[0].value === dataset);

            // reset dataset
            datasetWrapper.setDataset();

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === datasetWrapper);
            this.is(2, log.length);
            this.is(obj, log[1].context);
            this.is(true, log[1].value === null);

            // clean up
            adopted = basis.data.resolveDataset(obj, obj.log, null, 'test');

            this.is(true, adopted === null);
            this.is(null, obj.test);
            this.is(2, log.length);

            // change wrapper's dataset should change nothing
            datasetWrapper.setDataset(new basis.data.Dataset());

            this.is(null, obj.test);
            this.is(2, log.length);
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
                  value: basis.data.resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new basis.data.Dataset();
            var value = new basis.data.Value({ value: dataset });
            var adopted = basis.data.resolveDataset(obj, obj.log, value, 'test');

            this.is(true, adopted === dataset);
            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is([], log);

            // change wrapper's dataset should add record to log
            dataset = new basis.data.Dataset();
            value.set(dataset);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(1, log.length);
            this.is(obj, log[0].context);
            this.is(true, log[0].value === dataset);

            // reset dataset
            value.set(null);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(2, log.length);
            this.is(obj, log[1].context);
            this.is(true, log[1].value === null);

            // clean up
            adopted = basis.data.resolveDataset(obj, obj.log, null, 'test');

            this.is(true, adopted === null);
            this.is(null, obj.test);
            this.is(2, log.length);

            // change wrapper's dataset should change nothing
            value.set(new basis.data.Dataset());

            this.is(null, obj.test);
            this.is(2, log.length);
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
                  value: basis.data.resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new basis.data.Dataset();
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var value = new basis.data.Value({ value: datasetWrapper });
            var adopted = basis.data.resolveDataset(obj, obj.log, value, 'test');

            this.is(true, adopted === dataset);
            this.is(true, 'test' in obj);
            this.is([], log);

            // reset dataset
            datasetWrapper.setDataset();

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(1, log.length);
            this.is(obj, log[0].context);
            this.is(null, log[0].value);

            // change wrapper's dataset should add record to log
            dataset = new basis.data.Dataset();
            datasetWrapper.setDataset(dataset);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(2, log.length);
            this.is(obj, log[1].context);
            this.is(true, log[1].value === dataset);

            // clean up
            adopted = basis.data.resolveDataset(obj, obj.log, null, 'test');

            this.is(true, adopted === null);
            this.is(null, obj.test);
            this.is(2, log.length);

            // change wrapper's dataset should change nothing
            datasetWrapper.setDataset(new basis.data.Dataset());

            this.is(null, obj.test);
            this.is(2, log.length);
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
                  value: basis.data.resolveDataset({}, function(){}, val)
                });
              }
            };
            var dataset = new basis.data.Dataset();
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var value = new basis.data.Value({ value: datasetWrapper });
            var adopted = basis.data.resolveDataset(obj, obj.log, value, 'test');

            this.is(true, adopted === dataset);
            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is([], log);

            // change wrapper's dataset should add record to log
            dataset = new basis.data.Dataset();
            value.set(dataset);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(1, log.length);
            this.is(obj, log[0].context);
            this.is(true, log[0].value === dataset);

            // reset dataset
            value.set(null);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(2, log.length);
            this.is(obj, log[1].context);
            this.is(null, log[1].value);

            // set dataset wrapper
            value.set(datasetWrapper);

            this.is(true, 'test' in obj);
            this.is(true, 'test' in obj && obj.test.source === value);
            this.is(3, log.length);
            this.is(obj, log[2].context);
            this.is(true, log[2].value === datasetWrapper.dataset);

            // clean up
            adopted = basis.data.resolveDataset(obj, obj.log, null, 'test');

            this.is(true, adopted === null);
            this.is(null, obj.test);
            this.is(3, log.length);

            // change wrapper's dataset should change nothing
            datasetWrapper.setDataset(new basis.data.Dataset());
            value.set(new basis.data.Dataset());

            this.is(null, obj.test);
            this.is(3, log.length);
          }
        },
        {
          name: 'common use-case of resolveDataset usage',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = basis.data.resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new basis.data.Dataset();
            var anotherDataset = new basis.data.Dataset();
            var value = new basis.data.Value({ value: dataset });

            obj.setDataset(value);
            this.is(true, obj.dataset === dataset);
            this.is(true, obj.test.source === value);

            value.set(null);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test.source === value);

            value.set(new basis.data.DatasetWrapper({ dataset: anotherDataset }));
            this.is(true, obj.dataset === anotherDataset);
            this.is(true, obj.test.source === value);

            value.value.setDataset(null);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test.source === value);
          }
        },
        {
          name: 'common use-case of resolveDataset usage long chain',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = basis.data.resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new basis.data.Dataset();
            var datasetWrapper1 = new basis.data.DatasetWrapper({ dataset: dataset });
            var value1 = new basis.data.Value({ value: datasetWrapper1 });
            var datasetWrapper2 = new basis.data.DatasetWrapper({ dataset: value1 });
            var value2 = new basis.data.Value({ value: datasetWrapper2 });

            obj.setDataset(value2);
            this.is(true, obj.dataset === dataset);
            this.is(true, obj.test.source === value2);

            value1.set(null);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test.source === value2);

            value2.set(datasetWrapper1);
            this.is(true, obj.dataset === dataset);
            this.is(true, obj.test.source === value2);

            value2.value.setDataset(null);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test.source === value2);
          }
        },
        {
          name: 'use function as value for resolveDataset',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = basis.data.resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new basis.data.Dataset();

            obj.setDataset(function(){
              return dataset;
            });
            this.is(true, obj.dataset === dataset);
            this.is(false, 'test' in obj);
          }
        },
        {
          name: 'use basis.Token as value for resolveDataset',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = basis.data.resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var dataset = new basis.data.Dataset();
            var dataset2 = new basis.data.Dataset();
            var token = new basis.Token(dataset);

            obj.setDataset(token);
            this.is(true, obj.dataset === dataset);
            this.is(true, obj.test.source === token);

            token.set(dataset2);
            this.is(true, obj.dataset === dataset2);
            this.is(true, obj.test.source === token);

            token.set(null);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test.source === token);

            token.set(dataset2);
            this.is(true, obj.dataset === dataset2);
            this.is(true, obj.test.source === token);

            obj.setDataset(null);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test === null);

            token.set(dataset);
            this.is(true, obj.dataset === null);
            this.is(true, obj.test === null);
          }
        },
        {
          name: 'use basis.data.Value#as as value for resolveDataset',
          test: function(){
            var obj = {
              setDataset: function(val){
                this.dataset = basis.data.resolveDataset(this, this.setDataset, val, 'test');
              }
            };
            var split = new basis.data.dataset.Split();
            var selected = new basis.data.Value({ value: 'foo' });

            obj.setDataset(selected.as(function(val){
              return split.getSubset(val, true);
            }));

            this.is(true, obj.dataset === split.getSubset('foo', true).dataset);
            this.is(true, obj.dataset === basis.data.resolveDataset({}, null, split.getSubset('foo', true)));

            selected.set('bar');
            this.is(true, obj.dataset === split.getSubset('bar', true).dataset);
            this.is(true, obj.dataset === basis.data.resolveDataset({}, null, split.getSubset('bar', true)));
          }
        }
      ]
    }
  ]
};
