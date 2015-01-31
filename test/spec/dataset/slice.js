module.exports = {
  name: 'basis.data.dataset.Slice',

  init: function(){
    var DataObject = basis.require('basis.data').Object;
    var Dataset = basis.require('basis.data').Dataset;
    var Slice = basis.require('basis.data.dataset').Slice;

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

    function createSource(min, max){
      var items = [];

      min = min || 0;
      max = max || 9;

      while (min <= max)
        items.push(new DataObject({
          data: {
            value: min++
          }
        }));

      return new Dataset({
        items: items
      });
    }
  },

  test: [
    {
      name: 'Slice order',
      test: function(){
        var sliceSort = function(a, b){
          return Number(a.value > b.value) || -(a.value < b.value) || (a.object.basisObjectId - b.object.basisObjectId);
        };
        var sliceMap = function(array){
          return array.map(function(item){
            return item.value + '/' + item.object.basisObjectId;
          });
        };

        var dataset = new Dataset({
          items: basis.array.create(10, function(v){
            return new DataObject({
              data: { value: v % 3 }
            });
          })
        });

        var slice = new Slice({
          source: dataset,
          limit: 3,
          rule: 'data.value'
        });

        // check index on create
        assert(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));

        // update items
        dataset.forEach(function(item){
          item.update({
            value: item.data.value + 10
          });
        });

        assert(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));

        // random item update
        slice.index_[9].object.update({ value: 10 });
        assert(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));

        // set 1 value to every item
        var items = dataset.getItems().slice(0);
        items.forEach(function(item){
          item.update({ value: 1 });
        });

        // check correct sorting and all index value must be 1
        assert(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));
        assert(basis.array.create(10, 1), slice.index_.map(function(i){
          return i.value;
        }));

        // set 2 value to every item in random order
        var i = 3;
        items
          .sort(function(a, b){
            return a.basisObjectId * ((i += 111) % 19) - b.basisObjectId * ((i += 113) % 13);
          })
          .forEach(function(item){
            item.update({ value: 2 });
          });

        // correct sorting and all index value must be 2
        assert(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));
        assert(basis.array.create(10, 2), slice.index_.map(function(i){
          return i.value;
        }));
      }
    },
    {
      name: '#left()',
      test: [
        {
          name: 'should return the same value for the same offset',
          test: function(){
            var slice = new Slice();
            var first = slice.left(0);
            var second = slice.left(1);

            assert(first !== second);
            assert(slice.left(0) === first);
            assert(slice.left() === first);
            assert(slice.left({}) === first);
            assert(slice.left(1) === second);
            assert(slice.left('1') === second);
            assert(slice.left(1.2) === second);
          }
        },
        {
          name: 'should be destroyed on slice destroy',
          test: function(){
            var destroyed = false;
            var slice = new Slice();
            var first = slice.left();
            first.addHandler({
              destroy: function(){
                destroyed = true;
              }
            });

            assert(destroyed === false);

            slice.destroy();
            assert(destroyed === true);
          }
        },
        {
          name: 'should referer on correct item on create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              offset: 2,
              limit: 3
            });

            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // left:   2 1  0 -1 -2  ...

            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 2);
            assert(slice.left(1).value.data.value == 1);
          }
        },
        {
          name: 'should referer on correct item on range change create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              offset: 2,
              limit: 3
            });

            //                --->
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // left:   2 1  0 -1 -2  ...
            // init values
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 2);
            assert(slice.left(1).value.data.value == 1);

            //                --->
            // slice:  0 1 2 3 [4  5] 6 7 8 9
            // left:    .. 2 1  0 -1 -2 ..
            slice.setRange(4, 2);
            assert(slice.left(-1).value.data.value == 5);
            assert(slice.left(0).value.data.value == 4);
            assert(slice.left(1).value.data.value == 3);

            //                --->
            // slice:  0 1 2 3 4 5 6 7 8 [9 .]
            // left:              .. 2 1  0 -1 -2 ..
            slice.setRange(9, 2);
            assert(slice.left(-1).value === null);
            assert(slice.left(0).value.data.value == 9);
            assert(slice.left(1).value.data.value == 8);

            //                --->
            // slice: . [.  0] 1 2 3 4 5 6 7 8 [9 .]
            // left:  1  0 -1 -2 ..
            slice.setRange(-1, 2);
            assert(slice.left(-1).value.data.value == 0);
            assert(slice.left(0).value === null);
            assert(slice.left(1).value === null);
          }
        },
        {
          name: 'should referer on correct item on items changes',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              offset: 2,
              limit: 3
            });

            //                --->
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // left:   2 1  0 -1 -2  ...
            // init values
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 2);
            assert(slice.left(1).value.data.value == 1);

            //                --->
            // slice:  0 1 [3  4  5] 6 7 8 9
            // left:   2 1  0 -1 -2  ...
            slice.left(0).value.destroy();
            assert(slice.left(-1).value.data.value == 4);
            assert(slice.left(0).value.data.value == 3);
            assert(slice.left(1).value.data.value == 1);

            //                --->
            // slice:  -1 0 [1  3  4] 5 6 7 8 9
            // left:    2 1  0 -1 -2  ...
            slice.source.add(new DataObject({ data: { value: -1 } }));
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 1);
            assert(slice.left(1).value.data.value == 0);

            slice.source.destroy();
            assert(slice.left(-1).value === null);
            assert(slice.left(0).value === null);
            assert(slice.left(1).value === null);
          }
        },
        {
          name: '[orderDesc = true] should referer on correct item on create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              orderDesc: true,
              offset: 5,
              limit: 3
            });

            //                <---
            // slice:  0 1 [ 2  3 4] 5 6 7 8 9
            // left:    ... -2 -1 0  1 2 ...

            assert([2, 3, 4], slice.getValues('data.value'));
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 4);
            assert(slice.left(1).value.data.value == 5);
          }
        },
        {
          name: '[orderDesc = true] should referer on correct item on range change create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              orderDesc: true,
              offset: 5,
              limit: 3
            });

            //                <---
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // left:   ... -2 -1  0  1 2 ...
            // init values
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 4);
            assert(slice.left(1).value.data.value == 5);

            //                <---
            // slice:  0 1 2 3 [ 4 5] 6 7 8 9
            // left:     ... -2 -1 0  1 2 ...
            slice.setRange(4, 2);
            assert(slice.left(-1).value.data.value == 4);
            assert(slice.left(0).value.data.value == 5);
            assert(slice.left(1).value.data.value == 6);

            //                <---
            // slice:  0 1 2 3 4 5 6 7  8 [9 .]
            // left:            ... -2 -1  0  1 2 ...
            slice.setRange(0, 1);
            assert(slice.left(-1).value.data.value == 8);
            assert(slice.left(0).value.data.value == 9);
            assert(slice.left(1).value === null);
          }
        },
        {
          name: '[orderDesc = true] should referer on correct item on items changes',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              orderDesc: true,
              offset: 5,
              limit: 3
            });

            //                <---
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // left:   ... -2 -1  0  1 2 ...
            // init values
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 4);
            assert(slice.left(1).value.data.value == 5);

            //                <---
            // slice:  0  [ 1  2  3] 5 6 7 8 9
            // left:   ... -2 -1  0  1 2 ...
            slice.left(0).value.destroy();
            assert(slice.left(-1).value.data.value == 2);
            assert(slice.left(0).value.data.value == 3);
            assert(slice.left(1).value.data.value == 5);

            //                <---
            // slice:  0 1 [2  3  5] 6 7 8 9 10
            // left:   ... -2 -1  0  1 2 ...
            slice.source.add(new DataObject({ data: { value: 10 } }));
            assert(slice.left(-1).value.data.value == 3);
            assert(slice.left(0).value.data.value == 5);
            assert(slice.left(1).value.data.value == 6);

            slice.source.destroy();
            assert(slice.left(-1).value === null);
            assert(slice.left(0).value === null);
            assert(slice.left(1).value === null);
          }
        }
      ]
    },
    {
      name: '#right()',
      test: [
        {
          name: 'should return the same value for the same offset',
          test: function(){
            var slice = new Slice();
            var first = slice.right(0);
            var second = slice.right(1);

            assert(first !== second);
            assert(slice.right(0) === first);
            assert(slice.right() === first);
            assert(slice.right({}) === first);
            assert(slice.right(1) === second);
            assert(slice.right('1') === second);
            assert(slice.right(1.2) === second);
          }
        },
        {
          name: 'should be destroyed on slice destroy',
          test: function(){
            var destroyed = false;
            var slice = new Slice();
            var first = slice.right();
            first.addHandler({
              destroy: function(){
                destroyed = true;
              }
            });

            assert(destroyed === false);

            slice.destroy();
            assert(destroyed === true);
          }
        },
        {
          name: 'should referer on correct item on create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              offset: 2,
              limit: 3
            });

            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // right:  ... -2 -1  0  1 2 ...

            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 4);
            assert(slice.right(1).value.data.value == 5);
          }
        },
        {
          name: 'should referer on correct item on range change create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              offset: 2,
              limit: 3
            });

            //                --->
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // right:  ... -2 -1  0  1 2 ...
            // init values
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 4);
            assert(slice.right(1).value.data.value == 5);

            //                --->
            // slice:  0 1 2 3 [4  5] 6 7 8 9
            // right:   ... -2 -1  0  1 2 ...
            slice.setRange(4, 2);
            assert(slice.right(-1).value.data.value == 4);
            assert(slice.right(0).value.data.value == 5);
            assert(slice.right(1).value.data.value == 6);

            //                --->
            // slice:  0 1 2 3 4 5 6 7 8 [9 .] .
            // right:             ... -2 -1 0  1 2 ...
            slice.setRange(9, 2);
            assert(slice.right(-1).value.data.value == 9);
            assert(slice.right(0).value === null);
            assert(slice.right(1).value === null);

            //                --->
            // slice:  [. 0] 1 2 3 4 5 6 7 8 [9 .] .
            // right:  -1 0  1 2 ...
            slice.setRange(-1, 2);
            assert(slice.right(-1).value == null);
            assert(slice.right(0).value.data.value === 0);
            assert(slice.right(1).value.data.value === 1);
          }
        },
        {
          name: 'should referer on correct item on items changes',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              offset: 2,
              limit: 3
            });

            //                --->
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // right:  ... -2 -1  0  1 2 ...
            // init values
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 4);
            assert(slice.right(1).value.data.value == 5);

            //                --->
            // slice:  0 1 [2  3  5] 6 7 8 9
            // right:  ... -2 -1  0  1 2 ...
            slice.right(0).value.destroy();
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 5);
            assert(slice.right(1).value.data.value == 6);

            //                --->
            // slice:  -1 0 [1  2  3] 5 6 7 8 9
            // right:   ... -2 -1  0  1 2 ...
            slice.source.add(new DataObject({ data: { value: -1 } }));
            assert(slice.right(-1).value.data.value == 2);
            assert(slice.right(0).value.data.value == 3);
            assert(slice.right(1).value.data.value == 5);

            slice.source.destroy();
            assert(slice.right(-1).value === null);
            assert(slice.right(0).value === null);
            assert(slice.right(1).value === null);
          }
        },
        {
          name: '[orderDesc = true] should referer on correct item on create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              orderDesc: true,
              offset: 5,
              limit: 3
            });

            //                <---
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // right:  2 1  0 -1 -2  ...
            assert([2, 3, 4], slice.getValues('data.value'));
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 2);
            assert(slice.right(1).value.data.value == 1);
          }
        },
        {
          name: '[orderDesc = true] should referer on correct item on range change create',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              orderDesc: true,
              offset: 5,
              limit: 3
            });

            //                <---
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // right:  2 1  0 -1 -2  ...
            // init value
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 2);
            assert(slice.right(1).value.data.value == 1);


            //                <---
            // slice:  0 1 2 3 [4  5] 6 7 8 9
            // right:      2 1  0 -1 -2  ...
            slice.setRange(4, 2);
            assert(slice.right(-1).value.data.value == 5);
            assert(slice.right(0).value.data.value == 4);
            assert(slice.right(1).value.data.value == 3);

            //                <---
            // slice:  0 1 2 3 4 5 6 7  8 [9]
            // right:                 2 1  0 -1 -2
            slice.setRange(0, 1);
            assert(slice.right(-1).value === null);
            assert(slice.right(0).value.data.value == 9);
            assert(slice.right(1).value.data.value == 8);
          }
        },
        {
          name: '[orderDesc = true] should referer on correct item on items changes',
          test: function(){
            var slice = new Slice({
              source: createSource(0, 9),
              rule: 'data.value',
              orderDesc: true,
              offset: 5,
              limit: 3
            });

            //                <---
            // slice:  0 1 [2  3  4] 5 6 7 8 9
            // right:  2 1  0 -1 -2  ...
            // init values
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 2);
            assert(slice.right(1).value.data.value == 1);

            //                <---
            // slice:  0 [1  3  4] 5 6 7 8 9
            // right:  1  0 -1 -2  ...
            slice.right(0).value.destroy();
            assert(slice.right(-1).value.data.value == 3);
            assert(slice.right(0).value.data.value == 1);
            assert(slice.right(1).value.data.value == 0);

            //                <---
            // slice:  0 1 [3  4  5] 6 7 8 9 10
            // right:    1  0 -1 -2  ...
            slice.source.add(new DataObject({ data: { value: 10 } }));
            assert(slice.right(-1).value.data.value == 4);
            assert(slice.right(0).value.data.value == 3);
            assert(slice.right(1).value.data.value == 1);

            slice.source.destroy();
            assert(slice.right(-1).value === null);
            assert(slice.right(0).value === null);
            assert(slice.right(1).value === null);
          }
        }
      ]
    }
  ]
};
