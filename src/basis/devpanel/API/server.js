var transport = require('./transport.js');

// new basisjs-tools
if (typeof basisjsToolsFileSync != 'undefined')
{
  basisjsToolsFileSync.isOnline.attach(function(isOnline){
    transport.sendData('serverStatus', isOnline);
  });
}
else
{
  // old basisjs-tools
  if (basis.devtools)
    basis.devtools.serverState.addHandler({
      update: function(object, delta){
        if ('isOnline' in delta)
          transport.sendData('serverStatus', this.data.isOnline);
      }
    });
}

module.exports = {
  serverStatus: function(){
    var isOnline;

    if (typeof basisjsToolsFileSync != 'undefined')
    {
      isOnline = basisjsToolsFileSync.isOnline.value;
    }
    else
      if (basis.devtools)
      {
        isOnline = basis.devtools.serverState && basis.devtools.serverState.data.isOnline;
      }

    transport.sendData('serverStatus', isOnline || false);
  }
};
