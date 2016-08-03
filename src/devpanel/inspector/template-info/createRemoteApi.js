module.exports = function createRemoteApi(socket){
  function createRemoteMethod(method){
    return function(){
      socket.emit('devtool:session command', {
        target: 'template-inspector',
        method: method,
        args: basis.array(arguments)
      });
    };
  }

  return {
    init: createRemoteMethod('init'),
    openFile: createRemoteMethod('openFile'),
    select: createRemoteMethod('select'),
    upParent: createRemoteMethod('upParent'),
    upOwner: createRemoteMethod('upOwner'),
    upGroup: createRemoteMethod('upGroup'),
    dropTarget: createRemoteMethod('dropTarget'),
    logInfo: createRemoteMethod('logInfo')
  };
};
