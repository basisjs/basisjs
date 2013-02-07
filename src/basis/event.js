
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
    add: function(listenName, eventName, propertyName, callback){
      if (!propertyName)
        propertyName = listenName;

      LISTEN_MAP[eventName] = {
        listenName: listenName,
        listen: callback || function(listenHandler, args){
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
  function createDispatcher(eventName){
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

        while (cursor = cursor.handler)
        {
          // callback call
          if (fn = cursor.callbacks[eventName])
            if (typeof fn == 'function')
              fn.apply(cursor.context || this, args = args || [this].concat(slice.call(arguments)));

          // any event callback call
          if (fn = cursor.callbacks['*'])
            if (typeof fn == 'function')
              fn.call(cursor.context || this, {
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
          'return eventFunction = function(' + slice.call(arguments, 1).join(', ') + '){' +
          '//' + namespace + '.dispatcher.' + eventName + '\n' +
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

    // use extend constructor
    extendConstructor_: true,

   /**
    * Head of event handler set list.
    * @type {object}
    * @private
    */
    handler: null,

    // TODO: remove
    handlerContext: null,

   /**
    * Fires when object is destroing.
    * NOTE: don't override
    * @event
    */
    event_destroy: createDispatcher('destroy'),

   /**
    * Related object listeners.
    */
    listen: Class.nestedExtendProperty(),

   /**
    * @constructor
    */
    init: function(){
      // process handler
      if (this.handler && !this.handler.callbacks)
      {
        this.handler = {
          callbacks: this.handler,
          context: this.handlerContext || this
        }
      }
    },

   /**
    * Adds new event handler to object.
    * @param {object} callbacks Callback set.
    * @param {object=} context Context object.
    */
    addHandler: function(callbacks, context){
      if (DEVMODE && !callbacks)
        basis.dev.warn('Emitter#addHandler: callbacks is not an object (', callbacks, ')');

      context = context || this;
      
      // warn about duplicates
      if (DEVMODE)
      {
        var cursor = this;
        while (cursor = cursor.handler)
        {
          if (cursor.callbacks === callbacks && cursor.context === context)
          {
            basis.dev.warn('Emitter#addHandler: add duplicate event callbacks', callbacks, 'to Emitter instance:', this);
            break;
          }
        }
      }

      // add handler
      this.handler = { 
        callbacks: callbacks,
        context: context,
        handler: this.handler
      };
    },

   /**
    * Removes event handler set from object. For this operation parameters
    * must be the same (equivalent) as used for addHandler method.
    * @param {object} callbacks Callback set.
    * @param {object=} context Context object.
    */
    removeHandler: function(callbacks, context){
      var cursor = this;
      var prev = cursor;

      context = context || this;

      // search for handler and remove it
      while (cursor = cursor.handler)
      {
        if (cursor.callbacks === callbacks && cursor.context === context)
        {
          cursor.callbacks = NULL_HANDLER; // make it non-callable
          prev.handler = cursor.handler;
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
      this.handler = null;
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

    create: createDispatcher,
    events: events,

    Emitter: Emitter,

    // deprecated
    EventObject: Emitter
  }; 
