var DEBUG = false;
var document = global.document;
var basisjsTools = require('./sync-basisjs-tools.js');
var connected = new basis.Token(false);
var features = new basis.Token([]);
var inputChannelId = 'basisjsDevpanel:' + basis.genUID();
var outputChannelId;
var initCallbacks = [];
var callbacks = {};
var subscribers = [];
var inited = false;
var send;

var getInspectorUI = function(){
  basis.dev.warn('[basisjs.devpanel] getInspectorUI() is not implemented');
};
var subscribe = function(fn){
  subscribers.push(fn);
};
var send = function(){
  if (!inited)
    basis.dev.warn('[basisjs.devpanel] Cross-process messaging is not inited');
};

function init(callback){
  if (inited)
    callback({
      setFeatures: features.set.bind(features),
      connected: connected,
      subscribe: subscribe,
      send: send
    });
  else
    initCallbacks.push(callback);
}

function emitEvent(channelId, data){
  if (DEBUG)
    console.log('[basisjs.devpanel] emit event', channelId, data);

  // IE does not support CustomEvent constructor
  if (typeof document.createEvent == 'function'){
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent(channelId, false, false, data);
    document.dispatchEvent(event);
  }
  else {
    document.dispatchEvent(new CustomEvent(channelId, {
      detail: data
    }));
  }
}

function wrapCallback(callback){
  return function(){
    emitEvent(outputChannelId, {
      event: 'callback',
      callback: callback,
      data: basis.array(arguments)
    });
  };
}

function handshake(){
  emitEvent('basisjs-devpanel:init', {
    input: inputChannelId,
    output: outputChannelId,
    features: features.value
  });
}

if (document.createEvent)
{
  basisjsTools.onInit(function(basisjsToolsApi){
    getInspectorUI = basisjsToolsApi.getInspectorUI;
  });

  document.addEventListener('basisjs-devpanel:connect', function(e){
    if (outputChannelId)
      return;

    var data = e.detail;
    outputChannelId = data.input;

    if (!data.output)
      handshake();

    send = function(){
      // console.log('[devpanel] send to devtools', arguments);
      var args = basis.array(arguments);
      var callback = false;

      if (args.length && typeof args[args.length - 1] === 'function')
      {
        callback = basis.genUID();
        callbacks[callback] = args.pop();
      }

      emitEvent(outputChannelId, {
        event: 'data',
        callback: callback,
        data: args
      });
    };

    // send features to devtools
    features.attach(function(features){
      emitEvent(outputChannelId, {
        event: 'features',
        data: [features]
      });
    });

    // invoke onInit callbacks
    inited = true;
    initCallbacks.splice(0).forEach(init);
  });

  // devtools -> devpanel
  document.addEventListener(inputChannelId, function(e){
    var data = e.detail;

    if (DEBUG)
      console.log('[basisjs.devpanel] recieve from devtools', data.event, data);

    switch (data.event) {
      case 'connect':
        connected.set(true);
        break;

      case 'disconnect':
        connected.set(false);
        break;

      case 'callback':
        if (callbacks.hasOwnProperty(data.callback))
        {
          callbacks[data.callback].apply(null, data.data);
          delete callbacks[data.callback];
        }
        break;


      case 'data':
        var args = basis.array(data.data);
        var callback = data.callback;

        if (callback)
          args = args.concat(wrapCallback(callback));

        subscribers.forEach(function(item){
          item.apply(null, args);
        });
        break;

      case 'getInspectorUI':
        getInspectorUI(
          basis.array(data.data)[0] || false,
          data.callback ? wrapCallback(data.callback) : Function
        );
        break;

      default:
        basis.dev.warn('[basisjs.devpanel] Unknown message type `' + data.event + '`', data);
    }
  });

  handshake();
}
else
{
  send = function(){
    if (!send)
      basis.dev.warn('[basisjs.devpanel] Cross-process messaging is not supported');
  };
}

module.exports = {
  onInit: init,
  connected: connected,
  subscribe: subscribe,
  send: send
};
