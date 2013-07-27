
  basis.require('basis.event');

  basis.require('basis.timer');
  setImmediate(function(){
    basis.require('basis.template.html');
  });


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
  var tokenEnums = {};
  var TEMPLATE_HANDLER_ID = 1;

  function processMarkup(value){
    value = String(value)
      .replace(/</g, '&lt;')
      .replace(/\*(.*?)\*/g, '<b>$1</b>');

    return '<span class="basis-markup">' + value + '</span>';
  }


 /**
  * @class
  */ 
  var ComputeToken = Class(basis.Token, {
    className: namespace + '.ComputeToken',

    value: '',
    values: null,
    valueGetter: function(object){
    },

    token: null,
    tokenHandler: function(value){
      this.values = typeof value == 'object' || Array.isArray(value)
        ? ownKeys(value)
        : null;

      this.evaluate();
    },
    valueToken: null,

    object: null,
    objectHandler: null,

   /**
    * @constructor
    */ 
    init: function(token, object, objectHandler, valueGetter){
      basis.Token.prototype.init.call(this);

      this.valueGetter = valueGetter;
      this.objectHandler = objectHandler;
      this.setToken(token);
      this.setObject(object);
    },

    setToken: function(token){
      if (this.token !== token)
      {
        if (this.token)
          this.token.detach(this.tokenHandler, this)

        this.token = token;
        this.values = null;

        if (token)
        {
          token.attach(this.tokenHandler, this);
          this.tokenHandler(token.get());
        }
      }
    },
    setObject: function(object){
      if (this.object !== object)
      {
        if (this.object)
          this.object.removeHandler(this.objectHandler, this);

        this.object = object;

        if (object)
        {
          object.addHandler(this.objectHandler, this);
          this.evaluate();
        }
      }
    },

    evaluate: function(){
      var token = null;

      if (this.values && this.object)
        token = this.token.dictionary.token(this.token.name + '.' + this.valueGetter(this.object));

      if (this.valueToken !== token)
      {
        if (this.valueToken)
          this.valueToken.detach(this.set, this);

        this.valueToken = token;

        if (token)
          token.attach(this.set, this);
      }

      this.set(this.valueToken ? this.valueToken.value : '[l10n:uncomputable value]');
    },

    toString: function(){
      return this.value;
    },

    get: function(){
      return this.value;
    },
    set: function(value){
      if (value !== this.value)
      {
        this.value = value;
        this.apply();
      }
    },

    destroy: function(){
      this.setObject();
      this.setToken();
      this.evaluate();      
      this.value = null;
      this.values = null;
      
      basis.Token.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */ 
  var Token = Class(basis.Token, {
    className: namespace + '.Token',

    value: '',

    type: 'default',

    bindingBridge: {
      attach: function(host, fn, context){
        return host.attach(fn, context);
      },
      detach: function(host, fn, context){
        return host.detach(fn, context);
      },
      get: function(host, fn, context){
        if (host.template && fn && context)
        {
          var cursor = host;

          while (cursor = cursor.handler)
            if (cursor.fn === fn && cursor.context === context && cursor.id)
              return host.tmpl[cursor.id].element;
        }

        return host.get();
      }
    },

   /**
    * @type {number}
    */ 
    index: NaN,

   /**
    * @constructor
    */ 
    init: function(dictionary, tokenName, type){
      basis.Token.prototype.init.call(this, '');

      this.index = tokenIndex.push(this) - 1;
      this.name = tokenName;
      this.dictionary = dictionary;

      if (type)
        this.setType(type);
    },

    toString: function(){
      return this.value;
    },

    set: function(value){
      if (value !== this.value)
      {
        this.value = value;

        if (this.template)
          this.template.setSource(processMarkup(value));

        this.apply();
      }
    },

    setType: function(type){
      if (this.type != type)
      {
        if (this.template)
        {
          this.template.destroy();
          this.template = null;
          this.tmpl = null;
        }

        if (type == 'markup')
        {
          this.template = new basis.template.html.Template(processMarkup(this.value));
          this.tmpl = {};
        }

        this.type = type;
        this.apply();
      }
    },

    attachTemplate: function(handler){
      var template = this.template;
      var tmpl = this.tmpl;
      var object = handler.context.object;
      var id = handler.id;
      var self = this;

      tmpl[id] = template.createInstance(object, null, function tmplSync(){
        if (tmpl[id])
        {
          tmpl[id].element.toString = null;
          template.clearInstance(tmpl[id]);
        }

        tmpl[id] = template.createInstance(object, null, tmplSync);
        tmpl[id].element.toString = function(){
          return self.value;
        }
      });

      tmpl[id].element.toString = function(){
        return self.value;
      };

      return tmpl[id];
    },

    detachTemplate: function(handler){
      var template = this.template;
      var id = handler.id;

      if (template && id in this.tmpl)
      {
        this.tmpl[id].element.toString = null;
        template.clearInstance(this.tmpl[id]);
        delete this.tmpl[id];
      }
    },

    attach: function(fn, context){
      basis.Token.prototype.attach.call(this, fn, context);

      if (context && context.object && context.object instanceof Emitter)
      {
        this.handler.id = TEMPLATE_HANDLER_ID++;

        if (this.template)
          this.attachTemplate(this.handler);
      }
    },

    detach: function(fn, context){
      var cursor = this;
      var prev;

      while (prev = cursor, cursor = cursor.handler)
        if (cursor.fn === fn && cursor.context === context)
        {
          prev.handler = cursor.handler;

          if (this.template && cursor.id)
            this.detachTemplate(cursor);

          return true;
        }
    },

    apply: function(){
      var value = this.get();
      var cursor = this;

      while (cursor = cursor.handler)
      {
        if (this.template && cursor.id)
        {
          if (cursor.id in this.tmpl == false)
            this.attachTemplate(cursor);

          cursor.fn.call(cursor.context, this.tmpl[cursor.id].element);
        }
        else
          cursor.fn.call(cursor.context, value);
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

      var enumId = events.concat(getter.basisGetterId_).join('_');

      if (tokenEnums[enumId])
        return tokenEnums[enumId];

      var token = this;
      var computeTokenMap = {};
      var updateValue = function(){
        this.evaluate();
      };
      var handler = {
        destroy: function(object){
          delete computeTokenMap[object.basisObjectId];
          this.destroy();
        }
      };

      for (var i = 0, eventName; eventName = events[i]; i++)
        if (eventName != 'destroy')
          handler[eventName] = updateValue;

      return tokenEnums[enumId] = function(object){
        if (object instanceof Emitter == false)
          throw 'basis.l10n.Token#compute: object must be an instanceof Emitter';

        var objectId = object.basisObjectId;
        var computeToken = computeTokenMap[objectId];

        if (!computeToken)
          computeToken = computeTokenMap[objectId] = new ComputeToken(token, object, handler, getter);

        return computeToken;
      }
    },

   /**
    * @destructor
    */ 
    destroy: function(){
      this.value = null;
      this.tmpl = null;

      if (this.template)
      {
        this.template.destroy();
        this.template = null;
      }

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
    path = path ? path + '.' : '';
    
    for (var tokenName in tokens)
      if (hasOwnProperty.call(tokens, tokenName))
        dictionary.setCultureValue(culture, path + tokenName, tokens[tokenName]);
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
      this.cultureValues = {};

      // attach to resource
      this.resource = resource;
      this.update(resource());
      resource.attach(this.update, this);

      // add to dictionary list
      this.index = dictionaries.push(this) - 1;

      // notify dictionary created
      createDictionaryNotifier.notify(resource.url);
    },

   /**
    * @param {object} data Object that contains new tokens data
    */ 
    update: function(data){
      for (var culture in data)
        if (!/^_|_$/.test(culture)) // ignore names with underscore in the begining or ending (reserved for meta)
          walkTokens(this, culture, data[culture]);
    },

   /**
    * @param {string} culture Culture name
    */ 
    setCulture: function(culture){
      for (var tokenName in this.tokens)
        this.tokens[tokenName].set(cultureGetTokenValue[culture]
          ? cultureGetTokenValue[culture].call(this, tokenName)
          : this.getCultureValue(culture, tokenName)
        );
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
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    * @param {string} tokenValue New token value
    */ 
    setCultureValue: function(culture, tokenName, tokenValue){
      var cultureValues = this.cultureValues[culture];

      if (!cultureValues)
        cultureValues = this.cultureValues[culture] = {};

      cultureValues[tokenName] = tokenValue;

      if (this.tokens[tokenName] && culture == currentCulture)
        this.tokens[tokenName].set(cultureGetTokenValue[culture]
          ? cultureGetTokenValue[culture].call(this, tokenName)
          : this.getCultureValue(culture, tokenName)
        );

      if (tokenValue && (typeof tokenValue == 'object' || Array.isArray(tokenValue)))
        walkTokens(this, culture, tokenValue, tokenName);
    },

   /**
    * @param {string} tokenName Token name
    * @return {basis.l10n.Token}
    */
    token: function(tokenName){
      var token = this.tokens[tokenName];

      if (!token)
      {
        token = this.tokens[tokenName] = new Token(this, tokenName);
        token.set(cultureGetTokenValue[currentCulture]
          ? cultureGetTokenValue[currentCulture].call(this, tokenName)
          : this.getCultureValue(currentCulture, tokenName)
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
      dictionaries.remove(this);
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
    return dictionaries.slice(0);
  }

 /**
  * 
  */
  var createDictionaryNotifier = basis.object.extend(new basis.Token(), {
    notify: function(value){
      this.value = value;
      this.apply();
    },
    get: function(){
      return this.value;
    }
  });


  //
  // Culture
  //

  var currentCulture = 'en-US';
  var cultureList = [];
  var cultureGetTokenValue = {};
  var cultureFallback = {}; 
  var cultureChangeHandlers = [];
  var cultures = {};


 /**
  * @class
  */
  var Culture = basis.Class(null, {
    className: namespace + '.Culture',

    name: '',
    init: function(name){
      this.name = name;
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

      for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
        dictionary.setCulture(currentCulture);

      for (var i = 0, handler; handler = cultureChangeHandlers[i]; i++)
        handler.fn.call(handler.context, culture);
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
