var View = require('./inspector/template-info/view/index.js');
var createRemoteApi = require('./inspector/template-info/createRemoteApi.js');

basis.ready(function(){
  setTimeout(function(){
    socket.on('basisjs.devpanel.data', function(data){
      if (data.type === 'template')
        view.set(data.payload);
    });

    var view = new View({
      api: createRemoteApi(socket)
    });
  }, 200);
});
