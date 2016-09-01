var Node = require('basis.ui').Node;
var api = require('api');
var host = global.parent;
var getRemoteAPI = window.name || location.hash.substr(1);
var remoteAPI = typeof host[getRemoteAPI] === 'function' ? host[getRemoteAPI]() : null;

if (!remoteAPI)
  throw new Error('Devtool init handler is missed (should be present in location hash)');

remoteAPI
  .subscribe('session', api.session.set.bind(api.session))
  .subscribe('connection', api.connected.set.bind(api.connected))
  .subscribe('features', api.features.set.bind(api.features));

require('basis.template').setTheme('standalone');
require('api').remote(
  remoteAPI.send,
  remoteAPI.subscribe
);

api.ns('inspect').channel.link(api.inspect, api.inspect.set);
api.connected.link(null, function(connected){
  if (connected)
    api.ns('inspect').init(function(mode){
      api.inspect.set(mode);
    });
});

require('basis.app').create({
  title: 'Remote basis.js devtools',
  element: new Node({
    disabled: api.inspect.as(Boolean),
    template: resource('./template/app.tmpl'),
    binding: {
      inspect: api.inspect,
      appProfileButton: require('./app-profile-button.js'),
      tabs: require('./tabs.js'),
      view: 'satellite:'
    },
    action: {
      pickTemplate: function(){
        var mode = api.inspect.value;
        api.ns('inspect').inspect(mode !== 'template' ? 'template' : false);
      }
    },
    satellite: {
      view: require('./tabs.js').selectedTabView
    }
  })
});
