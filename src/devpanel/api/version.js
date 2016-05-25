var transport = require('devpanel.transport');
var TEMPLATE_VERSION = require('basis.template').DECLARATION_VERSION;

module.exports = {
  getVersion: function(){
    transport.sendData('version', {
      l10n: 2,
      template: TEMPLATE_VERSION
    });
  }
};
