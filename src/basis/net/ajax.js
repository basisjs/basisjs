
 /**
  * @namespace basis.net.ajax
  */

  var namespace = this.path;


  //
  // import names
  //

  var escapeValue = global.encodeURIComponent;
  var FormData = global.FormData;
  var extend = basis.object.extend;
  var objectSlice = basis.object.slice;
  var objectMerge = basis.object.merge;
  var objectIterate = basis.object.iterate;
  var ua = require('basis.ua');

  var basisNet = require('basis.net');
  var createTransportEvent = basisNet.createTransportEvent;
  var createRequestEvent = basisNet.createRequestEvent;
  var AbstractRequest = basisNet.AbstractRequest;
  var AbstractTransport = basisNet.AbstractTransport;


  //
  // main part
  //

  /** @const */ var STATE_UNSENT = 0;
  /** @const */ var STATE_OPENED = 1;
  /** @const */ var STATE_HEADERS_RECEIVED = 2;
  /** @const */ var STATE_LOADING = 3;
  /** @const */ var STATE_DONE = 4;

  var STATE = require('basis.data').STATE;
  var METHODS = 'HEAD GET POST PUT PATCH DELETE TRACE LINK UNLINK CONNECT'.split(' ');
  var IS_METHOD_WITH_BODY = /^(POST|PUT|PATCH|LINK|UNLINK)$/i;
  var URL_METHOD_PREFIX = new RegExp('^(' + METHODS.join('|') + ')\\s+', 'i');
  var JSON_CONTENT_TYPE = /^application\/json/i;


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
        'MSXML2.XMLHTTP.6.0',
        'MSXML2.XMLHTTP.3.0',
        'MSXML2.XMLHTTP',
        'Microsoft.XMLHTTP'
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
  function setRequestHeaders(xhr, requestData){
    var headers = {};

    if (IS_METHOD_WITH_BODY.test(requestData.method))
    {
      // when send a FormData instance, browsers serialize it and
      // set correct content-type header with boundary
      if (!FormData || requestData.body instanceof FormData == false)
        headers['Content-Type'] = requestData.contentType + (requestData.encoding ? '\x3Bcharset=' + requestData.encoding : '');
    }
    else
    {
      if (ua.test('ie')) // disable IE caching
      {
        // new Date(0).toGMTString() is not correct here;
        // IE returns date string with no leading zero and IIS may parse
        // date wrong and response with code 400
        headers['If-Modified-Since'] = 'Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }

    headers = basis.object.merge(headers, requestData.headers);

    objectIterate(requestData.headers, function(name, value){
      if (name.trim().toLowerCase() == 'content-type')
      {
        /** @cut */ basis.dev.warn('basis.net.ajax: `Content-Type` header found in request data, use contentType and encoding properties instead');
        headers['Content-Type'] = value;
      }
      else
        headers[name] = value;
    });

    objectIterate(headers, function(key, value){
      if (value != null && typeof value != 'function')
        xhr.setRequestHeader(key, value);
      else
        delete headers[key];
    });

    return headers;
  }


 /**
  * Set requestType
  */
  function setResponseType(xhr, requestData){
    if (requestData.responseType && requestData.asynchronous && 'responseType' in xhr)
      try {
        xhr.responseType = requestData.responseType;
      } catch(e) {
        /** @cut */ basis.dev.warn('Can\'t set resposeType `' + requestData.responseType + '` to XMLHttpRequest', requestData);
      }
  }


 /**
  * safe parse json
  */
  function safeJsonParse(content, url){
    try {
      return basis.json.parse(content);
    } catch(e) {
      /** @cut */ basis.dev.warn('basis.net.ajax: Can\'t parse JSON from ' + url, { url: url, content: content });
    }
  }


 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var xhr = this.xhr;
    var newState;
    var newStateData;
    var aborted;

    // reset send delay timer
    this.sendDelayTimer_ = clearTimeout(this.sendDelayTimer_);

    if (!xhr)
      return;

    if (typeof readyState != 'number')
      readyState = xhr.readyState;

    // BUGFIX: IE & Gecko fire OPEN readystate twice
    if (readyState == this.prevReadyState_)
      return;

    this.prevReadyState_ = readyState;

    /** @cut */ if (this.debug)
    /** @cut */   basis.dev.log('State: (' + readyState + ') ' + ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'][readyState]);

    // dispatch self event
    this.emit_readyStateChanged(readyState);

    if (readyState == STATE_DONE)
    {
      this.clearTimeout();

      // clean event handler
      xhr.onreadystatechange = basis.fn.$undef;

      aborted = xhr.status == 0;
      if (!aborted && !xhr.responseType)
        aborted = typeof xhr.responseText == 'unknown' || (!xhr.responseText && !xhr.getAllResponseHeaders());

      if (aborted)
      {
        this.emit_abort();
        newState = this.stateOnAbort;
      }
      else
      {
        this.processResponse();

        // dispatch events
        if (this.isSuccessful())
        {
          newState = STATE.READY;

          this.emit_success(this.getResponseData());
        }
        else
        {
          newState = STATE.ERROR;
          newStateData = this.getResponseError();

          // NOTE: for backward capability of deprecated behaviour
          // should be removed in future (deprecated in 1.2.0)
          if (!newStateData && this.data.error)
          {
            /** @cut */ basis.dev.warn('Request#getResponseError should not update request data, but returns error data. Please, fix your method implementation, as data updating is deprecated behaviour.');
            newStateData = this.data.error;
          }

          this.emit_failure(newStateData);
        }
      }

      // dispatch complete event
      this.emit_complete(this);
    }
    else
      newState = STATE.PROCESSING;

    // set new state
    this.setState(newState, newStateData);
  }


 /**
  * @class
  */
  var Request = AbstractRequest.subclass({
    className: namespace + '.Request',

    requestStartTime: 0,
    timeout: 30000, // 30 sec
    timer_: null,
    sendDelay: null,
    sendDelayTimer_: null,
    lastRequestUrl_: null,

    debug: false,

    emit_readyStateChanged: createRequestEvent('readyStateChanged'),

    init: function(){
      AbstractRequest.prototype.init.call(this);
      this.xhr = createXmlHttpRequest();
    },

    isIdle: function(){
      return this.xhr.readyState == STATE_DONE || this.xhr.readyState == STATE_UNSENT;
    },

    isSuccessful: function(){
      var status = this.xhr.status;
      return (status >= 200 && status < 300) || status == 304;
    },

    processResponse: function(){
      this.update({
        contentType: this.xhr.getResponseHeader('content-type'),
        status: this.xhr.status
      });
    },

    getResponseData: function(){
      var xhr = this.xhr;

      if (!xhr.responseType)
        if (this.responseType == 'json' || JSON_CONTENT_TYPE.test(this.data.contentType))
          return safeJsonParse(xhr.responseText, this.lastRequestUrl_);

      if ('response' in xhr)
        return xhr.response;

      return xhr.responseText;
    },

   /**
    * deprecated in 1.2.0
    * @deprecated
    */
    processErrorResponse: function(){
      /** @cut */ basis.dev.warn(namespace + '.Request#processErrorResponse is deprecated now, use Request#getResponseError instead');
      return this.getResponseError();
    },
    getResponseError: function(){
      var xhr = this.xhr;
      var msg = !this.responseType
                  ? xhr.responseText
                  : xhr.response || xhr.statusText || 'Error';

      return {
        code: 'SERVER_ERROR',
        msg: msg,
        response: this.getResponseData()
      };
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

      // prepare location & body
      if (!requestData.body && IS_METHOD_WITH_BODY.test(requestData.method))
      {
        requestData.body = params || '';
        params = '';
      }

      // process url
      if (requestData.routerParams)
        url = url.replace(/:([a-z\_\-][a-z0-9\_\-]+)/gi, function(m, key){
          if (key in requestData.routerParams)
            return requestData.routerParams[key]; // escapeValue?
          else
            return m;
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
        contentType: '',
        status: ''
      });

      // create new XMLHTTPRequest instance for gecko browsers in asynchronous mode
      // object crash otherwise
      if (ua.test('gecko1.8.1-') && requestData.asynchronous)
        this.xhr = createXmlHttpRequest();

      this.emit_start();

      var xhr = this.xhr;

      this.prevReadyState_ = -1;

      // set ready state change handler
      xhr.onreadystatechange = readyStateChangeHandler.bind(this);

      // catch state change for 'loading' in synchronous mode
      if (!requestData.asynchronous)
        readyStateChangeHandler.call(this, STATE_UNSENT);

      // open XMLHttpRequest
      xhr.open(requestData.method, requestData.requestUrl, requestData.asynchronous);
      this.lastRequestUrl_ = requestData.requestUrl;

      // set response type
      setResponseType(xhr, requestData);
      this.responseType = requestData.responseType || '';

      // set headers
      var requestHeaders = setRequestHeaders(xhr, requestData);

      // save transfer start point time & set timeout
      this.setTimeout(this.timeout);

      // prepare post body
      var payload = null;

      if (IS_METHOD_WITH_BODY.test(requestData.method))
      {
        payload = requestData.body;

        // auto stringify non-string payload if content-type is application/json
        // NOTE: don't stringify strings to avoid double stringify, as old user code
        //       stringify object on their side
        // TODO: remove this restriction, in future versions (introduced in 1.4)
        if (JSON_CONTENT_TYPE.test(requestHeaders['Content-Type']))
          if (typeof payload != 'string')
            payload = JSON.stringify(payload);

        // bug fixes for old IE
        if (ua.test('ie9-'))
        {
          if (typeof payload == 'object' && typeof payload.documentElement != 'undefined' && typeof payload.xml == 'string')
            // sending xmldocument content as string, otherwise IE override content-type header
            payload = payload.xml;
          else
            if (typeof payload == 'string')
              // ie stop send payload when found \r
              payload = payload.replace(/\r/g, '');
            else
              if (payload == null || payload == '')
                // IE doesn't accept null, undefined or '' post payload
                payload = '[No data]';
        }
      }

      // send data
      if (this.sendDelay)
      {
        if (this.sendDelayTimer_)
          this.sendDelayTimer_ = clearTimeout(this.sendDelayTimer_);

        this.sendDelayTimer_ = setTimeout(function(){
          this.sendDelayTimer_ = null;
          if (this.xhr === xhr && xhr.readyState == STATE_OPENED)
            xhr.send(payload);
        }.bind(this), this.sendDelay);
      }
      else
        xhr.send(payload);

      /** @cut */ if (this.debug)
      /** @cut */   basis.dev.log('Request over, waiting for response');

      return true;
    },

    repeat: function(){
      if (this.requestData)
      {
        this.abort();
        this.doRequest();
      }
    },

    abort: function(){
      if (!this.isIdle())
      {
        this.clearTimeout();
        this.xhr.abort();

        if (this.xhr.readyState != STATE_DONE && this.xhr.readyState != STATE_UNSENT)
          readyStateChangeHandler.call(this, STATE_DONE);
      }
    },

    setTimeout: function(timeout){
      // According to XMLHttpRequest specification, timeout property can't be set for synchronous
      // requests and browser must throw exception on property set (like Firefox and Chrome 29 does).
      // setTimeout also doesn't work in this case, because synchronous request blocks
      // browser and it never fire until request finished.
      // http://www.w3.org/TR/XMLHttpRequest/#the-timeout-attribute
      if (!this.xhr.asynchronous)
        return;

      if ('ontimeout' in this.xhr)
      {
        this.xhr.timeout = timeout;
        this.xhr.ontimeout = this.timeoutAbort.bind(this);
      }
      else
        this.timer_ = setTimeout(this.timeoutAbort.bind(this), timeout);
    },

    clearTimeout: function(){
      if (this.timer_)
        this.timer_ = clearTimeout(this.timer_);
    },

    timeoutAbort: function(){
      this.update({
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Timeout error'
        }
      });

      this.emit_timeout(this);
      this.abort();
    },

    destroy: function(){
      this.abort();
      this.xhr = null;

      AbstractRequest.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var Transport = AbstractTransport.subclass({
    className: namespace + '.Transport',

    requestClass: Request,

    emit_readyStateChanged: createTransportEvent('readyStateChanged'),

    // transport properties
    asynchronous: true,
    method: 'GET',
    contentType: 'application/x-www-form-urlencoded',
    encoding: null,
    requestHeaders: basis.Class.extensibleProperty(),
    responseType: '',
    params: null,
    routerParams: null,
    url: '',
    body: null,

    init: function(){
      AbstractTransport.prototype.init.call(this);

      /** @deprecated basis.js 1.4 */
      if ('postBody' in this)
      {
        /** @cut */ basis.dev.warn('basis.net.ajax.Transport: `postBody` paramenter is deprecated, use `body` instead');
        if (this.body == null)
          this.body = this.postBody;
        this.postBody = null;
      }

      this.params = objectSlice(this.params);
      this.routerParams = objectSlice(this.routerParams);
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
      if (!requestData.url && !this.url)
        throw new Error('URL is not defined');

      extend(requestData, {
        headers: objectMerge(this.requestHeaders, requestData.headers),
        params: objectMerge(this.params, requestData.params),
        routerParams: objectMerge(this.routerParams, requestData.routerParams)
      });

      /** @deprecated basis.js 1.4 */
      if ('postBody' in requestData)
      {
        /** @cut */ basis.dev.warn('basis.net.ajax.Transport: `postBody` paramenter is deprecated, use `body` instead');
        if (this.body == null)
          requestData.body = requestData.postBody;
        requestData.postBody = null;
      }

      basis.object.complete(requestData, {
        asynchronous: this.asynchronous,
        url: this.url,
        method: this.method,
        contentType: this.contentType,
        encoding: this.encoding,
        body: this.body,
        responseType: this.responseType
      });

      // process url with method prefix
      // i.e. 'POST /end/point' makes changes in requestData:
      //   requestData.method = 'POST'
      //   requestData.url = '/end/point'
      var urlMethodPrefix = requestData.url.match(URL_METHOD_PREFIX);
      if (urlMethodPrefix)
      {
        requestData.method = urlMethodPrefix[1];
        requestData.url = requestData.url.substr(urlMethodPrefix[0].length);
      }

      return requestData;
    }
  });


  //
  // exports
  //

  module.exports = {
    Request: Request,
    Transport: Transport,

    request: function(config, successCallback, failureCallback){
      if (typeof config == 'string')
        config = {
          url: config,
          asynchronous: !!(successCallback || failureCallback)
        };

      var transport = new Transport(config);
      transport.addHandler({
        success: successCallback && function(sender, req, data){
          successCallback(data);
        },
        failure: failureCallback && function(sender, req, error){
          failureCallback(error);
        },
        complete: function(){
          basis.nextTick(function(){
            transport.destroy();
          });
        }
      });

      var req = transport.request();

      if (!req.requestData.asynchronous)
        return req.getResponseData();
    }
  };
