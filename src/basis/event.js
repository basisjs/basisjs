
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

  /** @const */ var DEVMODE = false /** @cut */ || true;

  var NULL_HANDLER = {};
  var events = {};
  var warnOnDestroy = function(){
    throw 'Object had been destroyed before. Destroy method must not be called more than once.';
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
        listen: handler || function(listenHandler, args){
          if (args[0])  // second argument is oldObject
            args[0].removeHandler(listenHandler, this);

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
  * Creates new type of event or returns existing one, if it was created before.
  * @param {string} eventName
  * @func
  */
  function createEvent(eventName){
    var eventFunction = events[eventName];

    if (!eventFunction)
    {
      eventFunction = function(){
        var cursor = this;
        var args;
        var fn;

        if (eventFunction.listen)
          if (fn = this.listen[eventFunction.listenName])
            eventFunction.listen.call(this, fn, arguments);

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

        // that feature available in development mode only
        if (DEVMODE && this.event_debug)
          this.event_debug({
            sender: this,
            type: eventName,
            args: arguments
          });
      };

      // function wrapper for more verbose in development mode
      if (DEVMODE)
      {
        eventFunction = new Function('eventName', 'slice', 'DEVMODE',
          'var eventFunction;\n' +
          'return eventFunction = function _event_' + eventName + '(' + slice.call(arguments, 1).join(', ') + '){' +
          eventFunction.toString()
            .replace(/\beventName\b/g, "'" + eventName + "'")
            .replace(/^function[^(]*\(\)[^{]*\{|\}$/g, '') + 
        '}')(eventName, slice, DEVMODE);
      }

      events[eventName] = eventFunction;

      if (LISTEN_MAP[eventName])
        extend(eventFunction, LISTEN_MAP[eventName]);
    }

    return eventFunction;
  }


 /**
  * Base class for event dispatching. It provides interface for instance
  * to add and remove handler for desired events, and call it when event happens. 
  * @class
  */
  var Emitter = Class(null, {
    className: namespace + '.Emitter',

   /**
    * List of event handler sets.
    * @type {object}
    * @private
    */
    handlers_: null,

   /**
    * Fires when object is destroing.
    * NOTE: don't override
    * @event
    */
    event_destroy: createEvent('destroy'),

   /**
    * Related object listeners.
    */
    listen: Class.nestedExtendProperty(),

    // use extend constructor
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
    * Adds new event handler to object.
    * @param {object} handler Event handler set.
    * @param {object=} context Context object.
    */
    addHandler: function(handler, context){
      if (DEVMODE && !handler)
        basis.dev.warn('Emitter#addHandler: handler is not an object (', handler, ')');

      context = context || this;
      
      // warn about duplicates
      if (DEVMODE)
      {
        var cursor = this;
        while (cursor = cursor.handlers_)
        {
          if (cursor.handler === handler && cursor.context === context)
          {
            basis.dev.warn('Emitter#addHandler: add duplicate event handler', handler, 'to Emitter instance:', this);
            break;
          }
        }
      }

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
      context = context || this;

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
      if (DEVMODE && prev !== this)
        basis.dev.warn('Emitter#removeHandler: nothing removed');
    },

   /**
    * @destructor
    */
    destroy: function(){
      // warn on destroy method call (only in debug mode)
      if (DEVMODE)
        this.destroy = warnOnDestroy;

      // fire object destroy event handlers
      this.event_destroy();

      // drop event handlers if any
      this.handlers_ = null;
    }
  });


  if (DEVMODE)
  {
    Emitter.extend({
     /**
      * Function that call on any event. Use it for debug purposes.
      * WARN: This functionality is supported in development only.
      * @type {function(event)}
      */
      event_debug: null
    });
  }



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
