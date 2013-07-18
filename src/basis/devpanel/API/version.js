var transport = resource('transport.js').fetch();
var sendData = transport.sendData;

module.exports = {
  getVersion: function(){
    sendData('version', {
      l10n: 1,
      template: basis.template.DECLARATION_VERSION
    })
  }
}