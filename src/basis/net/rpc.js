
  basis.require('basis.net.action');

  ;;;basis.dev.warn('namespace basis.net.rpc is deprecated, use basis.net.action instead');

 /**
  * @function
  */
  function createRpcFactory(service){
    return function rpcFactory(config){
      return basis.net.action.create(basis.object.complete({
        service: service
      }, config));
    }
  }

  module.exports = {
    createRpc: basis.net.action.create,
    createRpcFactory: createRpcFactory
  };