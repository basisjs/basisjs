module.exports = {
  name: 'basis.data.dataset.Subtract',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var helpers = basis.require('./helpers/dataset.js');
    var range = helpers.range;
    var generate = helpers.generate;
    var cmpDS = helpers.cmpDS;
    var checkValues = helpers.checkValues;
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var Value = basis.require('basis.data').Value;
    var DataObject = basis.require('basis.data').Object;
    var ReadOnlyDataset = basis.require('basis.data').ReadOnlyDataset;
    var Dataset = basis.require('basis.data').Dataset;
    var Subtract = basis.require('basis.data.dataset').Subtract;

    var eventInfo = {};
    Subtract.prototype.debug_emit = function(event){
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
            var subtract = new Subtract();

            assert(subtract.itemCount == 0);
            assert(subtract.minuend === null);
            assert(subtract.subtrahend === null);
          }
        },
        {
          name: 'with no subtrahend',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var subtract = new Subtract({
              minuend: dataset
            });

            assert(subtract.itemCount == 0);
            assert(subtract.minuend !== null);
            assert(subtract.subtrahend === null);
          }
        },
        {
          name: 'with no minuend',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var subtract = new Subtract({
              subtrahend: dataset
            });

            assert(subtract.itemCount == 0);
            assert(subtract.minuend === null);
            assert(subtract.subtrahend !== null);
          }
        },
        {
          name: 'with both operand',
          test: function(){
            var items = generate(0, 10);
            var minuend = new Dataset({ items: items.slice(0, 6) });
            var subtrahend = new Dataset({ items: items.slice(3, 10) });
            var subtract = new Subtract({
              minuend: minuend,
              subtrahend: subtrahend
            });

            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend !== null);
            assert(subtract.subtrahend !== null);
          }
        },
        {
          name: 'with both operand with same dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 6) });
            var subtract = new Subtract({
              minuend: dataset,
              subtrahend: dataset
            });

            assert(subtract.itemCount == 0);
          }
        },
        {
          name: 'with both operand as not a dataset',
          test: function(){
            var items = generate(0, 8);
            var dataset = new Dataset({ items: items.slice(0, 6) });
            var value = new Value({ value: dataset });
            var token = new basis.Token(new Dataset({ items: items.slice(3, 8) }));
            var subtract = new Subtract({
              minuend: value,
              subtrahend: token
            });

            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
          }
        }
      ]
    },
    {
      name: 'change operands',
      test: [
        {
          name: 'the same dataset for both operands, change dataset',
          test: function(){
            var dataset = new Dataset();
            var subtract = new Subtract({
              minuend: dataset,
              subtrahend: dataset
            });

            assert(eventCount(subtract, 'itemsChanged') == 0);

            dataset.add(new DataObject());

            assert(eventCount(subtract, 'itemsChanged') == 0);
          }
        },
        {
          name: 'the same dataset for both operands, destroy dataset',
          test: function(){
            var dataset = new Dataset();
            var subtract = new Subtract({
              minuend: dataset,
              subtrahend: dataset
            });

            assert(eventCount(subtract, 'itemsChanged') == 0);

            dataset.destroy();

            assert(eventCount(subtract, 'itemsChanged') == 0);
          }
        },
        {
          name: 'the same dataset for both operands, change wrapper',
          test: function(){
            var items = generate(0, 8);
            var dataset1 = new Dataset({ items: items.slice(0, 6) });
            var dataset2 = new Dataset({ items: items.slice(3, 8) });
            var value = new basis.Token(dataset1);
            var subtract = new Subtract({
              minuend: value,
              subtrahend: value
            });

            assert(eventCount(subtract, 'itemsChanged') == 0);

            value.set(dataset2);

            assert(eventCount(subtract, 'itemsChanged') == 0);
          }
        }
      ]
    },
    {
      name: 'change resolving values',
      test: [
        {
          name: 'add dataset (minuend)',
          test: function(){
            var items = generate(0, 8);
            var dataset1 = new Dataset({ items: items.slice(0, 6) });
            var dataset2 = new Dataset({ items: items.slice(3, 8) });
            var value1 = new Value({ value: dataset1 });
            var value2 = new Value({ value: dataset2 });
            var subtract = new Subtract();

            subtract.setOperands(value1, value2);

            assert(eventCount(subtract, 'minuendChanged') == 1);
            assert(eventCount(subtract, 'subtrahendChanged') == 1);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);

            // change value1 -> null
            // removes items of dataset1 from subtract
            value1.set(null);

            assert(eventCount(subtract, 'minuendChanged') == 2);
            assert(eventCount(subtract, 'subtrahendChanged') == 1);
            assert(subtract.itemCount == 0);
            assert(subtract.minuend === null);
            assert(subtract.subtrahend === dataset2);

            // change value1 -> dataset2
            // nothing happen
            value1.set(dataset2);

            assert(eventCount(subtract, 'minuendChanged') == 3);
            assert(eventCount(subtract, 'subtrahendChanged') == 1);
            assert(subtract.itemCount == 0);
            assert(subtract.minuend === dataset2);
            assert(subtract.subtrahend === dataset2);

            // change value2 -> dataset1
            // adds items from dataset1
            value1.set(dataset1);

            assert(eventCount(subtract, 'minuendChanged') == 4);
            assert(eventCount(subtract, 'subtrahendChanged') == 1);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === dataset2);
          }
        },
        {
          name: 'add dataset (subtrahend)',
          test: function(){
            var items = generate(0, 8);
            var dataset1 = new Dataset({ items: items.slice(0, 6) });
            var dataset2 = new Dataset({ items: items.slice(3, 8) });
            var value1 = new Value({ value: dataset1 });
            var value2 = new Value({ value: dataset2 });
            var subtract = new Subtract();

            subtract.setOperands(value1, value2);

            assert(eventCount(subtract, 'minuendChanged') == 1);
            assert(eventCount(subtract, 'subtrahendChanged') == 1);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);

            // change value1 -> null
            // removes items of dataset1 from subtract
            value2.set(null);

            assert(eventCount(subtract, 'minuendChanged') == 1);
            assert(eventCount(subtract, 'subtrahendChanged') == 2);
            assert(subtract.itemCount == 0);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === null);

            // change value1 -> dataset2
            // nothing happen
            value2.set(dataset1);

            assert(eventCount(subtract, 'minuendChanged') == 1);
            assert(eventCount(subtract, 'subtrahendChanged') == 3);
            assert(subtract.itemCount == 0);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === dataset1);

            // change value2 -> dataset1
            // adds items from dataset1
            value2.set(dataset2);

            assert(eventCount(subtract, 'minuendChanged') == 1);
            assert(eventCount(subtract, 'subtrahendChanged') == 4);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === dataset2);
          }
        },
        {
          name: 'destroy dataset that value points on (minuend)',
          test: function(){
            var items = generate(0, 8);
            var dataset1 = new Dataset({ items: items.slice(0, 6) });
            var dataset2 = new Dataset({ items: items.slice(3, 8) });
            var value1 = new Value({ value: dataset1 });
            var value2 = new Value({ value: dataset2 });
            var subtract = new Subtract({
              minuend: value1,
              subtrahend: value2
            });

            assert(eventCount(subtract, 'minuendChanged') == 1);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === dataset2);

            // destroy dataset
            dataset1.destroy();

            assert(eventCount(subtract, 'minuendChanged') == 2);
            assert(subtract.itemCount == 0);
            assert(subtract.minuend === null);
            assert(subtract.subtrahend === dataset2);

            // set new dataset to value
            var dataset3 = new Dataset({ items: items.slice(0, 6) });
            value1.set(dataset3);

            assert(eventCount(subtract, 'minuendChanged') == 3);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend === dataset3);
            assert(subtract.subtrahend === dataset2);
          }
        },
        {
          name: 'destroy dataset that value points on (subtrahend)',
          test: function(){
            var items = generate(0, 8);
            var dataset1 = new Dataset({ items: items.slice(0, 6) });
            var dataset2 = new Dataset({ items: items.slice(3, 8) });
            var value1 = new Value({ value: dataset1 });
            var value2 = new Value({ value: dataset2 });
            var subtract = new Subtract({
              minuend: value1,
              subtrahend: value2
            });

            assert(eventCount(subtract, 'subtrahendChanged') == 1);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === dataset2);

            // destroy dataset
            dataset2.destroy();

            assert(eventCount(subtract, 'subtrahendChanged') == 2);
            assert(subtract.itemCount == 0);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === null);

            // set new dataset to value
            var dataset3 = new Dataset({ items: items.slice(3, 8) });
            value2.set(dataset3);

            assert(eventCount(subtract, 'subtrahendChanged') == 3);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);
            assert(subtract.minuend === dataset1);
            assert(subtract.subtrahend === dataset3);
          }
        },
        {
          name: 'destroy dataset',
          test: function(){
            var items = generate(0, 8);
            var dataset1 = new Dataset({ items: items.slice(0, 6) });
            var dataset2 = new Dataset({ items: items.slice(3, 8) });
            var subtract = new Subtract({
              minuend: dataset1,
              subtrahend: dataset2
            });

            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);

            // destroy dataset
            dataset1.destroy();

            assert(subtract.itemCount == 0);
            assert(subtract.minuend === null);
          }
        }
      ]
    },
    {
      name: 'change content of operands',
      test: [
        {
          name: 'change minuend items',
          test: function(){
            var items = generate(0, 10);
            var minuend = new Dataset({ items: items.slice(0, 5) });
            var subtrahend = new Dataset({ items: items.slice(3, 8) });
            var subtract = new Subtract({
              minuend: minuend,
              subtrahend: subtrahend
            });

            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);

            minuend.add([items[3], items[9]]);
            assert(subtract.itemCount == 4);
            assert(checkValues(subtract, [0, 1, 2, 9]) == false);

            minuend.remove([items[0], items[4]]);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, [1, 2, 9]) == false);

            minuend.clear();
            assert(subtract.itemCount == 0);
          }
        },
        {
          name: 'change subtrahend items',
          test: function(){
            var items = generate(0, 10);
            var minuend = new Dataset({ items: items.slice(0, 5) });
            var subtrahend = new Dataset({ items: items.slice(3, 8) });
            var subtract = new Subtract({
              minuend: minuend,
              subtrahend: subtrahend
            });

            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, range(0, 2)) == false);

            subtrahend.add([items[2], items[9]]);
            assert(subtract.itemCount == 2);
            assert(checkValues(subtract, [0, 1]) == false);

            subtrahend.remove([items[3], items[7]]);
            assert(subtract.itemCount == 3);
            assert(checkValues(subtract, [0, 1, 3]) == false);

            subtrahend.clear();
            assert(subtract.itemCount == 5);
            assert(checkValues(minuend, range(0, 4)) == false);
            assert(checkValues(subtract, range(0, 4)) == false);
          }
        }
      ]
    },
    {
      name: 'accumulate state',
      beforeEach: function(){
        var oldOne = new DataObject({ name: 'oldOne' });
        var oldTwo = new DataObject({ name: 'oldTwo' });
        var newOne = new DataObject({ name: 'newOne' });
        var newTwo = new DataObject({ name: 'newTwo' });
      },
      test: [
        {
          name: 'replace fully both datasets with full intersection',
          test: function(){
            var oldOne = new DataObject({ name: 'oldOne' });
            var newOne = new DataObject({ name: 'newOne' });
            var minuend = new Dataset({
              items: [oldOne]
            });
            var subtrahend = new Dataset({
              items: [oldOne]
            });
            var subtract = new Subtract({
              minuend: minuend,
              subtrahend: subtrahend
            });

            Dataset.setAccumulateState(true);
            subtrahend.set([newOne]);
            minuend.set([newOne]);
            Dataset.setAccumulateState(false);

            assert([], subtract.getItems().map(basis.getter('name')));
            assert(subtract.itemCount == 0);
          }
        },
        {
          name: 'replace fully both datasets with full intersection - different order',
          test: function(){
            var oldOne = new DataObject({ name: 'oldOne' });
            var newOne = new DataObject({ name: 'newOne' });
            var minuend = new Dataset({
              items: [oldOne]
            });
            var subtrahend = new Dataset({
              items: [oldOne]
            });
            var subtract = new Subtract({
              minuend: minuend,
              subtrahend: subtrahend
            });

            Dataset.setAccumulateState(true);
            minuend.set([newOne]);
            subtrahend.set([newOne]);
            Dataset.setAccumulateState(false);

            assert([], subtract.getItems().map(basis.getter('name')));
            assert(subtract.itemCount == 0);
          }
        }
      ]
    }
  ]
};
