
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

 // default promise handler
 var PROMISE_CALLBACK_HANDLER = {
   start: function(dataInstance){
     this.start.call(dataInstance);

     if (dataInstance.state != STATE_PROCESSING)
       dataInstance.setState(STATE_PROCESSING);
   },
   success: function(dataInstance, data){
     this.success.call(dataInstance, data);

     if (dataInstance.state == STATE_PROCESSING)
       dataInstance.setState(STATE_READY);
   },
   failure: function(dataInstance, error){
     this.failure.call(dataInstance, error);

     if (dataInstance.state == STATE_PROCESSING)
       dataInstance.setState(STATE_ERROR, error);
   },
   complete: function(dataInstance){
     this.complete.call(dataInstance);
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
          /** @cut */ basis.dev.info('Prepare handler returns trulthy result. Operation aborted. Context: ', this);
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

  /**
   * Creates a function that changing a state of data by promise result.
   * @function
   */
  function fromPromise(config){
    if (typeof config == 'function') {
      config = {
        fn: config
      };
    }

    config = basis.object.extend({
      fn: nothingToDo
    }, config);

    var callback = basis.object.merge(
      DEFAULT_CALLBACK,
      basis.object.splice(config, ['start', 'success', 'failure', 'complete'])
    );

    return function action(){
      // this - instance of AbstractData
      if (this.state != STATE_PROCESSING) {
        var dataInstance = this;

        PROMISE_CALLBACK_HANDLER.start.call(callback, this);

        return Promise.resolve().then(function(){
          return config.fn.call(dataInstance);
        }).then(function(data){
          // possible errors in success or complete callbacks must not change the main promise result
          return new Promise(function(resolve){
            PROMISE_CALLBACK_HANDLER.success.call(callback, dataInstance, data);
            PROMISE_CALLBACK_HANDLER.complete.call(callback, dataInstance);

            resolve(data);
          }).catch(function(){
            return data;
          });
        }, function(error){
          // possible errors in failure or complete callbacks must not change the main promise result
          return new Promise(function(resolve, reject){
            PROMISE_CALLBACK_HANDLER.failure.call(callback, dataInstance, error);
            PROMISE_CALLBACK_HANDLER.complete.call(callback, dataInstance);

            reject();
          }).catch(function(){
            return Promise.reject(error);
          });
        });
      }
      else {
        /** @cut */ basis.dev.warn('Context in processing state. Operation aborted. Context: ', this);
        return Promise.reject('Context in processing state, request is not performed');
      }
    };
  }

  //
  // export names
  //

  module.exports = {
    create: createAction,
    fromPromise: fromPromise
  };
