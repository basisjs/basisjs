var Value = require('basis.data').Value;
var api = {};

// init default APIs
define('file', require('./file.js'));
define('app', require('./app.js'));

function createOutputChannel(ns, channel, send){
  function sendData(){
    send({
      type: ns,
      payload: channel.value
    });
  }

  channel.link(null, sendData, true);

  api[ns].channel = channel;
  api[ns].init = api[ns].init || sendData;

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
    var args = basis.array(arguments);
    var callback;

    if (args.length > 0 && typeof args[args.length - 1] === 'function')
      callback = args.pop();

    send({
      ns: ns,
      method: method,
      args: args
    }, callback);
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
