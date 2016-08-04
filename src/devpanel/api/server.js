var transport = require('./transport.js');
var isOnline = require('../basisjs-tools-sync.js').isOnline;

module.exports = {
  serverStatus: function(){
    transport.sendData('serverStatus', isOnline.value);
  }
};
