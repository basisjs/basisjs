/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

(function(){

  'use strict';

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Const:
  *   {Basis.Data.STATE}, {Basis.Data.Subscription}
  * - Classes:
  *   {Basis.Data.DataObject}, {Basis.Data.KeyObjectMap},
  *   {Basis.Data.AbstractDataset}, {Basis.Data.Dataset}
  * - Various dataset classes:
  *   {Basis.Data.Dataset.Merge}, {Basis.Data.Dataset.Subtract},
  *   {Basis.Data.Dataset.MapReduce}, {Basis.Data.Dataset.Subset},
  *   {Basis.Data.Dataset.Split}
  *
  * @namespace Basis.Data
  */
  var namespace = 'Basis.Data';

  //
  // import names
  //

  var Class = Basis.Class;

  var EventObject = Basis.EventObject;

  var extend = Object.extend;
  var values = Object.values;
  var $self = Function.$self;
  var $true = Function.$true;
  var $false = Function.$false;
  var createEvent = EventObject.createEvent;
  var event = EventObject.event;

  //
  // Main part
  //

  var NULL_OBJECT = {};
  var EMPTY_ARRAY = [];

  // States for StateObject

  /** @const */ var STATE_UNDEFINED  = 'undefined';
  /** @const */ var STATE_READY      = 'ready';
  /** @const */ var STATE_PROCESSING = 'processing';
  /** @const */ var STATE_ERROR      = 'error';
  /** @const */ var STATE_DEPRECATED = 'deprecated';

  // New events

  //
  // Subscription sheme
  //

  var subscriptionHandlers = {};
  var subscriptionSeed = 1;

  var Subscription = {
    NONE: 0,
    MASK: 0,

   /**
    * Registrate new type of subscription
    * @param {string} name
    * @param {Object} handler
    * @param {function()} action
    */
    regType: function(name, handler, action){
      subscriptionHandlers[subscriptionSeed] = {
        handler: handler,
        action: action,
        context: {
          add: function(thisObject, object){
            if (object)
            {
              var subscriberId = Subscription[name] + '_' + thisObject.eventObjectId;

              if (!object.subscribers_)
                object.subscribers_ = {};

              if (!object.subscribers_[subscriberId])
              {
                var oldSubscriberCount = object.subscriberCount;
                object.subscribers_[subscriberId] = thisObject;
                object.subscriberCount += 1;
                object.event_subscribersChanged(object, oldSubscriberCount);
              }
              else
              {
                ;;;console.warn('Attempt to add dublicate subscription');
              }
            }
          },
          remove: function(thisObject, object){
            if (object)
            {
              var subscriberId = Subscription[name] + '_' + thisObject.eventObjectId;
              if (object.subscribers_[subscriberId])
              {
                var oldSubscriberCount = object.subscriberCount;
                delete object.subscribers_[subscriberId];
                object.subscriberCount -= 1;
                object.event_subscribersChanged(object, oldSubscriberCount);
              }
              else
              {
                ;;;console.warn('Trying remove non-exists subscription');
              }
            }
          }
        }
      };

      Subscription[name] = subscriptionSeed;
      Subscription.MASK |= subscriptionSeed;

      subscriptionSeed <<= 1;
    }
  };

 /**
  * Apply subscription according with current state.
  * For internal purposes only.
  */
  function applySubscription(object, mask, state){
    var idx = 1;
    var config;

    while (mask)
    {
      if (mask & 1)
      {
        config = subscriptionHandlers[idx];
        if (state & idx)
        {
          object.addHandler(config.handler, config.context);
          config.action(config.context.add, object);
        }
        else
        {
          object.removeHandler(config.handler, config.context);
          config.action(config.context.remove, object);
        }
      }
        
      mask >>= 1;
      idx <<= 1;
    }
  }

  //
  // Registrate base subscription types
  //

  Subscription.regType(
    'DELEGATE',
    {
      delegateChanged: function(object, oldDelegate){
        this.remove(object, oldDelegate);
        this.add(object, object.delegate);
      }
    },
    function(action, object){
      action(object, object.delegate);
    }
  );

  Subscription.regType(
    'TARGET',
    {
      targetChanged: function(object, oldTarget){
        this.remove(object, oldTarget);
        this.add(object, object.target);
      }
    },
    function(action, object){
      action(object, object.target);
    }
  );

  Subscription.regType(
    'SOURCE',
    {
      sourceChanged: function(object, oldSource){
        this.remove(object, oldSource);
        this.add(object, object.source);
      },
      sourcesChanged: function(object, delta){
        var array;

        if (array = delta.inserted)
          for (var i = array.length; i --> 0;)
            this.add(object, array[i]);

        if (array = delta.deleted)
          for (var i = array.length; i --> 0;)
            this.remove(object, array[i]);
      }
    },
    function(action, object){
      var sources = object.sources || [object.source];

      for (var i = 0, source; source = sources[i++];)
        action(object, source);
    }
  );


  //
  // DataObject
  //

 /**
  * Base class for data storing.
  * @class
  */
  var DataObject = Class(EventObject, {
    className: namespace + '.DataObject',

   /**
    * State of object. Might be managed by delegate object (if used).
    * @type {Basis.Data.STATE|string}
    */
    state: STATE_READY,

   /**
    * Using for data storing. Might be managed by delegate object (if used).
    * @type {Object}
    */
    data: null,

   /**
    * @type {boolean}
    */
    canHaveDelegate: true,

   /**
    * Object that manage data updates if assigned.
    * @type {Basis.Data.DataObject}
    */
    delegate: null,

   /**
    * Root of delegate chain. By default and when no delegate, it points to object itself.
    * @type {Basis.Data.DataObject}
    * @readonly
    */
    root: null,

   /**
    * Flag determines object behaviour when assigned delegate is destroing:
    * - true - destroy object on delegate object destroing (cascade destroy)
    * - false - don't destroy object, detach delegate only
    * @type {boolean}
    */
    cascadeDestroy: false,

   /**
    * Flag to determine is this object target object or not. This property
    * is readonly and can't be changed after init.
    * @type {boolean}
    * @readobly
    */
    isTarget: false,

   /**
    * Reference to root delegate if some object in delegate chain marked as targetPoint.
    * @type {Basis.Data.DataObject}
    * @readonly
    */
    target: null,

   /**
    * Indicates if object influences to related objects or not (is
    * subscription on).
    * @type {boolean}
    */
    active: false,

   /**
    * Subscriber type indicates what sort of influence has currency object on
    * related objects (delegate, source, dataSource etc).
    * @type {Basis.Data.Subscription|number}
    */
    subscribeTo: Subscription.DELEGATE + Subscription.TARGET,

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
    * Fires on data changes.
    * @param {Basis.Data.DataObject} object Object which data property
    * was changed. Usually it is root of delegate chain.
    * @param {object} delta Delta of changes. Keys in delta are property
    * names that was changed, and values is previous value of property
    * (value of property before changes).
    * @event
    */
    event_update: createEvent('update', 'object', 'delta'),

   /**
    * Fires when state or state.data was changed.
    * @param {Basis.Data.DataObject} object Object which state was changed.
    * @param {object} oldState Object state before changes.
    * @event
    */
    event_stateChanged: createEvent('stateChanged', 'object', 'oldState'),

   /**
    * Fires when state or state.data was changed.
    * @param {Basis.Data.DataObject} object Object which state was changed.
    * @param {Basis.Data.DataObject} oldDelegate Object delegate before changes.
    * @event
    */
    event_delegateChanged: createEvent('delegateChanged', 'object', 'oldDelegate'),

   /**
    * Fires when root of delegate chain was changed.
    * @param {Basis.Data.DataObject} object Object which root was changed.
    * @param {Basis.Data.DataObject} oldRoot Object root before changes.
    * @event
    */
    event_rootChanged: createEvent('rootChanged', 'object', 'oldRoot'),

   /**
    * Fires when target property was changed.
    * @param {Basis.Data.DataObject} object Object which target property was changed.
    * @param {Basis.Data.DataObject} oldTarget Object before changes.
    * @event
    */
    event_targetChanged: createEvent('targetChanged', 'object', 'oldTarget') && function(object, oldTarget){
      var targetHandler = this.listen.target;

      if (targetHandler)
      {
        if (oldTarget)
          oldTarget.removeHandler(targetHandler, this);

        if (this.target)
          this.target.addHandler(targetHandler, this);
      }

      event.targetChanged.call(this, object, oldTarget);
    },

   /**
    * Fires when count of subscribers (subscriberCount property) was changed.
    * @param {Basis.Data.DataObject} object Object which subscribers count was changed.
    * @event
    */
    event_subscribersChanged: createEvent('subscribersChanged', 'object'),

   /**
    * Fires when state of subscription was changed.
    * @event
    */
    event_activeChanged: createEvent('activeChanged', 'object'),

   /**
    * Default listeners.
    * @inheritDoc
    */
    listen: {
      delegate: {
        update: function(object, delta){
          this.data = object.data;
          this.event_update(this, delta);
        },
        stateChanged: function(object, oldState){
          this.state = object.state;
          this.event_stateChanged(this, oldState);
        },
        targetChanged: function(object, oldTarget){
          this.target = object.target;
          this.event_targetChanged(this, oldTarget);
        },
        rootChanged: function(object, oldRoot){
          this.data = object.data;
          this.event_rootChanged(this, oldRoot);
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
    * @param {Object=} config The configuration of object.
    * @constructor
    */
    init: function(config){
      // inherit
      EventObject.prototype.init.call(this, config);

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

      // subscription sheme: activate subscription if active
      if (this.active)
        applySubscription(this, this.subscribeTo, Subscription.MASK);
    },

   /**
    * Returns true if current object is connected to another object through delegate bubbling.
    * @param {Basis.Data.DataObject} object
    * @return {boolean} Whether objects are connected.
    */
    isConnected: function(object){
      if (object instanceof DataObject)
      {
        while (object && object !== this && object !== object.delegate)
          object = object.delegate;
          
        return object === this;
      }

      return false;
    },

   /**
    * Returns root delegate object (that haven't delegate).
    * @return {Basis.Data.DataObject}
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
    *   var a = new Basis.Data.DataObject();
    *   var b = new Basis.Data.DataObject();
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
    *   a.setState(Basis.Data.STATE.PROCESSING);
    *   alert(a.state); // shows 'processing'
    *   alert(a.state === b.state); // shows true
    * @param {Basis.Data.DataObject} delegate
    * @return {Basis.Data.DataObject} Returns current delegate object.
    */
    setDelegate: function(newDelegate){

      // check is newDelegate can be linked to this object as delegate
      if (this.canHaveDelegate && newDelegate && newDelegate instanceof DataObject)
      {
        // check for connected prevents from linking to objects
        // that has this object in delegate chains
        if (newDelegate.delegate && this.isConnected(newDelegate))
        {
          // DEBUG: show warning in debug mode that we drop delegate because it is already connected with object
          ;;;if (newDelegate && typeof console != 'undefined') console.warn('(debug) New delegate has already connected to object. Delegate assign has been ignored.', this, newDelegate);

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

        if (oldDelegate)
          oldDelegate.removeHandler(this.listen.delegate, this);

        if (newDelegate)
        {
          // assing new delegate
          this.delegate = newDelegate;
          this.root = newDelegate.root;
          this.data = newDelegate.data;
          this.state = newDelegate.state;
          this.target = newDelegate.target;

          newDelegate.addHandler(this.listen.delegate, this);

          // calculate delta as difference between current data and delegate info
          for (var key in newDelegate.data)
            if (key in oldData === false)
              delta[key] = undefined;

          for (var key in oldData)
            if (oldData[key] !== newDelegate.data[key])
              delta[key] = oldData[key];
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

        // fire event if delegate changed
        this.event_delegateChanged(this, oldDelegate);

        // fire event if target changed
        if (this.root !== oldRoot)
          this.event_rootChanged(this, oldRoot);

        // fire event if target changed
        if (this.target !== oldTarget)
          this.event_targetChanged(this, oldTarget);

        // update & stateChanged can be fired only if new delegate was assigned;
        // otherwise (delegate drop) do nothing -> performance benefits
        if (newDelegate)
        {
          // fire update event if any key in delta (data changed)
          for (var key in delta)
          {
            this.event_update(this, delta);
            break;
          }

          // fire stateChanged event if state was changed
          if (oldState !== this.state && (String(oldState) != this.state || oldState.data !== this.state.data))
            this.event_stateChanged(this, oldState);
        }

        // delegate was changed
        return true;
      }

      return false; // delegate doesn't changed
    },

   /**
    * Set new state for object. Fire stateChanged event only if state (or state text) was changed.
    * @param {Basis.Data.STATE|string} state New state for object
    * @param {Object=} data
    * @param {boolean=} forceEvent Fire stateChanged event even state didn't changed.
    * @return {Basis.Data.STATE|string} Current object state.
    */
    setState: function(state, data){
      var root = this.target || this.getRootDelegate();

      // set new state for root
      if (root !== this)
        return root.setState(state, data);

      // set new state for object
      if (this.state != String(state) || this.state.data != data)
      {
        var oldState = this.state;

        this.state = Object(String(state));
        this.state.data = data;

        this.event_stateChanged(this, oldState);

        return true; // state was changed
      }

      return false; // state wasn't changed
    },

   /**
    * Default action on deprecate, set object state to STATE_DEPRECATED,
    * but only if object isn't in STATE_PROCESSING state.
    */
    deprecate: function(){
      if (this.state != STATE_PROCESSING)
        this.setState(STATE_DEPRECATED);
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
        var updateCount = 0;

        for (var prop in data)
        {
          if (this.data[prop] !== data[prop])
          {
            updateCount++;
            delta[prop] = this.data[prop];
            this.data[prop] = data[prop];
          }
        }

        if (updateCount)
        {
          this.event_update(this, delta);
          return delta;
        }
      }

      return false;
    },

   /**
    * Set new value for isActiveSubscriber property.
    * @param {boolean} isActive New value for {Basis.Data.DataObject#isActiveSubscriber} property.
    * @return {boolean} Returns true if {Basis.Data.DataObject#isActiveSubscriber} was changed.
    */
    setActive: function(isActive){
      isActive = !!isActive;

      if (this.active != isActive)
      {
        this.active = isActive;
        this.event_activeChanged(this);

        applySubscription(this, this.subscribeTo, Subscription.MASK * isActive);

        return true;
      }

      return false;
    },

   /**
    * Set new value for subscriptionType property.
    * @param {number} subscriptionType New value for {Basis.Data.DataObject#subscriptionType} property.
    * @return {boolean} Returns true if {Basis.Data.DataObject#subscribeTo} was changed.
    */
    setSubscription: function(subscriptionType){
      var curSubscriptionType = this.subscribeTo;
      var newSubscriptionType = subscriptionType & Subscription.MASK;
      var delta = curSubscriptionType ^ newSubscriptionType;

      if (delta)
      {
        this.subscribeTo = newSubscriptionType;

        if (this.active)
          applySubscription(this, delta, newSubscriptionType);

        return true;
      }

      return false;
    },

   /**
    * @destructor
    */
    destroy: function(){
      // remove subscriptions if necessary
      if (this.active)
        applySubscription(this, this.subscribeTo, 0);

      // drop delegate
      if (this.delegate)
        this.setDelegate();

      // inherit
      EventObject.prototype.destroy.call(this);

      // drop data & state
      this.data = NULL_OBJECT;
      this.state = STATE_UNDEFINED;
      this.root = null;
      this.target = null;
    }
  });

  //
  // KeyObjectMap
  //

 /**
  * @class
  */
  var KeyObjectMap = Class(null, {
    className: namespace + '.KeyObjectMap',

    itemClass: DataObject,
    keyGetter: $self,
    map_: null,

    extendConstructor_: true,
    init: function(config){
      this.map_ = {};
      Basis.Cleaner.add(this);
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
      var isDataObject = key instanceof DataObject;
      var itemId = isDataObject ? key.eventObjectId : key;
      var item = this.map_[itemId];

      if (!item && object)
      {
        item = this.map_[itemId] = this.create(key, object);
        item.addHandler({
          destroy: function(){
            delete this.map_[itemId];
          }
        }, this);
      }

      return item;
    },
    destroy: function(){
      Basis.Cleaner.remove(this);

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
  * @class
  */
  var AbstractDataset = Class(DataObject, {
    className: namespace + '.AbstractDataset',

   /**
    * Datasets can't have delegate by default.
    * @inheritDoc
    */
    //canHaveDelegate: false, // ????

   /**
    * Default state for set is undefined. It useful to trigger dataset update
    * on demand.
    * @inheritDoc
    */
    state: STATE_UNDEFINED,

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
    item_: null,

   /**
    * Set of all items, even items are not in member set. May be used as storage for
    * members, which provide posibility to avoid dublicates in resultinf set before
    * event_datasetChanged event be fired.
    * @private
    */
    memberMap_: null,

   /**
    * Cache array of members, for getItems method.
    * @private
    */
    cache_: null,

   /**
    * Fires when items changed.
    * @param {Basis.Data.AbstractDataset} dataset
    * @param {object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new items
    * and `deleted` property is array of removed items.
    * @event
    */
    event_datasetChanged: createEvent('datasetChanged', 'dataset', 'delta') && function(dataset, delta){
      // before event
      var items;
      var insertCount = 0;
      var deleteCount = 0;
      var object;

      // add new items
      if (items = delta.inserted)
      {
        while (object = items[insertCount])
        {
          this.item_[object.eventObjectId] = object;
          insertCount++;
        }
      }

      // remove old items
      if (items = delta.deleted)
      {
        while (object = items[deleteCount])
        {
          delete this.item_[object.eventObjectId];
          deleteCount++;
        }
      }

      // update item count
      this.itemCount += insertCount - deleteCount;

      // drop cache
      this.cache_ = null;

      // call event 
      event.datasetChanged.call(this, dataset, delta);
    },

   /**
    * @constructor
    */
    init: function(config){
      // inherit
      DataObject.prototype.init.call(this, config);

      this.memberMap_ = {};
      this.item_ = {};
    },

   /**
    * Check is object in dataset.
    * @param {Basis.Data.DataObject} object Object check for.
    * @return {boolean} Returns true if object in dataset.
    */
    has: function(object){
      return !!(object && this.item_[object.eventObjectId]);
    },

   /**
    * Returns all items in dataset.
    * @return {Array.<Basis.Data.DataObject>} 
    */
    getItems: function(){
      if (!this.cache_)
        this.cache_ = values(this.item_);

      return this.cache_;
    },

   /**
    * Returns first any item if exists.
    * @return {Basis.Data.DataObject}
    */
    pick: function(){
      for (var objectId in this.item_)
        return this.item_[objectId];

      return null;
    },

   /**
    * Returns some N items from dataset if exists.
    * @param {number} count Max length of resulting array.
    * @return {Array.<Basis.Data.DataObject>} 
    */
    top: function(count){
      var result = [];

      if (count)
        for (var objectId in this.item_)
          if (result.push(this.item_[objectId]) >= count)
            break;

      return result;
    },

   /**
    * @param {Array.<Basis.Data.DataObject>} items
    */
    add: function(items){
    },

   /**
    * @param {Array.<Basis.Data.DataObject>} items
    */
    remove: function(items){
    },

   /**
    * @param {Array.<Basis.Data.DataObject>} items
    */
    set: function(items){
    },

   /**
    * @param {Array.<Basis.Data.DataObject>} items
    * @param {boolean=} set
    */
    sync: function(items, set){
    },

   /**
    * Removes all items from dataset.
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

      this.memberMap_ = null;
      this.item_ = null;
    }
  });

  //
  // Dataset
  //

 /**
  * @class
  */
  var Dataset = Class(AbstractDataset, {
    className: namespace + '.Dataset',

   /**
    * @inheritDoc
    */
    listen: {
      item: {
        destroy: function(object){
          if (this.memberMap_[object.eventObjectId])
            this.remove([object]);
        }
      }
    },

   /**
    * @config {Array.<Basis.Data.DataObject>} items Initial set of items.
    * @constructor
    */
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      var items = this.items;
      if (items)
      {
        this.set(items);
        this.items = null;
      }
    },

    add: function(data){
      var delta;
      var memberMap = this.memberMap_;
      var inserted = [];

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;
            object.addHandler(this.listen.item, this);

            inserted.push(object);
          }
        }
      }

      // trace changes
      if (inserted.length)
      {
        this.event_datasetChanged(this, delta = {
          inserted: inserted
        });
      }

      return delta;
    },

    remove: function(data){
      var delta;
      var memberMap = this.memberMap_;
      var deleted = [];

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (memberMap[objectId])
          {
            object.removeHandler(this.listen.item, this);
            delete memberMap[objectId];

            deleted.push(object);
          }
        }
      }

      // trace changes
      if (deleted.length)
      {
        this.event_datasetChanged(this, delta = {
          deleted: deleted
        });
      }

      return delta;
    },

    set: function(data){

      // a little optimizations
      if (!this.itemCount)
        return this.add(data);

      if (!data.length)
        return this.clear();

      // main part

      // build map for new data
      var memberMap = this.memberMap_;
      var exists = {};  // unique input DataObject's
      var deleted = [];
      var inserted = [];
      var object;
      var objectId;
      var delta;

      for (var i = 0; i < data.length; i++)
      {
        object = data[i];

        if (object instanceof DataObject)
        {
          objectId = object.eventObjectId;
          exists[objectId] = object;

          // insert data
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;
            object.addHandler(this.listen.item, this);

            inserted.push(object);
          }
        }
      }

      // delete data
      for (var objectId in memberMap)
      {
        if (!exists[objectId])
        {
          object = memberMap[objectId];

          object.removeHandler(this.listen.item, this);
          delete memberMap[objectId];

          deleted.push(object);
        }
      }
      
      // fire event if any changes
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);

      return delta;
    },

    sync: function(data, set){
      if (!data)
        return;

      Dataset.setAccumulateState(true);

      var memberMap = this.memberMap_;
      var object;
      var objectId;
      var exists = {};
      var inserted = [];
      var deleted = [];
      var res;

      for (var i = 0; i < data.length; i++)
      {
        object = data[i];

        if (object instanceof DataObject)
        {
          objectId = object.eventObjectId;

          exists[objectId] = object;
          if (!memberMap[objectId])
            inserted.push(object);
        }
      }

      for (var objectId in this.item_)
      {
        if (!exists[objectId])
          this.item_[objectId].destroy();
      }

      if (set && inserted.length)
        res = this.add(inserted);

      Dataset.setAccumulateState(false);

      return res;
    },

    clear: function(){
      var delta;
      var deleted = this.getItems();

      if (deleted.length)
      {
        for (var i = deleted.length; i --> 0;)
          deleted[i].removeHandler(this.listen.item, this);

        this.event_datasetChanged(this, delta = {
          deleted: deleted
        });
         
        this.memberMap_ = {};
      }

      return delta;
    }
  });


  //
  // Accumulate dataset changes
  //

  Dataset.setAccumulateState = (function(){
    var proto = AbstractDataset.prototype;
    var realEvent = proto.event_datasetChanged;
    var setStateCount = 0;
    var urgentTimer;
    var eventCache = {};

    function flushCache(cache){
      var dataset = cache.dataset;
      realEvent.call(dataset, dataset, cache);
    }

    function flushAllDataset(){
      var eventCacheCopy = eventCache;
      eventCache = {};
      values(eventCacheCopy).forEach(flushCache);
    }

    function storeDatasetDelta(dataset, delta){
      var datasetId = dataset.eventObjectId;
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
        return realEvent.call(dataset, dataset, delta);
      }

      var mode = inserted ? 'inserted' : 'deleted';
      if (cache)
      {
        var array = cache[mode];
        if (!array)
          flushCache(cache);
        else
          return array.push.apply(array, inserted || deleted);
      }

      eventCache[datasetId] = delta;
      delta.dataset = dataset;
    }

    function urgentFlush(){
      ;;;if (typeof console != 'undefined') console.warn('(debug) Urgent flush dataset changes');
      setStateCount = 1;
      setAccumulateState(false);
    }

    return function setAccumulateState(state){
      if (state)
      {
        if (setStateCount == 0)
        {
          proto.event_datasetChanged = storeDatasetDelta;
          urgentTimer = setTimeout(urgentFlush, 0);
        }
        setStateCount++;
      }
      else
      {
        if (setStateCount == 1)
        {
          clearTimeout(urgentTimer);
          proto.event_datasetChanged = realEvent;
          flushAllDataset();
        }

        setStateCount -= setStateCount > 0;
      }
    }
  })();


  //
  // Merge dataset 
  //

  var MERGE_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var memberMap = this.memberMap_;
      var updated = {};
      var deleted = [];

      var object;
      var objectId;

      if (delta.inserted)
      {
        for (var i = 0; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
        
          // check: is this object already known
          if (memberMap[objectId])
          {
            // item exists -> increase source links count
            memberMap[objectId].count++;
          }
          else
          {
            // registrate in source map
            memberMap[objectId] = {
              count: 1,
              object: object
            };
          }

          // mark as updated
          updated[objectId] = memberMap[objectId];
        }
      }

      if (delta.deleted)
      {
        for (var i = 0; object = delta.deleted[i]; i++)
        {
          objectId = object.eventObjectId;

          // mark as updated
          updated[objectId] = memberMap[objectId];

          // descrease source counter
          memberMap[objectId].count--;
        }
      }

      // build delta and fire event
      this.applyRule(updated);
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };

 /**
  * @namespace Basis.Data.Dataset
  */

 /**
  * @class
  */
  var Merge = Class(AbstractDataset, {
    className: namespace + '.Dataset.Merge',

   /**
    * @inheritDoc
    */
    subscribeTo: Subscription.SOURCE,

   /**
    * Fires when source set changed.
    * @param {Basis.Data.AbstractDataset} dataset
    * @param {object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new sources
    * and `deleted` property is array of removed sources.
    * @event
    */
    event_sourcesChanged: createEvent('sourcesChanged', 'dataset', 'delta'),

   /**
    * @type {Array.<Basis.Data.AbstractDataset>}
    */
    sources: null,

   /**
    * @type {function(count, sourceCount):boolean}
    */
    rule: function(count, sourceCount){
      return count > 0;
    },

   /**
    * @inheritDoc
    */
    listen: {
      source: MERGE_DATASET_HANDLER
    },

   /**
    * @config {Array.<Basis.Data.AbstractDataset>} sources Set of source datasets for aggregate.
    * @constructor
    */
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      // init part
      var sources = this.sources;
      this.sources = [];
      if (sources)
        sources.forEach(this.addSource, this);
    },

   /**
    * Set new merge rule for dataset. Some types are available in Basis.Data.Dataset.Merge
    * @param {function(count, sourceCount):boolean} rule New rule.
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = Merge.UNION;

      if (this.rule !== rule)
      {
        this.rule = rule;
        this.applyRule();
      }
    },

   /**
    * Check all members are they match to rule or not.
    * @param {Object=} scope Key map that will be checked. If not passed than all members
    * will be checked.
    */
    applyRule: function(scope){
      var memberMap = this.memberMap_;
      var rule = this.rule;
      var sourceCount = this.sources.length;
      var inserted = [];
      var deleted = [];
      var memberCounter;
      var isMember;
      var delta;

      if (!scope)
        scope = memberMap;

      for (var objectId in scope)
      {
        memberCounter = memberMap[objectId];
        isMember = sourceCount && memberCounter.count && rule(memberCounter.count, sourceCount);

        if (isMember != !!this.item_[objectId])
          (isMember
            ? inserted // not in items -> insert
            : deleted  // already in items -> delete
          ).push(memberCounter.object); 

        if (memberCounter.count == 0)
          delete memberMap[objectId];
      }

      // fire event if delta found
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    },

   /**
    * Add source from sources list.
    * @param {Basis.Data.AbstractDataset} source
    * @return {boolean} Returns true if new source added.
    */
    addSource: function(source){
      if (source instanceof AbstractDataset)
      {
        if (this.sources.add(source))
        {
          // add event listeners to source
          source.addHandler(this.listen.source, this);

          // process new source objects and update member map
          var memberMap = this.memberMap_;
          for (var objectId in source.item_)
          {
            // check: is this object already known
            if (memberMap[objectId])
            {
              // item exists -> increase source links count
              memberMap[objectId].count++;
            }
            else
            {
              // add to source map
              memberMap[objectId] = {
                count: 1,
                object: source.item_[objectId]
              };
            }
          }

          // build delta and fire event
          this.applyRule();

          // fire sources changes event
          this.event_sourcesChanged(this, {
            inserted: [source]
          });

          return true;
        }
      }
      else
      {
        ;;;if(typeof console != 'undefined') console.warn(this.className + '.addSource: source isn\'t instance of AbstractDataset');
      }
    },

   /**
    * Removes source from sources list.
    * @param {Basis.Data.AbstractDataset} source
    * @return {boolean} Returns true if source removed.
    */
    removeSource: function(source){
      if (this.sources.remove(source))
      {
        // remove event listeners from source
        source.removeHandler(this.listen.source, this);

        // process removing source objects and update member map
        var memberMap = this.memberMap_;
        for (var objectId in source.item_)
          memberMap[objectId].count--;

        // build delta and fire event
        this.applyRule();

        // fire sources changes event
        this.event_sourcesChanged(this, {
          deleted: [source]
        });

        return true;
      }
      else
      {
        ;;;if(typeof console != 'undefined') console.warn(this.className + '.removeSource: source isn\'t in dataset source list');
      }
    },

   /**
    * Synchonize sources list according new list.
    * TODO: optimize, reduce event_sourcesChanged and event_datasetChanged count
    * TODO: returns delta of source list changes
    * @param {Array.<Basis.Data.AbstractDataset>} sources
    */
    setSources: function(sources){
      var exists = Array.from(this.sources); // clone list

      for (var i = 0, source; source = sources[i]; i++)
      {
        if (source instanceof AbstractDataset)
        {
          if (!exists.remove(source))
            this.addSource(source);
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.setSources: source isn\'t type of AbstractDataset', source);
        }
      }

      exists.forEach(this.removeSource, this);
    },

   /**
    * Remove all sources. All members are removing as side effect.
    * TODO: optimize, reduce event_sourcesChanged and event_datasetChanged count
    */
    clear: function(){
      Array.from(this.sources).forEach(this.removeSource, this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sources = null;
    }
  });

 /**
  * ANY source INCLUDE item
  * (by default)
  */
  Merge.UNION = Merge.prototype.rule;

 /**
  * ALL sources must INCLUDE item
  */
  Merge.INTERSECTION = function(count, sourceCount){
    return count == sourceCount;
  };

 /**
  * ONLY ONE source INCLUDE item
  */
  Merge.DIFFERENCE = function(count, sourceCount){
    return count == 1;
  };

 /**
  * MORE THAT ONE source INCLUDE item
  * make sence for more than one source (if one source - no filter)
  * for 2 sources it equal INTERSECTION
  * for 3 and more sources it equivalent UNION / DIFFERENCE (subtract)
  */
  Merge.MORE_THAN_ONE_INCLUDE = function(count, sourceCount){
    return sourceCount == 1 || count > 1;
  };

 /**
  * AT LEAST ONE source EXCLUDE item
  * make sence for more than one source (if one source - no filter)
  * for 2 sources it equal DIFFERENCE
  * for 3 and more sources it equivalent UNION / INTERSECTION (subtract)
  */
  Merge.AT_LEAST_ONE_EXCLUDE = function(count, sourceCount){
    return sourceCount == 1 || count < sourceCount;
  };

  //
  // Subtract
  //

  var datasetAbsentFilter = function(item){
    return !this.has(item);
  };

  var SUBTRACTDATASET_MINUEND_HANDLER = {
    datasetChanged: function(dataset, delta){
      if (!this.subtrahend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.inserted && delta.inserted.filter(datasetAbsentFilter, this.subtrahend),
        /* deleted */  delta.deleted  && delta.deleted.filter(this.has, this)
      );
      
      if (newDelta)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      this.setOperands(null, this.subtrahend);
    }
  };

  var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
    datasetChanged: function(dataset, delta){
      if (!this.minuend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.deleted  && delta.deleted.filter(datasetAbsentFilter, this),
        /* deleted */  delta.inserted && delta.inserted.filter(this.has, this)
      );

      if (newDelta)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      this.setOperands(this.minuend, null);
    }
  };

 /**
  * @class
  */
  var Subtract = Class(AbstractDataset, {
    className: namespace + '.Dataset.Subtract',

   /**
    * @type {Basis.Data.AbstractDataset}
    */ 
    minuend: null,

   /**
    * @type {Basis.Data.AbstractDataset}
    */
    subtrahend: null,

   /**
    * @inheritDoc
    */
    listen: {
      minuend: SUBTRACTDATASET_MINUEND_HANDLER,
      subtrahend: SUBTRACTDATASET_SUBTRAHEND_HANDLER
    },

   /**
    * @constructor
    */
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      // init part
      var minuend = this.minuend;
      var subtrahend = this.subtrahend;

      this.minuend = null;
      this.subtrahend = null;

      if (minuend || subtrahend)
        this.setOperands(minuend, subtrahend);
    },

   /**
    * Set new operands.
    * @param {Basis.Data.AbstractDataset} minuend
    * @param {Basis.Data.AbstractDataset} subtrahend
    * @return {Object} Delta if changes happend
    */
    setOperands: function(minuend, subtrahend){
      var delta;

      if (minuend instanceof AbstractDataset == false)
        minuend = null;

      if (subtrahend instanceof AbstractDataset == false)
        subtrahend = null;

      var oldMinuend = this.minuend;
      var oldSubtrahend = this.subtrahend;

      if (oldMinuend !== minuend)
      {
        if (oldMinuend)
          oldMinuend.removeHandler(this.listen.minuend, this);

        if (this.minuend = minuend)
          minuend.addHandler(this.listen.minuend, this)
      }

      if (oldSubtrahend !== subtrahend)
      {
        if (oldSubtrahend)
          oldSubtrahend.removeHandler(this.listen.subtrahend, this);

        if (this.subtrahend = subtrahend)
          subtrahend.addHandler(this.listen.subtrahend, this);
      }

      if (!minuend || !subtrahend)
      {
        if (this.itemCount)
          this.event_datasetChanged(this, delta = {
            deleted: this.getItems()
          });
      }
      else
      {
        var deleted = [];
        var inserted = [];

        for (var key in this.item_)
          if (!minuend.item_[key] || subtrahend.item_[key])
            deleted.push(this.item_[key]);

        for (var key in minuend.item_)
          if (!this.item_[key] && !subtrahend.item_[key])
            inserted.push(minuend.item_[key]);

        if (delta = getDelta(inserted, deleted))
          this.event_datasetChanged(this, delta);
      }

      return delta;
    },

    clear: function(){
      this.setOperands();
    }
  });


  //
  // MapReduce
  //

  var MAPREDUCEDATASET_SOURCEOBJECT_HANDLER = {
    update: function(object){
      var newMember = this.map ? this.map(object) : object; // fetch new member ref
      
      if (newMember instanceof DataObject == false || this.reduce(newMember))
        newMember = null;

      var sourceMap = this.sourceMap_[object.eventObjectId];
      var curMember = sourceMap.member;

      // if member ref is changed
      if (curMember != newMember)
      {
        var memberMap = this.memberMap_;
        var delta;
        var inserted;
        var deleted;

        // update member
        sourceMap.member = newMember;

        // if here is ref for member already
        if (curMember)
        {
          var curMemberId = curMember.eventObjectId;

          // call callback on member ref add
          if (this.removeMemberRef)
            this.removeMemberRef(curMember, object);

          // decrease ref count, and check is this ref for member last
          if (--memberMap[curMemberId] == 0)
          {
            // last ref for member

            // delete from map
            delete memberMap[curMemberId];

            // add to delta
            deleted = [curMember];
          }
        }

        // if new member exists, update map
        if (newMember)
        {
          var newMemberId = newMember.eventObjectId;

          // call callback on member ref add
          if (this.addMemberRef)
            this.addMemberRef(newMember, object);

          if (memberMap[newMemberId])
          {
            // member is already in map -> increase ref count
            memberMap[newMemberId]++;
          }
          else
          {
            // add to map
            memberMap[newMemberId] = 1;

            // add to delta
            inserted = [newMember];
          }
        }

        // fire event, if any delta
        if (delta = getDelta(inserted, deleted))
          this.event_datasetChanged(this, delta);
      }
    }
  };

  var MAPREDUCEDATASET_SOURCE_HANDLER = {
    datasetChanged: function(dataset, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var inserted = [];
      var deleted = [];
      var sourceObject;
      var sourceObjectId;
      var member;

      Dataset.setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          member = this.map ? this.map(sourceObject) : sourceObject;

          if (member instanceof DataObject == false || this.reduce(member))
            member = null;

          sourceObject.addHandler(this.listen.sourceObject, this);
          sourceMap[sourceObject.eventObjectId] = {
            sourceObject: sourceObject,
            member: member
          };

          if (member)
          {
            var memberId = member.eventObjectId;
            if (memberMap[memberId])
            {
              memberMap[memberId]++;
            }
            else
            {
              memberMap[memberId] = 1;
              inserted.push(member);
            }

            if (this.addMemberRef)
              this.addMemberRef(member, sourceObject);
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0; sourceObject = delta.deleted[i]; i++)
        {
          sourceObjectId = sourceObject.eventObjectId;
          member = sourceMap[sourceObjectId].member;

          sourceObject.removeHandler(this.listen.sourceObject, this);
          delete sourceMap[sourceObjectId];

          if (member)
          {
            var memberId = member.eventObjectId;
            if (--memberMap[memberId] == 0)
            {
              delete memberMap[memberId];
              deleted.push(member);
            }

            if (this.removeMemberRef)
              this.removeMemberRef(member, sourceObject);
          }
        }
      }

      Dataset.setAccumulateState(false);

      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    },
    destroy: function(){
      this.setSource();
    }
  };

 /**
  * @class
  */
  var MapReduce = Class(AbstractDataset, {
    className: namespace + '.Dataset.MapReduce',

   /**
    * Data source.
    * @type {Basis.Data.AbstractDataset}
    */
    source: null,

   /**
    * Fires when source property changed.
    * @param {Basis.Data.AbstractDataset} dataset Event initiator.
    * @param {Basis.Data.AbstractDataset} oldSource Previous value for source property.
    * @event
    */
    event_sourceChanged: createEvent('sourceChanged', 'dataset', 'oldSource'),

   /**
    * Map function for source object, to get member object.
    * @type {function(Basis.Data.DataObject):Basis.Data.DataObject}
    * @readonly
    */
    map: $self,

   /**
    * Filter function. It should return false, than result of map function
    * become a member.
    * @type {function(Basis.Data.DataObject):boolean}
    * @readonly
    */
    reduce: $false,

   /**
    * Helper function.
    */
    rule: $false,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(Basis.Data.DataObject)}
    * @readonly
    */
    addMemberRef: null,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(Basis.Data.DataObject)}
    * @readonly
    */
    removeMemberRef: null,

   /**
    * Map of source objects.
    * @type {object}
    * @private
    */
    sourceMap_: null,

   /**
    * @inheritDoc
    */
    listen: {
      sourceObject: MAPREDUCEDATASET_SOURCEOBJECT_HANDLER,
      source: MAPREDUCEDATASET_SOURCE_HANDLER
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      ;;;if (this.sources) throw 'Dataset.MapReduce instances no more support for sources property, use source property instead.';
      ;;;if (this.dataset) throw 'Dataset.MapReduce instances no more support for dataset property, use source property instead.';

      AbstractDataset.prototype.init.call(this, config);

      this.sourceMap_ = {};

      var source = this.source;
      if (source)
      {
        this.source = null;
        this.setSource(source);
      }
    },

   /**
    * Set new filter function.
    * @param {function(Basis.Data.DataObject):boolean} filter
    * @return {Object} Delta of member changes.
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = $true;

      if (this.rule !== rule)
      {
        this.rule = rule;
        return this.applyRule();
      }
    },

   /**
    * Set new transform function and apply new function to source objects.
    * @param {function(Basis.Data.DataObject):Basis.Data.DataObject} transform
    */
    setMap: function(map){
      if (typeof map != 'function')
        map = $self;

      if (this.map !== map)
      {
        this.map = map;
        return this.applyRule();
      }
    },

   /**
    * Set new source dataset.
    * @param {Basis.Data.AbstractDataset} dataset
    */
    setSource: function(source){
      if (source instanceof AbstractDataset == false)
        source = null;

      if (this.source !== source)
      {
        var oldSource = this.source;

        if (oldSource)
        {
          oldSource.removeHandler(this.listen.source, this);
          this.listen.source.datasetChanged.call(this, oldSource, {
            deleted: oldSource.getItems()
          });
        }

        if (this.source = source)
        {
          source.addHandler(this.listen.source, this);
          this.listen.source.datasetChanged.call(this, source, {
            inserted: source.getItems()
          });
        }

        this.event_sourceChanged(this, oldSource);
      }
    },

   /**
    * Apply transform for all source objects and rebuild member set.
    * @return {Object} Delta of member changes.
    */
    applyRule: function(){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var curMember;
      var newMember;
      var curMemberId;
      var newMemberId;
      var sourceObject;
      var sourceObjectInfo;
      var inserted = [];
      var deleted = [];
      var delta;

      for (var sourceObjectId in sourceMap)
      {
        sourceObjectInfo = sourceMap[sourceObjectId];
        sourceObject = sourceObjectInfo.sourceObject;

        curMember = sourceObjectInfo.member;
        newMember = this.map ? this.map(sourceObject) : sourceObject;

        if (newMember instanceof DataObject == false || this.reduce(newMember))
          newMember = null;

        if (curMember != newMember)
        {
          sourceObjectInfo.member = newMember;

          // if here is ref for member already
          if (curMember)
          {
            curMemberId = curMember.eventObjectId;

            // call callback on member ref add
            if (this.removeMemberRef)
              this.removeMemberRef(curMember, sourceObject);

            // decrease ref count
            memberMap[curMemberId]--;
          }

          // if new member exists, update map
          if (newMember)
          {
            newMemberId = newMember.eventObjectId;

            // call callback on member ref add
            if (this.addMemberRef)
              this.addMemberRef(newMember, sourceObject);

            if (newMemberId in memberMap)
            {
              // member is already in map -> increase ref count
              memberMap[newMemberId]++;
            }
            else
            {
              // add to map
              memberMap[newMemberId] = 1;

              // add to delta
              inserted.push(newMember);
            }
          }
        }
      }

      // get deleted delta
      for (var curMemberId in this.item_)
        if (memberMap[curMemberId] == 0)
        {
          delete memberMap[curMemberId];
          deleted.push(this.item_[curMemberId]);
        }

      // if any changes, fire event
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);

      return delta;
    },

   /**
    * Drop dataset. All members are removing as side effect.
    */
    clear: function(){
      this.setSource();
    },

    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sourceMap_ = null;
    }
  });


  //
  // Subset
  //

 /**
  * @class
  */
  var Subset = Class(MapReduce, {
    className: namespace + '.Dataset.Subset',

   /**
    * @inheritDoc
    */
    reduce: function(object){
      return !this.rule(object);
    },

   /**
    * @inheritDoc
    */
    rule: $true
  });


  //
  // Split
  //

 /**
  * @class
  */
  var Split = Class(MapReduce, {
    className: namespace + '.Dataset.Split',

   /**
    * @inheritDoc
    */
    map: function(object){
      return this.keyMap.resolve(object);
    },

   /**
    * @type {function(data):key}
    */
    rule: $true,

   /**
    * @type {Basis.Data.AbstractDataset}
    */
    subsetClass: AbstractDataset,

   /**
    * @type {Basis.Data.KeyObjectMap}
    */
    keyMap: null,

   /**
    * @inheritDoc
    */
    addMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { inserted: [sourceObject] });
    },

   /**
    * @inheritDoc
    */
    removeMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { deleted: [sourceObject] });
    },

   /**
    * @config {function} filter Group function.
    * @config {class} groupClass Class for group instances. Should be instance of AbstractDataset.
    * @config {boolean} destroyEmpty Destroy empty groups automaticaly or not.
    * @constructor
    */ 
    init: function(config){
      //this.groupMap_ = {};

      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(Object.extend({
          keyGetter: this.rule,
          itemClass: this.subsetClass
        }, this.keyMap));

      // inherit
      MapReduce.prototype.init.call(this, config);
    },

    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

    destroy: function(){
      // inherit
      MapReduce.prototype.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });

  //
  // export names
  //

  Object.extend(Dataset, {
    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // transform dataset
    MapReduce: MapReduce,
    Subset: Subset,
    Split: Split
  });

  //
  // export names
  //

  Basis.namespace(namespace).extend({
   /**
    * @enum {string}
    */
    STATE: {
      UNDEFINED: STATE_UNDEFINED,
      READY: STATE_READY,
      PROCESSING: STATE_PROCESSING,
      ERROR: STATE_ERROR,
      DEPRECATED: STATE_DEPRECATED
    },

    Subscription: Subscription,

    // classes
    Object: DataObject,
    DataObject: DataObject,

    KeyObjectMap: KeyObjectMap,

    AbstractDataset: AbstractDataset,
    Dataset: Dataset,

    // deprecate
    AggregateDataset: Merge,
    Collection: Subset,
    Grouping: Split
  });

  // new naming

  Basis.namespace('basis.data').extend({
   /**
    * @enum {string}
    */
    STATE: {
      UNDEFINED: STATE_UNDEFINED,
      READY: STATE_READY,
      PROCESSING: STATE_PROCESSING,
      ERROR: STATE_ERROR,
      DEPRECATED: STATE_DEPRECATED
    },

    Subscription: Subscription,

    // classes
    Object: DataObject,

    KeyObjectMap: KeyObjectMap,

    AbstractDataset: AbstractDataset,
    Dataset: Dataset
  });

  Basis.namespace('basis.data.dataset').extend({
    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // transform dataset
    MapReduce: MapReduce,
    Subset: Subset,
    Split: Split
  });

})();