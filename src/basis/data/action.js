/**
 * @namespace basis.data.action
 */

var Promise = require('basis.promise');
var STATE = require('basis.data').STATE;

var CALLBACK_HANDLER = {
  start: function(dataInstance){
    this.start.call(dataInstance);

    if (dataInstance.state != STATE.PROCESSING)
      dataInstance.setState(STATE.PROCESSING);
  },
  success: function(dataInstance, data){
    this.success.call(dataInstance, data);

    if (dataInstance.state == STATE.PROCESSING)
      dataInstance.setState(STATE.READY);
  },
  failure: function(dataInstance, error){
    this.failure.call(dataInstance, error);

    if (dataInstance.state == STATE.PROCESSING)
      dataInstance.setState(STATE.ERROR, error);
  },
  complete: function(dataInstance){
    this.complete.call(dataInstance);
  }
};

var DEFAULT_CALLBACK = {
  start: basis.fn.$undef,
  success: basis.fn.$undef,
  failure: basis.fn.$undef,
  complete: basis.fn.$undef
};

function create(config){
  var callback;

  basis.object.complete(config, {
    fn: basis.fn.$undef
  });
  basis.object.complete(config, DEFAULT_CALLBACK);
  callback = basis.object.splice(config, ['start', 'success', 'failure', 'complete']);

  /**
   * @this {AbstractData}
   */
  return function action(){
    var dataInstance = this;
    var fnResult;

    if (this.state != STATE.PROCESSING)
    {
      CALLBACK_HANDLER.start.call(callback, dataInstance);
      fnResult = config.fn.call(dataInstance);
      // force transform of fn result to promise
      return Promise.resolve(fnResult)
        .then(function(data){
          CALLBACK_HANDLER.success.call(callback, dataInstance, data);
          CALLBACK_HANDLER.complete.call(callback, dataInstance);

          return data;
        }, function(error){
          CALLBACK_HANDLER.failure.call(callback, dataInstance, error);
          CALLBACK_HANDLER.complete.call(callback, dataInstance);

          return Promise.reject(error);
        });
    }
    else
    {
      /** @cut */ basis.dev.warn('Context in processing state. Operation aborted. Context: ', this);
      return Promise.reject('Context in processing state, request is not performed');
    }
  };
}

module.exports = {
  create: create,
  CALLBACK_HANDLER: CALLBACK_HANDLER,
  DEFAULT_CALLBACK: DEFAULT_CALLBACK
};
