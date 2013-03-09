basis.ready(function(){
  // init interface
  resource('devpanel/panel.js').fetch();

  // init transport
  var transport = resource('devpanel/transport.js').fetch();
  transport.init();

  // prepare API object
  basis.appCP = {};
  basis.object.extend(basis.appCP, resource('devpanel/fileAPI.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/l10nAPI.js').fetch());
  basis.object.extend(basis.appCP, resource('devpanel/templateAPI.js').fetch());  

  console.log('basis devpanel inited');
});