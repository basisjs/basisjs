module.exports = {
  name: 'basis.data.dataset.SourceDataset',

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
      name: 'source and active',
      test: function(){
        var warn = basis.dev.warn;
        var warning = false;
        var dataset = new Dataset();
        var sourceDataset = new SourceDataset({
          active: true,
          source: dataset
        });

        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          this.is(1, dataset.debug_handlers().length);
          this.is(1, sourceDataset.debug_handlers().length);

          sourceDataset.setSource();
          this.is(0, dataset.debug_handlers().length);
          this.is(1, sourceDataset.debug_handlers().length);

          sourceDataset.setSource(dataset);
          this.is(1, dataset.debug_handlers().length);
          this.is(1, sourceDataset.debug_handlers().length);

          sourceDataset.setActive(false);
          this.is(1, dataset.debug_handlers().length);
          this.is(0, sourceDataset.debug_handlers().length);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, warning);
      }
    }
  ]
};
