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
  // init API
  require('api').local(require('./api/file.js'), require('type:file.js'));
  require('api').local(require('./api/app.js'));

  // setup devtool
  require('type').Devtools({
    connected: true,
    session: basis.genUID()
  });

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

  require('./remote.js');
  basis.ready(init);
});
