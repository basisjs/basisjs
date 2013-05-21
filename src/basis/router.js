
  basis.require('basis.ua');
  basis.require('basis.dom.event');


 /**
  * @namespace basis.router
  */

  var namespace = this.path;


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

      ;;;basis.dev.log(namespace + ' started');
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

      ;;;basis.dev.log(namespace + ' stopped');
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
      currentPath = newPath;

      ;;;basis.dev.log(namespace + ' hash changed:', newPath);

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
          if (item.leave)
            item.leave.call(item.context);
      }       

      // callback off for previous matched
      for (var i = 0, route; route = inserted[i]; i++)
      {
        var callbacks = basis.array.from(route.callbacks);
        for (var j = 0, item; item = callbacks[j]; j++)
          if (item.enter)
            item.enter.call(item.context);
      }

      // callback for matched
      for (var path in matched)
      {
        var route = routes[path];
        var args = basis.array.from(matched[path], 1);
        var callbacks = basis.array.from(route.callbacks);

        ;;;basis.dev.log(namespace + ' hash match:', route.source, args);

        for (var i = 0, item; item = callbacks[i]; i++)
          if (item.match)
            item.match.apply(item.context, args);
      }
    }

  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context, onoff){
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
    
    if (typeof callback == 'function')
      config = {
        match: callback,
        context: context
      };
    else
      config = callback;

    route.callbacks.push(config);

    if (match = matched[path])
    {
      if (config.enter)
        config.enter.call(context);
      if (config.match)
        config.match.apply(context, basis.array.from(match, 1));
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

      if (typeof callback == 'function')
      {
        for (var i = route.callbacks.length - 1, cb; cb = route.callbacks[i]; i--)
          if (cb.macth === callback && cb.context === context)
          {
            idx = i;
            break;
          }
      }
      else
        idx = route.callbacks.indexOf(callback);

      if (idx!= -1)
      {
        route.callbacks.splice(i, 1);

        if (!route.callbacks.length)
        {
          delete routes[path];
          delete matched[path];
        }
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
    add: add,
    remove: remove,
    stop: stop,
    start: start,
    checkUrl: checkUrl,
    navigate: navigate
  };
