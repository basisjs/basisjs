
  basis.require('basis.dom.event');

 /**
  * @namespace basis.router
  */

  var namespace = this.path;
  var ns = basis.namespace(String(namespace));

  var PathService = basis.Class(null, {
    location: null,
    document: null,
    history: null,
    callback: null,
    started: false,
    init: function() {
      this.location = global.location;
      basis.object.extend(this, {
        location: global.location,
        document: global.document,
        history: global.history
      })
    },
    startWatch: function(callback) {
      if (!callback) return;
      this.callback = callback;
      this.started = true;
      callback();
    },
    stopWatch: function() {
      this.started = false;
      this.callback = null;
    },
    navigate: function() {
      if (this.isStarted() && this.callback) this.callback();
    },
    getPath: function() {
      return '';
    },
    isStarted: function() {
      return this.started;
    }
  })

  var PathServiceHistoryBased = basis.Class(PathService, {
    root: '/',
    init: function(options) {
      PathService.prototype.init.apply(this, arguments);
      var options = options || {};

      if (options['root'])
        this.root = ('/' + options.root + '/').replace(/^\/+|\/+$/g, '/');
    },
    startWatch: function(callback) {
      if (this.isStarted() || !callback) return;
      basis.dom.event.addHandler(global, 'popstate', callback);
      PathService.prototype.startWatch.apply(this, arguments);
    },
    stopWatch: function(){
      if (!this.isStarted() || !this.callback) return;
      basis.dom.event.removeHandler(global, 'popstate', this.callback);
      PathService.prototype.stopWatch.apply(this, arguments);
    },
    navigate: function(path, replace){
      var url = this.root + (this.getFragment(path || ''));
      this.history[replace ? 'replaceState' : 'pushState']({}, this.document.title, url);
      PathService.prototype.navigate.apply(this, arguments);
    },
    getFragment: function(fragment) {
      if (fragment == null) {
        fragment = this.getPath();
      }
      return fragment.replace(/^[#\/]|\s+$/g, '');
    },
    getPath: function() {
      var path = decodeURI(this.location.pathname + this.getSearch());
      var root = this.root.slice(0, -1);
      if (!path.indexOf(root)) path = path.slice(root.length);
      return path.slice(1);
    },
    getSearch: function() {
      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    }
  })

  var PathServiceHashBased = basis.Class(PathService, {
    eventSupport: null,
    timer: null,
    CHECK_INTERVAL: 50,
    init: function() {
      PathService.prototype.init.apply(this, arguments);

      var docMode = this.document.documentMode;
      // documentMode logic from YUI to filter out IE8 Compat Mode which false positives
      this.eventSupport = 'onhashchange' in global && (docMode === undefined || docMode > 7);
    },
    startWatch: function(callback) {
      if (this.isStarted() || !callback) return;
      if (this.eventSupport)
        basis.dom.event.addHandler(global, 'hashchange', callback);
      else
        this.timer = setInterval(callback, this.CHECK_INTERVAL);
      PathService.prototype.startWatch.apply(this, arguments);
    },
    stopWatch: function(){
      if (!this.isStarted() || !this.callback) return;
      if (this.eventSupport)
        basis.dom.event.removeHandler(global, 'hashchange', this.callback);
      else
        clearInterval(this.timer);
      PathService.prototype.stopWatch.apply(this, arguments);
    },
    navigate: function(path, replace){
      if (replace)
        this.location.replace(this.location.pathname + '#' + path);
      else
        this.location.hash = path;
      PathService.prototype.navigate.apply(this, arguments);
    },
    getPath: function() {
      return this.location.hash.substr(1) || '';
    }
  })

  //
  // main part
  //
  var arrayFrom = basis.array.from;
  var routes = {};
  var matched = {};
  var currentPath;
  var service = new PathService;
  var pathBeforeStart = null;

  function pathToRegExp(route){
    var value = String(route || '');

    function findWord(offset){
      return value.substr(offset).match(/^\w+/);
    }

    function parse(offset, stopChar){
      var result = '';
      var res;

      for (var i = offset; i < value.length; i++)
      {
        var c = value.charAt(i);
        switch (c)
        {
          case stopChar:
            return {
              result: result,
              offset: i
            };

          case '\\':
            result += '\\' + value.charAt(++i);
            break;

          case '|':  // allow | inside braces1
            result += stopChar != ')' ? '\\|' : '|';
            break;

          case '(':  // optional: (something) -> (?:something)?
            if (res = parse(i + 1, ')'))
            {
              i = res.offset;
              result += '(?:' + res.result + ')?';
            }
            else
            {
              result += '\\(';
            }

            break;

          case ':':  // named:   :name -> ([^/]+)
            if (res = findWord(i + 1))
            {
              i += res[0].length;
              result += '([^\/]+)';
            }
            else
            {
              result += ':';
            }

            break;

          case '*':  // splat:   *name -> (.*?)
            if (res = findWord(i + 1))
            {
              i += res[0].length;
              result += '(.*?)';
            }
            else
            {
              result += '\\*';
            }

            break;

          default:
            result += basis.string.forRegExp(c);
        }
      }

      return stopChar ? null : result;
    }

    return new RegExp('^' + parse(0) + '$', 'i');
  }

  function hasHtmlHistorySupport() {
    return global.history && global.history.pushState;
  }

 /**
  * Start router
  * @param  {object} options: Start options varying service used.
  * {html5history: true, ...} turns on HTML5 history based.
  * {root: {string}, ...} sets root url for HTML5 history based
  */
  function start(){
    if (!service.isStarted())
    {
      var options = arguments && arguments.length ? arguments[0] : {};
      service = new (options['html5history'] && hasHtmlHistorySupport() ? PathServiceHistoryBased : PathServiceHashBased)(options);
      if (pathBeforeStart) {
        service.navigate.apply(service, pathBeforeStart);
        pathBeforeStart = null;
      }
      service.startWatch(checkUrl);

      /** @cut */ if (ns.debug) basis.dev.log(namespace + ' started');
    }
  }

 /**
  * Stop router
  */
  function stop(){
    if (service.isStarted())
    {
      service.stopWatch();
      /** @cut */ if (ns.debug) basis.dev.log(namespace + ' stopped');
    }
  }

 /**
  * Process current location
  */
  function checkUrl(){
    var newPath = service.getPath();

    if (newPath != currentPath)
    {
      var inserted = [];
      var deleted = [];
      /** @cut */ var log = [];

      currentPath = newPath;

      for (var path in routes)
      {
        var route = routes[path];
        var match = newPath.match(route.regexp);

        if (match)
        {
          if (!matched[path])
            inserted.push(route);
          matched[path] = match;
        }
        else
        {
          if (matched[path])
          {
            deleted.push(route);
            delete matched[path];
          }
        }
      }

      // callback off for previous matched
      for (var i = 0, route; route = deleted[i]; i++)
      {
        var callbacks = arrayFrom(route.callbacks);
        for (var j = 0, item; item = callbacks[j]; j++)
          if (item.callback.leave)
          {
            item.callback.leave.call(item.context);
            /** @cut */ log.push('\n', { type: 'leave', path: route.source, cb: item, route: route });
          }
      }

      // callback off for previous matched
      for (var i = 0, route; route = inserted[i]; i++)
      {
        var callbacks = arrayFrom(route.callbacks);
        for (var j = 0, item; item = callbacks[j]; j++)
          if (item.callback.enter)
          {
            item.callback.enter.call(item.context);
            /** @cut */ log.push('\n', { type: 'enter', path: route.source, cb: item, route: route });
          }
      }

      // callback for matched
      for (var path in matched)
      {
        var route = routes[path];
        var args = arrayFrom(matched[path], 1);
        var callbacks = arrayFrom(route.callbacks);

        for (var i = 0, item; item = callbacks[i]; i++)
          if (item.callback.match)
          {
            item.callback.match.apply(item.context, args);
            /** @cut */ log.push('\n', { type: 'match', path: route.source, cb: item, route: route, args: args });
          }
      }

      /** @cut */ if (ns.debug) basis.dev.info.apply(basis.dev, [namespace + ': hash changed to "' + newPath + '"'].concat(log.length ? log : '<no matches>'));
    }

  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context){
    var route = routes[path];
    var config;

    if (!route)
    {
      route = routes[path] = {
        source: path,
        callbacks: [],
        regexp: Object.prototype.toString.call(path) != '[object RegExp]'
          ? pathToRegExp(path)
          : path
      };

      if (typeof currentPath == 'string')
      {
        var match = currentPath.match(route.regexp);
        if (match)
          matched[path] = match;
      }
    }

    config = {
      cb_: callback,
      context: context,
      callback: typeof callback != 'function' ? callback || {} : {
        match: callback
      }
    };

    route.callbacks.push(config);

    if (path in matched)
    {
      if (config.callback.enter)
        config.callback.enter.call(context);
      if (config.callback.match)
        config.callback.match.apply(context, arrayFrom(matched[path], 1));
    }
  }

 /**
  * Remove handler for path
  */
  function remove(path, callback, context){
    var route = routes[path];

    if (route)
    {
      var idx = -1;

      for (var i = 0, cb; cb = route.callbacks[i]; i++)
        if (cb.cb_ === callback && cb.context === context)
        {
          route.callbacks.splice(i, 1);

          if (!route.callbacks.length)
          {
            delete routes[path];
            delete matched[path];
          }

          break;
        }
    }
  }

 /**
  * Navigate to specified path
  */
  function navigate() {
    if (service.isStarted())
      service.navigate.apply(service, arguments);
    else
      pathBeforeStart = arguments;
  }

 /**
  * Get current path
  */
  function getPath() {
    return service.getPath();
  }


  //
  // export names
  //

  module.exports = {
    debug: false,

    add: add,
    remove: remove,
    stop: stop,
    start: start,
    checkUrl: checkUrl,
    navigate: navigate,
    getPath: getPath
  }