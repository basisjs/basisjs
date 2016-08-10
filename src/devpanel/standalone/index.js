var Node = require('basis.ui').Node;
var initDevtoolApi = location.hash.substr(1);
var devtool = typeof parent[initDevtoolApi] === 'function' ? parent[initDevtoolApi]() : null;

if (!devtool)
  throw new Error('Devtool init handler is missed (should be present in location hash)');

// devtool
//   .on('connect', function(){ console.log('connected'); })
//   .on('disconnect', function(){ console.log('disconnected'); })
//   .on('features', function(features){ console.log('features', features); });

require('basis.template').setTheme('standalone');
require('../api/file.js');
require('../api/app.js');
require('api').remote(
  devtool.send,
  devtool.subscribe
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
