
 /**
  * @namespace basis.template.theme
  */

  var namespace = this.path;

  var themes = {};
  var sourceByPath = {};
  var themeChangeHandlers = [];
  var currentThemeName = 'base';
  var baseTheme;


 /**
  * @class
  */
  var Theme = basis.Class(null, {
    className: namespace + '.Theme',
    get: getSourceByPath
  });


 /**
  * @class
  */
  var SourceWrapper = basis.Class(basis.Token, {
    className: namespace + '.SourceWrapper',

   /**
    * Template source name.
    * @type {string}
    */
    path: '',

   /**
    * Url of wrapped content, if exists.
    * @type {string}
    */
    url: '',

   /**
    * Base URI of wrapped content, if exists.
    * @type {string}
    */
    baseURI: '',

   /**
    * @constructor
    * @param {*} value
    * @param {string} path
    */
    init: function(value, path){
      this.path = path;
      basis.Token.prototype.init.call(this, '');
    },

   /**
    * @inheritDocs
    */
    get: function(){
      return this.value && this.value.bindingBridge
        ? this.value.bindingBridge.get(this.value)
        : this.value;
    },

   /**
    * @inheritDocs
    */
    set: function(){
      var content = getThemeSource(currentThemeName, this.path);

      if (this.value != content)
      {
        if (this.value && this.value.bindingBridge)
          this.value.bindingBridge.detach(this.value, SourceWrapper.prototype.apply, this);

        this.value = content;
        this.url = (content && content.url) || '';
        this.baseURI = (typeof content == 'object' || typeof content == 'function') && 'baseURI' in content
          ? content.baseURI
          : basis.path.dirname(this.url) + '/';

        if (this.value && this.value.bindingBridge)
          this.value.bindingBridge.attach(this.value, SourceWrapper.prototype.apply, this);

        this.apply();
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.url = null;
      this.baseURI = null;

      if (this.value && this.value.bindingBridge)
        this.value.bindingBridge.detach(this.value, this.apply, this);

      basis.Token.prototype.destroy.call(this);
    }
  });


  function getSourceByPath(){
    var path = basis.array(arguments).join('.');
    var source = sourceByPath[path];

    if (!source)
    {
      source = new SourceWrapper('', path);
      sourceByPath[path] = source;
    }

    return source;
  }

  function normalize(list){
    var used = {};
    var result = [];

    for (var i = 0; i < list.length; i++)
      if (!used[list[i]])
      {
        used[list[i]] = true;
        result.push(list[i]);
      }

    return result;
  }

  function extendFallback(themeName, list){
    var result = [];
    result.source = normalize(list).join('/');

    // map for used themes
    var used = {
      base: true
    };

    for (var i = 0; i < list.length; i++)
    {
      var name = list[i] || 'base';

      // skip if theme already processed
      if (name == themeName || used[name])
        continue;

      // get or create theme
      // var theme = getTheme(name);

      // mark theme as used (theme could be only once in list)
      // and add to lists
      used[name] = true;
      result.push(name);

      // add theme fallback list
      list.splice.apply(list, [i + 1, 0].concat(themes[name].fallback));
    }

    // special cases:
    // - theme itself must be the first in source list and not in fallback list
    // - base theme must be the last for both lists
    result.unshift(themeName);
    if (themeName != 'base')
      result.push('base');

    result.value = result.join('/');

    return result;
  }

  function getThemeSource(name, path){
    var sourceList = themes[name].sourcesList;

    for (var i = 0, map; map = sourceList[i]; i++)
      if (map.hasOwnProperty(path))
        return map[path];

    return '';
  }

  function themeHasEffect(themeName){
    return themes[currentThemeName].fallback.indexOf(themeName) != -1;
  }

  function syncCurrentThemePath(path){
    getSourceByPath(path).set();
  }

  function syncCurrentTheme(){
    /** @cut */ basis.dev.log('re-apply templates');

    for (var path in sourceByPath)
      syncCurrentThemePath(path);
  }

  function getTheme(name){
    if (!name)
      name = 'base';

    if (themes[name])
      return themes[name].theme;

    if (!/^([a-z0-9\_\-]+)$/.test(name))
      throw 'Bad name for theme - ' + name;

    var sources = {};
    var sourceList = [sources];
    var themeInterface = new Theme();

    themes[name] = {
      theme: themeInterface,
      sources: sources,
      sourcesList: sourceList,
      fallback: []
    };

    // closure methods

    var addSource = function(path, source){
      if (path in sources == false)
      {
        sources[path] = source;

        if (themeHasEffect(name))
          syncCurrentThemePath(path);
      }
      /** @cut */ else
      /** @cut */   basis.dev.warn('Template path `' + path + '` is already defined for theme `' + name + '` (definition ignored).');

      return getSourceByPath(path);
    };

    basis.object.extend(themeInterface, {
      name: name,
      fallback: function(value){
        if (themeInterface !== baseTheme && arguments.length > 0)
        {
          var newFallback = typeof value == 'string' ? value.split('/') : [];

          // process new fallback
          var changed = {};
          newFallback = extendFallback(name, newFallback);
          if (themes[name].fallback.source != newFallback.source)
          {
            themes[name].fallback.source = newFallback.source;
            /** @cut */ basis.dev.log('fallback changed');
            for (var themeName in themes)
            {
              var curFallback = themes[themeName].fallback;
              var newFallback = extendFallback(themeName, (curFallback.source || '').split('/'));
              if (newFallback.value != curFallback.value)
              {
                changed[themeName] = true;
                themes[themeName].fallback = newFallback;

                var sourceList = themes[themeName].sourcesList;
                sourceList.length = newFallback.length;
                for (var i = 0; i < sourceList.length; i++)
                  sourceList[i] = themes[newFallback[i]].sources;
              }
            }
          }

          // re-compure fallback for dependant themes
          for (var themeName in changed)
            if (themeHasEffect(themeName))
            {
              syncCurrentTheme();
              break;
            }
        }

        var result = themes[name].fallback.slice(1); // skip theme itself
        result.source = themes[name].fallback.source;
        return result;
      },
      define: function(what, wherewith){
        if (typeof what == 'function')
          what = what();

        if (typeof what == 'string')
        {
          if (typeof wherewith == 'object')
          {
            // define(namespace, dictionary): object
            // what -> path
            // wherewith -> dictionary

            var namespace = what;
            var dictionary = wherewith;
            var result = {};

            for (var key in dictionary)
              if (dictionary.hasOwnProperty(key))
                result[key] = addSource(namespace + '.' + key, dictionary[key]);

            return result;
          }
          else
          {
            if (arguments.length == 1)
            {
              // define(path): Template  === getTemplateByPath(path)

              return getSourceByPath(what);
            }
            else
            {
              // define(path, source): Template
              // what -> path
              // wherewith -> source

              return addSource(what, wherewith);
            }
          }
        }
        else
        {
          if (typeof what == 'object')
          {
            // define(dictionary): Theme
            var dictionary = what;

            for (var path in dictionary)
              if (dictionary.hasOwnProperty(path))
                addSource(path, dictionary[path]);

            return themeInterface;
          }
          else
          {
            /** @cut */ basis.dev.warn('Wrong first argument for basis.template.Theme#define');
          }
        }
      },
      apply: function(){
        if (name != currentThemeName)
        {
          currentThemeName = name;
          syncCurrentTheme();

          for (var i = 0, handler; handler = themeChangeHandlers[i]; i++)
            handler.fn.call(handler.context, name);

          /** @cut */ basis.dev.info('Template theme switched to `' + name + '`');
        }
        return themeInterface;
      },
      getSource: function(path, withFallback){
        return withFallback ? getThemeSource(name, path) : sources[path];
      },
      drop: function(path){
        if (sources.hasOwnProperty(path))
        {
          delete sources[path];
          if (themeHasEffect(name))
            syncCurrentThemePath(path);
        }
      }
    });

    themes[name].fallback = extendFallback(name, []);
    sourceList.push(themes.base.sources);

    return themeInterface;
  }


  function onThemeChange(fn, context, fire){
    themeChangeHandlers.push({
      fn: fn,
      context: context
    });

    if (fire)
      fn.call(context, currentThemeName);
  }

  basis.cleaner.add({
    destroy: function(){
      // clear themes
      for (var path in sourceByPath)
        sourceByPath[path].destroy();

      themes = null;
      sourceByPath = null;
    }
  });


  baseTheme = getTheme();
  module.exports = {
    SourceWrapper: SourceWrapper,
    Theme: Theme,

    theme: getTheme,
    getThemeList: function(){
      return basis.object.keys(themes);
    },
    currentTheme: function(){
      return themes[currentThemeName].theme;
    },
    setTheme: function(name){
      return getTheme(name).apply();
    },
    onThemeChange: onThemeChange,

    define: baseTheme.define,

    get: getSourceByPath,
    getPathList: function(){
      return basis.object.keys(sourceByPath);
    }
  };
