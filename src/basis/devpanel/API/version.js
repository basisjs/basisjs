var transport = resource('transport.js').fetch();
var sendData = transport.sendData;

module.exports = {
  getVersion: function(){
    sendData('version', {
      l10n: 2,
      template: basis.template.DECLARATION_VERSION
    })
  }
};
