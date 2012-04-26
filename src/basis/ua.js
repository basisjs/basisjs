/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  'use strict';


 /**
  * @namespace basis.ua
  */

  var namespace = this.path;


  //
  // main part
  //

  var answers = {};
  var versions = {};
  var userAgent = (global.navigator && global.navigator.userAgent) || '';
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
    if (name == 'MSIE' && global.opera)
      continue;  // opera identifies as IE :(

    if (name == 'Safari' && userAgent.match(/chrome/i))
      continue;  // Chrome identifies as Safari :(

    if (name == 'AppleWebKit' && userAgent.match(/iphone/i))
      continue;

    if (userAgent.match(new RegExp(name + '.' + '(\\d+(\\.\\d+)*)', 'i')))
    {
      var names     = browserNames[name];
      var version   = global.opera && typeof global.opera.version == 'function' ? global.opera.version() : RegExp.$1;
      var verNumber = versionToInt(version);

      browserName = names[0] + verNumber;
      browserPrettyName = names[0] + ' ' + version;

      for (var j = 0; j < names.length; j++)
        versions[names[j].toLowerCase()] = verNumber;
    }
  }

  //
  // DATA URI SHEME test
  //

  basis.platformFeature.datauri = false;

  if (typeof Image != 'undefined') // NOTE test for Image is neccesary for node.js
    (function(){
      var testImage = new Image();
      testImage.onload = function(){ basis.platformFeature.datauri = true };
      testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    })();

  //
  // Version tests
  //

  function versionToInt(version){
    var base = 1000000;
    var part = String(version).split(".");
    for (var i = 0, result = 0; i < 4 && i < part.length; i++, base/=100)
      result += part[i] * base;

    return result;
  }

  function testBrowser(/* browserName1 .. browserNameN */){
    for (var i = 0; i < arguments.length; i++)
    {
      var forTest = arguments[i].toLowerCase();

      // using cache
      if (forTest in answers)
      {
        if (answers[forTest])
          return true;
      }
      else 
      {
        // calculate answer
        var m = forTest.match(/^([a-z]+)(([\d\.]+)([+-=]?))?$/i);
        if (m)
        { 
          answers[forTest] = false;

          var name = m[1].toLowerCase();
          var version = versionToInt(m[3]); // what
          var operation = m[4] || '=';      // how
          var cmpVersion = versions[name];  // with

          if (!cmpVersion)
            continue;

          return answers[forTest] = 
               !version
            || (operation == '=' && cmpVersion == version)
            || (operation == '+' && cmpVersion >= version)
            || (operation == '-' && cmpVersion <  version);
        }
        else
        {
          ;;;throw new Error('Bad browser version description in Browser.test() function: ' + forTest);
        }
      }
    }

    return false;
  }

  //
  // Cookies
  //

  var cookies = {
    set: function(name, value, expire, path){
      document.cookie = name + "=" + (value == null ? '' : escape(value)) +
                        ";path=" + (path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname)) +
                        (expire ? ";expires=" + (new Date(Date.now() + expire * 1000)).toGMTString() : '');
    },

    get: function(name){
      var m = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*(.*?)\\s*(;|$)"));
      return m && unescape(m[2]);
    },

    remove: function(name, path){
      document.cookie = name + "=;expires=" + new Date(0).toGMTString() + ";path=" + (path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname));
    }
  };

  //
  // user agent depended actions
  //

  // enable background image cache for IE6
  if (testBrowser('IE7-')) 
    try { document.execCommand("BackgroundImageCache", false, true) } catch(e) {};


  //
  // export names
  //

  this.toString = function(){ return browserPrettyName };

  this.extend({
    //name: browserName,
    prettyName: browserPrettyName,
    
    test: testBrowser,  // multiple test
    is: function(name){ return testBrowser(name) },  // single test

    // Cookie interface
    cookies: cookies,
    Cookies: cookies /* deprecated */
  });
