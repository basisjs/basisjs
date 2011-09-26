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

basis.require('basis.ua');
basis.require('basis.dom.event');
basis.require('basis.data');

!function(basis){

  'use strict';

  /** @namespace basis.net.ajax */

  var namespace = 'basis.net.ajax';

  // import names

  var Class = basis.Class;
  var Event = basis.dom.event;

  var Browser = basis.ua;
  var Cookies = basis.ua.Cookies;
  var Cleaner = basis.Cleaner;

  var TimeEventManager = basis.TimeEventManager;

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

  var DEBUG_MODE = Cookies.get('DEBUG_AJAX');

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
  * @function createEvent
  */
  function createEvent(eventName){
    var event = basis.EventObject.createEvent(eventName);
    var args = [eventName];
    return function(){
      TransportDispatcher.dispatch.apply(this, args.concat(arguments));
      event.apply(this, arguments);
    }
  }

 /**
  * @function createTransport
  * Creates transport constructor
  */
  var XHRSupport = 'native';
  var createTransport = function(){

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

  //
  // TransportDispatcher
  //

  var TransportDispatcher = (function(){

    var inprogressTransports = new Array();
    var handlers = [
      {
        handler: {
          start: function(){
            //console.log('add transport', this);
            inprogressTransports.add(this);
          },
          complete: function(){
            //console.log('remove transport', this);
            inprogressTransports.remove(this);
          }
        }
      }
    ];

    // clear handlers on destroy
    Event.onUnload(function(){
      handlers.clear();
    });

    return {
      addHandler: function(handler, thisObject){
        // search for duplicate
        for (var i = 0, item; item = handlers[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
            return false;

        // add handler
        handlers.push({ 
          handler: handler,
          thisObject: thisObject
        });

        return true;
      },
      removeHandler: function(handler, thisObject){
        // search for handler and remove
        for (var i = 0, item; item = handlers[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
          {
            handlers.splice(i, 1);
            return true;
          }

        // handler not found
        return false;
      },
      dispatch: function(event){
        // self event dispatch
        if (handlers.length)
        {
          var args = Array.prototype.slice.call(arguments, 1);
          var item, handler;
          for (var i = handlers.length - 1; item = handlers[i]; i--)
          {
            handler = item.handler[event];
            if (typeof handler == 'function')
              handler.apply(item.thisObject || this, args)
          }
        }
      },
      abort: function(){
        var result = Array.from(inprogressTransports);
        for (var i = 0; i < result.length; i++)
          result[i].abort();
        return result;
      }
    };
  })();

 /**
  * Sets transport request headers
  * @private
  */
  function setRequestHeaders(transport, requestData){
    var headers = {
      'JS-Framework': 'Basis'
    };

    if (IS_POST_REGEXP.test(requestData.method)) 
    {
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
    }, transport);
  };

 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var transport = this.transport;

    if (!transport)
      return;

    if (typeof readyState != 'number')
      readyState = transport.readyState;

    // BUGFIX: IE & Gecko fire OPEN readystate twice
    if (readyState == this.prevReadyState_)
      return;
    else
      this.prevReadyState_ = readyState;

    ;;;if (this.debug) logOutput('State: (' + readyState + ') ' + ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'][readyState]);

    // dispatch self event
    this.event_readyStateChanged(readyState);

    if (readyState == STATE_DONE)
    {
      TimeEventManager.remove(this, 'timeoutAbort');

      var newState = STATE.UNDEFINED;
      var error;

      // progress over (otherwise any abort method call may occur double readyStateChangeHandler call)
      this.progress = false;

      // clean event handler
      transport.onreadystatechange = Function.$undef;

      // case abort, success, fault
      if (this.aborted)
      {
        var abortedByTimeout = this.abortedByTimeout_;

        if (abortedByTimeout)
          this.event_timeout();

        // dispatch event
        this.event_abort(abortedByTimeout);

        ;;;if (this.debug) logOutput('Request aborted' + (abortedByTimeout ? ' (timeout)' : ''));
      }
      else
      {
        var isSuccess = this.responseIsSuccess();

        this.update({
          text: transport.responseText,
          xml: transport.responseXML
        });

        // dispatch events
        if (isSuccess)
        {
          this.event_success(transport);
          newState = STATE.READY;
        }
        else
        {
          this.event_failure(transport);
          newState = STATE.ERROR;
          error = this.getRequestError(transport);
        }

        // dispatch status
        this.event_httpStatus(transport, transport.status);
      }

      // dispatch complete event
      this.event_complete(transport);

      // set new state
      this.setState(newState, error);
    }
    else
      this.setState(STATE.PROCESSING);

    // dispatch event
    // there is not need any more
    // this.dispatch('state' + state);
  };

  function doRequest(requestData){
    TimeEventManager.remove(this, 'timeoutAbort'); // ???

    // set flags
    this.progress = false;
    this.aborted = false;
    this.abortedByTimeout_ = false;
    this.prevReadyState_ = -1;

    // create new XMLHTTPRequest instance for gecko browsers in asynchronous mode
    // object crash otherwise
    if (Browser.test('gecko1.8.1-') && requestData.asynchronous)
    {
      ;;;if (typeof console != 'undefined') console.info('Recreate transport (fix for current gecko version)');
      this.transport = createTransport();
    }

    var transport = this.transport;

    if (this.asynchronous)
      // set ready state change handler
      transport.onreadystatechange = readyStateChangeHandler.bind(this);
    else
      // catch state change for 'loading' in synchronous mode
      readyStateChangeHandler.call(this, STATE_UNSENT);

    // open transport
    transport.open(requestData.method, requestData.location, requestData.asynchronous);
    this.progress = true;
    this.aborted = false;
    this.abortedByTimeout_ = false;

    // set headers
    setRequestHeaders(transport, requestData);

    // progress started
    this.event_start();
    if (this.aborted)
    {
      ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted while `start` event dispatch');
      readyStateChangeHandler.call(this, STATE_DONE);
      return;  // request aborted
    }

    if (this.aborted || !this.progress)
    {
      ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted while response to readyState change dispatch');
      return;
    }

    // save transfer start point time & set timeout
    this.requestStartTime = Date.now();
    TimeEventManager.add(this, 'timeoutAbort', this.requestStartTime + this.timeout);

    // prepare post body
    var postBody = requestData.postBody;

    // BUGFIX: IE fixes for post body
    if (requestData.method == 'POST' && Browser.test('ie9-'))
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
            postBody = '[empty request]';      
    }

    // send data
    transport.send(postBody);

    // catching for
    //   - 'complete' state in synchronous mode
    //   - 'loading'  state for Opera
    /*if (!this.asynchronous)
    {
      var readyState = transport.readyState;
      while (readyState++ < STATE_DONE)
        readyStateChangeHandler.call(this, readyState);
    }*/

    ;;;if (this.debug) logOutput('Request over, waiting for response');

    return true;
  }

  //
  // Transport
  //

 /**
  * @class
  */
  var Transport = Class(DataObject, {
    className: namespace + '.Transport',

    state:     STATE.UNDEFINED,

    event_start: createEvent('start'),
    event_readyStateChanged: createEvent('readyStateChanged'),
    event_timeout: createEvent('timeout'),
    event_abort: createEvent('abort'),
    event_success: createEvent('success'),
    event_failure: createEvent('failure'),
    event_httpStatus: createEvent('httpStatus'),
    event_complete: createEvent('complete'),

    event_stateChanged: function(object, oldState){
      DataObject.prototype.event_stateChanged.call(this, object, oldState);

      for (var i = 0; i < this.influence.length; i++)
        this.influence[i].setState(this.state, this.state.data);
    },

    influence: null,
    debug: DEBUG_MODE,

    // object states
    progress: false,
    aborted: false,
    abortedByTimeout_: false,
    abortCalled: false,

    // times
    timeout:  30000, // 30 sec

    requestStartTime: 0,

    requestData_: null,

    // transport properties
    asynchronous: true,
    method: DEFAULT_METHOD,
    contentType: DEFAULT_CONTENT_TYPE,
    encoding: null,

    //
    // constructor
    //
    init: function(config){
      var influence = this.influence;

      // transport object
      this.transport = createTransport();
      this.requestHeaders = {};
      this.influence = new Array();

      // request params
      this.params = {};

      // transport transfer properties

      if (influence)
        this.setInfluence.apply(this, influence);

      Cleaner.add(this);  // ???

      // create inherit

      DataObject.prototype.init.call(this, config);

      // handlers
      if (this.callback)
        this.addHandler(this.callback, this);
    },

    setInfluence: function(){
      var list = Array.from(arguments);
      for (var i = 0; i < list.length; i++)
        list[i].setState(this.state, this.state.data);
      this.influence.set(list);
    },
    clearInfluence: function(){
      this.influence.clear();
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

    //
    // Event handlers
    //
    /*dispatch: function(eventName){
      // global event dispatch
      TransportDispatcher.dispatch.apply(this, arguments);
      //this.inherit.apply(this, arguments);
      DataObject.prototype.dispatch.apply(this, arguments);
    },*/

    //
    // Main actions
    //

    timeoutAbort: function(){
      this.abortedByTimeout_ = true;
      this.abort();
    },

    // abort request
    abort: function(timeout){
      ;;;if (this.debug && typeof console != 'undefined') console.info('Transport: abort method called');

      this.aborted = true;

      if (!this.progress)
        return;

      TimeEventManager.remove(this, 'timeoutAbort');

      this.progress = false;
      this.transport.abort();

      // BUGFIX: catching for 'Complete' state in asynchronous mode
      if (this.asynchronous && this.transport.onreadystatechange && this.transport.onreadystatechange !== Function.$undef)
        readyStateChangeHandler.call(this, STATE_DONE);
    },

    // do request
    request: function(url){
      //debugger;
      var location = url || this.url;
      var method = this.method.toUpperCase();
      var params;
      var postBody;
      var transport = this.transport;

      if (!transport)
        throw new Error('Transport is not allowed');

      if (!location)
        throw new Error('URL is not defined');

      // abort request for double sure that it doesn't in progress
      this.abort();

      // reset requestData & stored info
      delete this.requestData_;
      this.update({
        responseText: '',
        responseXml: null
      });

      this.progress = false;
      this.aborted = false;
      this.abortedByTimeout_ = false;

      // dispatch prepare event
      //this.dispatch('prepare');
      /*var handlers = this.handlers_;
      if (handlers)
      {
        var handler;
        for (var i = handlers.length; i --> 0;)
        {
          handler = handlers[i];
          if (handler.handler.prepare)
            handler.handler.prepare.call(handler.thisObject || this);
        }
      }

      if (this.aborted)
      {
        ;;;if (this.debug && typeof console != 'undefined') console.info('Transport: request was aborted while `prepare` event dispatch');
        //this.dispatch('abort', false);
        return;
      }*/

      // prepare url
      params = Object.iterate(this.params, function(key, value){
        return (value == null) || (value && typeof value.toString == 'function' && value.toString() == null)
          ? null
          : key + '=' + String(value.toString()).replace(/[\%\=\&\<\>\s\+]/g, function(m){ var code = m.charCodeAt(0).toHex(); return '%' + (code.length < 2 ? '0' : '') + code })//Encode.escape(basis.Crypt.UTF8.fromUTF16(value.toString()))
      }).filter(Function.$isNotNull).join('&');

      // prepare location & postBody
      if (IS_POST_REGEXP.test(method))
      {
        postBody = this.postBody || params || '';
      }
      else
      {
        if (params)
          location += (location.indexOf('?') == -1 ? '?' : '&') + params;
      }

      this.requestData_ = {
        method: method,
        location: location,
        contentType: this.contentType,
        encoding: this.encoding,
        asynchronous: this.asynchronous,
        headers: Object.extend({}, this.requestHeaders),
        postBody: postBody
      };

      return doRequest.call(this, this.requestData_);
    },

    repeat: function(){
      if (this.requestData_)
      {
        this.abort();
        return doRequest.call(this, this.requestData_);
      }
    },

    get: function(){
      this.request.apply(this, arguments);
    },

    // response status
    responseIsSuccess: function(){
      try {
        if (!this.aborted)
        {
          var status = this.transport.status;
          return (status == undefined)
              || (status == 0)
              || (status >= 200 && this.transport.status < 300);
        }
      } catch(e) {
      }
      return false;
    },

    getRequestError: function(req){
      return {
        code: 'SERVER_ERROR',
        msg: req.responseText
      }
    },

    destroy: function(){
      this.destroy = Function.$undef;

      delete this.requestData_;
      this.transport.onreadystatechange = Function.$undef;
      this.transport.abort();

      this.clearInfluence();

      DataObject.prototype.destroy.call(this);

      delete this.transport;
      Cleaner.remove(this);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    Transport: Transport,
    TransportDispatcher: TransportDispatcher,
    createEvent: createEvent
  });

}(basis);
