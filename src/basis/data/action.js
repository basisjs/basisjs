/**
 * @namespace basis.data.action
 */

var STATE = require('basis.data').STATE;
var Promise = require('basis.promise');

var AbstractAction = basis.Class(null, {
  className: 'basis.data.action.AbstractAction',
  extendConstructor_: true,
  /**
   * @param {AbstractData!} dataInstance
   * @param {...*} args
   * @return {Promise}
   */
  exec: function(){
    /** @cut */ basis.dev.warn('Implementation for basis.data.Action#exec not found. Context: ', this);
    return Promise.reject('Abstract method');
  },
  /**
   * @returns {function(this:AbstractData, ...*):Promise}
   */
  create: function(){
    var actionInstance = this;
    /**
     * @this {AbstractData}
     */
    return function action(){
      // this - instance of AbstractData
      if (this.state != STATE.PROCESSING)
      {
        var args = basis.array.from(arguments);
        return actionInstance.exec.apply(actionInstance, [this].concat(args));
      }
      else
      {
        /** @cut */ basis.dev.warn('Context in processing state. Operation aborted. Context: ', this);
        return Promise.reject('Context in processing state, request is not performed');
      }
    };
  }
});

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

var PromiseAction = AbstractAction.subclass({
  className: 'basis.data.action.PromiseAction',
  init: function(){
    AbstractAction.prototype.init.call(this);

    basis.object.complete(this.config, {
      fn: basis.fn.$undef
    });
    basis.object.complete(this.config, DEFAULT_CALLBACK);
    this.callback = basis.object.splice(this.config, ['start', 'success', 'failure', 'complete']);
  },
  /**
   * @param {AbstractData!} dataInstance
   * @return {Promise}
   */
  exec: function(dataInstance){
    var actionInstance = this;
    var fnResult;

    CALLBACK_HANDLER.start.call(actionInstance.callback, dataInstance);
    fnResult = actionInstance.config.fn.call(dataInstance);
    // force transform of fn result to promise
    return Promise.resolve(fnResult)
      .then(function(data){
        CALLBACK_HANDLER.success.call(actionInstance.callback, dataInstance, data);
        CALLBACK_HANDLER.complete.call(actionInstance.callback, dataInstance);

        return data;
      }, function(error){
        CALLBACK_HANDLER.failure.call(actionInstance.callback, dataInstance, error);
        CALLBACK_HANDLER.complete.call(actionInstance.callback, dataInstance);

        return Promise.reject(error);
      });
  }
});

/**
 * Create Promise action
 * @param {Object} config
 * @returns {function(this:AbstractData, ...*):Promise}
 */
PromiseAction.create = function(config){
  return new PromiseAction({ config: config }).create();
};

module.exports = {
  fromPromise: PromiseAction.create,
  AbstractAction: AbstractAction,
  PromiseAction: PromiseAction,
  DEFAULT_CALLBACK: DEFAULT_CALLBACK,
  CALLBACK_HANDLER: CALLBACK_HANDLER
};
