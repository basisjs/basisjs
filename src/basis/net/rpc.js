
  basis.require('basis.data');

 /**
  * @namespace basis.net.rpc
  */


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
    failure: function(transport, request){
      this.failure.call(request.requestData.origin, request.data.error);
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
    var getTransport = basis.fn.lazyInit(function(){
      var transport = config.transport;

      if (!transport && config.service)
        transport = config.service.createTransport(config);

      if (!transport && config.createTransport)
        transport = config.createTransport(config);

      transport.addHandler(CALLBACK_HANDLER, callback);
      return transport;
    });

    return function rpc(){
      // this - instance of DataObject
      if (this.state != STATE_PROCESSING)
      {
        fn.prepare.apply(this, arguments);

        this.request = getTransport().request(basis.object.complete({
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
