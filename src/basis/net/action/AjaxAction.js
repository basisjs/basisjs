/**
 * @namespace basis.net.action
 */

var AjaxTransport = require('basis.net.ajax').Transport;
var Promise = require('basis.promise');
var STATE = require('basis.data').STATE;
var AbstractAction = require('basis.data.action').AbstractAction;
var ORIGINAL_DEFAULT_CALLBACK = AbstractAction.DEFAULT_CALLBACK;
var ORIGINAL_CALLBACK_HANDLER = AbstractAction.CALLBACK_HANDLER;
var createStaticFactory = AbstractAction.createStaticFactory;

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

var AjaxAction = AbstractAction.subclass({
  className: 'basis.data.action.AjaxAction',
  init: function(){
    AbstractAction.prototype.init.call(this);
    basis.object.complete(this.config, DEFAULT_CALLBACK);
    this.callback = basis.object.splice(this.config, ['start', 'success', 'failure', 'abort', 'complete']);
    this.fn = basis.object.complete(
      basis.object.slice(this.config, ['prepare', 'request']), {
      prepare: basis.fn.$undef,
      request: basis.fn.$undef
    });
  },
  getTransport: basis.fn.lazyInit(function(){
    var transport = resolveTransport(this.config);
    transport.addHandler(CALLBACK_HANDLER, this.callback);

    return transport;
  }),
  /**
   * @param {AbstractData!} dataInstance
   * @return {Promise}
   */
  exec: function(dataInstance){
    var actionInstance = this;
    var args = basis.array.from(arguments).slice(1);

    if (actionInstance.fn.prepare.apply(dataInstance, args))
    {
      /** @cut */ basis.dev.info('Prepare handler returns trulthy result. Operation aborted. Context: ', dataInstance);
      return Promise.reject('Prepare handler returns trulthy result. Operation aborted. Context: ', dataInstance);
    }

    var request;
    var requestData = basis.object.complete(
      basis.object.slice(this.config, ['body']),
      {
        origin: dataInstance,
        bodyContext: {
          context: dataInstance,
          args: args
        }
      },
      actionInstance.fn.request.apply(dataInstance, args)
    );

    if (typeof requestData.body == 'function')
    {
      var bodyFn = requestData.body;
      requestData.body = function(){
        return bodyFn.apply(this.context, this.args);
      };
    }

    // do a request
    if (request = actionInstance.getTransport().request(requestData))
      return new Promise(function(fulfill, reject){
        request.addHandler(PROMISE_REQUEST_HANDLER, {
          request: request,
          fulfill: fulfill,
          reject: reject
        });
      });

    return Promise.reject('Request is not performed');
  }
});

AjaxAction.CALLBACK_HANDLER = CALLBACK_HANDLER;
AjaxAction.DEFAULT_CALLBACK = DEFAULT_CALLBACK;

createStaticFactory(AjaxAction);

module.exports = AjaxAction;
