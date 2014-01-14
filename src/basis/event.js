
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
    /** @cut */ basis.dev.warn('Object had been destroyed before. Destroy method must not be called more than once.');
  };


 /**
  * Creates new type of event or returns existing one, if it was created before.
  * @param {string} eventName
  * @return {function(..eventArgs)}
  */
  function createDispatcher(eventName){
    var eventFunction = events[eventName];

    if (!eventFunction)
    {
      eventFunction = function(){
        var cursor = this;
        var args;
        var fn;

        while (cursor = cursor.handler)
        {
          // callback call
          fn = cursor.callbacks[eventName];
          if (typeof fn == 'function')
          {
            if (!args)
            {
              // it should be better for browser optimizations (instead of [this].concat(slice.call(arguments)))
              args = [this];
              for (var i = 0; i < arguments.length; i++)
                args.push(arguments[i]);
            }

            fn.apply(cursor.context || this, args);
          }

          // any event callback call
          fn = cursor.callbacks['*'];
          if (typeof fn == 'function')
            fn.call(cursor.context || this, {
              sender: this,
              type: eventName,
              args: arguments
            });
        }

        // that feature available in development mode only
        if (DEVMODE && this.debug_emit)
          this.debug_emit({
            sender: this,
            type: eventName,
            args: arguments
          });
      };

      // function wrapper for more verbose in development mode
      if (DEVMODE)
      {
        eventFunction = new Function('slice, DEVMODE',
          'return {"' + namespace + '.events.' + eventName + '":\n\n      ' +

            'function(' + slice.call(arguments, 1).join(', ') + '){' +
              eventFunction.toString()
                .replace(/\beventName\b/g, '"' + eventName + '"')
                .replace(/^function[^(]*\(\)[^{]*\{|\}$/g, '') +
            '}' +

          '\n\n}["' + namespace + '.events.' + eventName + '"];'
        )(slice, DEVMODE);
      }

      events[eventName] = eventFunction;
    }

    return eventFunction;
  }

 /**
  * @param {string|Array.<string>=} events
  * @param {function} eventCallback
  * @return {object}
  */
  function createHandler(events, eventCallback){
    var handler = {
      events: []
    };

    if (events)
    {
      events = String(events).trim().split(/\s+|\s*,\s*/).sort();
      handler = {
        events: events
      };

      for (var i = 0, eventName; eventName = events[i]; i++)
        if (eventName != 'destroy')
          handler[eventName] = eventCallback;
    }

    return handler;
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

   /**
    * Fires when object is destroing.
    * NOTE: don't override
    * @event
    */
    emit_destroy: createDispatcher('destroy'),

   /**
    * Related object listeners.
    */
    listen: Class.nestedExtendProperty(),

   /**
    * @constructor
    */
    init: function(){
      if (this.handler && !this.handler.callbacks)
        this.handler = {
          callbacks: this.handler,
          context: this,
          handler: null
        };
    },

   /**
    * Adds new event handler to object.
    * @param {object} callbacks Callback set.
    * @param {object=} context Context object.
    */
    addHandler: function(callbacks, context){
      if (DEVMODE && !callbacks)
        basis.dev.warn(namespace + '.Emitter#addHandler: callbacks is not an object (', callbacks, ')');

      context = context || this;

      // warn about duplicates
      if (DEVMODE)
      {
        var cursor = this;
        while (cursor = cursor.handler)
        {
          if (cursor.callbacks === callbacks && cursor.context === context)
          {
            basis.dev.warn(namespace + '.Emitter#addHandler: add duplicate event callbacks', callbacks, 'to Emitter instance:', this);
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
      var prev;

      context = context || this;

      // search for handler and remove it
      while (prev = cursor, cursor = cursor.handler)
        if (cursor.callbacks === callbacks && cursor.context === context)
        {
          // make it non-callable
          cursor.callbacks = NULL_HANDLER;

          // remove from list
          prev.handler = cursor.handler;

          return;
        }

      // handler not found
      if (DEVMODE)
        basis.dev.warn(namespace + '.Emitter#removeHandler: no handler removed');
    },

   /**
    * @destructor
    */
    destroy: function(){
      // warn on destroy method call (only in debug mode)
      this.destroy = warnOnDestroy;

      // fire object destroy event handlers
      this.emit_destroy();

      // drop event handlers if any
      this.handler = null;
    }
  });


  if (DEVMODE)
  {
    Emitter.extend({
     /**
      * Function that returns handler list as array.
      * WARN: This functionality is supported in development mode only.
      * @return {Array.<object>} List of handlers
      */
      debug_handlers: function(){
        var result = [];
        var cursor = this;

        while (cursor = cursor.handler)
          result.push([cursor.callbacks, cursor.context]);

        return result;
      },

     /**
      * Function that call on any event. Use it for debug purposes.
      * WARN: This functionality is supported in development mode only.
      * @type {function(event)}
      */
      debug_emit: null
    });
  }


  //
  // export names
  //

  module.exports = {
    create: createDispatcher,
    createHandler: createHandler,

    events: events,

    Emitter: Emitter
  };
