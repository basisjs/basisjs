
 /**
  * @namespace basis.net.action
  */


  //
  // import names
  //

  var STATE = require('basis.data').STATE;
  var STATE_UNDEFINED = STATE.UNDEFINED;
  var STATE_READY = STATE.READY;
  var STATE_PROCESSING = STATE.PROCESSING;
  var STATE_ERROR = STATE.ERROR;

  var AjaxTransport = require('basis.net.ajax').Transport;
  var Promise = require('basis.promise');


  //
  // main part
  //

  var nothingToDo = function(){};

  // default transport handler
  var CALLBACK_HANDLER = {
    start: function(transport, request){
      var origin = request.requestData.origin;

      this.start.call(request.requestData.origin);

      if (origin.state != STATE_PROCESSING)
        origin.setState(STATE_PROCESSING);
    },
    success: function(transport, request, data){
      var origin = request.requestData.origin;

      this.success.call(origin, data);

      if (origin.state == STATE_PROCESSING)
        origin.setState(STATE_READY);
    },
    failure: function(transport, request, error){
      var origin = request.requestData.origin;

      this.failure.call(origin, error);

      if (origin.state == STATE_PROCESSING)
        origin.setState(STATE_ERROR, error);
    },
    abort: function(transport, request){
      var origin = request.requestData.origin;

      this.abort.call(origin);

      if (origin.state == STATE_PROCESSING)
        origin.setState(transport.stateOnAbort || request.stateOnAbort || STATE_UNDEFINED);
    },
    complete: function(transport, request){
      this.complete.call(request.requestData.origin);
    }
  };

  // default callbacks
  var DEFAULT_CALLBACK = {
    start: nothingToDo,
    success: nothingToDo,
    failure: nothingToDo,
    abort: nothingToDo,
    complete: nothingToDo
  };

  var PROMISE_REQUEST_HANDLER = {
    success: function(request, data){
      this.fulfill(data);
    },
    abort: function(){
      this.reject('Request aborted');
    },
    failure: function(request, error){
      this.reject(error);
    },
    complete: function(){
      this.request.removeHandler(PROMISE_REQUEST_HANDLER, this);
    }
  };

 /**
  * @function
  */
  function resolveTransport(config){
    if (config.transport)
      return config.transport;

    if (config.service)
      return config.service.createTransport(config);

    if (config.createTransport)
      return config.createTransport(config);

    // fallback, create instance of basis.net.ajax.Transport by default, if no other options
    return new AjaxTransport(config);
  }

 /**
  * Creates a function that init service transport if necessary and make a request.
  * @function
  */
  function createAction(config){
    // make a copy of config with defaults
    config = basis.object.extend({
      prepare: nothingToDo,
      request: nothingToDo
    }, config);

    // if body is function take in account special action context
    if (typeof config.body == 'function')
    {
      var bodyFn = config.body;
      config.body = function(){
        return bodyFn.apply(this.context, this.args);
      };
    }

    // splice properties
    var fn = basis.object.splice(config, ['prepare', 'request']);
    var callback = basis.object.merge(
      DEFAULT_CALLBACK,
      basis.object.splice(config, ['start', 'success', 'failure', 'abort', 'complete'])
    );

    // lazy transport
    var getTransport = basis.fn.lazyInit(function(){
      var transport = resolveTransport(config);

      transport.addHandler(CALLBACK_HANDLER, callback);

      return transport;
    });

    return function action(){
      // this - instance of AbstractData
      if (this.state != STATE_PROCESSING)
      {
        if (fn.prepare.apply(this, arguments))
        {
          /** @cut */ basis.dev.warn('Prepare handler returns trulthy result. Operation aborted. Context: ', this);
          return Promise.reject('Prepare handler returns trulthy result. Operation aborted. Context: ', this);
        }

        var request;
        var requestData = basis.object.complete({
          origin: this,
          bodyContext: {
            context: this,
            args: basis.array(arguments)
          }
        }, fn.request.apply(this, arguments));

        // if body is function take in account special action context
        if (typeof requestData.body == 'function')
        {
          var bodyFn = requestData.body;
          requestData.body = function(){
            return bodyFn.apply(this.context, this.args);
          };
        }

        // do a request
        if (request = getTransport().request(requestData))
          return new Promise(function(fulfill, reject){
            request.addHandler(PROMISE_REQUEST_HANDLER, {
              request: request,
              fulfill: fulfill,
              reject: reject
            });
          });

        return Promise.reject('Request is not performed');
      }
      else
      {
        /** @cut */ basis.dev.warn('Context in processing state. Operation aborted. Context: ', this);
        return Promise.reject('Context in processing state, request is not performed');
      }
    };
  }


  //
  // export names
  //

  module.exports = {
    create: createAction
  };
