module.exports = {
  name: 'basis.data.dataset.Extract',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var helpers = basis.require('./helpers/dataset.js');
    var range = helpers.range;
    var generate = helpers.generate;
    var cmpDS = helpers.cmpDS;
    var checkValues = helpers.checkValues;
    var catchWarnings = helpers.catchWarnings;

    var dataWrap = basis.require('basis.data').wrap;
    var DataObject = basis.require('basis.data').Object;
    var Value = basis.require('basis.data').Value;
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
            var value = new Value({ value: dataset });
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
              items: dataWrap([
                { value: 1, items: new Dataset({ items: generate(2, 3) }) },
                { value: 4, items: new Dataset({ items: generate(5, 6) }) },
                { value: 7, items: new Dataset({ items: generate(8, 9) }) },
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
            items[0].data.items = new Dataset({ items: items.slice(1, 6) });
            items[3].data.items = new Dataset({ items: items.slice(3, 8) });
            items[6].data.items = new Dataset({ items: items.slice(2, 10) });
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
            dataset.add(new DataObject({
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
            var value = new Value({ value: dataset });
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
            var value = new Value({ value: dataset });
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
                new DataObject({
                  data: {
                    value: 1,
                    items: new Dataset({ items: generate(2, 5) })
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
            dataset.add(new DataObject({
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
        },
        {
          name: 'change source with intersected items, with cycles',
          test: function(){
            var items = generate(1, 3);
            items[0].update({ parent: items[1] });
            items[1].update({ parent: items[2] });
            items[2].update({ parent: items[0] });
            var dataset1 = new Dataset({ items: [items[0], items[1]] });
            var dataset2 = new Dataset({ items: [items[1], items[2]] });
            var extract = new Extract({
              source: dataset1,
              rule: 'data.parent'
            });

            assert(dataset1.itemCount == 2);
            assert(extract.source === dataset1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, [1, 2, 3]) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource(dataset2);
            assert(dataset2.itemCount == 2);
            assert(extract.source === dataset2);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, [1, 2, 3]) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset2.remove(items[1]);
            dataset2.remove(items[2]);
            assert(dataset2.itemCount == 0);
            assert(extract.itemCount == 0);
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
            var objectDataset = new Dataset({ items: generate(1, 3) });
            var object = new DataObject({
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
            var objectDataset = new Dataset({ items: generate(1, 3) });
            var object = new DataObject({
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
            var objectDataset = new Dataset({ items: generate(1, 3) });
            var object = new DataObject({
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
          name: 'some objects with same dataset',
          test: function(){
            var objectDataset = new Dataset({ items: generate(1, 3) });
            var objectA = new DataObject({
              data: {
                value: 4,
                items: objectDataset
              }
            });
            var objectB = new DataObject({
              data: {
                value: 5,
                items: objectDataset
              }
            });
            var dataset = new Dataset({ items: [objectA, objectB] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 5);
            assert(checkValues(extract, range(1, 5)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectA.update({ items: null });
            assert(extract.itemCount == 5);
            assert(checkValues(extract, range(1, 5)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectA.update({ items: objectDataset });
            assert(extract.itemCount == 5);
            assert(checkValues(extract, range(1, 5)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectB.update({ items: null });
            assert(extract.itemCount == 5);
            assert(checkValues(extract, range(1, 5)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectA.update({ items: null });
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(4, 5)) == false);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'some objects with dataset as source',
          test: function(){
            var objectDataset = new Dataset();
            var objectA = new DataObject({
              data: {
                value: 1,
                items: objectDataset
              }
            });
            var objectB = new DataObject({
              data: {
                value: 2,
                items: objectDataset
              }
            });
            objectDataset.set([objectA, objectB]);
            var dataset = new Dataset({ items: [objectA, objectB] });
            var extract = new Extract({
              source: objectDataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectA.update({ items: null });
            objectB.update({ items: null });
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource(dataset);
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource(null);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);

            // restore state
            objectA.update({ items: objectDataset });
            objectB.update({ items: objectDataset });
            extract.setSource(objectDataset);
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);

            // drop source
            extract.setSource(null);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 4);
          }
        },
        {
          name: 'some objects with dataset as source',
          test: function(){
            var objectDataset = new Dataset();
            var objectA = new DataObject({
              data: {
                value: 1,
                items: objectDataset
              }
            });
            var objectB = new DataObject({
              data: {
                value: 2,
                items: objectDataset
              }
            });
            objectDataset.set([objectA, objectB]);
            var dataset = new Dataset({ items: [objectA, objectB] });
            var extract = new Extract({
              source: objectDataset,
              rule: 'data.items'
            });

            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectA.update({ items: null });
            objectB.update({ items: null });
            extract.setSource(dataset);
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            objectA.update({ items: dataset });
            objectB.update({ items: dataset });
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource(objectDataset);
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            extract.setSource(null);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);
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
            var value = new Value();
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
            var object = new DataObject({ data: { value: 4, items: dataset1 } });
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
        },
        {
          name: 'remove item from source should remove related members on recursive references',
          test: function(){
            var items = generate(1, 2);
            items[0].update({ parent: items[1] });
            items[1].update({ parent: items[0] });
            var dataset = new Dataset({ items: [items[0]] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 2);
            assert(checkValues(extract, range(1, 2)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset.remove(items[0]);
            assert(dataset.itemCount == 0);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'remove item from source should not remove related members on recursive references but only if member has other references from source',
          test: function(){
            var items = generate(1, 3);
            items[0].update({ parent: items[1] });
            items[1].update({ parent: items[2] });
            items[2].update({ parent: items[0] });
            var dataset = new Dataset({ items: [items[0], items[1]] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.parent'
            });

            assert(dataset.itemCount == 2);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset.remove(items[0]);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            dataset.remove(items[1]);
            assert(dataset.itemCount == 0);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);

            //
            // round 2
            //
            dataset.set(items);
            assert(dataset.itemCount == 3);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);

            // remove first item and then second, it should left all three items
            dataset.remove(items[0]);
            dataset.remove(items[1]);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 3);

            dataset.remove(items[2]);
            assert(dataset.itemCount == 0);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 4);
          }
        },
        {
          name: 'remove item with dataset from source should remove related members',
          test: function(){
            var items = generate(1, 3);
            var a = items[0];
            var b = items[1];
            var c = items[2];

            a.update({ parent: c });
            b.update({ parent: c });
            c.update({ items: new Dataset({ items: [a, b] }) });

            var dataset = new Dataset({ items: [a] });
            var extract = new Extract({
              source: dataset,
              rule: function(item){
                return item.data.parent || item.data.items;
              }
            });

            // source -> a ----> c <---- b
            //           ^       |       ^
            //           \--- dataset ---/

            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // extract should be empty if remove `a` from dataset
            dataset.clear();
            assert(dataset.itemCount == 0);
            assert(extract.itemCount == 0);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy object\'s dataset but don\'t notify about changes',
          test: function(){
            var objectDataset = new Dataset({ items: generate(2, 3) });
            var object = new DataObject({
              data: {
                value: 1,
                items: objectDataset
              }
            });
            var dataset = new Dataset({ items: [object] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // destroy object dataset should not produce a warnings
            assert(catchWarnings(function(){
              objectDataset.destroy();
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);

            // trigger object value recalc by updating it
            assert(catchWarnings(function(){
              assert(object.update({ trigger: true }) != false);
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);

            // trigger object value recalc by updating it
            assert(catchWarnings(function(){
              assert(object.update({ items: null }) != false);
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy object\'s dataset and notify about changes',
          test: function(){
            var objectDataset = new Dataset({ items: generate(2, 3) });
            var object = new DataObject({
              data: {
                value: 1,
                items: objectDataset
              }
            });
            var dataset = new Dataset({ items: [object] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            // add listener after extract created
            objectDataset.addHandler({
              destroy: function(){
                object.update({ items: null });
              }
            });

            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // destroy object dataset should not produce a warnings
            assert(catchWarnings(function(){
              objectDataset.destroy();
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);

            // trigger object value recalc by updating it
            assert(catchWarnings(function(){
              assert(object.update({ trigger: true }) != false);
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        },
        {
          name: 'destroy object\'s dataset and notify about changes (another listener order)',
          test: function(){
            var objectDataset = new Dataset({ items: generate(2, 3) });
            var object = new DataObject({
              data: {
                value: 1,
                items: objectDataset
              }
            });

            // add handler before extract created
            objectDataset.addHandler({
              destroy: function(){
                object.update({ items: null });
              }
            });

            var dataset = new Dataset({ items: [object] });
            var extract = new Extract({
              source: dataset,
              rule: 'data.items'
            });

            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 3);
            assert(checkValues(extract, range(1, 3)) == false);
            assert(eventCount(extract, 'itemsChanged') == 1);

            // destroy object dataset should not produce a warnings
            assert(catchWarnings(function(){
              objectDataset.destroy();
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);

            // trigger object value recalc by updating it
            assert(catchWarnings(function(){
              assert(object.update({ trigger: true }) != false);
            }) == false);
            assert(dataset.itemCount == 1);
            assert(extract.itemCount == 1);
            assert(eventCount(extract, 'itemsChanged') == 2);
          }
        }
      ]
    }
  ]
};
