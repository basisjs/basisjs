
  basis.require('basis.data');

  //
  // import names
  //

  var $undef = basis.fn.$undef;

  var STATE_READY = basis.data.STATE.READY;
  var STATE_PROCESSING = basis.data.STATE.PROCESSING;
  var STATE_ERROR = basis.data.STATE.ERROR;


  //
  // main part
  //

  // default callbacks
  var callback = {
    setProcessing: function(){
      this.setState(STATE_PROCESSING);
    },
    setReady: function(){
      this.setState(STATE_READY);
    },
    setError: function(error){
      this.setState(STATE_ERROR, error);
    },
    update_setReady: function(data){
      this.update(data);
      this.setState(STATE_READY);
    },
    commit_setReady: function(data){
      this.commit(data);
      this.setState(STATE_READY);
    },
    set_setReady: function(data){
      this.set(data || []);
      this.setState(STATE_READY);
    },
    sync_setReady: function(data){
      this.sync(data || []);
      this.setState(STATE_READY);
    }
  };

  // default transport handler
  var CALLBACK_HANDLER = {
    start: function(transport, request){
      this.start.call(request.requestData.origin);
    },
    success: function(transport, request, data){
      this.success.call(request.requestData.origin, data);
    },
    failure: function(transport, request, error){
      this.failure.call(request.requestData.origin, error);
    },
    complete: function(transport, request){
      this.complete.call(request.requestData.origin);
    }
  };

  // default callbacks
  var DEFAULT_CALLBACK = {
    start: callback.setProcessing,
    success: callback.setReady,
    failure: callback.setError,
    complete: $undef
  };

 /**
  * Creates a function that init service transport if necessary and make a request.
  * @function
  */
  function createRpc(config){
    ;;;if (!config.service) basis.dev.warn('action config have no service');

    // make a copy of config with defaults
    config = basis.object.extend({
      prepare: $undef,
      request: $undef
    }, config);

    // splice properties
    var fn = basis.object.splice(config, ['prepare', 'request']);
    var callback = [
      DEFAULT_CALLBACK,
      basis.object.splice(config, ['start', 'success', 'failure', 'complete'])
    ].merge();

    // lazy transport
    var getCall = basis.fn.lazyInit(function(){
      var call = config.service.createCall(config);
      call.addHandler(CALLBACK_HANDLER, callback);
      return call;
    });

    return function rpc(){
      // this - instance of DataObject
      if (this.state != STATE_PROCESSING)
      {
        fn.prepare.apply(this, arguments);

        this.request = getCall().request(basis.object.complete({
          origin: this
        }, fn.request.call(this)));
      }
      else
      {
        ;;;basis.dev.warn(this + ' has not ready state. Operation aborted');
      }
    }
  }


 /**
  * @function
  */
  function createRpcFactory(service){
    return function rpcFactory(config){
      return createRpc(basis.object.complete({
        service: service
      }, config));
    }
  }


  //
  // export names
  //

  module.exports = {
    createRpc: createRpc,
    createRpcFactory: createRpcFactory,
    callback: callback
  };
