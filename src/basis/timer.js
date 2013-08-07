
 /**
  * @namespace basis.timer
  */

  var namespace = this.path;


  //
  // import names
  //

  var cleaner = basis.cleaner;
  var getter = basis.getter;

  var MESSAGE_NAME = 'basisjs.setImmediate';

  var setImmediate = basis.setImmediate;
  var clearImmediate = basis.clearImmediate;
  
  //!!!!!!!!!!!!!!!!!!!!!!!! this section will be removed in 0.10 !!!!!!!!!!!!!!!!!!!!!!!!
  //
  // Add support for setImmediate/clearImmediate
  //
  if (!global.setImmediate)
  {
    global.setImmediate = setImmediate;
    global.clearImmediate = clearImmediate;
  }

  //
  // store native setTimeout/clearTimeout
  //
  global.nativeSetTimeout_ = global.setTimeout;
  global.nativeClearTimeout_ = global.clearTimeout;

  //
  // Override setTimeout
  //
  global.setTimeout = function(fn, timeout){
    /** @cut */ if (isNaN(timeout) || timeout <= 0)
    /** @cut */   basis.dev.warn('Don\'t use setTimeout() with zero timeout, use basis.timer.setImmediate instead');

    return isNaN(timeout) || timeout <= 0
      ? MESSAGE_NAME + setImmediate(fn)
      : global.nativeSetTimeout_(fn, timeout);
  };

  //
  // Override clearTimeout
  //
  global.clearTimeout = function(timer){
    var immediateId = String(timer).split(MESSAGE_NAME)[1];

    return immediateId
      ? clearImmediate(immediateId)
      : global.nativeClearTimeout_(timer);
  };
  //!!!!!!!!!!!!!!!!!!!!!!!! this section will be removed in 0.10 !!!!!!!!!!!!!!!!!!!!!!!!


  //
  // taskManager
  //

  var taskManager = (function(){
    var NEVER = 2E12;
    var EVENT_TIME_GETTER = getter('eventTime');

    var eventStack = [];
    var map = {};
    var fireTime = NEVER;
    var timer = null;

    var lockSetTimeout = false;

    function setNextTime(){
      if (lockSetTimeout)
        return;

      if (eventStack.length)
      {
        var now = Date.now();
        var firstEventTime = Math.max(eventStack[0].eventTime, now);

        // move fire time backward
        if (firstEventTime < fireTime)
        {
          clearTimeout(timer);
          timer = setTimeout(fire, (fireTime = firstEventTime) - now);
        }
      }
      else
      {
        timer = clearTimeout(timer);
        fireTime = NEVER;
      }
    }

    function add(object, event, eventTime){
      var objectId = object.basisObjectId;
      var eventMap = map[event];

      if (!eventMap)
        eventMap = map[event] = {};

      var eventObject = eventMap[objectId];

      if (eventObject)
      {
        if (isNaN(eventTime))
        {
          remove(object, event);
          return;
        }

        if (eventObject.eventTime == eventTime)
          return;

        // temporary remove from stack
        //eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
        eventStack.remove(eventObject);
        eventObject.eventTime = eventTime;
      }
      else
      {
        if (isNaN(eventTime))
          return;

        // event config
        eventObject = eventMap[objectId] = {
          eventName: event,
          object: object,
          eventTime: eventTime,
          callback: object[event]
        };
      }

      // insert event into stack
      eventStack.splice(eventStack.binarySearchPos(eventTime, EVENT_TIME_GETTER), 0, eventObject);

      setNextTime();
    }

    function remove(object, event){
      var objectId = object.basisObjectId;
      var eventObject = map[event] && map[event][objectId];

      if (eventObject)
      {
        // delete object from stack and map
        eventStack.remove(eventObject);
        delete map[event][objectId];

        setNextTime();
      }
    }

    function fire(){
      var now = Date.now();
      var pos = eventStack.binarySearchPos(now + 15, EVENT_TIME_GETTER);

      lockSetTimeout = true; // lock for set timeout if callback calling will add new events
      eventStack.splice(0, pos).forEach(function(eventObject){
        delete map[eventObject.eventName][eventObject.object.basisObjectId];
        eventObject.callback.call(eventObject.object);
      });
      lockSetTimeout = false; // unlock

      fireTime = NEVER;
      setNextTime();
    }

    cleaner.add({
      destroy: function(){
        lockSetTimeout = true;
        clearTimeout(timer);
        eventStack.length = 0;
        map = null;
      }
    });

    return {
      add: add,
      remove: remove
    };
  })();


  //
  // export names
  //

  module.exports = {
    nextTick: basis.nextTick,
    setImmediate: setImmediate,
    clearImmediate: clearImmediate,

    add: taskManager.add,
    remove: taskManager.remove
  };

  // deprecated
  module.exports.TimeEventManager = taskManager;
