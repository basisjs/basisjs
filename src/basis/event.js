
 /**
  * @namespace basis.event
  */

  var namespace = this.path;

  //
  // import names
  //

  var Class = basis.Class;
  var extend = basis.object.extend;
  var slice = Array.prototype.slice;


  //
  // Main part
  //

  var NULL_HANDLER = {};
  var events = {};
  var warnOnDestroy = function(){
    throw 'Object had been destroyed before. Destroy method must not be called more than once.';
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
        /** @cut for more verbose in dev */ new Function('eventName', 'slice', 'return eventFunction = function _event_' + eventName + '(' + slice.call(arguments, 1).join(', ') + '){' +

          function dispatchEvent(){
            var args;
            var fn;

            if (eventFunction.listen)
              if (fn = this.listen[eventFunction.listenName])
                eventFunction.listen.call(this, fn, args = [this].concat(slice.call(arguments)));

            var cursor = this;
            while (cursor = cursor.handlers_)
            {
              // handler call
              if (fn = cursor.handler[eventName])
                if (typeof fn == 'function')
                  fn.apply(cursor.context, args = args || [this].concat(slice.call(arguments)));

              // any event handler
              if (fn = cursor.handler['*'])
                if (typeof fn == 'function')
                  fn.call(cursor.context, {
                    sender: this,
                    type: eventName,
                    args: arguments
                  });
            }

            // WARN: this feature is not available in producation
            ;;;if (this.event_debug) this.event_debug({ sender: this, type: eventName, args: arguments });
          }

        /** @cut for more verbose in dev */ .toString().replace(/\beventName\b/g, "'" + eventName + "'").replace(/^function[^(]*\(\)[^{]*\{|\}$/g, '') + '}')(eventName, slice);

      if (LISTEN_MAP[eventName])
        extend(eventFunction, LISTEN_MAP[eventName]);
    }

    return eventFunction;
  }


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
        listen: handler || function(listenHandler, args){
          if (args[1])  // second argument is oldObject
            args[1].removeHandler(listenHandler, this);

          if (this[propertyName])
            this[propertyName].addHandler(listenHandler, this);
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
  var Emitter = Class(null, {
    className: namespace + '.Emitter',

   /**
    * List of event handler sets.
    * @type {Array.<object>}
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
    * @param {basis.Emitter} object Reference for object wich is destroing.
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
    * @constructor
    */
    init: function(){
      // add first handler
      if (this.handler)
      {
        this.addHandler(this.handler, this.handlerContext);
        this.handler = null;
        this.handlerContext = null;
      }
    },

   /**
    * Registrates new event handler set for object.
    * @param {object} handler Event handler set.
    * @param {object=} context Context object.
    */
    addHandler: function(handler, context){
      ;;;if (!handler) basis.dev.warn('Emitter#addHandler: `handler` argument is not an object (', handler, ')');

      context = context || this;
      
      // warn about duplicates
      ;;;var cursor = this; while (cursor = cursor.handlers_) if (cursor.handler === handler && cursor.context === context) { basis.dev.warn('Emitter#addHandler: Add duplicate handler', handler, ' to Emitter instance: ', this); break; }

      // add handler
      this.handlers_ = { 
        handler: handler,
        context: context,
        handlers_: this.handlers_
      };
    },

   /**
    * Removes event handler set from object. For this operation parameters
    * must be the same (equivalent) as used for addHandler method.
    * @param {object} handler Event handler set.
    * @param {object=} context Context object.
    */
    removeHandler: function(handler, context){
      if (!this.handlers_)
        return;

      if (!context)
        context = this;

      // search for handler and remove it
      var cursor = this;
      var prev = cursor;
      while (cursor = cursor.handlers_)
      {
        if (cursor.handler === handler && cursor.context === context)
        {
          cursor.handler = NULL_HANDLER; // make it non-callable
          prev.handlers_ = cursor.handlers_;
          return;
        }
        prev = cursor;
      }

      // handler not found
      ;;;basis.dev.warn('Emitter#removeHandler: method didn\'t remove any handler');
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

    Emitter: Emitter,

    // deprecated
    EventObject: Emitter
  }; 
