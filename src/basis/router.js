
  basis.require('basis.ua');
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
  var docMode = document.documentMode;
  var buggyIE = basis.ua.is('IE') && (!docMode || docMode <= 7);
  var eventSupport = 'onhashchange' in global && !buggyIE;

  var CHECK_INTERVAL = 50;
  var NAMED_PARAM = /:\w+/g;
  var SPLAT_PARAM = /\\\*\w+/g;

  var routes = {};
  var matched = {};
  var started = false;
  var currentPath;
  var timer;


  function pathToRegExp(route){
    return new RegExp(
      '^' +
      String(route)
        .forRegExp()
        .replace(NAMED_PARAM, '([^\/]+)')
        .replace(SPLAT_PARAM, '(.*?)')
      + '$',
    'i');
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

      ;;;if (ns.debug) basis.dev.log(namespace + ' started');
      started = true;

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

      ;;;if (ns.debug) basis.dev.log(namespace + ' stopped');
      started = false;
    }
  }

 /**
  * Process current location
  */
  function checkUrl(){
    var newPath = location.hash.substr(1) || '/';

    if (newPath != currentPath)
    {
      var inserted = [];
      var deleted = [];
      ;;;var log = [];
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
            ;;;log.push('\n', { type: 'leave', path: route.source, cb: item, route: route });
            item.callback.leave.call(item.context);
          }
      }       

      // callback off for previous matched
      for (var i = 0, route; route = inserted[i]; i++)
      {
        var callbacks = basis.array.from(route.callbacks);
        for (var j = 0, item; item = callbacks[j]; j++)
          if (item.callback.enter)
          {
            ;;;log.push('\n', { type: 'enter', path: route.source, cb: item, route: route });
            item.callback.enter.call(item.context);
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
            ;;;log.push('\n', { type: 'match', path: route.source, cb: item, route: route, args: args });
            item.callback.match.apply(item.context, args);
          }
      }

      ;;;if (ns.debug) basis.dev.info.apply(basis.dev, [namespace + ': hash changed to ' + newPath].concat(log.length ? log : 'no matches'));
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
      callback: typeof callback != 'function' ? callback : {
        match: callback
      },
      context: context
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
