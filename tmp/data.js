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

   /**
    * This namespace contains base classes and functions for components of Basis framework.
    *
    * Namespace overview:
    * - Const:
    *   {Basis.Data.STATE}, {Basis.Data.SUBSCRIPTION}
    * - Classes:
    *   {Basis.Data.DataObject}, {Basis.Data.AbstractDataset}, {Basis.Data.Dataset},
    *   {Basis.Data.AggregateDataset}, {Basis.Data.IndexedDataset}, {Basis.Data.Collection},
    *   {Basis.Data.Grouping}
    *
    * @namespace Basis.Data
    */
    var namespace = 'Basis.Data';

    // import names

    var Class = Basis.Class;
    var getter = Function.getter;

    var EventObject = Basis.EventObject;

    //
    // Main part
    //

    // States for StateObject

    /** @const */ var STATE_UNDEFINED  = 'undefined';
    /** @const */ var STATE_READY      = 'ready';
    /** @const */ var STATE_PROCESSING = 'processing';
    /** @const */ var STATE_ERROR      = 'error';
    /** @const */ var STATE_DEPRECATED = 'deprecated';

    /** @const */ var SUBSCRIPTION_NONE       = 0x00;
    /** @const */ var SUBSCRIPTION_DELEGATE   = 0x01;
    /** @const */ var SUBSCRIPTION_COLLECTION = 0x02;
    /** @const */ var SUBSCRIPTION_SOURCE     = 0x04;
    /** @const */ var SUBSCRIPTION_MASK       = SUBSCRIPTION_DELEGATE | SUBSCRIPTION_COLLECTION | SUBSCRIPTION_SOURCE;

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

    //
    // DataObject
    //

   /**
    * @const
    */
    var DATAOBJECT_DELEGATE_HANDLER = {
      update: function(object, delta){ 
        this.updateCount += 1;
        this.info = object.info;  // proposition introduce rootDelegateChanged event instead
        this.dispatch('update', object, delta);
      },
      stateChanged: function(object, oldState){
        this.state = object.state;
        this.dispatch('stateChanged', object, oldState);
      },/*
      delegateChanged: function(object, oldDelegate){
        this.info = object.info;
        this.dispatch('rootDelegateChange', object, oldDelegate);
      },
      rootDelegateChanged: function(object, oldDelegate){
        this.info = object.info;
        this.dispatch('rootDelegateChange', object, oldDelegate);
      },*/
      destroy: function(){
        if (this.cascadeDestroy)
          this.destroy();
        else
          this.setDelegate();
      }
    };

   /**
    * Base class for data storing.
    * @class
    */
    var DataObject = Class(EventObject, {
      className: namespace + '.DataObject',

     /**
      * State of object.
      * @type {Basis.Data.STATE|string}
      */
      state: STATE_READY,

     /**
      * Using for data storing. Might be managed by delegate object (if used).
      * It takes from config.info.
      * @type {Object}
      */
      info: null,

     /**
      * Count of info updates.
      * @type {number}
      */
      updateCount: 0,

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
      * Flag determines object behaviour when assigned delegate is destroing:
      * - true - destroy object on delegate object destroing (cascade destroy)
      * - false - don't destroy object, detach delegate only
      * @type {boolean}
      */
      cascadeDestroy: false,

     /**
      * Object that's manage childNodes updates.
      * @type {Basis.Data.AbstractDataset}
      */
      collection: null,

     /**
      * Count of subscribed objects. This property can use to determinate
      * is data update necessary or not. Usualy if object is in UNDEFINED
      * or DEPRECATED state and subscriberCount more than zero - update needed.
      * @type {number}
      */
      subscriberCount: 0,

     /**
      * Subscribers list. Using to prevent subscriber dublicate count.
      * @type {Object}
      */
      subscribers_: null,

     /**
      * Indicates if object influence to related objects (his delegate or/and
      * collection) or not.
      * @type {boolean}
      */
      isActiveSubscriber: false,

     /**
      * Subscriber type indicates what sort of influence has currency object on
      * related objects (delegate, collection).
      * @type {Basis.Data.SUBSCRIPTION|number}
      */
      subscriptionType: SUBSCRIPTION_DELEGATE | SUBSCRIPTION_COLLECTION,

     /**
      * @param {Object=} config The configuration of object.
      * @config {Basis.Data.AbstractDataset} collection Set a collection to a new object.
      * @config {Basis.Data.DataObject} delegate Set a delegate to a
      *   new object. If passed than config.info will be ignored.
      * @config {Basis.Data.DataObject|Object} info Initial data for info
      *   property. If {Basis.Data.DataObject} instance passed it became
      *   a delegate for the new object.
      * @config {boolean} isActiveSubscriber Overrides prototype's {Basis.Data.DataObject#isActiveSubscriber} property.
      * @config {boolean} cascadeDestroy Overrides prototype's {Basis.Data.DataObject#cascaseDestroy} property.
      * @config {string|Object} state
      * @config {number} subscriptionType
      * @return {Object}
      * @constructor
      */
      init: function(config){
        // inherit
        this.inherit(config);

        // init properties
        this.subscribers_ = {};
        this.updateCount = 0;
        this.info = {};
        
        // apply config if possible
        if (config)
        {
          if (typeof config.isActiveSubscriber == 'boolean')
            this.isActiveSubscriber = config.isActiveSubscriber;

          if (!isNaN(config.subscriptionType))
            this.subscriptionType = config.subscriptionType;

          if (typeof config.cascadeDestroy == 'boolean')
            this.cascadeDestroy = config.cascadeDestroy;

          if (config.state)
            this.state = config.state;

          // set info property
          var delegate = config.delegate;

          // for backward capability (but probably permanently here)
          if (!delegate && config.info instanceof DataObject)
            delegate = config.info;

          if (delegate)
            // assign a delegate
            this.setDelegate(delegate);
          else
            // .. or assign info object
            if (config.info)
            {
              var delta = {};
              for (var key in config.info)
              {
                this.info[key] = config.info[key];
                delta[key] = undefined;
              }

              this.dispatch('update', this, delta);
            }

          // set collection
          if (config.collection)
            this.setCollection(config.collection);
        }
        else
        {
          this.state = Object(String(this.state));
        }

        // apply state changes
        if (this.state == this.constructor.prototype.state && (this.behaviour.stateChanged || this.handlers_.length))
          this.dispatch('stateChanged', this, undefined);

        return config || {};
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
      setDelegate: function(delegate){
        if (this.canHaveDelegate && this.delegate !== delegate)
        {
          var delta = {};
          var oldDelegate = this.delegate;
          var isDelegateSubscriber = this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_DELEGATE);

          if (oldDelegate)
          {
            oldDelegate.removeHandler(DATAOBJECT_DELEGATE_HANDLER, this);

            for (var key in this.info)
              delta[key] = this.info[key];

            this.info = {};

            if (isDelegateSubscriber)
              oldDelegate.removeSubscriber(this, SUBSCRIPTION_DELEGATE);

            delete this.delegate;
          }

          if (delegate instanceof DataObject)
          {
            // prevent from linking object that had already linked (event through some other objects)
            if (!this.isConnected(delegate))
            {
              if (isDelegateSubscriber)
                delegate.addSubscriber(this, SUBSCRIPTION_DELEGATE);

              this.setState(delegate.state, delegate.state.data);

              for (var key in delegate.info)
              {
                if (key in delta)
                {
                  if (delegate.info[key] === delta[key])
                    delete delta[key];
                }
                else
                {
                  if (delegate.info[key] !== this.info[key])
                    delta[key] = this.info[key];
                }
              }

              this.delegate = delegate;
              this.info = delegate.info;

              delegate.addHandler(DATAOBJECT_DELEGATE_HANDLER, this);
            }
            else
            {
              // throw exception?
              ;;;if (typeof console != 'undefined') console.warn('(debug) New delegate has already connected to object. Delegate assign has been ignored.', this, delegate);
            }
          }

          this.dispatch('delegateChanged', this, oldDelegate);
          this.dispatch('update', this, delta);
        }

        return this.delegate;
      },

     /**
      * Set new state for object. Fire stateChanged event only if state (or state text) was changed.
      * @param {Basis.Data.STATE|string} state New state for object
      * @param {Object=} data
      * @param {boolean=} forceEvent Fire stateChanged event even state didn't changed.
      * @return {Basis.Data.STATE|string} Current object state.
      */
      setState: function(state, data){
        if (this.state != String(state) || this.state.data != data)
        {
          var oldState = this.state;
          var root = this.getRootDelegate();

          if (root !== this)
          {
            return root.setState(state, data);
          }

          this.state = Object(String(state));
          this.state.data = data;

          this.dispatch('stateChanged', this, oldState);
        }

        return this.state;

      },

     /**
      * Default action on deprecate, set object to STATE_DEPRECATED state,
      * but only if object is not in STATE_PROCESSING state.
      */
      deprecate: function(){
        if (this.state != STATE_PROCESSING)
          this.setState(STATE_DEPRECATED);
      },

     /**
      * @param {Basis.Data.AbstractDataset} collection
      */
      setCollection: function(collection){
        if (this.collection != collection)
        {
          var oldCollection = this.collection;

          if (oldCollection)
          {
            if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_COLLECTION))
              oldCollection.removeSubscriber(this, SUBSCRIPTION_COLLECTION);

            delete this.collection;
          }

          if (collection instanceof AbstractDataset)
          {
            this.collection = collection;

            if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_COLLECTION))
              collection.addSubscriber(this, SUBSCRIPTION_COLLECTION);
          }
            
          this.dispatch('collectionChanged', this, oldCollection);

          return true;
        }

        return false;
      },

     /**
      * Handle changing object data. Fires update event only if something was changed. 
      * @param {Object} data New values for object data holder (this.info).
      * @param {boolean=} forceEvent Fire update event even no changes.
      * @return {Object|boolean} Delta if object data (this.info) was updated or false otherwise.
      */
      update: function(data){
        var root = this.getRootDelegate();

        if (root !== this)
          return root.update(data);

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
            this.updateCount += updateCount;
            this.dispatch('update', this, delta);
            return delta;
          }
        }

        return false;
      },

     /**
      * @param {Basis.EventObject} object
      * @return {boolean} Returns true if subscriber has been added.
      */
      addSubscriber: function(object, subscriberType){
        ;;;if (!subscriberType && typeof console != 'undefined') console.warn('addSubscriber has no subscriberType argument');

        var subscriberId = subscriberType + '_' + object.eventObjectId;
        if (!this.subscribers_[subscriberId])
        {
          this.subscribers_[subscriberId] = object;
          this.subscriberCount += 1;
          this.dispatch('subscribersChanged');

          return true;
        }

        return false;
      },

     /**
      * @param {Basis.EventObject} object
      * @return {boolean} Returns true if subscriber has been removed.
      */
      removeSubscriber: function(object, subscriberType){
        ;;;if (!subscriberType && typeof console != 'undefined') console.warn('removeSubscriber has no subscriberType argument');

        var subscriberId = subscriberType + '_' + object.eventObjectId;
        if (this.subscribers_[subscriberId])
        {
          delete this.subscribers_[subscriberId];
          this.subscriberCount -= 1;
          this.dispatch('subscribersChanged');

          return true;
        }
        
        return false;
      },

     /**
      * Set new value for isActiveSubscriber property.
      * @param {boolean} isActive New value for {Basis.Data.DataObject#isActiveSubscriber} property.
      * @return {boolean} Returns true if {Basis.Data.DataObject#isActiveSubscriber} was changed.
      */
      setIsActiveSubscriber: function(isActive){
        if (this.isActiveSubscriber != !!isActive)
        {
          var delegate = this.delegate;
          var collection = this.collection;
          var subscriptionType = this.subscriptionType;

          if (delegate && (subscriptionType & SUBSCRIPTION_DELEGATE))
          {
            if (isActive)
              delegate.addSubscriber(this, SUBSCRIPTION_DELEGATE);
            else
              delegate.removeSubscriber(this, SUBSCRIPTION_DELEGATE);
          }

          if (collection && (subscriptionType & SUBSCRIPTION_COLLECTION))
          {
            if (isActive)
              collection.addSubscriber(this, SUBSCRIPTION_COLLECTION);
            else
              collection.removeSubscriber(this, SUBSCRIPTION_COLLECTION);
          }

          this.isActiveSubscriber = !!isActive;

          this.dispatch('isActiveStateChanged');

          return true;
        }

        return false;
      },

     /**
      * Set new value for subscriptionType property.
      * @param {number} subscriptionType New value for {Basis.Data.DataObject#subscriptionType} property.
      * @return {boolean} Returns true if {Basis.Data.DataObject#subscriptionType} was changed.
      */
      setSubscriptionType: function(subscriptionType){
        var curSubscriptionType = this.subscriptionType;
        var newSubscriptionType = subscriptionType;

        if (curSubscriptionType != newSubscriptionType)
        {
          if (this.isActiveSubscriber)
          {
            var delegate = this.delegate;
            var collection = this.collection;
            var delegateSubscriptionChanged = delegate && ((newSubscriptionType & SUBSCRIPTION_DELEGATE) ^ (curSubscriptionType & SUBSCRIPTION_DELEGATE));
            var collectionSubscriptionChanged = collection && ((newSubscriptionType & SUBSCRIPTION_COLLECTION) ^ (curSubscriptionType & SUBSCRIPTION_COLLECTION));

            if (delegateSubscriptionChanged)
            {
              if (curSubscriptionType & SUBSCRIPTION_DELEGATE)
                delegate.removeSubscriber(this, SUBSCRIPTION_DELEGATE);
              else
                delegate.addSubscriber(this, SUBSCRIPTION_DELEGATE);
            }

            if (collectionSubscriptionChanged)
            {
              if (curSubscriptionType & SUBSCRIPTION_COLLECTION)
                collection.removeSubscriber(this, SUBSCRIPTION_COLLECTION);
              else
                collection.addSubscriber(this, SUBSCRIPTION_COLLECTION);
            }
          }

          this.subscriptionType = newSubscriptionType;

          return true;
        }

        return false;
      },

     /**
      * @destructor
      */
      destroy: function(){
        // deassign delegate
        var delegate = this.delegate;
        if (delegate)
        {
          this.info = {};
          delegate.removeHandler(DATAOBJECT_DELEGATE_HANDLER, this);

          if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_DELEGATE))
            delegate.removeSubscriber(this, SUBSCRIPTION_DELEGATE);

          delete this.delegate;
        }

        // remove collection
        if (this.collection)
        {
          this.setCollection();
          delete this.collection;
        }

        this.inherit();

        delete this.state;
        delete this.subscribers_;
      }
    });

    //
    // Datasets
    //

   /**
    * @class
    */
    var AbstractDataset = Class(DataObject, {
      className: namespace + '.AbstractDataset',

      canHaveDelegate: false,
      state: STATE_UNDEFINED,

      map_: null,
      member_: null,
      cache_: [],
      eventCache_: null,

      itemCount: 0,
      version: 0,
      version_: 0,

     /**
      * @constructor
      */
      init: function(config){
        this.inherit(config);

        this.map_ = {};
        this.member_ = {};
        this.itemCount = 0;
        this.version = 0;

        this.eventCache_ = {
          mode: false,
          delta: []
        };
      },

      has: function(object){
        return !!(object && this.member_[object.eventObjectId]);
      },
      getItems: function(){
        if (this.version_ != this.version)
        {
          this.version_ = this.version;
          this.cache_ = Object.values(this.member_);
        }

        return this.cache_;
      },

      sync:   Function.$false,
      add:    Function.$false,
      remove: Function.$false,
      set:    Function.$false,
      clear:  Function.$false,

      dispatch: function(event, dataset, delta){
        if (event == 'datasetChanged')
        {
          var items;

          if (items = delta.inserted)
          {
            for (var i = 0, object; object = items[i]; i++)
              this.member_[object.eventObjectId] = this.map_[object.eventObjectId];

            this.itemCount += items.length;
            this.version++;
          }

          if (items = delta.deleted)
          {
            for (var i = 0, object; object = items[i]; i++)
              delete this.member_[object.eventObjectId];

            this.itemCount -= items.length;
            this.version++;
          }
        }

        this.inherit.apply(this, arguments);
      },

      destroy: function(){
        this.clear();

        this.inherit();

        this.getItems = Function.$null; // are we need for this?

        delete this.itemCount;
        delete this.map_;
        delete this.member_;
        delete this.cache_;
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
        this.inherit(config);

        if (config && config.items)
          this.set(config.items);
      },

      add: function(data){
        
        // insert
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

              if (object.all !== this)
                object.addHandler(DATASET_ITEM_HANDLER, this);
            }
          }
        }

        // trace changes
        if (inserted.length)
        {
          this.dispatch('datasetChanged', this, delta = {
            inserted: inserted
          });
        }

        return delta;
      },

      remove: function(data){

        // delete items
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

              if (object.all !== this)
                object.removeHandler(DATASET_ITEM_HANDLER, this);
            }
          }
        }

        // trace changes
        if (deleted.length)
        {
          this.dispatch('datasetChanged', this, delta = {
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
          {
            var objectId = object.eventObjectId;

            map_[objectId] = object;
          }
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

            if (object.all !== this)
              object.removeHandler(DATASET_ITEM_HANDLER, this);
          }
        }
        
        // insert data
        var inserted = [];
        for (var objectId in map_)
        {
          var object = map_[objectId];
          this.map_[objectId] = map_[objectId];
          inserted.push(object);

          if (object.all !== this)
            object.addHandler(DATASET_ITEM_HANDLER, this);
        }

        // trace changes
        var delta;
        if (delta = getDelta(inserted, deleted))
        {
          this.dispatch('datasetChanged', this, delta);
          return delta;
        }
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

        for (var objectId in this.map_)
        {
          if (!map_[objectId])
          {
            var object = this.map_[objectId];
            deleted.push(object);

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
        this.map_ = {};

        if (deleted.length)
        {
          for (var i = 0; i < deleted.length; i++)
            if (deleted[i].all !== this)      // KOSTIL' for Entity
              deleted[i].removeHandler(DATASET_ITEM_HANDLER, this);

          this.dispatch('datasetChanged', this, delta = {
            deleted: deleted
          });
        }

        return delta;
      }

    });

    //
    // accumulate dataset changes
    //
    (function(){
      var awatingDatasetCache = {};
      var proto = AbstractDataset.prototype;
      var realDispatch_ = DataObject.prototype.dispatch;
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

          realDispatch_.method.call(dataset, 'datasetChanged', dataset, delta);
        }
      }

      function flushAllDataset(){
        Object.values(awatingDatasetCache).forEach(flushDataset);
      }

      function storeDatasetDelta(dataset, delta){
        var cache = dataset.eventCache_;
        var isInsert = !!delta.inserted;
        var isDelete = !!delta.deleted;

        if (isInsert && isDelete)
        {
          flushDataset(dataset);
          realDispatch_.method.call(dataset, 'datasetChanged', dataset, delta);
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
        proto.dispatch = realDispatch_;
        flushAllDataset();      
      }

      function patchedDispatch(event, dataset, delta){
        if (event == 'datasetChanged')
          storeDatasetDelta(dataset, delta);
        else
          realDispatch_.method.apply(this, arguments);
      }

      Dataset.setAccumulateState = function(state){
        if (state !== 'xxx') return;
        if (state)
        {
          if (setStateCount == 0)
          {
            proto.dispatch = patchedDispatch;
            urgentTimer = setTimeout(urgentFlush, 0);
          }
          setStateCount++;
        }
        else
        {
          if (setStateCount == 1)
          {
            clearTimeout(urgentTimer);
            proto.dispatch = realDispatch_;
            flushAllDataset();
          }

          setStateCount -= setStateCount > 0;
        }
      }
    })();

    //
    // Dataset aggregate
    //

    function createADMethod_addSource(handler){
      return function(source){
        if (source instanceof AbstractDataset)
        {
          if (this.sources.add(source))
          {
            source.addHandler(handler, this);
            handler.datasetChanged.call(this, source, {
              inserted: source.getItems()
            });

            if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_SOURCE))
              source.addSubscriber(this, SUBSCRIPTION_SOURCE);

            return true;
          }
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.addSource: source isn\'t type of AbstractDataset');
        }
      }
    }

    function createADMethod_removeSource(handler){
      return function(source){
        if (this.sources.remove(source))
        {
          source.removeHandler(handler, this);
          handler.datasetChanged.call(this, source, {
            deleted: source.getItems()
          });

          if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_SOURCE))
            source.removeSubscriber(this, SUBSCRIPTION_SOURCE);

          return true;
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.removeSource: source isn\'t in dataset source list');
        }
      }
    }

    function createADMethod_clear(handler){
      return function(){
        for (var i = 0, source; source = this.sources[i]; i++)
        {
          source.removeHandler(handler, this);
          handler.datasetChanged.call(this, source, {
            deleted: source.getItems()
          });

          if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION_SOURCE))
            source.removeSubscriber(this, SUBSCRIPTION_SOURCE);
        }

        this.sources.clear();
        this.map_ = {};
      }
    }

    var AGGREGATEDATASET_DATASET_HANDLER = {
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
                count: 0
              };
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
                delete this.map_[objectId];
                deleted.push(object);
              }
            }
          }
        }

        if (delta = getDelta(inserted, deleted))
        {
          this.dispatch('datasetChanged', this, delta);
        }
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

      subscriptionType: SUBSCRIPTION_SOURCE,
      sources: null,

     /**
      * @config {Array.<Basis.Data.AbstractDataset>} sources Set of source datasets for aggregate.
      * @constructor
      */
      init: function(config){
        this.sources = [];

        this.inherit(config);

        if (config)
        {
          if (Array.isArray(config.sources))
            config.sources.forEach(this.addSource, this);
        }
      },

      getItems: function(){
        if (this.version_ != this.version)
        {
          this.version_ = this.version;
          this.cache_ = [];

          for (var objectId in this.member_)
            this.cache_.push(this.member_[objectId].object);
        }

        return this.cache_;
      },

      setIsActiveSubscriber: function(isActive){
        if (this.isActiveSubscriber != !!isActive)
        {
          if (this.sources.length && (this.subscriptionType & SUBSCRIPTION_SOURCE))
          {
            for (var i = 0; source = this.sources[i]; i++)
            {
              if (isActive)
                source.addSubscriber(this, SUBSCRIPTION_SOURCE);
              else
                source.removeSubscriber(this, SUBSCRIPTION_SOURCE);
            }
          }
        }

        return this.inherit(isActive);
      },

      setSubscriptionType: function(subscriptionType){
        var curSubscriptionType = this.subscriptionType;
        var newSubscriptionType = Number(subscriptionType) || 0;

        if (curSubscriptionType != subscriptionType && this.isActiveSubscriber)
        {
          var sourceSubscriptionChanged = this.sources.length && (newSubscriptionType & SUBSCRIPTION_SOURCE) ^ (curSubscriptionType & SUBSCRIPTION_SOURCE);

          if (sourceSubscriptionChanged)
          {
            for (var i = 0; source = this.sources[i]; i++)
            {
              if (newSubscriptionType & SUBSCRIPTION_SOURCE)
                source.addSubscriber(this, SUBSCRIPTION_SOURCE);
              else
                source.removeSubscriber(this, SUBSCRIPTION_SOURCE);
            }
          }
        }

        return this.inherit(newSubscriptionType);
      },

      addSource: createADMethod_addSource(AGGREGATEDATASET_DATASET_HANDLER),
      removeSource: createADMethod_removeSource(AGGREGATEDATASET_DATASET_HANDLER),
      clear: createADMethod_clear(AGGREGATEDATASET_DATASET_HANDLER),

      destroy: function(){
        this.inherit();

        delete this.sources;
      }
    });


    //
    // IndexedDataset
    //

    function binarySearchPos(array, map, left, right){ 
      if (!array.length)  // empty array check
        return 0;

      var pos;
      var value;
      var compareValue;
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

            this.dispatch('datasetChanged', this, delta);
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
                //indexed: false,
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

        inserted = Object.values(inserted);
        deleted = Object.values(deleted);

        //console.log(inserted, deleted);
        //debugger;

        if (delta = getDelta(inserted, deleted))
        {
          this.dispatch('datasetChanged', this, delta);
        }
      },
      destroy: function(source){
        this.removeSource(source);
      }
    };

    function normalizeOffset(offset){
      offset = parseInt(offset) || 0;
      return offset >= 0 ? offset : 0;
    }
    function normalizeLimit(limit){
      limit = parseInt(limit);
      return limit >= 1 ? limit : 1;
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
      index: Function.$true,

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
            this.offset = normalizeOffset(config.offset);
          if ('limit' in config)
            this.limit = normalizeLimit(config.limit);
        }

        this.inherit(config);
      },

     /**
      * Set new range for dataset.
      * @param {number} offset Start of range.
      * @param {number} limit Length of range.
      */
      setRange: function(offset, limit){
        offset = normalizeOffset(offset);
        limit = normalizeLimit(limit);

        if (this.offset != offset || this.limit != limit)
        {
          var inserted = [];
          var deleted = [];

          var oldRangeEnd = this.offset + this.limit;
          var newRangeEnd = offset + limit;

          if (offset != this.offset)
          {
            if (offset < this.offset)
              inserted.push.apply(inserted, this.index_.slice(offset, Math.min(this.offset, newRangeEnd)));
            else
              deleted.push.apply(deleted, this.index_.slice(this.offset, Math.min(offset, oldRangeEnd)));
          }

          if (newRangeEnd != oldRangeEnd)
          {
            if (newRangeEnd < oldRangeEnd)
              deleted.push.apply(deleted, this.index_.slice(Math.max(newRangeEnd, this.offset), oldRangeEnd));
            else
              inserted.push.apply(inserted, this.index_.slice(Math.max(oldRangeEnd, offset), newRangeEnd));
          }

          this.offset = offset;
          this.limit = limit;

          inserted = inserted.map(getter('object'));
          deleted = deleted.map(getter('object'));

          if (delta = getDelta(inserted, deleted))
          {
            this.dispatch('datasetChanged', this, delta);
          }
        }
      },

      /*getItems: function(){
        if (this.version_ != this.version)
        {
          this.version_ = this.version;
          this.cache_ = this.index_.slice(this.offset, this.offset + this.limit).map(getter('object'));
        }

        return this.cache_;
      },*/

      addSource: createADMethod_addSource(INDEXEDDATASET_DATASET_HANDLER),
      removeSource: createADMethod_removeSource(INDEXEDDATASET_DATASET_HANDLER),
      clear: createADMethod_clear(INDEXEDDATASET_DATASET_HANDLER)
    });


    //
    // Collection
    //

    var COLLECTION_ITEM_HANDLER = {
      update: function(object){
        var map_ = this.map_[object.eventObjectId];
        var newState = !!this.filter(object);

        if (map_.state != newState)
        {
          map_.state = newState;

          this.dispatch('datasetChanged', this,
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
          this.dispatch('datasetChanged', this, delta);
        }
      },
      destroy: function(source){
        this.removeSource(source);
      }
    };


   /**
    * @class
    */
    var Collection = Class(AggregateDataset, {
      className: namespace + '.Collection',
      filter: Function.$true,

     /**
      * @config {function():boolean} filter Filter function.
      * @constructor
      */
      init: function(config){
        if (config)
        {
          if (config.filter)
            this.filter = getter(config.filter);
        }

        this.inherit(config);
      },

      /*getItems: function(){
        if (this.version_ != this.version)
        {
          this.version_ = this.version;
          this.cache_ = [];

          for (var objectId in this.map_)
            if (this.map_[objectId].state)
              this.cache_.push(this.map_[objectId].object);
        }

        return this.cache_;
      },*/

      setFilter: function(filter){
        filter = filter ? getter(filter) : Function.$true;
        if (this.filter != filter)
        {
          this.filter = filter;

          var inserted = [];
          var deleted = [];
          var config;
          var object;
          var newState;

          for (var id in this.map_)
          {
            config = this.map_[id];
            object = config.object;
            newState = !!filter(object);

            if (newState != config.state)
            {
              config.state = newState;
              if (newState)
                inserted.push(object);
              else
                deleted.push(object);
            }
          }

          var delta;
          if (delta = getDelta(inserted, deleted))
          {
            this.dispatch('datasetChanged', this, delta);
          }
        }
      },

      addSource: createADMethod_addSource(COLLECTION_DATASET_HANDLER),
      removeSource: createADMethod_removeSource(COLLECTION_DATASET_HANDLER),
      clear: createADMethod_clear(COLLECTION_DATASET_HANDLER),

      sync: function(data, set){
        if (!data)
          return;

        Dataset.setAccumulateState(true);

        var res = [];
        var map_ = {};
        var deleted = [];

        for (var i = 0; i < data.length; i++)
        {
          var object = data[i];
          if (object instanceof DataObject)
          {
            var objectId = object.eventObjectId;
            map_[objectId] = object;
          }
        }

        for (var objectId in this.map_)
        {
          if (this.map_[objectId].state && !map_[objectId])
          {
            var object = this.map_[objectId].object;
            deleted.push(object);

            object.destroy();
          }
        }

        Dataset.setAccumulateState(false);

        return res;
      },

      destroy: function(){
        this.inherit();
      }
    });

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

          oldGroup.dispatch('datasetChanged', oldGroup, {
            deleted: [object]
          });

          //newGroup.add([object]);
          newGroup.map_[objectId] = object;

          newGroup.dispatch('datasetChanged', this, {
            inserted: [object]
          });

          // destroy oldGroup if empty
          if (this.destroyEmpty && !oldGroup.itemCount)
          {
            //this.groups_[oldGroup.groupId].destroy();
            delete this.groups_[oldGroup.groupId];
            delete this.map_[oldGroup.eventObjectId];
            oldGroup.destroy();
            this.dispatch('datasetChanged', this, {
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

          group.dispatch('datasetChanged', group, delta);

          if (this.destroyEmpty && !group.itemCount)
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
          this.dispatch('datasetChanged', this, {
            deleted: deleted
          });
        }
      },
      destroy: function(source){
        this.removeSource(source);
      }
    };

    var groupingClearSources = createADMethod_clear(GROUPING_DATASET_HANDLER);

   /**
    * @class
    */
    var Grouping = Class(AggregateDataset, {
      className: namespace + '.Grouping',

      groupGetter: Function.$true,
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

        if (config)
        {
          if (config.groupGetter)
            this.groupGetter = getter(config.groupGetter);
          if (config.groupClass)
            this.groupClass = config.groupClass;
          if (config.destroyEmpty === false)
            this.destroyEmpty = false;
        }

        this.inherit(config);
      },

      /*has: function(object){
        return !!(object && this.groups_[object.groupId] === object);
      },
      getItems: function(){
        if (!this.eventCache_.mode && this.version_ != this.version)
        {
          this.version_ = this.version;
          this.cache_ = Object.values(this.groups_);
        }

        return this.cache_;
      },*/

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

            this.dispatch('datasetChanged', this, {
              inserted: [group]
            });
          }
        }

        return group;
      },

      addSource: createADMethod_addSource(GROUPING_DATASET_HANDLER),
      removeSource: createADMethod_removeSource(GROUPING_DATASET_HANDLER),

      clear: function(){
        //debugger;
        // delete sources
        groupingClearSources.call(this);

        // destroy groups?
        /*var deleted = Object.values(this.groups_);
        this.groups_ = {};

        for (var objectId in this.map_)
        {
          this.map_[objectId].object.removeHandler(GROUPING_ITEM_HANDLER, this);
          delete this.map_[objectId];
        }

        if (deleted.length)
        {
          this.dispatch('datasetChanged', this, {
            deleted: deleted
          });

          for (var i = 0; i < deleted.length; i++)
            deleted[i].destroy();
        }*/

        // TODO!!
        //this.sources.clear();
      },

      destroy: function(){
        // prevent destroy empty groups, groups will destroy all at once (to reduce event dispatching)
        this.destroyEmpty = false;

        // inherit
        this.inherit();

        // fetch groups
        var groups = Object.values(this.groups_);

        // dispatch event
        this.dispatch('datasetChanged', this, {
          deleted: groups
        });

        // destroy groups
        for (var i = 0; i < groups.length; i++)
          groups[i].destroy();

        delete this.groups_;
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      // const
      STATE: {
        UNDEFINED: STATE_UNDEFINED,
        READY: STATE_READY,
        PROCESSING: STATE_PROCESSING,
        ERROR: STATE_ERROR,
        DEPRECATED: STATE_DEPRECATED
      },

      SUBSCRIPTION: {
        NONE: SUBSCRIPTION_NONE,
        DELEGATE: SUBSCRIPTION_DELEGATE,
        COLLECTION: SUBSCRIPTION_COLLECTION,
        MASK: SUBSCRIPTION_MASK
      },

      // classes
      DataObject: DataObject,

      AbstractDataset: AbstractDataset,
      Dataset: Dataset,
      AggregateDataset: AggregateDataset,
      IndexedDataset: IndexedDataset,
      Collection: Collection,
      Grouping: Grouping
    });

  })();