module.exports = {
  name: 'basis.data.dataset.extract.Extract',
  init: function(){
    var helpers = basis.require('./spec/dataset/helpers.js');
    var range = helpers.range;
    var generate = helpers.generate;
    var cmpDS = helpers.cmpDS;
    var checkValues = helpers.checkValues;
    var catchWarnings = helpers.catchWarnings;

    var ReadOnlyDataset = basis.require('basis.data').ReadOnlyDataset;
    var Dataset = basis.require('basis.data').Dataset;
    var Extract = basis.require('basis.data.dataset').Extract;

    var eventInfo = {};
    Extract.prototype.debug_emit = function(event){
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
          name: 'with no source',
          test: function(){
            var extract = new Extract();

            assert(extract.itemCount == 0);
            assert(extract.source == null);
            assert(eventCount(extract, 'itemsChanged') == 0);
          }
        },
        {
          name: 'with source but not with rule (proxy)',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var extract = new Extract({
              source: dataset
            });

            assert(extract.itemCount == 10);
            assert(checkValues(extract, range(1, 10)) == false);
            assert(extract.source === dataset);
            assert(cmpDS(extract, dataset) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        },
        {
          name: 'with empty source',
          test: function(){
            var dataset = new Dataset();
            var extract = new Extract({
              source: dataset
            });

            assert(extract.itemCount == 0);
            assert(extract.source === dataset);
            assert(eventCount(extract, 'itemsChanged') == 0);
          }
        },
        {
          name: 'with resolvable value as source',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 10) });
            var value = new basis.data.Value({ value: dataset });
            var extract = new Extract({
              source: value
            });

            assert(extract.itemCount == 10);
            assert(checkValues(extract, range(1, 10)) == false);
            assert(extract.source === dataset);
            assert(cmpDS(extract, dataset) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        },
        {
          name: 'extract parent path',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            assert(dataset.itemCount == 1);
            assert(checkValues(dataset, range(1, 1)) == false);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        },
        {
          name: 'extract subtree',
          test: function(){
            var dataset = new Dataset({
              items: basis.data.wrap([
                { value: 1, items: new basis.data.Dataset({ items: generate(2, 3) }) },
                { value: 4, items: new basis.data.Dataset({ items: generate(5, 6) }) },
                { value: 7, items: new basis.data.Dataset({ items: generate(8, 9) }) },
                { value: 10 }
              ], true)
            });

            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(dataset.itemCount == 4);
            assert(checkValues(dataset, [1, 4, 7, 10]) == false);
            assert(extract.itemCount == 10);
            assert(checkValues(extract, range(1, 10)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        },
        {
          name: 'extract with overlaping',
          test: function(){
            var items = generate(1, 10);
            items[0].data.items = new basis.data.Dataset({ items: items.slice(1, 6) });
            items[3].data.items = new basis.data.Dataset({ items: items.slice(3, 8) });
            items[6].data.items = new basis.data.Dataset({ items: items.slice(2, 10) });
            var dataset = new Dataset({
              items: [
                items[0],
                items[3],
                items[6],
                items[9]
              ]
            });

            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(dataset.itemCount == 4);
            assert(checkValues(dataset, [1, 4, 7, 10]) == false);
            assert(extract.itemCount == 10);
            assert(checkValues(extract, range(1, 10)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        },
        {
          name: 'recursive references',
          test: function(){
            var dataset = new Dataset();
            dataset.add(new basis.data.Object({
              data: {
                value: 1,
                items: dataset
              }
            }));

            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(dataset.itemCount == 1);
            assert(checkValues(dataset, [1]) == false);
            assert(extract.itemCount == 1);
            assert(checkValues(extract, [1]) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        }
      ]
    },
    {
      name: 'change source',
      test: [
        {
          name: 'set source after create',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var extract = new Extract({
              rule: 'data.parent'
            });

            assert(extract.itemCount == 0);

            extract.setSource(dataset);
            assert(extract.itemCount == 3);
            assert(extract.source === dataset);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource();
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'set resolvable value as source',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var value = new basis.data.Value({ value: dataset });
            var extract = new Extract({
              rule: 'data.parent'
            });

            assert(extract.itemCount == 0);

            extract.setSource(value);
            assert(extract.itemCount == 3);
            assert(extract.source === dataset);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource();
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy source',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            assert(extract.itemCount == 3);
            assert(extract.source === dataset);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset.destroy();
            assert(extract.itemCount == 0);
            assert(extract.source == null);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy resolvable value as source',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var value = new basis.data.Value({ value: dataset });
            var extract = new Extract({
              source: value,
              rule: 'data.parent'
            });

            assert(extract.itemCount == 3);
            assert(extract.source === dataset);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            value.destroy();
            assert(extract.itemCount == 0);
            assert(extract.source == null);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy dataset that source object points to',
          test: function(){
            var dataset = new Dataset({
              items: [
                new basis.data.Object({
                  data: {
                    value: 1,
                    items: new basis.data.Dataset({ items: generate(2, 5) })
                  }
                })
              ]
            });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 5);
            assert(extract.source === dataset);
            assert(checkValues(extract, range(1, 5)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset.pick().destroy();
            assert(extract.itemCount == 0);
            assert(extract.source === dataset);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy object with recursive references',
          test: function(){
            var dataset = new Dataset();
            dataset.add(new basis.data.Object({
              data: {
                value: 1,
                items: dataset
              }
            }));

            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 1);
            assert(checkValues(extract, [1]) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset.pick().destroy();
            assert(extract.itemCount == 0);
            assert(extract.source === dataset);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        }
      ]
    },
    {
      name: 'change source objects',
      test: [
        {
          name: 'change object (remove one from path)',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            items[1].update({ parent: null });
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);

            items[0].update({ parent: null });
            assert(extract.itemCount == 1);
            assert(checkValues(extract, range(1, 1)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);
          }
        },
        {
          name: 'change object (remove several from path)',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            items[0].update({ parent: null });
            assert(extract.itemCount == 1);
            assert(checkValues(extract, range(1, 1)) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'change object with dataset',
          test: function(){
            var objectDataset = new basis.data.Dataset({ items: generate(1, 3) });
            var object = new basis.data.Object({
              data: {
                value: 4,
                items: objectDataset
              }
            });
            var dataset = new Dataset({ items: [object] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            object.update({ items: null });
            assert(extract.itemCount == 1);
            assert(checkValues(extract, [4]) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);

            object.update({ items: objectDataset });
            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);
          }
        },
        {
          name: 'change object with recursion',
          test: function(){
            var objectDataset = new basis.data.Dataset({ items: generate(1, 3) });
            var object = new basis.data.Object({
              data: {
                value: 4,
                items: objectDataset
              }
            });
            var dataset = new Dataset({ items: [object] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            object.update({ items: dataset });
            assert(extract.itemCount == 1);
            assert(checkValues(extract, [4]) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);

            object.update({ items: objectDataset });
            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);
          }
        },
        {
          name: 'change object dataset',
          test: function(){
            var objectDataset = new basis.data.Dataset({ items: generate(1, 3) });
            var object = new basis.data.Object({
              data: {
                value: 4,
                items: objectDataset
              }
            });
            var dataset = new Dataset({ items: [object] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            var removeItem = objectDataset.pick();
            var values = range(1, 4);
            objectDataset.remove(removeItem);
            basis.array.remove(values, removeItem.data.value);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, values) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);

            objectDataset.add(removeItem);
            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);
          }
        },
        {
          name: 'change source dataset',
          test: function(){
            var dataset = new Dataset({ items: generate(1, 3) });
            var extract = new Extract({
              source: dataset
            });

            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            var removeItem = dataset.pick();
            var values = range(1, 3);
            dataset.remove(removeItem);
            basis.array.remove(values, removeItem.data.value);
            assert(extract.itemCount == 2);
            assert(checkValues(extract, values) == false);
            assert(cmpDS(extract, dataset) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'change value of resolvable value',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: [items[0]] });
            var value = new basis.data.Value();
            var extract = new Extract({
              source: value,
              rule: 'data.parent'
            });

            assert(extract.itemCount == 0);
            assert(extract.source == null);
            assert(eventCount(extract, 'itemsChanged') == 0);

            value.set(dataset);
            assert(extract.itemCount == 3);
            assert(extract.source === dataset);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            value.set();
            assert(extract.itemCount == 0);
            assert(extract.source == null);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'members with several references',
          test: function(){
            var items = generate(1, 3).map(function(item, idx, ar){
              if (idx)
                ar[idx - 1].data.parent = item;
              return item;
            });
            var dataset = new Dataset({ items: items });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            // item0 <- dataset
            // item1 <- dataset & item0
            // item2 <- dataset & item1
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // item0 <- dataset
            // item1 <- dataset
            // item2 <- dataset & item1
            items[0].update({ parent: null });
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // item0 <- dataset
            // item1 <- dataset
            // item2 <- item1
            dataset.remove(items[2]);
            assert(dataset.itemCount == 2);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // item0 <- dataset
            // item1
            // item2
            dataset.remove(items[1]);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(checkValues(extract, range(1, 1)) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);

            // item0 <- dataset
            // item1 <- item0
            // item2 <- item1
            items[0].update({ parent: items[1] });
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);
          }
        },
        {
          name: 'change dataset with same items should not trigger itemsChanged',
          test: function(){
            var items = generate(1, 3);
            var dataset1 = new Dataset({ items: items });
            var dataset2 = new Dataset({ items: items });
            var object = new basis.data.Object({ data: { value: 4, items: dataset1 } });
            var extract = new Extract({
              source: new Dataset({ items: [object] }),
              rule: 'data.items'
            });

            assert(object.data.items == dataset1);
            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            object.update({ items: dataset2 });
            assert(object.data.items == dataset2);
            assert(extract.itemCount == 4);
            assert(checkValues(extract, range(1, 4)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);
          }
        }
      ]
    }
  ]
};
