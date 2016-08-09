var DEBUG = false;
var basisjsTools = require('../basisjs-tools-sync.js');
var document = global.document;
var inputChannelId = 'basisjsDevpanel:' + basis.genUID();
var outputChannelId;
var callbacks = {};
var subscribers = [];
var online = new basis.Token(false);
var send;

var sendData = function(){
  if (!send)
    basis.dev.warn('[basisjs.devpanel] Cross-process messaging is not inited');
};
var subscribe = function(fn){
  subscribers.push(fn);
};

if (document.createEvent)
{
  function emitEvent(channelId, data){
    if (DEBUG)
      console.log('[basisjs.devpanel] emit event', channelId, data);

    document.dispatchEvent(new CustomEvent(channelId, {
      detail: data
    }));
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
      output: outputChannelId
    });
  }

  document.addEventListener('basisjs-devpanel:connect', function(e){
    if (outputChannelId)
      return;

    var data = e.detail;
    outputChannelId = data.input;

    if (!data.output)
      handshake();

    send = function(){
      // console.log('[devpanel] send to plugin', arguments);
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
  });

  // plugin -> devpanel
  document.addEventListener(inputChannelId, function(e){
    var data = e.detail;

    if (DEBUG)
      console.log('[basisjs.devpanel] recieve from plugin', data.event, data);

    switch (data.event) {
      case 'connect':
        online.set(true);
        break;

      case 'disconnect':
        online.set(false);
        break;

      case 'callback':
        if (callbacks.hasOwnProperty(data.callback))
        {
          callbacks[data.callback].apply(null, data.data);
          delete callbacks[data.callback];
        }
        break;

      case 'getInspectorUI':
        basisjsTools.getInspectorUI(false, data.callback ? wrapCallback(data.callback) : function(){});
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
        basisjsTools.getInspectorUI();
        break;

      default:
        basis.dev.warn('[basisjs.devpanel] Unknown message type `' + data.event + '`', data);
    }
  });

  handshake();
}
else
{
  var sendData = function(){
    if (!send)
      basis.dev.warn('[basisjs.devpanel] Cross-process messaging is not supported');
  };
}

module.exports = {
  online: online,
  subscribe: subscribe,
  send: sendData,
  // TODO: deprecated - remove
  sendData: sendData
};
