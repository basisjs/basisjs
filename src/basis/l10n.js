
 /**
  * @namespace basis.l10n
  */

  var namespace = 'basis.l10n';


  //
  // import names
  //

  var extend = basis.object.extend;
  var complete = basis.object.complete;
  var Class = basis.Class;
  var Emitter = require('basis.event').Emitter;
  var processJSON = basis.resource.extensions['.json'];
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var basisTokenPrototypeSet = basis.Token.prototype.set;

  // set .l10n files handler
  basis.resource.extensions['.l10n'] = processDictionaryContent;

  var patches = (function(){
    var config = basis.config.l10n || {};
    var patches = config && config.patch;
    var result = {};
    var baseURI;

    config.patch = {};

    if (patches)
    {
      if (typeof patches == 'string')
      {
        try {
          baseURI = basis.path.dirname(basis.resource.resolveURI(patches));
          patches = basis.resource(patches).fetch();
        } catch(e) {
          /** @cut */ basis.dev.error('basis.l10n: dictionary patch file load failed:', patches);
        }
      }

      for (var path in patches)
      {
        var dictUrl = basis.resource.resolveURI(path, baseURI);
        var patchUrl = basis.resource.resolveURI(patches[path], baseURI);

        result[dictUrl] = createDictionaryMerge(dictUrl, patchUrl);

        /** @cut */ config.patch[dictUrl] = patchUrl;
      }
    }

    return result;
  })();

  function getJSON(url){
    return processJSON(resource(url).get(true), url) || {};
  }

  function createDictionaryMerge(dictUrl, patchUrl){
    function sync(){
      dictionaryByUrl[dictUrl].update(
        mergeDictionaries(
          getJSON(dictUrl),
          patchUrl
        )
      );
    }

    return {
      url: patchUrl,
      activate: function(){
        resource(patchUrl).attach(sync);
      },
      deactivate: function(){
        resource(patchUrl).detach(sync);
      }
    };
  }

  function mergeDictionaries(dest, patchSource){
    function isObject(value){
      return value && Object.prototype.toString.call(value) == '[object Object]';
    }

    function deepMerge(dest, patch, path, sourceMap){
      if (path)
        path += '.';

      for (var key in patch)
        if (!isObject(patch[key]))
        {
          sourceMap[path + key] = patchSource;
          dest[key] = patch[key];
        }
        else
        {
          dest[key] = deepMerge(
            isObject(dest[key]) ? dest[key] : {},
            patch[key],
            path + key,
            sourceMap
          );
        }

      return dest;
    }

    var patch = getJSON(patchSource);
    var sources;
    for (var key in patch)
    {
      if (key == '_meta')
      {
        // merge _meta
        continue;
      }

      // init _meta
      if (!hasOwnProperty.call(dest, key))
      {
        dest[key] = {
          _meta: { source: {} }
        };
      }
      else
      {
        if (!dest[key]._meta)
          dest[key]._meta = {};
      }

      // always init sources
      sources = {};
      dest[key]._meta.source = {};

      // merge
      deepMerge(dest[key], patch[key], '', sources);

      // always rewrite source in meta
      dest[key]._meta.source = sources;
    }

    return dest;
  }

  function processDictionaryContent(content, url){
    content = processJSON(content, url);

    if (patches[url])
      mergeDictionaries(content, patches[url].url);

    // create new dictionary with no fetch
    return internalResolveDictionary(url, true).update(content);
  }


  //
  // Token
  //

  var tokenIndex = [];
  var tokenComputeFn = {};
  var NULL_DESCRIPTOR = {
    placeholder: false,
    processName: basis.fn.$self,
    value: undefined,
    types: {}
  };
  var TOKEN_TYPES = {
    'default': true,
    'plural': true,
    'markup': true,
    'plural-markup': true,
    'enum-markup': true
  };
  var PLURAL_TYPES = {
    'plural': true,
    'plural-markup': true
  };
  var NESTED_TYPE = {
    'default': 'default',
    'plural': 'default',
    'markup': 'default',
    'plural-markup': 'markup',
    'enum-markup': 'markup'
  };
  var pluralName = function(value){
    return this.culture.plural(value);
  };


 /**
  * @class
  */
  var ComputeToken = Class(basis.Token, {
    className: namespace + '.ComputeToken',

   /**
    * @type {basis.l10n.Token}
    */
    token: null,

   /**
    * @constructor
    */
    init: function(value){
      this.token.computeTokens[this.basisObjectId] = this;

      basis.Token.prototype.init.call(this, value);
    },

    toString: function(){
      return this.get();
    },

    get: function(){
      var value = this.token.dictionary.getValue(this.getName());

      if (this.token.descriptor.placeholder)
        value = String(value).replace(/\{#\}/g, this.value);

      return value;
    },

    getName: function(){
      return this.token.name + '.' + this.token.descriptor.processName(this.value);
    },

    getType: function(){
      return this.token.descriptor.types[this.getName()] || 'default';
    },

    getDictionary: function(){
      return this.token.getDictionary();
    },

    destroy: function(){
      delete this.token.computeTokens[this.basisObjectId];

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
    * One of 'default', 'plural', 'markup', 'plural-markup', 'enum-markup'
    * @type {string}
    */
    type: 'default',

   /**
    * @type {object}
    */
    computeTokens: null,

   /**
    * @type {function}
    */
    computeTokenClass: null,

   /**
    * @constructor
    */
    init: function(dictionary, tokenName, descriptor){
      basis.Token.prototype.init.call(this, descriptor.value);

      this.index = tokenIndex.push(this) - 1;
      this.name = tokenName;
      this.dictionary = dictionary;
      this.descriptor = descriptor;
      this.computeTokens = {};
    },

    toString: function(){
      return this.get();
    },

    apply: function(){
      for (var key in this.computeTokens)
        this.computeTokens[key].apply();

      basis.Token.prototype.apply.call(this);
    },

    set: function(){
      /** @cut */ basis.dev.warn('basis.l10n: Value for l10n token can\'t be set directly, but through dictionary update only');
    },

    getName: function(){
      return this.name;
    },

    getType: function(){
      return this.descriptor.types[this.name] || 'default';
    },

    setType: function(){
      // basis.js 1.4
      /** @cut */ basis.dev.warn('basis.l10n: Token#setType() is deprecated');
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
      var enumId = events.concat(tokenId, getter[basis.getter.ID]).join('_');

      if (tokenComputeFn[enumId])
        return tokenComputeFn[enumId];

      var token = this;
      var objectTokenMap = {};
      var updateValue = function(object){
        basisTokenPrototypeSet.call(this, getter(object));
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
          computeToken = objectTokenMap[objectId] = token.computeToken(getter(object));
          object.addHandler(handler, computeToken);
        }

        return computeToken;
      };
    },

    computeToken: function(value){
      var ComputeTokenClass = this.computeTokenClass;

      if (!ComputeTokenClass)
        ComputeTokenClass = this.computeTokenClass = ComputeToken.subclass({
          token: this
        });

      return new ComputeTokenClass(value);
    },

    token: function(name){
      // FIXME looks like new tokens are always create here
      if (this.getType() in PLURAL_TYPES)
        return this.computeToken(name);

      if (this.dictionary)
        return this.dictionary.token(this.name + '.' + name);
    },

    getDictionary: function(){
      return this.dictionary;
    },

   /**
    * @destructor
    */
    destroy: function(){
      for (var key in this.computeTokens)
        this.computeTokens[key].destroy();

      this.descriptor = null;
      this.computeTokenClass = null;
      this.computeTokens = null;
      this.value = null;
      this.dictionary = null;

      // remove from index
      tokenIndex[this.index] = null;

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
        return resolveDictionary(basis.path.resolve(parts[2])).token(parts[1]);

      /** @cut */ basis.dev.warn('basis.l10n.token accepts token references in format `token.path@path/to/dict.l10n` only');
    }
  }

 /**
  * Check value is a l10n token.
  * @param {*} value Value to be check.
  * @return {boolean}
  */
  function isToken(value){
    return value ? value instanceof Token || value instanceof ComputeToken : false;
  }

 /**
  * Check value is a l10n plural token.
  * @param {*} value Value to be check.
  * @return {boolean}
  */
  function isPluralToken(value){
    return isToken(value) && value.getType() in PLURAL_TYPES;
  }

 /**
  * Check value is a l10n token that may has a placeholder.
  * @param {*} value Value to be check.
  * @return {boolean}
  */
  function isTokenHasPlaceholder(value){
    return isToken(value) && value.descriptor.placeholder;
  }

/**
  * Check value is a l10n markup token.
  * @param {*} value Value to be check.
  * @return {boolean}
  */
  function isMarkupToken(value){
    return isToken(value) && value.getType() == 'markup';
  }



  //
  // Dictionary
  //

  var dictionaries = [];
  var dictionaryByUrl = {};

  // Object that notify about dictionary is created
  var createDictionaryNotifier = new basis.Token();


  function walkTokens(tokens, parentName, context){
    var path = parentName ? parentName + '.' : '';
    var parentType = context.types[parentName] || 'default';

    for (var name in tokens)
    {
      // ignore meta on first level
      if (parentName == '' && name == '_meta')
        continue;

      if (name.indexOf('.') != -1)
      {
        /** @cut */ basis.dev.warn(context.name + ': wrong token name `' + name + '`, token ignored.');
        continue;
      }

      if (hasOwnProperty.call(tokens, name))
      {
        var tokenName = path + name;
        var tokenType = context.types[tokenName] || NESTED_TYPE[parentType] || 'default';
        var tokenValue = tokens[name];
        var isPlural = tokenType in PLURAL_TYPES || parentType in PLURAL_TYPES;

        context.values[tokenName] = {
          placeholder: isPlural,
          processName: isPlural ? pluralName : basis.fn.$self,
          source: context.source[tokenName] || context.dictionary.id,
          culture: context.culture,
          name: tokenName,
          types: context.types,
          value: tokenValue
        };

        if (tokenName in context.types == false)
          context.types[tokenName] = tokenType;

        if (tokenValue && (typeof tokenValue == 'object' || Array.isArray(tokenValue)))
          walkTokens(tokenValue, tokenName, context);
      }
    }

    return context.values;
  }

  function fetchTypes(data){
    var dirtyTypes = (data._meta && data._meta.type) || {};
    var types = {};

    // filter wrong types
    for (var path in dirtyTypes)
      if (dirtyTypes[path] in TOKEN_TYPES)
        types[path] = dirtyTypes[path];

    return types;
  }

  function fetchSource(data){
    return (data._meta && data._meta.source) || {};
  }


 /**
  * @class
  */
  var Dictionary = Class(null, {
    className: namespace + '.Dictionary',

   /**
    * Token descriptors by cultures
    * @type {object}
    */
    cultureValues: null,

   /**
    * Inited token map.
    * @type {object}
    */
    tokens: null,

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
    * Unique reference to dictinary location
    * @type {string}
    */
    id: null,

   /**
    * @constructor
    * @param {basis.Resource} content Dictionary content (tokens source)
    */
    init: function(content, noResourceFetch){
      this.tokens = {};
      this.cultureValues = {};

      // add to dictionary list
      this.index = dictionaries.push(this) - 1;

      if (basis.resource.isResource(content))
      {
        var resource = content;
        var resourceUrl = resource.url;

        this.id = resourceUrl;
        this.resource = resource;

        // notify dictionary created
        if (!dictionaryByUrl[resourceUrl])
        {
          dictionaryByUrl[resourceUrl] = this;
          createDictionaryNotifier.set(resourceUrl);

          if (patches[resourceUrl])
            patches[resourceUrl].activate();
        }

        // fetch resource content and attach listener on content update
        if (!noResourceFetch)
          resource.fetch();
      }
      else
      {
        this.id = 'dictionary' + this.index;
        this.update(content || {});
      }
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
      var types = fetchTypes(data);
      for (var culture in data)
        if (!/^_|_$/.test(culture)) // ignore names with underscore in the begining or ending (reserved for meta)
          this.cultureValues[culture] = walkTokens(data[culture], '', {
            /** @cut */ name: this.resource ? this.resource.url : '[anonymous dictionary]',
            dictionary: this,
            culture: resolveCulture(culture),
            source: fetchSource(data[culture]),
            types: complete(fetchTypes(data[culture]), types), // dictionary types + culture types
            values: {}
          });

      // update values
      this.syncValues();

      return this;
    },

   /**
    * Sync token values according to current culture and it's fallback.
    */
    syncValues: function(){
      for (var tokenName in this.tokens)
      {
        var token = this.tokens[tokenName];
        var descriptor = this.getDescriptor(tokenName) || NULL_DESCRIPTOR;
        var savedType = token.getType();

        token.descriptor = descriptor;

        if (token.value !== descriptor.value)
        {
          // on value change apply will be ivoked and new type applied
          basisTokenPrototypeSet.call(token, descriptor.value);
        }
        else
        {
          // apply changes if type has been changed
          if (token.getType() != savedType)
            token.apply();
        }
      }
    },

   /**
    * @param {string} culture
    * @param {string} tokenName
    * @return {Object|undefined}
    */
    getCultureDescriptor: function(culture, tokenName){
      return this.cultureValues[culture] && this.cultureValues[culture][tokenName];
    },

   /**
    * @param {string} tokenName
    * @return {Object|undefined}
    */
    getDescriptor: function(tokenName){
      var fallback = cultureFallback[currentCulture] || [];

      for (var i = 0, cultureName; cultureName = fallback[i]; i++)
      {
        var descriptor = this.getCultureDescriptor(cultureName, tokenName);

        if (descriptor)
          return descriptor;
      }
    },

   /**
    * @param {string} culture Culture name
    * @param {string} tokenName Token name
    * @return {*}
    */
    getCultureValue: function(culture, tokenName){
      var descriptor = this.getCultureDescriptor(culture, tokenName);

      if (descriptor)
        return descriptor.value;
    },

   /**
    * Get current value for tokenName according to current culture and it's fallback.
    * @param {string} tokenName
    */
    getValue: function(tokenName){
      var descriptor = this.getDescriptor(tokenName);

      if (descriptor)
        return descriptor.value;
    },

   /**
    * Return token value source url.
    * @param {string} tokenName
    */
    getValueSource: function(tokenName){
      var descriptor = this.getDescriptor(tokenName);

      if (descriptor)
        return descriptor.source;

      return this.id;
    },

   /**
    * @param {string} tokenName Token name
    * @return {basis.l10n.Token}
    */
    token: function(tokenName){
      var token = this.tokens[tokenName];

      if (!token)
      {
        var descriptor = this.getDescriptor(tokenName) || NULL_DESCRIPTOR;

        token = this.tokens[tokenName] = new Token(
          this,
          tokenName,
          descriptor
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

      if (this.resource)
      {
        var resourceUrl = this.resource.url;

        if (patches[resourceUrl])
          patches[resourceUrl].deactivate();

        delete dictionaryByUrl[resourceUrl];
        this.resource = null;
      }
    }
  });


 /**
  * Currently for internal use only, with additional argument
  */
  function internalResolveDictionary(source, noFetch) {
    var dictionary;

    if (typeof source == 'string')
    {
      var location = source;
      var extname = basis.path.extname(location);

      if (extname != '.l10n')
        location = location.replace(new RegExp(extname + '([#?]|$)'), '.l10n$1');

      source = basis.resource(location);
    }

    if (basis.resource.isResource(source))
      dictionary = dictionaryByUrl[source.url];

    return dictionary || new Dictionary(source, noFetch);
  }


 /**
  * @param {basis.Resource|string} source
  * @return {basis.l10n.Dictionary}
  */
  function resolveDictionary(source){
    return internalResolveDictionary(source);
  }


 /**
  * Returns list of all dictionaries. Using in development mode.
  * @return {Array.<basis.l10n.Dictionary>}
  */
  function getDictionaries(){
    return dictionaries.slice(0);
  }


  //
  // Culture
  //

  var cultureList = [];
  var currentCulture = null;
  var cultures = {};
  var cultureFallback = {};

  // plural forms
  // source: http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html?id=l10n/pluralforms
  var pluralFormsMap = {};
  var pluralForms = [
    /*  0 */ [1, function(){
      return 0;
    }],
    /*  1 */ [2, function(n){
      return n == 1 || n % 10 == 1 ? 0 : 1;
    }],
    /*  2 */ [2, function(n){
      return n == 0 ? 0 : 1;
    }],
    /*  3 */ [2, function(n){
      return n == 1 ? 0 : 1;
    }],
    /*  4 */ [2, function(n){
      return n == 0 || n == 1 ? 0 : 1;
    }],
    /*  5 */ [2, function(n){
      return n % 10 != 1 || n % 100 == 11 ? 1 : 0;
    }],
    /*  6 */ [3, function(n){
      return n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    }],
    /*  7 */ [3, function(n){
      return n % 10 == 1 && n % 100 != 11 ? 0 : n != 0 ? 1 : 2;
    }],
    /*  8 */ [3, function(n){
      return n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    }],
    /*  9 */ [3, function(n){
      return n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    }],
    /* 10 */ [3, function(n){
      return n == 0 ? 0 : n == 1 ? 1 : 2;
    }],
    /* 11 */ [3, function(n){
      return n == 1 ? 0 : n == 0 || (n % 100 > 0 && n % 100 < 20) ? 1 : 2;
    }],
    /* 12 */ [3, function(n){
      return n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    }],
    /* 13 */ [3, function(n){
      return n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
    }],
    /* 14 */ [4, function(n){
      return n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3;
    }],
    /* 15 */ [4, function(n){
      return n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3;
    }],
    /* 16 */ [4, function(n){
      return n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0;
    }],
    /* 17 */ [4, function(n){
      return n == 1 ? 0 : n == 0 || (n % 100 > 1 && n % 100 < 11) ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3;
    }],
    /* 18 */ [4, function(n){
      return n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3;
    }],
    /* 19 */ [5, function(n){
      return n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4;
    }],
    /* 20 */ [6, function(n){
      return n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
    }]
  ];

  // populate pluralFormsMap
  [
    /*  0 */ 'ay bo cgg dz fa id ja jbo ka kk km ko ky lo ms my sah su th tt ug vi wo zh',
    /*  1 */ 'mk',
    /*  2 */ 'jv',
    /*  3 */ 'af an ast az bg bn brx ca da de doi el en eo es es-AR et eu ff fi fo fur fy gl gu ha he hi hne hu hy ia it kn ku lb mai ml mn mni mr nah nap nb ne nl nn no nso or pa pap pms ps pt rm rw sat sco sd se si so son sq sv sw ta te tk ur yo',
    /*  4 */ 'ach ak am arn br fil fr gun ln mfe mg mi oc pt-BR tg ti tr uz wa zh',
    /*  5 */ 'is',
    /*  6 */ 'csb',
    /*  7 */ 'lv',
    /*  8 */ 'lt',
    /*  9 */ 'be bs hr ru sr uk',
    /* 10 */ 'mnk',
    /* 11 */ 'ro',
    /* 12 */ 'pl',
    /* 13 */ 'cs sk',
    /* 14 */ 'cy',
    /* 15 */ 'kw',
    /* 16 */ 'sl',
    /* 17 */ 'mt',
    /* 18 */ 'gd',
    /* 19 */ 'ga',
    /* 20 */ 'ar'
  ].forEach(function(langs, idx){
    langs.split(' ').forEach(function(lang){
      pluralFormsMap[lang] = this;
    }, pluralForms[idx]);
  });


 /**
  * @class
  */
  var Culture = basis.Class(null, {
    className: namespace + '.Culture',

    name: '',
    pluralForm: null,

    init: function(name, pluralForm){
      this.name = name;

      if (!cultures[name])
        cultures[name] = this;

      this.pluralForm =
        pluralForm ||
        pluralFormsMap[name] ||
        pluralFormsMap[name.split('-')[0]] ||
        pluralForms[0];
    },

    plural: function(value){
      return Number(this.pluralForm[1](Math.abs(parseInt(value, 10))));
    }
  });


 /**
  * Returns culture instance by name. Creates new one if not exists yet.
  * @param {string} name Culture name
  * @param {object} pluralForm
  * @return {basis.l10n.Culture}
  */
  function resolveCulture(name, pluralForm){
    if (name && !cultures[name])
      cultures[name] = new Culture(name, pluralForm);

    return cultures[name || currentCulture];
  }

  extend(resolveCulture, new basis.Token());
  resolveCulture.set = setCulture;


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
      if (cultureList.indexOf(culture) == -1)
      {
        /** @cut */ basis.dev.warn('basis.l10n.setCulture: culture `' + culture + '` not in the list, the culture doesn\'t changed');
        return;
      }

      currentCulture = culture;

      for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
        dictionary.syncValues();

      basisTokenPrototypeSet.call(resolveCulture, culture);
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
      /** @cut */ basis.dev.warn('basis.l10n.setCultureList: culture list can\'t be empty, the culture list isn\'t changed');
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
        /** @cut */ basis.dev.warn('basis.l10n.setCultureList: only one fallback culture can be set for certain culture, try to set `' + culture + '`; other cultures except first one was ignored');
        cultureRow = [cultureRow[0], cultureRow[1]];
      }

      cultureName = cultureRow[0];

      if (!baseCulture)
        baseCulture = cultureName;

      cultures[cultureName] = resolveCulture(cultureName);
      cultureFallback[cultureName] = cultureRow;
    }

    // normalize fallback
    for (var cultureName in cultureFallback)
      cultureFallback[cultureName] = basis.array.flatten(
        cultureFallback[cultureName]
          .map(function(name){
            return cultureFallback[name];
          }))
          .concat(baseCulture)
          .filter(function(item, idx, array){
            return !idx || array.lastIndexOf(item, idx - 1) == -1;
          }
      );

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


  //
  // set default culture list and current culture
  //

  setCultureList('en-US');
  setCulture('en-US');


  //
  // exports
  //

  module.exports = {
    ComputeToken: ComputeToken,
    Token: Token,
    token: resolveToken,
    isToken: isToken,
    isPluralToken: isPluralToken,
    isMarkupToken: isMarkupToken,
    isTokenHasPlaceholder: isTokenHasPlaceholder,

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

    pluralForms: pluralForms,
    onCultureChange: onCultureChange
  };

  // show warning on set `enableMarkup` as deprecated
  // basis.js 1.4
  /** @cut */ (function(){
  /** @cut */   var value = false;
  /** @cut */   try { // use try to avoid IE8 problems and unsupported browsers
  /** @cut */     Object.defineProperty(module.exports, 'enableMarkup', {
  /** @cut */       get: function(){
  /** @cut */         return value;
  /** @cut */       },
  /** @cut */       set: function(newValue){
  /** @cut */         basis.dev.warn('basis.l10n: enableMarkup option is deprecated, just remove it from your source code as markup l10n tokens enabled by default now');
  /** @cut */         value = newValue;
  /** @cut */       }
  /** @cut */     });
  /** @cut */   } catch(e){ }
  /** @cut */ })();
