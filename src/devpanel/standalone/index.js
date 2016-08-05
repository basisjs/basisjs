var Node = require('basis.ui').Node;
var View = require('../view/template-info/view/index.js');

require('basis.template').setTheme('standalone');
require('../api/file_.js');
require('api').remote(
  global.devtoolApi.send,
  global.devtoolApi.subscribe
);

require('basis.app').create(
  new Node({
    template: resource('./template/app.tmpl'),
    binding: {
      view: 'satellite:'
    },
    satellite: {
      view: View
    }
  })
);
