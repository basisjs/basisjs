var view = basis.require('./inspector/template-info/view/index.js');
basis.require('basis.app').create(view);
basis.ready(function(){
  setTimeout(function(){
    socket.on('template-inspector', function(data){
      view.set(data);
    });
  }, 200);
});
