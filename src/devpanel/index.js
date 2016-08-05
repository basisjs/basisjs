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
  require('api')
    .local(require('./api/file_.js'), require('./api/file.js'));

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
    require('./api/ui.js'),
    require('./api/inspector.js')
  );

  // init interface
  require('./panel/index.js');
  // temporary here
  //require('./view/ui/index.js');

  require('./basisjs-tools-sync.js');

  basis.dev.log('basis devpanel inited');
}

// everything ok, init on dom ready
basis.ready(function(){
  if (!inspectBasis.devtools)
    // if inspectBasis.devtools is not defined, than init with 500 ms delay
    // to give a chance basisjs-tools script is loaded (as it load async/defered and doesn't fire appropriate event)
    setTimeout(init, 500);
  else
    init();
});
