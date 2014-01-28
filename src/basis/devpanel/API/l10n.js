basis.require('basis.l10n');
basis.require('basis.data.value');

var STATE = basis.data.STATE;

var transport = resource('transport.js').fetch();
var sendData = transport.sendData;

basis.l10n.onCultureChange(function(culture){
  sendData('cultureChanged', culture);
});

function createDictionaryFileContent(data){
  var dictionaryData = {};

  if (data.tokenTypes)
  {
    dictionaryData['_meta'] = {
      type: data.tokenTypes
    }
  }
  basis.object.extend(dictionaryData, data.cultureValues);

  return JSON.stringify(dictionaryData, undefined, 2);
}

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
      data.push(basis.path.relative('/', dict.resource.url));

    sendData('dictionaryList', data);
  },

  setTokenCultureValue: function(namespace, name, culture, value){
    basis.l10n.dictionary('/' + namespace).setCultureValue(culture, name, value);
  },

  loadDictionaryTokens: function(dictionaryName){
    var dict = basis.l10n.dictionary('/' + dictionaryName);
    if (dict)
    {
      sendData('dictionaryTokens', {
        dictionary: dictionaryName,
        tokenKeys: basis.object.keys(dict.tokens),
        tokenTypes: dict.types,
        cultureValues: dict.cultureValues
      });
    }
  },

  updateDictionary: function(data){
    basis.resource('/' + data.dictionary).update(createDictionaryFileContent(data));
  },

  saveDictionary: function(data){
    if (!basis.devtools)
      return;

    var newContent = createDictionaryFileContent(data);

    // saving
    var file = basis.devtools.getFile('/' + data.dictionary, true);

    var FILE_HANDLER = {
      stateChanged: function(){
        if (this.state == STATE.READY)
        {
          data.result = 'success';
          sendData('saveDictionary', data);
        }

        if (this.state == STATE.ERROR)
        {
          sendData('saveDictionary', {
            result: 'error',
            dictionary: data.dictionary,
            errorText: this.state.data
          });
        }

        if (this.state == STATE.READY || this.state == STATE.ERROR)
          this.removeHandler(FILE_HANDLER);
      }
    }

    file.addHandler(FILE_HANDLER);
    file.save(newContent);
  }
};
