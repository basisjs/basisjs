var View = require('./inspector/template-info/view/index.js');
var createRemoteApi = require('./inspector/template-info/createRemoteApi.js');

basis.ready(function(){
  setTimeout(function(){
    socket.on('basisjs.devpanel.data', function(data){
      if (data.type === 'template')
        view.set(data.payload);
    });

    var view = new View({
      mode: 'app',
      api: createRemoteApi(socket),
      zIndex: 1000
    });

    // TODO: remove, it's a hack
    var el = document.getElementById('Basis-WindowStack');
    el.style.position = 'relative';
    el.style.zIndex = 0;
  }, 200);
});
