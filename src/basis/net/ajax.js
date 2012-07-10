/*
  Basis javascript library 
  http://code.google.com/p/basis-js/
 
  @copyright
  Copyright (c) 2006-2012 Roman Dvornov.
 
  @license
  GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
*/

  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.dom.event');
  basis.require('basis.data');


 /**
  * @namespace basis.net.ajax
  */

  var namespace = this.path;

  // import names
  var Class = basis.Class;

  var ua = basis.ua;
  var Cleaner = basis.Cleaner;

  var TimeEventManager = basis.timer.TimeEventManager;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var DataObject = basis.data.DataObject;
  var STATE = basis.data.STATE;


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
  var ESCAPE_CHARS = /[\%\=\&\<\>\s\+]/g;

  // base 
  var DEFAULT_METHOD = 'GET';
  var DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded';

  // TODO: better debug info out
  var logOutput = typeof console != 'undefined' ? function(){ console.log(arguments) } : Function.$self;

  function escapeValue(value){
    return String(value).replace(ESCAPE_CHARS, function(m){
      var code = m.charCodeAt(0).toHex();
      return '%' + (code.length < 2 ? '0' : '') + code;
    });
  }


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

      if (ua.test('gecko'))
        headers['Connection'] = 'close';
    }
    else
      if (ua.test('ie')) // disable IE caching
        headers['If-Modified-Since'] = 'Thu, 01 Jan 1970 00:00:00 GMT'; // new Date(0).toGMTString() is not correct here;
                                                                        // IE returns date string with no leading zero and IIS may parse
                                                                        // date wrong and response with code 400

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

    event_stateChanged: function(oldState){
      DataObject.prototype.event_stateChanged.call(this, oldState);

      for (var i = 0; i < this.influence.length; i++)
        this.influence[i].setState(this.state, this.state.data);
    },

    init: function(){
      DataObject.prototype.init.call(this);
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
      var params = [];
      var url = requestData.url;

      for (var key in requestData.params)
      {
        var value = requestData.params[key];

        if (value == null || value.toString() == null)
          continue;

        params.push(escapeValue(key) + '=' + escapeValue(value.toString()));
      }

      params = params.join('&');

      // prepare location & postBody
      if (!requestData.postBody && IS_POST_REGEXP.test(requestData.method))
      {
        requestData.postBody = params || '';
        params = '';
      }

      // process url
      /*url = url.replace(/:([a-z\_\-][a-z0-9\_\-]+)/gi, function(m, key){
        if (key in requestData.routerParams)
          return requestData.routerParams[key]; // escapeValue?
      });*/

      if (params)
        url += (url.indexOf('?') == -1 ? '?' : '&') + params;

      requestData.requestUrl = url;

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
      if (ua.test('gecko1.8.1-') && requestData.asynchronous)
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
      xhr.open(requestData.method, requestData.requestUrl, requestData.asynchronous);

      // set headers
      setRequestHeaders(xhr, requestData);

      // save transfer start point time & set timeout
      this.setTimeout(this.timeout);

      // prepare post body
      var postBody = requestData.postBody;

      // BUGFIX: IE fixes for post body
      if (IS_POST_REGEXP.test(requestData.method) && ua.test('ie9-'))
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
        this.xhr.abort();

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
      this.update({ 
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Timeout error'
        }
      });

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

  function createProxyEvent(eventName) {
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
    start: function(sender, request){
      this.inprogressRequests.add(request);
    },
    complete: function(sender, request){
      this.inprogressRequests.remove(request);
    }
  }

  var PROXY_POOL_LIMIT_HANDLER = {
    complete: function(sender, request){
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

    event_start: createProxyEvent('start'),
    event_timeout: createProxyEvent('timeout'),
    event_abort: createProxyEvent('abort'),
    event_success: createProxyEvent('success'),
    event_failure: createProxyEvent('failure'),
    event_complete: createProxyEvent('complete'),

    init: function(){
      this.requests = {};
      this.requestQueue = [];
      this.inprogressRequests = [];

      EventObject.prototype.init.call(this);

      // handlers
      this.addHandler(PROXY_REQUEST_HANDLER, this);

      if (this.poolLimit)
        this.addHandler(PROXY_POOL_LIMIT_HANDLER, this);

      Cleaner.add(this);  // ???
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

  Proxy.createEvent = createProxyEvent;


 /**
  * @class AjaxProxy
  */
  var AjaxProxy = Class(Proxy, {
    className: namespace + '.AjaxProxy',

    requestClass: AjaxRequest,

    event_readyStateChanged: createProxyEvent('readyStateChanged'),

    // transport properties
    asynchronous: true,
    method: DEFAULT_METHOD,
    contentType: DEFAULT_CONTENT_TYPE,
    encoding: null,

    init: function(){
      Proxy.prototype.init.call(this);

      this.requestHeaders = Object.extend({}, this.requestHeaders);
      this.params = Object.extend({}, this.params);
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
        requestUrl: url,
        url: url,
        method: this.method.toUpperCase(),
        contentType: this.contentType,
        encoding: this.encoding,
        asynchronous: this.asynchronous,
        headers: [this.requestHeaders, requestData.headers].merge(),
        postBody: requestData.postBody || this.postBody,
        params: [this.params, requestData.params].merge(),
        //routerParams: requestData.routerParams || {},
        influence: requestData.influence
      });

      return requestData;
    },

    get: function(){
      ;;; if (typeof console != 'undefined') console.warn('basis.net.ajax.AjaxProxy#get method is deprecated, use basis.net.ajax.AjaxProxy#request method instead');
      this.request.apply(this, arguments);
    }
  });

  /**
   * @class Service
   */

  var SERVICE_HANDLER = {
    start: function(service, request){
      this.inprogressProxies.add(request.proxy);
    },
    complete: function(service, request){
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

    init: function(){
      EventObject.prototype.init.call(this);

      this.inprogressProxies = [];

      this.proxyClass = Class(this.proxyClass, {
        service: this,

        needSignature: this.isSecure,

        event_failure: function(req){
          this.constructor.superClass_.prototype.event_failure.call(this, req);

          if (this.needSignature && this.service.isSessionExpiredError(req))
          {
            this.service.freeze();
            this.service.stoppedProxies.push(this);
            this.stop();
          }
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
        ;;; if (typeof console != 'undefined') console.warn('Request skipped. Service session is not opened');
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
      if (!this.sessionKey)
        return;

      this.sessionKey = null;
      this.sessionData = null;

      this.stoppedProxies = this.inprogressProxies.filter(function(proxy){ return proxy.needSignature });

      for (var i = 0, proxy; proxy = this.inprogressProxies[i]; i++)
        proxy.stop();

      this.event_sessionFreeze();
    },

    unfreeze: function(){
      if (this.stoppedProxies)
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

      EventObject.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    createEvent: createProxyEvent,

    Proxy: Proxy,
    AjaxProxy: AjaxProxy,
    AjaxRequest: AjaxRequest,
    ProxyDispatcher: ProxyDispatcher,
    Service: Service,

    // backward capability, deprecated
    Transport: AjaxProxy,
    TransportDispatcher: ProxyDispatcher
  };
