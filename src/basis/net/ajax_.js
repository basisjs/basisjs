/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.event');
basis.require('basis.ua');
basis.require('basis.dom.event');
basis.require('basis.data');

!function(basis){

  'use strict';

 /**
  * @namespace basis.net.ajax
  */

  var namespace = 'basis.net.ajax';

  // import names
  var Class = basis.Class;
  var Event = basis.dom.event;

  var Browser = basis.ua;
  var Cookies = Browser.cookies;
  var Cleaner = basis.Cleaner;

  var TimeEventManager = basis.TimeEventManager;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;


  //
  // Main part
  //

  // const

  /** @const */ var STATE_UNSENT = 0;
  /** @const */ var STATE_OPENED = 1;
  /** @const */ var STATE_HEADERS_RECEIVED = 2;
  /** @const */ var STATE_LOADING = 3;
  /** @const */ var STATE_DONE = 4;

  var IS_POST_REGEXP = /POST/i;

  // base 
  var DEFAULT_METHOD = 'GET';
  var DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded';

  // TODO: better debug info out
  var logOutput = typeof console != 'undefined' ? function(){ console.log(arguments) } : Function.$self;

  // Encode
  var CodePages = {};
  var Encode = {
    escape: function(string, codepage){
      var table = (CodePages[codepage] || codepage || CodePages.win1251).escape;
      return escape(String(string)).replace(/%u0([0-9a-f]{3})/gi, 
                                            function(match, code) { return table[code.toUpperCase()] || match });
    },
    unescape: function(string, codepage){
      var table = (CodePages[codepage] || codepage || CodePages.win1251).unescape;
      return unescape(String(string).replace(/%([0-9a-f]{2})/gi, 
                                             function(match, code){ return table[code.toUpperCase()] || match }));
    }
  };

  // Windows 1251
  (function(){
    var w1251 = CodePages.win1251 = { escape: {}, unescape: {} };
    w1251.escape['401']  = '%A8'; // `E' - e kratkoe
    w1251.unescape['A8'] = 0x401; // `E'
    w1251.escape['451']  = '%B8'; // `e'
    w1251.unescape['B8'] = 0x451; // `e'

    for (var i = 0xC0; i <= 0xFF; i++) // A-YAa-ya
    {
      w1251.unescape[i.toHex()] = String.fromCharCode(i + 0x350); 
      w1251.escape[(i + 0x350).toHex()] = '%' + i.toHex();
    }
  })();


 /**
  * @function createTransport
  * Creates transport constructor
  */
  var XHRSupport = 'native';
  var createXmlHttpRequest = function(){

    if (window.XMLHttpRequest)
      return function(){
        return new XMLHttpRequest();
      };

    var ActiveXObject = window.ActiveXObject;
    if (ActiveXObject)
    {
      var progID = [
        "MSXML2.XMLHTTP.6.0",
        "MSXML2.XMLHTTP.3.0",
        "MSXML2.XMLHTTP",
        "Microsoft.XMLHTTP"
      ];

      for (var i = 0, fn; XHRSupport = progID[i]; i++)
        try {
          if (new ActiveXObject(XHRSupport))
            return function(){
              return new ActiveXObject(XHRSupport);
            };
        } catch(e) {}
    }

    throw new Error(XHRSupport = 'Browser doesn\'t support for XMLHttpRequest!');

  }();

 /**
  * Sets transport request headers
  * @private
  */
  function setRequestHeaders(request, requestData){
    var headers = {
      'JS-Framework': 'Basis'
    };

    if (IS_POST_REGEXP.test(requestData.method)) 
    {
      if (requestData.contentType != 'multipart/form-data')
        headers['Content-Type'] = requestData.contentType + (requestData.encoding ? '\x3Bcharset=' + requestData.encoding : '');

      if (Browser.test('gecko'))
        headers['Connection'] = 'close';
    }
    else
      if (Browser.test('ie')) // disable IE caching
        headers['If-Modified-Since'] = new Date(0).toGMTString();

    Object.iterate(Object.extend(headers, requestData.headers), function(key, value){
      if (value != null)
        this.setRequestHeader(key, value);
    }, request);
  };


 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var newState;
    var error;

    var xhr = this.xhr;
    if (!xhr)
      return;

    var proxy = this.proxy;

    if (typeof readyState != 'number')
      readyState = xhr.readyState;

    // BUGFIX: IE & Gecko fire OPEN readystate twice
    if (readyState == this.prevReadyState_)
      return;

    this.prevReadyState_ = readyState;

    ;;;if (this.debug) logOutput('State: (' + readyState + ') ' + ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'][readyState]);

    // dispatch self event
    proxy.event_readyStateChanged(this, readyState);

    if (readyState == STATE_DONE)
    {
      //TimeEventManager.remove(this, 'timeoutAbort');
      this.clearTimeout();
      // clean event handler
      xhr.onreadystatechange = Function.$undef;

      if (typeof xhr.responseText == 'unknown' || (!xhr.responseText && !xhr.getAllResponseHeaders()))
      {
        proxy.event_failure(this);
        proxy.event_abort(this);
        newState = STATE.ERROR;
      }
      else
      {
        this.processResponse();

        // dispatch events
        if (this.isSuccessful())
        {
          proxy.event_success(this);
          newState = STATE.READY;
        }
        else
        {
          this.processErrorResponse();

          proxy.event_failure(this, this.data.error);
          newState = STATE.ERROR;
        }
      }

      // dispatch complete event
      proxy.event_complete(this);
    }
    else
      newState = STATE.PROCESSING;

    // set new state
    this.setState(newState, this.data.error);
  };

  /**
   * @class Request
   */

  var AjaxRequest = Class(DataObject, {
    className: namespace + '.AjaxRequest',

    timeout:  30000, // 30 sec
    requestStartTime: 0,

    debug: false,
    proxy: null,

    event_stateChanged: function(object, oldState){
      DataObject.prototype.event_stateChanged.call(this, object, oldState);

      for (var i = 0; i < this.influence.length; i++)
        this.influence[i].setState(this.state, this.state.data);
    },

    init: function(config){
      DataObject.prototype.init.call(this, config);
      this.xhr = createXmlHttpRequest();
      this.influence = [];
    },

    setInfluence: function(influence){
      this.influence = Array.from(influence);
    },
    clearInfluence: function(){
      this.influence = [];
    },

    isIdle: function(){
      return this.xhr.readyState == STATE_DONE || this.xhr.readyState == STATE_UNSENT;
    },

    isSuccessful: function(){
      try {
        var status = this.xhr.status;
        return (status == undefined)
            || (status == 0)
            || (status >= 200 && status < 300);
      } catch(e) {
      }
      return false;
    },

    processResponse: function(){
      this.update({
        responseText: this.xhr.responseText,
        responseXML: this.xhr.responseXML,
        status: this.xhr.status
      });
    },

    processErrorResponse: function(){
      this.update({
        error: {
          code: 'SERVER_ERROR',
          msg: this.xhr.responseText
        }
      });
    },

    prepare: Function.$true,

    prepareRequestData: function(requestData){
      var params = Object.iterate(requestData.params , function(key, value){
        return (value == null) || (value && typeof value.toString == 'function' && value.toString() == null)
          ? null
          : key + '=' + String(value.toString()).replace(/[\%\=\&\<\>\s\+]/g, function(m){ var code = m.charCodeAt(0).toHex(); return '%' + (code.length < 2 ? '0' : '') + code })//Encode.escape(basis.crypt.UTF8.fromUTF16(value.toString()))
      }).filter(Function.$isNotNull).join('&');

      // prepare location & postBody
      if (IS_POST_REGEXP.test(requestData.method) && !requestData.postBody)
      {
        requestData.postBody = params || '';
        params = '';
      }

      if (params)
        requestData.url += (requestData.url.indexOf('?') == -1 ? '?' : '&') + params;

      return requestData;
    },

    doRequest: function(){
      /*if (!this.prepare())
        return;*/

      //this.requestData = requestData;
      this.send(this.prepareRequestData(this.requestData));
    },
    
    send: function(requestData){
      this.update({
        responseText: '',
        responseXML: '',
        status: '',
        error: ''
      });

      // create new XMLHTTPRequest instance for gecko browsers in asynchronous mode
      // object crash otherwise
      if (Browser.test('gecko1.8.1-') && requestData.asynchronous)
        this.xhr = createXmlHttpRequest();

      this.proxy.event_start(this);

      var xhr = this.xhr;

      this.prevReadyState_ = -1;

      if (requestData.asynchronous)
        // set ready state change handler
        xhr.onreadystatechange = readyStateChangeHandler.bind(this);
      else
        // catch state change for 'loading' in synchronous mode
        readyStateChangeHandler.call(this, STATE_UNSENT);

      // open XMLHttpRequest
      xhr.open(requestData.method, requestData.url, requestData.asynchronous);

      // set headers
      setRequestHeaders(xhr, requestData);

      // save transfer start point time & set timeout
      this.setTimeout(this.timeout);
      //TimeEventManager.add(this, 'timeoutAbort', Date.now() + this.timeout);

      // prepare post body
      var postBody = requestData.postBody;

      // BUGFIX: IE fixes for post body
      if (IS_POST_REGEXP.test(requestData.method) && Browser.test('ie9-'))
      {
        if (typeof postBody == 'object' && typeof postBody.documentElement != 'undefined' && typeof postBody.xml == 'string')
          // sending xmldocument content as string, otherwise IE override content-type header
          postBody = postBody.xml;                   
        else
          if (typeof postBody == 'string')
            // ie stop send postBody when found \r
            postBody = postBody.replace(/\r/g, ''); 
          else
            if (postBody == null || postBody == '')
              // IE doesn't accept null, undefined or '' post body
              postBody = '[No data]';      
      }

      // send data
      xhr.send(postBody);

      ;;;if (this.debug) logOutput('Request over, waiting for response');

      return true;
    },

    repeat: function(){
      if (this.requestData)
      {
        this.abort();
        this.send(this.requestData);
      }
    },

    abort: function()
    {
      if (!this.isIdle())
      {
        this.clearTimeout();
        //TimeEventManager.remove(this, 'timeoutAbort');
        //this.xhr.onreadystatechange = Function.$undef;
        this.xhr.abort();

        /*this.proxy.event_abort(this);
        this.proxy.event_complete(this);
        this.setState(STATE.READY);*/

        if (this.xhr.readyState != STATE_DONE)
          readyStateChangeHandler.call(this, STATE_DONE);
      }
    },

    setTimeout: function(timeout){
      if ('ontimeout' in this.xhr)
      {
        this.xhr.timeout = timeout;
        this.xhr.ontimeout = this.timeoutAbort.bind(this);
      }
      else
        TimeEventManager.add(this, 'timeoutAbort', Date.now() + timeout);
    },

    clearTimeout: function(){
      if ('ontimeout' in this.xhr == false)
        TimeEventManager.remove(this, 'timeoutAbort');
    },

    timeoutAbort: function(){
      this.proxy.event_timeout(this);
      this.abort();
    },

    destroy: function(){
      this.abort();

      this.clearInfluence();

      delete this.xhr;
      delete this.requestData;

      DataObject.prototype.destroy.call(this);
    }
  });



  //
  // ProxyDispatcher
  //

  var ProxyDispatcher = new EventObject({
    abort: function(){
      var result = Array.from(inprogressProxies);
      for (var i = 0; i < result.length; i++)
        result[i].abort();

      return result;
    }
  });

  var inprogressProxies = [];
  ProxyDispatcher.addHandler({
    start: function(request){
      inprogressProxies.add(request.proxy);
    },
    complete: function(request){
      inprogressProxies.remove(request.proxy);
    }
  });

 /**
  * @function createEvent
  */

  function createEvent(eventName) {
    var event = createEvent(eventName);
    return function(){
      event.apply(ProxyDispatcher, arguments);

      if (this.service)
        event.apply(this.service, arguments);

      event.apply(this, arguments);
    }
  }

  /**
   * @class Proxy
   */


  var PROXY_REQUEST_HANDLER = {
    start: function(request){
      this.inprogressRequests.add(request);
    },
    complete: function(request){
      this.inprogressRequests.remove(request);
    }
  }

  var PROXY_POOL_LIMIT_HANDLER = {
    complete: function(request){
      var nextRequest = this.requestQueue.shift();
      if (nextRequest)
      {
        setTimeout(function(){
          nextRequest.doRequest();
        }, 0);
      }
    }
  }

  var Proxy = Class(EventObject, {
    className: namespace + '.Proxy',

    requests: null,
    poolLimit: null,

    poolHashGetter: Function.$true,

    event_start: createEvent('start'),
    event_timeout: createEvent('timeout'),
    event_abort: createEvent('abort'),
    event_success: createEvent('success'),
    event_failure: createEvent('failure'),
    event_complete: createEvent('complete'),

    init: function(config){
      this.requests = {};
      this.requestQueue = [];
      this.inprogressRequests = [];

      EventObject.prototype.init.call(this, config);

      // handlers
      /*if (this.callback)
        this.addHandler(this.callback, this);*/
      this.addHandler(PROXY_REQUEST_HANDLER, this);

      if (this.poolLimit)
        this.addHandler(PROXY_POOL_LIMIT_HANDLER, this);
    },

    getRequestByHash: function(requestHashId){
      if (!this.requests[requestHashId])
      {
        var request;
        //find idle transport
        for (var i in this.requests)
          if (this.requests[i].isIdle() && !this.requestQueue.has(this.requests[i]))
          {
            request = this.requests[i];
            delete this.requests[i];
          }

        this.requests[requestHashId] = request || new this.requestClass({ proxy: this });
      }

      return this.requests[requestHashId];
    },

    prepare: Function.$true,
    prepareRequestData: Function.$self,

    request: function(config){
      if (!this.prepare())
        return;

      var requestData = Object.slice(config);

      var requestData = this.prepareRequestData(requestData);
      var requestHashId = this.poolHashGetter(requestData);

      if (this.requests[requestHashId])
        this.requests[requestHashId].abort();

      var request = this.getRequestByHash(requestHashId);

      request.initData = Object.slice(config);
      request.requestData = requestData;
      request.setInfluence(requestData.influence);

      if (this.poolLimit && this.inprogressRequests.length >= this.poolLimit)
      {
        this.requestQueue.push(request);
        request.setState(STATE.PROCESSING);
      }
      else
        request.doRequest();

      return request;
    },

    abort: function(){
      for (var i = 0, request; request = this.inprogressRequests[i]; i++)
        request.abort();

      for (var i = 0, request; request = this.requestQueue[i]; i++)
        request.setState(STATE.ERROR);

      this.inprogressRequests = [];
      this.requestQueue = [];
    },

    stop: function(){
      if (!this.stopped)
      {
        this.stoppedRequests = this.inprogressRequests.concat(this.requestQueue);
        this.abort();
        this.stopped = true;
      }
    },

    resume: function(){
      if (this.stoppedRequests)
      {
        for (var i = 0, request; request = this.stoppedRequests[i]; i++)
          request.proxy.get(request.initData);

        this.stoppedRequests = [];
      }
      this.stopped = false;
    },

    /*repeat: function(){ 
      if (this.requestData)
        this.request(this.requestData);
    },*/

    destroy: function(){
      for (var i in this.requests)
        this.requests[i].destroy();

      delete this.requestData;
      delete this.requestQueue;

        
      EventObject.prototype.destroy.call(this);

      delete this.requests;
      Cleaner.remove(this);
    }
  });

  Proxy.createEvent = createEvent;


 /**
  * @class AjaxProxy
  */
  var AjaxProxy = Class(Proxy, {
    className: namespace + '.AjaxProxy',

    requestClass: AjaxRequest,

    event_readyStateChanged: createEvent('readyStateChanged'),

    // transport properties
    asynchronous: true,
    method: DEFAULT_METHOD,
    contentType: DEFAULT_CONTENT_TYPE,
    encoding: null,

    init: function(config){
      Proxy.prototype.init.call(this, config);

      this.requestHeaders = {};
      this.params = {};

      Cleaner.add(this);  // ???
    },

    // params methods
    setParam: function(name, value){
      this.params[name] = value;
    },
    setParams: function(params){
      this.clearParams();
      for (var key in params)
        this.setParam(key, params[key]);
    },
    removeParam: function(name){
      delete this.params[name];
    },
    clearParams: function(){
      for (var key in this.params)
        delete this.params[key];
    },

    prepareRequestData: function(requestData){
      var url = requestData.url || this.url;

      if (!url)
        throw new Error('URL is not defined');

      Object.extend(requestData, {
        url: url,
        method: this.method.toUpperCase(),
        contentType: this.contentType,
        encoding: this.encoding,
        asynchronous: this.asynchronous,
        headers: [this.requestHeaders, requestData.headers].merge(),
        postBody: requestData.postBody || this.postBody,
        params: [this.params, requestData.params].merge(),
        influence: requestData.influence
      });

      return requestData;
    },

    get: function(){
      this.request.apply(this, arguments);
    }
  });

  /**
   * @class Service
   */

  var SERVICE_HANDLER = {
    start: function(request){
      this.inprogressProxies.add(request.proxy);
    },
    complete: function(request){
      this.inprogressProxies.remove(request.proxy);
    }
  }


  var Service = Class(EventObject, {
    className: namespace + '.Service',

    proxyClass: AjaxProxy,
    requestClass: AjaxRequest,

    event_sessionOpen: createEvent('sessionOpen'),
    event_sessionClose: createEvent('sessionClose'),
    event_sessionFreeze: createEvent('sessionFreeze'),
    event_sessionUnfreeze: createEvent('sessionUnfreeze'),

    //event_service_failure: createEvent('service_failure'),
    isSecure: false,

    prepare: Function.$true,
    signature: Function.$undef,
    isSessionExpiredError: Function.$false,

    init: function(config){
      EventObject.prototype.init.call(this, config);

      this.inprogressProxies = [];

      this.proxyClass = Class(this.proxyClass, {
        service: this,

        needSignature: this.isSecure,

        event_failure: function(req){
          this.constructor.superClass_.prototype.event_failure.apply(this, arguments);

          if (this.needSignature && this.service.isSessionExpiredError(req))
            this.service.freeze();        
        },

        request: function(requestData){
          if (!this.service.prepare(this, requestData))
            return;

          if (this.needSignature && !this.service.sign(this))
            return;

          return this.constructor.superClass_.prototype.request.call(this, requestData);
        },

        requestClass: this.requestClass
      });

      this.addHandler(SERVICE_HANDLER, this);
    },

    sign: function(proxy){
      if (this.sessionKey)
      {
        this.signature(proxy, this.sessionData);
        return true;
      }
      else
      {
        ;;; console.warn('Request skipped. Service session is not opened');
        return false;
      }
    },

    openSession: function(sessionKey, sessionData){
      this.sessionKey = sessionKey;
      this.sessionData = sessionData;

      this.unfreeze();

      this.event_sessionOpen();
    },

    closeSession: function(){
      this.freeze();

      this.event_sessionClose();
    },

    freeze: function(){
      this.oldSessionKey = this.sessionKey;
      this.sessionKey = null;
      this.sessionData = null;

      this.stoppedProxies = Array.from(this.inprogressProxies);

      for (var i = 0, proxy; proxy = this.inprogressProxies[i]; i++)
        proxy.stop();

      this.event_sessionFreeze();
    },

    unfreeze: function(){
      if (this.oldSessionKey == this.sessionKey && this.stoppedProxies)
      {
        for (var i = 0, proxy; proxy = this.stoppedProxies[i]; i++)
          proxy.resume();
      }

      this.event_sessionUnfreeze();
    },
    
    createProxy: function(config){
      return new this.proxyClass(config);
    },

    destroy: function(){
      delete this.inprogressProxies;
      delete this.stoppedProxies;
      delete this.sessionData;
      delete this.sessionKey;
      delete this.oldSessionKey;

      EventObject.prototype.destroy.call(this);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    Transport: AjaxProxy,
    TransportDispatcher: ProxyDispatcher,
    createEvent: createEvent,

    Proxy: Proxy,
    AjaxProxy: AjaxProxy,
    AjaxRequest: AjaxRequest,
    ProxyDispatcher: ProxyDispatcher,
    Service: Service
  });

}(basis);
