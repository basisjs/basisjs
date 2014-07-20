var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');

var STATE = require('basis.data').STATE;
var sendData = require('devpanel.transport').sendData;
var File = require('../basisjs-tools-sync.js').File;

inspectBasisL10n.onCultureChange(function(culture){
  sendData('cultureChanged', culture);
});

function createDictionaryFileContent(description){
  var dictionaryData = basis.object.slice(description.cultureValues);

  if (description.tokenTypes)
    dictionaryData._meta = {
      type: description.tokenTypes
    };

  return JSON.stringify(dictionaryData, null, 2);
}

module.exports = {
  loadCultureList: function(done){
    done(null, {
      currentCulture: inspectBasisL10n.getCulture(),
      cultureList: inspectBasisL10n.getCultureList()
    });
  },

  loadDictionaryList: function(done){
    var dictionaries = inspectBasisL10n.getDictionaries();
    var result = [];

    for (var i = 0, dict; dict = dictionaries[i]; i++)
      result.push(basis.path.relative('/', dict.resource.url));

    done(null, result);
  },

  setTokenCultureValue: function(done, namespace, name, culture, value){
    inspectBasisL10n
      .dictionary('/' + namespace)
      .setCultureValue(culture, name, value);

    done();
  },

  loadDictionaryTokens: function(done, dictionaryName){
    var dict = inspectBasisL10n.dictionary('/' + dictionaryName);

    if (dict)
      dict = {
        dictionary: dictionaryName,
        tokenKeys: basis.object.keys(dict.tokens),
        tokenTypes: dict.types,
        cultureValues: dict.cultureValues
      };

    done(null, dict);
  },

  updateDictionary: function(done, data){
    inspectBasis
      .resource(data.filename || '/' + data.dictionary)  // remove data.dictionary
      .update(createDictionaryFileContent(data));

    done();
  },

  saveDictionary: function(done, data){
    var filename = data.filename || '/' + data.dictionary;  // remove data.dictionary
    var file = File.get(filename);

    if (!file)
      return;

    var FILE_HANDLER = {
      stateChanged: function(){
        if (this.state == STATE.READY)
          done(null, data);

        if (this.state == STATE.ERROR)
        {
          // sendData('saveDictionary', {
          //   result: 'error',
          //   dictionary: data.dictionary,
          //   errorText: this.state.data
          // });
          done(this.state.data);
        }

        if (this.state == STATE.READY || this.state == STATE.ERROR)
          this.removeHandler(FILE_HANDLER);
      }
    };

    file.addHandler(FILE_HANDLER);
    file.save(createDictionaryFileContent(data));
  }
};
