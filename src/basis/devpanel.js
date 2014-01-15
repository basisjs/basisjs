basis.ready(function(){
  // init interface
  resource('devpanel/index.js').fetch();

  // init transport
  var transport = resource('devpanel/API/transport.js').fetch();
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
  basis.object.extend(basis.appCP, resource('devpanel/API/version.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/API/server.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/API/file.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/API/l10n.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/API/inspector.js').fetch());

  console.log('basis devpanel inited');
});

module.exports = {
  openFileInspector: function(){
    var fileInspector = resource('devpanel/module/fileInspector/fileInspector.js').fetch();
    fileInspector.open();
  }
};
