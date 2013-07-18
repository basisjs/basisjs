module.exports = {
  getVersion: function(){
    sendData('version', {
      l10n: 1,
      template: basis.template.DECLARATION_VERSION
    })
  }
}