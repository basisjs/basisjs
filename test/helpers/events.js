function createAPI(Class){
  var eventsMap = {};

  Class.prototype.debug_emit = function(event){
    if (this.basisObjectId in eventsMap === false)
      eventsMap[this.basisObjectId] = [];

    eventsMap[this.basisObjectId].push(event);
  };

  var resetEvents = function(){
    eventsMap = {};
  };

  var getEvents = function(object, type){
    var events = eventsMap[object.basisObjectId];

    if (events && type)
      events = events.filter(function(event){
        return event.type == type;
      });

    return events;
  };

  var eventCount = function(object, type){
    var events = getEvents(object, type);

    return events ? events.length : 0;
  };

  var getLastEvent = function(object, type){
    var events = getEvents(object, type);

    return events && events[events.length - 1];
  };

  return {
    resetEvents: resetEvents,
    eventCount: eventCount,
    getLastEvent: getLastEvent
  };
}

module.exports = {
  createAPI: createAPI
};
