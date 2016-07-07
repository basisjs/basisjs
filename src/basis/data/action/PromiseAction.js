/**
 * @namespace basis.data.action
 */

var Promise = require('basis.promise');
var AbstractAction = require('./AbstractAction');
var CALLBACK_HANDLER = require('./AbstractAction').CALLBACK_HANDLER;
var DEFAULT_CALLBACK = require('./AbstractAction').DEFAULT_CALLBACK;
var createStaticFactory = AbstractAction.createStaticFactory;

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

PromiseAction.CALLBACK_HANDLER = CALLBACK_HANDLER;
PromiseAction.DEFAULT_CALLBACK = DEFAULT_CALLBACK;

createStaticFactory(PromiseAction);

module.exports = PromiseAction;
