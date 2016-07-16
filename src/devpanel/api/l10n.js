var STATE = require('basis.data').STATE;
var sendData = require('./transport.js').sendData;

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');

inspectBasisL10n.onCultureChange(function(culture){
  sendData('cultureChanged', culture);
});

function createDictionaryFileContent(data){
  var dictionaryData = {};

  if (data.tokenTypes)
    dictionaryData._meta = {
      type: data.tokenTypes
    };

  basis.object.extend(dictionaryData, data.cultureValues);

  return JSON.stringify(dictionaryData, undefined, 2);
}

module.exports = {
  loadCultureList: function(){
    sendData('cultureList', {
      currentCulture: inspectBasisL10n.getCulture(),
      cultureList: inspectBasisL10n.getCultureList()
    });
  },

  loadDictionaryList: function(){
    var data = [];
    var dictionaries = inspectBasisL10n.getDictionaries();

    for (var i = 0, dict; dict = dictionaries[i]; i++)
      data.push(basis.path.relative('/', dict.resource.url));

    sendData('dictionaryList', data);
  },

  setTokenCultureValue: function(namespace, name, culture, value){
    inspectBasisL10n.dictionary('/' + namespace).setCultureValue(culture, name, value);
  },

  loadDictionaryTokens: function(dictionaryName){
    var dict = inspectBasisL10n.dictionary('/' + dictionaryName);

    if (dict)
      sendData('dictionaryTokens', {
        dictionary: dictionaryName,
        tokenKeys: basis.object.keys(dict.tokens),
        tokenTypes: dict.types,
        cultureValues: dict.cultureValues
      });
  },

  updateDictionary: function(data){
    inspectBasis.resource('/' + data.dictionary).update(createDictionaryFileContent(data));
  },

  saveDictionary: function(data){
    var basisjsTools = global.basisjsToolsFileSync || inspectBasis.devtools;

    if (!basisjsTools)
      return;

    // saving
    var file = basisjsTools.getFile('/' + data.dictionary, true);
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
    };

    file.addHandler(FILE_HANDLER);
    file.save(createDictionaryFileContent(data));
  }
};
