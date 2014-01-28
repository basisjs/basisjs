
 /**
  * @namespace basis.ua
  */

  var namespace = this.path;


  //
  // main part
  //

  var document = global.document;
  var userAgent = (global.navigator && global.navigator.userAgent) || '';
  var opera = global.opera;
  var versions = {};
  var answers = {};
  var browserName = 'unknown';
  var browserPrettyName = 'unknown';
  var browserNames = {
    'MSIE':        ['Internet Explorer', 'msie', 'ie'],
    'Gecko':       ['Gecko', 'gecko'],
    'Safari':      ['Safari', 'safari'],
    'iPhone OS':   ['iPhone', 'iphone'],
    'AdobeAir':    ['AdobeAir', 'air'],
    'AppleWebKit': ['WebKit'],
    'Chrome':      ['Chrome', 'chrome'],
    'FireFox':     ['FireFox', 'firefox', 'ff'],
    'Iceweasel':   ['FireFox', 'firefox', 'ff'],
    'Shiretoko':   ['FireFox', 'firefox', 'ff'],
    'Opera':       ['Opera', 'opera']
  };

  // init
  for (var name in browserNames)
  {
    if (name == 'MSIE' && opera)
      continue;  // opera identifies as IE :(

    if (name == 'Safari' && /chrome/i.test(userAgent))
      continue;  // Chrome identifies as Safari :(

    if (name == 'AppleWebKit' && /iphone/i.test(userAgent))
      continue;

    if (userAgent.match(new RegExp(name + '.' + '(\\d+(\\.\\d+)*)', 'i')))
    {
      var names     = browserNames[name];
      var version   = opera && typeof opera.version == 'function' ? opera.version() : RegExp.$1;
      var verNumber = versionToInt(version);

      browserName = names[0] + verNumber;
      browserPrettyName = names[0] + ' ' + version;

      for (var j = 0; j < names.length; j++)
        versions[names[j].toLowerCase()] = verNumber;
    }
  }

  //
  // Version tests
  //

  function versionToInt(version){
    var base = 1000000;
    var part = String(version).split('.');

    for (var i = 0, result = 0; i < 4 && i < part.length; i++, base /= 100)
      result += part[i] * base;

    return result;
  }

  function testBrowser(browserName){
    var forTest = browserName.toLowerCase();

    // using cache
    if (forTest in answers)
      return answers[forTest];

    // calculate answer
    var m = forTest.match(/^([a-z]+)(([\d\.]+)([+-=]?))?$/i);
    if (m)
    {
      answers[forTest] = false;

      var name = m[1].toLowerCase();
      var version = versionToInt(m[3]); // what
      var operation = m[4] || '=';      // how
      var cmpVersion = versions[name];  // with

      if (cmpVersion)
        return answers[forTest] = !version
          || (operation == '=' && cmpVersion == version)
          || (operation == '+' && cmpVersion >= version)
          || (operation == '-' && cmpVersion <  version);
    }
    else
    {
      ;;;basis.dev.warn('Bad browser version description in Browser.test() function: ' + forTest);
    }

    return false;
  }

  //
  // Cookies
  //

  var cookies = {
    set: function(name, value, expire, path){
      document.cookie = name + '=' + (value == null ? '' : escape(value)) +
                        ';path=' + (path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname)) +
                        (expire ? ';expires=' + (new Date(Date.now() + expire * 1000)).toGMTString() : '');
    },

    get: function(name){
      var m = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*(.*?)\\s*(;|$)'));
      return m && unescape(m[2]);
    },

    remove: function(name, path){
      document.cookie = name + '=;expires=' + (new Date(0)).toGMTString() + ';path=' + (path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname));
    }
  };


  //
  // export names
  //

  module.exports = {
    prettyName: browserPrettyName,

    is: testBrowser,   // single test
    test: function(){  // multiple test
      return basis.array(arguments).some(testBrowser);
    },

    // cookie interface
    cookies: cookies
  };
