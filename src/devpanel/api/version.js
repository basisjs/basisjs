var transport = require('./transport.js');

module.exports = {
  getVersion: function(){
    transport.sendData('version', {
      l10n: 2,
      template: basis.template.DECLARATION_VERSION
    });
  }
};
