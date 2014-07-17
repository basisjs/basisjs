var transport = require('./transport.js');
var isOnline = require('../basisjs-tools-sync.js').isOnline;

module.exports = {
  getVersion: function(){
    transport.sendData('version', {
      l10n: 2,
      template: basis.template.DECLARATION_VERSION
    });
  },
  serverStatus: function(){
    transport.sendData('serverStatus', isOnline.value);
  }
};
