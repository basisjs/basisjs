var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var View = require('./view/template-info/view/index.js');
var createRemoteApi = require('./view/template-info/createRemoteApi.js');

basis.ready(function(){
  function sync(data){
    if (data.type === 'template')
      view.set(data.payload);
  }

  var view;

  setTimeout(function(){
    socket.on('devtool:session data', sync);
    view = new View({
      modal: false,
      mode: 'standalone',
      api: createRemoteApi(socket)
    });

    // temporary solution
    new Node({
      container: document.body,
      template: '<div b:show="{show}" style="color: #AAA; text-align: center; font: 20px Arial; padding: 40px;">Component is not selected</div>',
      binding: {
        show: Value.query(view, 'visible').as(basis.bool.invert)
      }
    });
  }, 200);
});
