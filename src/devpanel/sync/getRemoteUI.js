var INSPECTOR_URL = asset('../standalone/index.html');
var INSPECTOR_BUILD_URL = asset('../../../dist/devtool.js');

function getInspectorUIBundle(){
  basis.dev.warn('[basis.devpanel] Method to retrieve Remote Inspector UI bundle is not implemented');
}

basis.ready(function(){
  var basisjsTools = global.basisjsToolsFileSync;

  if (!basisjsTools)
  {
    basis.dev.warn('[basis.devpanel] basisjsToolsFileSync is not found');
    return;
  }

  // get ui method
  getInspectorUIBundle = function(settings, callback){
    basisjsTools.getBundle(settings.dev ? INSPECTOR_URL : {
      build: INSPECTOR_BUILD_URL,
      filename: INSPECTOR_URL
    }, function(err, script){
      callback(err, 'script', script);
    });
  };
});

module.exports = function getInspectorUI(settings, callback){
  var accept = basis.array(settings && settings.accept);
  var dev = Boolean(settings && settings.dev);

  if (dev && accept.indexOf('url') !== -1)
    return callback(null, 'url', basis.path.origin + INSPECTOR_URL);

  getInspectorUIBundle({
    dev: dev,
    accept: accept
  }, callback);
};
