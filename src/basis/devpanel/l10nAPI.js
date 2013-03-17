
basis.require('basis.data.property');

var STATE = basis.data.STATE;

var inspector = resource('l10nInspector.js').fetch();
var transport = resource('transport.js').fetch();
var sendData = transport.sendData;

basis.l10n.addCreateDictionaryHandler(function(dictionaryName){
  sendData('newDictionary', { dictionaryName: dictionaryName });
}); 

basis.l10n.onCultureChange(function(culture){
  sendData('cultureChanged', culture);
});

module.exports = {
  l10nStartInspect: function(){
    inspector.startInspect();
  },
  l10nEndInspect: function(){
    inspector.endInspect();
  },  
  loadCultureList: function(){
    var data = {
      currentCulture: basis.l10n.getCulture(),
      cultureList: basis.l10n.getCultureList()
    }
    sendData('cultureList', data);
  },

  loadDictionaryList: function(){
    var dictionaries = basis.l10n.getDictionaries();
    var data = [];

    for (var dictionaryName in dictionaries)
      if (dictionaries[dictionaryName].location)
        data.push({
          Dictionary: dictionaryName,
          Location: dictionaries[dictionaryName].location
        });

    sendData('dictionaryList', data);
  },

  loadDictionaryResource: function(dictionaryName, culture){
    var dict = basis.l10n.getDictionary(dictionaryName);
    if (dict)
    {
      basis.l10n.loadCultureForDictionary(basis.l10n.getDictionary(dictionaryName), culture);

      var data = {
        dictionaryName: dictionaryName,
        tokens: {}
      };

      for (var tokenName in dict.resources['base'])
      {
        if (!data.tokens[tokenName])
        {
          data.tokens[tokenName] = {};
          dict.getToken(tokenName);
        }
        
        data.tokens[tokenName][culture] = dict.resources[culture] && dict.resources[culture][tokenName] || '';
      }

      sendData('dictionaryResource', data);
    }
  },

  setTokenCultureValue: function(namespace, name, culture, value){
    var token = basis.l10n.getToken(namespace + '.' + name);
    token.dictionary.setCultureValue(culture, name, value);
  },

  saveDictionary: function(dictionaryName, cultureList){
    if (!basis.devtools)
      return;

    var dict = basis.l10n.getDictionary(dictionaryName);
    var location = dict.location;

    var dictionaryData = {};
    var dictContent;
    var resourceParts;

    var fileDataObjectSet = new basis.data.property.DataObjectSet({
      state: STATE.READY,
      handler: {
        stateChanged: function(){
          if (this.state == STATE.READY)
            sendData('saveDictionary', { result: 'success', dictionaryName: dictionaryName, tokens: dictionaryData });
          else if (this.state == STATE.ERROR)
            sendData('saveDictionary', { result: 'error', dictionaryName: dictionaryName, errorText: this.state.data });

          if (this.state == STATE.READY || this.state == STATE.ERROR)
            setTimeout(function(){
              fileDataObjectSet.destroy();
            }, 0);
        }
      }
    });

    var dictionaries;
    var resourceParts;
    var dictParts;
    var filename;
    var file;
    var newContent;

    for (var i = 0, culture; culture = cultureList[i]; i++)
    {
      filename = '/' + basis.path.relative(location + '/' + culture + '.json');
      file = basis.devtools.getFile(filename, true);

      dictionaries = Object.extend({}, basis.resource(filename)());
      dictionaries[dictionaryName] = dict.resources[culture];
      dictParts = [];
      for (var dName in dictionaries)
      {
        resourceParts = [];

        if (dName == dict.namespace)
        {
          for (var tokenName in dict.resources['base'])
          {
            if (dict.resources[culture][tokenName])
              resourceParts.push('    "' + tokenName + '": "' + dict.resources[culture][tokenName] + '"');

            if (!dictionaryData[tokenName])
              dictionaryData[tokenName] = {};

            dictionaryData[tokenName][culture] = dict.resources[culture][tokenName] || '';
          }
        }
        else
        {
          for (var tokenName in dictionaries[dName])
            resourceParts.push('    "' + tokenName + '": "' + dictionaries[dName][tokenName] + '"');
        }

        dictParts.push('\r\n  "' + dName + '": {\r\n' + resourceParts.join(',\r\n') + '\r\n  }');
      }

      newContent = '{' + dictParts.join(', ') + '\r\n}';  


      fileDataObjectSet.add(file);
      file.save(newContent);
    }
  }
}