
 /**
  * @namespace basis.ua.cookie
  */

  var document = global.document;
  var location = global.location;
  var escape = global.escape;
  var unescape = global.unescape;

  function normalizePath(path){
    return path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname);
  }

  module.exports = {
    set: function(name, value, expire, path, domain){
      document.cookie =
        name + '=' + (value == null ? '' : escape(value)) +
        ';path=' + normalizePath(path) +
        (expire ? ';expires=' + (new Date(Date.now() + expire * 1000)).toGMTString() : '') +
        (domain ? ';domain=' + domain : '');
    },

    get: function(name){
      var m = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*(.*?)\\s*(;|$)'));
      return m && unescape(m[2]);
    },

    remove: function(name, path, domain){
      document.cookie =
        name + '=' +
        ';expires=' + (new Date(0)).toGMTString() +
        ';path=' + normalizePath(path) +
        (domain ? ';domain=' + domain : '');
    }
  };
