var Value = require('basis.data').Value;
var api = {};

function createInputChannel(socket, ns){
  var channel = new Value();

  api[ns].init = createRemoteMethod(socket, ns, 'init');
  socket.on('devtool:session data', function(data){
    if (data.type === ns)
      channel.set(data.payload);
  });

  return channel;
}
function createOutputChannel(ns, channel){
  function sendDataToClient(data){
    // if (remoteInspectors.value)
    socket.emit('devtool:session data', {
      type: ns,
      payload: data
    });
  }

  channel.link(null, sendDataToClient);

  api[ns].channel = channel;
  api[ns].init = function(){
    sendDataToClient(channel.value);
  };

  return channel;
}

function initAsLocal(methods){
  for (var method in methods)
    if (method !== 'channel')
      methods[method] = methods[method].apply(null, basis.array(arguments, 1));

  return methods;
}

function createRemoteMethod(socket, ns, method){
  return function(){
    socket.emit('devtool:session command', {
      ns: ns,
      method: method,
      args: basis.array(arguments)
    });
  };
}

function initAsRemote(socket){
  for (var ns in api)
  {
    for (var method in api[ns])
      if (method !== 'channel')
        api[ns][method] = createRemoteMethod(socket, ns, method);

    api[ns].channel = createInputChannel(socket, ns);
  }

  return api;
}

function getNamespace(name){
  if (!api[name])
    api[name] = {
      init: function(){},
      channel: function(channel){
        return createOutputChannel(name, channel);
      }
    };
  return api[name];
}

module.exports = {
  local: initAsLocal,
  remote: initAsRemote,
  extend: function(ns, extension){
    return basis.object.complete(getNamespace(ns), extension);
  },
  ns: getNamespace
};
