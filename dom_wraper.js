/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

   /**
    * This namespace contains base classes and functions for components of Basis framework.
    *
    * Namespace overview:
    * - Event layer:
    *   {Basis.DOM.Wrapers.EventObject}, {Basis.DOM.Wrapers.createBehaviour}
    * - Data layer:
    *   {Basis.DOM.Wrapers.DataObject}, {Basis.DOM.Wrapers.AbstractProperty},
    *   {Basis.DOM.Wrapers.Property}, {Basis.DOM.Wrapers.DataObjectSet}
    * - Non-visual DOM classes:
    *   {Basis.DOM.Wrapers.AbstractNode}, {Basis.DOM.Wrapers.InteractiveNode},
    *   {Basis.DOM.Wrapers.Node}, {Basis.DOM.Wrapers.PartitionNode},
    *   {Basis.DOM.Wrapers.GroupControl}
    * - Visual DOM classes:
    *   {Basis.DOM.Wrapers.HtmlNode}, {Basis.DOM.Wrapers.HtmlPanel},
    *   {Basis.DOM.Wrapers.HtmlContainer}, {Basis.DOM.Wrapers.HtmlControl},
    *   {Basis.DOM.Wrapers.HtmlPartitionNode}, {Basis.DOM.Wrapers.HtmlGroupControl}
    * - Misc:
    *   {Basis.DOM.Wrapers.Selection}
    *
    * Aliases are available:
    * - {Basis.DOM.Wrapers.PropertySet} for {Basis.DOM.Wrapers.DataObjectSet}
    * - {Basis.DOM.Wrapers.Control} for {Basis.DOM.Wrapers.HtmlControl}
    * - {Basis.DOM.Wrapers.HtmlList} for {Basis.DOM.Wrapers.HtmlContainer}
    *
    * @namespace Basis.DOM.Wrapers
    */

    var namespace = String('Basis.DOM.Wrapers');

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var Fn = Basis.Data;
    var Template = Basis.Html.Template;

    var Cleaner = Basis.Cleaner;

    var cssClass = Basis.CSS.cssClass;
    var extend = Object.extend;
    var complete = Object.complete;
    var slice = Array.prototype.slice;

    //
    // Main part
    //

    // Module exceptions

    /** @const */ var EXCEPTION_DATAOBJECT_REQUIRED = namespace + ': Instance of DataObject required';
    /** @const */ var EXCEPTION_BAD_OBJECT_LINK = namespace + ': Link to undefined object ignored';
    /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
    /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
    /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
    /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';

    // States for DataObject

    /** @const */ var STATE_UNDEFINED = 'undefined';
    /** @const */ var STATE_READY = 'ready';
    /** @const */ var STATE_PROCESSING = 'processing';
    /** @const */ var STATE_ERROR = 'error';
    /** @const */ var STATE_DEPRECATED = 'deprecated';

   /**
    * Creates behaviour singleton object.
    * @param {Basis.Class} superClass Prototype class for inhiritance.
    * @param {Object} behaviour Set of methods that being part of new behaviour object.
    * @return {Object} Behaviour singleton object inherited from superClass behaviour
    * member if superClass specified and has behaviour member, otherwise new
    * root behaviour singleton object.
    */
    function createBehaviour(superClass, behaviour){
      var proto = superClass && superClass.prototype;
      var superClassBehaviour = proto && proto.behaviour && proto.behaviour.constructor;
      return new (Class(superClassBehaviour, extend({ className: superClass ? 'subclass of ' + superClass.className + '.Behaviour' : 'EventObject.Behaviour' }, behaviour)))();
    }

    // EventObject seed ID
    var HTML_EVENT_OBJECT_ID_HOLDER = 'basisEventObjectId';
    var eventObjectId = 1;
    var eventObjectMap = {};

   /**
    * Base class for event dispacthing. It provides model when it's instance
    * can registrate handlers for events, and call it when event happend. 
    * @class
    */
    var EventObject = Class(null, {
     /**
      * Name of class.
      * @type {string}
      * @readonly
      */
      className: namespace + '.EventObject',

     /**
      * Unique id of object.
      * @type {number}
      * @readonly
      */
      eventObjectId: 0,

     /**
      * Default set of event handler. It calls after all other handlers are called.
      * @type {Object}
      * @private
      */
      behaviour: createBehaviour(null, {}),

     /**
      * List of event handler sets.
      * @type {Array.<Object>}
      * @private
      */
      handlers_: [],

     /**
      * @param {Object=} config
      * @config {Object} handlers Event handler set.
      * @config {Object} handlersContext Context for event handler set (handlers).
      * @config {boolean} traceEvents_ Debug for.
      * @constructor
      */
      init: function(config){
        // init properties
        this.handlers_ = new Array();

        // registrate object
        eventObjectMap[eventObjectId] = this;
        this.eventObjectId = eventObjectId++;

        // apply config
        if (typeof config == 'object')
        {
          ;;;if ((config && config.traceEvents_) || this.traceEvents_) this.handlers_.push({ handler: { any: function(){ console.log(this, arguments) } }, thisObject: this });
          ;;;if (config && 'thisObject' in config) console.warn(this.className + ': thisObject in config is deprecated. Use handlersContext instead');

          if (config.handlers)
          {
            this.handlers_.push({
              handler: config.handlers,
              thisObject: config.handlersContext || this
            });
          }
        }

        return config;
      },

     /**
      * Registrates new event handler set for object.
      * @param {Object} handler Event handler set.
      * @param {Object=} thisObject Context object.
      * @return {boolean} Whether event handler set was added.
      */
      addHandler: function(handler, thisObject){
        thisObject = thisObject || this;

        ;;;if (this.handlers_ === this.constructor.prototype.handlers_ && typeof console != 'undefined') console.warn('Add handler for not inited instance of EventObject (' + this.className + ')');

        // search for duplicate
        for (var i = 0, item; item = this.handlers_[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
          {
            ;;;if (typeof console != 'undefined') console.warn('Add dublicate handler to EventObject instance (' + this + ')');
            return false;
          }

        // add handler
        this.handlers_.push({ 
          handler: handler,
          thisObject: thisObject
        });

        return true;
      },

     /**
      * Removes event handler set from object. For this operation parameters
      * must be the same (equivalent) as used for addHandler method.
      * @param {Object} handler Event handler set.
      * @param {Object=} thisObject Context object.
      * @return {boolean} Whether event handler set was removed.
      */
      removeHandler: function(handler, thisObject){
        thisObject = thisObject || this;

        // search for handler and remove
        for (var i = 0, item; item = this.handlers_[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
          {
            this.handlers_.splice(i, 1);
            return true;
          }

        // handler not found
        return false;
      },

     /**
      * Fires event dispatching. All handlers assigned for some event will be called
      * in reverse order of addiction. Behaviour handler to be called last.
      * @param {string} eventName Name of dispatching event.
      * @param {...*} args The arguments to the event handlers.
      */
      dispatch: function(eventName/*, arg1 .. argN */){
        var behaviour = this.behaviour[eventName];
        var handlersCount = this.handlers_.length;

        if (!window.eventNum)window.eventNum = 0;window.eventNum++;//console.log('{eventNum:04}'.format(window), eventName, this);
        if (!window.eventMap)window.eventMap = {};if (!eventMap[eventName])eventMap[eventName]=0;eventMap[eventName]++;//console.log('{eventNum:04}'.format(window), eventName, this);

        if (handlersCount || behaviour)
        {
          var args = slice.call(arguments, 1);

          if (handlersCount)
          {
            var handlers = slice.call(this.handlers_);
            var item, handler;
            var i = handlers.length;
            while (i--)
            {
              item = handlers[i];
              // debug for
              ;;;if (typeof item.handler['any'] == 'function') item.handler.any.apply(item.thisObject, [eventName].concat(args));

              // handler call
              handler = item.handler[eventName];
              if (typeof handler == 'function')
                handler.apply(item.thisObject, args);
            }
          }
        
          if (typeof behaviour == 'function')
            behaviour.apply(this, args);
        }
      },

     /**
      * @destructor
      */
      destroy: function(){
        // remove object from global instance storage (debug for)
        //!ms;;;var s = Basis.instanceStorage && Basis.instanceStorage[this.className]; if (s) s.remove(this);

        // prevent call this method again
        this.destroy = Function.$undef;

        // fire object destroy event handlers
        this.dispatch('destroy', this);

        // remove all event handler sets
        delete this.handlers_;
        delete eventObjectMap[this.eventObjectId];

        // no handlers in destroyed object, nothing dispatch
        this.dispatch = Function.$undef;
      }
    });

    //
    // TimeEventManager
    //

    var TimeEventManager = (function(){
      var NEVER = 2E12;
      var EVENT_TIME_GETTER = Fn('eventTime');

      var eventStack = [];
      var map = {};
      var fireTime = NEVER;
      var timer = null;

      var lockSetTimeout = false;

      function setNextTime(){
        if (lockSetTimeout)
          return;

        if (eventStack.length)
        {
          var now = Date.now();
          var firstEventTime = Math.max(eventStack[0].eventTime, now);

          // move fire time backward
          if (firstEventTime < fireTime)
          {
            clearTimeout(timer);
            timer = setTimeout(fire, (fireTime = firstEventTime) - now);
          }
        }
        else
        {
          timer = clearTimeout(timer);
          fireTime = NEVER;
        }
      }

      function add(object, event, eventTime){
        //debugger;
        //;;;if (typeof console != 'undefined') console.log('try add event:', object.eventObjectId, object, event, eventTime);

        var objectId = object.eventObjectId;
        var eventMap = map[event];
        if (!eventMap)
          eventMap = map[event] = {};

        var eventObject = eventMap[objectId];

        if (eventObject)
        {
          if (isNaN(eventTime))
          {
            //;;;if (typeof console != 'undefined') console.log('eventTime is NaN - remove it');
            return remove(object, event);
          }            

          if (eventObject.eventTime == eventTime)
            return;

          // temporary remove from stack
          eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
          eventObject.eventTime = eventTime;
        }
        else
        {
          if (isNaN(eventTime))
            return;

          // event config
          eventObject = eventMap[objectId] = {
            eventName: event,
            object: object,
            eventTime: eventTime,
            callback: object[event]
          };
        }

        // insert event into stack
        eventStack.splice(eventStack.binarySearchPos(eventTime, EVENT_TIME_GETTER), 0, eventObject);

        //;;;if (typeof console != 'undefined') console.log('event added');

        setNextTime();
      }

      function remove(object, event){
        //debugger;

        var objectId = object.eventObjectId;
        var eventObject = map[event] && map[event][objectId];

        //;;;if (typeof console != 'undefined') console.log('try to remove:', objectId, object);

        if (eventObject)
        {
          //;;;if (typeof console != 'undefined') console.log('remove object:', objectId, object);

          // delete object from stack and map
          eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
          delete map[event][objectId];

          setNextTime();
        }
      }

      function fire(){
        var now = Date.now();
        var pos = eventStack.binarySearchPos(now + 15, EVENT_TIME_GETTER);

        //;;;if (typeof console != 'undefined') console.log('>>>> event manager cycle');
        //;;;if (typeof console != 'undefined') console.log('before fire:', eventStack.map(EVENT_TIME_GETTER), now, now + 15, pos);

        lockSetTimeout = true; // lock for set timeout if callback calling will add new events
        eventStack.splice(0, pos).forEach(function(eventObject){
          //;;;if (typeof console != 'undefined') console.log('process object :', eventObject.object.eventObjectId, eventObject.object);

          delete map[eventObject.eventName][eventObject.object.eventObjectId];
          eventObject.callback.call(eventObject.object);
        });
        lockSetTimeout = false; // unlock

        //;;;if (typeof console != 'undefined') console.log('after fire:', eventStack.map(EVENT_TIME_GETTER));

        fireTime = NEVER;
        setNextTime();

        //;;;if (typeof console != 'undefined') console.log('>> next time:', fireTime == NEVER ? 'Never' : fireTime);
      }

      Cleaner.add({
        destroy: function(){
          lockSetTimeout = true;
          clearTimeout(timer);
          delete eventStack;
          delete map;
        }
      })

      return {
        add: add,
        remove: remove
      };
    })();

    //
    // DataObject
    //

   /**
    * @constant
    */
    var DATAOBJECT_DELEGATE_HANDLER = {
      isSubscriber: true,

      datasetChanged: function(newValue, delta){ 
        this.dispatch('update', this, this.info, this.info, {});
      },
      change: function(newValue, oldValue, delta){ 
        this.dispatch('update', this, newValue, oldValue, delta);
      },
      update: function(object, newValue, oldValue, delta){ 
        if (!this._no_update)
        {
          this._no_update = true;
          this.updateCount++;
          this.dispatch('update', object, newValue, oldValue, delta);
          this._no_update = false;
        }
        else
        {
          ;;;if (typeof console != 'undefined') console.warn('bug! - atempt for recursive update');
        }
      },
      stateChanged: function(object, newState, oldState, errorText){
        if (this.state != newState || this.errorText != errorText)
        {
          if (this.state != newState)
          {
            if (this.state == STATE_READY)
            {
              this.timestamp = object.timestamp;
              if (!isNaN(this.timestamp + this.maxAge))
                TimeEventManager.add(this, 'deprecate', this.timestamp + this.maxAge);
            }
            else
            {
              if (this.timestamp + this.maxAge)
                TimeEventManager.remove(this, 'deprecate');
              this.timestamp = NaN;
            }
          }

          this.state = newState;
          this.errorText = newState == STATE_ERROR ? errorText : null;

          this.dispatch('stateChanged', object, newState, oldState, this.errorText);
        }
      },
      delegateChanged: function(object, oldDelegate){
        // This is incorrect way, because unspecify event dispatch fired, for non-target object.
        // Here is must be another solution: probably another event type (for example ancestorDelegateChanged)
        // or another way to update info property for all connected objects
        this.info = object.info;
        this.dispatch('delegateChanged', this, oldDelegate);
      },
      destroy: function(){
        if (!this.parentNode || !this.parentNode.collection)
          if (this.cascadeDestroy)
            this.destroy();
          else
            this.setDelegate();
      }
    };

   /**
    * DataObject state object.
    * @class
    */
    var DataState = function(state, data){
      this.state = state || STATE_UNDEFINED;
      this.data = data;
    };
    DataState.prototype.toString = function(){
      return this.state;
    };

   /**
    * Base class for data storing.
    * @class
    * @extends {Basis.DOM.Wrapers.EventObject}
    */
    noUpdateCount = 0;
    noStateCount = 0;
    var DataObject = Class(EventObject, {
      className: namespace + '.DataObject',

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
      * Object that manage info updates if assigned.
      * @type {Basis.DOM.Wrapers.DataObject}
      */
      delegate: null,

     /**
      * Count of subscribed objects. Not all linked (unsing addHandlers) objects
      * are subscribers of object, but only those who attached via handlers with
      * isSubscriber property set to true. This property can use to determinate
      * is data update necessary or not. Usualy if object is not in STATE_READY
      * or STATE_PROCESSING and subscriberCount more than zero - update needed.
      * @type {number}
      */
      subscriberCount: 0,

     /**
      * Indicates if object influence to related objects (his delegate or/and
      * collection) or not.
      * @type {boolean}
      */
      isActiveSubscriber: true,

     /**
      * Flag determines object behaviour when assigned delegate is destroing:
      * - true - destroy object on delegate object destroing (cascade destroy)
      * - false - don't destroy object, detach delegate only
      * @type {boolean}
      */
      cascadeDestroy: false,

     /**
      * State of object.
      * @type {Basis.DOM.Wrapers.DataState}
      */
      state: STATE_READY,

     /**
      * Error text when object in ERROR state.
      * @type {?string}
      */
      errorText: null,

     /**
      * Time when object got ready state. Commonly when data of object was inited last time.
      * This property 
      */
      timestamp: NaN,

     /**
      * Max time (in milliseconds) for data in ready state until it became deprecated.
      * If it set to NaN this functionality is disabled.
      * @type {number}
      */
      maxAge: NaN,

     /**
      * @param {Object=} config The configuration of object.
      * @config {Basis.DOM.Wrapers.DataObject} delegate Set a delegate to the
      *   new object. If passed than config.info will be ignored.
      * @config {Basis.DOM.Wrapers.DataObject|Object} info Initial data for info
      *   property. If {Basis.DOM.Wrapers.DataObject} instance passed it became
      *   a delegate for the new object.
      * @config {boolean} isActiveSubscriber Overrides prototype's {Basis.DOM.Wrapers.DataObject#isActiveSubscriber} property.
      * @config {boolean} cascadeDestroy Overrides prototype's {Basis.DOM.Wrapers.DataObject#cascaseDestroy} property.
      * @config {number} maxAge Overrides prototype's {Basis.DOM.Wrapers.DataObject#maxAge} property.
      * @return {Object}
      * @constructor
      */
      init: function(config){
        // inherit
        this.inherit(config);

        // init properties
        this.updateCount = 0;
        this.info = {};

        // apply config if possible
        if (typeof config == 'object')
        {
          if (typeof config.isActiveSubscriber == 'boolean')
            this.isActiveSubscriber = config.isActiveSubscriber;

          if (typeof config.maxAge == 'number')
          {
            var maxAge = Number(config.maxAge);
            this.maxAge = maxAge <= 0 ? NaN : maxAge;
          }

          if (typeof config.cascadeDestroy == 'boolean')
            this.cascadeDestroy = config.cascadeDestroy;

          // set info property
          var delegate = config.delegate;

          // for backward capability (but probably permanently here)
          if (!delegate && config.info instanceof DataObject)
            delegate = config.info;

          if (delegate)
            // assign a delegate
            this.setDelegate(delegate);
          else
            // ... or info object
            if (config.info)
            {
              this.info = config.info;
              this.dispatch('update', this, this.info, {}, this.info);
            }
        }

        //this.setState(state, this.errorText);

        if (this.state == STATE_READY)
        {
          this.timestamp = Date.now();
          if (!isNaN(this.maxAge))
            TimeEventManager.add(this, 'deprecate', this.timestamp + this.maxAge);
        }

        // apply changes
        if (this.state == this.constructor.prototype.state && (this.behaviour.stateChanged || this.handlers_.length))
          this.dispatch('stateChanged', this, this.state, null, this.errorText);

        return config || {};
      },

     /**
      * @inheritDoc
      */
      addHandler: function(handler, thisObject){
        var result = this.inherit(handler, thisObject);
        if (result && handler.isSubscriber && thisObject)
        {
          if (thisObject.isActiveSubscriber)
          {
            this.subscriberCount = this.subscriberCount + 1;
            this.dispatch('subscribersChanged');
          }
        }
        return result;
      },

     /**
      * @inheritDoc
      */
      removeHandler: function(handler, thisObject){
        var result = this.inherit(handler, thisObject);
        if (result && handler.isSubscriber && thisObject)
        {
          if (thisObject.isActiveSubscriber)
          {
            this.subscriberCount = this.subscriberCount - 1;
            this.dispatch('subscribersChanged');
          }
        }
        return result;
      },

     /**
      * Changes isActiveSubscriber property.
      * @param {boolean} isActive New value for {Basis.DOM.Wrapers.DataObject#isActiveSubscriber} property
      * @return Current {Basis.DOM.Wrapers.DataObject#isActiveSubscriber} property value
      */
      setIsActiveSubscriber: function(isActive){
        if (this.isActiveSubscriber != isActive)
        {
          this.isActiveSubscriber = !!isActive;

          var delegate = this.delegate;
          if (delegate)
          {
            delegate.subscriberCount = delegate.subscriberCount + (isActive ? 1 : -1);
            delegate.dispatch('subscribersChanged');
          }

          var collection = this.collection;
          if (collection)
          {
            collection.subscriberCount = collection.subscriberCount + (isActive ? 1 : -1);
            collection.dispatch('subscribersChanged');
          }
        }

        return !!isActive;
      },

     /**
      * Set new delegate object or reject it (if passed null).
      * @example
      *   var a = new DataObject();
      *   var b = new DataObject();
      *
      *   a.setDelegate(b);
      *   a.update({ prop: 123 });
      *   alert(a.info.prop); // shows 123
      *   alert(a.info.prop === b.info.prop); // shows true
      *
      *   b.update({ prop: 456 });
      *   alert(a.info.prop === b.info.prop); // shows true
      *
      *   a.setState(Basis.DOM.Wrapers.PROCESSING);
      *   alert(a.state); // shows 'processing'
      *   alert(a.state === b.state); // shows 'processing'
      * @param {Basis.DOM.Wrapers.DataObject} delegate
      * @param {boolean=} silent Prevent fire update event.
      * @return {Basis.DOM.Wrapers.DataObject} Returns current delegate object.
      */
      setDelegate: function(delegate, silent){
        if (this.delegate !== delegate)
        {
          var delta = this.info;
          var oldDelegate = this.delegate;

          if (this.delegate)
          {
            this.delegate.removeHandler(DATAOBJECT_DELEGATE_HANDLER, this);
            this.info = {};

            delete this.delegate;
          }

          if (delegate instanceof DataObject)
          {
            // prevent from linking object that had already linked (event through some other objects)
            if (!this.isConnected(delegate))
            {
              this.setState(delegate.state, delegate.errorText);

              this.delegate = delegate;

              this.delegate.addHandler(DATAOBJECT_DELEGATE_HANDLER, this);
              this.info = this.delegate instanceof AbstractProperty ? this.delegate.value : this.delegate.info;
            }
            else
            {
              // throw exception?
              ;;;if (typeof console != 'undefined') console.warn('(debug) New delegate has already connected to object. Delegate assign has been ignored.', this, delegate);
            }
          }

          this.dispatch('delegateChanged', this, oldDelegate);

          if (!silent)
            this.dispatch('update', this, this.info, delta, delta);
        }
        return this.delegate;
      },

     /**
      * Returns root delegate object (that haven't delegate).
      * @return {Basis.DOM.Wrapers.DataObject}
      */
      getRootDelegate: function(){
        var object = this;

        while (object.delegate && object.delegate !== object)
          object = object.delegate;

        return object;
      },

     /**
      * Returns true if current object is connected to another object through delegate bubbling.
      * @param {Basis.DOM.Wrapers.DataObject} object
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
      * Handle changing object data. Fires update event only if something was changed. 
      * @param {Object} data New values for object data holder (this.info).
      * @param {boolean=} forceEvent Fire update event even no changes.
      * @return {Object|boolean} Delta if object data (this.info) was updated or false otherwise.
      */
      update: function(data, forceEvent){
        var delta = {};
        var updateCount = this.updateCount;
        var root = this.getRootDelegate();

        if (root !== this)
        {
          this.updateCount += Boolean(delta = root.update(data, forceEvent));
          return delta;
        }

        if (data)
        {
          for (var prop in data)
            if (this.info[prop] !== data[prop])
            {
              this.updateCount++;
              delta[prop] = this.info[prop];
              this.info[prop] = data[prop];
            }
        }

        if (forceEvent || (this.updateCount != updateCount))
          this.dispatch('update', this, this.info, [this.info, delta].merge(), delta);

        return this.updateCount != updateCount ? delta : false;
      },

     /**
      * Set new state for object. Fire stateChanged event only if state (or state text) was changed.
      * @param {Basis.DOM.Wrapers.STATE|string} state New state for object
      * @param {string=} errorText
      * @param {boolean=} forceEvent Fire stateChanged event even state didn't changed.
      * @return {Basis.DOM.Wrapers.STATE|string} Current object state.
      */
      setState: function(state, errorText, forceEvent){
        errorText = state == STATE_ERROR ? errorText : null;

        if (state != this.state || errorText != this.errorText)
        {
          var root = this.getRootDelegate();

          if (root !== this)
            root.setState(state, errorText, forceEvent);
          else
          {
            var oldState = this.state;
            var oldErrorText = this.errorText;

            if (this.state != state)
            {
              if (state == STATE_READY)
              {
                this.timestamp = Date.now();
                if (!isNaN(this.timestamp + this.maxAge)) TimeEventManager.add(this, 'deprecate', this.timestamp + this.maxAge);
              }
              else
              {
                if (this.timestamp + this.maxAge)
                  TimeEventManager.remove(this, 'deprecate');
                this.timestamp = NaN;
              }
            }

            this.state = state;
            this.errorText = errorText;

            if (forceEvent || this.state != oldState || this.errorText != oldErrorText)
              this.dispatch('stateChanged', this, this.state, oldState, errorText);
          }
        }

        return this.state;
      },

     /**
      * Sets new value for maxAge property. Adds or removes object to/from
      * deprecator if necessary.
      * @param {number} newMaxAge New value for maxAge. If new value less or
      * equal to zero it set to NaN (disable deprecate functionality)
      * @return {number} Current maxAge value.
      */
      setMaxAge: function(newMaxAge){
        if (!newMaxAge || newMaxAge < 0)
          newMaxAge = NaN;

        if (this.maxAge != newMaxAge)
        {
          this.maxAge = newMaxAge;

          if (newMaxAge)
            TimeEventManager.add(this, 'deprecate', this.timestamp + this.maxAge);
          else
            TimeEventManager.remove(this, 'deprecate')
        }

        return this.maxAge;
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
      * @destructor
      */
      destroy: function(){
        // deassing delegate
        if (this.delegate)
        {
          this.delegate.removeHandler(DATAOBJECT_DELEGATE_HANDLER, this);
          this.info = {};
          delete this.delegate;
        }

        this.inherit();
      }
    });

    //
    //  ABSTRACT PROPERTY
    //
    
   /**
    * @class
    * @extends {Basis.DOM.Wrapers.DataObject}
    */
    var AbstractProperty = Class(DataObject, {
      className: namespace + '.AbstractProperty',

     /**
      * Indicates that property is locked (don't fire event for changes).
      * @type {boolean}
      * @readonly
      */
      locked: false,

     /**
      * Value before property locked (passed as oldValue when property unlock).
      * @type {Object}
      * @private
      */
      lockValue_: null,

     /**
      * @param {Object} initValue Initial value for object.
      * @param {Object=} handlers
      * @param {function()=} proxy
      * @constructor
      */
      init: function(initValue, handlers, proxy){
        this.inherit();

        this.proxy = typeof proxy == 'function' ? proxy : Function.$self;
        this.initValue = this.value = this.proxy(initValue);

        if (handlers)
          this.addHandler(handlers);
      },

     /**
      * Sets new value for property, only when data not equivalent current
      * property's value. In causes when value was changed or forceEvent
      * parameter was true event 'change' dispatching.
      * @param {Object} data New value for property.
      * @param {boolean=} forceEvent Dispatch 'change' event even value not changed.
      * @return {boolean} Whether value was changed.
      */
      set: function(data, forceEvent){
        var updateCount = this.updateCount;

        var oldValue = this.value;
        var newValue = this.proxy ? this.proxy(data) : newValue;

        if (newValue !== oldValue)
        {
          this.value = newValue;
          this.updateCount++;
        }

        if (!this.locked && (forceEvent || updateCount != this.updateCount))
          this.dispatch('change', newValue, oldValue);

        return updateCount != this.updateCount;
      },

     /**
      * Locks object for change event fire.
      */
      lock: function(){
        if (!this.locked)
        {
          this.lockValue_ = this.value;
          this.locked = true;
        }
      },

     /**
      * Unlocks object for change event fire. If value was changed during object
      * lock, than change event fires.
      */
      unlock: function(){
        if (this.locked)
        {
          this.locked = false;
          if (this.value !== this.lockValue_)
            this.dispatch('change', this.value, this.lockValue_);
        }
      },

      update: function(newValue, forceEvent){
        return this.set(newValue, forceEvent);
      },

     /**
      * Sets init value for property.
      */
      reset: function(){
        this.set(this.initValue);
      },

     /**
      * Returns object value.
      * @return {Object}
      */
      toString: function(){
        return this.value != null && this.value.constructor == Object ? String(this.value) : this.value;
      },

     /**
      * @destructor
      */
      destroy: function(){
        this.inherit();

        delete this.initValue;
        delete this.proxy;
        delete this.lockValue_;
        delete this.value;
      }
    });

    //
    //  PROPERTY
    //

    var PropertyObjectDestroyAction = { 
      destroy: function(object){ 
        this.removeLink(object) 
      } 
    };

    var DOM_INSERT_HANDLER = function(value){
      DOM.insert(DOM.clear(this), value);
    };

    function getFieldHandler(object){
      // property
      if (object instanceof Property)
        return object.set;

      // DOM
      var nodeType = object.nodeType;
      if (isNaN(nodeType) == false)
        if (nodeType == 1)
          return DOM_INSERT_HANDLER;
        else
          return 'nodeValue';
    }

   /**
    * @class
    * @extends {Basis.DOM.Wrapers.AbstractProperty}
    */
    var Property = Class(AbstractProperty, {
      className: namespace + '.Property',

     /**
      * @type {object}
      * @private
      */
      links_: null,

      behaviour: createBehaviour(AbstractProperty, {
        change: function(value, oldValue){
          if (!this.links_.length || Cleaner.globalDestroy)
            return;

          for (var i = 0, link; link = this.links_[i++];)
            this.power_(link, oldValue);
        }
      }),

     /**
      * @inheritDoc
      * @constructor
      */
      init: function(initValue, handlers, proxy){
        this.inherit(initValue, handlers, proxy);
        this.links_ = new Array();

        Cleaner.add(this);
      },

     /**
      * Adds link to object property or method. Optional parameter format using to
      * convert value to another value or type.
      * If object instance of {EventObject}, property attached handler. This handler
      * removes property links to object, when object destroy.
      * @example
      *
      *   var property = new Property();
      *   property.addLink(htmlElement);  // property.set(value) -> DOM.insert(DOM.clear(htmlElement), value);
      *   property.addLink(htmlTextNode); // shortcut for property.addLink(htmlTextNode, 'nodeValue')
      *                                   // property.set(value) -> htmlTextNode.nodeValue = value;
      *
      *   property.addLink(htmlTextNode, null, '[{0}]'); // htmlTextNode.nodeValue = '[{0}]'.format(value, oldValue);
      *   property.addLink(htmlTextNode, null, convert); // htmlTextNode.nodeValue = convert(value);
      *
      *   property.addLink(object, 'property');          // object.property = value;
      *   property.addLink(object, 'property', '[{0}]'); // object.property = '[{0}]'.format(value, oldValue);
      *   property.addLink(object, 'property', Number);  // object.property = Number(value, oldValue);
      *   property.addLink(object, 'property', { a: 1, b: 2});  // object.property = { a: 1, b: 2 }[value];
      *   property.addLink(object, object.method);       // object.method(value, oldValue);
      *
      *   property.addLink(object, function(value, oldValue){ // {function}.call(object, value, oldValue);
      *     // some code
      *     // (`this` is object property attached to)
      *   });
      *
      *   // Trace property changes
      *   var historyOfChanges = new Array();
      *   var property = new Property(1);
      *   property.addLink(historyOfChanges, historyOfChanges.push);  // historyOfChanges -> [1]
      *   property.set(2);  // historyOfChanges -> [1, 2]
      *   property.set(3);  // historyOfChanges -> [1, 2, 3]
      *   property.set(3);  // property didn't change self value
      *                     // historyOfChanges -> [1, 2, 3]
      *   property.set(1);  // historyOfChanges -> [1, 2, 3, 1]
      *
      *   // Another one
      *   property.addLink(console, console.log, 'new value of property is {0}');
      *
      * @param {Object} object Target object.
      * @param {String|Function=} field Field or method of target object.
      * @param {String|Function|Object=} format Value modificator.
      * @return {Object} Returns object.
      */
      addLink: function(object, field, format){
        // object must be an Object
        // IE HtmlNode isn't instanceof Object, therefore additionaly used typeof
        if (typeof object != 'object' && object instanceof Object == false)
          throw new Error(EXCEPTION_BAD_OBJECT_LINK);

        // process field name
        if (field == null)
          field = getFieldHandler(object);

        // process format argument
        if (typeof format != 'function')
          format = Fn(Function.$self, format);

        // create link
        var link = { 
          object: object,
          format: format,
          field: field,
          isEventObject: object instanceof EventObject 
        };

        // add link
        ;;;if (typeof console != 'undefined' && this.links_.search(true, function(link){ return link.object == object && link.field == field })) console.warn('Property.addLink: Dublicate link for property');
        this.links_.push(link);  // !!! TODO: check for object-field duplicates
        
        if (link.isEventObject)
          object.addHandler(PropertyObjectDestroyAction, this); // add unlink handler on object destroy

        // make effect on object
        this.power_(link);

        return object;
      },

     /**
      * Add link to object in simpler way.
      * @example
      *   // add custom class name to element (class name looks like "state-property.value")
      *   property.addLinkShortcut(element, 'className', 'state-{0}');
      *   // add 'loading' class name to element, when property is true
      *   property.addLinkShortcut( element, 'className', { true: 'loading' });
      *   // switch style.display property (using DOM.show/DOM.hide)
      *   property.addLinkShortcut(element, 'show', { ShowValue: true });
      *   property.addLinkShortcut(element, 'show', function(value){ return value == 'ShowValue' });  // the same
      *   property.addLinkShortcut(element, 'hide', { 'HideValue': true } });  // variation
      * @param {object} element Target object.
      * @param {String} shortcutName Name of shortcut.
      * @param {String|Function|Object=} format Value modificator.
      * @return {Object} Returns object.
      */
      addLinkShortcut: function(element, shortcutName, format){
        return this.addLink(element, Property.shortcut[shortcutName], format);
      },

     /**
      * Removes link or all links from object if exists. Parameters must be the same
      * as for addLink method. If field omited all links removes.
      * @example
      *   // add links
      *   property.addLink(object, 'field');
      *   property.addLink(object, object.method);
      *   // remove links
      *   property.removeLink(object, 'field');
      *   property.removeLink(object, object.method);
      *   // or remove all links from object
      *   property.removeLink(object);
      *
      *   // incorrect usage
      *   property.addLink(object, function(value){ this.field = value * 2; });
      *   ...
      *   property.removeLink(object, function(value){ this.field = value * 2; });
      *   // link property to object still present
      *
      *   // right way
      *   var linkHandler = function(value){ this.field = value * 2; };
      *   property.addLink(object, linkHandler);
      *   ...
      *   property.removeLink(object, linkHandler);
      *
      *   // for cases when object is instance of EventObject removing link on destroy is not required
      *   var node = new Node();
      *   property.addLink(node, 'title');
      *   ...
      *   node.destroy();       // links will be removed automatically
      * @param {Object} object
      * @param {String|Function=} field
      */
      removeLink: function(object, field){
        if (this.links_ == null) // property destroyed
          return;

        var deleteAll = arguments.length < 2;

        // process field name
        if (!deleteAll && field == null)
          field = getFieldHandler(object);

        // delete link
        var k = 0;
        for (var i = 0, link; link = this.links_[i]; i++)
        {
          if (link.object === object && (deleteAll || field == link.field))
          {
            if (link.isEventObject)
              link.object.removeHandler(PropertyObjectDestroyAction, this); // remove unlink handler on object destroy
          }
          else
            this.links_[k++] = link;
        }
        this.links_.length = k;
      },

     /**
      * Removes all property links to objects.
      */
      clear: function(){
        // destroy links
        for (var i = 0, link; link = this.links_[i]; i++)
          if (link.isEventObject)
            link.object.removeHandler(PropertyObjectDestroyAction, this); // remove unlink on object destroy

        // clear links array
        this.links_.clear();
      },

     /**
      * @param {Object} link
      * @param {Object} oldValue Object value before changes.
      * @private
      */
      power_: function(link, oldValue){
        var field = link.field;

        // field specified
        if (field != null)
        {
          var value = link.format(this.value);
          var object = link.object;

          if (typeof field == 'function')
            field.call(object, value, arguments.length < 2 ? value : link.format(oldValue));
          else
            object[field] = value;
        }
      },

     /**
      * @destructor
      */
      destroy: function(){
        this.clear();
        delete this.links_;

        this.inherit();

        Cleaner.remove(this);
      }
    });

    Property.shortcut = {
      className: function(newValue, oldValue){ cssClass(this).replace(oldValue, newValue) },
      show:      function(newValue){ DOM.display(this, !!newValue) },
      hide:      function(newValue){ DOM.display(this, !newValue) },
      disable:   function(newValue){ this.disabled = !!newValue },
      enable:    function(newValue){ this.disabled = !newValue }
    };

    //
    //  Property Set
    //
                                   // lowest priority                                              highest priority
    var DataObjectSetStatePriority = [STATE_READY, STATE_DEPRECATED, STATE_UNDEFINED, STATE_ERROR, STATE_PROCESSING];
    var DataObjectSetHandlers = {
      stateChanged: function(){
        this.fire(false, true);
      },
      update: function(){
        this.fire(true);
      },
      change: function(){
        this.fire(true);
      },
      destroy: function(object){
        this.remove(object)
      }
    };

   /**
    * @class
    * @extends {Basis.DOM.Wrapers.Property}
    */    
    var DataObjectSet = Class(Property, {
      className: namespace + '.DataObjectSet',
      
     /**
      * @type {Function}
      */
      calculateValue: Fn('value + 1'),

     /**
      * @type {Array.<Basis.DOM.Wrapers.DataObject>}
      */
      objects: [],

     /**
      * @type {number}
      * @private
      */
      timer_: null,

     /**
      * @type {boolean}
      * @private
      */
      valueChanged_: false,

     /**
      * @type {boolean}
      * @private
      */
      stateChanged_: true,

     /**
      * Default state is UNDEFINED
      */
      state: STATE_UNDEFINED,

     /**
      * @param {Object} config
      * @config {Object} value
      * @config {Object} handlers
      * @config {boolean} calculateOnInit
      * @config {function()} proxy
      * @config {function()} calculateValue
      * @config {Array.<Basis.DOM.Wrapers.DataObject>} objects
      * @constructor
      */
      init: function(config){
        config = config || {};

        this.inherit('value' in config ? config.value : 0, config.handlers, config.proxy);

        this.objects = new Array();

        if (typeof config.calculateValue == 'function')
          this.calculateValue = config.calculateValue;

        if (config.objects)
        {
          this.lock();
          this.add.apply(this, config.objects);
          this.unlock();
        }

        this.valueChanged_ = !!config.calculateOnInit;
        this.update();

        Cleaner.add(this);
      },

     /**
      * Adds one or more DataObject instances to objects collection.
      * @param {...Basis.DOM.Wrapers.DataObject} args
      */
      add: function(/* dataObject1 .. dataObjectN */){
        for (var i = 0, len = arguments.length; i < len; i++)
        {
          var object = arguments[i];
          if (object instanceof DataObject)
          {
            if (this.objects.add(object))
              object.addHandler(DataObjectSetHandlers, this);
          }
          else
            throw new Error(EXCEPTION_DATAOBJECT_REQUIRED);
        }

        this.fire(true, true);
      },

     /**
      * Removes DataObject instance from objects collection.
      * @param {Basis.DOM.Wrapers.DataObject} object
      */
      remove: function(object){
        if (this.objects.remove(object))
          object.removeHandler(DataObjectSetHandlers, this);

        this.fire(true, true);
      },

     /**
      * Removes all DataObject instances from objects collection.
      */
      clear: function(){
        for (var i = 0, object; object = this.objects[i]; i++)
          object.removeHandler(DataObjectSetHandlers, this);
        this.objects.clear();

        this.fire(true, true);
      },

     /**
      * @param {boolean} valueChanged 
      * @param {boolean} stateChanged
      */
      fire: function(valueChanged, stateChanged){
        if (!this.locked)
        {
          this.valueChanged_ = this.valueChanged_ || !!valueChanged;
          this.stateChanged_ = this.stateChanged_ || !!stateChanged;

          if (!this.timer_ && (this.valueChanged_ || this.stateChanged_))
          {
            this.timer_ = true;
            TimeEventManager.add(this, 'update', Date.now());
          }
        }
      },

     /**
      * Makes object not sensitive for attached DataObject changes.
      */
      lock: function(){
        this.locked = true;
      },

     /**
      * Makes object sensitive for attached DataObject changes.
      */
      unlock: function(){
        this.locked = false;
      },
      
     /**
      * @private
      */
      update: function(){
        delete this.timer_;
        TimeEventManager.remove(this, 'update');

        if (!Cleaner.globalDestroy)
        {
          if (this.valueChanged_)
            this.set(this.calculateValue());

          if (this.stateChanged_)
          {
            var stateMap = {};
            var len = this.objects.length;
            if (!len)
              this.setState(STATE_UNDEFINED)
            else
            {
              var maxWeight = -2;
              var curObject;

              for (var i = 0; i < len; i++)
              {
                var object = this.objects[i];
                var weight = DataObjectSetStatePriority.indexOf(object.state);
                if (weight > maxWeight)
                {
                  curObject = object;
                  maxWeight = weight;
                }
              }

              if (curObject)
                this.setState(curObject.state, curObject.errorText);
            }
            //this.setState();
          }
        }

        this.valueChanged_ = false;
        this.stateChanged_ = false;
      },

     /**
      * @destructor
      */
      destroy: function(){
        this.lock();
        this.clear();
        TimeEventManager.remove(this, 'update');

        this.inherit();
      }
    });

    //
    //  NODE
    //

   /**
    * @class
    * @extends {Basis.DOM.Wrapers.DataObject}
    */
    var AbstractNode = Class(DataObject, {
      className: namespace + '.AbstractNode',

     /**
      * @inheritDoc
      */
      behaviour: createBehaviour(DataObject, {
        update: function(node, newData, oldData, delta){
          var parentNode = this.parentNode;

          if (parentNode)
          {
            // TODO: remove this event dispatch. it using only by DOM.Wrapers.Register
            this.parentNode.dispatch('childUpdated', this, newData, oldData, delta);

            var nodes = parentNode.childNodes;

            if (parentNode.matchFunction)
            {
              this.match();
              this.match(parentNode.matchFunction);
            }

            if (parentNode.localGrouping)
            {
              var group = parentNode.groupControl.getGroupNode(this);
              if (group != this.groupNode)
              {
                parentNode.insertBefore(this);
                return;
              }

              nodes = group.childNodes;
            }

            if (parentNode.localSorting)
            {
              /* 
                there is need to remove/insert node, in other way we can't find right new position
                perfomance improve solution of:
                parentNode.removeChild(this);
                parentNode.insertBefore(this);
              */
              if (parentNode.firstChild != parentNode.lastChild)
              {
                var curPos = nodes.indexOf(this);
                var value = parentNode.localSorting(this);
                var prev = nodes[curPos - 1];
                var next = nodes[curPos + 1];
                var desc = parentNode.localSortingDesc;
                var left, right;

                if (next && (desc ? parentNode.localSorting(next) > value : parentNode.localSorting(next) < value))
                  left = curPos + 1;
                else
                  if (prev && (desc ? parentNode.localSorting(prev) < value : parentNode.localSorting(prev) > value))
                    right = curPos - 1;
                  else
                    return;

                var newPos = nodes.binarySearchPos(value, parentNode.localSorting, parentNode.localSortingDesc, false, left, right);
                
                if (curPos != newPos)
                {
                  var sorting = parentNode.localSorting;
                  parentNode.localSorting = null;
                  parentNode.insertBefore(this, nodes[newPos]);
                  parentNode.localSorting = sorting;
                }
              }
            } 
          }
        }
      }),

     /**
      * Flag determines object behaviour when parentNode changing:
      * - true: set same delegate as parentNode has on insert, or unlink delegate on remove
      * - false: nothing to do
      * @type {boolean}
      */
      autoDelegateParent: false,

     /**
      * @type {string}
      * @readonly
      */
      nodeType: 'DOMWraperNode',

     /**
      * @type {boolean}
      * @readonly
      */
      canHaveChildren: false,

     /**
      * A list that contains all children of this node. If there are no children,
      * this is a list containing no nodes.
      * @type {Array.<Basis.DOM.Wrapers.AbstractNode>}
      * @readonly
      */
      childNodes: [],

     /**
      * @type {Basis.DOM.Wrapers.AbstractNode}
      * @readonly
      */
      document: null,

     /**
      * The parent of this node. All nodes may have a parent. However, if a node
      * has just been created and not yet added to the tree, or if it has been
      * removed from the tree, this is null. 
      * @type {Basis.DOM.Wrapers.AbstractNode}
      * @readonly
      */
      parentNode: null,

     /**
      * The node immediately following this node. If there is no such node,
      * this returns null.
      * @type {Basis.DOM.Wrapers.AbstractNode}
      * @readonly
      */
      nextSibling: null,

     /**
      * The node immediately preceding this node. If there is no such node,
      * this returns null.
      * @type {Basis.DOM.Wrapers.AbstractNode}
      * @readonly
      */
      previousSibling: null,

     /**
      * The first child of this node. If there is no such node, this returns null.
      * @type {Basis.DOM.Wrapers.AbstractNode}
      * @readonly
      */
      firstChild: null,

     /**
      * The last child of this node. If there is no such node, this returns null.
      * @type {Basis.DOM.Wrapers.AbstractNode}
      * @readonly
      */
      lastChild: null,

     /**
      * Indicates that child nodes are sensetive for it's position. If true positionChanged
      * event will be fired for child nodes on child nodes permutation. 
      * @type {boolean}
      */
      positionDependent: false,

     /**
      * Object that's manage childNodes updates.
      * @type {Basis.DOM.Wrapers.DataObject}
      */
      collection: null,

     /**
      * Order of nodes according to collection order.
      * @type {Array.<Basis.DOM.Wrapers.AbstractNode>}
      */
      collectionOrderedNodes_: [],

     /**
      * Sorting function
      * @type {Function}
      */
      localSorting: null,

     /**
      * Sorting direction
      * @type {boolean}
      */
      localSortingDesc: false,

     /**
      * Grouping config
      * @type {Object}
      */
      localGrouping: null,

     /**
      * Reference to group node in groupControl
      * @type {Basis.DOM.Wrapers.AbstractNode}
      */
      groupNode: null,

     /**
      * Groups controling object
      * @type {Basis.DOM.Wrapers.GroupControl}
      */
      groupControl: null,

     /**
      * @param {Object} config
      * @config {boolean} autoDelegateParent Overrides prototype's {Basis.DOM.Wrapers.DataObject#autoDelegateParent} property.
      * @config {boolean} positionDependent Override prototype's positionDependent property.
      * @config {function()|string} localSorting Initial local sorting function.
      * @config {boolean} localSortingDesc Initial local sorting order.
      * @config {Basis.DOM.Wrapers.AbstractNode} document (deprecated) Must be removed. Used as hot fix.
      * @config {Object} localGrouping Initial config for local grouping.
      * @config {Basis.DOM.Wrapers.DataObject} collection Sets collection for object.
      * @config {Array} childNodes Initial child node set.
      * @return {Object} Returns a config. 
      * @constructor
      */
      init: function(config){
        // apply config
        config = config || {};

        if (typeof config.autoDelegateParent == 'boolean')
          this.autoDelegateParent = config.autoDelegateParent;

        if (typeof config.positionDependent == 'boolean')
          this.positionDependent = config.positionDependent;

        if (config.localSorting)
          this.localSorting = Fn(config.localSorting);

        if (typeof config.localSortingDesc == 'boolean')
          this.localSortingDesc = config.localSortingDesc;

        if ('localGrouping' in config)
          this.localGrouping = config.localGrouping;

        if (config.document)
          this.document = config.document;

        if (this.localGrouping)
          this.setLocalGrouping(this.localGrouping);

        // init properties
        if (this.canHaveChildren)
          this.childNodes = new Array();

        // inherit
        config = this.inherit(config);

        // append childs
        if (this.canHaveChildren)
        {
          if (config.collection)
            this.setCollection(config.collection);
          else
          {
            if (config.childNodes)
              this.setChildNodes(config.childNodes); //DOM.insert(this, config.childNodes);
          }
        }

        // return config
        return config;
      },

     /**
      * Adds the node newChild to the end of the list of children of this node. If the newChild is already in the tree, it is first removed.
      * @param {Basis.DOM.Wrapers.AbstractNode} newChild The node to add.
      * @return {Basis.DOM.Wrapers.AbstractNode} The node added.
      */
      appendChild: function(newChild){
      },

     /**
      * Inserts the node newChild before the existing child node refChild. If refChild is null, insert newChild at the end of the list of children.
      * @param {Basis.DOM.Wrapers.AbstractNode} newChild The node to insert.
      * @param {Basis.DOM.Wrapers.AbstractNode} refChild The reference node, i.e., the node before which the new node must be inserted.
      * @return {Basis.DOM.Wrapers.AbstractNode} The node being inserted.
      */
      insertBefore: function(newChild, refChild){
      },

     /**
      * Removes the child node indicated by oldChild from the list of children, and returns it.
      * @param {Basis.DOM.Wrapers.AbstractNode} oldChild The node being removed.
      * @return {Basis.DOM.Wrapers.AbstractNode} The node removed.
      */
      removeChild: function(oldChild){
      },

     /**
      * Replaces the child node oldChild with newChild in the list of children, and returns the oldChild node.
      * @param {Basis.DOM.Wrapers.AbstractNode} newChild The new node to put in the child list.
      * @param {Basis.DOM.Wrapers.AbstractNode} oldChild The node being replaced in the list.
      * @return {Basis.DOM.Wrapers.AbstractNode} The node replaced.
      */
      replaceChild: function(newChild, oldChild){
      },

     /**
      * Removes all child nodes from the list of children, fast way to remove all childs.
      * @param {boolean} alive
      */
      clear: function(alive){
      },

     /**
      * Returns whether this node has any children. 
      * @return {boolean} Returns true if this node has any children, false otherwise.
      */
      hasChildNodes: function(){
        return this.childNodes.length > 0;
      },

     /**
      * @param {Basis.DOM.Wrapers.DataObject} collection
      */
      setCollection: function(collection){
      },

     /**
      * @param {Object|function()|string} grouping
      */
      setLocalGrouping: function(grouping){
      },

     /**
      * @param {function()|string} sorting
      * @param {boolean} desc
      */
      setLocalSorting: function(sorting, desc){
      },

     /**
      * @destructor
      */
      destroy: function(){
        // This method actions order is important, for better perfomance: 
        // inherit destroy -> clear childNodes -> remove from parent

        // inherit (fire destroy event & remove handlers)
        this.inherit();

        // destroy group control
        if (this.groupControl)
        {
          this.groupControl.destroy();
          delete this.groupControl;
        }

        // delete childs
        if (this.collection)
          this.setCollection();
        else
          this.clear();

        // unlink from parent
        if (this.parentNode)
          this.parentNode.removeChild(this);

        // remove pointers
        delete this.document;
        delete this.parentNode;
        delete this.nextSibling;
        delete this.previousSibling;
        delete this.childNodes;
        delete this.firstChild;
        delete this.lastChild;

        // data remove
        delete this.info;
        delete this.config;
      }
    });

   /**
    * @class
    */
    var PartitionNode = Class(AbstractNode, {
      className: namespace + '.PartitionNode',
      canHaveChildren: true,

      titleGetter: Fn('info.title'),

     /**
      * Destroy object if it doesn't contain any children (became empty).
      * @type {boolean}
      */
      emptyAutoDestroy: true,

     /**
      * @param {Object} config
      * @config {boolean} emptyAutoDestroy Override prototype value for emptyAutoDestroy property.
      * @config {function()} titleGetter
      * @constructor
      */
      init: function(config){
        // apply config
        if (typeof config == 'object')
        {
          if (typeof config.emptyAutoDestroy == 'boolean')
            this.emptyAutoDestroy = !!config.emptyAutoDestroy;

          if (config.titleGetter)
            this.titleGetter = Fn(config.titleGetter);
        }

        // inherit
        return this.inherit(config);
      },

      setTitleGetter: function(titleGetter){
        var getter = Fn(titleGetter);
        if (this.titleGetter !== getter)
        {
          this.titleGetter = Fn(titleGetter);
          this.dispatch('update', this, this.info, this.info, {});
        }
      },

     /**
      * @inheritDoc
      */
      appendChild: function(newChild){
        return this.insertBefore(newChild);
      },
      insertBefore: function(newChild, refChild){
        var pos = refChild ? this.childNodes.indexOf(refChild) : -1;

        if (pos == -1)
          this.childNodes.push(newChild);
        else
          this.childNodes.splice(pos, 0, newChild);

        this.firstChild = this.childNodes[0];
        this.lastChild = this.childNodes.last();
        newChild.groupNode = this;

        this.dispatch('childNodesModified', this, { inserted: [{ pos: pos == -1 ? this.childNodes.length - 1 : pos, node: newChild }] });

        return newChild;
      },
      removeChild: function(oldChild){
        var pos = this.childNodes.indexOf(oldChild);
        if (pos != -1)
        {
          this.childNodes.splice(pos, 1);
          this.firstChild = this.childNodes[0] || null;
          this.lastChild = this.childNodes.last() || null;
          oldChild.groupNode = null;

          this.dispatch('childNodesModified', this, { deleted: [{ pos: pos, node: oldChild }] });
        }

        if (!this.firstChild && this.emptyAutoDestroy)
          this.destroy();

        return oldChild;
      },
      clear: function(alive){
        // if node haven't childs nothing to do (event don't fire)
        if (!this.firstChild)
          return;

        // delete all nodes from partition
        for (var i = 0, node; node = this.childNodes[i]; i++)
          node.groupNode = null;

        // store childNodes
        var childNodes = Array.from(this.childNodes);

        // update childNodes & pointers
        this.childNodes.clear();
        this.firstChild = this.lastChild = null;

        this.dispatch('childNodesModified', this, { deleted: childNodes.map(function(node, pos){ return { pos: pos, node: node } }).reverse() });

        // destroy partition if necessary
        if (this.emptyAutoDestroy)
          this.destroy();
      }
    });

   /**
    * @class InteractiveNode
    * @extends AbstractNode
    */
    var InteractiveNode = Class(AbstractNode, {
      className: namespace + '.InteractiveNode',

     /**
      * Indicate could be able node to be selected or not.
      * @type {boolean}
      * @readonly
      */
      selectable: true,

     /**
      * Indicate node is selected.
      * @type {boolean}
      * @readonly
      */
      selected: false,

     /**
      * Set of selected child nodes.
      * @type {Basis.DOM.Wrapers.Selection}
      */
      selection: null,

     /**
      * @type {boolean}
      */
      matched: true,

     /**
      * Indicate node is disabled. Use isDisabled method to determine disabled 
      * node state instead of check for this property value (ancestor nodes may
      * be disabled and current node will be disabled too, but node disabled property
      * could has false value).
      * @type {boolean}
      * @readonly
      */
      disabled: false,

     /**
      * @param {Object} config
      * @config {Basis.DOM.Wrapers.Selection} selection Set Selection control for child nodes.
      * @config {boolean} selectable Initial value for selectable property.
      * @config {boolean} disabled Initial value for disabled property. If true 'disable' event will fired.
      * @config {boolean} selected Initial value for selected property. If true 'select' event will fired.
      * @constructor
      */
      init: function(config){
        // apply config
        if (typeof config == 'object')
        {
          if (config.selection instanceof Selection)
            this.selection = config.selection;

          if (config.selectable == false)
            this.selectable = false;
        }

        // inherit
        config = this.inherit(config);

        // synchronize node state according to config
        if (config.disabled)
          this.disable();

        if (config.selected)
          this.select(true);

        return config;
      },

     /**
      * Changes selection property of node.
      * @param {Basis.DOM.Wrapers.Selection} selection New selection value for node.
      * @return {boolean} Returns true if selection was changed.
      */
      setSelection: function(selection){
        if (this.selection == selection)
          return false;
          
        var oldSelection = this.selection;
        DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, function(node){
          if (node.selection == oldSelection)
          {
            if (node.selected)
            {
              if (oldSelection)
                oldSelection.remove(node);
              //selection && selection.add(node, true);
            }
            node.selection = selection;
          }
        });
          
        return true;
      },
      
     /**
      * Returns true if node has it's own selection.
      * @return {boolean}
      */
      hasOwnSelection: function(){
        return !!this.selection
               && (
                   !this.parentNode 
                   ||
                   (this.parentNode && this.parentNode.selection != this.selection)
                  );
      },

     /**
      * Makes node selected if possible.
      * @param {boolean} multiple
      * @return {boolean} Returns true if selected state has been changed.
      */
      select: function(multiple){
        var selected = this.selected;
        
        // here is no check for selected state, because parentNode.selection depends on it's 
        // mode may do some actions even with selected node
        if (this.parentNode && this.parentNode.selection) 
          this.parentNode.selection.add(this, !!multiple);
        else
          if (!selected && this.selectable && !this.isDisabled())
          {
            this.selected = true;
            this.dispatch('select');
          }

        return this.selected != selected;
      },

     /**
      * Makes node unselected.
      * @param {boolean} multiple
      * @return {boolean} Returns true if selected state has been changed.
      */
      unselect: function(){
        var selected = this.selected;

        if (selected)
          if (this.parentNode && this.parentNode.selection)
            this.parentNode.selection.remove(this);
          else
          {
            this.selected = false;
            this.dispatch('unselect');
          }

        return this.selected != selected;
      },


     /**
      * Makes node enabled.
      */
      enable: function(){
        if (this.disabled)
        {
          this.disabled = false;
          this.dispatch('enable');
        }
      },

     /**
      * Makes node disabled.
      */
      disable: function(){
        if (!this.disabled)
        {
          DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, function(node){
            if (node.selected)
              node.unselect();
          });
          this.disabled = true;
          this.dispatch('disable');
        }
      },

     /**
      * @return {Boolean} Return true if node or one of it's ancestor nodes are disabled.
      */
      isDisabled: function(){
        return this.disabled 
               || (this.document && this.document.disabled)
               || !!DOM.parent(this, Fn('disabled'));
      },

     /**
      * @param {function()} func
      * @return {boolean}
      */
      match: function(func){
        if (typeof func != 'function')
        {
          if (this.matched && this.underMatch)
          {
            // restore init state
            this.underMatch(this, true);
            delete this.underMatch;
          }
          else
            if (!this.matched)
            {
              this.matched = true;
              this.dispatch('match')
            }

          return true;
        }
        
        if (func(this))
        {
          // match
          this.underMatch = func;
          if (!this.matched)
          {
            this.matched = true;
            this.dispatch('match');
          }
        }
        else
        {
          // don't match
          delete this.underMatch;
          if (this.matched)
          {
            this.matched = false;
            this.dispatch('unmatch');
          }
        }
        return this.matched;
      },

     /**
      * @destructor
      */
      destroy: function(){
        if (this.hasOwnSelection())
        {
          this.selection.destroy(); // how about shared selection?
          delete this.selection;
        }

        this.unselect();
        this.inherit();
      }
    });

    /*
     *  Hierarchy handlers & methods
     */

    var HIERARCHYTOOLS_COLLECTION_HANDLERS = {

      isSubscriber: true,

      stateChanged: function(object, newState, oldState, errorText){
        this.dispatch('collectionStateChanged', object, newState, oldState, errorText);
      },

      datasetChanged: function(newValue, delta){
        var con = this.collectionOrderedNodes_;

        // console.log(delta);

        // delete nodes
        if (delta.deleted)
        {
          if (0 && con.length == delta.deleted.length && !delta.inserted)
          {
            // optimization: if all old nodes deleted -> clear childNodes
            this.clear();
            con.clear();
          }
          else
          {
            for (var i = 0, item; item = delta.deleted[i]; i++)
            {
              var node = con.splice(item.pos, 1)[0];
              this.removeChild(node);
              node.destroy();
            }
          }
        }

        // insert new nodes
        if (delta.inserted)
        {
          for (var i = 0, item; item = delta.inserted[i]; i++)
          {
            var node = this.insertBefore(item.info, con[item.pos]);
            con.splice(item.pos, 0, node);
          }
        }

        // update nodes position
        if (delta.updated)
        {
          for (var i = 0, item; item = delta.updated[i]; i++)
          {
            var a = con[item.oldPos];
            var b = con[item.pos];

            if (a !== b && !this.localSorting)
            {
              con[item.oldPos] = b;
              con[item.pos] = a;

              if (!this.localGrouping || a.groupNode == b.groupNode)
              {
                var nextA = a.nextSibling;
                var nextB = b.nextSibling;

                // swap nodes
                if (nextA === b || nextB === a)
                  this.insertBefore(a, nextA === b ? nextB : b);
                else
                {
                  this.insertBefore(b, nextA);
                  this.insertBefore(a, nextB);
                }
              }
              else
              {
                var nextA = null, nextB = null;
                var s = item.pos;
                while (!nextA && ++s < con.length)
                {
                  var node = con[s];
                  if (node.groupNode == a.groupNode)
                  {
                    nextA = node;
                  }
                }

                var idx = a.groupNode.childNodes.indexOf(a);

                var s = item.oldPos;
                while (!nextB && ++s < con.length)
                {
                  var node = con[s];
                  if (node.groupNode == b.groupNode)
                  {
                    nextB = node;
                  }
                }
                this.insertBefore(a, nextA);
                this.insertBefore(b, nextB);
              }
            }
          }
        }
      },
      destroy: function(){
        //this.clear();
        this.setCollection();
      }
    };

    function fastChildNodesOrder(node, order){
      // make a copy, no override childNodes (instead of node.childNodes = order)
      node.childNodes.set(order);
      node.firstChild = order[0] || null;
      node.lastChild = order.last() || null;

      //DOM.insert(this, order);
      for (var i = order.length - 1; i >= 0; i--)
      {
        order[i].nextSibling = order[i + 1] || null;
        order[i].previousSibling = order[i - 1] || null;
        node.insertBefore(order[i], order[i].nextSibling);
      }
    }

    function fastChildNodesGroupOrder(node, order){
      for (var i = 0, child; child = order[i]; i++)
        child.groupNode.childNodes.push(child);

      order.clear();
      for (var group = node.groupControl.firstChild; group; group = group.nextSibling)
      {
        group.firstChild = group.childNodes[0] || null;
        group.lastChild = group.childNodes.last() || null;
        order.push.apply(order, group.childNodes);
        group.dispatch('childNodesModified', group, { inserted: Array.from(group.childNodes).map(function(node, pos){ return { pos: pos, node: node } }) });
      }

      return order;
    }

    var HierarchyTools = {
      // DOM default property values
      canHaveChildren: true,

     /**
      * @type {Class}
      */
      childClass: AbstractNode,

     /**
      * @type {Function}
      */
      childFactory: null,

      // position trace properties
      positionUpdateTimer_: null,
      minPosition_: 1E12,
      maxPosition_: 0,

      updatePositions_: function(pos1, pos2){
        if (this.positionDependent)
        {
          ;;;if (pos2 == -1) debugger;
          this.minPosition_ = Math.min(this.minPosition_, pos1, pos2);
          this.maxPosition_ = Math.max(this.maxPosition_, pos1, pos2);
          if (!this.positionUpdateTimer_)
          {
            this.positionUpdateTimer_ = function(){
              var len = Math.min(this.maxPosition_ + 1, this.childNodes.length);
              //console.log(self.minPosition_, len);
              //console.log('update pos');

              var gnode = this.childNodes[this.minPosition_];
              var group = gnode && gnode.groupNode;
              var gpos = this.minPosition_;
              if (group)
                gpos = group.childNodes.indexOf(gnode);

              //console.log('updatePosition: ' + self.minPosition_ + '...' + (self.minPosition_ + len - 1) );
              for (var i = this.minPosition_; i < len; i++, gpos++)
              {
                var node = this.childNodes[i];
                if (node.groupNode != group)
                {
                  gpos = 0;
                  group = node.groupNode;
                }
                node.dispatch('updatePosition', i, gpos);
              }

              delete this.minPosition_;
              delete this.maxPosition_;
              delete this.positionUpdateTimer_;
            };
            TimeEventManager.add(this, 'positionUpdateTimer_', Date.now());
          }
        }
      },

     /**
      * @inheritDoc
      */
      appendChild: function(newChild){
        return this.insertBefore(newChild);
      },

     /**
      * @inheritDoc
      */
      insertBefore: function(newChild, refChild){
        if (!this.canHaveChildren)
          throw new Error(EXCEPTION_CANT_INSERT);

        //if (!(newChild instanceof AbstractNode))
        //  throw new Error(EXCEPTION_BAD_CHILD_CLASS);
        var isChildClassInstance = newChild instanceof this.childClass;
        if (!isChildClassInstance)
        {
          var factory = this.childFactory || (this.document && this.document.childFactory);

          if (factory)
          {
            newChild = factory.call(this, newChild);
            isChildClassInstance = newChild instanceof this.childClass;
          }

          if (!newChild)
            throw new Error(EXCEPTION_NULL_CHILD);

          if (!isChildClassInstance)
            //;;;console.warn('Bad child class: ', this, newChild, this.childClass);
            throw new Error(EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (this.childClass && this.childClass.className) + ' but ' + (newChild && newChild.className) + ')');
        }

        // if refChild omit, append newChild
        //if (refChild == null)
        //  return this.appendChild(newChild);

        var pos = 0;
        var newChildValue;
        var group = null;
        if (this.localGrouping)
        {
          group = this.groupControl.getGroupNode(newChild);
          //console.log(newChild.info.pointId, group && group.info.title);

          if (newChild.parentNode == this && newChild.nextSibling == refChild && newChild.groupNode == group)
            return newChild;

          if (this.localSorting)
          {
            newChildValue = this.localSorting(newChild);
            pos = group.childNodes.binarySearchPos(newChildValue, this.localSorting, this.localSortingDesc);
            //console.log('sorting', newChildValue, group.childNodes.map(this.localSorting), group.childNodes);
          }
          else
          {
            if (refChild && refChild.groupNode === group)
              pos = group.childNodes.indexOf(refChild);
            else
              pos = //newChild.groupNode !== group ? 
                    group.childNodes.length 
                    //: group.childNodes.indexOf(newChild);
          }

          ;;;if (!this.groupControl.childNodes.has(group) && typeof console != 'undefined') console.log('miss node group in groupControl for node:', newChild);

          refChild = group.childNodes[pos];

          if (!refChild && pos >= group.childNodes.length)
            refChild = group.nextSibling && group.nextSibling.firstChild;

          if (newChild === refChild 
              || (this.localSorting && newChild.parentNode === this && newChildValue === this.localSorting(refChild)))
          {
            if (newChild.groupNode !== group)
            {
              if (newChild.groupNode)
                newChild.groupNode.removeChild(newChild);

              group.insertBefore(newChild);

              // for group position update
              pos = this.childNodes.indexOf(newChild);
              this.updatePositions_(pos, pos);
            }
            return newChild;
          }
        }
        else
          if (this.localSorting)
          {
            // if localSorting setted than insert on nessesary position is omit
            newChildValue = this.localSorting(newChild);
            pos = this.childNodes.binarySearchPos(newChildValue, this.localSorting, this.localSortingDesc);

            refChild = this.childNodes[pos];

            if (newChild === refChild
                || (refChild && newChild.parentNode === this && newChildValue === this.localSorting(refChild)))
              return newChild;
          }
          else
          {
            // refChild isn't child of current node
            if (refChild && refChild.parentNode !== this)
              throw new Error(EXCEPTION_NODE_NOT_FOUND);

            // some optimizations and checks
            if (newChild.parentNode === this)
            {
              // already on necessary position
              if (newChild.nextSibling === refChild)
                return newChild;

              if (newChild === refChild)
                throw new Error(EXCEPTION_CANT_INSERT);
            }
            else
              if (newChild.firstChild
            	  && DOM.axis(this, DOM.AXIS_ANCESTOR_OR_SELF).has(newChild))
                throw new Error(EXCEPTION_CANT_INSERT);
          }

        // unlink from old parent/position
        var moveMode = false;
        var prevPosition = -1;

        // newChild.parentNode.removeChild(newNode);
        if (newChild.parentNode === this)
        {
          // if parentNode not changing emulate removeChild (no events, speed benefits)
          moveMode = true;

          // update nextSibling/lastChild
          if (newChild.nextSibling)
            newChild.nextSibling.previousSibling = newChild.previousSibling;
          else
            this.lastChild = newChild.previousSibling;

          // update previousSibling/firstChild
          if (newChild.previousSibling) 
            newChild.previousSibling.nextSibling = newChild.nextSibling;      
          else
            this.firstChild = newChild.nextSibling;

          newChild.nextSibling = null;
          newChild.previousSibling = null;

          prevPosition = this.childNodes.indexOf(newChild);
          this.childNodes.splice(prevPosition, 1);

          // remove from old group (always remove for correct order)
          if (newChild.groupNode)
            newChild.groupNode.removeChild(newChild);
        }
        else
        {
          if (newChild.parentNode)
            newChild.parentNode.removeChild(newChild);
        }
        
        // insert
        var pos = refChild
              ? this.childNodes.indexOf(refChild)
              : this.childNodes.length;
        if (pos == -1)
          throw new Error(EXCEPTION_NODE_NOT_FOUND);

        // update childNodes
        this.childNodes.splice(pos, 0, newChild);
        this.updatePositions_(pos, prevPosition == -1 ? this.childNodes.length - 1 : prevPosition + (pos < prevPosition));

        // add to group
        if (newChild.groupNode != group)
          group.insertBefore(newChild, refChild);

        if (!refChild) 
        {
          refChild = {
            previousSibling: this.lastChild
          };
          this.lastChild = newChild;
        }
        else
          newChild.nextSibling = refChild;

        // update newChild
        newChild.parentNode = this;
        //newChild.document = this.document;
        newChild.previousSibling = refChild.previousSibling;

        // not need update this.lastChild, insert always before some node
        // if insert into begins
        if (pos == 0)
          this.firstChild = newChild;
        else
        {
          //if (!refChild.previousSibling) debugger;
          refChild.previousSibling.nextSibling = newChild;
        }

        // update refChild
        refChild.previousSibling = newChild;

        // update document & selection
        var updateDocument = false;
        var updateSelection = false;

        if (!newChild.document && newChild.document !== this.document)
        {
          updateDocument = true;
          newChild.document = this.document;
        }

        if (!newChild.selection && newChild.selection !== this.selection)
        {
          updateSelection = true;
          newChild.selection = this.selection;
          if (newChild.selected)
            newChild.selection.add(newChild, true);
        }

        if (newChild.firstChild && (updateDocument || updateSelection))
          DOM.axis(newChild, DOM.AXIS_DESCENDANT).forEach(function(node){
            if (updateDocument && !node.document)
              node.document = this.document;

            if (updateSelection && !node.selection)
            {
              if ((node.selection = this.selection) && node.selected)
                node.selection.add(node, true);
            }
          }, newChild);

        // dispatch event
        /*
        if (moveMode)
          this.dispatch('childMoved', newChild);
        else
          this.dispatch('childInserted', newChild);
        */

        //if (this.matchFunction)
        if (newChild.match)
          newChild.match(this.matchFunction);

        var changesInfo = [{ pos: pos, node: newChild, oldPos: prevPosition }];
        //if (moveMode)
        //  changesInfo.oldPos = prevPosition;

        this.dispatch('childNodesModified', this, moveMode ? { updated: changesInfo } : { inserted: changesInfo });

        if (newChild.autoDelegateParent)
          newChild.setDelegate(this);

        // return newChild
        return newChild;
      },

     /**
      * @inheritDoc
      */
      removeChild: function(oldChild){
        if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
          throw new Error(EXCEPTION_NODE_NOT_FOUND);

        if (!(oldChild instanceof this.childClass))
          throw new Error(EXCEPTION_BAD_CHILD_CLASS);

        // update this
        var pos = this.childNodes.indexOf(oldChild);
        this.childNodes.splice(pos, 1);
        this.updatePositions_(pos, this.firstChild == this.lastChild ? 0 : this.childNodes.length - 1);
          
        // update oldChild and this.lastChild & this.firstChild
        oldChild.parentNode = null;

        // update document & selection
        var updateDocument = oldChild.document === this.document;
        var updateSelection = oldChild.selection === this.selection;

        if (oldChild.firstChild && (updateDocument || updateSelection))
          DOM.axis(oldChild, DOM.AXIS_DESCENDANT).forEach(function(node){
            if (updateDocument && node.document == this.document)
              node.document = null;

            if (updateSelection && node.selection == this.selection)
            {
              if (node.selected)
                node.selection.remove(node);
              node.selection = null;
            }
          }, oldChild);

        if (updateDocument)
          oldChild.document = null;

        if (updateSelection)
        {
          if (oldChild.selected)
            oldChild.selection.remove(oldChild);
          oldChild.selection = null;
        }

        // update nextSibling/lastChild
        if (oldChild.nextSibling)
          oldChild.nextSibling.previousSibling = oldChild.previousSibling;
        else
          this.lastChild = oldChild.previousSibling;

        // update previousSibling/firstChild
        if (oldChild.previousSibling) 
          oldChild.previousSibling.nextSibling = oldChild.nextSibling;      
        else
          this.firstChild = oldChild.nextSibling;
          
        oldChild.nextSibling = null;
        oldChild.previousSibling = null;

        if (oldChild.groupNode)
          oldChild.groupNode.removeChild(oldChild);

        // dispatch event
        this.dispatch('childNodesModified', this, { deleted: [{ pos: pos, node: oldChild }] });

        if (oldChild.autoDelegateParent)
          oldChild.setDelegate();

        // return removed child
        return oldChild;
      },

     /**
      * @inheritDoc
      */
      replaceChild: function(newChild, oldChild){
        if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
          throw new Error(EXCEPTION_NODE_NOT_FOUND);

        // insert newChild before oldChild
        this.insertBefore(newChild, oldChild);
        // remove oldChild
        return this.removeChild(oldChild);
      },

     /**
      * @inheritDoc
      */
      clear: function(alive){
        // if node haven't childs nothing to do (event don't fire)
        if (!this.firstChild)
          return;

        // store childs
        var childNodes = Array.from(this.childNodes);

        // remove all childs
        this.firstChild = null;
        this.lastChild = null;
        this.childNodes.clear();

        // dispatch event
        // NOTE: important dispatch event before nodes remove/destroy, because listeners may analize removing nodes
        this.dispatch('childNodesModified', this, { deleted: childNodes.map(function(node, pos){ return { pos: pos, node: node } }).reverse() });

        while (childNodes.length)
        {
          var child = childNodes.pop();

          child.parentNode = null;
          child.groupNode = null;
          //?if (child.firstChild)  // improve perfomace
          if (child.selection || child.document)
            DOM.axis(child, DOM.AXIS_DESCENDANT_OR_SELF).forEach(function(node){
              //node.unselect();
              if (this.selection && node.selection === this.selection)
              {
                if (node.selected)
                  node.selection.remove(node);
                node.selection = null;
              }
              if (node.document === this.document)
                node.document = null;
            }, this);

          if (alive)
          {
            //child.unselect();
            //child.document = null;
            child.nextSibling = null;
            child.previousSibling = null;

            if (child.autoDelegateParent)
              child.setDelegate();
          }
          else
            child.destroy();
        }
        //alert(this.selection);
        if (this.groupControl)
        {
          var cn = this.groupControl.childNodes;
          for (var i = cn.length - 1, group; group = cn[i]; i--)
            group.clear(alive);
        }
      },

     /**
      * @params {Array.<Object>} childNodes
      */
      setChildNodes: function(childNodes, keepAlive){
        this.clear(!!keepAlive);

        if (childNodes)
        {
          if ('length' in childNodes == false) // we don't use Array.from here because we don't need make a copy of array
            childNodes = [childNodes];

          if (childNodes.length)
          {
            // switch off dispatch
            this.dispatch = Function.$undef;

            // insert nodes
            for (var i = 0; i < childNodes.length; i++)
              this.insertBefore(childNodes[i]);

            // restore event dispatch & dispatch changes event
            delete this.dispatch;
            this.dispatch('childNodesModified', this, { inserted: this.childNodes.map(function(node, index){ return { node: node, pos: index } }) });
          }
        }

        // returns childNodes
        return this.childNodes;
      },

     /**
      * @inheritDoc
      */
      setCollection: function(collection){
      	if (this.collection !== collection)
      	{
      	  var oldCollection = this.collection;
      	  var oldCollectionState = STATE_UNDEFINED;
      	  var oldCollectionErrorText;
      	  var newCollectionState = STATE_UNDEFINED;
      	  var newCollectionErrorText;

      	  // detach
          if (this.collection)
          {
        	  oldCollectionState = this.collection.state;
        	  oldCollectionErrorText = this.collection.errorText;

            this.collection.removeHandler(HIERARCHYTOOLS_COLLECTION_HANDLERS, this);

            if (this.childNodes.length == this.collectionOrderedNodes_.length)
              this.clear();
            else
            {
              for (var i = this.collectionOrderedNodes_.length - 1; i >= 0; i--)
                this.collectionOrderedNodes_[i].destroy();
            }

            delete this.collection;
            delete this.collectionOrderedNodes_;

            //this.clear();
          }

          // TODO: switch off localSorting & localGrouping

          // attach
          if (collection && this.canHaveChildren && collection instanceof DataObject)
          {
            this.collection = collection;
            this.collection.addHandler(HIERARCHYTOOLS_COLLECTION_HANDLERS, this);

            var collectionOrder = DOM.insert(this, this.collection.value);

            this.collectionOrderedNodes_ = [];
            this.collectionOrderedNodes_.push.apply(this.collectionOrderedNodes_, collectionOrder);

        	  newCollectionState = this.collection.state;
        	  newCollectionErrorText = this.collection.errorText;
          }

          // TODO: restore localSorting & localGrouping, fast node reorder

          this.dispatch('collectionChanged', this, oldCollection);
          if (oldCollectionState != newCollectionState || oldCollectionErrorText != newCollectionErrorText)
            this.dispatch('collectionStateChanged', this.collection, newCollectionState, oldCollectionState, oldCollectionErrorText);
        }
      },

     /**
      * @inheritDoc
      */
      setLocalGrouping: function(grouping){
        var isLocalGroupingChanged = false;
        var order;
        if (!grouping)
        {
          if (this.groupControl)
          {
            this.localGrouping = null;

            this.groupControl.destroy();
            delete this.groupControl;

            if (this.firstChild)
            {
              if (!this.localSorting)
                order = this.collection ? this.collectionOrderedNodes_ : this.childNodes;
              else
                order = this.childNodes.sortAsObject(this.localSorting, null, this.localSortingDesc);

              for (var i = 0; i < order.length; i++)
                order[i].groupNode = null;

              fastChildNodesOrder(this, order);
            }

            isLocalGroupingChanged = true;
          }
        }
        else
        {
          var getterOnly = typeof grouping == 'function' || typeof grouping == 'string';
          var groupGetter = Fn(getterOnly ? grouping : grouping.groupGetter);
          var config = getterOnly ? null : grouping;

          if (groupGetter && (!this.groupControl || this.groupControl.groupGetter !== groupGetter))
          {
            this.localGrouping = grouping;

            // create new group control if not exists
            if (!this.groupControl)
              this.groupControl = new (this.groupControlClass || GroupControl)({
                groupControlHolder: this,
                groupEmptyAutoDestroy: config ? config.groupEmptyAutoDestroy : undefined
              });
            else
              this.groupControl.clear();

            if (config)
            {
              this.groupControl.setLocalSorting(
                'localSorting' in config ? config.localSorting : this.groupControl.localSorting,
                'localSortingDesc' in config ? config.localSortingDesc : this.groupControl.localSortingDesc
              );

              if (config.titleGetter)
                this.groupControl.setTitleGetter(config.titleGetter);
            }

            this.groupControl.groupGetter = groupGetter;

            // if there is child nodes - reorder it
            if (this.firstChild)
            {
              // new order
              if (!this.localSorting)
                order = this.collection ? this.collectionOrderedNodes_ : this.childNodes;
              else
                order = this.childNodes.sortAsObject(this.localSorting, null, this.localSortingDesc);

              // split nodes by new groups
              for (var i = 0, child; child = order[i]; i++)
                child.groupNode = this.groupControl.getGroupNode(child);

              // fill groups
              fastChildNodesGroupOrder(this, order);

              // apply new order
              fastChildNodesOrder(this, order);
            }

            isLocalGroupingChanged = true;
          }
          else
          {
            if (config && this.groupControl)
            {
              // update group control settings
              this.groupControl.setLocalSorting(
                'localSorting' in config ? config.localSorting : this.groupControl.localSorting,
                'localSortingDesc' in config ? config.localSortingDesc : this.groupControl.localSortingDesc
              );

              if (config.titleGetter)
                this.groupControl.setTitleGetter(config.titleGetter);
              
              isLocalGroupingChanged = true;
            }
          }
        }

        if (isLocalGroupingChanged)
          this.dispatch('localGroupingChanged', this);
      },

     /**
      * @inheritDoc
      */
      setLocalSorting: function(sorting, desc){
        if (sorting)
          sorting = Fn(sorting);

        // TODO: fix when direction changes only
        //console.log(this.localSorting, sorting, this.localSorting != sorting);
        if (this.localSorting != sorting || this.localSortingDesc != !!desc)
        {
          var order;
          this.localSortingDesc = !!desc;

          if (!sorting)
          {
            this.localSorting = null;

            if (this.collection)
            {
              // if collection assigned, restore collection item order
              order = this.collectionOrderedNodes_;

              // sort child nodes according to groups disposition
              if (this.localGrouping)
              {
                for (var group = this.groupControl.firstChild; group; group = group.nextSibling)
                  group.childNodes.clear();

                fastChildNodesGroupOrder(this, order);
              }

              // apply new order
              fastChildNodesOrder(this, order);
            }
          }
          else
          {
            this.localSorting = sorting;

            // reorder nodes only if child nodes exists
            if (this.firstChild)
            {
              // Probably strange and dirty solution, but faster (up to 2-5 times).
              // Low dependence of node shuffling. Total permutation count equals to permutation
              // count of top level elements (if used). No events dispatching (time benefits).
              // Sorting time of wrapers (AbstractNodes) equals N*log(N) + N (reference update).
              // NOTE: Nodes selected state will remain (sometimes it can be important)
              if (this.localGrouping)
              {
                order = [];
                for (var group = this.groupControl.firstChild; group; group = group.nextSibling)
                {
                  // make a copy, no override childNodes
                  group.childNodes.set(group.childNodes.sortAsObject(this.localSorting, null, this.localSortingDesc));
                  group.firstChild = group.childNodes[0] || null;
                  group.lastChild = group.childNodes.last() || null;
                  order.push.apply(order, group.childNodes);
                }
              }
              else 
                order = this.childNodes.sortAsObject(this.localSorting, null, this.localSortingDesc);

              // apply new order
              fastChildNodesOrder(this, order);

              // update position dependent nodes
              // console.log('setSorting updatePosition: 0...' + this.childNodes.length);
              clearTimeout(this.positionUpdateTimer_);
              delete this.positionUpdateTimer_;
              if (this.positionDependent)
              {
                var len = this.childNodes.length;
                var group = this.firstChild && this.firstChild.groupNode;
                for (var i = 0, gpos = 0; i < len; i++, gpos++)
                {
                  var node = this.childNodes[i];
                  if (node.groupNode != group)
                  {
                    gpos = 0;
                    group = node.groupNode;
                  }
                  node.dispatch('updatePosition', i, gpos);
                }
              }
            }
          }

          this.dispatch('localSortingChanged', this);
        }
      },

     /**
      * @inheritDoc
      */
      setMatchFunction: function(matchFunction){
        if (this.matchFunction != matchFunction)
        {
          this.matchFunction = matchFunction;
          for (var node = this.lastChild; node; node = node.previousSibling)
            node.match(matchFunction);
        }
      }
    };

   /**
    * @class Node
    * @extends InteractiveNode
    */
    var Node = Class(InteractiveNode, HierarchyTools, {
      className: namespace + '.Node',

     /**
      * @param {Object} config
      * @config {function()} childFactory Override prototype's childFactory property.
      */
      init: function(config){
        if (config && typeof config.childFactory == 'function')
          this.childFactory = config.childFactory;
        
        return this.inherit(config);
      }

      //
      // destructor
      //

      /* there is no destructor */
    });

   /**
    * @class GroupControl
    */
    var GroupControl = Class(AbstractNode, HierarchyTools, {
      className: namespace + '.GroupControl',

      groupById: {},
      groupByEventObject: {},

      groupEmptyAutoDestroy: true,
      groupTitleGetter: Fn('info.title'),

      childClass: PartitionNode,
      childFactory: function(config){
        return this.getGroupNode(config);
      },

      behaviour: createBehaviour(AbstractNode, {
        localSortingChanged: function(){
          //console.log('lsChanged');
        }
      }),

      init: function(config){
        config = this.inherit(config);

        this.groupById = {};
        this.groupByEventObject = {};

        if (typeof config.groupEmptyAutoDestroy != 'undefined')
          this.groupEmptyAutoDestroy = !!config.groupEmptyAutoDestroy;

        return config;
      },

      setTitleGetter: function(titleGetter){
        this.groupTitleGetter = Fn(titleGetter);

        for (var group = this.firstChild; group; group = group.nextSibling)
          group.setTitleGetter(this.groupTitleGetter);
      },

      createGroupNode: function(info, emptyAutoDestroy){
        var isDelegate = info instanceof EventObject;

        var group = this.appendChild(new this.childClass({
          titleGetter: this.groupTitleGetter,
          emptyAutoDestroy: arguments.length > 1 ? !!emptyAutoDestroy : this.groupEmptyAutoDestroy,
          info: isDelegate ? info : { id: info, title: info }
        }));

        if (isDelegate)
        {
          group._eoid = info.eventObjectId;
          this.groupByEventObject[info.eventObjectId] = group;
        }
        else
        {
          group._id = info;
          this.groupById[info] = group;
        }

        return group;
      },
      getGroupNode: function(node){
        var id = this.groupGetter(node);
        var group = id instanceof EventObject ? this.groupByEventObject[id.eventObjectId] : this.groupById[id];

        return group || this.createGroupNode(id);
      },

      removeChild: function(oldChild){
        if (this.inherit(oldChild))
        {
          if (oldChild._eoid)
            delete this.groupByEventObject[oldChild._eoid];
          else
            delete this.groupById[oldChild._id];

          return oldChild;
        }
      },

      clear: function(alive){
        this.groupById = {};
        this.groupByEventObject = {};
        this.inherit();
      }
    });

    //
    // HTML reflections
    //

   /**
    * @class HtmlNode
    * @extends Node
    */
    var HtmlNode = Class(Node, {
      className: namespace + '.HtmlNode',

      behaviour: createBehaviour(Node, {
        select:   function(){ cssClass(this.selectedElement || this.content || this.element).add('selected') },
        unselect: function(){ cssClass(this.selectedElement || this.content || this.element).remove('selected') },
        disable:  function(){ cssClass(this.disabledElement || this.element).add('disabled') },
        enable:   function(){ cssClass(this.disabledElement || this.element).remove('disabled') },
        match:    function(){ DOM.display(this.element, true) },
        unmatch:  function(){ DOM.display(this.element, false) }
      }),

      // childFactory: null,

      // reassigned bellow
      childClass: HtmlNode,
      groupControlClass: HtmlGroupControl,

     /**
      * Template for object.
      * @type {Basis.Html.Template}
      */
      template: null,

     /**
      * @type {Object}
      */
      cssClassName: {},

     /**
      * @param {Object} config
      * @config {Basis.Html.Template} template Override prototype's template with custom template.
      * @config {Object|string} cssClassName Set of CSS classes for parts of HTML structure.
      * @config {Node} container Specify HTML element that will be a container of root HTML element (node.element).
      * @config {string} id Id for root HTML element (node.element).
      * @constructor
      */
      init: function(config){
        if (config && config.template)
          this.template = config.template;

        // create html structure by template
        if (this.template)
          this.template.createInstance(this);

        // inherit init
        config = this.inherit(config);

        var cssClassNames = config.cssClassName;
        if (cssClassNames)
        {
          if (typeof cssClassNames == 'string')
            cssClassNames = { element: cssClassNames };

          for (var alias in cssClassNames)
          {
            var node = this[alias];
            if (node)
            {
              var nodeClassName = cssClass(node);
              nodeClassName.add.apply(nodeClassName, String(cssClassNames[alias]).qw());
            }
          }
        }

        if (this.element)
        {
          ;;;this.element.setAttribute('_e', this.eventObjectId)
          this.element[HTML_EVENT_OBJECT_ID_HOLDER] = this.eventObjectId;
          
          if (config.id)
            this.element.id = config.id;
        }

        // add to container
        if (config.container)
          DOM.insert(config.container, this.element);

        // apply changes
        /*this.dispatch('update', this, this.info, {}, this.info);
        if (this.state == this.constructor.prototype.state)
          this.dispatch('stateChanged', this, this.state, undefined, this.errorText);*/
        
        return config;
      },

     /**
      * @inheritDoc
      */
      insertBefore: function(newChild, refChild){
        if (newChild = this.inherit(newChild, refChild))
        { 
          if (this == newChild.parentNode)
          {
            var container = newChild.groupNode;

            if (!container || !container.childNodesElement)
              container = this;

            var insertPoint = container.lastChild != newChild ? newChild.nextSibling.element : null;

            container.childNodesElement.insertBefore(newChild.element, insertPoint);
          }
          
          return newChild;
        }
      },

      removeChild: function(oldChild){
        if (this.inherit(oldChild))
        {
          // this.childNodesElement.removeChild(oldChild.element);
          var element = oldChild.element;
          var parent = element.parentNode;
          if (parent)
            parent.removeChild(element);
          return oldChild;
        }
      },
      // TODO: fix method. make it sensetive for alive and fix bug with setChildNodes(ar, true)
      clear: function(alive){
        // remove and destroy nodes
        //DOM.clear(this.childNodesElement);
        /*if (1 || !alive)
        {
          var i = this.childNodes.length;
          var node;
          while (i--)
          {
            node = this.childNodes[i];
            if (this.childNodesElement == node.element.parentNode)
              this.childNodesElement.removeChild(node.element);
          }
        }*/

        if (alive)
        {
          //debugger;
          var i = this.childNodes.length;
          var node;
          while (node = this.childNodes[--i])
            DOM.remove(node.element);
        }

        this.inherit(alive);
      },
      setChildNodes: function(childNodes, keepAlive){
        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.groupControl || this;
        var container = target.childNodesElement;
        target.childNodesElement = domFragment;
        
        // call inherited method
        // NOTE: make sure that dispatching childNodesModified event handlers are not sensetive
        // for child node positions at real DOM (html document), because all new child nodes
        // will be inserted into temporary DocumentFragment that will be inserted into html document
        // later (after inherited method call)
        this.inherit(childNodes, keepAlive);

        // restore childNodesElement
        container.appendChild(domFragment);
        target.childNodesElement = container;

        return this.childNodes;
      },

      addEventListener: function(eventName, dispatchEvent, donotKill){
        dispatchEvent = dispatchEvent || eventName;
        Event.addHandler(this.element, eventName, function(event){ 
          var node = this.getNodeByEventSender(event);          
          
          if (node)
            node.dispatch(dispatchEvent, event);
            
          this.dispatch(dispatchEvent, event, node);
          
          if (!donotKill)
            Event.kill(event);
        }, this);
      },
      getNodeByEventSender: function(event){
        var sender = Event.sender(event);
        var htmlNode = sender[HTML_EVENT_OBJECT_ID_HOLDER] ? sender : DOM.parent(sender, Fn(HTML_EVENT_OBJECT_ID_HOLDER), 0, this.element);
        if (htmlNode)
        {
          var node = eventObjectMap[htmlNode[HTML_EVENT_OBJECT_ID_HOLDER]];
          if (node && node.document == this)
            return node;
        }
      },

      destroy: function(){
        this.inherit();

        if (this.element)
        {
          Event.clearHandlers(this.element);
          DOM.remove(this.element);
        }

        if (this.template)
        {
          this.template.clearInstance(this);
          delete this.selectedElement;
          delete this.disabledElement;
        }
        else
        {
          // maybe remove after refactoring
          delete this.element;
          delete this.content;
          delete this.childNodesElement;
        }
      }
    });

   /**
    * @class HtmlPartitionNode
    */
    var HtmlPartitionNode = Class(PartitionNode, HtmlNode).extend({
      className: namespace + '.HtmlPartitionNode',

      template: new Template(
        '<div{element} class="Basis-PartitionNode">' + 
          '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
          '<div{content|childNodesElement} class="Basis-PartitionNode-Content"></div>' + 
        '</div>'
      ),

      behaviour: createBehaviour(PartitionNode, {
        update: function(object, newInfo, oldInfo, delta){
          this.inherit(object, newInfo, oldInfo, delta);

          if (this.titleText)
            this.titleText.nodeValue = this.titleGetter(this);
        }
      }),

      clear: PartitionNode.prototype.clear
    });

   /**
    * @class HtmlGroupControl
    */
    var HtmlGroupControl = Class(GroupControl, HtmlNode).extend({
      className: namespace + '.HtmlGroupControl',

      behaviour: createBehaviour(HtmlNode, GroupControl.prototype.behaviour),

      childClass: HtmlPartitionNode,
      childFactory: function(config){
        var gg = this.groupGetter;
        this.groupGetter = Function.$self;
        var group = this.getGroupNode(config);
        this.groupGetter = gg;
        return group;
      },

      init: function(config){
        config = this.inherit(config);

        if (config.groupControlHolder)
        {
          //this.parentNode = config.groupControlHolder;
          //this.childNodesElement = this.parentNode.groupsElement;
          this.childNodesElement = config.groupControlHolder.groupsElement || config.groupControlHolder.childNodesElement;
          this.document = config.groupControlHolder;
        }

        return config;
      },
      clear: function(membersAlive){
        var groups = Array.from(this.childNodes);
        while (groups.length)
        {
          var group = groups.pop();
          group.clear(membersAlive);
          group.destroy();
        }
      },
      destroy: function(){
        this.inherit();
        delete this.childNodesElement;
      }
    });

    // links to preinited values
    HtmlNode.prototype.childClass = HtmlNode;
    HtmlNode.prototype.groupControlClass = HtmlGroupControl;
    
    //
    // Some simple components
    //
    
   /**
    * @class HtmlPanel
    */
    var HtmlPanel = Class(HtmlNode, {
      className: namespace + '.HtmlPanel',

      template: new Template(
        '<div{element|content}></div>'
      ),

      init: function(config){
        if (config && (typeof config != 'object' || !isNaN(config.nodeType)))
          config = { content: config };

        config = this.inherit(config);

        if (config.content)
          DOM.insert(this.content, config.content);

        return config;
      }
    });
    
   /**
    * @class HtmlList
    */
    var HtmlContainer = Class(HtmlPanel, {
      className: namespace + '.HtmlContainer',

      childClass: HtmlNode,
      childFactory: function(config){
        return new (this.childClass === HtmlNode ? HtmlPanel : this.childClass)(config);
      },
      template: new Template(
        '<div{element|content|childNodesElement}></div>'
      )
    });

    //
    // CONTROL
    //

   /**
    * @class Control
    */
    var Control = Class(HtmlNode, {
      className: namespace + '.Control',

      // set default childFactory
      childFactory: function(config){
        return new this.childClass(config);
      },

     /**
      * @param {Object} config
      * @config {Object|boolean|Basis.DOM.Wrapers.Selection} selection
      * @constructor
      */
      init: function(config){
        config = extend({}, config);

        // add selection object
        if ('selection' in config == false)
          config.selection = {};

        if (config.selection)
        {
          if (config.selection instanceof Selection)
            this.selection = config.selection;
          else
            this.selection = new Selection(config.selection);
        }

        // make document link to itself
        // NOTE: we make it before inherit because in other way
        //       child nodes (passed by config.childNodes) will be with no document
        this.document = this;

        // inherit
        config = this.inherit(config);
                     
        // add to Basis.Cleaner
        Cleaner.add(this);

        // return config
        return config;
      },

     /**
      * Add to selection list all selectable descendant nodes.
      */
      select: function(){
      	// select all child nodes?
        //DOM.axis(this, DOM.AXIS_DESCENDANT).forEach(function(node){ node.select(true) });
      },

     /**
      * Remove all nodes from selection.
      */
      unselect: function(){
        if (this.selection)
          this.selection.clear();
      },

     /**
      * @inheritDoc
      */
      disable: function(){
        if (!this.disabled)
        {
          //this.selection.clear();
          this.disabled = true;
          this.dispatch('disable');
        }
      },

      destroy: function(){
        // selection destroy - clean selected nodes
        if (this.selection)
        {
          this.selection.destroy(); // how about shared selection?
          delete this.selection;
        }

        // inherit destroy, must be calling after inner objects destroyed
        this.inherit();

        // unlink from Cleaner
        Cleaner.remove(this);
      }
    });

    //
    // SELECTION
    //

    function selectionFireUpdate(){
      clearTimeout(this._fireTimer);
      delete this._fireTimer;
      this.dispatch('change', this);
    }

    function prepareSelectionForUpdate(){
      if (!this._fireTimer)
        this._fireTimer = setTimeout(selectionFireUpdate.bind(this), 0);
    }

   /**
    * @link ./demo/selection/share.html
    * @link ./demo/selection/multiple.html
    * @class
    */
    var Selection = Class(EventObject, {
      className: namespace + '.Selection',

     /**
      * Could selection store more than one node or not.
      * @type {boolean}
      * @readonly
      */
      multiple: false,

     /**
      * Indicate that this selection not able to add new nodes to node list.
      * @type {boolean}
      * @readonly
      */
      disabled: false,

     /**
      * A node list.
      * @type {Array.<Basis.DOM.Wrapers.InteractiveNode>}
      * @readonly
      */
      items: [],

     /**
      * @param {Object} config
      * @config {boolean} multiple Set multiple mode for selection (more than one node cen be selected).
      * @constructor
      */
      init: function(config){
        this.inherit(config);

        this.items = new Array();

        if (config instanceof Object)
        {
          if (config.multiple)
            this.multiple = !!config.multiple;
        }

        Cleaner.add(this);
      },

     /**
      * Method that add new node to selection. Adding node must be selectable and isn't disabled.
      * Otherwise nothing happens. If node has already selected than nothing happens.
      * @param {Basis.DOM.Wrapers.InteractiveNode} node Node that will be added to selection items.
      * @param {boolean} multiple Determine addiction mode.
      * @return {Basis.DOM.Wrapers.InteractiveNode} Returns added node.
      */
      add: function(node, multiple){
        if (!this.disabled && node instanceof InteractiveNode && node.selectable && !node.isDisabled())
        {
          // check for multiple mode
          if (!multiple)
          {
            // if item already in selection than nothing to do and return node reference
            if (this.has(node) && this.items.length == 1)
              return node;

            // otherwise remove all old items from selection, and continue
            this.clear(true);
          }
          else
          {
            // if item already in selection, remove it from selection and return node reference
            if (this.has(node))
              return this.remove(node);

            // if selection not allow multiple, than remove all old items from selection
            if (!this.multiple)
              this.clear(true);
          }

          // add new node to selection
          this.items.push(node);

          // mark node as selected
          node.selected = true;

          // fire events
          node.dispatch('select');
          prepareSelectionForUpdate.call(this);

          // return node reference
          return node;
        }
      },

     /**
      * @param {Basis.DOM.Wrapers.InteractiveNode} node Node that will be removed from selection items.
      * @return {Basis.DOM.Wrapers.InteractiveNode} Returns removed node.
      */
      remove: function(node){
        if (node instanceof InteractiveNode)
        {
          // remove item from selection
          if (this.items.remove(node))
          {
            // remove selected mark from node
            node.selected = false;

            // fire events
            node.dispatch('unselect');
            prepareSelectionForUpdate.call(this);

            // return node reference
            return node;
          }
        }
      },
     /**
      * @param {Basis.DOM.Wrapers.InteractiveNode} node Node that will be removed from selection items.
      * @return {boolean} Returns true if node in selection.
      */
      has: function(node){
        return this.items.has(node);
      },

     /**
      * Removes all nodes from selection.
      * @param {boolean} silent If true no event fires.
      */
      clear: function(silent){
        this.items.forEach(function(node){
          node.selected = false;
          node.dispatch('unselect');
        });
        
        this.items.clear();
        
        if (!silent)
          prepareSelectionForUpdate.call(this);
      },

     /**
      * @destructor
      */
      destroy: function(){
        // clear items
        this.clear(true);

        // inherit destroy method
        this.inherit();

        // clear items
        delete this.items;

        // remove from cleaner
        Cleaner.remove(this);
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

      // tools
      HierarchyTools: HierarchyTools,

      // functions 
      createBehaviour: createBehaviour,

      // classes
      EventObject: EventObject,
      DataObject: DataObject,
      DataObjectSet: DataObjectSet,
      AbstractProperty: AbstractProperty,
      Property: Property,
      PropertySet: DataObjectSet,
      AbstractNode: AbstractNode,
      InteractiveNode: InteractiveNode,
      Node: Node,
      Selection: Selection,
      GroupControl: GroupControl,
      PartitionNode: PartitionNode,
      Control: Control,
      HtmlGroupControl: HtmlGroupControl,
      HtmlPartitionNode: HtmlPartitionNode,
      HtmlNode: HtmlNode,
      HtmlPanel: HtmlPanel,
      HtmlList: HtmlContainer,
      HtmlContainer: HtmlContainer,
      HtmlControl: Control
    });

  })();
