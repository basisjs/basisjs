module.exports = {
  name: 'basis.data.dataset.Slice',

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
    var Slice = basis.data.dataset.Slice;
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
            return new basis.data.Object({
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
        this.is(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));

        // update items
        dataset.forEach(function(item){
          item.update({
            value: item.data.value + 10
          });
        });

        this.is(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));

        // random item update
        slice.index_[9].object.update({ value: 10 });
        this.is(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));

        // set 1 value to every item
        var items = dataset.getItems().slice(0);
        items.forEach(function(item){
          item.update({ value: 1 });
        });

        // check correct sorting and all index value must be 1
        this.is(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));
        this.is(basis.array.create(10, 1), slice.index_.map(function(i){ return i.value; }));

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
        this.is(sliceMap(slice.index_.slice(0).sort(sliceSort)), sliceMap(slice.index_));
        this.is(basis.array.create(10, 2), slice.index_.map(function(i){ return i.value; }));
      }
    }
  ]
};
