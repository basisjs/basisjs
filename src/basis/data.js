
 /**
  * This namespace contains base classes and functions for data maintain.
  *
  * Namespace overview:
  * - Const:
  *   {basis.data.STATE}, {basis.data.SUBSCRIPTION}
  * - Classes:
  *   {basis.data.AbstractData}, {basis.data.Value},
  *   {basis.data.Object}, {basis.data.Slot},
  *   {basis.data.KeyObjectMap}, {basis.data.ReadOnlyDataset},
  *   {basis.data.DatasetWrapper}, {basis.data.Dataset},
  *   {basis.data.ResolveAdapter}
  * - Functions:
  *   {basis.data.isConnected}, {basis.data.getDatasetDelta},
  *   {basis.data.resolveDataset}, {basis.data.resolveObject}, {basis.data.resolveValue},
  *   {basis.data.wrapData}, {basis.data.wrapObject}, {basis.data.wrap}
  *
  * @namespace basis.data
  */

  var namespace = 'basis.data';


  //
  // import names
  //

  var Class = basis.Class;

  var sliceArray = Array.prototype.slice;
  var values = basis.object.values;
  var $self = basis.fn.$self;

  var STATE = require('basis.data.state');
  var SUBSCRIPTION = require('basis.data.subscription');
  var resolvers = require('basis.data.resolve');
  var createResolveFunction = resolvers.createResolveFunction;
  var resolveValue = resolvers.resolveValue;
  var ResolveAdapter = resolvers.ResolveAdapter;
  var BBResolveAdapter = resolvers.BBResolveAdapter;
  var DEFAULT_CHANGE_ADAPTER_HANDLER = resolvers.DEFAULT_CHANGE_ADAPTER_HANDLER;
  var DEFAULT_DESTROY_ADAPTER_HANDLER = resolvers.DEFAULT_DESTROY_ADAPTER_HANDLER;
  var basisEvent = require('basis.event');
  var Emitter = basisEvent.Emitter;
  var createEvent = basisEvent.create;
  var createEventHandler = basisEvent.createHandler;
  var events = basisEvent.events;
  var AbstractData = require('./data/AbstractData.js');


  //
  // Constants
  //

  var NULL_OBJECT = {};
  var EMPTY_ARRAY = [];
  var FACTORY = basis.FACTORY;
  var PROXY = basis.PROXY;

  // Register base subscription types
  SUBSCRIPTION.addProperty('delegate');
  SUBSCRIPTION.addProperty('target');
  SUBSCRIPTION.addProperty('dataset');
  SUBSCRIPTION.addProperty('value', 'change');


  var isEqual = function(a, b){
    return a === b;
  };

  //
  // Dev
  //

  /** @cut */ var PROXY_SUPPORT = typeof Proxy == 'function' && typeof WeakMap == 'function';
  /** @cut */ var devWrap = function(value){
  /** @cut */   return value;
  /** @cut */ };
  /** @cut */ var devUnwrap = function(value){
  /** @cut */   return value;
  /** @cut */ };

  /** @cut */ if (PROXY_SUPPORT)
  /** @cut */ {
  /** @cut */   var devWrapMap = new WeakMap();
  /** @cut */   var devWrap = function(value){
  /** @cut */     var result = new Proxy(value, {});
  /** @cut */     devWrapMap.set(result, value);
  /** @cut */     return result;
  /** @cut */   };
  /** @cut */   devUnwrap = function(value){
  /** @cut */     return devWrapMap.has(value) ? devWrapMap.get(value) : value;
  /** @cut */   };
  /** @cut */   isEqual = function(a, b){
  /** @cut */     return devUnwrap(a) === devUnwrap(b);
  /** @cut */   };
  /** @cut */ }


  //
  // Value
  //

  var GETTER_ID = basis.getter.ID;
  var VALUE_EMMITER_HANDLER = {
    destroy: function(object){
      this.value.unlink(object, this.fn);
    }
  };
  var VALUE_EMMITER_DESTROY_HANDLER = {
    destroy: function(){
      this.set(null);
    }
  };

  var computeFunctions = {};
  var valueSetters = {};
  var valueSyncAs = function(value){
    Value.prototype.set.call(this, value);
  };
  var valueSyncPipe = function(newValue, oldValue){
    if (oldValue instanceof Emitter)
      oldValue.removeHandler(this.pipeHandler, this);
    else
      oldValue = null;

    if (newValue instanceof Emitter)
      newValue.addHandler(this.pipeHandler, this);
    else
      newValue = null;

    if (newValue !== oldValue)
      Value.prototype.set.call(this, newValue);
  };

 /**
  * @class
  */
  var Value = Class(AbstractData, {
    className: namespace + '.Value',
    propertyDescriptors: {
      value: 'change',
      bindingBridge: false,
      initValue: false,
      locked: false,
      proxy: false,
      setNullOnEmitterDestroy: false
    },

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.VALUE,

   /**
    * Fires when value was changed.
    * @param {*} oldValue Value before changes.
    * @event
    */
    emit_change: createEvent('change', 'oldValue') && function(oldValue){
      events.change.call(this, oldValue);

      var cursor = this;
      while (cursor = cursor.links_)
        cursor.fn.call(cursor.context, this.value, oldValue);
    },

   /**
    * Actual value.
    * @type {*}
    */
    value: null,

   /**
    * Value that was set on init.
    * @type {*}
    */
    initValue: null,

   /**
    * Function for preprocessing value before set.
    * @type {function(value)}
    */
    proxy: null,

   /**
    * Indicates that property is locked (don't fire event for changes).
    * @type {number}
    */
    locked: 0,

   /**
    * Value before property locked (passed as oldValue when property unlock).
    * @type {*}
    * @private
    */
    lockedValue_: null,

   /**
    * @type {object}
    */
    links_: null,

   /**
    * @type {basis.data.DeferredValue}
    */
    deferred_: null,

   /**
    * @type {object}
    */
    pipes_: null,

   /**
    * @type {boolean}
    */
    setNullOnEmitterDestroy: true,

   /**
    * Settings for bindings.
    */
    bindingBridge: {
      attach: function(host, callback, context, onDestroy){
        host.link(context, callback, true, onDestroy);
      },
      detach: function(host, callback, context){
        host.unlink(context, callback);
      },
      get: function(host){
        return host.value;
      }
    },

   /**
    * @constructor
    */
    init: function(){
      AbstractData.prototype.init.call(this);

      if (this.proxy)
        this.value = this.proxy(this.value);

      if (this.setNullOnEmitterDestroy && this.value instanceof Emitter)
        this.value.addHandler(VALUE_EMMITER_DESTROY_HANDLER, this);

      this.initValue = this.value;
    },

   /**
    * Sets new value but only if value is not equivalent to current
    * property's value. Change event emit if value was changed.
    * @param {*} value New value for property.
    * @return {boolean} Returns true if value was changed.
    */
    set: function(value){
      var oldValue = this.value;
      var newValue = this.proxy ? this.proxy(value) : value;
      var changed = newValue !== oldValue;

      if (changed)
      {
        if (this.setNullOnEmitterDestroy)
        {
          if (oldValue instanceof Emitter)
            oldValue.removeHandler(VALUE_EMMITER_DESTROY_HANDLER, this);
          if (newValue instanceof Emitter)
            newValue.addHandler(VALUE_EMMITER_DESTROY_HANDLER, this);
        }

        this.value = newValue;

        if (!this.locked)
          this.emit_change(oldValue);
      }

      return changed;
    },

   /**
    * Restore init value.
    */
    reset: function(){
      this.set(this.initValue);
    },

   /**
    * Returns boolean value is locked or not.
    * @return {boolean}
    */
    isLocked: function(){
      return this.locked > 0;
    },

   /**
    * Locks value for change event fire.
    */
    lock: function(){
      this.locked++;

      if (this.locked == 1)
        this.lockedValue_ = this.value;
    },

   /**
    * Unlocks value for change event fire. If value changed during object
    * was locked, than change event fires.
    */
    unlock: function(){
      if (this.locked)
      {
        this.locked--;

        if (!this.locked)
        {
          var lockedValue = this.lockedValue_;

          this.lockedValue_ = null;

          if (this.value !== lockedValue)
            this.emit_change(lockedValue);
        }
      }
    },

   /**
    * @param {string|Array.<string>=} events
    * @param {function(object, value)} fn
    * @return {function(object)}
    */
    compute: function(events, fn){
      if (!fn)
      {
        fn = events;
        events = null;
      }

      if (!fn)
        fn = $self;

      var hostValue = this;
      var handler = createEventHandler(events, function(object){
        Value.prototype.set.call(this, fn(object, hostValue.value)); // `this` is a compute value
      });
      var fnId = fn[GETTER_ID] || String(fn);
      var getComputeValueId = handler.events.concat(fnId, this.basisObjectId).join('_');
      var getComputeValue = computeFunctions[getComputeValueId];

      if (!getComputeValue)
      {
        var computeMap = {};

        handler.destroy = function(object){
          delete computeMap[object.basisObjectId];
          this.destroy(); // `this` is a compute value
        };

        this.addHandler({
          change: function(){
            for (var key in computeMap)
            {
              var pair = computeMap[key];
              Value.prototype.set.call(pair.value, fn(pair.object, this.value));
            }
          },
          destroy: function(){
            for (var key in computeMap)
            {
              var pair = computeMap[key];
              pair.object.removeHandler(handler, pair.value);
              pair.value.destroy();
            }

            computeMap = null;
            hostValue = null;
          }
        });

        getComputeValue = computeFunctions[getComputeValueId] = function(object){
          /** @cut */ if (object instanceof Emitter == false)
          /** @cut */   basis.dev.warn('basis.data.Value#compute: object should be an instanceof basis.event.Emitter');

          var objectId = object.basisObjectId;
          var pair = computeMap[objectId];
          var value = fn(object, hostValue.value);

          if (!pair)
          {
            // create token with computed value
            var computeValue = new ReadOnlyValue({
              value: value
            });

            /** @cut */ basis.dev.setInfo(computeValue, 'sourceInfo', {
            /** @cut */   type: 'Value#compute',
            /** @cut */   source: [object, hostValue],
            /** @cut */   events: events,
            /** @cut */   transform: fn
            /** @cut */ });

            // attach handler re-evaluate handler to object
            object.addHandler(handler, computeValue);

            // store to map
            pair = computeMap[objectId] = {
              value: computeValue,
              object: object
            };
          }
          else
          {
            // recalc value
            Value.prototype.set.call(pair.value, value);
          }

          return pair.value;
        };
      }

      // return getComputeValue;
      return chainValueFactory(function factory(object){
        var value = getComputeValue(object);

        /** @cut */ if (PROXY_SUPPORT)
        /** @cut */   basis.dev.setInfo(value = devWrap(value), 'loc', basis.dev.getInfo(factory, 'loc'));

        return value;
      });
    },

   /**
    * @param {string|Array.<string>} events
    * @param {function(obj):any} getter
    * @return {basis.data.Value}
    */
    pipe: function(events, getter){
      var pipeHandler = createEventHandler(events, valueFromSetProxy);
      var getterId = getter[GETTER_ID] || String(getter);
      var id = pipeHandler.events.join('_') + '_' + getterId;
      var pipes = this.pipes_;
      var pipeValue;

      if (!pipes)
        pipes = this.pipes_ = {};
      else
        pipeValue = pipes[id];

      if (!pipeValue)
      {
        pipeValue = new PipeValue({
          source: this,
          pipeId: id,
          pipeHandler: pipeHandler
        });

        // set value and proxy aside to avoid undesirable calculations
        pipeValue.proxy = basis.getter(getter);
        if (this.value instanceof Emitter)
        {
          // set pipe value only if source value is Emitter, otherwise value is null
          pipeValue.value = pipeValue.proxy(this.value);
          this.value.addHandler(pipeHandler, pipeValue);
        }

        // add to cache and link
        pipes[id] = pipeValue;
        this.link(pipeValue, valueSyncPipe, true, pipeValue.destroy);

        /** @cut */ basis.dev.setInfo(pipeValue, 'sourceInfo', {
        /** @cut */   type: 'Value#pipe',
        /** @cut */   source: this,
        /** @cut */   events: events,
        /** @cut */   transform: pipeValue.proxy
        /** @cut */ });
      }
      /** @cut */ else
      /** @cut */   pipeValue = devWrap(pipeValue);

      return pipeValue;
    },

   /**
    * Returns Value instance which value equals to transformed via fn function.
    * @param {function(value)} fn
    * @return {basis.data.Value}
    */
    as: function(fn){
      // obsolete in 1.4
      /** @cut */ if (arguments.length > 1)
      /** @cut */   basis.dev.warn('basis.data.Value#as() doesn\'t accept deferred flag as second parameter anymore. Use value.as(fn).deferred() instead.');

      if (!fn || fn === $self)
        return this;

      if (this.links_)
      {
        // try to find value with the same function
        var cursor = this;
        var fnId = fn[GETTER_ID] || String(fn);

        while (cursor = cursor.links_)
        {
          var context = cursor.context;
          if (context instanceof ReadOnlyValue &&
              context.proxy &&
              (context.proxy[GETTER_ID] || String(context.proxy)) == fnId) // compare functions by id
          {
            /** @cut */ context = devWrap(context);

            return context;
          }
        }
      }

      // create transform value
      var result = new ReadOnlyValue({
        proxy: fn,
        value: this.value
      });

      /** @cut */ basis.dev.setInfo(result, 'sourceInfo', {
      /** @cut */   type: 'Value#as',
      /** @cut */   source: this,
      /** @cut */   transform: fn
      /** @cut */ });

      this.link(result, valueSyncAs, true, result.destroy);

      return result;
    },

    query: function(path){
      return Value.query(this, 'value.' + path);
    },

   /**
    * @return {basis.data.DeferredValue}
    */
    deferred: function(){
      // obsolete in 1.4
      /** @cut */ if (arguments.length > 0)
      /** @cut */   basis.dev.warn('basis.data.Value#deferred() doesn\'t accept parameters anymore. Use value.as(fn).deferred() instead.');

      if (!this.deferred_)
      {
        this.deferred_ = new DeferredValue({
          source: this,
          value: this.value
        });

        /** @cut */ basis.dev.setInfo(this.deferred_, 'sourceInfo', {
        /** @cut */   type: 'Value#deferred',
        /** @cut */   source: this
        /** @cut */ });
      }

      return this.deferred_;
    },

   /**
    * @param {object} context Target object.
    * @param {string|function} fn Property or setter function.
    * @return {object} Returns object.
    */
    link: function(context, fn, noApply, onDestroy){
      if (typeof fn != 'function')
      {
        var property = String(fn);

        fn = valueSetters[property];

        if (!fn)
          fn = valueSetters[property] = function(value){
            this[property] = value;
          };
      }

      // check for duplicates
      /** @cut */ var cursor = this;
      /** @cut */ while (cursor = cursor.links_)
      /** @cut */   if (cursor.context === context && cursor.fn === fn)
      /** @cut */   {
      /** @cut */     basis.dev.warn(this.constructor.className + '#attach: Duplicate link pair context-fn');
      /** @cut */     break;
      /** @cut */   }

      // create link
      this.links_ = {
        value: this,
        context: context,
        fn: fn,
        destroy: onDestroy || null,
        links_: this.links_
      };

      // add handler if object is basis.event.Emitter
      if (context instanceof Emitter)
        context.addHandler(VALUE_EMMITER_HANDLER, this.links_);

      if (!noApply)
        fn.call(context, this.value);

      return context;
    },

   /**
    * @param {object} context Target object.
    * @param {string|function} fn Property or setter function.
    * @return {object} Returns object.
    */
    unlink: function(context, fn){
      var cursor = this;
      var prev;

      while (prev = cursor, cursor = cursor.links_)
        if (cursor.context === context && (!fn || cursor.fn === fn))
        {
          // prevent apply new values
          cursor.fn = basis.fn.$undef;

          // delete link
          prev.links_ = cursor.links_;

          // remove handler if object is basis.event.Emitter
          if (cursor.context instanceof Emitter)
            cursor.context.removeHandler(VALUE_EMMITER_HANDLER, cursor);
        }
    },

   /**
    * @destructor
    */
    destroy: function(){
      AbstractData.prototype.destroy.call(this);

      // remove handler if value instanceof Emmiter
      if (this.setNullOnEmitterDestroy && this.value instanceof Emitter)
        this.value.removeHandler(VALUE_EMMITER_DESTROY_HANDLER, this);

      // remove event handlers from all basis.event.Emitter instances
      var cursor = this.links_;
      this.links_ = null;
      while (cursor)
      {
        if (cursor.context instanceof Emitter)
          cursor.context.removeHandler(VALUE_EMMITER_HANDLER, cursor);
        if (cursor.destroy)
          cursor.destroy.call(cursor.context);
        cursor = cursor.links_;
      }

      this.proxy = null;
      this.initValue = null;
      this.value = null;
      this.lockedValue_ = null;
      this.deferred_ = null;
      this.pipes_ = null;
    }
  });

  //
  // Read only value
  //

  var ReadOnlyValue = Class(Value, {
    className: namespace + '.ReadOnlyValue',
    set: basis.fn.$false
  });

  //
  // Deferred value
  //

  var deferredSchedule = basis.asap.schedule(function(value){
    value.unlock();
  });
  var DEFERRED_HANDLER = {
    change: function(source){
      if (!this.isLocked())
      {
        this.lock();
        deferredSchedule.add(this);
      }

      Value.prototype.set.call(this, source.value);
    },
    destroy: function(){
      this.destroy();
    }
  };

 /**
  * @class
  */
  var DeferredValue = Class(ReadOnlyValue, {
    className: namespace + '.DeferredValue',
    setNullOnEmitterDestroy: false,
    source: null,

    init: function(){
      ReadOnlyValue.prototype.init.call(this);
      this.source.addHandler(DEFERRED_HANDLER, this);
    },

    deferred: function(){
      return this;
    },

    destroy: function(){
      deferredSchedule.remove(this);
      this.source = null;
      ReadOnlyValue.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var PipeValue = Class(ReadOnlyValue, {
    className: namespace + '.PipeValue',
    source: null,
    pipeId: null,
    pipeHandler: null,
    destroy: function(){
      var source = this.source;
      var sourceValue = source.value;

      if (sourceValue instanceof Emitter)
        sourceValue.removeHandler(this.pipeHandler, this);

      source.pipes_[this.pipeId] = null;

      this.source = null;
      this.pipeHandler = null;

      ReadOnlyValue.prototype.destroy.call(this);
    }
  });


  //
  // cast to Value
  //

  var valueFromMap = {};
  var valueFromSetProxy = function(sender){
    // `this` -> value instance
    Value.prototype.set.call(this, sender);
  };

  Value.from = function(obj, events, getter){
    var result;

    if (!obj)
      return null;

    if (obj instanceof Emitter)
    {
      if (!getter)
      {
        getter = events;
        events = null;
      }

      if (!getter)
        getter = $self;

      var handler = createEventHandler(events, valueFromSetProxy);
      var getterId = getter[GETTER_ID] || String(getter);
      var id = handler.events.concat(getterId, obj.basisObjectId).join('_');

      result = valueFromMap[id];
      if (!result)
      {
        result = valueFromMap[id] = new ReadOnlyValue({
          proxy: basis.getter(getter),
          value: obj,
          handler: {
            destroy: function(){
              valueFromMap[id] = null;
              obj.removeHandler(handler, this);
            }
          }
        });

        /** @cut */ basis.dev.setInfo(result, 'sourceInfo', {
        /** @cut */   type: 'Value.from',
        /** @cut */   source: obj,
        /** @cut */   events: events,
        /** @cut */   transform: result.proxy
        /** @cut */ });

        handler.destroy = function(){
          valueFromMap[id] = null;
          this.destroy();
        };

        obj.addHandler(handler, result);
      }
      /** @cut */ else
      /** @cut */   result = devWrap(result);
    }

    if (!result)
    {
      var id = obj.basisObjectId;
      var bindingBridge = obj.bindingBridge;
      if (id && bindingBridge)
      {
        result = valueFromMap[id];
        if (!result)
        {
          result = valueFromMap[id] = new ReadOnlyValue({
            value: bindingBridge.get(obj),
            handler: {
              destroy: function(){
                valueFromMap[id] = null;
                bindingBridge.detach(obj, Value.prototype.set, result);
              }
            }
          });

          bindingBridge.attach(obj, Value.prototype.set, result, result.destroy);
        }
        /** @cut */ else
        /** @cut */   result = devWrap(result);
      }
    }

    if (!result)
      throw new Error('Bad object type');

    return result;
  };

  var UNDEFINED_VALUE = new ReadOnlyValue({
    value: undefined
  });
  var queryAsFunctionCache = {};
  var queryNestedFunctionCache = {};

  function getQueryPathFragment(target, path, index){
    var pathFragment = path[index];
    var isStatic = false;

    if (/^<static>/.test(pathFragment))
    {
      isStatic = true;
      pathFragment = pathFragment.substr(8);
    }

    var descriptor = target.propertyDescriptors[pathFragment];
    var events = descriptor ? descriptor.events : null;
    var forceApply = descriptor ? descriptor.forceApply : null;

    if (descriptor && descriptor.isPrivate)
    {
      isStatic = true;
      events = null;

      /** @cut */ var warnMessage = 'Property can\'t be accessed via query: ';
      /** @cut */ basis.dev.warn(warnMessage + path.join('.') + '\n' +
      /** @cut */   basis.string.repeat(' ', warnMessage.length + path.slice(0, index).join('.').length) +
      /** @cut */   basis.string.repeat('^', pathFragment.length)
      /** @cut */ );
    }

    if (descriptor && descriptor.isStatic)
      isStatic = true;

    if (events)
    {
      if (isStatic)
      {
        events = null;
        /** @cut */ var warnMessage = '<static> was applied for property that has events: ';
        /** @cut */ basis.dev.warn(warnMessage + path.join('.') + '\n' +
        /** @cut */   basis.string.repeat(' ', warnMessage.length + path.slice(0, index).join('.').length) +
        /** @cut */   basis.string.repeat('^', '<static>'.length) + '\n' +
        /** @cut */   'Propably is\'t a bug and <static> should be removed from path'
        /** @cut */ );
      }
      else
      {
        if (descriptor && descriptor.nested && index < path.length - 1)
        {
          var path0 = pathFragment;
          var path1 = path[++index];
          var fullPath = path0 + '.' + path1;

          pathFragment = queryNestedFunctionCache[fullPath];

          if (!pathFragment)
          {
            pathFragment = function(object){
              object = object && object[path0];
              return object ? object[path1] : undefined;
            };

            /** @cut */ pathFragment.getDevSource = function(object){
            /** @cut */   return basis.getter(fullPath);
            /** @cut */ };

            // avoid missmatch on id build
            pathFragment = queryNestedFunctionCache[fullPath] = basis.getter(pathFragment);
          }
        }
      }
    }
    else
    {
      if (!isStatic)
      {
        /** @cut */ var warnMessage = 'No events found for property: ';
        /** @cut */ basis.dev.warn(warnMessage + path.join('.') + '\n' +
        /** @cut */   basis.string.repeat(' ', warnMessage.length + path.slice(0, index).join('.').length) +
        /** @cut */   basis.string.repeat('^', pathFragment.length) + '\n' +
        /** @cut */   'If a property never changes use `<static>` before property name, i.e. ' + path.slice(0, index).join('.') + (index ? '.' : '') + '<static>' + path.slice(index).join('.')
        /** @cut */ );
        return;
      }
    }

    return {
      getter: pathFragment,
      rest: path.slice(index + 1).join('.'),
      events: events || null,
      forceApply: forceApply || null
    };
  }

  function getQueryPathFunction(path){
    var result = queryAsFunctionCache[path];

    if (!result)
    {
      var fn = function(target){
        if (target instanceof Emitter)
          return Value.query(target, path);
      };

      /** @cut */ fn.getDevSource = Function('return function(target){\n' +
      /** @cut */ '  if (target instanceof Emitter)\n' +
      /** @cut */ '    return Value.query(target, "' + path + '");\n' +
      /** @cut */ '};');
      /** @cut */ basis.dev.setInfo(fn, 'loc', null);

      // use basis.getter here because `as()` uses cache using
      // function source, but all those closures will have the same source
      result = queryAsFunctionCache[path] = basis.getter(fn);
    }

    return result;
  }

  Value.query = function(target, path){
    if (arguments.length == 1)
    {
      path = target;
      return chainValueFactory(function(target){
        return Value.query(target, path);
      });
    }

    if (target instanceof Emitter == false)
      throw new Error('Bad target type');

    if (typeof path != 'string')
      throw new Error('Path should be a string');

    var pathFragment = getQueryPathFragment(target, path.split('.'), 0);
    var result;

    if (!pathFragment)
      return UNDEFINED_VALUE;

    result = Value.from(target, pathFragment.events, pathFragment.getter);

    // if forceApply then patch settled getter (proxy for the result value)
    if (pathFragment.forceApply)
    {
      // saving settled getter
      var currentGetter = result.proxy;
      // patching proxy
      var forceApplyGetter = function(source){
        // caching getter result
        var getterResult = currentGetter(source);

        if (result.value === getterResult)
        {
          result.emit_change(result.value);
        }
        // falling thru settled getter
        return getterResult;
      };
      result.proxy = basis.getter(forceApplyGetter);
    }

    if (pathFragment.rest)
      result = result
        // use cached function as we need return the same value for equal paths
        .as(getQueryPathFunction(pathFragment.rest))
        .pipe('change', 'value');

    return result;
  };

  //
  // Value factories
  //

  function chainValueFactory(fn){
    fn.factory = FACTORY;
    fn.deferred = valueDeferredFactory;
    fn.compute = valueComputeFactory;
    fn.query = valueQueryFactory;
    fn.pipe = valuePipeFactory;
    fn.as = valueAsFactory;

    return fn;
  }

  function valueDeferredFactory(){
    var factory = this;

    return chainValueFactory(function(value){
      value = factory(value);
      return value
        ? value.deferred()
        : value;
    });
  }

  function valueComputeFactory(events, getter){
    var factory = this;

    return chainValueFactory(function(sourceValue){
      var value = factory(sourceValue);
      return value
        ? value.compute(events, getter)(sourceValue)
        : value;
    });
  }

  function valueAsFactory(getter){
    var factory = this;

    return chainValueFactory(function asFactory(value){
      value = factory(value);

      if (value)
        value = value.as(getter);

      /** @cut */ if (PROXY_SUPPORT && value)
      /** @cut */   basis.dev.setInfo(value, 'loc', basis.dev.getInfo(asFactory, 'loc'));

      return value;
    });
  }

  function valuePipeFactory(events, getter){
    var factory = this;

    return chainValueFactory(function pipeFactory(value){
      value = factory(value);

      if (value)
        value = value.pipe(events, getter);

      /** @cut */ if (PROXY_SUPPORT && value)
      /** @cut */   basis.dev.setInfo(value, 'loc', basis.dev.getInfo(pipeFactory, 'loc'));

      return value;
    });
  }

  function valueQueryFactory(path){
    var factory = this;

    return chainValueFactory(function queryFactory(value){
      value = factory(value);

      if (value)
        value = value.query(path);

      /** @cut */ if (PROXY_SUPPORT && value)
      /** @cut */   basis.dev.setInfo(value, 'loc', basis.dev.getInfo(queryFactory, 'loc'));

      return value;
    });
  }

  Value.factory = function(events, getter){
    return chainValueFactory(function factory(object){
      var value = Value.from(object, events, getter);

      /** @cut */ if (PROXY_SUPPORT && value)
      /** @cut */   basis.dev.setInfo(value, 'loc', basis.dev.getInfo(factory, 'loc'));

      return value;
    });
  };

  // state helpers

 /**
  * Helper to get Value with state from source.
  * @param {basis.data.AbstractData} source
  * @return {basis.data.Value|null}
  */

  Value.state = function(source){
    return source instanceof AbstractData
      ? Value.from(source, 'stateChanged', 'state')
      : STATE.UNDEFINED;
  };

 /**
  * Create factory to fetch state from nested object.
  * @param {string} events
  * @param {string|function()} getter
  * @return {function(basis.event.Emitter)}
  */
  Value.stateFactory = function(events, getter){
    return Value
      .factory(events, getter)
      .pipe('stateChanged', 'state')
      .as(function(state){
        return state || STATE.UNDEFINED;
      });
  };


  //
  // Object
  //

  var INIT_DATA = {};

 /**
  * Returns true if object is connected to another object through delegate chain.
  * @param {basis.data.Object} a
  * @param {basis.data.Object} b
  * @return {boolean} Whether objects are connected.
  */
  function isConnected(a, b){
    while (b && b !== a && b !== b.delegate)
      b = b.delegate;

    return b === a;
  }

 /**
  * Apply changes for all delegate graph
  */
  function applyDelegateChanges(object, oldRoot, oldTarget){
    var delegate = object.delegate;

    if (delegate)
    {
      object.root = delegate.root;
      object.target = delegate.target;
      object.data = delegate.data;
      object.state = delegate.state;
    }

    // fire event if root changed
    if (object.root !== oldRoot)
    {
      var rootListenHandler = object.listen.root;

      if (rootListenHandler)
      {
        if (oldRoot && oldRoot !== object)
          oldRoot.removeHandler(rootListenHandler, object);

        if (object.root && object.root !== object)
          object.root.addHandler(rootListenHandler, object);
      }

      object.emit_rootChanged(oldRoot);
    }

    // fire event if target changed
    if (object.target !== oldTarget)
    {
      var targetListenHandler = object.listen.target;

      if (targetListenHandler)
      {
        if (oldTarget && oldTarget !== object)
          oldTarget.removeHandler(targetListenHandler, object);

        if (object.target && object.target !== object)
          object.target.addHandler(targetListenHandler, object);
      }

      object.emit_targetChanged(oldTarget);
    }

    var cursor = object.delegates_;
    while (cursor)
    {
      if (cursor.delegate)
        applyDelegateChanges(cursor.delegate, oldRoot, oldTarget);
      cursor = cursor.next;
    }
  }


 /**
  * Key-value storage.
  * @class
  * @name Object
  */
  var DataObject = Class(AbstractData, {
    className: namespace + '.Object',
    propertyDescriptors: {
      delegate: 'delegateChanged',
      target: 'targetChanged',
      root: 'rootChanged',
      data: {
        nested: true,
        events: 'update'
      }
    },

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.DELEGATE + SUBSCRIPTION.TARGET,

   /**
    * Using for data storing. Might be managed by delegate object (if used).
    * @type {Object}
    */
    data: null,

   /**
    * Fires on data changes.
    * @param {object} delta Delta of changes. Keys in delta are property
    * names that was changed, and values is previous value of property
    * (value of property before changes).
    * @event
    */
    emit_update: createEvent('update', 'delta') && function(delta){
      var cursor = this.delegates_;

      events.update.call(this, delta);

      // delegate update event
      while (cursor)
      {
        if (cursor.delegate)
          cursor.delegate.emit_update(delta);
        cursor = cursor.next;
      }
    },

   /**
    * @inheritDoc
    */
    emit_stateChanged: function(oldState){
      var cursor = this.delegates_;

      AbstractData.prototype.emit_stateChanged.call(this, oldState);

      // delegate state changes
      while (cursor)
      {
        if (cursor.delegate)
        {
          cursor.delegate.state = this.state;
          cursor.delegate.emit_stateChanged(oldState);
        }
        cursor = cursor.next;
      }
    },

   /**
    * Object that manage data updates if assigned.
    * @type {basis.data.Object}
    */
    delegate: null,

   /**
    * @type {basis.data.ResolveAdapter}
    */
    delegateRA_: null,

   /**
    * @type {Array.<basis.data.Object>}
    */
    delegates_: null,

   /**
    * Function that returns object that delegates current one.
    * WARN: This functionality is supported in development mode only.
    * @return {Array.<object>} List of objects.
    */
    /** @cut */ debug_delegates: function(){
    /** @cut */   var cursor = this.delegates_;
    /** @cut */   var result = [];
    /** @cut */
    /** @cut */   while (cursor)
    /** @cut */   {
    /** @cut */     result.push(cursor.delegate);
    /** @cut */     cursor = cursor.next;
    /** @cut */   }
    /** @cut */
    /** @cut */   return result;
    /** @cut */ },

   /**
    * Fires when delegate was changed.
    * @param {basis.data.Object} oldDelegate Object delegate before changes.
    * @event
    */
    emit_delegateChanged: createEvent('delegateChanged', 'oldDelegate'),

   /**
    * Reference to root delegate if some object in delegate chain marked as targetPoint.
    * @type {basis.data.Object}
    * @readonly
    */
    target: null,

   /**
    * Fires when target property was changed.
    * @param {basis.data.Object} oldTarget Object before changes.
    * @event
    */
    emit_targetChanged: createEvent('targetChanged', 'oldTarget'),

   /**
    * Root of delegate chain. By default and when no delegate, it points to object itself.
    * @type {basis.data.Object}
    * @readonly
    */
    root: null,

   /**
    * Fires when root of delegate chain was changed.
    * @param {basis.data.Object} oldRoot Object root before changes.
    * @event
    */
    emit_rootChanged: createEvent('rootChanged', 'oldRoot'),

   /**
    * @constructor
    */
    init: function(){
      // root always should be set, by default root is instance itself
      this.root = this;

      // inherit
      AbstractData.prototype.init.call(this);

      // data/delegate
      var delegate = this.delegate;
      var data = this.data;

      if (delegate)
      {
        // assign a delegate
        this.delegate = null;
        this.target = null;

        // ignore data property
        this.data = INIT_DATA;

        // assign delegate
        this.setDelegate(delegate);

        // if delegate is not assigned, restore data
        if (this.data === INIT_DATA)
          this.data = data || {};
      }
      else
      {
        // if data doesn't exists - create new one
        if (!data)
          this.data = {};

        // set target property to itself if target property is not null
        if (this.target !== null)
          this.target = this;
      }
    },

    /** @cut */ setSyncAction: function(syncAction){
    /** @cut */   // object with delegate and syncAction can produce data and state conflicts with delegate
    /** @cut */   // warn about it
    /** @cut */   if (syncAction && this.delegate)
    /** @cut */     basis.dev.warn(this.constructor.syncAction + ' instance has a delegate and syncAction - it may produce conflics with data & state');
    /** @cut */
    /** @cut */   AbstractData.prototype.setSyncAction.call(this, syncAction);
    /** @cut */ },

   /**
    * Set new delegate object or reject it (if passed null).
    * @example
    *   var a = new basis.data.Object();
    *   var b = new basis.data.Object();
    *
    *   a.setDelegate(b);
    *   a.update({ prop: 123 });
    *   alert(a.data.prop); // shows 123
    *   alert(b.data.prop); // shows 123
    *   alert(a.data.prop === b.data.prop); // shows true
    *
    *   b.update({ prop: 456 });
    *   alert(a.data.prop); // shows 456
    *   alert(b.data.prop); // shows 456
    *   alert(a.data.prop === b.data.prop); // shows true
    *
    *   a.setState(basis.data.STATE.PROCESSING);
    *   alert(a.state); // shows 'processing'
    *   alert(a.state === b.state); // shows true
    * @param {basis.data.Object=} newDelegate
    * @return {boolean} Returns current delegate object.
    */
    setDelegate: function(newDelegate){
      newDelegate = resolveObject(this, this.setDelegate, newDelegate, 'delegateRA_');

      // check is newDelegate can be linked to this object as delegate
      if (newDelegate && newDelegate instanceof DataObject)
      {
        // check for connected prevents from linking to objects
        // that has this object in delegate chains
        if (newDelegate.delegate && isConnected(this, newDelegate))
        {
          // show warning in dev mode about new delegate ignore because it is already connected with object
          /** @cut */ basis.dev.warn('New delegate has already connected to object. Delegate assignment has been ignored.', this, newDelegate);

          // newDelegate can't be assigned
          return false;
        }
      }
      else
      {
        // can't assign delegate if newDelegate isn't instance of DataObject
        newDelegate = null;
      }

      // only if newDelegate differ with current value
      if (this.delegate !== newDelegate)
      {
        var oldState = this.state;
        var oldData = this.data;
        var oldDelegate = this.delegate;
        var oldTarget = this.target;
        var oldRoot = this.root;
        var delegateListenHandler = this.listen.delegate;
        var dataChanged = false;
        var delta;

        if (oldDelegate)
        {
          if (delegateListenHandler)
            oldDelegate.removeHandler(delegateListenHandler, this);

          // remove this from oldDelegate delegates list
          var cursor = oldDelegate.delegates_;
          var prev = oldDelegate;
          while (cursor)
          {
            if (cursor.delegate === this)
            {
              cursor.delegate = null;
              if (prev === oldDelegate)
                oldDelegate.delegates_ = cursor.next;
              else
                prev.next = cursor.next;

              break;
            }
            prev = cursor;
            cursor = cursor.next;
          }
        }

        if (newDelegate)
        {
          // assign new delegate
          this.delegate = newDelegate;

          // add delegate listener
          if (delegateListenHandler)
            newDelegate.addHandler(delegateListenHandler, this);

          // add object to delegate's list of delegates
          newDelegate.delegates_ = {
            delegate: this,
            next: newDelegate.delegates_
          };

          // possible only when set delegate on init
          if (this.data !== INIT_DATA)
          {
            // calculate delta as difference between current data and delegate info
            delta = {};

            for (var key in newDelegate.data)
              if (key in oldData === false)
              {
                dataChanged = true;
                delta[key] = undefined;
              }

            for (var key in oldData)
              if (oldData[key] !== newDelegate.data[key])
              {
                dataChanged = true;
                delta[key] = oldData[key];
              }
          }
        }
        else
        {
          // reset delegate and info
          this.delegate = null;
          this.target = null;
          this.root = this;
          this.data = {};

          // copy data, no update, no delta
          for (var key in oldData)
            this.data[key] = oldData[key];
        }

        applyDelegateChanges(this, oldRoot, oldTarget);

        // emit event if data changed
        if (dataChanged)
          this.emit_update(delta);

        // emit event state changed
        if (delta && oldState !== this.state && (String(oldState) != this.state || oldState.data !== this.state.data))
          this.emit_stateChanged(oldState);

        // fire event if delegate changed
        this.emit_delegateChanged(oldDelegate);

        // delegate was changed
        return true;
      }

      return false; // delegate doesn't changed
    },

   /**
    * Set new state for object. Fire stateChanged event only if state (or state text) was changed.
    * @param {basis.data.STATE|string} state New state for object
    * @param {*=} data
    * @return {boolean} Current object state.
    */
    setState: function(state, data){
      if (this.delegate)
        return this.root.setState(state, data);
      else
        return AbstractData.prototype.setState.call(this, state, data);
    },

   /**
    * Handle changing object data. Fires update event only if something was changed.
    * @param {Object} data New values for object data holder (this.data).
    * @return {Object|boolean} Delta if object data (this.data) was updated or false otherwise.
    */
    update: function(data){
      if (this.delegate)
        return this.root.update(data);

      if (data)
      {
        var delta = {};
        var changed = false;

        for (var prop in data)
          if (this.data[prop] !== data[prop])
          {
            changed = true;
            delta[prop] = this.data[prop];
            this.data[prop] = data[prop];
          }

        if (changed)
        {
          this.emit_update(delta);
          return delta;
        }
      }

      return false;
    },

   /**
    * @destructor
    */
    destroy: function(){
      // inherit
      AbstractData.prototype.destroy.call(this);

      // remove delegates
      var cursor = this.delegates_;
      this.delegates_ = null;
      while (cursor)
      {
        cursor.delegate.setDelegate();
        cursor = cursor.next;
      }

      // drop delegate
      if (this.delegate)
        this.setDelegate();
      if (this.delegateRA_)
        resolveObject(this, false, false, 'delegateRA_');

      // drop data & state
      this.data = NULL_OBJECT;
      this.root = null;
      this.target = null;
    }
  });

  var resolveObject = createResolveFunction(DataObject);


  //
  // Slot
  //

 /**
  * @class
  */
  var Slot = Class(DataObject, {
    className: namespace + '.Slot'
  });


  //
  // KeyObjectMap
  //

  var KEYOBJECTMAP_MEMBER_HANDLER = {
    destroy: function(){
      delete this.map[this.id];
    }
  };

 /**
  * @class
  */
  var KeyObjectMap = Class(AbstractData, {
    className: namespace + '.KeyObjectMap',

    itemClass: DataObject,
    keyGetter: basis.getter($self),
    autoDestroyMembers: true,
    map_: null,

    extendConstructor_: true,
    init: function(){
      this.map_ = {};
      AbstractData.prototype.init.call(this);
    },

    resolve: function(object){
      return this.get(this.keyGetter(object), object);
    },
    create: function(key/*, object*/){
      var itemConfig;

      if (key instanceof DataObject)
        itemConfig = {
          delegate: key
        };
      else
        itemConfig = {
          data: {
            id: key,
            title: key
          }
        };

      return new this.itemClass(itemConfig);
    },
    get: function(key, autocreate){
      var itemId = key instanceof DataObject ? key.basisObjectId : key;
      var itemInfo = this.map_[itemId];

      if (!itemInfo && autocreate)
      {
        itemInfo = this.map_[itemId] = {
          map: this.map_,
          id: itemId,
          item: this.create(key, autocreate)
        };
        itemInfo.item.addHandler(KEYOBJECTMAP_MEMBER_HANDLER, itemInfo);
      }

      if (itemInfo)
        return itemInfo.item;
    },
    destroy: function(){
      AbstractData.prototype.destroy.call(this);

      var map = this.map_;
      this.map_ = null;
      for (var itemId in map)
      {
        var itemInfo = map[itemId];
        if (this.autoDestroyMembers)
          itemInfo.item.destroy();
        else
          itemInfo.item.removeHandler(KEYOBJECTMAP_MEMBER_HANDLER, itemInfo);
      }
    }
  });


  //
  // Datasets
  //

 /**
  * Returns delta object
  * @return {object|undefined}
  */
  function getDelta(inserted, deleted){
    var delta = {};
    var result;

    if (inserted && inserted.length)
      result = delta.inserted = inserted;

    if (deleted && deleted.length)
      result = delta.deleted = deleted;

    if (result)
      return delta;
  }

 /**
  * Returns delta betwwen dataset, that could be used for event
  * @return {object|undefined}
  */
  function getDatasetDelta(a, b){
    if (!a || !a.itemCount)
    {
      if (b && b.itemCount)
        return {
          inserted: b.getItems()
        };
    }
    else
    {
      if (!b || !b.itemCount)
      {
        if (a.itemCount)
          return {
            deleted: a.getItems()
          };
      }
      else
      {
        var inserted = [];
        var deleted = [];

        for (var key in a.items_)
        {
          var item = a.items_[key];
          if (item.basisObjectId in b.items_ == false)
            deleted.push(item);
        }

        for (var key in b.items_)
        {
          var item = b.items_[key];
          if (item.basisObjectId in a.items_ == false)
            inserted.push(item);
        }

        return getDelta(inserted, deleted);
      }
    }
  }


 /**
  * @class
  */
  var DatasetWrapper = Class(DataObject, {
    className: namespace + '.DatasetWrapper',
    propertyDescriptors: {
      dataset: 'datasetChanged',
      itemCount: 'itemsChanged',
      'pick()': 'itemsChanged',
      'getItems()': 'itemsChanged'
    },

    active: PROXY,
    subscribeTo: DataObject.prototype.subscribeTo + SUBSCRIPTION.DATASET,

    listen: {
      dataset: {
        itemsChanged: function(dataset, delta){
          this.itemCount = dataset.itemCount;
          this.emit_itemsChanged(delta);
        },
        destroy: function(){
          this.setDataset();
        }
      }
    },

   /**
    * @type {basis.data.ReadOnlyDataset}
    */
    dataset: null,

   /**
    * @type {basis.data.ResolveAdapter}
    */
    datasetRA_: null,

   /**
    * Fires when dataset was changed.
    * @param {basis.data.ReadOnlyDataset} oldDataset
    * @event
    */
    emit_datasetChanged: createEvent('datasetChanged', 'oldDataset'),

   /**
    * Proxy event of dataset. Fires when items of dataset was changed.
    * @param {object} delta
    * @event
    */
    emit_itemsChanged: createEvent('itemsChanged', 'delta'),

   /**
    * @constructor
    */
    init: function(){
      DataObject.prototype.init.call(this);

      var dataset = this.dataset;
      if (dataset)
      {
        this.dataset = null;
        this.setDataset(dataset);
      }
    },

   /**
    * @param {basis.data.ReadOnlyDataset} dataset
    */
    setDataset: function(dataset){
      dataset = resolveDataset(this, this.setDataset, dataset, 'datasetRA_');

      if (this.dataset !== dataset)
      {
        var listenHandler = this.listen.dataset;
        var oldDataset = this.dataset;
        var delta;

        if (listenHandler)
        {
          if (oldDataset)
            oldDataset.removeHandler(listenHandler, this);
          if (dataset)
            dataset.addHandler(listenHandler, this);
        }

        this.itemCount = dataset ? dataset.itemCount : 0;
        this.dataset = dataset;

        if (delta = getDatasetDelta(oldDataset, dataset))
          this.emit_itemsChanged(delta);

        this.emit_datasetChanged(oldDataset);
      }
    },

   /**
    * Proxy method for contained dataset.
    */
    has: function(object){
      return this.dataset ? this.dataset.has(object) : null;
    },

   /**
    * Proxy method for contained dataset.
    */
    getItems: function(){
      return this.dataset ? this.dataset.getItems() : [];
    },

   /**
    * Proxy method for contained dataset.
    */
    getValues: function(getter){
      return this.dataset ? this.dataset.getValues(getter) : [];
    },

   /**
    * Proxy method for contained dataset.
    */
    pick: function(){
      return this.dataset ? this.dataset.pick() : null;
    },

   /**
    * Proxy method for contained dataset.
    */
    top: function(count){
      return this.dataset ? this.dataset.top(count) : [];
    },

   /**
    * Proxy method for contained dataset.
    */
    forEach: function(fn){
      if (this.dataset)
        return this.dataset.forEach(fn);
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.dataset || this.datasetRA_)
        this.setDataset();

      DataObject.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var ReadOnlyDataset = Class(AbstractData, {
    className: namespace + '.ReadOnlyDataset',
    propertyDescriptors: {
      'itemCount': 'itemsChanged',
      'pick()': 'itemsChanged',
      'getItems()': 'itemsChanged'
    },

   /**
    * Cardinality of set.
    * @type {number}
    * @readonly
    */
    itemCount: 0,

   /**
    * Set of members.
    * @private
    */
    items_: null,

   /**
    * Set of all items, even items are not in member set. May be used as storage for
    * members, which provide posibility to avoid dublicates in resultinf set before
    * emit_itemsChanged event be fired.
    * @type {Object}
    * @private
    */
    members_: null,

   /**
    * Cache array of members, for getItems method.
    * @type {Array.<basis.data.Object>}
    * @private
    */
    cache_: null,

   /**
    * Fires when items changed.
    * @param {Object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new items
    * and `deleted` property is array of removed items.
    * @event
    */
    emit_itemsChanged: createEvent('itemsChanged', 'delta') && function(delta){
      var items;
      var insertCount = 0;
      var deleteCount = 0;
      var object;

      // add new items
      if (items = delta.inserted)
      {
        while (object = items[insertCount])
        {
          this.items_[object.basisObjectId] = object;
          insertCount++;
        }
      }

      // remove old items
      if (items = delta.deleted)
      {
        while (object = items[deleteCount])
        {
          delete this.items_[object.basisObjectId];
          deleteCount++;
        }
      }

      // update item count
      this.itemCount += insertCount - deleteCount;

      // drop cache
      this.cache_ = insertCount == this.itemCount ? delta.inserted : null;

      // call event
      events.itemsChanged.call(this, delta);
    },

   /**
    * @constructor
    */
    init: function(){
      // inherit
      AbstractData.prototype.init.call(this);

      this.members_ = {};
      this.items_ = {};
    },

   /**
    * Check is object in dataset.
    * @param {basis.data.Object} object Object check for.
    * @return {boolean} Returns true if object in dataset.
    */
    has: function(object){
      return !!(object && this.items_[object.basisObjectId]);
    },

   /**
    * Returns all items in dataset.
    * @return {Array.<basis.data.Object>}
    */
    getItems: function(){
      if (!this.cache_)
        this.cache_ = values(this.items_);

      return this.cache_;
    },

   /**
    * Returns results of execution some function for every items in dataset.
    * @param {function(item:basis.data.Object)|string} getter Value get function.
    * @return {Array.<*>}
    */
    getValues: function(getter){
      return this.getItems().map(basis.getter(getter || $self));
    },

   /**
    * Returns first any item if exists.
    * @return {basis.data.Object}
    */
    pick: function(){
      for (var objectId in this.items_)
        return this.items_[objectId];

      return null;
    },

   /**
    * Returns some N items from dataset if exists.
    * @param {number} count Max length of resulting array.
    * @return {Array.<basis.data.Object>}
    */
    top: function(count){
      var result = [];

      if (count)
        for (var objectId in this.items_)
          if (result.push(this.items_[objectId]) >= count)
            break;

      return result;
    },

   /**
    * Call fn for every item in dataset.
    * @param {function(item)} fn
    */
    forEach: function(fn){
      var items = this.getItems();

      for (var i = 0; i < items.length; i++)
        fn(items[i]);
    },

   /**
    * @destructor
    */
    destroy: function(){
      // inherit
      AbstractData.prototype.destroy.call(this);

      this.cache_ = EMPTY_ARRAY;  // empty array here, to prevent recalc cache
      this.itemCount = 0;

      this.members_ = null;
      this.items_ = null;
    }
  });


 /**
  * @class
  */
  var Dataset = Class(ReadOnlyDataset, {
    className: namespace + '.Dataset',

   /**
    * @inheritDoc
    */
    listen: {
      item: {
        destroy: function(object){
          this.remove([object]);
        }
      }
    },

   /**
    * @constructor
    */
    init: function(){
      // inherit
      ReadOnlyDataset.prototype.init.call(this);

      var items = this.items;
      if (items)
      {
        this.items = null;
        this.set(items);
      }
    },

   /**
    * @param {Array.<basis.data.Object>|basis.data.Object} items
    * @return {object|undefined} Returns delta of changes or undefined if no changes.
    */
    add: function(items){
      var memberMap = this.members_;
      var listenHandler = this.listen.item;
      var inserted = [];
      var delta;

      if (items && !Array.isArray(items))
        items = [items];

      for (var i = 0; i < items.length; i++)
      {
        var object = items[i];
        if (object instanceof DataObject)
        {
          var objectId = object.basisObjectId;
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;

            if (listenHandler)
              object.addHandler(listenHandler, this);

            inserted.push(object);
          }
        }
        else
        {
          /** @cut */ basis.dev.warn('Wrong data type: value should be an instance of basis.data.Object');
        }
      }

      // trace changes
      if (inserted.length)
      {
        this.emit_itemsChanged(delta = {
          inserted: inserted
        });
      }

      return delta;
    },

   /**
    * @param {Array.<basis.data.Object>|basis.data.Object} items
    * @return {object|undefined} Returns delta of changes or undefined if no changes.
    */
    remove: function(items){
      var memberMap = this.members_;
      var listenHandler = this.listen.item;
      var deleted = [];
      var delta;

      if (items && !Array.isArray(items))
        items = [items];

      for (var i = 0; i < items.length; i++)
      {
        var object = items[i];
        if (object instanceof DataObject)
        {
          var objectId = object.basisObjectId;
          if (memberMap[objectId])
          {
            if (listenHandler)
              object.removeHandler(listenHandler, this);

            delete memberMap[objectId];

            deleted.push(object);
          }
        }
        else
        {
          /** @cut */ basis.dev.warn('Wrong data type: value should be an instance of basis.data.Object');
        }
      }

      // trace changes
      if (deleted.length)
      {
        this.emit_itemsChanged(delta = {
          deleted: deleted
        });
      }

      return delta;
    },

   /**
    * @param {Array.<basis.data.Object>} items
    * @return {object|undefined} Returns delta of changes or undefined if no changes.
    */
    set: function(items){
      // a little optimizations
      if (!this.itemCount)
        return this.add(items);

      if (!items || !items.length)
        return this.clear();

      // main part

      // build map for new items
      var memberMap = this.members_;
      var listenHandler = this.listen.item;
      var exists = {};  // unique input DataObject's
      var deleted = [];
      var inserted = [];
      var object;
      var objectId;
      var delta;

      for (var i = 0; i < items.length; i++)
      {
        object = items[i];

        if (object instanceof DataObject)
        {
          objectId = object.basisObjectId;
          exists[objectId] = object;

          // insert
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;

            if (listenHandler)
              object.addHandler(listenHandler, this);

            inserted.push(object);
          }
        }
        else
        {
          /** @cut */ basis.dev.warn('Wrong data type: value should be an instance of basis.data.Object');
        }
      }

      // delete
      for (var objectId in memberMap)
      {
        if (!exists[objectId])
        {
          object = memberMap[objectId];

          if (listenHandler)
            object.removeHandler(listenHandler, this);

          delete memberMap[objectId];

          deleted.push(object);
        }
      }

      // fire event if any changes
      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);

      return delta;
    },


   /**
    * @deprecated use Dataset#setAndDestroyRemoved
    */
    sync: function(items){
      /** @cut */ basis.dev.warn('basis.data.Dataset#sync() method is deprecated, use basis.data.Dataset#setAndDestroyRemoved() instead.');
      return this.setAndDestroyRemoved(items);
    },

   /**
    * Set new item set and destroy deleted items.
    * @param {Array.<basis.data.Object>} items
    * @return {Array.<basis.data.Object>|undefined} Returns array of inserted items or undefined if nothing inserted.
    */
    setAndDestroyRemoved: function(items){
      var delta = this.set(items) || {};
      var deleted = delta.deleted;

      Dataset.setAccumulateState(true);
      if (deleted)
        for (var i = 0, object; object = deleted[i]; i++)
          object.destroy();
      Dataset.setAccumulateState(false);

      return delta.inserted;
    },

   /**
    * Removes all items from dataset.
    */
    clear: function(){
      var deleted = this.getItems();
      var listenHandler = this.listen.item;
      var delta;

      if (deleted.length)
      {
        if (listenHandler)
          for (var i = 0; i < deleted.length; i++)
            deleted[i].removeHandler(listenHandler, this);

        this.emit_itemsChanged(delta = {
          deleted: deleted
        });

        this.members_ = {};
      }

      return delta;
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.clear();

      // inherit
      ReadOnlyDataset.prototype.destroy.call(this);
    }
  });


  //
  // resolvers
  //

  var DATASETWRAPPER_ADAPTER_HANDLER = {
    datasetChanged: DEFAULT_CHANGE_ADAPTER_HANDLER,
    destroy: DEFAULT_DESTROY_ADAPTER_HANDLER
  };
  function resolveAdapterProxy(){
    this.fn.call(this.context, this.source);
  }

 /**
  * Resolve dataset from source value.
  */
  function resolveDataset(context, fn, source, property, factoryContext){
    var oldAdapter = context[property] || null;
    var newAdapter = null;

    if (fn !== resolveAdapterProxy && typeof source == 'function')
      source = source.call(factoryContext || context, factoryContext || context);

    if (source)
    {
      // try to re-use old adapter
      var adapter = newAdapter = oldAdapter && oldAdapter.source === source ? oldAdapter : null;

      if (source instanceof DatasetWrapper)
      {
        newAdapter = adapter || new ResolveAdapter(context, fn, source, DATASETWRAPPER_ADAPTER_HANDLER);
        source = source.dataset;
      }
      else if (source.bindingBridge)
      {
        newAdapter = adapter || new BBResolveAdapter(context, fn, source, DEFAULT_CHANGE_ADAPTER_HANDLER);
        source = resolveDataset(newAdapter, resolveAdapterProxy, source.value, 'next');
      }
    }

    if (source instanceof ReadOnlyDataset == false)
      source = null;

    if (property && oldAdapter !== newAdapter)
    {
      var cursor = oldAdapter;

      // drop old adapter chain
      while (cursor)
      {
        var adapter = cursor;
        adapter.detach();
        cursor = adapter.next;
        adapter.next = null;
      }

      if (newAdapter)
        newAdapter.attach(DEFAULT_DESTROY_ADAPTER_HANDLER);

      context[property] = newAdapter;
    }

    return source;
  }


  //
  // Accumulate dataset changes
  //

  Dataset.setAccumulateState = (function(){
    var proto = ReadOnlyDataset.prototype;
    var eventCache = {};
    var setStateCount = 0;
    var urgentTimer;
    var realEvent;

    function flushCache(cache){
      realEvent.call(cache.dataset, cache);
    }

    function flushAllDataset(){
      function processEntry(datasetId){
        var entry = eventCacheCopy[datasetId];

        if (entry)
        {
          eventCacheCopy[datasetId] = null;
          flushCache(entry);
        }
      }

      var eventCacheCopy = eventCache;
      var realEvent = proto.emit_itemsChanged;

      proto.emit_itemsChanged = function(delta){
        // we can't emit new itemsChanged until cache is flushed
        processEntry(this.basisObjectId);
        realEvent.call(this, delta);
      };

      eventCache = {};
      for (var datasetId in eventCacheCopy)
        processEntry(datasetId);

      proto.emit_itemsChanged = realEvent;
    }

    function storeDatasetDelta(delta){
      var dataset = this;
      var datasetId = dataset.basisObjectId;
      var inserted = delta.inserted;
      var deleted = delta.deleted;
      var cache = eventCache[datasetId];

      if ((inserted && deleted) || (cache && cache.mixed))
      {
        if (cache)
        {
          eventCache[datasetId] = null;
          flushCache(cache);
        }

        realEvent.call(dataset, delta);
        return;
      }

      if (cache)
      {
        var mode = inserted ? 'inserted' : 'deleted';
        var array = cache[mode];
        if (!array)
        {
          var inCacheMode = inserted ? 'deleted' : 'inserted';
          var inCache = cache[inCacheMode];
          var inCacheMap = {};
          var deltaItems = inserted || deleted;
          var newInCacheItems = [];
          var inCacheRemoves = 0;

          // build map of in-cache items
          for (var i = 0; i < inCache.length; i++)
            inCacheMap[inCache[i].basisObjectId] = i;

          // build new oposite items array
          for (var i = 0; i < deltaItems.length; i++)
          {
            var id = deltaItems[i].basisObjectId;
            if (id in inCacheMap == false)
            {
              newInCacheItems.push(deltaItems[i]);
            }
            else
            {
              // on first remove make a copy of inCache array
              // to avoid side-effect if array already used by some object
              if (!inCacheRemoves)
                inCache = sliceArray.call(inCache);

              inCacheRemoves++;
              inCache[inCacheMap[id]] = null;
            }
          }

          // filter in-cache items if any removes
          if (inCacheRemoves)
          {
            if (inCacheRemoves < inCache.length)
            {
              // filter in-cache items
              inCache = inCache.filter(Boolean);
            }
            else
            {
              // all items removed, drop array
              inCache = null;
            }

            cache[inCacheMode] = inCache;
          }

          if (!newInCacheItems.length)
          {
            // reset empty array
            newInCacheItems = null;

            // if in-cache is empty - terminate event
            if (!inCache)
              eventCache[datasetId] = null;
          }
          else
          {
            // save new in-cache items
            cache[mode] = newInCacheItems;

            if (inCache)
              cache.mixed = true;
          }
        }
        else
          array.push.apply(array, inserted || deleted);

        return;
      }

      eventCache[datasetId] = {
        inserted: inserted,
        deleted: deleted,
        dataset: dataset,
        mixed: false
      };
    }

    function urgentFlush(){
      urgentTimer = null;
      if (setStateCount)
      {
        /** @cut */ basis.dev.warn('(debug) Urgent flush dataset changes');
        setStateCount = 0;
        setAccumulateStateOff();
      }
    }

    function setAccumulateStateOff(){
      proto.emit_itemsChanged = realEvent;
      flushAllDataset();
    }

    return function(state){
      if (state)
      {
        if (setStateCount == 0)
        {
          realEvent = proto.emit_itemsChanged;
          proto.emit_itemsChanged = storeDatasetDelta;
          if (!urgentTimer)
            urgentTimer = basis.setImmediate(urgentFlush);
        }
        setStateCount++;
      }
      else
      {
        setStateCount -= setStateCount > 0;
        if (setStateCount == 0)
          setAccumulateStateOff();
      }
    };
  })();


  //
  // helpers
  //

  function wrapData(data){
    if (Array.isArray(data))
      return data.map(function(item){
        return { data: item };
      });
    else
      return { data: data };
  }

  function wrapObject(data){
    if (!data || data.constructor !== Object)
      data = {
        value: data
      };

    return new DataObject({
      data: data
    });
  }

  function wrap(value, retObject){
    var wrapper = retObject ? wrapObject : wrapData;

    return Array.isArray(value)
      ? value.map(wrapper)
      : wrapper(value);
  }


  //
  // export names
  //

  module.exports = {
    // const
    STATE: STATE,
    SUBSCRIPTION: SUBSCRIPTION,

    // classes
    AbstractData: AbstractData,

    Value: Value,
    ReadOnlyValue: ReadOnlyValue,
    DeferredValue: DeferredValue,
    PipeValue: PipeValue,

    Object: DataObject,
    Slot: Slot,

    KeyObjectMap: KeyObjectMap,

    ReadOnlyDataset: ReadOnlyDataset,
    Dataset: Dataset,
    DatasetWrapper: DatasetWrapper,

    /** @cut */ devWrap: devWrap,
    /** @cut */ devUnwrap: devUnwrap,
    isEqual: isEqual,
    chainValueFactory: chainValueFactory,
    isConnected: isConnected,
    getDatasetDelta: getDatasetDelta,

    ResolveAdapter: ResolveAdapter,
    createResolveFunction: createResolveFunction,
    resolveValue: resolveValue,
    resolveObject: resolveObject,
    resolveDataset: resolveDataset,

    wrapData: wrapData,
    wrapObject: wrapObject,
    wrap: wrap
  };
