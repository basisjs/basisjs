
  basis.require('basis.ua');
  basis.require('basis.dom.event');


 /**
  * @namespace basis.router
  */

  var namespace = this.path;


  var location = global.location;
  var document = global.document;
  var docMode = document.documentMode;
  var buggyIE = basis.ua.is('IE') && (!docMode || docMode <= 7);
  var eventSupport = 'onhashchange' in global && !buggyIE;

  var CHECK_INTERVAL = 50;
  var NAMED_PARAM = /:\w+/g;
  var SPLAT_PARAM = /\\\*\w+/g;


  function pathToRegExp(route){
    return new RegExp(
      '^' +
      String(route)
        .forRegExp()
        .replace(NAMED_PARAM, '([^\/]+)')
        .replace(SPLAT_PARAM, '(.*?)') +
      '$',
    'i');
  }

  var routes = {};
  var started = false;
  var currentPath;
  var timer;


 /**
  * Start router
  */
  function start(){
    if (!started)
    {
      if (eventSupport)
        basis.dom.event.addHandler(global, 'hashchange', checkUrl);
      else
        timer = setInterval(checkUrl, 50);

      ;;;basis.dev.log(namespace + ' started');
      started = true;

      checkUrl();      
    }
  }

 /**
  * Stop router
  */
  function stop(){
    if (eventSupport)
      basis.dom.event.removeHandler(global, 'hashchange', checkUrl);
    else
      clearInterval(timer);

    ;;;basis.dev.log(namespace + ' stopped');
    started = false;
  }

 /**
  * Process current location
  */
  function checkUrl(){
    var newPath = location.hash.substr(1) || '/';

    if (newPath != currentPath)
    {
      ;;;basis.dev.log(namespace + ' hash changed:', newPath);
      currentPath = newPath;

      for (var path in routes)
      {
        var route = routes[path];
        var match = newPath.match(route.regexp);
        if (match)
        {
          var args = basis.array.from(match, 1);
          for (var i = 0, item; item = route.callbacks[i]; i++)
            item.callback.apply(item.context, args);

          ;;;basis.dev.log(namespace + ' hash match:', route.source, args);
        }
      }
    }
  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context){
    var route = routes[path];

    if (!route)
    {
      route = {
        source: path,
        callbacks: [],
        regexp: Object.prototype.toString.call(path) != '[object RegExp]'
          ? pathToRegExp(path)
          : path
      };
      routes[path] = route;
    }
    
    route.callbacks.push({
      callback: callback,
      context: context
    });

    if (currentPath)
    {
      var match = currentPath.match(route.regexp);
      if (match)
        callback.apply(context, basis.array.from(match, 1));
    }
  }

 /**
  * Navigate to specified path
  */
  function navigate(path, replace){
    if (replace)
      location.replace(location.pathname + '#' + (path || '/'));
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
    stop: stop,
    start: start,
    checkUrl: checkUrl,
    navigate: navigate
  };
