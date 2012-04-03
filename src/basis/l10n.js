
!function(basis, global){
  'use strict';

  var Class = basis.Class;

  var namespace = 'basis.l10n';
  
  var currentCulture;

  var dictionaries = {};

  var Token = Class(null, {
    init: function(){
      this.listeners = [];
    },
    set: function(value){
      if (value != this.value)
      {
        this.value = value;
        for (var i = 0, listener; listener = this.listeners[i]; i++)
          listener.handler.call(listener.context);
      }
    },
    /*get: function(){
      return this.value;
    },*/
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
    }
  });

  var Dictionary = Class(null, {
    init: function(namespace){
      this.namespace = namespace;
      this.tokens = {};
      this.resources = {};
    },
    getToken: function(tokenName){
      if (!(tokenName in this.tokens))
      {
        this.tokens[tokenName] = new Token();
        this.tokens[tokenName].set(this.getCultureValue(currentCulture, tokenName) || this.getCultureValue('base', tokenName));
      }

      return this.tokens[tokenName];
    },
    setTokens: function(culture, tokens){
      for (var tokenName in tokens)
        this.setCultureValue(culture, tokenName, tokens[tokenName]);
    },
    setCultureValue: function(culture, tokenName, tokenValue){
      var resource = this.resources[culture];
      if (!resource)
        resource = this.resources[culture] = {};

      resource[tokenName] = tokenValue;

      if (culture == currentCulture)
        this.getToken(tokenName).set(tokenValue);
    },
    getCultureValue: function(culture, tokenName){
      return this.resources[culture] && this.resources[culture][tokenName];
    },
    setCulture: function(culture){
      for (var i in this.tokens)
        this.tokens[i].set(this.getCultureValue(culture, i) || this.getCultureValue('base', i));
    }
  });

  function updateDictionary(culture, namespace, tokens){
    var dictionary = getDictionary(namespace, true);
    dictionary.setTokens(culture, tokens);
  }

  function getDictionary(namespace, autoCreate){
    var dict = dictionaries[namespace];    

    if (!dict && autoCreate)
      dict = dictionaries[namespace] = new Dictionary(namespace);

    return dict;
  }

  function getToken(namespace){
    var dotIndex = namespace.lastIndexOf('.');
    return getDictionary(namespace.substr(0, dotIndex), true).getToken(namespace.substr(dotIndex + 1));
  }

  function setCulture(culture){
    for (var i in dictionaries)
      dictionaries[i].setCulture(culture);
  }

  basis.namespace(namespace).extend({
    Token: Token,
    setCulture: setCulture,
    getToken: getToken,
    updateDictionary: updateDictionary
  });

}(basis, this);