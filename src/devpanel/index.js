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
      this.isolatePrefix_ = basis.genUID().replace(/^[^a-z]/i, 'i$&') + '__';
    return this.isolatePrefix_;
  }
});


// init devpanel
function init(){
  // init transport
  var transport = require('./api/transport.js');
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

    require('./api/version.js'),
    require('./api/server.js'),
    require('./api/file.js'),
    require('./api/l10n.js'),
    require('./api/ui.js'),
    require('./api/inspector.js')
  );

  // init interface
  require('./ui.js');
  // temporary here
  //require('./module/ui/index.js');

  // setup live update
  if (inspectBasis.devtools)
  {
    var FILE_HANDLER = {
      update: function(sender, delta){
        if ('filename' in delta || 'content' in delta)
          if (!basis.resource.isDefined || basis.resource.isDefined(this.data.filename, true))
            basis.resource(this.data.filename).update(this.data.content);
      }
    };
    inspectBasis.devtools.files.addHandler({
      itemsChanged: function(sender, delta){
        if (delta.inserted)
          delta.inserted.forEach(function(file){
            file.addHandler(FILE_HANDLER);
          });
      }
    });
  }

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
