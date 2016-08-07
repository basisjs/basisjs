var Value = require('basis.data').Value;
var api = {};

function createOutputChannel(ns, channel, send){
  function sendData(data){
    send({
      type: ns,
      payload: data
    });
  }

  channel.link(null, sendData, true);

  api[ns].channel = channel;
  api[ns].init = api[ns].init || function(){
    sendData(channel.value);
  };

  return channel;
}

function initAsLocal(methods){
  for (var method in methods)
    if (method !== 'channel')
      methods[method] = methods[method].apply(null, basis.array(arguments, 1));

  return methods;
}

function createInputChannel(ns, send, subscribe){
  var channel = new Value();

  api[ns].init = createRemoteMethod(ns, send, 'init');
  api[ns].channel = channel;
  subscribe(function(data){
    if (data.type === ns)
      channel.set(data.payload);
  });

  return channel;
}

function createRemoteMethod(ns, send, method){
  return function(){
    send({
      ns: ns,
      method: method,
      args: basis.array(arguments)
    });
  };
}

function initAsRemote(ns, send, subscribe){
  for (var method in api[ns])
    if (method !== 'channel')
      api[ns][method] = createRemoteMethod(ns, send, method);

  createInputChannel(ns, send, subscribe);
}

function getNamespace(name){
  if (!api[name])
    api[name] = {
      // init: function(){},
      channel: function(channel, sendData){
        return createOutputChannel(name, channel, sendData);
      }
    };
  return api[name];
}

function define(ns, extension){
  return basis.object.complete(getNamespace(ns), extension);
}

module.exports = {
  define: define,
  ns: getNamespace,
  local: initAsLocal,
  remote: function(send, subscribe){
    for (var ns in api)
      initAsRemote(ns, send, subscribe);

    // patch define method to convert methods to remote calls
    module.exports.define = function(ns, extension){
      var methods = define(ns, extension);
      initAsRemote(ns, send, subscribe);
      return methods;
    };

    return api;
  }
};
