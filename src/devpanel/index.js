// resolve basis.js instance for inspect
var inspectBasis = basis.config.inspect;
this.inspectBasis = inspectBasis;

// check basis.js instance found
if (!inspectBasis)
  throw new Error('inspect basis.js instance doesn\'t found');

// much strict template isolation, to prevent style mix with inspecting basis app styles,
// as isolation prefixes based on template id in dev mode
require('basis.template').Template.extend({
  isolatePrefix_: false,
  getIsolatePrefix: function(){
    if (!this.isolatePrefix_)
      this.isolatePrefix_ = basis.genUID() + '__';
    return this.isolatePrefix_;
  }
});


// init devpanel
function init(){
  // temporary
  require('api').local(require('./api/file_.js'), require('./api/file.js'));
  require('api').local(require('./api/app.js'));

  // init transport
  var transport = require('./api/transport.js');
  module.transferEl = transport.transferEl;

  // make devpanel allowed for inspected basis.js
  inspectBasis.devpanel = module;

  // prepare API object
  inspectBasis.appCP = basis.object.merge(
    {
      getFileGraph: function(){
        var basisjsTools = global.basisjsToolsFileSync;

        if (basisjsTools)
          basisjsTools.getFileGraph(function(err, data){
            transport.sendData('fileGraph', {
              data: data,
              err: err
            });
          });
      }
    },

    require('./api/version.js'),
    require('./api/server.js'),
    require('./api/file.js'),
    require('./api/l10n.js'),
    require('./api/inspector.js')
  );

  // init interface
  require('./panel/index.js');

  // temporary here
  require('./view/template-info/index.js');
  require('./view/ui/index.js');
}

// everything ok, init on dom ready
var attachFileSyncRetry = 50;
basis.ready(function attachFileSync(){
  var basisjsTools = global.basisjsToolsFileSync;

  if (!basisjsTools)
  {
    if (attachFileSyncRetry < 500)
      setTimeout(attachFileSync, attachFileSyncRetry);
    else
      basis.dev.warn('basisjsToolsFileSync doesn\'t detected – devpanel unavailable');

    attachFileSyncRetry += 100;
    return;
  }

  require('./basisjs-tools-sync.js');
  basis.ready(init);
});
