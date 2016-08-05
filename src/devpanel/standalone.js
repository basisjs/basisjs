var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var View = require('./view/template-info/view/index.js');

require('./api/file_.js');
require('api').remote(
  global.devtoolApi.send,
  global.devtoolApi.subscribe
);

basis.ready(function(){
  var view;

  view = new View({
    modal: false,
    mode: 'standalone'
  });

  // temporary solution
  new Node({
    container: document.body,
    template: '<div b:show="{show}" style="color: #AAA; text-align: center; font: 20px Arial; padding: 40px;">Component is not selected</div>',
    binding: {
      show: Value.query(view, 'visible').as(basis.bool.invert)
    }
  });
});
