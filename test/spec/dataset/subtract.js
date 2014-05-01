module.exports = {
  name: 'basis.data.dataset.Subtract',
  init: function(){
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

    function range(start, end){
      var result = [];
      if (typeof start == 'number' && typeof end == 'number' && start < end)
        for (var i = start; i <= end; i++)
          result.push(i);
      return result;
    }

    function generate(start, end){
      return range(start, end).map(function(val){
        return new basis.data.Object({
          data: {
            value: val
          }
        });
      });
    }

    function cmpDS(set1, set2){
      if (set1 instanceof ReadOnlyDataset == false)
        return 'set1 is not an instance of basis.data.ReadOnlyDataset';
      if (set2 instanceof ReadOnlyDataset == false)
        return 'set2 is not an instance of basis.data.ReadOnlyDataset';

      var items1 = set1.getItems().map(function(item){ return item.basisObjectId; }).sort();
      var items2 = set2.getItems().map(function(item){ return item.basisObjectId; }).sort();

      if (items1.length != items2.length)
        return 'set1 has ' + items1.length + ' item(s), but set2 has ' + items2.length + ' item(s)';

      for (var i = 0; i < items1.length; i++)
        if (items1[i] !== items2[i])
          return 'item#' + i + ' in set1 is not equal to item#' + i + ' in set2';

      return false;
    }

    function checkValues(set, values){
      var items = set.getItems().map(function(item){
        return item.data.value;
      }).sort();

      values = basis.array.flatten(values.slice()).sort();

      console.log(items, values);

      if (items.length != values.length)
        return 'set has ' + items.length + ' item(s), but should has ' + values.length + ' item(s)';

      for (var i = 0; i < items.length; i++)
        if (items[i] !== values[i])
          return 'item#' + i + ' in set is not equal to item#' + i + ' in answer';

      return false;
    }

    function catchWarnings(fn){
      var warn = basis.dev.warn;
      var warnings = [];

      try {
        basis.dev.warn = function(message){
          warnings.push(message);
        };

        fn();
      } finally {
        basis.dev.warn = warn;
      }

      return warnings.length ? warnings : false;
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
            var value = new basis.data.Value({ value: dataset });
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
            var dataset = new basis.data.Dataset();
            var subtract = new Subtract({
              minuend: dataset,
              subtrahend: dataset
            });

            assert(eventCount(subtract, 'itemsChanged') == 0);

            dataset.add(new basis.data.Object());

            assert(eventCount(subtract, 'itemsChanged') == 0);
          }
        },
        {
          name: 'the same dataset for both operands, destroy dataset',
          test: function(){
            var dataset = new basis.data.Dataset();
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
            var value1 = new basis.data.Value({ value: dataset1 });
            var value2 = new basis.data.Value({ value: dataset2 });
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
            var value1 = new basis.data.Value({ value: dataset1 });
            var value2 = new basis.data.Value({ value: dataset2 });
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
            var value1 = new basis.data.Value({ value: dataset1 });
            var value2 = new basis.data.Value({ value: dataset2 });
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
            var value1 = new basis.data.Value({ value: dataset1 });
            var value2 = new basis.data.Value({ value: dataset2 });
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
    }
  ]
};
