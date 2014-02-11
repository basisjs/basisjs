
  basis.require('basis.ua');
  basis.require('basis.net');
  basis.require('basis.data');


  var namespace = this.path;

  var ua = basis.ua;
  var extend = basis.object.extend;
  var objectSlice = basis.object.slice;
  var objectMerge = basis.object.merge;
  var createTransportEvent = basis.net.createTransportEvent;
  var createRequestEvent = basis.net.createRequestEvent;
  var AbstractRequest = basis.net.AbstractRequest;
  var AbstractTransport = basis.net.AbstractTransport;

  /** @const */ var STATE_UNSENT = 0;
  /** @const */ var STATE_OPENED = 1;
  /** @const */ var STATE_HEADERS_RECEIVED = 2;
  /** @const */ var STATE_LOADING = 3;
  /** @const */ var STATE_DONE = 4;

  var STATE = basis.data.STATE;
  var METHODS = 'HEAD GET POST PUT PATCH DELETE TRACE LINK UNLINK CONNECT'.split(' ');
  var IS_POST_REGEXP = /POST/i;
  var IS_METHOD_WITH_BODY = /^(POST|PUT|PATCH|LINK|UNLINK)$/i;
  var escapeValue = encodeURIComponent;


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
  function setRequestHeaders(request, requestData){
    var headers = {};

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

    basis.object.iterate(extend(headers, requestData.headers), function(key, value){
      if (value != null && typeof value != 'function')
        this.setRequestHeader(key, value);
    }, request);
  }


 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var transport = this.transport;
    var xhr = this.xhr;
    var newState;

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

      if (typeof xhr.responseText == 'unknown' || (!xhr.responseText && !xhr.getAllResponseHeaders()))
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
          this.emit_success(this.getResponseData());
          newState = STATE.READY;
        }
        else
        {
          this.processErrorResponse();

          this.emit_failure(this.data.error);
          newState = STATE.ERROR;
        }
      }

      // dispatch complete event
      this.emit_complete(this);
    }
    else
      newState = STATE.PROCESSING;

    // set new state
    this.setState(newState, this.data.error);
  }

  /**
   * @class AjaxRequest
   */

  var Request = AbstractRequest.subclass({
    className: namespace + '.Request',

    requestStartTime: 0,
    timeout: 30000, // 30 sec
    timer_: null,

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
        contentType: this.xhr.getResponseHeader('content-type'),
        responseText: this.xhr.responseText,
        responseXML: this.xhr.responseXML,
        status: this.xhr.status
      });
    },

    getResponseData: function(){
      if (/^application\/json/i.test(this.data.contentType))
      {
        try {
          var content = String(this.data.responseText);
          return basis.json.parse(content);
        } catch(e) {
          /** @cut */ consoleMethods.warn('basis.net: Can\'t parse JSON from ' + this.url, { url: url, content: content });
        }
      }
      else
        return this.data.responseText;
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
        responseText: '',
        responseXML: '',
        status: '',
        error: ''
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

    init: function(){
      AbstractTransport.prototype.init.call(this);

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
        headers: objectMerge(this.requestHeaders, requestData.headers),
        postBody: requestData.postBody || this.postBody,
        params: objectMerge(this.params, requestData.params),
        routerParams: requestData.routerParams,
        influence: requestData.influence
      });

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
