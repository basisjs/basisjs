/*!
 * Basis javascript library
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

  'use strict';


 /**
  * @namespace basis.l10n
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;


  //
  // main part
  //

  var dictionaryLocations = {};
  var resourcesLoaded = {};
  var dictionaries = {};

  var currentCulture = 'base';
  var cultureList = ['en-US', 'ru-RU', 'uk-UA'];


  var Token = Class(null, {
    className: namespace + '.Token',

    bindingBridge: {
      attach: function(token, handler, context){
        return token.attach(handler, context);
      },
      detach: function(token, handler, context){
        return token.detach(handler, context);
      },
      get: function(token){
        return token.value;
      }
    },

    listeners: null,
    value: null,

    toString: function(){
      return this.value
    },

    init: function(dictionary, tokenName){
      this.listeners = [];
      this.value = '';
      this.dictionary = dictionary;
      this.name = tokenName;
    },

    set: function(value){
      if (value != this.value)
      {
        this.value = value;
        for (var i = 0, listener; listener = this.listeners[i]; i++)
          listener.handler.call(listener.context, value);
      }
    },
    get: function(){
      return this.value;
    },

    attach: function(handler, context){
      for (var i = 0, listener; listener = this.listeners[i]; i++)
      {
        if (listener.handler == handler && listener.context == context)
          return false;
      }

      this.listeners.push({
        handler: handler,
        context: context
      });

      return true;
    },
    detach: function(handler, context){
      for (var i = 0, listener; listener = this.listeners[i]; i++)
      {
        if (listener.handler == handler && listener.context == context)
        {
          this.listeners.splice(i, 1);
          return true;
        }
      }

      return false;
    },

    destroy: function(){
      for (var i = 0, listener; listener = this.listeners[i]; i++)
        this.detach(listener.handler, listener.context);

      delete this.listeners;
      delete this.value;
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
      this.tokens[tokenName].set(this.getCultureValue(culture, tokenName) || this.getCultureValue('base', tokenName));
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

  function getToken(path){
    if (arguments.length > 1)
      path = Array.from(arguments).join('.');

    var dotIndex = path.lastIndexOf('.');
    return getDictionary(path.substr(0, dotIndex), true).getToken(path.substr(dotIndex + 1));
  }

  function getDictionary(namespace, autoCreate){
    var dict = dictionaries[namespace];    

    if (!dict && autoCreate)
      dict = dictionaries[namespace] = new Dictionary(namespace);

    return dict;
  }

  function getDictionaries(){
    return dictionaries;
  }

  function createDictionary(namespace, location, tokens){
    var dictionary = getDictionary(namespace, true)
    dictionary.location = location;

    dictionary.update('base', tokens);

    loadCultureForDictionary(dictionary, currentCulture)

    fireCreateDictionaryEvent(namespace);
  }

  function updateDictionary(namespace, culture, tokens){
    getDictionary(namespace, true).update(culture, tokens);
  }

  function setCulture(culture){
    if (currentCulture != culture)
    {
      currentCulture = culture || 'base';
      for (var i in dictionaries)
        setCultureForDictionary(dictionaries[i], currentCulture);
    }
  }
  function getCulture(){
    return currentCulture;
  }

  function setCultureForDictionary(dictionary, culture){
    loadCultureForDictionary(dictionary, culture)
    dictionary.setCulture(culture);
  }

  function loadCultureForDictionary(dictionary, culture){
    if (culture == 'base')
      return;

    if (!cultureList || cultureList.indexOf(culture) != -1)
    {
      var location = dictionary.location + '/' + culture;
      if (!resourcesLoaded[location])
      {
        resourcesLoaded[location] = true;
        
        var res = basis.resource(location + '.json');
        res.bindingBridge.attach(res, function(content){
          updateDictionaryResource(content, culture);
        });
        updateDictionaryResource(res(), culture);

        //loadResource(location + '.js', culture);
      }
    }
    else {
      ;;;console.warn('Culture "' + culture + '" is not specified in the list');
    }
  }

  function updateDictionaryResource(content, culture){
    var dictionaryData = content; /*{};
    try
    {
      dictionaryData = content.toObject();
    }
    catch(e)
    {
      console.warn('Can\'t read dictionary data (' + location + '); error: ' + e.toString());
    }*/

    for (var dictionaryName in dictionaryData)
      updateDictionary(dictionaryName, culture, dictionaryData[dictionaryName]);    
  }


  function setCultureList(list){
    if (typeof list == 'string')
      list = list.qw();

    cultureList = list;
  }
  function getCultureList(){
    return cultureList;
  }


  /*function loadResource(fileName, culture){
    var requestUrl = fileName
    var req = new XMLHttpRequest();
    req.open('GET', fileName, false);
    req.send(null);
    if (req.status == 200)
    {
      (global.execScript || function(scriptText){
        global["eval"].call(global, scriptText);
      })(req.responseText);
    }
  }*/

  var dictionaryUpdateListeners = [];
  function addHandler(handler, context) {
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


  basis.namespace(namespace).extend({
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
  });
