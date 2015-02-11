
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

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var sliceArray = Array.prototype.slice;
  var values = basis.object.values;
  var $self = basis.fn.$self;

  var basisEvent = require('basis.event');
  var Emitter = basisEvent.Emitter;
  var createEvent = basisEvent.create;
  var createEventHandler = basisEvent.createHandler;
  var events = basisEvent.events;


  //
  // Main part
  //

  var NULL_OBJECT = {};
  var EMPTY_ARRAY = [];
  var FACTORY = basis.FACTORY;
  var PROXY = basis.PROXY;


  //
  // State scheme
  //

  var STATE_EXISTS = {};

 /**
  * @enum {string}
  */
  var STATE = {
    priority: [],
    values: {},

   /**
    * Register new state
    * @param {string} state
    * @param {string=} order
    */
    add: function(state, order){
      var name = state;
      var value = state.toLowerCase();

      STATE[name] = value;
      STATE_EXISTS[value] = name;
      this.values[value] = name;

      if (order)
        order = this.priority.indexOf(order);
      else
        order = -1;

      if (order == -1)
        this.priority.push(value);
      else
        this.priority.splice(order, 0, value);
    },

   /**
    * Returns all registred states
    * @return {Array.<basis.data.STATE>}
    */
    getList: function(){
      return values(STATE_EXISTS);
    },

   /**
    * Create factory to fetch state from nested object.
    * @param {string} events
    * @param {string} property
    * @return {function(basis.event.Emitter)}
    */
    factory: function(events, property){
      return Value.factory(events, basis.getter(property).as(STATE.from));
    },

   /**
    * Helper to get Value with state from source.
    * @param {basis.data.AbstractData} source
    * @return {basis.data.Value|null}
    */
    from: function(source){
      return Value.from(source, 'stateChanged', 'state') || STATE.UNDEFINED;
    }
  };

  // Register base states

  STATE.add('READY');
  STATE.add('DEPRECATED');
  STATE.add('UNDEFINED');
  STATE.add('ERROR');
  STATE.add('PROCESSING');


  //
  // Subscription schema
  //

  var subscriptionConfig = {};
  var subscriptionSeed = 1;


 /**
  * @enum {number}
  */
  var SUBSCRIPTION = {
    NONE: 0,
    ALL: 0,

    link: function(type, from, to){
      var subscriberId = type + from.basisObjectId;
      var subscribers = to.subscribers_;

      if (!subscribers)
        subscribers = to.subscribers_ = {};

      if (!subscribers[subscriberId])
      {
        subscribers[subscriberId] = from;

        var count = to.subscriberCount += 1;
        if (count == 1)
          to.emit_subscribersChanged(+1);
      }
      else
      {
        /** @cut */ basis.dev.warn('Attempt to add duplicate subscription');
      }
    },
    unlink: function(type, from, to){
      var subscriberId = type + from.basisObjectId;
      var subscribers = to.subscribers_;

      if (subscribers && subscribers[subscriberId])
      {
        delete subscribers[subscriberId];

        var count = to.subscriberCount -= 1;
        if (count == 0)
        {
          to.emit_subscribersChanged(-1);
          to.subscribers_ = null;
        }
      }
      else
      {
        /** @cut */ basis.dev.warn('Trying remove non-exists subscription');
      }
    },

   /**
    * Register new type of subscription
    * @param {string} name
    * @param {Object} handler
    * @param {function()} action
    */
    add: function(name, handler, action){
      subscriptionConfig[subscriptionSeed] = {
        handler: handler,
        action: action
      };

      SUBSCRIPTION[name] = subscriptionSeed;
      SUBSCRIPTION.ALL |= subscriptionSeed;

      subscriptionSeed <<= 1;
    },
   /**
    * @param {string} propertyName Name of property for subscription. Property
    *   should be instance of {basis.data.AbstractData} class.
    * @param {string=} eventName Name of event which fire when property changed.
    *   If omitted it will be equal to property name with 'Changed' suffix.
    */
    addProperty: function(propertyName, eventName){
      var handler = {};
      handler[eventName || propertyName + 'Changed'] = function(object, oldValue){
        if (oldValue instanceof AbstractData)
          SUBSCRIPTION.unlink(propertyName, object, oldValue);

        if (object[propertyName] instanceof AbstractData)
          SUBSCRIPTION.link(propertyName, object, object[propertyName]);
      };

      this.add(propertyName.toUpperCase(), handler, function(fn, object){
        if (object[propertyName])
          fn(propertyName, object, object[propertyName]);
      });
    }
  };


  var maskConfig = {};

  function mixFunctions(fnA, fnB){
    return function(){
      fnA.apply(this, arguments);
      fnB.apply(this, arguments);
    };
  }

  function getMaskConfig(mask){
    var config = maskConfig[mask];

    if (!config)
    {
      var actions = [];
      var handler = {};
      var idx = 1;

      config = maskConfig[mask] = {
        actions: actions,
        handler: handler
      };

      while (mask)
      {
        if (mask & 1)
        {
          var cfg = subscriptionConfig[idx];

          actions.push(cfg.action);

          for (var key in cfg.handler)
            handler[key] = handler[key]
              ? mixFunctions(handler[key], cfg.handler[key])  // suppose it never be used, but do it for double sure
              : cfg.handler[key];
        }
        idx <<= 1;
        mask >>= 1;
      }
    }

    return config;
  }

  function addSub(object, mask){
    var config = getMaskConfig(mask);

    for (var i = 0, action; action = config.actions[i]; i++)
      action(SUBSCRIPTION.link, object);

    object.addHandler(config.handler);
  }

  function remSub(object, mask){
    var config = getMaskConfig(mask);

    for (var i = 0, action; action = config.actions[i++];)
      action(SUBSCRIPTION.unlink, object);

    object.removeHandler(config.handler);
  }


  // Register base subscription types

  SUBSCRIPTION.addProperty('delegate');
  SUBSCRIPTION.addProperty('target');
  SUBSCRIPTION.addProperty('dataset');
  SUBSCRIPTION.addProperty('value', 'change');


  //
  // Abstract data
  //

 /**
  * Base class for any data type class.
  * @class
  */
  var AbstractData = Class(Emitter, {
    className: namespace + '.AbstractData',

   /**
    * State of object. Might be managed by delegate object (if used).
    * @type {basis.data.STATE|string}
    */
    state: STATE.UNDEFINED,

   /**
    * @type {basis.data.ResolveAdapter}
    */
    stateRA_: null,

   /**
    * Fires when state or state.data was changed.
    * @param {object} oldState Object state before changes.
    * @event
    */
    emit_stateChanged: createEvent('stateChanged', 'oldState'),

   /**
    * Indicates if object influences to related objects or not (is
    * subscription on).
    * @type {boolean}
    */
    active: false,

   /**
    * @type {basis.data.ResolveAdapter}
    */
    activeRA_: null,

   /**
    * Fires when state of subscription was changed.
    * @event
    */
    emit_activeChanged: createEvent('activeChanged'),

   /**
    * Subscriber type indicates what sort of influence has current object on
    * related objects (delegate, source, dataSource etc).
    * @type {basis.data.SUBSCRIPTION|number}
    */
    subscribeTo: SUBSCRIPTION.NONE,

   /**
    * Count of subscribed objects. This property can use to determinate
    * is data update necessary or not. Usualy if object is in UNDEFINED
    * or DEPRECATED state and subscriberCount more than zero - update needed.
    * @type {number}
    * @readonly
    */
    subscriberCount: 0,

   /**
    * Subscribers list. Using to prevent subscriber dublicate count.
    * @type {Object}
    * @private
    */
    subscribers_: null,

   /**
    * Fires when count of subscribers (subscriberCount property) was changed.
    * @param {Number} delta 1 or -1 depends on subscribers was add or removed.
    * @event
    */
    emit_subscribersChanged: createEvent('subscribersChanged', 'delta'),

   /**
    * @readonly
    */
    syncEvents: Class.oneFunctionProperty(
      function(){
        if (this.isSyncRequired())
          this.syncAction();
      },
      {
        stateChanged: true,
        subscribersChanged: true
      }
    ),

   /**
    * @readonly
    */
    syncAction: null,

   /**
    * @constructor
    */
    init: function(){
      // inherit
      Emitter.prototype.init.call(this);

      // activate subscription if active
      if (this.active)
      {
        if (this.active === PROXY)
          this.active = Value.from(this, 'subscribersChanged', 'subscriberCount');

        this.active = !!resolveValue(this, this.setActive, this.active, 'activeRA_');

        if (this.active)
          this.addHandler(getMaskConfig(this.subscribeTo).handler);
      }

      // resolve state
      // Q: should we check for `instanceof String` here?
      if (typeof this.state != 'string')
        this.state = String(resolveValue(this, this.setState, this.state, 'stateRA_'));

      // apply sync action
      var syncAction = this.syncAction;
      if (syncAction)
      {
        this.syncAction = null;
        this.setSyncAction(syncAction);
      }
    },

   /**
    * Set new state for object. Fire stateChanged event only if state (or state data) was changed.
    * @param {basis.data.STATE|string} state New state for object
    * @param {*=} data
    * @return {boolean} Current object state.
    */
    setState: function(state, data){
      state = resolveValue(this, this.setState, state, 'stateRA_');

      var stateCode = String(state);

      if (!STATE_EXISTS[stateCode])
        throw new Error('Wrong state value');

      // try fetch data from state
      if (this.stateRA_ && data === undefined)
        data = state.data;

      // set new state for object
      if (this.state != stateCode || this.state.data != data)
      {
        var oldState = this.state;

        this.state = Object(stateCode);
        this.state.data = data;

        this.emit_stateChanged(oldState);

        return true; // state was changed
      }

      return false; // state wasn't changed
    },

   /**
    * Default action on deprecate, set object state to {basis.data.STATE.DEPRECATED},
    * but only if object isn't in {basis.data.STATE.PROCESSING} state.
    */
    deprecate: function(){
      if (this.state != STATE.PROCESSING)
        this.setState(STATE.DEPRECATED);
    },

   /**
    * Set new value for isActiveSubscriber property.
    * @param {boolean} isActive New value for {basis.data.Object#active} property.
    * @return {boolean} Returns true if {basis.data.Object#active} was changed.
    */
    setActive: function(isActive){
      if (isActive === PROXY)
        isActive = Value.from(this, 'subscribersChanged', 'subscriberCount');

      isActive = !!resolveValue(this, this.setActive, isActive, 'activeRA_');

      if (this.active != isActive)
      {
        this.active = isActive;
        this.emit_activeChanged();

        if (isActive)
          addSub(this, this.subscribeTo);
        else
          remSub(this, this.subscribeTo);

        return true;
      }

      return false;
    },

   /**
    * Set new value for subscriptionType property.
    * @param {number} subscriptionType New value for {basis.data.Object#subscribeTo} property.
    * @return {boolean} Returns true if {basis.data.Object#subscribeTo} was changed.
    */
    setSubscription: function(subscriptionType){
      var curSubscriptionType = this.subscribeTo;
      var newSubscriptionType = subscriptionType & SUBSCRIPTION.ALL;
      var delta = curSubscriptionType ^ newSubscriptionType;

      if (delta)
      {
        this.subscribeTo = newSubscriptionType;

        if (this.active)
        {
          var curConfig = getMaskConfig(curSubscriptionType);
          var newConfig = getMaskConfig(newSubscriptionType);

          this.removeHandler(curConfig.handler);
          this.addHandler(newConfig.handler);

          var idx = 1;
          while (delta)
          {
            if (delta & 1)
            {
              var cfg = subscriptionConfig[idx];
              if (curSubscriptionType & idx)
                cfg.action(SUBSCRIPTION.unlink, this);
              else
                cfg.action(SUBSCRIPTION.link, this);
            }
            idx <<= 1;
            delta >>= 1;
          }
        }

        return true;
      }

      return false;
    },

   /**
    * Rule to determine is sync required.
    */
    isSyncRequired: function(){
      return this.subscriberCount > 0 &&
             (this.state == STATE.UNDEFINED || this.state == STATE.DEPRECATED);
    },

   /**
    * Change sync actions function.
    * @param {function|null} syncAction
    */
    setSyncAction: function(syncAction){
      var oldAction = this.syncAction;

      if (typeof syncAction != 'function')
        syncAction = null;

      this.syncAction = syncAction;

      if (syncAction)
      {
        if (!oldAction)
          this.addHandler(this.syncEvents);
        if (this.isSyncRequired())
          this.syncAction();
      }
      else
      {
        if (oldAction)
          this.removeHandler(this.syncEvents);
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // inherit
      Emitter.prototype.destroy.call(this);

      // remove subscriptions if necessary
      if (this.active)
      {
        var config = getMaskConfig(this.subscribeTo);
        for (var i = 0, action; action = config.actions[i]; i++)
          action(SUBSCRIPTION.unlink, this);
      }

      // clean up adapters
      if (this.activeRA_)
        resolveValue(this, false, false, 'activeRA_');
      if (this.stateRA_)
        resolveValue(this, false, false, 'stateRA_');

      this.state = STATE.UNDEFINED;
    }
  });


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
    destroy: function(object){
      this.set(null);
    }
  };

  var computeFunctions = {};
  var valueSetters = {};
  var valueSyncToken = function(value){
    this.set(this.fn(value));
  };
  var valueSyncPipe = function(newValue, oldValue){
    var val = null;

    if (oldValue instanceof Emitter)
      oldValue.removeHandler(this.pipeHandler, this);

    if (newValue instanceof Emitter)
    {
      newValue.addHandler(this.pipeHandler, this);
      val = newValue;
    }

    Value.prototype.set.call(this, val);
  };

 /**
  * @class
  */
  var Value = Class(AbstractData, {
    className: namespace + '.Value',

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
        this.set(fn(object, hostValue.value)); // `this` is a token
      });
      var fnId = fn[GETTER_ID] || String(fn);
      var getComputeTokenId = handler.events.concat(fnId, this.basisObjectId).join('_');
      var getComputeToken = computeFunctions[getComputeTokenId];

      if (!getComputeToken)
      {
        var tokenMap = {};

        handler.destroy = function(object){
          delete tokenMap[object.basisObjectId];
          this.destroy(); // `this` is a token
        };

        this.addHandler({
          change: function(){
            for (var key in tokenMap)
            {
              var pair = tokenMap[key];
              pair.token.set(fn(pair.object, this.value));
            }
          },
          destroy: function(){
            for (var key in tokenMap)
            {
              var pair = tokenMap[key];
              pair.object.removeHandler(handler, pair.token);
              pair.token.destroy();
            }

            tokenMap = null;
            hostValue = null;
          }
        });

        getComputeToken = computeFunctions[getComputeTokenId] = function(object){
          /** @cut */ if (object instanceof Emitter == false)
          /** @cut */   basis.dev.warn('basis.data.Value#compute: object should be an instanceof basis.event.Emitter');

          var objectId = object.basisObjectId;
          var pair = tokenMap[objectId];
          var value = fn(object, hostValue.value);

          if (!pair)
          {
            // create token with computed value
            var token = new basis.Token(value);

            // attach handler re-evaluate handler to object
            object.addHandler(handler, token);

            // store to map
            pair = tokenMap[objectId] = {
              token: token,
              object: object
            };
          }
          else
          {
            // recalc value
            pair.token.set(value);
          }

          return pair.token;
        };

        getComputeToken.factory = FACTORY;
        getComputeToken.deferred = function(){
          return function(object){
            return getComputeToken(object).deferred();
          };
        };
      }

      return getComputeToken;
    },

   /**
    * @param {string|Array.<string>} events
    * @param {function(obj):any} getter
    * @return {basis.data.Value}
    */
    pipe: function(events, getter){
      var handler = createEventHandler(events, valueFromSetProxy);
      var getterId = getter[GETTER_ID] || String(getter);
      var id = handler.events.join('_') + '_' + getterId;
      var pipes = this.pipes_;
      var pipeValue;

      if (!pipes)
        pipes = this.pipes_ = {};
      else
        pipeValue = pipes[id];

      if (!pipeValue)
      {
        pipeValue = new Value({
          parent: this,
          pipeHandler: handler,
          proxy: basis.getter(getter),
          set: basis.fn.$undef,
          destroy: function(){
            var parent = this.parent;
            var parentValue = parent.value;

            if (parentValue instanceof Emitter)
              parentValue.removeHandler(this.pipeHandler, this);

            parent.pipes_[id] = null;
            this.parent = null;

            Value.prototype.destroy.call(this);
          }
        });

        pipes[id] = pipeValue;
        this.link(pipeValue, valueSyncPipe, false, pipeValue.destroy);
      }

      return pipeValue;
    },

   /**
    * Returns token which value equals to transformed via fn function value.
    * @param {function(value)} fn
    * @param {boolean=} deferred
    * @return {basis.Token|basis.DeferredToken}
    */
    as: function(fn, deferred){
      if (!fn)
        fn = $self;

      if (this.links_)
      {
        // try to find token with the same function
        var cursor = this;
        var fnId = fn[GETTER_ID] || String(fn);

        while (cursor = cursor.links_)
        {
          var context = cursor.context;
          if (context instanceof basis.Token &&
              (context.fn[GETTER_ID] || String(context.fn)) == fnId) // compare functions by id
            return deferred
              ? context.deferred()
              : context;
        }
      }

      // create token
      var token = new basis.Token();
      token.fn = fn;

      this.link(token, valueSyncToken);

      return deferred ? token.deferred() : token;
    },

   /**
    * @param {function(value)} fn
    * @return {basis.DeferredToken}
    */
    deferred: function(fn){
      return this.as(fn, true);
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
      this.pipes_ = null;
    }
  });

  //
  // cast to Value
  //

  var valueFromMap = {};
  var valueFromSetProxy = function(sender){
    Value.prototype.set.call(this, sender); // `this` is a token
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
        result = valueFromMap[id] = new Value({
          value: obj,
          proxy: basis.getter(getter),
          set: basis.fn.$undef,
          handler: {
            destroy: function(){
              valueFromMap[id] = null;
              obj.removeHandler(handler, this);
            }
          }
        });

        handler.destroy = function(sender){
          valueFromMap[id] = null;
          this.destroy();
        };

        obj.addHandler(handler, result);
      }
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
          result = valueFromMap[id] = new Value({
            value: bindingBridge.get(obj),
            set: basis.fn.$undef,
            handler: {
              destroy: function(){
                valueFromMap[id] = null;
                bindingBridge.detach(obj, Value.prototype.set, result);
              }
            }
          });

          bindingBridge.attach(obj, Value.prototype.set, result, result.destroy);
        }
      }
    }

    if (!result)
      throw 'Bad object type';

    return result;
  };

  function valuePipeFactory(events, getter){
    var parent = this;
    var result = function(value){
      value = parent(value);
      return value
        ? value.pipe(events, getter)
        : value;
    };

    result.factory = FACTORY;
    result.pipe = valuePipeFactory;

    return result;
  }

  Value.factory = function(events, getter){
    var result = function(object){
      return Value.from(object, events, getter);
    };

    result.factory = FACTORY;
    result.pipe = valuePipeFactory;

    return result;
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
    create: function(key, object){
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
    * Set new item set and destroy deleted items.
    * @param {Array.<basis.data.Object>} items
    * @return {Array.<basis.data.Object>|undefined} Returns array of inserted items or undefined if nothing inserted.
    */
    sync: function(items){
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

  function resolveAdapterProxy(){
    this.fn.call(this.context, this.source);
  }

 /**
  * @class
  */
  var ResolveAdapter = function(context, fn, source, handler){
    this.context = context;
    this.fn = fn;
    this.source = source;
    this.handler = handler;
  };

  ResolveAdapter.prototype = {
    context: null,
    fn: null,
    source: null,
    handler: null,
    next: null,
    attach: function(){
      this.source.addHandler(this.handler, this);
    },
    detach: function(){
      this.source.removeHandler(this.handler, this);
    }
  };

 /**
  * Binding bridge dataset adapter
  * @class
  */
  var BBResolveAdapter = function(){
    ResolveAdapter.apply(this, arguments);
  };
  BBResolveAdapter.prototype = new ResolveAdapter();
  BBResolveAdapter.prototype.attach = function(destroyCallback){
    this.source.bindingBridge.attach(this.source, this.handler, this, destroyCallback);
  };
  BBResolveAdapter.prototype.detach = function(){
    this.source.bindingBridge.detach(this.source, this.handler, this);
  };

  //
  // adapter handlers
  //

  var DEFAULT_CHANGE_ADAPTER_HANDLER = function(){
    this.fn.call(this.context, this.source);
  };
  var DEFAULT_DESTROY_ADAPTER_HANDLER = function(){
    this.fn.call(this.context, null);
  };
  var RESOLVEVALUE_DESTROY_ADAPTER_HANDLER = function(){
    this.fn.call(this.context, resolveValue(NULL_OBJECT, null, this.source.bindingBridge.get(this.source)));
  };

  var DATASETWRAPPER_ADAPTER_HANDLER = {
    datasetChanged: DEFAULT_CHANGE_ADAPTER_HANDLER,
    destroy: DEFAULT_DESTROY_ADAPTER_HANDLER
  };

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
      if (oldAdapter)
      {
        oldAdapter.detach();

        // destroy nested adapter if exists
        if (oldAdapter.next)
          resolveDataset(oldAdapter, null, null, 'next');
      }

      if (newAdapter)
        newAdapter.attach(DEFAULT_DESTROY_ADAPTER_HANDLER);

      context[property] = newAdapter;
    }

    return source;
  }

 /**
  * Resolve object from source value.
  */
  function resolveObject(context, fn, source, property, factoryContext){
    var oldAdapter = context[property] || null;
    var newAdapter = null;

    if (fn !== resolveAdapterProxy && typeof source == 'function')
      source = source.call(factoryContext || context, factoryContext || context);

    if (source && source.bindingBridge)
    {
      if (!oldAdapter || oldAdapter.source !== source)
        newAdapter = new BBResolveAdapter(context, fn, source, DEFAULT_CHANGE_ADAPTER_HANDLER);
      else
        newAdapter = oldAdapter;

      source = resolveObject(newAdapter, resolveAdapterProxy, source.bindingBridge.get(source), 'next');
    }

    if (source instanceof DataObject == false)
      source = null;

    if (property && oldAdapter !== newAdapter)
    {
      if (oldAdapter)
      {
        oldAdapter.detach();

        // destroy nested adapter if exists
        if (oldAdapter.next)
          resolveObject(oldAdapter, null, null, 'next');
      }

      if (newAdapter)
        newAdapter.attach(DEFAULT_DESTROY_ADAPTER_HANDLER);

      context[property] = newAdapter;
    }

    return source;
  }

 /**
  * Resolve value from source value.
  */
  function resolveValue(context, fn, source, property, factoryContext){
    var oldAdapter = context[property] || null;
    var newAdapter = null;

    // as functions could be a value, invoke only functions with factory property
    // i.e. source -> function(){ /* factory code */ }).factory === FACTORY
    // apply only for top-level resolveValue() invocation
    if (source && fn !== resolveAdapterProxy && typeof source == 'function' && source.factory === FACTORY)
      source = source.call(factoryContext || context, factoryContext || context);

    if (source && source.bindingBridge)
    {
      if (!oldAdapter || oldAdapter.source !== source)
        newAdapter = new BBResolveAdapter(context, fn, source, DEFAULT_CHANGE_ADAPTER_HANDLER);
      else
        newAdapter = oldAdapter;

      source = resolveValue(newAdapter, resolveAdapterProxy, source.bindingBridge.get(source), 'next');
    }

    if (property && oldAdapter !== newAdapter)
    {
      if (oldAdapter)
      {
        oldAdapter.detach();

        // destroy nested adapter if exists
        if (oldAdapter.next)
          resolveValue(oldAdapter, null, null, 'next');
      }

      if (newAdapter)
        newAdapter.attach(RESOLVEVALUE_DESTROY_ADAPTER_HANDLER);

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
      var dataset = cache.dataset;
      realEvent.call(dataset, cache);
    }

    function flushAllDataset(){
      var eventCacheCopy = eventCache;
      eventCache = {};
      for (var datasetId in eventCacheCopy)
      {
        var entry = eventCacheCopy[datasetId];
        if (entry)
          flushCache(entry);
      }
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
    Object: DataObject,
    Slot: Slot,

    KeyObjectMap: KeyObjectMap,

    ReadOnlyDataset: ReadOnlyDataset,
    Dataset: Dataset,
    DatasetWrapper: DatasetWrapper,

    isConnected: isConnected,
    getDatasetDelta: getDatasetDelta,

    ResolveAdapter: ResolveAdapter,
    resolveDataset: resolveDataset,
    resolveObject: resolveObject,
    resolveValue: resolveValue,

    wrapData: wrapData,
    wrapObject: wrapObject,
    wrap: wrap
  };
