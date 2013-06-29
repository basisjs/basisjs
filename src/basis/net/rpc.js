
  basis.require('basis.data');

 /**
  * @namespace basis.net.rpc
  */


  //
  // import names
  //

  var STATE_UNDEFINED = basis.data.STATE.UNDEFINED;
  var STATE_READY = basis.data.STATE.READY;
  var STATE_PROCESSING = basis.data.STATE.PROCESSING;
  var STATE_ERROR = basis.data.STATE.ERROR;


  //
  // main part
  //

  var nothingToDo = function(){};  

  // default callbacks
  var callback = {
    setProcessing: function(){
      this.setState(STATE_PROCESSING);
    },
    setUndefined: function(){
      this.setState(STATE_UNDEFINED);
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
        origin.setState(STATE_UNDEFINED);
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

 /**
  * Creates a function that init service transport if necessary and make a request.
  * @function
  */
  function createRpc(config){
    // make a copy of config with defaults
    config = basis.object.extend({
      prepare: nothingToDo,
      request: nothingToDo
    }, config);

    // splice properties
    var fn = basis.object.splice(config, ['prepare', 'request']);
    var callback = basis.object.merge(
      DEFAULT_CALLBACK,
      basis.object.splice(config, ['start', 'success', 'failure', 'abort', 'complete'])
    );

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
        }, fn.request.apply(this, arguments)));
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
