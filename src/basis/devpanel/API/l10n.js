basis.require('basis.l10n');
basis.require('basis.data.value');

var STATE = basis.data.STATE;

var transport = resource('transport.js').fetch();
var sendData = transport.sendData;

basis.l10n.addCreateDictionaryHandler(function(dictionaryName){
  sendData('newDictionary', { dictionaryName: dictionaryName });
}); 

basis.l10n.onCultureChange(function(culture){
  sendData('cultureChanged', culture);
});

module.exports = {
  loadCultureList: function(){
    var data = {
      currentCulture: basis.l10n.getCulture(),
      cultureList: basis.l10n.getCultureList()
    }
    sendData('cultureList', data);
  },

  loadDictionaryList: function(){
    var data = [];
    var dictionaries = basis.l10n.getDictionaries();

    for (var i = 0, dict; dict = dictionaries[i]; i++)
      data.push('/' + basis.path.relative('/', dict.resource.url));

    sendData('dictionaryList', data);
  },
  
  setTokenCultureValue: function(namespace, name, culture, value){
    basis.l10n.dictionary(namespace).setCultureValue(culture, name, value);
  }
};
