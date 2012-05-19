/*
  Basis javascript library 
  http://code.google.com/p/basis-js/
 
  @copyright
  Copyright (c) 2006-2012 Roman Dvornov.
 
  @license
  GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
*/

 /**
  * @namespace basis.timer
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Cleaner = basis.Cleaner;
  var getter = Function.getter;


  //
  // Support for setImmediate/clearImmediate and fast setTimeout(.., 0)
  //

  (function(){

    //
    // Inspired on Domenic Denicola's solution https://github.com/NobleJS/setImmediate
    //

    if (global.msSetImmediate && global.msClearImmediate)
    {
      global.setImmediate = global.msSetImmediate;
      global.clearImmediate = global.msClearImmediate;
    }

    if (!global.setImmediate)
    {
      var createScript = function(){
        return document.createElement("script");
      }

      var MESSAGE_NAME = "setImmediate.basis";

      // by default
      var addToQueue = function(taskId){
        global.nativeSetTimeout_(function(){
          runTask(taskId);
        }, 0);
      };

      var runTask = (function(){
        var taskById = {};
        var taskId = 1;

        //
        // Add support for setImmediate
        //
        global.setImmediate = function(){
          taskById[++taskId] = {
            fn: arguments[0],
            args: Array.from(arguments, 1)
          };

          addToQueue(taskId);

          return taskId;
        };

        //
        // Remove support for clearImmediate
        //
        global.clearImmediate = function(taskId){
          delete taskById[taskId];
        };

        //
        // return result function for task run
        //
        return function(taskId){
          var task = taskById[taskId];

          if (task)
          {
            try {
              if (typeof task.fn == 'function')
                task.fn.apply(undefined, task.args);
              else
              {
                (global.execScript || function(fn){
                  global["eval"].call(global, fn);
                })(String(task.fn));
              }

            } finally {
              delete taskById[taskId];
            }
          }
        }
      })();


      //
      // implement platform specific solution
      //
      if (global.MessageChannel)
      {
        var addToQueue = function(taskId){
          var channel = new global.MessageChannel();
          channel.port1.onmessage = function(){
            runTask(taskId);
          };
          channel.port2.postMessage(""); // broken in Opera if no value
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
          global.postMessage("", "*");
          global.onmessage = oldOnMessage;
        }

        if (postMessageSupported)
        {
          // postMessage sheme
          var handleMessage = function(event){
            if (event && event.source == global)
            {
              var taskId = String(event.data).split(MESSAGE_NAME)[1];

              if (taskId)
                runTask(taskId)
            }
          }

          if (global.addEventListener)
            global.addEventListener("message", handleMessage, true);
          else
            global.attachEvent("onmessage", handleMessage);

          // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
          // invoking our onGlobalMessage listener above.
          var addToQueue = function(taskId){
            postMessage(MESSAGE_NAME + taskId, "*");
          };
        }
        else
        {
          if (document && "onreadystatechange" in createScript())
          {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called
            var addToQueue = function(taskId){
              var scriptEl = createScript();
              scriptEl.onreadystatechange = function(){
                runTask(taskId);

                scriptEl.onreadystatechange = null;
                scriptEl.parentNode.removeChild(scriptEl);
                scriptEl = null;
              };
              document.documentElement.appendChild(scriptEl);
            }
          }
        }
      }
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
        ? MESSAGE_NAME + global.setImmediate(fn)
        : global.nativeSetTimeout_(fn, timeout);
    };

    //
    // Override clearTimeout
    //
    global.clearTimeout = function(timer){
      var immediateId = String(timer).split(MESSAGE_NAME)[1];

      return immediateId
        ? global.clearImmediate(immediateId)
        : global.nativeClearTimeout_(timer);
    };
  })();


  //
  // TimeEventManager
  //

  var TimeEventManager = (function(){
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
      var objectId = object.eventObjectId;
      var eventMap = map[event];

      if (!eventMap)
        eventMap = map[event] = {};

      var eventObject = eventMap[objectId];

      if (eventObject)
      {
        if (isNaN(eventTime))
          return remove(object, event);

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
      var objectId = object.eventObjectId;
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
        delete map[eventObject.eventName][eventObject.object.eventObjectId];
        eventObject.callback.call(eventObject.object);
      });
      lockSetTimeout = false; // unlock

      fireTime = NEVER;
      setNextTime();
    }

    Cleaner.add({
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

  module.exports ={
    TimeEventManager: TimeEventManager
  };
