
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

  var routes_ = {};
  var timer = null;
  var started_ = false;
  var cachedPath_ = null;


 /**
  * Start router
  */
  function start(){
    if (!started_)
    {
      if (eventSupport)
        basis.dom.event.addHandler(global, 'hashchange', checkUrl);
      else
        timer_ = setInterval(checkUrl, 50);

      ;;;basis.dev.log('Router stated');
      started_ = true;
    }

    checkUrl();
  }

 /**
  * Start router
  */
  function stop(){
    if (eventSupport)
      basis.dom.event.removeHandler(global, 'hashchange', checkUrl);
    else
      clearInterval(timer_);

    ;;;basis.dev.log('Router stated');
    started_ = false;
  }

 /**
  * Process current location
  */
  function checkUrl(){
    var curPath = location.hash.substr(1) || '/';

    if (curPath != cachedPath_)
    {
      ;;;basis.dev.log('Router hash changed:', curPath);
      cachedPath_ = curPath;

      for (var path in routes_)
      {
        var route = routes_[path];
        var match = curPath.match(route.regexp);
        if (match)
        {
          var args = basis.array.from(match, 1);
          for (var i = 0, item; item = route.callbacks[i]; i++)
            item.callback.apply(item.context, args);

          ;;;basis.dev.log('Router hash match:', route.source, args);
        }
      }
    }
  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context){
    var route = routes_[path];

    if (!route)
    {
      route = {
        source: path,
        callbacks: [],
        regexp: Object.prototype.toString.call(path) != '[object RegExp]'
          ? pathToRegExp(path)
          : path
      };
      routes_[path] = route;
    }
    
    route.callbacks.push({
      callback: callback,
      context: context
    });

    if (cachedPath_)
    {
      var match = cachedPath_.match(route.regexp);
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

    if (started_)
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
