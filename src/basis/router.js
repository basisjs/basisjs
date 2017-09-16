
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
  var Value = require('basis.data').Value;
  var parsePath = require('./router/ast.js').parsePath;
  var stringify = require('./router/ast.js').stringify;

  // documentMode logic from YUI to filter out IE8 Compat Mode which false positives
  var docMode = document.documentMode;
  var eventSupport = 'onhashchange' in global && (docMode === undefined || docMode > 7);

  var CHECK_INTERVAL = 50;

  var arrayFrom = basis.array.from;
  var allRoutes = [];
  var plainRoutesByPath = {};
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
  var ROUTE_ENTER = 1;
  var ROUTE_MATCH = 2;
  var ROUTE_LEAVE = 4;

  function routeEnter(route, nonInitedOnly){
    var callbacks = arrayFrom(route.callbacks_);
    for (var i = 0, item; item = callbacks[i]; i++)
      if ((!nonInitedOnly || !item.enterInited) && item.callback.enter)
      {
        item.enterInited = true;
        item.callback.enter.call(item.context);
        /** @cut */ log.push('\n', { type: 'enter', path: route.path, cb: item, route: route });
      }
  }

  function routeLeave(route){
    var callbacks = arrayFrom(route.callbacks_);
    for (var i = 0, item; item = callbacks[i]; i++)
      if (item.callback.leave)
      {
        item.callback.leave.call(item.context);
        /** @cut */ log.push('\n', { type: 'leave', path: route.path, cb: item, route: route });
      }
  }

  function routeMatch(route, nonInitedOnly){
    var callbacks = arrayFrom(route.callbacks_);
    for (var i = 0, item; item = callbacks[i]; i++)
      if ((!nonInitedOnly || !item.matchInited) && item.callback.match)
      {
        item.matchInited = true;
        item.callback.match.apply(item.context, arrayFrom(route.value));
        /** @cut */ log.push('\n', { type: 'match', path: route.path, cb: item, route: route, args: route.value });
      }
  }

  var initSchedule = basis.asap.schedule(function(route){
    if (route.value)
    {
      routeEnter(route, true);
      routeMatch(route, true);

      /** @cut */ flushLog(namespace + ': init callbacks for route `' + route.path + '`');
    }
  });

  var flushSchedule = basis.asap.schedule(function(route){
    route.flush(true);
  });

  /**
  * @class
  */
  var Route = basis.Token.subclass({
    className: namespace + '.Route',

    path: null,
    matched: null,
    ast_: null,
    names_: null,
    regexp_: null,
    params_: null,
    callbacks_: null,

    init: function(parseInfo){
      var regexp = parseInfo.regexp;

      basis.Token.prototype.init.call(this, null);

      this.path = parseInfo.path;
      this.matched = this.as(Boolean);
      this.ast_ = parseInfo.ast;
      this.names_ = parseInfo.params;
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

      var resultFlags = 0;
      var match = this.matches_(newPath);

      if (match.pathMatch)
      {
        if (!this.value)
          resultFlags |= ROUTE_ENTER;

        this.setMatch_(arrayFrom(match.pathMatch, 1), match.query);

        resultFlags |= ROUTE_MATCH;
      }
      else
      {
        if (this.value)
        {
          this.setMatch_(null);

          resultFlags |= ROUTE_LEAVE;
        }
      }

      return resultFlags;
    },
    param: function(nameOrIdx){
      var idx = typeof nameOrIdx == 'number' ? nameOrIdx : this.names_.indexOf(nameOrIdx);

      if (idx in this.params_ == false)
        this.params_[idx] = this.as(function(value){
          return value && value[idx];
        });

      return this.params_[idx];
    },
    setMatch_: function(match){
      if (match)
      {
        // make a copy of match, it also converts match to object (as match is array of matches)
        match = match.slice(0);

        // extend object with named values
        for (var key in match)
          if (key in this.names_)
            match[this.names_[key]] = match[key];
      }

      this.set(match);
    },
    add: function(callback, context){
      return add(this, callback, context);
    },
    remove: function(callback, context){
      remove(this, callback, context);
    }
  });

  var ParametrizedRoute = Route.subclass({
    className: namespace + '.ParametrizedRoute',

    params: null,
    normalize: basis.fn.$undef,
    paramsConfig_: null,

    init: function(parseInfo, config){
      Route.prototype.init.apply(this, arguments);

      this.paramsConfig_ = this.constructParamsConfig_(config.params);

      if (config.normalize)
      {
        if (typeof config.normalize === 'function')
        {
          this.normalize = config.normalize;
        }
        else
        {
          /** @cut */ basis.dev.warn(namespace + ': expected normalize to be function, but got ', config.normalize, ' - ignore');
        }
      }

      this.constructParams_();
    },
    constructParamsConfig_: function(paramsConfig){
      var result = {};

      basis.object.iterate(paramsConfig, function(key, transform){
        if (typeof transform === 'function')
        {
          var deserialize;
          var serialize;
          var defaultValue;

          if ('DEFAULT_VALUE' in transform)
            defaultValue = transform.DEFAULT_VALUE;
          else
            defaultValue = transform();

          if ('deserialize' in transform)
          {
            if (typeof transform.deserialize === 'function')
            {
              deserialize = transform.deserialize;
            }
            else
            {
              /** @cut */ basis.dev.warn(namespace + ': expected deserialize to be a function, but got ', deserialize, ' - ignore');

              deserialize = basis.fn.$self;
            }
          }
          else
          {
            deserialize = basis.fn.$self;
          }

          if ('serialize' in transform)
          {
            if (typeof transform.serialize === 'function')
            {
              serialize = transform.serialize;
            }
            else
            {
              /** @cut */ basis.dev.warn(namespace + ': expected serialize to be a function, but got ', serialize, ' - ignore');

              serialize = basis.fn.$self;
            }
          }
          else
          {
            serialize = basis.fn.$self;
          }

          result[key] = {
            transform: transform,
            serialize: serialize,
            deserialize: deserialize,
            defaultValue: defaultValue,
            currentValue: defaultValue,
            nextValue: undefined
          };
        }
        else
        {
          result[key] = {
            transform: basis.fn.$self,
            serialize: basis.fn.$self,
            deserialize: basis.fn.$self,
            defaultValue: undefined,
            currentValue: undefined,
            nextValue: undefined
          };

          /** @cut */ basis.dev.warn(namespace + ': expected param ' + key + ' to be function, but got ', transform, ' using basis.fn.$self instead');
        }
      });

      return result;
    },
    constructParams_: function(){
      var route = this;

      route.params = {};

      route.attach(function(values){
        basis.object.iterate(route.paramsConfig_, function(key, paramConfig){
          if (values && key in values)
            Value.prototype.set.call(route.params[key], values[key]);
          else
            Value.prototype.set.call(route.params[key], paramConfig.defaultValue);
        });
      });

      basis.object.iterate(route.paramsConfig_, function(key, paramConfig){
        var paramValue = new Value({
          value: paramConfig.defaultValue,
          set: function(value){
            if (!route.value)
            {
              /** @cut */ basis.dev.warn(namespace + ': trying to set param ' + key + ' when route not matched - ignoring', { params: route.paramsConfig_ });
              return;
            }

            flushSchedule.add(route);

            var newValue = paramConfig.transform(value, paramConfig.currentValue);

            paramConfig.nextValue = newValue;
          }
        });

        route.params[key] = paramValue;
      });
    },
    calculateDelta_: function(nextValues){
      var delta = null;

      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        if (paramConfig.currentValue !== nextValues[key])
        {
          delta = delta || {};
          delta[key] = paramConfig.currentValue;
        }
      });

      return delta;
    },
    setMatch_: function(pathMatch, query){
      var paramsFromQuery = queryToParams(query);

      if (!pathMatch)
      {
        this.set(null);

        return;
      }

      var paramsFromPath = this.paramsArrayToObject_(pathMatch);
      var values = {};

      // preserve only params specified in config.params
      for (var paramName in this.params)
        if (paramName in paramsFromPath)
          values[paramName] = paramsFromPath[paramName];
        else if (paramName in paramsFromQuery)
          values[paramName] = paramsFromQuery[paramName];

      var nextParams = {};

      // Run through params transforms in order to transform decoded values to typed values
      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        var deserialize = paramConfig.deserialize;
        var transform = paramConfig.transform;

        if (key in values)
        {
          var parsedValue = deserialize(values[key]);
          nextParams[key] = transform(parsedValue, paramConfig.currentValue);
        }
        else
        {
          nextParams[key] = paramConfig.defaultValue;
        }
      }, this);

      var delta = this.calculateDelta_(nextParams);

      this.normalize(nextParams, delta);

      // Run through params transforms, because normalize may spoil some params
      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        var newValue;

        if (key in nextParams)
          newValue = paramConfig.transform(nextParams[key], paramConfig.currentValue);
        else
          newValue = paramConfig.defaultValue;

        paramConfig.currentValue = newValue;
        paramConfig.nextValue = newValue;
      }, this);

      var newRouteValue = {};
      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        newRouteValue[key] = paramConfig.currentValue;
      });

      this.set(newRouteValue);

      silentReplace(this.getCurrentPath_());
    },
    update: function(params, replace){
      if (!this.value)
      {
        /** @cut */ basis.dev.warn(namespace + ': trying to update when route not matched - ignoring', { path: this.path, params: params });

        return;
      }

      basis.object.iterate(params, function(key, newValue){
        if (key in this.params)
        {
          this.params[key].set(newValue);
        }
        else
        {
          /** @cut */ basis.dev.warn(namespace + ': found param ' + key + ' not specified in config - ignoring', { params: this.paramsConfig_ });
        }
      }, this);

      this.flush(replace);
    },
    navigate: function(params, replace){
      navigate(this.getPath(params), replace);
    },
    getPath: function(specifiedParams){
      var params = {};

      specifiedParams = specifiedParams || {};

      /** @cut */ for (var key in specifiedParams)
      /** @cut */   if (!(key in this.paramsConfig_))
      /** @cut */     basis.dev.warn(namespace + ': found param ' + key + ' not specified in config - ignoring', { params: this.paramsConfig_ });

      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        if (key in specifiedParams)
          params[key] = paramConfig.transform(specifiedParams[key], paramConfig.defaultValue);
        else
          params[key] = paramConfig.defaultValue;
      }, this);

      var serialized = {};
      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        serialized[key] = paramConfig.serialize(params[key]);
      });

      return stringify(this.ast_, serialized, this.areModified_(params));
    },
    flush: function(replace){
      navigate(this.getCurrentPath_(), replace);
    },
    getCurrentPath_: function(){
      var paramsNextValues = {};
      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        paramsNextValues[key] = paramConfig.nextValue;
      });

      return this.getPath(paramsNextValues);
    },
    areModified_: function(params){
      var result = {};

      basis.object.iterate(this.paramsConfig_, function(key, paramConfig){
        result[key] = params[key] !== paramConfig.defaultValue;
      });

      return result;
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
    },
    destroy: function(){
      this.paramsConfig_ = null;
      this.params = null;

      flushSchedule.remove(this);

      basis.array.remove(allRoutes, this);

      Route.prototype.destroy.apply(this, arguments);
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

      var routesToLeave = [];
      var routesToEnter = [];
      var routesToMatch = [];

      allRoutes.forEach(function(route){
        var flags = route.processLocation_(newPath);

        if (flags & ROUTE_LEAVE)
          routesToLeave.push(route);
        if (flags & ROUTE_ENTER)
          routesToEnter.push(route);
        if (flags & ROUTE_MATCH)
          routesToMatch.push(route);
      });

      for (var i = 0; i < routesToLeave.length; i++)
        routeLeave(routesToLeave[i]);

      for (var i = 0; i < routesToEnter.length; i++)
        routeEnter(routesToEnter[i]);

      for (var i = 0; i < routesToMatch.length; i++)
        routeMatch(routesToMatch[i]);

      /** @cut */ flushLog(namespace + ': hash changed to "' + newPath + '"');
    }
    else
    {
      allRoutes.forEach(function(route){
        if (route.value)
        {
          routeEnter(route, true);
          routeMatch(route, true);
        }
      });

      /** @cut */ flushLog(namespace + ': checkUrl()');
    }
  }

  function createRoute(parseInfo, config) {
    if (config)
      return new ParametrizedRoute(parseInfo, config);
    else
      return new Route(parseInfo);
  }

 /**
  * Returns route descriptor
  */
  function get(params){
    var path = params.path;
    var config = params.config;

    if (path instanceof Route)
      return path;

    var route;
    // If there is no config specified - it should be a plain route, so we try to reuse it
    if (!config)
      route = plainRoutesByPath[path];

    if (!route && params.autocreate)
    {
      var parseInfo = Object.prototype.toString.call(path) == '[object RegExp]'
        ? { path: path, regexp: path, ast: null, params: [] }
        : parsePath(path);
      route = createRoute(parseInfo, config);
      allRoutes.push(route);

      if (route instanceof ParametrizedRoute == false)
        plainRoutesByPath[path] = route;

      if (typeof currentPath == 'string')
      {
        var flags = route.processLocation_(currentPath);

        if (flags & ROUTE_ENTER)
          routeEnter(route);
        if (flags & ROUTE_MATCH)
          routeMatch(route);
      }
    }

    return route;
  }

 /**
  * Add path to be handled
  */
  function add(path, callback, context){
    var route = get({
      path: path,
      autocreate: true
    });

    route.callbacks_.push({
      cb_: callback,
      context: context,
      callback: typeof callback != 'function' ? callback || {} : {
        match: callback
      }
    });

    initSchedule.add(route);

    return route;
  }

 /**
  * Remove handler for path
  */
  function remove(route, callback, context){
    var route = get({
      path: route
    });

    if (!route)
      return;

    for (var i = 0, cb; cb = route.callbacks_[i]; i++)
    {
      if (cb.cb_ === callback && cb.context === context)
      {
        route.callbacks_.splice(i, 1);

        if (route.value && callback && callback.leave)
        {
          callback.leave.call(context);

          /** @cut */ if (module.exports.debug)
          /** @cut */   basis.dev.info(
          /** @cut */     namespace + ': add handler for route `' + path + '`\n',
          /** @cut */     { type: 'leave', path: route.path, cb: callback.leave, route: route }
          /** @cut */   );
        }

        if (!route.callbacks_.length)
        {
          // check no attaches to route
          if ((!route.handler || !route.handler.handler) && !route.matched.handler)
          {
            basis.array.remove(allRoutes, route);

            if (!(route instanceof ParametrizedRoute))
              delete plainRoutesByPath[route.path];
          }
        }

        return;
      }
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

  function silentReplace(path) {
    currentPath = path;

    location.replace(location.pathname + '#' + path);
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
      return get({
        path: path,
        autocreate: true,
        config: config
      });
    }
  };
