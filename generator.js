/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace
    
    var namespace = 'Basis.Data.Generator';

    //
    // Main part
    //

    function gNumber(precision, min, max){
      min = min || 0;
      max = max || 1;
      if (min > max) return gNumber(precision, max, min);
      return Number((min + Math.random() * (max - min)).toFixed(precision || 0));
    };

    function gString(minLen, maxLen){
      if (arguments.length < 1) minLen = 0;
      if (arguments.length < 2) maxLen = 16;
      if (minLen <= 0) minLen = 0;
      if (maxLen <= 1) maxLen = 1;
      var len = Math.floor(minLen + Math.random() * (maxLen - minLen));
      var result = '', base = ['a'.charCodeAt(), 'A'.charCodeAt()];
      for (var i = 0; i < len; i++)
        result += String.fromCharCode(Math.floor(Math.random() * 26) + base[Math.round(Math.random())]);
      return result;
    };

    function gSentence(wordCount){
      var text = document.documentElement.innerHTML;
      var re = /(^|[^a-z\-\_])([a-z][a-z0-9\-\_]+)/gi;
      var missCount = 16;
      var result = new Array();
      wordCount = wordCount < 0 ? 0 : wordCount || 5;
      while (wordCount && missCount)
      {
        re.lastIndex = Math.floor(Math.random() * text.length - 100);
        if (re.lastIndex < 0) re.lastIndex = 0;
        var m = re.exec(text);
        if (RegExp.$1)
        {
          wordCount--;
          result.push(RegExp.$2)
        }
        else
          missCount--;
      }
      return result.join(' ');
    };

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Number: gNumber,
      String: gString,
      Sentence: gSentence
    });

  })();
