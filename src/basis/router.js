
 /**
  * @namespace basis.router
  */

  var namespace = 'basis.router';


  //
  // main part
  //

  var location = global.location;
  var document = global.document;
  var eventUtils = require('basis.dom.event');
  var parsePath = require('./router/ast.js').parsePath;

  // documentMode logic from YUI to filter out IE8 Compat Mode which false positives
  var docMode = document.documentMode;
  var eventSupport = 'onhashchange' in global && (docMode === undefined || docMode > 7);

  var CHECK_INTERVAL = 50;

  var arrayFrom = basis.array.from;
  var routes = {};
  var started = false;
  var currentPath;
  var timer;

  var routeHistory = [];
  var checkDelayTimer;


  //
  // debug
  //

  /** @cut */ var log = [];
  /** @cut */ var flushLog = function(message){
  /** @cut */   var entries = log.splice(0);
  /** @cut */   if (module.exports.debug)
  /** @cut */     basis.dev.info.apply(basis.dev, [message].concat(entries.length ? entries : '\n<no actions>'));
  /** @cut */ };


  //
  // apply route changes
  //

  function routeEnter(route, nonInitedOnly){
    var callbacks = arrayFrom(route.callbacks_);
    for (var i = 0, item; item = callbacks[i]; i++)
      if ((!nonInitedOnly || !item.enterInited) && item.callback.enter)
      {
        item.enterInited = true;
        item.callback.enter.call(item.context);
        /** @cut */ log.push('\n', { type: 'enter', path: route.id, cb: item, route: route });
      }
  }

  function routeLeave(route){
    var callbacks = arrayFrom(route.callbacks_);
    for (var i = 0, item; item = callbacks[i]; i++)
      if (item.callback.leave)
      {
        item.callback.leave.call(item.context);
        /** @cut */ log.push('\n', { type: 'leave', path: route.id, cb: item, route: route });
      }
  }

  function routeMatch(route, nonInitedOnly){
    var callbacks = arrayFrom(route.callbacks_);
    for (var i = 0, item; item = callbacks[i]; i++)
      if ((!nonInitedOnly || !item.matchInited) && item.callback.match)
      {
        item.matchInited = true;
        item.callback.match.apply(item.context, route.value);
        /** @cut */ log.push('\n', { type: 'match', path: route.id, cb: item, route: route, args: route.value });
      }
  }

  var routesToLeave = [];
  var routesToEnter = [];
  var routesToMatch = [];
  function flushRouteEvents() {
    for (var i = 0; i < routesToLeave.length; i++)
      routeLeave(routesToLeave[i]);
    routesToLeave.length = 0;

    for (var i = 0; i < routesToEnter.length; i++)
      routeEnter(routesToEnter[i]);
    routesToEnter.length = 0;

    for (var i = 0; i < routesToMatch.length; i++)
      routeMatch(routesToMatch[i]);
    routesToMatch.length = 0;
  }

  var initSchedule = basis.asap.schedule(function(token){
    var route = get(token);

    if (route.token.value)
    {
      routeEnter(route.token, true);
      routeMatch(route.token, true);

      /** @cut */ flushLog(namespace + ': init callbacks for route `' + route.id + '`');
    }
  });


 /**
  * @class
  */
  var Route = basis.Token.subclass({
    className: namespace + '.Route',

    path: null,
    matched: null,
    params: null,
    params_: null,
    names_: null,

    init: function(regexp, path){
      basis.Token.prototype.init.call(this, null);

      this.path = path;
      this.matched = this.as(Boolean);
      this.names_ = Array.isArray(regexp.params) ? regexp.params : [];
      this.regexp_ = regexp;
      this.params_ = {};
      this.callbacks_ = [];
    },
    matches_: function(path){
      return {
        pathMatch: path.match(this.regexp_),
        query: null
      };
    },
    processLocation_: function(newPath){
      initSchedule.remove(this);

      var match = this.matches_(newPath);

      if (match.pathMatch)
      {
        if (!this.value)
          routesToEnter.push(this);
        this.set(arrayFrom(match.pathMatch, 1), match.query);
        routesToMatch.push(this);
      }
      else
      {
        if (this.value)
        {
          this.set(null);
          routesToLeave.push(this);
        }
      }
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
        value = value.slice(0);

        // extend object with named values
        for (var key in value)
          if (key in this.names_)
            if (value[key] || typeof value[this.names_[key]] == 'undefined')
              value[this.names_[key]] = value[key];
      }

      basis.Token.prototype.set.call(this, value);
    },
    add: function(callback, context){
      return add(this, callback, context);
    },
    remove: function(callback, context){
      remove(this, callback, context);
    }
  });

  var ParametrizedRoute = Route.subclass({
    decode: basis.fn.$undef,
    init: function(regexp, path, config){
      Route.prototype.init.apply(this, arguments);

      if (config.decode)
        this.decode = config.decode;

      if (config.params)
      {
        this.params = {};

        basis.object.iterate(config.params, function(key, transform){
          this.params[key] = this.as(function(values){
            if (!values)
              return null;

            if (values[key] == null) {
              return 'DEFAULT_VALUE' in transform ? transform.DEFAULT_VALUE : transform();
            }

            return transform(values[key]);
          });
        }, this);
      }
    },
    destroy: function(){
      delete routes[this.path];
    },
    set: function(value, query){
      var paramsFromQuery = queryToParams(query);

      if (value)
      {
        var paramsFromUrl = this.paramsArrayToObject_(value);
        var allParams = {};

        // preserve only params specified in config.params
        for (var paramName in this.params)
          allParams[paramName] = paramsFromUrl[paramName] || paramsFromQuery[paramName];

        this.decode(allParams);
      }

      basis.Token.prototype.set.call(this, allParams);
    },
    getPath: function(){
      return 'foo';
    },
    paramsArrayToObject_: function(arr){
      var result = {};

      for (var paramIdx in arr)
        if (paramIdx in this.names_)
          if (arr[paramIdx])
            result[this.names_[paramIdx]] = decodeURIComponent(arr[paramIdx]);

      return result;
    },
    matches_: function(newLocation){
      var pathAndQuery = newLocation.split('?');
      var newPath = pathAndQuery[0];
      var newQuery = pathAndQuery[1];

      return {
        pathMatch: newPath.match(this.regexp_),
        query: newQuery
      };
    }
  });

 /**
  * Start router
  */
  function start(){
    if (!started)
    {
      // start watch for hash changes
      if (eventSupport)
        eventUtils.addHandler(global, 'hashchange', checkUrl);
      else
        timer = setInterval(checkUrl, CHECK_INTERVAL);

      /** @cut */ if (module.exports.debug)
      /** @cut */   basis.dev.log(namespace + ' started');

      // mark as started and check current hash
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
      started = false;

      // stop watch for hash changes
      if (eventSupport)
        eventUtils.removeHandler(global, 'hashchange', checkUrl);
      else
        clearInterval(timer);

      /** @cut */ if (module.exports.debug)
      /** @cut */   basis.dev.log(namespace + ' stopped');
    }
  }

  function preventRecursion(path){
    if (checkDelayTimer)
      return true;

    // filter too old entries
    var currentTime = Date.now();
    routeHistory = routeHistory.filter(function(item){
      return (currentTime - item.time) < 200;
    });

    // search path in history
    // if more than two occurrence than delay checkUrl
    // one occurency is legal as we can go to url and then back for some reason
    var last = basis.array.lastSearch(routeHistory, path, 'path');
    if (last && basis.array.lastSearch(routeHistory, path, 'path', routeHistory.lastSearchIndex))
    {
      // set timer to delay url check
      checkDelayTimer = setTimeout(function(){
        checkDelayTimer = null;
        checkUrl();
      }, 200);

      return true;
    }

    routeHistory.push({
      time: Date.now(),
      path: path
    });
  }

  function queryToParams(query) {
    if (!query)
      return {};

    var result = {};

    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++)
    {
      var pair = pairs[i].split('=');
      var key = decodeURIComponent(pair[0]);
      var value = decodeURIComponent(pair[1]);

      result[key] = value;
    }

    return result;
  }

 /**
  * Process current location
  */
  function checkUrl(){
    var newPath = location.hash.substr(1) || '';

    if (newPath != currentPath)
    {
      // check for recursion
      if (preventRecursion(newPath))
        return;

      // save current path
      currentPath = newPath;

      // update route states
      for (var path in routes)
      {
        var route = routes[path];
        route.token.processLocation_(newPath);
      }

      flushRouteEvents();

      /** @cut */ flushLog(namespace + ': hash changed to "' + newPath + '"');
    }
    else
    {
      for (var path in routes)
      {
        var route = routes[path];
        if (route.token.value)
        {
          routeEnter(route.token, true);
          routeMatch(route.token, true);
        }
      }

      /** @cut */ flushLog(namespace + ': checkUrl()');
    }
  }

  function createRoute(regexp, path, config) {
    if (config)
      return new ParametrizedRoute(regexp, path, config);
    else
      return new Route(regexp, path);
  }

 /**
  * Returns route descriptor
  */
  function get(path, autocreate, config){
    if (path instanceof Route)
      path = path.path;

    var route = routes[path];

    if (!route && autocreate)
    {
      var parseInfo = Object.prototype.toString.call(path) == '[object RegExp]'
        ? { regexp: path, AST: null }
        : parsePath(path);
      var regexp = parseInfo.regexp;
      var token = createRoute(regexp, path, config);

      route = routes[path] = {
        id: path,
        regexp: regexp,
        enterInited: false,
        matchInited: false,
        token: token
      };

      if (typeof currentPath == 'string')
        route.token.processLocation_(currentPath);
    }

    return route;
  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context){
    var route = get(path, true);

    route.token.callbacks_.push({
      cb_: callback,
      context: context,
      callback: typeof callback != 'function' ? callback || {} : {
        match: callback
      }
    });

    initSchedule.add(route.token);

    return route.token;
  }

 /**
  * Remove handler for path
  */
  function remove(path, callback, context){
    var route = get(path);

    if (!route)
      return;

    for (var i = 0, cb; cb = route.token.callbacks_[i]; i++)
      if (cb.cb_ === callback && cb.context === context)
      {
        route.token.callbacks_.splice(i, 1);

        if (route.token.value && callback && callback.leave)
        {
          callback.leave.call(context);

          /** @cut */ if (module.exports.debug)
          /** @cut */   basis.dev.info(
          /** @cut */     namespace + ': add handler for route `' + path + '`\n',
          /** @cut */     { type: 'leave', path: route.id, cb: callback.leave, route: route.token }
          /** @cut */   );
        }

        if (!route.token.callbacks_.length)
        {
          var token = route.token;

          // check no attaches to route token
          if ((!token.handler || !token.handler.handler) && !token.matched.handler)
            delete routes[route.id];
        }

        break;
      }

    /** @cut */ basis.dev.warn(namespace + ': no callback removed', { callback: callback, context: context });
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
    route: function(path, config){
      return get(path, true, config).token;
    }
  };
