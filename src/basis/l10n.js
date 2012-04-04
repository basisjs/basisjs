
!function(basis, global){
  'use strict';

  var Class = basis.Class;

  var namespace = 'basis.l10n';
  
  var currentCulture = 'base';

  var dictionaries = {};

  var Token = Class(null, {
    listeners: null,
    value: null,
    init: function(){
      this.listeners = [];
      this.value = '';
    },
    set: function(value){
      if (value != this.value)
      {
        this.value = value;
        for (var i = 0, listener; listener = this.listeners[i]; i++)
          listener.handler.call(listener.context);
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
    init: function(namespace){
      this.namespace = namespace;
      this.tokens = {};
      this.resources = {};
    },
    update: function(culture, tokens){
      for (var tokenName in tokens)
        this.setCultureValue(culture, tokenName, tokens[tokenName]);
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
        this.tokens[tokenName] = new Token();
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

  function updateDictionary(culture, namespace, tokens){
    getDictionary(namespace, true).update(culture, tokens);
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

  function createDictionary(namespace, tokens){
    updateDictionary('base', namespace, tokens);
  }

  function setCulture(culture){
    if (currentCulture != culture)
    {
      currentCulture = culture || 'base';
      for (var i in dictionaries)
        dictionaries[i].setCulture(culture);
    }
  }

  basis.namespace(namespace).extend({
    Token: Token,
    getToken: getToken,
    setCulture: setCulture,
    createDictionary: createDictionary,
    updateDictionary: updateDictionary
  });

}(basis, this);