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
    * @namespace Basis.Publish2
    */

    var namespace = 'Basis.Publish2';

    // import names

    var Class = Basis.Class;
    var Cleaner = Basis.Cleaner;

    var EventObject = Basis.EventObject;
    var DataObject = Basis.Data.DataObject;
    var STATE = Basis.Data.STATE;

    //
    // Main part
    //

    // TODO: remove exception function

    function exception(e){
      if (typeof e == 'undefined')
        return;

      var info;
      try {
        info = (e.name ? 'Error' : e.name) + 
               (Function.$defined(e.fileName) ? ' in\n' + e.fileName : '') +
               (Function.$defined(e.lineNumber) ? '\nat line ' + e.lineNumber : '') +
               (Function.$defined(e.number) ? '\nline: ' + ((e.number >> 16) & 0x1FFF) : '');
      } catch(_e) { /*alert(_e)*/ }
      return (info ? info + '\n\n' : '') +
             (e.message || e.description || e);
    }

    //
    //  DataChunk
    //

    var DEFAULT_ERROR_TEXT = "Data load error";
    var ABORT_ERROR_TEXT = "Data loading was canceled";
    var NO_CREATE = true;

   /**
    * @class
    */
    var DataChunk = Class.create(DataObject, {
      className: namespace + '.DataChunk',

     /**
      * Count of attached subscribers.
      * @property {Number} subscriberCount
      * @private
      */
      //subscriberCount: 0,

     /**
      * When first subscriber attached and data chunk in error state, data will be auto-reload.
      * @property {Boolean} autorepair
      */
      autorepair: true,

     /**
      * @property {Boolean} disabled
      */
      disabled: false,

     /**
      * Default value for state
      * @property {String} state
      */
      state: STATE.UNDEFINED,

      behaviour: {
        subscribersChanged: function(){
          if (this.subscriberCount > 0 && (this.state == STATE.UNDEFINED || (this.state == STATE.ERROR && this.autorepair) || this.state == STATE.DEPRECATED))
            this.process();          
        }
      },

     /**
      * @method init
      * @constructs
      * @param {String} key Key of data chunk.
      * @param {Function} adapterGetter Function that returns adapter.
      */
      init: function(key, adapterGetter){
        this.inherit();

        //this.subscriberCount = 0;
        this.key = key;

        this.adapterGetter = adapterGetter;
      },

     /**
      * Retrieve data via adapter.
      * @method process
      * @param {String} processId 
      * @param {Boolean} forced If true not check conditions, just load.
      */
      process: function(processId, forced){
        if (forced || (this.subscriberCount != 0 && this.state != STATE.PROCESSING))
          if (this.adapter = (this.adapter || this.adapterGetter()))  // this.adapterGetter(processId)
            this.adapter.start(this);
      },

     /**
      * Set default state of data chunk.
      * @method reset
      */
      reset: function(){
        this.setState(STATE.UNDEFINED);
      },

     /**
      * Set data for data chunk.
      * @method set
      * @param {Any} data
      */
      set: function(data){
        this.update(data);
        this.setState(STATE.READY);
      },

     /**
      * Reload data if data chunk in error state.
      * @method repaire
      */
      repair: function(){
        if (this.state == STATE.ERROR)
        {
          this.reset();
          this.process();
        }
      },

     /**
      * Mark data chunk as deprecated. This means that's data of chunk should 
      * be reloaded when any subscriber will be attach. If currently data chunk
      * has attached subscibers data reload immediately.
      * @method deprecate
      */
      deprecate: function(){
        if (this.subscriberCount == 0)
          this.reset();
        else
        {
          if (this.state != STATE.PROCESSING)
            this.process();
        }
      },

      /*
      addHandler: function(handler, thisObject){
        if (this.inherit(handler, thisObject))
        {
          if (thisObject instanceof Subscriber)
          {
            //this.subscriberCount++;
            if (this.subscriberCount > 0 && (this.state == STATE.UNDEFINED || (this.state == STATE.ERROR && this.autorepair) || this.state == STATE.DEPRECATED))
              this.process();
          }
        }
      },

      /*
      removeHandler: function(handler, thisObject){
        if (this.inherit(handler, thisObject))
          if (thisObject instanceof Subscriber)
          {
            this.subscriberCount--;
          }
      },

      clearHandlers_: function(){
        this.inherit();
        this.subscriberCount = 0;
      },*/

     /**
      * @method destroy
      * @destructor
      */
      destroy: function(){
        // delete other links
        delete this.adapterGetter;

        // inherit
        this.inherit();
      }
    });

    //
    // NullDataChunk
    //

    var NullDataChunk = new DataChunk();
    for (var method in NullDataChunk)
      if (typeof NullDataChunk[method] == 'function')
        NullDataChunk[method] = Function.$self;

    delete NullDataChunk.destroy;

    Cleaner.add(NullDataChunk);

    //
    // Adapters
    //

    var ADAPTER_DATACHUNK_HANDLER = {
      destroy: function(){
        this.unlink();
      }
    };

   /**
    * @class
    */
    var AbstractAdapter = Class.create(EventObject, {
      linkedDataChunk: null,
      processing: false,

      init: function(config){
        this.inherit();
        //this.addHandler({ any: function(){ console.log.apply(console, arguments); } });
        return config || {};
      },
      start: function(dataChunk){
        if (this.linkedDataChunk != dataChunk || !this.processing)
        {
          this.link(dataChunk);
          this.processing = true;
          this.dispatch('start');
        }
      },
      stop: function(){ 
        if (this.processing)
        {
          this.dispatch('stop');
          this.processing = false;
          //this.unlink();
        }
      },
      link: function(dataChunk){
        if (this.linkedDataChunk != dataChunk)
        {
          this.unlink();
          this.linkedDataChunk = dataChunk;
          this.linkedDataChunk.addHandler(ADAPTER_DATACHUNK_HANDLER, this);
          this.dispatch('link');
        }
      },
      unlink: function(){
        if (this.linkedDataChunk)
        {
          this.stop();
          this.dispatch('unlink');

          this.linkedDataChunk.removeHandler(ADAPTER_DATACHUNK_HANDLER, this);
          if (this.linkedDataChunk && this.linkedDataChunk.adapter == this)
            delete this.linkedDataChunk.adapter;

          delete this.linkedDataChunk;
        }
      },
      destroy: function(){
      }
    });

    var AjaxAdapterHandler = {
      prepare: function(){
        if (this.callback.before)
          this.callback.before.apply(this.context, [this.linkedDataChunk.key].concat(Array.from(arguments)))
      },
      start: function(){
        this.linkedDataChunk.setState(STATE.PROCESSING);
      },
      abort: function(){
        //this.linkedDataChunk.reset();  // => this.setState(ERROR, null, )
        this.linkedDataChunk.setState(STATE.ERROR, ABORT_ERROR_TEXT);
      },
      failure: function(){
        var errorText;
        if (this.callback.error)
          errorText = this.callback.error.apply(this.context, arguments);

        this.linkedDataChunk.setState(STATE.ERROR, errorText || DEFAULT_ERROR_TEXT);
      },
      timeout: function(){
        var errorText;
        if (this.callback.error)
          errorText = this.callback.error.apply(this.context, arguments);

        this.linkedDataChunk.setState(STATE.ERROR, errorText || DEFAULT_ERROR_TEXT);
      },
      success: function(){
        var result = null;
        var errorText;

        if (this.callback.after)
          try {
            result = this.callback.after.apply(this.context, arguments);
          } catch(e) {
            var errorText = exception(e);
          }

        if (errorText)
        {
          if (typeof console != 'undefined') console.warn(errorText);
          this.linkedDataChunk.setState(STATE.ERROR, errorText);
        }
        else
          this.linkedDataChunk.set(result);
      },
      complete: function(){
        this.stop();
      }
    };
    
   /**
    * @class
    */
    var AjaxAdapter = Class.create(AbstractAdapter, {
      behaviour: {
        link:   function(){ this.transport.abort(); },
        unlink: function(){ this.transport.abort(); },
        start:  function(){ this.transport.get(); },
        stop:   function(){ }
      },

      init: function(config){
        config = this.inherit(config);
        this.transport = config.transport;
        this.context   = config.transport;
        this.transport.addHandler(AjaxAdapterHandler, this);
        this.callback  = config.callback || {};
      },
      destroy: function(){
        this.transport.removeHandler(AjaxAdapterHandler, this);
        this.transport.destroy(); // ???
        delete this.transport;
        delete this.context;

        this.inherit();
      }
    });

   /**
    * @class
    */
    var SOAPAdapter = Class.create(AjaxAdapter, {  /// UNSAFE!!!!!
      behaviour: {
        start: function(){
          this.method.call();
        }
      },
      init: function(config){
        this.inherit(Object.complete({ transport: config.transport.transport }, config));
        this.context = config.transport;
        this.method  = config.transport;
      },
      destroy: function(){
        this.method.destroy();
        this.inherit();
      }
    });

   /**
    * @class
    */
    var Subscriber = Class.create(DataObject, {
      className: namespace + '.Subscriber',

      isActiveSubscriber: true,
      subscriptionType: 1,

     /**
      * @method init
      * @constructs
      * @param {Function} getter A function used to pick up data chunk by key.
      * @param {Object} config
      */
      init: function(getter, config){
        this.inherit();

        this.getter = getter || Function.$null;
        if (config)
        {
          this.addHandler(config.handler || config, config.thisObject || this);
          ;;;if ('loadError' in this.handlers.last() && typeof console != 'undefined') console.warn('`loadError` event is deprecated. Use `error` event instead.');
        }

        this.setDelegate(NullDataChunk)
      },

     /**
      * @method select
      * @param {String} key (optional) Indetificator of data chunk. If omited or 
      * has wrong value (this.getter nothing return) subscriber link to NullDataChunk.
      */
      select: function(key, deprecateIfExists){
        if (deprecateIfExists)
          deprecateIfExists = !!this.getter(key, true);

        this.setDelegate(this.getter(key) || NullDataChunk);

        if (deprecateIfExists)
          this.deprecate();
      },

     /**
      * Mark current data chunk as deprecated.
      * @method deprecate
      */
      deprecate: function(){
        this.delegate.deprecate();
      },

     /**
      * Reload current data chunk if necessary (when in error state).
      * @method repair
      */
      repair: function(){
        this.delegate.repair();
      },

      update: function(updater){
        if (this.delegate && this.delegate !== NullDataChunk)
        {
          console.log('Update! But no actions...');
        }
      },

     /**
      * @method destroy
      * @desctructor
      */
      destroy: function(){
        this.inherit();
      }
    });

    //
    //  Publisher
    //

    var PublisherData = {};

    var PUBLISHER_ID = 0;
    var NULL_KEY = '__NULL_KEY__';

    var PublisherSessionHandlers = {
      sessionOpen: function(session){
        var sessionDataChunk = session.getData(this.guid) || {};
        var data = PublisherData[this.guid];
        for (var key in data)
        {
          var chunk = sessionDataChunk[key] || {};
          data[key].update(chunk.info);
          data[key].setState(chunk.state || STATE.UNDEFINED, chunk.state.data);
        }
      },
      sessionClose: function(session){
        var sessionDataChunk = {};
        var data = PublisherData[this.guid];
        for (var key in data)
        {
          var chunk = data[key];
          sessionDataChunk[key] = {
            info: chunk.info,
            errorText: chunk.errorText,
            state: chunk.state
          };
          chunk.update({});
          chunk.setState(STATE.UNDEFINED);
        };

        session.storeData(this.guid, sessionDataChunk);
      }
    };
    var PublisherDataChunkHandler = {
      destroy: function(chunk){
        delete PublisherData[this.guid][chunk.key];
      }
    };

    function getDataChunk(key, notCreate){
      var data = PublisherData[this.guid];

      key = this.keyMapping(key);

      if (key == null)
        if (this.nullKeyExists)
          key = NULL_KEY;
        else
          return;

      var chunk = data[key];

      if (!chunk)
      {
        if (notCreate)
          return NullDataChunk;
        else
        {
          chunk = new DataChunk(key, this.adapterFactory);
          chunk.addHandler(PublisherDataChunkHandler, this);
          return data[key] = chunk;
        }
      }
      else
        return chunk;
    };

   /**
    * @class
    */
    var Publisher = Class.create(EventObject, {
      className: namespace + '.Publisher',

     /**
      * Unique name of publisher.
      * @property {String} guid
      * @private
      */
      guid: '',

     /**
      * Copy or not key while switch from one session to another. (if session using only)
      * @property {Boolean} migrateKeys
      */
      migrateKeys: false,

     /**
      * Is null key data chunk allowed or not.
      * @property {Boolean} nullKeyExists
      */
      nullKeyExists: false,

     /**
      * Refer to Transport which used for data delivery.
      * @property {Basis.Ajax.Transport} loader
      */
      loader: null,

     /**
      * Refer to Session if used.
      * @property {Basis.Session.Session} session
      */
      session: null,

     /**
      * Function for key transformation while geting data chunk.
      * @property {Function} keyMapping
      */
      keyMapping: Function.$self,

     /**
      * @method init
      * @constructs
      * @param {Object} config
      */
      init: function(config){
        this.inherit();
        this.guid = 'publisher' + PUBLISHER_ID++;

        PublisherData[this.guid] = {};

        //this.loader = config.load || null;
        if (config.adapterFactory)
          this.adapterFactory = config.adapterFactory;
        else
        {
          var AdapterClass = AbstractAdapter;
          var transport;
          if (config.load)
          {
            transport = config.load.transport;
            if (Basis.Ajax)
              if (Basis.SOAP && transport instanceof Basis.SOAP.ServiceCall)
                AdapterClass = SOAPAdapter;
              else if (transport instanceof Basis.Ajax.Transport)
                AdapterClass = AjaxAdapter;

            ;;;if ('loadError' in config.load && typeof console != 'undefined') console.warn('Publisher: `loadError` event is deprecated. Use `error` event instead.');
            config.error = config.error || config.loadError;
          }
          //var adapter = new AdapterClass({ transport: transport, callback: config.load });
          //this.adapterFactory = function(){ console.log('haha'); return adapter };
          this.adapterFactory = Function.lazyInit(function(){ 
            return new AdapterClass({
              transport: transport,
              callback: config.load
            });
          });
        }

        this.keyMapping    = config.keyMapping || this.keyMapping;
        this.nullKeyExists = config.nullKeyExists || this.nullKeyExists;

        if (config.session)
        {
          this.session = config.session;
          this.session.addHandler(PublisherSessionHandlers, this);
          // actual only for sessions
          if (config.migrateKeys)
            this.migrateKeys = true;
        }

        Cleaner.add(this);
      },

     /**
      * Destroy all data chunk that are attached to this publisher.
      * @method clear
      */
      clear: function(){
        var data = PublisherData[this.guid];
        var k = Object.keys(data);
        for (var i = 0; i < k.length; i++)
        {
          var key = k[i];
          data[key].destroy();
        }
      },

     /**
      * Make data chunk not allowed for actions.
      * @method disableDataChunk
      * @param {String} key
      */
      disableDataChunk: function(key){
        var dataChunk = getDataChunk.call(this, key, NO_CREATE);
        if (dataChunk)
          dataChunk.disabled.set(true);
      },

     /**
      * Make data chunk allowed for actions.
      * @method enableDataChunk
      * @param {String} key
      */
      enableDataChunk: function(key){
        var dataChunk = getDataChunk.call(this, key, NO_CREATE);
        if (dataChunk)
          dataChunk.disabled.set(false);
      },

     /**
      * Mark data chunk as deprecated.
      * @method deprecate
      * @param {String} key
      */
      deprecate: function(key){
        var dataChunk = getDataChunk.call(this, key, NO_CREATE);
        if (dataChunk)
          dataChunk.deprecate();
      },

     /**
      * Create a new subcriber attached to this publisher.
      * @method createSubscriber
      * @param {String} key
      * @returns {Subscriber} A new subscriber.
      */
      createSubscriber: function(config){
        return new Subscriber(getDataChunk.bind(this), config);
      },

     /**
      * @method destroy
      * @desctructor
      */
      destroy: function(){
        if (this.session)
        {
          this.session.removeHandler(PublisherSessionHandlers, this);
          delete this.session;
        }

        this.clear();
        this.inherit();

        Cleaner.remove(this);
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Publisher: Publisher,
      Subscriber: Subscriber,
      DataChunk: DataChunk,
      AbstractAdapter: AbstractAdapter,
      AjaxAdapter: AjaxAdapter,
      SOAPAdapter: SOAPAdapter
    });

  })();
