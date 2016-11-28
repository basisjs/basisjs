var Value = require('basis.data').Value;
var serverSync = require('./sync-server.js');
var pluginSync = require('./sync-devtools.js');
var api = require('../api/index.js');
var noop = function(){};
var send = {
  remote: noop,
  devtools: noop
};

var remoteInspectors = new Value({
  value: 0
});
var devtools = new Value({
  value: false
});

function getRemoteUrl(){
  // no default implementation
}

function processCommand(command, callback){
  if (!api.ns(command.ns).hasOwnProperty(command.method))
    return console.warn('[basis.devpanel] Unknown devtools remote command:', command);

  api.ns(command.ns)[command.method].apply(null, command.args.concat(callback));
}

// init basisjs-tools
serverSync.onInit(function(remoteApi){
  // sync features list
  api.features.link(remoteApi, remoteApi.setFeatures);

  // subscribe to data from remote devtools & context free send method
  remoteApi.subscribe(processCommand);
  remoteApi.connected.attach(function(connected){
    remoteInspectors.set(connected);
    send.remote = connected ? remoteApi.send : noop;
  });

  // import getRemoteUrl if possible
  getRemoteUrl = remoteApi.getRemoteUrl || getRemoteUrl;
});

// init devtools
pluginSync.onInit(function(pluginApi){
  // sync features list
  api.features.link(pluginApi, pluginApi.setFeatures);

  // subscribe to data from devtools & context free send method
  pluginApi.subscribe(processCommand);
  pluginApi.connected.attach(function(connected){
    devtools.set(connected);
    send.devtools = connected ? pluginApi.send : noop;
  });
});

module.exports = {
  remoteInspectors: remoteInspectors,
  devtools: devtools,
  getRemoteUrl: function(){
    return getRemoteUrl();
  },
  send: function(){
    send.devtools.apply(null, arguments);
    send.remote.apply(null, arguments);
  }
};
