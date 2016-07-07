/**
 * @namespace basis.data.action
 */

var STATE = require('basis.data').STATE;
var Promise = require('basis.promise');

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

/**
 * Add static create method to specified class
 * @param {function(new:AbstractAction)} clazz
 */
AbstractAction.createStaticFactory = function(clazz){
  var Constructor = clazz;

  /**
   * Create action
   * @param {Object} config
   * @returns {function(this:AbstractData, ...*):Promise}
   */
  Constructor.create = function(config){
    return new Constructor({ config: config }).create();
  };
};

AbstractAction.CALLBACK_HANDLER = CALLBACK_HANDLER;
AbstractAction.DEFAULT_CALLBACK = DEFAULT_CALLBACK;

module.exports = AbstractAction;
