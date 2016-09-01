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
  var api = require('api');
  var remote = require('./remote.js');

  // setup API
  api.local(api.ns('file'));
  api.local(api.ns('app'));
  api.local(api.ns('inspect'))
     .channel(api.inspect, remote.send);

  api.connected.set(true);
  api.session.set(basis.genUID());

  // init interface
  require('./panel/index.js');

  // temporary here (to provide data)
  require('./view/file-graph/index.js');
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
