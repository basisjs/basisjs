
  basis.require('basis.event');
  basis.require('basis.data');
  basis.require('basis.timer');

 /**
  * @namespace basis.net
  */

  var namespace = this.path;


  //
  // import names
  //

  var ua = basis.ua;

  var extend = basis.object.extend;
  var arrayFrom = basis.array.from;
  var objectSlice = basis.object.slice;
  var createEvent = basis.event.create;

  var STATE = basis.data.STATE;

  var TimeEventManager = basis.timer.TimeEventManager;
  var DataObject = basis.data.DataObject;
  var Emitter = basis.event.Emitter;


 /**
  * @function createEvent
  */

  function createTransportEvent(eventName) {
    var event = createEvent(eventName);

    return function transportEvent(){
      event.apply(transportDispatcher, arguments);

      if (this.service)
        event.apply(this.service, arguments);

      event.apply(this, arguments);
    };
  }

  function createRequestEvent(eventName) {
    var event = createEvent(eventName);

    return function requestEvent(){
      var args = [this].concat(arrayFrom(arguments));

      event.apply(transportDispatcher, args);

      if (this.transport)
        this.transport['event_' + eventName].apply(this.transport, args);

      event.apply(this, arguments);
    };
  }



  //
  // transport dispatcher
  //
  var inprogressTransports = [];
  var transportDispatcher = new Emitter({
    abort: function(){
      var result = arrayFrom(inprogressTransports);

      for (var i = 0; i < result.length; i++)
        result[i].abort();

      return result;
    },
    handler: {
      start: function(request){
        inprogressTransports.add(request.transport);
      },
      complete: function(request){
        inprogressTransports.remove(request.transport);
      }
    }
  });

 /**
  * @class AbstractRequest
  */

  var AbstractRequest = DataObject.subclass({
    className: namespace + '.AbstractRequest',

    influence: null,
    initData: null,
    requestData: null,

    transport: null,

    event_start: createRequestEvent('start'),
    event_timeout: createRequestEvent('timeout'),
    event_abort: createRequestEvent('abort'),
    event_success: createRequestEvent('success'),
    event_failure: createRequestEvent('failure'),
    event_complete: createRequestEvent('complete'),

    event_stateChanged: function(oldState){
      DataObject.prototype.event_stateChanged.call(this, oldState);

      if (this.influence)
        for (var i = 0; i < this.influence.length; i++)
          this.influence[i].setState(this.state, this.state.data);
    },

    init: function(){
      DataObject.prototype.init.call(this);
      this.influence = [];
    },
    
    setInfluence: function(influence){
      this.influence = arrayFrom(influence);
    },
    clearInfluence: function(){
      this.influence = null;
    },

    doRequest: basis.fn.$undef,
    getResponseData: basis.fn.$undef,

    destroy: function(){
      DataObject.prototype.destroy.call(this);

      this.initData = null;
      this.requestData = null;
      this.clearInfluence();
    }
  });

 /**
  * @class AbstractTransport
  */

  var AbstractTransport = Emitter.subclass({
    className: namespace + '.AbstractTransport',

    requestClass: AbstractRequest,

    requests: null,
    poolLimit: null,
    poolHashGetter: basis.fn.$true,

    event_start: createTransportEvent('start'),
    event_timeout: createTransportEvent('timeout'),
    event_abort: createTransportEvent('abort'),
    event_success: createTransportEvent('success'),
    event_failure: createTransportEvent('failure'),
    event_complete: createTransportEvent('complete'),

    init: function(){
      this.requests = {};
      this.requestQueue = [];
      this.inprogressRequests = [];

      Emitter.prototype.init.call(this);

      // handlers
      this.addHandler(TRANSPORT_REQUEST_HANDLER, this);

      if (this.poolLimit)
        this.addHandler(TRANSPORT_POOL_LIMIT_HANDLER, this);
    },

    getRequestByHash: function(requestHashId){
      var request = this.requests[requestHashId];

      if (!request)
      {
        //find idle transport
        for (var id in this.requests)
          if (this.requests[id].isIdle() && !this.requestQueue.has(this.requests[id]))
          {
            request = this.requests[id];
            delete this.requests[id];
            break;
          }

        if (!request)
          request = new this.requestClass({
            transport: this
          });

        this.requests[requestHashId] = request;
      }

      return request;
    },

    prepare: basis.fn.$true,
    prepareRequestData: basis.fn.$self,

    request: function(config){
      if (!this.prepare())
        return;

      var requestData = objectSlice(config);
      var requestHashId = this.poolHashGetter(this.prepareRequestData(requestData));

      var request = this.getRequestByHash(requestHashId, true);

      if (request.initData)
        request.abort();

      request.initData = requestData;
      request.requestData = requestData;
      request.setInfluence(requestData.influence || this.influence);

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
          request.transport.request(request.initData);

        this.stoppedRequests = null;
      }
      this.stopped = false;
    },

    destroy: function(){
      for (var i in this.requests)
        this.requests[i].destroy();

      this.requests = {};
      this.inprogressRequests = null;
      this.requestQueue = null;
      this.stoppedRequests = null;

      Emitter.prototype.destroy.call(this);
    }
  });

  var TRANSPORT_REQUEST_HANDLER = {
    start: function(sender, request){
      this.inprogressRequests.add(request);
    },
    complete: function(sender, request){
      this.inprogressRequests.remove(request);
    }
  };

  var TRANSPORT_POOL_LIMIT_HANDLER = {
    complete: function(){
      var nextRequest = this.requestQueue.shift();
      if (nextRequest)
      {
        setTimeout(function(){
          nextRequest.doRequest();
        }, 0);
      }
    }
  };

  //
  // AJAX
  //

  // const

  /** @const */ var STATE_UNSENT = 0;
  /** @const */ var STATE_OPENED = 1;
  /** @const */ var STATE_HEADERS_RECEIVED = 2;
  /** @const */ var STATE_LOADING = 3;
  /** @const */ var STATE_DONE = 4;

  var METHODS = 'HEAD GET POST PUT PATCH DELETE TRACE LINK UNLINK CONNECT'.qw();
  var IS_POST_REGEXP = /POST/i;
  var IS_METHOD_WITH_BODY = /^(POST|PUT|PATCH|LINK|UNLINK)$/i;
  var ESCAPE_CHARS = /[\%\=\&\<\>\s\+]/g;

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
  var createXmlHttpRequest = (function(){

    if ('XMLHttpRequest' in global)
      return function(){
        return new XMLHttpRequest();
      };

    var ActiveXObject = global.ActiveXObject;
    if (ActiveXObject)
    {
      var progID = [
        "MSXML2.XMLHTTP.6.0",
        "MSXML2.XMLHTTP.3.0",
        "MSXML2.XMLHTTP",
        "Microsoft.XMLHTTP"
      ];

      for (var i = 0; XHRSupport = progID[i]; i++)
        try {
          if (new ActiveXObject(XHRSupport))
            return function(){
              return new ActiveXObject(XHRSupport);
            };
        } catch(e) {}
    }

    throw new Error(XHRSupport = 'XMLHttpRequest is not supported!');

  })();

 /**
  * Sets transport request headers
  * @private
  */
  function setRequestHeaders(request, requestData){
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Powered-By': 'basis.js'
    };

    if (IS_METHOD_WITH_BODY.test(requestData.method)) 
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

    Object.iterate(extend(headers, requestData.headers), function(key, value){
      if (value != null)
        this.setRequestHeader(key, value);
    }, request);
  }


 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var newState;

    var xhr = this.xhr;
    if (!xhr)
      return;

    var transport = this.transport;

    if (typeof readyState != 'number')
      readyState = xhr.readyState;

    // BUGFIX: IE & Gecko fire OPEN readystate twice
    if (readyState == this.prevReadyState_)
      return;

    this.prevReadyState_ = readyState;

    ;;;if (this.debug) basis.dev.log('State: (' + readyState + ') ' + ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'][readyState]);

    // dispatch self event
    this.event_readyStateChanged(readyState);

    if (readyState == STATE_DONE)
    {
      this.clearTimeout();

      // clean event handler
      xhr.onreadystatechange = basis.fn.$undef;

      if (typeof xhr.responseText == 'unknown' || (!xhr.responseText && !xhr.getAllResponseHeaders()))
      {
        this.event_failure();
        this.event_abort();
        newState = STATE.ERROR;
      }
      else
      {
        this.processResponse();

        // dispatch events
        if (this.isSuccessful())
        {
          this.event_success(this.getResponseData());
          newState = STATE.READY;
        }
        else
        {

          this.processErrorResponse();

          this.event_failure(this.data.error);
          newState = STATE.ERROR;
        }
      }

      // dispatch complete event
      this.event_complete(this);
    }
    else
      newState = STATE.PROCESSING;

    // set new state
    this.setState(newState, this.data.error);
  }

  /**
   * @class AjaxRequest
   */

  var AjaxRequest = AbstractRequest.subclass({
    className: namespace + '.AjaxRequest',

    timeout:  30000, // 30 sec
    requestStartTime: 0,

    debug: false,

    event_readyStateChanged: createRequestEvent('readyStateChanged'),

    init: function(){
      AbstractRequest.prototype.init.call(this);
      this.xhr = createXmlHttpRequest();
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
      } catch(e) {}
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

    prepare: basis.fn.$true,

    prepareRequestData: function(requestData){
      var params = [];
      var url = requestData.url;

      // make a copy
      requestData = objectSlice(requestData);

      for (var key in requestData.params)
      {
        var value = requestData.params[key];

        if (value == null || value.toString() == null)
          continue;

        params.push(escapeValue(key) + '=' + escapeValue(value.toString()));
      }

      params = params.join('&');

      // prepare location & postBody
      if (!requestData.postBody && IS_METHOD_WITH_BODY.test(requestData.method))
      {
        requestData.postBody = params || '';
        params = '';
      }

      // process url
      if (requestData.routerParams)
        url = url.replace(/:([a-z\_\-][a-z0-9\_\-]+)/gi, function(m, key){
          if (key in requestData.routerParams)
            return requestData.routerParams[key]; // escapeValue?
        });

      if (params)
        url += (url.indexOf('?') == -1 ? '?' : '&') + params;

      requestData.requestUrl = url;

      return requestData;
    },

    doRequest: function(){
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

      this.event_start();

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
      if (IS_METHOD_WITH_BODY.test(requestData.method) && ua.test('ie9-'))
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

      ;;;if (this.debug) basis.dev.log('Request over, waiting for response');

      return true;
    },

    repeat: function(){
      if (this.requestData)
      {
        this.abort();
        this.send(this.requestData);
      }
    },

    abort: function(){
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

      this.event_timeout(this);
      this.abort();
    },

    destroy: function(){
      this.abort();
      this.xhr = null;

      AbstractRequest.prototype.destroy.call(this);
    }
  });


 /**
  * @class AjaxTransport
  */
  var AjaxTransport = AbstractTransport.subclass({
    className: namespace + '.AjaxTransport',

    requestClass: AjaxRequest,

    event_readyStateChanged: createTransportEvent('readyStateChanged'),

    // transport properties
    asynchronous: true,
    method: 'GET',
    contentType: 'application/x-www-form-urlencoded',
    encoding: null,

    init: function(){
      AbstractTransport.prototype.init.call(this);

      this.requestHeaders = objectSlice(this.requestHeaders);
      this.params = objectSlice(this.params);
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

      extend(requestData, {
        requestUrl: url,
        url: url,
        method: requestData.method || this.method,
        contentType: requestData.contentType || this.contentType,
        encoding: requestData.encoding || this.encoding,
        asynchronous: this.asynchronous,
        headers: [this.requestHeaders, requestData.headers].merge(),
        postBody: requestData.postBody || this.postBody,
        params: [this.params, requestData.params].merge(),
        routerParams: requestData.routerParams,
        influence: requestData.influence
      });

      return requestData;
    }
  });


  //
  // export names
  //
  module.exports = {
    createEvent: createTransportEvent,
    transportDispatcher: transportDispatcher,

    AbstractRequest: AbstractRequest,
    AbstractTransport: AbstractTransport,

    AjaxTransport: AjaxTransport,
    AjaxRequest: AjaxRequest,
    Transport: AjaxTransport
  };
