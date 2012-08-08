
 /**
  * @namespace basis.event
  */

  var namespace = this.path;

  //
  // import names
  //

  var Class = basis.Class;
  var extend = Object.extend;
  var slice = Array.prototype.slice;


  //
  // Main part
  //

  var eventObjectId = 1; // EventObject seed ID
  var events = {};


 /**
  * @func
  */
  var warnOnDestroy = function(){
    throw 'Object had been destroed before. Destroy method shouldn\'t be call more than once.'
  };


 /**
  * Creates new type of event or returns existing one, if it was created before.
  * @param {string} eventName
  * @func
  */
  function createEvent(eventName){
    var eventFunction = events[eventName];

    if (!eventFunction)
    {
      eventFunction = events[eventName] = 
        /** @cut for more verbose in dev */ Function('eventName', 'slice', 'eventFunction', 'return eventFunction = function _event_' + eventName + '(' + Array.from(arguments, 1).join(', ') + '){' + 

          function dispatchEvent(){
            var handlers = this.handlers_;
            var handler;
            var args;
            var fn;

            if (eventFunction.listen)
              if (fn = this.listen[eventFunction.listenName])
                eventFunction.listen.call(this, fn, args = [this].concat(slice.call(arguments)));

            if (handlers && handlers.length)
            {
              // prevent handlers list from changes
              handlers = slice.call(handlers);

              for (var i = handlers.length; i --> 0;)
              {
                handler = handlers[i];

                // handler call
                if (fn = handler.handler[eventName])
                  if (typeof fn == 'function')
                  {
                    args = args || [this].concat(slice.call(arguments));
                    fn.apply(handler.thisObject, args);
                  }

                // any event handler
                if (fn = handler.handler['*'])
                  if (typeof fn == 'function')
                    fn.call(handler.thisObject, {
                      sender: this,
                      type: eventName,
                      args: arguments
                    });
              }
            }

            // WARN: this feature is not available in producation
            ;;;if (this.event_debug) this.event_debug({ sender: this, type: eventName, args: arguments });
          }

        /** @cut for more verbose in dev */ .toString().replace(/\beventName\b/g, '\'' + eventName + '\'').replace(/^function[^(]*\(\)[^{]*\{|\}$/g, '') + '}')(eventName, slice);

      if (LISTEN_MAP[eventName])
        extend(eventFunction, LISTEN_MAP[eventName]);
    }

    return eventFunction;
  };


  //
  // listen scheme
  //

  var LISTEN_MAP = {};
  var LISTEN = {
    add: function(listenName, eventName, propertyName, handler){
      if (!propertyName)
        propertyName = listenName;

      LISTEN_MAP[eventName] = {
        listenName: listenName,
        listen: handler || function(listen, args){
          var object;

          if (object = args[1])  // second argument is oldObject
            object.removeHandler(listen, this);

          if (object = this[propertyName])
            object.addHandler(listen, this);
        }
      };

      var eventFunction = events[eventName];
      if (eventFunction)
        extend(eventFunction, LISTEN_MAP[eventName]);
    }
  };


 /**
  * Base class for event dispacthing. It provides model when it's instance
  * can registrate handlers for events, and call it when event happend. 
  * @class
  */
  var EventObject = Class(null, {
    className: namespace + '.EventObject',

   /**
    * List of event handler sets.
    * @type {Array.<Object>}
    * @private
    */
    handlers_: null,

   /**
    * Function that call on any event. Use it to debug purposes only.
    * WARN: This functionality is not supported in producation.
    * @type {function(event)}
    * @debug
    */
    /** @cut */event_debug: null,

   /**
    * Fires when object is destroing.
    * NOTE: don't override
    * @param {Basis.EventObject} object Reference for object wich is destroing.
    * @event
    */
    event_destroy: createEvent('destroy'),

   /**
    * Related object listeners.
    */
    listen: Class.nestedExtendProperty(),

   /** use extend constructor */
    extendConstructor_: true,

   /**
    * @param {Object=} config
    * @constructor
    */
    init: function(){
      // fast add first handler
      if (this.handler)
      {
        (this.handlers_ || (this.handlers_ = [])).push({
          handler: this.handler,
          thisObject: this.handlerContext || this
        });
      }
    },

   /**
    * Registrates new event handler set for object.
    * @param {Object} handler Event handler set.
    * @param {Object=} thisObject Context object.
    * @return {boolean} Whether event handler set was added.
    */
    addHandler: function(handler, thisObject){
      var handlers = this.handlers_;

      if (!handlers)
        handlers = this.handlers_ = [];

      if (!thisObject)
        thisObject = this;

      ;;;if (!handler && typeof console != 'undefined') console.warn('EventObject#addHandler: `handler` argument is not an object (', handler, ')');
      
      // search for duplicate
      // check from end to start is more efficient for objects which often add/remove handlers
      for (var i = handlers.length, item; i --> 0;)
      {
        item = handlers[i];
        if (item.handler === handler && item.thisObject === thisObject)
        {
          ;;;if (typeof console != 'undefined') console.warn('EventObject#addHandler: Add dublicate handler to EventObject instance: ', this);
          return false;
        }
      }

      // add handler
      return !!handlers.push({ 
        handler: handler,
        thisObject: thisObject
      });
    },

   /**
    * Removes event handler set from object. For this operation parameters
    * must be the same (equivalent) as used for addHandler method.
    * @param {Object} handler Event handler set.
    * @param {Object=} thisObject Context object.
    * @return {boolean} Whether event handler set was removed.
    */
    removeHandler: function(handler, thisObject){
      var handlers = this.handlers_;

      if (!handlers)
        return;

      if (!thisObject)
        thisObject = this;

      ;;;if (!handler && typeof console != 'undefined') console.warn('EventObject#addHandler: `handler` argument is not an object (', handler, ')');

      // search for handler and remove
      // check from end to start is more efficient for objects which often add/remove handlers
      for (var i = handlers.length, item; i --> 0;)
      {
        item = handlers[i];
        if (item.handler === handler && item.thisObject === thisObject)
          return !!handlers.splice(i, 1);
      }

      // handler not found
      return false;
    },

   /**
    * @destructor
    */
    destroy: function(){
      // warn on destroy method call (only in debug mode)
      ;;;this.destroy = warnOnDestroy;

      if (this.handlers_)
      {
        // fire object destroy event handlers
        events.destroy.call(this);

        // remove all event handler sets
        this.handlers_ = null;
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    LISTEN: LISTEN,

    create: createEvent,
    events: events,

    EventObject: EventObject
  }; 
