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

'use strict';

(function(){

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Const:
  *   {Basis.Data.STATE}, {Basis.Data.Subscription}
  * - Classes:
  *   {Basis.Data.DataObject}, {Basis.Data.AbstractDataset}, {Basis.Data.Dataset},
  *   {Basis.Data.AggregateDataset}, {Basis.Data.Collection}, {Basis.Data.Grouping}
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
  var getter = Function.getter;
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
                object.subscribers_[subscriberId] = thisObject;
                object.subscriberCount += 1;
                object.event_subscribersChanged();
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
                delete object.subscribers_[subscriberId];
                object.subscriberCount -= 1;
                object.event_subscribersChanged();
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
  // DataObject
  //

 /**
  * @const
  */
  var DATAOBJECT_DELEGATE_HANDLER = {
    update: function(object, delta){ 
      this.event_update(object, delta);
    },
    rollbackUpdate: function(object, delta){
      this.event_rollbackUpdate(object, delta);
    },
    stateChanged: function(object, oldState){
      this.state = object.state;
      this.event_stateChanged(object, oldState);
    },
    /*delegateChanged: function(object, oldDelegate){
      this.info = object.info;
      this.event_rootChanged(object, oldDelegate);
    },*/
    rootChanged: function(object, oldRoot){
      this.info = object.info;
      this.root = object.root;
      this.event_rootChanged(object, oldRoot);
      if (this.targetPoint && this.target !== this.root)
        this.target = this.root;
    },
    targetChanged: function(object, oldTarget){
      if (this.target != object.target)
      {
        this.target = object.target;
        this.event_targetChanged(object, oldTarget);
      }
    },
    destroy: function(){
      if (this.cascadeDestroy)
        this.destroy();
      else
        this.setDelegate();
    }
  };

  //
  // Registrate subscription type
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
    info: null,

   /**
    * @type {boolean}
    */
    canHaveDelegate: true,

   /**
    * Object that manage info updates if assigned.
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
    * Flag to determine is this object for target connection or not. This property
    * is readonly and can't be changed after init.
    * @type {boolean}
    * @readobly
    */
    targetPoint: false,

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
    * related objects (delegate, collection).
    * @type {Basis.Data.Subscription|number}
    */
    subscribeTo: Subscription.DELEGATE,

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

    //
    // events 
    //

   /**
    * Fires on info changes.
    * @param {Basis.Data.DataObject} object Object which info property
    * was changed. Usually it is root of delegate chain.
    * @param {object} delta Delta of changes. Keys in delta are property
    * names that was changed, and values is previous value of property
    * (value of property before changes).
    * @event
    */
    event_update: createEvent('update', 'object', 'delta'),

   /**
    * When info changing with rollback, modify property might be changed.
    * In this case rollbackUpdate event fires.
    * @param {Basis.Data.DataObject} object Object which modify property
    * was changed.
    * @param {object} delta Delta of changes. Keys in delta are property
    * names that was changed, and values is previous value of property
    * (value of property before changes).
    * @event
    */
    event_rollbackUpdate: createEvent('rollbackUpdate', 'object', 'modifyDelta'),

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
    * Fires when root property was changed.
    * @param {Basis.Data.DataObject} object Object which root property was changed.
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
    event_targetChanged: createEvent('targetChanged', 'object', 'oldTarget'),

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
    event_activeChanged: createEvent('activeChanged'),

   /**
    * @param {Object=} config The configuration of object.
    * @constructor
    */
    init: function(config){
      // inherit
      EventObject.prototype.init.call(this, config);

      // info/delegate
      var delegate = this.delegate;

      if (delegate)
      {
        // assign a delegate
        // NOTE: ignore for this.info & this.state, no update/stateChanged events fired
        this.delegate = null;
        this.info = delegate.info;
        this.state = delegate.state;
        this.setDelegate(delegate);
      }
      else
      {
        this.root = this;
        // if info doesn't exists - init it
        if (!this.info)
          this.info = {};
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
      return this.root;
      /*var object = this;

      while (object.delegate && object.delegate !== object)
        object = object.delegate;

      return object;*/
    },

   /**
    * Set new delegate object or reject it (if passed null).
    * @example
    *   var a = new Basis.Data.DataObject();
    *   var b = new Basis.Data.DataObject();
    *
    *   a.setDelegate(b);
    *   a.update({ prop: 123 });
    *   alert(a.info.prop); // shows 123
    *   alert(b.info.prop); // shows 123
    *   alert(a.info.prop === b.info.prop); // shows true
    *
    *   b.update({ prop: 456 });
    *   alert(a.info.prop); // shows 456
    *   alert(b.info.prop); // shows 456
    *   alert(a.info.prop === b.info.prop); // shows true
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
        var oldDelegate = this.delegate;
        var oldTarget = this.target;
        var oldRoot = this.root;
        var oldState = this.state;
        var oldInfo = this.info;
        var delta = {};

        // remove handler from oldDelegate if present
        if (oldDelegate)
          oldDelegate.removeHandler(DATAOBJECT_DELEGATE_HANDLER, this);

        if (newDelegate)
        {
          // assing new delegate
          this.delegate = newDelegate;
          this.target = newDelegate.target || (this.targetPoint ? newDelegate : null);
          this.root = newDelegate.root;
          this.info = newDelegate.info;
          this.state = newDelegate.state;

          // add handler to new delegate
          newDelegate.addHandler(DATAOBJECT_DELEGATE_HANDLER, this);

          // calculate delta as difference between current info and delegate info
          for (var key in newDelegate.info)
            if (key in oldInfo === false)
              delta[key] = undefined;

          for (var key in oldInfo)
            if (oldInfo[key] !== newDelegate.info[key])
              delta[key] = oldInfo[key];
        }
        else
        {
          // reset delegate and info
          this.delegate = null;
          this.target = null;
          this.root = this;
          this.info = {};

          // copy info, no update, no delta
          for (var key in oldInfo)
            this.info[key] = oldInfo[key];
        }

        // fire event if delegate changed
        this.event_delegateChanged(this, oldDelegate);

        // fire event if root delegate changed
        if (this.root !== oldRoot)
          this.event_rootChanged(this, oldRoot);

        // fire event if target changed
        if (this.target !== oldTarget)
          this.event_targetChanged(this, oldTarget);

        // update & stateChanged can be fired only if new delegate was assigned;
        // otherwise (delegate drop) do nothing -> performance benefits
        if (newDelegate)
        {
          // fire update event if any key in delta (info changed)
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
      // set new state for root
      if (this.root != this)
        return this.root.setState(state, data);

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
    * @param {Object} data New values for object data holder (this.info).
    * @return {Object|boolean} Delta if object data (this.info) was updated or false otherwise.
    */
    update: function(data){
      if (this.root !== this)
        return this.root.update(data);

      if (data)
      {
        var delta = {};
        var updateCount = 0;

        for (var prop in data)
        {
          if (this.info[prop] !== data[prop])
          {
            updateCount++;
            delta[prop] = this.info[prop];
            this.info[prop] = data[prop];
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
        this.event_activeChanged();

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
      {
        this.delegate.removeHandler(DATAOBJECT_DELEGATE_HANDLER, this);
        this.delegate = null;
      }

      // inherit
      EventObject.prototype.destroy.call(this);

      // drop info & state
      this.root = null;
      this.target = null;
      this.info = NULL_OBJECT;
      this.state = STATE_UNDEFINED;
    }
  });

  //
  // Mapper
  //

 /**
  * @class
  */
  var KeyObjectMap = Class(null, {
    className: namespace + '.KeyObjectMap',

    itemClass: DataObject,
    keyGetter: Function.$self,
    map_: null,

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
        itemConfig.info = {
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
      for (var i = items.length; i --> 0;)
        items[0].destroy();
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

    canHaveDelegate: false,
    state: STATE_UNDEFINED,

    itemCount: 0,
    memberMap_: null,
    item_: null,

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

  var DATASET_ITEM_HANDLER = {
    destroy: function(object){
      if (this.memberMap_[object.eventObjectId])
        this.remove([object]);
    }
  };

 /**
  * @class
  */
  var Dataset = Class(AbstractDataset, {
    className: namespace + '.Dataset',

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
            object.addHandler(DATASET_ITEM_HANDLER, this);

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
            object.removeHandler(DATASET_ITEM_HANDLER, this);
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
            object.addHandler(DATASET_ITEM_HANDLER, this);

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

          object.removeHandler(DATASET_ITEM_HANDLER, this);
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
          deleted[i].removeHandler(DATASET_ITEM_HANDLER, this);

        this.event_datasetChanged(this, delta = {
          deleted: deleted
        });
         
        this.memberMap_ = {};
      }

      return delta;
    }
  });

  //
  // accumulate dataset changes
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
  // Registrate subscription type
  //

  Subscription.regType(
    'SOURCE',
    {
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
      for (var i = object.sources.length; i --> 0;)
        action(object, object.sources[i]);
    }
  );

  //
  // Aggregate dataset 
  //

  var AGGREGATEDATASET_ITEM_HANDLER = {
    update: function(object){
      // update make sence only if transform function here
      if (!this.transform)
        return;

      var memberMap = this.memberMap_;
      var sourceMap = this.sourceMap_[object.eventObjectId];
      var curMember = sourceMap.member;
      var curMemberId;
      var newMember = this.transform(object); // fetch new member ref
      var newMemberId;
      var delta = {};
      var inserted;
      var deleted;
      
      if (newMember instanceof this.memberClass == false)
        newMember = null;

      // if member ref is changed
      if (curMember != newMember)
      {
        sourceMap.member = newMember;

        // if here is ref for member already
        if (curMember)
        {
          curMemberId = curMember.eventObjectId;

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
          newMemberId = newMember.eventObjectId;

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

  var AGGREGATEDATASET_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceId = source.eventObjectId;
      var inserted = [];
      var deleted = [];
      var memberMap = this.memberMap_;
      var sourceMap = this.sourceMap_;
      var transform = this.transform;

      var sourceObject;
      var sourceObjectId;
      var memberClass = this.memberClass;
      var member;
      var memberId;

      Dataset.setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          sourceObjectId = sourceObject.eventObjectId;
          
          // check: is this object already known
          if (sourceMap[sourceObjectId])
          {
            // item exists -> increase source links count
            sourceMap[sourceObjectId].count++;
          }
          else
          {
            // new source item
            sourceObject.addHandler(AGGREGATEDATASET_ITEM_HANDLER, this);

            // get member item from source object
            if (transform)
            {
              // if transform function present, get member item using it
              member = transform.call(this, sourceObject);

              // if transformed object is not a DataObject instance, thread it as null
              if (member instanceof memberClass == false)
                member = null;
            }
            else
            {
              // if no transform function, member item is source item
              member = sourceObject;
            }

            // call callback on member ref add
            if (member && this.addMemberRef)
              this.addMemberRef(member, sourceObject);

            // registrate in source map
            sourceMap[sourceObjectId] = {
              count: 1,
              sourceObject: sourceObject,  // ref for source object (do we need for this?)
              member: member               // ref for member object if exists
            };

            // if member item exists -> registrate it in map
            if (member)
            {
              // item is fit requirements to be in set
              memberId = member.eventObjectId;

              // check: is member item already known
              if (memberMap[memberId])
              {
                // member item has already registrate -> increase ref count
                memberMap[memberId]++;
              }
              else
              {
                // registrate new member in map
                memberMap[memberId] = 1;

                // add to delta
                inserted.push(member);
              }
            }
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0; sourceObject = delta.deleted[i]; i++)
        {
          sourceObjectId = sourceObject.eventObjectId;

          // descrease source counter and check is this occurence last
          if (--sourceMap[sourceObjectId].count == 0)
          {
            // remove handler
            sourceObject.removeHandler(AGGREGATEDATASET_ITEM_HANDLER, this);

            // fetch member ref
            member = sourceMap[sourceObjectId].member;

            // if member exists, remove ref from it
            if (member)
            {
              memberId = member.eventObjectId;

              // call callback on member ref remove
              if (this.removeMemberRef)
                this.removeMemberRef(member, sourceObject);

              if (--memberMap[memberId] == 0)
              {
                // delete from map
                delete memberMap[memberId];

                // add to delta
                deleted.push(member);
              }
            }

            // delete from source refs
            delete sourceMap[sourceObjectId];
          }
        }
      }

      Dataset.setAccumulateState(false);

      // if any delta -> fire event 
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };

 /**
  * @class
  */
  var AggregateDataset = Class(AbstractDataset, {
    className: namespace + '.AggregateDataset',

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
    * Allowed member class.
    */
    memberClass: DataObject,

   /**
    * Map of source objects.
    * @type {object}
    * @private
    */
    sourceMap_: null,

   /**
    * Transformation function.
    * @type {function(Basis.Data.DataObject):Basis.Data.DataObject}
    * @readonly
    */
    transform: null,

   /**
    * @type {function(Basis.Data.DataObject)}
    */
    addMemberRef: null,

   /**
    * @type {function(Basis.Data.DataObject)}
    */
    removeMemberRef: null,

   /**
    * @config {Array.<Basis.Data.AbstractDataset>} sources Set of source datasets for aggregate.
    * @constructor
    */
    init: function(config){
      var sources = this.sources;

      this.sources = [];
      this.sourceMap_ = {};

      // inherit
      AbstractDataset.prototype.init.call(this, config);

      if (sources)
        sources.forEach(this.addSource, this);
    },

   /**
    * Set new transform function and apply new function to source objects.
    * @param {function(object):object} transform
    */
    setTransform: function(transform){
      var delta;

      if (this.transform !== transform)
      {
        this.transform = transform;

        delta = this.updateDataset();
      }

      return delta;
    },

    updateDataset: function(){
      var memberClass = this.memberClass;
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
        newMember = this.transform ? this.transform(sourceObject) : sourceObject;

        if (newMember instanceof memberClass == false)
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
    * @param {Basis.Data.AbstractDataset} source
    */
    addSource: function(source){
      if (source instanceof AbstractDataset)
      {
        if (this.sources.add(source))
        {
          // add event listeners to source
          source.addHandler(AGGREGATEDATASET_DATASET_HANDLER, this);

          // add source members to source map
          AGGREGATEDATASET_DATASET_HANDLER.datasetChanged.call(this, source, {
            inserted: source.getItems()
          });

          // fire sources changed event
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
    * @param {Basis.Data.AbstractDataset} source
    */
    removeSource: function(source){
      if (this.sources.remove(source))
      {
        source.removeHandler(AGGREGATEDATASET_DATASET_HANDLER, this);
        AGGREGATEDATASET_DATASET_HANDLER.datasetChanged.call(this, source, {
          deleted: source.getItems()
        });

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
    * TODO: optimize, reduce event count
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
    * Remove all sources. All items are removing as side effect.
    */
    clear: function(){
      Array.from(this.sources).forEach(this.removeSource, this);
    },

    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sources = null;
      this.sourceMap_ = null;
    }
  });


  //
  // Collection
  //

 /**
  * @class
  */
  var Collection = Class(AggregateDataset, {
    className: namespace + '.Collection',

    transform: function(object){
      return this.filter(object) ? object : null;
    },

    filter: $true,

   /**
    * Set new filter function.
    * @param {function(item):boolean} filter
    */
    setFilter: function(filter){
      var delta;
      filter = filter || $true;

      if (!filter)
        filter = $true;

      if (this.filter != filter)
      {
        this.filter = filter;
        delta = this.updateDataset();
      }

      return delta;
    }
  });

  //
  // Grouping
  //

 /**
  * @class
  */
  var Grouping = Class(AggregateDataset, {
    className: namespace + '.Grouping',

    groupGetter: $true,
    groupClass: AbstractDataset,

    //destroyEmpty: true,

    //groupMap_: null,

    transform: function(sourceObject){
      return this.mapper.resolve(sourceObject);//this.getGroup(this.groupGetter(sourceObject), true);
    },
    addMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { inserted: [sourceObject] });
    },
    removeMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { deleted: [sourceObject] });
    },

    //if (group.itemCount && (typeof group.destroyEmpty == 'undefined' ? group.destroyEmpty : this.destroyEmpty))

   /**
    * @config {function} filter Group function.
    * @config {class} groupClass Class for group instances. Should be instance of AbstractDataset.
    * @config {boolean} destroyEmpty Destroy empty groups automaticaly or not.
    * @constructor
    */ 
    init: function(config){
      //this.groupMap_ = {};
      this.mapper = new KeyObjectMap({
        keyGetter: this.groupGetter,
        itemClass: this.groupClass
      });

      // inherit
      AggregateDataset.prototype.init.call(this, config);
    },

    getGroup: function(data, autocreate){
      return this.mapper.get(data, autocreate);
    },

    destroy: function(){
      // inherit
      AggregateDataset.prototype.destroy.call(this);

      //this.groupMap_ = null;
      this.mapper.destroy();
    }
  });

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    // const
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
    AggregateDataset: AggregateDataset,
    Collection: Collection,
    Grouping: Grouping
  });

})();