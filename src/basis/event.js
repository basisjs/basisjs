
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
              // it should be better for browser optimizations
              // (instead of [this].concat(slice.call(arguments)))
              args = [this];
              for (var i = 0; i < arguments.length; i++)
                args.push(arguments[i]);
            }

            fn.apply(cursor.context || this, args);
          }

          // any event callback call
          fn = cursor.callbacks['*'];
          if (typeof fn == 'function')
          {
            if (!args)
            {
              // it should be better for browser optimizations
              // (instead of [this].concat(slice.call(arguments)))
              args = [this];
              for (var i = 0; i < arguments.length; i++)
                args.push(arguments[i]);
            }

            fn.call(cursor.context || this, {
              sender: this,
              type: eventName,
              args: args
            });
          }
        }

        // feature available in development mode only
        /** @cut */ if (this.debug_emit)
        /** @cut */ {
        /** @cut */   args = [];  // avoid optimization warnings about arguments
        /** @cut */   for (var i = 0; i < arguments.length; i++)
        /** @cut */     args.push(arguments[i]);
        /** @cut */   this.debug_emit({
        /** @cut */     sender: this,
        /** @cut */     type: eventName,
        /** @cut */     args: args
        /** @cut */   });
        /** @cut */ }
      };

      // function wrapper for more verbose in development mode
      /** @cut */ eventFunction = new Function('slice',
      /** @cut */   'return {"' + namespace + '.events.' + eventName + '":\n\n      ' +
      /** @cut */
      /** @cut */     'function(' + slice.call(arguments, 1).join(', ') + '){' +
      /** @cut */       eventFunction.toString()
      /** @cut */         .replace(/\beventName\b/g, '"' + eventName + '"')
      /** @cut */         .replace(/^function[^(]*\(\)[^{]*\{|\}$/g, '') +
      /** @cut */     '}' +
      /** @cut */
      /** @cut */   '\n\n}["' + namespace + '.events.' + eventName + '"];'
      /** @cut */ )(slice);

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
    * Function that returns handler list as array.
    * WARN: This functionality is supported in development mode only.
    * @return {Array.<object>} List of handlers
    */
    /** @cut */ debug_handlers: function(){
    /** @cut */   var result = [];
    /** @cut */   var cursor = this;
    /** @cut */
    /** @cut */   while (cursor = cursor.handler)
    /** @cut */     result.push([cursor.callbacks, cursor.context]);
    /** @cut */
    /** @cut */   return result;
    /** @cut */ },

   /**
    * Function that call on any event. Use it for debug purposes.
    * WARN: This functionality is supported in development mode only.
    * @type {function(event)}
    */
    /** @cut */ debug_emit: null,

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
      /** @cut */ if (!callbacks)
      /** @cut */   basis.dev.warn(namespace + '.Emitter#addHandler: callbacks is not an object (', callbacks, ')');

      context = context || this;

      // warn about duplicates
      /** @cut */ var cursor = this;
      /** @cut */ while (cursor = cursor.handler)
      /** @cut */ {
      /** @cut */   if (cursor.callbacks === callbacks && cursor.context === context)
      /** @cut */   {
      /** @cut */     basis.dev.warn(namespace + '.Emitter#addHandler: add duplicate event callbacks', callbacks, 'to Emitter instance:', this);
      /** @cut */     break;
      /** @cut */   }
      /** @cut */ }

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
      /** @cut */ basis.dev.warn(namespace + '.Emitter#removeHandler: no handler removed');
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

  //
  // export names
  //

  module.exports = {
    create: createDispatcher,
    createHandler: createHandler,

    events: events,

    Emitter: Emitter
  };
