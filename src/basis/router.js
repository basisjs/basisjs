
  basis.require('basis.dom.event');


 /**
  * @namespace basis.router
  */

  var namespace = this.path;
  var ns = basis.namespace(String(namespace));


  //
  // main part
  //

  var location = global.location;
  var document = global.document;

  // documentMode logic from YUI to filter out IE8 Compat Mode which false positives
  var docMode = document.documentMode;
  var eventSupport = 'onhashchange' in global && (docMode === undefined || docMode > 7);

  var CHECK_INTERVAL = 50;

  var routes = {};
  var matched = {};
  var started = false;
  var currentPath;
  var timer;


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

  function startWatch(){
    if (eventSupport)
      basis.dom.event.addHandler(global, 'hashchange', checkUrl);
    else
      timer = setInterval(checkUrl, CHECK_INTERVAL);
  }
  function stopWatch(){
    if (eventSupport)
      basis.dom.event.removeHandler(global, 'hashchange', checkUrl);
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
      /** @cut */ if (ns.debug) basis.dev.log(namespace + ' started');

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
      /** @cut */ if (ns.debug) basis.dev.log(namespace + ' stopped');
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
        var callbacks = basis.array.from(route.callbacks);
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
        var callbacks = basis.array.from(route.callbacks);
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
        var args = basis.array.from(matched[path], 1);
        var callbacks = basis.array.from(route.callbacks);

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
    var match;

    if (!route)
    {
      route = routes[path] = {
        source: path,
        callbacks: [],
        regexp: Object.prototype.toString.call(path) != '[object RegExp]'
          ? pathToRegExp(path)
          : path
      };

      if (currentPath)
        if (match = currentPath.match(route.regexp))
          matched[path] = match;
    }

    config = {
      cb_: callback,
      context: context,
      callback: typeof callback != 'function' ? callback || {} : {
        match: callback
      }
    };

    route.callbacks.push(config);

    if (match = matched[path])
    {
      if (config.callback.enter)
        config.callback.enter.call(context);
      if (config.callback.match)
        config.callback.match.apply(context, basis.array.from(match, 1));
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
  function navigate(path, replace){
    if (replace)
      location.replace(location.pathname + '#' + path);
    else
      location.hash = path;

    if (started)
      checkUrl();
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
    navigate: navigate
  };
