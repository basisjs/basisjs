/**
 * @namespace basis.net.action
 */

var AjaxTransport = require('basis.net.ajax').Transport;
var Promise = require('basis.promise');
var STATE = require('basis.data').STATE;
var action = require('basis.data.action');
var ORIGINAL_DEFAULT_CALLBACK = action.DEFAULT_CALLBACK;
var ORIGINAL_CALLBACK_HANDLER = action.CALLBACK_HANDLER;

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

var DEFAULT_CALLBACK = basis.object.slice(ORIGINAL_DEFAULT_CALLBACK);
basis.object.complete(DEFAULT_CALLBACK, { abort: basis.fn.$undef });

var CALLBACK_HANDLER = {
  start: function(transport, request){
    ORIGINAL_CALLBACK_HANDLER.start.call(this, request.requestData.origin);
  },
  success: function(transport, request, data){
    ORIGINAL_CALLBACK_HANDLER.success.call(this, request.requestData.origin, data);
  },
  failure: function(transport, request, error){
    ORIGINAL_CALLBACK_HANDLER.failure.call(this, request.requestData.origin, error);
  },
  abort: function(transport, request){
    var origin = request.requestData.origin;

    this.abort.call(origin);

    if (origin.state == STATE.PROCESSING)
      origin.setState(transport.stateOnAbort || request.stateOnAbort || STATE.UNDEFINED);
  },
  complete: function(transport, request){
    ORIGINAL_CALLBACK_HANDLER.complete.call(this, request.requestData.origin);
  }
};

function create(config){
  var fn;
  var callback;
  var getTransport = basis.fn.lazyInit(function(){
    var transport = resolveTransport(config);

    transport.addHandler(CALLBACK_HANDLER, callback);

    return transport;
  });

  basis.object.complete(config, DEFAULT_CALLBACK);
  callback = basis.object.splice(config, ['start', 'success', 'failure', 'abort', 'complete']);
  fn = basis.object.complete(
    basis.object.slice(config, ['prepare', 'request']), {
      prepare: basis.fn.$undef,
      request: basis.fn.$undef
    });

  return function action(){
    var dataInstance = this;
    var requestData;
    var request;
    var args = basis.array.from(arguments);

    if (fn.prepare.apply(dataInstance, args)) {
      /** @cut */ basis.dev.info('Prepare handler returns trulthy result. Operation aborted. Context: ', dataInstance);
      return Promise.reject('Prepare handler returns trulthy result. Operation aborted. Context: ', dataInstance);
    }

    requestData = basis.object.complete(
      basis.object.slice(config, ['body', 'contentType', 'encoding']),
      {
        contentType: 'application/json',
        encoding: 'utf8',
        origin: dataInstance,
        bodyContext: {
          context: dataInstance,
          args: args
        }
      },
      fn.request.apply(dataInstance, args)
    );

    if (typeof requestData.body == 'function') {
      var bodyFn = requestData.body;

      requestData.body = function(){
        return bodyFn.apply(this.context, this.args);
      };
    }

    // do a request
    if (request = getTransport().request(requestData)) {
      return new Promise(function(fulfill, reject){
        request.addHandler(PROMISE_REQUEST_HANDLER, {
          request: request,
          fulfill: fulfill,
          reject: reject
        });
      });
    }

    return Promise.reject('Request is not performed');
  };
}

module.exports = {
  create: create,
  CALLBACK_HANDLER: CALLBACK_HANDLER,
  DEFAULT_CALLBACK: DEFAULT_CALLBACK
};
