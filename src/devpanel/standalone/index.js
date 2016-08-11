var Node = require('basis.ui').Node;
var api = require('api');
var getRemoteAPI = location.hash.substr(1);
var remoteAPI = typeof parent[getRemoteAPI] === 'function' ? parent[getRemoteAPI]() : null;

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

require('basis.app').create({
  title: 'Remote basis.js devtools',
  element: new Node({
    template: resource('./template/app.tmpl'),
    binding: {
      appProfileButton: require('./app-profile-button.js'),
      tabs: require('./tabs.js'),
      view: 'satellite:'
    },
    satellite: {
      view: require('./tabs.js').selectedTabView
    }
  })
});
