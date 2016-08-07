var Value = require('basis.data').Value;
var KeyObjectMap = require('basis.data').KeyObjectMap;
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

var lazyView = new KeyObjectMap({
  create: function(tab){
    return new(tab.view());
  }
});

require('basis.app').create({
  title: 'Remote basis.js devtools',
  element: new Node({
    template: resource('./template/app.tmpl'),
    binding: {
      tabs: 'satellite:',
      view: 'satellite:'
    },
    satellite: {
      view: Value.query('satellite.tabs.selection.pick()').as(lazyView.resolve.bind(lazyView)),
      tabs: new Node({
        template: resource('./template/tabs.tmpl'),
        selection: true,
        childClass: {
          template: resource('./template/tab.tmpl'),
          binding: {
            caption: 'caption'
          }
        },
        childNodes: [
          { caption: 'Template', view: resource('../view/template-info/view/index.js') },
          { caption: 'UI', view: resource('../view/ui/view/index.js') },
          { caption: 'Warnings', selected: true, view: resource('../view/warnings/view/index.js') }
        ]
      })
    }
  })
});
