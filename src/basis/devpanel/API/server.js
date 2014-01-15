var transport = resource('transport.js').fetch();

if (basis.devtools)
{
  basis.devtools.serverState.addHandler({
    update: function(object, delta){
      if ('isOnline' in delta)
        transport.sendData('serverStatus', this.data.isOnline);
    }
  });
}

module.exports = {
  serverStatus: function(){
    var isOnline = basis.devtools && basis.devtools.serverState && basis.devtools.serverState.data.isOnline;
    transport.sendData('serverStatus', isOnline || false);
  }
};
