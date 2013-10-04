
  basis.require('basis.event');


 /**
  * @namespace basis.l10n
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var Emitter = basis.event.Emitter;


  // process .l10n files as .json
  basis.resource.extensions['.l10n'] = basis.resource.extensions['.json'];

  // get own object keys
  function ownKeys(object){
    var result = [];

    for (var key in object)
      if (hasOwnProperty.call(object, key))
        result.push(key);

    return result;
  }

  //
  // Token
  //

  var tokenIndex = [];
  var tokenComputeFn = {};
  var tokenComputes = {};


 /**
  * @class
  */ 
  var ComputeToken = Class(basis.Token, {
    className: namespace + '.ComputeToken',

   /**
    * @constructor
    */ 
    init: function(value, token){
      token.computeTokens[this.basisObjectId] = this;
      this.token = token;
      this.get = token.computeGetMethod;

      basis.Token.prototype.init.call(this, value);
    },

    toString: function(){
      return this.get();
    },

    destroy: function(){    
      delete this.token.computeTokens[this.basisObjectId];
      this.token = null;

      basis.Token.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */ 
  var Token = Class(basis.Token, {
    className: namespace + '.Token',

   /**
    * @type {number}
    */ 
    index: NaN,

   /**
    * @type {basis.l10n.Dictionary}
    */
    dictionary: null,

   /**
    * @type {string}
    */
    name: '',

   /**
    * enum default, plural, markup
    */ 
    type: 'default',

   /**
    *
    */ 
    computeTokens: null,

   /**
    * @constructor
    */ 
    init: function(dictionary, tokenName, type, value){
      basis.Token.prototype.init.call(this, value);

      this.index = tokenIndex.push(this) - 1;
      this.name = tokenName;
      this.dictionary = dictionary;
      this.computeTokens = {};

      if (type)
        this.setType(type);
      else
        this.apply();
    },

    toString: function(){
      return this.get();
    },

    computeGetMethod: function(){
    },

    apply: function(){
      var values = {};
      var tokens = this.computeTokens;
      var get = this.type == 'plural'
        ? function(){
            return values[cultures[currentCulture].plural(this.value)];
          }
        : function(){
            return values[this.value];
          };

      this.computeGetMethod = get;

      if ((this.type == 'plural' && Array.isArray(this.value)) 
          || (this.type == 'default' && typeof this.value == 'object'))
        values = basis.object.slice(this.value, ownKeys(this.value));

      for (var key in tokens)
      {
        var computeToken = tokens[key];
        var curValue = computeToken.get();
        var newValue = get.call(computeToken);

        computeToken.get = get;

        if (curValue !== newValue)
          computeToken.apply();
      }

      basis.Token.prototype.apply.call(this);
    },

    setType: function(type){
      if (type != 'plural' && (!basis.l10n.enableMarkup || type != 'markup'))
        type = 'default';

      if (this.type != type)
      {
        this.type = type;
        this.apply();
      }
    },

    compute: function(events, getter){
      if (arguments.length == 1)
      {
        getter = events;
        events = '';
      }

      getter = basis.getter(getter);
      events = String(events).trim().split(/\s+|\s*,\s*/).sort();

      var tokenId = this.basisObjectId;
      var enumId = events.concat(tokenId, getter.basisGetterId_).join('_');

      if (tokenComputeFn[enumId])
        return tokenComputeFn[enumId];

      var token = this;
      var objectTokenMap = {};
      var updateValue = function(object){
        this.set(getter(object));
      };
      var handler = {
        destroy: function(object){
          delete objectTokenMap[object.basisObjectId];
          this.destroy();
        }
      };

      for (var i = 0, eventName; eventName = events[i]; i++)
        if (eventName != 'destroy')
          handler[eventName] = updateValue;

      return tokenComputeFn[enumId] = function(object){
        if (object instanceof Emitter == false)
          throw 'basis.l10n.Token#compute: object must be an instanceof Emitter';

        var objectId = object.basisObjectId;
        var computeToken = objectTokenMap[objectId];

        if (!computeToken)
        {
          computeToken = objectTokenMap[objectId] = new ComputeToken(getter(object), token);
          object.addHandler(handler, computeToken);
        }

        return computeToken;
      }
    },

    computeToken: function(value){
      return new ComputeToken(value, this);
    },

    token: function(name){
      if (this.type == 'plural')
        name = cultures[currentCulture].plural(name);

      if (this.dictionary)
        return this.dictionary.token(this.name + '.' + name);
    },

   /**
    * @destructor
    */ 
    destroy: function(){
      for (var key in this.computeTokens)
        this.computeTokens[key].destroy();

      this.computeTokens = null;
      this.value = null;

      basis.Token.prototype.destroy.call(this);
    }
  });


 /**
  * Returns token for path. Path also may be index reference, that used in production.
  * @example
  *   basis.l10n.token('token.path@path/to/dict');  // token by name and dictionary location
  *   basis.l10n.token('#123');  // get token by base 36 index, use in production
  * @name basis.l10n.token
  * @param {string} path
  * @return {basis.l10n.Token}
  */
  function resolveToken(path){
    if (path.charAt(0) == '#')
    {
      // return index by absolute index
      return tokenIndex[parseInt(path.substr(1), 36)];
    }
    else
    {
      var parts = path.match(/^(.+?)@(.+)$/);

      if (parts)
        return resolveDictionary(parts[2]).token(parts[1]);

      ;;;basis.dev.warn('basis.l10n.token accepts token references in format `token.path@path/to/dict.l10n` only');
    }
  }


  //
  // Dictionary
  //

  var dictionaries = [];
  var dictionaryByLocation = {};
  var dictionaryUpdateListeners = [];

  function walkTokens(dictionary, culture, tokens, path){
    var cultureValues = dictionary.cultureValues[culture];

    path = path ? path + '.' : '';

    for (var name in tokens)
      if (hasOwnProperty.call(tokens, name))
      {
        var tokenName = path + name;
        var tokenValue = tokens[name];

        cultureValues[tokenName] = tokenValue;

        if (tokenValue && (typeof tokenValue == 'object' || Array.isArray(tokenValue)))
          walkTokens(dictionary, culture, tokenValue, tokenName);
      }
  }


 /**
  * @class
  */
  var Dictionary = Class(null, {
    className: namespace + '.Dictionary',

   /**
    * Token map.
    * @type {object}
    */ 
    tokens: null,

   /**
    * @type {object}
    */
    types: null, 

   /**
    * Values by cultures
    * @type {object}
    */ 
    cultureValues: null,

   /**
    * @type {number}
    */ 
    index: NaN,

   /**
    * Token data source
    * @type {basis.resource}
    */
    resource: null, 

   /**
    * @constructor
    * @param {string} name Dictionary name
    */ 
    init: function(resource){
      this.tokens = {};
      this.types = {};
      this.cultureValues = {};

      // attach to resource
      this.resource = resource;
      this.update(resource());
      resource.attach(this.update, this);

      // add to dictionary list
      this.index = dictionaries.push(this) - 1;

      // notify dictionary created
      createDictionaryNotifier.set(resource.url);
    },

   /**
    * @param {object} data Object that contains new tokens data
    */ 
    update: function(data){
      if (!data)
        data = {};

      // reset old data
      this.cultureValues = {};

      // apply token values
      for (var culture in data)
        if (!/^_|_$/.test(culture)) // ignore names with underscore in the begining or ending (reserved for meta)
        {
          this.cultureValues[culture] = {};
          walkTokens(this, culture, data[culture]);
        }

      // apply types
      this.types = (data._meta && data._meta.type) || {};
      for (var key in this.tokens)
        this.tokens[key].setType(this.types[key]);

      // update values
      this.syncValues();
    },

   /**
    * Sync token values according to current culture and it's fallback.
    */ 
    syncValues: function(){
      for (var tokenName in this.tokens)
        this.tokens[tokenName].set(this.getValue(tokenName));
    },

   /**
    * Get current value for tokenName according to current culture and it's fallback.
    * @param {string} tokenName
    */ 
    getValue: function(tokenName){
      var fallback = cultureFallback[currentCulture];

      for (var i = 0, cultureName; cultureName = fallback[i]; i++)
      {
        var cultureValues = this.cultureValues[cultureName];
        if (cultureValues && tokenName in cultureValues)
          return cultureValues[tokenName];
      }
    },

   /**
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    * @return {*}
    */ 
    getCultureValue: function(culture, tokenName){
      return this.cultureValues[culture] && this.cultureValues[culture][tokenName];
    },

   /**
    * @param {string} tokenName Token name
    * @return {basis.l10n.Token}
    */
    token: function(tokenName){
      var token = this.tokens[tokenName];

      if (!token)
      {
        token = this.tokens[tokenName] = new Token(
          this,
          tokenName,
          this.types[tokenName],
          this.getValue(tokenName)
        );
      }

      return token;
    },

   /**
    * @destructor
    */ 
    destroy: function(){
      this.tokens = null;
      this.cultureValues = null;
      basis.array.remove(dictionaries, this);
    }
  });


 /**
  * @param {string} location
  * @return {basis.l10n.Dictionary}
  */ 
  function resolveDictionary(location){
    var extname = basis.path.extname(location);
    var resource = basis.resource(extname != '.l10n' ? basis.path.dirname(location) + '/' + basis.path.basename(location, extname) + '.l10n' : location);
    var dictionary = dictionaryByLocation[resource.url];

    if (!dictionary)
      dictionary = dictionaryByLocation[resource.url] = new Dictionary(resource);

    return dictionary;
  }


 /**
  * Returns list of all dictionaries. Using in development mode.
  * @return {Array.<basis.l10n.Dictionary>}
  */
  function getDictionaries(){
    return dictionaries.slice(0);
  }

 /**
  * 
  */
  var createDictionaryNotifier = new basis.Token();


  //
  // Culture
  //

  var cultureList = [];
  var cultures = {};
  var cultureFallback = {}; 

  var currentCulture = null;


 /**
  * @class
  */
  var Culture = basis.Class(null, {
    className: namespace + '.Culture',

    name: '',
    init: function(name){
      this.name = name;

      // temporary here
      if (name == 'ru-RU')
        this.plural = function(n){
          if (n % 10 == 1 && n % 100 !=11)
            return 0;
          if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
            return 1;
          return 2;
        }
    },

    plural: function(value){
      return Number(value) == 1 ? 0 : 1;
    }
  });

 /**
  * 
  */
  function resolveCulture(name){
    var culture = cultures[name];

    if (!culture)
      culture = cultures[name] = new Culture(name);

    return culture;
  }

  basis.object.extend(resolveCulture, new basis.Token(currentCulture));

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
      return;

    if (currentCulture != culture)
    {
      currentCulture = culture;

      for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
        dictionary.syncValues();

      resolveCulture.set(culture);
    }
  }


 /**
  * Returns current culture list.
  * @return {Array.<string>}
  */ 
  function getCultureList(){
    return cultureList.slice(0);
  }


 /**
  * Set new culture list. May be called only once.
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
      list = list.trim().split(' ');

    if (!list.length)
    {
      ;;;basis.dev.warn('basis.l10n.setCultureList: culture list can\'t be empty, the culture list isn\'t changed');
      return;
    }

    var cultures = {};
    var cultureRow;
    var baseCulture;

    cultureFallback = {};

    // process list
    for (var i = 0, culture, cultureName; culture = list[i]; i++)
    {
      cultureRow = culture.split('/');

      if (cultureRow.length > 2)
      {
        ;;;basis.dev.warn('basis.l10n.setCultureList: only one fallback culture can be set for certain culture, try to set `' + culture+ '`; other cultures except first one was ignored');
        cultureRow = cultureRow.slice(0, 2);
      }

      cultureName = cultureRow[0];

      if (!baseCulture)
        baseCulture = cultureName;

      cultures[cultureName] = resolveCulture(cultureName);
      cultureFallback[cultureName] = cultureRow;
    }

    // normalize fallback
    for (var cultureName in cultureFallback)
    {
      cultureFallback[cultureName] = basis.array.flatten(cultureFallback[cultureName]
        .map(function(name){
          return cultureFallback[name];
        }))
        .concat(baseCulture)
        .filter(function(item, idx, array){
          return !idx || array.lastIndexOf(item, idx - 1) == -1;
        });
    }

    // update current culture list
    cultureList = basis.object.keys(cultures);

    // if current culture not in culture list, change it for base culture
    if (currentCulture in cultures == false)
      setCulture(baseCulture);
  }


 /**
  * Add callback on culture change.
  * @param {function(culture)} fn Callback
  * @param {context=} context Context for callback
  * @param {boolean=} fire If true callback will be invoked with current
  *   culture name right after callback attachment.
  */ 
  function onCultureChange(fn, context, fire){
    resolveCulture.attach(fn, context);

    if (fire)
      fn.call(context, currentCulture);
  }

  setCultureList('en-US');
  setCulture('en-US');


  //
  // exports
  //

  module.exports = {
    ComputeToken: ComputeToken,
    Token: Token,
    token: resolveToken,
    
    Dictionary: Dictionary,
    dictionary: resolveDictionary,
    /** dev */ getDictionaries: getDictionaries,
    /** dev */ addCreateDictionaryHandler: createDictionaryNotifier.attach.bind(createDictionaryNotifier),
    /** dev */ removeCreateDictionaryHandler: createDictionaryNotifier.detach.bind(createDictionaryNotifier),

    Culture: Culture,
    culture: resolveCulture,
    getCulture: getCulture,
    setCulture: setCulture,
    getCultureList: getCultureList,
    setCultureList: setCultureList,

    onCultureChange: onCultureChange
  };
