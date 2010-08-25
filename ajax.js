/*!asd
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
    * @namespace Basis.Ajax
    */

    var namespace = 'Basis.Ajax';

    // import names

    var Class = Basis.Class;
    var Event = Basis.Event;

    var complete = Object.complete;

    var Browser = Basis.Browser;
    var Cookies = Browser.Cookies;
    var Cleaner = Basis.Cleaner;

    //
    // Main part
    //

    // const
    var STATE = ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];
    var STATE_COMPLETE = 4;
    var METHOD = ['GET', 'POST', 'HEAD'];

    var DEBUG_MODE = Cookies.get('DEBUG_AJAX');
    var DEBUG_TIMEOUT = Cookies.get('DEBUG_AJAX_TIMEOUT');

    // base 
    var DEFAULT = {
      method: 'GET',
      contentType: 'application/x-www-form-urlencoded'
    };

    // TODO: better debug info out
    var infoOutput = typeof console != 'undefined' && console.log ? function(message){ console.log(message) } : Function.$self;
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
    var TransportProgID;
    var createTransport = function(){

      if (window.XMLHttpRequest)
      {
        TransportProgID = 'native';
        return function(){ return new XMLHttpRequest() };
      }

      if (window.ActiveXObject)
      {
        var progID = [
                      "MSXML2.XMLHTTP.6.0",
                      "MSXML2.XMLHTTP.3.0",
                      "MSXML2.XMLHTTP",
                      "Microsoft.XMLHTTP"
                     ];

        for (var i = 0; i < progID.length; i++)
          try { 
            if (new ActiveXObject(progID[i]))
            {
              TransportProgID = progID[i];
              return new Function('return new ActiveXObject("' + progID[i] + '")');
            }
          } catch(e) {}
      }

      return Function.$null;
    }();

    //
    // TransportDispatcher
    //

    var inprogressTransports = new Array();
    var TransportDispatcher = (function(){

      var handlers = new Array({
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
      });

      Event.onUnload(function(){
        // destroy events
        handlers.clear();
      });

      return {
        addHandler: function(handler, thisObject){
          // search for duplicate
          for (var i = 0, item; item = handlers[i]; i++)
            if (item.handler === handler && item.thisObject === thisObject)
              return;

          // add handler
          handlers.push({ 
            handler:    handler,
            thisObject: thisObject
          });
        },
        removeHandler: function(handler, thisObject){
          for (var i = 0, k = 0, item; item = handlers[i]; i++)
            if (item.handler !== handler || item.thisObject !== thisObject)
              handlers[k++] = this.handlers[i];

          handlers.length = k;
        },
        dispatch: function(event){
          // self event dispatch
          if (handlers.length)
          {
            var arg = Array.from(arguments, 1);
            var item, handler;
            for (var i = handlers.length - 1; i >= 0; i--)
            {
              item = handlers[i];
              handler = item.handler[event];
              if (typeof handler == 'function')
                if (handler.apply(item.thisObject || this, arg)) 
                  return; // cancel bubble
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
    * set transport request headers
    * private method
    * @function setRequestHeaders
    */
    function setRequestHeaders(){
      var headers = {
        'JavaScript-Framework': 'Basis 1.0'
      };

      if (this.method.toUpperCase() == 'POST') 
      {
        headers['Content-type'] = this.contentType + (this.encoding ? '\x3B charset=' + this.encoding : '');
        if (Browser.test('gecko'))
          headers['Connection'] = 'close';
      }
      else
        if (Browser.test('ie')) // disable IE caching
          headers['If-Modified-Since'] = 'Sat, 1 Jan 2000 00:00:00 GMT';

      complete(headers, this.requestHeaders);

      for (var name in headers)
        if (headers[name] != null) // some browsers (like IE) may crash if undefine value is set for header
          this.transport.setRequestHeader(name, headers[name]);
    };

   /**
    * readyState change handler
    * private method
    * @function respondToReadyStateChange
    */
    function respondToReadyStateChange(readyState){
      var state = STATE[typeof readyState == 'number' ? readyState : this.transport.readyState];

      //Basis.DOM.insert('log', Basis.DOM.createElement('', '>', Basis.DOM.createElement('B', state), ' ', Array.from(arguments, 1)));

      if (!this.transport) return;
      if (this.debug) infoOutput('State: (' + (arguments.length ? readyState : this.transport.readyState) + ') ' + state);

      // calc progress time
      this.requestTime = Date.now() - this.requestStartTime;

      // dispatch self event
      try {
        this.dispatch('changeState', state);
      } catch(e) {
        this.dispatchException(e, 'Transport error in `Complete` section handler, on status handler.');
      }

      if (state == 'Complete')
      {
        clearTimeout(this.timeoutTimer);

        // progress over (otherwise any abort method call may occur double respondToReadyStateChange call)
        this.progress = false;

        // clean event handler (avoid memory leak in MSIE)
        // remove? MSIE already drop hanlder on download complete. check it
        this.transport.onreadystatechange = Function.$undef;

        // case abort, statusCode, success, fault
        try {
          var dispatchCase;
          if (this.aborted)
          {
            // dispatch event
            this.dispatch(dispatchCase = 'abort');

            if (this.debug) infoOutput('Request aborted');
          }
          else if (this.timeoutAborted)
          {
            // dispatch event
            this.dispatch(dispatchCase = 'timeout');

            if (this.debug) infoOutput('Request timeout');
          }
          else
          {
            var isSuccess = this.responseIsSuccess();

            // dispatch events
            this.dispatch(dispatchCase = isSuccess ? 'success' : 'failure');

            // dispatch status
            this.dispatch(dispatchCase = 'status', this.transport.status);
          }
        } catch(e) {
          this.dispatchException(e, 'Transport error in `' + dispatchCase + '` case handler.');
        }

        // dispatch complete event
        try {
          this.dispatch('complete');
        } catch(e) { 
          this.dispatchException(e, 'Transport error in `Complete` section handler, on status handler.');
        }

        // reset flags
        this.aborted  = false;
        this.timeoutAborted = false;
      }

      // dispatch event
      // there is not need any more
      // this.dispatch('state' + state);
    };

    //
    // Transport
    //

   /**
    * @class
    */
    var Transport = Class(null, {
      className: namespace + '.Transport',

      behaviour: {},
      onRequest: Function.$true,
      debug:     DEBUG_MODE,

      // object states
      progress: false,
      aborted:  false,
      timeoutAborted: false,
      abortCalled: false,

      // times
      timeout: 30000,  // 30 sec
      timeoutTimer: null,

      requestStartTime: 0,
      requestTime: 0,

      // transport properties
      asynchronous: true,
      method:       DEFAULT.method,
      contentType:  DEFAULT.contentType,
      encoding:     null,

      // behaviour
      defaultFailureError: true,
      completeRequest: false,

      //
      // constructor
      //
      init: function(urlOrConfig, asynchronous, method){
        var config = typeof urlOrConfig != 'object' || urlOrConfig == null ? {} : urlOrConfig;
        var url = config === urlOrConfig ? config.url : urlOrConfig;

        // event handlers
        this.handlers = new Array();

        // transport object
        this.transport = createTransport();

        // request params
        this.url = url;
        this.params = {};

        // transport transfer properties
        if (method || config.method)
          this.method = method || config.method;

        if (asynchronous != null && !asynchronous)
          this.asynchronous = false;

        // handlers
        if (config.callback)
          this.addHandler(config.callback);

        if (config.paramMapping)
          this.paramMapping = Array.from(config.paramMapping);

        Cleaner.add(this);
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
      addHandler: function(handler, thisObject){
        thisObject = thisObject || this;

        // search for duplicate
        for (var i = 0, item; item = this.handlers[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
            return;

        // add handler
        this.handlers.push({ 
          handler:    handler,
          thisObject: thisObject
        });
      },
      removeHandler: function(handler, thisObject){
        thisObject = thisObject || this;

        for (var i = 0, k = 0, item; item = this.handlers[i]; i++)
          if (item.handler !== handler || item.thisObject !== thisObject)
            this.handlers[k++] = this.handlers[i];

        this.handlers.length = k;
      },
      clearHandlers: function(){
        this.handlers.clear();
      },
      dispatch: function(event){
        // global event dispatch
        TransportDispatcher.dispatch.apply(this, arguments);

        // self event dispatch
        var behaviour = this.behaviour[event];
        if (this.handlers.length || behaviour)
        {
          var arg = [this.transport].concat(Array.from(arguments, 1));
          var item, handler;
          for (var i = this.handlers.length - 1; i >= 0; i--)
          {
            item = this.handlers[i];

            ;;;if (DEBUG_MODE) { handler = item.handler['any']; if (typeof handler == 'function') handler.apply(this, arguments); }

            handler = item.handler[event];
            if (typeof handler == 'function')
              if (handler.apply(item.thisObject, arg))
                return; // cancel bubble
          }

          if (typeof behaviour == 'function')
            behaviour.apply(this, arg);
        }
      },

      dispatchException: function(e, comment){
        this.dispatch('exception', e, comment);

        // old model; probably deprecated
        if (this.onException)
          this.onException(e, comment);
        else
          infoOutput(exception(e) + '\n' + comment);
          //throw new Error(Basis.Debug.exception(exception) + '\n' + comment);
      },

      getRequestHeader: function(name){
        return this.requestHeaders && this.requestHeaders[name];
      },

      //
      // Main actions
      //

      // abort request
      abort: function(timeout){
        //Basis.DOM.insert('log', Basis.DOM.createElement('', '>>', Basis.DOM.createElement('B', 'abort'), ' ', Array.from(arguments, 1)));
        clearTimeout(this.timeoutTimer);

        ;;;if (this.debug && typeof console != 'undefined') console.info('Transport: abort method called');

        this.abortCalled = true;
        if (!this.progress)
          return;

        //Basis.DOM.insert('log', Basis.DOM.createElement('', '!!!'));

        if (timeout)
          this.timeoutAborted = true;
        else
          this.aborted = true;

        this.progress = false;
        this.transport.abort(1);

        // fix: catching for 'Complete' state in asynchronous mode for Opera
        if (this.asynchronous && Browser.test('opera') && this.destroy !== Function.$undef)
          respondToReadyStateChange.call(this, STATE_COMPLETE);
      },

      // do request
      request: function(url){
        var location, params;
        var method, data;

        if (!this.transport)
          throw new Error('Transport is not allowed');

        // if requested already
        if (this.progress)
          // don't start request until previous request not over
          if (this.completeRequest) 
            return;
          else
            this.abort();

        if (url) 
          this.url = url;

        if (this.paramMapping && arguments.length > 1)
          for (var i = 0, key; key = this.paramMapping[i++];)
            this.setParam(key, arguments[i]);

        try {
          clearTimeout(this.timeoutTimer);

          // set flags
          this.progress = false;
          this.aborted  = false;
          this.timeoutAborted = false;
          this.abortCalled = false;

          // # dispatch prepare event
          this.dispatch('prepare');
          if (this.abortCalled)
          {
            ;;;if (this.debug && typeof console != 'undefined') console.info('Transport: request was aborted while `prepare` event dispatch');
            this.dispatch('abort');
            return;
          }
              
          // onRequest handler (obsolete)
          // TODO: remove
          if (this.onRequest && !this.onRequest(this.transport))
          {
            ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted because onRequest() doesn\'t return a true value');
            this.dispatch('abort');
            return;
          }

          method = this.method.toUpperCase();

          if (!this.url)
            throw new Error('URL is not defined');

          // prepare url
          params = Object.iterate(this.params, function(key, value){
            return (value == null) || (value && typeof value.toString == 'function' && value.toString() == null)
              ? null
              : key + '=' + Encode.escape(value)
          }).filter(Function.$isNotNull).join('&');
          //console.log(params);

          location = this.url;
          if (method == 'GET' && params)
            location += (this.url.indexOf('?') == -1 ? '?' : '&') + params;

          // create new XMLHTTPRequest instance for gecko browsers in asynchronous mode
          // object crash otherwise
          if (Browser.test('gecko1.8.1-') && this.asynchronous)
          {
            ;;;if (typeof console != 'undefined') console.info('Recreate transport (fix for current gecko version)');
            this.transport = createTransport();
          }

          // open transport
          this.transport.open(this.method, location, this.asynchronous);

          this.progress = true;

          // progress started
          this.dispatch('start');
          if (this.abortCalled)
          {
            ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted while `start` event dispatch');
            respondToReadyStateChange.call(this, STATE_COMPLETE);
            return;  // request aborted
          }

          // set headers
          setRequestHeaders.call(this);

          if (this.asynchronous)
            // set ready state change handler
            this.transport.onreadystatechange = respondToReadyStateChange.bind(this);
          else
            // catch state change for 'loading' in synchronous mode
            respondToReadyStateChange.call(this);

          if (!this.progress)
          {
            ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted while response to readyState change dispatch');
            return;
          }

          // save transfer start point time
          this.requestStartTime = Date.now();

          // set timeout
          ;;;if (DEBUG_TIMEOUT) { this.timeout = Math.random() * 2000; if (typeof console != 'undefined') console.log('set random timeout: {0#.2} sec'.format(this.timeout/1000)); }
          if (this.timeout)
            this.timeoutTimer = setTimeout(function(){ this.abort(true); }.bind(this), this.timeout);

          // send data
          if (method == 'POST')
          {
            //debugger;
            data = this.postBody || params || '';

            if (Browser.test('ie'))                // IE XHR fixes
            {
              if (typeof data == 'object' && typeof data.documentElement != 'undefined' && typeof data.xml == 'string')
                data = data.xml;                   // sending xmldocument content as string, otherwise IE override content-type header
              else
                if (typeof data == 'string')        
                  data = data.replace(/\r/g, '');  // ie stop send data when found \r
                else
                  if (data == null || data == '')
                    data = '[empty request]';      // don't understand null, undefined or '' post body
            }
            this.transport.send(data);
          }
          else
            this.transport.send(null);

          // catching for
          //   - 'complete' state in synchronous mode
          //   - 'loading'  state for Opera
          if (!this.asynchronous || Browser.test('opera'))
            respondToReadyStateChange.call(this);

          if (this.debug) infoOutput('Request over, waiting for response');
        } catch (e) {
          this.progress = false;
          this.dispatchException(e, 'Transport request error');
        }
      },

      get: function(){
        this.request.apply(this, arguments);
      },

      // response status
      responseIsSuccess: function() {
        try {
          return this.aborted ? false :
                      (this.transport.status == undefined)
                   || (this.transport.status == 0)
                   || (this.transport.status >= 200 && this.transport.status < 300);
        } catch(e) { 
          this.dispatchException(e, 'Get transport status error.');
        }
      },

      destroy: function(){
        this.destroy = Function.$undef;

        this.handlers.clear();

        this.transport.onreadystatechange = Function.$undef;
        this.transport.abort();

        this.inherit();

        Cleaner.remove(this);
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Transport: Transport,
      TransportDispatcher: TransportDispatcher
    });

  })();
