/**!
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
  *   {Basis.Data.AggregateDataset}, {Basis.Data.IndexedDataset}, {Basis.Data.Collection},
  *   {Basis.Data.Grouping}
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
    add: function(name, handler, action){
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

  var NULL_INFO = {};

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

  Subscription.add(
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

   /*
    * events 
    */
    event_update: createEvent('update'),
    event_rollbackUpdate: createEvent('rollbackUpdate'),
    event_stateChanged: createEvent('stateChanged'),
    event_delegateChanged: createEvent('delegateChanged'),
    event_rootChanged: createEvent('rootChanged'),
    event_targetChanged: createEvent('targetChanged'),
    event_subscribersChanged: createEvent('subscribersChanged'),
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
          this.target = newDelegate.target || (this.targetPoint && newDelegate);
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
    * @return {boolean} Returns true if {Basis.Data.DataObject#subscriptionType} was changed.
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
        this.target = null;
        this.root = null;
      }

      // inherit
      EventObject.prototype.destroy.call(this);

      // drop info & state
      this.info = NULL_INFO;
      this.state = STATE_UNDEFINED;
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

    map_: null,
    item_: null,
    eventCache_: null,

    cache_: null,

    event_datasetChanged: createEvent('datasetChanged') && function(dataset, delta){
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

      this.map_ = {};
      this.item_ = {};

      this.eventCache_ = {
        mode: false,
        delta: []
      };
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
    * Returns first any N items if exists.
    * @param {number} count Max length of resulting array.
    * @return {Array.<Basis.Data.DataObject>} 
    */
    top: function(count){
      var result = [];

      for (var objectId in this.item_)
        result.push(this.item_[objectId]);

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
    */
    clear: function(){
    },

   /**
    * @inheritDocs
    */
    dispatch: function(event, dataset, delta){
      if (event == 'datasetChanged')
      {
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
        delete this.cache_;
      }

      // inherit
      DataObject.prototype.dispatch.apply(this, arguments);
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.clear();

      // inherit
      DataObject.prototype.destroy.call(this);

      this.cache_ = [];
      this.itemCount = 0;

      delete this.map_;
      delete this.item_;
      delete this.eventCache_;
    }
  });

  //
  // Dataset
  //

  var DATASET_ITEM_HANDLER = {
    destroy: function(object){
      if (this.map_[object.eventObjectId])
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
        delete this.items;
        this.set(items);
      }
    },

    add: function(data){
      var delta;
      var inserted = [];

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (!this.map_[objectId])
          {
            this.map_[objectId] = object;
            inserted.push(object);

            object.addHandler(DATASET_ITEM_HANDLER, this);
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
      var deleted = [];

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (this.map_[objectId])
          {
            delete this.map_[objectId];
            deleted.push(object);

            object.removeHandler(DATASET_ITEM_HANDLER, this);
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
      var map_ = {};
      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
          map_[object.eventObjectId] = object;
      }

      // delete data
      var deleted = [];
      for (var objectId in this.map_)
      {
        if (map_[objectId])
        {
          delete map_[objectId];
        }
        else
        {
          var object = this.map_[objectId];

          delete this.map_[objectId];
          deleted.push(object);

          object.removeHandler(DATASET_ITEM_HANDLER, this);
        }
      }
      
      // insert data
      var inserted = [];
      for (var objectId in map_)
      {
        var object = map_[objectId];
        
        this.map_[objectId] = object;
        inserted.push(object);

        object.addHandler(DATASET_ITEM_HANDLER, this);
      }

      // trace changes
      var delta;
      if (delta = getDelta(inserted, deleted))
      {
        this.event_datasetChanged(this, delta);
      }

      return delta;
    },

    sync: function(data, set){
      if (!data)
        return;

      Dataset.setAccumulateState(true);

      var res = [];
      var map_ = {};
      var inserted = [];
      var deleted = [];

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;

          map_[objectId] = object;
          if (!this.map_[objectId])
            inserted.push(object);
        }
      }

      for (var objectId in this.item_)
      {
        if (!map_[objectId])
        {
          var object = this.item_[objectId];
          /*deleted.push(object);*/

          object.destroy();
        }
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
        for (var i = 0, object; object = deleted[i]; i++)
          object.removeHandler(DATASET_ITEM_HANDLER, this);

        this.event_datasetChanged(this, delta = {
          deleted: deleted
        });
      }

      this.map_ = {};

      return delta;
    }

  });

  //
  // accumulate dataset changes
  //
  (function(){
    var awatingDatasetCache = {};
    var proto = AbstractDataset.prototype;
    var realDispatch_ = AbstractDataset.prototype.event_datasetChanged;
    var setStateCount = 0;
    var urgentTimer;

    function flushDataset(dataset){
      var cache = dataset.eventCache_;
      if (cache.mode)
      {
        var delta = {};
        delta[cache.mode] = cache.delta;

        delete awatingDatasetCache[dataset.eventObjectId];
        cache.mode = false;
        cache.delta = [];

        realDispatch_.call(dataset, dataset, delta);
      }
    }

    function flushAllDataset(){
      values(awatingDatasetCache).forEach(flushDataset);
    }

    function storeDatasetDelta(dataset, delta){
      var cache = dataset.eventCache_;
      var isInsert = !!delta.inserted;
      var isDelete = !!delta.deleted;

      if (isInsert && isDelete)
      {
        flushDataset(dataset);
        realDispatch_.call(dataset, dataset, delta);
        return;
      }

      var mode = isInsert ? 'inserted' : 'deleted';
      if (cache.mode && cache.mode != mode)
        flushDataset(dataset);

      cache.mode = mode;
      cache.delta.push.apply(cache.delta, delta[mode]);
      awatingDatasetCache[dataset.eventObjectId] = dataset;
    }

    function urgentFlush(){
      ;;;if (typeof console != 'undefined') console.warn('(debug) Urgent flush dataset changes');
      setStateCount = 0;
      AbstractDataset.prototype.event_datasetChanged = realDispatch_;
      flushAllDataset();      
    }

    function patchedDispatch(dataset, delta){
      storeDatasetDelta(dataset, delta);
    }

    Dataset.setAccumulateState = function(state){
      //if (state !== 'xxx') return;
      if (state)
      {
        if (setStateCount == 0)
        {
          AbstractDataset.prototype.event_datasetChanged = patchedDispatch;
          urgentTimer = setTimeout(urgentFlush, 0);
        }
        setStateCount++;
      }
      else
      {
        if (setStateCount == 1)
        {
          clearTimeout(urgentTimer);
          AbstractDataset.prototype.event_datasetChanged = realDispatch_;
          flushAllDataset();
        }

        setStateCount -= setStateCount > 0;
      }
    }
  })();

  //
  // Dataset aggregate
  //

 /**
  * @class
  */

  var AGGREGATEDATASET_ITEM_HANDLER = {
    update: function(object){
      var map_ = this.map_;
      var config = this.source_[object.eventObjectId];
      var curRef = config.item;
      var newRef = this.transform ? this.transform(object) : object;

      if (newRef instanceof DataObject == false)
        newRef = null;

      if (curRef != newRef)
      {
        config.item = newRef;

        var delta = {};

        // remove 
        if (curRef)
        {
          if (--map_[curRef.eventObjectId] == 0)
          {
            // delete from map
            delete this.map_[curRef.eventObjectId];
            delta.deleted = [curRef];
          }
        }

        if (newRef)
        {
          if (map_[newRef.eventObjectId])
          {
            map_[newRef.eventObjectId]++;
          }
          else
          {
            // insert to map
            map_[newRef.eventObjectId] = 1;
            delta.inserted = [newRef];
          }
        }

        this.event_datasetChanged(this, delta);
      }
    }
  };

  var AGGREGATEDATASET_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceId = source.eventObjectId;
      var inserted = [];
      var deleted = [];
      var object;
      var objectId;
      var item;
      var itemId;
      var map_ = this.map_;
      var source_ = this.source_;

      if (delta.inserted)
      {
        for (var i = 0, object; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
          
          if (source_[objectId])
          {
            // item exists
            source_[objectId].count++;
          }
          else
          {
            // new source item
            object.addHandler(AGGREGATEDATASET_ITEM_HANDLER, this);

            // get item from source object
            item = this.transform ? this.transform(object) : object;
            if (item instanceof DataObject == false)
            {
              item = null;
            }

            // reg in source map
            source_[objectId] = {
              count: 1,
              object: object,
              item: item
            };

            if (item)
            {
              // item is fit requirements to be in set
              itemId = item.eventObjectId;

              if (map_[itemId])
              {
                map_[itemId]++;
              }
              else
              {
                // new member, add to delta
                map_[itemId] = 1;
                inserted.push(item);
              }
            }
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, object; object = delta.deleted[i]; i++)
        {
          objectId = object.eventObjectId;

          if (--source_[objectId].count == 0)
          {
            // new source item
            object.removeHandler(AGGREGATEDATASET_ITEM_HANDLER, this);

            item = source_[objectId].item;
            if (item)
            {
              itemId = item.eventObjectId;
              if (--map_[itemId] == 0)
              {
                delete map_[itemId];
                deleted.push(item);
              }
            }

            delete source_[objectId];
          }
        }
      }

      if (delta = getDelta(inserted, deleted))
      {
        this.event_datasetChanged(this, delta);
      }
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };

  //
  // Registrate subscription type
  //

  Subscription.add(
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

 /**
  * @class
  */
  var AggregateDataset = Class(AbstractDataset, {
    className: namespace + '.AggregateDataset',

    subscriptionType: Subscription.SOURCE,
    sources: null,

    event_sourcesChanged: createEvent('sourcesChanged'),

   /**
    * @config {Array.<Basis.Data.AbstractDataset>} sources Set of source datasets for aggregate.
    * @constructor
    */
    init: function(config){
      this.map_ = {};
      this.source_ = {};

      // inherit
      AbstractDataset.prototype.init.call(this, config);

      var sources = this.sources;
      this.sources = [];

      if (Array.isArray(sources))
        sources.forEach(this.addSource, this);
    },

   /**
    * @param {Basis.Data.AbstractDataset} source
    */
    addSource: function(source){
      if (source instanceof AbstractDataset)
      {
        if (this.sources.add(source))
        {
          var handler = this.constructor.sourceHandler;

          source.addHandler(handler, this);
          handler.datasetChanged.call(this, source, {
            inserted: source.getItems()
          });

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
        var handler = this.constructor.sourceHandler;

        source.removeHandler(handler, this);
        handler.datasetChanged.call(this, source, {
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
    clear: function(){
      Array.from(this.sources).forEach(this.removeSource, this);
    },

    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sources = null;
    }
  });

  AggregateDataset.sourceHandler = AGGREGATEDATASET_DATASET_HANDLER;


  //
  // IndexedDataset
  //

  function binarySearchPos(array, map, left, right){ 
    if (!array.length)  // empty array check
      return 0;

    var pos;
    var value;
    var cmpValue;
    var l = isNaN(left) ? 0 : left;
    var r = isNaN(right) ? array.length - 1 : right;

    do 
    {
      pos = (l + r) >> 1;

      cmpValue = array[pos].value || 0;
      if (cmpValue === value)
      {
        cmpValue = array[pos].object.eventObjectId;
        value = map.object.eventObjectId;
      }
      else
        value = map.value || 0;

      if (value < cmpValue)
        r = pos - 1;
      else 
        if (value > cmpValue)
          l = pos + 1;
        else
          return value == cmpValue ? pos : 0;  
    }
    while (l <= r);

    return pos + (cmpValue < value);
  }

  var INDEXEDDATASET_ITEM_HANDLER = {
    update: function(object){
      var map_ = this.map_[object.eventObjectId];
      var newValue = this.index(object);
      var index = this.index_;

      if (map_.value != newValue)
      {
        // search for current position in index
        var curPos = binarySearchPos(index, map_);

        // set for new value
        map_.value = newValue;

        // checking the need for changes
        var left = index[curPos - 1];
        var right = index[curPos + 1];

        if (
            (!left || left.value <= newValue)
            &&
            (!right || newValue <= right.value)
           )
        {
          //console.log('index: ', index.map(Function.getter('object.info.value')));
          return;
        }

        // remove from index
        index.splice(curPos, 1);

        // search for new position in index
        var newPos = binarySearchPos(index, map_);

        // insert into index on new position
        index.splice(newPos, 0, map_);

        //console.log('index: ', index.map(Function.getter('object.info.value')));

        // calculate delta
        if (index.length > this.offset)
        {
          var rangeEnd = this.offset + this.limit;
          var curPosZone = (curPos > this.offset) + (curPos > rangeEnd);
          var newPosZone = (newPos > this.offset) + (newPos > rangeEnd);

          if (newPosZone == curPosZone)
            return;

          var deleted;
          var inserted;
          var delta = {};
          switch (newPosZone){
            case 0:
              inserted = index[this.offset];
              deleted = curPosZone == 1 ? map_ : index[rangeEnd];
            break;
            case 1:
              inserted = map_;
              deleted = curPosZone == 0 ? index[this.offset - 1] : index[rangeEnd];
            break;
            case 2:
              inserted = index[rangeEnd - 1];
              deleted = curPosZone == 1 ? map_ : index[this.offset - 1];
            break;
          }

          if (inserted)
            delta.inserted = [inserted.object];

          if (deleted)
            delta.deleted = [deleted.object];

          this.event_datasetChanged(this, delta);
        }
      }
    }
  };

  var INDEXEDDATASET_DATASET_HANDLER = {
    datasetChanged: function(source, delta){

      function updateDelta(map_, target, lookup){
        if (map_)
        {
          var object = map_.object;
          var id = object.eventObjectId;
          if (lookup[id])
            delete lookup[id];
          else
            target[id] = object;
        }
      }

      var sourceId = source.eventObjectId;
      var inserted = {};
      var deleted = {};
      var object;
      var objectId;
      var map_;
      var index = this.index_;

      if (delta.inserted)
      {
        for (var i = 0, object; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
          map_ = this.map_[objectId];

          if (!map_)
          {
            map_ = this.map_[objectId] = {
              object: object,
              count: 0,
              value: this.index(object)
            };

            object.addHandler(INDEXEDDATASET_ITEM_HANDLER, this);

            // rebuild index
            var pos = binarySearchPos(index, map_);//this.index_.binarySearchPos(map_.value, 'value');

            this.index_.splice(pos, 0, map_);
            if (index.length > this.offset && pos < this.offset + this.limit)
            {
              updateDelta(index[this.offset + this.limit], deleted, inserted);
              updateDelta(pos < this.offset ? index[this.offset] : map_, inserted, deleted);
            }
          }

          if (!map_[sourceId])
          {
            map_[sourceId] = source;
            map_.count++;
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, object; object = delta.deleted[i]; i++)
        {
          objectId = object.eventObjectId;
          map_ = this.map_[objectId];

          if (map_ && map_[sourceId])
          {
            delete map_[sourceId];
            if (map_.count-- == 1)
            {
              map_.object.removeHandler(INDEXEDDATASET_ITEM_HANDLER, this);

              var pos = binarySearchPos(index, map_); //this.index_.binarySearchPos(map_.value, 'value');
              
              if (index.length > this.offset && pos < this.offset + this.limit)
              {
                updateDelta(index[this.offset + this.limit], inserted, deleted);
                updateDelta(pos < this.offset ? index[this.offset] : map_, deleted, inserted);
              }
              
              index.splice(pos, 1);

              delete this.map_[objectId];
            }
          }
        }
      }

      inserted = values(inserted);
      deleted = values(deleted);

      if (delta = getDelta(inserted, deleted))
      {
        this.event_datasetChanged(this, delta);
      }
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };

  function normalizeNumber(num, min){
    num = parseInt(num) || 0;
    return num > min ? num : min;
  }

 /**
  * @class
  */
  var IndexedDataset = Class(AggregateDataset, {
    className: namespace + '.IndexedDataset',

   /**
    * Ordering items function.
    * @type {function}
    * @readonly
    */
    index: $true,

   /**
    * Start of range.
    * @type {number}
    * @readonly
    */
    offset: 0,

   /**
    * Length of range.
    * @type {number}
    * @readonly
    */
    limit: 10,

   /**
    * @config {function} index Function for index value calculation; values are ordering according to this values.
    * @config {number} offset Initial value of range start.
    * @config {number} limit Initial value of range length.
    * @constructor
    */
    init: function(config){
      this.index_ = [];

      if (config)
      {
        if (config.index)
          this.index = getter(config.index);
        if ('offset' in config)
          this.offset = normalizeNumber(config.offset, 0);
        if ('limit' in config)
          this.limit = normalizeNumber(config.limit, 1);
      }

      // inherit
      AggregateDataset.prototype.init.call(this, config);
    },

   /**
    * Set new range for dataset.
    * @param {number} offset Start of range.
    * @param {number} limit Length of range.
    */
    setRange: function(offset, limit){
      var inserted = [];
      var item_ = Object.slice(this.item_);

      this.offset = offset = normalizeNumber(offset, 0);
      this.limit = limit = normalizeNumber(limit, 1);

      var ar = this.index_.slice(offset, offset + limit);

      for (var i = 0, object; object = ar[i]; i++)
      {
        var objectId = object.object.eventObjectId;
        if (item_[objectId])
          delete item_[objectId];
        else
          inserted.push(object.object);
      }

      var delta;
      if (delta = getDelta(inserted, values(item_)))
      {
        this.event_datasetChanged(this, delta);
      }
    }
  });

  IndexedDataset.sourceHandler = INDEXEDDATASET_DATASET_HANDLER;

  //
  // Collection
  //

/*    var COLLECTION_ITEM_HANDLER = {
    update: function(object){
      var map_ = this.map_[object.eventObjectId];
      var newState = !!this.filter(object);

      if (map_.state != newState)
      {
        map_.state = newState;

        this.event_datasetChanged(this,
          newState
            ? { inserted: [object] }
            : { deleted: [object] }
        );
      }
    }
  };
  
  var COLLECTION_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceId = source.eventObjectId;
      var inserted = [];
      var deleted = [];
      var object;
      var objectId;
      var map_;

      if (delta.inserted)
      {
        for (var i = 0, object; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
          map_ = this.map_[objectId];

          if (!map_)
          {
            map_ = this.map_[objectId] = {
              object: object,
              count: 0,
              state: !!this.filter(object)
            };

            object.addHandler(COLLECTION_ITEM_HANDLER, this);
            if (map_.state)
              inserted.push(object);
          }

          if (!map_[sourceId])
          {
            map_[sourceId] = source;
            map_.count++;
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, object; object = delta.deleted[i]; i++)
        {
          objectId = object.eventObjectId;
          map_ = this.map_[objectId];

          if (map_ && map_[sourceId])
          {
            delete map_[sourceId];
            if (map_.count-- == 1)
            {
              map_.object.removeHandler(COLLECTION_ITEM_HANDLER, this);
              if (map_.state)
                deleted.push(map_.object);

              delete this.map_[objectId];
            }
          }
        }
      }

      if (delta = getDelta(inserted, deleted))
      {
        this.event_datasetChanged(this, delta);
      }
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };
*/

 /**
  * @class
  */
  var Collection = Class(AggregateDataset, {
    className: namespace + '.Collection',

    filter: $true,
    transform: function(object){
      return this.filter(object) ? object : null;
    },

   /**
    * Set new filter function.
    * @param {function(item):boolean} filter
    */
    setFilter: function(filter){
      filter = filter ? getter(filter) : $true;
      if (this.filter != filter)
      {
        this.filter = filter;

        var inserted = [];
        var deleted = [];
        var config;
        var object;
        var newState;

        for (var id in this.source_)
        {
          config = this.source_[id];
          object = config.object;
          newState = !!filter(object);

          if ((newState && !config.item) || (!newState && config.item))
          {
            if (newState)
            {
              config.item = object;
              this.map_[id] = 1;
              inserted.push(object);
            }
            else
            {
              config.item = null;
              delete this.map_[id];
              deleted.push(object);
            }
          }
        }

        var delta;
        if (delta = getDelta(inserted, deleted))
        {
          this.event_datasetChanged(this, delta);
        }
      }
    }
  });
  //Collection.sourceHandler = COLLECTION_DATASET_HANDLER;
  Collection.sourceHandler = AGGREGATEDATASET_DATASET_HANDLER;

  //
  // Grouping
  //

  var GROUPING_ITEM_HANDLER = {
    update: function(object){
      var objectId = object.eventObjectId;
      var oldGroup = this.map_[objectId].group;
      var newGroup = this.getGroup(this.groupGetter(object), true);

      if (oldGroup !== newGroup)
      {
        this.map_[objectId].group = newGroup;

        //oldGroup.remove([object]);
        delete oldGroup.map_[objectId];

        oldGroup.event_datasetChanged(oldGroup, {
          deleted: [object]
        });

        //newGroup.add([object]);
        newGroup.map_[objectId] = object;

        newGroup.event_datasetChanged(newGroup, {
          inserted: [object]
        });

        // destroy oldGroup if empty
        if (!oldGroup.itemCount && ('destroyEmpty' in oldGroup ? oldGroup.destroyEmpty : this.destroyEmpty))
        {
          //this.groups_[oldGroup.groupId].destroy();
          delete this.groups_[oldGroup.groupId];
          delete this.map_[oldGroup.eventObjectId];
          oldGroup.destroy();
          this.event_datasetChanged(this, {
            deleted: [oldGroup]
          });
        }
      }
    }
  };

  var GROUPING_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceId = source.eventObjectId;
      var inserted = [];
      var deleted = [];
      var object;
      var objectId;
      var map_;

      var deltaCache = {};
      var group;
      var groupId;
      var groupDelta;

      if (delta.inserted)
      {
        // parse groups first
        Dataset.setAccumulateState(true);
        for (var i = 0, object; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
          map_ = this.map_[objectId];

          if (!map_)
          {
            group = this.getGroup(this.groupGetter(object), true);

            map_ = this.map_[objectId] = {
              object: object,
              count: 0,
              group: group
            };

            inserted.push(map_);
          }

          if (!map_[sourceId])
          {
            map_[sourceId] = source;
            map_.count++;
          }
        }
        Dataset.setAccumulateState(false);

        // than add new objects to groups (otherwise groups items may be add by other object twice)
        for (var i = 0; map_ = inserted[i]; i++)
        {
          object = map_.object;
          group = map_.group;
          objectId = object.eventObjectId;

          // add object update event handler
          object.addHandler(GROUPING_ITEM_HANDLER, this);

          // group.add([object]);
          group.map_[objectId] = object;

          // add to event cache
          groupId = group.eventObjectId;
          groupDelta = deltaCache[groupId];
          if (!groupDelta)
            groupDelta = deltaCache[groupId] = {
              group: group,
              inserted: [object],
              deleted: []
            };
          else
            groupDelta.inserted.push(object);
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, object; object = delta.deleted[i]; i++)
        {
          objectId = object.eventObjectId;
          map_ = this.map_[objectId];

          if (map_ && map_[sourceId])
          {
            delete map_[sourceId];
            if (map_.count-- == 1)
            {
              group = map_.group;

              // remove object update event handler
              object.removeHandler(GROUPING_ITEM_HANDLER, this);

              // group.remove([object]);
              delete group.map_[objectId];

              // remove from groupin map
              delete this.map_[objectId];

              // add to event cache
              groupId = group.eventObjectId;
              groupDelta = deltaCache[groupId];
              if (!groupDelta)
                groupDelta = deltaCache[groupId] = {
                  group: group,
                  deleted: [object]
                };
              else
                groupDelta.deleted.push(object);

            }
          }
        }
      }

      for (var groupId in deltaCache)
      {
        delta = deltaCache[groupId];
        group = delta.group;

        if (!delta.deleted.length)
          delete delta.deleted;

        group.event_datasetChanged(group, delta);

        if (!group.itemCount && ('destroyEmpty' in group ? group.destroyEmpty : this.destroyEmpty))
        {
          deleted.push(group);
          //this.groups_[group.groupId].destroy();
          delete this.groups_[group.groupId];
          delete this.map_[group.eventObjectId];
          group.destroy();
        }
      }

      if (deleted.length)
      {
        this.event_datasetChanged(this, {
          deleted: deleted
        });
      }
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };

 /**
  * @class
  */
  var Grouping = Class(AggregateDataset, {
    className: namespace + '.Grouping',

    groupGetter: $true,
    groupClass: AbstractDataset,

    destroyEmpty: true,

   /**
    * @config {function} filter Group function.
    * @config {class} groupClass Class for group instances. Should be instance of AbstractDataset.
    * @config {boolean} destroyEmpty Destroy empty groups automaticaly or not.
    * @constructor
    */ 
    init: function(config){
      this.groups_ = {};

      // inherit
      AggregateDataset.prototype.init.call(this, config);
    },

    getGroup: function(value, autocreate){
      var isDataObject = value instanceof DataObject;
      var groupId = isDataObject ? value.eventObjectId : value;
      var group = this.groups_[groupId];
      if (!group)
      {
        if (autocreate)
        {
          var config = {};

          if (isDataObject)
            config.delegate = value;
          else
            config.info = {
              groupId: value,
              title: value
            };

          group = new this.groupClass(config);
          group.groupId = groupId;

          this.map_[group.eventObjectId] = group;
          this.groups_[groupId] = group;

          this.event_datasetChanged(this, {
            inserted: [group]
          });
        }
      }

      return group;
    },

    destroy: function(){
      // prevent destroy empty groups, groups will destroy all at once (to reduce event dispatching)
      this.destroyEmpty = false;

      // fetch groups
      var groups = values(this.groups_);
      for (var i = groups.length; i --> 0;)
        groups[i].destroyEmpty = false;

      // inherit
      AggregateDataset.prototype.destroy.call(this);

      // dispatch event
      this.event_datasetChanged(this, {
        deleted: groups
      });

      // destroy groups
      for (var i = groups.length; i --> 0;)
        groups[i].destroy();

      delete this.groups_;
    }
  });

  Grouping.sourceHandler = GROUPING_DATASET_HANDLER;

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

    AbstractDataset: AbstractDataset,
    Dataset: Dataset,
    AggregateDataset: AggregateDataset,
    IndexedDataset: IndexedDataset,
    Collection: Collection,
    Grouping: Grouping
  });

})();