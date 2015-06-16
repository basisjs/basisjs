
 /**
  * @namespace basis.router
  */

  var namespace = this.path;


  //
  // main part
  //

  var location = global.location;
  var document = global.document;
  var eventUtils = require('basis.dom.event');

  // documentMode logic from YUI to filter out IE8 Compat Mode which false positives
  var docMode = document.documentMode;
  var eventSupport = 'onhashchange' in global && (docMode === undefined || docMode > 7);

  var CHECK_INTERVAL = 50;

  var arrayFrom = basis.array.from;
  var routes = {};
  var matched = {};
  var started = false;
  var currentPath;
  var timer;


 /**
  * @class
  */
  var Route = basis.Token.subclass({
    className: namespace + '.Route',

    matched: null,
    params_: null,
    names_: null,

    init: function(names){
      basis.Token.prototype.init.call(this, null);

      this.matched = this.as(Boolean);
      this.names_ = Array.isArray(names) ? names : [];
      this.params_ = {};
    },
    param: function(nameOrIdx){
      var idx = typeof nameOrIdx == 'number' ? nameOrIdx : this.names_.indexOf(nameOrIdx);

      if (idx in this.params_ == false)
        this.params_[idx] = this.as(function(value){
          return value && value[idx];
        });

      return this.params_[idx];
    },
    set: function(value){
      if (value)
      {
        // make a copy of value, it also converts value to object (as value is array of matches)
        value = basis.object.slice(value);

        // extend object with named values
        for (var key in value)
          if (key in this.names_)
            value[this.names_[key]] = value[key];
      }

      basis.Token.prototype.set.call(this, value);
    }
  });


 /**
  * Convert string to regexp
  */
  function pathToRegExp(route){
    var value = String(route || '');
    var params = [];

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

          case '|':  // allow | inside braces
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
              params.push(res[0]);
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
              params.push(res[0]);
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

    var regexp = new RegExp('^' + parse(0) + '$', 'i');
    regexp.params = params;
    return regexp;
  }

  function startWatch(){
    if (eventSupport)
      eventUtils.addHandler(global, 'hashchange', checkUrl);
    else
      timer = setInterval(checkUrl, CHECK_INTERVAL);
  }
  function stopWatch(){
    if (eventSupport)
      eventUtils.removeHandler(global, 'hashchange', checkUrl);
    else
      clearInterval(timer);
  }


 /**
  * Start router
  */
  function start(){
    if (!started)
    {
      startWatch();
      started = true;

      /** @cut */ if (module.exports.debug)
      /** @cut */   basis.dev.log(namespace + ' started');

      checkUrl();
    }
  }

 /**
  * Stop router
  */
  function stop(){
    if (started)
    {
      stopWatch();
      started = false;

      /** @cut */ if (module.exports.debug)
      /** @cut */   basis.dev.log(namespace + ' stopped');
    }
  }

 /**
  * Process current location
  */
  function checkUrl(){
    var newPath = location.hash.substr(1) || '';

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

          match = arrayFrom(match, 1);
          matched[path] = match;
        }
        else
        {
          if (matched[path])
          {
            deleted.push(route);
            delete matched[path];
            route.token.set(null);
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
            /** @cut */ log.push('\n', { type: 'leave', path: route.id, cb: item, route: route });
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
            /** @cut */ log.push('\n', { type: 'enter', path: route.id, cb: item, route: route });
          }
      }

      // callback for matched
      for (var path in matched)
      {
        var route = routes[path];
        var args = matched[path];
        var callbacks = arrayFrom(route.callbacks);

        for (var i = 0, item; item = callbacks[i]; i++)
          if (item.callback.match)
          {
            item.callback.match.apply(item.context, args);
            /** @cut */ log.push('\n', { type: 'match', path: route.id, cb: item, route: route, args: args });
          }

        route.token.set(args);
      }

      /** @cut */ if (module.exports.debug)
      /** @cut */   basis.dev.info.apply(basis.dev, [namespace + ': hash changed to "' + newPath + '"'].concat(log.length ? log : '\n<no matches>'));
    }
  }

 /**
  * Returns route
  */
  function get(path, autocreate){
    var route = path instanceof Route ? path : routes[path];

    if (!route && autocreate)
    {
      var regexp = Object.prototype.toString.call(path) == '[object RegExp]'
        ? path
        : pathToRegExp(path);

      route = routes[path] = {
        id: path,
        callbacks: [],
        token: new Route(regexp.params),
        regexp: regexp
      };

      if (typeof currentPath == 'string')
      {
        var match = currentPath.match(route.regexp);
        if (match)
        {
          match = arrayFrom(match, 1);
          matched[path] = match;
          route.token.set(match);
        }
      }
    }

    return route;
  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context){
    var route = get(path, true);
    var config;
    /** @cut */ var log = [];

    config = {
      cb_: callback,
      context: context,
      callback: typeof callback != 'function' ? callback || {} : {
        match: callback
      }
    };

    route.callbacks.push(config);

    if (route.id in matched)
    {
      if (config.callback.enter)
      {
        config.callback.enter.call(context);
        /** @cut */ log.push('\n', { type: 'enter', path: route.id, cb: config, route: route });
      }

      if (config.callback.match)
      {
        config.callback.match.apply(context, matched[path]);
        /** @cut */ log.push('\n', { type: 'match', path: route.id, cb: config, route: route, args: matched[path] });
      }
    }

    /** @cut */ if (module.exports.debug)
    /** @cut */   basis.dev.info.apply(basis.dev, [namespace + ': add handler for route `' + path + '`'].concat(log.length ? log : '\n<no matches>'));

    return route.token;
  }

 /**
  * Remove handler for path
  */
  function remove(path, callback, context){
    var route = get(path);

    if (route)
    {
      for (var i = 0, cb; cb = route.callbacks[i]; i++)
        if (cb.cb_ === callback && cb.context === context)
        {
          var token = route.token;

          route.callbacks.splice(i, 1);

          if (!route.callbacks.length)
          {
            // check no attaches to route token
            if ((!token.handler || !token.handler.handler) && !token.matched.handler)
            {
              delete routes[route.id];
              delete matched[route.id];
            }
          }

          break;
        }
    }
  }

 /**
  * Navigate to specified path
  */
  function navigate(path, replace){
    if (replace)
      location.replace(location.pathname + '#' + path);
    else
      location.hash = path;

    if (started)
      checkUrl();
  }


  // start watch for location by default
  start();


  //
  // export names
  //

  module.exports = {
    debug: false,

    start: start,
    stop: stop,
    checkUrl: checkUrl,
    navigate: navigate,

    add: add,
    remove: remove,
    route: function(path, transformer){
      var route = get(path, true).token;
      return transformer
        ? route.as(transformer)
        : route;
    }
  };
