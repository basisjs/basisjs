
 /**
  * @namespace basis.template.theme
  */

  var namespace = this.path;

  var themes = {};
  var sourceByPath = {};
  var sourceReferenceByPath = {};
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
    var source;

    if (path.indexOf('@') == -1)
    {
      if (path in sourceReferenceByPath == false)
      {
        var parts = path.split('.');
        var templateName = parts.pop();
        var url = basis.resolveNSFilename(parts.join('.')).replace(/\.js$/, '.tp');

        // resolve package on demand
        if (url in packageByUrl == false)
          resolvePackage(url);

        sourceReferenceByPath[path] = templateName + '@' + url;
      }

      path = sourceReferenceByPath[path];
    }

    if (sourceByPath[path] instanceof SourceWrapper)
    {
      source = sourceByPath[path];
    }
    else
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

    var addSource = function(path, source, noSync){
      if (path in sources == false)
      {
        if (path.indexOf('@') == -1)
        {
          var oldPath = path;
          path = path.replace(/^(.+?)\.([^\.]+)$/, '$2@$1');
          sourceReferenceByPath[oldPath] = path;
        }

        sources[path] = source;

        if (!noSync && themeHasEffect(name))
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
      defineSource: function(path, source, noSync){
        return addSource(path, source, noSync);
      },
      define: function(what, wherewith, noSync){
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
                result[key] = addSource(namespace + '.' + key, dictionary[key], noSync);

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

              return addSource(what, wherewith, noSync);
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
                addSource(path, dictionary[path], noSync);

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
      drop: function(path, noSync){
        if (sources.hasOwnProperty(path))
        {
          delete sources[path];
          if (!noSync && themeHasEffect(name))
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


  //
  // template package
  //

  var packages = [];
  var packageByUrl = {};

  basis.resource.extensions['.tp'] = function(content, url){
    var content = basis.resource.extensions['.json'](content, url);
    var pkg = resolvePackage(url);
    pkg.update(content);
    return pkg;
  };

  function resolvePackage(value){
    var pkg;

    if (typeof value == 'string')
    {
      if (packageByUrl[value] instanceof Package)
        return packageByUrl[value];

      var location = value;
      var extname = basis.path.extname(location);

      if (extname != '.tp')
        location = basis.path.dirname(location) + '/' + basis.path.basename(location, extname) + '.tp';

      value = basis.resource(location);
    }

    if (basis.resource.isResource(value))
      pkg = packageByUrl[value.url];

    return pkg || new Package(value);
  }

 /**
  * @class
  */
  var Package = basis.Class(null, {
    className: namespace + '.Package',

   /**
    * Token map.
    * @type {object}
    */
    names: null,

   /**
    * Values by theme
    * @type {object}
    */
    themeSources: null,

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
    * Base URI of package (commonly resource location).
    * @type {string}
    */
    baseURI: '',

   /**
    * @constructor
    * @param {basis.Resource|object} data
    */
    init: function(data){
      this.names = {};
      this.themeSources = {};

      // add to dictionary list
      this.index = packages.push(this) - 1;

      if (basis.resource.isResource(data))
      {
        var resource = data;

        // attach to resource
        this.resource = resource;
        this.id = resource.url;
        this.baseURI = basis.path.dirname(resource.url);

        // notify dictionary created
        if (!packageByUrl[resource.url])
          packageByUrl[resource.url] = this;

        resource.fetch();
      }
      else
      {
        this.id = this.index;
        this.baseURI = basis.path.baseURI;
        this.update(data || {});
      }
    },

   /**
    * @param {object} data Object that contains new template content
    */
    update: function(data){
      var updatePaths = {};

      if (!data)
        data = {};

      // drop old content
      for (var themeName in this.themeSources)
      {
        var theme = getTheme(themeName);
        var templates = this.themeSources[themeName];

        for (var name in templates)
        {
          var path = name + '@' + this.id;

          updatePaths[path] = true;
          theme.drop(path, true);
        }
      }

      // reset old data
      this.themeSources = {};

      // add new content
      for (var themeName in data)
      {
        var theme = getTheme(themeName);
        var dataTemplates = data[themeName];
        var templates = {};

        this.themeSources[themeName] = templates;

        for (var name in dataTemplates)
          if (!/^_|_$/.test(name)) // ignore names with underscore in the begining or ending
          {
            var path = name + '@' + this.id;
            var source = dataTemplates[name];

            updatePaths[path] = true;
            templates[name] = source;

            if (typeof source == 'string')
              source = basis.resource(basis.path.resolve(this.baseURI, source));

            theme.defineSource(path, source, true);
          }
      }

      // sync names
      for (var path in updatePaths)
        syncCurrentThemePath(path);
    },

   /**
    * @param {string} theme Theme name
    * @param {string} name Template name
    * @return {...}
    */
    getThemeSource: function(theme, name){
      return this.themeSources[theme] && this.themeSources[theme][name];
    },

   /**
    * @param {string} name Token name
    * @return {...}
    */
    get: function(name){
      return getSourceByPath(name + '@' + this.id);
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.names = null;
      this.themeSources = null;

      basis.array.remove(packages, this);
    }
  });


  //
  // extend basis.Module by template method
  //

  module.constructor.extend({
    template: function(name){
      return resolvePackage(this.filename).get(name);
    }
  });


  //
  // clean up
  //

  basis.cleaner.add({
    destroy: function(){
      // clear themes
      for (var path in sourceByPath)
        sourceByPath[path].destroy();

      themes = null;
      sourceByPath = null;
    }
  });


  //
  // export
  //

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
