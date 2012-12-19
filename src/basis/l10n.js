
 /**
  * @namespace basis.l10n
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var arrayFrom = basis.array.from;


  //
  // main part
  //

  var dictionaryLocations = {};
  var resourcesLoaded = {};
  var dictionaries = {};

  var currentCulture = 'base';
  var cultureList = ['en-US', 'ru-RU', 'uk-UA'];
  var cultureGetTokenValue = {};
  var cultureReplacement = {};
  var tokenIndex = [];

  var Token = Class(basis.Token, {
    className: namespace + '.Token',

    value: '',

    toString: function(){
      return this.value;
    },

    init: function(dictionary, tokenName){
      basis.Token.prototype.init.call(this);

      this.dictionary = dictionary;
      this.name = tokenName;

      tokenIndex.push(this);
    },

    get: function(){
      return this.value;
    },
    set: function(value){
      if (value != this.value)
      {
        this.value = value;
        this.apply();
      }
    },

    destroy: function(){
      this.value = null;
      basis.Token.prototype.destroy.call(this);
    }
  });


  var Dictionary = Class(null, {
    className: namespace + '.Dictionary',

    init: function(namespace){
      this.namespace = namespace;
      this.tokens = {};
      this.resources = {};
    },
    update: function(culture, newTokens){
      for (var tokenName in this.tokens)
        if (!newTokens[tokenName])
          this.setCultureValue(culture, tokenName, '');

      for (var tokenName in newTokens)
        this.setCultureValue(culture, tokenName, newTokens[tokenName]);
    },
    setCulture: function(culture){
      for (var tokenName in this.tokens)
        this.setTokenValue(tokenName, culture);
    },
    setTokenValue: function(tokenName, culture){
      this.tokens[tokenName].set(cultureGetTokenValue[culture] ? cultureGetTokenValue[culture].call(this, tokenName) : this.getTokenValue(culture, tokenName));
    },
    getTokenValue: function(culture, tokenName){
      return this.getCultureValue(culture, tokenName) || this.getCultureValue('base', tokenName);
    },
    setCultureValue: function(culture, tokenName, tokenValue){
      var resource = this.resources[culture];
      if (!resource)
        resource = this.resources[culture] = {};

      resource[tokenName] = tokenValue;

      if (this.tokens[tokenName] && (culture == 'base' || culture == currentCulture))
        this.setTokenValue(tokenName, currentCulture);
    },
    getCultureValue: function(culture, tokenName){
      return this.resources[culture] && this.resources[culture][tokenName];
    },
    getToken: function(tokenName){
      if (!(tokenName in this.tokens))
      {
        this.tokens[tokenName] = new Token(this, tokenName);
        this.setTokenValue(tokenName, currentCulture);
      }

      return this.tokens[tokenName];
    },
    destroy: function(){
      delete this.namespace;
      delete this.tokens;
      delete this.resources;
    }
  });


  function getCultureList(){
    return cultureList;
  }

  function setCultureList(list){
    if (typeof list == 'string')
      list = list.qw();

    var cultures = [];
    var cultureRow;

    for (var i = 0, culture; culture = list[i]; i++)
    {
      cultureRow = culture.split('/');
      cultures.push(cultureRow[0]);
      cultureGetTokenValue[cultureRow[0]] = createGetTokenValueFunction(cultureRow);
      cultureReplacement[cultureRow[0]] = cultureRow.slice(1);
    }

    cultureList = cultures;
  }

  function createGetTokenValueFunction(cultureRow){
    return function(tokenName){
      for (var i = 0, culture, value; culture = cultureRow[i++];)
        if (value = this.getCultureValue(culture, tokenName))
          return value;
      return this.getCultureValue('base', tokenName);
    }
  }


  function getDictionaries(){
    return dictionaries;
  }

  function createDictionary(namespace, location, tokens){
    ;;;if (this !== module && typeof console != 'undefined') console.warn('basis.l10n.createDictionary: Called with wrong context. Don\'t shortcut this function call, use basis.l10n.createDictionary to make build possible');

    var dictionary = getDictionary(namespace);

    ;;;if (dictionary && typeof console != 'undefined') console.warn('basis.l10n.createDictionary: Dictionary ' + namespace + ' is already created');

    dictionary = getDictionary(namespace, true);
    dictionary.location = location;

    if (Array.isArray(tokens))
    { // packed dictionary
      var idx = 0;
      var token;
      var item;
      for (var i = 0; i < tokens.length; i++, idx++)
      {
        item = tokens[i];
        if (typeof item == 'number')
          idx += item;
        else
        {
          if (token = tokenIndex[idx])
            token.dictionary.setCultureValue('base', token.name, item);
        }
      }
    }
    else
      dictionary.update('base', tokens);

    loadCultureForDictionary(dictionary, currentCulture);

    fireCreateDictionaryEvent(namespace);
  }

  function updateDictionary(namespace, culture, tokens){
    getDictionary(namespace, true).update(culture, tokens);
  }

  function getDictionary(namespace, autoCreate){
    var dict = dictionaries[namespace];    

    if (!dict && autoCreate)
      dict = dictionaries[namespace] = new Dictionary(namespace);

    return dict;
  }

  function getToken(path){
    if (arguments.length > 1)
      path = arrayFrom(arguments).join('.');

    if (path.charAt(0) == '#')
    {
      return tokenIndex[parseInt(path.substr(1), 36)];
    }
    else
    {
      var dotIndex = path.lastIndexOf('.');
      return getDictionary(path.substr(0, dotIndex), true).getToken(path.substr(dotIndex + 1));
    }
  }


  function getCulture(){
    return currentCulture;
  }

  function setCulture(culture){
    if (currentCulture != culture)
    {
      currentCulture = culture || 'base';
      for (var i in dictionaries)
        setCultureForDictionary(dictionaries[i], currentCulture);
    }
  }

  function setCultureForDictionary(dictionary, culture){
    loadCultureForDictionary(dictionary, culture);
    dictionary.setCulture(culture);
  }

  function loadCultureForDictionary(dictionary, culture){
    if (cultureReplacement[culture]) 
      for (var i = 0, cult; cult = cultureReplacement[culture][i]; i++) 
        loadCultureForDictionary_(dictionary, cult);

    loadCultureForDictionary_(dictionary, culture);
  }

  function loadCultureForDictionary_(dictionary, culture){
    if (culture == 'base')
      return;

    if (!cultureList || cultureList.indexOf(culture) != -1)
    {
      if (!dictionary.location)
        return;

      var location = dictionary.location + '/' + culture;

      var resource = basis.resource(location + '.json');
      if (!resourcesLoaded[location])
      {
        resource.bindingBridge.attach(resource, function(content){
          updateDictionaryResource(content, culture);
        });
        resourcesLoaded[location] = true;
        //loadResource(location + '.js', culture);
      }

      updateDictionaryResource(resource(), culture, dictionary.namespace);
    }
    else {
      ;;;console.warn('Culture "' + culture + '" is not specified in the list');
    }
  }

  function updateDictionaryResource(dictionaryData, culture, dictionary){
    if (Array.isArray(dictionaryData))
    { // packed dictionary
      var idx = 0;
      var token;
      var item;
      for (var i = 0; i < dictionaryData.length; i++, idx++)
      {
        item = dictionaryData[i];
        if (typeof item == 'number')
          idx += item;
        else
        {
          if (token = tokenIndex[idx])
            token.dictionary.setCultureValue(culture, token.name, item);
        }
      }
    }
    else
    {
      if (dictionary)
      {
        if (dictionaryData[dictionary])
          updateDictionary(dictionary, culture, dictionaryData[dictionary]);
      }
      else
      {
        for (var dictionaryName in dictionaryData)
          updateDictionary(dictionaryName, culture, dictionaryData[dictionaryName]);
      }
    }
  }

  //
  // create dictionary event handling
  //
  var dictionaryUpdateListeners = [];
  function addHandler(handler, context){
    for (var i = 0, listener; listener = dictionaryUpdateListeners[i]; i++)
    {
      if (listener.handler == handler && listener.context == context)
        return false;
    }

    dictionaryUpdateListeners.push({
      handler: handler,
      context: context
    });

    return true;
  }
  function removeHandler(handler, context){
    for (var i = 0, listener; listener = dictionaryUpdateListeners[i]; i++)
    {
      if (listener.handler == handler && listener.context == context)
      {
        dictionaryUpdateListeners.splice(i, 1);
        return true;
      }
    }

    return false;
  }
  function fireCreateDictionaryEvent(dictionaryName){
    for (var i = 0, listener; listener = dictionaryUpdateListeners[i]; i++)
      listener.handler.call(listener.context, dictionaryName);
  }


  //
  // exports
  //

  module.exports = {
    Token: Token,
    getToken: getToken,
    getDictionary: getDictionary,
    getDictionaries: getDictionaries,
    createDictionary: createDictionary,
    updateDictionary: updateDictionary,
    setCulture: setCulture,
    getCulture: getCulture,
    loadCultureForDictionary: loadCultureForDictionary,
    setCultureList: setCultureList,
    getCultureList: getCultureList,
    addCreateDictionaryHandler: addHandler,
    removeCreateDictionaryHandler: removeHandler
  };
