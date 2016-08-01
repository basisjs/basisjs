var View = require('./inspector/template-info/view/index.js');
var createRemoteApi = require('./inspector/template-info/createRemoteApi.js');

basis.ready(function(){
  function sync(data){
    if (data.type === 'template')
      view.set(data.payload);
  }

  var view;

  setTimeout(function(){
    socket.on('basisjs.devpanel.data', sync);
    view = new View({
      modal: false,
      mode: 'standalone',
      api: createRemoteApi(socket),
      zIndex: 1000
    });

  }, 200);

  basis.teardown(function(){
    socket.off('basisjs.devpanel.data', sync);
  });
});
