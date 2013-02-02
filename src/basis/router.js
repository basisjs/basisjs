
  basis.require('basis.ua');
  basis.require('basis.event');

 /**
  * @namespace basis.router
  */

  var namespace = this.path;

  var docMode = document.documentMode;
  var oldIE = (/msie\s*[\w.]+/i.exec(navigator.userAgent) && (!docMode || docMode <= 7));

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

  // router object

  var Router = basis.Class(null, {
    _routes: null,
    _cachedPath: null,
    started: false,

    init: function(){
      this._routes = {};
      this._cachedPath = '';
    },
    
    add: function(path, callback, context){
      if (!this._routes[path])
      {
        var regExp = path;
        if (Object.prototype.toString.call(path) != '[object RegExp]')
          regExp = pathToRegExp(path);

        this._routes[path] = {
          source: path,
          regExp: regExp,
          callbacks: [
            {
              callback: callback,
              context: context
            }
          ]
        }
      }
      else
      {
        this._routes[path].callbacks.push({
          callback: callback,
          context: context
        });
      }

      if (this._cachedPath)
      {
        var match = this._cachedPath.match(this._routes[path].regExp);
        if (match)
          callback.apply(context, Array.from(match, 1));
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
        if ('onhashchange' in window && !oldIE)
          basis.dom.event.addHandler(window, 'hashchange', this.checkUrl, this);
        else
          this.timer = setInterval(this.checkUrl.bind(this), 50);

         this.started = true;
      }

      this.checkUrl();
    },
    
    stop: function(){
      basis.dom.event.removeHandler(window, 'hashchange', this.checkUrl, this);
      clearInterval(this.timer);
      this.started = false;
    },

    checkUrl: function(){
      var curPath = location.hash.substr(1) || '/';
      var args;

      if (curPath != this._cachedPath)
      {
        this._cachedPath = curPath;
        ;;;console.log('New hash: ', curPath);

        for (var i in this._routes)
        {
          var route = this._routes[i];
          var match = curPath.match(route.regExp);
          if (match)
          {
            var args = Array.from(match, 1);
            for (var j = 0, callback; callback = route.callbacks[j]; j++)
              callback.callback.apply(callback.context, args);

            ;;;console.log('Hash match: ', route.source, args);
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
