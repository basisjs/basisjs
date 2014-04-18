module.exports = {
  name: 'basis.data.dataset.Merge',
  init: function(){
    var AbstractDataset = basis.require('basis.data').AbstractDataset;
    var Dataset = basis.require('basis.data').Dataset;
    var Merge = basis.require('basis.data.dataset').Merge;

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
      if (set1 instanceof AbstractDataset == false)
        return 'set1 is not an instance of basis.data.AbstractDataset';
      if (set2 instanceof AbstractDataset == false)
        return 'set2 is not an instance of basis.data.AbstractDataset';

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

      if (items.length != values.length)
        return 'set has ' + items.length + ' item(s), but should has ' + values.length + ' item(s)';

      for (var i = 0; i < items.length; i++)
        if (items[i] !== values[i])
          return 'item#' + i + ' in set is not equal to item#' + i + ' in answer';

      return false;
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

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with value as source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with 2 same value as source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value,
                value
              ]
            });

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
          }
        },
        {
          name: 'with 2 same value and 2 same dataset as sources',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value,
                dataset,
                value,
                dataset
              ]
            });

            assert(merge.itemCount == 10);
            assert(merge.sources.length == 1);
            assert(checkValues(merge, range(1, 10)) == false);
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
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge();

            merge.addSource(value);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'add value and dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            merge.addSource(dataset);
            merge.addSource(value);

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
            var value1 = new basis.data.Value({ value: dataset1 });
            var value2 = new basis.data.Value({ value: dataset2 });
            var merge = new Merge();

            merge.addSource(value1);
            merge.addSource(value2);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 2);

            // change value1 -> null
            // removes items of dataset1 from merge
            value1.set(null);

            assert(merge.itemCount == 5);
            assert(checkValues(merge, range(6, 10)) == false);
            assert(merge.sources.length == 1);

            // change value1 -> dataset2
            // nothing happen
            value1.set(dataset2);

            assert(merge.itemCount == 5);
            assert(checkValues(merge, range(6, 10)) == false);
            assert(merge.sources.length == 1);

            // change value2 -> dataset1
            // adds items from dataset1
            value2.set(dataset1);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 2);
          }
        },
        {
          name: 'destroy dataset that value points on',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge({
              sources: [value]
            });

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);

            // destroy dataset
            dataset.destroy();

            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);

            // set new dataset to value
            value.set(new Dataset({ items: generate(1, 10) }));

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
          }
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

            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'remove non-existing dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var merge = new Merge({});

            merge.removeSource(dataset);

            assert(merge.itemCount == 0);
            assert(merge.sources.length == 0);
          }
        },
        {
          name: 'add value',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge();

            merge.addSource(value);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        },
        {
          name: 'add value and dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var merge = new Merge({
              sources: [
                value
              ]
            });

            merge.addSource(dataset);
            merge.addSource(value);

            assert(merge.itemCount == 10);
            assert(checkValues(merge, range(1, 10)) == false);
            assert(merge.sources.length == 1);
            assert(cmpDS(merge, dataset) == false);
          }
        }
      ]
    },
  ]
};
