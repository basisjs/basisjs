var basisEvent = require('basis.event');
var Emitter = basisEvent.Emitter;
var createEvent = basisEvent.create;
var STATE = require('basis.data.state');
var SUBSCRIPTION = require('basis.data.subscription');
var resolveValue = require('basis.data.resolve').resolveValue;
var PROXY = basis.PROXY;
var ABSTRACTDATA_ACTIVE_SYNC_HANDLER = {
  subscribersChanged: function(host){
    this.set(host.subscriberCount > 0);
  }
};

/**
* Base class for any data type class.
* @class
*/
var AbstractData = Emitter.subclass({
  className: 'basis.data.AbstractData',
  propertyDescriptors: {
    state: 'stateChanged',
    active: 'activeChanged',
    subscriberCount: 'subscribersChanged'
  },

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
  syncEvents: basis.Class.oneFunctionProperty(
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
      {
        this.active = new basis.Token(this.subscriberCount > 0);
        this.addHandler(ABSTRACTDATA_ACTIVE_SYNC_HANDLER, this.active);
      }

      this.active = !!resolveValue(this, this.setActive, this.active, 'activeRA_');

      if (this.active)
        this.addHandler(SUBSCRIPTION.getMaskConfig(this.subscribeTo).handler);
    }

    // resolve state
    // Q: should we check for `instanceof String` here?
    if (this.state != STATE.UNDEFINED)
    {
      var state = this.state;

      if (typeof this.state != 'string')
        state = resolveValue(this, this.setState, state, 'stateRA_');

      if (state && !STATE.isValid(state))
      {
        /** @cut */ basis.dev.error('Wrong value for state (value has been ignored and state set to STATE.UNDEFINED)', state);
        state = false;
      }

      this.state = state || STATE.UNDEFINED;
    }

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
    state = resolveValue(this, this.setState, state, 'stateRA_') || STATE.UNDEFINED;

    var stateCode = String(state);

    if (!STATE.isValid(stateCode))
    {
      /** @cut */ basis.dev.error('Wrong value for state (value has been ignored)', stateCode);
      return false;
    }

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
    var proxyToken = this.activeRA_ && this.activeRA_.proxyToken;

    if (isActive === PROXY)
    {
      if (!proxyToken)
      {
        proxyToken = new basis.Token(this.subscriberCount > 0);
        this.addHandler(ABSTRACTDATA_ACTIVE_SYNC_HANDLER, proxyToken);
      }

      isActive = proxyToken;
    }
    else
    {
      if (proxyToken && isActive !== proxyToken)
      {
        this.removeHandler(ABSTRACTDATA_ACTIVE_SYNC_HANDLER, proxyToken);
        proxyToken = null;
      }
    }

    isActive = !!resolveValue(this, this.setActive, isActive, 'activeRA_');

    if (proxyToken && this.activeRA_)
      this.activeRA_.proxyToken = proxyToken;

    if (this.active != isActive)
    {
      this.active = isActive;
      this.emit_activeChanged();

      if (isActive)
        SUBSCRIPTION.subscribe(this, this.subscribeTo);
      else
        SUBSCRIPTION.unsubscribe(this, this.subscribeTo);

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
        SUBSCRIPTION.changeSubscription(this, curSubscriptionType, newSubscriptionType);

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
      var config = SUBSCRIPTION.getMaskConfig(this.subscribeTo);
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

module.exports = AbstractData;
