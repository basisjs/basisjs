
  basis.require('basis.event');


 /**
  * This namespace contains base classes and functions for data maintain.
  *
  * Namespace overview:
  * - Const:
  *   {basis.data.STATE}, {basis.data.SUBSCRIPTION}
  * - Classes:
  *   {basis.data.Object}, {basis.data.KeyObjectMap},
  *   {basis.data.AbstractDataset}, {basis.data.Dataset}
  *
  * @namespace basis.data
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var cleaner = basis.cleaner;

  var values = basis.object.values;
  var $self = basis.fn.$self;

  var Emitter = basis.event.Emitter;
  var createEvent = basis.event.create;
  var events = basis.event.events;


  //
  // Main part
  //

  var NULL_OBJECT = {};
  var EMPTY_ARRAY = [];


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

    getList: function(){
      return values(STATE_EXISTS);
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
        ;;;basis.dev.warn('Attempt to add duplicate subscription');
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
        ;;;basis.dev.warn('Trying remove non-exists subscription');
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
    *   must must be instance of {basis.data.AbstractData} class.
    * @param {string=} eventName Name of event which fire when property changed.
    *   If omitted it will be equal to property name with 'Changed' suffix.
    */
    addProperty: function(propertyName, eventName){
      var handler = {};
      handler[eventName || propertyName + 'Changed'] = function(object, oldValue){
        if (oldValue)
          SUBSCRIPTION.unlink(propertyName, object, oldValue);

        if (object[propertyName])
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
    }
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
          for (var key in cfg.handler)
          {
            actions.push(cfg.action);
            handler[key] = handler[key]
              ? mixFunctions(handler[key], cfg.handler[key])  // suppose it never be used, but do it for double sure
              : cfg.handler[key];
          }
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
        this.addHandler(getMaskConfig(this.subscribeTo).handler);

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
      var stateCode = String(state);

      if (!STATE_EXISTS[stateCode])
        throw new Error('Wrong state value');

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
      isActive = !!isActive;

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
      // remove subscriptions if necessary
      if (this.active)
      {
        var config = getMaskConfig(this.subscribeTo);
        for (var i = 0, action; action = config.actions[i]; i++)
          action(SUBSCRIPTION.unlink, this);
      }

      // inherit
      Emitter.prototype.destroy.call(this);

      this.state = STATE.UNDEFINED;
    }
  });


  //
  // Value
  //

  var computeFunctions = {};

  var VALUE_TOKEN_HANDLER = {
    change: function(sender){
      var cursor = this;

      while (cursor = cursor.tokens_)
        cursor.token.set(cursor.fn(sender.value));
    }
  };


 /**
  * @class
  */
  var Value = Class(AbstractData, {
    className: namespace + '.Value',

   /**
    * Fires when value was changed.
    * @param {*} oldValue Value before changes.
    * @event
    */
    emit_change: createEvent('change', 'oldValue'),

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
    * @type {boolean}
    */
    locked: false,

   /**
    * Value before property locked (passed as oldValue when property unlock).
    * @type {*}
    * @private
    */
    lockedValue_: null,

   /**
    * @type {object}
    */
    tokens_: null,

   /**
    * @constructor
    */
    init: function(){
      AbstractData.prototype.init.call(this);

      if (this.proxy)
        this.value = this.proxy(this.value);

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
    * Locks object for change event fire.
    */
    lock: function(){
      if (!this.locked)
      {
        this.locked = true;
        this.lockedValue_ = this.value;
      }
    },

   /**
    * Unlocks object for change event fire. If value changed during object
    * was locked, than change event fires.
    */
    unlock: function(){
      if (this.locked)
      {
        this.locked = false;

        if (this.value !== this.lockedValue_)
        {
          this.emit_change(this.lockedValue_);
          this.lockedValue_ = null;
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

      var hostValue = this;
      var handler = basis.event.createHandler(events, function(object){
        this.set(fn(object, hostValue.value)); // `this` is a token
      });
      var getComputeTokenId = handler.events.concat(String(fn), this.basisObjectId).join('_');
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
          /** @cut */ if (object instanceof basis.event.Emitter == false)
          /** @cut */   basis.dev.warn('basis.data.Value#compute: object must be an instanceof basis.event.Emitter');

          var objectId = object.basisObjectId;
          var pair = tokenMap[objectId];

          if (!pair)
          {
            // create token with computed value
            var token = new basis.Token(fn(object, hostValue.value));
            
            // attach handler re-evaluate handler to object
            object.addHandler(handler, token);

            // store to map
            pair = tokenMap[objectId] = {
              token: token,
              object: object
            };
          }

          return pair.token;
        }

        getComputeToken.deferred = function(){
          return function(object){
            return getComputeToken(object).deferred();
          }
        };
      }

      return getComputeToken;
    },

   /**
    * Returns token which value equals to transformed via fn function value.
    * @param {function(value)} fn
    * @param {boolean=} deferred
    * @return {basis.Token|basis.DeferredToken}
    */ 
    as: function(fn, deferred){
      if (typeof fn != 'function')
        fn = basis.fn.$self;

      if (this.tokens_)
      {
        // try to find token with the same function
        var cursor = this;

        while (cursor = cursor.tokens_)
          if (cursor.fn == String(fn)) // compare functions as strings, as they should be with no sideeffect
            return deferred
              ? cursor.token.deferred()
              : cursor.token;
      }
      else
      {
        // add handler on value change, if there was no token before
        this.addHandler(VALUE_TOKEN_HANDLER);
      }

      // create token
      var token = new basis.Token(fn(this.value));

      // add to list
      this.tokens_ = {
        fn: fn,
        token: token,
        tokens_: this.tokens_
      };

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
    * @destructor
    */
    destroy: function(){
      AbstractData.prototype.destroy.call(this);

      this.proxy = null;
      this.initValue = null;
      this.value = null;
      this.lockedValue_ = null;
      this.tokens_ = null;
    }
  });


  //
  // Object
  //

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
    emit_update: createEvent('update', 'delta'),

   /**
    * Object that manage data updates if assigned.
    * @type {basis.data.Object}
    */
    delegate: null,

   /**
    * @type {boolean}
    */
    canSetDelegate: true,

   /**
    * Fires when delegate was changed.
    * @param {basis.data.Object} oldDelegate Object delegate before changes.
    * @event
    */
    emit_delegateChanged: createEvent('delegateChanged', 'oldDelegate'),

   /**
    * Flag to determine is this object target object or not. This property
    * is readonly and can't be changed after init.
    * @type {boolean}
    * @readobly
    */
    isTarget: false,

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
    * Flag determines object behaviour when assigned delegate is destroing:
    * - true - destroy object on delegate object destroing (cascade destroy)
    * - false - don't destroy object, detach delegate only
    * @type {boolean}
    */
    cascadeDestroy: false,

   /**
    * Default listeners.
    * @inheritDoc
    */
    listen: {
      delegate: {
        update: function(object, delta){
          this.data = object.data;
          this.emit_update(delta);
        },
        stateChanged: function(object, oldState){
          this.state = object.state;
          this.emit_stateChanged(oldState);
        },
        targetChanged: function(object, oldTarget){
          this.target = object.target;

          var targetListenHandler = this.listen.target;
          if (targetListenHandler)
          {
            if (oldTarget)
              oldTarget.removeHandler(targetListenHandler, this);

            if (this.target)
              this.target.addHandler(targetListenHandler, this);
          }

          this.emit_targetChanged(oldTarget);
        },
        rootChanged: function(object, oldRoot){
          this.data = object.data;
          this.root = object.root;
          this.emit_rootChanged(oldRoot);
        },
        destroy: function(){
          if (this.cascadeDestroy)
            this.destroy();
          else
            this.setDelegate();
        }
      }
    },

   /**
    * @constructor
    */
    init: function(){
      // inherit
      AbstractData.prototype.init.call(this);

      // data/delegate
      var delegate = this.delegate;

      if (delegate)
      {
        // assign a delegate
        // NOTE: ignore for this.data & this.state, no update/stateChanged events fired
        this.delegate = null;
        this.data = delegate.data;
        this.state = delegate.state;
        this.setDelegate(delegate);
      }
      else
      {
        this.root = this;

        // if data doesn't exists - init it
        if (!this.data)
          this.data = {};

        // set target property to itself if isTarget property true
        if (this.isTarget)
          this.target = this;
      }
    },

   /**
    * Returns root delegate object (that haven't delegate).
    * @return {basis.data.Object}
    */
    getRootDelegate: function(){
      var object = this;

      while (object.delegate && object.delegate !== object)
        object = object.delegate;

      return object;
    },

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
      if (!this.canSetDelegate)
        return false;

      // check is newDelegate can be linked to this object as delegate
      if (newDelegate && newDelegate instanceof DataObject)
      {
        // check for connected prevents from linking to objects
        // that has this object in delegate chains
        if (newDelegate.delegate && isConnected(this, newDelegate))
        {
          // show warning in dev mode about new delegate ignore because it is already connected with object
          ;;;basis.dev.warn('New delegate has already connected to object. Delegate assignment has been ignored.', this, newDelegate);

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
        var delta = {};

        var delegateListenHandler = this.listen.delegate;
        var targetListenHandler = (oldTarget || newDelegate) && 
                                  (!newDelegate || newDelegate.target !== oldTarget) && 
                                  this.listen.target;

        if (oldDelegate && delegateListenHandler)
          oldDelegate.removeHandler(delegateListenHandler, this);

        if (oldTarget && targetListenHandler)
          oldTarget.removeHandler(targetListenHandler, this);

        if (newDelegate)
        {
          // assign new delegate
          this.delegate = newDelegate;
          this.root = newDelegate.root;
          this.data = newDelegate.data;
          this.state = newDelegate.state;
          this.target = newDelegate.target;

          // calculate delta as difference between current data and delegate info
          for (var key in newDelegate.data)
            if (key in oldData === false)
              delta[key] = undefined;

          for (var key in oldData)
            if (oldData[key] !== newDelegate.data[key])
              delta[key] = oldData[key];

          if (delegateListenHandler)
            newDelegate.addHandler(delegateListenHandler, this);

          if (newDelegate.target && targetListenHandler)
            newDelegate.target.addHandler(targetListenHandler, this);

          // update & stateChanged can be fired only if new delegate was assigned;
          // otherwise (delegate drop) do nothing -> performance benefits

          // fire update event if any key in delta (data changed)
          for (var key in delta)
          {
            this.emit_update(delta);
            break;
          }

          // fire stateChanged event if state was changed
          if (oldState !== this.state && (String(oldState) != this.state || oldState.data !== this.state.data))
            this.emit_stateChanged(oldState);
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

        // fire event if target changed
        if (this.root !== oldRoot)
          this.emit_rootChanged(oldRoot);

        // fire event if target changed
        if (this.target !== oldTarget)
          this.emit_targetChanged(oldTarget);

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
      var root = this.target || this.getRootDelegate();

      // set new state for root
      if (root !== this)
        return root.setState(state, data);
      else
        return AbstractData.prototype.setState.call(this, state, data);
    },

   /**
    * Handle changing object data. Fires update event only if something was changed. 
    * @param {Object} data New values for object data holder (this.data).
    * @return {Object|boolean} Delta if object data (this.data) was updated or false otherwise.
    */
    update: function(data){
      var root = this.target || this.getRootDelegate();

      if (root !== this)
        return root.update(data);

      if (data)
      {
        var delta = {};
        var changed = false;

        for (var prop in data)
        {
          if (this.data[prop] !== data[prop])
          {
            changed = true;
            delta[prop] = this.data[prop];
            this.data[prop] = data[prop];
          }
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
      // drop delegate
      if (this.delegate)
        this.setDelegate();

      // inherit
      AbstractData.prototype.destroy.call(this);

      // drop data & state
      this.data = NULL_OBJECT;
      this.root = null;
      this.target = null;
    }
  });


  //
  // Slot
  //

  var Slot = Class(DataObject, {
    className: namespace('Slot')
  });


  //
  // KeyObjectMap
  //

  var KEYOBJECTMAP_MEMBER_HANDLER = {
    destroy: function(){
      delete this.map[this.itemId];
    }
  };

 /**
  * @class
  */
  var KeyObjectMap = Class(null, {
    className: namespace('KeyObjectMap'),

    itemClass: DataObject,
    keyGetter: $self,
    map_: null,

    extendConstructor_: true,
    init: function(){
      this.map_ = {};
      cleaner.add(this);
    },

    resolve: function(object){
      return this.get(this.keyGetter(object), object);
    },
    create: function(key, object){
      var itemConfig = {};

      if (key instanceof DataObject)
      {
        itemConfig.delegate = key;
      }
      else
      {
        itemConfig.data = {
          id: key,
          title: key
        };
      }

      return new this.itemClass(itemConfig);
    },
    get: function(key, object){
      var itemId = key instanceof DataObject ? key.basisObjectId : key;
      var item = this.map_[itemId];

      if (!item && object)
      {
        item = this.map_[itemId] = this.create(key, object);
        item.addHandler(KEYOBJECTMAP_MEMBER_HANDLER, {
          map: this.map_,
          itemId: itemId
        });
      }

      return item;
    },
    destroy: function(){
      cleaner.remove(this);

      var items = values(this.map_);
      for (var i = 0, item; item = items[i++];)
        item.destroy();
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
    var inserted = [];
    var deleted = [];

    if (!a || !a.itemCount)
      inserted = b.getItems();
    else
    {
      if (!b || !b.itemCount)
        deleted = a.getItems();
      else
      {
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
      }
    }

    return getDelta(inserted, deleted);
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
    * @type {basis.data.AbstractDataset}
    */
    dataset: null,

   /**
    * Fires when dataset was changed.
    * @param {basis.data.AbstractDataset} oldDataset
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
      var dataset = this.dataset;
      if (dataset)
      {
        this.dataset = null;
        this.setDataset(dataset);
      }

      DataObject.prototype.init.call(this);
    },

   /**
    * @param {basis.data.AbstractDataset} dataset
    */
    setDataset: function(dataset){
      if (dataset instanceof AbstractDataset == false)
        dataset = null;
      
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
        if (delta = getDatasetDelta(oldDataset, dataset))
          this.emit_itemsChanged(delta);

        this.dataset = dataset;
        this.emit_datasetChanged(oldDataset);
      }
    },

   /**
    * Proxy method for contained dataset. If no dataset, returns empty array.
    * @return {Array.<basis.data.Object>}
    */ 
    getItems: function(){
      return this.dataset ? this.dataset.getItems() : []
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.dataset)
        this.setDataset();

      DataObject.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var AbstractDataset = Class(AbstractData, {
    className: namespace('AbstractDataset'),

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
      this.cache_ = null;

      // call event 
      events.itemsChanged.call(this, delta);
    },

   /**
    * @constructor
    */
    init: function(){
      // inherit
      DataObject.prototype.init.call(this);

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
    * Do nothing, but incorrectly call in destroy method. Temporary here to avoid exceptions.
    * TODO: remove method definition and method call in destroy method.
    */ 
    clear: function(){
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.clear();

      // inherit
      DataObject.prototype.destroy.call(this);

      this.cache_ = EMPTY_ARRAY;  // empty array here, to prevent recalc cache
      this.itemCount = 0;

      this.members_ = null;
      this.items_ = null;
    }
  });


 /**
  * @class
  */
  var Dataset = Class(AbstractDataset, {
    className: namespace('Dataset'),

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
      AbstractDataset.prototype.init.call(this);

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
          ;;;basis.dev.warn('Wrong data type: value must be an instance of basis.data.Object');
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
          ;;;basis.dev.warn('Wrong data type: value must be an instance of basis.data.Object');
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
          ;;;basis.dev.warn('Wrong data type: value must be an instance of basis.data.Object');
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

      if (deleted)
        for (var i = 0, object; object = deleted[i]; i++)
          object.destroy();

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
    }
  });


  //
  // Accumulate dataset changes
  //

  Dataset.setAccumulateState = (function(){
    var proto = AbstractDataset.prototype;
    var realEvent = proto.emit_itemsChanged;
    var setStateCount = 0;
    var urgentTimer;
    var eventCache = {};

    function flushCache(cache){
      var dataset = cache.dataset;
      realEvent.call(dataset, cache);
    }

    function flushAllDataset(){
      var eventCacheCopy = eventCache;
      eventCache = {};
      for (var datasetId in eventCacheCopy)
        flushCache(eventCacheCopy[datasetId]);
    }

    function storeDatasetDelta(delta){
      var dataset = this;
      var datasetId = dataset.basisObjectId;
      var inserted = delta.inserted;
      var deleted = delta.deleted;
      var cache = eventCache[datasetId];

      if (inserted && deleted)
      {
        if (cache)
        {
          delete eventCache[datasetId];
          flushCache(cache);
        }
        realEvent.call(dataset, delta);
        return;
      }

      var mode = inserted ? 'inserted' : 'deleted';
      if (cache)
      {
        var array = cache[mode];
        if (!array)
          flushCache(cache);
        else
        {
          array.push.apply(array, inserted || deleted);
          return;
        }
      }

      eventCache[datasetId] = delta;
      delta.dataset = dataset;
    }

    function urgentFlush(){
      urgentTimer = null;
      if (setStateCount)
      {
        ;;;basis.dev.warn('(debug) Urgent flush dataset changes');
        setStateCount = 0;
        setAccumulateStateOff();
      }
    }

    function setAccumulateStateOff(){
      proto.emit_itemsChanged = realEvent;
      flushAllDataset();
    }

    return function(state) {
      if (state)
      {
        if (setStateCount == 0)
        {
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

    AbstractDataset: AbstractDataset,
    Dataset: Dataset,
    DatasetWrapper: DatasetWrapper,

    isConnected: isConnected,
    getDatasetDelta: getDatasetDelta,

    wrapData: wrapData,
    wrapObject: wrapObject,
    wrap: wrap
  };
