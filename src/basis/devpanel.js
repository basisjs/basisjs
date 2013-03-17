basis.ready(function(){
  // init interface
  resource('devpanel/panel.js').fetch();

  // init transport
  var transport = resource('devpanel/transport.js').fetch();
  transport.init();

  // prepare API object
  basis.appCP = {
    getFileGraph: function(){
      if (basis.devtools)
        basis.devtools.getFileGraph(function(err, data){
          transport.sendData('fileGraph', {
            err: err,
            data: data
          });
        });
    }
  };
  basis.object.extend(basis.appCP, resource('devpanel/fileAPI.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/l10nAPI.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/inspectorAPI.js').fetch());  

  console.log('basis devpanel inited');
});