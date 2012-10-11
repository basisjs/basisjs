
  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.net.proxy');

 /**
  * @namespace basis.net.ajax
  */

  var namespace = this.path;

  // import names
  var Class = basis.Class;

  var ua = basis.ua;
  var cleaner = basis.cleaner;

  var TimeEventManager = basis.timer.TimeEventManager;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var STATE = basis.data.STATE;

  var Proxy = basis.net.proxy.Proxy;
  var Request = basis.net.proxy.Request;
  var createProxyEvent = basis.net.proxy.createEvent;

  //
  // Main part
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

  // TODO: better debug info out
  var logOutput = typeof console != 'undefined'
    ? function(){ console.log(arguments); }
    : Function.$self;

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

    Object.iterate(Object.extend(headers, requestData.headers), function(key, value){
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
  }

  /**
   * @class Request
   */

  var AjaxRequest = Request.subclass({
    className: namespace + '.AjaxRequest',

    timeout:  30000, // 30 sec
    requestStartTime: 0,

    debug: false,
    proxy: null,

    init: function(){
      Request.prototype.init.call(this);
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

      delete this.xhr;
      delete this.requestData;

      Request.prototype.destroy.call(this);
    }
  });


 /**
  * @class AjaxProxy
  */
  var AjaxProxy = Proxy.subclass({
    className: namespace + '.AjaxProxy',

    requestClass: AjaxRequest,

    event_readyStateChanged: createProxyEvent('readyStateChanged'),

    // transport properties
    asynchronous: true,
    method: 'GET',
    contentType: 'application/x-www-form-urlencoded',
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
    },

    get: function(){
      ;;; if (typeof console != 'undefined') console.warn('basis.net.ajax.AjaxProxy#get method is deprecated, use basis.net.ajax.AjaxProxy#request method instead');
      this.request.apply(this, arguments);
    }
  });

  //
  // export names
  //

  module.exports = {
    AjaxProxy: AjaxProxy,
    AjaxRequest: AjaxRequest,

    createEvent: createProxyEvent,
    ProxyDispatcher: basis.net.proxy.ProxyDispatcher,

    // backward capability, deprecated
    Transport: AjaxProxy,
    TransportDispatcher: basis.net.proxy.ProxyDispatcher
  };
