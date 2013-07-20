
 /**
  * @namespace basis.timer
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var cleaner = basis.cleaner;
  var getter = basis.getter;
  var arrayFrom = basis.array.from;

  var MESSAGE_NAME = 'basisjs.setImmediate';
  var createScript = function(){
    return document.createElement('script');
  };

  //
  // Support for setImmediate/clearImmediate
  //

  var setImmediate = global.setImmediate || global.msSetImmediate;
  var clearImmediate = global.clearImmediate || global.msSetImmediate;

  // bind context for setImmediate/clearImmediate, IE10 throw exception if context isn't global
  if (setImmediate)
    setImmediate = setImmediate.bind(global);

  if (clearImmediate)
    clearImmediate = clearImmediate.bind(global);

  //
  // emulate setImmediate/clearImmediate
  // Inspired on Domenic Denicola's solution https://github.com/NobleJS/setImmediate
  //
  if (!setImmediate)
  {
    var runTask = (function(){
      var taskById = {};
      var taskId = 1;

      // emulate setImmediate
      setImmediate = function(){
        taskById[++taskId] = {
          fn: arguments[0],
          args: arrayFrom(arguments, 1)
        };

        addToQueue(taskId);

        return taskId;
      };

      // emulate clearImmediate
      clearImmediate = function(id){
        delete taskById[id];
      };

      //
      // return result function for task run
      //
      return function(id){
        var task = taskById[id];

        if (task)
        {
          try {
            if (typeof task.fn == 'function')
              task.fn.apply(undefined, task.args);
            else
            {
              (global.execScript || function(fn){
                global['eval'].call(global, fn);
              })(String(task.fn));
            }
          } finally {
            delete taskById[id];
          }
        }
      };
    })();

    // by default
    var addToQueue = function(taskId){
      global.nativeSetTimeout_(function(){
        runTask(taskId);
      }, 0);
    };

    //
    // implement platform specific solution
    //
    if (global.MessageChannel)
    {
      addToQueue = function(taskId){
        var channel = new global.MessageChannel();
        channel.port1.onmessage = function(){
          runTask(taskId);
        };
        channel.port2.postMessage(''); // broken in Opera if no value
      };
    }
    else
    {
      // The test against `importScripts` prevents this implementation from being installed inside a web worker,
      // where `global.postMessage` means something completely different and can't be used for this purpose.
      var postMessageSupported = global.postMessage && !global.importScripts;

      // IE8 has postMessage implementation, but it is synchronous and can't be used.
      if (postMessageSupported)
      {
        var oldOnMessage = global.onmessage;
        global.onmessage = function(){
          postMessageSupported = false;
        };
        global.postMessage('', '*');
        global.onmessage = oldOnMessage;
      }

      if (postMessageSupported)
      {
        // postMessage scheme
        var handleMessage = function(event){
          if (event && event.source == global)
          {
            var taskId = String(event.data).split(MESSAGE_NAME)[1];

            if (taskId)
              runTask(taskId);
          }
        };

        if (global.addEventListener)
          global.addEventListener('message', handleMessage, true);
        else
          global.attachEvent('onmessage', handleMessage);

        // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
        // invoking our onGlobalMessage listener above.
        addToQueue = function(taskId){
          global.postMessage(MESSAGE_NAME + taskId, '*');
        };
      }
      else
      {
        if (document && 'onreadystatechange' in createScript())
        {
          // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
          // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called
          addToQueue = function(taskId){
            var scriptEl = createScript();
            scriptEl.onreadystatechange = function(){
              runTask(taskId);

              scriptEl.onreadystatechange = null;
              scriptEl.parentNode.removeChild(scriptEl);
              scriptEl = null;
            };
            document.documentElement.appendChild(scriptEl);
          };
        }
      }
    }
  }

  
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
    nextTick: setImmediate,
    setImmediate: setImmediate,
    clearImmediate: clearImmediate,

    add: taskManager.add,
    remove: taskManager.remove
  };

  // deprecated
  module.exports.TimeEventManager = taskManager;
