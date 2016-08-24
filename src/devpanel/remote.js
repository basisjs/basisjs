var Value = require('basis.data').Value;
var basisjsToolsSync = require('./sync-basisjs-tools.js');
var pluginSync = require('./sync-devtools.js');
var api = require('./api/index.js');

var remoteInspectors = new Value({
  value: 0,
  send: function(){
    basis.dev.warn('[basis.devpanel] remoteInspectors#send() is not inited yet');
  }
});
var devtools = new Value({
  value: false,
  send: function(){
    basis.dev.warn('[basis.devpanel] devtools#send() is not inited yet');
  }
});

function getRemoteUrl(){
  // no default implementation
}

function processCommand(command, callback){
  if (!api.ns(command.ns).hasOwnProperty(command.method))
    return console.warn('[basis.devpanel] Unknown devtools remote command:', command);

  api.ns(command.ns)[command.method].apply(null, command.args.concat(callback));
}

function link(reactive, btValue){
  btValue.attach(reactive.set, reactive);
  reactive.set(btValue.value);
}

// init basisjs-tools
basisjsToolsSync.onInit(function(basisjsToolsApi){
  if (typeof basisjsToolsApi.initRemoteDevtoolAPI !== 'function')
    return;

  var remoteApi = basisjsToolsApi.initRemoteDevtoolAPI({
    getInspectorUI: basisjsToolsApi.getInspectorUI
  });

  // inspectors count
  link(remoteInspectors, basisjsToolsApi.remoteInspectors);

  // sync features list
  api.features.link(remoteApi, remoteApi.setFeatures);

  // subscribe to data from remote devtools & context free send method
  remoteApi.subscribe(processCommand);
  remoteInspectors.send = remoteApi.send;

  // import getRemoteUrl if possible
  getRemoteUrl = remoteApi.getRemoteUrl || getRemoteUrl;
});

// init devtools
pluginSync.onInit(function(pluginApi){
  link(devtools, pluginApi.connected);

  // sync features list
  api.features.link(pluginApi, pluginApi.setFeatures);

  // subscribe to data from devtools & context free send method
  pluginApi.subscribe(processCommand);
  devtools.send = pluginApi.send;
});

module.exports = {
  remoteInspectors: remoteInspectors,
  devtools: devtools,
  getRemoteUrl: function(){
    return getRemoteUrl();
  },
  send: function(){
    if (remoteInspectors.value > 0)
      remoteInspectors.send.apply(null, arguments);

    if (devtools.value)
      devtools.send.apply(null, arguments);
  }
};
