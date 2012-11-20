/*
  Basis javascript library
  http://github.com/lahmatiy/basisjs
 
  @license
  Dual licensed under the MIT or GPL Version 2 licenses.
*/

/**
 * @annotation
 * Basis library core module. It provides various most using functions
 * and base functionality.
 *
 * This file should be loaded first.
 *
 * Content overview:
 * - Buildin class extensions and fixes
 *   o Object (static class members only)
 *   o Function
 *   o Array
 *   o String
 *   o Number
 *   o Date (more extensions for Date in src/basis/date.js)
 * - namespace sheme (module subsystem)
 * - resouces
 * - basis.Class namespace (provides inheritance)
 * - cleaner
 */

// Define global scope: `window` in browser, or `global` on node.js
;(function(global){

  'use strict';

  //
  // import names
  //

  var document = global.document;
  var externalResourceCache = global.__resources__ || {};


 /**
  * Object extensions
  * @namespace Object
  */

 /**
  * Returns first not null value.
  * @param {...*} args
  * @return {*}
  */
  function coalesce(/* arg1 .. argN */){
    for (var i = 0; i < arguments.length; i++)
      if (arguments[i] != null)
        return arguments[i];
  }

 /**
  * Copy all properties from source (object) to destination object.
  * @param {object} dest Object should be extended.
  * @param {object} source
  * @return {object} Destination object.
  */
  function extend(dest, source){
    for (var key in source)
      dest[key] = source[key];

    return dest;
  }

 /**
  * Copy only missed properties from source (object) to object.
  * @param {object} dest Object should be completed.
  * @param {object} source
  * @return {object} Destination object.
  */
  function complete(dest, source){
    for (var key in source)
      if (key in dest == false)
        dest[key] = source[key];

    return dest;
  }

 /**
  * Returns all property names of object.
  * @param {object} object Any object can has properties.
  * @return {Array.<string>}
  */
  function keys(object){
    var result = [];

    for (var key in object)
      result.push(key);

    return result;
  }

 /**
  * Returns all property values of object.
  * @param {object} object Any object can has properties.
  * @return {Array.<object>}
  */
  function values(object){
    var result = [];

    for (var key in object)
      result.push(object[key]);

    return result;
  }

 /**
  * Creates a slice of source object.
  * @param {object} source Any object can has properties.
  * @param {Array.<string>} keys Desired key set.
  * @return {object} New object with desired keys from source object.
  */
  function slice(source, keys){
    var result = {};

    if (!keys)
      return extend(result, source);

    for (var i = 0, key; key = keys[i++];)
      if (key in source)
        result[key] = source[key];

    return result;
  }

 /**
  * Creates a slice of source object and delete keys from source.
  * @param {object} source Any object can has properties.
  * @param {Array.<string>} keys Desired key set.
  * @return {object} New object with desired keys from source object.
  * TODO: fix case when keys is not passed; it returns copy of source,
  *       but doesn't delete anything (source should become empty object)
  */
  function splice(source, keys){
    var result = {};

    if (!keys)
      return extend(result, source);

    for (var i = 0, key; key = keys[i++];)
      if (key in source)
      {
        result[key] = source[key];
        delete source[key];
      }

    return result;
  }

 /**
  * Returns list of callback call result for every object's key-value pair.
  * @param {object} object Any object can has properties.
  * @param {function(key, value)} callback
  * @param {*=} thisObject
  * @return {Array.<*>}
  */
  function iterate(object, callback, thisObject){
    var result = [];

    for (var key in object)
      result.push(callback.call(thisObject, key, object[key]));

    return result;
  }


 /**
  * Function extensions
  * @namespace Function
  */

 /**
  * @param {*} value
  * @return {boolean} Returns true if value is undefined.
  */
  function $undefined(value){
    return value == undefined;
  }

 /**
  * @param {*} value
  * @return {boolean} Returns true if value is not undefined.
  */
  function $defined(value){
    return value != undefined;
  }

 /**
  * @param {*} value
  * @return {boolean} Returns true if value is null.
  */
  function $isNull(value){
    return value == null || value == undefined;
  }

 /**
  * @param {*} value
  * @return {boolean} Returns true if value is not null.
  */
  function $isNotNull(value){
    return value != null && value != undefined;
  }

 /**
  * @param {*} value
  * @return {boolean} Returns true if value is equal (===) to this.
  */
  function $isSame(value){
    return value === this;
  }

 /**
  * @param {*} value
  * @return {boolean} Returns true if value is not equal (!==) to this.
  */
  function $isNotSame(value){
    return value !== this;
  }

 /**
  * nothing to do, just returns first argument.
  * @param {*} value
  * @return {*} Returns first argument.
  */
  function $self(value){
    return value;
  }

 /**
  * Returns a function that always returns the same value.
  * @param {*} value
  * @return {function()}
  */
  function $const(value){
    return function(){ return value; };
  }

 /**
  * Always returns false.
  * @return {boolean}
  */
  function $false(){
    return false;
  }

 /**
  * Always returns true.
  * @return {boolean}
  */
  function $true(){
    return true;
  }

 /**
  * Always returns null.
  */
  function $null(){
    return null;
  }

 /**
  * Always returns undefined.
  */
  function $undef(){
  }

 /**
  * @param {function(object)|string} path
  * @param {function(value)|string|object=} modificator
  * @return {function(object)} Returns function that resolve some path in object and can use modificator for value transformation.
  */
  var getter = (function(){
    var modificatorSeed = 1;

    var getterMap = [];
    var pathCache = {};
    var modCache = {};

    return function(path, modificator){
      var func;
      var result;
      var getterId;

      // return nullGetter if no path or nullGetter passed
      if (!path || path === nullGetter)
        return nullGetter;

      // resolve getter by path
      if (typeof path == 'function')
      {
        getterId = path.basisGetterId_;

        // path is function
        if (getterId)
        {
          // this function used for getter before
          func = getterMap[Math.abs(getterId) - 1];
        }
        else
        {
          // this function never used for getter before, wrap and cache it

          // wrap function to prevent function properties rewrite
          func = function(object){ return path(object); };
          func.base = path;
          func.__extend__ = getter;

          // add to cache
          getterId = getterMap.push(func);
          path.basisGetterId_ = -getterId;
          func.basisGetterId_ = getterId;
        }
      }
      else
      {
        // thread path as string, search in cache
        func = pathCache[path];

        if (func)
        {
          // resolve getter id
          getterId = func.basisGetterId_;
        }
        else
        {
          // create getter function
          func = new Function('object', 'return object != null ? object.' + path + ' : object');
          func.base = path;
          func.__extend__ = getter;

          // add to cache
          getterId = getterMap.push(func);
          func.basisGetterId_ = getterId;
          pathCache[path] = func;
        }
      }

      // resolve getter with modificator
      var modType = modificator != null && typeof modificator;

      // if no modificator, return func
      if (!modType)
        return func;

      var modList = modCache[getterId];
      var modId;

      // resolve modificator id if possible
      if (modType == 'string')
        modId = modType + modificator;
      else
        if (modType == 'function')
          modId = modificator.basisModId_;
        else
          if (modType != 'object')
          {
            // only string, function and objects are support as modificator
            ;;;consoleMethods.warn('basis.getter: wrong modificator type, modificator not used, path: ', path, ', modificator:', modificator);

            return func;
          }

      // try fetch getter from cache
      if (modId && modList && modList[modId])
        return modList[modId];

      // recover original function, reduce functions call deep
      if (typeof func.base == 'function')
        func = func.base;

      switch (modType)
      {
        case 'string':
          result = function(object){ return modificator.format(func(object)); };
        break;

        case 'function':
          if (!modId)
          {
            // mark function with modificator id
            modId = modType + modificatorSeed++;
            modificator.basisModId_ = modId;
          }

          result = function(object){ return modificator(func(object)); };
        break;

        default: //case 'object':
          result = function(object){ return modificator[func(object)]; };
      }

      result.base = func.base || func;
      result.__extend__ = getter;

      if (modId)
      {
        if (!modList)
        {
          // create new modificator list if it not exists yet
          modList = {};
          modCache[getterId] = modList;
        }

        // cache getter with modificator
        modList[modId] = result;
        result.mod = modificator;

        // cache new getter
        result.basisGetterId_ = getterMap.push(result);
      }
      else
      {
        // only object modificators has no modId
        // getters with object modificator are not caching
        // this prevents of storing (in closure) object that can't be released by gabage collectors
      }

      return result;
    };

  })();

  var nullGetter = function(){};
  nullGetter.__extend__ = getter;

 /**
  * @param {function(object)|string|object} getter
  * @param {*} defValue
  * @param {function(value):boolean} checker
  * @return {function(object)}
  */
  function def(getter, defValue, checker){
    checker = checker || $isNull;
    return function(object){
      var res = getter(object);
      return checker(res) ? defValue : res;
    };
  }

 /**
  * @param {string} key
  * @return {object}
  */
  function wrapper(key){
    return function(value){
      var result = {};
      result[key] = value;
      return result;
    };
  }

 /**
  * @param {function()} init Function that should be called at first time.
  * @param {Object=} thisObject
  * @return {function()} Returns lazy function.
  */
  function lazyInit(init, thisObject){
    var inited = 0, self, data;
    return self = function(){
      if (!inited++)
      {
        self.inited = true;  // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        self.data =          // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        data = init.apply(thisObject || this, arguments);
        ;;;if (typeof data == 'undefined') consoleMethods.warn('lazyInit function returns nothing:\n' + init);
      }
      return data;
    };
  }

 /**
  * @param {function()} init Function that should be called at first time.
  * @param {function()} run Function that will be called all times.
  * @param {Object=} thisObject
  * @return {function()} Returns lazy function.
  */
  function lazyInitAndRun(init, run, thisObject){
    var inited = 0, self, data;
    return self = function(){
      if (!inited++)
      {
        self.inited = true;  // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        self.data =          // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        data = init.call(thisObject || this);
        ;;;if (typeof data == 'undefined') consoleMethods.warn('lazyInitAndRun function returns nothing:\n' + init);
      }
      run.apply(data, arguments);
      return data;
    };
  }

 /**
  * @param {function()} run Function that will be called only once.
  * @param {Object=} thisObject
  * @return {function()} Returns lazy function.
  */
  function runOnce(run, thisObject){
    var fired = 0;
    return function(){
      if (!fired++)
        return run.apply(thisObject || this, arguments);
    };
  }

 /**
  * Retuns function body code
  * @return {string}
  */
  function functionBody(fn){
    return fn.toString().replace(/^\s*\(?\s*function[^(]*\([^\)]*\)[^{]*\{|\}\s*\)?\s*$/g, '');
  }


 /**
  * @namespace Function.prototype
  */

  complete(Function.prototype, {
   /**
    * Changes function default context. It also makes possible to set static
    * arguments (folding) for function.
    * Implemented in ES5.
    * @param {Object} thisObject
    * @param {...*} args
    * @return {function()}
    * TODO: check compliance
    */
    bind: function(thisObject){
      var fn = this;
      var params = arrayFrom(arguments, 1);

      return params.length
        ? function(){
            return fn.apply(thisObject, params.concat.apply(params, arguments));
          }
        : function(){
            return fn.apply(thisObject, arguments);
          };
    }
  });


  //
  // safe console method wrappers
  //
  var consoleMethods = (function(){
    var methods = {
      log: $undef,
      info: $undef,
      warn: $undef
    };

    if (typeof console != 'undefined')
      iterate(methods, function(methodName){
        methods[methodName] = Function.prototype.bind.call(console[methodName], console);
      });

    return methods;
  })();


 /**
  * Array extensions
  * @namespace Array
  */

  complete(Array, {
   /**
    * Returns true if value is Array instance.
    * Implemented in ES5.
    * @param {*} value Value to be tested.
    * @return {boolean}
    */
    isArray: function(value){
      return Object.prototype.toString.call(value) === '[object Array]';
    }
  });

  function arrayFrom(object, offset){
    if (object != null)
    {
      var len = object.length;

      if (typeof len == 'undefined')
        return [object];

      if (!offset)
        offset = 0;

      if (len - offset > 0)
      {
        for (var result = [], k = 0, i = offset; i < len;)
          result[k++] = object[i++];
        return result;
      }
    }

    return [];
  }

  function createArray(length, fillValue, thisObject){
    var result = [];
    var isFunc = typeof fillValue == 'function';

    for (var i = 0; i < length; i++)
      result[i] = isFunc ? fillValue.call(thisObject, i, result) : fillValue;

    return result;
  }


 /**
  * @namespace Array.prototype
  */

  complete(Array.prototype, {
    // JavaScript 1.6
    indexOf: function(searchElement, offset){
      offset = parseInt(offset, 10) || 0;
      if (offset < 0)
        return -1;
      for (; offset < this.length; offset++)
        if (this[offset] === searchElement)
          return offset;
      return -1;
    },
    lastIndexOf: function(searchElement, offset){
      var len = this.length;
      offset = parseInt(offset, 10);
      if (isNaN(offset) || offset >= len)
        offset = len - 1;
      else
        offset = (offset + len) % len;
      for (; offset >= 0; offset--)
        if (this[offset] === searchElement)
          return offset;
      return -1;
    },
    forEach: function(callback, thisObject){
      for (var i = 0, len = this.length; i < len; i++)
        if (i in this)
          callback.call(thisObject, this[i], i, this);
    },
    every: function(callback, thisObject){
      for (var i = 0, len = this.length; i < len; i++)
        if (i in this && !callback.call(thisObject, this[i], i, this))
          return false;
      return true;
    },
    some: function(callback, thisObject){
      for (var i = 0, len = this.length; i < len; i++)
        if (i in this && callback.call(thisObject, this[i], i, this))
          return true;
      return false;
    },
    filter: function(callback, thisObject){
      var result = [];
      for (var i = 0, len = this.length; i < len; i++)
        if (i in this && callback.call(thisObject, this[i], i, this))
          result.push(this[i]);
      return result;
    },
    map: function(callback, thisObject){
      var result = [];
      for (var i = 0, len = this.length; i < len; i++)
        if (i in this)
          result[i] = callback.call(thisObject, this[i], i, this);
      return result;
    },
    // JavaScript 1.8
    reduce: function(callback, initialValue){ // unfortunately mozilla implementation hasn't thisObject as third argument
      var len = this.length;
      var argsLen = arguments.length;

      // no value to return if no initial value and an empty array
      if (len == 0 && argsLen == 1)
        throw new TypeError();

      var result;
      var inited = 0;

      if (argsLen > 1)
      {
        result = initialValue;
        inited = 1;
      }

      for (var i = 0; i < len; i++)
        if (i in this)
          if (inited++)
            result = callback.call(null, result, this[i], i, this);
          else
            result = this[i];

      return result;
    }
  });

  extend(Array.prototype, {
    // extractors
    flatten: function(){
      return this.concat.apply([], this);
    },
    repeat: function(count){
      return createArray(parseInt(count, 10) || 0, this).flatten();
    },

    // getters
    item: function(index){
      index = parseInt(index || 0, 10);
      return this[index >= 0 ? index : this.length + index];
    },

    // search
   /**
    * Returns first item where getter(item) === value
    * @example
    *   var list = [{ a: 1, b: 2 }, { a: 2, b: 3 }, { a: 1, b: 4}, { a: 5 }];
    *
    *   // search for item where object.a == 2
    *   var result = list.search(5, 'a');
    *     // result -> { a: 5 }
    *
    *   // search for where a == 1 && b > 2
    *   var result = list.search(true, function(object){ return object.a == 1 && object.b > 2 });
    *     // result -> { a: 1, b: 3 }
    *
    *   // search all items where a == 1
    *   var result = new Array();
    *   var item = list.search(1, 'a');
    *   while (item)
    *   {
    *     result.push(item)
    *     item = list.search(1, 'a', Array.lastSearchIndex + 1);
    *                                   // lastSearchIndex store index of last founded item
    *   }
    *     // result -> [{ a: 1, b: 2 }, { a: 1, b: 4}]
    *
    *   // but if you need all items of array with filtered by condition use Array#filter method instead
    *   var result = list.filter(basis.getter('a == 1'));
    *
    * @param {*} value
    * @param {function(object)|string} getter_
    * @param {number=} offset
    * @return {*}
    */
    search: function(value, getter_, offset){
      Array.lastSearchIndex = -1;
      getter_ = getter(getter_ || $self);

      for (var index = parseInt(offset, 10) || 0, len = this.length; index < len; index++)
        if (getter_(this[index]) === value)
          return this[Array.lastSearchIndex = index];
    },

   /**
    * @param {*} value
    * @param {function(object)|string} getter_
    * @param {number=} offset
    * @return {*}
    */
    lastSearch: function(value, getter_, offset){
      Array.lastSearchIndex = -1;
      getter_ = getter(getter_ || $self);

      var len = this.length;
      var index = isNaN(offset) || offset == null ? len : parseInt(offset, 10);

      for (var i = index > len ? len : index; i-- > 0;)
        if (getter_(this[i]) === value)
          return this[Array.lastSearchIndex = i];
    },

   /**
    * Binary search in ordered array where getter(item) === value and return position.
    * When strong parameter equal false insert position returns.
    * Otherwise returns position of founded item, but -1 if nothing found.
    * @param {*} value Value search for
    * @param {function(object)|string=} getter
    * @param {boolean=} desc Must be true for reverse sorted arrays.
    * @param {boolean=} strong If true - returns result only if value found.
    * @param {number=} left Min left index. If omit it equals to zero.
    * @param {number=} right Max right index. If omit it equals to array length.
    * @return {number}
    */
    binarySearchPos: function(value, getter, desc, strong, left, right){
      if (!this.length)  // empty array check
        return strong ? -1 : 0;

      getter = basis.getter(getter || $self);
      desc = !!desc;

      var pos, compareValue;
      var l = isNaN(left) ? 0 : left;
      var r = isNaN(right) ? this.length - 1 : right;

      do
      {
        pos = (l + r) >> 1;
        compareValue = getter(this[pos]);
        if (desc ? value > compareValue : value < compareValue)
          r = pos - 1;
        else
          if (desc ? value < compareValue : value > compareValue)
            l = pos + 1;
          else
            return value == compareValue ? pos : (strong ? -1 : 0);  // founded element
                                                      // -1 returns when it seems as founded element,
                                                      // but not equal (array item or value looked for have wrong data type for compare)
      }
      while (l <= r);

      return strong ? -1 : pos + ((compareValue < value) ^ desc);
    },
    binarySearch: function(value, getter){ // position of value
      return this.binarySearchPos(value, getter, false, true);
    },

    // collection for
    add: function(value){
      return this.indexOf(value) == -1 && !!this.push(value);
    },
    remove: function(value){
      var index = this.indexOf(value);
      return index != -1 && !!this.splice(index, 1);
    },
    has: function(value){
      return this.indexOf(value) != -1;
    },

    // misc.
    merge: function(object){
      return this.reduce(extend, object || {});
    },
    sortAsObject: function(getter, comparator, desc){
      getter = basis.getter(getter);
      desc = desc ? -1 : 1;

      return this
        .map(function(item, index){
               return {
                 i: index,       // index
                 v: getter(item) // value
               };
             })                                                                           // stability sorting (neccessary only for browsers with no strong sorting, just for sure)
        .sort(comparator || function(a, b){ return desc * ((a.v > b.v) || -(a.v < b.v) || (a.i > b.i ? 1 : -1)); })
        .map(function(item){
               return this[item.i];
             }, this);
    },
    set: function(array){
      if (this !== array)
      {
        this.length = 0;
        this.push.apply(this, array);
      }
      return this;
    },
    clear: function(){
      this.length = 0;
      return this;
    }
  });

  // IE 5.5+ & Opera
  // when second argument is omited, method set this parameter equal zero (must be equal array length)
  if (![1,2].splice(1).length)
  {
    var nativeArraySplice = Array.prototype.splice;
    Array.prototype.splice = function(){
      var params = arrayFrom(arguments);
      if (params.length < 2)
        params[1] = this.length;
      return nativeArraySplice.apply(this, params);
    };
  }

 /**
  * String extensions
  * @namespace String
  */

  var STRING_QUOTE_PAIRS = { '<': '>', '[': ']', '(': ')', '{': '}', '\xAB': '\xBB' };
  var ESCAPE_FOR_REGEXP = /([\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$])/g;
  var FORMAT_REGEXP = /\{([a-z\d_]+)(?::([\.0])(\d+)|:(\?))?\}/gi;
  var QUOTE_REGEXP_CACHE = {};

  String.Entity = {
    laquo:  '\xAB',
    raquo:  '\xBB',
    nbsp:   '\xA0',
    quot:   '\x22',
    quote:  '\x22',
    copy:   '\xA9',
    shy:    '\xAD',
    para:   '\xB6',
    sect:   '\xA7',
    deg:    '\xB0',
    mdash:  '\u2014',
    hellip: '\u2026'
  };

  function isEmptyString(value){
    return value == null || String(value) == '';
  }

  function isNotEmptyString(value){
    return value != null && String(value) != '';
  }

  complete(String, {
    toLowerCase: function(value){
      return String(value).toLowerCase();
    },
    toUpperCase: function(value){
      return String(value).toUpperCase();
    },
    trim: function(value){
      return String(value).trim();
    },
    trimLeft: function(value){
      return String(value).trimLeft();
    },
    trimRight: function(value){
      return String(value).trimRight();
    }
  });


 /**
  * @namespace String.prototype
  */
  complete(String.prototype, {
    trimLeft: function(){
      return this.replace(/^\s+/, '');
    },
    trimRight: function(){
      return this.replace(/\s+$/, '');
    },
    // implemented at ECMAScript5
    trim: function(){
      return this.trimLeft().trimRight();
    }
  });

  extend(String.prototype, {
   /**
    * @return {*}
    */
    toObject: function(rethrow){
      // try { return eval('0,' + this) } catch(e) {}
      // safe solution with no eval:
      try {
        return new Function('return 0,' + this)();
      } catch(e) {
        if (rethrow)
          throw e;
      }
    },
    toArray: ('a'.hasOwnProperty('0')
      ? function(){
          return arrayFrom(this);
        }
      // IE Array and String are not generics
      : function(){
          var result = [];
          var len = this.length;
          for (var i = 0; i < len; i++)
            result[i] = this.charAt(i);
          return result;
        }
    ),
    repeat: function(count){
      return (new Array(parseInt(count, 10) + 1 || 0)).join(this);
    },
    qw: function(){
      var trimmed = this.trim();
      return trimmed ? trimmed.split(/\s+/) : [];
    },
    forRegExp: function(){
      return this.replace(ESCAPE_FOR_REGEXP, "\\$1");
    },
    format: function(first){
      var data = arguments;

      if (typeof first == 'object')
        extend(data, first);

      return this.replace(FORMAT_REGEXP,
        function(m, key, numFormat, num, noNull){
          var value = key in data ? data[key] : (noNull ? '' : m);
          if (numFormat && !isNaN(value))
          {
            value = Number(value);
            return numFormat == '.'
              ? value.toFixed(num)
              : value.lead(num);
          }
          return value;
        }
      );
    },
    quote: function(quoteS, quoteE){
      quoteS = quoteS || '"';
      quoteE = quoteE || STRING_QUOTE_PAIRS[quoteS] || quoteS;
      var rx = (quoteS.length == 1 ? quoteS : '') + (quoteE.length == 1 ? quoteE : '');
      return quoteS + (rx ? this.replace(QUOTE_REGEXP_CACHE[rx] || (QUOTE_REGEXP_CACHE[rx] = new RegExp('[' + rx.forRegExp() + ']', 'g')), "\\$&") : this) + quoteE;
    },
    capitalize: function(){
      return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
    },
    camelize: function(){
      return this.replace(/-(.)/g, function(m, chr){ return chr.toUpperCase(); });
    },
    dasherize: function(){
      return this.replace(/[A-Z]/g, function(m){ return '-' + m.toLowerCase(); });
    }
  });


  // Fix some methods
  // ----------------
  // IE 5.0+ fix
  // 1. result array without null elements
  // 2. when parenthesis uses, result array with no parenthesis value
  if ('|||'.split(/\|/).length + '|||'.split(/(\|)/).length != 11)
  {
    String.prototype.split = function(pattern, count){
      if (pattern == '' || (pattern && pattern.source == ''))
        return this.toArray();

      var result = [];
      var pos = 0;
      var match;

      if (pattern instanceof RegExp)
      {
        if (!pattern.global)
          pattern = new RegExp(pattern.source, /\/([mi]*)$/.exec(pattern)[1] + 'g');

        while (match = pattern.exec(this))
        {
          match[0] = this.substring(pos, match.index);
          result.push.apply(result, match);
          pos = pattern.lastIndex;
        }
      }
      else
      {
        while ((match = this.indexOf(pattern, pos)) != -1)
        {
          result.push(this.substring(pos, match));
          pos = match + pattern.length;
        }
      }
      result.push(this.substr(pos));
      return result;
    };
  }

  // IE fix
  if ('12'.substr(-1) != '2')
  {
    var nativeStringSubstr = String.prototype.substr;
    String.prototype.substr = function(start, end){
      return nativeStringSubstr.call(this, start < 0 ? Math.max(0, this.length + start) : start, end);
    };
  }

 /**
  * Number extensions
  * @namespace Number.prototype
  */

  extend(Number.prototype, {
    fit: function(min, max){
      if (!isNaN(min) && this < min)
        return Number(min);
      if (!isNaN(max) && this > max)
        return Number(max);
      return this;
    },
    between: function(min, max){
      return !isNaN(this) && this >= min && this <= max;
    },
    quote: function(start, end){
      return (this + '').quote(start, end);
    },
    toHex: function(){
      return parseInt(this, 10).toString(16).toUpperCase();
    },
    sign: function(){
      return this < 0 ? -1 : +(this > 0);
    },
    base: function(div){
      return !div || isNaN(div) ? 0 : Math.floor(this/div) * div;
    },
    lead: function(len, leadChar){
      // convert to string and lead first digits by leadChar
      return (this + '').replace(/\d+/, function(number){
        // substract number length from desired length converting len to Number and indicates how much leadChars we need to add
        // here is no isNaN(len) check, because comparation of NaN and a Number is always false
        return (len -= number.length - 1) > 1 ? new Array(len).join(leadChar || 0) + number : number;
      });
    },
    group: function(len, splitter){
      return (this + '').replace(/\d+/, function(number){
        return number.replace(/\d/g, function(m, pos){ return !pos + (number.length - pos) % (len || 3) ? m : (splitter || ' ') + m; });
      });
    },
    format: function(prec, gs, prefix, postfix, comma){
      var res = this.toFixed(prec);
      if (gs || comma)
        res = res.replace(/(\d+)(\.?)/, function(m, number, c){
          return (gs ? Number(number).group(3, gs) : number) + (c ? comma || c : '');
        });
      if (prefix)
        res = res.replace(/^-?/, '$&' + (prefix || ''));
      return res + (postfix || '');
    }
  });

  // ============================================
  // Date (other extensions & fixes moved to date.js)
  //

 /**
  * @namespace Date
  */

  complete(Date, {
   /**
    * Returns the milliseconds elapsed since 1 January 1970 00:00:00 UTC up until now as a number.
    * When using now to create timestamps or unique IDs, keep in mind that the resolution may be
    * 15 milliseconds on Windows, so you could end up with several equal values if now is called
    * multiple times within a short time span.
    *
    * This method was standardized in ECMA-262 5th edition.
    * @return {number}
    */
    now: function(){
      return +new Date();
    }
  });

 /**
  * @namespace Date.prototype
  */

  if ((new Date).getYear() < 1900)
  {
    extend(Date.prototype, {
      getYear: function(){
        return this.getFullYear() - 1900;
      },
      setYear: function(year){
        return this.setFullYear(!isNaN(year) && year < 100 ? Number(year) + 1900 : year);
      }
    });
  }


  // ============================================
  // Main part
  //

 /**
  * Root namespace for Basis framework.
  * @namespace basis
  */

  // ============================================
  // path
  //

  var NODE_ENV = typeof process != 'undefined' && process.versions && process.versions.node;

  var pathUtils = (function(){
    var utils;

    if (NODE_ENV)
    {
      var _node_path = require('path');
      var _node_fs = require('fs');
      utils = slice(_node_path, [
        'normalize',
        'dirname',
        'extname',
        'basename',
        'resolve',
        'relative'
      ]);
      utils.existsSync = _node_fs.existsSync || _node_path.existsSync;
    }
    else
    {
      var linkEl = document.createElement('A');

      utils = {
        normalize: function(path){
          linkEl.href = path || '';
          //linkEl.href = linkEl.pathname;
          return linkEl.href.substring(0, linkEl.href.length - linkEl.hash.length - linkEl.search.length);
        },
        dirname: function(path){
          return this.normalize(path).replace(/\/[^\/]*$/, '');
        },
        extname: function(path){
          var ext = String(path).match(/\.[a-z0-9_\-]+$/);
          return ext ? ext[0] : '';
        },
        basename: function(path, ext){
          var filename = String(path).match(/[^\\\/]*$/);
          filename = filename ? filename[0] : '';

          if (ext == this.extname(filename))
            filename = filename.substring(0, filename.length - ext.length);

          return filename;
        },
        resolve: function(path){  // TODO: more compliant with node.js
          return this.normalize(path);
        },
        relative: function(path){
          var abs = this.normalize(path).split(/\//);
          var loc = this.baseURI.split(/\//);
          var i = 0;

          while (abs[i] == loc[i] && typeof loc[i] == 'string')
            i++;

          return '../'.repeat(loc.length - i) + abs.slice(i).join('/');
        }
      };
    }

    utils.baseURI = utils.dirname(utils.resolve());

    return utils;
  })();


  // ============================================
  // Namespace subsystem
  //

  var namespaces = {};

  function getNamespace(path, wrapFunction){
    var cursor = global;
    var nsRoot;

    path = path.split('.');
    for (var i = 0, name; name = path[i]; i++)
    {
      if (!cursor[name])
      {
        var nspath = path.slice(0, i + 1).join('.');

        // create new namespace
        cursor[name] = (function(path, wrapFn){
         /**
          * @returns {*|undefined}
          */
          function namespace(){
            if (wrapFunction)
              return wrapFunction.apply(this, arguments);
          }

          var wrapFunction = typeof wrapFn == 'function' ? wrapFn : null;

          return extend(namespace, {
            path: path,
            exports: {},
            toString: function(){ return '[basis.namespace ' + path + ']'; },
            extend: function(names){
              complete(this, names);
              extend(this.exports, names);
              return this;
            },
            setWrapper: function(wrapFn){
              if (typeof wrapFn == 'function')
              {
                ;;;if (wrapFunction) consoleMethods.warn('Wrapper for ' + path + ' is already set. Probably mistake here.');
                wrapFunction = wrapFn;
              }
            }
          });
        })(nspath, i < path.length ? wrapFunction : null);

        if (nsRoot)
          nsRoot.namespaces_[nspath] = cursor[name];
      }

      cursor = cursor[name];

      if (!nsRoot)
      {
        nsRoot = cursor;
        if (!nsRoot.namespaces_)
          nsRoot.namespaces_ = {};
      }
    }

    namespaces[path.join('.')] = cursor;

    return cursor;
  }

  var config = (function(){
    function getConfigAttr(node){
      return node.getAttributeNode('data-basis-config') || node.getAttributeNode('basis-config');
    }

    var config = {};
    var basisUrl = '';

    if (NODE_ENV)
    {
      // node.js env
      basisUrl = __dirname;
    }
    else
    {
      // browser env
      var basisScriptEl = arrayFrom(document.getElementsByTagName('script')).filter(getConfigAttr).pop();
      if (basisScriptEl)
      {
        var configValue = getConfigAttr(basisScriptEl).nodeValue.trim();
        if (configValue)
        {
          try {
            config = ('{' + configValue + '}').toObject(true) || {};
          } catch (e) {
            ;;;consoleMethods.warn('basis.js config parse fault: ' + e);
          }
        }

        basisUrl = pathUtils.dirname(basisScriptEl.src);
      }
    }

    if (!config.path)
      config.path = {};

    config.path.basis = basisUrl;
      
    for (var key in config.path)
      config.path[key] = pathUtils.resolve(config.path[key] + '/');

    return config;
  })();

  var requireNamespace = (function(){
    if (NODE_ENV)
    {
      var requirePath = pathUtils.dirname(module.filename) + '/';
      var moduleProto = module.constructor.prototype;
      return function(path){
        return (function(){
          var temp = moduleProto.load;

          moduleProto.load = function(){
            this.exports = getNamespace(path);
            temp.apply(this, arguments);
          };

          var exports = require(requirePath + path.replace(/\./g, '/'));

          complete(getNamespace(path), exports);

          moduleProto.load = temp;

          return exports;
        })();
      };
    }
    else
    {
      var nsRootPath = config.path;
      var requested = {};

      return function(namespace, path){
        if (/[^a-z0-9_\.]/i.test(namespace))
          throw 'Namespace `' + namespace + '` contains wrong chars.';

        var filename = namespace.replace(/\./g, '/') + '.js';
        var namespaceRoot = namespace.split('.')[0];

        if (namespaceRoot == namespace)
          nsRootPath[namespaceRoot] = path || nsRootPath[namespace] || (pathUtils.baseURI + '/');

        var requirePath = nsRootPath[namespaceRoot];
        if (!namespaces[namespace])
        {
          if (!/^(https?|chrome-extension):/.test(requirePath))
            throw 'Path `' + namespace + '` (' + requirePath + ') can\'t be resolved';

          if (!requested[namespace])
            requested[namespace] = true;
          else
            throw 'Recursive require for ' + namespace;

          var requestUrl = requirePath + filename;

          var ns = basis.namespace(namespace);
          var scriptText = externalResource(requestUrl);
          runScriptInContext(ns, requestUrl, scriptText, '/** @namespace ' + namespace + ' */\n');
          complete(ns, ns.exports);
          ;;;ns.filename_ = requestUrl;
          ;;;ns.source_ = scriptText;
        }
      };
    }
  })();

  (function(){
    var tmp = externalResourceCache;
    externalResourceCache = {};
    for (var key in tmp)
      externalResourceCache[pathUtils.resolve(key)] = tmp[key];
  })();

  var externalResource = function(url){
    if (!externalResourceCache.hasOwnProperty(url))
    {
      var resourceContent = '';

      if (!NODE_ENV)
      {
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.setRequestHeader('If-Modified-Since', new Date(0).toGMTString());
        req.send('');

        if (req.status >= 200 && req.status < 400)
          resourceContent = req.responseText;
        else
        {
          ;;;consoleMethods.warn('basis.resource: Unable to load ' + url);
        }
      }
      else
      {
        if (pathUtils.existsSync(url))
          resourceContent = require('fs').readFileSync(url, 'utf-8');
        else {
          ;;;consoleMethods.warn('basis.resource: Unable to load ' + url);
        }
      }

      externalResourceCache[url] = resourceContent;
    }

    return externalResourceCache[url];
  };

  var frfCache = {};
  var fetchResourceFunction = function(resourceUrl){

    if (typeof resourceUrl != 'number')
      resourceUrl = pathUtils.resolve(resourceUrl);

    if (!frfCache[resourceUrl])
    {
      var ext = pathUtils.extname(resourceUrl);
      var extWrapper;
      var extWrapperFn;
      if (ext)
      {
        extWrapper = fetchResourceFunction.extensions[ext];
        extWrapperFn = function(content){
          return extWrapper(content, resourceUrl);
        };
      }

      //consoleMethods.log('new resource resolver:' + resourceUrl);
      var attaches = [];
      var resourceObject;
      var wrapped = false;
      var resource = extWrapper
        ? function(){
            if (!wrapped)
            {
              wrapped = true;
              resource.source = externalResource(resourceUrl);
              resourceObject = extWrapperFn(resource.source);
            }
            return resourceObject;
          }
        : function(){
            return externalResource(resourceUrl);
          };

      extend(resource, new Token());
      extend(resource, {
        url: resourceUrl,
        fetch: resource,
        toString: function(){
          return '[basis.resource ' + resourceUrl + ']';
        },
        update: function(content){
          content = String(content);
          if (content != externalResourceCache[resourceUrl])
          {
            externalResourceCache[resourceUrl] = content;
            if (extWrapper)
            {
              if (extWrapper.updatable)
              {
                resource.source = content;
                resourceObject = extWrapperFn(content);
                content = resourceObject;
              }
              else
                return;
            }

            this.apply();
            //for (var i = 0, listener; listener = attaches[i]; i++)
            //  listener.handler.call(listener.context, content);
          }
        },
        reload: function(){
          var content = externalResourceCache[resourceUrl];
          delete externalResourceCache[resourceUrl];
          var newContent = externalResource(resourceUrl);
          if (newContent != content)
          {
            delete externalResourceCache[resourceUrl];
            this.update(newContent);
          }
        },
        get: function(source){
          return source ? externalResource(resourceUrl) : resource();
        }
      });

      frfCache[resourceUrl] = resource;
    }

    return frfCache[resourceUrl];
  };

  fetchResourceFunction.getSource = (function(resourceUrl){
    return externalResource(pathUtils.resolve(resourceUrl));
  });
  fetchResourceFunction.exists = (function(resourceUrl){
    return !!frfCache.hasOwnProperty(pathUtils.resolve(resourceUrl));
  });

  fetchResourceFunction.extensions = {
    '.js': function(resource, url){
      return runScriptInContext({ exports: {} }, url, resource).exports;
    },
    '.json': function(resource, url){
      if (typeof resource == 'object')
        return resource;

      var result;
      try {
        result = JSON.parse(String(resource));
      } catch(e) {
        ;;;consoleMethods.warn('basis.resource: Can\'t parse JSON from ' + url, { url: url, source: String(resource) });
      }
      return result || false;
    }
  };

  fetchResourceFunction.extensions['.json'].updatable = true;

  var runScriptInContext = function(context, sourceURL, sourceCode, prefix){
    var baseURL = pathUtils.dirname(sourceURL) + '/';
    var compiledSourceCode;

    if (!context.exports)
      context.exports = {};

    // compile context function
    try {
      compiledSourceCode = typeof sourceCode == 'function'
        ? sourceCode
        : new Function('exports, module, basis, global, __filename, __dirname, resource',
            (prefix || '') +
            '"use strict";\n\n' +
            sourceCode +
            '//@ sourceURL=' + sourceURL
          );
    } catch(e) {
      ;;;var src = document.createElement('script');src.src = sourceURL;src.async = false;document.head.appendChild(src);document.head.removeChild(src);
      throw 'Compilation error ' + sourceURL + ':\n' + ('stack' in e ? e.stack : e);
      //return;
    }

    // run
    compiledSourceCode.call(
      context,
      context.exports,
      context,
      basis,
      global,
      sourceURL,
      baseURL,
      function(relativePath){
        return fetchResourceFunction(baseURL + relativePath);
      }
    );

    return context;
  };


  // ============================================
  // OOP section: Class implementation
  //

  var Class = (function(){

   /**
    * This namespace introduce class creation scheme. It recomended for new
    * classes creation, but use able to use buildin sheme for your purposes.
    *
    * The main benefits that provides by this sheme, that all methods are able
    * to call inherited method (via this.inherit(args..)), like in other OO
    * languages. All Basis classes and components (with some exceptions) are
    * building using this sheme.
    * @example
    *   var classA = basis.Class(null, { // you can use basis.Class instead of null
    *     name: 'default value',
    *     init: function(title){ // special method - constructor
    *       this.title = title;
    *     },
    *     say: function(){
    *       return 'My name is {0}.'.format(this.title);
    *     }
    *   });
    *
    *   var classB = basis.Class(classA, {
    *     age: 0,
    *     init: function(title, age){
    *       classA.prototype.init.call(this, title);
    *       this.age = age;
    *     },
    *     say: function(){
    *       return classA.prototype.say.call(this) + ' I\'m {0} year old.'.format(this.age);
    *     }
    *   });
    *
    *   var foo = new classA('John');
    *   var bar = new classB('Ivan', 25);
    *   alert(foo.say()); // My name is John.
    *   alert(bar.say()); // My name is Ivan. I'm 25 year old.
    *   alert(bar instanceof basis.Class); // false (for some reasons it false now)
    *   alert(bar instanceof classA); // true
    *   alert(bar instanceof classB); // true
    * @namespace basis.Class
    */

    var namespace = 'basis.Class';


   /**
    * Root class for all classes created by Basis class model.
    */
    var BaseClass = function(){};

   /**
    * Global instances seed.
    */
    var seed = { id: 1 };
    var classSeed = 1;
    var NULL_FUNCTION = function(){};

   /**
    * Class construct helper: self reference value
    */
    var SELF = {};

   /**
    * Test object is it a class.
    * @func
    * @param {Object} object
    * @return {boolean} Returns true if object is class.
    */
    function isClass(object){
      return typeof object == 'function' && !!object.basisClassId_;
    }

   /**
    * @func
    */
    function isSubclassOf(superClass){
      var cursor = this;
      while (cursor && cursor !== superClass)
        cursor = cursor.superClass_;
      return cursor === superClass;
    }

    // test is toString property enumerable
    var TOSTRING_BUG = (function(){
      for (var key in { toString: 1 })
        return false;
      return true;
    })();


    //
    // main class object
    //
    extend(BaseClass, {
      // Base class name
      className: namespace,

      extendConstructor_: false,

      // prototype defaults
      prototype: {
        constructor: null,
        init: NULL_FUNCTION,
        postInit: NULL_FUNCTION,
        toString: function(){
          return '[object ' + (this.constructor || this).className + ']';
        },
        destroy: function(){
          for (var prop in this)
            this[prop] = null;

          this.destroy = $undef;
        }
      },

     /**
      * Class constructor.
      * @param {function()} SuperClass Class that new one inherits of.
      * @param {...object} extensions Objects that extends new class prototype.
      * @return {function()} A new class.
      */
      create: function(SuperClass, extensions){

        if (typeof SuperClass != 'function')
          SuperClass = BaseClass;

        // temp class constructor with no init call
        var SuperClass_ = function(){};
        SuperClass_.prototype = SuperClass.prototype;

        var newProto = new SuperClass_;
        var classId = classSeed++;
        var genericClassName = SuperClass.className + '._Class' + classId;
        var newClassProps = {
          className: genericClassName,
          basisClassId_: classId,
          superClass_: SuperClass,
          extendConstructor_: !!SuperClass.extendConstructor_,

          // class methods
          isSubclassOf: isSubclassOf,
          subclass: function(){
            return BaseClass.create.apply(null, [newClass].concat(arrayFrom(arguments)));
          },
          extend: BaseClass.extend,
          // auto extend creates a subclass
          __extend__: function(value){
            if (value && value !== SELF && (typeof value == 'object' || (typeof value == 'function' && !isClass(value))))
              return BaseClass.create.call(null, newClass, value);
            else
              return value;
          },

          // new class prototype
          prototype: newProto
        };

        // extend newClass prototype
        for (var i = 1, extension; extension = arguments[i]; i++)
        {
          newClassProps.extend(
            typeof extension == 'function' && !isClass(extension)
              ? extension(SuperClass.prototype)
              : extension
          );
        }


        /** @cut */if (newProto.init != NULL_FUNCTION && !/^function[^(]*\(\)/.test(newProto.init) && newClassProps.extendConstructor_) consoleMethods.warn('probably wrong extendConstructor_ value for ' + newClassProps.className);
        /** @cut *///if (genericClassName == newClassProps.className) { console.warn('Class has no className'); }

        // new class constructor
        // NOTE: this code makes Chrome and Firefox show class name in console
        var className = newClassProps.className;

        var newClass =
            /** @cut for more verbose in dev */ new Function('seed', 'return {"' + className + '": ' + (

              newClassProps.extendConstructor_

                // constructor with instance extension
                ? function(extend, config){
                    // mark object
                    this.basisObjectId = seed.id++;

                    // extend and override instance properties
                    var prop;
                    for (var key in extend)
                    {
                      prop = this[key];
                      this[key] = prop && prop.__extend__
                        ? prop.__extend__(extend[key])
                        : extend[key];
                    }

                    ;;;if (config) consoleMethods.warn('config param is obsolete for extensible classes (ignored)');

                    // call constructor
                    this.init();

                    // post init
                    this.postInit();
                  }

                // simple constructor
                : function(){
                    // mark object
                    this.basisObjectId = seed.id++;

                    // call constructor
                    this.init.apply(this, arguments);

                    // post init
                    this.postInit();
                  }

            /** @cut for more verbose in dev */ ) + '\n}["' + className + '"]')(seed);

        // add constructor property to prototype
        newProto.constructor = newClass;

        for (var key in newProto)
          if (newProto[key] === SELF)
            newProto[key] = newClass;
          //else
          //  newProto[key] = newProto[key];

        // extend constructor with properties
        extend(newClass, newClassProps);

        //if (!window.classCount) window.classCount = 0; window.classCount++;
        //if (!window.classList) window.classList = []; window.classList.push(newClass);

        return newClass;
      },

     /**
      * Extend class prototype
      * @param {Object} source If source has a prototype, it will be used to extend current prototype.
      * @return {function()} Returns `this`.
      */
      extend: function(source){
        var proto = this.prototype;

        if (source.prototype)
          source = source.prototype;

        for (var key in source)
        {
          var value = source[key];
          var protoValue = proto[key];

          if (key == 'className' || key == 'extendConstructor_')
            this[key] = value;
          else
          {
            if (protoValue && protoValue.__extend__)
              proto[key] = protoValue.__extend__(value);
            else
            {
              proto[key] = value;
              //;;;if (value && !value.__extend__ && (value.constructor == Object || value.constructor == Array)){ consoleMethods.warn('!' + key); }
            }
          }
        }

        // for browsers that doesn't enum toString
        if (TOSTRING_BUG && source[key = 'toString'] !== Object.prototype[key])
          proto[key] = source[key];

        return this;
      }
    });


   /**
    * @func
    */
    var customExtendProperty = function(extension, func){
      return {
        __extend__: function(extension){
          if (!extension)
            return extension;

          if (extension && extension.__extend__)
            return extension;

          var Base = function(){};
          Base.prototype = this;
          var result = new Base;
          func(result, extension);
          return result;
        }
      }.__extend__(extension || {});
    };


   /**
    * @func
    */
    var extensibleProperty = function(extension){
      return customExtendProperty(extension, extend);
    };


   /**
    * @func
    */
    var nestedExtendProperty = function(extension){
      return customExtendProperty(extension, function(result, extension){
        for (var key in extension)
        {
          var value = result[key];
          result[key] = value && value.__extend__
            ? value.__extend__(extension[key])
            : extensibleProperty(extension[key]);
        }
      });
    };

   /**
    * @func
    */
    var oneFunctionProperty = function(fn, keys){
      var create = function(keys){
        var result;

        if (keys)
        {
          if (keys.__extend__)
            return keys;

          result = {
            __extend__: create
          };

          for (var key in keys)
            if (keys[key])
              result[key] = fn;
        }

        return result;
      };

      return create(keys || {});
    };


    //
    // export names
    //

    return getNamespace(namespace, BaseClass.create).extend({
      SELF: SELF,
      BaseClass: BaseClass,
      create: BaseClass.create,
      isClass: isClass,
      customExtendProperty: customExtendProperty,
      extensibleProperty: extensibleProperty,
      nestedExtendProperty: nestedExtendProperty,
      oneFunctionProperty: oneFunctionProperty
    });
  })();


  //
  // on document load event dispatcher
  //

 /**
  * Attach load handlers for page
  * @function
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  var onLoad = (function(){
    // Matthias Miller/Mark Wubben/Paul Sowden/Dean Edwards/John Resig and Me :)

    var fired = false;
    var loadHandler = [];

    function fireHandlers(){
      if (typeof document != 'undefined' && document.readyState == 'complete')
      {
        if (!fired++)
          for (var i = 0; i < loadHandler.length; i++)
            loadHandler[i].callback.call(loadHandler[i].thisObject);
      }
    }

    // The DOM ready check for Internet Explorer
    function doScrollCheck() {
      try {
        // If IE is used, use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        document.documentElement.doScroll("left");
        fireHandlers();
      } catch(e) {
        setTimeout(doScrollCheck, 1);
      }
    }

    if (typeof document != 'undefined' && document.readyState != 'complete')
    {
      if (document.addEventListener)
      {
        // use the real event for browsers that support it (all modern browsers support it)
        document.addEventListener('DOMContentLoaded', fireHandlers, false);

        // A fallback to window.onload, that will always work
        window.addEventListener('load', fireHandlers, false);
      }
      else
      {
        // ensure firing before onload,
  			// maybe late but safe also for iframes
        document.attachEvent('onreadystatechange', fireHandlers);

        // A fallback to window.onload, that will always work
        window.attachEvent('onload', fireHandlers);

        // If IE and not a frame
  			// continually check to see if the document is ready
  			try {
  				if (window.frameElement == null && document.documentElement.doScroll)
            doScrollCheck();
  			} catch(e) {
  			}
      }
    }

    // return attach function
    return function(callback, thisObject){
      if (!fired)
      {
        loadHandler.push({
          callback: callback,
          thisObject: thisObject
        });
      }
      else
        callback.call(thisObject);
    };
  })();


 /**
  * @namespace basis
  */

 /**
  * Singleton object to destroy registred objects on page unload
  */
  var cleaner = (function(){
    var objects = [];

    function destroy(log){
      ;;;var logDestroy = log && typeof log == 'boolean' && typeof console != 'undefined';
      result.globalDestroy = true;
      result.add = $undef;
      result.remove = $undef;

      var object;
      while (object = objects.pop())
      {
        if (typeof object.destroy == 'function')
        {
          try {
            ;;;if (logDestroy) consoleMethods.log('destroy', String(object.className).quote('['), object);
            object.destroy();
          } catch(e) {
            ;;;consoleMethods.warn(String(object), e);
          }
        }
        else
        {
          for (var prop in object)
            object[prop] = null;
        }
      }
      objects.clear();
    }

    if ('attachEvent' in global)
      global.attachEvent('onunload', destroy);
    else
      if ('addEventListener' in global)
        global.addEventListener('unload', destroy, false);
      else
        return {
          add: $undef,
          remove: $undef
        };

    var result = {
      add: function(object){
        if (object != null)
          objects.push(object);
      },
      remove: function(object){
        objects.remove(object);
      }
    };

    // for debug purposes
    ;;;result.destroy_ = destroy;
    ;;;result.objects_ = objects;

    return result;
  })();


 /**
  * @class
  */
  var Token = Class(null, {
    className: 'basis.Token',

    attachList: null,

    bindingBridge: {
      attach: function(host, fn, context){
        return host.attach(fn, context);
      },
      detach: function(host, fn, context){
        return host.detach(fn, context);
      },
      get: function(host){
        return host.get();
      }
    },

    // constructor
    init: function(){
      this.attachList = [];
    },

    set: function(value){
    },
    get: function(){
    },

    attach: function(fn, context){
      var attachList = this.attachList;

      for (var i = attachList.length; i-- > 0;)
        if (attachList[i].fn === fn && attachList[i].context === context)
          return false;

      attachList.push({
        fn: fn,
        context: context
      });

      return true;
    },
    detach: function(fn, context){
      var attachList = this.attachList;

      for (var i = attachList.length; i-- > 0;)
        if (attachList[i].fn === fn && attachList[i].context === context)
        {
          attachList.splice(i, 1);
          return true;
        }

      return false;
    },

    apply: function(){
      var attachList = this.attachList;
      var value = this.get();

      for (var i = attachList.length; i-- > 0;)
        attachList[i].fn.call(attachList[i].context, value);
    },

    // destructor
    destroy: function(){
      this.attachList = null;
    }  
  });


  //
  // export names
  //

  // extend Basis
  var basis = getNamespace('basis');
  basis.extend({
    NODE_ENV: NODE_ENV,
    config: config,
    platformFeature: {},

    namespace: getNamespace,
    require: requireNamespace,
    resource: fetchResourceFunction,
    asset: function(url){
      return url;
    },

    getter: getter,
    ready: onLoad,

    Class: Class,
    Token: Token,

    cleaner: cleaner,
    console: consoleMethods,

    object: {
      extend: extend,
      complete: complete,
      keys: keys,
      values: values,
      slice: slice,
      splice: splice,
      iterate: iterate,
      coalesce: coalesce
    },
    fn: {
      // test functions
      $undefined: $undefined,
      $defined:   $defined,
      $isNull:    $isNull,
      $isNotNull: $isNotNull,
      $isSame:    $isSame,
      $isNotSame: $isNotSame,

      // gag functions
      $self:      $self,
      $const:     $const,
      $false:     $false,
      $true:      $true,
      $null:      $null,
      $undef:     $undef,

      // getters and modificators
      getter:     getter,
      nullGetter: nullGetter,
      def:        def,
      wrapper:    wrapper,

      // lazy
      lazyInit:   lazyInit,
      lazyInitAndRun: lazyInitAndRun,
      runOnce:    runOnce,
      body:       functionBody
    },
    array: extend(arrayFrom, {
      from: arrayFrom,
      create: createArray
    }),
    string: {
      isEmpty: isEmptyString,
      isNotEmpty: isNotEmptyString,
      format: String.prototype.format
    }
  });

  // add dev namespace, host for special functionality in development environment
  getNamespace('basis.dev').extend(consoleMethods);

  // TODO: rename path->stmElse and add path to exports
  basis.path = pathUtils;

  //
  // basis extenstions
  //

  extend(Object, basis.object);
  extend(Function, basis.fn);
  extend(Array, basis.array);
  extend(String, basis.string);

  //
  // auto load section
  //

  if (config.autoload)
    requireNamespace(config.autoload);

})(this);
