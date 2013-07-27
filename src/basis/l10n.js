
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
  // Token
  //

  var tokenIndex = [];


 /**
  * @class
  */ 
  var Token = Class(basis.Token, {
    className: namespace + '.Token',

   /**
    * @constructor
    */ 
    init: function(dictionary, tokenName){
      basis.Token.prototype.init.call(this, null);

      this.dictionary = dictionary;
      this.name = tokenName;

      tokenIndex.push(this);
    },

    toString: function(){
      return this.value;
    }
  });


 /**
  * Returns token for path. If more than one argument passed, arguments
  * join by dot. Path also may be index reference, that used in production.
  * @example
  *   basis.l10n.token('path.to.some.token');
  *   basis.l10n.token(namespace, 'tokenName');
  *   basis.l10n.token(namespace, 'some.path', name);
  * @name token
  * @param {...string} path
  * @return {basis.l10n.Token} Token for passed path.
  */
  function getToken(path){
    if (arguments.length > 1)
      path = arrayFrom(arguments).join('.');

    if (path.charAt(0) == '#')
    {
      // return token by index (using in production)
      return tokenIndex[parseInt(path.substr(1), 36)];
    }
    else
    {
      var dotIndex = path.lastIndexOf('.');
      return getDictionary(path.substr(0, dotIndex), true).getToken(path.substr(dotIndex + 1));
    }
  }


  //
  // Dictionary
  //

  var dictionaryLocations = {};
  var resourcesLoaded = {};
  var dictionaries = {};
  var dictionaryUpdateListeners = [];


 /**
  * @class
  */
  var Dictionary = Class(null, {
    className: namespace + '.Dictionary',

    name: '[noname]',
    tokens: null,
    resources: null,

   /**
    * @constructor
    * @param {string} name Dictionary name
    */ 
    init: function(name){
      this.name = name;
      this.tokens = {};
      this.resources = {};
    },

   /**
    * @param {string} culture Culture name
    * @param {object} tokens Object that contains new tokens data
    */ 
    update: function(culture, tokens){
      for (var tokenName in this.tokens)
        if (!tokens[tokenName])
          this.setCultureValue(culture, tokenName, '');

      for (var tokenName in tokens)
        this.setCultureValue(culture, tokenName, tokens[tokenName]);
    },

   /**
    * @param {string} culture Culture name
    */ 
    setCulture: function(culture){
      for (var tokenName in this.tokens)
        this.setTokenValue(culture, tokenName);
    },

   /**
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    * @return {*}
    */ 
    getTokenValue: function(culture, tokenName){
      return this.getCultureValue(culture, tokenName) || this.getCultureValue('base', tokenName);
    },

   /**
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    */ 
    setTokenValue: function(culture, tokenName){
      this.tokens[tokenName].set(cultureGetTokenValue[culture]
        ? cultureGetTokenValue[culture].call(this, tokenName)
        : this.getTokenValue(culture, tokenName)
      );
    },

   /**
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    * @return {*}
    */ 
    getCultureValue: function(culture, tokenName){
      return this.resources[culture] && this.resources[culture][tokenName];
    },    

   /**
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    * @param {string} tokenValue New token value
    */ 
    setCultureValue: function(culture, tokenName, tokenValue){
      var resource = this.resources[culture];

      if (!resource)
        resource = this.resources[culture] = {};

      resource[tokenName] = tokenValue;

      if (this.tokens[tokenName] && (culture == 'base' || culture == currentCulture))
        this.setTokenValue(currentCulture, tokenName);
    },

   /**
    * @param {string} tokenName Token name
    */ 
    getToken: function(tokenName){
      if (tokenName in this.tokens == false)
      {
        this.tokens[tokenName] = new Token(this, tokenName);
        this.setTokenValue(currentCulture, tokenName);
      }

      return this.tokens[tokenName];
    },

   /**
    * @destructor
    */ 
    destroy: function(){
      this.tokens = null;
      this.resources = null;
    }
  });


 /**
  * @param {Array.<string>} cultureList
  * @return {function(tokenName)}
  */
  function createGetTokenValueFunction(cultureList){
    return function(tokenName){
      for (var i = 0, culture, value; culture = cultureList[i++];)
        if (value = this.getCultureValue(culture, tokenName))
          return value;

      return this.getCultureValue('base', tokenName);
    }
  }


 /**
  * Returns list of all dictionaries. Using in development mode.
  * @return {Array.<basis.l10n.Dictionary>}
  */
  function getDictionaries(){
    return dictionaries;
  }


 /**
  * Returns dictionary by name. If autoCreate is true dictionary will be created if
  * it doesn't created yet.
  * @param {string} dictionaryName Dictionary name
  * @param {boolean} autoCreate Should dictionary to be created if it's now created yet.
  * @return {basis.l10n.Dictionary}
  */
  function getDictionary(dictionaryName, autoCreate){
    var dictionary = dictionaries[dictionaryName];    

    if (!dictionary && autoCreate)
      dictionary = dictionaries[dictionaryName] = new Dictionary(dictionaryName);

    return dictionary;
  }


 /**
  * Creates new dictionary.
  * @example
  *   basis.l10n.createDictionary('my.dictionary.namespace', __dirname + 'l10n', {
  *     title: 'Hello world'
  *   });
  * @param {string} dictionaryName Dictionary name.
  * @param {string} location Directory where dictionary resources placed.
  * @param {object} tokens Base tokens map.
  */
  function createDictionary(dictionaryName, location, tokens){
    ;;;if (this !== module) basis.dev.warn('basis.l10n.createDictionary: Called with wrong context. Don\'t shortcut this function call, use basis.l10n.createDictionary to make build possible');

    var dictionary = getDictionary(dictionaryName);

    dictionary = getDictionary(dictionaryName, true);
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

    fireCreateDictionaryEvent(dictionaryName);
  }

 /**
  * Update dictionary by new tokens for some culture.
  * @param {string} dictionaryName Dictionary name
  * @param {string} location Directory where dictionary resources placed.
  * @param {object} tokens Base tokens map
  */ 
  function updateDictionary(dictionaryName, culture, tokens){
    getDictionary(dictionaryName, true).update(culture, tokens);
  }


 /**
  * @param {object|Array.<object>} dictionaryData
  * @param {string} culture Culture name
  * @param {string} dictionaryName Dictionary name
  */
  function updateDictionaryResource(dictionaryData, culture, dictionaryName){
    if (!dictionaryData)
      return;

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
      if (dictionaryName)
      {
        if (dictionaryData[dictionaryName])
          updateDictionary(dictionaryName, culture, dictionaryData[dictionaryName]);
      }
      else
      {
        for (var dictionaryName in dictionaryData)
          updateDictionary(dictionaryName, culture, dictionaryData[dictionaryName]);
      }
    }
  }

  //
  // update dictionary event handling
  //

  function addHandler(handler, context){
    for (var i = 0, listener; listener = dictionaryUpdateListeners[i]; i++)
      if (listener.handler == handler && listener.context == context)
        return false;

    dictionaryUpdateListeners.push({
      handler: handler,
      context: context
    });

    return true;
  }

  function removeHandler(handler, context){
    for (var i = 0, listener; listener = dictionaryUpdateListeners[i]; i++)
      if (listener.handler == handler && listener.context == context)
      {
        dictionaryUpdateListeners.splice(i, 1);
        return true;
      }

    return false;
  }

  function fireCreateDictionaryEvent(dictionaryName){
    for (var i = 0, listener; listener = dictionaryUpdateListeners[i]; i++)
      listener.handler.call(listener.context, dictionaryName);
  }


  //
  // Culture
  //

  var currentCulture = 'base';
  var cultureList = [];
  var cultureGetTokenValue = {};
  var cultureFallback = {}; 
  var cultureChangeHandlers = [];


 /**
  * Returns current culture name.
  * @return {string} Current culture name.
  */ 
  function getCulture(){
    return currentCulture;
  }


 /**
  * Set new culture.
  * @param {string} culture Culture name.
  */ 
  function setCulture(culture){
    if (!culture)
      culture = 'base';

    if (currentCulture != culture)
    {
      currentCulture = culture;

      for (var name in dictionaries)
        setCultureForDictionary(dictionaries[name], currentCulture);

      for (var i = 0, handler; handler = cultureChangeHandlers[i]; i++)
        handler.fn.call(handler.context, culture);
    }
  }


 /**
  * Returns current culture list.
  * @return {Array.<string>}
  */ 
  function getCultureList(){
    return cultureList;
  }


 /**
  * Set new culture list.
  * @example
  *   basis.l10n.setCultureList(['ru-RU', 'en-US']);
  *   basis.l10n.setCultureList('ru-RU en-US');
  *
  *   // set culture list with fallback for uk-UA
  *   basis.l10n.setCultureList('ru-RU uk-UA/ru-RU en-US');
  * @param {Array.<string>|string} list
  */
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
      cultureFallback[cultureRow[0]] = cultureRow.slice(1);
    }

    cultureList = cultures;
  }


 /**
  * @param {string} dictionary Dictionary name
  * @param {string} culture Culture name
  */ 
  function setCultureForDictionary(dictionary, culture){
    loadCultureForDictionary(dictionary, culture);
    dictionary.setCulture(culture);
  }


 /**
  * Load culture resources for some dictionary
  * @param {string} dictionary Dictionary name
  * @param {string} culture Culture name
  */ 
  function loadCultureForDictionary(dictionary, culture){
    function load(culture){
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
          resourcesLoaded[location] = true;
          resource.attach(function(content){
            updateDictionaryResource(content, culture);
          });
        }

        updateDictionaryResource(resource(), culture, dictionary.name);
      }
      else
      {
        ;;;basis.dev.warn('Culture "' + culture + '" is not specified in the list');
      }
    }

    if (cultureFallback[culture]) 
      for (var i = 0, fallbackCulture; fallbackCulture = cultureFallback[culture][i]; i++) 
        load(fallbackCulture);

    load(culture);
  }


 /**
  * Add callback on culture change.
  * @param {function(culture)} fn Callback
  * @param {context=} context Context for callback
  * @param {boolean=} fire If true callback will be invoked with current
  *   culture name right after callback attachment.
  */ 
  function onCultureChange(fn, context, fire){
    cultureChangeHandlers.push({
      fn: fn,
      context: context
    });

    if (fire)
      fn.call(context, currentCulture);
  }


  //
  // exports
  //

  module.exports = {
    Token: Token,
    token: getToken,
    getToken: function(){
      ;;;basis.dev.warn('basis.l10n.getToken is deprecated, use basis.l10n.token instead');
      return getToken.apply(this, arguments);
    },
    
    getDictionary: getDictionary,
    createDictionary: createDictionary,
    updateDictionary: updateDictionary,
    /** dev */ getDictionaries: getDictionaries,
    /** dev */ addCreateDictionaryHandler: addHandler,
    /** dev */ removeCreateDictionaryHandler: removeHandler,

    getCulture: getCulture,
    setCulture: setCulture,
    getCultureList: getCultureList,
    setCultureList: setCultureList,
    /** dev */ loadCultureForDictionary: loadCultureForDictionary,

    onCultureChange: onCultureChange
  };
