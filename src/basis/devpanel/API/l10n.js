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
    var dictionaries = basis.l10n.getDictionaries();
    var data = [];

    for (var dictionaryName in dictionaries)
      if (dictionaries[dictionaryName].location)
        data.push({
          Dictionary: dictionaryName,
          Location: '/' + basis.path.relative('/', dictionaries[dictionaryName].location)
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

      if (dict.resources['base'])
      {
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
    }
  },

  setTokenCultureValue: function(namespace, name, culture, value){
    var token = basis.l10n.token(namespace + '.' + name);
    token.dictionary.setCultureValue(culture, name, value);
  },

  saveDictionary: function(dictionaryName, location, cultureList){
    if (!basis.devtools)
      return;

    var dict = basis.l10n.getDictionary(dictionaryName);

    var dictionaryData = {};
    var dictContent;
    var resourceParts;

    var fileObjectSet = new basis.data.value.ObjectSet({
      state: STATE.READY,
      handler: {
        stateChanged: function(){
          if (this.state == STATE.READY)
            sendData('saveDictionary', { result: 'success', dictionaryName: dictionaryName, tokens: dictionaryData });
          else if (this.state == STATE.ERROR)
            sendData('saveDictionary', { result: 'error', dictionaryName: dictionaryName, errorText: this.state.data });

          if (this.state == STATE.READY || this.state == STATE.ERROR)
            basis.timer.nextTick(function(){
              fileObjectSet.destroy();
            });
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
      filename = '/' + basis.path.relative('/', location + '/' + culture + '.json');
      file = basis.devtools.getFile(filename, true);

      dictionaries = basis.object.slice(basis.resource(filename)());

      if (!dictionaries[dict.name])
        dictionaries[dict.name] = {};

      //dictionaries[dictionaryName] = dict.resources[culture];
      dictParts = [];
      for (var dName in dictionaries)
      {
        resourceParts = [];

        if (dName == dict.name)
        {
          var tokens = basis.object.complete(basis.object.slice(dict.resources[culture]), dictionaries[dName]);
          for (var tokenName in tokens)
          {
            var tokenValue = tokens[tokenName] || '';

            resourceParts.push('    "' + tokenName + '": "' + tokenValue + '"');

            if (!dictionaryData[tokenName])
              dictionaryData[tokenName] = {};

            dictionaryData[tokenName][culture] = tokenValue;
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


      fileObjectSet.add(file);
      file.save(newContent);
    }
  }
};
