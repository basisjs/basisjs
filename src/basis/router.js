
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


  //
  // main part
  //

  var Router = basis.Class(null, {
    routes_: null,
    cachedPath_: null,
    started: false,

    init: function(){
      this.routes_ = {};
      this.cachedPath_ = '';
    },
    
    add: function(path, callback, context){
      var route = this.routes_[path]

      if (!route)
      {
        route = {
          source: path,
          callbacks: [],
          regexp: Object.prototype.toString.call(path) != '[object RegExp]'
            ? pathToRegExp(path)
            : path
        };
        this.routes_[path] = route;
      }
      
      route.callbacks.push({
        callback: callback,
        context: context
      });

      if (this.cachedPath_)
      {
        var match = this.cachedPath_.match(route.regexp);
        if (match)
          callback.apply(context, basis.array.from(match, 1));
      }
    },
    
    navigate: function(path, replace){
      if (replace)
        location.replace(location.pathname + '#' + (path || '/'));
      else
        location.hash = path;

      if (this.started)
        this.checkUrl();
    },

    start: function(){
      if (!this.started)
      {
        if (eventSupport)
          basis.dom.event.addHandler(global, 'hashchange', this.checkUrl, this);
        else
          this.timer = setInterval(this.checkUrl.bind(this), 50);

        ;;;basis.dev.log('Router stated');
        this.started = true;
      }

      this.checkUrl();
    },
    
    stop: function(){
      if (eventSupport)
        basis.dom.event.removeHandler(global, 'hashchange', this.checkUrl, this);
      else
        clearInterval(this.timer);

      ;;;basis.dev.log('Router stated');
      this.started = false;
    },

    checkUrl: function(){
      var curPath = location.hash.substr(1) || '/';

      if (curPath != this.cachedPath_)
      {
        ;;;basis.dev.log('Router hash changed:', curPath);
        this.cachedPath_ = curPath;

        for (var path in this.routes_)
        {
          var route = this.routes_[path];
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
    },

    checkRoute: function(route, path){
            
    },
    
    destroy: function(){
      this.stop();
    }
  });


  //
  // export names
  //

  module.exports = {
    Router: Router
  };
