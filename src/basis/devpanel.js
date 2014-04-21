basis.ready(function(){
  // init interface
  require('./devpanel/index.js');

  // init transport
  var transport = require('./devpanel/API/transport.js');
  transport.init();

  // prepare API object
  basis.appCP = basis.object.merge(
    {
      getFileGraph: function(){
        var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : basis.devtools;

        if (basisjsTools)
          basisjsTools.getFileGraph(function(err, data){
            transport.sendData('fileGraph', {
              err: err,
              data: data
            });
          });
      }
    },

    require('./devpanel/API/version.js'),
    require('./devpanel/API/server.js'),
    require('./devpanel/API/file.js'),
    require('./devpanel/API/l10n.js'),
    require('./devpanel/API/ui.js'),
    require('./devpanel/API/inspector.js')
  );

  console.log('basis devpanel inited');
});

module.exports = {
  openFileInspector: function(){
    require('./devpanel/module/fileInspector/fileInspector.js').open();
  }
};
