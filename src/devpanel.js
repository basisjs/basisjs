// resolve basis.js instance for inspect
var inspectBasis = global[basis.config.inspectBasisRef];
delete global[basis.config.inspectBasisRef];
this.inspectBasis = inspectBasis;

// check basis.js instance found
if (!inspectBasis)
{
  basis.dev.warn('inspect basis.js instance doesn\'t found');
  return;
}

// everything ok, init interface
basis.nextTick(function(){
  basis.ready(function(){
    // init transport
    var transport = require('./devpanel/api/transport.js');
    module.transferEl = transport.transferEl;

    // make devpanel allowed for inspected basis.js
    inspectBasis.devpanel = module;

    // prepare API object
    inspectBasis.appCP = basis.object.merge(
      {
        getFileGraph: function(){
          var basisjsTools = typeof basisjsToolsFileSync != 'undefined'
            ? basisjsToolsFileSync // new
            : basis.devtools;      // old

          if (basisjsTools)
            basisjsTools.getFileGraph(function(err, data){
              transport.sendData('fileGraph', {
                data: data,
                err: err
              });
            });
        }
      },

      require('./devpanel/api/version.js'),
      require('./devpanel/api/server.js'),
      require('./devpanel/api/file.js'),
      require('./devpanel/api/l10n.js'),
      require('./devpanel/api/inspector.js')
    );

    // init interface
    require('./devpanel/index.js');

    basis.dev.log('basis devpanel inited');
  });
});

