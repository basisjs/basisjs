var Node = require('basis.ui').Node;
var initDevtoolApi = location.hash.substr(1);
var devtool = typeof top[initDevtoolApi] === 'function' ? top[initDevtoolApi]() : null;

if (!devtool)
  throw new Error('Devtool init handler is missed (should be present in location hash)');

require('basis.template').setTheme('standalone');
require('../api/file_.js');
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
      tabs: 'satellite:',
      view: 'satellite:'
    },
    satellite: {
      tabs: require('./tabs.js'),
      view: require('./tabs.js').selectedTabView
    }
  })
});
