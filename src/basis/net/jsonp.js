
  basis.require('basis.net');
  basis.require('basis.data');


  var namespace = this.path;

  var document = global.document;
  var escapeValue = global.encodeURIComponent;
  var extend = basis.object.extend;
  var objectSlice = basis.object.slice;
  var objectMerge = basis.object.merge;
  var createTransportEvent = basis.net.createTransportEvent;
  var createRequestEvent = basis.net.createRequestEvent;
  var AbstractRequest = basis.net.AbstractRequest;
  var AbstractTransport = basis.net.AbstractTransport;
  var STATE = basis.data.STATE;

  /** @const */ var STATE_UNSENT = 0;
  /** @const */ var STATE_OPENED = 1;
  /** @const */ var STATE_LOADING = 3;
  /** @const */ var STATE_DONE = 4;


  var callbackData = {};

  function getCallback(){
    var name = 'basisjsJsonpCallback' + parseInt(Math.random() * 10e10);

    global[name] = function(data){
      callbackData[name] = data;
    };

    return name;
  }

  function fetchCallbackData(name){
    var data = callbackData[name];
    delete callbackData[name];
    return data;
  }

  function releaseCallback(name){
    delete callbackData[name];
    delete global[name];
  }


 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState, abort){
    var newState;
    var newStateData;
    var error = false;

    if (typeof readyState != 'number')
    {
      // nothing to do if event for previous script fired
      if (!readyState || this.script !== readyState.target)
        return;

      error = readyState && readyState.type == 'error';
      readyState = error || !this.script.readyState || /loaded|complete/.test(this.script.readyState) ? STATE_DONE : STATE_LOADING;
    }

    if (readyState == this.prevReadyState_)
      return;

    this.prevReadyState_ = readyState;

    // dispatch self event
    this.emit_readyStateChanged(readyState);

    if (readyState == STATE_DONE)
    {
      this.clearTimeout();

      // remove event handlers
      this.script.onload = this.script.onerror = this.script.onreadystatechange = null;

      // remove the script
      if (this.script.parentNode)
        this.script.parentNode.removeChild(this.script);

      // dereference the script
      this.script = null;

      if (abort)
      {
        this.emit_abort();
        newState = this.stateOnAbort;
      }
      else
      {
        this.processResponse();

        // dispatch events
        if (this.isSuccessful() && !error)
        {
          newState = STATE.READY;

          this.emit_success(this.getResponseData());
        }
        else
        {
          newState = STATE.ERROR;
          newStateData = this.getResponseError();

          this.emit_failure(newStateData);
        }
      }

      // dispatch complete event
      this.emit_complete(this);

      // cleanup callback
      var callback = this.callback;
      if (abort)
      {
        // if request aborted delete callback in 5 mins or on callback invocation
        setTimeout(global[callback] = function(){
          releaseCallback(callback);
        }, 5 * 60 * 1000);
      }
      else
      {
        // otherwise release callback immediately
        releaseCallback(callback);
      }
    }
    else
      newState = STATE.PROCESSING;

    // set new state
    this.setState(newState, newStateData);
  }

  /**
   * @class AjaxRequest
   */

  var Request = AbstractRequest.subclass({
    className: namespace + '.Request',

    timeout: 30000, // 30 sec
    timer_: null,

    emit_readyStateChanged: createRequestEvent('readyStateChanged'),

    isIdle: function(){
      return !this.script;
    },

    isSuccessful: function(){
      return this.data.status == 200;
    },

    processResponse: function(){
      if (this.callback in callbackData)
        this.update({
          contentType: 'application/javascript',
          data: fetchCallbackData(this.callback),
          status: 200
        });
    },

    getResponseData: function(){
      return this.data.data;
    },

    getResponseError: function(){
      return {
        code: 'ERROR',
        msg: 'ERROR'
      };
    },

    prepare: basis.fn.$true,

    prepareRequestData: function(requestData){
      var params = [];
      var url = requestData.url;

      // make a copy
      requestData = objectSlice(requestData);
      this.callback = getCallback();

      for (var key in requestData.params)
      {
        var value = requestData.params[key];

        if (value == null || value.toString() == null)
          continue;

        params.push(escapeValue(key) + '=' + escapeValue(value.toString()));
      }

      params.push(escapeValue(requestData.callbackParam) + '=' + escapeValue(this.callback));
      params = params.join('&');

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
      if (!document)
        throw 'JSONP is not supported for current environment';

      var head = document.head || document.getElementByName('head')[0] || document.documentElement;
      var script = document.createElement('script');

      // reset data
      this.update({
        data: undefined,
        status: '',
        error: ''
      });

      // set up transport
      this.script = script;
      script.async = true;
      script.src = requestData.requestUrl;
      script.charset = requestData.encoding;
      script.onload = script.onerror = script.onreadystatechange = readyStateChangeHandler.bind(this);

      // emit start event
      this.prevReadyState_ = -1;
      this.emit_start();

      // catch state change for 'loading' in synchronous mode
      readyStateChangeHandler.call(this, STATE_UNSENT);

      // save transfer start point time & set timeout
      this.setTimeout(this.timeout);

      // send request
      head.appendChild(this.script);
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
        readyStateChangeHandler.call(this, STATE_DONE, true);
      }
    },

    setTimeout: function(timeout){
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

      AbstractRequest.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var Transport = AbstractTransport.subclass({
    className: namespace + '.Transport',

    requestClass: Request,

    emit_readyStateChanged: createRequestEvent('readyStateChanged'),

    // transport properties
    encoding: null,
    params: null,
    callbackParam: 'callback',

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
        url: url,
        encoding: requestData.encoding || this.encoding,
        params: objectMerge(this.params, requestData.params),
        routerParams: requestData.routerParams,
        callbackParam: requestData.callbackParam || this.callbackParam,
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
          url: config
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

      transport.request();
    }
  };
