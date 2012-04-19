(function(){
var __wrapArgs = 'module, exports, global, __filename, __dirname, basis, resource';
var __scripts = document.getElementsByTagName('script');
var __curLocation = __scripts[__scripts.length - 1].src.replace(/[^/]+.js$/, '');

//
// src/basis.js
//

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

/**
 * @annotation
 * Basis library core module. It provides various most using functions
 * and namespaces.
 *
 * This file should be loaded first.
 *
 * Content overview:
 * - Buildin class extensions and fixes
 *   o Object (new class members only)
 *   o Function
 *   o Array
 *   o String
 *   o Number
 *   o Date (you can find other extensions for Date in date.js)
 * - Namespace sheme (module subsystem)
 * - Basis.Class namespace (provides inheritance)
 * - Cleaner
 * - TimeEventManager
 */

// Define global scope: `window` on browser, or `global` on node.js
!function(global){

  'use strict';

  //
  // import names
  //

  var document = global.document;

 /**
  * Object extensions
  * @namespace Object
  */

 /**
  * Returns first not null value.
  * @param {...*} args
  * @return {object}
  */
  function coalesce(/* arg1 .. argN */){
    var args = arguments;
    for (var i = 0; i < args.length; i++)
      if (args[i] != null)
        return args[i];
  }

 /**
  * Copy all properties from source object(s) to object.
  * @param {object} object Any object should be extended.
  * @param {object} source
  * @return {object} Extended object.
  */
  function extend(object, source){
    for (var key in source)
      object[key] = source[key];

    return object;
  }

 /**
  * Copy only missed properties from source object(s) to object.
  * @param {object} object Any object should be completed.
  * @param {object} source
  * @return {object} Completed object.
  */
  function complete(object, source){
    for (var key in source)
      if (key in object == false)
        object[key] = source[key];

    return object;
  }

 /**
  * Returns all property names of object.
  * @param {object} object Any object can has properties.
  * @return {Array.<string>}
  */
  function keys(object){
    var result = new Array();

    for (var key in object)
      result.push(key);

    return result;
  }

 /**
  * Returns all property values of object.
  * @param {object} object Any object can has properties.
  * @return {Array.<Object>}
  */
  function values(object){
    var result = new Array();

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
  * Returns callback call results for all pair key-value of object.
  * @param {object} object Any object can has properties.
  * @return {Array.<Object>}
  */
  function iterate(object, callback, thisObject){
    var result = new Array();

    for (var key in object)
      result.push(callback.call(thisObject, key, object[key]));

    return result;
  }

  extend(Object, {
    extend: extend,
    complete: complete,
    keys: keys,
    values: values,
    slice: slice,
    splice: splice,
    iterate: iterate,
    coalesce: coalesce
  });

 /**
  * Function extensions
  * @namespace Function
  */

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is undefined.
  */
  function $undefined(value){
    return value == undefined;
  }

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is not undefined.
  */
  function $defined(value){
    return value != undefined;
  }

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is null.
  */
  function $isNull(value){
    return value == null || value == undefined;
  }

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is not null.
  */
  function $isNotNull(value){
    return value != null && value != undefined;
  }

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is equal (===) to this.
  */
  function $isSame(value){
    return value === this;
  }

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is not equal (!==) to this.
  */
  function $isNotSame(value){
    return value !== this;
  }

 /**
  * Just returns first param.
  * @param {any} value
  * @return {boolean} Returns value argument.
  */
  function $self(value){
    return value;
  }

 /**
  * Returns a function that always returns the same value.
  * @param {any} value
  * @return {function()}
  */
  function $const(value){
    return function(){ return value };
  }

 /**
  * Always returns false.
  * @return {boolean}
  */
  var $false = function(){
    return false;
  }

 /**
  * Always returns true.
  * @return {boolean}
  */
  var $true = function(){
    return true;
  }

 /**
  * Always returns null.
  */
  var $null = function(){
    return null;
  }

 /**
  * Always returns undefined.
  */
  var $undef = function(){
  }

 /**
  * @function
  * @param  {function(object)|string} path
  * @param  {function(value)|string|object=} modificator
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
          func = function(object){ return path(object) };
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
            ;;;console.warn('Function.getter: wrong modificator type, modificator not used, path: ', path, ', modificator:', modificator);
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
          result = function(object){ return modificator.format(func(object)) };
        break;

        case 'function':
          if (!modId)
          {
            // mark function with modificator id
            modId = modType + modificatorSeed++;
            modificator.basisModId_ = modId;
          }

          result = function(object){ return modificator(func(object)) };
        break;

        case 'object':
          result = function(object){ return modificator[func(object)] };
        break;
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

  var nullGetter = Function();
  nullGetter.__extend__ = getter;

 /**
  * @param {function(object)|string|object} getter
  * @param {any} defValue
  * @param {function(value):boolean} checker
  * @return {function(object)}
  */
  function def(getter, defValue, checker){
    checker = checker || $isNull;
    var result = function(object){
      var res = getter(object);
      return checker(res) ? defValue : res;
    };
    return result;
  };

 /**
  * @param {string} key
  * @return {object}
  */
  function wrapper(key){
    return function(value){
      var result = {};
      result[key] = value;
      return result;
    }
  };

  extend(Function, {
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

   /**
    * @param {function()} init Function that should be called at first time.
    * @param {Object=} thisObject
    * @return {function()} Returns lazy function.
    */
    lazyInit: function(init, thisObject){
      var inited = 0, self, data;
      return self = function(){
        if (!inited++)
        {
          self.inited = true;  // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
          self.data =          // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
          data = init.apply(thisObject || this, arguments);
          ;;;if (typeof data == 'undefined' && typeof console != 'undefined') console.warn('lazyInit function returns nothing:\n' + init);
        }
        return data;
      };
    },

   /**
    * @param {function()} init Function that should be called at first time.
    * @param {function()} run Function that will be called all times.
    * @param {Object=} thisObject
    * @return {function()} Returns lazy function.
    */
    lazyInitAndRun: function(init, run, thisObject){
      var inited = 0, self, data;
      return self = function(){
        if (!inited++)
        {
          self.inited = true;  // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
          self.data =          // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
          data = init.call(thisObject || this);
          ;;;if (typeof data == 'undefined' && typeof console != 'undefined') console.warn('lazyInitAndRun function returns nothing:\n' + init);
        }
        run.apply(data, arguments);
        return data;
      };
    },

   /**
    * @param {function()} run Function that will be called only once.
    * @param {Object=} thisObject
    * @return {function()} Returns lazy function.
    */
    runOnce: function(run, thisObject){
      var fired = 0;
      return function(){
        if (!fired++)
          return run.apply(thisObject || this, arguments);
      }
    }
  });

 /**
  * @namespace Function.prototype
  */

  complete(Function.prototype, {
   /**
    * Changes function default context. It also makes possible to set static
    * arguments (folding) for function.
    * Implemented in Fifth Edition of ECMA-262.
    * TODO: check compliance
    * @param {Object} thisObject
    * @param {...*} args
    * @return {function()}
    */
    bind: function(thisObject/*, arg1 .. argN*/){
      var method = this;
      var params = Array.from(arguments, 1);

      return params.length
        ? function(){
            return method.apply(thisObject, params.concat.apply(params, arguments));
          }
        : function(){
            return method.apply(thisObject, arguments);
          };
    },

   /**
    * Retuns function body code
    * @return {string}
    */
    body: function(){
      return this.toString().replace(/^\s*\(?\s*function[^(]*\([^\)]*\)[^{]*\{|\}\s*\)?\s*$/g, '');
    }
  });

 /**
  * Array extensions
  * @namespace Array
  */

  complete(Array, {
   /**
    * Retruns true if value is Array instance.
    * @param {Object} value
    * @return {boolean}
    */
    isArray: function(value){
      return Object.prototype.toString.call(value) === '[object Array]';
    }
  });

  extend(Array, {
    // array copier
    from: function(object, offset){
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
    },

    // filled array creator
    create: function(length, fillValue, thisObject){
      var result = new Array();
      var isFunc = typeof fillValue == 'function';

      for (var i = 0; i < length; i++)
        result[i] = isFunc ? fillValue.call(thisObject, i, result) : fillValue;

      return result;
    }
  });

 /**
  * @namespace Array.prototype
  */

  complete(Array.prototype, {
    // JavaScript 1.6
    indexOf: function(searchElement, offset){
      offset = parseInt(offset) || 0;
      if (offset < 0)
        return -1;
      for (; offset < this.length; offset++)
        if (this[offset] === searchElement)
          return offset;
      return -1;
    },
    lastIndexOf: function(searchElement, offset){
      var len = this.length;
      offset = parseInt(offset);
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
      var result = new Array();
      for (var i = 0, len = this.length; i < len; i++)
        if (i in this && callback.call(thisObject, this[i], i, this))
          result.push(this[i]);
      return result;
    },
    map: function(callback, thisObject){
      var result = new Array();
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
      return Array.create(parseInt(count) || 0, this).flatten();
    },

    // getters
    item: function(index){
      index = parseInt(index || 0);
      return this[index >= 0 ? index : this.length + index];
    },
    /*first: function(index){
      return this[0];
    },
    last: function(){
      return this[this.length - 1];
    },*/

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
    *   var result = list.filter(Function.getter('a == 1'));
    *
    * @param {any} value
    * @param {function(object)|string} getter
    * @param {number=} offset
    * @return {any}
    */
    search: function(value, getter, offset){
      Array.lastSearchIndex = -1;
      getter = Function.getter(getter || $self);

      for (var index = parseInt(offset) || 0, len = this.length; index < len; index++)
        if (/*index in this && */getter(this[index]) === value)
          return this[Array.lastSearchIndex = index];
    },

   /**
    * @param {any} value
    * @param {function(object)|string} getter
    * @param {number=} offset
    * @return {any}
    */
    lastSearch: function(value, getter, offset){
      Array.lastSearchIndex = -1;
      getter = Function.getter(getter || $self);

      var len = this.length;
      var index = isNaN(offset) || offset == null ? len : parseInt(offset);

      for (var i = index > len ? len : index; i --> 0;)
        if (/*i in this && */getter(this[i]) === value)
          return this[Array.lastSearchIndex = i];
    },

   /**
    * Binary search in ordered array where getter(item) === value and return position.
    * When strong parameter equal false insert position returns.
    * Otherwise returns position of founded item, but -1 if nothing found.
    * @param {any} value Value search for
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

      getter = Function.getter(getter || $self);
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
      getter = Function.getter(getter);
      desc = desc ? -1 : 1;

      return this
        .map(function(item, index){
               return {
                 i: index,       // index
                 v: getter(item) // value
               };
             })                                                                           // stability sorting (neccessary only for browsers with no strong sorting, just for sure)
        .sort(comparator || function(a, b){ return desc * ((a.v > b.v) || -(a.v < b.v) || (a.i > b.i ? 1 : -1)) })
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
  // when second argument omit, method set this parameter equal zero (must be equal array length)
  if (![1,2].splice(1).length)
  {
    var _native_Array_splice = Array.prototype.splice;
    Array.prototype.splice = function(){
      var params = Array.from(arguments);
      if (params.length < 2)
        params[1] = this.length;
      return _native_Array_splice.apply(this, params);
    };
  }

 /**
  * String extensions
  * @namespace String
  */

  var STRING_QUOTE_PAIRS = { '<': '>', '[': ']', '(': ')', '{': '}', '\xAB': '\xBB' };
  var ESCAPE_FOR_REGEXP = /([\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$])/g;
  var FORMAT_REGEXP = /\{([a-z\d\_]+)(?::([\.0])(\d+)|:(\?))?\}/gi;
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
    },
    isEmpty: function(value){
      return value == null || String(value) == '';
    },
    isNotEmpty: function(value){
      return value != null && String(value) != '';
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
    toObject: function(rethrow){
      // try { return eval('0,' + this) } catch(e) {}
      // safe solution with no eval:
      try { return Function('return 0,' + this)() } catch(e) { if (rethrow) throw e }
    },
    toArray: (new String('a')[0]
      ? function(){
          return Array.from(this);
        }
      // IE Array and String are not generics
      : function(){
          var result = new Array();
          var len = this.length;
          for (var i = 0; i < len; i++)
            result[i] = this.charAt(i);
          return result;
        }
    ),
    repeat: function(count){
      return (new Array(parseInt(count) + 1 || 0)).join(this);
    },
    qw: function(){
      var trimed = this.trim();
      return trimed ? trimed.split(/\s+/) : [];
    },
    forRegExp: function(){
      return this.replace(ESCAPE_FOR_REGEXP, "\\$1");
    },
    format: function(first){
      var data = {};

      for (var i = 0; i < arguments.length; i++)
        data[i] = arguments[i];

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
      return quoteS + (rx ? this.replace(QUOTE_REGEXP_CACHE[rx] || (QUOTE_REGEXP_CACHE[rx] = new RegExp('[' + rx.forRegExp() + ']', 'g'), "\\$&")) : this) + quoteE;
    },
    capitalize: function(){
      return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
    },
    camelize: function(){
      return this.replace(/-(.)/g, function(m, chr){ return chr.toUpperCase() });
    },
    dasherize: function(){
      return this.replace(/[A-Z]/g, function(m){ return '-' + m.toLowerCase() });
    }
  });

  String.format = String.prototype.format;

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

      var result = new Array();
      var pos = 0;
      var match;

      if (pattern instanceof RegExp)
      {
        if (!pattern.global)
          pattern = new RegExp(pattern.source, /\/([mi]*)$/.exec(pattern)[1] + 'g')

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
    var _native_String_substr = String.prototype.substr;
    String.prototype.substr = function(start, end){
      return _native_String_substr.call(this, start < 0 ? Math.max(0, this.length + start) : start, end);
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
      return parseInt(this).toString(16).toUpperCase();
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
        return (len -= number.length - 1) > 1 ? Array(len).join(leadChar || 0) + number : number;
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

  var namespace = 'basis';

  // ============================================
  // Namespace subsystem
  //

  var namespaces = {};
  var namespaceWrappers = {};
  var nullNamespaceWrapper = Function();

  function getNamespace(namespace, wrapFunction){
    var path = namespace.split('.');
    var cursor = global;
    var name;
    var stepPath;
    var nsRoot;

    while (path.length)
    {
      name = path.shift();
      stepPath = (stepPath ? stepPath + '.' : '') + name;

      if (!cursor[name])
      {
        // create new namespace
        cursor[name] = (function(namespace, wrapFn){
          var names = {};
          var wrapFunction = typeof wrapFn == 'function' ? wrapFn : null;

          var newNamespace = function(){
            if (wrapFunction)
              return wrapFunction.apply(this, arguments);
          }

          newNamespace.path = namespace;

          newNamespace.names = function(keys){
            return Object.slice(names, typeof keys == 'string' ? keys.qw() : keys);
          };

          newNamespace.extend = function(newNames){
            complete(names, newNames);
            extend(this, newNames);
            return this;
          };

          newNamespace.setWrapper = function(wrapFn){
            if (typeof wrapFn == 'function')
            {
              if (wrapFunction && typeof console != 'undefined') console.warn('Wrapper for ' + namespace + ' is already set. Probably mistake here.');
              wrapFunction = wrapFn;
            }
          }

          return newNamespace;
        })(stepPath, !path.length ? wrapFunction : null);

        if (nsRoot)
          nsRoot.namespaces_[stepPath] = cursor[name];
      }

      cursor = cursor[name];

      if (!nsRoot)
      {
        nsRoot = cursor;
        if (!nsRoot.namespaces_)
          nsRoot.namespaces_ = {};
      }
    }

    return namespaces[namespace] = cursor;
  }

  function dirname(path){
    return path.replace(/[a-z0-9\-\_\.]+\.[a-z0-9]+$/i, '');
  }

  var requireNamespace = (function(){

    var scripts = Array.from(global.document ? document.getElementsByTagName('SCRIPT') : null);
    var basisRequirePath = dirname(scripts && scripts.length ? scripts.item(-1).src : module.filename);
    var nsRootPath = { basis: basisRequirePath };
    var requested = {};
    var requireFunc;

    if (typeof require == 'function')
    {
      var requirePath = module.filename.replace(/[^\/\\]+$/, '');
      requireFunc = function(namespace){
        return (function(){
          var temp = module.constructor.prototype.load;
          //console.log('>>>' + namespace);

          module.constructor.prototype.load = function(fn){
            //console.log(namespace, arguments);
            this.exports = getNamespace(namespace);
            //console.log(this.constructor === module.constructor, this.constructor._contextLoad);
            temp.apply(this, arguments);
          }

          var exports = require(requirePath + namespace.replace(/\./g, '/'));

          module.constructor.prototype.load = temp;

          return exports;
        })();
      }
    }
    else
    {
      requireFunc = function(namespace, path){
        if (/[^a-z0-9\_\.]/i.test(namespace))
          throw 'Namespace `' + namespace + '` contains wrong chars.';

        var filename = namespace.replace(/\./g, '/') + '.js';
        var namespaceRoot = namespace.split('.')[0];

        if (namespaceRoot == namespace)
          nsRootPath[namespaceRoot] = path || dirname(location ? location.href : '');

        var requirePath = nsRootPath[namespaceRoot];
          /*/^basis\./.test(namespace)
            ? basisRequirePath
            : dirname(location ? location.href : '');*/

        if (!namespaces[namespace])
        {
          if (!/^https?:/.test(requirePath))
            throw 'Path `' + namespace + '` (' + requirePath + ') can\'t be resolved';

          if (!requested[namespace])
            requested[namespace] = true;
          else
            throw 'Recursive require for ' + namespace;

          var requestUrl = requirePath + filename;

          wrapScript(basis.namespace(namespace), requestUrl)();

          requireFunc.sequence.push(filename);
        }
      };
      requireFunc.sequence = [];
    }

    return requireFunc;
  })();

  var externalResourceCache = {};
  var externalResource = function(url){
    var requestUrl = url;

    if (requestUrl in externalResourceCache == false)
    {
      var resourceContent = '';

      var req = new XMLHttpRequest();
      req.open('GET', requestUrl, false);
      req.setRequestHeader('If-Modified-Since', new Date(0).toGMTString());
      req.send('');

      if (req.status >= 200 && req.status < 400)
        resourceContent = req.responseText;
      else
      {
        if (typeof console != 'undefined')
          console.warn('basis.resource: Unable to load ' + requestUrl);
      }

      externalResourceCache[requestUrl] = resourceContent;
    }

    return externalResourceCache[requestUrl];
  };

  var resolveUrl = (function(){
    if (typeof require == 'function')
    {
      var path = require('path');
      return function(url){
        return path.resolve(__dirname, url);
      }
    }
    else
    {
      var resolver = document.createElement('A');
      return function(url){
        resolver.href = url;
        return resolver.href;
      }
    }
  })();

  var frfCache = {};
  var fetchResourceFunction = function(resourceUrl){

    resourceUrl = resolveUrl(resourceUrl);

    if (!frfCache[resourceUrl])
    {
      //console.log('new resource resolver:' + resourceUrl);
      var attaches = [];
      var resource = function(){
        return externalResource(resourceUrl);
      };

      resource.url = resourceUrl;
      resource.toString = resource; //function(){ return resource(); };
      resource.update = function(content){
        content = String(content);
        if (content != externalResourceCache[resourceUrl])
        {
          externalResourceCache[resourceUrl] = content;
          for (var i = 0, listener; listener = attaches[i]; i++)
            listener.handler.call(listener.context, content);
        }
      }
      resource.reload = function(){
        var content = externalResourceCache[resourceUrl];
        delete externalResourceCache[resourceUrl];
        var newContent = externalResource(resourceUrl);
        if (newContent != content)
        {
          delete externalResourceCache[resourceUrl];
          this.update(newContent);
        }
      };
      resource.bindingBridge = {
        attach: function(fn, handler, context){
          for (var i = 0, listener; listener = attaches[i]; i++)
          {
            if (listener.handler == handler && listener.context == context)
              return false;
          }

          attaches.push({
            handler: handler,
            context: context
          });

          return true;
        },
        detach: function(handler, context){
          for (var i = 0, listener; listener = attaches[i]; i++)
            if (listener.handler == handler && listener.context == context)
            {
              attaches.splice(i, 1);
              return true;
            }

          return false;
        },
        get: function(fn){
          return externalResource(resourceUrl);
        }
      };

      frfCache[resourceUrl] = resource;
    }

    return frfCache[resourceUrl];
  };

  var wrapScript = function(context, sourceURL){
    var baseURL = dirname(sourceURL);

    return function(){
      var scriptText = externalResource(sourceURL);

      if (typeof context.exports != 'object')
        context.exports = {};

      try {
        Function('exports, module, basis, global, __filename, __dirname, resource', scriptText + '//@ sourceURL=' + sourceURL).call(
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
      } catch(e) {
        ;;;console.log('Execute error ' + sourceURL);
        throw e;
      }

      return context;
    }
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
    * @type {function()}
    */
    var BaseClass = Function();

   /**
    * Global instances seed.
    */
    var seed = { id: 1 };
    var classSeed = 1;
    var NULL_FUNCTION = Function();

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
    };

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
        return;
      return true;
    })()


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
      create: function(SuperClass){

        if (typeof SuperClass != 'function')
          SuperClass = BaseClass;

        // temp class constructor with no init call
        var SuperClass_ = Function();
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
            return BaseClass.create.apply(null, [newClass].concat(Array.from(arguments)));
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


        /** @cut */if (newProto.init != NULL_FUNCTION && /^function[^(]*\(config\)/.test(newProto.init) ^ newClassProps.extendConstructor_) console.warn('probably wrong extendConstructor_ value for ' + newClassProps.className);
        /** @cut *///if (genericClassName == newClassProps.className) { console.warn('Class has no className'); }

        // new class constructor
        // NOTE: this code makes Chrome and Firefox show class name in console
        var className = newClassProps.className;
        var NULL_CONFIG = {};

        var newClass =
            /** @cut for more verbose in dev */ new Function('seed', 'NULL_CONFIG', 'return {"' + className + '": ' + (

              newClassProps.extendConstructor_

                // constructor with instance extension
                ? function(extend, config){
                    // mark object
                    this.eventObjectId = seed.id++;

                    // extend and override instance properties
                    var prop;
                    for (var key in extend)
                    {
                      prop = this[key];
                      this[key] = prop && prop.__extend__
                        ? prop.__extend__(extend[key])
                        : extend[key];
                    }

                    // call constructor
                    this.init(config || NULL_CONFIG);

                    // post init
                    this.postInit();
                  }

                // simple constructor
                : function(){
                    // mark object
                    this.eventObjectId = seed.id++;

                    // call constructor
                    this.init.apply(this, arguments);

                    // post init
                    this.postInit();
                  }

            /** @cut for more verbose in dev */ ) + '\n}["' + className + '"]')(seed, NULL_CONFIG);

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
              //;;;if (value && !value.__extend__ && (value.constructor == Object || value.constructor == Array)){ console.warn('!' + key); }
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

          var Base = Function();
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
    }


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


 /**
  * @namespace basis
  */

  // =====================================================================
  // Cleaner
  // Description: Singleton that is destroy registred objects when page unload

  var Cleaner = function(){
    var objects = new Array();

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
            ;;;if (logDestroy) console.log('destroy', String(object.className).quote('['), object);
            object.destroy();
          } catch(e) {
            ;;;if (typeof console != 'undefined') console.warn(e);
          }
        }
        else
        {
          for (var prop in object)
            delete object[prop]
        }
        //objects[i] = undefined;
      };
      objects.clear();
    };

    //Event.onUnload(destroy);  // !!!FIXME

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
  }();


  //
  // export names
  //

  // extend Basis
  getNamespace(namespace).extend({
    namespace: getNamespace,
    require: requireNamespace,
    resource: fetchResourceFunction,
    wrapScript: wrapScript,

    platformFeature: {},

    Cleaner: Cleaner
  });

  global.basis.locale = {};

}(this);
//alert(document.getElementsByTagName('script').length + '/' + document.scripts.length);

//
// src/basis/timer.js
//

new Function(__wrapArgs, function(){

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
  * @namespace basis.timer
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Cleaner = basis.Cleaner;
  var getter = Function.getter;


  //
  // Support for setImmediate/clearImmediate and fast setTimeout(.., 0)
  //

  (function(){

    //
    // Inspired on Domenic Denicola's solution https://github.com/NobleJS/setImmediate
    //

    if (global.msSetImmediate && global.msClearImmediate)
    {
      global.setImmediate = global.msSetImmediate;
      global.clearImmediate = global.msClearImmediate;
    }

    if (!global.setImmediate)
    {
      var createScript = function(){
        return document.createElement("script");
      }

      var MESSAGE_NAME = "setImmediate.basis";

      // by default
      var addToQueue = function(taskId){
        global.nativeSetTimeout_(function(){
          runTask(taskId);
        }, 0);
      };

      var runTask = (function(){
        var taskById = {};
        var taskId = 1;

        //
        // Add support for setImmediate
        //
        global.setImmediate = function(){
          taskById[++taskId] = {
            fn: arguments[0],
            args: Array.from(arguments, 1)
          };

          addToQueue(taskId);

          return taskId;
        };

        //
        // Remove support for clearImmediate
        //
        global.clearImmediate = function(taskId){
          delete taskById[taskId];
        };

        //
        // return result function for task run
        //
        return function(taskId){
          var task = taskById[taskId];

          if (task)
          {
            try {
              if (typeof task.fn == 'function')
                task.fn.apply(undefined, task.args);
              else
              {
                (global.execScript || function(fn){
                  global["eval"].call(global, fn);
                })(String(task.fn));
              }

            } finally {
              delete taskById[taskId];
            }
          }
        }
      })();


      //
      // implement platform specific solution
      //
      if (global.MessageChannel)
      {
        var addToQueue = function(taskId){
          var channel = new global.MessageChannel();
          channel.port1.onmessage = function(){
            runTask(taskId);
          };
          channel.port2.postMessage(""); // broken in Opera if no value
        };
      }
      else
      {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        var postMessageSupported = global.postMessage && !global.importScripts;

        // IE8 has postMessage implementation, but it is synchronous and can't be used.
        if (postMessageSupported)
        {
          var oldOnMessage = global.onmessage;
          global.onmessage = function(){
            postMessageSupported = false;
          };
          global.postMessage("", "*");
          global.onmessage = oldOnMessage;
        }

        if (postMessageSupported)
        {
          // postMessage sheme
          var handleMessage = function(event){
            if (event && event.source == global)
            {
              var taskId = String(event.data).split(MESSAGE_NAME)[1];

              if (taskId)
                runTask(taskId)
            }
          }

          if (global.addEventListener)
            global.addEventListener("message", handleMessage, true);
          else
            global.attachEvent("onmessage", handleMessage);

          // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
          // invoking our onGlobalMessage listener above.
          var addToQueue = function(taskId){
            postMessage(MESSAGE_NAME + taskId, "*");
          };
        }
        else
        {
          if (document && "onreadystatechange" in createScript())
          {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called
            var addToQueue = function(taskId){
              var scriptEl = createScript();
              scriptEl.onreadystatechange = function(){
                runTask(taskId);

                scriptEl.onreadystatechange = null;
                scriptEl.parentNode.removeChild(scriptEl);
                scriptEl = null;
              };
              document.documentElement.appendChild(scriptEl);
            }
          }
        }
      }
    }

    //
    // store native setTimeout/clearTimeout
    //
    global.nativeSetTimeout_ = global.setTimeout;
    global.nativeClearTimeout_ = global.clearTimeout;

    //
    // Override setTimeout
    //
    global.setTimeout = function(fn, timeout){
      return isNaN(timeout) || timeout <= 0
        ? MESSAGE_NAME + global.setImmediate(fn)
        : global.nativeSetTimeout_(fn, timeout);
    };

    //
    // Override clearTimeout
    //
    global.clearTimeout = function(timer){
      var immediateId = String(timer).split(MESSAGE_NAME)[1];

      return immediateId
        ? global.clearImmediate(immediateId)
        : global.nativeClearTimeout_(timer);
    };
  })();


  //
  // TimeEventManager
  //

  var TimeEventManager = (function(){
    var NEVER = 2E12;
    var EVENT_TIME_GETTER = getter('eventTime');

    var eventStack = [];
    var map = {};
    var fireTime = NEVER;
    var timer = null;

    var lockSetTimeout = false;

    function setNextTime(){
      if (lockSetTimeout)
        return;

      if (eventStack.length)
      {
        var now = Date.now();
        var firstEventTime = Math.max(eventStack[0].eventTime, now);

        // move fire time backward
        if (firstEventTime < fireTime)
        {
          clearTimeout(timer);
          timer = setTimeout(fire, (fireTime = firstEventTime) - now);
        }
      }
      else
      {
        timer = clearTimeout(timer);
        fireTime = NEVER;
      }
    }

    function add(object, event, eventTime){
      var objectId = object.eventObjectId;
      var eventMap = map[event];

      if (!eventMap)
        eventMap = map[event] = {};

      var eventObject = eventMap[objectId];

      if (eventObject)
      {
        if (isNaN(eventTime))
          return remove(object, event);

        if (eventObject.eventTime == eventTime)
          return;

        // temporary remove from stack
        //eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
        eventStack.remove(eventObject);
        eventObject.eventTime = eventTime;
      }
      else
      {
        if (isNaN(eventTime))
          return;

        // event config
        eventObject = eventMap[objectId] = {
          eventName: event,
          object: object,
          eventTime: eventTime,
          callback: object[event]
        };
      }

      // insert event into stack
      eventStack.splice(eventStack.binarySearchPos(eventTime, EVENT_TIME_GETTER), 0, eventObject);

      setNextTime();
    }

    function remove(object, event){
      var objectId = object.eventObjectId;
      var eventObject = map[event] && map[event][objectId];

      if (eventObject)
      {
        // delete object from stack and map
        eventStack.remove(eventObject);
        delete map[event][objectId];

        setNextTime();
      }
    }

    function fire(){
      var now = Date.now();
      var pos = eventStack.binarySearchPos(now + 15, EVENT_TIME_GETTER);

      lockSetTimeout = true; // lock for set timeout if callback calling will add new events
      eventStack.splice(0, pos).forEach(function(eventObject){
        delete map[eventObject.eventName][eventObject.object.eventObjectId];
        eventObject.callback.call(eventObject.object);
      });
      lockSetTimeout = false; // unlock

      fireTime = NEVER;
      setNextTime();
    }

    Cleaner.add({
      destroy: function(){
        lockSetTimeout = true;
        clearTimeout(timer);
        eventStack.length = 0;
        map = null;
      }
    });

    return {
      add: add,
      remove: remove
    };
  })();


  //
  // export names
  //

  this.extend({
    TimeEventManager: TimeEventManager
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/timer.js").call(basis.namespace("basis.timer"), basis.namespace("basis.timer"), basis.namespace("basis.timer").exports, this, __curLocation + "src/basis/timer.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/event.js
//

new Function(__wrapArgs, function(){

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
  * @namespace basis.event
  */

  //
  // import names
  //

  var Class = basis.Class;
  var extend = Object.extend;
  var slice = Array.prototype.slice;


  //
  // Main part
  //

  var eventObjectId = 1; // EventObject seed ID
  var events = {};


 /**
  * @func
  */
  var warnOnDestroy = function(){
    throw 'Object had been destroed before. Destroy method shouldn\'t be call more than once.'
  };


 /**
  * Creates new type of event or returns existing one, if it was created before.
  * @param {string} eventName
  * @func
  */
  function createEvent(eventName){
    var eventFunction = events[eventName];

    if (!eventFunction)
    {
      eventFunction = events[eventName] = 
        /** @cut for more verbose in dev */ Function('eventName', 'slice', 'eventFunction', 'return eventFunction = function _event_' + eventName + '(' + Array.from(arguments, 1).join(', ') + '){' + 

          function dispatchEvent(){
            var handlers = this.handlers_;
            var listenHandler;
            var config;
            var fn;

            if (eventFunction.listen)
              if (fn = this.listen[eventFunction.listenName])
                eventFunction.listen.call(this, fn, arguments);

            if (handlers && handlers.length)
            {
              // prevent handlers list from changes
              handlers = slice.call(handlers);

              for (var i = handlers.length; i --> 0;)
              {
                config = handlers[i];

                // handler call
                if (fn = config.handler[eventName])
                  if (typeof fn == 'function')
                    fn.apply(config.thisObject, arguments);

                // any event handler
                if (fn = config.handler['*'])
                  if (typeof fn == 'function')
                    fn.call(config.thisObject, {
                      sender: this,
                      type: eventName,
                      args: arguments
                    });
              }
            }

            // WARN: this feature is not available in producation
            ;;;if (this.event_debug) this.event_debug({ sender: this, type: eventName, args: arguments });
          }

        /** @cut for more verbose in dev */ .toString().replace(/\beventName\b/g, '\'' + eventName + '\'').replace(/^function[^(]*\(\)[^{]*\{|\}$/g, '') + '}')(eventName, slice);

      if (LISTEN_MAP[eventName])
        extend(eventFunction, LISTEN_MAP[eventName]);
    }

    return eventFunction;
  };


  //
  // listen scheme
  //

  var LISTEN_MAP = {};
  var LISTEN = {
    add: function(listenName, eventName, propertyName, handler){
      if (!propertyName)
        propertyName = listenName;

      LISTEN_MAP[eventName] = {
        listenName: listenName,
        listen: handler || function(listen, args){
          var object;

          if (object = args[1])  // second argument is oldObject
            object.removeHandler(listen, this);

          if (object = this[propertyName])
            object.addHandler(listen, this);
        }
      };

      var eventFunction = events[eventName];
      if (eventFunction)
        extend(eventFunction, LISTEN_MAP[eventName]);
    }
  };


 /**
  * Base class for event dispacthing. It provides model when it's instance
  * can registrate handlers for events, and call it when event happend. 
  * @class
  */
  var EventObject = Class(null, {
    className: this.name + '.EventObject',

   /**
    * List of event handler sets.
    * @type {Array.<Object>}
    * @private
    */
    handlers_: null,

   /**
    * Function that call on any event. Use it to debug purposes only.
    * WARN: This functionality is not supported in producation.
    * @type {function(event)}
    * @debug
    */
    /** @cut */event_debug: null,

   /**
    * Fires when object is destroing.
    * NOTE: don't override
    * @param {Basis.EventObject} object Reference for object wich is destroing.
    * @event
    */
    event_destroy: createEvent('destroy', 'object'),

   /**
    * Related object listeners.
    */
    listen: Class.nestedExtendProperty(),

   /** use extend constructor */
    extendConstructor_: true,

   /**
    * @param {Object=} config
    * @constructor
    */
    init: function(config){
      // fast add first handler
      if (this.handler)
      {
        (this.handlers_ || (this.handlers_ = [])).push({
          handler: this.handler,
          thisObject: this.handlerContext || this
        });
      }
    },

   /**
    * Registrates new event handler set for object.
    * @param {Object} handler Event handler set.
    * @param {Object=} thisObject Context object.
    * @return {boolean} Whether event handler set was added.
    */
    addHandler: function(handler, thisObject){
      var handlers = this.handlers_;

      if (!handlers)
        handlers = this.handlers_ = [];

      if (!thisObject)
        thisObject = this;

      ;;;if (!handler && typeof console != 'undefined') console.warn('EventObject#addHandler: `handler` argument is not an object (', handler, ')');
      
      // search for duplicate
      // check from end to start is more efficient for objects which often add/remove handlers
      for (var i = handlers.length, item; i --> 0;)
      {
        item = handlers[i];
        if (item.handler === handler && item.thisObject === thisObject)
        {
          ;;;if (typeof console != 'undefined') console.warn('EventObject#addHandler: Add dublicate handler to EventObject instance: ', this);
          return false;
        }
      }

      // add handler
      return !!handlers.push({ 
        handler: handler,
        thisObject: thisObject
      });
    },

   /**
    * Removes event handler set from object. For this operation parameters
    * must be the same (equivalent) as used for addHandler method.
    * @param {Object} handler Event handler set.
    * @param {Object=} thisObject Context object.
    * @return {boolean} Whether event handler set was removed.
    */
    removeHandler: function(handler, thisObject){
      var handlers = this.handlers_;

      if (!handlers)
        return;

      if (!thisObject)
        thisObject = this;

      ;;;if (!handler && typeof console != 'undefined') console.warn('EventObject#addHandler: `handler` argument is not an object (', handler, ')');

      // search for handler and remove
      // check from end to start is more efficient for objects which often add/remove handlers
      for (var i = handlers.length, item; i --> 0;)
      {
        item = handlers[i];
        if (item.handler === handler && item.thisObject === thisObject)
          return !!handlers.splice(i, 1);
      }

      // handler not found
      return false;
    },

   /**
    * @destructor
    */
    destroy: function(){
      // warn on destroy method call (only in debug mode)
      ;;;this.destroy = warnOnDestroy;

      if (this.handlers_)
      {
        // fire object destroy event handlers
        events.destroy.call(this, this);

        // remove all event handler sets
        this.handlers_ = null;
      }
    }
  });


  //
  // export names
  //

  this.extend({
    LISTEN: LISTEN,

    create: createEvent,
    events: events,

    EventObject: EventObject
  }); 



}.body() + "//@ sourceURL=" + __curLocation + "src/basis/event.js").call(basis.namespace("basis.event"), basis.namespace("basis.event"), basis.namespace("basis.event").exports, this, __curLocation + "src/basis/event.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/ua.js
//

new Function(__wrapArgs, function(){

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

  var testImage = typeof Image != 'undefined' ? new Image() : {}; // NOTE test for Image neccesary for node.js
  testImage.onload = function(){ basis.platformFeature.datauri = true };
  testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

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
    testImage: testImage,

    //name: browserName,
    prettyName: browserPrettyName,
    
    test: testBrowser,  // multiple test
    is: function(name){ return testBrowser(name) },  // single test

    // Cookie interface
    cookies: cookies,
    Cookies: cookies /* deprecated */
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ua.js").call(basis.namespace("basis.ua"), basis.namespace("basis.ua"), basis.namespace("basis.ua").exports, this, __curLocation + "src/basis/ua.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/ua/visibility.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

  'use strict';


 /**
  * @namespace basis.ua.visibility
  */
  
  var namespace = this.path;


  //
  // Main part
  //

  var visibilityPrefix;
  var supported = false;
  var inited = false;
  var handlers = [];


  //
  // Check visibility support and get prefix
  //

  var prefixes = [ 'webkit', 'moz', 'o', 'ms' ]; 
  if (document.visibilityState != undefined)
    visibilityPrefix = '';
  else
  {
    for (var i = 0, prefix; prefix = prefixes[i]; i++)
      if (document[prefix + 'VisibilityState'])
        visibilityPrefix = prefix;
  }

  supported = visibilityPrefix !== undefined;


  //
  // addHandler/removeHandler 
  //

  function addHandler(handler, thisObject){
    if (!supported)
      return;

    addGlobalHandler();

    for (var i = handlers.length, item; i --> 0;)
    {
      item = handlers[i];
      if (item.handler === handler && item.thisObject === thisObject)
        return false;
    }

    return !!handlers.push({ 
      handler: handler,
      thisObject: thisObject
    });

  }

  function removeHandler(handler, thisObject){
    if (!supported)
      return;

    for (var i = handlers.length, item; i --> 0;)
    {
      item = handlers[i];
      if (item.handler === handler && item.thisObject === thisObject)
        return !!handlers.splice(i, 1);
    }

    return false;
  }

  function addGlobalHandler(){
    document.addEventListener(visibilityPrefix + 'visibilitychange', onVisibilityChangedHandler, false);
    addGlobalHandler = Function.$undef;
  }

  //
  // global handler
  // 
  function onVisibilityChangedHandler(){
    var visibilityState = getState();

    for (var i = 0, handler; handler = handlers[i]; i++)
    {
      for (var j in handler.handler)
      {
        if (j == visibilityState)
          handler.handler[j].call(handler.thisObject);
      }
    }
  }

  function getState(){
    return document[visibilityPrefix ? visibilityPrefix + 'VisibilityState' : 'visibilityState'] || 'visible';
  }


  //
  // export names
  //

  this.extend({
    addHandler: addHandler,
    removeHandler: removeHandler,
    getState: getState
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ua/visibility.js").call(basis.namespace("basis.ua.visibility"), basis.namespace("basis.ua.visibility"), basis.namespace("basis.ua.visibility").exports, this, __curLocation + "src/basis/ua/visibility.js", __curLocation + "src/basis/ua/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ua/" + url) });

//
// src/basis/dom.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.ua');


 /**
  * This namespace provides functions for manupulations with DOM - transerval,
  * node creation, moving and test nodes. Most of functions are compatible with
  * native and simulated (object that generaly has properties like firsChild,
  * lastChild, parentNode etc) DOM structures.
  *
  * Functions overview:
  * - Order & position functions:
  *     {basis.dom.comparePosition}
  * - Getters:
  *     {basis.dom.get}, {basis.dom.tag}, {basis.dom.axis}
  * - Traversal:
  *     {basis.dom.TreeWalker}
  * - Constructors:
  *     {basis.dom.createElement}, {basis.dom.createText},
  *     {basis.dom.createFragment}
  * - DOM manipulations:
  *     {basis.dom.insert}, {basis.dom.remove}, {basis.dom.replace},
  *     {basis.dom.swap}, {basis.dom.clone}, {basis.dom.clear}, {basis.dom.wrap}
  * - Attribute setters/getters:
  *     {basis.dom.setAttribute}
  * - Checkers:
  *     {basis.dom.parentOf}, {basis.dom.isInside}
  * - Input interface:
  *     {basis.dom.focus}, {basis.dom.setSelectionRange},
  *     {basis.dom.getSelectionStart}, {basis.dom.getSelectionEnd}
  * - Misc:
  *     {basis.dom.outerHTML}, {basis.dom.textContent}
  *
  * @namespace basis.dom
  */

  var namespace = this.path;

  // import names
  var coalesce = Object.coalesce;
  var document = global.document;
  var Class = basis.Class;

  // element for DOM support tests
  var testElement = document.createElement('div');

  // nodeType
  /** @const */ var ELEMENT_NODE = 1;
  /** @const */ var ATTRIBUTE_NODE = 2;
  /** @const */ var TEXT_NODE = 3;
  /** @const */ var CDATA_SECTION_NODE = 4;
  /** @const */ var ENTITY_REFERENCE_NODE = 5;
  /** @const */ var ENTITY_NODE = 6;
  /** @const */ var PROCESSING_INSTRUCTION_NODE = 7;
  /** @const */ var COMMENT_NODE = 8;
  /** @const */ var DOCUMENT_NODE = 9;
  /** @const */ var DOCUMENT_TYPE_NODE = 10;
  /** @const */ var DOCUMENT_FRAGMENT_NODE = 11;
  /** @const */ var NOTATION_NODE = 12;

  // axis
  /** @const */ var AXIS_ANCESTOR = 1;
  /** @const */ var AXIS_ANCESTOR_OR_SELF = 2;
  /** @const */ var AXIS_DESCENDANT = 4;
  /** @const */ var AXIS_DESCENDANT_OR_SELF = 8;
  /** @const */ var AXIS_SELF = 16;
  /** @const */ var AXIS_PARENT = 32;
  /** @const */ var AXIS_CHILD = 64;
  /** @const */ var AXIS_FOLLOWING = 128;
  /** @const */ var AXIS_FOLLOWING_SIBLING = 256;
  /** @const */ var AXIS_PRESCENDING = 512;
  /** @const */ var AXIS_PRESCENDING_SIBLING = 1024;

  // nodes compare support
  /** @const */ var POSITION_DISCONNECTED = 1;
  /** @const */ var POSITION_PRECENDING = 2;
  /** @const */ var POSITION_FOLLOWING = 4;
  /** @const */ var POSITION_CONTAINS = 8;
  /** @const */ var POSITION_CONTAINED_BY = 16;
  /** @const */ var POSITION_IMPLEMENTATION_SPECIFIC = 32;

  // directions
  var PARENT_NODE = 'parentNode';
  var FIRST_CHILD = 'firstChild';
  var LAST_CHILD = 'lastChild';
  var NEXT_SIBLING = 'nextSibling';
  var PREVIOUS_SIBLING = 'previousSibling';

  // insert position
  var INSERT_BEGIN = 'begin';
  var INSERT_END = 'end';
  var INSERT_BEFORE = 'before';
  var INSERT_AFTER = 'after';

 /**
  * Returns result of node comparation.
  * @function
  * @param {Node} nodeA
  * @param {Node} nodeB
  * @return {number}
  */ 
  var comparePosition;

  // init functions depends on browser support
  if (typeof testElement.compareDocumentPosition == 'function')
  {
    // W3C DOM sheme
    comparePosition = function(nodeA, nodeB){
      return nodeA.compareDocumentPosition(nodeB);
    };
  }
  else
  {
    // IE6-8 DOM sheme
    comparePosition = function(nodeA, nodeB){
      if (nodeA == nodeB)
        return 0;

      if (nodeA.document != nodeB.document)
        return POSITION_DISCONNECTED | POSITION_IMPLEMENTATION_SPECIFIC;
      
      if (nodeA.sourceIndex > nodeB.sourceIndex)
        return POSITION_PRECENDING | (POSITION_CONTAINS * nodeB.contains(childA));
      else
        return POSITION_FOLLOWING  | (POSITION_CONTAINED_BY * nodeA.contains(childB));
    };
  }

 /**
  * Returns true if node is instance of Node.
  * @param {Node} node
  * @return {boolean}
  */ 
  var isNode;

  if (typeof Node != 'undefined')
  {
    isNode = function(node){ return node instanceof Node };

    // add support for node.contains (generally for Firefox)
    if (!Node.prototype.contains)
    {
      Node.prototype.contains = function(node){
        return !!(this.compareDocumentPosition(node) & POSITION_CONTAINED_BY)
      }
    }
  }
  else
  {
    // IE6-IE8 version
    isNode = function(node){ return node && node.ownerDocument === document };
  }

 /**
  * Insert newNode into node. If newNode is instance of Node, it insert without change; otherwise it converts to TextNode.
  * @param {Node} node Target node
  * @param {Node|any} newNode Inserting node or object.
  * @param {Node} refChild Child of node.
  * @return {Node}
  */ 
  function handleInsert(node, newNode, refChild){
    if (newNode != null)
      return node.insertBefore(isNode(newNode) ? newNode : createText(newNode), refChild || null);
  }

  /**
  * Note: Tree nodes should have properties: parentNode, nextSibling, prevSibling, firstChild,
  * lastChild, nodeType
  * @class TreeWalker
  */
  var TreeWalker = Class(null, {
    className: namespace + '.TreeWalker',

   /**
    * Root node of tree.
    */
    root_: null,

   /**
    * Current position of walker.
    */
    cursor_: null,

   /**
    * Default filter function.
    * @type {function()}
    */
    filter: Function.$true,

   /**
    * @param {Node|object} root
    * @param {function(object):boolean} filter
    * @param {boolean} direction
    * @constructor
    */
    init: function(root, filter, direction){
      this.setRoot(root);
      this.setDirection(direction);

      if (typeof filter == 'function')
        this.filter = filter;
    },

   /**
    * @param {boolean} direction False for normal (forward) direction, true for backward direction.
    */
    setDirection: function(direction){
      Object.extend(this,
        direction
        ? {
            a: LAST_CHILD,        // nextChild  
            b: PREVIOUS_SIBLING,  // nextSibling
            c: NEXT_SIBLING,      // prevSibling
            d: FIRST_CHILD        // prevChild  
          }
        : {
            a: FIRST_CHILD,       // nextChild
            b: NEXT_SIBLING,      // nextSibling
            c: PREVIOUS_SIBLING,  // prevSibling
            d: LAST_CHILD         // prevChild
          }
      );
    },

   /**
    * Change root object.
    */
    setRoot: function(node){
      this.root_ = node || document;
      this.reset();
    },

   /**
    * Reset internal cursor to init state.
    */
    reset: function(){
      this.cursor_ = null;
    },

   /**
    * Returns first node.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    first: function(filter){
      this.reset();
      return this.next(filter);
    },

   /**
    * Returns last node.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    last: function(filter){
      this.reset();
      return this.prev(filter);
    },

   /**
    * Returns all nodes.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    nodes: function(filter, result){
      var node;

      if (!result)
        result = new Array();
      
      this.reset();
      
      while (node = this.next(filter))
        result.push(node);
      
      return result;
    },

   /**
    * Returns next node from cursor.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    next: function(filter){
      filter = filter || this.filter;

      var cursor = this.cursor_ || this.root_;

      do
      {
        var node = cursor[this.a]; // next child
        while (!node)
        {
          if (cursor === this.root_)
            return this.cursor_ = null;

          node = cursor[this.b]; // next sibling

          if (!node) 
            cursor = cursor[PARENT_NODE];
        }
      }
      while (!filter(cursor = node));

      return this.cursor_ = cursor;
    },

   /**
    * Returns previous node from cursor.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    prev: function(filter){
      filter = filter || this.filter;

      var cursor = this.cursor_;
      var prevSibling = this.c; // previous sibling
      var prevChild = this.d;   // previous child

      do
      {
        var node = cursor ? cursor[prevSibling] : this.root_[prevChild];
        if (node)
        {
          while (node[prevChild])
            node = node[prevChild];
          cursor = node;
        }
        else
          if (cursor)
            cursor = cursor[PARENT_NODE];

        if (!cursor || cursor === this.root_)
        { 
          cursor = null;
          break;
        }
      }
      while (!filter(cursor));

      return this.cursor_ = cursor;
    },
    destroy: function(){
      this.root_ = null;
      this.cursor_ = null;
    }
  });
  TreeWalker.BACKWARD = true;

  //
  // MISC
  //
 /**
  * Returns outerHTML for node, even for browser doesn't support this property (only IE support)
  * @param {Node} node
  * @param {boolean} noClone
  * @return {string}
  */
  function outerHTML(node, noClone){
    return node.outerHTML || createElement('', noClone ? node : node.cloneNode(true)).innerHTML;
  };

 /**
  * Returns all inner text of node (nodeValue for Attribute)
  * @param {Node} node
  * @return {string}
  */
  var TEXT_PROPERTIES = 'textContent innerText nodeValue'.qw();

  function textContent(node){
    for (var i = 0, property; property = TEXT_PROPERTIES[i++];)
      if (node[property] != null)
        return node[property];
    return axis(node, AXIS_DESCENDANT, function(node){ return node.nodeType == TEXT_NODE }).map(getter('nodeValue')).join('');
  };

  //
  // Node getters
  //

 /**
  * Returns node by id. This is $() like function
  * @param {string|Node} id
  * @return {Node}
  */
  function get(id){ 
    if (isNode(id) || (id && id.nodeType))
      return id;
    else
      return typeof id == 'string' ? document.getElementById(id) : null;
  };

 /**
  * Returns all descendant elements tagName name for node.
  * @param {string} tagName Tag name.
  * @param {Element} node Context element.
  * @return {[Element]}
  */
  function tag(node, tagName){
    node = get(node) || document;

    if (tagName == '*' && node.all)
      return Array.from(node.all);
    else
      return Array.from(node.getElementsByTagName(tagName || '*'));
  }

  //
  // Navigation
  //

 /**
  * Returns nodes axis in XPath like way.
  * @param {Node} root Relative point for axis.
  * @param {number} axis Axis constant.
  * @param {function(node):boolean} filter Filter function. If it's returns true node will be in result list.
  * @return {[Node]}
  */
  function axis(root, axis, filter){
    var walker, cursor;
    var result = new Array;

    filter = typeof filter == 'string' ? getter(filter) : filter || Function.$true;

    if (axis & (AXIS_SELF | AXIS_ANCESTOR_OR_SELF | AXIS_DESCENDANT_OR_SELF))
      if (filter(root))
        result.push(root);

    switch(axis)
    {
      case AXIS_ANCESTOR:
      case AXIS_ANCESTOR_OR_SELF:
        cursor = root;
        while ((cursor = cursor[PARENT_NODE]) && cursor !== root.document)
          if (filter(cursor))
            result.push(cursor);
      break;

      case AXIS_CHILD:
        cursor = root[FIRST_CHILD];
        while (cursor)
        {
          if (filter(cursor))
            result.push(cursor);
          cursor = cursor[NEXT_SIBLING];
        }
      break;

      case AXIS_DESCENDANT:
      case AXIS_DESCENDANT_OR_SELF:
        if (root[FIRST_CHILD])
        {
          walker = new TreeWalker(root);
          walker.nodes(filter, result);
        }
      break;

      case AXIS_FOLLOWING:
        walker = new TreeWalker(root, filter);
        walker.cursor_ = root[NEXT_SIBLING] || root[PARENT_NODE];
        while (cursor = walker.next())
          result.push(cursor);
      break;

      case AXIS_FOLLOWING_SIBLING:
        cursor = root;
        while (cursor = cursor[NEXT_SIBLING])
          if (filter(cursor))
             result.push(cursor);
      break;

      case AXIS_PARENT:
        if (filter(root[PARENT_NODE]))
          result.push(root[PARENT_NODE]);
      break;

      case AXIS_PRESCENDING:
        walker = new TreeWalker(root, filter, TreeWalker.BACKWARD);
        walker.cursor_ = root[PREVIOUS_SIBLING] || root[PARENT_NODE];
        while (cursor = walker.next())
          result.push(cursor);
      break;

      case AXIS_PRESCENDING_SIBLING:
        cursor = root;
        while (cursor = cursor[PREVIOUS_SIBLING])
          if (filter(cursor))
            result.push(cursor);
      break;
    }

    return result;
  }

 /**
  * Returns ancestor that matchFunction returns true for.
  * @param {Node} node Start node for traversal.
  * @param {function(node):boolean} matchFunction Checking function.
  * @param {Node=} bound Don't traversal after bound node.
  * @return {Node} First ancestor node that pass matchFunction.
  */
  function findAncestor(node, matchFunction, bound){
    while (node && node !== bound)
    {
      if (matchFunction(node))
        return node;

      node = node.parentNode;
    }
  }

  //
  // DOM constructors
  //

 /**
  * Creates a new TextNode with text as content (nodeValue).
  * @param {string} text Content.
  * @return {!Text} The new text node.
  */
  function createText(text){
    return document.createTextNode(text != null ? text : '');
  }

 /**
  * Returns new DocumentFragmentNode with arguments as childs.
  * @param {string} text 
  * @return {!DocumentFragment} The new DocumentFragment
  */
  function createFragment(){
    var result = document.createDocumentFragment();
    var len = arguments.length;
    var array = createFragment.array = new Array;
    for (var i = 0; i < len; i++)
      array.push(handleInsert(result, arguments[i]));
    return result;
  }

 /**
  * Using by createElement. Check if browser (Internet Explorer 6 & 7) has problem with name attribute.
  * @type {boolean}
  * @privare
  */
  var IS_ATTRIBUTE_BUG_NAME = (function(){
    var input = document.createElement('input');
    input.name = 'a';
    return !/name/.test(outerHTML(input));
  })();

 /**
  * Using by createElement. Check if browser (Internet Explorer 6 & 7) has problem with value setting for style attribute.
  * @type {boolean}
  * @privare
  */
  var IS_ATTRIBUTE_BUG_STYLE = (function(){
    testElement.setAttribute('style', 'color: red');
    return testElement.style.color !== 'red';
  })();

 /**
  * Using by createElement.
  * @type {RegExp}
  * @private
  */
  var DESCRIPTION_PART_REGEXP = /#([a-z0-9\_\-\:]+)|\.([a-z0-9\_\-\:]+)|\[([a-z0-9\_\-:]+)(="((?:\\.|[^"])*)"|='((?:\\.|[^'])*)'|=((?:\\.|[^\]])*))?\s*\]|\s*(\S)/gi;

 /**
  * Creates a new Element with arguments as childs.
  * @param {string|object} def CSS-selector like definition or object for extended Element creation.
  * @param {...Node|object} childs Child nodes 
  * @return {!Element} The new Element.
  */
  function createElement(config, childs){
    var isConfig = config != undefined && typeof config != 'string';
    var description = (isConfig ? config.description : config) || '';

    var elementName = 'div'; // modern browsers become case sensetive for tag names for xhtml
    var element;
    
    // fetch tag name
    var m = description.match(/^([a-z0-9\_\-]+)(.*)$/i);
    if (m)
    {
      elementName = m[1];
      description = m[2];
    }

    // create an element

    if (description != '')
    {
      // extract properties
      var classNames = new Array();
      var attributes = {};
      var entryName;

      while (m = DESCRIPTION_PART_REGEXP.exec(description))
      {
        if (m[8])
        {
          throw new Error(
            'Create element error in basis.dom.createElement()' +
            '\n\nDescription:\n> ' + description + 
            '\n\nProblem place:\n> ' + description.substr(0, m.index) + '-->' + description.substr(m.index) + '<--'
          );
        }

        entryName = m[1] || m[2] || m[3];

        if (m[1])     // id
          attributes.id = entryName;
        else
          if (m[2])   // class
            classNames.push(entryName);
          else
          {           // attribute
            if (entryName != 'class')
              attributes[entryName] = m[4] ? m[5] || m[6] || m[7] || '' : entryName;
          }
      }

      // create element
      if (IS_ATTRIBUTE_BUG_NAME && attributes.name && /^(input|textarea|select)$/i.test(elementName))
        elementName = '<' + elementName + ' name=' + attributes.name + '>';
    }
      
    // create element
    element = document.createElement(elementName);

    // set attributes
    if (attributes)
    {
      if (attributes.style && IS_ATTRIBUTE_BUG_STYLE)
        element.style.cssText = attributes.style;

      for (var attrName in attributes)
        element.setAttribute(attrName, attributes[attrName], 0);
    }

    // set css classes
    if (classNames && classNames.length)
      element.className = classNames.join(' ');

    // append child nodes
    if (arguments.length > 1)
      handleInsert(element, createFragment.apply(0, Array.from(arguments, 1).flatten()));

    // attach event handlers
    if (isConfig)
    {
      if (config.css && basis.cssom)
        basis.cssom.setStyle(element, config.css);

      // NOTE: full path for basis.dom.event here, because basis.dom.event will be available
      // after basis.dom load
      if (basis.dom.event)
      {
        for (var event in config)
          if (typeof config[event] == 'function')
            basis.dom.event.addHandler(element, event, config[event], element);
          else
            if (config[event] instanceof basis.dom.event.Handler)
              basis.dom.event.addHandler(element, event, config[event].handler, config[event].thisObject);
      }
    }

    // return an element
    return element;
  }

  //
  // DOM manipulations
  //

 /**
  * Insert source into specified insertPoint position of node.
  * @param {Node|object} node Destination node.
  * @param {Node|[Node]|object|[object]} source One or more nodes to be inserted.
  * @param {string|number} insertPoint
  *   If number that's mean position in nodes childNodes.
  *   Or it might be one of INSERT_BEGIN, INSERT_BEFORE,
  *   INSERT_AFTER, INSERT_END
  * @param {Node|object} refChild Child node of node, using for INSERT_BEFORE & INSERT_AFTER
  * @return {Node|[Node]} Inserted nodes (may different of source members). 
  */
  function insert(node, source, insertPoint, refChild){
    node = get(node); // TODO: remove

    if (!node)
      throw new Error('basis.dom.insert: destination node can\'t be null');

    switch (insertPoint) {
      case undefined: // insertPoint omited
      case INSERT_END:
        refChild = null;
      break;
      case INSERT_BEGIN:
        refChild = node[FIRST_CHILD];
      break;
      case INSERT_BEFORE:
      break;
      case INSERT_AFTER:
        refChild = refChild[NEXT_SIBLING];
      break;
      default:
        refChild = Number(insertPoint).between(0, node.childNodes.length) ? node.childNodes[insertPoint] : null;
    }

    var isDOMLikeObject = !isNode(node);
    var result;
    
    if (!source || !Array.isArray(source))
      result = isDOMLikeObject ? source && node.insertBefore(source, refChild) : handleInsert(node, source, refChild);
    else
    {
      if (isDOMLikeObject)
      {
        result = new Array();
        for (var i = 0, len = source.length; i < len; i++)
          result[i] = node.insertBefore(source[i], refChild);
      }
      else
      {
        node.insertBefore(createFragment.apply(0, source), refChild);
        result = createFragment.array;
      }
    }

    return result;
  };

 /**
  * Remove node from it's parent and returns this node.
  * @param {Node} node
  * @return {Node}
  */
  function remove(node){
    return node[PARENT_NODE] ? node[PARENT_NODE].removeChild(node) : node;
  }

 /**
  * Replace oldNode for newNode and returns oldNode.
  * @param {Node} oldNode
  * @param {Node} newNode
  * @return {Node}
  */
  function replace(oldNode, newNode){
    return oldNode[PARENT_NODE] ? oldNode[PARENT_NODE].replaceChild(newNode, oldNode) : oldNode;
  }

 /**
  * Change placing of nodes and returns the result of operation.
  * @param {Node} nodeA
  * @param {Node} nodeB
  * @return {boolean}
  */
  function swap(nodeA, nodeB){
    if (nodeA === nodeB || comparePosition(nodeA, nodeB) & (POSITION_CONTAINED_BY | POSITION_CONTAINS | POSITION_DISCONNECTED))
      return false;

    replace(nodeA, testElement);
    replace(nodeB, nodeA);
    replace(testElement, nodeB)

    return true;
  }

 /**
  * Clone node.
  * @param {Node} node
  * @param {boolean} noChildren If true than clone only node with no children.
  * @return {Node}
  */
  function clone(node, noChildren){
    var result = node.cloneNode(!noChildren);
    if (result.attachEvent) // clear event handlers for IE
      axis(result, AXIS_DESCENDANT_OR_SELF).forEach(Event.clearHandlers);
    return result;
  }

 /**
  * Removes all child nodes of node and returns this node.
  * @param {Node} node
  * @return {Node}
  */
  function clear(node){
    node = get(node);
  
    while (node[LAST_CHILD])
      node.removeChild(node[LAST_CHILD]);
    
    return node;
  }

 /**
  * Wrap array items into elements according to map.
  * @example
  *   basis.dom.wrap([1,2,3,4,5], { 'SPAN.match': function(val, idx){ return idx % 2 } });
  *   // result: [1, <span class="match">2</span>, 3, <span class="match">4</span>, 5]
  *
  *   basis.dom.wrap([1,2,3], { A: Function.$true, B: function(val, idx){ return val == 3 } });
  *   // result: [<a>1</a>, <a>2</a>, <b><a>3</a></b>]
  * @param {[any]} array
  * @param {object} map
  * @return {[any]}
  */
  function wrap(array, map, getter){
    var result = [];
    getter = Function.getter(getter || Function.$self);
    for (var k in map)
      for (var i = 0; i < array.length; i++)
      {
        var value = getter(array[i]);
        result[i] = map[k](array[i], i, value) ? createElement(k, value) : array[i];
      }
    return result;
  }

  //
  // Attributes
  //

 /**
  * Set new value for attribute. If value is null than attribute will be deleted.
  * @param {Node} node
  * @param {string} name
  * @param {any} value
  */
  function setAttribute(node, name, value){
    if (value == null)
      node.removeAttribute(name);
    else
      node.setAttribute(name, value)
  }

  //
  // Checkers
  //

  function is(element, names){ // names may be a string (comma or space separated tag names) or an array
    return (new RegExp('(^|\\W)' + element.tagName + '(\\W|$)')).test(names);
  }

 /**
  * Returns true if child is descendant of parent.
  * @param {Node} node
  * @param {Node} child
  * @return {boolean}
  */
  function parentOf(node, child){
    return node.contains(child);
  }

 /**
  * Returns true if node is decendant of parent or node equal to parent.
  * @param {Node} node
  * @param {Node} root
  * @return {Node}
  */
  function isInside(node, root){
    return node == root || root.contains(node);
  }

  //
  // Input selection stuff
  //

 /**
  * Set focus for node.
  * @param {Node} node
  * @param {boolean} select Call select() method of node.
  */
  function focus(node, select){
    // try catch block here because browsers throw unexpected exeption in some cases
    try {
      node = get(node);
      node.focus();
      if (select && node.select) // && typeof node.select == 'function'
                                 // temporary removed because IE returns 'object' for DOM object methods, instead of 'function'
        node.select();
    } catch(e) {}
  };

  // Input text selection
  // Original code of Mihai Bazon, 2006
  // http://www.bazon.net/mishoo/
  function setSelectionRange(input, start, end){
    if (arguments.length < 3)
      end = start;

    if (input.setSelectionRange)
      input.setSelectionRange(start, end);
    else
      if (input.createTextRange)
      {
        // IE
        var range = input.createTextRange();
        range.collapse(true);
        range.moveStart("character", start);
        range.moveEnd("character", end - start);
        range.select();
      }
  }

  function ieGetInputPosition(isStart){
    if (document.selection)
    {
      var range = document.selection.createRange();
      if (range.compareEndPoints("StartToEnd", range) != 0)
        range.collapse(isStart);
      return range.getBookmark().charCodeAt(2) - 2;
    }
  }

  function getSelectionStart(input){
    if (typeof input.selectionStart != 'undefined')
      return input.selectionStart;
    else
      return ieGetInputPosition(true);
  }

  function getSelectionEnd(input){
    if (typeof input.selectionEnd != 'undefined')
      return input.selectionEnd;
    else
      return ieGetInputPosition(false);
  }


  //
  // export names
  //

  this.extend({
    // CONST

    // nodeType
    ELEMENT_NODE: ELEMENT_NODE,
    ATTRIBUTE_NODE: ATTRIBUTE_NODE,
    TEXT_NODE: TEXT_NODE,
    CDATA_SECTION_NODE: CDATA_SECTION_NODE,
    ENTITY_REFERENCE_NODE: ENTITY_REFERENCE_NODE,
    ENTITY_NODE: ENTITY_NODE,
    PROCESSING_INSTRUCTION_NODE: PROCESSING_INSTRUCTION_NODE,
    COMMENT_NODE: COMMENT_NODE,
    DOCUMENT_TYPE_NODE: DOCUMENT_TYPE_NODE,
    DOCUMENT_NODE: DOCUMENT_NODE,
    DOCUMENT_FRAGMENT_NODE: DOCUMENT_FRAGMENT_NODE,
    NOTATION_NODE: NOTATION_NODE,

    // axis
    AXIS_ANCESTOR: AXIS_ANCESTOR,
    AXIS_ANCESTOR_OR_SELF: AXIS_ANCESTOR_OR_SELF,
    AXIS_DESCENDANT: AXIS_DESCENDANT,
    AXIS_DESCENDANT_OR_SELF: AXIS_DESCENDANT_OR_SELF,
    AXIS_SELF: AXIS_SELF,
    AXIS_PARENT: AXIS_PARENT,
    AXIS_CHILD: AXIS_CHILD,
    AXIS_FOLLOWING: AXIS_FOLLOWING,
    AXIS_FOLLOWING_SIBLING: AXIS_FOLLOWING_SIBLING,
    AXIS_PRESCENDING: AXIS_PRESCENDING,
    AXIS_PRESCENDING_SIBLING: AXIS_PRESCENDING_SIBLING,

    // insert position
    INSERT_BEGIN: INSERT_BEGIN,
    INSERT_END: INSERT_END,
    INSERT_BEFORE: INSERT_BEFORE,
    INSERT_AFTER: INSERT_AFTER, 

    // nodes order functions
    //sort: sort,
    //comparePosition: comparePosition,

    // Classes
    TreeWalker: TreeWalker,

    // MISC
    outerHTML: outerHTML,
    textContent: textContent,

    // getters
    get: get,
    tag: tag,
    //tags: tags,
    axis: axis,
    findAncestor: findAncestor,
    
    // navigation
    //first: first,
    //last: last,
    //next: next,
    //prev: prev,
    //parent: parent,

    // node position
    //index: index,
    //lastIndex: lastIndex,
    //deep: deep,

    // DOM constructors
    createElement: createElement,
    createText: createText,
    createFragment: createFragment,
    
    // DOM manipulate
    insert: insert,
    remove: remove,
    replace: replace,
    swap: swap,
    clone: clone,
    clear: clear,
    wrap: wrap,

    // attributes
    setAttribute: setAttribute,

    // checkers
    //IS_ELEMENT_NODE: IS_ELEMENT_NODE,
    //IS_TEXT_NODE: IS_TEXT_NODE,
    //is: is,
    parentOf: parentOf,
    isInside: isInside,

    // input selection stuff
    focus: focus,
    setSelectionRange: setSelectionRange,
    getSelectionStart: getSelectionStart,
    getSelectionEnd: getSelectionEnd
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/dom.js").call(basis.namespace("basis.dom"), basis.namespace("basis.dom"), basis.namespace("basis.dom").exports, this, __curLocation + "src/basis/dom.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/dom/event.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.dom');


 /**
  * @namespace basis.dom.event
  */

  var namespace = this.path;

  // for better pack

  var document = global.document;
  var dom = basis.dom;
  var $null = Function.$null;

  var W3CSUPPORT = !!document.addEventListener;

  //
  // Const
  //

  var EVENT_HOLDER = '__basisEvents';

  var KEY = {
    BACKSPACE: 8,
    TAB: 9,
    CTRL_ENTER: 10,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    ESCAPE: 27,
    SPACE: 32,
    PAGEUP: 33,
    PAGEDOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    INSERT: 45,
    DELETE: 46,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123
  };

  var MOUSE_LEFT = {
    VALUE: 1,
    BIT:   1
  };
  var MOUSE_MIDDLE = {
    VALUE: 2,
    BIT:   4
  };
  var MOUSE_RIGHT = {
    VALUE: 3,
    BIT:   2
  };

  var BROWSER_EVENTS = {
    mousewheel: ['mousewheel', 'DOMMouseScroll']
  };

 /**
  * 
  */
  function browserEvents(eventName){
    return BROWSER_EVENTS[eventName] || [eventName];
  }

 /**
  * Function wraper with thisObject as context.
  * @class
  */
  var Handler = function(handler, thisObject){
    this.handler = handler;
    this.thisObject = thisObject;
  };

 /**
  * Cross-browser event wrapper.
  * @param {Event} event
  * @return {Event}
  */
  function wrap(event){
    return event || global.event;
  }

 /**
  * Returns DOM node if possible.
  * @param {Node|string} object
  * @return {Node}
  */
  function getNode(object){ 
    return typeof object == 'string' ? dom.get(object) : object;
  }

 /**
  * Returns event sender (target element).
  * @param {Event} event
  * @return {Node}
  */
  function sender(event){
    event = wrap(event);

    return event.target || event.srcElement;
  }

 /**
  * Stops event bubbling.
  * @param {Event} event
  */
  function cancelBubble(event){
    event = wrap(event);

    if (event.stopPropagation) 
      event.stopPropagation();
    else
      event.cancelBubble = true;
  }

 /**
  * Prevents default actions for event.
  * @param {Event} event
  */
  function cancelDefault(event){
    event = wrap(event);

    if (event.preventDefault) 
      event.preventDefault();
    else
      event.returnValue = false;
  }

 /**
  * Stops event bubbling and prevent default actions for event.
  * @param {Event|string} event
  * @param {Node} node
  */
  function kill(event, node){
    node = getNode(node);

    if (node)
      addHandler(node, event, kill);
    else
    {
      cancelDefault(event);
      cancelBubble(event);
    }
  }

 /**
  * Returns key code for keyboard events.
  * @param {Event} event
  * @return {number}
  */
  function key(event){
    event = wrap(event);

    return event.keyCode || event.which || 0;
  }

 /**
  * Returns char for keyboard events.
  * @param {Event} event
  * @return {number}
  */
  function charCode(event){
    event = wrap(event);
  
    return event.charCode || event.keyCode || 0;
  }

 /**
  * Checks if pressed mouse button equal to desire mouse button.
  * @param {Event} event
  * @param {object} button One of MOUSE constant
  * @return {boolean}
  */
  function mouseButton(event, button){
    event = wrap(event);

    if (typeof event.which == 'number')
      // DOM scheme
      return event.which == button.VALUE;
    else
      // IE6-8
      return event.button & button.BIT;
  }

 /**
  * Returns mouse click horizontal page coordinate.
  * @param {Event} event
  * @return {number}
  */
  function mouseX(event){
    event = wrap(event);

    if (event.changedTouches)               // touch device
      return event.changedTouches[0].pageX;
    else
      if ('pageX' in event)                 // all others
        return event.pageX;
      else                                  
        return event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
  }

 /**
  * Returns mouse click vertical page coordinate.
  * @param {Event} event
  * @return {number}
  */
  function mouseY(event){
    event = wrap(event);

    if (event.changedTouches)             // touch device
      return event.changedTouches[0].pageY;
    else                                  // all others
      if ('pageY' in event)
        return event.pageY;
      else                                  
        return event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
  }

 /**
  * Returns mouse wheel delta.
  * @param {Event} event
  * @return {number} -1, 0, 1
  */
  function wheelDelta(event){
    event = wrap(event);

    if ('wheelDelta' in event) 
      return event.wheelDelta / 120; // IE, webkit, opera
    else
      if (event.type == 'DOMMouseScroll')
        return -event.detail / 3;    // gecko
      else
        return 0;                  // not a mousewheel event
  }

  //
  // Global events
  //

 /**
  * Global events storage.
  * @private
  */
  var globalHandlers = {};

 /**
  * There is another global events sheme for browser doesn't support for event capture phase (generaly old IE).
  * @private
  * @const
  */
  var noCaptureSheme = !document.addEventListener;

 /**
  * Observe handlers for event
  * @private
  * @param {Event} event
  */
  function observeGlobalEvents(event){
    var handlers = Array.from(globalHandlers[event.type]);

    if (handlers)
    {
      for (var i = handlers.length; i --> 0;)
      {
        var handlerObject = handlers[i];
        handlerObject.handler.call(handlerObject.thisObject, event);
      }
    }
  };

 /**
  * Adds global handler for some event type.
  * @param {string} eventType
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  function addGlobalHandler(eventType, handler, thisObject){
    var handlers = globalHandlers[eventType];
    if (handlers)
    {
      // search for similar handler, returns if found (prevent for handler dublicates)
      for (var i = handlers.length; i --> 0;)
      {
        var handlerObject = handlers[i];
        if (handlerObject.handler === handler && handlerObject.thisObject === thisObject)
          return;
      }
    }
    else
    {
      if (noCaptureSheme)
        // nothing to do, but it will provide observeGlobalEvents calls if other one doesn't
        addHandler(document, eventType, $null);
      else
        document.addEventListener(eventType, observeGlobalEvents, true);

      handlers = globalHandlers[eventType] = new Array();
    }

    // add new handler
    handlers.push({
      handler: handler,
      thisObject: thisObject
    });
  };

 /**
  * Removes global handler for eventType storage.
  * @param {string} eventType
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  function removeGlobalHandler(eventType, handler, thisObject){
    var handlers = globalHandlers[eventType];
    if (handlers)
    {
      for (var i = 0, item; item = handlers[i]; i++)
      {
        if (item.handler === handler && item.thisObject === thisObject)
        {
          handlers.splice(i, 1);

          if (!handlers.length)
          {
            delete globalHandlers[eventType];
            if (noCaptureSheme)
              removeHandler(document, eventType, $null);
            else
              document.removeEventListener(eventType, observeGlobalEvents, true);
          }

          return;
        }
      }
    }
  };

  //
  //  common event handlers
  //

 /**
  * Adds handler for node for eventType events.
  * @param {Node|string} node
  * @param {string} eventType
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  function addHandler(node, eventType, handler, thisObject){
    node = getNode(node);

    if (!node)
      throw 'basis.event.addHandler: can\'t attach event listener to undefined';

    if (typeof handler != 'function')
      throw 'basis.event.addHandler: handler is not a function';

    if (!node[EVENT_HOLDER])
      node[EVENT_HOLDER] = {};

    // event handler
    var handlerObject = {
      handler: handler,
      thisObject: thisObject
    };
      
    var handlers = node[EVENT_HOLDER];
    var eventTypeHandlers = handlers[eventType];
    if (!eventTypeHandlers)
    {
      eventTypeHandlers = handlers[eventType] = [handlerObject];
      eventTypeHandlers.fireEvent = function(event){ // closure
        // simulate capture phase for old browsers
        event = wrap(event);
        if (noCaptureSheme && event && globalHandlers[eventType])
        {
          if (typeof event.returnValue == 'undefined')
          {
            observeGlobalEvents(event);
            if (event.cancelBubble === true)
              return;
            if (typeof event.returnValue == 'undefined')
              event.returnValue = true;
          }
        }

        // call eventType handlers
        for (var i = 0, item; item = eventTypeHandlers[i++];)
          item.handler.call(item.thisObject, event);
      };

      if (node.addEventListener) 
        // W3C DOM event model
        node.addEventListener(eventType, eventTypeHandlers.fireEvent, false);
      else 
        // old IE event model
        node.attachEvent('on' + eventType, eventTypeHandlers.fireEvent);
    }
    else
    {
      // check for dublicates, exit if found
      for (var i = 0, item; item = eventTypeHandlers[i]; i++)
        if (item.handler === handler && item.thisObject === thisObject)
          return;

      // add only unique handlers
      eventTypeHandlers.push(handlerObject);
    }
  };

 /**
  * Adds multiple handlers for node.
  * @param {Node|string} node
  * @param {object} handlers
  * @param {object=} thisObject Context for handlers
  */
  function addHandlers(node, handlers, thisObject){
    node = getNode(node);

    for (var eventType in handlers)
      addHandler(node, eventType, handlers[eventType], thisObject);
  };

 /**
  * Removes handler from node's handler holder.
  * @param {Node|string} node
  * @param {sting} eventType
  * @param {object} handler
  * @param {object=} thisObject Context for handlers
  */
  function removeHandler(node, eventType, handler, thisObject){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
    if (handlers)
    {
      var eventTypeHandlers = handlers[eventType];
      if (eventTypeHandlers)
      {
        for (var i = 0, item; item = eventTypeHandlers[i]; i++)
        {
          if (item.handler === handler && item.thisObject === thisObject)
          {
            // delete event handler
            eventTypeHandlers.splice(i, 1);

            // if there is no more handler for this event, clear it
            if (!eventTypeHandlers.length)
              clearHandlers(node, eventType);

            return;
          }
        }
      }
    }
  };

 /**
  * Removes all node's handlers for eventType. If eventType omited, all handlers for all eventTypes will be deleted.
  * @param {Node|string} node
  * @param {string} eventType
  */
  function clearHandlers(node, eventType){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
    if (handlers)
    {
      if (typeof eventType != 'string')
      {
        // no eventType - delete handlers for all events
        for (eventType in handlers)
          clearHandlers(node, eventType);
      }
      else
      {
        // delete eventType handlers
        var eventTypeHandlers = handlers[eventType];
        if (eventTypeHandlers)
        {
          if (node.removeEventListener) 
            node.removeEventListener(eventType, eventTypeHandlers.fireEvent, false);
          else
            node.detachEvent('on' + eventType, eventTypeHandlers.fireEvent);

          delete handlers[eventType];
        }
      }
    }
  };

 /**
  * Fires eventType 
  */
  function fireEvent(node, eventType, event){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
    if (handlers && handlers[eventType])
        handlers[eventType].fireEvent(event);
  };

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

    function fireHandlers(e){
      if (!fired++)
        for (var i = 0; i < loadHandler.length; i++)
          loadHandler[i].callback.call(loadHandler[i].thisObject);
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

    if (typeof window != 'undefined')
    {
      if (W3CSUPPORT)
      {
        // use the real event for browsers that support it (all modern browsers support it)
        addHandler(document, "DOMContentLoaded", fireHandlers);
      }
      else
      {
        // ensure firing before onload,
  			// maybe late but safe also for iframes
        addHandler(document, "readystatechange", fireHandlers);

        // If IE and not a frame
  			// continually check to see if the document is ready
  			try {
  				if (window.frameElement == null && document.documentElement.doScroll)
            doScrollCheck();
  			} catch(e) {
  			}
      }

      // A fallback to window.onload, that will always work
      addHandler(global, "load", fireHandlers);
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
      {
        ;;;if (typeof console != 'undefined') console.warn('Event.onLoad(): Can\'t attach handler to onload event, because it\'s already fired!');
      }
    }
  })();

 /**
  * Attach unload handlers for page
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  function onUnload(handler, thisObject){ 
    addHandler(global, 'unload', handler, thisObject);
  }


  //
  // Event tests
  //

  var tagNameEventMap = {};

 /**
  * @param {string} eventName
  * @param {string?} tagName
  * @func
  */
  function getEventInfo(eventName, tagName){
    if (!tagName)
      tagName = 'div';

    var id = tagName + '-' + eventName;

    if (tagNameEventMap[id])
      return tagNameEventMap[id];
    else
    {
      var supported = false;
      var bubble = false;

      if (!W3CSUPPORT)
      {
        var onevent = 'on' + eventName;
        var target = dom.createElement(tagName);
        var host = dom.createElement('div', target);

        host[onevent] = function(){ bubble = true; };

        try {
          target.fireEvent(onevent);
          supported = true;
        } catch(e){
          // if exception event doesn't support
        }
      }
      
      return tagNameEventMap[id] = {
        supported: supported,
        bubble: bubble
      }
    }
  }


  //
  // export names
  //

  this.setWrapper(wrap);
  this.extend({
    W3CSUPPORT: W3CSUPPORT,

    KEY: KEY,

    MOUSE_LEFT: MOUSE_LEFT,
    MOUSE_RIGHT: MOUSE_RIGHT,
    MOUSE_MIDDLE: MOUSE_MIDDLE,

    browserEvents: browserEvents,

    Handler: Handler,

    sender: sender,

    cancelBubble: cancelBubble,
    cancelDefault: cancelDefault,
    kill: kill,

    key: key,
    charCode: charCode,
    mouseButton: mouseButton,
    mouseX: mouseX,
    mouseY: mouseY,
    wheelDelta: wheelDelta,

    addGlobalHandler: addGlobalHandler,
    removeGlobalHandler: removeGlobalHandler,

    addHandler: addHandler,
    addHandlers: addHandlers,
    removeHandler: removeHandler,
    clearHandlers: clearHandlers,
    
    fireEvent: fireEvent,

    onLoad: onLoad,
    onUnload: onUnload,

    getEventInfo: getEventInfo
  });

  basis.namespace('basis.dom').extend({
    ready: onLoad
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/dom/event.js").call(basis.namespace("basis.dom.event"), basis.namespace("basis.dom.event"), basis.namespace("basis.dom.event").exports, this, __curLocation + "src/basis/dom/event.js", __curLocation + "src/basis/dom/", basis, function(url){ return basis.resource(__curLocation + "src/basis/dom/" + url) });

//
// src/basis/data.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');


 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Const:
  *   {basis.data.STATE}, {basis.data.SUBSCRIPTION}
  * - Classes:
  *   {basis.data.DataObject}, {basis.data.KeyObjectMap},
  *   {basis.data.AbstractDataset}, {basis.data.Dataset}
  *
  * @namespace basis.data
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var values = Object.values;
  var $self = Function.$self;

  var EventObject = basis.event.EventObject;
  var LISTEN = basis.event.LISTEN;
  var createEvent = basis.event.create;
  var events = basis.event.events;


  //
  // Main part
  //

  var NULL_OBJECT = {};
  var EMPTY_ARRAY = [];


  //
  // State scheme
  //

  var STATE_EXISTS = {};

 /**
  * @enum {string}
  */
  var STATE = {
    PRIORITY: [],

   /**
    * Registrate new state
    */
    add: function(state, order){
      var name = state.toUpperCase();
      var value = state.toLowerCase();

      this[name] = value;
      STATE_EXISTS[value] = name;

      if (order)
        order = this.PRIORITY.indexOf(order);
      else
        order = -1;

      if (order == -1)
        this.PRIORITY.push(value)
      else
        this.PRIORITY.splice(order, 0, value);
    },

    getList: function(){
      return Object.values(STATE_EXISTS);
    }
  };

  // Registrate base states

  STATE.add('READY');
  STATE.add('DEPRECATED');
  STATE.add('UNDEFINED');
  STATE.add('ERROR');
  STATE.add('PROCESSING');


  //
  // Subscription sheme
  //

  var subscriptionHandlers = {};
  var subscriptionSeed = 1;

 /**
  * @enum {number}
  */
  var SUBSCRIPTION = {
    NONE: 0,
    ALL: 0,

   /**
    * Registrate new type of subscription
    * @param {string} name
    * @param {Object} handler
    * @param {function()} action
    */
    add: function(name, handler, action){
      subscriptionHandlers[subscriptionSeed] = {
        handler: handler,
        action: action,
        context: {
          add: function(thisObject, object){
            if (object)
            {
              var subscriberId = SUBSCRIPTION[name] + '_' + thisObject.eventObjectId;

              if (!object.subscribers_)
                object.subscribers_ = {};

              if (!object.subscribers_[subscriberId])
              {
                var oldSubscriberCount = object.subscriberCount;
                object.subscribers_[subscriberId] = thisObject;
                object.subscriberCount += 1;
                object.event_subscribersChanged(object, oldSubscriberCount);
              }
              else
              {
                ;;;console.warn('Attempt to add dublicate subscription');
              }
            }
          },
          remove: function(thisObject, object){
            if (object)
            {
              var subscriberId = SUBSCRIPTION[name] + '_' + thisObject.eventObjectId;
              if (object.subscribers_[subscriberId])
              {
                var oldSubscriberCount = object.subscriberCount;
                delete object.subscribers_[subscriberId];
                object.subscriberCount -= 1;
                object.event_subscribersChanged(object, oldSubscriberCount);
              }
              else
              {
                ;;;console.warn('Trying remove non-exists subscription');
              }
            }
          }
        }
      };

      SUBSCRIPTION[name] = subscriptionSeed;
      SUBSCRIPTION.ALL |= subscriptionSeed;

      subscriptionSeed <<= 1;
    }
  };

 /**
  * Apply subscription according with current state.
  * For internal purposes only.
  */
  function applySubscription(object, mask, state){
    var idx = 1;
    var config;

    while (mask)
    {
      if (mask & 1)
      {
        config = subscriptionHandlers[idx];
        if (state & idx)
        {
          object.addHandler(config.handler, config.context);
          config.action(config.context.add, object);
        }
        else
        {
          object.removeHandler(config.handler, config.context);
          config.action(config.context.remove, object);
        }
      }
        
      mask >>= 1;
      idx <<= 1;
    }
  }

  // Registrate base subscription types

  SUBSCRIPTION.add(
    'DELEGATE',
    {
      delegateChanged: function(object, oldDelegate){
        this.remove(object, oldDelegate);
        this.add(object, object.delegate);
      }
    },
    function(action, object){
      action(object, object.delegate);
    }
  );

  SUBSCRIPTION.add(
    'TARGET',
    {
      targetChanged: function(object, oldTarget){
        this.remove(object, oldTarget);
        this.add(object, object.target);
      }
    },
    function(action, object){
      action(object, object.target);
    }
  );

  //
  // reg new type of listen
  //

  LISTEN.add('delegate', 'delegateChanged');
  LISTEN.add('target', 'targetChanged');


  //
  // DataObject
  //

 /**
  * Base class for data storing.
  * @class
  */
  var DataObject = Class(EventObject, {
    className: namespace + '.DataObject',

   /**
    * State of object. Might be managed by delegate object (if used).
    * @type {basis.data.STATE|string}
    */
    state: STATE.READY,

   /**
    * Using for data storing. Might be managed by delegate object (if used).
    * @type {Object}
    */
    data: null,

   /**
    * @type {boolean}
    */
    canHaveDelegate: true,

   /**
    * Object that manage data updates if assigned.
    * @type {basis.data.DataObject}
    */
    delegate: null,

   /**
    * Root of delegate chain. By default and when no delegate, it points to object itself.
    * @type {basis.data.DataObject}
    * @readonly
    */
    root: null,

   /**
    * Flag determines object behaviour when assigned delegate is destroing:
    * - true - destroy object on delegate object destroing (cascade destroy)
    * - false - don't destroy object, detach delegate only
    * @type {boolean}
    */
    cascadeDestroy: false,

   /**
    * Flag to determine is this object target object or not. This property
    * is readonly and can't be changed after init.
    * @type {boolean}
    * @readobly
    */
    isTarget: false,

   /**
    * Reference to root delegate if some object in delegate chain marked as targetPoint.
    * @type {basis.data.DataObject}
    * @readonly
    */
    target: null,

   /**
    * Indicates if object influences to related objects or not (is
    * subscription on).
    * @type {boolean}
    */
    active: false,

   /**
    * Subscriber type indicates what sort of influence has current object on
    * related objects (delegate, source, dataSource etc).
    * @type {basis.data.SUBSCRIPTION|number}
    */
    subscribeTo: SUBSCRIPTION.DELEGATE + SUBSCRIPTION.TARGET,

   /**
    * Count of subscribed objects. This property can use to determinate
    * is data update necessary or not. Usualy if object is in UNDEFINED
    * or DEPRECATED state and subscriberCount more than zero - update needed.
    * @type {number}
    * @readonly
    */
    subscriberCount: 0,

   /**
    * Subscribers list. Using to prevent subscriber dublicate count.
    * @type {Object}
    * @private
    */
    subscribers_: null,

   /**
    * Fires on data changes.
    * @param {basis.data.DataObject} object Object which data property
    * was changed. Usually it is root of delegate chain.
    * @param {object} delta Delta of changes. Keys in delta are property
    * names that was changed, and values is previous value of property
    * (value of property before changes).
    * @event
    */
    event_update: createEvent('update', 'object', 'delta'),

   /**
    * Fires when state or state.data was changed.
    * @param {basis.data.DataObject} object Object which state was changed.
    * @param {object} oldState Object state before changes.
    * @event
    */
    event_stateChanged: createEvent('stateChanged', 'object', 'oldState'),

   /**
    * Fires when delegate was changed.
    * @param {basis.data.DataObject} object Object which state was changed.
    * @param {basis.data.DataObject} oldDelegate Object delegate before changes.
    * @event
    */
    event_delegateChanged: createEvent('delegateChanged', 'object', 'oldDelegate'),

   /**
    * Fires when root of delegate chain was changed.
    * @param {basis.data.DataObject} object Object which root was changed.
    * @param {basis.data.DataObject} oldRoot Object root before changes.
    * @event
    */
    event_rootChanged: createEvent('rootChanged', 'object', 'oldRoot'),

   /**
    * Fires when target property was changed.
    * @param {basis.data.DataObject} object Object which target property was changed.
    * @param {basis.data.DataObject} oldTarget Object before changes.
    * @event
    */
    event_targetChanged: createEvent('targetChanged', 'object', 'oldTarget'),

   /**
    * Fires when count of subscribers (subscriberCount property) was changed.
    * @param {basis.data.DataObject} object Object which subscribers count was changed.
    * @event
    */
    event_subscribersChanged: createEvent('subscribersChanged', 'object'),

   /**
    * Fires when state of subscription was changed.
    * @event
    */
    event_activeChanged: createEvent('activeChanged', 'object'),

   /**
    * Default listeners.
    * @inheritDoc
    */
    listen: {
      delegate: {
        update: function(object, delta){
          this.data = object.data;
          this.event_update(this, delta);
        },
        stateChanged: function(object, oldState){
          this.state = object.state;
          this.event_stateChanged(this, oldState);
        },
        targetChanged: function(object, oldTarget){
          this.target = object.target;
          this.event_targetChanged(this, oldTarget);
        },
        rootChanged: function(object, oldRoot){
          this.data = object.data;
          this.root = object.root;
          this.event_rootChanged(this, oldRoot);
        },
        destroy: function(){
          if (this.cascadeDestroy)
            this.destroy();
          else
            this.setDelegate();
        }
      }
    },

   /**
    * @param {Object=} config The configuration of object.
    * @constructor
    */
    init: function(config){
      // inherit
      EventObject.prototype.init.call(this, config);

      // data/delegate
      var delegate = this.delegate;

      if (delegate)
      {
        // assign a delegate
        // NOTE: ignore for this.data & this.state, no update/stateChanged events fired
        this.delegate = null;
        this.data = delegate.data;
        this.state = delegate.state;
        this.setDelegate(delegate);
      }
      else
      {
        this.root = this;

        // if data doesn't exists - init it
        if (!this.data)
          this.data = {};

        // set target property to itself if isTarget property true
        if (this.isTarget)
          this.target = this;
      }

      // subscription sheme: activate subscription if active
      if (this.active)
        applySubscription(this, this.subscribeTo, SUBSCRIPTION.ALL);
    },

    /*postInit: function(){
      // subscription sheme: activate subscription if active
      if (this.active)
        applySubscription(this, this.subscribeTo, SUBSCRIPTION.ALL);
    },*/

   /**
    * Returns true if current object is connected to another object through delegate bubbling.
    * @param {basis.data.DataObject} object
    * @return {boolean} Whether objects are connected.
    */
    isConnected: function(object){
      if (object instanceof DataObject)
      {
        while (object && object !== this && object !== object.delegate)
          object = object.delegate;
          
        return object === this;
      }

      return false;
    },

   /**
    * Returns root delegate object (that haven't delegate).
    * @return {basis.data.DataObject}
    */
    getRootDelegate: function(){
      var object = this;

      while (object.delegate && object.delegate !== object)
        object = object.delegate;

      return object;
    },

   /**
    * Set new delegate object or reject it (if passed null).
    * @example
    *   var a = new basis.data.DataObject();
    *   var b = new basis.data.DataObject();
    *
    *   a.setDelegate(b);
    *   a.update({ prop: 123 });
    *   alert(a.data.prop); // shows 123
    *   alert(b.data.prop); // shows 123
    *   alert(a.data.prop === b.data.prop); // shows true
    *
    *   b.update({ prop: 456 });
    *   alert(a.data.prop); // shows 456
    *   alert(b.data.prop); // shows 456
    *   alert(a.data.prop === b.data.prop); // shows true
    *
    *   a.setState(basis.data.STATE.PROCESSING);
    *   alert(a.state); // shows 'processing'
    *   alert(a.state === b.state); // shows true
    * @param {basis.data.DataObject} delegate
    * @return {basis.data.DataObject} Returns current delegate object.
    */
    setDelegate: function(newDelegate){

      // check is newDelegate can be linked to this object as delegate
      if (this.canHaveDelegate && newDelegate && newDelegate instanceof DataObject)
      {
        // check for connected prevents from linking to objects
        // that has this object in delegate chains
        if (newDelegate.delegate && this.isConnected(newDelegate))
        {
          // DEBUG: show warning in debug mode that we drop delegate because it is already connected with object
          ;;;if (typeof console != 'undefined') console.warn('(debug) New delegate has already connected to object. Delegate assign has been ignored.', this, newDelegate);

          // newDelegate can't be assigned
          return false;
        }
      }
      else
      {
        // can't assign delegate if newDelegate isn't instance of DataObject
        newDelegate = null;
      }

      // only if newDelegate differ with current value
      if (this.delegate !== newDelegate)
      {
        var oldState = this.state;
        var oldData = this.data;
        var oldDelegate = this.delegate;
        var oldTarget = this.target;
        var oldRoot = this.root;
        var delta = {};

        if (newDelegate)
        {
          // assing new delegate
          this.delegate = newDelegate;
          this.root = newDelegate.root;
          this.data = newDelegate.data;
          this.state = newDelegate.state;
          this.target = newDelegate.target;

          // calculate delta as difference between current data and delegate info
          for (var key in newDelegate.data)
            if (key in oldData === false)
              delta[key] = undefined;

          for (var key in oldData)
            if (oldData[key] !== newDelegate.data[key])
              delta[key] = oldData[key];

          // update & stateChanged can be fired only if new delegate was assigned;
          // otherwise (delegate drop) do nothing -> performance benefits

          // fire update event if any key in delta (data changed)
          for (var key in delta)
          {
            this.event_update(this, delta);
            break;
          }

          // fire stateChanged event if state was changed
          if (oldState !== this.state && (String(oldState) != this.state || oldState.data !== this.state.data))
            this.event_stateChanged(this, oldState);
        }
        else
        {
          // reset delegate and info
          this.delegate = null;
          this.target = null;
          this.root = this;
          this.data = {};

          // copy data, no update, no delta
          for (var key in oldData)
            this.data[key] = oldData[key];
        }

        // fire event if target changed
        if (this.root !== oldRoot)
          this.event_rootChanged(this, oldRoot);

        // fire event if target changed
        if (this.target !== oldTarget)
          this.event_targetChanged(this, oldTarget);

        // fire event if delegate changed
        this.event_delegateChanged(this, oldDelegate);

        // delegate was changed
        return true;
      }

      return false; // delegate doesn't changed
    },

   /**
    * Set new state for object. Fire stateChanged event only if state (or state text) was changed.
    * @param {basis.data.STATE|string} state New state for object
    * @param {Object=} data
    * @param {boolean=} forceEvent Fire stateChanged event even state didn't changed.
    * @return {basis.data.STATE|string} Current object state.
    */
    setState: function(state, data){
      var root = this.target || this.getRootDelegate();

      // set new state for root
      if (root !== this)
        return root.setState(state, data);

      var stateCode = String(state);

      if (!STATE_EXISTS[stateCode])
        throw new Error('Wrong state value');

      // set new state for object
      if (this.state != stateCode || this.state.data != data)
      {
        var oldState = this.state;

        this.state = Object(stateCode);
        this.state.data = data;

        this.event_stateChanged(this, oldState);

        return true; // state was changed
      }

      return false; // state wasn't changed
    },

   /**
    * Default action on deprecate, set object state to {basis.data.STATE.DEPRECATED},
    * but only if object isn't in {basis.data.STATE.PROCESSING} state.
    */
    deprecate: function(){
      if (this.state != STATE.PROCESSING)
        this.setState(STATE.DEPRECATED);
    },

   /**
    * Handle changing object data. Fires update event only if something was changed. 
    * @param {Object} data New values for object data holder (this.data).
    * @return {Object|boolean} Delta if object data (this.data) was updated or false otherwise.
    */
    update: function(data){
      var root = this.target || this.getRootDelegate();

      if (root !== this)
        return root.update(data);

      if (data)
      {
        var delta = {};
        var updateCount = 0;

        for (var prop in data)
        {
          if (this.data[prop] !== data[prop])
          {
            updateCount++;
            delta[prop] = this.data[prop];
            this.data[prop] = data[prop];
          }
        }

        if (updateCount)
        {
          this.event_update(this, delta);
          return delta;
        }
      }

      return false;
    },

   /**
    * Set new value for isActiveSubscriber property.
    * @param {boolean} isActive New value for {basis.data.DataObject#active} property.
    * @return {boolean} Returns true if {basis.data.DataObject#active} was changed.
    */
    setActive: function(isActive){
      isActive = !!isActive;

      if (this.active != isActive)
      {
        this.active = isActive;
        this.event_activeChanged(this);

        applySubscription(this, this.subscribeTo, SUBSCRIPTION.ALL * isActive);

        return true;
      }

      return false;
    },

   /**
    * Set new value for subscriptionType property.
    * @param {number} subscriptionType New value for {basis.data.DataObject#subscribeTo} property.
    * @return {boolean} Returns true if {basis.data.DataObject#subscribeTo} was changed.
    */
    setSubscription: function(subscriptionType){
      var curSubscriptionType = this.subscribeTo;
      var newSubscriptionType = subscriptionType & SUBSCRIPTION.ALL;
      var delta = curSubscriptionType ^ newSubscriptionType;

      if (delta)
      {
        this.subscribeTo = newSubscriptionType;

        if (this.active)
          applySubscription(this, delta, newSubscriptionType);

        return true;
      }

      return false;
    },

   /**
    * @destructor
    */
    destroy: function(){
      // remove subscriptions if necessary
      if (this.active)
        applySubscription(this, this.subscribeTo, 0);

      // drop delegate
      if (this.delegate)
        this.setDelegate();

      // inherit
      EventObject.prototype.destroy.call(this);

      // drop data & state
      this.data = NULL_OBJECT;
      this.state = STATE.UNDEFINED;
      this.root = null;
      this.target = null;
    }
  });

  //
  // KeyObjectMap
  //

  var KEYOBJECTMAP_MEMBER_HANDLER = {
    destroy: function(object){
      delete this.map[this.itemId];
    }
  };

 /**
  * @class
  */
  var KeyObjectMap = Class(null, {
    className: namespace + '.KeyObjectMap',

    itemClass: DataObject,
    keyGetter: $self,
    map_: null,

    extendConstructor_: true,
    init: function(config){
      this.map_ = {};
      basis.Cleaner.add(this);
    },

    resolve: function(object){
      return this.get(this.keyGetter(object), object);
    },
    create: function(key, object){
      var itemConfig = {};

      if (key instanceof DataObject)
      {
        itemConfig.delegate = key;
      }
      else
      {
        itemConfig.data = {
          id: key,
          title: key
        };
      }

      return new this.itemClass(itemConfig);
    },
    get: function(key, object){
      var itemId = key instanceof DataObject ? key.eventObjectId : key;
      var item = this.map_[itemId];

      if (!item && object)
      {
        item = this.map_[itemId] = this.create(key, object);
        item.addHandler(KEYOBJECTMAP_MEMBER_HANDLER, {
          map: this.map_,
          itemId: itemId
        });
      }

      return item;
    },
    destroy: function(){
      basis.Cleaner.remove(this);

      var items = values(this.map_);
      for (var i = 0, item; item = items[i++];)
        item.destroy();
    }
  });

  //
  // Datasets
  //

 /**
  * Returns delta object
  */
  function getDelta(inserted, deleted){
    var delta = {};
    var result;

    if (inserted && inserted.length)
      result = delta.inserted = inserted;

    if (deleted && deleted.length)
      result = delta.deleted = deleted;

    if (result)
      return delta;
  }

 /**
  * @class
  */
  var AbstractDataset = Class(DataObject, {
    className: namespace + '.AbstractDataset',

   /**
    * Datasets can't have delegate by default.
    * @inheritDoc
    */
    //canHaveDelegate: false, // ????

   /**
    * Default state for set is undefined. It useful to trigger dataset update
    * on demand.
    * @inheritDoc
    */
    state: STATE.UNDEFINED,

   /**
    * Cardinality of set.
    * @type {number}
    * @readonly
    */
    itemCount: 0,

   /**
    * Set of members. 
    * @private
    */
    item_: null,

   /**
    * Set of all items, even items are not in member set. May be used as storage for
    * members, which provide posibility to avoid dublicates in resultinf set before
    * event_datasetChanged event be fired.
    * @type {Object}
    * @private
    */
    memberMap_: null,

   /**
    * Cache array of members, for getItems method.
    * @type {Array.<basis.data.DataObject>}
    * @private
    */
    cache_: null,

   /**
    * Fires when items changed.
    * @param {basis.data.AbstractDataset} dataset
    * @param {Object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new items
    * and `deleted` property is array of removed items.
    * @event
    */
    event_datasetChanged: createEvent('datasetChanged', 'dataset', 'delta') && function(dataset, delta){
      var items;
      var insertCount = 0;
      var deleteCount = 0;
      var object;

      // add new items
      if (items = delta.inserted)
      {
        while (object = items[insertCount])
        {
          this.item_[object.eventObjectId] = object;
          insertCount++;
        }
      }

      // remove old items
      if (items = delta.deleted)
      {
        while (object = items[deleteCount])
        {
          delete this.item_[object.eventObjectId];
          deleteCount++;
        }
      }

      // update item count
      this.itemCount += insertCount - deleteCount;

      // drop cache
      this.cache_ = null;

      // call event 
      events.datasetChanged.call(this, dataset, delta);
    },

   /**
    * @constructor
    */
    init: function(config){
      // inherit
      DataObject.prototype.init.call(this, config);

      this.memberMap_ = {};
      this.item_ = {};
    },

   /**
    * Check is object in dataset.
    * @param {basis.data.DataObject} object Object check for.
    * @return {boolean} Returns true if object in dataset.
    */
    has: function(object){
      return !!(object && this.item_[object.eventObjectId]);
    },

   /**
    * Returns all items in dataset.
    * @return {Array.<basis.data.DataObject>} 
    */
    getItems: function(){
      if (!this.cache_)
        this.cache_ = values(this.item_);

      return this.cache_;
    },

   /**
    * Returns first any item if exists.
    * @return {basis.data.DataObject}
    */
    pick: function(){
      for (var objectId in this.item_)
        return this.item_[objectId];

      return null;
    },

   /**
    * Returns some N items from dataset if exists.
    * @param {number} count Max length of resulting array.
    * @return {Array.<basis.data.DataObject>} 
    */
    top: function(count){
      var result = [];

      if (count)
        for (var objectId in this.item_)
          if (result.push(this.item_[objectId]) >= count)
            break;

      return result;
    },

   /**
    * @param {Array.<basis.data.DataObject>} items
    */
    add: function(items){
    },

   /**
    * @param {Array.<basis.data.DataObject>} items
    */
    remove: function(items){
    },

   /**
    * @param {Array.<basis.data.DataObject>} items
    */
    set: function(items){
    },

   /**
    * @param {Array.<basis.data.DataObject>} items
    * @param {boolean=} set
    */
    sync: function(items, set){
    },

   /**
    * Removes all items from dataset.
    */
    clear: function(){
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.clear();

      // inherit
      DataObject.prototype.destroy.call(this);

      this.cache_ = EMPTY_ARRAY;  // empty array here, to prevent recalc cache
      this.itemCount = 0;

      this.memberMap_ = null;
      this.item_ = null;
    }
  });

  //
  // Dataset
  //

 /**
  * @class
  */
  var Dataset = Class(AbstractDataset, {
    className: namespace + '.Dataset',

   /**
    * @inheritDoc
    */
    listen: {
      item: {
        destroy: function(object){
          this.remove([object]);
        }
      }
    },

   /**
    * @config {Array.<basis.data.DataObject>} items Initial set of items.
    * @constructor
    */
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      var items = this.items;
      if (items)
      {
        this.items = null;
        this.set(items);
      }
    },

    add: function(data){
      var delta;
      var memberMap = this.memberMap_;
      var inserted = [];
      var listenHandler = this.listen.item;

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;

            if (listenHandler)
              object.addHandler(listenHandler, this);

            inserted.push(object);
          }
        }
      }

      // trace changes
      if (inserted.length)
      {
        this.event_datasetChanged(this, delta = {
          inserted: inserted
        });
      }

      return delta;
    },

    remove: function(data){
      var delta;
      var memberMap = this.memberMap_;
      var deleted = [];
      var listenHandler = this.listen.item;

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (memberMap[objectId])
          {
            if (listenHandler)
              object.removeHandler(listenHandler, this);

            delete memberMap[objectId];

            deleted.push(object);
          }
        }
      }

      // trace changes
      if (deleted.length)
      {
        this.event_datasetChanged(this, delta = {
          deleted: deleted
        });
      }

      return delta;
    },

    set: function(data){

      // a little optimizations
      if (!this.itemCount)
        return this.add(data);

      if (!data.length)
        return this.clear();

      // main part

      // build map for new data
      var memberMap = this.memberMap_;
      var exists = {};  // unique input DataObject's
      var deleted = [];
      var inserted = [];
      var object;
      var objectId;
      var delta;
      var listenHandler = this.listen.item;

      for (var i = 0; i < data.length; i++)
      {
        object = data[i];

        if (object instanceof DataObject)
        {
          objectId = object.eventObjectId;
          exists[objectId] = object;

          // insert data
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;

            if (listenHandler)
              object.addHandler(listenHandler, this);

            inserted.push(object);
          }
        }
      }

      // delete data
      for (var objectId in memberMap)
      {
        if (!exists[objectId])
        {
          object = memberMap[objectId];

          if (listenHandler)
            object.removeHandler(listenHandler, this);

          delete memberMap[objectId];

          deleted.push(object);
        }
      }
      
      // fire event if any changes
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);

      return delta;
    },

    sync: function(data, set){
      if (!data)
        return;

      Dataset.setAccumulateState(true);

      var memberMap = this.memberMap_;
      var object;
      var objectId;
      var exists = {};
      var inserted = [];
      var deleted = [];
      var res;

      for (var i = 0; i < data.length; i++)
      {
        object = data[i];

        if (object instanceof DataObject)
        {
          objectId = object.eventObjectId;

          exists[objectId] = object;
          if (!memberMap[objectId])
            inserted.push(object);
        }
      }

      for (var objectId in this.item_)
      {
        if (!exists[objectId])
          this.item_[objectId].destroy();
      }

      if (set && inserted.length)
        res = this.add(inserted);

      Dataset.setAccumulateState(false);

      return res;
    },

    clear: function(){
      var delta;
      var deleted = this.getItems();
      var listenHandler = this.listen.item;

      if (deleted.length)
      {
        if (listenHandler)
          for (var i = deleted.length; i --> 0;)
            deleted[i].removeHandler(listenHandler, this);

        this.event_datasetChanged(this, delta = {
          deleted: deleted
        });
         
        this.memberMap_ = {};
      }

      return delta;
    }
  });


  //
  // Accumulate dataset changes
  //

  Dataset.setAccumulateState = (function(){
    var proto = AbstractDataset.prototype;
    var realEvent = proto.event_datasetChanged;
    var setStateCount = 0;
    var urgentTimer;
    var eventCache = {};

    function flushCache(cache){
      var dataset = cache.dataset;
      realEvent.call(dataset, dataset, cache);
    }

    function flushAllDataset(){
      var eventCacheCopy = eventCache;
      eventCache = {};
      for (var datasetId in eventCacheCopy)
        flushCache(eventCacheCopy[datasetId]);
    }

    function storeDatasetDelta(dataset, delta){
      var datasetId = dataset.eventObjectId;
      var inserted = delta.inserted;
      var deleted = delta.deleted;
      var cache = eventCache[datasetId];

      if (inserted && deleted)
      {
        if (cache)
        {
          delete eventCache[datasetId];
          flushCache(cache);
        }
        return realEvent.call(dataset, dataset, delta);
      }

      var mode = inserted ? 'inserted' : 'deleted';
      if (cache)
      {
        var array = cache[mode];
        if (!array)
          flushCache(cache);
        else
          return array.push.apply(array, inserted || deleted);
      }

      eventCache[datasetId] = delta;
      delta.dataset = dataset;
    }

    function urgentFlush(){
      urgentTimer = null;
      if (setStateCount)
      {
        ;;;if (typeof console != 'undefined') console.warn('(debug) Urgent flush dataset changes');
        setStateCount = 0;
        setAccumulateStateOff();
      }
    }

    function setAccumulateStateOff(){
      proto.event_datasetChanged = realEvent;
      flushAllDataset();
    }

    return function(state){
      if (state)
      {
        if (setStateCount == 0)
        {
          proto.event_datasetChanged = storeDatasetDelta;
          if (!urgentTimer)
            urgentTimer = setTimeout(urgentFlush, 0);
        }
        setStateCount++;
      }
      else
      {
        setStateCount -= setStateCount > 0;
        if (setStateCount == 0)
          setAccumulateStateOff();
      }
    }
  })();


  //
  // namespace wrapper
  //

  function dataWrapper(data){
    if (Array.isArray(data))
      return data.map(dataWrapper);
    else
      return { data: data };
  }

  this.setWrapper(dataWrapper);


  //
  // export names
  //

  this.extend({
    // const
    STATE: STATE,
    SUBSCRIPTION: SUBSCRIPTION,

    // classes
    Object: DataObject,
    DataObject: DataObject,

    KeyObjectMap: KeyObjectMap,

    AbstractDataset: AbstractDataset,
    Dataset: Dataset
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/data.js").call(basis.namespace("basis.data"), basis.namespace("basis.data"), basis.namespace("basis.data").exports, this, __curLocation + "src/basis/data.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/template.js
//

new Function(__wrapArgs, function(){

/**
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

  basis.require('basis.dom');
  basis.require('basis.dom.event');


 /**
  * @namespace basis.template
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var dom = basis.dom;
  var domEvent = basis.dom.event;


  //
  // Main part
  //

  // Test for browser (IE) normalize text nodes during cloning
  var CLONE_NORMALIZE_TEXT_BUG = typeof window != 'undefined' && (function(){
    return dom.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
  })();

  // token types
  /** @const */ var TYPE_ELEMENT = 1;
  /** @const */ var TYPE_ATTRIBUTE = 2;
  /** @const */ var TYPE_TEXT = 3;
  /** @const */ var TYPE_COMMENT = 8;

  // references on fields in declaration
  /** @const */ var TOKEN_TYPE = 0
  /** @const */ var TOKEN_BINDINGS = 1;
  /** @const */ var TOKEN_REFS = 2;

  /** @const */ var ATTR_NAME = 3;
  /** @const */ var ATTR_VALUE = 4;

  /** @const */ var ELEMENT_NAME = 3;
  /** @const */ var ELEMENT_ATTRS = 4;
  /** @const */ var ELEMENT_CHILDS = 5;

  /** @const */ var TEXT_VALUE = 3;
  /** @const */ var COMMENT_VALUE = 3;

  // parsing variables
  var SYNTAX_ERROR = 'Invalid or unsupported syntax';

  // html parsing states
  var TEXT = /((?:.|[\r\n])*?)(\{(?:l10n:([a-z\_][a-z0-9\-\_]*(?:\.[a-z\_][a-z0-9\-\_]*)*)\})?|<(\/|!--(\s*\{)?)?|$)/g;
  var TAG_NAME = /([a-z\_][a-z0-9\-\_]*)(\:|\{|\s*(\/?>)?)/ig;
  var ATTRIBUTE_NAME_OR_END = /([a-z\_][a-z0-9\-\_]*)(\:|\{|=|\s*)|(\/?>)/ig;
  var COMMENT = /(.|[\r\n])*?-->/g;
  var CLOSE_TAG = /([a-z\_][a-z0-9\-\_]*(?:\:[a-z\_][a-z0-9\-\_]*)?)>/ig;
  var REFERENCE = /([a-z\_][a-z0-9\_]*)(\||\}\s*)/ig;
  var ATTRIBUTE_VALUE = /"((?:(\\")|[^"])*?)"\s*/g;

  var quoteEscape = /"/g;
  var quoteUnescape = /\\"/g;

  var eventAttr = /^event-(.+)+/;

  // dictonaries
  var tmplEventListeners = {};
  var tmplNodeMap = { seed: 1 };
  var tmplFilesMap = {};
  var namespaceURI = {
    svg: 'http://www.w3.org/2000/svg'
  };

 /**
  * Parse html into tokens.
  */
  var tokenize = function(source, debug){
    var result = [];
    var tagStack = [];
    var lastTag = { childs: result };
    var sourceText;
    var token;
    var bufferPos;
    var startPos;
    var parseTag = false;
    var textStateEndPos = 0;
    var textEndPos;
    var refMap = {};
    var refName;
    var l10nMatch;

    var state = TEXT;
    var pos = 0;
    var m;

    source = source.trim();

    try {
      while (pos < source.length || state != TEXT)
      {
        state.lastIndex = pos;
        startPos = pos;

        m = state.exec(source);

        if (!m || m.index !== pos)
        {
          //throw SYNTAX_ERROR;
          if (parseTag)
            lastTag = tagStack.pop();

          if (token)
            lastTag.childs.pop();

          if (token = lastTag.childs.pop())
          {
            if (token.type == TYPE_TEXT && !token.refs)
              textStateEndPos -= 'len' in token ? token.len : token.value.length;
            else
              lastTag.childs.push(token);
          }

          parseTag = false;
          state = TEXT;
          continue;
        }

        pos = state.lastIndex;

        //stat[state] = (stat[state] || 0) + 1;
        switch(state)
        {
          case TEXT:

            textEndPos = startPos + m[1].length;

            if (textStateEndPos != textEndPos)
            {
              sourceText = textStateEndPos == startPos
                ? m[1]
                : source.substring(textStateEndPos, textEndPos)

              token = sourceText.replace(/\s*(\r\n?|\n\r?)\s*/g, '');

              if (token)
                lastTag.childs.push({
                  type: TYPE_TEXT,
                  len: sourceText.length,
                  value: token
                });
            }

            textStateEndPos = textEndPos;

            if (m[3])
            {
              lastTag.childs.push({
                type: TYPE_TEXT,
                refs: ['l10n:' + m[3]],
                value: '{l10n:' + m[3] + '}'
              });
            }
            else if (m[2] == '{')
            {
              bufferPos = pos - 1;
              lastTag.childs.push(token = {
                type: TYPE_TEXT
              });
              state = REFERENCE;
            }
            else if (m[4])
            {
              if (m[4] == '/')
              {
                token = null;
                state = CLOSE_TAG;
              }
              else //if (m[3] == '!--')
              {
                lastTag.childs.push(token = {
                  type: TYPE_COMMENT
                });

                if (m[5])
                {
                  bufferPos = pos - m[5].length;
                  state = REFERENCE;
                }
                else
                {
                  bufferPos = pos;
                  state = COMMENT;
                }
              }
            }
            else if (m[2]) // m[2] == '<' open tag
            {
              parseTag = true;
              tagStack.push(lastTag);

              lastTag.childs.push(token = {
                type: TYPE_ELEMENT,
                attrs: [],
                childs: []
              });
              lastTag = token;

              state = TAG_NAME;
            }

            break;

          case CLOSE_TAG:
            if (m[1] !== (lastTag.prefix ? lastTag.prefix + ':' : '') + lastTag.name)
            {
              //throw 'Wrong close tag';
              lastTag.childs.push({
                type: TYPE_TEXT,
                value: '</' + m[0]
              });
            }
            else
              lastTag = tagStack.pop();

            state = TEXT;
            break;

          case TAG_NAME:
          case ATTRIBUTE_NAME_OR_END:
            if (m[2] == ':')
            {
              if (token.prefix)  // if '/' or prefix was before
                throw SYNTAX_ERROR;

              token.prefix = m[1];
              break;
            }

            if (m[1])
            {
              // store name (it may be null when check for attribute and end)
              token.name = m[1];

              // store attribute
              if (token.type == TYPE_ATTRIBUTE)
                lastTag.attrs.push(token);
            }

            if (m[2] == '{')
            {
              state = REFERENCE;
              break;
            }

            if (m[3]) // end tag declaration
            {
              if (m[3] == '/>') // otherwise m[3] == '>', nothing to do
                lastTag = tagStack.pop();

              parseTag = false;
              state = TEXT;
              break;
            }

            if (m[2] == '=') // ATTRIBUTE_NAME_OR_END only
            {
              state = ATTRIBUTE_VALUE;
              break;
            }

            // m[2] == '\s+' next attr, state doesn't change
            token = {
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;
            break;

          case COMMENT:
            token.value = source.substring(bufferPos, pos - 3);
            state = TEXT;
            break;

          case REFERENCE:
            refName = m[1];

            // if ref is already in use, remove it from another holder
            if (refMap[refName])
            {
              var holder = refMap[refName];

              ;;;if (debug) debug.push('Html parse: Dublicate reference `' + refName + '` in template');

              //token.refs.remove(refName);
              holder.refs.splice(holder.refs.indexOf(refName), 1);

              // if no more refs in list - delete it
              if (!holder.refs.length)
                delete holder.refs;
            }

            // add to map
            if (token.type != TYPE_TEXT)
              refMap[refName] = token;

            // add reference to token list name
            if (token.refs)
              token.refs.push(m[1]);
            else
              token.refs = [m[1]];

            // go next
            if (m[2] != '|') // m[2] == '}\s*'
            {
              if (token.type == TYPE_TEXT)
              {
                pos -= m[2].length - 1;
                token.value = source.substring(bufferPos, pos);
                state = TEXT;
              }
              else if (token.type == TYPE_COMMENT)
              {
                state = COMMENT;
              }
              else if (token.type == TYPE_ATTRIBUTE && source[pos] == '=')
              {
                pos++;
                state = ATTRIBUTE_VALUE;
              }
              else // ATTRIBUTE || ELEMENT
              {
                token = {
                  type: TYPE_ATTRIBUTE
                };
                state = ATTRIBUTE_NAME_OR_END;
              }
            }

            // continue to collect references
            break;

          case ATTRIBUTE_VALUE:
            token.value = m[1].replace(quoteUnescape, '"');

            token = {
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;

            break;

          default:
            throw 'Parser bug'; // Must never to be here; bug in parser otherwise
        }

        if (state == TEXT)
          textStateEndPos = pos;
      }

      if (textStateEndPos != pos)
        lastTag.childs.push({
          type: TYPE_TEXT,
          value: source.substring(textStateEndPos, pos)
        });

      if (!result.length)   // there must be at least one token in result
        result.push({ type: TYPE_TEXT, value: '' });

      if ('element' in refMap == false)
      {
        if (!result[0].refs)
          result[0].refs = ['element'];
        else
          result[0].refs.push('element');
      }

      if (tagStack.length > 1)
        throw 'No close tag for ' + tagStack.pop().name;

      result.templateDeclaration = true;

    } catch(e) {
      /*if (e === SYNTAX_ERROR)
        console.warn('Syntax error:\n' + source.substr(0, pos) + '\n** here **\n' + source.substr(pos));
      else
      /*var br = source.indexOf('\n', i);
      var offset = source.lastIndexOf('\n', i);
      if (br == -1)
        br = source.length;
      if (offset == -1)
        offset = 0;

      console.warn(e + ':\n' + source.substr(0, br) + '\n' + Array(i - offset + 1).join(' ') + '\u25b2-- problem here \n' + source.substr(br));
      /*/console.warn(e, source); /* */
    }

    return result;
  };

 /**
  * make compiled version of template
  */
  var makeDeclaration = (function(){

    var CLASS_ATTR_PARTS = /(\S+)/g;
    var CLASS_ATTR_BINDING = /^([a-z\_][a-z0-9\-\_]*)?\{([a-z\_][a-z0-9\-\_]*)\}$/i;
    var ATTR_BINDING = /\{([a-z\_][a-z0-9\_]*|l10n:[a-z\_][a-z0-9\_]*(?:\.[a-z\_][a-z0-9\_]*)*)\}/i;
    var NAMED_CHARACTER_REF = /&([a-z]+|#[0-9]+|#x[0-9a-f]{1,4});?/gi;
    var tokenMap = {};
    var tokenElement = document.createElement('div');

    function name(token){
      return (token.prefix ? token.prefix + ':' : '') + token.name;
    }

    function namedCharReplace(m, token){
      if (!tokenMap[token])
      {
        if (token.charAt(0) == '#')
        {
          tokenMap[token] = String.fromCharCode(
            token.charAt(1) == 'x' || token.charAt(1) == 'X'
              ? parseInt(token.substr(2), 16)
              : token.substr(1)
          );
        }
        else
        {
          tokenElement.innerHTML = m;
          tokenMap[token] = tokenElement.firstChild ? tokenElement.firstChild.nodeValue : '';
        }
      }
      return tokenMap[token];
    }

    function untoken(value){
      return value.replace(NAMED_CHARACTER_REF, namedCharReplace);
    }

    function refList(token){
      var array = token.refs;

      if (!array || !array.length)
        return 0;

      /*for (var i = 0, j = 0; i < array.length; i++)
        if (array[i].indexOf(':') == -1)
          array[j++] = array[i];

      array.length = j;*/

      return array;
    }

    function attrs(token){
      var attrs = token.attrs;
      var result = [];
      var bindings;
      var parts;
      var m;

      for (var i = 0, attr; attr = attrs[i]; i++)
      {
        bindings = 0;

        if (attr.value)
        {
          if (attr.name == 'class')
          {
            if (parts = attr.value.match(CLASS_ATTR_PARTS))
            {
              var newValue = [];
              var map = {};
              var prefixes;

              bindings = [[]];

              for (var j = 0, part; part = parts[j]; j++)
              {
                if (m = part.match(CLASS_ATTR_BINDING))
                {
                  prefixes = map[m[2]];
                  if (!map[m[2]])
                  {
                    prefixes = map[m[2]] = [];
                    bindings[0].push(m[2]);
                    bindings.push(prefixes);
                  }
                  prefixes.push(m[1] || '');
                }
                else
                  newValue.push(part);
              }
              
              // set new value
              attr.value = newValue.join(' ');

              if (bindings.length == 1)
                bindings = 0;
            }
          }
          else
          {
            parts = attr.value.split(ATTR_BINDING);
            if (parts.length > 1)
            {
              var bindName;
              var names = [];
              var expression = [];
              var map = {};
              
              for (var j = 0; j < parts.length; j++)
                if (j % 2)
                {
                  bindName = parts[j];
                  
                  if (!map[bindName])
                  {
                    map[bindName] = names.length;
                    names.push(bindName);
                  }

                  expression.push(map[bindName]);
                }
                else
                {
                  if (parts[j])
                    expression.push(untoken(parts[j]));
                }

              bindings = [names, expression];
            }
            else
              attr.value = untoken(attr.value);
          }
        }

        result.push([
          2,                      // TOKEN_TYPE = 0
          bindings,               // TOKEN_BINDINGS = 1
          refList(attr),          // TOKEN_REFS = 2
          name(attr),             // ATTR_NAME = 2
          attr.value              // ATTR_VALUE = 3
        ]);
      }

      return result.length ? result : 0;
    }

    function optimize(tokens){
      var result = [];

      for (var i = 0, token, item; token = tokens[i]; i++)
      {
        var refs = refList(token);
        var bindings = refs && refs.length == 1 ? 1 : 0;

        switch (token.type)
        {
          case TYPE_ELEMENT:
            item = [
              1,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              name(token),             // ELEMENT_NAME = 3
              attrs(token),            // ELEMENT_ATTRS = 4
              optimize(token.childs)   // ELEMENT_CHILDS = 5
            ];

            break;

          case TYPE_TEXT:
            item = [
              3,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              untoken(token.value)     // TEXT_VALUE = 3
            ];

            break;

          case TYPE_COMMENT:
            item = [
              8,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              untoken(token.value)     // COMMENT_VALUE = 3
            ];

            break;
        }

        result.push(item);
      }

      return result.length ? result : 0;
    }

    return function(source, debug){
      if (!source.templateDeclaration)
        source = tokenize('' + source, debug);

      var result = optimize(source);

      ;;;if ('JSON' in global) result.toString = function(){ return JSON.stringify(this) };

      return result;
    }
  })();

 /**
  *
  */
  var buildPathes = (function(){
    var PATH_REF_NAME = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.toArray();

    var pathList;
    var refList;
    var bindingList;

    function putRefs(refs, pathIdx){
      for (var i = 0, refName; refName = refs[i]; i++)
        if (refName.indexOf(':') == -1)
          refList.push(refName + ':' + pathIdx);
    }

    function putPath(path){
      var len = pathList.length;
      var pathRef = PATH_REF_NAME[len] || ('r' + len);

      pathList.push(pathRef + '=' + path);

      return pathRef;
    }

    function putBinding(binding){
      bindingList.push(binding);
    }
  
    function processTokens(tokens, path){
      var localPath;
      var hasBindings;
      var attrs;
      var childs;
      var refs;
      var myRef;
      var explicitRef;
      var bindings;

      for (var i = 0, cp = 0, token; token = tokens[i]; i++, cp++, explicitRef = false)
      {
        if (!i)
          localPath = path + '.firstChild';
        else
        {
          if (!tokens[i + 1])
            localPath = path + '.lastChild';
          else
          {
            // fix bug with normalize text node in IE8-
            if (CLONE_NORMALIZE_TEXT_BUG && token[TOKEN_TYPE] == tokens[i - 1][TOKEN_TYPE] && token[TOKEN_TYPE] == TYPE_TEXT)
              cp++;

            localPath = path + '.childNodes[' + cp + ']';
          }
        }

        if (refs = token[TOKEN_REFS])
        {
          explicitRef = true;
          localPath = putPath(localPath);
          putRefs(refs, localPath);

          if (token[TOKEN_BINDINGS])
            putBinding([token[TOKEN_TYPE], localPath, refs[0]]);
        }

        if (token[TOKEN_TYPE] == TYPE_ELEMENT)
        {
          myRef = -1;

          if (!explicitRef)
          {
            localPath = putPath(localPath);
            myRef = pathList.length;
          }

          if (attrs = token[ELEMENT_ATTRS]) // attrs
            for (var j = 0, attr; attr = attrs[j]; j++)
            {
              var attrName = attr[ATTR_NAME];

              if (refs = attr[TOKEN_REFS])
              {
                explicitRef = true;
                putRefs(refs, putPath(localPath + '.getAttributeNode("' + attrName + '")'));
              }

              if (bindings = attr[TOKEN_BINDINGS])
              {
                var binding = [2, localPath];

                explicitRef = true;

                for (var k = 0, bindName; bindName = bindings[0][k]; k++)
                  if (attrName == 'class')
                    putBinding(binding.concat([bindName, attrName, bindings[k + 1]]));
                  else
                    putBinding(binding.concat([bindName, attrName, bindings[0], bindings[1]]));
              }
            }

          if (childs = token[ELEMENT_CHILDS]) // childs
            processTokens(childs, localPath);

          if (!explicitRef && myRef == pathList.length)
            pathList.pop();
        }
      }
    }

    return function(tokens, path){
      pathList = [];
      refList = [];
      bindingList = [];

      processTokens(tokens, path);

      return {
        path: pathList,
        ref: refList,
        binding: bindingList
      };
    }
  })();


 /**
  * Build functions for creating instance of template.
  */
  var makeFunctions = (function(){

    var WHITESPACE = /\s+/;
    var W3C_DOM_NODE_SUPPORTED = typeof Node == 'function' && document instanceof Node;
    var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;

   /**
    * @func
    */
    function templateBindingUpdateFactory(names, getters){
      return function templateBindingUpdate(){
        for (var i = 0, bindingName; bindingName = names[i]; i++)
          this.tmpl.set(bindingName, getters[bindingName](this));
      }
    }

   /**
    * @func
    */
    function getBindingFactory(templateBindings){
      var bindingCache = {};
      return function getBinding(bindings, testNode){
        var cacheId = 'bindingId' in bindings
          ? bindings.bindingId
          : null;

        ;;;if (!cacheId) console.warn('basis.template.Template.getBinding: bindings has no bindingId property, cache is not used');

        var result = bindingCache[cacheId];
        if (!result)
        {
          var names = [];
          var events = {};
          var handler = {};
          var getters = {};
          for (var key in templateBindings)
          {
            var binding = bindings[key];
            var getter = binding && binding.getter;

            if (getter)
            {
              getters[key] = getter;
              names.push(key);

              if (binding.events)
              {
                var eventList = String(binding.events).qw();
                for (var i = 0, eventName; eventName = eventList[i]; i++)
                {
                  ;;;if (testNode && ('event_' + eventName) in testNode == false && typeof console != 'undefined') console.warn('basis.template.Template.getBinding: unknown event `' + eventName + '` for ' + (testNode.constructor && testNode.constructor.className));
                  if (events[eventName])
                  {
                    events[eventName].push(key);
                  }
                  else
                  {
                    if (!handler) handler = {};
                    events[eventName] = [key];
                    handler[eventName] = templateBindingUpdateFactory(events[eventName], getters);
                  }
                }
              }
            }
          }

          result = {
            names: names,
            events: events,
            sync: templateBindingUpdateFactory(names, getters),
            handler: handler
          };

          if (cacheId)
            bindingCache[cacheId] = result;
        }

        return result;
      }
    }

   /**
    * @func
    */
    var bind_node = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue){
          var newNode = newValue instanceof Node ? newValue : domRef;

          if (newNode !== oldNode)
            oldNode.parentNode.replaceChild(newNode, oldNode);

          return newNode;
        }
      // Old browsers way (IE6-8 and other)
      : function(domRef, oldNode, newValue){
          var newNode = newValue && typeof newValue == 'object' ? newValue : domRef;

          if (newNode !== oldNode)
            try {
              oldNode.parentNode.replaceChild(newNode, oldNode);
            } catch(e) {
              newNode = domRef;
              if (oldNode !== newNode)
                oldNode.parentNode.replaceChild(newNode, oldNode);
            }

          return newNode;
        };

   /**
    * @func
    */
    var bind_nodeValue = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue){
          var newNode = newValue instanceof Node ? newValue : domRef;

          if (newNode !== oldNode)
            oldNode.parentNode.replaceChild(newNode, oldNode);

          if (newNode === domRef)
            newNode.nodeValue = newValue;

          return newNode;
        }
      : function(domRef, oldNode, newValue){
          var newNode = bind_node(domRef, oldNode, newValue);

          if (newNode === domRef)
            newNode.nodeValue = newValue;

          return newNode;
        };

   /**
    * @func
    */
    var bind_attrClass = CLASSLIST_SUPPORTED
      // classList supported
      ? function(domRef, oldClass, newValue, prefix){
          var newClass = newValue ? prefix + newValue : "";

          if (newClass != oldClass)
          {
            if (oldClass)
              domRef.classList.remove(oldClass);

            if (newClass)
              domRef.classList.add(newClass);
          }

          return newClass;
        }
      // old browsers are not support for classList
      : function(domRef, oldClass, newValue, prefix){
          var newClass = newValue ? prefix + newValue : "";

          if (newClass != oldClass)
          {
            var classList = domRef.className.split(WHITESPACE);

            if (oldClass)
              classList.remove(oldClass);

            if (newClass)
              classList.push(newClass);

            domRef.className = classList.join(' ');
          }

          return newClass;
        };

   /**
    * @func
    */
    var bind_attr = function(domRef, attrName, oldValue, newValue){
      if (oldValue !== newValue)
      {
        if (newValue)
          domRef.setAttribute(attrName, newValue);
        else
          domRef.removeAttribute(attrName);
      }

      return newValue;
    }

    function buildAttrExpression(binding, l10n){
      var expression = [];
      var symbols = binding[5];
      var dictonary = binding[4];
      var exprVar;
      var colonPos;

      for (var j = 0; j < symbols.length; j++)
        if (typeof symbols[j] == 'string')
          expression.push('"' + symbols[j].replace(quoteEscape, '\\"') + '"');
        else
        {
          exprVar = dictonary[symbols[j]];
          colonPos = exprVar.indexOf(':');
          if (colonPos == -1)
            expression.push(l10n ? '"{' + exprVar + '}"' : '__' + exprVar);
          else
            expression.push('__l10n["' + exprVar.substr(colonPos + 1) + '"]');
        }

      if (expression.length == 1)
        expression.push('""');

      return expression.join('+')
    }

   /**
    * @func
    */
    function buildBindings(bindings){
      var bindMap = {};
      var bindCode;
      var bindVar;
      var domRef;
      var varList = [];
      var result = [];
      var varName;
      var l10nMap;
      var toolsUsed = {};
      ;;;var debugList = [];

      for (var i = 0, binding; binding = bindings[i]; i++)
      {
        domRef = binding[1];
        bindName = binding[2];
        bindCode = bindMap[bindName];
        bindVar = '_' + i;
        varName = '__' + bindName;

        var namePart = bindName.split(':');
        if (namePart[0] == 'l10n' && namePart[1])
        {
          var l10nName = namePart[1];

          if (!l10nMap)
            l10nMap = {};

          if (!bindMap[l10nName])
          {
            bindMap[l10nName] = [];
            l10nMap[l10nName] = [];
          }

          bindCode = bindMap[l10nName]
          bindCode.l10n = true;

          if (binding[0] == TYPE_TEXT)
          {
            bindCode.push(domRef + '.nodeValue=__l10n["' + l10nName + '"];');
            l10nMap[l10nName].push(domRef + '.nodeValue=value;')
          }
          else
          {
            l10nMap[l10nName].push('bind_attr(' + [domRef, '"' + attrName + '"', '{}', buildAttrExpression(binding, true)] + ');')
            varList.push(bindVar);
            bindCode.push(
              bindVar + '=bind_attr(' + [domRef, '"' + attrName + '"', bindVar, buildAttrExpression(binding)] + ');'
            );
          }

          continue;
        }

        if (!bindMap[bindName])
        {
          bindCode = bindMap[bindName] = [];
          varList.push(varName);
        }

        switch(binding[0])
        {
          case TYPE_ELEMENT:
          case TYPE_COMMENT:
            ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

            varList.push(bindVar + '=' + domRef);
            toolsUsed.bind_node = true;
            bindCode.push(
              bindVar + '=bind_node(' + [domRef, bindVar] + ',value);'
            );
            break;
          case TYPE_TEXT:
            ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

            varList.push(bindVar + '=' + domRef);
            toolsUsed.bind_nodeValue = true;
            bindCode.push(
              bindVar + '=bind_nodeValue(' + [domRef, bindVar] + ',value);'
            );   
            break;
          case TYPE_ATTRIBUTE:
            var attrName = binding[3];

            ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',attr:"' + attrName + '",val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

            if (attrName == 'class')
            {
              var prefixes = binding[4];

              for (var j = 0; j < prefixes.length; j++)
              {
                varList.push(bindVar + '=""');
                toolsUsed.bind_attrClass = true;
                bindCode.push(
                  bindVar + '=bind_attrClass(' + [domRef, bindVar, 'value', '"' + prefixes[j] + '"'] + ');'
                );
              }
            }
            else
            {
              toolsUsed.bind_attr = true;
              varList.push(bindVar + '=' + buildAttrExpression(binding, true));
              bindCode.push(
                bindVar + '=bind_attr(' + [domRef, '"' + attrName + '"', bindVar, buildAttrExpression(binding)] + ');'
              );
            }
            break;
        }
      }

      result.push(
        'function set(bindName,value){\n' +
          'value=resolve(attaches,updateAttach,bindName,value);' +
          'switch(bindName){'
      );

      for (var bindName in bindMap)
        result.push(
          'case"' + bindName + '":\n' +
          (bindMap[bindName].l10n
            ? bindMap[bindName].join('\n')
            : 'if(__' + bindName + '!==value)' +
              '{' +
                '__' + bindName + '=value;\n' +
                bindMap[bindName].join('\n') +
              '}') +
          'break;'
        );

      result.push('}}');

      for (var key in toolsUsed)
        varList.push(key + '=tools.' + key);

      return {
        /** @cut */debugList: debugList,
        vars: varList,
        l10n: l10nMap,
        getBinding: getBindingFactory(bindMap),
        body: result.join('')
      };
    }

    function resolveValue(attaches, updateAttach, bindingName, value){
      var bridge = value && value.bindingBridge;
      var oldAttach = attaches[bindingName];

      if (bridge || oldAttach)
      {
        if (bridge)
        {
          if (value !== oldAttach)
          {
            if (oldAttach)
              oldAttach.bindingBridge.detach(oldAttach, updateAttach, bindingName);
            bridge.attach(value, updateAttach, bindingName);
            attaches[bindingName] = value;
          }

          value = bridge.get(value);
        }
        else
        {
          if (oldAttach)
          {
            oldAttach.bindingBridge.detach(oldAttach, updateAttach, bindingName);
            delete attaches[bindingName];
          }
        }
      }
      return value;
    };

    var tools = {
      bind_nodeValue: bind_nodeValue,
      bind_node: bind_node,
      bind_attr: bind_attr,
      bind_attrClass: bind_attrClass,
      resolve: resolveValue
    };

    return function(tokens){
      var pathes = buildPathes(tokens, '_');
      var bindings = buildBindings(pathes.binding);
      var proto = buildHtml(tokens);
      var templateMap = {};
      var l10nMap;

      if (bindings.l10n)
      {
        l10nMap = {};

        var code = [];
        for (var key in bindings.l10n)
          code.push(
            'case"' + key +'":\n' +
            '__l10n["' + key + '"]=value;' +
            bindings.l10n[key].join(';') +
            'break;'
          );

        var l10nProtoUpdate = new Function('_', '__l10n', 'bind_attr', 'var ' + pathes.path + ';return function(token, value){' +
          'switch(token){' +
            code.join('') +
          '}' +
        '}');
        //console.log(l10nProtoUpdate);
        l10nProtoUpdate = l10nProtoUpdate(proto, l10nMap, bind_attr);

        //console.log('>>>> ' + l10nProtoUpdate);

        for (var key in bindings.l10n)
          l10nProtoUpdate(key, basis.l10n.getToken(key).value);
      }

      var build = function(){
        return proto.cloneNode(true);
      };

      /** @cut */try {
      var fnBody;
      var createInstance = new Function('gMap', 'tMap', 'build', 'tools', '__l10n', fnBody = 'return function createInstance_(obj,actionCallback,updateCallback){' + 
        'var _=build(),id=gMap.seed++,attaches={},resolve=tools.resolve,' + pathes.path.concat(bindings.vars) + ';\n' +
        'if(obj&&a&&a.nodeType!=3)gMap[a.basisObjectId=id]=obj;\n' +
        'function updateAttach(){set(String(this),attaches[this])};\n' +
        bindings.body +
        /**@cut*/';set.debug=function(){return[' + bindings.debugList.join(',') + ']}' +
        ';return tMap[id]={' + [pathes.ref, 'set:set,rebuild:function(){if(updateCallback)updateCallback.call(obj)},' +
        'destroy:function(){' +
          'for(var key in attaches)if(attaches[key])attaches[key].bindingBridge.detach(attaches[key],updateAttach,key);' +
          'attaches=null;' +
          'delete tMap[id];' + 
          /**@cut*/'delete set.debug;' + 
          'if(obj)delete gMap[id]}'] +
        '}' +
      '}');
      //console.log(createInstance);
      createInstance = createInstance(tmplNodeMap, templateMap, build, tools, l10nMap);
      /** @cut */} catch(e) { console.warn("can't build createInstance\n", fnBody); }

      return {
        createInstance: createInstance,
        getBinding: bindings.getBinding,
        l10nProtoUpdate: l10nProtoUpdate,
        l10n: bindings.l10n,
        map: templateMap
      };
    }
  })();


  //
  // Constructs dom structure
  //

 /**
  * @func
  */
  function createEventHandler(attrName){
    return function(event){
      if (event && event.type == 'click' && event.which == 3)
        return;

      var cursor = domEvent.sender(event);
      var attr;
      var refId;

      // IE events may have no source
      if (!cursor)
        return;

      // search for nearest node with event-{eventName} attribute
      do {
        if (attr = (cursor.getAttributeNode && cursor.getAttributeNode(attrName)))
          break;
      } while (cursor = cursor.parentNode);

      // if not found - exit
      if (!cursor || !attr)
        return;

      // search for nearest node refer to basis.Class instance
      do {
        if (refId = cursor.basisObjectId)
        {
          // if found call templateAction method
          var node = tmplNodeMap[refId];
          if (node && node.templateAction)
          {
            var actions = attr.nodeValue.qw();

            for (var i = 0, actionName; actionName = actions[i++];)
              node.templateAction(actionName, domEvent(event));

            break;
          }
        }
      } while (cursor = cursor.parentNode);
    }
  }


 /**
  * Creates dom structure by declaration.
  */
  var buildHtml = function(tokens){
    var result = document.createDocumentFragment();
    var attrs;
    var childs;
    var element;

    for (var i = 0, token; token = tokens[i]; i++)
    {
      switch(token[TOKEN_TYPE])
      {
        case TYPE_ELEMENT: 
          var tagName = token[ELEMENT_NAME];
          var parts = tagName.split(/:/);

          element = parts.length > 1
            ? document.createElementNS(namespaceURI[parts[0]], tagName)
            : document.createElement(tagName);

          // process for attributes
          if (attrs = token[ELEMENT_ATTRS])
            for (var j = 0, attr; attr = attrs[j]; j++)
            {
              var attrName = attr[ATTR_NAME];
              var m;

              element.setAttribute(attrName, attr[ATTR_VALUE]);

              if (m = attrName.match(eventAttr))
              {
                var eventName = m[1];
                if (!tmplEventListeners[eventName])
                {
                  tmplEventListeners[eventName] = createEventHandler(attrName);

                  for (var k = 0, names = domEvent.browserEvents(eventName), browserEventName; browserEventName = names[k++];)
                    domEvent.addGlobalHandler(browserEventName, tmplEventListeners[eventName]);
                }

                // hack for non-bubble events in IE<=8
                if (!domEvent.W3CSUPPORT)
                {
                  var eventInfo = domEvent.getEventInfo(eventName, tagName);
                  if (eventInfo.supported && !eventInfo.bubble)
                    element.attachEvent('on' + eventName, function(eventName){
                      return function(){
                        domEvent.fireEvent(document, eventName);
                      }
                    }(eventName));
                }
              }
            }

          // precess for childs
          if (childs = token[ELEMENT_CHILDS]) // childs
            element.appendChild(buildHtml(childs));

          // add to result
          result.appendChild(element);
          break;

        case TYPE_COMMENT:
          result.appendChild(document.createComment(token[COMMENT_VALUE]));
          break;

        case TYPE_TEXT:
          // fix bug with normalize text node in IE8-
          if (CLONE_NORMALIZE_TEXT_BUG && i && tokens[i - 1][TOKEN_TYPE] == TYPE_TEXT)
            result.appendChild(document.createComment(''));

          result.appendChild(document.createTextNode(token[TEXT_VALUE]));
          break;
      }
    }

    return result;
  };


 /**
  * @func
  */
  function templateSourceUpdate(){
    if (this.instances_)
      buildTemplate.call(this);
  }

 /**
  * @func
  */
  function buildTemplate(){
    var instances = this.instances_;
    var source = String(
      typeof this.source == 'function'
        ? this.source()
        : this.source
    );

    var decl = this.isDecl ? source.toObject() : makeDeclaration(source);
    var funcs = makeFunctions(decl);
    var l10n = this.l10n_;

    if (l10n)
    {
      this.l10n_ = null;
      for (var i = 0, link; link = l10n[i]; i++)
        link.token.detach(link.handler, link);
    }

    this.createInstance = funcs.createInstance;
    this.getBinding = funcs.getBinding;
    this.instances_ = funcs.map;
    var l10nProtoUpdate = funcs.l10nProtoUpdate;

    if (instances)
    {
      for (var id in instances)
        instances[id].rebuild();
    }

    if (funcs.l10n)
    {
      l10n = [];
      this.l10n_ = l10n;
      instances = funcs.map;
      for (var key in funcs.l10n)
      {
        var link = {
          path: key,
          token: basis.l10n.getToken(key),
          handler: function(value){
            l10nProtoUpdate(this.path, value);
            for (var id in instances)
              instances[id].set(this.path, value);
          }
        };
        link.token.attach(link.handler, link);
        l10n.push(link);
      }
    }
  }


  //
  // source from script by id
  //

  function sourceById(sourceId){
    var host = document.getElementById(sourceId);
    if (host && host.tagName == 'SCRIPT')
    {
      var content = host.textContent || host.text;

      switch (host.type)
      {
        case 'text/basis-template':
        default:
          return content;
      }
    }

    ;;;if (typeof console != 'undefined') console.warn('Template script element with id `' + sourceId + '` not found');
  }

  function resolveSourceById(sourceId){
    return function(){
      return sourceById(sourceId);
    }
  }

 /**
  * Creates DOM structure template from marked HTML. Use {basis.Html.Template#createInstance}
  * method to apply template to object. It creates clone of DOM structure and adds
  * links into object to pointed parts of structure.
  *
  * To remove links to DOM structure from object use {basis.Html.Template#clearInstance}
  * method.
  * @example
  *   // create a template
  *   var template = new basis.html.Template(
  *     '<li{element} class="listitem">' +
  *       '<a href{hrefAttr}="#">{titleText}</a>' + 
  *       '<span class="description">{descriptionText}</span>' +
  *     '</li>'
  *   );
  *   
  *   // create 10 DOM elements using template
  *   for (var i = 0; i < 10; i++)
  *   {
  *     var tmpl = template.createInstance();
  *     basis.cssom.classList(tmpl.element).add('item' + i);
  *     tmpl.hrefAttr.nodeValue = '/foo/bar.html';
  *     tmpl.titleText.nodeValue = 'some title';
  *     tmpl.descriptionText.nodeValue = 'description text';
  *   }
  *   
  * @class
  */
  var Template = Class(null, {
    className: namespace + '.Template',

    __extend__: function(value){
      if (value instanceof Template)
        return value;
      else
        return new Template(value);
    },

   /**
    * @param {string|function()} template Template source code that will be parsed
    * into DOM structure prototype. Parsing will be initiated on first
    * {basis.Html.Template#createInstance} call. If function passed it be called at
    * first {basis.Html.Template#createInstance} and it's result will be used as
    * template source code.
    * @constructor
    */
    init: function(templateSource){
      this.setSource(templateSource);
    },

   /**
    * Create DOM structure and return object with references for it's nodes.
    * @param {Object=} object Storage for DOM references.
    * @param {Object=} node Object which templateAction method will be called on events.
    * @return {Object}
    */
    createInstance: function(node, ac, uc){
      buildTemplate.call(this);
      return this.createInstance(node, ac, uc);
    },

   /**
    * Remove reference from DOM structure
    * @param {Object=} object Storage of DOM references.
    * @param {Object=} node Object which templateAction method.
    */
    clearInstance: function(object, node){
      object.destroy();
    },

    getBinding: function(bindings){
      buildTemplate.call(this);
      return this.getBinding(bindings);
    },

    setSource: function(source){
      var oldSource = this.source;
      if (oldSource != source)
      {
        this.isDecl = false;

        if (typeof source == 'string')
        {
          var m = source.match(/^([a-z]+):/);
          if (m)
          {
            var prefix = m[1];

            source = source.substr(m[0].length);

            switch (prefix)
            {
              case 'file':
                source = basis.resource(source);
                break;
              case 'id':
                // source from script element
                source = resolveSourceById(source);
              case 'tokens':
                this.isDecl = true;
              case 'raw':
                //source = source;
                break;
              default:
                ;;;console.warn(namespace + '.Template.setSource: Unknown prefix ' + prefix + ' for template source was ingnored.')
            }
          }
        }

        if (oldSource && oldSource.bindingBridge)
        {
          var tmplList = oldSource.url && tmplFilesMap[oldSource.url];
          if (tmplList)
          {
            tmplList.remove(this);
            if (!tmplList.length)
              delete tmplFilesMap[oldSource.url];
          }

          this.source.bindingBridge.detach(oldSource, templateSourceUpdate, this);
        }

        if (source && source.bindingBridge)
        {
          if (source.url)
          {
            if (!tmplFilesMap[source.url])
              tmplFilesMap[source.url] = [];
            tmplFilesMap[source.url].add(this);
          }

          source.bindingBridge.attach(source, templateSourceUpdate, this);
        }

        this.source = source;

        templateSourceUpdate.call(this);
      }
    }
  });


  //
  // export names
  //

  this.extend({
    Template: Template,

    // for debug purposes
    tokenize: tokenize,
    makeDeclaration: makeDeclaration,
    buildPathes: buildPathes,
    makeFunctions: makeFunctions,
    buildHtml: buildHtml,

    filesMap: tmplFilesMap,
    resolveObjectById: function(refId){
      return tmplNodeMap[refId];
    }
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/template.js").call(basis.namespace("basis.template"), basis.namespace("basis.template"), basis.namespace("basis.template").exports, this, __curLocation + "src/basis/template.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/html.js
//

new Function(__wrapArgs, function(){

/**
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

  basis.require('basis.dom');
  basis.require('basis.template');


 /**
  * @namespace basis.html
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var dom = basis.dom;


  var Template = basis.template.Template;


 /**
  * @func
  */
  function escape(html){
    return dom.createElement('div', dom.createText(html)).innerHTML;
  }

 /**
  * @func
  */
  var unescapeElement = document.createElement('div');
  function unescape(escapedHtml){
    unescapeElement.innerHTML = escapedHtml;
    return unescapeElement.firstChild.nodeValue;
  }

 /**
  * @func
  */
  function string2Html(text){
    unescapeElement.innerHTML = text;
    return dom.createFragment.apply(null, Array.from(unescapeElement.childNodes));
  }


  //
  // export names
  //

  this.extend({
    Template: Template,
    escape: escape,
    unescape: unescape,
    string2Html: string2Html
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/html.js").call(basis.namespace("basis.html"), basis.namespace("basis.html"), basis.namespace("basis.html").exports, this, __curLocation + "src/basis/html.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/dom/wrapper.js
//

new Function(__wrapArgs, function(){

/**
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

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.data');
  basis.require('basis.html');


 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Non-visual DOM classes:
  *   {basis.dom.wrapper.AbstractNode},
  *   {basis.dom.wrapper.Node}, {basis.dom.wrapper.PartitionNode},
  *   {basis.dom.wrapper.GroupingNode}
  * - Datasets:
  *   {basis.dom.wrapper.ChildNodesDataset}, {basis.dom.wrapper.Selection}
  *
  * @namespace basis.dom.wrapper
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var nsData = basis.data;

  var createEvent = basis.event.create;
  var events = basis.event.events;
  var LISTEN = basis.event.LISTEN;

  var SUBSCRIPTION = nsData.SUBSCRIPTION;
  var DataObject = nsData.DataObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;

  var STATE = nsData.STATE;

  var getter = Function.getter;
  var nullGetter = Function.nullGetter;
  var $undef = Function.$undef;
  var complete = Object.complete;
  var oneFunctionProperty = Class.oneFunctionProperty;


  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
  /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
  /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
  /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';
  /** @const */ var EXCEPTION_DATASOURCE_CONFLICT = namespace + ': Operation is not allowed because node is under dataSource control';
  /** @const */ var EXCEPTION_PARENTNODE_OWNER_CONFLICT = namespace + ': Node can\'t has owner and parentNode';

  var DELEGATE = {
    NONE: 'none',
    PARENT: 'parent',
    OWNER: 'owner'
  };

  function sortingSearch(node){
    return node.sortingValue || 0; // it's important return a zero when sortingValue is undefined,
                                   // because in this case sorting may be broken; it's also not a problem
                                   // when zero equivalent values (null, false or empty string) converts to zero
  }

  function sortAsc(a, b){
    a = a.sortingValue || 0;
    b = b.sortingValue || 0;
    return +(a > b) || -(a < b);
  }

  function sortDesc(a, b){
    a = a.sortingValue || 0;
    b = b.sortingValue || 0;
    return -(a > b) || +(a < b);
  }

  function sortChildNodes(obj){
    return obj.childNodes.sort(
      obj.sortingDesc
        ? sortDesc
        : sortAsc
    );
  }


  function updateNodeContextSelection(root, oldSelection, newSelection, rootUpdate, ignoreRootSelection){
    // exit if no changes
    if (oldSelection === newSelection)
      return;

    // main part
    var nextNode;
    var cursor = root;
    var selected = [];

    // update root context selection if necessary
    if (rootUpdate)
    {
      root.contextSelection = newSelection;
      if (root.selected)
        selected.push(root);
    }

    while (cursor)
    {
      // go into deep
      // if node has selection and node is not root, don't go into deep
      nextNode = !cursor.selection || (ignoreRootSelection && cursor === root)
        ? cursor.firstChild
        : null;

      if (nextNode && nextNode.contextSelection !== oldSelection)
        throw 'Try change wrong context selection';

      while (!nextNode)
      {
        // stop traversal if cursor on root again
        if (cursor === root)
        {
          // remove selected nodes from old selection, or add to new one
          if (selected.length)
          {
            if (oldSelection)
              oldSelection.remove(selected);

            if (newSelection)
              newSelection.add(selected);
          }

          return;
        }

        // go to next sibling
        nextNode = cursor.nextSibling;

        // if no sibling, going up
        if (!nextNode)
          cursor = cursor.parentNode;
      }

      // update cursor
      cursor = nextNode;

      // store selected nodes
      if (cursor.selected)
        selected.push(cursor);

      // change context selection
      cursor.contextSelection = newSelection;
    }
  }


  //
  // registrate new subscription types
  //

  SUBSCRIPTION.add(
    'OWNER',
    {
      ownerChanged: function(object, oldOwner){
        this.remove(object, oldOwner);
        this.add(object, object.owner);
      }
    },
    function(action, object){
      action(object, object.owner);
    }
  );

  SUBSCRIPTION.add(
    'DATASOURCE',
    {
      dataSourceChanged: function(object, oldDataSource){
        this.remove(object, oldDataSource);
        this.add(object, object.dataSource);
      }
    },
    function(action, object){
      action(object, object.dataSource);
    }
  );


  //
  // AbstractNode
  //

  // default satellite config
  var NULL_SATELLITE_CONFIG = Class.customExtendProperty(
    {},
    function(result, extend){
      for (var key in extend)
      {
        var config = extend[key];

        if (Class.isClass(config))
          config = {
            instanceOf: config
          };

        if (config && typeof config == 'object')
        {
          var hookRequired = false;
          var contextConfig = {
            instanceOf: config.instanceOf
          };
          var context = {
            key: key,
            config: contextConfig
          };

          if (typeof config.config)
            contextConfig.config = config.config;

          if (typeof config.existsIf == 'function')
            hookRequired = contextConfig.existsIf = config.existsIf;

          if (typeof config.delegate == 'function')
            hookRequired = contextConfig.delegate = config.delegate;

          if (typeof config.dataSource == 'function')
            hookRequired = contextConfig.dataSource = config.dataSource;

          if (hookRequired)
          {
            var hook = config.hook
              ? SATELLITE_OWNER_HOOK.__extend__(config.hook)
              : SATELLITE_OWNER_HOOK;

            for (var hookEvent in hook)
              if (hook[hookEvent] === SATELLITE_UPDATE)
              {
                context.hook = hook;
                break;
              }
          }

          result[key] = context;
        }
        else
          result[key] = null;
      }
    }
  );

  var SATELLITE_UPDATE = function(){
    // this -> {
    //   owner: owner,
    //   context: { 
    //     key: satelliteName,
    //     config: satelliteConfig
    //   }
    // }
    var owner = this.owner;
    var key = this.context.key;
    var config = this.context.config;

    var exists = !config.existsIf || config.existsIf(owner);
    var satellite = owner.satellite[key];

    if (exists)
    {
      if (satellite)
      {
        if (config.delegate)
          satellite.setDelegate(config.delegate(owner));

        if (config.dataSource)
          satellite.setDataSource(config.dataSource(owner));
      }
      else
      {
        var satelliteConfig = (
          typeof config.config == 'function'
            ? config.config(owner)
            : config.config
        ) || {};

        satelliteConfig.owner = owner;

        if (config.delegate)
          satelliteConfig.delegate = config.delegate(owner);

        if (config.dataSource)
          satelliteConfig.dataSource = config.dataSource(owner);

        satellite = new config.instanceOf(satelliteConfig);

        owner.satellite[key] = satellite;
        owner.event_satelliteChanged(this, key, null);

        if (owner.listen.satellite)
          satellite.addHandler(owner.listen.satellite, owner);
      }
    }
    else
    {
      if (satellite)
      {
        delete owner.satellite[key];

        owner.event_satelliteChanged(owner, key, satellite);

        satellite.destroy();
      }
    }
  };

  // default satellite hooks
  var SATELLITE_OWNER_HOOK = oneFunctionProperty(
    SATELLITE_UPDATE,
    {
      update: true
    }
  );


  //
  // reg new type of listen
  //

  LISTEN.add('owner', 'ownerChanged');
  LISTEN.add('dataSource', 'dataSourceChanged');


 /**
  * @class
  */
  var AbstractNode = Class(DataObject, {
    className: namespace + '.AbstractNode',

    //
    // events
    //

   /**
    * @inheritDoc
    */
    event_update: function(object, delta){
      DataObject.prototype.event_update.call(this, object, delta);

      var parentNode = this.parentNode;
      if (parentNode)
      {
        if (parentNode.matchFunction)
          this.match(parentNode.matchFunction);

        // re-insert to change position, group, sortingValue etc.
        parentNode.insertBefore(this, this.nextSibling);
      }
    },

    // new events

   /**
    * This is a general event for notification of childs changes to the parent node.
    * It may be dispatched after a single modification to the childNodes or after
    * multiple changes have occurred. 
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {object} delta Delta of changes.
    * @event
    */
    event_childNodesModified: createEvent('childNodesModified', 'node', 'delta') && function(node, delta){
      events.childNodesModified.call(this, node, delta);

      var listen = this.listen.childNode;
      var array;
      if (listen)
      {
        if (array = delta.inserted)
          for (var i = 0, child; child = array[i]; i++)
            child.addHandler(listen, this);

        if (array = delta.deleted)
          for (var i = 0, child; child = array[i]; i++)
            child.removeHandler(listen, this);
      }
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.data.AbstractDataset} oldDataSource
    */
    event_dataSourceChanged: createEvent('dataSourceChanged', 'node', 'oldDataSource'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.GroupingNode} oldGroupingNode
    */
    event_groupingChanged: createEvent('groupingChanged', 'node', 'oldGroupingNode'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {function()} oldSorting
    * @param {boolean} oldSortingDesc
    */
    event_sortingChanged: createEvent('sortingChanged', 'node', 'oldSorting', 'oldSortingDesc'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    event_ownerChanged: createEvent('ownerChanged', 'node', 'oldOwner'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node Initiator of event
    * @param {string} key
    * @param {basis.dom.wrapper.AbstractNode} oldSattelite Old satellite for key
    */
    event_satelliteChanged: createEvent('satelliteChanged', 'node', 'key', 'oldSattelite'),

    //
    // properties
    //

   /**
    * @inheritDoc
    */
    subscribeTo: DataObject.prototype.subscribeTo + SUBSCRIPTION.DATASOURCE,

   /**
    * @inheritDoc
    */
    listen: {
      owner: {
        destroy: function(){
          this.setOwner();
        }
      }
    },

   /**
    * Flag determines object behaviour to delegate some related object
    * @type {basis.dom.wrapper.DELEGATE}
    */
    autoDelegate: DELEGATE.NONE,

   /**
    * @type {string}
    * @readonly
    */
    nodeType: 'DOMWrapperNode',

   /**
    * A list that contains all children of this node. If there are no children,
    * this is a list containing no nodes.
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    childNodes: null,

   /**
    * All child nodes must be instances of childClass.
    * @type {Class}
    */
    childClass: AbstractNode,

   /**
    * Object that's manage childNodes updates.
    * @type {basis.data.AbstractDataset}
    */
    dataSource: null,

   /**
    * Map dataSource members to child nodes.
    * @type {Object}
    * @private
    */
    dataSourceMap_: null,

   /**
    * @type {Boolean}
    */
    destroyDataSourceMember: true,

   /**
    * The parent of this node. All nodes may have a parent. However, if a node
    * has just been created and not yet added to the tree, or if it has been
    * removed from the tree, this is null. 
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    parentNode: null,

   /**
    * The node immediately following this node. If there is no such node,
    * this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    nextSibling: null,

   /**
    * The node immediately preceding this node. If there is no such node,
    * this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    previousSibling: null,

   /**
    * The first child of this node. If there is no such node, this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    firstChild: null,

   /**
    * The last child of this node. If there is no such node, this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    lastChild: null,

   /**
    * Sorting function
    * @type {function(node)}
    */
    sorting: nullGetter,

   /**
    * Sorting direction
    * @type {boolean}
    */
    sortingDesc: false,

   /**
    * GroupingNode config
    * @see ./demo/common/grouping.html
    * @see ./demo/common/grouping_of_grouping.html
    * @type {basis.dom.wrapper.GroupingNode}
    */
    grouping: null,

   /**
    * Class for grouping control. Class should be inherited from {basis.dom.wrapper.GroupingNode}
    * @type {Class}
    */
    groupingClass: null,

   /**
    * Reference to group node in grouping
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    groupNode: null,

   /**
    * Hash of satellite object configs.
    * @type {Object}
    */
    satelliteConfig: NULL_SATELLITE_CONFIG,

   /**
    * Satellite objects storage.
    * @type {Object}
    */
    satellite: null,

   /**
    * Node owner. Generaly using by satellites and GroupingNode.
    * @type {basis.dom.wrapper.AbstractNode}
    */
    owner: null,

    //
    // methods
    //

   /**
    * Process on init:
    *   - grouping
    *   - childNodes
    *   - dataSource
    *   - satelliteConfig
    *   - owner
    * @param {Object} config
    * @return {Object} Returns a config. 
    * @constructor
    */
    init: function(config){

      var dataSource = this.dataSource;
      var childNodes = this.childNodes;
      var grouping = this.grouping;

      ;;;if (('autoDelegateParent' in this) && typeof console != 'undefined') console.warn('autoDelegateParent property is deprecate. Use autoDelegate instead');

      if (dataSource)
        this.dataSource = null; // NOTE: reset dataSource before inherit -> prevent double subscription activation
                                // when this.active == true and dataSource is assigned

      // inherit
      DataObject.prototype.init.call(this, config);

      if (grouping)
      {
        this.grouping = null;
        this.setGrouping(grouping);
      }

      // init properties
      if (this.childClass)
      {
        // init child nodes storage
        this.childNodes = [];

        // set dataSource
        if (dataSource)
        {
          this.dataSource = null;
          this.setDataSource(dataSource);
        }
        else
        {
          if (childNodes)
            this.setChildNodes(childNodes);
        }
      }
      else
      {
        if (childNodes)
          this.childNodes = null;

        if (dataSource)
          this.dataSource = null;
      }

      // process satellite
      if (!this.satellite)
        this.satellite = {};
      else
      {
        var satelliteListen = this.listen.satellite;
        for (var key in this.satellite)
        {
          var satellite = this.satellite[key];

          satellite.setOwner(this);
          this.event_satelliteChanged(this, key, null);

          if (satelliteListen)
            satellite.addHandler(satelliteListen, this);
        }  
      }

      if (this.satelliteConfig !== NULL_SATELLITE_CONFIG)
      {
        for (var key in this.satelliteConfig)
        {
          var satelliteConfig = this.satelliteConfig[key];
          if (satelliteConfig && typeof satelliteConfig == 'object')
          {
            var context = {
              context: satelliteConfig,
              owner: this
            };

            if (satelliteConfig.hook)
              this.addHandler(satelliteConfig.hook, context);

            SATELLITE_UPDATE.call(context);
          }
        }
      }

      var owner = this.owner;
      if (owner)
      {
        this.owner = null;
        this.setOwner(owner);
      }
    },

    setSatellite: function(key, satellite){
      var oldSatellite = this.satellite[key];

      if (satellite instanceof DataObject == false)
        satellite = null;

      if (oldSatellite != satellite && !this.satelliteConfig[key])
      {
        var satelliteListen = this.listen.satellite;

        if (oldSatellite)
        {
          oldSatellite.setOwner(null);
          if (satelliteListen)
            oldSatellite.removeHandler(satelliteListen, this);
        }

        this.satellite[key] = satellite;

        if (satellite)
        {
          satellite.setOwner(this);
          if (satelliteListen)
            satellite.addHandler(satelliteListen, this);
        }

        this.event_satelliteChanged(this, key, oldSatellite);
      }
    },

   /**
    * Adds the node newChild to the end of the list of children of this node. If the newChild is already in the tree, it is first removed.
    * @param {basis.dom.wrapper.AbstractNode} newChild The node to add.
    * @return {basis.dom.wrapper.AbstractNode} The node added.
    */
    appendChild: function(newChild){
    },

   /**
    * Inserts the node newChild before the existing child node refChild. If refChild is null, insert newChild at the end of the list of children.
    * @param {basis.dom.wrapper.AbstractNode} newChild The node to insert.
    * @param {basis.dom.wrapper.AbstractNode} refChild The reference node, i.e., the node before which the new node must be inserted.
    * @return {basis.dom.wrapper.AbstractNode} The node being inserted.
    */
    insertBefore: function(newChild, refChild){
    },

   /**
    * Removes the child node indicated by oldChild from the list of children, and returns it.
    * @param {basis.dom.wrapper.AbstractNode} oldChild The node being removed.
    * @return {basis.dom.wrapper.AbstractNode} The node removed.
    */
    removeChild: function(oldChild){
    },

   /**
    * Replaces the child node oldChild with newChild in the list of children, and returns the oldChild node.
    * @param {basis.dom.wrapper.AbstractNode} newChild The new node to put in the child list.
    * @param {basis.dom.wrapper.AbstractNode} oldChild The node being replaced in the list.
    * @return {basis.dom.wrapper.AbstractNode} The node replaced.
    */
    replaceChild: function(newChild, oldChild){
    },

   /**
    * Removes all child nodes from the list of children, fast way to remove all childs.
    * @param {boolean} alive
    */
    clear: function(alive){
    },

   /**
    * Returns whether this node has any children. 
    * @return {boolean} Returns true if this node has any children, false otherwise.
    */
    setChildNodes: function(){
    },

   /**
    * @param {Object|function()|string} grouping
    * @param {boolean} alive Keep grouping node alive after unlink
    */
    setGrouping: function(grouping, alive){
    },

   /**
    * @param {function()|string} sorting
    * @param {boolean} desc
    */
    setSorting: function(sorting, desc){
    },

   /**
    * @param {basis.data.AbstractDataset} dataSource
    */
    setDataSource: function(dataSource){
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} owner
    */
    setOwner: function(owner){
      if (!owner || owner instanceof AbstractNode == false)
        owner = null;

      if (owner && this.parentNode)
        throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;

      var oldOwner = this.owner;
      if (oldOwner !== owner)
      {
        this.owner = owner;

        this.event_ownerChanged(this, oldOwner);

        if (this.autoDelegate == DELEGATE.OWNER)
          this.setDelegate(owner);
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // This order of actions is better for perfomance: 
      // inherit destroy -> clear childNodes -> remove from parent
      // DON'T CHANGE ORDER WITH NO ANALIZE AND TESTS

      // inherit (fire destroy event & remove handlers)
      DataObject.prototype.destroy.call(this);

      // delete childs
      if (this.dataSource)
      {
        // drop dataSource
        this.setDataSource();
      }
      else
      {
        // has children
        if (this.firstChild)
          this.clear();
      }

      // unlink from parent
      if (this.parentNode)
        this.parentNode.removeChild(this);

      // destroy group control
      if (this.grouping)
      {
        this.grouping.setOwner();
        this.grouping = null;
      }

      // drop owner
      if (this.owner)
        this.setOwner();

      // destroy satellites
      if (this.satellite)
      {
        for (var key in this.satellite)
        {
          var satellite = this.satellite[key];
          satellite.owner = null;  // should we drop owner?
          satellite.destroy();
        }
        this.satellite = null;
      }

      // remove pointers
      this.childNodes = null;
      this.parentNode = null;
      this.previousSibling = null;
      this.nextSibling = null;
      this.firstChild = null;
      this.lastChild = null;
    }
  });

 /**
  * @class
  */
  var PartitionNode = Class(AbstractNode, {
    className: namespace + '.PartitionNode',

   /**
    * Destroy object if it doesn't contain any children (became empty).
    * @type {boolean}
    */
    autoDestroyIfEmpty: false,

   /**
    * The list of partition members.
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    nodes: null,

   /**
    * First item in nodes if exists.
    * @type {basis.dom.wrapper.AbstractNode}
    */
    first: null,

   /**
    * Last item in nodes if exists.
    * @type {basis.dom.wrapper.AbstractNode}
    */
    last: null,

   /**
    * @constructor
    */
    init: function(config){
      this.nodes = [];
      AbstractNode.prototype.init.call(this, config);
    },

   /**
    * Works like insertBefore, but don't update newNode references.
    * @param {basis.dom.wrapper.AbstractNode} newNode
    * @param {basis.dom.wrapper.AbstractNode} refNode
    */
    insert: function(newNode, refNode){
      var nodes = this.nodes;
      var pos = refNode ? nodes.indexOf(refNode) : -1;

      if (pos == -1)
      {
        nodes.push(newNode)
        this.last = newNode;
      }
      else
        nodes.splice(pos, 0, newNode);

      this.first = nodes[0];

      newNode.groupNode = this;

      this.event_childNodesModified(this, { inserted: [newNode] });
    },

   /**
    * Works like removeChild, but don't update oldNode references.
    * @param {basis.dom.wrapper.AbstractNode} oldNode
    */
    remove: function(oldNode){
      var nodes = this.nodes;
      if (nodes.remove(oldNode))
      {
        this.first = nodes[0] || null;
        this.last = nodes[nodes.length - 1] || null;
        oldNode.groupNode = null;

        this.event_childNodesModified(this, { deleted: [oldNode] });
      }

      if (!this.first && this.autoDestroyIfEmpty)
        this.destroy();
    },

   /**
    * @inheritDoc
    */
    clear: function(){
      // if node haven't nodes do nothing (event don't fire)
      if (!this.first)
        return;

      // store childNodes
      var nodes = this.nodes;

      // unlink all nodes from partition
      for (var i = nodes.length; i --> 0;)
        nodes[i].groupNode = null;

      // clear nodes & pointers
      this.nodes = [];
      this.first = null;
      this.last = null;

      this.event_childNodesModified(this, { deleted: nodes });

      // destroy partition if necessary
      if (this.autoDestroyIfEmpty)
        this.destroy();
    },

   /**
    * @destructor
    */
    destroy: function(){
      AbstractNode.prototype.destroy.call(this);

      this.nodes = null;
      this.first = null;
      this.last = null;        
    }
  });

  /*
   *  Hierarchy handlers & methods
   */

  var DOMMIXIN_DATASOURCE_HANDLER = {
    datasetChanged: function(dataSource, delta){
      var newDelta = {};
      var deleted = [];

      // WARN: it is better process deleted nodes before inserted, because if all child nodes
      // are replaced for new one, we able to use fast clear and setChildNodes methods

      // delete nodes
      if (delta.deleted)
      {
        newDelta.deleted = deleted;
        if (this.childNodes.length == delta.deleted.length)
        {
          // copy childNodes to deleted
          deleted = Array.from(this.childNodes);

          // optimization: if all old nodes deleted -> clear childNodes
          var tmp = this.dataSource;
          this.dataSource = null;
          this.clear(true);   // keep alive, event fires
          this.dataSource = tmp;
          this.dataSourceMap_ = {};
        }
        else
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
          {
            var delegateId = item.eventObjectId;
            var oldChild = this.dataSourceMap_[delegateId];

            delete this.dataSourceMap_[delegateId];
            oldChild.canHaveDelegate = true; // allow delegate drop
            this.removeChild(oldChild);

            deleted.push(oldChild);
          }
        }
      }

      // insert new nodes
      if (delta.inserted)
      {
        newDelta.inserted = [];
        for (var i = 0, item; item = delta.inserted[i]; i++)
        {
          var newChild = createChildByFactory(this, {
            cascadeDestroy: false,     // NOTE: it's important set cascadeDestroy to false, otherwise
                                       // there will be two attempts to destroy node - 1st on delegate
                                       // destroy, 2nd on object removal from dataSource
            //canHaveDelegate: false,  // NOTE: we can't set canHaveDelegate in config, because it
                                       // prevents delegate assignment
            delegate: item
          });

          newChild.canHaveDelegate = false; // prevent delegate override

          // insert
          this.dataSourceMap_[item.eventObjectId] = newChild;
          newDelta.inserted.push(newChild);

          // optimization: insert child only if node has at least one child, otherwise setChildNodes method
          // will be used which is much faster (reduce event count, bulk insertion)
          if (this.firstChild)
            this.insertBefore(newChild);
        }
      }

      if (!this.firstChild)
        // use fast child insert method if possible (it also fire childNodesModified event)
        this.setChildNodes(newDelta.inserted);
      else
        this.event_childNodesModified(this, newDelta);

      // destroy removed items
      if (this.destroyDataSourceMember && deleted.length)
      {
        for (var i = 0, item; item = deleted[i]; i++)
          item.destroy();
      }
    },
    destroy: function(dataSource){
      if (this.dataSource === dataSource)
        this.setDataSource();
    }
  };

  function fastChildNodesOrder(node, order){
    var lastIndex = order.length - 1;
    node.childNodes = order;
    node.firstChild = order[0] || null;
    node.lastChild = order[lastIndex] || null;

    //DOM.insert(this, order);
    for (var orderNode, i = lastIndex; orderNode = order[i]; i--)
    {
      orderNode.nextSibling = order[i + 1] || null;
      orderNode.previousSibling = order[i - 1] || null;
      node.insertBefore(orderNode, orderNode.nextSibling);
    }
  }

  function fastChildNodesGroupOrder(node, order){
    for (var i = 0, child; child = order[i]; i++)
      child.groupNode.nodes.push(child);

    order.length = 0;
    for (var group = node.grouping.nullGroup; group; group = group.nextSibling)
    {
      var nodes = group.nodes;
      group.first = nodes[0] || null;
      group.last = nodes[nodes.length - 1] || null;
      order.push.apply(order, nodes);
      group.event_childNodesModified(group, { inserted: nodes });
    }

    return order;
  }

  function createChildByFactory(node, config){
    var child;

    if (typeof node.childFactory == 'function')
    {
      child = node.childFactory(config);

      if (child instanceof node.childClass)
        return child;
    }

    if (!child)
      throw EXCEPTION_NULL_CHILD;

    ;;;if (typeof console != 'undefined') console.warn(EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.constructor && child.constructor.className) + ')');
    throw EXCEPTION_BAD_CHILD_CLASS;
  }

 /**
  * @mixin
  */
  var DomMixin = {
   /**
    * All child nodes must be instances of childClass.
    * @type {Class}
    */
    childClass: AbstractNode,

   /**
    * Function that will be called, when non-instance of childClass insert.
    * @example
    *   // example code with no childFactory
    *   function createNode(config){
    *     return new basis.dom.wrapper.Node(config);
    *   }
    *   var node = new basis.dom.wrapper.Node();
    *   node.appendChild(createNode({ .. config .. }));
    *
    *   // solution with childFactory
    *   var node = new basis.dom.wrapper.Node({
    *     childFactory: function(config){
    *       return new basis.dom.wrapper.Node(config);
    *     }
    *   });
    *   node.appendChild({ .. config .. });
    * @type {function():object}
    */
    childFactory: null,

   /**
    * @inheritDoc
    */
    listen: {
      dataSource: DOMMIXIN_DATASOURCE_HANDLER
    },

   /**
    * @inheritDoc
    */
    appendChild: function(newChild){
      return this.insertBefore(newChild);
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      if (!this.childClass)
        throw EXCEPTION_CANT_INSERT;

      if (newChild.firstChild)
      {
        // newChild can't be ancestor of current node
        var cursor = this;
        while (cursor = cursor.parentNode){
          if (cursor === newChild)
            throw EXCEPTION_CANT_INSERT;
        }
      }

      var isChildClassInstance = newChild && newChild instanceof this.childClass;

      // check for dataSource
      if (this.dataSource)
      {
        if (!isChildClassInstance || this.dataSourceMap_[newChild.delegate.eventObjectId] !== newChild)
          throw EXCEPTION_DATASOURCE_CONFLICT;
      }

      // construct new childClass instance if newChild is not instance of childClass
      if (!isChildClassInstance)
        newChild = createChildByFactory(this, newChild instanceof DataObject ? { delegate: newChild } : newChild);

      if (newChild.owner)
        throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;

      // search for insert point
      var isInside = newChild.parentNode === this;
      var currentNewChildGroup = newChild.groupNode;
      var grouping = this.grouping;
      var sorting = this.sorting;
      var sortingDesc;
      var childNodes = this.childNodes;
      var newChildValue;
      var groupNodes;
      var group = null;
      var pos = -1;
      var correctSortPos = false;
      var nextSibling;
      var prevSibling;

      if (isInside)
      {
        nextSibling = newChild.nextSibling;
        prevSibling = newChild.previousSibling;
      }

      if (sorting !== nullGetter)
      {
        // if sorting is using - refChild is ignore
        refChild = null; // ignore
        sortingDesc = this.sortingDesc;
        newChildValue = sorting(newChild) || 0;

        // some optimizations if node had already inside current node
        if (isInside)
        {
          if (newChildValue === newChild.sortingValue)
          {
            correctSortPos = true;
          }
          else
          {
            if (
                (!nextSibling || (sortingDesc ? nextSibling.sortingValue <= newChildValue : nextSibling.sortingValue >= newChildValue))
                &&
                (!prevSibling || (sortingDesc ? prevSibling.sortingValue >= newChildValue : prevSibling.sortingValue <= newChildValue))
               )
            {
              newChild.sortingValue = newChildValue;
              correctSortPos = true;
            }
          }
        }
      }

      if (grouping)
      {
        var cursor;
        group = grouping.getGroupNode(newChild, true);
        groupNodes = group.nodes;

        // optimization: test node position, possible it on right place
        if (currentNewChildGroup === group)
          if (correctSortPos || (isInside && nextSibling === refChild))
            return newChild;

        // calculate newChild position
        if (sorting !== nullGetter)
        {
          if (correctSortPos)
          {
            if (nextSibling && nextSibling.groupNode === group)
              pos = groupNodes.indexOf(nextSibling);
            else
              pos = groupNodes.length;
          }
          else
          {
            // when sorting use binary search
            pos = groupNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc);
            newChild.sortingValue = newChildValue;
          }
        }
        else
        {
          // if refChild in the same group, insert position will be before refChild,
          // otherwise insert into end
          if (refChild && refChild.groupNode === group)
            pos = groupNodes.indexOf(refChild);
          else
            pos = groupNodes.length;
        }

        if (pos < groupNodes.length)
        {
          refChild = groupNodes[pos];
        }
        else
        {
          // search for refChild for right ordering
          if (group.last)
          {
            // fast way to find refChild via current group lastChild (if exists)
            refChild = group.last.nextSibling;
          }
          else
          {
            // search for refChild as first firstChild of next sibling groups (groups might be empty)
            cursor = group;
            refChild = null;
            while (cursor = cursor.nextSibling)
              if (refChild = cursor.first)
                break;
          }
        }

        if (newChild === refChild || (isInside && nextSibling === refChild))
        {
          if (currentNewChildGroup !== group)
          {
            if (currentNewChildGroup)
              currentNewChildGroup.remove(newChild);

            group.insert(newChild, refChild);
          }

          return newChild;
        }

        pos = -1; // NOTE: drop pos, because this index for group nodes
                  // TODO: re-calculate pos as sum of previous groups nodes.length and pos
      }
      else
      {
        if (sorting !== nullGetter)
        {
          // if sorting is using - refChild is ignore
          if (correctSortPos)
            return newChild;

          // search for refChild
          pos = childNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc);
          refChild = childNodes[pos];
          newChild.sortingValue = newChildValue; // change sortingValue AFTER search

          // optimization: if node on right position, than return
          if (newChild === refChild || (isInside && nextSibling === refChild))
            return newChild;
        }
        else
        {
          // refChild isn't child of current node
          if (refChild && refChild.parentNode !== this)
            throw EXCEPTION_NODE_NOT_FOUND;

          // some optimizations and checks
          if (isInside)
          {
            // already on necessary position
            if (nextSibling === refChild)
              return newChild;

            // test make sense only if newChild inside parentNode
            if (newChild === refChild)
              throw EXCEPTION_CANT_INSERT;
          }
        }
      }

      //
      // ======= after this point newChild will be inserted or moved into new position =======
      //

      this.domVersion_ = (this.domVersion_ || 0) + 1;

      // unlink from old parent
      if (isInside)
      {
        // emulate removeChild if parentNode doesn't change (no events, speed benefits)

        // update nextSibling/lastChild
        if (nextSibling)
        {
          nextSibling.previousSibling = prevSibling;
          newChild.nextSibling = null;
        }
        else
          this.lastChild = prevSibling;

        // update previousSibling/firstChild
        if (prevSibling) 
        {
          prevSibling.nextSibling = nextSibling;
          newChild.previousSibling = null;
        }
        else
          this.firstChild = nextSibling;

        if (pos == -1)
          childNodes.remove(newChild);
        else
        {
          var oldPos = childNodes.indexOf(newChild);
          childNodes.splice(oldPos, 1);
          pos -= oldPos < pos;
        }

        // remove from old group (always remove for correct order)
        if (currentNewChildGroup)  // initial newChild.groupNode
        {
          currentNewChildGroup.remove(newChild);
          currentNewChildGroup = null;
        }
      }
      else
      {
        if (newChild.parentNode)
          newChild.parentNode.removeChild(newChild);
      }

      // add to group
      // NOTE: we need insert into group here, because we create fake refChild if refChild doesn't exist
      if (currentNewChildGroup != group)
        group.insert(newChild, refChild);
      
      // insert
      if (refChild) 
      {
        // search for refChild position
        // NOTE: if position is not equal -1 than position was found before (sorting, logN)
        if (pos == -1)
          pos = childNodes.indexOf(refChild);

        // if refChild not found than throw exception
        if (pos == -1)
          throw EXCEPTION_NODE_NOT_FOUND;

        // set next sibling
        newChild.nextSibling = refChild;

        // insert newChild into childNodes
        childNodes.splice(pos, 0, newChild);
      }
      else
      {
        // there is no refChild, insert newChild to the end of childNodes
        pos = childNodes.length;

        // insert newChild into childNodes
        childNodes.push(newChild);

        // create fake refChild, it helps with references updates
        refChild = { 
          previousSibling: this.lastChild
        };

        // update lastChild
        this.lastChild = newChild;
      }

      // update newChild
      newChild.parentNode = this;
      newChild.previousSibling = refChild.previousSibling;

      // not need update this.lastChild, insert always before some node
      // if insert into begins
      if (pos == 0)
        this.firstChild = newChild;
      else
        refChild.previousSibling.nextSibling = newChild;

      // update refChild
      refChild.previousSibling = newChild;

      // update selection
      updateNodeContextSelection(newChild, newChild.contextSelection, this.selection || this.contextSelection, true);

      // if node doesn't move inside the same parent (parentNode changed)
      if (!isInside)
      {
        // re-match
        if (newChild.match)
          newChild.match(this.matchFunction);

        // delegate parentNode automatically, if necessary
        if (newChild.autoDelegate == DELEGATE.PARENT)
          newChild.setDelegate(this);

        // dispatch event
        if (!this.dataSource)
          this.event_childNodesModified(this, { inserted: [newChild] });
      }

      // return newChild
      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      if (!oldChild || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
        throw EXCEPTION_NODE_NOT_FOUND;

      if (oldChild instanceof this.childClass == false)
        throw EXCEPTION_BAD_CHILD_CLASS;

      if (this.dataSource && this.dataSource.has(oldChild.delegate))
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // update this
      var pos = this.childNodes.indexOf(oldChild);

      if (pos == -1)
        throw EXCEPTION_NODE_NOT_FOUND;        

      this.childNodes.splice(pos, 1);
        
      // update oldChild and this.lastChild & this.firstChild
      oldChild.parentNode = null;

      // update nextSibling/lastChild
      if (oldChild.nextSibling)
        oldChild.nextSibling.previousSibling = oldChild.previousSibling;
      else
        this.lastChild = oldChild.previousSibling;

      // update previousSibling/firstChild
      if (oldChild.previousSibling) 
        oldChild.previousSibling.nextSibling = oldChild.nextSibling;      
      else
        this.firstChild = oldChild.nextSibling;
        
      oldChild.nextSibling = null;
      oldChild.previousSibling = null;

      // update selection
      updateNodeContextSelection(oldChild, oldChild.contextSelection, null, true);

      // remove from group if any
      if (oldChild.groupNode)
        oldChild.groupNode.remove(oldChild);

      // dispatch event
      if (!this.dataSource)
        this.event_childNodesModified(this, { deleted: [oldChild] });

      if (oldChild.autoDelegate == DELEGATE.PARENT)
        oldChild.setDelegate();

      // return removed child
      return oldChild;
    },

   /**
    * @inheritDoc
    */
    replaceChild: function(newChild, oldChild){
      if (this.dataSource)
        throw EXCEPTION_DATASOURCE_CONFLICT;

      if (oldChild == null || oldChild.parentNode !== this)
        throw EXCEPTION_NODE_NOT_FOUND;

      // insert newChild before oldChild
      this.insertBefore(newChild, oldChild);

      // remove oldChild
      return this.removeChild(oldChild);
    },

   /**
    * @inheritDoc
    */
    clear: function(alive){
      // clear possible only if dataSource is empty
      if (this.dataSource && this.dataSource.itemCount)
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // if node haven't childs nothing to do (event don't fire)
      if (!this.firstChild)
        return;

      // clear selection context for child for alive mode
      if (alive)
        updateNodeContextSelection(this, this.selection || this.contextSelection, null, false, true);

      // store childs
      var childNodes = this.childNodes;

      // remove all childs
      this.firstChild = null;
      this.lastChild = null;
      this.childNodes = [];

      // dispatch event
      // NOTE: important dispatch event before nodes remove/destroy, because listeners may analyze removing nodes
      this.event_childNodesModified(this, { deleted: childNodes });

      for (var i = childNodes.length; i --> 0;)
      {
        var child = childNodes[i];

        child.parentNode = null;
        child.groupNode = null;

        if (alive)
        {
          child.nextSibling = null;
          child.previousSibling = null;

          if (child.autoDelegate == DELEGATE.PARENT)
            child.setDelegate();
        }
        else
          child.destroy();
      }

      // if local grouping, clear groups
      if (this.grouping)
      {
        //this.grouping.clear();
        for (var childNodes = this.grouping.childNodes, i = childNodes.length - 1, group; group = childNodes[i]; i--)
          group.clear();
      }
    },

   /**
    * @params {Array.<Object>} childNodes
    */
    setChildNodes: function(newChildNodes, keepAlive){
      if (!this.dataSource)
        this.clear(keepAlive);

      if (newChildNodes)
      {
        if ('length' in newChildNodes == false) // NOTE: we don't use Array.from here to avoid make a copy of array
          newChildNodes = [newChildNodes];

        if (newChildNodes.length)
        {
          // switch off dispatch
          var tmp = this.event_childNodesModified;
          this.event_childNodesModified = $undef;

          // insert nodes
          for (var i = 0, len = newChildNodes.length; i < len; i++)
            this.insertBefore(newChildNodes[i]);

          // restore event dispatch & dispatch changes event
          this.event_childNodesModified = tmp;
          this.event_childNodesModified(this, { inserted: this.childNodes });
        }
      }
    },

   /**
    * @inheritDoc
    */
    setDataSource: function(dataSource){
      if (!dataSource || !this.childClass || dataSource instanceof AbstractDataset == false)
        dataSource = null;

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;
        var listenHandler = this.listen.dataSource;

        // detach
        if (oldDataSource)
        {
          this.dataSourceMap_ = null;
          this.dataSource = null;
        }

        // remove old childs
        if (this.firstChild)
          this.clear();

        this.dataSource = dataSource;

        // TODO: switch off sorting & grouping

        // attach
        if (dataSource)
        {
          this.dataSourceMap_ = {};

          if (listenHandler)
          {
            if (dataSource.itemCount && listenHandler.datasetChanged)
              listenHandler.datasetChanged.call(this, dataSource, {
                inserted: dataSource.getItems()
              });
          }
        }

        // TODO: restore sorting & grouping, fast node reorder

        this.event_dataSourceChanged(this, oldDataSource);
      }
    },

   /**
    * @inheritDoc
    */
    setGrouping: function(grouping, alive){
      if (typeof grouping == 'function' || typeof grouping == 'string')
        grouping = {
          groupGetter: grouping
        };

      if (grouping instanceof GroupingNode == false)
      {
        grouping = grouping && typeof grouping == 'object'
          ? new this.groupingClass(grouping)
          : null;
      }

      if (this.grouping !== grouping)
      {
        var oldGroupingNode = this.grouping;
        var order;

        if (this.grouping)
        {
          if (!grouping)
          {
            // NOTE: it's important to clear locaGrouping before calling fastChildNodesOrder
            // because it sorts nodes in according to grouping
            this.grouping = null;

            if (this.firstChild)
            {
              // new order
              if (this.sorting !== nullGetter)
                order = sortChildNodes(this);
              else
                order = this.childNodes;

              // reset reference to group node
              for (var i = order.length; i --> 0;)
                order[i].groupNode = null;

              // apply new order
              fastChildNodesOrder(this, order);
            }
          }

          oldGroupingNode.setOwner();
        }

        if (grouping)
        {
          // NOTE: it important set grouping before set owner for grouping,
          // because grouping will try set grouping property on owner change
          // for it's new owner and it fall in recursion
          this.grouping = grouping;
          grouping.setOwner(this);

          // if there is child nodes - reorder it
          if (this.firstChild)
          {
            // new order
            if (this.sorting !== nullGetter)
              order = sortChildNodes(this);
            else
              order = this.childNodes;

            // split nodes by new groups
            for (var i = 0, child; child = order[i]; i++)
              child.groupNode = this.grouping.getGroupNode(child, true);

            // fill groups
            order = fastChildNodesGroupOrder(this, order);

            // apply new order
            fastChildNodesOrder(this, order);
          }
        }

        this.event_groupingChanged(this, oldGroupingNode);
      }
    },

   /**
    * @inheritDoc
    */
    setSorting: function(sorting, sortingDesc){
      sorting = getter(sorting);
      sortingDesc = !!sortingDesc;

      // TODO: fix when direction changes only
      if (this.sorting !== sorting || this.sortingDesc != !!sortingDesc)
      {
        var oldSorting = this.sorting;
        var oldSortingDesc = this.sortingDesc;

        this.sorting = sorting;
        this.sortingDesc = !!sortingDesc;

        // reorder nodes only if sorting and child nodes exists
        if (sorting !== nullGetter && this.firstChild)
        {
          var order = [];
          var nodes;

          for (var node = this.firstChild; node; node = node.nextSibling)
            node.sortingValue = sorting(node) || 0;

          // Probably strange and dirty solution, but faster (up to 2-5 times).
          // Low dependence of node shuffling. Total permutation count equals to permutation
          // count of top level elements (if used). No events dispatching (time benefits).
          // Sorting time of Wrappers (AbstractNodes) equals N*log(N) + N (reference update).
          // NOTE: Nodes selected state will remain (sometimes it can be important)
          if (this.grouping)
          {
            for (var group = this.grouping.nullGroup; group; group = group.nextSibling)
            {
              // sort, clear and set new order, no override childNodes
              nodes = group.nodes = sortChildNodes({ childNodes: group.nodes, sortingDesc: this.sortingDesc });

              group.first = nodes[0] || null;
              group.last = nodes[nodes.length - 1] || null;
              order.push.apply(order, nodes);
            }
          }
          else
          { 
            order = sortChildNodes(this);
          }

          // apply new order
          fastChildNodesOrder(this, order);
        }

        this.event_sortingChanged(this, oldSorting, oldSortingDesc);
      }
    },

   /**
    * Set match function for child nodes.
    * @param {function(node):boolean} func
    */
    setMatchFunction: function(matchFunction){
      if (this.matchFunction != matchFunction)
      {
        var oldMatchFunction = this.matchFunction;
        this.matchFunction = matchFunction;

        for (var node = this.lastChild; node; node = node.previousSibling)
          node.match(matchFunction);

        this.event_matchFunctionChanged(this, oldMatchFunction);
      }
    }
  };


 /**
  * @class
  */
  var Node = Class(AbstractNode, DomMixin, {
    className: namespace + '.Node',

   /**
    * Occurs after disabled property has been set to false.
    * @event
    */
    event_enable: createEvent('enable', 'node'),

   /**
    * Occurs after disabled property has been set to true.
    * @event
    */
    event_disable: createEvent('disable', 'node'),

   /**
    * Occurs after selected property has been set to true.
    * @event
    */
    event_select: createEvent('select', 'node'),

   /**
    * Occurs after selected property has been set to false.
    * @event
    */
    event_unselect: createEvent('unselect', 'node'),

   /**
    * Occurs after matched property has been set to true.
    * @event
    */
    event_match: createEvent('match', 'node'),

   /**
    * Occurs after matched property has been set to false.
    * @event
    */
    event_unmatch: createEvent('unmatch', 'node'),

   /**
    * Occurs after matchFunction property has been changed.
    * @event
    */
    event_matchFunctionChanged: createEvent('matchFunctionChanged', 'node', 'oldMatchFunction'),

   /**
    * Indicate could be able node to be selected or not.
    * @type {boolean}
    * @readonly
    */
    selectable: true,

   /**
    * Indicate node is selected.
    * @type {boolean}
    * @readonly
    */
    selected: false,

   /**
    * Set of selected child nodes.
    * @type {basis.dom.wrapper.Selection}
    */
    selection: null,

   /**
    * @type {basis.dom.wrapper.Selection}
    * @private
    */
    contextSelection: null,

   /**
    * @type {function()|null}
    * @readonly
    */
    matchFunction: null,

   /**
    * @type {boolean}
    * @readonly
    */
    matched: true,

   /**
    * Indicate node is disabled. Use isDisabled method to determine disabled 
    * node state instead of check for this property value (ancestor nodes may
    * be disabled and current node will be disabled too, but node disabled property
    * could has false value).
    * @type {boolean}
    * @readonly
    */
    disabled: false,

   /**
    * @param {Object} config
    * @config {basis.dom.wrapper.Selection} selection Set Selection control for child nodes.
    * @config {boolean} selectable Initial value for selectable property.
    * @config {boolean} disabled Initial value for disabled property. If true 'disable' event fired.
    * @config {boolean} selected Initial value for selected property. If true 'select' event fired.
    * @constructor
    */
    init: function(config){
      // add selection object, if selection is not null
      if (this.selection && this.selection instanceof AbstractDataset == false)
        this.selection = new Selection(this.selection);

      // inherit
      AbstractNode.prototype.init.call(this, config);

      // synchronize node state according to config
      if (this.disabled)
        this.event_disable(this);

      if (this.selected)
      {
        this.selected = false;
        this.select(true);
      }
    },

   /**
    * Changes selection property of node.
    * @param {basis.dom.wrapper.Selection} selection New selection value for node.
    * @return {boolean} Returns true if selection was changed.
    */
    setSelection: function(selection){
      if (this.selection !== selection)
      {
        // change context selection for child nodes
        updateNodeContextSelection(this, this.selection || this.contextSelection, selection || this.contextSelection, false, true);

        // update selection
        this.selection = selection;

        return true;
      }
    },
    
   /**
    * Returns true if node has it's own selection.
    * @return {boolean}
    */
    hasOwnSelection: function(){
      return !!this.selection;
    },

   /**
    * Makes node selected if possible.
    * @param {boolean} multiple
    * @return {boolean} Returns true if selected state has been changed.
    */
    select: function(multiple){
      var selected = this.selected;
      var selection = this.contextSelection;
      
      // here is no check for selected state, because parentNode.selection depends on it's 
      // mode may do some actions even with selected node
      if (selection)
      { 
        if (!multiple)
        {
          // check for selectable in non-multiple mode, because if node is non-selectable
          // selection will be cleared and this is not desired behaviour
          if (this.selectable)
            selection.set([this]);
        }
        else
        {
          if (selected)
            selection.remove([this]);
          else
            selection.add([this]);
        }
      }
      else
        if (!selected && this.selectable/* && !this.isDisabled()*/)
        {
          this.selected = true;
          this.event_select(this);
        }

      return this.selected != selected;
    },

   /**
    * Makes node unselected.
    * @param {boolean} multiple
    * @return {boolean} Returns true if selected state has been changed.
    */
    unselect: function(){
      var selected = this.selected;

      if (selected)
      {
        var selection = this.contextSelection;
        if (selection)
          selection.remove([this]);
        else
        {
          this.selected = false;
          this.event_unselect(this);
        }
      }

      return this.selected != selected;
    },


   /**
    * Makes node enabled.
    */
    enable: function(){
      if (this.disabled)
      {
        this.disabled = false;
        this.event_enable(this);
      }
    },

   /**
    * Makes node disabled.
    */
    disable: function(){
      if (!this.disabled)
      {
        this.disabled = true;
        this.event_disable(this);
      }
    },

   /**
    * @return {boolean} Return true if node or one of it's ancestor nodes are disabled.
    */
    isDisabled: function(){
      return this.disabled 
             || !!DOM.findAncestor(this, getter('disabled'));
             // TODO: add check for groupNode, when groupNode will support for disabled
    },

   /**
    * @param {function()} func
    * @return {boolean}
    */
    match: function(func){
      if (typeof func != 'function')
        func = null;

      if (this.underMatch_ && !func)
        this.underMatch_(this, true);

      this.underMatch_ = func;

      var matched = !func || func(this);

      if (this.matched != matched)
      {
        this.matched = matched;

        if (matched)
          this.event_match(this)
        else
          this.event_unmatch(this)
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.hasOwnSelection())
      {
        this.selection.destroy(); // how about shared selection?
        this.selection = null;
      }

      this.unselect();

      // inherit
      AbstractNode.prototype.destroy.call(this);
    }
  });

 /**
  * @see ./demo/common/grouping.html
  * @see ./demo/common/grouping_of_grouping.html
  * @class
  */
  var GroupingNode = Class(AbstractNode, DomMixin, {
    className: namespace + '.GroupingNode',

    // events

   /**
    * @inheritDoc
    */
    event_childNodesModified: function(node, delta){
      events.childNodesModified.call(this, node, delta);

      this.nullGroup.nextSibling = this.firstChild;

      var array;
      if (array = delta.inserted)
      {
        for (var i = 0, child; child = array[i++];)
        {
          child.groupId_ = child.delegate ? child.delegate.eventObjectId : child.data.id;
          this.map_[child.groupId_] = child;
        }

        if (this.dataSource && this.nullGroup.first)
        {
          var parentNode = this.owner;
          var nodes = Array.from(this.nullGroup.nodes); // Array.from, because nullGroup.nodes may be transformed
          for (var i = nodes.length; i --> 0;)
            parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
        }
      }
    },

   /**
    * @inheritDoc
    */
    event_ownerChanged: function(node, oldOwner){
      // detach from old owner, if it still connected
      if (oldOwner && oldOwner.grouping === this)
        oldOwner.setGrouping(null, true);

      // attach to new owner, if any and doesn't connected
      if (this.owner && this.owner.grouping !== this)
        this.owner.setGrouping(this);

      events.ownerChanged.call(this, node, oldOwner);

      if (!this.owner && this.autoDestroyWithNoOwner)
        this.destroy();
    },

    // properties

    map_: null,

    autoDestroyWithNoOwner: true,
    autoDestroyEmptyGroups: true,
    //titleGetter: getter('data.title'),
    groupGetter: nullGetter,

    childClass: PartitionNode,
    childFactory: function(config){
      //return new this.childClass(complete(config, {
      //  titleGetter: this.titleGetter,
      //  autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      //}));
      return new this.childClass(complete({
        autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      }, config));
    },

    // methods

    init: function(config){
      this.map_ = {};
      this.nullGroup = new PartitionNode();

      ;;;if ('titleGetter' in this) console.warn(namespace + '.GroupingNode: titleGetter is not support anymore for GroupingNode; extend partition nodes with titleGetter instead');

      AbstractNode.prototype.init.call(this, config);
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @return {basis.dom.wrapper.PartitionNode}
    */
    getGroupNode: function(node, autocreate){
      var groupRef = this.groupGetter(node);
      var isDelegate = groupRef instanceof DataObject;
      var group = this.map_[isDelegate ? groupRef.eventObjectId : groupRef];

      if (this.dataSource)
        autocreate = false;

      if (!group && autocreate)
      {
        group = this.appendChild(
          isDelegate
            ? groupRef
            : { 
                data: {
                  id: groupRef,
                  title: groupRef
                }
              }
        );
      }

      return group || this.nullGroup;
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      newChild = DomMixin.insertBefore.call(this, newChild, refChild);

      var firstNode = newChild.first;

      if (firstNode)
      {
        var parent = firstNode.parentNode;
        var lastNode = newChild.last;

        var beforePrev;
        var beforeNext;
        var afterPrev;
        var afterNext = null;

        // search for next group firstChild
        // we can't get newChild.nextSibling.first, because next sibling group may be empty
        var cursor = newChild;
        while (cursor = cursor.nextSibling)
        {
          if (afterNext = cursor.first)
            break;
        }

        afterPrev = afterNext ? afterNext.previousSibling : parent.lastChild;

        beforePrev = firstNode.previousSibling;
        beforeNext = lastNode.nextSibling;

        if (beforeNext !== afterNext)
        {
          var parentChildNodes = parent.childNodes;
          var nodes = newChild.nodes;
          var nodesCount = nodes.length;

          // update previousSibling/nextSibling references
          if (beforePrev)
            beforePrev.nextSibling = beforeNext;
          if (beforeNext)
            beforeNext.previousSibling = beforePrev;

          if (afterPrev)
            afterPrev.nextSibling = firstNode;
          if (afterNext)
            afterNext.previousSibling = lastNode;

          firstNode.previousSibling = afterPrev;
          lastNode.nextSibling = afterNext;

          // search position for cut and
          var firstPos = parentChildNodes.indexOf(firstNode);
          var afterNextPos = afterNext
            ? parentChildNodes.indexOf(afterNext)
            : parentChildNodes.length;

          if (afterNextPos > firstPos)
            afterNextPos -= nodesCount;

          // cut nodes from parent childNodes and insert on new position
          parentChildNodes.splice(firstPos, nodesCount);
          parentChildNodes.splice.apply(parentChildNodes, [afterNextPos, 0].concat(nodes));

          // update first/last child ref for parent
          if (!afterPrev || !beforePrev)
            parent.firstChild = parentChildNodes[0];
          if (!afterNext || !beforeNext)
            parent.lastChild = parentChildNodes[parentChildNodes.length - 1];

          // re-insert partition nodes
          if (firstNode instanceof PartitionNode)
            for (var i = nodesCount, insertBefore = afterNext; i --> 0;)
            {
              parent.insertBefore(nodes[i], insertBefore);
              refChild = nodes[i];
            }
        }
      }

      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      if (oldChild = DomMixin.removeChild.call(this, oldChild))
      {
        delete this.map_[oldChild.groupId_];

        for (var i = 0, node; node = oldChild.nodes[i]; i++)
          node.parentNode.insertBefore(node);
      }

      return oldChild;
    },

   /**
    * @inheritDoc
    */
    clear: function(alive){
      var nodes = [];
      var getGroupNode = this.getGroupNode;
      var nullGroup = this.nullGroup;

      this.getGroupNode = function(){ return nullGroup };

      for (var group = this.firstChild; group; group = group.nextSibling)
        nodes.push.apply(nodes, group.nodes);

      for (var i = 0, child; child = nodes[i]; i++)
        child.parentNode.insertBefore(child);

      this.getGroupNode = getGroupNode;

      DomMixin.clear.call(this, alive);

      this.map_ = {};
      /*for (var i = 0, node; node = nodes[i]; i++)
      {
        node.groupNode = null;
        node.parentNode.insertBefore(node);
      }*/
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.autoDestroyWithNoOwner = false;
      //this.setOwner();

      AbstractNode.prototype.destroy.call(this);

      this.nullGroup.destroy();
      this.nullGroup = null;

      this.map_ = null;
    }
  });

  AbstractNode.prototype.groupingClass = GroupingNode;


  //
  // ChildNodesDataset
  //

  var CHILDNODESDATASET_HANDLER = {
    childNodesModified: function(sender, delta){
      var memberMap = this.memberMap_;
      var newDelta = {};
      var node;
      var insertCount = 0;
      var deleteCount = 0;
      var inserted = delta.inserted;
      var deleted = delta.deleted;

      if (inserted && inserted.length)
      {
        newDelta.inserted = inserted;

        while (node = inserted[insertCount])
        {
          memberMap[node.eventObjectId] = node;
          insertCount++;
        }
      }

      if (deleted && deleted.length)
      {
        newDelta.deleted = deleted;

        while (node = deleted[deleteCount])
        {
          delete memberMap[node.eventObjectId];
          deleteCount++;
        }
      }

      if (insertCount || deleteCount)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      if (this.autoDestroy)
        this.destroy();
      else
        this.setSourceNode();
    }
  };

 /**
  * @class
  */
  var ChildNodesDataset = Class(AbstractDataset, {
    className: namespace + '.ChildNodesDataset',

    autoDestroy: true,
    sourceNode: null,

   /**
    * @inheritDoc
    */
    listen: {
      sourceNode: CHILDNODESDATASET_HANDLER
    },

    event_sourceNodeChanged: createEvent('sourceNodeChanged') && function(object, oldSourceNode){
      events.sourceNodeChanged.call(this, object, oldSourceNode);

      if (!this.sourceNode && this.autoDestroy)
        this.destroy();
    },

   /**
    * use extend constructor
    */
    extendConstructor_: false,

   /**
    * @constructor
    */
    init: function(node, config){
      AbstractDataset.prototype.init.call(this, config);

      if (node)
        this.setSourceNode(node);
    },

   /**
    * Set source node for dataset.
    * @param {basis.dom.wrapper.AbstractNode} node
    */
    setSourceNode: function(node){
      if (node instanceof AbstractNode == false)
        node = null;

      if (node !== this.sourceNode)
      {
        var oldSourceNode = this.sourceNode;
        var listenHandler = this.listen.sourceNode;

        this.sourceNode = node;

        if (listenHandler)
        {
          var childNodesModifiedHandler = listenHandler.childNodesModified;

          if (oldSourceNode)
          {
            oldSourceNode.removeHandler(listenHandler, this);

            if (childNodesModifiedHandler)
              childNodesModifiedHandler.call(this, oldSourceNode, {
                deleted: oldSourceNode.childNodes
              });
          }

          if (node)
          {
            node.addHandler(listenHandler, this);

            if (childNodesModifiedHandler)
              childNodesModifiedHandler.call(this, node, {
                inserted: node.childNodes
              });
          }
        }

        this.event_sourceNodeChanged(this, oldSourceNode);
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // drop source node if exists
      this.setSourceNode();

      // inherit
      AbstractDataset.prototype.destroy.call(this);
    }
  });


  //
  // SELECTION
  //

 /**
  * @see ./demo/common/selection_share.html
  * @see ./demo/common/selection_multiple.html
  * @see ./demo/common/selection_dataSource.html
  * @class
  */
  var Selection = Class(Dataset, {
    className: namespace + '.Selection',

   /**
    * Could selection store more than one node or not.
    * @type {boolean}
    * @readonly
    */
    multiple: false,

   /**
    * @inheritDoc
    */
    event_datasetChanged: function(dataset, delta){
      Dataset.prototype.event_datasetChanged.call(this, dataset, delta);

      if (delta.inserted)
      {
        for (var i = 0, node; node = delta.inserted[i]; i++)
        {
          if (!node.selected)
          {
            node.selected = true;
            node.event_select(node);
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, node; node = delta.deleted[i]; i++)
        {
          if (node.selected)
          {
            node.selected = false;
            node.event_unselect(node);
          }
        }
      }
    },

   /**
    * @inheritDoc
    */
    add: function(nodes){
      if (!this.multiple)
      {
        if (this.itemCount)
          return this.set(nodes);
        else
          nodes = [nodes[0]];
      }

      var items = [];
      for (var i = 0, node; node = nodes[i]; i++)
      {
        if (node.contextSelection == this && node.selectable)
          items.push(node);
      }

      return Dataset.prototype.add.call(this, items);
    },

   /**
    * @inheritDoc
    */
    set: function(nodes){
      var items = [];
      for (var i = 0, node; node = nodes[i]; i++)
      {
        if (node.contextSelection == this && node.selectable)
          items.push(node);
      }

      if (!this.multiple)
        items.splice(1);

      return Dataset.prototype.set.call(this, items);
    }
  });


  //
  // export names
  //

  this.extend({
    // const
    DELEGATE: DELEGATE,

    // classes
    AbstractNode: AbstractNode,
    Node: Node,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode,

    // datasets
    ChildNodesDataset: ChildNodesDataset,
    Selection: Selection,
    nullSelection: new AbstractDataset
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/dom/wrapper.js").call(basis.namespace("basis.dom.wrapper"), basis.namespace("basis.dom.wrapper"), basis.namespace("basis.dom.wrapper").exports, this, __curLocation + "src/basis/dom/wrapper.js", __curLocation + "src/basis/dom/", basis, function(url){ return basis.resource(__curLocation + "src/basis/dom/" + url) });

//
// src/basis/cssom.js
//

new Function(__wrapArgs, function(){

/**
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev
 * Roman Dvornov
 */

  'use strict';

  basis.require('basis.dom');
  basis.require('basis.dom.event');


 /**
  * @namespace basis.cssom
  */
  
  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var dom = basis.dom;
  var event = basis.dom.event;
  var Class = basis.Class;


  //
  // main part
  //

  var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;
  var IMPORTANT_REGEXP = /\s*!important/i;
  var IMPORTANT = String('important');
  var GENERIC_RULE_SEED = 1;
  var cssStyleSheets = {};

  var SET_STYLE_EXCEPTION_BUG = (function(){
    var element = dom.createElement();
    try {
      element.style.width = 'badvalue';
    } catch(e){
      return true;
    }
    return false;
  })();


  //
  // shortcut
  //
  
  function createRule(selector, styleSheet){
    return getStyleSheet(styleSheet, true).createRule(selector);
  }

  function isPropertyImportant(style, property){
    if (style.getPropertyPriority)
      return style.getPropertyPriority(property) == IMPORTANT;
    else
      return false;
  }

 /**
  * @func
  * @param {Element} element
  */
  function uniqueRule(element){
    var token = 'genericRule-' + GENERIC_RULE_SEED++;

    if (element)
      classList(element).add(token);

    var result = createRule('.' + token);
    result.token = token;

    return result;
  }

  //
  // working with stylesheets
  //

  function StyleSheet_insertRule(rule, index){
    // fetch selector and style from rule description
    var m = rule.match(/^([^{]+)\{(.*)\}\s*$/);
    if (m)
    {
      var selectors = m[1].trim().split(/\s*,\s*/);
      for (var i = 0; i < selectors.length; i++)
        this.addRule(selectors[i], m[2] || null, index++);
      return index - 1;
    }

    ;;;throw new Error("Syntax error in CSS rule to be added");
  }

  function StyleSheet_makeCompatible(style){
    // FF throws exception if access to cssRules property until stylesheet isn't ready (loaded)
    try {
      if (!style.cssRules)
        style.cssRules = style.rules;
    }
    catch(e){
    }

    // extend style sheet with methods according to W3C spec
    if (!style.insertRule)
      style.insertRule = StyleSheet_insertRule;

    if (!style.deleteRule)
      style.deleteRule = style.removeRule;

    return style;
  }

 /**
  * Creates <STYLE> or <LINK> node, adds it to document and returns it's stylesheet object.
  * @param {string=} url Url of css file. In this case <LINK> will created. If this parameter ommited <STYLE> will created
  * @param {string=} title Value for title attribute.
  * @return {StyleSheet}
  */
  function addStyleSheet(url, title){
    var element = dom.createElement(!url ? 'STYLE[type="text/css"]' : 'LINK[type="text/css"][rel="{alt}stylesheet"][href={url}]'.format({
      alt: title ? 'alternate ' : '',
      url: url.quote('"')
    }));

    dom.tag(null, 'HEAD')[0].appendChild(element);

    return StyleSheet_makeCompatible(element.sheet || element.styleSheet);
  }

  var basisId = 1;

 /**
  * Returns generic stylesheet by it's id.
  * @param {string=} id
  * @param {boolean=} createIfNotExists
  * @return {basis.cssom.StyleSheet}
  */
  function getStyleSheet(id, createIfNotExists){
    if (!id)
      id = 'DefaultGenericStyleSheet';

    if (!cssStyleSheets[id])
      if (createIfNotExists)
        cssStyleSheets[id] = new StyleSheet(addStyleSheet())

    return cssStyleSheets[id];
  }

  //
  // Style mapping
  //

  var styleMapping = {};
  var testElement = dom.createElement('DIV');

  function createStyleMapping(property, names, regSupport, getters){
    getters = getters || {};
    names = names.qw();

    for (var i = 0, name; name = names[i]; i++)
    {
      if (typeof testElement.style[name] != 'undefined')
      {
        if (regSupport)
          basis.platformFeature['css-' + property] = name;

        styleMapping[property] = {
          key: name,
          getter: getters[name]
        };

        return;
      }
    }
  };

  createStyleMapping('opacity', 'opacity MozOpacity KhtmlOpacity filter', true, {
    fitler: function(value){ return 'alpha(opacity:' + parseInt(value * 100) + ')' }
  });
  createStyleMapping('border-radius', 'borderRadius MozBorderRadius WebkitBorderRadius', true);
  createStyleMapping('float', 'cssFloat styleFloat');

 /**
  * Apply new style property values for node.
  * @param {Node} node Node which style to be changed.
  * @param {object} style Object contains new values for node style properties.
  * @return {Node} 
  */
  function getStylePropertyMapping(key, value){
    var mapping = styleMapping[key];
    if (key = mapping ? mapping.key : key.replace(/^-ms-/, 'ms-').camelize())
      return {
        key: key,
        value: mapping && mapping.getter ? mapping.getter(value) : value
      };
  }

 /**
  * Apply new style property value for node.
  * @param {Node} node Node which style to be changed.
  * @param {string} property Name of property.
  * @param {string} value Value of property.
  * @return Returns style property value after assignment.
  */
  function setStyleProperty(node, property, value){
    var mapping = getStylePropertyMapping(property, value);

    if (!mapping)
      return;

    var key = mapping.key;
    var imp = !!IMPORTANT_REGEXP.test(value);
    var style = node.style;

    if (imp || isPropertyImportant(style, property))
    {
      value = value.replace(IMPORTANT_REGEXP, '');

      if (style.setProperty)
      {
        // W3C scheme

        // if property exists and important, remove it
        if (!imp)
          style.removeProperty(key);

        // set new value for property
        style.setProperty(key, mapping.value, (imp ? IMPORTANT : ''));
      }
      else
      {
        // IE8- scheme
        var newValue = key + ': ' + mapping.value + (imp ? ' !' + IMPORTANT : '') + ';';
        var rxText = style[key] ? key + '\\s*:\\s*' + style[key] + '(\\s*!' + IMPORTANT + ')?\\s*;?' : '^';

        try {
          style.cssText = style.cssText.replace(new RegExp(rxText, 'i'), newValue);
        } catch(e) {
          ;;;if (typeof console != 'undefined') console.warn('basis.cssom.setStyleProperty: Can\'t set wrong value `' + mapping.value + '` for ' + mapping.key + ' property');
        }
      }
    }
    else
    {
      if (SET_STYLE_EXCEPTION_BUG)
      {
        // IE6-8 throw exception when assign wrong value to style, but standart
        // says just ignore this assigments
        // try/catch is speedless, therefore wrap this statement only for ie
        // it makes code safe and more compatible
        try {
          node.style[mapping.key] = mapping.value;
        } catch(e) {
          ;;;if (typeof console != 'undefined') console.warn('basis.cssom.setStyleProperty: Can\'t set wrong value `' + mapping.value + '` for ' + mapping.key + ' property');
        }
      }
      else
        node.style[mapping.key] = mapping.value;

      return node.style[mapping.key];
    }
  }

 /**
  * Apply new style properties for node.
  * @param {Node} node Node which style to be changed.
  * @param {object} style Object contains new values for node style properties.
  * @return {Node} 
  */
  function setStyle(node, style){
    for (var key in style)
      setStyleProperty(node, key, style[key]);

    return node;
  }


  //
  // dom node styling
  //

 /**
  * Changes for node display value.
  * @param {Node} node
  * @param {boolean|string} display
  * @return {Node}
  */
  function display(node, display){
    return setStyleProperty(node, 'display', typeof display == 'string' ? display : (display ? '' : 'none'));
  }

 /**
  * @deprecated use basis.dom.display instead.
  */
  function show(element){
    return display(element, 1);
  }
 /**
  * @deprecated use basis.dom.display instead.
  */
  function hide(element){ 
    return display(element);
  }

 /**
  * Changes node visibility.
  * @param {Node} node
  * @param {boolean} visible
  * @return {Node}
  */
  function visibility(node, visible){
    return setStyleProperty(node, 'visibility', visible ? '' : 'hidden');
  }

 /**
  * @deprecated use basis.dom.visibility instead.
  */
  function visible(element){
    return visibility(element, 1);
  }
 /**
  * @deprecated use basis.dom.visibility instead.
  */
  function invisible(element){
    return visibility(element);
  }

  //
  // classes
  //

 /**
  * @class
  */
  var StyleSheet = Class(null, {
    className: namespace + '.StyleSheet',

   /**
    * Wrapped stylesheet
    * @type {StyleSheet}
    */
    styleSheet: null,

   /**
    * @type {Array.<Rule|RuleSet>}
    */
    rules: null,

   /**
    * @param {StyleSheet} styleSheet
    * @constructor
    */
    init: function(styleSheet){
      this.styleSheet = styleSheet;
      this.rules = [];
    },

   /**
    * @param {string} selector
    * @return {Rule|RuleSet}
    */
    createRule: function(selector){
      var styleSheet = this.styleSheet;
      var index = this.rules.length;
      var newIndex = styleSheet.insertRule(selector + '{}', index);
      var cssRules = Array.from(styleSheet.cssRules, index);

      var ruleWrapper = cssRules[1]
        ? new RuleSet(cssRules, this)
        : new Rule(cssRules[0], this);

      this.rules.push.apply(this.rules, ruleWrapper.rules || [ruleWrapper]);

      return ruleWrapper;
    },

   /**
    * @param {Rule|RuleSet} rule
    */
    deleteRule: function(rule){
      if (rule instanceof RuleSet)
        rule.rules.forEach(this.deleteRule, this);
      else
      {
        var ruleIndex = this.rules.indexOf(rule);
        if (ruleIndex != -1)
        {
          this.rules.splice(ruleIndex, 1);
          this.styleSheet.deleteRule(ruleIndex);
        }
      }

      rule.owner = null;
      rule.destroy();
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.rules.forEach(function(item){
        item.destroy();
      });

      this.styleSheet = null;
      this.rules = null;
    }
  });

 /**
  * @class
  */
  var Rule = Class(null, {
    className: namespace + '.Rule',

   /**
    * type {CSSRule}
    */
    rule: null,

   /**
    * type {string}
    */
    selector: '',

   /**
    * @param {CSSRule} rule
    * @contructor
    */
    init: function(rule, owner){
      this.owner = owner;
      this.rule = rule;
      this.selector = rule.selectorText;
    },

   /**
    * @param {string} property
    * @param {any} value
    */
    setProperty: function(property, value){
      setStyleProperty(this.rule, property, value);
    },

   /**
    * @param {Object} style
    */
    setStyle: function(style){
      Object.iterate(style, this.setProperty, this);
    },

   /**
    * Removes all style properties
    */
    clear: function(){
      this.rule.style.cssText = "";
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.owner)
        this.owner.deleteRule(this);

      this.owner = null;
      this.rule = null;
    }
  });

 /**
  * @class
  */
  var RuleSet = Class(null, {
    className: namespace + '.RuleSet',

   /**
    * @type {Array.<Rule>}
    */
    rules: null,

   /**
    * @param {Array.<Rule>} rules
    * @constructor
    */
    init: function(rules, owner){
      this.owner = owner;
      this.rules = rules.map(function(){
        return new Rule(rule, this);
      }, this);
    },

    createRule: function(selector){
      var rule = this.owner.createRule(selector);
      this.rules.push(rule);
      rule.owner = this;
      return rule;
    },

    deleteRule: function(rule){
      var ruleIndex = this.rules.indexOf(rule);
      if (ruleIndex != -1)
      {
        this.rules.splice(ruleIndex, 1);
        this.owner.deleteRule(rule);
      }
    },

   /**
    */
    destroy: function(){
      if (this.owner)
        this.owner.deleteRule(this);

      this.owner = null;
      this.rules = null;
    }
  });

  ['setProperty', 'setStyle', 'clear'].forEach(function(method){
    RuleSet.prototype[method] = function(){
      for (var rule, i = 0; rule = this.rules[i]; i++)
        rule[method].apply(rule, arguments);
    }
  });

  var unitFunc = {};
  ['em', 'ex', 'px', '%'].forEach(function(unit){
    unitFunc[unit == '%' ? 'percent' : unit] = function(value){
      return value == 0 || isNaN(value) ? '0' : value + unit;
    }
  });

  //
  // classList
  //

 /**
  * @func
  */
  var classList;
  var tokenRxCache = {};

  function tokenRegExp(token){
    return tokenRxCache[token] || (tokenRxCache[token] = new RegExp('\\s*\\b' + token + '\\b'));
  }

 /**
  * @class
  */
  var ClassList = Class(null, {
    className: namespace + '.ClassList',

    init: function(element){ 
      ;;;if (!element) throw new Error(namespace + '.classList: Element ' + element + ' not found!');
      this.element = element;
      //this.tokens = this.element.className.qw();
    },
    toString: function(){
      return this.element.className;
    },

    set: function(tokenList){
      this.clear();
      tokenList.qw().forEach(this.add, this);
    },
    replace: function(searchFor, replaceFor, prefix){
      prefix = prefix || '';

      if (typeof searchFor != 'undefined')
        this.remove(prefix + searchFor);
      
      if (typeof replaceFor != 'undefined')
        this.add(prefix + replaceFor);
    },
    bool: function(token, exists){
      if (exists)
        this.add(token);
      else
        this.remove(token);
    },
    clear: function(){
      this.element.className = '';
    },

    contains: function(token){
      return !!this.element.className.match(tokenRegExp(token));
    },
    item: function(index){
      return this.element.className.qw()[index];
    },
    add: function(token){ 
      ;;;if (arguments.length > 1) console.warn('classList.add accept only one argument');
      if (!this.element.className.match(tokenRegExp(token)))
        this.element.className += ' ' + token;
    },
    remove: function(token){
      ;;;if (arguments.length > 1) console.warn('classList.remove accept only one argument');
      var className = this.element.className;
      var newClassName = className.replace(tokenRegExp(token), '');
      if (newClassName != className)
        this.element.className = newClassName;
    },
    toggle: function(token){
      var exists = this.contains(token);

      if (exists)
        this.remove(token);
      else
        this.add(token);

      return !exists;
    }
  });

  //
  // ClassListNS
  //

  var prefixRxCache = {};
  function prefixRegExp(prefix, global){
    var key = (global ? 'g' : 's') + prefix;
    return prefixRxCache[key] || (prefixRxCache[key] = new RegExp((global ? '' : '\\s*') + '\\b' + prefix + '\\S*\\b'));
  }

 /**
  * @class
  */
  var ClassListNS = Class(null, {
    className: namespace + '.ClassListNS',
    delim: '-',

    init: function(ns, classList){
      this.classList = classList;
      this.prefix = ns + this.delim;
    },

    add: function(value){
      this.classList.add(this.prefix + value);
    },
    remove: function(value){
      this.classList.remove(this.prefix + value);
    },
    items: function(){
      var classList = this.classList.toString();
      if (classList)
        return classList.toString().match(prefixRegExp(this.prefix, true));
    },
    set: function(value){
      var items = this.items();
      var token = typeof value != 'undefined' ? this.prefix + value : '';
      var classList = this.classList;

      if (items)
      {
        if (items.length == 1)
        {
          if (items[0] === token)
            return;

          classList.remove(items[0]);
        }
        else
          this.clear();
      }

      if (token)
        classList.add(token);
    },
    clear: function(){
      this.items().forEach(this.classList.remove, this.classList);
    }
  });

  //
  // Make crossbrowser classList
  //
  if (CLASSLIST_SUPPORTED)
  {
    var proto = ClassList.prototype;
    Object.extend(global.DOMTokenList.prototype, {
      set: proto.set,
      replace: proto.replace,
      bool: proto.bool,
      clear: function(){
        for (var i = this.length; i --> 0;)
          this.remove(this[i]);
      },
      setPrefixToken: proto.setPrefixToken
    });
    classList = function(element){
      return (typeof element == 'string' ? dom.get(element) : element).classList;
    }
  }
  else
  {
    classList = function(element){ 
      return new ClassList(typeof element == 'string' ? dom.get(element) : element);
    }
  }

  var classListProxy = function(element, ns){
    return ns
      ? new ClassListNS(ns, classList(element))
      : classList(element);
  }

  //
  // platform specific actions
  //

  event.onLoad(function(){
    classList(document.body).bool('opacity-not-support', !basis.platformFeature['css-opacity']);
  });


  //
  // export names
  //

  this.extend({
    // style interface
    setStyleProperty: setStyleProperty,
    setStyle: setStyle,
    classList: classListProxy,

    // rule and stylesheet interfaces
    uniqueRule: uniqueRule,
    createRule: createRule,
    getStyleSheet: getStyleSheet,
    addStyleSheet: addStyleSheet,

    // classes
    StyleSheet: StyleSheet,
    Rule: Rule,
    RuleSet: RuleSet
  }).extend(unitFunc);

  basis.namespace('basis.dom').extend({
    // style interface
    setStyleProperty: setStyleProperty,
    setStyle: setStyle,

    // node styling
    display: display,
    show: show,
    hide: hide,
    visibility: visibility,
    visible: visible,
    invisible: invisible
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/cssom.js").call(basis.namespace("basis.cssom"), basis.namespace("basis.cssom"), basis.namespace("basis.cssom").exports, this, __curLocation + "src/basis/cssom.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/date.js
//

new Function(__wrapArgs, function(){

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
  * @namespace basis.date
  */
  var namespace = this.path;

  // import names

  var getter = Function.getter;

  // CONST
  var MONTH_DAY_COUNT = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  var DIFF_BASE = {
    day: 24 * 3600 * 1000,
    hour: 3600 * 1000,
    minute: 60 * 1000,
    second: 1000
  };

  var PART_ERROR = 'Unknown date part: ';
  var DATE_PART = 'year month day hour minute second millisecond'.qw();

  var GETTER = {};
  var SETTER = {};

  Object.iterate({
    year: 'FullYear',
    month: 'Month',
    day: 'Date',
    hour: 'Hours',
    minute: 'Minutes',
    second: 'Seconds',
    millisecond: 'Milliseconds'
  }, function(key, value){
    GETTER[key] = getter('get' + value + '()');
    SETTER[key] = new Function('d,v', 'd.set' + value + '(v)');
  });

  /*
  function(){
    day = date.getDate();
    if (day > 28)
      date.setDate(1);

    this.setMonth/this.setFullYear
    
    if (day)
    {
      var monthDayCount = this.getMonthDayCount();
      if (day > monthDayCount)
        this.setDate(monthDayCount);
    }
  }*/

  var FORMAT = {
    y: getter('getFullYear().toString().substr(2)'),               // %y - year in YY
    Y: getter('getFullYear()'),                                    // %Y - year in YYYY
    d: getter('getDate()'),                                        // %d - day (1..31)
    D: getter('getDate()', '{0:02}'),                              // %D - day (01..31)
    m: getter('getMonth() + 1'),                                   // %m - month (1..12)
    M: getter('getMonth() + 1', '{0:02}'),                         // %M - month (01..12)
    h: getter('getHours()'),                                       // %h - hours (0..23)
    H: getter('getHours()', '{0:02}'),                             // %H - hours (00..23)
    i: getter('getHours() % 12 || 12', '{0:02}'),                  // %i - hours (01..12)
    p: getter('getHours() > 12', { 'true': 'pm', 'false': 'am' }), // %p - am or pm
    P: getter('getHours() > 12', { 'true': 'PM', 'false': 'AM' }), // %p - AM or PM
    I: getter('getMinutes()', '{0:02}'),                           // %I - minutes (00..59)
    s: getter('getSeconds()'),                                     // %s - seconds (0..59)
    S: getter('getSeconds()', '{0:02}'),                           // %S - seconds (00..59)
    z: getter('getMilliseconds()'),                                // %z - milliseconds (0..999)
    Z: getter('getMilliseconds()', '{0:03}')                       // %Z - milliseconds (000..999)
  };

  var reISOFormat = /^(\d{1,4})-(\d\d?)-(\d\d?)(?:[T ](\d\d?):(\d\d?):(\d\d?)(?:\.(\d{1,3}))?)?$/;
  var reFormat = /%([ymdhiszp])/ig;

  // functions

  function isLeapYear(year){
    return !!(!(year % 400) || ((year % 100) && !(year % 4)));
  }

  function getMonthDayCount(month, year){
    return month == 1 ? 28 + isLeapYear(year) : MONTH_DAY_COUNT[month];
  }

  function dateFormat(date, format){
    return format.replace(reFormat, function(m, part){ return FORMAT[part](date) });
  }

  // Date prototype extension

  Object.extend(Date.prototype, {
    isLeapYear: function(){
      return isLeapYear(this.getFullYear());
    },
    getMonthDayCount: function(){
      return getMonthDayCount(this.getMonth(), this.getFullYear());
    },
    add: function(part, value){
      var getter = GETTER[part];

      if (!getter)
        throw new Error(PART_ERROR + part);

      var day;
      if (part == 'year' || part == 'month')
      {
        day = this.getDate();
        if (day > 28)
          this.setDate(1);
      }

      SETTER[part](this, getter(this) + value);

      if (day > 28)
      {
        var monthDayCount = this.getMonthDayCount();
        if (day > monthDayCount)
          this.setDate(monthDayCount);
      }

      return this;
    },
    diff: function(part, date){
      if (part == 'year' || part == 'month')
      {
        var dir = Number(this) - Number(date) > 0 ? -1 : 1;
        var left = dir > 0 ? this : date;
        var right = dir > 0 ? date : this;

        var ly = left.getFullYear();
        var ry = right.getFullYear();
        var ydiff = ry - ly;

        if (part == 'year')
          return dir * ydiff;

        var lm = left.getMonth();
        var rm = right.getMonth();
        var mdiff = ydiff ? ((ydiff > 1 ? (ydiff - 1) * 12 : 0) + (12 - 1 - lm) + (rm + 1)) : rm - lm;

        return dir * mdiff;
      }
      else
      {
        var diff = Math.floor((date - this)/DIFF_BASE[part]);
        return diff + Number(GETTER[part](new Date(date - diff * DIFF_BASE[part])) - GETTER[part](this) != 0)
      }
    },
    set: function(part, value){
      var setter = SETTER[part];

      if (!setter)
        throw new Error(PART_ERROR + part);

      var day;
      if (part == 'year' || part == 'month')
      {
        day = this.getDate();
        if (day > 28)
          this.setDate(1);
      }

      setter(this, value);

      if (day > 28)
      {
        var monthDayCount = this.getMonthDayCount();
        if (day > monthDayCount)
          this.setDate(monthDayCount);
      }

      return this;
    },
    get: function(part){
      if (GETTER[part])
        return GETTER[part](this);

      throw new Error(PART_ERROR + part);
    },
    toISODateString: function(){
      return dateFormat(this, '%Y-%M-%D');
    },
    toISOTimeString: function(){
      return dateFormat(this, '%H:%I:%S.%Z');
    },
    fromDate: function(date){
      if (date instanceof Date)
      {
        this.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        this.setTime(date.getTime());
      }

      return this;
    },
    toFormat: function(format){
      return dateFormat(this, format);
    }
  });

  var _native_toISOString = Date.prototype.toISOString;
  if (_native_toISOString && (new Date).toISOString().match(/Z/i))
  {
    Date.prototype.toISOString = function(){
      return _native_toISOString.call(this).replace(/Z/i, '');
    };
  }

  Object.complete(Date.prototype, {
    // implemented in ECMAScript5
    // TODO: check for time zone
    toISOString: function(){
      return this.toISODateString() + 'T' + this.toISOTimeString();
    },
    fromISOString: function(datetime){
      var m = String(datetime).match(reISOFormat);
      if (!m)
        throw new Error('Value of date isn\'t in ISO format: ' + datetime);

      m[2] -= 1; // substract 1 for monthes
      for (var i = 0, part; part = DATE_PART[i]; i++)
        this.set(part, m[i + 1] || 0);

      return this;
    }
  });

  // capability
  Object.extend(Date.prototype, {
    toODBCDate: Date.prototype.toISODateString,
    toODBCTime: Date.prototype.toISOTimeString,
    toODBC: Date.prototype.toISOString,
    fromODBC: Date.prototype.fromISOString
  });

  // extend Date

  /*Date.fromISOString = function(isoString){
    return isoString ? (new Date()).fromISOString(isoString) : null;
  };*/

  var reIsoStringSplit = /\D/;
  function fastDateParse(y, m, d, h, i, s, ms){
    return new Date(y, m - 1, d, h || 0, i || 0, s || 0, ms || 0);
  }
  Date.fromISOString = function(isoString){
    return isoString ? fastDateParse.apply(null, String(isoString).split(reIsoStringSplit)) : null;
  }

  Date.timer = function(date){
    var timer = date || new Date;
    timer.measure = function(seconds){
      return seconds
        ? ((new Date - timer)/1000).toFixed(3)
        : new Date - timer;
    }
    return timer;
  };


  //
  // export names
  //

  this.extend({
    isLeapYear: isLeapYear,
    getMonthDayCount: getMonthDayCount,
    format: dateFormat
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/date.js").call(basis.namespace("basis.date"), basis.namespace("basis.date"), basis.namespace("basis.date").exports, this, __curLocation + "src/basis/date.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/l10n.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

  'use strict';


 /**
  * @namespace basis.ua.visibility
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;


  //
  // main part
  //

  var dictionaryLocations = {};
  var resourcesLoaded = {};
  var dictionaries = {};

  var currentCulture = 'base';
  var cultureList;


  var Token = Class(null, {
    className: namespace + '.Token',

    bindingBridge: {
      attach: function(token, handler, context){
        return token.attach(handler, context);
      },
      detach: function(token, handler, context){
        return token.detach(handler, context);
      },
      get: function(token){
        return token.value;
      }
    },

    listeners: null,
    value: null,

    init: function(dictionary, tokenName){
      this.listeners = [];
      this.value = '';
      this.dictionary = dictionary;
      this.name = tokenName;
    },

    set: function(value){
      if (value != this.value)
      {
        this.value = value;
        for (var i = 0, listener; listener = this.listeners[i]; i++)
          listener.handler.call(listener.context, value);
      }
    },
    get: function(){
      return this.value;
    },

    attach: function(handler, context){
      for (var i = 0, listener; listener = this.listeners[i]; i++)
      {
        if (listener.handler == handler && listener.context == context)
          return false;
      }

      this.listeners.push({
        handler: handler,
        context: context
      });

      return true;
    },
    detach: function(handler, context){
      for (var i = 0, listener; listener = this.listeners[i]; i++)
      {
        if (listener.handler == handler && listener.context == context)
        {
          this.listeners.splice(i, 1);
          return true;
        }
      }

      return false;
    },

    destroy: function(){
      for (var i = 0, listener; listener = this.listeners[i]; i++)
        this.detach(listener.handler, listener.context);

      delete this.listeners;
      delete this.value;
    }
  });

  var Dictionary = Class(null, {
    className: namespace + '.Dictionary',

    init: function(namespace){
      this.namespace = namespace;
      this.tokens = {};
      this.resources = {};
    },
    update: function(culture, tokens){
      for (var tokenName in tokens)
        this.setCultureValue(culture, tokenName, tokens[tokenName]);
    },
    setCulture: function(culture){
      for (var tokenName in this.tokens)
        this.setTokenValue(tokenName, culture);
    },
    setTokenValue: function(tokenName, culture){
      this.tokens[tokenName].set(this.getCultureValue(culture, tokenName) || this.getCultureValue('base', tokenName));
    },
    setCultureValue: function(culture, tokenName, tokenValue){
      var resource = this.resources[culture];
      if (!resource)
        resource = this.resources[culture] = {};

      resource[tokenName] = tokenValue;

      if (this.tokens[tokenName] && (culture == 'base' || culture == currentCulture))
        this.setTokenValue(tokenName, currentCulture);
    },
    getCultureValue: function(culture, tokenName){
      return this.resources[culture] && this.resources[culture][tokenName];
    },
    getToken: function(tokenName){
      if (!(tokenName in this.tokens))
      {
        this.tokens[tokenName] = new Token(this, tokenName);
        this.setTokenValue(tokenName, currentCulture);
      }

      return this.tokens[tokenName];
    },
    destroy: function(){
      delete this.namespace;
      delete this.tokens;
      delete this.resources;
    }
  });

  function createDictionary(namespace, location, tokens){
    getDictionary(namespace, true).update('base', tokens);
    dictionaryLocations[namespace] = location;
  }

  function setCultureForDictionary(dictionary, culture){
    if (culture != 'base')
      loadCultureForDictionary(dictionary, culture)

    dictionary.setCulture(culture);
  }

  function loadCultureForDictionary(dictionary, culture){
    if (!cultureList || cultureList.indexOf(culture) != -1)
    {
      var location = dictionaryLocations[dictionary.namespace] + '/' + culture;
      if (!resourcesLoaded[location])
      {
        resourcesLoaded[location] = true;
        Function(basis.resource(location + '.js'))();
      }
    }
    else {
      ;;;console.warn('Culture "' + culture + '" is not specified in the list');
    }
  }

  function updateDictionary(namespace, culture, tokens){
    var dictionary = getDictionary(namespace);
    if (dictionary)
    {
      dictionary.update(culture, tokens);
    }
    else
    {
      ;;;console.warn('Dictionary ' + namespace + ' not found');
    }
  }

  function getDictionary(namespace, autoCreate){
    var dict = dictionaries[namespace];

    if (!dict && autoCreate)
      dict = dictionaries[namespace] = new Dictionary(namespace);

    return dict;
  }

  function getToken(path){
    if (arguments.length > 1)
      path = Array.from(arguments).join('.');

    var dotIndex = path.lastIndexOf('.');
    return getDictionary(path.substr(0, dotIndex), true).getToken(path.substr(dotIndex + 1));
  }

  function setCulture(culture){
    if (currentCulture != culture)
    {
      currentCulture = culture || 'base';
      for (var i in dictionaries)
        setCultureForDictionary(dictionaries[i], currentCulture);
    }
  }

  function setCultureList(list){
    if (typeof list == 'string')
      list = list.qw();

    cultureList = list;
  }
  function getCultureList(){
    return cultureList;
  }


  //
  // export names
  //

  this.extend({
    Token: Token,
    getToken: getToken,
    setCulture: setCulture,
    setCultureList: setCultureList,
    getCultureList: getCultureList,
    createDictionary: createDictionary,
    updateDictionary: updateDictionary,
    loadCultureForDictionary: loadCultureForDictionary
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/l10n.js").call(basis.namespace("basis.l10n"), basis.namespace("basis.l10n"), basis.namespace("basis.l10n").exports, this, __curLocation + "src/basis/l10n.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/ui.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.l10n');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.html');


 /**
  * Classes:
  *   {basis.ui.Node}, {basis.ui.Container}, 
  *   {basis.ui.PartitionNode}, {basis.ui.GroupingNode},
  *   {basis.ui.Control}
  *
  * @namespace basis.ui
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var DOM = basis.dom;

  var Cleaner = basis.Cleaner;
  var Template = basis.template.Template;
  var classList = basis.cssom.classList;
  var getter = Function.getter;
  var createEvent = basis.event.create;

  var DWNode = basis.dom.wrapper.Node;
  var DWPartitionNode = basis.dom.wrapper.PartitionNode;
  var DWGroupingNode = basis.dom.wrapper.GroupingNode;


  //
  // main part
  //

  //
  // Binding
  //

  var bindingSeed = 1;

 /**
  * Function that extends list of binding by extension.
  * @func
  */
  function extendBinding(binding, extension){
    binding.bindingId = bindingSeed++;
    for (var key in extension)
    {
      var def = null;
      var value = extension[key];

      if (!value)
        def = null
      else
      {
        value = BINDING_PRESET.process(key, value);

        if (typeof value != 'object')
          def = {
            getter: getter(value)
          };
        else
          if (Array.isArray(value))
            def = {
              getter: getter(value[0]),
              events: value[1]
            };
          else
          {
            def = {
              getter: getter(value.getter),
              l10n: !!value.l10n,
              l10nProxy: value.l10nProxy,
              events: value.events
            };
          }
      }

      binding[key] = def;
    }
  };

  // binding preset

  var BINDING_PRESET = (function(){
    var presets = {};
    var prefixRegExp = /^([a-z\_][a-z0-9\_]*)\:(.*)/i;

    return {
      add: function(prefix, func){
        if (!presets[prefix])
          presets[prefix] = func;

        /** @cut */else console.warn('Preset `' + prefix + '` already exists, new definition ignored');
      },
      process: function(key, value){
        var preset;

        if (typeof value == 'string')
        {
          var m = value.match(prefixRegExp);

          if (m)
          {
            preset = presets[m[1]];
            value = m[2] || key;
          }
        }

        return preset
          ? preset(value)
          : value;
      }
    }
  })();

  //
  // Default binding presets
  //

  BINDING_PRESET.add('data', function(path){
    return ['data.' + path, 'update'];
  });

  BINDING_PRESET.add('satellite', function(satelliteName){
    return {
      events: 'satelliteChanged',
      getter: function(node){
        return node.satellite[satelliteName]
          ? node.satellite[satelliteName].element
          : null;
      }
    };
  });

  BINDING_PRESET.add('l10n', function(token){
    return Function.$const(basis.l10n.getToken(token));
  });

  BINDING_PRESET.add('resource', function(url){
    return Function.$const(basis.resource(url));
  });


 /**
  * Base binding
  */
  var TEMPLATE_BINDING = Class.customExtendProperty({
    selected: {
      events: 'select unselect',
      getter: 'selected && "selected"'
    },
    disabled: {
      events: 'disable enable',
      getter: function(node){
        return node.disabled ? 'disabled' : '';
      }
    },
    state: {
      events: 'stateChanged',
      getter: 'state'
    },
    childCount: {
      events: 'childNodesModified',
      getter: function(node){
        return node.childNodes ? node.childNodes.length : 0;
      }
    },
    hasChilds: {
      events: 'childNodesModified',
      getter: function(node){
        return node.childNodes && node.childNodes.length ? 'hasChilds' : '';
      }
    }
  }, extendBinding);


 /**
  * Base action
  */
  var EMPTY_TEMPLATE_ACTION = Class.extensibleProperty();


 /**
  * Base template for TemplateMixin
  */
  var EMPTY_TEMPLATE = new Template('<div/>');


 /**
  * @mixin
  */
  var TemplateMixin = function(super_){
    return {
     /**
      * Template for object.
      * @type {basis.Html.Template}
      */
      template: EMPTY_TEMPLATE,   // NOTE: explicit template constructor here;
                                  // it could be ommited in subclasses

     /**
      * Contains references to template nodes.
      * @type {Object}
      */
      tmpl: null,

     /**
      * Handlers for template actions.
      * @type {Object}
      */
      action: EMPTY_TEMPLATE_ACTION,

     /**
      * @type {Object}
      */
      binding: TEMPLATE_BINDING,

     /**
      * @type
      */
      id: null,

     /**
      * Classes for template elements.
      * @type {object}
      */
      cssClassName: null,

     /**
      * Fires when template had changed.
      * @event
      */
      event_templateChanged: createEvent('templateChanged'),

     /**
      * Fires when template parse it source.
      * @event
      */
      event_templateUpdate: createEvent('templateUpdate'),

     /**
      * @inheritDoc
      */
      event_update: function(object, delta){
        this.templateUpdate(this.tmpl, 'update', delta);

        super_.event_update.call(this, object, delta);
      },

     /**
      * @inheritDoc
      */
      event_match: function(node){
        super_.event_match.call(this, node);

        DOM.display(this.element, true);
      },

     /**
      * @inheritDoc
      */
      event_unmatch: function(node){
        super_.event_unmatch.call(this, node);

        DOM.display(this.element, false);
      },

     /**
      * @inheritDoc
      */
      init: function(config){
        // create dom fragment by template
        var template = this.template;
        if (template)
        {
          this.template = null;
          this.setTemplate(template);
        }

        // inherit init
        super_.init.call(this, config);
      },

     /**
      * 
      */
      postInit: function(){
        super_.postInit.call(this);

        if (this.template)
        {
          this.templateSync(true);

          if (this.container)
          {
            DOM.insert(this.container, this.element);
            this.container = null;
          }
        }
      },

      templateSync: function(noRecreate){
        var template = this.template;
        var binding = template.getBinding(this.binding, this) || null;
        var oldBinding = this.templateBinding_;
        var tmpl = this.tmpl;
        var oldElement = this.element;

        if (binding !== oldBinding)
        {
          if (oldBinding && oldBinding.handler)
            this.removeHandler(oldBinding.handler);

          if (!noRecreate)
          {
            if (this.tmpl)
              this.tmpl.destroy();
     
            tmpl = template.createInstance(this, this.templateAction, this.templateSync);

            if (tmpl.childNodesHere)
            {
              tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
              tmpl.childNodesElement.insertPoint = tmpl.childNodesHere;
            }

            this.tmpl = tmpl;
            this.element = tmpl.element;
            this.childNodesElement = tmpl.childNodesElement || tmpl.element;
          }

          // insert content
          if (this.content)
          {
            if (this.content instanceof basis.l10n.Token)
            {
              var token = this.content;
              var textNode = DOM.createText(token.value);
              var handler = function(value){ this.nodeValue = value };

              token.attach(handler, textNode);
              this.addHandler({
                destroy: function(){
                  token.detach(handler, textNode);
                }
              });

              DOM.insert(tmpl.content || tmpl.element, textNode)
            }
            else
              DOM.insert(tmpl.content || tmpl.element, this.content);
          }

          // update template
          if (this.id)
            tmpl.element.id = this.id;

          var cssClassNames = this.cssClassName;
          if (cssClassNames)
          {
            if (typeof cssClassNames == 'string')
              cssClassNames = { element: cssClassNames };

            for (var alias in cssClassNames)
            {
              var node = tmpl[alias];
              if (node)
              {
                var nodeClassName = classList(node);
                var names = String(cssClassNames[alias]).qw();
                for (var i = 0, name; name = names[i++];)
                  nodeClassName.add(name);
              }
            }
          }

          this.templateUpdate(this.tmpl);
          if (binding && binding.names.length)
          {
            if (binding.handler)
              this.addHandler(binding.handler);

            binding.sync.call(this);
          }

          for (var child = this.lastChild; child; child = child.previousSibling)
            this.insertBefore(child, child.nextSibling);

          if (oldElement && this.element && oldElement !== this.element)
          {
            var parentNode = oldElement && oldElement.parentNode;
            if (parentNode)
              parentNode.replaceChild(this.element, oldElement);

            // ??? fire event
            this.event_templateChanged(this);
          }

          this.templateBinding_ = binding;
        }
      },

     /**
      *
      */
      setTemplate: function(template){
        if (template instanceof Template == false)
          template = null;

        if (this.template !== template)
        {
          var tmpl;
          var oldTemplate = this.template;
          var oldElement = this.element;

          // drop old template
          if (oldTemplate)
          {
            oldTemplate.clearInstance(this.tmpl, this);

            var oldBinding = oldTemplate.getBinding(this.binding, this);
            if (oldBinding && oldBinding.handler)
              this.removeHandler(oldBinding.handler);

            this.templateBinding_ = null;
          }

          this.template = template;

          // set new template
          if (template)
          {
            tmpl = template.createInstance(this, this.templateAction, this.templateSync);

            if (tmpl.childNodesHere)
            {
              tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
              tmpl.childNodesElement.insertPoint = tmpl.childNodesHere;
            }

            this.tmpl = tmpl;
            this.element = tmpl.element;
            this.childNodesElement = tmpl.childNodesElement || tmpl.element;

            if (oldTemplate)
              this.templateSync(true);
          }
          else
          {
            this.tmpl = null;
            this.element = null;
            this.childNodesElement = null;
          }

          if (oldElement && !this.element)
          {
            var parentNode = oldElement && oldElement.parentNode;
            if (parentNode && parentNode.nodeType == DOM.ELEMENT_NODE)
              parentNode.removeChild(oldElement);
          }

          // ??? fire event
          //if (oldTemplate && template)
          //  this.event_templateChanged(this);
        }
      },

      updateBind: function(bindName){
        var binding = this.binding[bindName];
        var getter = binding && binding.getter;
        if (getter && this.tmpl)
          this.tmpl.set(bindName, getter(this));
      },

     /**
      * Handler on template actions.
      * @param {string} actionName
      * @param {object} event
      */
      templateAction: function(actionName, event){
        var action = this.action[actionName];

        if (action)
          action.call(this, event);
      },

     /**
      * Template update function. It calls on init and on update event by default.
      * @param {Object} tmpl
      * @param {string} eventName
      * @param {Object} delta
      */
      templateUpdate: function(tmpl, eventName, delta){
        /** nothing to do, override it in sub classes */
      },

     /**
      * @inheritDoc
      */
      destroy: function(){
        super_.destroy.call(this);

        this.setTemplate();
      }
    }
  };

 /**
  * Template mixin for containers classes
  * @mixin
  */
  var ContainerTemplateMixin = function(super_){
    return {
      // methods
      insertBefore: function(newChild, refChild){
        var marker = this.domVersion_;

        // inherit
        newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var container = target.childNodesElement || target.element || this.childNodesElement || this.element;

        var nextSibling = newChild.nextSibling;
        //var insertPoint = nextSibling && (target == this || nextSibling.groupNode === target) ? nextSibling.element : null;
        var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;

        var element = newChild.element;
        var refNode = insertPoint || container.insertPoint || null;

        if (element.parentNode !== container || (element.nextSibling !== refNode/* && marker != this.domVersion_*/)) // prevent dom update
          container.insertBefore(element, refNode); // NOTE: null at the end for IE
          
        return newChild;
      },
      removeChild: function(oldChild){
        // inherit
        super_.removeChild.call(this, oldChild);

        // remove from dom
        var element = oldChild.element;
        var parent = element.parentNode;

        if (parent)
          parent.removeChild(element);

        return oldChild;
      },
      clear: function(alive){
        // if not alive mode node element will be removed on node destroy
        if (alive)
        {
          var node = this.firstChild;
          while (node)
          {
            var element = node.element;
            var parent = element.parentNode;

            if (parent)
              parent.removeChild(element);

            node = node.nextSibling;
          }
        }

        // inherit
        super_.clear.call(this, alive);
      },
      setChildNodes: function(childNodes, keepAlive){
        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.grouping || this;
        var container = target.childNodesElement || target.element;
        target.childNodesElement = domFragment;

        // call inherited method
        // NOTE: make sure that dispatching childNodesModified event handlers are not sensetive
        // for child node positions at real DOM (html document), because all new child nodes
        // will be inserted into temporary DocumentFragment that will be inserted into html document
        // later (after inherited method call)
        super_.setChildNodes.call(this, childNodes, keepAlive);

        // restore childNodesElement
        container.insertBefore(domFragment, container.insertPoint || null); // NOTE: null at the end for IE
        target.childNodesElement = container;
      }
    }
  };

 /**
  * @class
  */
  var PartitionNode = Class(DWPartitionNode, TemplateMixin, {
    className: namespace + '.PartitionNode',

    //titleGetter: getter('data.title'),

    binding: {
      title: 'data:'
    }

    /*template: new Template(
      '<div{element} class="Basis-PartitionNode">' + 
        '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
        '<div{content|childNodesElement} class="Basis-PartitionNode-Content"/>' + 
      '</div>'
    ),*//*

    templateUpdate: function(tmpl, eventName, delta){
      if (tmpl.titleText)
        tmpl.titleText.nodeValue = String(this.titleGetter(this));
    }*/
  });


 /**
  * @class
  */
  var GroupingNode = Class(DWGroupingNode, ContainerTemplateMixin, {
    className: namespace + '.GroupingNode',

   /**
    * @inheritDoc
    */
    childClass: PartitionNode,

   /**
    * @inheritDoc
    */
    groupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    event_ownerChanged: function(node, oldOwner){
      this.syncDomRefs();
      DWGroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

    listen: {
      owner: {
        templateChanged: function(){
          this.syncDomRefs();
          for (var child = this.lastChild; child; child = child.previousSibling)
            this.insertBefore(child, child.nextSibling);
        }
      }
    },

    init: function(config){
      this.nullElement = DOM.createFragment();
      this.element = this.childNodesElement = this.nullElement;
      DWGroupingNode.prototype.init.call(this, config);
    },

    syncDomRefs: function(){
      var cursor = this;
      var owner = this.owner;
      var element = null;//this.nullElement;

      if (owner)
      {
        element = (owner.tmpl && owner.tmpl.groupsElement) || owner.childNodesElement || owner.element;
        element.appendChild(this.nullElement);
      }

      do
      {
        cursor.element = cursor.childNodesElement = element;
      }
      while (cursor = cursor.grouping);
    }
  });


 /**
  * @class
  */
  var Node = Class(DWNode, TemplateMixin, {
    className: namespace + '.Node',

    childClass: null
  });


 /**
  * @class
  */
  var Container = Class(Node, ContainerTemplateMixin, {
    className: namespace + '.Container',

    childClass: Node,//Class.SELF,
    childFactory: function(config){
      return new this.childClass(config);
    },

    groupingClass: GroupingNode
  });

 /**
  * @class
  */
  var Control = Class(Container, {
    className: namespace + '.Control',

   /**
    * Create selection by default with empty config.
    */
    selection: true,

   /**
    * @inheritDoc
    */
    init: function(config){
      // inherit
      Container.prototype.init.call(this, config);
                   
      // add to basis.Cleaner
      Cleaner.add(this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit destroy, must be calling after inner objects destroyed
      Container.prototype.destroy.call(this);

      // remove from Cleaner
      Cleaner.remove(this);
    }
  });


 /**
  * @func
  */
  var simpleTemplate = function(template, config){
    var refs = template.match(/\{(this_[^\}]+)\}/g) || [];
    var lines = [];
    for (var i = 0; i < refs.length; i++)
    {
      var name = refs[i].match(/\{(this_[^\|\}]+)\}/)[1];
      lines.push('this.tmpl.' + name + '.nodeValue = ' + name.replace(/_/g, '.'));
    }
    
    return Function('tmpl_', 'config_', 'return ' + (function(super_){
      return Object.extend({
        template: tmpl_,
        templateUpdate: function(tmpl, eventName, delta){
          super_.templateUpdate.call(this, tmpl, eventName, delta);
          _code_();
        }
      }, config_);
    }).toString().replace('_code_()', lines.join(';\n')))(new Template(template), config);
  };


  //
  // export names
  //

  this.setWrapper(simpleTemplate);

  this.extend({
    simpleTemplate: simpleTemplate,
    BINDING_PRESET: BINDING_PRESET,

    Node: Node,
    Container: Container,
    PartitionNode: PartitionNode,
    GroupingNode: GroupingNode,
    Control: Control
  });



}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui.js").call(basis.namespace("basis.ui"), basis.namespace("basis.ui"), basis.namespace("basis.ui").exports, this, __curLocation + "src/basis/ui.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/layout.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.ui');


 /**
  * @namespace basis.layout
  */

  var namespace = this.path;

  // import names

  var document = global.document;
  var defaultView = document.defaultView;

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var Browser = basis.ua;
  var extend = Object.extend;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;

  var nsWrappers = DOM.wrapper;

  var UIContainer = basis.ui.Container;

  //
  // Main part
  //

  // tests

  var IS_IE = Browser.test('IE');
  var IS_IE7_UP = Browser.test('IE7+');

  var SUPPORT_DISPLAYBOX = false;

  var testElement = DOM.createElement('');
  var prefixes = ['', '-webkit-'];
  for (var i = 0; i < prefixes.length; i++)
  {
    try
    {
      var value = prefixes[i] + 'box';
      testElement.style.display = value;
      if (testElement.style.display == value)
      {
        SUPPORT_DISPLAYBOX = prefixes[i];
        break;
      }
    } catch(e) {}
  }

  var SUPPORT_ONRESIZE = typeof testElement.onresize != 'undefined';
  var SUPPORT_COMPUTESTYLE = defaultView && defaultView.getComputedStyle;

  //
  // functions
  //

  function getComputedProperty(element, what){
    if (SUPPORT_COMPUTESTYLE)
      try {
        return parseFloat(defaultView.getComputedStyle(element, null)[what]);
      } catch(e){
        return 0;
      }
    else
      return 0;
  }

  function getHeight(element, ruller){
    if (SUPPORT_COMPUTESTYLE)
    {
      return getComputedProperty(element, 'height');
    }
    else
    {
      cssom.setStyle(ruller, {
        borderTop: element.currentStyle.borderTopWidth + ' solid red',
        borderBottom: element.currentStyle.borderBottomWidth + ' solid red',
        paddingTop: element.currentStyle.paddingTop,
        paddingBottom: element.currentStyle.paddingBottom,
        fontSize: 0.01,
        height: 0,
        overflow: 'hidden'
      });

      return element.offsetHeight - ruller.offsetHeight;
    }
  }

  function addBlockResizeHandler(element, handler){
    // element.style.position = 'relative';
    if (SUPPORT_ONRESIZE)
    {
      classList(element).add('Basis-Layout-OnResizeElement');
      element.onresize = handler;
    }
    else
    {
      var iframe = DOM.createElement({
        description: 'IFRAME.Basis-Layout-OnResizeFrame',
        css: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: 'none',
          //border: '1px solid red',
          left: 0,
          zIndex: -1,
          top: '-2000px'
        }
      });

      DOM.insert(element, iframe);

      iframe.onload = function(){
        (iframe.contentWindow.onresize = handler)();
      }
    }
  }

  // other stuff

  var Helper = function(){
    return DOM.createElement({
      css: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        padding: 0,
        margin: 0,
        border: 0
      }
    });
  };
  Helper.className = 'basis.Layout.Helper';

  var BOX_UNDEFINED = {
    top: Number.NaN,
    left: Number.NaN,
    bottom: Number.NaN,
    right: Number.NaN,
    width: Number.NaN,
    height: Number.NaN,
    defined: false
  };

  //
  // Boxes
  //

 /**
  * @class
  */
  var Box = Class(null, {
    className: namespace + '.Box',

    init: function(element, woCalc, offsetElement){
      this.reset();
      this.setElement(element, woCalc, offsetElement);
    },
    setElement: function(element, woCalc, offsetElement){
      this.element = DOM.get(element);
      this.offsetElement = offsetElement;
      if (!woCalc) this.recalc(this.offsetElement);
    },
    copy: function(box){
      ['top', 'left', 'bottom', 'right', 'height', 'width', 'defined'].forEach(function(prop){ this[prop] = box[prop] }, this);
    },
    reset: function(){
      extend(this, BOX_UNDEFINED);
    },
    set: function(property, value){
      if (this.defined)
      {
        switch(property.toLowerCase()){
          case 'left':   this.left   = value; this.right  = this.left  + this.width; break;
          case 'right':  this.right  = value; this.left   = this.right - this.width; break;
          case 'width':  this.width  = value; this.right  = this.left  + this.width; break;
          case 'top':    this.top    = value; this.bottom = this.top    + this.height; break;
          case 'bottom': this.bottom = value; this.top    = this.bottom - this.height; break;
          case 'height': this.height = value; this.bottom = this.top    + this.height; break;
        }
        if (this.width <= 0 || this.height <= 0)
          this.reset();
      }

      return this;
    },
    recalc: function(offsetElement){
      this.reset();

      var element = this.element;

      if (element)
      {
        var offsetParent = element;
        var documentElement = document.documentElement;

        if (element.getBoundingClientRect)
        {
          // Internet Explorer, FF3, Opera9.50 sheme
          var box = element.getBoundingClientRect();

          this.top = box.top;
          this.left = box.left;

          // offset fix
          if (IS_IE)
          {
            if (IS_IE7_UP)
            {
              // IE7
              this.top  += documentElement.scrollTop  - documentElement.clientTop;
              this.left += documentElement.scrollLeft - documentElement.clientLeft;
            }
            else
              // IE6 and lower
              if (element != document.body)
              {
                this.top  -= document.body.clientTop  - document.body.scrollTop;
                this.left -= document.body.clientLeft - document.body.scrollLeft;
              }
          }

          // coords relative of offsetElement
          if (offsetElement)
          {
            /*if (element.offsetParent == offsetElement)
            {
              this.top = element.offsetTop - offsetElement.scrollTop;
              this.left = element.offsetLeft - offsetElement.scrollLeft;
            }
            else
            {*/
            //if (offsetElement && offsetElement.nodeType == 11) debugger;
              var relBox = new Box(offsetElement);
              this.top  -= relBox.top;
              this.left -= relBox.left;
              relBox.destroy();
            //}
          }
        }
        else
          if (document.getBoxObjectFor)
          {
            // Mozilla sheme
            var oPageBox = document.getBoxObjectFor(documentElement);
            var box = document.getBoxObjectFor(element);

            this.top  = box.screenY - oPageBox.screenY;
            this.left = box.screenX - oPageBox.screenX;

            if (Browser.test('FF1.5-'))
            {
              offsetParent = element.offsetParent;
              // offsetParent offset fix
              if (offsetParent)
              {
                this.top  -= offsetParent.scrollTop;
                this.left -= offsetParent.scrollLeft;
              }

              // documentElement offset fix
              if (offsetParent != document.body)
              {
                this.top  += documentElement.scrollTop;
                this.left += documentElement.scrollLeft;
              }
            }

            if (Browser.test('FF2+'))
            {
              if (this.top)
              {
                var top = documentElement.scrollTop;
                if (top > 2)
                {
                  var end = 0;
                  for (var k = Math.floor(Math.log(top)/Math.LN2); k >= 0; k -= 3)
                    end += 1 << k;
                  if (top > end)
                    this.top -= 1;
                }
              }
              if (this.left)
                this.left -= documentElement.scrollLeft > 1;
            }

            // coords relative of offsetElement
            if (offsetElement)
            {
              var relBox = new Box(offsetElement);
              this.top  -= relBox.top;
              this.left -= relBox.left;
              relBox.destroy();
            }
          }
          else
          {
            // Other browser sheme
            if (element != offsetElement)
            {
              this.top  = element.offsetTop;
              this.left = element.offsetLeft;

              // Body offset fix
              this.top  -= document.body.clientTop  - document.body.scrollTop;
              this.left -= document.body.clientLeft - document.body.scrollLeft;

              while ((offsetParent = offsetParent.offsetParent) && offsetParent != offsetElement)
              {
                this.top  += offsetParent.offsetTop  + offsetParent.clientTop  - offsetParent.scrollTop;
                this.left += offsetParent.offsetLeft + offsetParent.clientLeft - offsetParent.scrollLeft;
              }
            }
            else
              this.top = this.left = 0;
          }

        this.width  = element.offsetWidth;
        this.height = element.offsetHeight;

        //if (this.width <= 0 || this.height <= 0)
        //  this.reset();
        //else
        {
          this.bottom = this.top  + this.height;
          this.right  = this.left + this.width;

          this.defined = true;
        }
      }

      return this.defined;
    },
    intersection: function(box){
      if (!this.defined)
        return false;

      if (box instanceof Box == false)
        box = new Box(box);

      return box.defined &&
             box.right  > this.left && 
             box.left   < this.right &&
             box.bottom > this.top &&
             box.top    < this.bottom;
    },
    inside: function(box){
      if (!this.defined)
        return false;

      if (box instanceof Box == false)
        box = new Box(box);

      return box.defined &&
             box.left   >= this.left && 
             box.right  <= this.right &&
             box.bottom >= this.bottom &&
             box.top    <= this.top;
    },
    point: function(point){
      if (!this.defined)
        return false;

      var x = point.left || point.x || 0;
      var y = point.top  || point.y || 0;

      return x >= this.left  &&
             x <  this.right &&
             y >= this.top   &&
             y <  this.bottom;
    },
    power: function(element){
      if (!this.defined)
        return false;

      element = DOM.get(element) || this.element;

      if (element)
      {
        DOM.setStyle(element, {
          top: this.top + 'px',
          left: this.left + 'px',
          width: this.width + 'px',
          height: this.height + 'px'
        });
        return true;
      }
    },
    destroy: function(){
      delete this.element;
    }
  });


 /**
  * @class
  */
  var Intersection = Class(Box, {
    className: namespace + '.Intersection',

    init: function(boxA, boxB, bWoCalc){
      this.setBoxes(boxA, boxB, bWoCalc);
    },
    setBoxes: function(boxA, boxB, bWoCalc){
      this.boxA = boxA instanceof Box ? boxA : new Box(boxA, true);
      this.boxB = boxB instanceof Box ? boxB : new Box(boxB, true);

      if (!bWoCalc)
        this.recalc();
    },
    recalc: function(){
      this.reset();

      if (!this.boxA.recalc() ||
          !this.boxB.recalc())
        return false;

      if (this.boxA.intersection(this.boxB))
      {
        this.top     = Math.max(this.boxA.top, this.boxB.top);
        this.left    = Math.max(this.boxA.left, this.boxB.left);
        this.bottom  = Math.min(this.boxA.bottom, this.boxB.bottom);
        this.right   = Math.min(this.boxA.right, this.boxB.right);
        this.width   = this.right - this.left;
        this.height  = this.bottom - this.top;

        if (this.width <= 0 || this.height <= 0)
          this.reset();
        else
          this.defined = true;
      }

      return this.defined;
    }
  });


 /**
  * @class
  */
  var Viewport = Class(Box, {
    className: namespace + '.Viewport',

    recalc: function(){
      this.reset();

      var element = this.element;
      if (element)
      {
        var offsetParent = element;

        this.width = element.clientWidth;
        this.height = element.clientHeight;

        if (element.getBoundingClientRect)
        {
          // Internet Explorer, FF3, Opera9.50 sheme
          var box = element.getBoundingClientRect();

          this.top = box.top;
          this.left = box.left;

          while (offsetParent = offsetParent.offsetParent)
          {
            this.top -= offsetParent.scrollTop;
            this.left -= offsetParent.scrollLeft;
          }
        }
        else
          if (document.getBoxObjectFor)
          {
            // Mozilla sheme
            var box = document.getBoxObjectFor(element);

            this.top = box.y;
            this.left = box.x;

            while (offsetParent = offsetParent.offsetParent)
            {
              this.top -= offsetParent.scrollTop;
              this.left -= offsetParent.scrollLeft;
            }
          }
          else
          {
            // Other browsers sheme
            var box = new Box(element);
            this.top = box.top + element.clientTop;
            this.left = box.left + element.clientLeft;
          }

        this.bottom = this.top + this.height;
        this.right = this.left + this.width;

        this.defined = true;
      }

      return this.defined;
    }
  });


  //
  // Vertical stack panel
  //

  var stackPanelId = 0;

  var VerticalPanelRule = cssom.createRule('.Basis-VerticalPanel');
  VerticalPanelRule.setStyle({
    position: 'relative'
  });

  var VerticalPanelStackRule = cssom.createRule('.Basis-VerticalPanelStack');
  VerticalPanelStackRule.setStyle({
    overflow: 'hidden'
  });
  if (SUPPORT_DISPLAYBOX !== false)
  {
    VerticalPanelStackRule.setProperty('display', SUPPORT_DISPLAYBOX + 'box');
    VerticalPanelStackRule.setProperty(SUPPORT_DISPLAYBOX + 'box-orient', 'vertical');
  }

 /**
  * @class
  */
  var VerticalPanel = Class(UIContainer, {
    className: namespace + '.VerticalPanel',

    template: 
      '<div class="Basis-VerticalPanel"/>',

    flex: 0,

    init: function(config){
      UIContainer.prototype.init.call(this, config);

      if (this.flex)
      {
        //cssom.setStyleProperty(this.element, 'overflow', 'auto');

        if (SUPPORT_DISPLAYBOX !== false)
          cssom.setStyleProperty(this.element, SUPPORT_DISPLAYBOX + 'box-flex', this.flex);
      }
      else
      {
        if (SUPPORT_DISPLAYBOX === false)
        {
          addBlockResizeHandler(this.element, (function(){
            if (this.parentNode)
              this.parentNode.realign();
          }).bind(this));
        }
      }
    }
  });

 /**
  * @class
  */
  var VerticalPanelStack = Class(UIContainer, {
    className: namespace + '.VerticalPanelStack',

    childClass: VerticalPanel,
    template:
      '<div class="Basis-VerticalPanelStack">' + 
        (SUPPORT_DISPLAYBOX ? '' : '<div{ruller} style="position: absolute; visibility: hidden; top: -1000px; width: 10px;"/>') +
      '</div>',

    init: function(config){
      //if (SUPPORT_DISPLAYBOX === false)
      //{
        //this.ruleClassName = 'Basis-FlexStackPanel-' + ++stackPanelId;
        //this.cssRule = cssom.cssRule('.' + this.ruleClassName);
        this.cssRule = cssom.uniqueRule();
        this.ruleClassName = this.cssRule.token;
        this.cssRule.setProperty('overflow', 'auto');
      //}

      UIContainer.prototype.init.call(this, config);

      if (SUPPORT_DISPLAYBOX === false)
      {
        //this.box = new Box(this.childNodesElement, true);
        this.realign();

        addBlockResizeHandler(this.childNodesElement, (function(){
          this.realign();
        }).bind(this));
      }
    },
    insertBefore: function(newChild, refChild){
      if (newChild = UIContainer.prototype.insertBefore.call(this, newChild, refChild))
      {
        if (newChild.flex && this.cssRule)
          classList(newChild.element).add(this.ruleClassName);

        this.realign();

        return newChild;
      }
    },
    removeChild: function(oldChild){
      if (UIContainer.prototype.removeChild.call(this, oldChild))
      {
        if (oldChild.flex && this.cssRule)
          classList(oldChild.element).remove(this.ruleClassName);

        this.realign();

        return oldChild;
      }
    },
    realign: function(){
      if (SUPPORT_DISPLAYBOX !== false)
        return;

      var element = this.element;
      var lastElement = this.lastChild.element;
      var ruller = this.tmpl.ruller;

      var lastBox = new Box(lastElement, false, element);
      var bottom = (lastBox.bottom - getComputedProperty(element, 'paddingTop') - getComputedProperty(element, 'borderTopWidth')) || 0;
      var height = getHeight(element, ruller);

      if (!SUPPORT_COMPUTESTYLE)
      {
        var _height = ruller.offsetHeight;
        ruller.style.height = lastElement.currentStyle.marginBottom;
        bottom += ruller.offsetHeight - _height;
      }
      else
      {
        bottom += getComputedProperty(lastElement, 'marginBottom');
      }

      var delta = height - bottom;

      if (!delta)
        return;

      var flexNodeCount = 0;
      var flexHeight = delta;
      for (var i = 0, node; node = this.childNodes[i]; i++)
      {
        if (node.flex)
        {
          flexNodeCount++;
          flexHeight += getHeight(node.element, ruller);
        }
      }

      if (flexNodeCount)
        this.cssRule.setProperty('height', Math.max(0, flexHeight/flexNodeCount) + 'px');
    },
    destroy: function(){
      UIContainer.prototype.destroy.call(this);

      this.cssRule.destroy();
      this.cssRule = null;
    }
  });


  //
  // export names
  //

  this.extend({
    Box: Box,
    Intersection: Intersection,
    Viewport: Viewport,

    VerticalPanel: VerticalPanel,
    VerticalPanelStack: VerticalPanelStack,

    Helper: Helper,
    addBlockResizeHandler: addBlockResizeHandler
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/layout.js").call(basis.namespace("basis.layout"), basis.namespace("basis.layout"), basis.namespace("basis.layout").exports, this, __curLocation + "src/basis/layout.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/dragdrop.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.layout');


 /**
  * @namespace basis.dragdrop
  */
  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var addGlobalHandler = Event.addGlobalHandler;
  var removeGlobalHandler = Event.removeGlobalHandler;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsWrappers = basis.dom.wrapper;
  var nsLayout = basis.layout;
  var ua = basis.ua;
  

  //
  // Main part
  //

  var SELECTSTART_SUPPORTED = Event.getEventInfo('selectstart').supported;

  var DDEConfig;
  var DDEHandler = {
    start: function(event){
      if (DDEConfig)
        DDEHandler.over();

      DDEConfig = {
        dde: this,
        run: false,
        event: {
          // calculate point
          initX: Event.mouseX(event),
          initY: Event.mouseY(event),
          deltaX: 0,
          deltaY: 0
        }
      };

      // add global handlers
      addGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
      addGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
      addGlobalHandler('mousedown', DDEHandler.over, DDEConfig);
      if (SELECTSTART_SUPPORTED)
        addGlobalHandler('selectstart', Event.kill, DDEConfig);

      // kill event
      Event.cancelDefault(event);

      // ready to drag start, make other preparations if need
      this.event_prepare(DDEConfig.event, event);
    },
    move: function(event){  // `this` store DDE config
      var dde = DDEConfig.dde;

      //if (!Event.mouseButton(e, Event.MOUSE_LEFT))
      //  return DDEHandler.over();

      if (!DDEConfig.run)
      {
        DDEConfig.run = true;
        dde.draging = true;
        dde.event_start(DDEConfig.event);
      }

      if (dde.axisX)
        DDEConfig.event.deltaX = dde.axisXproxy(Event.mouseX(event) - DDEConfig.event.initX);

      if (dde.axisY)
        DDEConfig.event.deltaY = dde.axisYproxy(Event.mouseY(event) - DDEConfig.event.initY);

      dde.event_move(DDEConfig.event, event);
    },
    over: function(event){  // `this` store DDE config
      var dde = DDEConfig.dde;

      // remove global handlers
      removeGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
      removeGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
      removeGlobalHandler('mousedown', DDEHandler.over, DDEConfig);
      if (SELECTSTART_SUPPORTED)
        removeGlobalHandler('selectstart', Event.kill, DDEConfig);

      dde.draging = false;

      if (DDEConfig.run)
        dde.event_over(DDEConfig.event, event);
      
      DDEConfig = null;
      Event.kill(event);
    }
  };

  var DDCssClass = {
    dragable: 'Basis-Dragable',
    element: 'Basis-DragDrop-DragElement'
  };

 /**
  * @class
  */
  var DragDropElement = Class(EventObject, {
    className: namespace + '.DragDropElement',

    containerGetter: getter('element'),

    element: null,
    trigger: null,            // element that trig a drag; if null element is trig drag itself
    baseElement: null,        // element that will be a base of offset; if null then document body is base

    fixTop: true,
    fixRight: true,
    fixBottom: true,
    fixLeft: true,

    axisX: true,
    axisY: true,

    axisXproxy: Function.$self,
    axisYproxy: Function.$self,

    event_prepare: createEvent('prepare'), // occure before drag start
    event_start: createEvent('start'), // occure on first mouse move
    event_move: createEvent('move'),
    event_over: createEvent('over'),

    //
    // Constructor
    //
    init: function(config){
      //this.inherit(config);
      EventObject.prototype.init.call(this, config);

      var element = this.element;
      var trigger = this.trigger;

      this.element = null;
      this.trigger = null;

      this.setElement(element, trigger);
      this.setBase(this.baseElement);

      basis.Cleaner.add(this);
    },


    //
    // public
    //

    setElement: function(element, trigger){
      element = element && DOM.get(element);
      trigger = (trigger && DOM.get(trigger)) || element;

      if (this.trigger != trigger)
      {
        if (this.trigger)
          Event.removeHandler(this.trigger, 'mousedown', DDEHandler.start, this);

        this.trigger = trigger;

        if (this.trigger)
          Event.addHandler(this.trigger, 'mousedown', DDEHandler.start, this);
      }


      if (this.element != element)
      {
        if (this.element)
          classList(this.element).remove(DDCssClass.dragable);

        this.element = element;

        if (this.element)
          classList(this.element).add(DDCssClass.dragable);
      }
    },

    setBase: function(baseElement){
      this.baseElement = DOM.get(baseElement) || (ua.is('IE7-') ? document.body : document.documentElement);
    },

    isDraging: function(){
      return !!(DDEConfig && DDEConfig.dde == this);
    },

    start: function(event){
      if (!this.isDraging())
        DDEHandler.start.call(this, event);
    },
    stop: function(){
      if (this.isDraging())
        DDEHandler.over();
    },

    destroy: function(){
      basis.Cleaner.remove(this);

      this.stop();

      EventObject.prototype.destroy.call(this);
      
      this.setElement();
      this.setBase();
    }
  });

 /**
  * @class
  */
  var MoveableElement = Class(DragDropElement, {
    className: namespace + '.MoveableElement',
    
    event_start: function(config){
      var element = this.containerGetter(this, config.initX, config.initY);

      if (element)
      {
        var box = new nsLayout.Box(element);
        var viewport = new nsLayout.Viewport(this.baseElement);

        // set class
        classList(element).add(DDCssClass.element);

        config.element = element;
        config.box = box;
        config.viewport = viewport;
      }

      DragDropElement.prototype.event_start.call(this, config);
    },

    event_move: function(config){
      if (!config.element)
        return;

      if (this.axisX)
      {
        var newLeft = config.box.left + config.deltaX;
        
        if (this.fixLeft && newLeft < 0)
          newLeft = 0;
        else
          if (this.fixRight && newLeft + config.box.width > config.viewport.width)
            newLeft = config.viewport.width - config.box.width;

        config.element.style.left = newLeft + 'px';
      }

      if (this.axisY)
      {
        var newTop = config.box.top + config.deltaY;
       
        if (this.fixTop && newTop < 0)
          newTop = 0;
        else
          if (this.fixBottom && newTop + config.box.height > config.viewport.height)
            newTop = config.viewport.height - config.box.height;

        config.element.style.top = newTop + 'px';
      }

      DragDropElement.prototype.event_move.call(this, config);
    },

    event_over: function(config){
      if (!config.element)
        return;

      // remove class
      classList(config.element).remove(DDCssClass.element);

      DragDropElement.prototype.event_over.call(this, config);
    }
  });


  //
  // export names
  //

  this.extend({
    DragDropElement: DragDropElement,
    MoveableElement: MoveableElement
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/dragdrop.js").call(basis.namespace("basis.dragdrop"), basis.namespace("basis.dragdrop"), basis.namespace("basis.dragdrop").exports, this, __curLocation + "src/basis/dragdrop.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/data/property.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.data');


 /**
  * Namespace overview:
  * - {basis.data.property.DataObjectSet}
  * - {basis.data.property.AbstractProperty}
  * - {basis.data.property.Property}
  * - {basis.data.property.PropertySet} as aliases for {basis.data.property.DataObjectSet}
  *
  * @namespace basis.data.property
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var Cleaner = basis.Cleaner;

  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var TimeEventManager = basis.timer.TimeEventManager;
  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;

  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_DATAOBJECT_REQUIRED = namespace + ': Instance of DataObject required';
  /** @const */ var EXCEPTION_BAD_OBJECT_LINK = namespace + ': Link to undefined object ignored';

  //
  //  ABSTRACT PROPERTY
  //
  
 /**
  * @class
  */
  var AbstractProperty = Class(DataObject, {
    className: namespace + '.AbstractProperty',

    event_change: createEvent('change'),

   /**
    * Indicates that property is locked (don't fire event for changes).
    * @type {boolean}
    * @readonly
    */
    locked: false,

   /**
    * Value before property locked (passed as oldValue when property unlock).
    * @type {Object}
    * @private
    */
    lockValue_: null,

   /** use custom constructor */
    extendConstructor_: false,

    updateCount: 0,

   /**
    * @param {Object} initValue Initial value for object.
    * @param {Object=} handlers
    * @param {function()=} proxy
    * @constructor
    */
    init: function(initValue, handlers, proxy){
      DataObject.prototype.init.call(this, {});
      if (handlers)
        this.addHandler(handlers);

      this.proxy = typeof proxy == 'function' ? proxy : Function.$self;
      this.initValue = this.value = this.proxy(initValue);
    },

   /**
    * Sets new value for property, only when data not equivalent current
    * property's value. In causes when value was changed or forceEvent
    * parameter was true event 'change' dispatching.
    * @param {Object} data New value for property.
    * @param {boolean=} forceEvent Dispatch 'change' event even value not changed.
    * @return {boolean} Whether value was changed.
    */
    set: function(data, forceEvent){
      var oldValue = this.value;
      var newValue = this.proxy ? this.proxy(data) : newValue;
      var updated = false;

      if (newValue !== oldValue)
      {
        this.value = newValue;
        updated = true;
        this.updateCount += 1;
      }

      if (!this.locked && (updated || forceEvent))
        this.event_change(newValue, oldValue);

      return updated;
    },

   /**
    * Locks object for change event fire.
    */
    lock: function(){
      if (!this.locked)
      {
        this.lockValue_ = this.value;
        this.locked = true;
      }
    },

   /**
    * Unlocks object for change event fire. If value was changed during object
    * lock, than change event fires.
    */
    unlock: function(){
      if (this.locked)
      {
        this.locked = false;
        if (this.value !== this.lockValue_)
          this.event_change(this.value, this.lockValue_);
      }
    },

    update: function(newValue, forceEvent){
      return this.set(newValue, forceEvent);
    },

   /**
    * Sets init value for property.
    */
    reset: function(){
      this.set(this.initValue);
    },

   /**
    * Returns object value.
    * @return {Object}
    */
    /*toString: function(){
      return this.value != null && this.value.constructor == Object ? String(this.value) : this.value;
    },*/

   /**
    * @destructor
    */
    destroy: function(){
      DataObject.prototype.destroy.call(this);

      delete this.initValue;
      delete this.proxy;
      delete this.lockValue_;
      delete this.value;
    }
  });

  //
  //  PROPERTY
  //

  var PropertyObjectDestroyAction = { 
    destroy: function(object){ 
      this.removeLink(object) 
    } 
  };

  var DOM_INSERT_HANDLER = function(value){
    DOM.insert(DOM.clear(this), value);
  };

  function getFieldHandler(object){
    // property
    if (object instanceof Property)
      return object.set;

    // DOM
    var nodeType = object.nodeType;
    if (isNaN(nodeType) == false)
      if (nodeType == 1)
        return DOM_INSERT_HANDLER;
      else
        return 'nodeValue';
  }

 /**
  * @class
  */
  var Property = Class(AbstractProperty, {
    className: namespace + '.Property',

   /**
    * @type {object}
    * @private
    */
    links_: null,

   /**
    */
    bindingBridge: {
      attach: function(property, handler, context){
        return property.addLink(context, handler);
      },
      detach: function(property, handler, context){
        return property.removeLink(context, handler);
      },
      get: function(property){
        return property.value;
      }
    },

   /**
    * @event
    */
    event_change: function(value, oldValue){
      AbstractProperty.prototype.event_change.call(this, value, oldValue);

      if (!this.links_.length || Cleaner.globalDestroy)
        return;

      for (var i = 0, link; link = this.links_[i++];)
        this.power_(link, oldValue);
    },

   /**
    * @inheritDoc
    * @constructor
    */
    init: function(initValue, handlers, proxy){
      AbstractProperty.prototype.init.call(this, initValue, handlers, proxy);
      this.links_ = new Array();

      Cleaner.add(this);
    },

   /**
    * Adds link to object property or method. Optional parameter format using to
    * convert value to another value or type.
    * If object instance of {basis.event.EventObject}, property attached handler. This handler
    * removes property links to object, when object destroy.
    * @example
    *
    *   var property = new Property();
    *   property.addLink(htmlElement);  // property.set(value) -> DOM.insert(DOM.clear(htmlElement), value);
    *   property.addLink(htmlTextNode); // shortcut for property.addLink(htmlTextNode, 'nodeValue')
    *                                   // property.set(value) -> htmlTextNode.nodeValue = value;
    *
    *   property.addLink(htmlTextNode, null, '[{0}]'); // htmlTextNode.nodeValue = '[{0}]'.format(value, oldValue);
    *   property.addLink(htmlTextNode, null, convert); // htmlTextNode.nodeValue = convert(value);
    *
    *   property.addLink(object, 'property');          // object.property = value;
    *   property.addLink(object, 'property', '[{0}]'); // object.property = '[{0}]'.format(value, oldValue);
    *   property.addLink(object, 'property', Number);  // object.property = Number(value, oldValue);
    *   property.addLink(object, 'property', { a: 1, b: 2});  // object.property = { a: 1, b: 2 }[value];
    *   property.addLink(object, object.method);       // object.method(value, oldValue);
    *
    *   property.addLink(object, function(value, oldValue){ // {function}.call(object, value, oldValue);
    *     // some code
    *     // (`this` is object property attached to)
    *   });
    *
    *   // Trace property changes
    *   var historyOfChanges = new Array();
    *   var property = new Property(1);
    *   property.addLink(historyOfChanges, historyOfChanges.push);  // historyOfChanges -> [1]
    *   property.set(2);  // historyOfChanges -> [1, 2]
    *   property.set(3);  // historyOfChanges -> [1, 2, 3]
    *   property.set(3);  // property didn't change self value
    *                     // historyOfChanges -> [1, 2, 3]
    *   property.set(1);  // historyOfChanges -> [1, 2, 3, 1]
    *
    *   // Another one
    *   property.addLink(console, console.log, 'new value of property is {0}');
    *
    * @param {Object} object Target object.
    * @param {String|Function=} field Field or method of target object.
    * @param {String|Function|Object=} format Value modificator.
    * @return {Object} Returns object.
    */
    addLink: function(object, field, format){
      // process field name
      if (field == null)
      {
        // object must be an Object
        // IE HtmlNode isn't instanceof Object, therefore additionaly used typeof
        if (typeof object != 'object' && object instanceof Object == false)
          throw new Error(EXCEPTION_BAD_OBJECT_LINK);

        field = getFieldHandler(object);
      }

      // process format argument
      if (typeof format != 'function')
        format = getter(Function.$self, format);

      // create link
      var link = { 
        object: object,
        format: format,
        field: field,
        isEventObject: object instanceof EventObject 
      };

      // add link
      ;;;if (typeof console != 'undefined' && this.links_.search(true, function(link){ return link.object == object && link.field == field })) console.warn('Property.addLink: Dublicate link for property');
      this.links_.push(link);  // !!! TODO: check for object-field duplicates
      
      if (link.isEventObject)
        object.addHandler(PropertyObjectDestroyAction, this); // add unlink handler on object destroy

      // make effect on object
      this.power_(link);

      return object;
    },

   /**
    * Add link to object in simpler way.
    * @example
    *   // add custom class name to element (class name looks like "state-property.value")
    *   property.addLinkShortcut(element, 'className', 'state-{0}');
    *   // add 'loading' class name to element, when property is true
    *   property.addLinkShortcut( element, 'className', { true: 'loading' });
    *   // switch style.display property (using DOM.show/DOM.hide)
    *   property.addLinkShortcut(element, 'show', { ShowValue: true });
    *   property.addLinkShortcut(element, 'show', function(value){ return value == 'ShowValue' });  // the same
    *   property.addLinkShortcut(element, 'hide', { 'HideValue': true } });  // variation
    * @param {object} element Target object.
    * @param {String} shortcutName Name of shortcut.
    * @param {String|Function|Object=} format Value modificator.
    * @return {Object} Returns object.
    */
    addLinkShortcut: function(element, shortcutName, format){
      return this.addLink(element, Property.shortcut[shortcutName], format);
    },

   /**
    * Removes link or all links from object if exists. Parameters must be the same
    * as for addLink method. If field omited all links removes.
    * @example
    *   // add links
    *   property.addLink(object, 'field');
    *   property.addLink(object, object.method);
    *   // remove links
    *   property.removeLink(object, 'field');
    *   property.removeLink(object, object.method);
    *   // or remove all links from object
    *   property.removeLink(object);
    *
    *   // incorrect usage
    *   property.addLink(object, function(value){ this.field = value * 2; });
    *   ...
    *   property.removeLink(object, function(value){ this.field = value * 2; });
    *   // link property to object still present
    *
    *   // right way
    *   var linkHandler = function(value){ this.field = value * 2; };
    *   property.addLink(object, linkHandler);
    *   ...
    *   property.removeLink(object, linkHandler);
    *
    *   // for cases when object is instance of {basis.event.EventObject} removing link on destroy is not required
    *   var node = new Node();
    *   property.addLink(node, 'title');
    *   ...
    *   node.destroy();       // links will be removed automatically
    * @param {Object} object
    * @param {String|Function=} field
    */
    removeLink: function(object, field){
      if (this.links_ == null) // property destroyed
        return;

      var deleteAll = arguments.length < 2;

      // process field name
      if (!deleteAll && field == null)
        field = getFieldHandler(object);

      // delete link
      var k = 0;
      for (var i = 0, link; link = this.links_[i]; i++)
      {
        if (link.object === object && (deleteAll || field == link.field))
        {
          if (link.isEventObject)
            link.object.removeHandler(PropertyObjectDestroyAction, this); // remove unlink handler on object destroy
        }
        else
          this.links_[k++] = link;
      }
      this.links_.length = k;
    },

   /**
    * Removes all property links to objects.
    */
    clear: function(){
      // destroy links
      for (var i = 0, link; link = this.links_[i]; i++)
        if (link.isEventObject)
          link.object.removeHandler(PropertyObjectDestroyAction, this); // remove unlink on object destroy

      // clear links array
      this.links_.clear();
    },

   /**
    * @param {Object} link
    * @param {Object} oldValue Object value before changes.
    * @private
    */
    power_: function(link, oldValue){
      var field = link.field;

      // field specified
      if (field != null)
      {
        var value = link.format(this.value);
        var object = link.object;

        if (typeof field == 'function')
          field.call(object, value, arguments.length < 2 ? value : link.format(oldValue));
        else
          object[field] = value;
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.clear();

      AbstractProperty.prototype.destroy.call(this);

      this.links_ = null;
      Cleaner.remove(this);
    }
  });

  Property.shortcut = {
    className: function(newValue, oldValue){ classList(this).replace(oldValue, newValue) },
    show:      function(newValue){ DOM.display(this, !!newValue) },
    hide:      function(newValue){ DOM.display(this, !newValue) },
    disable:   function(newValue){ this.disabled = !!newValue },
    enable:    function(newValue){ this.disabled = !newValue }
  };

  //
  //  Property Set
  //
                       // priority: lowest  ------------------------------------------------------------> highest
  var DataObjectSetStatePriority = STATE.PRIORITY; //[STATE.READY, STATE.DEPRECATED, STATE.UNDEFINED, STATE.ERROR, STATE.PROCESSING];
  var DataObjectSetHandlers = {
    stateChanged: function(){
      this.fire(false, true);
    },
    update: function(){
      this.fire(true);
    },
    change: function(){
      this.fire(true);
    },
    destroy: function(object){
      this.remove(object)
    }
  };

 /**
  * @class
  */    
  var DataObjectSet = Class(Property, {
    className: namespace + '.DataObjectSet',
    
   /**
    * @type {Function}
    */
    calculateValue: function(){
      return this.value + 1;
    },

   /**
    * @type {Array.<basis.data.DataObject>}
    */
    objects: null,

   /**
    * @type {number}
    * @private
    */
    timer_: null,

   /**
    * @type {boolean}
    * @private
    */
    valueChanged_: false,

   /**
    * @type {boolean}
    * @private
    */
    stateChanged_: true,

   /**
    * Default state is UNDEFINED
    */
    state: STATE.UNDEFINED,

   /**
    * use extend constructor
    */
    extendConstructor_: true,

   /**
    * @param {Object} config
    * @config {Object} value
    * @config {Object} handlers
    * @config {boolean} calculateOnInit
    * @config {function()} proxy
    * @config {function()} calculateValue
    * @config {Array.<basis.data.DataObject>} objects
    * @constructor
    */
    init: function(config){
      var handlers = this.handler;
      delete this.handler;

      Property.prototype.init.call(this, this.value || 0, handlers, this.proxy);

      /*if (typeof config.calculateValue == 'function')
        this.calculateValue = config.calculateValue;*/

      var objects = this.objects;
      this.objects = [];

      if (objects && Array.isArray(objects))
      {
        this.lock();
        this.add.apply(this, objects);
        this.unlock();
      }

      this.valueChanged_ = this.stateChanged_ = !!this.calculateOnInit;
      this.update();

      Cleaner.add(this);
    },

   /**
    * Adds one or more DataObject instances to objects collection.
    * @param {...basis.data.DataObject} args
    */
    add: function(/* dataObject1 .. dataObjectN */){
      for (var i = 0, len = arguments.length; i < len; i++)
      {
        var object = arguments[i];
        if (object instanceof DataObject)
        {
          if (this.objects.add(object))
            object.addHandler(DataObjectSetHandlers, this);
        }
        else
          throw new Error(EXCEPTION_DATAOBJECT_REQUIRED);
      }

      this.fire(true, true);
    },

   /**
    * Removes DataObject instance from objects collection.
    * @param {basis.data.DataObject} object
    */
    remove: function(object){
      if (this.objects.remove(object))
        object.removeHandler(DataObjectSetHandlers, this);

      this.fire(true, true);
    },

   /**
    * Removes all DataObject instances from objects collection.
    */
    clear: function(){
      for (var i = 0, object; object = this.objects[i]; i++)
        object.removeHandler(DataObjectSetHandlers, this);
      this.objects.clear();

      this.fire(true, true);
    },

   /**
    * @param {boolean} valueChanged 
    * @param {boolean} stateChanged
    */
    fire: function(valueChanged, stateChanged){
      if (!this.locked)
      {
        this.valueChanged_ = this.valueChanged_ || !!valueChanged;
        this.stateChanged_ = this.stateChanged_ || !!stateChanged;

        if (!this.timer_ && (this.valueChanged_ || this.stateChanged_))
        {
          this.timer_ = true;
          TimeEventManager.add(this, 'update', Date.now());
        }
      }
    },

   /**
    * Makes object not sensitive for attached DataObject changes.
    */
    lock: function(){
      this.locked = true;
    },

   /**
    * Makes object sensitive for attached DataObject changes.
    */
    unlock: function(){
      this.locked = false;
    },
    
   /**
    * @private
    */
    update: function(){
      delete this.timer_;
      TimeEventManager.remove(this, 'update');

      if (!Cleaner.globalDestroy)
      {
        if (this.valueChanged_)
          this.set(this.calculateValue());

        if (this.stateChanged_)
        {
          var stateMap = {};
          var len = this.objects.length;
          if (!len)
            this.setState(STATE.UNDEFINED)
          else
          {
            var maxWeight = -2;
            var curObject;

            for (var i = 0; i < len; i++)
            {
              var object = this.objects[i];
              var weight = DataObjectSetStatePriority.indexOf(String(object.state));
              if (weight > maxWeight)
              {
                curObject = object;
                maxWeight = weight;
              }
            }

            if (curObject)
              this.setState(curObject.state, curObject.state.data);
          }
          //this.setState();
        }
      }

      this.valueChanged_ = false;
      this.stateChanged_ = false;
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.lock();
      this.clear();
      TimeEventManager.remove(this, 'update');

      Property.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    DataObjectSet: DataObjectSet,
    AbstractProperty: AbstractProperty,
    Property: Property,
    PropertySet: DataObjectSet
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/data/property.js").call(basis.namespace("basis.data.property"), basis.namespace("basis.data.property"), basis.namespace("basis.data.property").exports, this, __curLocation + "src/basis/data/property.js", __curLocation + "src/basis/data/", basis, function(url){ return basis.resource(__curLocation + "src/basis/data/" + url) });

//
// src/basis/animation.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.cssom');
  basis.require('basis.data.property');


 /**
  * @namespace basis.animation
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Property = basis.data.property.Property;

  var setStyle = basis.cssom.setStyle;
  var createEvent = basis.event.create;

  
  //
  // MAIN PART
  //

  function timePosition(startTime, duration){
    return (Date.now() - startTime).fit(0, duration) / duration;
  }

  //
  // Add requestAnimationFrame/cancelAnimationFrame support
  //

  var prefixes = ['webkit', 'moz', 'o', 'ms'];

  function createMethod(name, fallback){
    if (global[name])
      return global[name];

    name = name.charAt(0).toUpperCase() + name.substr(1);
    for (var i = 0, prefix; prefix = prefixes[i++];)
      if (global[prefix + name])
        return global[prefix + name];

    return fallback;
  }

  var requestAnimationFrame = createMethod('requestAnimationFrame',
    function(callback){
      return setTimeout(callback, 1000 / 60);
    }
  );

  var cancelAnimationFrame = createMethod('cancelRequestAnimFrame') || createMethod('cancelAnimationFrame', clearTimeout);


 /**
  * @class
  */
  var Thread = Class(Property, {
    className: namespace + '.Thread',

    duration: 1000,
    //interval: 50,
    startTime: 0,
    timer: null,
    started: false,

    event_start: createEvent('start'),
    event_finish: createEvent('finish'),
    event_invert: createEvent('invert'),
    event_change: function(value, prevValue){
      if (value == 0.0)
        this.event_start();

      Property.prototype.event_change.call(this, value, prevValue);

      if (value == 1.0)
        this.event_finish();
    },

    extendConstructor_: true,
    init: function(config){
      this.run = this.run.bind(this);

      Property.prototype.init.call(this, 0);
    },
    start: function(invertIfRun){
      if (!this.started)
      {
        this.startTime = Date.now();
        this.started = true;
        this.run();
      }
      else
        if (invertIfRun)
          this.invert();
    },
    run: function(){
      cancelAnimationFrame(this.timer);
      if (this.started)
      {
        var progress = timePosition(this.startTime, this.duration);

        if (progress >= 1.0)
          this.stop();
        else
        {
          this.set(progress);
          this.timer = requestAnimationFrame(this.run);
        }
      }
    },
    invert: function(){
      this.event_invert();

      if (this.started)
      {
        var progress = timePosition(this.startTime, this.duration);
        this.startTime = Date.now() - this.duration * (1.0 - progress) ;
        this.run();
      }
    },
    stop: function(){
      cancelAnimationFrame(this.timer);

      if (this.started)
      {
        this.started = false;
        this.set(1.0);
      }
    },        
    destroy: function(){
      this.stop();

      Property.prototype.destroy.call();
    }
  });


 /**
  * @class
  */
  var Modificator = Class(null, {
    className: namespace + '.Modificator',
    thread: null,
    setter: Function.$null,
    notRevert: false,
    timeFunction: Function.$self,

    init: function(thread, setter, start, end, notInvert){
      if (thread instanceof Thread)
        this.thread = thread;
      else
        this.thread = new Thread(thread);

      this.setRange(start, end);

      this.setter = setter;
      this.notInvert = notInvert;

      this.thread.addHandler({
        start: function(){
          //;;;if (typeof console != 'undefined') console.log(this.className, 'start');
        },
        invert: function(){
          this.start += this.range;
          this.range *= -1;
          //;;;if (typeof console != 'undefined') console.log(this.className, 'invert');
        },
        change: function(progress){
          this.setter(this.start + this.range * this.timeFunction(progress));
          //console.log(this.className, progress);
        },
        finish: function(){
          if (!this.notInvert)
          {
            this.start += this.range;
            this.range *= -1;
          }
          //;;;if (typeof console != 'undefined') console.log(this.className, 'finish');
        },
        destroy: this.destroy
      }, this);
    },
    setRange: function(start, end){
      this.start = start;
      this.range = end - start;
    },
    destroy: function(){
      delete this.thread;
    }
  });


 /**
  * @enum
  */
  var FX = {
    CSS: {
      FadeIn: function(thread, element){
        return new Modificator(thread, function(value){ setStyle(element, { opacity: value }) }, 0, 1);
      },
      FadeOut: function(thread, element){
        return new Modificator(thread, function(value){ setStyle(element, { opacity: value }) }, 1, 0);
      }
    }
  };


  //
  // export names
  //

  global.requestAnimationFrame = requestAnimationFrame;
  global.cancelAnimationFrame = cancelAnimationFrame;

  this.extend({
    Thread: Thread,
    Modificator: Modificator,
    FX: FX
  });



}.body() + "//@ sourceURL=" + __curLocation + "src/basis/animation.js").call(basis.namespace("basis.animation"), basis.namespace("basis.animation"), basis.namespace("basis.animation").exports, this, __curLocation + "src/basis/animation.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/xml.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.ua');
  basis.require('basis.dom');


 /**
  * @namespace basis.xml
  */

  var namespace = this.path;

  // import names

  var DOM = basis.dom;
  var Class = basis.Class;
  var Browser = basis.ua;

  var extend = Object.extend;

  var ELEMENT_NODE = DOM.ELEMENT_NODE;
  var ATTRIBUTE_NODE = DOM.ATTRIBUTE_NODE;

  /*
   *  QName
   */

  var QName = Class(null, {
    className: namespace + '.QName',
    init: function(localpart, namespace, prefix){
      this.localpart = localpart;
      this.namespace = namespace || '';
      this.prefix = prefix || '';
    },
    toString: function(){
      return this.prefix ? this.prefix + ':' + this.localpart : this.localpart;
    }
  });

  /*
   *  Constants
   */

  var XSD_NAMESPACE = String('http://www.w3.org/2001/XMLSchema');
  var XSI_NAMESPACE = String('http://www.w3.org/2001/XMLSchema-instance');
  var NS_NAMESPACE  = String('http://www.w3.org/2000/xmlns/');

  var XSI_NIL_LOCALPART = 'nil';

  var XMLNS = {
    PREFIX: 'xmlns',
    NAMESPACE: NS_NAMESPACE,
    BAD_SUPPORT: Browser.test('webkit528.16-') || Browser.test('opera9-')
                          // !!!todo: make a test like
                          // createElementNS(document, 'test', SOAP_NAMESPACE).attributes.length == 0;
  };

  /*
   *  document
   */

  var XMLProgId = 'native';
  var isNativeSupport = true;

  var createDocument = function(){
    var implementation = document.implementation;
    if (implementation && implementation.createDocument)
    {
      return function(namespace, nodename){ 
        var result = implementation.createDocument(namespace, nodename, null);
        if (result.charset && result.charset != document.charset)
          result.charset = document.charset;
        return result;
      }
    }

    if (window.ActiveXObject)
    {
      // http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
      var progId = ["MSXML2.DOMDocument.6.0", "MSXML2.DOMDocument.3.0"];

      for (var i = 0; i < progId.length; i++)
        try { 
          if (new ActiveXObject(progId[i]))
          {
            XMLProgId = progId[i];
            isNativeSupport = false;
            return function(namespace, nodename){
              var xmlDocument = new ActiveXObject(XMLProgId);
              xmlDocument.documentElement = createElementNS(xmlDocument, nodename, namespace);
              return xmlDocument;
            };
          }
        } catch(e) {}
    }

    throw new Error('Browser doesn\'t support for XML document!');

  }();


  /*
   *  element
   */

  function createElementNS(document, nodename, namespace){
    if (namespace)
      return isNativeSupport
               ? document.createElementNS(namespace, nodename)
               : document.createNode(1, nodename, namespace)
    else
      return document.createElement(nodename);
  };


  /*
   *  attribute
   */

  function createAttributeNS(document, nodename, namespace, value){
    var attr;
    if (namespace)
      attr = isNativeSupport
               ? document.createAttributeNS(namespace, nodename)
               : document.createNode(2, nodename, namespace)
    else
      attr = document.createAttribute(nodename);

    attr.nodeValue = value;
    return attr;
  }

  function setAttributeNodeNS(element, attr){
    return element.setAttributeNodeNS
             ? element.setAttributeNodeNS(attr)
             : element.setAttributeNode(attr);
  }

  /*function removeAttributeNodeNS(element, attr){
    return element.removeAttributeNodeNS
             ? element.removeAttributeNodeNS(attr)
             : element.removeAttributeNode(attr);
  }*/

  function addNamespace(element, prefix, namespace){
    setAttributeNodeNS(
      element,
      createAttributeNS(
        element.ownerDocument,
        XMLNS.PREFIX + (prefix ? ':' + prefix : ''),
        XMLNS.NAMESPACE,
        namespace
      )
    );
  }

  /*
   *  text
   */

  function createText(document, value){
    return document.createTextNode(String(value));
  }

  /*
   *  CDATA
   */

  function createCDATA(document, value){
    return document.createCDATASection(value);
  }

  //
  // XML -> Object
  //

 /**
  * Converting xml tree to javascript object representation.
  * @function
  * @param {Node} node
  * @param {object} mapping
  * @return {object}
  */ 
  function XML2Object(node, mapping){  // require for refactoring
    var nodeType = node.nodeType;
    var attributes = node.attributes;
    var firstChild = node.firstChild;

    if (!firstChild)
    {
      var firstAttr = attributes && attributes[0];
      if (nodeType == ELEMENT_NODE)
      {
        if (!firstAttr)
          return '';

        // test for <node xsi:nil="true"/>
        if (attributes.length == 1
            && (firstAttr.baseName || firstAttr.localName) == XSI_NIL_LOCALPART
            && firstAttr.namespaceURI == XSI_NAMESPACE)
          return null;
      }
      else
      {
        if (!firstAttr)
          return null;
      }
    }
    else
    {
      // single child node and not an element -> return child nodeValue
      if (firstChild.nodeType != ELEMENT_NODE && firstChild === node.lastChild)
        return firstChild.nodeValue;
    }

    var result = {};
    var nodes = [];
    var childNodesCount = 0;
    var value;
    var cursor;
    var object;
    var name;
    var isElement;
    var map;

    if (cursor = firstChild)
    {
      do
      {
        childNodesCount = nodes.push(cursor);
      }
      while (cursor = cursor.nextSibling);
    }

    if (attributes)
      for (var i = 0, attr; attr = attributes[i]; i++)
        nodes.push(attr);

    if (!mapping)
      mapping = {};

    for (var i = 0, child; child = nodes[i]; i++)
    {
      name = child.nodeName;
      isElement = i < childNodesCount;
      map = mapping[name];

      // fetch value
      if (isElement)
      {
        value = XML2Object(child, mapping);
      }
      else
      {
        if (name == 'xmlns')
          continue;

        value = child.nodeValue;
      }

      // mapping keys
      while (map)
      {
        if (map.storeName)
          value[map.storeName] = name;

        if (map.rename)
        {
          name = map.rename;
          map = mapping[name];
        }
        else
        {
          if (map.format)
            value = map.format(value);

          if (!result[name] && map.forceArray)
            value = [value];

          break;
        }
      }

      // store result
      if (name in result)
      {
        if ((object = result[name]) && object.push)
          object.push(value);
        else
          result[name] = [object, value];
      }
      else
        result[name] = value;
    }

    return result;
  }

  //
  // Object -> XML
  //

  function isPrimitiveObject(value){
    return typeof value == 'string'   || typeof value == 'number' || 
           typeof value == 'function' || typeof value == 'boolean' || 
           value.constructor === Date  || value.constructor === RegExp;
  }

 /**
  * @function
  * @param {Document} document
  * @param {string} nodeName
  * @param {string=} namespace
  * @param {object|string} content
  */
  function Object2XML(document, nodeName, namespace, content){
    if (String(nodeName).charAt(0) == '@')
    {
      return content == null
               ? content
               : createAttributeNS(document, nodeName.substr(1), /*namespace*/ '', String(content));
    }
    else
    {
      var result = createElementNS(
                     document,
                     nodeName.toString(),
                     (content && content.xmlns) || nodeName.namespace || namespace
                   );
      if (typeof content == 'undefined' || content === null)
      {
        setAttributeNodeNS(
          result,
          createAttributeNS(document,
            XSI_NIL_LOCALPART,
            XSI_NAMESPACE,
            'true'
          )
        );
      }
      else
      {
        if (isPrimitiveObject(content))
        {
          result.appendChild(createText(document, content));
        }
        else
        {
          var ns = content.xmlns || namespace;

          if (content.xmlns && XMLNS.BAD_SUPPORT)
            addNamespace(result, '', ns);

          for (var prop in content)
          {
            var value = content[prop];

            if (prop == 'xmlns' || typeof value == 'function')
              continue;

            if (value && Array.isArray(value))
            {
              for (var i = 0; i < value.length; i++)
                result.appendChild(Object2XML(document, prop, ns, value[i]));
            }
            else
            {
              if (value && typeof value == 'object' && value.toString !== Object.prototype.toString)
                value = value.toString();

              var node = Object2XML(document, prop, ns, value);
              if (node)
                if (node.nodeType == ATTRIBUTE_NODE)
                  setAttributeNodeNS(result, node);
                else
                  result.appendChild(node);
            }
          }
        }
      }
      return result;
    }
  };

  function getElementsByTagNameNS(element, name, namespace){
    if (element.getElementsByTagNameNS)
      return element.getElementsByTagNameNS(namespace, name);

    var result = new Array();
    element.ownerDocument.setProperty('SelectionNamespaces', 'xmlns:x="' + namespace + '"');
    var nodes = element.selectNodes('//x:' + name);

    for (var i = 0, node; node = nodes[i++];)
      if (node.namespaceURI == namespace)
        result.push(node);

    return result;
  }

  //
  // XML -> string
  //

  function XML2String(node){
    // modern browsers feature
    if (typeof XMLSerializer != 'undefined')
      return (new XMLSerializer()).serializeToString(node);

    // old IE feature
    if (typeof node.xml == 'string')
      return node.xml;

    // other browsers
    if (node.nodeType == DOM.DOCUMENT_NODE)
      node = node.documentElement;

    return DOM.outerHTML(node);
  }


  //
  // export names
  //

  this.extend({
    NAMESPACE: {
      XMLShema: XSD_NAMESPACE,
      XMLShemaInstance: XSI_NAMESPACE,
      Namespace: NS_NAMESPACE
    },
    XMLNS: XMLNS,
    QName: QName,
    //XMLElement: XMLElement,
    getElementsByTagNameNS: getElementsByTagNameNS,
    addNamespace: addNamespace,
    createDocument: createDocument,
    createElementNS: createElementNS,
    createAttributeNS: createAttributeNS,
    setAttributeNodeNS: setAttributeNodeNS,
    //removeAttributeNodeNS: removeAttributeNodeNS,
    createText: createText,
    createCDATA: createCDATA,
    XML2Object: XML2Object,
    XML2String: XML2String,
    Object2XML: Object2XML
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/xml.js").call(basis.namespace("basis.xml"), basis.namespace("basis.xml"), basis.namespace("basis.xml").exports, this, __curLocation + "src/basis/xml.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/crypt.js
//

new Function(__wrapArgs, function(){

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
  * @namespace basis.crypt
  */

  var namespace = this.path;


  //
  // Main part
  //

  function rotateLeft(number, offset){
    return (number << offset) | (number >>> (32 - offset));
  }

  var chars = Array.create(255, function(i){
    return String.fromCharCode(i);
  })

  // =======================================
  //  [ UTF16 Encode/Decode ]

  var UTF16 = (function(){
  
   /**
    * @namespace basis.crypt.UTF16
    */
    var namespace = 'basis.crypt.UTF16';

    // utf16 string -> utf16 bytes array
    function toBytes(input){  
      var output = new Array();
      var len = input.length;

      for (var i = 0; i < len; i++)
      {
        var c = input.charCodeAt(i);
        output.push(c & 0xFF, c >> 8);
      }

      return output;
    }

    // utf16 bytes array -> utf16 string
    function fromBytes(input){
      var output = '';
      var len = input.length;
      var b1, b2;
      var i = 0;

      while (i < len)
      {
        b1 = input[i++] || 0;
        b2 = input[i++] || 0;
        output += String.fromCharCode((b2 << 8) | b1);
      }
      return output;
    }

    // utf16 string -> utf8 string
    function toUTF8(input){
      var output = '';
      var len = input.length;

      for (var i = 0; i < len; i++)
      {
        var c = input.charCodeAt(i);

        if (c < 128)
          output += chars[c];
        else 
          if (c < 2048)
            output += chars[(c >> 6) | 192] +
                      chars[(c & 63) | 128];
          else 
            output += chars[(c >> 12) | 224] +
                      chars[((c >> 6) & 63) | 128] +
                      chars[(c & 63) | 128];
      }
      return output;
    }

    // utf16 string -> utf8 bytes array
    function toUTF8Bytes(input){
      return UTF8.toBytes(toUTF8(input));
    }

    // utf8 string -> utf16 string
    function fromUTF8(input){
      //return this.fromUTF8Bytes(UTF8.toBytes(input));

      var output = '';
      var len = input.length;
      var c1, c2, c3;
      var i = 0;

      while (i < len)
      {
        c1 = input.charCodeAt(i++);
        if (c1 < 128) 
          output += chars[c1];
        else
        {
          c2 = input.charCodeAt(i++);
          if (c1 & 32) 
          {
            c3 = input.charCodeAt(i++);
            output += String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          }
          else
            output += String.fromCharCode(((c1 & 31) << 6)  | (c2 & 63));
        }
      }
      return output;
    }

    // utf8 bytes array -> utf16 string
    function fromUTF8Bytes(input){
      return fromUTF8(UTF8.fromBytes(input));
    }

    return basis.namespace(namespace).extend({
      toBytes: toBytes,
      fromBytes: fromBytes,
      toUTF8: toUTF8,
      fromUTF8: fromUTF8,
      toUTF8Bytes: toUTF8Bytes,
      fromUTF8Bytes: fromUTF8Bytes
    });

  })();

  // =======================================
  //  [ UTF8 Encode/Decode ]

  var UTF8 = (function(){
  
    var namespace = 'basis.crypt.UTF8';

    // utf8 string
    function toBytes(input){
      var len = input.length;
      var output = new Array(len);

      for (var i = 0; i < len; i++)
        output[i] = input.charCodeAt(i);

      return output;
    }

    // utf8 bytes array
    function fromBytes(input){
      var len = input.length;
      var output = '';

      for (var i = 0; i < len; i++)
        output += chars[input[i]];

      return output;    
    }

    // utf8 string -> utf16 string
    function toUTF16(input){
      return UTF16.fromUTF8(input);
    }

    // utf8 string  -> utf16 bytes array
    function toUTF16Bytes(input){
      return UTF16.toBytes(UTF16.fromUTF8(input));
    }
    
    // utf16 string -> utf8 string
    function fromUTF16(input){
      return UTF16.toUTF8(input);
    }

    // utf16 bytes array -> utf8 string
    function fromUTF16Bytes(input){
      return UTF16.toUTF8(UTF16.fromBytes(input));
    }

    return basis.namespace(namespace).extend({
      toBytes: toBytes,
      fromBytes: fromBytes,
      toUTF16: toUTF16,
      fromUTF16: fromUTF16,
      toUTF16Bytes: toUTF16Bytes,
      fromUTF16Bytes: fromUTF16Bytes
    });
  })();

  // =====================================================
  //   BASE64

  var Base64 = (function(){

   /**
    * @namespace basis.crypt.Base64
    */
    var namespace = 'basis.crypt.Base64';

    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".toArray();
    var charIndex = {};
    
    chars.forEach(function(item, index){ charIndex[item] = index });

    function encode(input, useUTF8){
      // convert to bytes array if necessary
      if (input.constructor != Array)
        if (useUTF8)
          input = UTF16.toUTF8Bytes(input);
        else
          input = UTF16.toBytes(input);
       
      // encode
      var len = input.length;
      var i = 0;
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;

      while (i < len)
      {
        chr1 = input[i++];
        chr2 = input[i++];
        chr3 = input[i++];
       
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (chr2 == undefined)
        	enc3 = enc4 = 64;
        else if (chr3 == undefined)
        	enc4 = 64;

        output += chars[enc1] + chars[enc2] + chars[enc3] + chars[enc4];
      }
       
      return output;
    } 
    
    function decode(input, useUTF8){
      input = input.replace(/[^a-z0-9\+\/]/ig, '');

      var output = new Array();
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      var len = input.length;
      
      // decode 
      while (i < len)
      {
        enc1 = charIndex[input.charAt(i++)];
        enc2 = charIndex[input.charAt(i++)];
        enc3 = charIndex[input.charAt(i++)];
        enc4 = charIndex[input.charAt(i++)];
       
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
       
        output.push(chr1, chr2, chr3);
      }

      if (enc3 == null || enc3 == 64) output.pop();
      if (enc4 == null || enc4 == 64) output.pop();

      // convert to UTF8 if necessary
      if (useUTF8)
        return UTF16.fromUTF8Bytes(output);
      else
        return UTF16.fromBytes(output);
    }

    //
    // export names
    //

    return basis.namespace(namespace).extend({
      encode: encode,
      decode: decode
    });

  })();

 /**
  * @namespace basis.crypt
  */

  // =======================================
  //  [ HEX Encode/Decode ]

  function number2hex(number){
    var result = new Array();

    do
    {
      result.push((number & 0x0F).toString(16));
      number >>= 4;
    }
    while (number);

    if (result.length & 1)
      result.push('0');

    return result.reverse().join('');
  };

  function HEX(input){
    if (typeof input == 'number')
      return number2hex(input);

    var output = new Array();
    if (Array.isArray(input))
      output = input.map(HEX);
    else
      output = String(input).toArray().map(function(c){ return number2hex(c.charCodeAt(0)); });

    return output.join('');
  };

  // ==========================================
  //  SHA1

  var SHA1 = (function(){

    var K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6];
    var F = [
      function(x, y, z){ return z ^ (x & (y ^ z)) },
      function(x, y, z){ return x ^ y ^ z },
      function(x, y, z){ return (x & y) | (z & (x | y)) },
      function(x, y, z){ return y ^ x ^ z }
    ];

    function vector(val){
      var result = new Array();
      for (var i = 3; i >= 0; i--)
        result.push((val >> i * 8) & 0xFF);
      return result;
    };

    //
    // SHA1 main function
    //

    return function(message, useUTF8){
      // convert to bytes array if necessary
      if (message.constructor != Array)
        if (useUTF8)
          message = UTF16.toUTF8Bytes(message);
        else
          message = UTF16.toBytes(message);

      // convert message to dword array
      var len = message.length;
      var dwords = new Array();

      for (var i = 0; i < len; i++)
        dwords[i >> 2] |= message[i] << ((3 - (i & 3)) << 3);

      if (len & 3)
        dwords[len >> 2] |= Math.pow(2, ((4 - (len & 3)) << 3) - 1);
      else
        dwords[len >> 2] = 0x80000000;

      // padding 0
      dwords.push.apply(dwords, Array.create(((dwords.length & 0x0F) > 14 ? 30 : 14) - (dwords.length & 0x0F), 0));

      // add length
      dwords.push(len >>> 29);
      dwords.push((len << 3) & 0x0FFFFFFFF);

      // reverse
      dwords.reverse();

      // init arguments h0, h1, h2, h3, h4
      var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
      var stored = Array.from(H);

      // make a hash
      var S;
      var chunk = dwords.length >> 4;
      var W = new Array(80);

      while (chunk--) 
      {
        for(var i = 0; i < 16; i++) 
          W[i] = dwords.pop();
        for(var i = 16; i < 80; i++) 
          W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        for (var i = 0; i < 80; i++) 
        {
          S = Math.floor(i/20);
          H[4] = (rotateLeft(H[0], 5) + F[S](H[1], H[2], H[3]) + H[4] + W[i] + K[S]) & 0x0FFFFFFFF;
          H[1] = rotateLeft(H[1], 30);
          H.unshift(H.pop());
        }

        for (var i = 0; i < 5; i++)
          H[i] = stored[i] = (H[i] + stored[i]) & 0x0FFFFFFFF;
      }

      // return sha1 hash bytes array
      return H.map(vector).flatten();
    }
  })();

  // ==========================================
  //  MD5

  var MD5 = (function(){

    var C_2_POW_32 = Math.pow(2, 32);
    var S;
    var K = new Array();
    var I = new Array();
    var F = [
      function(x, y, z){ return z ^ (x & (y ^ z)) },
      function(x, y, z){ return y ^ (z & (y ^ x)) },
      function(x, y, z){ return (x ^ y ^ z) },
      function(x, y, z){ return (y ^ (x | ~z)) }
    ];

    function initConst(){
      S = [[7,12,17,22].repeat(4), [5,9,14,20].repeat(4), [4,11,16,23].repeat(4), [6,10,15,21].repeat(4)].flatten();

      for (var i = 0; i < 64; i++)
      {
        K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * C_2_POW_32);
        switch (i >> 4)
        {
          case 0: I[i] = i; break;
          case 1: I[i] = (i * 5 + 1) & 0x0F; break;
          case 2: I[i] = (i * 3 + 5) & 0x0F; break;
          case 3: I[i] = (i * 7) & 0x0F; break;
        }
      }
    };

    function add(word){  // safe add
      var args = arguments;
      var count = args.length;
      var lw = word & 0xFFFF;
      var hw = word >> 16;
      for (var i = 1; i < count; i++)
      {
        var b = args[i];
        lw += (b & 0xFFFF);
        hw += (b >> 16) + (lw >> 16);
        lw &= 0xFFFF;
      }  
      return (hw << 16) | (lw & 0xFFFF);

    };

    function vector(val){
      var result = new Array();
      for (var i = 0; i < 4; i++)
        result.push((val >> i * 8) & 0xFF);
      return result;
    };

    //
    // MD5 main function
    //

    return function(message, useUTF8){
      // one time const init
      if (!S)
        initConst();

      // convert to bytes array if necessary
      if (message.constructor != Array)
        if (useUTF8)
          message = UTF16.toUTF8Bytes(message);
        else
          message = UTF16.toBytes(message);

      // convert message to dword array
      var dwords = new Array();
      var len = message.length;

      for (var i = 0; i < len; i++)
        dwords[i >> 2] |= message[i] << ((i & 3) << 3);

      dwords[len >> 2] |= 0x80 << ((len & 3) << 3);

      // padding 0
      dwords.push.apply(dwords, Array(((dwords.length & 0x0F) > 14 ? 30 : 14) - (dwords.length & 0x0F)));
      // add length
      dwords.push((len << 3) & 0x0FFFFFFFF);
      dwords.push(len >>> 29);
      
      // init arguments a, b, c, d
      var A = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
      var stored = Array.from(A);

      // make a hash
      var chunk = dwords.length >> 4;
      while (chunk--)
      {
        for (var i = 0; i < 64; i++)
        {
          A[0] = add(rotateLeft(add(A[0], F[i >> 4](A[1], A[2], A[3]), dwords[I[i]], K[i]), S[i]), A[1]);
          A.unshift(A.pop());
        }

        for (var i = 0; i < 4; i++)
          A[i] = stored[i] = add(A[i], stored[i]);
      }

      // return md5 hash bytes array
      return A.map(vector).flatten();
    };
  })();


  //
  // wrap function
  //

  var cryptTarget = '';

  var cryptMethods = {
    sha1: function(useUTF8){ return SHA1(this, useUTF8); },
    sha1hex: function(useUTF8){ return HEX(SHA1(this, useUTF8)); },
    md5: function(useUTF8){ return MD5(this, useUTF8); },
    md5hex: function(useUTF8){ return HEX(MD5(this, useUTF8)); },
    base64: function(useUTF8){ return Base64.encode(this, useUTF8); },
    base64decode: function(useUTF8){ return Base64.encode(this, useUTF8); },
    hex: function(){ return HEX(this) }
  };

  var context_ = {};
  Object.iterate(cryptMethods, function(name, value){
    context_[name] = function(useUTF8){
      var result = value.call(cryptTarget, useUTF8);
      return cryptTarget = Object.extend(typeof result != 'object' ? Object(result) : result, context_);
    }
  });

  this.setWrapper(function(target){
    cryptTarget = target || '';
    return context_;
  });

  //
  // export names
  //

  this.extend({
    HEX: HEX,
    SHA1: SHA1,
    MD5: MD5
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/crypt.js").call(basis.namespace("basis.crypt"), basis.namespace("basis.crypt"), basis.namespace("basis.crypt").exports, this, __curLocation + "src/basis/crypt.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/data/dataset.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.data');


 /**
  * Namespace overview:
  * - Classes:
  *   {basis.data.dataset.Merge}, {basis.data.dataset.Subtract},
  *   {basis.data.dataset.MapReduce}, {basis.data.dataset.Subset},
  *   {basis.data.dataset.Split}, {basis.data.dataset.Slice}
  *   {basis.data.dataset.Cloud}
  *
  * @see ./demo/defile/dataset.html
  *
  * @namespace basis.data.dataset
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var oneFunctionProperty = Class.oneFunctionProperty;

  var extend = Object.extend;
  var values = Object.values;
  var $self = Function.$self;
  var $true = Function.$true;
  var $false = Function.$false;
  var createEvent = basis.event.create;

  var SUBSCRIPTION = basis.data.SUBSCRIPTION;
  var DataObject = basis.data.DataObject;
  var KeyObjectMap = basis.data.KeyObjectMap;
  var AbstractDataset = basis.data.AbstractDataset;
  var Dataset = basis.data.Dataset;


  //
  // New subscription types
  //

  SUBSCRIPTION.add(
    'SOURCE',
    {
      sourceChanged: function(object, oldSource){
        this.remove(object, oldSource);
        this.add(object, object.source);
      },
      sourcesChanged: function(object, delta){
        var array;

        if (array = delta.inserted)
          for (var i = array.length; i --> 0;)
            this.add(object, array[i]);

        if (array = delta.deleted)
          for (var i = array.length; i --> 0;)
            this.remove(object, array[i]);
      }
    },
    function(action, object){
      var sources = object.sources || [object.source];

      for (var i = 0, source; source = sources[i++];)
        action(object, source);
    }
  );

  SUBSCRIPTION.add(
    'MINUEND',
    {
      operandsChanged: function(object, oldMinuend, oldSubtrahend){
        if (this.minuend !== oldMinuend)
        {
          this.remove(object, oldMinuend);
          this.add(object, object.minuend);
        }
      }
    },
    function(action, object){
      action(object, object.minuend);
    }
  );

  SUBSCRIPTION.add(
    'SUBTRAHEND',
    {
      operandsChanged: function(object, oldMinuend, oldSubtrahend){
        if (this.subtrahend !== oldSubtrahend)
        {
          this.remove(object, oldSubtrahend);
          this.add(object, object.subtrahend);
        }
      }
    },
    function(action, object){
      action(object, object.subtrahend);
    }
  );

  
 /**
  * @func
  * Returns delta object
  */
  function getDelta(inserted, deleted){
    var delta = {};
    var result;

    if (inserted && inserted.length)
      result = delta.inserted = inserted;

    if (deleted && deleted.length)
      result = delta.deleted = deleted;

    if (result)
      return delta;
  }

  //
  // Merge dataset 
  //

  var MERGE_DATASET_HANDLER = {
    datasetChanged: function(source, delta){
      var memberMap = this.memberMap_;
      var updated = {};
      var deleted = [];

      var object;
      var objectId;

      if (delta.inserted)
      {
        for (var i = 0; object = delta.inserted[i]; i++)
        {
          objectId = object.eventObjectId;
        
          // check: is this object already known
          if (memberMap[objectId])
          {
            // item exists -> increase source links count
            memberMap[objectId].count++;
          }
          else
          {
            // registrate in source map
            memberMap[objectId] = {
              count: 1,
              object: object
            };
          }

          // mark as updated
          updated[objectId] = memberMap[objectId];
        }
      }

      if (delta.deleted)
      {
        for (var i = 0; object = delta.deleted[i]; i++)
        {
          objectId = object.eventObjectId;

          // mark as updated
          updated[objectId] = memberMap[objectId];

          // descrease source counter
          memberMap[objectId].count--;
        }
      }

      // build delta and fire event
      this.applyRule(updated);
    },
    destroy: function(source){
      this.removeSource(source);
    }
  };


 /**
  * @class
  */
  var Merge = Class(AbstractDataset, {
    className: namespace + '.Merge',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.SOURCE,

   /**
    * Fires when source set changed.
    * @param {basis.data.AbstractDataset} dataset
    * @param {object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new sources
    * and `deleted` property is array of removed sources.
    * @event
    */
    event_sourcesChanged: createEvent('sourcesChanged', 'dataset', 'delta'),

   /**
    * @type {Array.<basis.data.AbstractDataset>}
    */
    sources: null,

   /**
    * @type {function(count, sourceCount):boolean}
    */
    rule: function(count, sourceCount){
      return count > 0;
    },

   /**
    * @inheritDoc
    */
    listen: {
      source: MERGE_DATASET_HANDLER
    },

   /**
    * @config {Array.<basis.data.AbstractDataset>} sources Set of source datasets for aggregate.
    * @constructor
    */
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      // init part
      var sources = this.sources;
      this.sources = [];
      if (sources)
        sources.forEach(this.addSource, this);
    },

   /**
    * Set new merge rule for dataset. Some types are available in basis.data.Dataset.Merge
    * @param {function(count, sourceCount):boolean} rule New rule.
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = Merge.UNION;

      if (this.rule !== rule)
      {
        this.rule = rule;
        this.applyRule();
      }
    },

   /**
    * Check all members are they match to rule or not.
    * @param {Object=} scope Key map that will be checked. If not passed than all members
    * will be checked.
    * @return {Object} Delta of member changes.
    */
    applyRule: function(scope){
      var memberMap = this.memberMap_;
      var rule = this.rule;
      var sourceCount = this.sources.length;
      var inserted = [];
      var deleted = [];
      var memberCounter;
      var isMember;
      var delta;

      if (!scope)
        scope = memberMap;

      for (var objectId in scope)
      {
        memberCounter = memberMap[objectId];
        isMember = sourceCount && memberCounter.count && rule(memberCounter.count, sourceCount);

        if (isMember != !!this.item_[objectId])
          (isMember
            ? inserted // not in items -> insert
            : deleted  // already in items -> delete
          ).push(memberCounter.object); 

        if (memberCounter.count == 0)
          delete memberMap[objectId];
      }

      // fire event if delta found
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);

      return delta;
    },

   /**
    * Add source from sources list.
    * @param {basis.data.AbstractDataset} source
    * @return {boolean} Returns true if new source added.
    */
    addSource: function(source){
      if (source instanceof AbstractDataset)
      {
        if (this.sources.add(source))
        {
          // add event listeners to source
          if (this.listen.source)
            source.addHandler(this.listen.source, this);

          // process new source objects and update member map
          var memberMap = this.memberMap_;
          for (var objectId in source.item_)
          {
            // check: is this object already known
            if (memberMap[objectId])
            {
              // item exists -> increase source links count
              memberMap[objectId].count++;
            }
            else
            {
              // add to source map
              memberMap[objectId] = {
                count: 1,
                object: source.item_[objectId]
              };
            }
          }

          // build delta and fire event
          this.applyRule();

          // fire sources changes event
          this.event_sourcesChanged(this, {
            inserted: [source]
          });

          return true;
        }
      }
      else
      {
        ;;;if(typeof console != 'undefined') console.warn(this.className + '.addSource: source isn\'t instance of AbstractDataset');
      }
    },

   /**
    * Removes source from sources list.
    * @param {basis.data.AbstractDataset} source
    * @return {boolean} Returns true if source removed.
    */
    removeSource: function(source){
      if (this.sources.remove(source))
      {
        // remove event listeners from source
        if (this.listen.source)
          source.removeHandler(this.listen.source, this);

        // process removing source objects and update member map
        var memberMap = this.memberMap_;
        for (var objectId in source.item_)
          memberMap[objectId].count--;

        // build delta and fire event
        this.applyRule();

        // fire sources changes event
        this.event_sourcesChanged(this, {
          deleted: [source]
        });

        return true;
      }
      else
      {
        ;;;if(typeof console != 'undefined') console.warn(this.className + '.removeSource: source isn\'t in dataset source list');
      }
    },

   /**
    * Synchonize sources list according new list.
    * TODO: optimize, reduce event_sourcesChanged and event_datasetChanged count
    * TODO: returns delta of source list changes
    * @param {Array.<basis.data.AbstractDataset>} sources
    */
    setSources: function(sources){
      var exists = Array.from(this.sources); // clone list

      for (var i = 0, source; source = sources[i]; i++)
      {
        if (source instanceof AbstractDataset)
        {
          if (!exists.remove(source))
            this.addSource(source);
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.setSources: source isn\'t type of AbstractDataset', source);
        }
      }

      exists.forEach(this.removeSource, this);
    },

   /**
    * Remove all sources. All members are removing as side effect.
    * TODO: optimize, reduce event_sourcesChanged and event_datasetChanged count
    */
    clear: function(){
      Array.from(this.sources).forEach(this.removeSource, this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sources = null;
    }
  });

 /**
  * ANY source INCLUDE item
  * (by default)
  */
  Merge.UNION = Merge.prototype.rule;

 /**
  * ALL sources must INCLUDE item
  */
  Merge.INTERSECTION = function(count, sourceCount){
    return count == sourceCount;
  };

 /**
  * ONLY ONE source INCLUDE item
  */
  Merge.DIFFERENCE = function(count, sourceCount){
    return count == 1;
  };

 /**
  * MORE THAT ONE source INCLUDE item
  * make sence for more than one source (if one source - no filter)
  * for 2 sources it equal INTERSECTION
  * for 3 and more sources it equivalent UNION / DIFFERENCE (subtract)
  */
  Merge.MORE_THAN_ONE_INCLUDE = function(count, sourceCount){
    return sourceCount == 1 || count > 1;
  };

 /**
  * AT LEAST ONE source EXCLUDE item
  * make sence for more than one source (if one source - no filter)
  * for 2 sources it equal DIFFERENCE
  * for 3 and more sources it equivalent UNION / INTERSECTION (subtract)
  */
  Merge.AT_LEAST_ONE_EXCLUDE = function(count, sourceCount){
    return sourceCount == 1 || count < sourceCount;
  };


  //
  // Subtract
  //

  var datasetAbsentFilter = function(item){
    return !this.has(item);
  };

  var SUBTRACTDATASET_MINUEND_HANDLER = {
    datasetChanged: function(dataset, delta){
      if (!this.subtrahend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.inserted && delta.inserted.filter(datasetAbsentFilter, this.subtrahend),
        /* deleted */  delta.deleted  && delta.deleted.filter(this.has, this)
      );
      
      if (newDelta)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      this.setOperands(null, this.subtrahend);
    }
  };

  var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
    datasetChanged: function(dataset, delta){
      if (!this.minuend)
        return;

      var newDelta = getDelta(
        /* inserted */ delta.deleted  && delta.deleted.filter(datasetAbsentFilter, this),
        /* deleted */  delta.inserted && delta.inserted.filter(this.has, this)
      );

      if (newDelta)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      this.setOperands(this.minuend, null);
    }
  };


 /**
  * @class
  */
  var Subtract = Class(AbstractDataset, {
    className: namespace + '.Subtract',

   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.MINUEND + SUBSCRIPTION.SUBTRAHEND,

   /**
    * @type {basis.data.AbstractDataset}
    */ 
    minuend: null,

   /**
    * @type {basis.data.AbstractDataset}
    */
    subtrahend: null,

   /**
    * Fires when minuend or substrahend changed.
    * @param {basis.data.DataObject} object Object which state was changed.
    * @param {object} oldState Object state before changes.
    * @event
    */
    event_operandsChanged: createEvent('operandsChanged', 'dataset', 'oldMinuend', 'oldSubtrahend'),

   /**
    * @inheritDoc
    */
    listen: {
      minuend: SUBTRACTDATASET_MINUEND_HANDLER,
      subtrahend: SUBTRACTDATASET_SUBTRAHEND_HANDLER
    },

   /**
    * @constructor
    */
    init: function(config){
      // inherit
      AbstractDataset.prototype.init.call(this, config);

      // init part
      var minuend = this.minuend;
      var subtrahend = this.subtrahend;

      this.minuend = null;
      this.subtrahend = null;

      if (minuend || subtrahend)
        this.setOperands(minuend, subtrahend);
    },

   /**
    * Set new minuend & subtrahend.
    * @param {basis.data.AbstractDataset} minuend
    * @param {basis.data.AbstractDataset} subtrahend
    * @return {Object} Delta if changes happend
    */
    setOperands: function(minuend, subtrahend){
      var delta;
      var operandsChanged = false;

      if (minuend instanceof AbstractDataset == false)
        minuend = null;

      if (subtrahend instanceof AbstractDataset == false)
        subtrahend = null;

      var oldMinuend = this.minuend;
      var oldSubtrahend = this.subtrahend;

      // set new minuend if changed
      if (oldMinuend !== minuend)
      {
        operandsChanged = true;
        this.minuend = minuend;

        var listenHandler = this.listen.minuend;
        if (listenHandler)
        {
          if (oldMinuend)
            oldMinuend.removeHandler(listenHandler, this);

          if (minuend)
            minuend.addHandler(listenHandler, this)
        }
      }

      // set new subtrahend if changed
      if (oldSubtrahend !== subtrahend)
      {
        operandsChanged = true;
        this.subtrahend = subtrahend;

        var listenHandler = this.listen.subtrahend;
        if (listenHandler)
        {
          if (oldSubtrahend)
            oldSubtrahend.removeHandler(listenHandler, this);

          if (subtrahend)
            subtrahend.addHandler(listenHandler, this);
        }
      }

      if (!operandsChanged)
        return false;

      // emit event
      this.event_operandsChanged(this, oldMinuend, oldSubtrahend);

      // apply changes
      if (!minuend || !subtrahend)
      {
        if (this.itemCount)
          this.event_datasetChanged(this, delta = {
            deleted: this.getItems()
          });
      }
      else
      {
        var deleted = [];
        var inserted = [];

        for (var key in this.item_)
          if (!minuend.item_[key] || subtrahend.item_[key])
            deleted.push(this.item_[key]);

        for (var key in minuend.item_)
          if (!this.item_[key] && !subtrahend.item_[key])
            inserted.push(minuend.item_[key]);

        if (delta = getDelta(inserted, deleted))
          this.event_datasetChanged(this, delta);
      }

      return delta;
    },

   /**
    * @param {basis.data.AbstractDataset} minuend
    * @return {Object} Delta if changes happend
    */
    setMinuend: function(minuend){
      return this.setOperands(minuend, this.subtrahend);
    },

   /**
    * @param {basis.data.AbstractDataset} subtrahend
    * @return {Object} Delta if changes happend
    */
    setSubtrahend: function(subtrahend){
      return this.setOperands(this.minuend, subtrahend);
    },

   /**
    * @inheritDoc
    */
    clear: function(){
      this.setOperands();
    }
  });


  //
  // Source dataset mixin
  //

  var SourceDatasetMixin = {
   /**
    * @inheritDoc
    */
    subscribeTo: SUBSCRIPTION.SOURCE,

   /**
    * Data source.
    * @type {basis.data.AbstractDataset}
    */
    source: null,

   /**
    * Map of source objects.
    * @type {object}
    * @private
    */
    sourceMap_: null,

   /**
    * Fires when source property changed.
    * @param {basis.data.AbstractDataset} dataset Event initiator.
    * @param {basis.data.AbstractDataset} oldSource Previous value for source property.
    * @event
    */
    event_sourceChanged: createEvent('sourceChanged', 'dataset', 'oldSource'),

   /**
    * @inheritDoc
    */
    listen: {
      source: {
        destroy: function(){
          this.setSource();
        }
      }
    },

   /**
    * @constructor
    */
    init: function(config){
      this.sourceMap_ = {};

      var source = this.source;
      if (source)
        this.source = null;     // NOTE: reset source before inherit -> prevent double subscription activation
                                // when this.active == true and source is assigned

      AbstractDataset.prototype.init.call(this, config);

      if (source)
        this.setSource(source);
    },

   /**
    * Set new source dataset.
    * @param {basis.data.AbstractDataset} dataset
    */
    setSource: function(source){
      if (source instanceof AbstractDataset == false)
        source = null;

      if (this.source !== source)
      {
        var oldSource = this.source;
        var listenHandler = this.listen.source;

        this.source = source;

        if (listenHandler)
        {
          var datasetChangedHandler = listenHandler.datasetChanged;
          if (oldSource)
          {
            oldSource.removeHandler(listenHandler, this);

            if (datasetChangedHandler)
              datasetChangedHandler.call(this, oldSource, {
                deleted: oldSource.getItems()
              });
          }

          if (source)
          {
            source.addHandler(listenHandler, this);

            if (datasetChangedHandler)
              datasetChangedHandler.call(this, source, {
                inserted: source.getItems()
              });
          }
        }

        this.event_sourceChanged(this, oldSource);
      }
    },

   /**
    * Drop dataset. All members are removing as side effect.
    */
    clear: function(){
      this.setSource();
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sourceMap_ = null;
    }
  };


  //
  // MapReduce
  //

  var MAPREDUCE_SOURCEOBJECT_UPDATE = function(sourceObject){
    var newMember = this.map ? this.map(sourceObject) : object; // fetch new member ref
    
    if (newMember instanceof DataObject == false || this.reduce(newMember))
      newMember = null;

    var sourceMap = this.sourceMap_[sourceObject.eventObjectId];
    var curMember = sourceMap.member;

    // if member ref is changed
    if (curMember !== newMember)
    {
      var memberMap = this.memberMap_;
      var delta;
      var inserted;
      var deleted;

      // update member
      sourceMap.member = newMember;

      // if here is ref for member already
      if (curMember)
      {
        var curMemberId = curMember.eventObjectId;

        // call callback on member ref add
        if (this.removeMemberRef)
          this.removeMemberRef(curMember, sourceObject);

        // decrease ref count, and check is this ref for member last
        if (--memberMap[curMemberId] == 0)
        {
          // last ref for member

          // delete from map
          delete memberMap[curMemberId];

          // add to delta
          deleted = [curMember];
        }
      }

      // if new member exists, update map
      if (newMember)
      {
        var newMemberId = newMember.eventObjectId;

        // call callback on member ref add
        if (this.addMemberRef)
          this.addMemberRef(newMember, sourceObject);

        if (memberMap[newMemberId])
        {
          // member is already in map -> increase ref count
          memberMap[newMemberId]++;
        }
        else
        {
          // add to map
          memberMap[newMemberId] = 1;

          // add to delta
          inserted = [newMember];
        }
      }

      // fire event, if any delta
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    }
  };

  var MAPREDUCE_SOURCE_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var inserted = [];
      var deleted = [];
      var sourceObject;
      var sourceObjectId;
      var member;
      var updateHandler = this.ruleEvents;

      Dataset.setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          member = this.map ? this.map(sourceObject) : sourceObject;

          if (member instanceof DataObject == false || this.reduce(member))
            member = null;

          if (updateHandler)
            sourceObject.addHandler(updateHandler, this);

          sourceMap[sourceObject.eventObjectId] = {
            sourceObject: sourceObject,
            member: member
          };

          if (member)
          {
            var memberId = member.eventObjectId;
            if (memberMap[memberId])
            {
              memberMap[memberId]++;
            }
            else
            {
              memberMap[memberId] = 1;
              inserted.push(member);
            }

            if (this.addMemberRef)
              this.addMemberRef(member, sourceObject);
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0; sourceObject = delta.deleted[i]; i++)
        {
          sourceObjectId = sourceObject.eventObjectId;
          member = sourceMap[sourceObjectId].member;

          if (updateHandler)
            sourceObject.removeHandler(updateHandler, this);

          delete sourceMap[sourceObjectId];

          if (member)
          {
            var memberId = member.eventObjectId;
            if (--memberMap[memberId] == 0)
            {
              delete memberMap[memberId];
              deleted.push(member);
            }

            if (this.removeMemberRef)
              this.removeMemberRef(member, sourceObject);
          }
        }
      }

      Dataset.setAccumulateState(false);

      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    }
  };

 /**
  * @class
  */
  var MapReduce = Class(AbstractDataset, SourceDatasetMixin, {
    className: namespace + '.MapReduce',

   /**
    * Map function for source object, to get member object.
    * @type {function(basis.data.DataObject):basis.data.DataObject}
    * @readonly
    */
    map: $self,

   /**
    * Filter function. It should return false, than result of map function
    * become a member.
    * @type {function(basis.data.DataObject):boolean}
    * @readonly
    */
    reduce: $false,

   /**
    * Helper function.
    */
    rule: Function.getter($true),

   /**
    * Events list when dataset should recompute rule for source item.
    */
    ruleEvents: oneFunctionProperty(
      MAPREDUCE_SOURCEOBJECT_UPDATE,
      {
        update: true
      }
    ),

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.DataObject, basis.data.DataObject)}
    * @readonly
    */
    addMemberRef: null,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.DataObject, basis.data.DataObject)}
    * @readonly
    */
    removeMemberRef: null,

   /**
    * @inheritDoc
    */
    listen: {
      source: MAPREDUCE_SOURCE_HANDLER
    },

    // no special init

   /**
    * Set new transform function and apply new function to source objects.
    * @param {function(basis.data.DataObject):basis.data.DataObject} map
    */
    setMap: function(map){
      if (typeof map != 'function')
        map = $self;

      if (this.map !== map)
      {
        this.map = map;
        return this.applyRule();
      }
    },

   /**
    * Set new filter function and apply new function to source objects.
    * @param {function(basis.data.DataObject):boolean} reduce
    */
    setReduce: function(reduce){
      if (typeof reduce != 'function')
        reduce = $false;

      if (this.reduce !== reduce)
      {
        this.reduce = reduce;
        return this.applyRule();
      }
    },

   /**
    * Set new filter function.
    * @param {function(basis.data.DataObject):boolean} filter
    * @return {Object} Delta of member changes.
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = $true;

      if (this.rule !== rule)
      {
        this.rule = rule;
        return this.applyRule();
      }
    },

   /**
    * Apply transform for all source objects and rebuild member set.
    * @return {Object} Delta of member changes.
    */
    applyRule: function(){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var curMember;
      var newMember;
      var curMemberId;
      var newMemberId;
      var sourceObject;
      var sourceObjectInfo;
      var inserted = [];
      var deleted = [];
      var delta;

      for (var sourceObjectId in sourceMap)
      {
        sourceObjectInfo = sourceMap[sourceObjectId];
        sourceObject = sourceObjectInfo.sourceObject;

        curMember = sourceObjectInfo.member;
        newMember = this.map ? this.map(sourceObject) : sourceObject;

        if (newMember instanceof DataObject == false || this.reduce(newMember))
          newMember = null;

        if (curMember != newMember)
        {
          sourceObjectInfo.member = newMember;

          // if here is ref for member already
          if (curMember)
          {
            curMemberId = curMember.eventObjectId;

            // call callback on member ref add
            if (this.removeMemberRef)
              this.removeMemberRef(curMember, sourceObject);

            // decrease ref count
            memberMap[curMemberId]--;
          }

          // if new member exists, update map
          if (newMember)
          {
            newMemberId = newMember.eventObjectId;

            // call callback on member ref add
            if (this.addMemberRef)
              this.addMemberRef(newMember, sourceObject);

            if (newMemberId in memberMap)
            {
              // member is already in map -> increase ref count
              memberMap[newMemberId]++;
            }
            else
            {
              // add to map
              memberMap[newMemberId] = 1;

              // add to delta
              inserted.push(newMember);
            }
          }
        }
      }

      // get deleted delta
      for (var curMemberId in this.item_)
        if (memberMap[curMemberId] == 0)
        {
          delete memberMap[curMemberId];
          deleted.push(this.item_[curMemberId]);
        }

      // if any changes, fire event
      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);

      return delta;
    }
  });


  //
  // Subset
  //

 /**
  * @class
  */
  var Subset = Class(MapReduce, {
    className: namespace + '.Subset',

   /**
    * @inheritDoc
    */
    reduce: function(object){
      return !this.rule(object);
    }
  });


  //
  // Split
  //

 /**
  * @class
  */
  var Split = Class(MapReduce, {
    className: namespace + '.Split',

   /**
    * @type {basis.data.AbstractDataset}
    */
    subsetClass: AbstractDataset,

   /**
    * @type {basis.data.KeyObjectMap}
    */
    keyMap: null,

   /**
    * @inheritDoc
    */
    map: function(sourceObject){
      return this.keyMap.resolve(sourceObject);
    },

    /**
    * @inheritDoc
    */
    setRule: function(rule){
      if (typeof rule != 'function')
        rule = $true;

      if (this.rule !== rule)
      {
        this.rule = rule;
        this.keyMap.keyGetter = rule;
        return this.applyRule();
      }
    },

   /**
    * @inheritDoc
    */
    addMemberRef: function(subset, sourceObject){
      subset.event_datasetChanged(subset, { inserted: [sourceObject] });
    },

   /**
    * @inheritDoc
    */
    removeMemberRef: function(subset, sourceObject){
      subset.event_datasetChanged(subset, { deleted: [sourceObject] });
    },

   /**
    * @constructor
    */ 
    init: function(config){
      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(extend({
          keyGetter: this.rule,
          itemClass: this.subsetClass
        }, this.keyMap));

      // inherit
      MapReduce.prototype.init.call(this, config);
    },

   /**
    * Fetch subset dataset by some data.
    * @param {basis.data.DataObject|Object} data
    * @param {boolean} autocreate
    * @return {basis.data.DataObject}
    */
    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      MapReduce.prototype.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });


  //
  // Slice
  //

  function binarySearchPos(array, map){ 
    if (!array.length)  // empty array check
      return 0;

    var pos;
    var id = map.object.eventObjectId;
    var value = map.value || 0;
    var cmpValue;
    var cmpId;
    var item;
    var l = 0;
    var r = array.length - 1;

    do 
    {
      pos = (l + r) >> 1;

      item = array[pos];
      cmpValue = item.value;

      if (cmpValue === value)
      {
        cmpId = item.object.eventObjectId;
        if (id < cmpId)
          r = pos - 1;
        else 
          if (id > cmpId)
            l = pos + 1;
          else
            return id == cmpId ? pos : 0;  
      }
      else
      {
        if (value < cmpValue)
          r = pos - 1;
        else 
          if (value > cmpValue)
            l = pos + 1;
          else
            return value == cmpValue ? pos : 0;  
      }
    }
    while (l <= r);

    return pos + (cmpValue < value);
  }

  var SLICE_SOURCEOBJECT_UPDATE = function(sourceObject){
    var sourceObjectInfo = this.sourceMap_[sourceObject.eventObjectId];
    var newValue = this.rule(sourceObject);
    var index_ = this.index_;

    if (newValue !== sourceObjectInfo.value)
    {
      index_.splice(binarySearchPos(index_, sourceObjectInfo), 1);
      sourceObjectInfo.value = newValue;
      index_.splice(binarySearchPos(index_, sourceObjectInfo), 0, sourceObjectInfo);
      this.applyRule();
    }
  };

  function sliceIndexSort(a, b){
    return +(a.value > b.value)
        || -(a.value < b.value)
        ||  (a.object.eventObjectId - b.object.eventObjectId);
  }

  var SLICE_SOURCE_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceMap = this.sourceMap_;
      var index = this.index_;
      var updateHandler = this.ruleEvents;
      var dropIndex = false;
      var buildIndex = false;
      var sourceObjectInfo;
      var sourceObjectId;
      var inserted = delta.inserted;
      var deleted = delta.deleted;

      //var d = new Date;
      //console.profile();
     
      // delete comes first to reduce index size -> insert will be faster
      if (deleted)
      {
        // opitimization: if delete item count greater than items left -> rebuild index
        if (deleted.length > index.length - deleted.length)
        {
          dropIndex = true;
          buildIndex = deleted.length != index.length;
          index.length = 0;
        }

        for (var i = 0, sourceObject; sourceObject = deleted[i]; i++)
        {
          if (!dropIndex)
          {
            sourceObjectInfo = sourceMap[sourceObject.eventObjectId];
            index.splice(binarySearchPos(index, sourceObjectInfo), 1);
          }

          delete sourceMap[sourceObject.eventObjectId];

          if (updateHandler)
            sourceObject.removeHandler(updateHandler, this);
        }

        if (buildIndex)
          for (var key in sourceMap)
          {
            sourceObjectInfo = sourceMap[key];
            index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
          }
      }

      if (inserted)
      {
        // optimization: it makes webkit & gecko slower (depends on object count, up to 2x), but makes ie faster
        buildIndex = !index.length;

        for (var i = 0, sourceObject; sourceObject = inserted[i]; i++)
        {
          sourceObjectInfo = {
            object: sourceObject,
            value: this.rule(sourceObject)
          };
          sourceMap[sourceObject.eventObjectId] = sourceObjectInfo;

          if (!buildIndex)
            index.splice(binarySearchPos(index, sourceObjectInfo), 0, sourceObjectInfo);
          else
            index.push(sourceObjectInfo);

          if (updateHandler)
            sourceObject.addHandler(updateHandler, this);
        }

        if (buildIndex)
          index.sort(sliceIndexSort);
      }

      //console.profileEnd();
      //console.log('Slice: ', new Date - d, buildIndex);

      this.applyRule();
    }
  };

 /**
  * @see ./demo/graph/range.html
  * @class
  */
  var Slice = Class(AbstractDataset, SourceDatasetMixin, {
    className: namespace + '.Slice',

   /**
    * Ordering items function.
    * @type {function(basis.data.DataObject)}
    * @readonly
    */
    rule: Function.getter($true),

   /**
    * Events list when dataset should recompute rule for source item.
    */
    ruleEvents: oneFunctionProperty(
      SLICE_SOURCEOBJECT_UPDATE,
      {
        update: true
      }
    ),

   /**
    * Calculated source object values
    * @type {Array.<basis.data.DataSource>}
    * @private
    */
    index_: null,

   /**
    * Direction of range.
    * @type {boolean}
    * @readonly
    */
    orderDesc: false,

   /**
    * Start of range.
    * @type {number}
    * @readonly
    */
    offset: 0,

   /**
    * Length of range.
    * @type {number}
    * @readonly
    */
    limit: 10,

   /**
    * @inheritDoc
    */
    listen: {
      source: SLICE_SOURCE_HANDLER
    },

   /**
    * @event
    */
    event_rangeChanged: createEvent('rangeChanged', 'dataset', 'oldOffset', 'oldLimit'),

   /**
    * @config {function} index Function for index value calculation; values are ordering according to this values.
    * @config {number} offset Initial value of range start.
    * @config {number} limit Initial value of range length.
    * @constructor
    */
    init: function(config){
      this.index_ = [];

      // inherit
      SourceDatasetMixin.init.call(this, config);
    },

   /**
    * Set new range for dataset.
    * @param {number} offset Start of range.
    * @param {number} limit Length of range.
    * @return {Object} Delta of member changes.
    */
    setRange: function(offset, limit){
      var oldOffset = this.offset;
      var oldLimit = this.limit;
      var delta = false;

      if (oldOffset != offset || oldLimit != limit)
      {
        this.offset = offset;
        this.limit = limit;

        delta = this.applyRule();

        this.event_rangeChanged(this, oldOffset, oldLimit);
      }
    },

   /**
    * Set new value for offset.
    * @param {number} offset
    * @return {Object} Delta of member changes.
    */
    setOffset: function(offset){
      return this.setRange(offset, this.limit);
    },

   /**
    * Set new value for limit.
    * @param {number} limit
    * @return {Object} Delta of member changes.
    */
    setLimit: function(limit){
      return this.setRange(this.offset, limit);
    },

   /**
    * Recompute slice.
    * @return {Object} Delta of member changes.
    */
    applyRule: function(){
      var start = this.offset;
      var end = start + this.limit;

      if (this.orderDesc)
      {
        start = this.index_.length - end;
        end = start + this.limit;
      }

      var curSet = Object.slice(this.item_);
      var newSet = this.index_.slice(Math.max(0, start), Math.max(0, end));
      var inserted = [];
      var delta;

      for (var i = 0, item; item = newSet[i]; i++)
      {
        var objectId = item.object.eventObjectId;
        if (curSet[objectId])
          delete curSet[objectId];
        else
          inserted.push(item.object);
      }

      if (delta = getDelta(inserted, values(curSet)))
        this.event_datasetChanged(this, delta);

      return delta;
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      SourceDatasetMixin.destroy.call(this);

      // destroy index
      this.index_ = null;
    }
  });


  //
  // Cloud
  //

  var CLOUD_SOURCEOBJECT_UPDATE = function(sourceObject){
    var sourceMap = this.sourceMap_;
    var memberMap = this.memberMap_;
    var sourceObjectId = sourceObject.eventObjectId;

    var oldList = sourceMap[sourceObjectId].list;
    var newList = sourceMap[sourceObjectId].list = {};
    var list = this.rule(sourceObject);
    var delta;
    var inserted = [];
    var deleted = [];
    var subset;

    if (Array.isArray(list))
      for (var j = 0; j < list.length; j++)
      {
        subset = this.keyMap.resolve(list[j]);

        if (subset)
        {
          subsetId = subset.eventObjectId;
          newList[subsetId] = subset;

          if (!oldList[subsetId])
          {
            subset.event_datasetChanged(subset, { inserted: [sourceObject] });

            if (!memberMap[subsetId])
            {
              inserted.push(subset);
              memberMap[subsetId] = 1;
            }
            else
              memberMap[subsetId]++;
          }
        }
      }
      

    for (var subsetId in oldList)
      if (!newList[subsetId])
      {
        var subset = oldList[subsetId];
        subset.event_datasetChanged(subset, { deleted: [sourceObject] });

        if (!--memberMap[subsetId])
        {
          delete memberMap[subsetId];
          deleted.push(subset);
        }
      }

    if (delta = getDelta(inserted, deleted))
      this.event_datasetChanged(this, delta);
  };

  var CLOUD_SOURCE_HANDLER = {
    datasetChanged: function(dataset, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var updateHandler = this.ruleEvents;
      var objectInfo;
      var array;
      var subset;
      var subsetId;
      var inserted = [];
      var deleted = [];

      Dataset.setAccumulateState(true);

      if (array = delta.inserted)
        for (var i = 0, sourceObject; sourceObject = array[i]; i++)
        {
          var list = this.rule(sourceObject);
          var sourceObjectInfo = {
            object: sourceObject,
            list: {}
          };

          sourceMap[sourceObject.eventObjectId] = sourceObjectInfo;

          if (Array.isArray(list))
            for (var j = 0; j < list.length; j++)
            {
              subset = this.keyMap.get(list[j], true);

              if (subset && !subset.has(sourceObject))
              {
                subsetId = subset.eventObjectId;
                sourceObjectInfo.list[subsetId] = subset;

                subset.event_datasetChanged(subset, { inserted: [sourceObject] });

                if (!memberMap[subsetId])
                {
                  inserted.push(subset);
                  memberMap[subsetId] = 1;
                }
                else
                  memberMap[subsetId]++;
              }
            }

          if (updateHandler)
            sourceObject.addHandler(updateHandler, this);
        }

      if (array = delta.deleted)
        for (var i = 0, sourceObject; sourceObject = array[i]; i++)
        {
          var sourceObjectId = sourceObject.eventObjectId;
          var list = sourceMap[sourceObjectId].list;

          delete sourceMap[sourceObjectId];

          for (var subsetId in list)
          {
            var subset = list[subsetId];
            subset.event_datasetChanged(subset, { deleted: [sourceObject] });

            if (!--memberMap[subsetId])
            {
              delete memberMap[subsetId];
              deleted.push(subset);
            }
          }

          if (updateHandler)
            sourceObject.removeHandler(updateHandler, this);
        }

      Dataset.setAccumulateState(false);

      if (delta = getDelta(inserted, deleted))
        this.event_datasetChanged(this, delta);
    }
  };

 /**
  * @class
  */
  var Cloud = Class(AbstractDataset, SourceDatasetMixin, {
    className: namespace + '.Cloud',

   /**
    * @type {basis.data.AbstractDataset}
    */
    subsetClass: AbstractDataset,
    
   /**
    * @type {function(basis.data.DataObject)}
    */
    rule: Function.getter($false),

   /**
    * Events list when dataset should recompute rule for source item.
    */
    ruleEvents: oneFunctionProperty(
      CLOUD_SOURCEOBJECT_UPDATE,
      {
        update: true
      }
    ),

   /**
    * @type {basis.data.KeyObjectMap}
    */
    keyMap: null,

   /**
    * @inheritDoc
    */
    map: $self,

   /**
    * @inheritDoc
    */
    listen: {
      source: CLOUD_SOURCE_HANDLER
    },

   /**
    * @constructor
    */ 
    init: function(config){
      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(extend({
          keyGetter: this.map,
          itemClass: this.subsetClass
        }, this.keyMap));

      // inherit
      SourceDatasetMixin.init.call(this, config);
    },

   /**
    * Fetch subset dataset by some data.
    * @param {basis.data.DataObject|Object} data
    * @param {boolean} autocreate
    * @return {basis.data.DataObject}
    */
    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit
      SourceDatasetMixin.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });


  //
  // export names
  //

  this.extend({
    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // transform datasets
    MapReduce: MapReduce,
    Subset: Subset,
    Split: Split,

    // other
    Slice: Slice,
    Cloud: Cloud
  });



}.body() + "//@ sourceURL=" + __curLocation + "src/basis/data/dataset.js").call(basis.namespace("basis.data.dataset"), basis.namespace("basis.data.dataset"), basis.namespace("basis.data.dataset").exports, this, __curLocation + "src/basis/data/dataset.js", __curLocation + "src/basis/data/", basis, function(url){ return basis.resource(__curLocation + "src/basis/data/" + url) });

//
// src/basis/data/generator.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  'use strict';


 /**
  * @namespace basis.data.generator
  */ 
  
  var namespace = this.path;


  //
  // Main part
  //

  var words = (
               'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
               'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
               'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
               'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
              )
              .replace(/[^a-z]/gi, ' ')
              .trim()
              .split(/\s+/);

 /**
  * @func
  */
  function genNumber(precision, min, max){
    min = min || 0;
    max = max || 1;
    if (min > max) return genNumber(precision, max, min);
    return Number((min + Math.random() * (max - min)).toFixed(precision || 0));
  };

 /**
  * @func
  */
  function genString(minLen, maxLen){
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

 /**
  * @func
  */
  function genSentence(wordCount){
    var result = [];
    var count = parseInt(wordCount);

    while (count--)
      result.push(words[Math.round(Math.random() * words.length)]);

    return result.join(' ');
  };


  //
  // export names
  //

  this.extend({
    number: genNumber,
    string: genString,
    sentence: genSentence
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/data/generator.js").call(basis.namespace("basis.data.generator"), basis.namespace("basis.data.generator"), basis.namespace("basis.data.generator").exports, this, __curLocation + "src/basis/data/generator.js", __curLocation + "src/basis/data/", basis, function(url){ return basis.resource(__curLocation + "src/basis/data/" + url) });

//
// src/basis/data/index.js
//

new Function(__wrapArgs, function(){

/**
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

  basis.require('basis.timer');
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.data.property');


 /**
  * @see ./demo/defile/data_index.html
  * @namespace basis.data.index
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  
  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var KeyObjectMap = nsData.KeyObjectMap;
  var AbstractDataset = nsData.AbstractDataset;

  var Property = basis.data.property.Property;
  var MapReduce = basis.data.dataset.MapReduce;


  //
  // Main part
  //

  function binarySearchPos(array, value){ 
    if (!array.length)  // empty array check
      return 0;

    var pos;
    var cmpValue;
    var l = 0;
    var r = array.length - 1;

    do 
    {
      pos = (l + r) >> 1;
      cmpValue = array[pos] || 0;

      if (value < cmpValue)
        r = pos - 1;
      else 
        if (value > cmpValue)
          l = pos + 1;
        else
          return value == cmpValue ? pos : 0;  
    }
    while (l <= r);

    return pos + (cmpValue < value);
  }


  //
  // Index
  //

 /**
  * Base class for indexes.
  * @class
  */
  var Index = Class(Property, {
    className: namespace + '.Index',
    autoDestroy: true,

   /**
    * Map of current values 
    * @type {Object}
    * @private
    */
    indexCache_: null,

   /**
    * @type {function(object):any}
    */
    valueGetter: Function.$null,

   /**
    * Event names map when index must check for updates.
    * @type {Object}
    */
    updateEvents: {},
   
   /**
    * @constructor
    */
    init: function(){
      this.indexCache_ = {};

      Property.prototype.init.call(this, 0);
    },

   /**
    * Add value to index
    */
    add_: function(value){
    },

   /**
    * Remove value to index
    */
    remove_: function(value){
    },

   /**
    * Change value
    */
    update_: function(newValue, oldValue){
    },

    destroy: function(){
      Property.prototype.destroy.call(this);

      this.indexCache_ = null;
    }
  });


 /**
  * @class
  */
  var Sum = Class(Index, {
    className: namespace + '.Sum',

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.value += value;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.value -= value;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.set(this.value - oldValue + newValue);
    }
  });


 /**
  * @class
  */
  var Count = Class(Index, {
    className: namespace + '.Count',

   /**
    * @inheritDoc
    */
    valueGetter: Function.$true,

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.value += !!value;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.value -= !!value;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.set(this.value - !!oldValue + !!newValue);
    }
  });


 /**
  * @class
  */
  var Avg = Class(Index, {
    className: namespace + '.Avg',
    sum_: 0,
    count_: 0,

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.sum_ += value;
      this.count_ += 1;
      this.value = this.sum_ / this.count_;
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.sum_ -= value;
      this.count_ -= 1;
      this.value = this.count_ ? this.sum_ / this.count_ : 0;
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.sum_ += newValue - oldValue;
      this.set(this.sum_ / this.count_);
    }
  });


 /**
  * @class
  */
  var VectorIndex = Class(Index, {
    className: namespace + '.VectorIndex',

   /**
    * function to fetch item from vector
    * @type {function(vector)}
    */
    itemGetter: Function.$null,

   /**
    * Values vector
    * @type {Array.<any>}
    */
    vector_: null,

   /**
    * @inheritDoc
    */
    init: function(){
      this.vector_ = [];
      Index.prototype.init.call(this);
    },

   /**
    * @inheritDoc
    */
    add_: function(value){
      this.vector_.splice(binarySearchPos(this.vector_, value), 0, value);
      this.value = this.vectorGetter(this.vector_);
    },

   /**
    * @inheritDoc
    */
    remove_: function(value){
      this.vector_.splice(binarySearchPos(this.vector_, value), 1);
      this.value = this.vectorGetter(this.vector_);
    },

   /**
    * @inheritDoc
    */
    update_: function(newValue, oldValue){
      this.vector_.splice(binarySearchPos(this.vector_, oldValue), 1);
      this.vector_.splice(binarySearchPos(this.vector_, newValue), 0, newValue);
      this.set(this.vectorGetter(this.vector_));
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      Index.prototype.destroy.call(this)
      this.vector_ = null;
    }
  });


 /**
  * @class
  */
  var Min = Class(VectorIndex, {
    className: namespace + '.Min',
    vectorGetter: function(vector){
      return vector[0];
    }
  });


 /**
  * @class
  */
  var Max = Class(VectorIndex, {
    className: namespace + '.Max',
    vectorGetter: function(vector){
      return vector[vector.length - 1];
    }
  });


  //
  // Index builder
  //

  var indexConstructors_= {};

  var DATASET_INDEX_HANDLER = {
    destroy: function(object){
      this.deleteIndex(object);
    }
  };

  function IndexConstructor(BaseClass, getter, events){
    if (!Class.isClass(BaseClass) || !BaseClass.isSubclassOf(Index))
      throw 'Wrong class for index constructor';

    getter = Function.getter(getter);
    events = events || 'update';

    if (typeof events != 'string')
      throw 'Events must be a event names space separated string';

    events = events.qw().sort();

    var indexId = [BaseClass.basisClassId_, getter.basisGetterId_, events].join('_');
    var indexConstructor = indexConstructors_[indexId];

    if (indexConstructor)
      return indexConstructor.owner;

    //
    // Create new constructor
    //

    var events_ = {};
    for (var i = 0; i < events.length; i++)
      events_[events[i]] = true;

    indexConstructors_[indexId] = {
      owner: this,
      indexClass: BaseClass.subclass({
        indexId: indexId,
        updateEvents: events_,
        valueGetter: getter
      })
    };

    this.indexId = indexId;
  };

  var createIndexConstructor = function(IndexClass){
    return function(getter, events){
      return new IndexConstructor(IndexClass, getter, events);
    }
  }

  //
  // Build basic index constructors
  //

  var count = createIndexConstructor(Count);
  var sum = createIndexConstructor(Sum);
  var avg = createIndexConstructor(Avg);
  var min = createIndexConstructor(Min);
  var max = createIndexConstructor(Max);


  //
  // Extend datasets to support aggregates
  //

  function applyIndexDelta(index, inserted, deleted){
    var indexCache = index.indexCache_;
    var objectId;

    // lock index to prevent multiple events
    index.lock();

    if (inserted)
      for (var i = 0, object; object = inserted[i++];)
      {
        var newValue = index.valueGetter(object);
        indexCache[object.eventObjectId] = newValue;
        index.add_(newValue);
      }

    if (deleted)
      for (var i = 0, object; object = deleted[i++];)
      {
        objectId = object.eventObjectId;
        index.remove_(indexCache[objectId]);
        delete indexCache[objectId];
      }

    // unlock index - fire event if value was changed
    index.unlock();
  }

  var ITEM_INDEX_HANDLER = {
    '*': function(event){
      var oldValue;
      var newValue;
      var index;
      var eventType = event.type;
      var object = event.args[0];
      var objectId = object.eventObjectId;

      for (var indexId in this.indexes)
      {
        index = this.indexes[indexId];

        if (index.updateEvents[eventType])
        {
          // fetch oldValue
          oldValue = index.indexCache_[objectId];

          // calc new value
          newValue = index.valueGetter(object);

          // update if value has changed
          if (newValue !== oldValue)
          {
            index.update_(newValue, oldValue);
            index.indexCache_[objectId] = newValue;
          }
        }
      }
    }
  };

  var DATASET_WITH_INDEX_HANDLER = {
    datasetChanged: function(object, delta){
      var array;

      // add handler to new source object
      if (array = delta.inserted)
        for (var i = array.length; i --> 0;)
          array[i].addHandler(ITEM_INDEX_HANDLER, this);

      // remove handler from old source object
      if (array = delta.deleted)
        for (var i = array.length; i --> 0;)
          array[i].removeHandler(ITEM_INDEX_HANDLER, this);

      // apply changes for indexes
      for (var indexId in this.indexes)
        applyIndexDelta(this.indexes[indexId], delta.inserted, delta.deleted);
    },
    
    destroy: function(){
      var indexes = Object.values(this.indexes);
      for (var indexId in indexes)
        this.deleteIndex(indexes[indexId]);
    }
  };


 /**
  * Extend for basis.data.AbstractDataset
  * @namespace basis.data.AbstractDataset
  */
  AbstractDataset.extend({
   /**
    * @type {Object}
    */
    indexes: null,

   /**
    * @param
    */ 
    getIndex: function(indexConstructor){
      if (indexConstructor instanceof IndexConstructor == false)
      {
        ;;;if (typeof console != 'undefined') console.warn('indexConstructor must be an instance of IndexConstructor');
        return;
      }

      if (!this.indexes)
      {
        this.indexes = {};

        this.addHandler(DATASET_WITH_INDEX_HANDLER);
        DATASET_WITH_INDEX_HANDLER.datasetChanged.call(this, this, {
          inserted: this.getItems()
        });
      }

      var indexId = indexConstructor.indexId;
      var index = this.indexes[indexId];

      if (!index)
      {
        indexConstructor = indexConstructors_[indexId];
        if (!indexConstructor)
          throw 'Wrong index constructor';

        index = new indexConstructor.indexClass();
        index.addHandler(DATASET_INDEX_HANDLER, this);

        this.indexes[indexId] = index;
        applyIndexDelta(index, this.getItems());
      }

      return index; 
    },

   /**
    * @param {basis.data.index.IndexConstructor|basis.data.index.Index}
    */
    deleteIndex: function(index){
      if (this.indexes && this.indexes[index.indexId])
      {
        delete this.indexes[index.indexId];
        index.removeHandler(DATASET_INDEX_HANDLER, this);
        index.destroy();

        // if any index in dataset nothing to do
        for (var key in this.indexes)
          return;

        // if no indexes - delete indexes storage and remove handlers
        this.removeHandler(DATASET_WITH_INDEX_HANDLER);
        this.indexes = null;
      }
    }
  });


 /**
  * @class
  */
  var IndexMap = Class(MapReduce, {
    className: namespace + '.IndexMap',

    calcs: null,

    indexes: null,
    indexes_: null,

    timer_: undefined,
    indexUpdated: null,
    memberSourceMap: null,
    keyMap: null,

    map: function(item){
      return this.keyMap.get(item, true);
    },

    addMemberRef: function(member, sourceObject){
      this.memberSourceMap[member.eventObjectId] = sourceObject.eventObjectId;

      if (this.listen.member)
        member.addHandler(this.listen.member, this);

      this.sourceMap_[sourceObject.eventObjectId].updated = true;

      if (member.subscriberCount > 0)
        this.calcMember(member);
    },

    removeMemberRef: function(member, sourceObject){
      delete this.memberSourceMap[member.eventObjectId];

      if (this.listen.member)
        member.removeHandler(this.listen.member, this);
    },

    event_sourceChanged: function(dataset, oldSource){
      MapReduce.prototype.event_sourceChanged.call(this, dataset, oldSource);
      
      var index;

      for (var indexName in this.indexes_)
      {
        index = this.indexes_[indexName];
        if (oldSource)
        { 
          this.deleteIndex(indexName);
          oldSource.deleteIndex(this.indexes[indexName]);
        }

        if (this.source)
          this.addIndex(indexName, this.source.getIndex(index));
      }
    },

    listen: {
      index: {
        change: function(value){
          var indexMap = this.indexMap;

          indexMap.indexValues[this.key] = value;
          indexMap.indexUpdated = true;
          indexMap.recalcRequest();
        }
      },
      member: {
        subscribersChanged: function(object, oldCount){
          if (object.subscriberCount > 0 && oldCount == 0)
            this.calcMember(object);
        }
      }
    },

    ruleEvents: Class.oneFunctionProperty(
      function(sourceObject, delta){
        MapReduce.prototype.ruleEvents.update.call(this, sourceObject, delta);

        this.sourceMap_[sourceObject.eventObjectId].updated = true;
        this.recalcRequest();
      },
      {
        update: true
      }
    ),


    init: function(config){
      this.recalc = this.recalc.bind(this);

      this.indexUpdated = false;
      this.indexesBind_ = {};
      this.memberSourceMap = {};

      var indexes = this.indexes;
      this.indexes = {};
      this.indexes_ = {};

      this.calcs = this.calcs || {};
      this.indexValues = {};

      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(Object.complete({
          create: function(key, config){
            return new this.itemClass(config);
          }
        }, this.keyMap));

      MapReduce.prototype.init.call(this, config);

      Object.iterate(indexes, this.addIndex, this);
    },

    addIndex: function(key, index){
      if (!this.indexes[key])
      {
        if (index instanceof IndexConstructor)
        {
          if (!this.indexes_[key])
          {
            this.indexes_[key] = index;
            index = this.source && this.source.getIndex(index);
          }
          else
          {
            /** @cut */ if (typeof console != 'undefined') console.warn('Index `{0}` already exists'.format(key));
            return;
          }
        }

        if (index instanceof Index)
        {
          this.indexValues[key] = index.value;
          this.indexes[key] = index;
          this.indexesBind_[key] = {
            key: key,
            indexMap: this
          };

          var listenHandler = this.listen.index;
          if (listenHandler)
          {
            index.addHandler(listenHandler, this.indexesBind_[key]);

            if (listenHandler.change)
              listenHandler.change.call(this.indexesBind_[key], index.value);
          }
        }
        else
        {
          return; // warn
        }
      }
      /** @cut */else if (typeof console != 'undefined') console.warn('Index `{0}` already exists'.format(key));
    },

    removeIndex: function(key){
      if (this.indexes_[key] || this.indexes[key])
      {
        if (this.indexes[key] && this.listen.index)
          this.indexes[key].removeHandler(this.listen.index, this.indexesBind_[key]);

        delete this.indexValues[key];
        delete this.indexesBind_[key];
        delete this.indexes[key];
        delete this.indexes_[key];
      }
    },

    addCalc: function(name, calc){
      this.calcs[name] = calc;
      this.recalcRequest();
    },
    removeCalc: function(name){
      delete this.calcs[name];
    },

    lock: function(){
      for (var indexId in this.indexes)
        this.indexes[indexId].lock();
    },
    unlock: function(){
      for (var indexId in this.indexes)
        this.indexes[indexId].unlock();
    },

    recalcRequest: function(){
      if (!this.timer_)
        this.timer_ = setTimeout(this.recalc, 0);
    },

    recalc: function(){
      for (var idx in this.item_)
        this.calcMember(this.item_[idx]);

      this.indexUpdated = false;
      this.timer_ = clearTimeout(this.timer_);
    },

    calcMember: function(member){
      var sourceObject = this.sourceMap_[this.memberSourceMap[member.eventObjectId]];

      if (member.subscriberCount && (sourceObject.updated || this.indexUpdated))
      {
        sourceObject.updated = false;

        var data = {};
        var newValue;
        var oldValue;
        var update;
        for (var calcName in this.calcs)
        {
          newValue = this.calcs[calcName](sourceObject.sourceObject.data, this.indexValues, sourceObject.sourceObject);
          oldValue = member.data[calcName];
          if (member.data[calcName] !== newValue && (typeof newValue != 'number' || typeof oldValue != 'number' || !isNaN(newValue) || !isNaN(oldValue)))
          {
            data[calcName] = newValue;
            update = true;
          }
        }
            
        if (update)  
          member.update(data);
      }
    },  

    getMember: function(sourceObject){
      return this.keyMap.get(sourceObject, true);
    },

    destroy: function(){
      this.timer_ = clearTimeout(this.timer_);
      this.calcs = null;
      this.indexUpdated = null;
      this.memberSourceMap = null;
      this.indexesBind_ = null;

      this.keyMap.destroy();
      this.keyMap = null;

      for (var indexName in this.indexes)
        this.removeIndex(indexName);

      MapReduce.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    IndexConstructor: IndexConstructor,
    createIndexConstructor: createIndexConstructor,

    Index: Index,
    Count: Count,
    Sum: Sum,
    Avg: Avg,
    VectorIndex: VectorIndex,
    Min: Min,
    Max: Max,

    count: count,
    sum: sum,
    avg: avg,
    max: max,
    min: min,

    IndexMap: IndexMap
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/data/index.js").call(basis.namespace("basis.data.index"), basis.namespace("basis.data.index"), basis.namespace("basis.data.index").exports, this, __curLocation + "src/basis/data/index.js", __curLocation + "src/basis/data/", basis, function(url){ return basis.resource(__curLocation + "src/basis/data/" + url) });

//
// src/basis/entity.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.data');
  basis.require('basis.data.dataset');


 /**
  * @namespace basis.entity
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var Cleaner = basis.Cleaner;

  var extend = Object.extend;
  var complete = Object.complete;
  var arrayFrom = Array.from;
  var $self = Function.$self;
  var getter = Function.getter;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsData = basis.data;

  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;
  var Collection = nsData.dataset.Subset;
  var Grouping = nsData.dataset.Split;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;

  var NULL_INFO = {};

  //

  var isKeyType = { 'string': 1, 'number': 1 };
  var entityTypes = [];

  var NumericId = function(value){
    return isNaN(value) ? null : Number(value);
  }
  var NumberId = function(value){
    return isNaN(value) ? null : Number(value);
  }
  var IntId = function(value){
    return isNaN(value) ? null : parseInt(value);
  }
  var StringId = function(value){
    return value == null ? null : String(value);
  }

  // ---

  var untitledNames = {};
  function getUntitledName(name){
    untitledNames[name] = untitledNames[name] || 0;
    return name + (untitledNames[name]++);
  }

  //
  // Index
  //

  var Index = basis.Class(null, {
    className: namespace + '.Index',

    init: function(normalize){
      var index = this.index = {};

      this.normalize = normalize;
      this.valueWrapper = function(newValue, oldValue){
        // normalize new value
        var value = normalize(newValue, oldValue);

        if (value !== oldValue && index[value])
        {
          ;;;if (typeof console != undefined) console.warn('Duplicate value for index ' + oldValue + ' => ' + newValue);
          return oldValue;  // no changes
        }

        return value;
      };
      this.calcWrapper = function(newValue, oldValue){
        // normalize new value
        var value = normalize(newValue, oldValue);

        if (value !== oldValue && index[value])
          throw 'Duplicate value for index ' + oldValue + ' => ' + newValue;

        return value;
      }
      Cleaner.add(this);
    },
    get: function(value, checkType){
      var item = this.index[value];
      if (item && (!checkType || item instanceof checkType))
        return item;
    },
    add: function(value, item){
      var curr = this.index[value];
      if (item && (!curr || curr === item))
      {
        this.index[value] = item;
        return true;
      }
    },
    remove: function(value, item){
      if (this.index[value] === item)
      {
        delete this.index[value];
        return true;
      }
    },
    destroy: function(){
      this.index = null;
    }
  });


  function CalculateField(){
    var args = Array.from(arguments);
    var func = args.pop();

    if (typeof func != 'function')
      console.warn('Last argument for calculate field constructor must be a function');

    var cond = [];
    var calcArgs = [];
    for (var i = 0, name; i < args.length; i++)
    {
      var name = args[i].quote('"');
      cond.push(name + ' in delta');
      calcArgs.push('data[' + name + ']');
    }

    var result = new Function('calc',
      'return function(delta, data, oldValue){' +
        (cond.length ? 'if (' + cond.join(' || ') + ')' : '') +
        'return calc(' + calcArgs.join(', ') + ');' +
        (cond.length ? 'return oldValue;' : '') +
      '}'
    )(func);
    result.args = args;
    result.isCalcField = true;
    return result;
  }

  function ConcatString(){
    return CalculateField.apply(null, Array.from(arguments).concat(function(){
      var value = [];
      for (var i = arguments.length; i --> 0;)
      {
        if (arguments[i] == null)
          return null;
        value.push(arguments[i]);
      }
      return value.join('-');
    }))
  }

  //
  // EntitySet
  //

  var ENTITYSET_WRAP_METHOD = function(superClass, method){
    return function(data){
      return superClass.prototype[method].call(this, data && data.map(this.wrapper));
    };
  }

  var ENTITYSET_INIT_METHOD = function(superClass, name){
    return function(config){
      if (!this.name)
        this.name = getUntitledName(name);
      /*if (config)
      {
        this.name = config.name || getUntitledName(name);
        this.wrapper = config.wrapper;
      }
      else
        this.name = getUntitledName(name);*/

      // inherit
      superClass.prototype.init.call(this, config);
    }
  }

  var ENTITYSET_SYNC_METHOD = function(superClass){
    return function(data, set){
      Dataset.setAccumulateState(true);
      data = (data || []).map(this.wrapper);
      Dataset.setAccumulateState(false);

      var res = superClass.prototype.sync.call(this, data, set);

      return res;
    };
  }

 /**
  * @class
  */
  var EntitySet = Class(Dataset, {
    className: namespace + '.EntitySet',

    wrapper: Function.$self,

    init: ENTITYSET_INIT_METHOD(Dataset, 'EntitySet'),
    sync: ENTITYSET_SYNC_METHOD(Dataset),

    set: ENTITYSET_WRAP_METHOD(Dataset, 'set'),
    add: ENTITYSET_WRAP_METHOD(Dataset, 'add'),
    remove: ENTITYSET_WRAP_METHOD(Dataset, 'remove'),

    destroy: function(){
      // inherit
      Dataset.prototype.destroy.call(this);

      delete this.wrapper;
    }
  });

  //
  // Read only EntitySet
  //

 /**
  * @class
  */
  var ReadOnlyEntitySet = Class(EntitySet, {
    className: namespace + '.ReadOnlyEntitySet',

    set: Function.$false,
    add: Function.$false,
    remove: Function.$false,
    clear: Function.$false
  });

  //
  // Entity collection
  //

 /**
  * @class
  */
  var EntityCollection = Class(Collection, {
    className: namespace + '.EntityCollection',

    init: ENTITYSET_INIT_METHOD(Collection, 'EntityCollection'),
    sync: ENTITYSET_SYNC_METHOD(Collection)/*,

    set: ENTITYSET_WRAP_METHOD,
    add: ENTITYSET_WRAP_METHOD,
    remove: ENTITYSET_WRAP_METHOD*/
  });

  EntityCollection.sourceHandler = Collection.sourceHandler;

  //
  // Entity grouping
  //

 /**
  * @class
  */
  var EntityGrouping = Class(Grouping, {
    className: namespace + '.EntityGrouping',

    subsetClass: ReadOnlyEntitySet,

    init: ENTITYSET_INIT_METHOD(Grouping, 'EntityGrouping'),
    sync: ENTITYSET_SYNC_METHOD(Grouping),

    getSubset: function(object, autocreate){
      var group = Grouping.prototype.getSubset.call(this, object, autocreate);
      if (group)
        group.wrapper = this.wrapper;
      return group;
    }
  });

  //
  // EntitySetWrapper
  //

  var EntitySetWrapper = function(wrapper){
    if (this instanceof EntitySetWrapper)
    {
      if (!wrapper)
        wrapper = $self;

      var entitySetType = new EntitySetConstructor({
        entitySetClass: {
          name: 'Set of {' + ((wrapper.entityType || wrapper).name || 'UnknownWrapper') + '}',
          wrapper: wrapper
        }
      });

      var result = function(data, entitySet){
        if (data != null)
        {
          if (!(entitySet instanceof EntitySet))
            entitySet = entitySetType.createEntitySet();

          entitySet.set(data instanceof Dataset ? data.getItems() : Array.from(data));

          return entitySet;
        }
        else
          return null;
      };

      result.entitySetType = entitySetType;

      return result;
    }
  };
  ;;;EntitySetWrapper.className = namespace + '.EntitySetWrapper';

  //
  // EntitySetConstructor
  //

 /**
  * @class
  */
  var EntitySetConstructor = Class(null, {
    className: namespace + '.EntitySetConstructor',

    entitySetClass: EntitySet,

    extendConstructor_: true,
    createEntitySet: function(){
      return new this.entitySetClass();
    }
  });

 /*
  *  EntityTypeWrapper
  */

  var EntityTypeWrapper = function(config){
    if (this instanceof EntityTypeWrapper)
    {
      var result = function(data, entity){
        // newData - data for target EntityType instance
        // entity - current instance of target EntityType

        if (data != null)
        {
          // if newData instance of target EntityType return newData
          if (data === entity || data.entityType === entityType)
            return data;

          var idValue;
          var idField = entityType.idField;

          if (isKeyType[typeof data])
          {
            if (!idField)
              return;

            idValue = data;
            data = {};
            data[idField] = idValue;
          }
          else
          {
            if (entityType.compositeKey)
              idValue = entityType.compositeKey(data, data);
            else
              if (idField)
                idValue = data[idField];
              else
              {
                if (isSingleton)
                {
                  entity = entityType.singleton;
                  if (!entity)
                    return entityType.singleton = new entityClass(data);
                }
              }
          }

          if (idValue != null && index)
            entity = index.get(idValue, entityType.entityClass);

          if (entity && entity.entityType === entityType)
            entity.update(data);
          else
            entity = new entityClass(data);

          return entity;
        }
        else
          return entityType.singleton;
      };

      var entityType = new EntityTypeConstructor(config || {}, result);
      var index = entityType.index__;
      var entityClass = entityType.entityClass;
      var isSingleton = entityType.isSingleton;

      extend(result, {
        toString: function(){
          return this.typeName + '()';
        },
        entityType: entityType,
        type: result,
        typeName: entityType.name,
        index: index,
        reader: function(data){
          return entityType.reader(data);
        },

        get: function(data){
          return entityType.get(data);
        },
        addField: function(key, wrapper){
          entityType.addField(key, wrapper);
        },
        all: entityType.all,
        createCollection: function(name, memberSelector, dataset){
          var collection = entityType.collection_[name];

          if (!collection && memberSelector)
          {
            return entityType.collection_[name] = new EntityCollection({
              wrapper: result,
              source: dataset || entityType.all,
              rule: memberSelector
            });
          }

          return collection;
        },
        getCollection: function(name){
          return entityType.collection_[name];
        },
        createGrouping: function(name, rule, dataset){
          var grouping = entityType.grouping_[name];
          if (!grouping && rule)
          {
            return entityType.grouping_[name] = new EntityGrouping({
              wrapper: result,
              source: dataset || entityType.all,
              rule: rule
            });
          }

          return grouping;
        },
        getGrouping: function(name){
          return entityType.grouping_[name];
        },
        getSlot: function(index, defaults){
          return entityType.getSlot(index, defaults);
        }
      });

      // debug only
      //result.entityType = entityType;
      //result.callText = function(){ return entityType.name };

      return result;
    }
    //else
    //  return namedEntityTypes.get(config);
  };
  ;;;EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

  //
  // Entity type constructor
  //

  var getSingleton = getter('singleton');
  var fieldDestroyHandlers = {};

 /**
  * @class
  */
  var Slot = Class(DataObject, {
    className: namespace + '.Slot'
  });

 /**
  * @class
  */
  var EntityTypeConstructor = Class(null, {
    className: namespace + '.EntityType',
    name: 'UntitledEntityType',

    defaults: null,
    fields: null,
    extensible: false,

    index__: null,
    slot_: null,

    init: function(config, wrapper){
      this.name = config.name || getUntitledName(this.name);

      var entityClass__;
      var idField;

      this.index__ = config.index;
      this.idFields = {};

      ;;;if (typeof console != 'undefined' && entityTypes.search(this.name, getter('name'))) console.warn('Dublicate entity type name: ', this.name);
      entityTypes.push(this);

      this.isSingleton = config.isSingleton;
      this.wrapper = wrapper;

      this.all = new ReadOnlyEntitySet(Object.extend(config.all || {}, {
        wrapper: wrapper
      }));
      this.slot_ = {};

      if (config.extensible)
        this.extensible = true;

      this.fields = {};
      this.defaults = {};
      this.aliases = {};
      this.getters = {};

      Object.iterate(config.fields, this.addField, this);
      if (config.constrains)
        config.constrains.forEach(function(item){
          this.addCalcField(null, item);
        }, this);

      if (this.isSingleton)
        this.get = getSingleton;

      if (config.aliases)
        Object.iterate(config.aliases, this.addAlias, this);

      this.collection_ = {};
      if (config.collections)
      {
        for (var name in config.collections)
        {
          this.collection_[name] = new EntityCollection({
            name: name,
            wrapper: wrapper,
            source: this.all,
            rule: config.collections[name] || Function.$true
          });
        }
      }

      this.grouping_ = {};
      if (config.groupings)
      {
        for (var name in config.groupings)
        {
          this.grouping_[name] = new EntityGrouping({
            name: name,
            wrapper: wrapper,
            source: this.all,
            rule: config.groupings[name] || Function.$true
          });
        }
      }

      ;;;if (config.reflections) console.warn('Reflections are deprecated');

      idField = this.idField;
      entityClass__ = this.entityClass = Entity(this, this.all, this.index__, this.slot_, this.fields, this.defaults, this.getters).extend({
        entityType: this,
        type: wrapper,
        typeName: this.name,
        getId: function(){
          return this.__id__;
        }
      });
    },
    reader: function(data){
      var result = {};

      // key type value
      if (isKeyType[typeof data])
      {
        if (this.idField)
        {
          result[this.idField] = data;
          return result;
        }
        return null;
      }

      // return null id data is not an object
      if (!data || data == null)
        return null;

        
      // map data
      for (var key in data)
      {
        var fieldKey = key in this.aliases 
          ? this.aliases[key]
          : '';

        if (fieldKey && fieldKey in this.fields)
        {
          result[fieldKey] = this.fields[fieldKey].reader
            ? this.fields[fieldKey].reader(data[key])
            : data[key];
        }
      }

      return result;
    },
    addAlias: function(alias, key){
      if (key in this.fields)
      {
        if (alias in this.aliases == false)
          this.aliases[alias] = key;
        /** @cut */else console.warn('Alias `{0}` already exists'.format(alias));
      }
      /** @cut */else console.warn('Can\'t add alias `{0}` for non-exists field `{1}`'.format(alias, key));
    },
    addField: function(key, config){
      if (this.all.itemCount)
      {
        ;;;if (typeof console != 'undefined') console.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not added, you must destroy all existed entity first.');
        return;
      }

      this.aliases[key] = key;

      if (typeof config == 'function')
      {
        config = {
          type: config
        };
      }

      if ('type' in config && typeof config.type != 'function')
      {
        ;;;if (typeof console != 'undefined') console.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not a function. Field wrapper has been ignored. Wraper: ', wrapper);
        config.type = $self;
      }

      var wrapper = config.type || $self;
      var calcWrapper;

      if ([NumericId, NumberId, IntId, StringId].has(wrapper))
        config.id = true;

      if (config.id)
      {
        if (!this.index__)
          this.index__ = new Index(String);

        this.idFields[key] = true;

        if (this.idField || this.compositeKey)
        {
          this.idField = null;
          this.compositeKey = ConcatString.apply(null, Object.keys(this.idFields));
        }
        else
        {
          this.idField = key;
        }

        //calcWrapper = this.index__.calcWrapper;
        //wrapper = this.index__.valueWrapper;
      }

      if (config.calc)
        this.addCalcField(key, config.calc, calcWrapper);
      else
        this.fields[key] = wrapper;

      this.defaults[key] = 'defValue' in config ? config.defValue : wrapper();

      this.getters['get_' + key] = function(){
        return this.data[key];
      };
      /*this.setters['set_' + key] = function(value, rollback){
        return this.set(key, value, rollback);
      };*/

      if (!fieldDestroyHandlers[key])
        fieldDestroyHandlers[key] = {
          destroy: function(){
            this.set(key, null);
          }
        };
    },
    addCalcField: function(key, wrapper, valueWrapper){
      if (key && this.fields[key])
      {
        ;;;if (typeof console != 'undefined') console.warn('Field `{0}` had defined already'.format(key));
        return;
      }

      if (!this.calcs)
        this.calcs = [];

      var calcConfig = {
        args: wrapper.args || [],
        wrapper: !valueWrapper ? wrapper : function(delta, data, oldValue){
          return valueWrapper(wrapper(delta, data, oldValue));
        }
      };

      // NOTE: simple dependence calculation
      // TODO: check, is algoritm make real check for dependencies or not?
      var before = this.calcs.length;
      var after = 0;

      for (var i = 0; i < this.calcs.length; i++)
        if (wrapper.args.has(this.calcs[i].key))
          after = i + 1;

      if (key)
      {
        // natural calc field

        calcConfig.key = key;
        for (var i = 0; i < this.calcs.length; i++)
          if (this.calcs[i].args.has(key))
          {
            before = i;
            break;
          }

        if (after > before)
        {
          ;;;if (typeof console != 'undefined') console.warn('Can\'t add calculate field `{0}`, because recursion'.format(key));
          return;
        }

        if (this.idField && key == this.idField)
          this.compositeKey = wrapper;

        this.fields[key] = function(value, oldValue){
          ;;;if (typeof console != 'undefined') console.log('Calculate fields are readonly');
          return oldValue;
        }
      }
      else
      {
        // constrain
        before = after;
      }

      this.calcs.splice(Math.min(before, after), 0, calcConfig);
    },
    get: function(entityOrData){
      var id = this.getId(entityOrData);
      if (id != null)
        return this.index__.get(id, this.entityClass);
    },
    getId: function(entityOrData){
      if ((this.idField || this.compositeKey) && entityOrData != null)
      {
        if (isKeyType[typeof entityOrData])
          return entityOrData;

        if (entityOrData && entityOrData.entityType === this)
          return entityOrData.__id__;

        if (entityOrData instanceof DataObject)
          entityOrData = entityOrData.data;

        if (this.compositeKey)
          return this.compositeKey(entityOrData, entityOrData);
        else
          return entityOrData[this.idField];
      }
    },
    getSlot: function(data){
      var id = this.getId(data);
      if (id != null)
      {
        var slot = this.slot_[id];
        if (!slot)
        {
          if (isKeyType[typeof data])
          {
            var tmp = {};
            if (this.idField && !this.compositeKey)
              tmp[this.idField] = data;
            data = tmp;
          }

          slot = this.slot_[id] = new DataObject({
            delegate: this.get(id),
            data: data
          });
        }
        return slot;
      }
    }
  });

  //
  //  Entity
  //

  function entityWarn(entity, message){
    ;;;if (typeof console != 'undefined') console.warn('(debug) Entity ' + entity.entityType.name + '#' + entity.eventObjectId + ': ' + message, entity); 
  };

  function fieldCleaner(key){
    this.set(key, null);
  };

 /**
  * @class
  */
  var BaseEntity = Class(DataObject, {
    className: namespace + '.BaseEntity',
    init: EventObject.prototype.init,
    event_rollbackUpdate: createEvent('rollbackUpdate')
  });

 /**
  * @class
  */
  var Entity = function(entityType, all, index__, typeSlot, fields, defaults, getters){

    var idField = entityType.idField;

    function rollbackChanges(entity, delta, rollbackDelta){
      for (var key in delta)
        entity.data[key] = delta[key];

      if (rollbackDelta)
        for (var key in rollbackDelta)
        {
          if (!entity.modified)
          {
            entity.modified = rollbackDelta;
          }
          else
          {
            // ???
          }
        }
    }

    function calc(entity, delta, rollbackDelta){
      var update = false;
      var calcs = entityType.calcs;
      var id = entity.__id__;

      var data = entity.data;
      try {
        if (calcs)
        {
          for (var i = 0, calc; calc = calcs[i++];)
          {
            var key = calc.key;
            if (key)
            {
              var oldValue = data[key];
              data[key] = calc.wrapper(delta, data, data[key]);
              if (data[key] !== oldValue)
              {
                delta[key] = oldValue;
                update = true;
              }
            }
            else
              calc.wrapper(delta, data);
          }
        }

        if (entityType.compositeKey)
          entity.__id__ = entityType.compositeKey(delta, data, entity.__id__);
        else
          if (idField && idField in delta)
            entity.__id__ = data[idField];

        if (entity.__id__ !== id)
          entityType.index__.calcWrapper(entity.__id__);

      } catch(e) {
        ;;;if (typeof console != 'undefined') console.warn('Exception on field calc');
        entity.__id__ = id;
        rollbackChanges(entity, delta, rollbackDelta);
        update = false;
      }

      if (entity.__id__ !== id)
        updateIndex(entity, id, entity.__id__);

      return update;      
    }

    function updateIndex(entity, curValue, newValue){
      // if current value is not null, remove old value from index first
      if (curValue != null)
      {
        index__.remove(curValue, entity);
        if (typeSlot[curValue])
          typeSlot[curValue].setDelegate();
      }

      // if new value is not null, add new value to index
      if (newValue != null)
      {
        index__.add(newValue, entity);
        if (typeSlot[newValue])
          typeSlot[newValue].setDelegate(entity);
      }
    }

    return Class(BaseEntity, getters, {
      className: namespace + '.Entity',

      canHaveDelegate: false,
      //index: index__,

      modified: null,
      isTarget: true,

      extendConstructor_: false,
      init: function(data){
        //var entityType = this.entityType;

        // inherit
        BaseEntity.prototype.init.call(this);

        // set up some properties
        this.fieldHandlers_ = {};
        this.data = {};//new entityType.xdefaults;//{};
        this.root = this;
        this.target = this;

        ;;;for (var key in data) if (!fields[key]) entityWarn(this, 'Set value for "' + key + '" property is ignored.');

        // copy default values
        var value;
        var delta = {};
        for (var key in fields)
        {
          if (key in data)
          {
            delta[key] = defaults[key];
            value = fields[key](data[key]);
          }
          else
          {
            value = defaults[key];
          }

          if (value && value !== this && value instanceof EventObject)
          {
            if (value.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          }

          this.data[key] = value;
        }

        calc(this, delta);

        // reg entity in all entity type instances list
        all.event_datasetChanged(all, {
          inserted: [this]
        });
      },
      toString: function(){
        return '[object ' + this.constructor.className + '(' + this.entityType.name + ')]';
      },
      get: function(key){
        return this.data[key];
      },
      set: function(key, value, rollback, silent_){
        // get value wrapper
        var valueWrapper = fields[key];

        if (!valueWrapper)
        {
          // exit if no new fields allowed
          if (!entityType.extensible)
          {
            ;;;entityWarn(this, 'Set value for "' + key + '" property is ignored.');
            return;
          }

          // emulate field wrapper
          valueWrapper = $self;
        }

        // main part
        var delta;
        var updateDelta;
        var result;
        var rollbackData = this.modified;
        var newValue = valueWrapper(value, this.data[key]);
        var curValue = this.data[key];  // NOTE: value can be modify by valueWrapper,
                                        // that why we fetch it again after valueWrapper call

        var valueChanged = newValue !== curValue
                           // date comparation fix;
                           && (!newValue || !curValue || newValue.constructor !== Date || curValue.constructor !== Date || +newValue !== +curValue);

        // if value changed:
        // - update index for id field
        // - attach/detach handlers on object destroy (for EventObjects)
        // - registrate changes to rollback data if neccessary
        // - fire 'change' event for not silent mode
        if (valueChanged) updateField:
        {
          result = {};

          // NOTE: rollback is not allowed for id field
          if (key != idField)
          {
            if (rollback)
            {
              // rollback mode

              // create rollback storage if absent
              // actually this means rollback mode is switched on
              if (!rollbackData)
                this.modified = rollbackData = {};

              // save current value if key is not in rollback storage
              // if key is not in rollback storage, than this key didn't change since rollback mode was switched on
              if (key in rollbackData === false)
              {
                // create rollback delta
                result.rollback = {
                  key: key,
                  value: undefined
                };

                // store current value
                rollbackData[key] = curValue;
              }
              else
              {
                if (rollbackData[key] === newValue)
                {
                  result.rollback = {
                    key: key,
                    value: newValue
                  };

                  delete rollbackData[key];

                  if (!Object.keys(rollbackData).length)
                    this.modified = null;
                }
              }
            }
            else
            {
              // if update with no rollback and object in rollback mode
              // and has changing key in rollback storage, than change
              // value in rollback storage, but not in info
              if (rollbackData && key in rollbackData)
              {
                if (rollbackData[key] !== newValue)
                {
                  // create rollback delta
                  result.rollback = {
                    key: key,
                    value: rollbackData[key]
                  };

                  // store new value
                  rollbackData[key] = newValue;

                  break updateField; // skip update field
                }
                else
                  return false;
              }
            }
          }

          // main part of field update

          // set new value for field
          this.data[key] = newValue;
          
          // remove attached handler if exists
          if (this.fieldHandlers_[key])
          {
            curValue.removeHandler(fieldDestroyHandlers[key], this);
            this.fieldHandlers_[key] = false;
          }

          // add new handler if object is instance of EventObject
          // newValue !== this prevents recursion for self update
          if (newValue && newValue !== this && newValue instanceof EventObject)
          {
            if (newValue.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          }

          // prepare result
          result.key = key;
          result.value = curValue;
          result.delta = {};
          result.delta[key] = curValue;
        }
        else
        {
          if (!rollback && rollbackData && key in rollbackData)
          {
            // delete from rollback
            result = {
              rollback: {
                key: key,
                value: rollbackData[key]
              }
            };

            delete rollbackData[key];

            if (!Object.keys(rollbackData).length)
              this.modified = null;
          }
        }


        // fire events for not silent mode
        if (!silent_ && result)
        {
          var update = result.key;
          var delta = result.delta || {};
          var rollbackDelta;

          if (result.rollback)
          {
            rollbackDelta = {};
            rollbackDelta[result.rollback.key] = result.rollback.value;
          }

          if (calc(this, delta, rollbackDelta))
            update = true;

          if (update)
          {
            // fire event
            this.event_update(this, delta);
            result.delta = delta;
          }

          if (rollbackDelta)
            this.event_rollbackUpdate(this, rollbackDelta);
        }

        // return delta or false (if no changes)
        return result || false;
      },
      update: function(data, rollback){
        if (data)
        {
          var update;
          var delta = {};

          var rollbackUpdate;
          var rollbackDelta = {};

          var setResult;

          // update fields
          for (var key in data)
          {
            if (setResult = this.set(key, data[key], rollback, true)) //this.set(key, data[key], rollback))
            {
              if (setResult.key)
              {
                update = true;
                delta[setResult.key] = setResult.value;
              }

              if (setResult.rollback)
              {
                rollbackUpdate = true;
                rollbackDelta[setResult.rollback.key] = setResult.rollback.value;
              }
            }
          }

          // calc
          if (calc(this, delta, rollbackDelta))
            update = true;

          // dispatch events

          if (update)
            this.event_update(this, delta);

          if (rollbackUpdate)
            this.event_rollbackUpdate(this, rollbackDelta);
        }

        return update ? delta : false;
      },
      reset: function(){
        this.update(defaults);
      },
      clear: function(){
        var data = {};
        for (var key in this.data)
          data[key] = undefined;
        return this.update(data);
      },
      commit: function(data){
        if (this.modified)
        {
          var rollbackData = this.modified;
          this.modified = null;
        }

        this.update(data);

        if (rollbackData)
          this.event_rollbackUpdate(this, rollbackData);
      },
      rollback: function(){
        if (this.state == STATE.PROCESSING)
        {
          ;;;entityWarn(this, 'Entity in processing state (entity.rollback() aborted)');
          return;
        }

        if (this.modified)
        {
          var rollbackData = this.modified;
          this.modified = null;
          this.update(rollbackData);

          this.event_rollbackUpdate(this, rollbackData);
        }
        this.setState(STATE.READY);
      },
      destroy: function(){
        // shortcut
        //var entityType = this.entityType;

        // unlink attached handlers
        for (var key in this.fieldHandlers_)
          if (this.fieldHandlers_[key])
            this.data[key].removeHandler(fieldDestroyHandlers[key], this);

        this.fieldHandlers_ = NULL_INFO;

        // delete from index
        if (this.__id__ != null)
          updateIndex(this, this.__id__, null);

        // inherit
        DataObject.prototype.destroy.call(this);

        // delete from all entity type list (is it right order?)
        all.event_datasetChanged(all, {
          deleted: [this]
        });

        // clear links
        this.data = NULL_INFO; 
        this.modified = null;
      }
    });
  };

  //
  // Misc
  //

  function isEntity(value){
    return value && value instanceof Entity;
  }

  //
  // export names
  //

  this.extend({
    isEntity: isEntity,

    NumericId: NumericId,
    NumberId: NumberId,
    IntId: IntId,
    StringId: StringId,
    Index: Index,
    CalculateField: CalculateField,

    EntityType: EntityTypeWrapper,
    Entity: Entity,
    BaseEntity: BaseEntity,

    EntitySetType: EntitySetWrapper,
    EntitySet: EntitySet,
    ReadOnlyEntitySet: ReadOnlyEntitySet,
    Collection: EntityCollection,
    Grouping: EntityGrouping
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/entity.js").call(basis.namespace("basis.entity"), basis.namespace("basis.entity"), basis.namespace("basis.entity").exports, this, __curLocation + "src/basis/entity.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/session.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');

 /**
  * @namespace basis.session
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var extend = Object.extend;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  /*
   *  Common
   */

  var EXCEPTION_SESSION_NOT_OPEN = 'No opened session';
  var EXCEPTION_SESSION_IS_FROZEN = 'Session is frozen';

  var DEBUG_MODE = basis.ua.Cookies.get('DEBUG_MODE');

  var activeSession;
  var timestamp;
  var freezeState = false;
  var sessions = {};

  function getSession(key){
    if (!sessions[key])
      sessions[key] = new Session(key);

    return sessions[key];
  }

  var genTimestamp = Date.now;

  /*
   *  SessionManager
   */

  var SessionManager = extend(new EventObject(), {
    event_sessionOpen: createEvent('sessionOpen'),
    event_sessionClose: createEvent('sessionClose'),
    event_sessionFreeze: createEvent('sessionFreeze'),
    event_sessionUnfreeze: createEvent('sessionUnfreeze'),

    isOpened: function(){
      return !!activeSession;
    },
    getTimestamp: function(){
      if (activeSession)
        return timestamp;
    },
    open: function(key, data){
      var session = getSession(key);

      if (activeSession === session)
      {
        // if session isn't changed, unfreeze active session only (if necessary)
        if (freezeState)
          this.unfreeze();

        return;
      }

      // close current session
      this.close();

      // set new active session
      activeSession = session;
      timestamp = genTimestamp();

      // update session data
      if (data)
        extend(session.data, data);

      ;;; if (DEBUG_MODE && typeof console != 'undefined') console.info('Session opened: ' + activeSession.key);

      // fire event
      this.event_sessionOpen(this);
    },
    close: function(){
      if (activeSession)
      {
        if (freezeState)
          this.unfreeze();

        ;;; if (DEBUG_MODE && typeof console != 'undefined') console.info('Session closed: ' + activeSession.key);

        this.event_sessionClose(this);

        activeSession = null;
        timestamp = null;
      }
    },
    freeze: function(){
      if (activeSession && !freezeState)
      {
        this.event_sessionFreeze(this);

        freezeState = true;
        timestamp = null;
      }
    },
    unfreeze: function(){
      if (activeSession && freezeState)
      {
        freezeState = false;
        timestamp = genTimestamp();

        this.event_sessionUnfreeze(this);
      }
    },
    storeData: function(key, data){
      if (activeSession)
        return activeSession.storeData(key, data);
      else
        throw new Error(EXCEPTION_SESSION_NOT_OPEN);
    },
    getData: function(key){
      if (activeSession)
        return activeSession.getData(key);
      else
        throw new Error(EXCEPTION_SESSION_NOT_OPEN);
    },
    destroy: function(){
      var keys = Object.keys(sessions);
      var key;
      while (key = keys.pop())
        sessions[key].destroy();

      EventObject.prototype.destroy.call(this);
    }
  });

  /*
   *  Session
   */

  var Session = Class(EventObject, {
    className: namespace + '.Session',

    event_destroy: function(){
      if (activeSession == this)
        SessionManager.close();
      delete sessions[this.key];
    },

    extendConstructor_: false,
    init: function(key){
      EventObject.prototype.init.call(this);

      this.key = key;
      this.data = {};

      ;;; if (DEBUG_MODE && typeof console != 'undefined') console.info('Session created: ' + key);
    },
    storeData: function(key, data){
      if (freezeState)
        throw new Error(EXCEPTION_SESSION_IS_FROZEN);

      return this.data[key] = data;
    },
    getData: function(key){
      if (freezeState)
        throw new Error(EXCEPTION_SESSION_IS_FROZEN);

      return this.data[key];
    },
    destroy: function(){
      EventObject.prototype.destroy.call(this);

      var keys = Object.keys(this.data);
      var key;
      while (key = keys.pop())
      {
        var data = this.data[key];
        if (data != null && typeof data.destroy == 'function')
          data.destroy();
        delete this.data[key];
      }
    }
  });


  //
  // export names
  //

  this.extend({
    SessionManager: SessionManager
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/session.js").call(basis.namespace("basis.session"), basis.namespace("basis.session"), basis.namespace("basis.session").exports, this, __curLocation + "src/basis/session.js", __curLocation + "src/basis/", basis, function(url){ return basis.resource(__curLocation + "src/basis/" + url) });

//
// src/basis/net/ajax.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.dom.event');
  basis.require('basis.data');


 /**
  * @namespace basis.net.ajax
  */

  var namespace = this.path;

  // import names
  var Class = basis.Class;
  var Event = basis.dom.event;

  var Browser = basis.ua;
  var Cookies = Browser.cookies;
  var Cleaner = basis.Cleaner;

  var TimeEventManager = basis.timer.TimeEventManager;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;


  //
  // Main part
  //

  // const

  /** @const */ var STATE_UNSENT = 0;
  /** @const */ var STATE_OPENED = 1;
  /** @const */ var STATE_HEADERS_RECEIVED = 2;
  /** @const */ var STATE_LOADING = 3;
  /** @const */ var STATE_DONE = 4;

  var IS_POST_REGEXP = /POST/i;

  // base 
  var DEFAULT_METHOD = 'GET';
  var DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded';

  // TODO: better debug info out
  var logOutput = typeof console != 'undefined' ? function(){ console.log(arguments) } : Function.$self;

  // Encode
  var CodePages = {};
  var Encode = {
    escape: function(string, codepage){
      var table = (CodePages[codepage] || codepage || CodePages.win1251).escape;
      return escape(String(string)).replace(/%u0([0-9a-f]{3})/gi, 
                                            function(match, code) { return table[code.toUpperCase()] || match });
    },
    unescape: function(string, codepage){
      var table = (CodePages[codepage] || codepage || CodePages.win1251).unescape;
      return unescape(String(string).replace(/%([0-9a-f]{2})/gi, 
                                             function(match, code){ return table[code.toUpperCase()] || match }));
    }
  };

  // Windows 1251
  (function(){
    var w1251 = CodePages.win1251 = { escape: {}, unescape: {} };
    w1251.escape['401']  = '%A8'; // `E' - e kratkoe
    w1251.unescape['A8'] = 0x401; // `E'
    w1251.escape['451']  = '%B8'; // `e'
    w1251.unescape['B8'] = 0x451; // `e'

    for (var i = 0xC0; i <= 0xFF; i++) // A-YAa-ya
    {
      w1251.unescape[i.toHex()] = String.fromCharCode(i + 0x350); 
      w1251.escape[(i + 0x350).toHex()] = '%' + i.toHex();
    }
  })();


 /**
  * @function createTransport
  * Creates transport constructor
  */
  var XHRSupport = 'native';
  var createXmlHttpRequest = function(){

    if (window.XMLHttpRequest)
      return function(){
        return new XMLHttpRequest();
      };

    var ActiveXObject = window.ActiveXObject;
    if (ActiveXObject)
    {
      var progID = [
        "MSXML2.XMLHTTP.6.0",
        "MSXML2.XMLHTTP.3.0",
        "MSXML2.XMLHTTP",
        "Microsoft.XMLHTTP"
      ];

      for (var i = 0, fn; XHRSupport = progID[i]; i++)
        try {
          if (new ActiveXObject(XHRSupport))
            return function(){
              return new ActiveXObject(XHRSupport);
            };
        } catch(e) {}
    }

    throw new Error(XHRSupport = 'Browser doesn\'t support for XMLHttpRequest!');

  }();

 /**
  * Sets transport request headers
  * @private
  */
  function setRequestHeaders(request, requestData){
    var headers = {
      'JS-Framework': 'Basis'
    };

    if (IS_POST_REGEXP.test(requestData.method)) 
    {
      if (requestData.contentType != 'multipart/form-data')
        headers['Content-Type'] = requestData.contentType + (requestData.encoding ? '\x3Bcharset=' + requestData.encoding : '');

      if (Browser.test('gecko'))
        headers['Connection'] = 'close';
    }
    else
      if (Browser.test('ie')) // disable IE caching
        headers['If-Modified-Since'] = 'Thu, 01 Jan 1970 00:00:00 GMT'; // new Date(0).toGMTString() is not correct here;
                                                                        // IE returns date string with no leading zero and IIS may parse
                                                                        // date wrong and response with code 400

    Object.iterate(Object.extend(headers, requestData.headers), function(key, value){
      if (value != null)
        this.setRequestHeader(key, value);
    }, request);
  };


 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var newState;
    var error;

    var xhr = this.xhr;
    if (!xhr)
      return;

    var proxy = this.proxy;

    if (typeof readyState != 'number')
      readyState = xhr.readyState;

    // BUGFIX: IE & Gecko fire OPEN readystate twice
    if (readyState == this.prevReadyState_)
      return;

    this.prevReadyState_ = readyState;

    ;;;if (this.debug) logOutput('State: (' + readyState + ') ' + ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'][readyState]);

    // dispatch self event
    proxy.event_readyStateChanged(this, readyState);

    if (readyState == STATE_DONE)
    {
      //TimeEventManager.remove(this, 'timeoutAbort');
      this.clearTimeout();
      // clean event handler
      xhr.onreadystatechange = Function.$undef;

      if (typeof xhr.responseText == 'unknown' || (!xhr.responseText && !xhr.getAllResponseHeaders()))
      {
        proxy.event_failure(this);
        proxy.event_abort(this);
        newState = STATE.ERROR;
      }
      else
      {
        this.processResponse();

        // dispatch events
        if (this.isSuccessful())
        {
          proxy.event_success(this);
          newState = STATE.READY;
        }
        else
        {
          this.processErrorResponse();

          proxy.event_failure(this, this.data.error);
          newState = STATE.ERROR;
        }
      }

      // dispatch complete event
      proxy.event_complete(this);
    }
    else
      newState = STATE.PROCESSING;

    // set new state
    this.setState(newState, this.data.error);
  };

  /**
   * @class Request
   */

  var AjaxRequest = Class(DataObject, {
    className: namespace + '.AjaxRequest',

    timeout:  30000, // 30 sec
    requestStartTime: 0,

    debug: false,
    proxy: null,

    event_stateChanged: function(object, oldState){
      DataObject.prototype.event_stateChanged.call(this, object, oldState);

      for (var i = 0; i < this.influence.length; i++)
        this.influence[i].setState(this.state, this.state.data);
    },

    init: function(config){
      DataObject.prototype.init.call(this, config);
      this.xhr = createXmlHttpRequest();
      this.influence = [];
    },

    setInfluence: function(influence){
      this.influence = Array.from(influence);
    },
    clearInfluence: function(){
      this.influence = [];
    },

    isIdle: function(){
      return this.xhr.readyState == STATE_DONE || this.xhr.readyState == STATE_UNSENT;
    },

    isSuccessful: function(){
      try {
        var status = this.xhr.status;
        return (status == undefined)
            || (status == 0)
            || (status >= 200 && status < 300);
      } catch(e) {
      }
      return false;
    },

    processResponse: function(){
      this.update({
        responseText: this.xhr.responseText,
        responseXML: this.xhr.responseXML,
        status: this.xhr.status
      });
    },

    processErrorResponse: function(){
      this.update({
        error: {
          code: 'SERVER_ERROR',
          msg: this.xhr.responseText
        }
      });
    },

    prepare: Function.$true,

    prepareRequestData: function(requestData){
      var params = Object.iterate(requestData.params , function(key, value){
        return (value == null) || (value && typeof value.toString == 'function' && value.toString() == null)
          ? null
          : key + '=' + String(value.toString()).replace(/[\%\=\&\<\>\s\+]/g, function(m){ var code = m.charCodeAt(0).toHex(); return '%' + (code.length < 2 ? '0' : '') + code })//Encode.escape(basis.crypt.UTF8.fromUTF16(value.toString()))
      }).filter(Function.$isNotNull).join('&');

      // prepare location & postBody
      if (IS_POST_REGEXP.test(requestData.method) && !requestData.postBody)
      {
        requestData.postBody = params || '';
        params = '';
      }

      if (params)
        requestData.url += (requestData.url.indexOf('?') == -1 ? '?' : '&') + params;

      return requestData;
    },

    doRequest: function(){
      /*if (!this.prepare())
        return;*/

      //this.requestData = requestData;
      this.send(this.prepareRequestData(this.requestData));
    },
    
    send: function(requestData){
      this.update({
        responseText: '',
        responseXML: '',
        status: '',
        error: ''
      });

      // create new XMLHTTPRequest instance for gecko browsers in asynchronous mode
      // object crash otherwise
      if (Browser.test('gecko1.8.1-') && requestData.asynchronous)
        this.xhr = createXmlHttpRequest();

      this.proxy.event_start(this);

      var xhr = this.xhr;

      this.prevReadyState_ = -1;

      if (requestData.asynchronous)
        // set ready state change handler
        xhr.onreadystatechange = readyStateChangeHandler.bind(this);
      else
        // catch state change for 'loading' in synchronous mode
        readyStateChangeHandler.call(this, STATE_UNSENT);

      // open XMLHttpRequest
      xhr.open(requestData.method, requestData.url, requestData.asynchronous);

      // set headers
      setRequestHeaders(xhr, requestData);

      // save transfer start point time & set timeout
      this.setTimeout(this.timeout);
      //TimeEventManager.add(this, 'timeoutAbort', Date.now() + this.timeout);

      // prepare post body
      var postBody = requestData.postBody;

      // BUGFIX: IE fixes for post body
      if (IS_POST_REGEXP.test(requestData.method) && Browser.test('ie9-'))
      {
        if (typeof postBody == 'object' && typeof postBody.documentElement != 'undefined' && typeof postBody.xml == 'string')
          // sending xmldocument content as string, otherwise IE override content-type header
          postBody = postBody.xml;                   
        else
          if (typeof postBody == 'string')
            // ie stop send postBody when found \r
            postBody = postBody.replace(/\r/g, ''); 
          else
            if (postBody == null || postBody == '')
              // IE doesn't accept null, undefined or '' post body
              postBody = '[No data]';      
      }

      // send data
      xhr.send(postBody);

      ;;;if (this.debug) logOutput('Request over, waiting for response');

      return true;
    },

    repeat: function(){
      if (this.requestData)
      {
        this.abort();
        this.send(this.requestData);
      }
    },

    abort: function()
    {
      if (!this.isIdle())
      {
        this.clearTimeout();
        //TimeEventManager.remove(this, 'timeoutAbort');
        //this.xhr.onreadystatechange = Function.$undef;
        this.xhr.abort();

        /*this.proxy.event_abort(this);
        this.proxy.event_complete(this);
        this.setState(STATE.READY);*/

        if (this.xhr.readyState != STATE_DONE)
          readyStateChangeHandler.call(this, STATE_DONE);
      }
    },

    setTimeout: function(timeout){
      if ('ontimeout' in this.xhr)
      {
        this.xhr.timeout = timeout;
        this.xhr.ontimeout = this.timeoutAbort.bind(this);
      }
      else
        TimeEventManager.add(this, 'timeoutAbort', Date.now() + timeout);
    },

    clearTimeout: function(){
      if ('ontimeout' in this.xhr == false)
        TimeEventManager.remove(this, 'timeoutAbort');
    },

    timeoutAbort: function(){
      this.proxy.event_timeout(this);
      this.abort();
    },

    destroy: function(){
      this.abort();

      this.clearInfluence();

      delete this.xhr;
      delete this.requestData;

      DataObject.prototype.destroy.call(this);
    }
  });



  //
  // ProxyDispatcher
  //

  var ProxyDispatcher = new EventObject({
    abort: function(){
      var result = Array.from(inprogressProxies);
      for (var i = 0; i < result.length; i++)
        result[i].abort();

      return result;
    }
  });

  var inprogressProxies = [];
  ProxyDispatcher.addHandler({
    start: function(request){
      inprogressProxies.add(request.proxy);
    },
    complete: function(request){
      inprogressProxies.remove(request.proxy);
    }
  });

 /**
  * @function createEvent
  */

  function createProxyEvent(eventName) {
    var event = createEvent(eventName);

    return function(){
      event.apply(ProxyDispatcher, arguments);

      if (this.service)
        event.apply(this.service, arguments);

      event.apply(this, arguments);
    }
  }

  /**
   * @class Proxy
   */


  var PROXY_REQUEST_HANDLER = {
    start: function(request){
      this.inprogressRequests.add(request);
    },
    complete: function(request){
      this.inprogressRequests.remove(request);
    }
  }

  var PROXY_POOL_LIMIT_HANDLER = {
    complete: function(request){
      var nextRequest = this.requestQueue.shift();
      if (nextRequest)
      {
        setTimeout(function(){
          nextRequest.doRequest();
        }, 0);
      }
    }
  }

  var Proxy = Class(EventObject, {
    className: namespace + '.Proxy',

    requests: null,
    poolLimit: null,

    poolHashGetter: Function.$true,

    event_start: createProxyEvent('start'),
    event_timeout: createProxyEvent('timeout'),
    event_abort: createProxyEvent('abort'),
    event_success: createProxyEvent('success'),
    event_failure: createProxyEvent('failure'),
    event_complete: createProxyEvent('complete'),

    init: function(config){
      this.requests = {};
      this.requestQueue = [];
      this.inprogressRequests = [];

      EventObject.prototype.init.call(this, config);

      // handlers
      /*if (this.callback)
        this.addHandler(this.callback, this);*/
      this.addHandler(PROXY_REQUEST_HANDLER, this);

      if (this.poolLimit)
        this.addHandler(PROXY_POOL_LIMIT_HANDLER, this);
    },

    getRequestByHash: function(requestHashId){
      if (!this.requests[requestHashId])
      {
        var request;
        //find idle transport
        for (var i in this.requests)
          if (this.requests[i].isIdle() && !this.requestQueue.has(this.requests[i]))
          {
            request = this.requests[i];
            delete this.requests[i];
          }

        this.requests[requestHashId] = request || new this.requestClass({ proxy: this });
      }

      return this.requests[requestHashId];
    },

    prepare: Function.$true,
    prepareRequestData: Function.$self,

    request: function(config){
      if (!this.prepare())
        return;

      var requestData = Object.slice(config);

      var requestData = this.prepareRequestData(requestData);
      var requestHashId = this.poolHashGetter(requestData);

      if (this.requests[requestHashId])
        this.requests[requestHashId].abort();

      var request = this.getRequestByHash(requestHashId);

      request.initData = Object.slice(config);
      request.requestData = requestData;
      request.setInfluence(requestData.influence);

      if (this.poolLimit && this.inprogressRequests.length >= this.poolLimit)
      {
        this.requestQueue.push(request);
        request.setState(STATE.PROCESSING);
      }
      else
        request.doRequest();

      return request;
    },

    abort: function(){
      for (var i = 0, request; request = this.inprogressRequests[i]; i++)
        request.abort();

      for (var i = 0, request; request = this.requestQueue[i]; i++)
        request.setState(STATE.ERROR);

      this.inprogressRequests = [];
      this.requestQueue = [];
    },

    stop: function(){
      if (!this.stopped)
      {
        this.stoppedRequests = this.inprogressRequests.concat(this.requestQueue);
        this.abort();
        this.stopped = true;
      }
    },

    resume: function(){
      if (this.stoppedRequests)
      {
        for (var i = 0, request; request = this.stoppedRequests[i]; i++)
          request.proxy.get(request.initData);

        this.stoppedRequests = [];
      }
      this.stopped = false;
    },

    /*repeat: function(){ 
      if (this.requestData)
        this.request(this.requestData);
    },*/

    destroy: function(){
      for (var i in this.requests)
        this.requests[i].destroy();

      delete this.requestData;
      delete this.requestQueue;

        
      EventObject.prototype.destroy.call(this);

      delete this.requests;
      Cleaner.remove(this);
    }
  });

  Proxy.createEvent = createProxyEvent;


 /**
  * @class AjaxProxy
  */
  var AjaxProxy = Class(Proxy, {
    className: namespace + '.AjaxProxy',

    requestClass: AjaxRequest,

    event_readyStateChanged: createProxyEvent('readyStateChanged'),

    // transport properties
    asynchronous: true,
    method: DEFAULT_METHOD,
    contentType: DEFAULT_CONTENT_TYPE,
    encoding: null,

    init: function(config){
      Proxy.prototype.init.call(this, config);

      this.requestHeaders = {};
      this.params = {};

      Cleaner.add(this);  // ???
    },

    // params methods
    setParam: function(name, value){
      this.params[name] = value;
    },
    setParams: function(params){
      this.clearParams();
      for (var key in params)
        this.setParam(key, params[key]);
    },
    removeParam: function(name){
      delete this.params[name];
    },
    clearParams: function(){
      for (var key in this.params)
        delete this.params[key];
    },

    prepareRequestData: function(requestData){
      var url = requestData.url || this.url;

      if (!url)
        throw new Error('URL is not defined');

      Object.extend(requestData, {
        url: url,
        method: this.method.toUpperCase(),
        contentType: this.contentType,
        encoding: this.encoding,
        asynchronous: this.asynchronous,
        headers: [this.requestHeaders, requestData.headers].merge(),
        postBody: requestData.postBody || this.postBody,
        params: [this.params, requestData.params].merge(),
        influence: requestData.influence
      });

      return requestData;
    },

    get: function(){
      this.request.apply(this, arguments);
    }
  });

  /**
   * @class Service
   */

  var SERVICE_HANDLER = {
    start: function(request){
      this.inprogressProxies.add(request.proxy);
    },
    complete: function(request){
      this.inprogressProxies.remove(request.proxy);
    }
  }


  var Service = Class(EventObject, {
    className: namespace + '.Service',

    proxyClass: AjaxProxy,
    requestClass: AjaxRequest,

    event_sessionOpen: createEvent('sessionOpen'),
    event_sessionClose: createEvent('sessionClose'),
    event_sessionFreeze: createEvent('sessionFreeze'),
    event_sessionUnfreeze: createEvent('sessionUnfreeze'),

    //event_service_failure: createEvent('service_failure'),
    isSecure: false,

    prepare: Function.$true,
    signature: Function.$undef,
    isSessionExpiredError: Function.$false,

    init: function(config){
      EventObject.prototype.init.call(this, config);

      this.inprogressProxies = [];

      this.proxyClass = Class(this.proxyClass, {
        service: this,

        needSignature: this.isSecure,

        event_failure: function(req){
          this.constructor.superClass_.prototype.event_failure.apply(this, arguments);

          if (this.needSignature && this.service.isSessionExpiredError(req))
          {
            this.service.freeze();
            this.service.stoppedProxies.push(this);
            this.stop();
          }
        },

        request: function(requestData){
          if (!this.service.prepare(this, requestData))
            return;

          if (this.needSignature && !this.service.sign(this))
            return;

          return this.constructor.superClass_.prototype.request.call(this, requestData);
        },

        requestClass: this.requestClass
      });

      this.addHandler(SERVICE_HANDLER, this);
    },

    sign: function(proxy){
      if (this.sessionKey)
      {
        this.signature(proxy, this.sessionData);
        return true;
      }
      else
      {
        ;;; console.warn('Request skipped. Service session is not opened');
        return false;
      }
    },

    openSession: function(sessionKey, sessionData){
      this.sessionKey = sessionKey;
      this.sessionData = sessionData;

      this.unfreeze();

      this.event_sessionOpen();
    },

    closeSession: function(){
      this.freeze();

      this.event_sessionClose();
    },

    freeze: function(){ 
      if (!this.sessionKey)
        return;

      this.oldSessionKey = this.sessionKey;
      this.sessionKey = null;
      this.sessionData = null;

      this.stoppedProxies = Array.from(this.inprogressProxies);

      for (var i = 0, proxy; proxy = this.inprogressProxies[i]; i++)
        proxy.stop();

      this.event_sessionFreeze();
    },

    unfreeze: function(){
      if (this.oldSessionKey == this.sessionKey && this.stoppedProxies)
      {
        for (var i = 0, proxy; proxy = this.stoppedProxies[i]; i++)
          proxy.resume();
      }

      this.event_sessionUnfreeze();
    },
    
    createProxy: function(config){
      return new this.proxyClass(config);
    },

    destroy: function(){
      delete this.inprogressProxies;
      delete this.stoppedProxies;
      delete this.sessionData;
      delete this.sessionKey;
      delete this.oldSessionKey;

      EventObject.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    Transport: AjaxProxy,
    TransportDispatcher: ProxyDispatcher,
    createEvent: createProxyEvent,

    Proxy: Proxy,
    AjaxProxy: AjaxProxy,
    AjaxRequest: AjaxRequest,
    ProxyDispatcher: ProxyDispatcher,
    Service: Service
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/net/ajax.js").call(basis.namespace("basis.net.ajax"), basis.namespace("basis.net.ajax"), basis.namespace("basis.net.ajax").exports, this, __curLocation + "src/basis/net/ajax.js", __curLocation + "src/basis/net/", basis, function(url){ return basis.resource(__curLocation + "src/basis/net/" + url) });

//
// src/basis/net/soap.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.dom');
  basis.require('basis.xml');
  basis.require('basis.net.ajax');


 /**
  * Interface for communication with SOAP services.
  *
  * @link ./demo/ajax/soap-simple.html
  * @link ./demo/ajax/soap-list.html
  *
  * @namespace basis.net.soap
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var nsAjax = basis.net.ajax;
  var XML = basis.xml;



  var QName = XML.QName;
  var addNamespace = XML.addNamespace;
  var XML2Object = XML.XML2Object;
  var Object2XML = XML.Object2XML;
  var createElementNS = XML.createElementNS;
  var NAMESPACE = XML.NAMESPACE;

  var AjaxProxy = nsAjax.AjaxProxy;
  var AjaxRequest = nsAjax.AjaxRequest;

  //
  // Main part
  //

  // CONST

  var SOAP_VERSION   = '1.1';
  var SOAP_PREFIX    = 'soap';
  var SOAP_NAMESPACE = String('http://schemas.xmlsoap.org/soap/envelope/');
  var SOAP_ENCODING  = String('http://schemas.xmlsoap.org/soap/encoding/');

  var SOAP_ENVELOPE = 'Envelope';
  var SOAP_HEADER   = 'Header';
  var SOAP_BODY     = 'Body';
  var SOAP_FAULT    = 'Fault';

  
 /**
  * @class SOAPRequest
  */ 

  var SOAPRequest = Class(AjaxRequest, {
    className: namespace + 'SOAPRequest',

    requestDataGetter: Function.$self,
    responseDataGetter: Function.$self,

    errorCodeGetter: function(node){
      return DOM.tag(node, 'code')[0];
    },
    errorMessageGetter: function(node){
      return DOM.tag(node, 'message')[0];
    },

    isSuccessful: function(){
      var xml = this.xhr.responseXML;
      return AjaxRequest.prototype.isSuccessful.call(this) && (xml !== undefined && xml.documentElement !== undefined);
    },

    init: function(config){
      AjaxRequest.prototype.init.call(this, config);
      this.requestEnvelope = new Envelope();
    },

    processResponse: Function.$undef,

    processErrorResponse: function(){
      this.parseResponseXML();

      var code;
      var message;

      if (this.responseEnvelope)
      {
        var element = this.responseEnvelope.element;
        var codeElement = this.errorCodeGetter(element);
        var messageElement = this.errorMessageGetter(element);

        code = codeElement ? codeElement.firstChild.nodeValue : 'UNKNOWN_ERROR';
        message = messageElement ? messageElement.firstChild.nodeValue : 'Unknown error';
      }
      
      this.update({
        error: {
          code: code || 'TRANSPORT_ERROR',
          message: message
        }
      });
    },

    parseResponseXML: function(){
      if (this.responseEnvelope == undefined)  // NOTE: responseEnvelope must be undefined before parse
      {
        var xml = this.xhr.responseXML;
        if (!xml || xml === undefined || xml.documentElement === undefined)
        {
          this.responseEnvelope = null;          
        }
        else
        {
          // convert to native document for IE
          if (xml.xml && window.DOMParser)
            xml = new DOMParser().parseFromString(xml.xml, "text/xml");

          this.responseEnvelope = new Envelope(xml.documentElement);
        }
      }
    },

    getRequestData: function(){
      var body = this.requestEnvelope.getBody();
      if (body)
        return this.requestDataGetter(body.getValue());
    },
    getResponseData: function(){
      this.parseResponseXML();
      var body = this.responseEnvelope && this.responseEnvelope.getBody();
      if (body)
        return this.responseDataGetter(body.getValue(this.mapping));
    },

    setMapping: function(mapping){
      this.mapping = mapping;
    },

    prepareRequestData: function(requestData){
      delete this.responseEnvelope;

      this.setMapping(requestData.mapping);

      //add SOAPAction header
      requestData.headers.SOAPAction = requestData.namespace + (!/\/$/.test(requestData.namespace) ? '/' : '') + requestData.methodName;

      //update Envelope
      if (requestData.soapHeader)
        this.requestEnvelope.getHeader(true).setValue(requestData.soapHeader, requestData.namespace);

      if (requestData.soapHeaderSections)
      {
        var header = this.requestEnvelope.getHeader(true); 
        for (var i in requestData.soapHeaderSections)
        {
          var section = requestData.soapHeaderSections[i];
          var ns = section.namespace || this.proxy.namespace;
          var data = section.data || section;

          header.setSection(new QName(i, ns), data);
        }
      }

      this.requestEnvelope.getBody(true).setValue(new QName(requestData.methodName, requestData.namespace), requestData.soapBody);

      requestData.postBody = this.requestEnvelope.document;

      return requestData;
    },
    destroy: function(){
      delete this.mapping;

      this.requestEnvelope.destroy();
      if (this.responseEnvelope)
        this.responseEnvelope.destroy();

      AjaxRequest.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var SOAPProxy = Class(AjaxProxy, {
    className: namespace + '.SOAPProxy',

    requestClass: SOAPRequest,

    method: 'POST',
    contentType: 'text/xml',
    encoding: 'utf-8',

    namespace: null,
    methodName: null,

    mapping: null,
    soapBody: null,
    soapHeader: null,
    soapHeaderSections: null,

    setSoapHeaderSection: function(name, data){
      this.soapHeaderSections[name] = data;
    },

    init: function(config){
      if (!this.soapHeaderSections)
        this.soapHeaderSections = {};

      AjaxProxy.prototype.init.call(this, config);
    },

    prepareRequestData: function(requestData){
      requestData = AjaxProxy.prototype.prepareRequestData.call(this, requestData);

      Object.extend(requestData, {
        namespace: this.namespace,
        methodName: this.methodName,
        soapBody: requestData.soapBody || this.soapBody,
        soapHeader: requestData.soapHeader || this.soapHeader,
        soapHeaderSections: [this.soapHeaderSections, requestData.soapHeaderSections].merge(),
        mapping: requestData.mapping || this.mapping
      });

      return requestData;
    }
  });

  //
  // SOAP Envelope
  //

 /**
  * @class
  */
  var Envelope = Class(null, {
    className: namespace + '.Envelope',

    header: null,
    body: null,

    init: function(element){

      if (!element)
      {
        element = XML.createDocument(SOAP_NAMESPACE, SOAP_PREFIX + ':' + SOAP_ENVELOPE).documentElement;
        addNamespace(element, 'xsd', NAMESPACE.XMLShema);
        addNamespace(element, 'xsi', NAMESPACE.XMLShemaInstance);
        if (XML.XMLNS.BAD_SUPPORT) // bad browsers don't set namespace (xmlns attribute)
          addNamespace(element, SOAP_PREFIX, SOAP_NAMESPACE);
      }

      this.document = element.ownerDocument;
      this.element = element;
      this.body = this.getBody(true);  // minOccure for body is 1
    },

    getElementByName: function(name){
      return XML.getElementsByTagNameNS(this.element, name, SOAP_NAMESPACE)[0];
    },

    // Header
    getHeader: function(forceCreate){
      var header = this.header;

      if (!header)
      {
        var headerElement = this.getElementByName('Header');

        if (headerElement || forceCreate)
        {
          header = this.header = new EnvelopeHeader(headerElement, this.document);

          if (!headerElement)
            this.element.insertBefore(header.element, this.element.firstChild);
        }
      }

      return header;
    },
    setHeaderSection: function(qname, data){
      this.getHeader(true).setSection(qname, data);
    },

    // Body
    getBody: function(forceCreate){
      var body = this.body;

      if (!body)
      {
        var bodyElement = this.getElementByName('Body');

        if (bodyElement || forceCreate)
        {
          body = this.body = new EnvelopeBody(bodyElement, this.document);

          if (!bodyElement)
            this.element.appendChild(body.element);
        }
      }

      return body;
    },

    destroy: function(){
      if (this.header)
      {
        this.header.destroy();
        delete this.header;
      }

      if (this.body)
      {
        this.body.destroy();
        delete this.body;
      }

      delete this.element;
      delete this.document;
    }
  });

  //
  // Envelope header
  //

 /**
  * @class
  */
  var EnvelopeHeader = Class(null, {
    className: namespace + '.EnvelopeHeader',

    init: function(element, document){
      this.element = element || createElementNS(document, 'Header', SOAP_NAMESPACE);
    },
    getValue: function(){
      return XML2Object(this.element);
    },
    setValue: function(data, namespace){
      DOM.clear(this.element);
      this.appendChild(data, namespace);
    },
    appendChild: function(data, namespace){
      if (data)
        for (var node in data)
        {
          var element = this.element.appendChild(Object2XML(this.element.ownerDocument, node, namespace, data[node]));
          if (XML.XMLNS.BAD_SUPPORT) // add namespace for bad browsers (xmlns attribute)
            addNamespace(element, '', namespace); 
        }
    },
    setSection: function(qname, data){
      var section = XML.getElementsByTagNameNS(this.element, qname, qname.namespace)[0];
      if (section)
        DOM.remove(section);
      this.appendChild(Function.wrapper(qname)(data), qname.namespace);
    }
  });

  //
  // Envelope body
  //

 /**
  * @class
  */
  var EnvelopeBody = Class(null, {
    className: namespace + '.EnvelopeBody',

    init: function(element, document){
      this.element = element || createElementNS(document, 'Body', SOAP_NAMESPACE);
    },
    getValue: function(mapping){
      return XML2Object(this.element, mapping);
    },
    setValue: function(method, data, encodingStyle){
      DOM.clear(this.element);
      this.appendChild(method, data, encodingStyle);
    },
    appendChild: function(method, data, encodingStyle){
      var child = Object2XML(this.element.ownerDocument, method, method.namespace, Function.$defined(data) ? data : {});

      this.element.appendChild(child);

      if (XML.XMLNS.BAD_SUPPORT) // add namespace for bad browsers (xmlns attribute)
        addNamespace(child.element, '', method.namespace); 

      if (encodingStyle)
        XML.setAttributeNodeNS(child, XML.createAttributeNS(document, 'encodingStyle', SOAP_ENCODING, encodingStyle));
    }
  });


  //
  // export names
  //

  this.extend({
    /*Service: Service,
    ServiceCall: ServiceCall,
    ServiceCallTransport: ServiceCallTransport,*/

    SOAPProxy: SOAPProxy,
    SOAPRequest: SOAPRequest,

    Envelope: Envelope,
    EnvelopeHeader: EnvelopeHeader,
    EnvelopeBody: EnvelopeBody
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/net/soap.js").call(basis.namespace("basis.net.soap"), basis.namespace("basis.net.soap"), basis.namespace("basis.net.soap").exports, this, __curLocation + "src/basis/net/soap.js", __curLocation + "src/basis/net/", basis, function(url){ return basis.resource(__curLocation + "src/basis/net/" + url) });

//
// src/basis/ui/button.js
//

new Function(__wrapArgs, function(){

/**
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

  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.html');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = this.path;


  //
  // import names
  //

  var getter = Function.getter;

  var Class = basis.Class;
  var DOM = basis.dom;

  var UINode = basis.ui.Node;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

 /**
  * @class
  */
  var Button = Class(UINode, {
    className: namespace + '.Button',

   /**
    * @inheritDoc
    */
    event_select: function(){
      UINode.prototype.event_select.call(this);
      DOM.focus(this.element);
    },

   /**
    * @inheritDoc
    */
    event_disable: function(){
      UINode.prototype.event_disable.call(this);
      this.tmpl.buttonElement.disabled = true;
    },

   /**
    * @inheritDoc
    */
    event_enable: function(){
      UINode.prototype.event_enable.call(this);
      this.tmpl.buttonElement.disabled = false;
    },

   /**
    * Button caption text.
    * @type {string}
    */
    caption: '[no caption]',

   /**
    * Group indificator, using for grouping.
    * @type {any}
    */
    groupId: 0,

   /**
    * Name of button. Using by parent to fetch child button by name.
    * @type {string}
    */
    name: null,

   /**
    * @inheritDoc
    */
    template:
      '<button{buttonElement} class="Basis-Button {selected} {disabled}" event-click="click">' +
        '<span class="Basis-Button-Back"/>' +
        '<span class="Basis-Button-Caption">' +
          '{caption}' +
        '</span>' +
      '</button>',

   /**
    * @inheritDoc
    */
    binding: {
      caption: 'caption'
    },

   /**
    * @inheritDoc
    */
    action: {
      click: function(event){
        if (!this.isDisabled())
          this.click();
      }
    },

   /**
    * Actions on click.
    */
    click: function(){},

   /**
    * @inheritDoc
    */
    init: function(config){
      ;;;if (typeof this.handler == 'function' && typeof console != 'undefined') console.warn(namespace + '.Button: this.handler must be an object. Use this.click instead.')

      // inherit
      UINode.prototype.init.call(this, config);
    },
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.tmpl.set('caption', this.binding.caption.getter(this));
    }
  });


 /**
  * @class
  */
  var ButtonPanel = Class(UIControl, {
    className: namespace + '.ButtonPanel',

    template:
      '<div class="Basis-ButtonPanel {disabled}">' +
        '<div{childNodesElement|content} class="Basis-ButtonPanel-Content"/>' +
      '</div>',

    childClass: Button,

    groupingClass: {
      className: namespace + '.ButtonGroupingNode',

      groupGetter: function(button){
        return button.groupId || -button.eventObjectId;
      },

      childClass: {
        className: namespace + '.ButtonPartitionNode',

        template:
          '<div class="Basis-ButtonGroup"/>'
      }
    },

    grouping: {}, // use grouping by default

   /**
    * Fetch button by name.
    * @param {string} name Name value of button.
    * @return {basis.ui.button.Button}
    */
    getButtonByName: function(name){
      return this.childNodes.search(name, getter('name'));
    }
  });


  //
  // export names
  //

  this.extend({
    Button: Button,
    ButtonPanel: ButtonPanel
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/button.js").call(basis.namespace("basis.ui.button"), basis.namespace("basis.ui.button"), basis.namespace("basis.ui.button").exports, this, __curLocation + "src/basis/ui/button.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/label.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.html');
  basis.require('basis.dom');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/label.html
  * @namespace basis.ui.label
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var createEvent = basis.event.create;
  var events = basis.event.events;
  var LISTEN = basis.event.LISTEN;

  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var STATE = basis.data.STATE;
  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var UINode = basis.ui.Node;


  //
  // main part
  //

  var stateTemplate = '<div class="Basis-Label Basis-Label-State {selected} {disabled}"/>';
  var processingTemplate = '<div class="Basis-Label Basis-Label-Processing {selected} {disabled}"/>';
  var errorTemplate = '<div class="Basis-Label Basis-Label-Error {selected} {disabled}"/>';
  var countTemplate = '<div class="Basis-Label Basis-Label-Count {selected} {disabled}">{count}</div>';
  var emptyTemplate = '<div class="Basis-Label Basis-Label-Empty {selected} {disabled}"/>';

  //
  // NodeLabel
  //

  var condChangedTrigger = function(){
    this.event_condChanged(this);
  };

 /**
  * Base class for all labels.
  * @class
  */
  var NodeLabel = Class(UINode, {
    className: namespace + '.NodeLabel',

    template: '<div class="Basis-Label {selected} {disabled}"/>',
    content: null,

    visibilityGetter: Function.$true,
    visible: null,

    insertPoint: function(owner){
      return owner.tmpl.content || owner.element;
    },

    event_visibilityChanged: createEvent('visibilityChanged', 'node') && function(node){
      events.visibilityChanged.call(this, node);

      if (this.insertPoint)
      {
        if (this.visible)
        {
          var insertPoint = typeof this.insertPoint == 'function' ? this.insertPoint(this.owner) : this.insertPoint;
          var params = Array.isArray(insertPoint) ? insertPoint : [insertPoint];
          params.splice(1, 0, this.element);
          DOM.insert.apply(null, params);
        }
        else
          DOM.remove(this.element);
      }
      else
        DOM.display(this.element, this.visible);
    },

    event_condChanged: createEvent('condChanged', 'node') && function(node){
      events.condChanged.call(this, node);

      var visible = this.owner ? !!this.visibilityGetter(this.owner) : false;

      if (this.visible !== visible)
      {
        this.visible = visible;
        this.event_visibilityChanged(this);
      }
    },

    event_ownerChanged: function(node, oldOwner){
      UINode.prototype.event_ownerChanged.call(this, node, oldOwner);

      condChangedTrigger.call(this);
      //this.event_condChanged.call(this)
    }
  });

  //
  // State labels
  //

 /**
  * Label that reacts on master node state changes.
  * @class
  */
  var State = Class(NodeLabel, {
    className: namespace + '.State',

    template: stateTemplate,

    listen: {
      owner: {
        stateChanged: condChangedTrigger
      }
    }
  });

 /**
  * Label that shows only when delegate node in processing state.
  * @class
  */
  var Processing = Class(State, {
    className: namespace + '.Processing',

    template: processingTemplate,
    content: 'Processing...',

    visibilityGetter: function(owner){
      return owner.state == STATE.PROCESSING;
    }
  });

 /**
  * @class
  */
  var Error = Class(State, {
    className: namespace + '.Error',

    template: errorTemplate,
    content: 'Error',

    visibilityGetter: function(owner){
      return owner.state == STATE.ERROR;
    }
  })

  //
  // Node dataSource labels
  //

  function syncOwnerDataSource(){
    var newOwnerDataSource = this.owner && this.owner.dataSource;

    var oldOwnerDataSource = this.ownerDataSource;
    if (oldOwnerDataSource != newOwnerDataSource)
    {
      this.ownerDataSource = newOwnerDataSource;
      this.event_ownerDataSourceChanged(this, oldOwnerDataSource);
    }
  }

  LISTEN.add('ownerDataSource', 'ownerDataSourceChanged');

 /**
  * @class
  */
  var DataSourceLabel = Class(NodeLabel, {
    className: namespace + '.DataSourceLabel',

    template: stateTemplate,

    listen: {
      owner: {
        dataSourceChanged: function(){
          syncOwnerDataSource.call(this);
        }
      }
    },

    ownerDataSource: null,

    event_ownerChanged: function(node, oldOwner){
      UINode.prototype.event_ownerChanged.call(this, node, oldOwner);

      syncOwnerDataSource.call(this);
    },

    event_ownerDataSourceChanged: createEvent('ownerDataSourceChanged', 'node', 'oldOwnerDataSource') && function(node, oldOwnerDataSource){
      events.ownerDataSourceChanged.call(this, node, oldOwnerDataSource);

      condChangedTrigger.call(this);
    }
  });

 /**
  * @class
  */
  var DataSourceState = Class(DataSourceLabel, {
    className: namespace + '.DataSourceState',

    template: stateTemplate,

    listen: {
      ownerDataSource: {
        stateChanged: condChangedTrigger
      }
    }
  });

 /**
  * Label that shows only when owner's dataSource in processing state.
  * @class
  */
  var DataSourceProcessing = Class(DataSourceState, {
    className: namespace + '.DataSourceProcessing',

    content: 'Processing...',
    template: processingTemplate,

    visibilityGetter: function(owner){
      return owner.dataSource && owner.dataSource.state == STATE.PROCESSING;
    }
  });

 /**
  * Label that shows only when owner's dataSource in error state.
  * @class
  */
  var DataSourceError = Class(DataSourceState, {
    className: namespace + '.DataSourceProcessing',

    content: 'Error',
    template: errorTemplate,

    visibilityGetter: function(owner){
      return owner.dataSource && owner.dataSource.state == STATE.ERROR;
    }
  });

 /**
  * @class
  */
  var DataSourceItemCount = Class(DataSourceLabel, {
    className: namespace + '.DataSourceItemCount',

    template: countTemplate,
    listen: {
      ownerDataSource: {
        stateChanged: condChangedTrigger,
        datasetChanged: condChangedTrigger
      }
    }
  });

 /**
  * @class
  */
  var DataSourceEmpty = Class(DataSourceItemCount, {
    className: namespace + '.DataSourceEmpty',

    template: emptyTemplate,
    content: 'Empty',

    visibilityGetter: function(owner){ 
      return owner.dataSource && owner.dataSource.state == STATE.READY && !owner.dataSource.itemCount;
    }
  });


  //
  // Child nodes count labels
  //

 /**
  * @class
  */
  var ChildNodesCount = Class(NodeLabel, {
    className: namespace + '.ChildCount',

    template: countTemplate,
    listen: {
      owner: {
        stateChanged: condChangedTrigger,
        childNodesModified: condChangedTrigger
      }
    }
  });

 /**
  * Label that shows only when owner has no child nodes.
  * @class
  */
  var Empty = Class(ChildNodesCount, {
    className: namespace + '.Empty',

    template: emptyTemplate,
    content: 'Empty',

    visibilityGetter: function(owner){ 
      return owner.state == STATE.READY && !owner.firstChild;
    }
  });


  //
  // export names
  //

  this.extend({
    // Owner
    NodeLabel: NodeLabel,

    // Owner state
    State: State,
    Processing: Processing,
    Error: Error,

    // Owner dataSource
    DataSourceLabel: DataSourceLabel,

    // Owner dataSource state
    DataSourceState: DataSourceState,
    DataSourceProcessing: DataSourceProcessing,
    DataSourceError: DataSourceError,

    // Owner dataSource items
    DataSourceItemCount: DataSourceItemCount,
    DataSourceEmpty: DataSourceEmpty,

    // Owner childNodes
    ChildNodesCount: ChildNodesCount,
    Empty: Empty
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/label.js").call(basis.namespace("basis.ui.label"), basis.namespace("basis.ui.label"), basis.namespace("basis.ui.label").exports, this, __curLocation + "src/basis/ui/label.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/tree.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.ui');


 /**
  * This namespace contains {basis.ui.tree.Tree} control class and it's
  * child nodes classes. There are two base child classes for tree
  * {basis.ui.tree.Node} and {basis.ui.tree.Folder}.
  *
  * The main difference between this classes is that
  * {basis.ui.tree.Node} has abstact {basis.ui.tree.Node#expand}
  * and {basis.ui.tree.Node#collapse} methods and can't be
  * collapsed/expanded, but {basis.ui.tree.Folder} can.
  *
  * Also this namespace has two additional classes for child nodes grouping
  * {basis.ui.tree.GroupingNode} and
  * {basis.ui.tree.PartitionNode}.
  *
  * Most part of component logic implemented in {basis.dom.wrapper} namespace,
  * and this one just contains templates and collapse/expand implementation.
  *
  * @see ./test/speed-tree.html
  * @see ./demo/data/entity.html
  *
  * @namespace basis.ui.tree
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var classList = basis.cssom.classList;
  var getter = Function.getter;
  var createEvent = basis.event.create;

  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // main part
  //

  function expand(node){
    if (typeof node.expand == 'function')
      node.expand();
  }

  function collapse(node){
    if (typeof node.collapse == 'function')
      node.collapse();
  }

  var ExpandCollapseMixin = {
   /**
    * Expand all descendant nodes.
    */
    expandAll: function(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, expand);
    },

   /**
    * Collapse all descendant nodes.
    */
    collapseAll: function(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, collapse);
    },

    expand: Function(),
    collapse: Function(),
    toggle: Function()
  };

 /**
  * Here is an example for tree recursive childFactory
  */
  /*function treeChildFactory(config){
    if (config.childNodes)
      return new Folder(Object.complete({ childFactory: this.childFactory }, config));
    else
      return new Node(config);
  }*/

 /**
  * @class
  */
  var PartitionNode = Class(UIPartitionNode, {
    className: namespace + '.PartitionNode',
    template: 
      '<li class="Basis-TreePartitionNode">' + 
        '<div class="Basis-TreePartitionNode-Title">' +
          '<span>{title}</span>' +
        '</div>' +
        '<ul{childNodesElement} class="Basis-TreePartitionNode-Content"/>' +
      '</li>'
  });

 /**
  * @class
  */
  var GroupingNode = Class(UIGroupingNode, {
    className: namespace + '.GroupingNode',
    childClass: PartitionNode
  });

 /**
  * Base child class for {basis.ui.tree.Tree}
  * @class
  */
  var Node = Class(UIContainer, ExpandCollapseMixin, {
    className: namespace + '.Node',

   /**
    * @inheritDoc
    */
    childClass: null,

   /**
    * @inheritDoc
    */
    childFactory: null,

    event_collapse: createEvent('collapse'),
    event_expand: createEvent('expand'),

   /**
    * Template for node element. 
    * @type {basis.template.Template}
    * @private
    */
    template: 
      '<li class="Basis-TreeNode">' +
        '<div{content} class="Basis-TreeNode-Title {selected} {disabled}">' +
          '<span{titleElement} class="Basis-TreeNode-Caption" event-click="select">' +
            '{title}' +
          '</span>' +
        '</div>' +
      '</li>',

    binding: {
      title: 'data:title || "[no title]"',
      collapsed: {
        events: 'expand collapse',
        getter: function(node){
          return node.collapsed ? 'collapsed' : '';
        }
      }
    },

   /**
    * @inheritDoc
    */
    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select(Event(event).ctrlKey);
      },
      toggle: function(event){
        this.toggle();
      }
    }
  });

 /**
  * Base child class for {basis.ui.tree.Tree} that can has children.
  * @class
  * @extends {basis.ui.tree.Node}
  */
  var Folder = Class(Node, {
    className: namespace + '.Folder',

   /**
    * @inheritDoc
    */
    childClass: Node,

   /**
    * @inheritDoc
    */
    groupingClass: GroupingNode,

   /**
    * Template for node element. 
    * @type {basis.template.Template}
    * @private
    */
    template: 
      '<li class="Basis-TreeNode {collapsed}">' +
        '<div{content} class="Basis-TreeNode-Title Basis-TreeNode-CanHaveChildren {selected} {disabled}">' +
          '<div class="Basis-TreeNode-Expander" event-click="toggle"/>' +
          '<span{titleElement} class="Basis-TreeNode-Caption" event-click="select">' +
            '{title}' +
          '</span>' +
        '</div>' + 
        '<ul{childNodesElement} class="Basis-TreeNode-Content"/>' + 
      '</li>',

   /**
    * @type {boolean}
    */
    collapsable: true,

   /**
    * @type {boolean}
    */
    collapsed: false,

   /**
    * @param {Object} config
    * @config {boolean} collapsable
    * @config {boolean} collapsed
    * @constructor
    */
    init: function(config){
      // inherit
      Node.prototype.init.call(this, config);

      if (this.collapsed && this.collapsable)
        this.event_collapse();
    },

   /**
    * Makes child nodes visible.
    * @return {boolean} Returns true if node was expanded.
    */
    expand: function(){
      if (this.collapsed)
      {
        this.collapsed = false;
        this.event_expand();

        return true;
      }
    },

   /**
    * Makes child nodes invisible.
    * @return {boolean} Returns true if node was collpased.
    */
    collapse: function(){
      if (!this.collapsed && this.collapsable)
      {
        this.collapsed = true;
        this.event_collapse();

        return true;
      }
    },

   /**
    * Inverts node collapsed state. If node was collapsed expand it, otherwise collapse it.
    */
    toggle: function(){
      this.collapsed ? this.expand() : this.collapse();
    }
  });

 /**
  * @class
  */
  var Tree = Class(UIControl, ExpandCollapseMixin, {
    className: namespace + '.Tree',

   /**
    * Template for node element. 
    * @type {basis.template.Template}
    * @private
    */
    template:
      '<ul class="Basis-Tree {disabled}"/>',

   /**
    * @inheritDoc
    */
    childClass: Node,

   /**
    * @inheritDoc
    */
    groupingClass: GroupingNode
  });


  //
  // export names
  //

  this.extend({
    Tree: Tree,
    Node: Node,
    Folder: Folder,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/tree.js").call(basis.namespace("basis.ui.tree"), basis.namespace("basis.ui.tree"), basis.namespace("basis.ui.tree").exports, this, __curLocation + "src/basis/ui/tree.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/popup.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.layout');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/popup.html
  * @namespace basis.ui.popup
  */
  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var Cleaner = basis.Cleaner;

  var nsWrapper = basis.dom.wrapper;
  var nsLayout = basis.layout;

  var createEvent = basis.event.create;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // main part
  //

  var LEFT = 'LEFT';
  var RIGHT = 'RIGHT';
  var TOP = 'TOP';
  var BOTTOM = 'BOTTOM';
  var CENTER = 'CENTER';

  var ORIENTATION = {
    VERTICAL: 'V',
    HORIZONTAL: 'H'
  };

  var ROTATE_MATRIX = String('LTRTRBLBLCCTRCCBCCCCCCCC');

  var LETTER_TO_SIDE = {
    L: LEFT,
    R: RIGHT,
    T: TOP,
    B: BOTTOM,
    C: CENTER
  };

  var FLIP = {
    LEFT: RIGHT,
    RIGHT: LEFT,
    TOP: BOTTOM,
    BOTTOM: TOP,
    CENTER: CENTER
  };

  var THREAD_HANDLER = {
    finish: function(){
      if (!this.visible)
      {
        DOM.remove(this.element);
        this.event_cleanup(this);
      }
    }
  };

 /**
  * @class
  */
  var Popup = Class(UIContainer, {
    className: namespace + '.Popup',

    template: 
      '<div class="Basis-Popup {selected} {disabled}">' +
        '<div{closeButton} class="Basis-Popup-CloseButton"><span>Close</span></div>' +
        '<div{content|childNodesElement} class="Basis-Popup-Content"/>' +
      '</div>',

    event_beforeShow: createEvent('beforeShow'),
    event_show: createEvent('show'),
    event_hide: createEvent('hide'),
    event_realign: createEvent('realign'),
    event_cleanup: createEvent('cleanup'),
    event_layoutChanged: createEvent('layoutChanged', 'oldOrientation', 'oldDir') && function(oldOrientation, oldDir){
      var oldClass = (oldOrientation + '-' + oldDir.qw().slice(2, 4).join('-')).toLowerCase();
      var newClass = (this.orientation + '-' + this.dir.qw().slice(2, 4).join('-')).toLowerCase();
      classList(this.element).replace(oldClass, newClass, this.cssLayoutPrefix)
    },

    visible: false,
    autorotate: false,

    dir: '',
    defaultDir: [RIGHT, BOTTOM, RIGHT, TOP].join(' '),
    orientation: ORIENTATION.VERTICAL,

    hideOnAnyClick: true,
    hideOnKey: false,
    ignoreClickFor: null,

    cssLayoutPrefix: 'popup-',

    init: function(config){
      UIContainer.prototype.init.call(this, config);

      // add generic rule
      this.cssRule = cssom.uniqueRule(this.element);

      // 
      this.ignoreClickFor = Array.from(this.ignoreClickFor);

      if (this.dir)
        this.defaultDir = this.dir.toUpperCase();

      this.setLayout(this.defaultDir, this.orientation);
        
      if (this.thread)
        this.thread.addHandler(THREAD_HANDLER, this);

      //Event.addHandler(this.element, 'click', this.click, this);
      //this.addEventListener('click', 'click', true);

      Cleaner.add(this);
    },
    setLayout: function(dir, orientation, noRealign){
      var oldDir = this.dir;
      var oldOrientation = this.orientation;

      if (typeof dir == 'string')
        this.dir = dir.toUpperCase();

      if (typeof orientation == 'string')
        this.orientation = orientation;

      if (oldDir != this.dir || oldOrientation != this.orientation)
      {
        this.event_layoutChanged(oldOrientation, oldDir);
        if (!noRealign)
          this.realign();
      }
    },
    flip: function(orientation){
      var dir = this.dir.qw();
      var v = orientation == ORIENTATION.VERTICAL;

      dir[0 + v] = FLIP[dir[0 + v]];
      dir[2 + v] = FLIP[dir[2 + v]];
      
      this.setLayout(dir.join(' '));
    },
    rotate: function(offset){
      var dir = this.dir.qw();
      offset = ((offset % 4) + 4) % 4;

      var result = new Array();

      if (!offset)
        return dir;

      // point
      var a = dir[0].charAt(0);
      var b = dir[1].charAt(0);
      var idx = ROTATE_MATRIX.indexOf(a + b) >> 1;

      var index = ((idx & 0xFC) + (((idx & 0x03) + offset) & 0x03)) << 1;

      result.push(
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index)],
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index + 1)]
      );

      // direction
      var a = dir[2].charAt(0);
      var b = dir[3].charAt(0);
      var idx = ROTATE_MATRIX.indexOf(a + b) >> 1;

      offset = (a != 'C' && b != 'C') && ((dir[0] == dir[2]) != (dir[1] == dir[3])) ? -offset + 4 : offset;
      var index = ((idx & 0xFC) + (((idx & 0x03) + offset) & 0x03)) << 1;

      result.push(
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index)],
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index + 1)]
      );

      return result;
    },
    isFitToViewport: function(dir){
      if (this.visible && this.relElement)
      {
        var box = new nsLayout.Box(this.relElement, false, this.element.offsetParent);
        var viewport = new nsLayout.Viewport(this.element.offsetParent);
        var width  = this.element.offsetWidth;
        var height = this.element.offsetHeight;

        dir = String(dir || this.dir).toUpperCase().qw();

        var pointX = dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()];
        var pointY = dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()];

        if (
            (dir[2] != LEFT) * (pointX < (width >> (dir[2] == CENTER)))
            ||
            (dir[2] != RIGHT) * ((viewport.width - pointX) < (width >> (dir[2] == CENTER)))
           )
          return false;

        if (
            (dir[3] != TOP) * (pointY < (height >> (dir[3] == CENTER)))
            ||
            (dir[3] != BOTTOM) * ((viewport.height - pointY) < (height >> (dir[3] == CENTER)))
           )
          return false;

        return {
          x: pointX,
          y: pointY
        }
      }
    },
    realign: function(){
      if (this.visible && this.relElement)
      {
        var dir = this.dir.qw();

        var point;
        var rotateOffset = 0;
        var curDir = dir;
        var dirH = dir[2];
        var dirV = dir[3];
        var maxRotate = typeof this.autorotate == 'number' || !this.autorotate.length ? 3 : this.autorotate.length;
        while (this.autorotate && rotateOffset <= maxRotate)
        {
          if (point = this.isFitToViewport(curDir.join(' ')))
          {
            dirH = curDir[2];
            dirV = curDir[3];
            this.setLayout(curDir.join(' '), null, true);
            break;
          }

          if (rotateOffset == maxRotate)
            break;

          if (Array.isArray(this.autorotate))
          {
            var rotate = this.autorotate[rotateOffset++];

            if (typeof rotate == 'string')
              curDir = rotate.toUpperCase().split(' ');
            else
              curDir = this.rotate(rotate);
          }
          else
            curDir = this.rotate(++rotateOffset * this.autorotate);
        }

        if (!point)
        {
          var box = new nsLayout.Box(this.relElement, false, this.element.offsetParent);
          point = {
            x: dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()],
            y: dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()]
          };
        }

        var offsetParentBox = new nsLayout.Box(this.element.offsetParent);

        var style = {
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto'
        };

        switch (dirH){
          case LEFT:
            style.left = point.x + 'px';
            break;
          case CENTER:
            style.left = Math.round(point.x - this.element.offsetWidth/2) + 'px';
            break;
          case RIGHT:
            style.right = (offsetParentBox.width - point.x) + 'px';
            break;
        }

        switch (dirV){
          case TOP:
            style.top = point.y + 'px';
            break;
          case CENTER:
            style.top = Math.round(point.y - this.element.offsetHeight/2) + 'px';
            break;
          case BOTTOM:
            style.bottom = (offsetParentBox.height - point.y) + 'px';
            break;
        }

        this.cssRule.setStyle(style);
        /*this.cssRule.setStyle({
          right:  'auto',
          left:   parseInt(point.x - (dirH != LEFT) * (this.element.offsetWidth >> (dirH == CENTER))) + 'px',
          bottom: 'auto',
          top:    parseInt(point.y - (dirV != TOP) * (this.element.offsetHeight >> (dirV == CENTER))) + 'px'
        });*/

        this.event_realign();
      }
    },
    show: function(relElement, dir, orientation){
      // assign new offset element
      this.relElement = DOM.get(relElement) || this.relElement;

      // set up direction and orientation
      this.setLayout(dir || this.defaultDir, orientation)

      // if not visible yet, make popup visible
      if (!this.visible)
      {
        // error on relElement no assigned
        if (!this.relElement)
        {
          ;;;if (typeof console != 'undefined') console.warn('Popup.show(): relElement missed');
          return;
        }

        // make element invisible & insert element into DOM
        classList(this.element).remove('pre-transition');
        DOM.visibility(this.element, false);

        popupManager.appendChild(this);

        // dispatch `beforeShow` event, there we can fill popup with content
        this.event_beforeShow();
        //this.dispatch.apply(this, ['beforeShow'].concat(args));

        // set visible flag to TRUE
        this.visible = true;

        // realign position and make it visible
        this.realign();
        if (this.thread) this.thread.start(1);
        DOM.visibility(this.element, true);
        classList(this.element).add('pre-transition');

        // dispatch `show` event, there we can set focus for elements etc.
        //this.dispatch.apply(this, ['show'].concat(args));
        this.event_show();
      }
      else
        this.realign();
    },
    hide: function(){
      if (this.visible)
      {
        // remove from DOM
        if (DOM.parentOf(document.body, this.element))
        {
          if (this.thread)
            this.thread.start(1);
          else
          {
            DOM.remove(this.element);
            this.event_cleanup(this);
          }
        }

        // set visible flag to FALSE
        this.visible = false;
        if (this.parentNode)
          popupManager.removeChild(this);

        // dispatch event
        this.event_hide();
      }
    },
    hideAll: function(){
      popupManager.clear();
    },
    destroy: function(){
      if (this.thread)
      {
        this.thread.removeHandler(THREAD_HANDLER, this);
        this.thread = null;
      }

      this.hide();

      UIContainer.prototype.destroy.call(this);

      this.cssRule.destroy();
      this.cssRule = null;

      Cleaner.remove(this);
    }
  });

 /**
  * @class
  */
  var Balloon = Class(Popup, {
    className: namespace + '.Balloon',

    cssLayoutPrefix: 'mode-',

    template: 
      '<div class="Basis-Balloon {selected} {disabled}" event-click="click">' +
        '<div class="Basis-Balloon-Canvas">' +
          '<div class="corner-left-top"/>' +
          '<div class="corner-right-top"/>' +
          '<div class="side-top"/>' +
          '<div class="side-left"/>' +
          '<div class="side-right"/>' +
          '<div class="content"/>' +
          '<div class="corner-left-bottom"/>' +
          '<div class="corner-right-bottom"/>' +
          '<div class="side-bottom"/>' +
          '<div class="tail"/>' +
        '</div>' +
        '<div class="Basis-Balloon-Layout">' +
          '<div{closeButton} class="Basis-Balloon-CloseButton"><span>Close</span></div>' +
          '<div{content|childNodesElement} class="Basis-Balloon-Content"/>' +
        '</div>' +
      '</div>'
  });


  //
  // Menu
  //

 /**
  * @class
  */
  var MenuItem = Class(UIContainer, {
    className: namespace + '.MenuItem',

    childClass: Class.SELF,

    template:
      '<div class="Basis-Menu-Item" event-click="click">' +
        '<a{content} class="{selected} {disabled}" href="#"><span>{caption}</span></a>' +
      '</div>'/* +
      '<div{childNodesElement}/>'*/,

    binding: {
      caption: 'caption'
    },

    /*templateUpdate: function(tmpl){
      if (tmpl.captionText)
        tmpl.captionText.nodeValue = this.captionGetter(this);
    },*/

    action: {
      click: function(event){
        this.click();
        Event.kill(event); // prevent default for <a>
      }
    },

    event_childNodesModified: function(node, delta){
      classList(this.element).bool('hasSubItems', this.firstChild);

      UIContainer.prototype.event_childNodesModified.call(this, node, delta);
    },

    groupId: 0,
    caption: '[untitled]',
    //captionGetter: getter('caption'),

    handler: null,
    defaultHandler: function(node){
      if (this.parentNode)
        this.parentNode.defaultHandler(node);
    },

    setCaption: function(newCaption){
      this.caption = newCaption;
      this.templateUpdate(this.tmpl);
    },
    click: function(){
      if (!this.isDisabled() && !(this instanceof MenuItemSet))
      {
        if (this.handler)
          this.handler(this);
        else
          this.defaultHandler(this);
      }
    }
  });

 /**
  * @class
  */
  var MenuItemSet = Class(MenuItem, {
    className: namespace + '.MenuItemSet',
    //event_childNodesModified: UINode.prototype.event_childNodesModified,

    template: 
      '<div class="Basis-Menu-ItemSet {selected} {disabled}"/>'
  });

 /**
  * @class
  */
  var MenuPartitionNode = Class(UIPartitionNode, {
    className: namespace + '.MenuPartitionNode',

    template:
      '<div class="Basis-Menu-ItemGroup">' +
        '<div{childNodesElement|content} class="Basis-Menu-ItemGroup-Content"></div>' +
      '</div>'
  });

 /**
  * @class
  */
  var MenuGroupingNode = Class(UIGroupingNode, {
    className: namespace + '.MenuGroupingNode',
    childClass: MenuPartitionNode
  });

 /**
  * @class
  */
  var Menu = Class(Popup, {
    className: namespace + '.Menu',
    childClass: MenuItem,

    defaultDir: [LEFT, BOTTOM, LEFT, TOP].join(' '),
    subMenu: null,

    groupingClass: MenuGroupingNode,
    grouping: getter('groupId'),

    defaultHandler: function(){
      this.hide();
    },

    template:
      '<div class="Basis-Menu {selected} {disabled}">' +
        '<div{closeButton} class="Basis-Menu-CloseButton"><span>Close</span></div>' +
        '<div{content|childNodesElement} class="Basis-Menu-Content"/>' +
      '</div>'
  });


  //
  //  Popup manager
  //

  // NOTE: popupManager adds global event handlers dynamicaly because click event
  // that makes popup visible can also hide it (as click outside of popup).

  var popupManager = new UIControl({
    id: 'Basis-PopupStack',

    handheldMode: false,

    childClass: Popup,
    event_childNodesModified: function(object, delta){
      if (delta.deleted)
        for (var i = delta.deleted.length - 1, item; item = delta.deleted[i]; i--)
          item.hide();

      if (delta.inserted && !delta.deleted && this.childNodes.length == delta.inserted.length)
      {
        classList(this.element).add('IsNotEmpty');
        document.body.className = document.body.className; // BUGFIX: for IE7+ and webkit (chrome8/safari5)
                                                           // general sibling combinator (~) doesn't work otherwise
                                                           // (it's useful for handheld scenarios, when popups show on fullsreen)
        Event.addGlobalHandler('click', this.hideByClick, this);
        Event.addGlobalHandler('keydown', this.hideByKey, this);
        Event.addGlobalHandler('scroll', this.hideByScroll, this);
        Event.addHandler(window, 'resize', this.realignAll, this);
      }

      if (this.lastChild)
        this.lastChild.select();
      else
      {
        classList(this.element).remove('IsNotEmpty');
        document.body.className = document.body.className; // BUGFIX: for IE7+ and webkit (chrome8/safari5)
                                                           // general sibling combinator (~) doesn't work otherwise
                                                           // (it's useful for handheld scenarios, when popups show on fullsreen)
        Event.removeGlobalHandler('click', this.hideByClick, this);
        Event.removeGlobalHandler('keydown', this.hideByKey, this);
        Event.removeGlobalHandler('scroll', this.hideByScroll, this);
        Event.removeHandler(window, 'resize', this.realignAll, this);
      }

      UIControl.prototype.event_childNodesModified.call(this, object, delta);
    },

    insertBefore: function(newChild, refChild){
      // save documentElement (IE, mozilla and others) and body (webkit) scrollTop
      var documentST_ = document.documentElement.scrollTop;
      var bodyST_ = document.body.scrollTop;

      if (UIControl.prototype.insertBefore.call(this,newChild, refChild))
      {
        // store saved scrollTop to popup and scroll viewport to top
        newChild.documentST_ = documentST_;
        newChild.bodyST_ = bodyST_;
        if (this.handheldMode)
        {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }

        // set zIndex
        newChild.element.style.zIndex = basis.ui.window ? basis.ui.window.getWindowTopZIndex() : 2001;
      }
    },
    removeChild: function(popup){
      if (popup)
      {
        if (popup.hideOnAnyClick && popup.nextSibling)
          this.removeChild(popup.nextSibling);

        UIControl.prototype.removeChild.call(this, popup);

        // restore documentElement (IE, mozilla and others) and body (webkit) scrollTop
        if (this.handheldMode)
        {
          document.documentElement.scrollTop = popup.documentST_;
          document.body.scrollTop = popup.bodyST_;
        }
      }
    },
    realignAll: function(){
      for (var popup = this.firstChild; popup; popup = popup.nextSibling)
        popup.realign();
    },
    clear: function(){
      if (this.firstChild)
        this.removeChild(this.firstChild);
    },
    hideByClick: function(event){
      var sender = Event.sender(event);
      var ancestorAxis;

      var popups = this.childNodes.filter(getter('hideOnAnyClick')).reverse();

      for (var i = 0, popup; popup = popups[i]; i++)
      {
        if (sender === popup.tmpl.closeButton || DOM.parentOf(popup.tmpl.closeButton, sender))
        {
          this.removeChild(popup);
          return;
        }

        if (!ancestorAxis)
          ancestorAxis = DOM.axis(sender, DOM.AXIS_ANCESTOR_OR_SELF);

        if (ancestorAxis.has(popup.element) || ancestorAxis.some(Array.prototype.has, popup.ignoreClickFor))
        {
          this.removeChild(popups[i - 1]);
          return;
        }
      }

      this.removeChild(popups.pop());
      //this.clear();
    },
    hideByKey: function(event){
      var key = Event.key(event);
      var popup = this.lastChild;
      if (popup && popup.hideOnKey)
      {
        var result = false;

        if (typeof popup.hideOnKey == 'function')
          result = popup.hideOnKey(key);
        else
          if (Array.isArray(popup.hideOnKey))
            result = popup.hideOnKey.has(key);

        if (result)
          popup.hide();
      }
    },
    hideByScroll: function(event){
      var sender = Event.sender(event);

      if (DOM.parentOf(sender, this.element))
        return;

      var popup = this.lastChild;
      while (popup)
      {
        var next = popup.previousSibling;
        if (popup.relElement && popup.offsetParent !== sender && DOM.parentOf(sender, popup.relElement))
          popup.hide();
        popup = next;
      }
    }
  });

  Event.onLoad(function(){
    DOM.insert(document.body, popupManager.element, DOM.INSERT_BEGIN);
    popupManager.realignAll();
  });

  function setHandheldMode(mode){
    popupManager.handheldMode = !!mode;
  }

  //
  // export names
  //

  this.extend({
    // const
    ORIENTATION: ORIENTATION,

    // methods
    setHandheldMode: setHandheldMode,

    // classes
    Popup: Popup,
    Balloon: Balloon,
    Menu: Menu,
    MenuGroupingNode: MenuGroupingNode,
    MenuPartitionNode: MenuPartitionNode,
    MenuItem: MenuItem,
    MenuItemSet: MenuItemSet
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/popup.js").call(basis.namespace("basis.ui.popup"), basis.namespace("basis.ui.popup"), basis.namespace("basis.ui.popup").exports, this, __curLocation + "src/basis/ui/popup.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/table.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');


 /**
  * Table namespace
  *
  * @see ./test/speed-table.html
  * @see ./demo/common/match.html
  * @see ./demo/common/grouping.html
  *
  * @namespace basis.ui.table
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var getter = Function.getter;
  var nullGetter = Function.nullGetter;
  var extend = Object.extend;
  var classList = basis.cssom.classList;

  var nsData = basis.data;

  var nsWrapper = basis.dom.wrapper;
  var GroupingNode = nsWrapper.GroupingNode;
  var PartitionNode = nsWrapper.PartitionNode;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // Table header
  //

  var HEADERCELL_CSS_SORTABLE = 'Basis-Table-Header-SortableCell';
  var HEADERCELL_CSS_SORTDESC = 'sort-order-desc';

 /**
  * @class
  */
  var HeaderPartitionNode = Class(UINode, {
    className: namespace + '.HeaderPartitionNode',

    template: 
      '<th class="Basis-Table-Header-Cell {selected} {disabled}">' +
        '<div class="Basis-Table-Sort-Direction"/>' +
        '<div class="Basis-Table-Header-Cell-Content">' + 
          '<span{content} class="Basis-Table-Header-Cell-Title">{title}</span>' +
        '</div>' +
      '</th>',

    binding: {
      title: 'data:title'
    }

    /*titleGetter: getter('data.title'),

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.titleText.nodeValue = this.titleGetter(this);
    }*/
  });

 /**
  * @class
  */
  var HeaderGroupingNode = Class(GroupingNode, {
    className: namespace + '.HeaderGroupingNode',
    event_ownerChanged: function(node, oldOwner){
      if (oldOwner)
        DOM.remove(this.headerRow);

      if (this.owner && this.owner.element)
      {
        var cursor = this;
        var element = this.owner.element;
        do
        {
          DOM.insert(element, cursor.headerRow, DOM.INSERT_BEGIN);
        } while (cursor = cursor.grouping);
      }
      
      GroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

   /**
    * @inheritDoc
    */
    childClass: {
      className: namespace + '.HeaderPartitionNode',
      init: function(config){
        PartitionNode.prototype.init.call(this, config);
        this.cell = new HeaderPartitionNode({
          delegate: this,
          titleGetter: this.titleGetter,
          binding: this.binding || {}
        });
      },
      event_childNodesModified: function(object, delta){
        var colSpan = 0;
        if (this.nodes[0] && this.nodes[0] instanceof this.constructor)
        {
          for (var i = 0, node; node = this.nodes[i]; i++)
            colSpan += node.cell.element.colSpan;
        }
        else
          colSpan = this.nodes.length;

        this.cell.element.colSpan = colSpan;

        if (this.groupNode)
          this.groupNode.event_childNodesModified.call(this.groupNode, this.groupNode, {});

        PartitionNode.prototype.event_childNodesModified.call(this, object, delta);
      },
      destroy: function(){
        PartitionNode.prototype.destroy.call(this);
        
        this.cell.destroy();
      }
    },

   /**
    * @inheritDoc
    */
    groupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    init: function(config){
      GroupingNode.prototype.init.call(this, config);
      this.element = this.childNodesElement = this.headerRow = DOM.createElement('tr.Basis-Table-Header-GroupContent');
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      newChild = GroupingNode.prototype.insertBefore.call(this, newChild, refChild);

      var refElement = newChild.nextSibling && newChild.nextSibling.cell.element;
      DOM.insert(this.headerRow, newChild.cell.element, DOM.INSERT_BEFORE, refElement);

      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      DOM.remove(oldChild.cell.element);
      GroupingNode.prototype.removeChild.call(oldChild);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      GroupingNode.prototype.destroy.call(this);
      this.headerRow = null;
    }
  });

 /**
  * @class
  */
  var HeaderCell = Class(UINode, {
    className: namespace + '.HeaderCell',

    colSorting: null,
    defaultOrder: false,
    groupId: 0,

    template:
      '<th class="Basis-Table-Header-Cell {selected} {disabled}" event-click="setColumnSorting">' +
        '<div class="Basis-Table-Sort-Direction"/>' +
        '<div class="Basis-Table-Header-Cell-Content">' + 
          '<span{content} class="Basis-Table-Header-Cell-Title"/>' +
        '</div>' +
      '</th>',

    action: {
      setColumnSorting: function(event){
        if (this.selected)
        {
          var owner = this.parentNode && this.parentNode.owner;
          if (owner)
            owner.setSorting(owner.sorting, !owner.sortingDesc);
        }
        else
          this.select();         
      }
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      UINode.prototype.init.call(this, config);

      this.selectable = !!this.colSorting;

      if (this.colSorting)
      {
        //this.colSorting = getter(this.colSorting);
        this.defaultOrder = this.defaultOrder == 'desc';
        classList(this.element).add(HEADERCELL_CSS_SORTABLE);
      }
    },

   /**
    * @inheritDoc
    */
    select: function(){
      if (!this.selected)
        this.order = this.defaultOrder;

      UINode.prototype.select.call(this);
    }
  });


 /**
  * @class
  */
  var Header = Class(UIContainer, {
    className: namespace + '.Header',

    childClass: HeaderCell,

    groupingClass: HeaderGroupingNode,

    template:
      '<thead{groupsElement} class="Basis-Table-Header {selected} {disabled}">' +
        '<tr{childNodesElement|content}/>' +
      '</thead>',

    listen: {
      owner: {
        sortingChanged: function(owner, oldSorting, oldSortingDesc){
          var cell = this.childNodes.search(owner.sorting, 'colSorting');
          if (cell)
          {
            cell.select();
            cell.order = owner.sortingDesc;
            classList(this.tmpl.content).bool(HEADERCELL_CSS_SORTDESC, cell.order);
          }
          else
            this.selection.clear();
        }
      }
    },

    init: function(config){
      this.selection = {
        owner: this,
        handlerContext: this,
        handler: {
          datasetChanged: function(dataset, delta){
            var cell = dataset.pick();
            if (cell && this.owner)
              this.owner.setSorting(cell.colSorting, cell.order);
          }
        }
      };

      UIContainer.prototype.init.call(this, config);

      this.applyConfig_(this.structure)
    },
    applyConfig_: function(structure){
      if (structure)
      {
        var cells = [];
        var autosorting = [];
        var ownerSorting = this.owner && this.owner.sorting;
        
        for (var i = 0; i < structure.length; i++)
        {
          var colConfig = structure[i];
          var headerConfig = colConfig.header;
          var config = {};
          
          if ('groupId' in colConfig)
            config.groupId = colConfig.groupId;

          // content
          config.content = (headerConfig == null || typeof headerConfig != 'object' || headerConfig instanceof basis.l10n.Token
            ? headerConfig 
            : headerConfig.content) || String.Entity.nbsp;

          if (typeof config.content == 'function')
            config.content = config.content.call(this);

          // css classes
          config.cssClassName = (headerConfig.cssClassName || '') + ' ' + (colConfig.cssClassName || '');

          // sorting
          var sorting = getter(colConfig.colSorting || colConfig.sorting);

          if (sorting !== nullGetter)
          {
            config.colSorting = sorting;
            config.defaultOrder = colConfig.defaultOrder;
          
            if (colConfig.autosorting || sorting === ownerSorting)
              autosorting.push(config);
          }

          // store cell
          cells.push(config);
        };

        if (autosorting.length)
          autosorting[0].selected = true;

        this.setChildNodes(cells);
      }
    }
  });


  //
  // Table footer
  //

 /**
  * @class
  */
  var FooterCell = Class(UINode, {
    className: namespace + '.FooterCell',

    colSpan: 1,

    template:
      '<td{content} class="Basis-Table-Footer-Cell {selected} {disabled}">' +
        '\xA0' +
      '</td>',

    templateUpdate: function(tmpl){
      this.element.colSpan = this.colSpan;
    },

    setColSpan: function(colSpan){
      this.colSpan = colSpan || 1;
      this.templateUpdate(this.tmpl);
    }
  });

 /**
  * @class
  */
  var Footer = Class(UIContainer, {
    className: namespace + '.Footer',

    childClass: FooterCell,

    template:
      '<tfoot class="Basis-Table-Footer {selected} {disabled}">' +
        '<tr{content|childNodesElement}/>' +
      '</tfoot>',

    init: function(config){
      UIContainer.prototype.init.call(this, config);

      this.applyConfig_(this.structure);

      DOM.display(this.element, this.useFooter);
    },

    applyConfig_: function(structure){
      if (structure)
      {
        var prevCell = null;

        this.clear();
        this.useFooter = false;

        for (var i = 0; i < structure.length; i++)
        {
          var colConfig = structure[i];
          var cell;

          if ('footer' in colConfig)
          {
            var footerConfig = colConfig.footer != null ? colConfig.footer : {};

            if (typeof footerConfig != 'object')
              footerConfig = { content: footerConfig };

            var content = footerConfig.content;

            if (typeof content == 'function')
              content = content.call(this);
              
            this.useFooter = true;
            
            cell = this.appendChild({
              //colSpan: footerConfig.colSpan || 1,
              cssClassName: (colConfig.cssClassName || '') + ' ' + (footerConfig.cssClassName || ''),
              content: content,
              template: footerConfig.template || FooterCell.prototype.template
            });
          }
          else
          {
            if (prevCell)
              prevCell.setColSpan(prevCell.colSpan + 1);
            else
              cell = this.appendChild({});
          }

          if (cell)
            prevCell = cell;
        }
      }
    }
  });


  //
  // Table
  //

 /**
  * Base row class
  * @class
  */
  var Row = Class(UINode, {
    className: namespace + '.Row',
    
    childClass: null,
    repaintCount: 0,

    template:
      '<tr class="Basis-Table-Row {selected} {disabled}" event-click="select">' +
        '<!--{cells}-->' +
      '</tr>',

    action: { 
      select: function(event){
        this.select(Event(event).ctrlKey);
      }
    },

    templateUpdate: function(tmpl, eventName, delta){
      // update template
      this.repaintCount += 1;  // WARN: don't use this.repaintCount++
                               // on first call repaintCount is prototype member

      for (var i = 0, updater; updater = this.updaters[i]; i++)
      {
        var cell = this.element.childNodes[updater.cellIndex];
        var content = updater.getter.call(this, this, cell);

        if (this.repaintCount > 1)
          cell.innerHTML = '';
       
        if (!content || !Array.isArray(content))
          content = [content];

        for (var j = 0; j < content.length; j++)
        {
          var ins = content[j];
          cell.appendChild(
            ins && ins.nodeType
              ? ins
              : DOM.createText(ins != null && (typeof ins != 'string' || ins != '') ? ins : ' ')
          );
        }
      }
    }
  });

 /**
  * @class
  */
  var Body = Class(UIPartitionNode, {
    className: namespace + '.Body',

    template:
      '<tbody class="Basis-Table-Body">' +
        '<tr class="Basis-Table-GroupHeader" event-click="toggle">' +
          '<td{content} colspan="100">' +
            '<span class="expander"/>' +
            '<span class="Basis-Table-GroupHeader-Title">{title}</span>' +
          '</td>'+ 
        '</tr>' +
        '<!--{childNodesHere}-->' +
      '</tbody>',

    action: {
      toggle: function(){
        classList(this.element).toggle('collapsed');
      }
    }
  });
  
 /**
  * @class
  */
  var Table = Class(UIControl, {
    className: namespace + '.Table',
    
    childClass: Row,

    groupingClass: {
      className: namespace + '.TableGroupingNode',
      childClass: Body
    },

    template:
      '<table{groupsElement} class="Basis-Table {selected} {disabled}" cellspacing="0">' +
        '<!--{header}-->' +
        '<tbody{content|childNodesElement} class="Basis-Table-Body"/>' +
        '<!--{footer}-->' +
      '</table>',

    headerClass: Header,
    footerClass: Footer,

    columnCount: 0,

    init: function(config){

      ;;;if (this.rowSatellite && typeof console != 'undefined') console.warn('rowSatellite is deprecated. Move all extensions into childClass');
      ;;;if (this.rowBehaviour && typeof console != 'undefined') console.warn('rowBehaviour is deprecated. Move all extensions into childClass');

      this.applyConfig_(this.structure);

      UIControl.prototype.init.call(this, config);

      this.headerConfig = this.header;
      this.footerConfig = this.footer;

      this.header = new this.headerClass(extend({ owner: this, structure: this.structure }, this.header));
      this.footer = new this.footerClass(extend({ owner: this, structure: this.structure }, this.footer));

      DOM.replace(this.tmpl.header, this.header.element);
      DOM.replace(this.tmpl.footer, this.footer.element);
    },

    applyConfig_: function(structure){
      if (structure)
      {
        var updaters = new Array();
        var template = '';

        if (this.firstChild)
          this.clear();

        for (var i = 0; i < structure.length; i++)
        {
          var col = structure[i];
          var cell = col.body || {};

          if (typeof cell == 'function' || typeof cell == 'string')
            cell = {
              content: cell
            };

          var className = [col.cssClassName || '', cell.cssClassName || ''].join(' ').trim();
          var content = cell.content;
          template += 
            '<td' + (cell.templateRef ? cell.templateRef.quote('{') : '') + (className ? ' class="' + className + '"' : '') + '>' + 
              (typeof content == 'string' ? cell.content : '') +
            '</td>';

          if (typeof content == 'function')
          {
            updaters.push({
              cellIndex: i,
              getter: content
            });
          }
        }

        this.columnCount = i;

        this.childClass = this.childClass.subclass({
          template: this.childClass.prototype.template.source.replace('<!--{cells}-->', template),
          updaters: updaters
        });
      }
    },

    loadData: function(items){
      this.setChildNodes(nsData(items));
    },

    destroy: function(){
      UIControl.prototype.destroy.call(this);

      this.header.destroy();
      this.header = null;

      this.footer.destroy();
      this.footer = null;
    }
  });    


  //
  // export names
  //

  this.extend({
    Table: Table,
    Body: Body,
    Header: Header,
    HeaderCell: HeaderCell,
    Row: Row,
    Footer: Footer
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/table.js").call(basis.namespace("basis.ui.table"), basis.namespace("basis.ui.table"), basis.namespace("basis.ui.table").exports, this, __curLocation + "src/basis/ui/table.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/scrolltable.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

  'use strict';

  basis.require('basis.timer');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.layout');
  basis.require('basis.ui.table');


 /**
  * @namespace basis.ui.scrolltable
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var sender = basis.dom.event.sender;

  var cssom = basis.cssom;
  var Table = basis.ui.table.Table;
  var layout = basis.layout;


  //
  // main part
  //

  function resetStyle(extraStyle){
    return '[style="padding:0!important;margin:0!important;border:0!important;width:auto!important;height:0!important;font-size:0!important;' + (extraStyle || '') + '"]';
  }

  function buildCellsSection(owner, property){
    return DOM.createElement('tbody' + resetStyle(),
      DOM.createElement('tr' + resetStyle(),
        owner.columnWidthSync_.map(Function.getter(property))
      )
    );
  }

  function replaceTemplateNode(owner, refName, newNode){
    DOM.replace(owner.tmpl[refName],
      owner.tmpl[refName] = newNode
    );
  }

  // Cells proto
  var measureCell = DOM.createElement('td' + resetStyle(),
    DOM.createElement(resetStyle('position:relative!important'),
      DOM.createElement('iframe[event-load="measureInit"]' + resetStyle('width:100%!important;position:absolute!important;visibility:hidden!important;behavior:expression(basis.dom.event.fireEvent(window,\\"load\\",{type:\\"load\\",target:this}),(runtimeStyle.behavior=\\"none\\"))'))
    )
  );

  var expanderCell = DOM.createElement('td' + resetStyle(),
    DOM.createElement(resetStyle())
  );


 /**
  * @class
  */
  var ScrollTable = Class(Table, {
    className: namespace + '.ScrollTable',

    timer_: false,

   /**
    * Column width sync cells
    */
    columnWidthSync_: null,

   /**
    * @inheritDoc
    */
    template:
      '<div class="Basis-Table Basis-ScrollTable {selected} {disabled}" event-load="">' +
        '<div class="Basis-ScrollTable-Header-Container">' +
          '<table{headerOffset} class="Basis-ScrollTable-Header" cellspacing="0">' +
            '<!--{header}-->' +
            '<!--{headerExpandRow}-->' +
          '</table>' +
          '<div{headerExpandCell} class="Basis-ScrollTable-ExpandHeaderCell">' +
            '<div class="Basis-ScrollTable-ExpandHeaderCell-B1">' +
              '<div class="Basis-ScrollTable-ExpandHeaderCell-B2"/>' +
            '</div>' +
          '</div>'+
        '</div>' +
        '<div{scrollContainer} class="Basis-ScrollTable-ScrollContainer" event-scroll="scroll">' +
          '<div{boundElement} class="Basis-ScrollTable-TableWrapper">' +
            '<table{tableElement|groupsElement} class="Basis-ScrollTable-ContentTable" cellspacing="0">' +
              '<!--{shadowHeader}-->' +
              '<!--{measureRow}-->' +
              '<tbody{content|childNodesElement} class="Basis-Table-Body"/>' +
              '<!--{shadowFooter}-->' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<div class="Basis-ScrollTable-Footer-Container">' +
          '<table{footerOffset} class="Basis-ScrollTable-Footer" cellspacing="0">' +
            '<!--{footer}-->' +
            '<!--{footerExpandRow}-->' +
          '</table>' +
          '<div{footerExpandCell} class="Basis-ScrollTable-ExpandFooterCell">' +
            '<div class="Basis-ScrollTable-ExpandFooterCell-B1">' +
              '<div class="Basis-ScrollTable-ExpandFooterCell-B2"/>' +
            '</div>' +
          '</div>'+
        '</div>' +
      '</div>',

    action: {
      scroll: function(){
        var scrollLeft = -this.tmpl.scrollContainer.scrollLeft + 'px';

        if (this.tmpl.headerOffset.style.left != scrollLeft)
        {
          this.tmpl.headerOffset.style.left = scrollLeft;
          this.tmpl.footerOffset.style.left = scrollLeft;
        }
      },
      measureInit: function(event){
        //console.log('load');
        (sender(event).contentWindow.onresize = this.requestRelayout)();
      }
    },

    headerClass: {
      listen: {
        childNode: {
          '*': function(event){
            if (this.owner)
              this.owner.requestRelayout();
          }
        }
      }
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      this.requestRelayout = this.requestRelayout.bind(this);
      this.relayout = this.relayout.bind(this);

      // inherit
      Table.prototype.init.call(this, config);

      // add request to relayout on any header events
      this.header.addHandler({
        '*': this.requestRelayout
      }, this);

      // column width sync cells
      this.columnWidthSync_ = Array.create(this.columnCount, function(){
        return {
          measure: measureCell.cloneNode(true),
          header: expanderCell.cloneNode(true),
          footer: expanderCell.cloneNode(true)
        }
      });

      // insert measure row
      replaceTemplateNode(this, 'measureRow', buildCellsSection(this, 'measure'));

      // insert header expander row
      replaceTemplateNode(this, 'headerExpandRow', buildCellsSection(this, 'header'));

      // insert footer expander row
      replaceTemplateNode(this, 'footerExpandRow', buildCellsSection(this, 'footer'));

      //
      layout.addBlockResizeHandler(this.tmpl.boundElement, this.requestRelayout);

      // hack for ie, trigger relayout on create
      if (basis.ua.is('IE8')) // TODO: remove this hack
        setTimeout(this.requestRelayout, 1);
    },

   /**
    * Notify table that it must be relayout.
    */
    requestRelayout: function(){
      if (!this.timer_)
        this.timer_ = setTimeout(this.relayout, 0);
    },

   /**
    * Make relayout of table. Should never be used in common cases. Call requestRelayout instead.
    */
    relayout: function(){
      //console.log('relayout');

      var headerElement = this.header.element;
      var footerElement = this.footer.element;

      //
      // Sync header html
      //
      var headerOuterHTML = DOM.outerHTML(headerElement);
      if (this.shadowHeaderHTML_ != headerOuterHTML)
      {
        this.shadowHeaderHTML_ = headerOuterHTML;
        replaceTemplateNode(this, 'shadowHeader', headerElement.cloneNode(true));
      }

      //
      // Sync footer html
      //
      var footerOuterHTML = DOM.outerHTML(footerElement);
      if (this.shadowFooterHtml_ != footerOuterHTML)
      {
        this.shadowFooterHtml_ = footerOuterHTML;
        replaceTemplateNode(this, 'shadowFooter', footerElement.cloneNode(true));
      }

      //
      // Sync column width
      //
      for (var i = 0, column, columnWidth; column = this.columnWidthSync_[i]; i++)
      {
        columnWidth = column.measure.offsetWidth + 'px';
        cssom.setStyleProperty(column.header.firstChild, 'width', columnWidth);
        cssom.setStyleProperty(column.footer.firstChild, 'width', columnWidth);
        //column.header.firstChild.style.width = columnWidth;
        //column.footer.firstChild.style.width = columnWidth;
      }

      //
      // Calc metrics boxes
      //
      var tableWidth = this.tmpl.boundElement.offsetWidth || 0;
      var headerHeight = headerElement.offsetHeight || 0;
      var footerHeight = footerElement.offsetHeight || 0;

      //
      // Update style properties
      //
      this.tmpl.headerExpandCell.style.left = tableWidth + 'px';
      this.tmpl.footerExpandCell.style.left = tableWidth + 'px';
      this.tmpl.tableElement.style.margin = '-{0}px 0 -{1}px'.format(headerHeight, footerHeight);
      this.element.style.paddingBottom = (headerHeight + footerHeight) + 'px';

      // reset timer
      // it should be at the end of relayout to prevent relayout call while relayout
      this.timer_ = clearTimeout(this.timer_);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.timer_ = clearTimeout(this.timer_);
      this.timer_ = true; // prevent relayout call

      this.columnWidthSync_ = null;
      this.shadowHeaderHtml_ = null;
      this.shadowFooterHtml_ = null;

      Table.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    ScrollTable: ScrollTable
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/scrolltable.js").call(basis.namespace("basis.ui.scrolltable"), basis.namespace("basis.ui.scrolltable"), basis.namespace("basis.ui.scrolltable").exports, this, __curLocation + "src/basis/ui/scrolltable.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/window.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.l10n');
  basis.require('basis.ui');
  basis.require('basis.ui.button');


 /**
  * @see ./demo/defile/window.html
  * @namespace basis.ui.window
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var Cleaner = basis.Cleaner;

  var createEvent = basis.event.create;
  var dragdrop = basis.dragdrop; // optional

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var ButtonPanel = basis.ui.button.ButtonPanel;


  //
  // localization
  //

  basis.l10n.createDictionary(namespace, '', {
    emptyTitle: '[no title]'
  });

  //
  // main part
  //

 /**
  * @class
  */
  var Blocker = Class(UINode, {
    className: namespace + '.Blocker',

    captureElement: null,

    template:
      '<div class="Basis-Blocker">' + 
        '<div{content} class="Basis-Blocker-Mate"/>' +
      '</div>',

    init: function(config){
      UINode.prototype.init.call(this, config);

      DOM.setStyle(this.element, {
        display: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      });

      Cleaner.add(this);
    },
    capture: function(element, zIndex){
      this.captureElement = DOM.get(element || document.body);
      if (this.captureElement)
      {
        DOM.insert(this.captureElement, this.element);
        this.element.style.zIndex = zIndex || 1000;
        DOM.show(this.element);
      }
    },
    release: function(){
      if (this.captureElement)
      {
        if (this.element.parentNode == this.captureElement)
          DOM.remove(this.element);

        this.captureElement = null;
        DOM.hide(this.element);
      }
    },
    destroy: function(){
      this.release();
      
      UINode.prototype.destroy.call(this);
      
      Cleaner.remove(this);
    }
  });

  //
  //  Window
  //

 /**
  * @class
  */
  var Window = Class(UIContainer, {
    className: namespace + '.Window',

    template:
      '<div class="Basis-Window {selected} {disabled}" event-mousedown="mousedown" event-keypress="keypress">' +
        '<div class="Basis-Window-Canvas">' +
          '<div class="corner-left-top"/>' +
          '<div class="corner-right-top"/>' +
          '<div class="side-top"/>' +
          '<div class="side-left"/>' +
          '<div class="side-right"/>' +
          '<div class="content"/>' +
          '<div class="corner-left-bottom"/>' +
          '<div class="corner-right-bottom"/>' +
          '<div class="side-bottom"/>' +
        '</div>' +
        '<div class="Basis-Window-Layout">' +
          '<div{ddtrigger} class="Basis-Window-Title">' +
            '<div class="Basis-Window-TitleCaption">{title}</div>' +
          '</div>' +
          '<div{content} class="Basis-Window-Content">' +
            '<!-- {childNodesHere} -->' +
          '</div>' +
        '</div>' +
      '</div>',

    binding: {
      title: 'title'
    },

    action: {
      close: function(){
        this.close();
      },
      mousedown: function(){
        this.activate();
      },
      keypress: function(event){
        var key = Event.key(event);

        if (key == Event.KEY.ESCAPE)
        {
          if (this.closeOnEscape)
            this.close(0);
        }
        else if (key == Event.KEY.ENTER)
        {
          if (Event.sender(event).tagName != 'TEXTAREA')
            Event.kill(event);
        }
      }
    },

    // properties

    event_beforeShow: createEvent('beforeShow'),
    event_open: createEvent('open'),
    event_close: createEvent('close'),
    event_active: createEvent('active'),

    closeOnEscape: true,

    autocenter: true,
    autocenter_: false,
    modal: false,
    closed: true,
    moveable: true,

    title: basis.l10n.getToken(namespace, 'emptyTitle'),

    init: function(config){
      //this.inherit(config);
      UIContainer.prototype.init.call(this, config);

      // make main element invisible by default
      DOM.hide(this.element);

      // modal window
      /*if (config.modal)
        this.modal = true;*/

      // process title
      var titleContainer = this.tmpl.title.parentNode;
      this.setTitle(this.title);

      /*if ('closeOnEscape' in config)
        this.closeOnEscape = !!config.closeOnEscape;*/

      // add generic rule
      this.cssRule = cssom.uniqueRule(this.element);

      // make window moveable
      if (this.moveable)
      {
        if (dragdrop)
        {
          this.dde = new dragdrop.MoveableElement({
            element: this.element,
            trigger: this.tmpl.ddtrigger || titleContainer,
            fixRight: false,
            fixBottom: false
          });

          this.dde.addHandler({
            move: function(){
              this.autocenter = false;
              this.element.style.margin = 0;
            },
            over: function(){
              this.cssRule.setStyle(Object.slice(this.element.style, 'left top'.qw()));
              DOM.setStyle(this.element, {
                top: '',
                left: ''
              });
            }
          }, this);
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn('`moveable` property of Window is not allowed. Drag&Drop module required.')
        }
      }

      // buttons
      var buttons = Array.from(this.buttons).map(function(button){
        return Object.complete({
          click: (button.click || this.close).bind(this)
        }, button);
      }, this);

      // common buttons
      var buttons_ = Object.slice(this, ['buttonOk', 'buttonCancel']);
      /*if (this.buttonOk)
        buttons_.buttonOk = this.buttonOk;
      if (this.buttonCancel)
        buttons_.buttonCancel = this.buttonCancel;*/
       
      for (var buttonId in buttons_)
      {
        var button = buttons_[buttonId];
        buttons.push({
          name: buttonId == 'buttonOk' ? 'ok' : 'cancel',
          caption: button.caption || button.title || button,
          click: (button.click || this.close).bind(this)
        });
      }

      if (buttons.length)
      {
        this.buttonPanel = new ButtonPanel({
          cssClassName: 'Basis-Window-ButtonPlace',
          container: this.tmpl.content,
          childNodes: buttons
        });
      }

      if (!this.titleButton || this.titleButton.close !== false)
      {
        classList(titleContainer).add('Basis-Window-Title-ButtonPlace-Close');          
        DOM.insert(
          titleContainer,
          DOM.createElement('SPAN.Basis-Window-Title-ButtonPlace', 
            DOM.createElement('SPAN.Basis-Window-Title-CloseButton[event-click="close"]',
              DOM.createElement('SPAN', 'Close')
            )
          ),
          DOM.INSERT_BEGIN
        );
      }

      if (this.autocenter !== false)
        this.autocenter = this.autocenter_ = true;

      // handlers
      if (this.thread)
      {
        this.thread.addHandler({
          finish: function(){
            if (this.closed)
              DOM.remove(this.element);
          }
        }, this);
      }

      //Event.addHandler(this.element, 'keypress', buttonKeyPressHandler, this);
      //addHandler(this.element, 'click', Event.kill);
      //Event.addHandler(this.element, 'mousedown', this.activate, this);

      Cleaner.add(this);
    },
    setTitle: function(title){
      //DOM.insert(DOM.clear(this.tmpl.title), title);
      this.tmpl.set('title', title);
    },
    realign: function(){
      if (this.autocenter)
      {
        //this.autocenter = false;
        this.element.style.margin = '';
        this.cssRule.setStyle(this.element.offsetWidth ? {
          //left: Math.max(0, parseInt(0.5 * (document.body.clientWidth  - this.element.offsetWidth))) + 'px',
          //top:  Math.max(0, parseInt(0.5 * (document.body.clientHeight - this.element.offsetHeight))) + 'px'
          left: '50%',
          top: '50%',
          marginLeft: -this.element.offsetWidth/2 + 'px',
          marginTop: -this.element.offsetHeight/2 + 'px'
        } : { left: 0, top: 0 });
      }
    },
    activate: function(){
      //windowManager.activate(this);
      this.select();
    },
    open: function(params, x, y){
      if (this.closed)
      {
        DOM.visibility(this.element, false);
        DOM.show(this.element);

        windowManager.appendChild(this);
        this.closed = false;

        this.realign();

        if (this.thread)
          this.thread.start(true);

        //this.dispatch('beforeShow', params);
        this.event_beforeShow(params);
        DOM.visibility(this.element, true);

        if (this.buttonPanel && this.buttonPanel.firstChild)
          this.buttonPanel.firstChild.select();

        this.event_open(params);
        this.event_active(params);
        /*this.dispatch('open', params);
        this.dispatch('active', params);*/
      }
      else
      {
        //windowManager.activate(this);
        //;;;if (typeof console != 'undefined') console.warn('make window activate on window.open()');
        this.realign();
      }
    },
    close: function(modalResult){
      if (!this.closed)
      {
        if (this.thread)
          this.thread.start(1);
        else
          DOM.remove(this.element);

        windowManager.removeChild(this);

        this.autocenter = this.autocenter_;

        this.closed = true;
        this.event_close(modalResult)
        //this.dispatch('close', modalResult);
      }
    },
    destroy: function(){
      if (this.dde)
      {
        this.dde.destroy();
        delete this.dde;
      }

      UIContainer.prototype.destroy.call(this);

      this.cssRule.destroy();
      this.cssRule = null;

      Cleaner.remove(this);
    }
  });

  //
  // Window manager
  //

  var wmBlocker = new Blocker();
  var windowManager = new UIControl({
    id: 'Basis-WindowStack',
    childClass: Window
  });

  windowManager.addHandler({
    childNodesModified: function(){
      classList(this.element).bool('IsNotEmpty', this.firstChild);

      var modalIndex = -1;

      if (this.lastChild)
      {
        for (var i = 0, node; node = this.childNodes[i]; i++)
        {
          node.element.style.zIndex = 2001 + i * 2;
          if (node.modal)
            modalIndex = i;
        }

        this.lastChild.select();
      }

      if (modalIndex != -1)
        wmBlocker.capture(this.element, 2000 + modalIndex * 2);
      else
        wmBlocker.release();
    }
  });

  windowManager.selection.addHandler({
    datasetChanged: function(){
      var selected = this.pick();
      var lastWin = windowManager.lastChild;
      if (selected)
      {
        if (selected.parentNode == windowManager && selected != lastWin)
        {
          // put selected on top
          windowManager.insertBefore(selected);
          windowManager.event_childNodesModified({});
        }
      }
      else
      {
        if (lastWin)
          this.add([lastWin]);
      }
    }      
  });

  Event.onLoad(function(){
    DOM.insert(document.body, windowManager.element, DOM.INSERT_BEGIN);
    for (var node = windowManager.firstChild; node; node = node.nextSibling)
      node.realign();
  });


  //
  // export names
  //

  this.extend({
    Window: Window,
    Blocker: Blocker,
    getWindowTopZIndex: function(){ return windowManager.childNodes.length * 2 + 2001 }
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/window.js").call(basis.namespace("basis.ui.window"), basis.namespace("basis.ui.window"), basis.namespace("basis.ui.window").exports, this, __curLocation + "src/basis/ui/window.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/tabs.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/tabs.html
  * @namespace basis.ui.tabs
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var createEvent = basis.event.create;
  var events = basis.event.events;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

  function findAndSelectActiveNode(control){
    if (control.autoSelectChild && control.selection && !control.selection.itemCount)
    {
      // select first non-disabled child
      var node = control.childNodes.search(false, 'disabled');
      if (node)
        node.select();
    }
  }

 /**
  * @class
  */
  var AbstractTabsControl = Class(UIControl, {
    className: namespace + '.AbstractTabsControl',

    childClass: UINode,

    autoSelectChild: true,

    event_childNodesModified: function(node, delta){
      findAndSelectActiveNode(this);
      UIControl.prototype.event_childNodesModified.call(this, node, delta);
    },

    listen: {
      childNode: {
        enable: function(childNode){
          findAndSelectActiveNode(this);
        },
        disable: function(childNode){
          findAndSelectActiveNode(this);
        }
      }
    },

    //
    //  common methods
    //
    item: function(indexOrName){
      var index = isNaN(indexOrName) ? this.indexOf(indexOrName) : parseInt(indexOrName);
      return this.childNodes[index];
    },
    indexOf: function(objectOrName){
      // search for object
      if (objectOrName instanceof this.childClass)
        return this.childNodes.indexOf(objectOrName);

      // search by name
      if (this.childNodes.search(objectOrName, 'name'))
        return Array.lastSearchIndex;

      return -1;
    }
  });


  //
  // Tab
  //

 /**
  * @class
  */
  var Tab = Class(UIContainer, {
    className: namespace + '.Tab',

    childClass: null,

    event_disable: function(node){
      this.unselect();
      UIContainer.prototype.event_disable.call(this, node);
    },

    template: 
      '<div class="Basis-Tab {selected} {disabled}" event-click="select">' +
        '<span class="Basis-Tab-Start"/>' +
        '<span class="Basis-Tab-Content">' +
          '<span class="Basis-Tab-Caption">' +
            '{title}' +
          '</span>' +
        '</span>' + 
        '<span class="Basis-Tab-End"/>' +
      '</div>' +
      '<div{content}/>',

    binding: {
      title: 'data:title'
    },

    /*templateUpdate: function(tmpl, eventName, delta){
      // set new title
      var title = this.titleGetter(this);
      tmpl.titleText.nodeValue = title == null || String(title) == '' ? '[no title]' : title;
    },*/
    
    action: {
      select: function(){
        if (!this.isDisabled())
          this.select();
      }
    },

   /**
    * Using to fetch title value.
    * @property {function(node)}
    */
    titleGetter: getter('data.title'),
    
   /**
    * Using for tab default grouping.
    * @property {number}
    */
    groupId: 0
  });


  //
  // Tabs control
  //

 /**
  * @class
  */
  var TabControl = Class(AbstractTabsControl, {
    className: namespace + '.TabControl',

    childClass: Tab,
    groupingClass: {
      className: namespace + '.TabsGroupingNode',
      childClass: {
        className: namespace + '.TabsPartitionNode',
        template: 
          '<div class="Basis-TabControl-TabGroup {selected} {disabled}"/>'
      }
    },

    template: 
      '<div class="Basis-TabControl {selected} {disabled}">' +
        '<div class="Basis-TabControl-Start"/>' +
        '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
        '<div class="Basis-TabControl-End"/>' +
      '</div>'
  });


  //
  // Page Node
  //

 /**
  * @class
  */
  var Page = Class(UIContainer, {
    className: namespace + '.Page',

    event_select: function(node){
      classList(this.element).remove('Basis-Page-Hidden');
      UIContainer.prototype.event_select.call(this, node);
    },
    event_unselect: function(node){
      classList(this.element).add('Basis-Page-Hidden');
      UIContainer.prototype.event_unselect.call(this, node);
    },
    
    template: 
      '<div class="Basis-Page Basis-Page-Hidden {selected} {disabled}">' + 
        '<div{content|childNodesElement} class="Basis-Page-Content"/>' +
      '</div>'
  });


  //
  // Page Control
  //

 /**
  * @class
  */
  var PageControl = Class(AbstractTabsControl, {
    className: namespace + '.PageControl',

    childClass: Page,
    
    template: 
      '<div class="Basis-PageControl {selected} {disabled}"/>'
  });


  //
  // TabSheet Node
  //

 /**
  * @class
  */
  var TabSheet = Class(Tab, {
    className: namespace + '.TabSheet',

    childClass: UINode,

    event_select: function(node){
      Tab.prototype.event_select.call(this, node);
      classList(this.tmpl.pageElement).remove('Basis-Page-Hidden');
    },
    event_unselect: function(node){
      Tab.prototype.event_unselect.call(this, node);
      classList(this.tmpl.pageElement).add('Basis-Page-Hidden');
    },
    
    template: 
      '<div class="Basis-TabSheet {selected} {disabled}" event-click="select">' +
        '<div{tabElement} class="Basis-Tab">' +
          '<span class="Basis-Tab-Start"/>' +
          '<span class="Basis-Tab-Content">' +
            '<span class="Basis-Tab-Caption">' +
              '{title}' +
            '</span>' +
          '</span>' + 
          '<span class="Basis-Tab-End"/>' +
        '</div>' +
        '<div{pageElement} class="Basis-Page Basis-Page-Hidden">' +
          '<div{content|pageContent|childNodesElement} class="Basis-Page-Content"/>' +
        '</div>' +
      '</div>',

    destroy: function(){
      DOM.remove(this.tmpl.pageElement);
      
      Tab.prototype.destroy.call(this);
    }
  });


  //
  // AccordionControl
  //

 /**
  * @class
  */
  var AccordionControl = Class(TabControl, {
    className: namespace + '.AccordionControl',

    childClass: TabSheet,
    
    template: 
      '<div class="Basis-AccordionControl {selected} {disabled}">' +
        '<div{content|childNodesElement} class="Basis-AccordionControl-Content"/>' +
      '</div>'
  });


  //
  //  TabSheetControl
  //

 /**
  * @class
  */
  var TabSheetControl = Class(TabControl, {
    className: namespace + '.TabSheetControl',

    childClass: TabSheet,
    
    template: 
      '<div class="Basis-TabSheetControl {selected} {disabled}">' +
        '<div{tabsElement} class="Basis-TabControl">' +
          '<div class="Basis-TabControl-Start"/>' +
          '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
          '<div class="Basis-TabControl-End"/>' +
        '</div>' +
        '<div{pagesElement} class="Basis-PageControl"/>' +
      '</div>',

    insertBefore: function(newChild, refChild){
      var marker = this.domVersion_;
      newChild = TabControl.prototype.insertBefore.call(this, newChild, refChild);

      if (newChild && marker != this.domVersion_)
      {
        if (this.tmpl.pagesElement)
          this.tmpl.pagesElement.insertBefore(newChild.tmpl.pageElement, this.nextSibling ? this.nextSibling.tmpl.pageElement : null)
      }

      return newChild;
    },
    removeChild: function(oldChild){
    	if (oldChild = TabControl.prototype.removeChild.call(this, oldChild))
      {
        if (this.tmpl.pagesElement)
          oldChild.element.appendChild(oldChild.tmpl.pageElement);

        return oldChild;
      }
    },
    clear: function(keepAlive){
      // put pageElement back to TabSheet root element
      this.childNodes.forEach(function(tabsheet){
        tabsheet.element.appendChild(tabsheet.tmpl.pageElement);
      });

      TabControl.prototype.clear.call(this, keepAlive);
    }
  });


  //
  // export names
  //

  this.extend({
    AbstractTabsControl: AbstractTabsControl,

    TabControl: TabControl,
    Tab: Tab,

    PageControl: PageControl,
    Page: Page,
    
    AccordionControl: AccordionControl,
    TabSheetControl: TabSheetControl,
    TabSheet: TabSheet
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/tabs.js").call(basis.namespace("basis.ui.tabs"), basis.namespace("basis.ui.tabs"), basis.namespace("basis.ui.tabs").exports, this, __curLocation + "src/basis/ui/tabs.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/calendar.js
//

new Function(__wrapArgs, function(){

/**
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

  basis.require('basis.event');
  basis.require('basis.date');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.html');
  basis.require('basis.data.property');
  basis.require('basis.ui');
  basis.require('basis.l10n');


 /**
  * @see ./demo/defile/calendar.html
  * @namespace basis.ui.calendar
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var getter = Function.getter;
  var createEvent = basis.event.create;
  var createDictionary = basis.l10n.createDictionary;
  var l10nToken = basis.l10n.getToken;

  var Property = basis.data.property.Property;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

  var YEAR = 'year';
  var MONTH = 'month';
  var DAY = 'day';
  var HOUR = 'hour';
  var FORWARD = true;
  var BACKWARD = false;

  var TAB_TEMPLATE =
    '<div{tabElement} class="Basis-Calendar-SectionTab {selected}" event-click="select">' +
      '{tabTitle}' +
    '</div>';

  //
  // localization
  //

  var l10nLocation = __dirname + '../../../l10n/calendar';
  var monthNumToRef = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  var dayNumToRef = ["mon", "tue", "wed", "thr", "fri", "sat", "sun"];

  createDictionary(namespace, l10nLocation, {
    quarter: 'Quarter',
    today: 'Today',
    selected: 'Selected'
  });

  createDictionary(namespace + '.month', l10nLocation, {
    'jan': 'January',
    'feb': 'February',
    'mar': 'March',
    'apr': 'April',
    'may': 'May',
    'jun': 'June',
    'jul': 'July',
    'aug': 'August',
    'sep': 'September',
    'oct': 'October',
    'nov': 'November',
    'dec': 'December'
  });

  createDictionary(namespace + '.monthShort', l10nLocation, {
    'jan': 'Jan',
    'feb': 'Feb',
    'mar': 'Mar',
    'apr': 'Apr',
    'may': 'May',
    'jun': 'Jun',
    'jul': 'Jul',
    'aug': 'Aug',
    'sep': 'Sep',
    'oct': 'Oct',
    'nov': 'Nov',
    'dec': 'Dec'
  });

  createDictionary(namespace + '.day', l10nLocation, {
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thr': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sun': 'Sunday'
  });

  createDictionary(namespace + '.day2', l10nLocation, {
    'mon': 'Mo',
    'tue': 'Tu',
    'wed': 'We',
    'thr': 'Th',
    'fri': 'Fr',
    'sat': 'Sa',
    'sun': 'Su'
  });

  createDictionary(namespace + '.day3', l10nLocation, {
    'mon': 'Mon',
    'tue': 'Tue',
    'wed': 'Wed',
    'thr': 'Thr',
    'fri': 'Fri',
    'sat': 'Sat',
    'sun': 'Sun'
  });

  //
  // Tools
  //

  function unpackDate(date){
    return {
      hour:  date.getHours(),
      day:   date.getDate() - 1,
      month: date.getMonth(),
      year:  date.getFullYear()
    };
  }

  function binarySearchIntervalPos(arr, value){
    if (!arr.length)  // empty array check
      return -1;

    var pos, compareValue;
    var l = 0;
    var r = arr.length;
    var lv, rv;

    // binary search
    do
    {
      compareValue = arr[pos = (l + r) >> 1];
      if (value < (lv = compareValue.periodStart))
        r = pos - 1;
      else
        if (value > (rv = compareValue.periodEnd))
          l = pos + 1;
        else
          return value >= lv && value <= rv ? pos : -1;
    }
    while (l <= r);

    return -1;
  }

  //
  //  days bit mask
  //

  var DAY_COUNT_MASK = {};
  var MAX_DAY_MASK   = 0x7FFFFFFF;  // 2^31

  (function(){
    var i = 32;
    var mask = MAX_DAY_MASK;
    while (--i)
    {
      DAY_COUNT_MASK[i] = mask;
      mask >>= 1;
    }
  })();

  //
  //  period titles
  //

  var PERIOD_TITLE = {
    century: function(period){ return period.periodStart.getFullYear() + ' - ' + period.periodEnd.getFullYear() },
    decade:  function(period){ return period.periodStart.getFullYear() + ' - ' + period.periodEnd.getFullYear() },
    year:    function(period){ return period.periodStart.getFullYear() },
    quarter: function(period){
      return LOCALE('QUARTER').toLowerCase().format(1 + period.periodStart.getMonth().base(3)/3);
    },
    month:   function(period){
      return l10nToken(namespace, 'monthShort', monthNumToRef[period.periodStart.getMonth()]);
      //return LOCALE('MONTH').SHORT[period.periodStart.getMonth()].toLowerCase();
    },
    day:     function(period){ return period.periodStart.getDate() }
  };

  //
  //  period getter
  //

  var PERIOD = {
    century: [YEAR,  100, 0, 0, 100, 0, 0],
    decade:  [YEAR,  10, 0, 0, 10, 0, 0],
    year:    [YEAR,  1, 0, 0, 1, 0, 0],
    quarter: [MONTH, 1, 3, 0, 0, 3, 0],
    month:   [MONTH, 1, 1, 0, 0, 1, 0],
    day:     [DAY,   1, 1, 1, 0, 0, 1]
  };

  function getPeriod(periodName, date){
    var result = {};
    var mod = PERIOD[periodName];
    if (mod)
    {
      var y = date.getFullYear();
      var m = date.getMonth();
      var d = date.getDate();

      y = y - y % mod[1];
      m = mod[2] ? m - m % mod[2] : 0;
      d = mod[3] ? d : 1;

      result.periodStart = new Date(y, m, d);
      result.periodEnd = new Date(new Date(y + mod[4], m + mod[5], d + mod[6]) - 1);
    }
    else
    {
      result.periodStart = new Date(date);
      result.periodEnd = new Date(date)
    }

    return result;
  }


  //
  // SECTIONS
  //

  var CalendarNode = Class(UINode, {
    className: namespace + '.Calendar.Node',

    childClass: null,

    periodStart: null,
    periodEnd: null,

    event_periodChanged: createEvent('periodChanged'),
    event_select: function(){
      UINode.prototype.event_select.call(this);

      DOM.focus(this.element);
    },

    template:
      '<a class="Basis-Calendar-Node {nodePeriodName} {selected} {disabled} {before} {after}" event-click="click">' +
        '{title}' +
      '</a>',

    action: {
      click: function(event){
        var calendar = this.parentNode && this.parentNode.parentNode;
        if (calendar)
          calendar.templateAction('click', event, this);
      }
    },

    binding: {
      nodePeriodName: 'nodePeriodName',
      title: {
        events: 'periodChanged',
        getter: function(node){
          return PERIOD_TITLE[node.nodePeriodName](node);
        }
      },
      before: {
        events: 'periodChanged',
        getter: function(node){
          return node.parentNode && node.periodStart < node.parentNode.periodStart
            ? 'before'
            : '';
        }
      },
      after: {
        events: 'periodChanged',
        getter: function(node){
          return node.parentNode && node.periodEnd > node.parentNode.periodEnd
            ? 'after'
            : '';
        }
      }
    },

    setPeriod: function(period, selectedDate){
      if (this.periodStart - period.periodStart || this.periodEnd - period.periodEnd)
      {
        this.periodStart = period.periodStart;
        this.periodEnd = period.periodEnd;

        if (selectedDate)
        {
          if (selectedDate >= this.periodStart && selectedDate <= this.periodEnd)
            this.select();
          else
            this.unselect();
        }

        this.event_periodChanged();
      }
    }
  });

  function getPeriods(section){
    // update nodes
    var nodePeriod = getPeriod(this.nodePeriodName, new Date(this.periodStart).add(this.nodePeriodUnit, -this.nodePeriodUnitCount * (this.getInitOffset(this.periodStart) || 0)));
    var result = [];

    for (var i = 0; i < this.nodeCount; i++)
    {
      result.push(nodePeriod);

      // move to next period
      nodePeriod = getPeriod(this.nodePeriodName, new Date(nodePeriod.periodStart).add(this.nodePeriodUnit, this.nodePeriodUnitCount));
    }

    return result;
  }

  var CalendarSection = Class(UIContainer, {
    className: namespace + '.CalendarSection',

    event_periodChanged: createEvent('periodChanged'),
    event_selectedDateChanged: createEvent('selectedDateChanged'),

    template:
      '<div class="Basis-Calendar-Section Basis-Calendar-Section-{sectionName} {selected} {disabled}">' +
        '<div class="Basis-Calendar-SectionTitle">{title}</div>' +
        '<div{childNodesElement} class="Basis-Calendar-SectionContent"/>' +
      '</div>' +
      TAB_TEMPLATE,

    binding: {
      sectionName: 'sectionName',
      title: {
        events: 'periodChanged',
        getter: function(node){
          return node.getTitle(node.periodStart) || '-';
        }
      },
      tabTitle: {
        events: 'selectedDateChanged',
        getter: function(node){
          return node.getTabTitle(node.selectedDate) || '-';
        }
      }
    },

    childClass: CalendarNode,

    // dates

    minDate: null,
    maxDate: null,

    periodStart: null,
    periodEnd: null,
    setPeriod: function(period){
      if (this.periodStart - period.periodStart || this.periodEnd - period.periodEnd)
      {
        var oldPeriodStart = this.periodStart;
        var oldPeriodEnd = this.periodEnd;

        this.periodStart = period.periodStart;
        this.periodEnd = period.periodEnd;

        var periods = getPeriods.call(this);

        this.minDate = periods[0].periodStart;
        this.maxDate = periods[periods.length - 1].periodEnd;

        if (this.firstChild)
        {
          for (var i = 0; i < this.childNodes.length; i++)
            this.childNodes[i].setPeriod(periods[i], this.selectedDate);

          /*var node = this.getNodeByDate(this.selectedDate);
          if (node)
            node.select();
          else
          {
            if (this.selectedDate && this.minDate <= this.selectedDate && this.selectedDate <= this.maxDate)
              this.setViewDate(this.selectedDate);
            else
              this.selection.clear();
          }*/
        }

        this.event_periodChanged(this, oldPeriodStart, oldPeriodEnd);
      }
    },

    selectedDate: null,
    setSelectedDate: function(date){
      if (this.selectedDate - date)
      {
        var oldSelectedDate = this.selectedDate;
        this.selectedDate = date;

        var node = this.getNodeByDate(this.selectedDate);
        if (node)
          node.select();
        else
        {
          if (this.selectedDate && this.minDate <= this.selectedDate && this.selectedDate <= this.maxDate)
            this.setViewDate(this.selectedDate);
          else
            this.selection.clear();
        }

        this.event_selectedDateChanged(oldSelectedDate);
      }
    },

    // period

    isPrevPeriodEnabled: true,
    isNextPeriodEnabled: true,

    periodName: 'period',

    // nodes properties

    nodeCount: 12,
    nodePeriodName: '-',
    nodePeriodUnit: '-',
    nodePeriodUnitCount: 1,

    selection: true,

    init: function(config){
      var selectedDate = this.selectedDate;
      this.selectedDate = null;

      this.setViewDate(selectedDate);

      this.childNodes = getPeriods.call(this).map(function(period){
        return {
          nodePeriodName: this.nodePeriodName,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd
        }
      }, this);

      UIContainer.prototype.init.call(this, config);

      this.setSelectedDate(selectedDate);

      Event.addHandler(this.tmpl.tabElement, 'click', this.select.bind(this, false));
    },

    getTitle: Function(),
    getTabTitle: Function(),

    // nodes methods

    getNodeByDate: function(date){
      if (date && this.periodStart <= date && date <= this.periodEnd)
      {
        var pos = binarySearchIntervalPos(this.childNodes, date);
        if (pos != -1)
          return this.childNodes[pos];
      }

      return null;
    },

    prevPeriod: function(forward){
      if (this.isPrevPeriodEnabled)
        this.setPeriod(getPeriod(this.periodName, new Date(+this.periodStart - 1)));
    },

    nextPeriod: function(forward){
      if (this.isNextPeriodEnabled)
        this.setPeriod(getPeriod(this.periodName, new Date(+this.periodEnd + 1)));
    },

    setViewDate: function(date){
      this.setPeriod(getPeriod(this.periodName, date));
    },

    // bild methods
    getInitOffset: Function()
  });


  CalendarSection.Month = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Month',

    sectionName: 'Month',
    periodName: MONTH,

    nodeCount: 6 * 7,       // 6 weeks
    nodePeriodName: DAY,
    nodePeriodUnit: DAY,

    getTabTitle: getter('getDate()'),
    getInitOffset: function(date){
      return 1 + (new Date(date).set(DAY, 1).getDay() + 5) % 7;
    },

    template:
      '<div class="Basis-Calendar-Section Basis-Calendar-Section-{sectionName} {selected} {disabled}">' +
        '<div class="Basis-Calendar-SectionTitle">{title} {year}</div>' +
        '<div{content|childNodesElement} class="Basis-Calendar-SectionContent">' +
          '<div class="Basis-Calendar-MonthWeekDays">' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.mon}</span>' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.tue}</span>' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.wed}</span>' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.thr}</span>' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.fri}</span>' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.sat}</span>' +
            '<span class="Basis-Calendar-MonthWeekDays-Day">{l10n:basis.ui.calendar.day2.sun}</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      TAB_TEMPLATE,

    binding: {
      year: {
        events: 'periodChanged',
        getter: function(node){
          return node.periodStart.getFullYear();
        }
      },
      title: {
        events: 'periodChanged',
        getter: function(node){
          return l10nToken(namespace, 'month', monthNumToRef[node.periodStart.getMonth()]);
          /*
          var expr = basis.l10n.createExpression(
            function(a, b){
              return a + ' x ' + b + ' ' + node.periodStart.getFullYear();
            }
          );

          return basis.l10n.expression(
            function(a, b){
              return a + ' x ' + b + ' ' + node.periodStart.getFullYear();
            },
            l10nToken(namespace, 'month', monthNumToRef[node.periodStart.getMonth()]),
            l10nToken('basis.ui.calendar.day2.mon')
          );


          function expression(evaluate){
            var result = Array.from(arguments, 1);
            result.bindingBridge = {
              attach: function(){ createExpression() },
              detach: function(){ destroyExpression() },
              get: function(args){ evaluate.apply(null, args) }
            }
            return result;
          }
          */
        }
      }
    }
  });

  CalendarSection.Year = Class(CalendarSection, {
    className:  namespace + '.CalendarSection.Year',

    sectionName: 'Year',
    periodName: YEAR,

    nodePeriodName: MONTH,
    nodePeriodUnit: MONTH,

    getTabTitle: getter('getMonth()', function(key){
      return l10nToken(namespace, 'month', monthNumToRef[key]);// LOCALE('MONTH').FULL[key];
    }),
    getTitle: getter('getFullYear()')
  });

  CalendarSection.YearDecade = Class(CalendarSection, {
    className: namespace + '.CalendarSection.YearDecade',

    sectionName: 'YearDecade',
    periodName: 'decade',

    nodePeriodName: YEAR,
    nodePeriodUnit: YEAR,

    getInitOffset: function(){
      return 1;
    },
    getTabTitle: getter('getFullYear()'),
    getTitle: function(periodStart){
      return periodStart.getFullYear() + ' - ' + this.periodEnd.getFullYear();
    }
  });

  CalendarSection.Century = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Century',

    sectionName: 'Century',
    periodName: 'century',

    nodePeriodName: 'decade',
    nodePeriodUnit: YEAR,
    nodePeriodUnitCount: 10,

    getTabTitle: function(date){
      if (date)
      {
        var year = date.getFullYear();
        var start = year - year % 10;
        return start + '-' + (Number(start.toString().substr(-2)) + 9).lead(2);
      }
    },

    getInitOffset: function(){
      return 1;
    }
  });

  CalendarSection.YearQuarters = Class(CalendarSection, {
    className: namespace + '.CalendarSection.YearQuarter',

    sectionName: 'YearQuarter',
    periodName: YEAR,

    nodeCount: 4,
    nodePeriodName: 'quarter',
    nodePeriodUnit: MONTH,
    nodePeriodUnitCount: 3
  });

  CalendarSection.Quarter = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Quarter',

    sectionName: 'Quarter',
    periodName: 'quarter',

    nodeCount: 3,
    nodePeriodName: MONTH,
    nodePeriodUnit: MONTH,

    binding: {
      title: {
        l10n: true,
        events: 'periodChanged',
        l10nProxy: function(node, tokenValue){
          return [Math.floor(1 + node.periodStart.getMonth().base(3)/3), tokenValue, node.periodStart.getFullYear()].join(' ')
        },
        getter: function(node){
          return l10nToken(namespace, 'quarter');
        }
      }
    }
/*
    getTitle: function(periodStart){
      return [Math.floor(1 + periodStart.getMonth().base(3)/3), LOCALE('QUARTER').toLowerCase(), periodStart.getFullYear()].join(' ');
    }*/
  });

  //
  // Calendar
  //

  var Calendar = Class(UIControl, {
    className: namespace + '.Calendar',

    event_change: createEvent('change'),

    childClass: CalendarSection,
    childFactory: Function(),

    template:
      '<div class="Basis-Calendar {selected} {disabled}">' +
        '<div class="Basis-Calendar-Header">' +
          '<div{sectionTabs} class="Basis-Calendar-SectionTabs" />' +
        '</div>' +
        '<div class="Basis-Calendar-Body">' +
          '<span event-click="movePrev" class="Basis-Calendar-ButtonPrevPeriod">' +
            '<span>\u2039</span><span class="over"></span>' +
          '</span>' +
          '<span event-click="moveNext" class="Basis-Calendar-ButtonNextPeriod">' +
            '<span>\u203A</span><span class="over"></span>' +
          '</span>' +
          '<div{content|childNodesElement} class="Basis-Calendar-Content"/>' +
        '</div>' +
        '<div class="Basis-Calendar-Footer">' +
          '<div class="Basis-Calendar-Footer-Date">' +
            '<span class="Basis-Calendar-Footer-Label">{l10n:basis.ui.calendar.today}:</span>' +
            '<span event-click="selectToday" class="Basis-Calendar-Footer-Value">{today}</span>' +
          '</div>' +
        '</div>' +
      '</div>',

    binding: {
      today: function(){
        return new Date().toFormat("%D.%M.%Y");
      }
    },

    action: {
      moveNext: function(){
        this.selection.pick().nextPeriod();
      },
      movePrev: function(){
        this.selection.pick().prevPeriod();
      },
      selectToday: function(){
        this.selectedDate.set(new Date());
      }
    },

    event_childNodesModified: function(node, delta){
      if (delta.inserted)
        for (var i = 0, section; section = delta.inserted[i++];)
        {
          section.setViewDate(this.date.value);
          this.selectedDate.addLink(section, section.setSelectedDate);
        }

      if (delta.deleted)
        for (var i = 0, section; section = delta.deleted[i++];)
          this.selectedDate.removeLink(section, section.setSelectedDate);

      UIControl.prototype.event_childNodesModified.call(this, node, delta);

      DOM.insert(
        DOM.clear(this.tmpl.sectionTabs),
        this.childNodes.map(getter('tmpl.tabElement'))
      );

      if (this.selection && !this.selection.itemCount && this.firstChild)
        this.firstChild.select();
    },
    templateAction: function(actionName, event, node){
      UIControl.prototype.templateAction.call(this, actionName, event);

      if (node instanceof CalendarNode)
      {
        var newDate = node.periodStart;
        var activeSection = this.selection.pick();
        this.selectedDate.set(new Date(this.selectedDate.value).add(activeSection.nodePeriodUnit, this.selectedDate.value.diff(activeSection.nodePeriodUnit, newDate)));
        this.nextSection(BACKWARD);
      }
    },

    date: null,

    // enable/disable periods
    minDate: null,
    maxDate: null,
    map: null,
    periodEnableByDefault: true,   // default state of periods: 1 = enabled, 0 = disabled

    sections: ['Month', /*'Quarter', 'YearQuarters', */'Year', 'YearDecade'/*, 'Century'*/],

   /**
    * @constructor
    */
    init: function(config){
      // dates
      var now = new Date();

      this.selectedDate = new Property(new Date(this.date || now));
      this.date = new Property(new Date(this.date || now));

      // inherit
      UIControl.prototype.init.call(this, config);

      // min/max dates

      // insert sections
      if (this.sections)
        DOM.insert(this, this.sections.map(function(sectionClass, index){
          return new CalendarSection[sectionClass]({
            selectedDate: this.selectedDate.value
          })
        }, this));
    },

    // section navigate
    setSection: function(sectionName){
      var section = this.childNodes.search('sectionName', sectionName);
      if (section)
        section.select();
    },
    nextSection: function(forward){
      var activeSection = this.selection.pick();
      var section = forward ? activeSection.nextSibling : activeSection.previousSibling;
      if (section)
      {
        section.select();
        section.setViewDate(this.selectedDate.value);
      }
      else
      {
        if (!forward)
          this.event_change();
      }
    },

    // date change
    selectDate: function(date){
      if (date - this.date.value != 0)  // test for date equal
        this.date.set(date);
    },

    //
    // period methods
    //

    getNextPeriod: function(date, forward){
      // check for period is enabled
      if (!this.isNextPeriodEnabled(date, forward))
        return false;

      if (this.map)
      {
        var offset = forward ? 1 : -1;
        var startMark = forward ? 'start' : 'till';
        var endMark = forward ? 'till' : 'start';
        var cursor = (new Date(date)).add('millisecond', offset);
        var map = this.map[this.periodEnableByDefault ? 'disabled' : 'enabled'];

        if (map)
        {
          // init period
          var period = getPeriod(YEAR, cursor);

          // if current year selected, get a part of period
          if (period.periodEnd.getFullYear() == cursor.getFullYear())
            period[startMark] = cursor;

          // search for enable year
          while (!this.isPeriodEnabled(period.periodStart, period.periodEnd))
            period = getPeriod(YEAR, cursor.add(YEAR, offset));

          // enabled year found, search for enabled month - it's situate between period.periodStart and period.periodEnd
          period[endMark] = getPeriod(MONTH, period[startMark])[endMark];
          while (!this.isPeriodEnabled(period.periodStart, period.periodEnd))
            period = getPeriod(MONTH, cursor.add(MONTH, offset));

          // enabled month found, search for day
          var s = unpackDate(period[startMark]);
          var t = unpackDate(period[endMark]);
          var month = map[t.year] && map[t.year][t.month];

          // month check out
          if (month)
          {
            if (this.periodEnableByDefault)
            {
              var mask  = DAY_COUNT_MASK[period.periodEnd.getMonthDayCount()];
              month = month & mask ^ mask;  // bit inverse
            }

            // search for first not zero bit
            for (var i = s.day; i != t.day + offset; i += offset)
              if (month >> i & 1)
              {
                // date found
                cursor = new Date(s.year, s.month, i + 1);
                break;
              }
          }
          else
            // month may be null: this case possible in 'enabled' default state only,
            // when no disabled days in month or description of month omited.
            // This case means that we could return day of period.periodEnd

            return getPeriod(DAY, period[startMark]);
        }
      }

      return getPeriod(DAY, cursor);
    },

    isNextPeriodEnabled: function(date, forward){
      // check for min date
      if (!forward && this.minDate && this.minDate > date)
        return false;

      // check for max date
      if ( forward && this.maxDate && this.maxDate < date)
        return false;

      // check for map
      if (this.map)
      {
        if (this.periodEnableByDefault)
        {
          if (!forward && this.minDate)
            return this.isPeriodEnabled(this.minDate, date);

          if ( forward && this.maxDate)
            return this.isPeriodEnabled(date, this.maxDate);
        }
        else
        {
          var offset    = forward ? 1 : -1;

          var curYear   = date.getFullYear();
          var firstDate = (new Date(date)).add('millisecond', offset);
          var firstYear = firstDate.getFullYear();
          var years     = Object.keys(this.map.enable).filter(function(year){ return offset * year >= offset * firstYear });
          var yearCount = years.length;

          if (yearCount)
          {
            years = years.sort(function(a, b){ return offset * (a > b) || -offset * (a < b) });

            for (var i = 0; i < yearCount; i++)
            {
              var period = getPeriod(YEAR, new Date(years[i], 0));
              if (this.isPeriodEnabled(
                     forward && years[i] == curYear ? firstDate : period.periodStart,
                    !forward && years[i] == curYear ? firstDate : period.periodEnd
                 ))
                return true;
            }
          }

          return false;
        }
      }
      return true;
    },

    isPeriodEnabled: function(periodStart, periodEnd){

      function checkMapDays(mode, month, sday, tday){
        var result;
        if (!mode)
          // first month:  check only for last days
          result = month >> sday;
        else if (mode == 1)
          // last month:   check only for first days
          result = month & DAY_COUNT_MASK[tday + 1]; // MAX_DAY_MASK >> 31 - tday
        else
          // middle month: check full month
          result = month;
        return result;
      }

      // check for min/max dates
      if (this.minDate && this.minDate > periodEnd)
        return false;

      if (this.maxDate && this.maxDate < periodStart)
        return false;

      // check for map
      var map = this.map && this.map[this.periodEnableByDefault ? 'disabled' : 'enabled'];
      if (map)
      {
        var s = unpackDate(periodStart);
        var e = unpackDate(periodEnd);

        var year, month, mask;
        var monthIndex = s.month;

        var cursor = new Date(s.year, s.month);
        var monthMark = 11 - s.month;
        var monthCount = (monthMark + 1) + (e.year - s.year - 1) * 12 + (e.month + 1) - 1; // month count - 1

        if (this.periodEnableByDefault)
        {
          //
          // check for exception: one month/one day
          //
          if (monthCount == 0)
          {
            // check for day period
            return !(year  = map[s.year])     // full year enabled, return true
                   ||
                   !(month = year[s.month])   // full month enabled, return true
                   ||
                   (((month ^ MAX_DAY_MASK) >> s.day) & DAY_COUNT_MASK[e.day - s.day + 1]);  // MAX_DAY_MASK >> 31 - (t.day - s.day + 1)
          }

          //
          // regular block: some monthes
          //
          for (var i = 0; i <= monthCount; i++)
          {
            // select year if necessary
            if (!i || (monthMark == i % 12))
            {
              year = map[cursor.getFullYear()];
              if (!year)
                return true; // all year enabled
            }

            // select month
            month = year[monthIndex = cursor.getMonth()];
            if (!month)
              return true;   // all month enabled

            // check for not disabled days
            mask = DAY_COUNT_MASK[cursor.getMonthDayCount()];
            if (checkMapDays(i/monthCount, month & mask ^ mask, s.day, e.day))
              return true;

            // move to next month
            cursor.setMonth(monthIndex + 1);
          }
          // there all dates in period is disabled, period is disable
          return false;
        }
        else
        {
          //
          // check for exception: one month/one day
          //
          if (monthCount == 0)
            // check for day period
            return (year  = map[s.year])      // year absent return false
                   &&
                   (month = year[s.month])    // month absent return false
                   &&
                   ((month >> s.day) & DAY_COUNT_MASK[e.day - s.day + 1]);  // MAX_DAY_MASK >> 31 - (t.day - s.day + 1)

          //
          // regular block: some monthes
          //
          for (var i = 0; i <= monthCount; i++)
          {
            // select year if necessary
            if (!i || (monthMark == i % 12) || !year)
            {
              year = map[cursor.getFullYear()];
              if (!year)
              {
                // move to next year
                i += 12;
                cursor.setMonth(monthIndex + 12);
                continue;
              }
            }

            // check for enabled days
            month = year[monthIndex = cursor.getMonth()];
            if (month && checkMapDays(i/monthCount, month, s.day, e.day))
              return true;

            // move to next month
            cursor.setMonth(monthIndex + 1);
          }
          // there no enabled dates in period, period is disable
          return false;
        }
      }

      return true;
    },

    // destruction

    destroy: function(){
      UIControl.prototype.destroy.call(this);

      this.date.destroy();
    }

  });


  //
  // export names
  //

  this.extend({
    Calendar: Calendar,
    CalendarSection: CalendarSection
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/calendar.js").call(basis.namespace("basis.ui.calendar"), basis.namespace("basis.ui.calendar"), basis.namespace("basis.ui.calendar").exports, this, __curLocation + "src/basis/ui/calendar.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/form.js
//

new Function(__wrapArgs, function(){

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

  basis.require('basis.event');
  basis.require('basis.html');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.cssom');
  basis.require('basis.ui');
  basis.require('basis.ui.popup');


 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.form
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;
  var Template = basis.template.Template;
  var Cleaner = basis.Cleaner;

  var complete = Object.complete;
  var coalesce = Object.coalesce;
  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var createEvent = basis.event.create;
  var events = basis.event.events;

  var AbstractProperty = basis.data.property.AbstractProperty;
  var Property = basis.data.property.Property;

  var Selection = basis.dom.wrapper.Selection;
  var UIControl = basis.ui.Control;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var Popup = basis.ui.popup.Popup;


  //
  // main part
  //

  var baseFieldTemplate = new Template(
    '<div{sampleContainer} class="Basis-Field {selected} {disabled}">' +
      '<div class="Basis-Field-Title">' +
        '<label>' +
          '<span{title}>{titleText}</span>' +
        '</label>' +
      '</div>' +
      '<div{content} class="Basis-Field-Container">' +
        '<!-- {fieldPlace} -->' +
      '</div>' +
    '</div>'
  );

  function createFieldTemplate(template, injection){
    return new Template(template.source.replace('<!-- {fieldPlace} -->', injection));
  }

  //
  //  Fields
  //

 /**
  * Base class for all form field classes
  * @class
  */
  var Field = UINode.subclass({
    className: namespace + '.Field',

    childClass: null,
    template: baseFieldTemplate,

    nextFieldOnEnter: true,
    serializable: true,

    event_select: function(){
      DOM.focus(this.tmpl.field, true);

      UINode.prototype.event_select.call(this);
    },
    event_enable: function(){
      this.tmpl.field.removeAttribute('disabled');

      UINode.prototype.event_enable.call(this);
    },
    event_disable: function(){
      this.tmpl.field.setAttribute('disabled', 'disabled');

      UINode.prototype.event_disable.call(this);
    },
    event_input: createEvent('input', 'event'),
    event_change: createEvent('change','event'),
    event_keydown: createEvent('keydown', 'event'),
    event_keypress: createEvent('keypress', 'event'),
    event_keyup: createEvent('keyup', 'event') && function(event){
      if (this.nextFieldOnEnter)
        if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER].has(Event.key(event)))
        {
          Event.cancelDefault(event);
          this.nextFieldFocus();
        }
        else
          this.setValid();

      events.keyup.call(this, event);
    },
    event_focus: createEvent('focus', 'event') && function(event){
      if (this.valid)
        this.setValid();

      events.focus.call(this, event);
    },
    event_blur: createEvent('blur', 'event') && function(event){
      this.validate(true);

      events.blur.call(this, event);
    },

    init: function(config){
      UINode.prototype.init.call(this, config);

      this.name = this.name || '';

      if (this.tmpl.titleText)
        this.tmpl.titleText.nodeValue = this.title || '';

      // attach button
      /*if (this.button)
      {
        classList(this.element).add('have-button');
        this.button = DOM.createElement('BUTTON', config.caption || '...');
        if (config.button.handler) 
          Event.addHandler(this.button, 'click', config.button.handler, this.button);
        DOM.insert(this.tmpl.field.parentNode, this.button, DOM.INSERT_AFTER, this.tmpl.field);
      }*/

      // set events
      if (this.tmpl.field)
      {
        Event.addHandler(this.tmpl.field, 'keydown',  this.keydown,  this);
        Event.addHandler(this.tmpl.field, 'keyup',    this.keyup,    this);
        Event.addHandler(this.tmpl.field, 'keypress', this.keypress, this);
        Event.addHandler(this.tmpl.field, 'blur',     this.blur,     this);
        Event.addHandler(this.tmpl.field, 'focus',    this.focus,    this);
        Event.addHandler(this.tmpl.field, 'change',   this.change,   this);
        Event.addHandler(this.tmpl.field, 'input',    this.input,    this);

        if (this.name)
          this.tmpl.field.name = this.name;

        if (this.size)
          this.tmpl.field.size = this.size;
      }

      if (!this.validators)
        this.validators = [];

      // set sample
      this.setSample(this.sample);
      
      // set min/max length
      if (this.minLength)
        this.setMinLength(this.minLength);
      if (this.maxLength)
        this.setMaxLength(this.maxLength);

      // set value & default value
      if (this.readOnly)
        this.setReadOnly(this.readOnly);
      
      //if (this.disabled)
      //  this.disable();
      
      if (this.defaultValue !== this.value)
      {
        this.defaultValue = this.value;
        this.setDefaultValue();
      }
    },
    setReadOnly: function(readOnly){
      if (readOnly)
        this.tmpl.field.setAttribute('readonly', 'readonly', 0);
      else
        this.tmpl.field.removeAttribute('readonly', 0);
    },
    setDefaultValue: function(){
      this.setValue(this.defaultValue);
      this.setValid();
    },
    setSample: function(sample){
      if (this.tmpl.sampleContainer && sample)
      {
        if (!this.sampleElement)
          DOM.insert(this.tmpl.sampleContainer, this.sampleElement = DOM.createElement('SPAN.Basis-Field-Sample', sample));
        else
          DOM.insert(DOM.clear(this.sampleElement), sample);
      }
      else
      {
        if (this.sampleElement)
        {
          DOM.remove(this.sampleElement);
          this.sampleElement = null;
        }
      }
    },
    getValue: function(){
      return this.tmpl.field.value;
    },
    setValue: function(newValue){
      newValue = newValue || '';
      if (this.tmpl.field.value != newValue)
      {
        this.tmpl.field.value = newValue;
        this.event_change();
      }
    },
    /*disable: function(){
      if (!this.disabled)
      {
        this.disabled = true;
        this.event_disable();
      }
    },*/
    setMaxLength: function(len){
      this.maxLength = len;
    },
    setMinLength: function(len){
      this.minLength = len;
    },
    attachValidator: function(validator, validate){
      if (this.validators.add(validator) && validate)
        this.validate();
    },
    detachValidator: function(validator, validate){
      if (this.validators.remove(validator) && validate)
        this.validate();
    },
    change: function(event){
      this.event_change(event);
    },
    input: function(event){
      this.event_input(event);
    },
    keydown: function(event){
      this.event_keydown(event);
    },
    keyup: function(event){
      this.event_keyup(event);
    },
    keypress: function(event){
      this.event_keypress(event);
    },
    blur: function(event){
      this.event_blur(event);
    },
    focus: function(event){
      this.event_focus(event);
    },
    select: function(){
      this.unselect();
      UINode.prototype.select.apply(this, arguments);
    },
    setValid: function(valid, message){
      var clsList = classList(this.element);

      if (typeof valid == 'boolean')
      {
        clsList.bool('invalid', !valid)
        clsList.bool('valid', valid);
        if (message)
          this.element.title = message;
        else
          this.element.removeAttribute('title');
      }
      else
      {
        clsList.remove('invalid');
        clsList.remove('valid');
        this.element.removeAttribute('title');
      }
      this.valid = valid;
    },
    validate: function(onlyValid){
      var error;

      this.setValid();
      for (var i = 0; i < this.validators.length; i++)
        if (error = this.validators[i](this))
        {
          if (!onlyValid) 
            this.setValid(false, error.message);
          return error;
        }
      if (this.getValue() != '') // && this.validators.length)
        this.setValid(true);
      return;
    },
    nextFieldFocus: function(event){
      var next = DOM.axis(this, DOM.AXIS_FOLLOWING_SIBLING).search(true, 'selectable');

      if (next)
        next.select();
      else
        if (this.parentNode && this.parentNode.submit)
          this.parentNode.submit();
    },
    destroy: function(){
      Event.clearHandlers(this.element);// TODO: remove????
      if (this.tmpl.field)
        Event.clearHandlers(this.tmpl.field);

      if (this.button)
      {
        Event.clearHandlers(this.button);
        delete this.button;
      }
      this.validators.clear();

      UINode.prototype.destroy.call(this);

      delete this.sampleElement;
      delete this.sampleContainer;
      delete this.defaultValue;
      //delete this.field;
    }
  });
  Field.create = function(fieldType, config){
    var alias = {
      'radiogroup': 'RadioGroup',
      'checkgroup': 'CheckGroup'
    }

    fieldType = alias[fieldType.toLowerCase()] || fieldType.capitalize();

    if (Field[fieldType])
      return new Field[fieldType](config);
    else
      throw new Error('Wrong field type `{0}`'.format(fieldType));
  };


  //
  // Simple fields
  //

 /**
  * @class
  */
  Field.Hidden = Field.subclass({
    className: namespace + '.Field.Hidden',

    selectable: false,

    template:
      '<input{field} type="hidden" />'
  });


 /**
  * @class
  */
  Field.Text = Field.subclass({
    className: namespace + '.Field.Text',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="text" />'
    ),

    init: function(config){
      Field.prototype.init.call(this, config);

      if (this.minLength)
        this.attachValidator(Validator.MinLength);

      if (this.autocomplete)
        this.tmpl.field.setAttribute('autocomplete', this.autocomplete);
    },
    setMaxLength: function(len){
      this.tmpl.field.setAttribute('maxlength', len, 0);

      Field.prototype.setMaxLength.call(this, len);
    }
  });


  /**
  * @class
  */
  Field.Password = Field.Text.subclass({
    className: namespace + '.Field.Password',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="password" />'
    )
  });


 /**
  * @class
  */
  Field.File = Field.subclass({
    className: namespace + '.Field.File',

    template: createFieldTemplate(baseFieldTemplate,
      '<input{field} type="file" />'
    )
  });


 /**
  * @class
  */
  Field.Textarea = Field.subclass({
    className: namespace + '.Field.Textarea',

    nextFieldOnEnter: false,

    template: createFieldTemplate(baseFieldTemplate,
      '<textarea{field} />'
    ),

    init: function(config){
      //this.value = this.value || '';
      this.counter = DOM.createElement('.counter', Field.LOCALE.Textarea.SYMBOLS_LEFT + ': ', DOM.createText(0));

      //inherit
      Field.prototype.init.call(this, config);

      if (this.minLength)
        this.attachValidator(Validator.MinLength);

      if (this.maxLength)
        this.attachValidator(Validator.MaxLength);

      Event.addHandler(this.tmpl.field, 'keyup', this.updateCounter, this);
      Event.addHandler(this.tmpl.field, 'input', this.updateCounter, this);

      if (window.opera)
      {
        Event.addHandler(this.tmpl.field, 'focus', function(event){
          this.contentEditable = true;
          this.contentEditable = false;
        });
      }
    },
    updateCounter: function(){
      var left = this.maxLength - this.getValue().length;
      this.counter.lastChild.nodeValue = left >= 0 ? left : 0;
    },
    setValue: function(value){
      Field.prototype.setValue.call(this, value);
      this.updateCounter();
    },
    setMaxLength: function(len){
      Field.prototype.setMaxLength.call(this, len);

      if (len)
      {
        this.updateCounter();
        DOM.insert(this.tmpl.sampleContainer, this.counter);
      }
      else
        DOM.remove(this.counter);
    },
    destroy: function(){
      delete this.counter;

      Field.prototype.destroy.call(this);
    }
  });


  /**
  * @class
  */
  Field.Checkbox = Field.subclass({
    className: namespace + '.Field.Checkbox',

    value: false,

    template:
      '<div class="Basis-Field Basis-Field-Checkbox">' +
        '<div{content} class="Basis-Field-Container {selected} {disabled}">' +
          '<label>' +
            '<input{field} type="checkbox" />' +
            '<span>{titleText}</span>' +
          '</label>' +
        '</div>' +
      '</div>',

    /*init: function(config){
      this.value = this.value || false;

      //inherit
      Field.prototype.init.call(this, config);
    },*/
    invert: function(){
      this.setValue(!this.getValue());
    },
    setValue: function(value){
      var state = this.tmpl.field.checked;
      this.tmpl.field.checked = !!value;

      if (state != this.tmpl.field.checked)
        this.event_change();
    },
    getValue: function(){
      return this.tmpl.field.checked;
    }
  });


  /**
  * @class
  */
  Field.Label = Field.subclass({
    className: namespace + '.Field.Label',
    cssClassName: 'Basis-Field-Label',

    template: createFieldTemplate(baseFieldTemplate,
      '<label{field}>{fieldValueText}</label>'
    ),
    valueGetter: Function.$self,
    event_change: function(){
      Field.prototype.event_change.apply(this, arguments);
      this.tmpl.fieldValueText.nodeValue = this.valueGetter(this.getValue());
    }
    /*setValue: function(newValue){
      Field.prototype.setValue.call(this, newValue);
      this.tmpl.fieldValueText.nodeValue = this.tmpl.field.value;
    }*/
  });


  //
  // Complex fields
  //

  var ComplexFieldItem = UINode.subclass({
    className: namespace + '.ComplexField.Item',

    childClass: null,

    titleGetter: function(item){
      return item.title || item.getValue();
    },
    valueGetter: getter('value'),

    getTitle: function(){
      return this.titleGetter(this);
    },
    getValue: function(){
      return this.valueGetter(this);
    }
  });

  var COMPLEXFIELD_SELECTION_HANDLER = {
    datasetChanged: function(){
      this.event_change();
    }
  }

 /**
  * @class
  */
  var ComplexField = Class(Field, UIContainer, {
    className: namespace + '.Field.ComplexField',
    childClass: ComplexFieldItem,

    template: Field.prototype.template,

    /*childFactory: function(itemConfig){
      var config = {
        //valueGetter: this.itemValueGetter,
        //titleGetter: this.itemTitleGetter
      };

      if (itemConfig.data || itemConfig.delegate)
        complete(config, itemConfig);
      else
        config.data = itemConfig;

      return new this.childClass(config);
    },*/

    multipleSelect: false,

    //itemValueGetter: getter('value'),
    //itemTitleGetter: function(data){ return data.title || data.value; },

    init: function(config){

      this.selection = new Selection({
        multiple: !!this.multipleSelect
      });
      this.selection.addHandler(COMPLEXFIELD_SELECTION_HANDLER, this);

      //inherit
      Field.prototype.init.call(this, config);

      Cleaner.add(this);
    },
    getValue: function(){
      var value = this.selection.getItems().map(getter('getValue()'));
      return !this.selection.multiple ? value[0] : value;
    },
    setValue: function(value/* value[] */){
      var source = this.multipleSelect ? Array.from(value) : [value];

      /*var source = this.selection.multiple 
        ? (value instanceof AbstractProperty
            ? Array.from(value.value).map(function(item){ return this.itemValueGetter(item.value) }, this)
            : Array.from(value)
          )
        : [value];*/

      var selected = {};
      source.forEach(function(key){ selected[key] = true });

      // prevent selection dispatch change event
      var selectedItems = [];
      for (var item = this.firstChild; item; item = item.nextSibling)
        if (selected[item.getValue()])
          selectedItems.push(item);

      this.selection.set(selectedItems);
    },
    destroy: function(){
      Field.prototype.destroy.call(this);

      Cleaner.remove(this);
    }
  });
  
  ComplexField.Item = ComplexFieldItem;

  //
  // Radio group
  //

 /**
  * @class
  */
  var RadioGroupItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.RadioGroup.Item',

    event_select: function(){
      this.tmpl.field.checked = true;
      ComplexFieldItem.prototype.event_select.call(this);

      //classList(this.element).add('selected');
    },
    event_unselect: function(){
      this.tmpl.field.checked = false;
      ComplexFieldItem.prototype.event_unselect.call(this);
      //classList(this.element).remove('selected');
    },
    event_enable: function(){
      this.tmpl.field.removeAttribute('disabled');

      UINode.prototype.event_enable.call(this);
    },
    event_disable: function(){
      this.tmpl.field.setAttribute('disabled', 'disabled');

      UINode.prototype.event_disable.call(this);
    },

    template:
      '<label class="Basis-RadioGroup-Item {selected} {disabled}" event-click="select">' + 
        '<input{field} type="radio" class="radio"/>' +
        '<span{content}>{titleText}</span>' +
      '</label>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);

      tmpl.field.value = this.getValue();
      tmpl.titleText.nodeValue = this.getTitle();
    },

    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select();
      }
    }
  });


 /**
  * @class
  */
  Field.RadioGroup = ComplexField.subclass({
    className: namespace + '.Field.RadioGroup',

    childClass: RadioGroupItem,

    template: createFieldTemplate(baseFieldTemplate,
      '<div{field|childNodesElement} class="Basis-RadioGroup"></div>'
    ),

    childFactory: function(config){
      var child = ComplexField.prototype.childFactory.call(this, config);

      if (this.name)
        child.tmpl.field.name = this.name;

      return child;
    }
  });

  Field.RadioGroup.Item = RadioGroupItem;


  //
  // Check Group
  //

 /**
  * @class
  */
  var CheckGroupItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.CheckGroup.Item',

    event_select: function(){
      this.tmpl.field.checked = true;
      ComplexFieldItem.prototype.event_select.call(this);
    },
    event_unselect: function(){
      this.tmpl.field.checked = false;
      ComplexFieldItem.prototype.event_unselect.call(this);
    },
    event_enable: function(){
      this.tmpl.field.removeAttribute('disabled');

      UINode.prototype.event_enable.call(this);
    },
    event_disable: function(){
      this.tmpl.field.setAttribute('disabled', 'disabled');

      UINode.prototype.event_disable.call(this);
    },

    template:
      '<label event-click="click" class="{selected} {disabled}">' + 
        '<input{field} type="checkbox"/>' +
        '<span{content}>{titleText}</span>' +
      '</label>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);

      this.tmpl.field.value = this.getValue();
      this.tmpl.titleText.nodeValue = this.getTitle();
    },

    action: {
      click: function(event){
        if (!this.isDisabled())
        {
          this.select(this.parentNode.multipleSelect);

          if (Event.sender(event).tagName != 'INPUT')
            Event.kill(event);
        }
      }
    }
  });


 /**
  * @class
  */
  Field.CheckGroup = ComplexField.subclass({
    className: namespace + '.Field.CheckGroup',

    childClass: CheckGroupItem,

    multipleSelect: true,

    template: createFieldTemplate(baseFieldTemplate,
      '<div{field|childNodesElement} class="Basis-CheckGroup"></div>'
    )
  });

  Field.CheckGroup.Item = CheckGroupItem;

  //
  // Select
  //

  var SelectItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.Select.Item',

    event_select: function(){
      if (this.parentNode)
        this.parentNode.setValue(this.getValue());
    },
    event_unselect: function(){
      if (this.parentNode)
        this.parentNode.setValue();
    },

    template:
      '<option{field}>{titleText}</option>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);

      tmpl.field.value = this.getValue();
      tmpl.field.text = this.getTitle();
    }
  });


 /**
  * @class
  */
  Field.Select = ComplexField.subclass({
    className: namespace + '.Field.Select',

    childClass: SelectItem,
    
    template: createFieldTemplate(baseFieldTemplate,
      '<select{field|childNodesElement} />'
    ),

    event_keyup: function(object, event){
      this.change();

      ComplexField.prototype.event_keyup.call(this, object, event);
    },

    setValue: function(value){
      var item = this.childNodes.search(value, 'getValue()');

      if (item)
        this.selection.set([item]);
      else
        this.selection.clear();
    }
  });

  Field.Select.Item = SelectItem;

  //
  //  Combobox
  //

  var ComboboxPopupHandler = {
    show: function(){
      classList(this.tmpl.field).add('Basis-DropdownList-Opened'); 
    },
    hide: function(){
      classList(this.tmpl.field).remove('Basis-DropdownList-Opened'); 
    }
  };

  //
  // Combobox
  //

  var ComboboxItem = ComplexFieldItem.subclass({
    className: namespace + '.Field.Combobox.Item',

    //titleGetter: Function.getter('data.title'),
    //valueGetter: Function.getter('data.value'),

    template:
      '<div class="Basis-Combobox-Item {selected} {disabled}" event-click="click">{titleText}</div>',

    templateUpdate: function(tmpl, eventName, delta){
      ComplexFieldItem.prototype.templateUpdate.call(this, tmpl, eventName, delta);
      tmpl.titleText.nodeValue = this.getTitle();
    },

    action: {
      click: function(event){
        if (!this.isDisabled())
        {
          this.select();

          if (this.parentNode)
            this.parentNode.hide();

          Event.kill(event);
        }
      }
    }
  });

  var ComboboxCaptionHandlers = {
    /*blur: function(){
      this.hide();
    },*/
    keyup: function(event){
      var key = Event.key(event);
      var cur = this.selection.pick();

      switch (key){
        case Event.KEY.DOWN:
          if (event.altKey)
            return this.popup.visible ? this.hide() : (!this.isDisabled() ? this.show() : null);

          //cur = cur ? cur.nextSibling : this.firstChild;
          cur = DOM.axis(cur ? cur : this.firstChild, DOM.AXIS_FOLLOWING_SIBLING).search(false, 'disabled');
        break;

        case Event.KEY.UP: 
          if (event.altKey)
            return this.popup.visible ? this.hide() : (!this.isDisabled() ? this.show() : null);

          cur = cur ? DOM.axis(cur, DOM.AXIS_PRESCENDING_SIBLING).search(false, 'disabled') : this.firstChild;
        break;
      }

      if (cur)
      {
        cur.select();
        DOM.focus(this.tmpl.field);
      }
    },
    keydown: function(event){
      var key = Event.key(event);
      if (key == Event.KEY.DOWN || key == Event.KEY.UP)
      {
        Event.kill(event);
      }
      else if (key == Event.KEY.ENTER)
      {
        if (this.popup.visible)
          this.hide();

        Event.kill(event);
      }
    }
  };
  
  Field.Combobox = ComplexField.subclass({
    className: namespace + '.Field.Combobox',

    childClass: ComboboxItem,

    event_enable: function(){
      if (this.delegate && this.delegate.select)
        this.delegate.select();

      ComplexField.prototype.event_enable.call(this);
    },
    /*event_update: function(object, delta){
      ComplexField.prototype.event_update.call(this, object, delta);
      // update title
      var title = this.getTitle() || this.getValue() || '';

      this.tmpl.field.title = 
      this.tmpl.captionText.nodeValue = this.captionFormater(title, this.getValue());
    },*/
    event_change: function(){
      ComplexField.prototype.event_change.call(this);

      var value = this.getValue();

      if (this.property)
        this.property.set(value);

      if (this.hidden)
        this.hidden.value = value;

      if (this.satellite)
        this.satellite.captionItem.setDelegate(this.selection.pick());
    },
    //}),

    caption: null,
    popup: null,
    property: null,

    template: createFieldTemplate(baseFieldTemplate,
      '<span{field} class="Basis-DropdownList" event-click="click" tabindex="0">' +
        '<span class="Basis-DropdownList-Caption"><!--{captionItem}--></span>' +
        '<span class="Basis-DropdownList-Trigger"/>' +
      '</span>' +
      '<div{content|childNodesElement} class="Basis-DropdownList-PopupContent" />'
    ),

    binding: {
      captionItem: 'satellite:'
    },

    action: {
      click: function(event){
        if (this.isDisabled() || this.popup.visible)
          this.hide();
        else
          this.show({});

        Event.kill(event);
      }
    },

    init: function(config){
      if (!basis.ui.popup)
        throw new Error('basis.ui.popup required for DropDownList');

      if (this.property)
        this.value = this.property.value;

      this.satelliteConfig = UIContainer.prototype.satelliteConfig.__extend__({
        captionItem: {
          instanceOf: this.childClass,
          delegate: getter('selection.pick()'),
          config: {
            getTitle: function(){
              return this.delegate && this.delegate.getTitle();
            },
            getValue: function(){
              return this.delegate && this.delegate.getValue();
            },
            handler: {
              delegateChanged: function(){
                this.event_update(this, {});
              }
            }
          }
        }
      });

      // inherit
      ComplexField.prototype.init.call(this, config);

      this.satellite.captionItem.setDelegate(this.selection.pick());

      Event.addHandlers(this.tmpl.field, ComboboxCaptionHandlers, this);

      if (this.name)
        DOM.insert(this.tmpl.field, this.hidden = DOM.createElement('INPUT[type=hidden][name={0}]'.format(String(this.name).quote())));

      // create items popup
      this.popup = new Popup(complete({
        cssClassName: 'Basis-DropdownList-Popup',
        autorotate: 1,
        ignoreClickFor: [this.tmpl.field],
        thread: this.thread,
        content: this.childNodesElement,
        handler: ComboboxPopupHandler,
        handlerContext: this
      }, this.popup));

      if (this.property)
        this.property.addLink(this, this.setValue);
    },
    /*select: function(){
      ComplexField.prototype.select.call(this);
      DOM.focus(this.tmpl.field);
    },*/
    show: function(){
      this.popup.show(this.tmpl.field); 
      this.select();
    },
    hide: function(){
      this.popup.hide();
    },
    getTitle: function(){
      var selected = this.selection.pick();
      return selected && selected.getTitle();
    },
    getValue: function(){
      var selected = this.selection.pick();
      return selected && selected.getValue();
    },
    setValue: function(value){
      /*if (value instanceof AbstractProperty)
        value = this.itemValueGetter(value.value);*/
      if (this.getValue() != value)
      {
        // update value & selection
        var item = this.childNodes.search(value, 'getValue()');
        if (item && !item.isDisabled())
          this.selection.set([item]);
        else
          this.selection.clear();

      }
    },
    destroy: function(){

      if (this.property)
      {
        this.property.removeLink(this);
        this.property = null;
      }

      this.popup.destroy();
      this.popup = null;

      ComplexField.prototype.destroy.call(this);
    }
  });

  Field.Combobox.Item = ComboboxItem;

  //
  //  Value validators
  //

  var ValidatorError = Class(null, {
    className: namespace + '.ValidatorError',

    init: function(field, message){
      this.field = field;
      this.message = message;
    }
  });

  var Validator = {
    NO_LOCALE: 'There is no locale for this error',
    RegExp: function(regexp){
      if (regexp.constructor != RegExp)
        regexp = new RegExp(regexp);
      return function(field){
        var value = field.getValue();
        if (value != '' && !value.match(regexp))
          return new ValidatorError(field, Validator.LOCALE.RegExp.WRONG_FORMAT || Validator.NO_LOCALE);
      }
    },
    Required: function(field){
      var value = field.getValue();
      if (Function.$isNull(value) || value == '')
        return new ValidatorError(field, Validator.LOCALE.Required.MUST_BE_FILLED || Validator.NO_LOCALE);
    },
    Number: function(field){
      var value = field.getValue();
      if (isNaN(value))
        return new ValidatorError(field, Validator.LOCALE.Number.WRONG_FORMAT || Validator.NO_LOCALE);
    },
    Currency: function(field){
      var value = field.getValue();
      if (isNaN(value))
        return new ValidatorError(field, Validator.LOCALE.Currency.WRONG_FORMAT || Validator.NO_LOCALE);
      if (value <= 0)
        return new ValidatorError(field, Validator.LOCALE.Currency.MUST_BE_GREATER_ZERO || Validator.NO_LOCALE);
    },
    Email: function(field){
      var value = field.getValue().trim();
      if (value != '' && !value.match(/^[a-z0-9\.\-\_]+\@(([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/i))
        return new ValidatorError(field, Validator.LOCALE.Email.WRONG_FORMAT || Validator.NO_LOCALE);
    },
    Url: function(field){
      var value = field.getValue().trim();
      if (value != '' && !value.match(/^(https?\:\/\/)?((\d{1,3}\.){3}\d{1,3}|([a-zA-Z][a-zA-Z\d\-]+\.)+[a-zA-Z]{2,6})(:\d+)?(\/[^\?]*(\?\S(\=\S*))*(\#\S*)?)?$/i))
        return new ValidatorError(field, Validator.LOCALE.Url.WRONG_FORMAT || Validator.NO_LOCALE);
    },
    MinLength: function(field){
      var value = field.getValue();
      var length = Function.$isNotNull(value.length) ? value.length : String(value).length;
      if (length < field.minLength)
        return new ValidatorError(field, (Validator.LOCALE.MinLength.MUST_BE_LONGER_THAN || Validator.NO_LOCALE).format(field.minLength));
    },
    MaxLength: function(field){
      var value = field.getValue();
      var length = Function.$isNotNull(value.length) ? value.length : String(value).length;
      if (length > field.maxLength)
        return new ValidatorError(field, (Validator.LOCALE.MaxLength.MUST_BE_SHORTER_THAN || Validator.NO_LOCALE).format(field.maxLength));
    }
  };

  //
  // FORM
  //

 /**
  * @class
  */
  var FormContent = UIControl.subclass({
    className: namespace + '.FormContent',
    
    childClass: Field,
    childFactory: function(config){
      return Field.create(config.type || 'text', config);
    },

    onSubmit: Function.$false,

    event_reset: createEvent('reset'),
    event_disable: function(){
      for (var field = this.firstChild; field; field = field.nextSibling)
        if (!field.disabled)
          field.event_disable();

       UIControl.prototype.event_disable.call(this);
    },
    event_enable: function(){
      for (var field = this.firstChild; field; field = field.nextSibling)
        if (!field.disabled)
          field.event_enable();

      UIControl.prototype.event_enable.call(this);
    },
    
    template:
      '<div class="Basis-FormContent {selected} {disabled}" />',

    getFieldByName: function(name){
      return this.childNodes.search(name, 'name');
    },
    getFieldById: function(id){
      return this.childNodes.search(id, 'id');
    },
    serialize: function(){
      var result = {};
      for (var field = this.firstChild; field; field = field.nextSibling)
      {
        if (field.serializable && field.name)
          result[field.name] = field.getValue();
      }
      return result;
    },
    setData: function(data, withoutValidate){
      ;;; if (typeof console != 'undefined') console.warn('FormContent.setData() method deprecated. Use FormContent.loadData() instead');
      this.loadData(data, withoutValidate);
    },
    loadData: function(data, withoutValidate){
      var names = Object.keys(data);
      for (var field = this.firstChild; field; field = field.nextSibling)
      {
        if (names.indexOf(field.name) != -1)
          field.setValue(data[field.name]);
        else
          field.setDefaultValue();

        field.setValid();  // set undefined valid
      }
      if (!withoutValidate)
        this.validate();
    },
    setDefaultState: function(){
      ;;; if (typeof console != 'undefined') console.warn('FormContent.setDefaultState() is deprecated. Use FormContent.reset() instead');
      this.reset();
    },
    reset: function(){
      for (var field = this.firstChild; field; field = field.nextSibling)
        field.setDefaultValue();
      this.event_reset();
    },
    validate: function(){
      var error, errors = new Array();
      for (var field = this.firstChild; field; field = field.nextSibling)
      {
        if (error = field.validate())
          errors.push(error);
      }
      if (errors.length)
      {
        errors[0].field.select();
        return errors;
      }
      else
        return true;
    },
    submit: function(){
      if (this.validate() === true && this.onSubmit)
        this.onSubmit(this.serialize());
    }
  });

 /**
  * @class
  */
  var Form = FormContent.subclass({
    className: namespace + '.Form',
    
    template:
      '<form{formElement} class="Basis-Form {selected} {disabled}">' +
        '<div{content|childNodesElement} class="Basis-FormContent" />' +
      '</form>',

    method: 'POST',

    init: function(config){
      this.selection = false;

      UIControl.prototype.init.call(this, config);

      if (this.target)
        this.formElement.target = this.target;

      if (this.action)
        this.formElement.action = this.action;

      if (this.enctype)
        this.formElement.enctype = this.enctype;

      Event.addHandler(this.formElement, 'submit', this.submit, this);

      this.formElement.onsubmit = this.submit;

      this.setMethod(this.method);
    },
    setMethod: function(method){
      this.formElement.method = method ? method.toUpperCase() : 'POST';
    },
    submit: function(){
      var result = (this.validate() === true) && !this.onSubmit();

      if (result)
        if (this.tagName == 'FORM')
          return false;
        else
          this.formElement.submit();

      return true;
    }
  });

  // additional

 /**
  * @class
  */
  var MatchProperty = Property.subclass({
    className: namespace + '.MatchProperty',

    matchFunction: function(child, reset){
      if (!reset)
      {
        var textNodes = child._original || this.textNodeGetter(child);

        if (!Array.isArray(textNodes))
          textNodes = [ textNodes ];

        child._original = textNodes;

        var matchCount = 0;

        for (var i = textNodes.length; i --> 0;)
        {
          var textNode = textNodes[i];

          if (!textNode)
            continue;

          var p = textNode.nodeValue.split(this.rx);
          if (p.length > 1)
          {
            if (!child._replaced) 
              child._replaced = {};

            DOM.replace(
              child._replaced[i] || textNode,
              child._replaced[i] = DOM.createElement('SPAN.matched', DOM.wrap(p, this.map))
            );

            matchCount++;
          }
          else
            if (child._replaced && child._replaced[i])
            { 
               DOM.replace(child._replaced[i], textNode);
               delete child._replaced[i];
            }
        }

        return matchCount > 0;
      }

      if (child._replaced)
      {
        for (var key in child._replaced)
          DOM.replace(child._replaced[key], child._original[key]);

        delete child._replaced;
        delete child._original;
      }

      return false;
    },

    event_change: function(value, oldValue){
      this.rx = this.regexpGetter(value);

      Property.prototype.event_change.call(this, value, oldValue);
    },

    extendConstructor_: true,

    init: function(config){
      var startPoints = this.startPoints || '';

      this.textNodeGetter = getter(this.textNodeGetter || 'tmpl.titleText');

      if (typeof this.regexpGetter != 'function')
        this.regexpGetter = function(value){ 
          return new RegExp('(' + startPoints + ')(' + value.forRegExp() + ')', 'i') 
        };

      this.map = {};
      this.map[this.wrapElement || 'SPAN.match'] = function(v, i){ return (i % 3) == 2 };

      Property.prototype.init.call(this, '', this.handlers, String.trim);

      /*if (this.handlers)
        this.addHandler(this.handlers);*/
    }
  });

  var NodeMatchHandler = {
    childNodesModified: function(object, delta){
      delta.inserted && delta.inserted.forEach(function(child){
        this.matchFunction(child, this.value == '');
      }, this);
    }
  }

 /**
  * @class
  */
  var Matcher = MatchProperty.subclass({
    className: namespace + '.Matcher',

    event_change: function(value, oldValue){
      MatchProperty.prototype.event_change.call(this, value, oldValue);

      this.applyMatch();
    },

    init: function(config){
      MatchProperty.prototype.init.call(this, config);

      this.node.addHandler(NodeMatchHandler, this);
    },

    applyMatch: function(){
      this.node.childNodes.forEach(function(child){
        this.matchFunction(child, this.value == '');
      }, this);
    }
  });

 /**
  * @class
  */
  var MatchFilter = MatchProperty.subclass({
    className: namespace + '.MatchFilter',

    event_change: function(value, oldValue){
      MatchProperty.prototype.event_change.call(this, value, oldValue);

      this.node.setMatchFunction(value ? this.matchFunction.bind(this) : null);
    }
  });
  
 /**
  * @class
  */
  var MatchInput = Field.Text.subclass({
    className: namespace + '.MatchInput',
    cssClassName: 'Basis-MatchInput',

    matchFilterClass: MatchFilter,

    event_keyup: function(event){
      this.matchFilter.set(this.tmpl.field.value);

      Field.Text.prototype.event_keyup.call(this, event);
    },

    event_change: function(event){
      this.matchFilter.set(this.tmpl.field.value);

      Field.Text.prototype.event_change.call(this, event);
    },

    init: function(config){
      Field.Text.prototype.init.call(this, config);

      this.matchFilter = new this.matchFilterClass(this.matchFilter);
    }
  });


  //
  // export names
  //

  this.extend({
    createFieldTemplate: function(template){
      return createFieldTemplate(baseFieldTemplate, template)
    },
    FormContent: FormContent,
    Form: Form,
    Field: Field,
    Validator: Validator,
    ValidatorError: ValidatorError,
    RadioGroup: Field.RadioGroup,
    CheckGroup: Field.CheckGroup,
    Combobox: Field.Combobox,
    ComplexField: ComplexField,
    Matcher: Matcher,
    MatchProperty: MatchProperty,
    MatchFilter: MatchFilter,
    MatchInput: MatchInput
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/form.js").call(basis.namespace("basis.ui.form"), basis.namespace("basis.ui.form"), basis.namespace("basis.ui.form").exports, this, __curLocation + "src/basis/ui/form.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/scroller.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 */

  'use strict';

  basis.require('basis.event');
  basis.require('basis.ui');
  basis.require('basis.animation');


 /**
  * @see ./demo/defile/scroller.html
  * @namespace basis.ui.scroller
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var DOM = basis.dom;
  var Event = basis.dom.event;

  var classList = basis.cssom.classList;

  var uiNode = basis.ui.Node;
  //
  // Main part
  //

  //css transform/transform3d feature detection
  var TRANSFORM_SUPPORT = false;
  var TRANSFORM_3D_SUPPORT = false;
  var TRANSFORM_PROPERTY_NAME;
  
  (function (){
    
    function testProps(element, properties) {
      var p;
      while (p = properties.shift()) {
        if (typeof element.style[p] != 'undefined') 
          return p;
      }
      return false;
    }

    var tester = DOM.createElement('');

    TRANSFORM_PROPERTY_NAME = testProps(tester, [
      'transform',
      'WebkitTransform',
      'msTransform',
      'MozTransform',
      'OTransform'
    ]);

    if (TRANSFORM_PROPERTY_NAME)
      TRANSFORM_SUPPORT = true;

    //transform3d
    if (TRANSFORM_SUPPORT)
    {
      var prop = testProps(tester, [
        'perspectiveProperty', 
        'WebkitPerspective', 
        'MozPerspective', 
        'OPerspective', 
        'msPerspective'
      ]);

      if (prop || 'webkitPerspective' in document.documentElement.style)
        TRANSFORM_3D_SUPPORT = true;
    }
  })();


  //consts
  var AVARAGE_TICK_TIME_INTERVAl = 15;
  var VELOCITY_DECREASE_FACTOR = 0.94;
  var MOVE_THRESHOLD = 5;

 /**
  * @class
  */
  var Scroller = EventObject.subclass({
    className: namespace + '.Scroller',

    //className: namespace + '.Scroller',
    minScrollDelta: 0,
    scrollX: true,
    scrollY: true,

    event_start: createEvent('start', 'scrollerObject'),
    event_finish: createEvent('finish', 'scrollerObject'),
    event_startInertia: createEvent('startInertia', 'scrollerObject'),
    event_updatePosition: createEvent('updatePosition', 'scrollerObject', 'scrollPosition'),

    init: function(config){
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;

      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.viewportX = 0;
      this.viewportY = 0;

      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      //this.lastViewportTargetX = this.viewportX;
      //this.lastViewportTargetY = this.viewportY;
      if (this.minScrollDelta == 0)
      {
        this.minScrollDeltaYReached = true;
        this.minScrollDeltaXReached = true;
      }

      //time
      this.updateFrameHandle = 0;
      this.lastMotionUpdateTime = 0;
      this.lastUpdateTime = 0;
      this.startTime = 0;

      //statuses
      this.processInertia = false;
      this.panningActive = false;

      //init
      EventObject.prototype.init.call(this, config);

      if (this.targetElement)
      {
        Event.addHandler(this.targetElement, 'mousedown', this.onMouseDown, this);
        Event.addHandler(this.targetElement, 'touchstart', this.onMouseDown, this);
      }

      this.onUpdateHandler = this.onUpdate.bind(this);

      this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePosition_styleTransform : this.updatePosition_styleTopLeft;
    },
   
    updatePosition_styleTopLeft: function(){
      if (this.scrollX)
        this.targetElement.style.left = -(this.viewportX) + 'px';
      if (this.scrollY)
        this.targetElement.style.top = -(this.viewportY) + 'px';
    },

    updatePosition_styleTransform: function(){
      var deltaX = -(this.isUpdating ? this.viewportX : Math.round(this.viewportX)) + 'px';
      var deltaY = -(this.isUpdating ? this.viewportY : Math.round(this.viewportY)) + 'px';

      this.targetElement.style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
    },

    resetVariables: function(){
      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      //this.lastViewportTargetX = this.viewportTargetX;
      //this.lastViewportTargetY = this.viewportTargetY;

      this.startX = this.viewportX;
      this.startY = this.viewportY;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;
      
      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      if (this.minScrollDelta != 0)
      {
        this.minScrollDeltaXReached = false;
        this.minScrollDeltaYReached = false;
      }
 
      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      this.isUpdating = true;
      this.lastUpdateTime = Date.now();
      this.updateFrameHandle = this.nextFrame();

      this.event_start(this);
    },

    stopUpdate: function(){
      if (!this.isUpdating)
        return;

      this.resetVariables();

      this.isUpdating = false;
      cancelAnimationFrame(this.updateFrameHandle);

      this.updateElementPosition();

      this.event_finish(this);
    },

    onMouseDown: function(event){
      this.stopUpdate();

      this.panningActive = true;
      this.isMoved = false;

      this.lastMouseX = Event.mouseX(event);
      this.lastMouseY = Event.mouseY(event);

      this.lastMotionUpdateTime = Date.now();

      Event.addHandler(document, 'mousemove', this.onMouseMove, this);
      Event.addHandler(document, 'touchmove', this.onMouseMove, this);
      Event.addHandler(document, 'mouseup', this.onMouseUp, this);
      Event.addHandler(document, 'touchend', this.onMouseUp, this);

      //Event.cancelBubble(event);
      //Event.cancelDefault(event);
    },

    onMouseMove: function(event){
      if (this.minScrollDelta == 0 || this.minScrollDeltaYReached || this.minScrollDeltaXReached)
      {
        this.startUpdate();
      }

      var time = Date.now();
      var deltaTime = time - this.lastMotionUpdateTime;
      this.lastMotionUpdateTime = time;

      if (!deltaTime)
        return;
     
      if (this.minScrollDeltaXReached || !this.minScrollDeltaYReached)
      {

        var curMouseX = Event.mouseX(event)
        var deltaX = this.lastMouseX - curMouseX;
        this.lastMouseX = curMouseX;
        this.viewportTargetX += deltaX;

        if (!this.isMoved && Math.abs(this.startX - this.viewportTargetX) > MOVE_THRESHOLD)
          this.isMoved = true;
      }

      if (this.minScrollDeltaYReached || !this.minScrollDeltaXReached)
      {
        var curMouseY = Event.mouseY(event)
        var deltaY = this.lastMouseY - curMouseY;
        this.lastMouseY = curMouseY;
        this.viewportTargetY += deltaY;

        if (!this.isMoved && Math.abs(this.startY - this.viewportTargetY) > MOVE_THRESHOLD)
          this.isMoved = true;
      }

      if (this.minScrollDelta > 0)
      {
        if (!this.minScrollDeltaXReached && !this.minScrollDeltaYReached)
        {
          if (Math.abs(this.viewportTargetX - this.viewportX) > this.minScrollDelta)
            this.minScrollDeltaXReached = true;

          if (Math.abs(this.viewportTargetY - this.viewportY) > this.minScrollDelta)
            this.minScrollDeltaYReached = true;          

          if (this.minScrollDeltaYReached)
          {
            this.viewportTargetX = this.viewportX;
            this.currentDirectionX = 0;
          }

          if (this.minScrollDeltaXReached)
          {
            this.viewportTargetY = this.viewportY;
            this.currentDirectionY = 0;
          }
        }
      }

      Event.cancelDefault(event);
    },

    onMouseUp: function(){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdateTime;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdateTime = 0;
      
      if (this.scrollX)
      {
        // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia
        this.currentVelocityX *= 1 - Math.min(1, Math.max(0, deltaTime / 100));
      }

      if (this.scrollY)
        this.currentVelocityY *= 1 - Math.min(1, Math.max(0, deltaTime / 100));

      Event.removeHandler(document, 'mousemove', this.onMouseMove, this);
      Event.removeHandler(document, 'touchmove', this.onMouseMove, this);
      Event.removeHandler(document, 'mouseup',   this.onMouseUp, this);
      Event.removeHandler(document, 'touchend',  this.onMouseUp, this);

      this.event_startInertia(this);
    },

    onUpdate: function(time){
      if (!time)
        time = Date.now();

      var deltaTime = time - this.lastUpdateTime;
      this.lastUpdateTime = time;

      if (!deltaTime)
      {
        this.nextFrame();
        return;
      }

      if (this.panningActive)
      {
        var delta;

        if (this.scrollX)
        {
          delta = (this.viewportTargetX - this.viewportX/*this.lastViewportTargetX*/);
          //this.lastViewportTargetX = this.viewportTargetX;

          if (delta)
          {
            this.currentVelocityX = delta / deltaTime;
            this.currentDirectionX = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }

        if (this.scrollY)
        {
          delta = (this.viewportTargetY - this.viewportY/*this.lastViewportTargetY*/);
          //this.lastViewportTargetY = this.viewportTargetY;

          if (delta)
          {
            this.currentVelocityY = delta / deltaTime;
            this.currentDirectionY = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }
      }
      else if (this.processInertia)
      {
        if (this.scrollX)
        {
          this.viewportTargetX += (this.currentVelocityX *  deltaTime);
          this.currentVelocityX *= VELOCITY_DECREASE_FACTOR;
        }
        if (this.scrollY)
        {
          this.viewportTargetY += (this.currentVelocityY *  deltaTime);
          this.currentVelocityY *= VELOCITY_DECREASE_FACTOR;
        }
      }

      var deltaX = 0;
      var deltaY = 0;

      if (this.scrollX)
      {
        deltaX = (this.viewportTargetX - this.viewportX);
        var smoothingFactorX = this.panningActive || Math.abs(this.currentVelocityX) > 0 ? 1 : 0.12;
        this.viewportX += deltaX * smoothingFactorX;
      }
      if (this.scrollY)
      {
        deltaY = (this.viewportTargetY - this.viewportY);
        var smoothingFactorY = this.panningActive || Math.abs(this.currentVelocityY) > 0 ? 1 : 0.12;
        this.viewportY += deltaY * smoothingFactorY;
      }

      var scrollXStop = !this.scrollX || (/*this.currentVelocityX < 0.01 &&*/ Math.abs(deltaX) < 0.5);
      var scrollYStop = !this.scrollY || (/*this.currentVelocityY < 0.01 &&*/ Math.abs(deltaY) < 0.5);

      if (!this.panningActive && scrollXStop && scrollYStop)
      {
        if (this.scrollX)
          this.viewportX = this.viewportTargetX;

        if (this.scrollY)
          this.viewportY = this.viewportTargetY;

        this.stopUpdate();
      }

      this.updateElementPosition();
      this.event_updatePosition(this, time, this.viewportX, this.viewportY);

      this.nextFrame();
    },

    nextFrame: function(){
      if (this.isUpdating)
        this.updateFrameHandle = requestAnimationFrame(this.onUpdateHandler, this.targetElement);
    },

    setPosition: function(positionX, positionY, instantly){
      this.setPositionX(positionX, !instantly);
      this.setPositionY(positionY, !instantly);      
    },

    setPositionX: function(positionX, smooth){
      if (smooth)
      {
        this.viewportTargetX = positionX || 0;
        this.currentVelocityX = 0;
        this.startUpdate();
      }
      else
      {
        this.stopUpdate();
        this.viewportX = positionX;
        this.viewportTargetX = positionX;
        this.updateElementPosition();
      }
    },

    setPositionY: function(positionY, smooth){
      if (smooth)
      {
        this.viewportTargetY = positionY || 0;
        this.currentVelocityY = 0;
        this.startUpdate();
      }
      else
      {
        this.stopUpdate();
        this.viewportY = positionY;
        this.viewportTargetY = positionY;
        this.updateElementPosition();
      }
    },

    calcExpectedPosition: function(axis){
      var expectedInertiaDelta = 0;

      var currentVelocity = axis == 'x' ? this.currentVelocityX : this.currentVelocityY;
      var currentDirection = currentVelocity > 0 ? 1 : -1; //axis == 'x' ? this.currentDirectionX : this.currentDirectionY;
      var viewportTargetPosition = axis == 'x' ? this.viewportTargetX : this.viewportTargetY;

      if (currentVelocity)
      {
        var expectedInertiaIterationCount = Math.log(0.001 / Math.abs(currentVelocity)) / Math.log(VELOCITY_DECREASE_FACTOR);
        var velocity = currentVelocity;
        for (var i = 0; i < expectedInertiaIterationCount; i++)
        {
          expectedInertiaDelta += velocity * AVARAGE_TICK_TIME_INTERVAl;
          velocity *= VELOCITY_DECREASE_FACTOR;
        }
      }
      var expectedPosition = viewportTargetPosition + expectedInertiaDelta;

      return expectedPosition;
    },
    calcExpectedPositionX: function(){
      return this.calcExpectedPosition('x');
    },
    calcExpectedPositionY: function(){
      return this.calcExpectedPosition('y');
    }
  });

 /**
  * @class
  */
  var Scrollbar = uiNode.subclass({
    className: namespace + '.Scrollbar',

    cssClassName: 'Basis-ScrollPanel-Scrollbar',

    template: 
      '<div class="Basis-Scrollbar {selected} {disabled}">' +
        '<div{trackElement} class="Basis-Scrollbar-Track"></div>' +
      '</div>',

    listen: {
      owner: {
        realign: function(){
          this.realign();
        },
        updatePosition: function(){
          if (!this.trackSize)
            this.realign();

          var scrollPosition = this.getScrollbarPosition();
 
          if (scrollPosition > 1)
            scrollPosition = 1 + (scrollPosition - 1) * 3;
          if (scrollPosition < 0)
            scrollPosition *= 3;

          var startPosition = Math.max(0, Math.min(this.trackSize  * scrollPosition, this.scrollbarSize - 4));
          var endPosition = Math.max(0, Math.min(this.trackSize - this.trackSize  * scrollPosition, this.scrollbarSize - 4));

          var style = {};
          style[this.startProperty] = startPosition + 'px';
          style[this.endProperty] = endPosition + 'px';
          
          DOM.setStyle(this.tmpl.trackElement, style);
        }
      }
    },
    realign: function(){
      this.scrollbarSize = this.getScrollbarSize();
      this.trackSize = this.scrollbarSize - this.scrollbarSize * this.getScrollbarPart();
    },
    getScrollbarSize: Function.$null,
    getScrollbarPart: Function.$null,
    getScrollbarPosition: Function.$null
  });

  /**
   * @class
   */
  var HorizontalScrollbar = Scrollbar.subclass({
    className: namespace + '.HorizontalScrollbar',
    cssClassName: 'horizontal',
    startProperty: 'left',
    endProperty: 'right',
    getScrollbarSize: function(){
      return this.element.offsetWidth;
    },
    getScrollbarPart: function(){
      return this.owner.element.offsetWidth / (this.owner.maxPositionX - this.owner.minPositionX + this.owner.element.offsetWidth);
    },
    getScrollbarPosition: function(){
      return (this.owner.scroller.viewportX - this.owner.minPositionX) / (this.owner.maxPositionX - this.owner.minPositionX);      
    }
  });

  /**
   * @class
   */
  var VerticalScrollbar = Scrollbar.subclass({
    className: namespace + '.VerticalScrollbar',
    cssClassName: 'vertical',
    startProperty: 'top',
    endProperty: 'bottom',
    getScrollbarSize: function(){
      return this.element.offsetHeight;
    },
    getScrollbarPart: function(){
      return this.owner.element.offsetHeight / (this.owner.maxPositionY - this.owner.minPositionY + this.owner.element.offsetHeight);
    },
    getScrollbarPosition: function(){
      return (this.owner.scroller.viewportY - this.owner.minPositionY) / (this.owner.maxPositionY - this.owner.minPositionY);      
    }
  });

 /**
  * @class
  */
  var ScrollPanel = Class(basis.ui.Container, {
    className: namespace + '.ScrollPanel',

    useScrollbars: true,
    scrollX: true, 
    scrollY: true,
    wheelDelta: 40,

    event_realign: createEvent('realign'),
    event_updatePosition: createEvent('updatePosition'),

    template: 
      '<div class="Basis-ScrollPanel" event-mousewheel="onwheel">' +
        '<div{scrollElement|childNodesElement|content} class="Basis-ScrollPanel-Content {selected} {disabled}"/>' +
        '<!--{horizontalScrollbar}-->' +
        '<!--{verticalScrollbar}-->' +
      '</div>',

    binding: {
      horizontalScrollbar: 'satellite:',
      verticalScrollbar: 'satellite:'
    },

    action: {
      onwheel: function(event){
        var delta = Event.wheelDelta(event);

        if (this.scrollY)
          this.scroller.setPositionY(this.scroller.viewportTargetY - this.wheelDelta * delta, true);
        else if (this.scrollX)
          this.scroller.setPositionX(this.scroller.viewportTargetX - this.wheelDelta * delta, true);

        Event.kill(event);
      }
    },

    satelliteConfig: {
      horizontalScrollbar: {
        instanceOf: HorizontalScrollbar,
        existsIf: function(object){
          return object.useScrollbars && object.scrollX;
        }
      },
      verticalScrollbar: {
        instanceOf: VerticalScrollbar,
        existsIf: function(object){
          return object.useScrollbars && object.scrollY;
        }
      }
    },

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);

      //init variables
      this.minPositionX = 0;
      this.minPositionY = 0;

      this.maxPositionX = 0;
      this.maxPositionY = 0;

      // create scroller
      var scrollerConfig = Object.extend(this.scroller || {}, {
        targetElement: this.tmpl.scrollElement,
        scrollX: this.scrollX,
        scrollY: this.scrollY
      });

      this.scroller = new Scroller(scrollerConfig);

      this.scroller.addHandler({
        updatePosition: this.updatePosition,
        start: function(){
          if (!this.maxPositionX && !this.maxPositionY)
            this.realign();

          classList(this.element).add('scrollProcess');
        },
        finish: function(){
          classList(this.element).remove('scrollProcess');
        }
      }, this);

      classList(this.element).bool('bothScrollbars', this.scrollX && this.scrollY);

      // add resize handler
      basis.layout.addBlockResizeHandler(this.tmpl.scrollElement, this.realign.bind(this));
    },

    updatePosition: function(){
      if (!this.scroller.panningActive)
        this.fixPosition();

      this.event_updatePosition(this);
    },

    fixPosition: function(){
      var scroller = this.scroller;

      if (this.scrollX && (scroller.viewportX < this.minPositionX || scroller.viewportX > this.maxPositionX))
      {
        var positionX = Math.min(this.maxPositionX, Math.max(this.minPositionX, scroller.viewportX));
        scroller.setPositionX(positionX, true);
      }

      if (this.scrollY && (scroller.viewportY < this.minPositionY || scroller.viewportY > this.maxPositionY))
      {
        var positionY = Math.min(this.maxPositionY, Math.max(this.minPositionY, scroller.viewportY));
        scroller.setPositionY(positionY, true);
      }
    },

    realign: function(){
      if (this.element.offsetWidth)
      {
        this.calcDimensions();
        this.updatePosition();
        this.event_realign();
      }
    },
    
    calcDimensions: function(){
      if (this.scrollX)
      {
        var containerWidth = this.element.offsetWidth;
        var scrollWidth = this.tmpl.scrollElement.scrollWidth;
        this.maxPositionX = Math.max(0, scrollWidth - containerWidth);
      }

      if (this.scrollY)
      {
        var containerHeight = this.element.offsetHeight;
        var scrollHeight = this.tmpl.scrollElement.scrollHeight;
        this.maxPositionY = Math.max(0, scrollHeight - containerHeight);
      }
    },

    destroy: function(){
      this.scroller.destroy();

      basis.ui.Node.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var ScrollGallery = ScrollPanel.subclass({
    className: namespace + '.ScrollGallery',
    scrollX: false,
    scrollY: false,
    childTransform: Function.$null,
  
    selection: true,

    action: {
      onwheel: function(event){
        var delta = Event.wheelDelta(event);

        var selected = this.selection.pick();
        var nextChild = delta == -1 ? selected.nextSibling : selected.previousSibling;
        
        if (nextChild)
          nextChild.select();
          
        Event.kill(event);
      }
    },

    event_childNodesModified: function(object, delta){
      ScrollPanel.prototype.event_childNodesModified.call(this, object, delta);

      if (this.scroller && this.childNodes.length == delta.inserted.length)
      {
        this.scrollToChild(this.firstChild, true);
        this.firstChild.select();
      }
    },

    childClass: uiNode.subclass({
      template: 
        '<div class="{selected} {disabled}" event-click="select"/>',

      action: {
        select: function(){
          if (!this.parentNode.scroller.isMoved)
            this.select();
        }
      },

      event_select: function(){
        uiNode.prototype.event_select.apply(this, arguments);
        this.parentNode.scrollToChild(this);
      }
    }),

    init: function(config){
      ScrollPanel.prototype.init.call(this, config);

      this.scroller.addHandler({
        startInertia: this.adjustPosition
      }, this);

      if (this.childTransform != Function.$null)
      {
        this.scroller.addHandler({
          updatePosition: this.applyPosition
        }, this);
      }

      if (!this.selection.itemCount && this.firstChild)
      {
        this.firstChild.select();
        this.scrollToChild(this.firstChild, true);
      }
    },                         

    setPosition: function(position, instantly){
      if (this.scrollX)
        this.scroller.setPositionX(position, !instantly);
      else 
        this.scroller.setPositionY(position, !instantly);
    },

    adjustPosition: function(){
      var childSize = this.scrollX ? this.firstChild.element.offsetWidth : this.firstChild.element.offsetHeight;
      var startPosition = (this.scrollX ? this.element.offsetWidth : this.element.offsetHeight) / 2;

      var newPosition = startPosition - childSize / 2 + this.calcExpectedPosition();
  
      var childScrollTo = Math.max(0, Math.min(this.childNodes.length - 1, Math.round(newPosition / childSize)));
      this.scrollToChild(this.childNodes[childScrollTo]);
    },

    applyPosition: function(){
      var childSize = this.scrollX ? this.firstChild.element.offsetWidth : this.firstChild.element.offsetHeight;
      var startPosition = this.scrollX ? this.element.offsetWidth / 2 : this.element.offsetHeight / 2;

      var newPosition = startPosition - childSize / 2 + (this.scroller.viewportX || this.scroller.viewportY);

      var closestChildPos = Math.floor(newPosition / childSize);
      var offset = newPosition / childSize - closestChildPos;

      var closeness;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        closeness = i == closestChildPos ? 1 - offset : (i == closestChildPos + 1 ? offset : 0);
        this.childTransform(child, closeness);  
      }
    },

    scrollToChild: function(child, instantly){
      var startPosition = this.scrollX ? this.element.offsetWidth / 2 : this.element.offsetHeight / 2;
      var childPosition = this.scrollX ? child.element.offsetLeft : child.element.offsetTop;
      var childSize = this.scrollX ? child.element.offsetWidth : child.element.offsetHeight;

      //console.log(childPosition + childSize / 2 - startPosition);
      this.setPosition(childPosition + childSize / 2 - startPosition, instantly);
    },

    calcDimensions: function(){
      ScrollPanel.prototype.calcDimensions.call(this);

      if (this.scrollX)
      {
        this.minPositionX = (this.firstChild ? this.firstChild.element.offsetWidth / 2 : 0) - this.element.offsetWidth / 2;
        this.maxPositionX = this.maxPositionX + this.element.offsetWidth / 2 - (this.lastChild ? this.lastChild.element.offsetWidth / 2 : 0);
      }

      if (this.scrollY)
      {
        this.minPositionY = (this.firstChild ? this.firstChild.element.offsetHeight / 2 : 0) - this.element.offsetHeight / 2;
        this.maxPositionY = this.maxPositionY + this.element.offsetHeight / 2 - (this.lastChild ? this.lastChild.element.offsetHeight / 2 : 0);
      }
    },

    calcExpectedPosition: function(){
      return this.scroller.calcExpectedPosition(this.scrollX ? 'x' : 'y');
    }
  });


  //
  // export names
  //

  this.extend({
    Scroller: Scroller,
    Scrollbar: Scrollbar,
    ScrollPanel: ScrollPanel,
    ScrollGallery: ScrollGallery
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/scroller.js").call(basis.namespace("basis.ui.scroller"), basis.namespace("basis.ui.scroller"), basis.namespace("basis.ui.scroller").exports, this, __curLocation + "src/basis/ui/scroller.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/slider.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 */

  'use strict';

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.html');
  basis.require('basis.layout');
  basis.require('basis.dragdrop');


 /**
  * @see ./demo/defile/slider.html
  * @namespace basis.ui.slider
  */ 
  
  var namespace = this.path;


  //
  // import names
  //

  var DOM = basis.dom;
  var Event = basis.dom.event;

  var events = basis.event.events;
  var createEvent = basis.event.create;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;

  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var Box = basis.layout.Box;


  //
  // main part
  //

  var KEY_PLUS = 187;      // +
  var KEY_KP_PLUS = 107;   // KEYPAD +
  var KEY_MINUS = 189;     // -
  var KEY_KP_MINUS = 109;  // KEYPAD -

  function percent(value){
    return (100 * value || 0).toFixed(4) + '%';
  }


 /**
  * @class
  */
  var Mark = UINode.subclass({
    className: namespace + '.Mark',

    pos: 0,
    caption: '\xA0',

    template:
      '<div class="Basis-Slider-Mark {selected} {disabled}">' +
        '<span class="Basis-Slider-Mark-CaptionWrapper">' +
          '<span class="Basis-Slider-Mark-Caption">' +
            '{text}' +
          '</span>' +
        '</span>' +
      '</div>',

    templateUpdate: function(tmpl){
      var element = tmpl.element;

      tmpl.text.nodeValue = this.caption;

      cssom.setStyle(this.element, {
        left: percent(this.pos),
        width: percent(this.width)
      });

      if (this.isLast)
        classList(this.element).add('last');

      if (this.isRange)
        classList(this.element).add('range');
    }
  });

 /**
  * @class
  */
  var MarkLayer = UIContainer.subclass({
    className: namespace + '.MarkLayer',

    template: 
      '<div class="Basis-Slider-MarkLayer"/>',

    childClass: Mark,

    captionGetter: Function.$self,

    count: 0,
    marks: null,

    init: function(config){
      UIContainer.prototype.init.call(this, config);
      this.apply();
    },

    apply: function(){
      var marks = this.marks || [];
      var owner = this.owner_;

      if (!owner)
        return;

      if (this.count > 0)
      {
        for (var i = 1, count = this.count; i <= count; i++)
        {
          var value = owner.closest(i / count);

          marks.push({
            pos: owner.value2pos(value),
            caption: this.captionFormat(value),
            isLast: count == i
          });
        }
      }

      marks = marks.filter(Function.$isNotNull).sortAsObject('pos');

      var pos = 0;
      for (var i = 0, mark; mark = marks[i]; i++)
      {
        mark.width = mark.pos - pos;
        mark.pos = pos;
        pos += mark.width;
      }

      if (pos != 1)
        marks.push({
          pos: pos,
          width: 1 - pos,
          isLast: true
        });

      this.setChildNodes(marks);
    }
  });


  //
  // Slider
  //

  var eventToValue = function(event){
    var scrollbar = this.tmpl.scrollbar;
    var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
    this.setStepValue(pos * this.stepCount);
  };

  var DRAGDROP_HANDLER = {
    move: function(config, event){
      eventToValue.call(this, event);
    }
  };

 /**
  * @class
  */
  var Slider = UINode.subclass({
    className: namespace + '.Slider',

    event_change: createEvent('change', 'oldValue') && function(sender, oldValue){
      events.change.call(this, sender, oldValue);
      this.templateUpdate(this.tmpl, 'change');
    },

    event_rangeChanged: createEvent('rangeChanged') && function(sender){
      events.rangeChanged.call(this, sender);
      this.templateUpdate(this.tmpl, 'rangeChanged');
    },

    captionFormat: function(value){
      return Math.round(Number(value));
    },

    marks: 'auto',

    min: 0,
    max: 100,
    step: NaN,
    value: NaN,

    stepCount: NaN,
    stepValue: NaN,

   /**
    * @inheritDoc
    */
    template:
    	'<div class="Basis-Slider Basis-Slider-MinMaxOutside {selected} {disabled}" event-mousewheel="focus wheelStep" event-keyup="keyStep" event-mousedown="focus" tabindex="0">' +
        '<div class="Basis-Slider-MinLabel"><span class="caption">{minValue}</span></div>' +
        '<div class="Basis-Slider-MaxLabel"><span class="caption">{maxValue}</span></div>' +
        '<div class="Basis-Slider-ScrollbarContainer" event-click="jumpTo">' +
      	  '<!--{marks}-->' +
          '<div{scrollbar} class="Basis-Slider-Scrollbar">' +
            '<div{valueBar} class="Basis-Slider-ValueBar">' +
              '<div{scrollTrumb} class="Basis-Slider-Thumb"/>' +
            '</div>' +
            '<div{leftBar} class="Basis-Slider-LeftBar"/>' +
          '</div>' +
        '</div>' +
    	'</div>',

    binding: {
      marks: 'satellite:'
    },

   /**
    * @inheritDoc
    */
    action: {
      jumpTo: eventToValue,
      focus: function(){
        DOM.focus(this.element);
      },
      keyStep: function(event){
        switch(Event.key(event))
        {
          case Event.KEY.DOWN:
          case Event.KEY.LEFT:
          case KEY_MINUS:
          case KEY_KP_MINUS:
            this.stepDown();
          break;
          
          case Event.KEY.UP:
          case Event.KEY.RIGHT:
          case KEY_PLUS:
          case KEY_KP_PLUS:
            this.stepUp();
          break;

          case Event.KEY.PAGEDOWN:
            this.stepDown(10);
          break;
          
          case Event.KEY.PAGEUP:
            this.stepUp(10);
          break;
          
          case Event.KEY.HOME:
            this.setValue(this.min);
          break;
          
          case Event.KEY.END:
            this.setValue(this.max);
          break;
        }
      },
      wheelStep: function(event){
        if (Event.wheelDelta(event) < 0)
          this.stepDown();
        else
          this.stepUp();
      }
    },

   /**
    * @inheritDoc
    */
    satelliteConfig: {
      marks: UIContainer.subclass({
        className: namespace + '.MarkLayers',
        template: '<div class="Basis-Slider-MarkLayers {selected} {disabled}"/>',
        childClass: MarkLayer
      })
    },

   /**
    * @inheritDoc
    */
    templateUpdate: function(tmpl, eventName){
      if (!eventName || eventName == 'rangeChanged')
      {
        tmpl.minValue.nodeValue = this.captionFormat(this.min);
        tmpl.maxValue.nodeValue = this.captionFormat(this.max);

        classList(this.element).bool('NoMax', this.max == this.min);
      }

      if (!eventName || eventName == 'change')
      {
        cssom.setStyle(tmpl.valueBar, {
          width: percent(this.value2pos(this.value))
        });
      }
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      // save init values
      var step = this.step;
      var value = this.value;

      // make new values possible
      this.step = NaN;
      this.value = NaN;

      // inherit
      UINode.prototype.init.call(this, config);

      // set properties
      this.setRange(this.min, this.max, step || 1);
      this.setValue(isNaN(value) ? this.min : value);

      // add drag posibility for slider
      this.scrollbarDD = new DragDropElement({
        element: this.tmpl.scrollTrumb,
        handler: DRAGDROP_HANDLER,
        handlerContext: this
      });
    },

   /**
    * @param {number} min
    * @param {number} max
    * @param {number} step
    */
    setRange: function(min, max, step){
      if (min > max)
      {
        var t = min;
        min = max;
        max = t;
      }

      step = step || 1;
      min = min || 0;

      if (this.min != min || this.max != max || this.step != step)
      {
        this.stepCount = Math.ceil((max - min) / step);

        this.step = step;
        this.min = min;
        this.max = this.min + this.stepCount * this.step;

        this.setValue(this.value || this.min);

        //
        // update marks
        //

        if (this.marks && this.satellite.marks instanceof AbstractNode)
        {
          var marks = Array.isArray(this.marks) ? this.marks : [this.marks];
          this.satellite.marks.setChildNodes(marks.map(function(layer){
            if (typeof layer != 'object')
              layer = { count: layer };

            var layerConfig = Object.extend({
              captionFormat: this.captionFormat,
              owner_: this
            }, layer);

            if (layerConfig.count == 'auto')
              layerConfig.count = Math.min(this.stepCount, 20);

            return layerConfig;
          }, this));
        }
      }
    },

   /**
    * @param {number} pos Float value between 0 and 1.
    * @return {number} Closest to pos value.
    */
    closest: function(pos){
      return this.normalize(this.min + (this.max - this.min) * pos.fit(0, 1) + (this.step / 2));
    },

   /**
    */
    value2pos: function(value){     
      return (value.fit(this.min, this.max) - this.min) / (this.max - this.min);
    },

   /**
    * Returns valid value according to min, max and step.
    * @param {number} value Value to normalize.
    * @return {number} Normalized value
    */
    normalize: function(value){
      if (value < this.min)
        value = this.min;
      else
        if (value > this.max)
          value = this.max;

      return this.min + Math.floor(0.00001 + (value - this.min) / this.step) * this.step;
    },

   /**
    * Adds count steps to value.
    * @param {number} count
    */
    stepUp: function(count){
      this.setStepValue(this.stepValue + parseInt(count || 1));
    },

   /**
    * Subtracts count steps to value.
    * @param {number} count
    */
    stepDown: function(count){
      this.setStepValue(this.stepValue - parseInt(count || 1));
    },

   /**
    * Set value in step count
    * @param {number} stepCount
    */
    setStepValue: function(stepValue){
      stepValue = Math.round(stepValue).fit(0, this.stepCount);

      if (this.stepValue != stepValue)
      {
        var oldValue = this.value;

        this.value = this.normalize(this.min + stepValue * this.step);
        this.stepValue = stepValue;

        this.event_change(this, oldValue);
      }
    },

   /**
    * Set new value
    * @param {number} newValue
    */
    setValue: function(newValue){
      this.setStepValue((newValue - this.min) / this.step);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    Slider: Slider,
    MarkLayer: MarkLayer,
    Mark: Mark
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/slider.js").call(basis.namespace("basis.ui.slider"), basis.namespace("basis.ui.slider"), basis.namespace("basis.ui.slider").exports, this, __curLocation + "src/basis/ui/slider.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/resizer.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 * Vladimir Ratsev <wuzykk@gmail.com>
 * Vladimir Fateev <vnfateev@gmail.com>
 *
 */

  'use strict';

  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.dragdrop');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/resizer.html
  * @namespace basis.ui.resizer
  */

  var namespace = this.path;


  //
  // import names
  //

  var DOM = basis.dom;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var DragDropElement = basis.dragdrop.DragDropElement;


  //
  // main part
  //

  var getComputedStyle;

  function getPixelValue(element, value) {
    if (IS_PIXEL.test(value))
      return parseInt(value) + 'px';

    // The awesome hack by Dean Edwards
    // @see http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    var style = element.style.left;
    var runtimeStyle = element.runtimeStyle.left;

    // set new values
    element.runtimeStyle.left = element.currentStyle.left;
    element.style.left = value || 0;

    // fetch new value
    value = element.style.pixelLeft;

    // restore values
    element.style.left = style;
    element.runtimeStyle.left = runtimeStyle;

    // return value in pixels
    return value + 'px';
  };

  if ('getComputedStyle' in global)
  {
    // Gecko's getComputedStyle returns computed values for top/bottom/left/right/height/width, but 
    // according to W3C spec getComputedStyle should returns used values.
    //
    // https://developer.mozilla.org/en/DOM/window.getComputedStyle:
    //   The returned object actually represents the CSS 2.1 used values, not the computed values.
    //   Originally, CSS 2.0 defined the computed values to be the "ready to be used" values of properties
    //   after cascading and inheritance, but CSS 2.1 redefined computed values as pre-layout, and used
    //   values as post-layout. The getComputedStyle function returns the old meaning of computed values,
    //   now called used values. There is no DOM API to get CSS 2.1 computed values.
    // 
    // This workaround helps fetch used values instead of computed. It doesn't work with some pseudo-classes
    // like :empty, :only-child, :nth-child and so on, but in general cases it should works fine.
    // The main idea that getComputedStyle returns used values for elements which not in document, because layout
    // properties can't calculated outside of document. But it still returns style according rule set that will be
    // applied to element when it in document. Based on this, we clone element's ancestor vector and get computed
    // style on cloned element. Ancestor cloning is necessary, because it influence on rule set that apply to element.
    var GETCOMPUTEDSTYLE_BUGGY = {};
    basis.dom.event.onLoad(function(){
      var element = DOM.insert(document.body, DOM.createElement('[style="position:absolute;top:auto"]'));

      if (getComputedStyle(element, 'top') != 'auto')
        GETCOMPUTEDSTYLE_BUGGY = {
          top: true,
          bottom: true,
          left: true,
          right: true,
          height: true,
          width: true
        };

      DOM.remove(element);
    });

    // getComputedStyle function using W3C spec
    getComputedStyle = function(element, styleProp){
      if (GETCOMPUTEDSTYLE_BUGGY[styleProp])
      {
        // clone ancestor vector
        var axis = [];
        while (element && element.nodeType == 1)
        {
          axis.push(element.cloneNode(false));
          element = element.parentNode;
        }

        element = axis.pop();
        while (axis.length)
          element = element.appendChild(axis.pop());
      }

      var style = global.getComputedStyle(element, null);
      if (style)
        return style.getPropertyValue(styleProp);
    }
  }
  else
  {
    var VALUE_UNIT = /^-?(\d*\.)?\d+([a-z]+|%)?$/i;
    var IS_PIXEL = /\dpx$/i;

    // getComputedStyle function for non-W3C spec browsers (Internet Explorer 6-8)
    getComputedStyle = function(element, styleProp){
      var style = element.currentStyle;

      if (style)
      {
        var value = style[styleProp];
        var unit = value.match(VALUE_UNIT);

        if (unit && unit[2] && unit[2] != 'px')
          value = getPixelValue(element, value);

        return value;
      }
    }
  }

  var resizerDisableRule = cssom.createRule('IFRAME');

  var PROPERTY_DELTA = {
    width: 'deltaX',/*
    left: 'deltaX',
    right: 'deltaX',*/

    height: 'deltaY'/*,
    top: 'deltaY',
    bottom: 'deltaY'*/
  };

  var PROPERTY_CURSOR = {
    width: { '-1': 'w-resize', '1': 'e-resize' },
    height: { '-1': 'n-resize', '1': 's-resize' }
  };

 /**
  * @class
  */
  var Resizer = DragDropElement.subclass(function(super_){ return {
    className: namespace + '.Resizer',

   /**
    * Direction of grow depends on delta changes.
    * If value is NaN direction calculate automatically according to related element style.
    * @type {number}
    */
    factor: NaN,
    property: 'width',

    event_prepare: function(){
      if (!PROPERTY_DELTA[this.property])
      {
        if (typeof console != 'undefined') console.warn('Property to change `' + this.property + '` is unsupported');
        this.stop();
        return;
      }

      resizerDisableRule.setProperty('pointerEvents', 'none'); // disable iframes to catch mouse events
      this.cursorOverloadRule_ = cssom.createRule('*');
      this.cursorOverloadRule_.setProperty('cursor', this.cursor + ' !important');
    },
    event_start: function(cfg){
      super_.event_start.call(this, cfg);

      cfg.delta = PROPERTY_DELTA[this.property];
      cfg.factor = this.factor;

      // determine dir
      var cssFloat = getComputedStyle(this.element, 'float');
      var cssPosition = getComputedStyle(this.element, 'position');

      var relToOffsetParent = cssPosition == 'absolute' || cssPosition == 'fixed';
      var parentNode = relToOffsetParent ? this.element.offsetParent : this.element.parentNode;
      var parentNodeSize;
      
      if (cfg.delta == 'deltaY')
      {
        cfg.offsetStart = this.element.clientHeight
          - parseFloat(getComputedStyle(this.element, 'padding-top'))
          - parseFloat(getComputedStyle(this.element, 'padding-bottom'));

        parentNodeSize = parentNode.clientHeight;
        if (!relToOffsetParent)
          parentNodeSize -= parseFloat(getComputedStyle(parentNode, 'padding-top')) + parseFloat(getComputedStyle(parentNode, 'padding-bottom'));

        if (isNaN(cfg.factor))
          cfg.factor = relToOffsetParent && getComputedStyle(this.element, 'bottom') != 'auto'
            ? -1
            : 1;
      }
      else
      {
        cfg.offsetStart = this.element.clientWidth
          - parseFloat(getComputedStyle(this.element, 'padding-left'))
          - parseFloat(getComputedStyle(this.element, 'padding-right'));

        parentNodeSize = parentNode.clientWidth;
        if (!relToOffsetParent)
          parentNodeSize -= parseFloat(getComputedStyle(parentNode, 'padding-left')) + parseFloat(getComputedStyle(parentNode, 'padding-right'));

        if (isNaN(cfg.factor))
        {
          if (cssFloat == 'right')
            cfg.factor = -1;
          else
            if (cssFloat == 'left')
              cfg.factor = 1;
            else
              cfg.factor = relToOffsetParent && getComputedStyle(this.element, 'right') != 'auto'
                ? -1
                : 1;
        }
      }

      cfg.offsetStartInPercent = 100 / parentNodeSize;
      classList(this.resizer).add('selected');
    },
    event_move: function(cfg){
      super_.event_move.call(this, cfg);

      this.element.style[this.property] = cfg.offsetStartInPercent * (cfg.offsetStart + cfg.factor * cfg[cfg.delta]) + '%';
    },
    event_over: function(cfg){
      super_.event_over.call(this, cfg);

      classList(this.resizer).remove('selected');
      resizerDisableRule.setProperty('pointerEvents', 'auto');

      this.cursorOverloadRule_.destroy();
      this.cursorOverloadRule_ = null;
    },

   /**
    * @constructor
    */
    init: function(config){
      this.resizer = DOM.createElement('.Basis-Resizer');
      this.cursor = PROPERTY_CURSOR[this.property][1];
      this.resizer.style.cursor = this.cursor;
      
      super_.init.call(this, config);
    },
    setElement: function(element, trigger){
      var oldElement = this.element;
      
      super_.setElement.call(this, element, this.resizer);

      if (oldElement !== this.element)
      {
        if (oldElement)
          DOM.remove(this.resizer);
        if (this.element)
          DOM.insert(this.element, this.resizer);
      }
    },
    destroy: function(){
      super_.destroy.call(this);

      if (this.cursorOverloadRule_)
      {
        this.cursorOverloadRule_.destroy();
        this.cursorOverloadRule_ = null;
      }
    }
  }});


  //
  // export names
  //

  this.extend({
    Resizer: Resizer
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/resizer.js").call(basis.namespace("basis.ui.resizer"), basis.namespace("basis.ui.resizer"), basis.namespace("basis.ui.resizer").exports, this, __curLocation + "src/basis/ui/resizer.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/paginator.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 *
 * Inspired on Paginator 3000 (http://karaboz.ru/?p=12)
 */

  'use strict';

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.dragdrop');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/paginator.html
  * @namespace basis.ui.paginator
  */ 
  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var createEvent = basis.event.create;
  var events = basis.event.events;
  var classList = basis.cssom.classList;

  var Box = basis.layout.Box;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var UIControl = basis.ui.Control;
  var UINode = basis.ui.Node;


  //
  // main part
  //

  function percent(value){
    return (100 * value || 0).toFixed(4) + '%';
  }

  function updateSelection(paginator){
    var node = paginator.childNodes.search(paginator.activePage, 'pageNumber');
    if (node)
      node.select();
    else
      paginator.selection.clear();
  }

 /**
  * Base child node class for Paginator
  * @class
  */
  var PaginatorNode = UINode.subclass({
    className: namespace + '.PaginatorNode',

    pageGetter: Function.getter('pageNumber + 1'),

    event_pageNumberChanged: createEvent('pageNumberChanged', 'node', 'oldPageNumber') && function(node, oldPageNumber){
      events.pageNumberChanged.call(this, node, oldPageNumber);

      this.templateUpdate(this.tmpl, 'pageNumberChanged');
    },

    template:
      '<td class="Basis-PaginatorNode">' +
        '<span>' +
          '<a{link} class="{selected} {disabled}" event-click="click" href="#">{pageNumber}</a>' +
        '</span>' +
      '</td>',

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.pageNumber.nodeValue = this.pageGetter(this);
    },

    action: {
      click: function(event){
        Event.kill(event);
        if (!this.isDisabled())
          this.click();
      }
    },

    click: function(){
      if (this.parentNode)
        this.parentNode.setActivePage(this.pageNumber);
    },

    setPageNumber: function(pageNumber){
      if (this.pageNumber != pageNumber)
      {
        var oldPageNumber = this.pageNumber;
        this.pageNumber = pageNumber;

        this.event_pageNumberChanged(this, oldPageNumber);
      }
    }
  });

  //
  // Paginator
  //

  var DRAGDROP_HANDLER = {
    start: function(config){
      this.initOffset = this.tmpl.scrollTrumb.offsetLeft;
    },
    move: function(config){
      var pos = ((this.initOffset + config.deltaX) / this.tmpl.scrollTrumbWrapper.offsetWidth).fit(0, 1);
      this.setSpanStartPage(Math.round(pos * (this.pageCount - this.pageSpan)));
      this.tmpl.scrollTrumb.style.left = percent(pos);
    },
    over: function(config){
      this.setSpanStartPage(this.spanStartPage_);
    }
  };

 /**
  * Paginator
  * @class
  */
  var Paginator = UIControl.subclass({
    className: namespace + '.Paginator',

    childClass: PaginatorNode,

    template:
    	'<div class="Basis-Paginator {selected} {disabled}" event-mousewheel="scroll">' +
        '<table><tbody><tr{childNodesElement}/></tbody></table>' +
        '<div{scrollbarContainer} class="Basis-Paginator-ScrollbarContainer">' +
          '<div{scrollbar} class="Basis-Paginator-Scrollbar" event-click="jumpTo">' +
            '<div{activePageMarkWrapper}>' +
              '<div{activePageMark} class="Basis-Paginator-ActivePageMark"><div/></div>' +
            '</div>' +
            '<div{scrollTrumbWrapper}>' + 
              '<div{scrollTrumb} class="Basis-Paginator-ScrollbarSlider"><div{scrollTrumbElement}><span/></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
    	'</div>',

    action: {
      jumpTo: function(actionName, event, node){
        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
        this.setSpanStartPage(Math.floor(pos * this.pageCount) - Math.floor(this.pageSpan / 2));
      },
      scroll: function(event){
        var delta = Event.wheelDelta(event);
        if (delta)
          this.setSpanStartPage(this.spanStartPage_ + delta);
      }
    },

    event_activePageChanged: createEvent('activePageChanged'),
    event_pageCountChanged: createEvent('pageCountChanged'),

    pageSpan: NaN,
    pageCount: NaN,
    activePage: NaN,

    defaultPageSpan: 5,
    defaultPageCount: 1,
    defaultActivePage: 0,

    spanStartPage_: -1,

    init: function(config){
      UIControl.prototype.init.call(this, config);

      var pageSpan = this.pageSpan || this.defaultPageSpan;
      var pageCount = this.pageCount || this.defaultPageCount;
      var activePage = this.activePage || this.defaultActivePage;

      this.pageSpan = NaN;
      this.pageCount = NaN;
      this.activePage = NaN;

      this.setProperties(pageCount, pageSpan);
      this.setActivePage(activePage, true);

      this.scrollbarDD = new DragDropElement({
        element: this.tmpl.scrollTrumb,
        handler: DRAGDROP_HANDLER,
        handlerContext: this
      });
    },

   /**
    * @param {number} pageCount
    * @param {number} pageSpan
    * @param {number} activePage
    */
    setProperties: function(pageCount, pageSpan, activePage){
      pageCount = pageCount || 1;
      pageSpan = Math.min(pageSpan || 10, pageCount);

      if (pageSpan != this.pageSpan)
      {
        this.pageSpan = pageSpan;
        this.setChildNodes(Array.create(pageSpan, function(idx){
          return {
            pageNumber: idx
          }
        }));
      }

      if (this.pageCount != pageCount)
      {
        this.pageCount = pageCount;

        var rangeWidth = 1 / pageCount;
        var activePageMarkWidth = rangeWidth / (1 - rangeWidth);

        this.tmpl.activePageMark.style.width = percent(activePageMarkWidth);
        this.tmpl.activePageMarkWrapper.style.width = percent(1 - rangeWidth);

        this.event_pageCountChanged(this.pageCount);
      }

      // spanWidth : (1 - spanWidth)
      // scrollThumbWidth : 1
      // ---
      // scrollThumbWidth = spanWidth * 1 / (1 - spanWidth)

      var spanWidth = pageSpan / pageCount;
      var scrollTrumbWidth = spanWidth / (1 - spanWidth);

      this.tmpl.scrollTrumbWrapper.style.width = percent(1 - spanWidth);
      this.tmpl.scrollTrumb.style.width = percent(scrollTrumbWidth);

      classList(this.element).bool('Basis-Paginator-WithNoScroll', pageSpan >= pageCount);

      this.setSpanStartPage(this.spanStartPage_);
      this.setActivePage(arguments.length == 3 ? activePage : this.activePage);
    },
    setActivePage: function(newActivePage, spotlightActivePage){
      newActivePage = newActivePage.fit(0, this.pageCount - 1);
      if (newActivePage != this.activePage)
      {
        this.activePage = Number(newActivePage);
        this.event_activePageChanged(newActivePage);
      }

      updateSelection(this);

      this.tmpl.activePageMark.style.left = percent(newActivePage / Math.max(this.pageCount - 1, 1));

      if (spotlightActivePage)
        this.spotlightPage(this.activePage);
    },
    spotlightPage: function(pageNumber){
      this.setSpanStartPage(pageNumber - Math.round(this.pageSpan / 2) + 1);
    },
    setSpanStartPage: function(pageNumber){
      pageNumber = pageNumber.fit(0, this.pageCount - this.pageSpan);
      if (pageNumber != this.spanStartPage_)
      {
        this.spanStartPage_ = pageNumber;

        for (var i = this.childNodes.length; i --> 0;)
          this.childNodes[i].setPageNumber(pageNumber + i);

        updateSelection(this);
      }

      this.tmpl.scrollTrumb.style.left = percent((pageNumber / Math.max(this.pageCount - this.pageSpan, 1)).fit(0, 1));
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UIControl.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    Paginator: Paginator
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/paginator.js").call(basis.namespace("basis.ui.paginator"), basis.namespace("basis.ui.paginator"), basis.namespace("basis.ui.paginator").exports, this, __curLocation + "src/basis/ui/paginator.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/pageslider.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

  'use strict';

  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.ui');
  basis.require('basis.ui.tabs');
  basis.require('basis.ui.scroller');


 /**
  * @namespace basis.ui.pageslider
  */ 

  var namespace = this.path;


  //
  // import names
  //

  var DOM = basis.dom;
  var Class = basis.Class;

  var PageControl = basis.ui.tabs.PageControl;
  var Scroller = basis.ui.scroller.Scroller;
  var classList = basis.cssom.classList;


  //
  // main part
  //
  
  var PageSlider = Class(PageControl, {
    className: namespace + '.PageSlider',

    template: 
      '<div class="Basis-PageControl Basis-PageSlider {selected} {disabled}">' +
        '<div{childNodesElement} class="Basis-PageSlider-Content"/>' +
      '</div>',

    childClass: {
      event_select: function(){
        this.constructor.superClass_.prototype.event_select.apply(this, arguments);
        this.parentNode.scrollToPage(this);
      }
    },

    event_childNodesModified: function(node, delta){
      PageControl.prototype.event_childNodesModified.call(this, node, delta);

      for (var i = 0, child; child = this.childNodes[i]; i++)
        basis.cssom.setStyle(child.element, { left: (100 * i) + '%' });
    },

    init: function(config){
      PageControl.prototype.init.call(this, config);

      /*var cssClassName = 'gerericRule_' + this.eventObjectId;
      this.pageSliderCssRule = basis.cssom.cssRule('.' + cssClassName + ' > .Basis-Page');
      classList(this.element).add(cssClassName);*/

      this.scroller = new Scroller({
        targetElement: this.tmpl.childNodesElement,
        scrollY: false,
        minScrollDelta: 10,
        handler: {
          startInertia: this.setPage
        },
        handlerContext: this
      });

      if (this.selection.itemCount)
        this.scrollToPage(this.selection.pick())
    },

    setPage: function(scroller){
      var currentPage = this.selection.pick();
      if (!currentPage)
        return;

      var pageWidth = currentPage.element.offsetWidth;
      var pagePosition = currentPage.element.offsetLeft
      var pageScrollTo = currentPage;

      if (this.scroller.currentVelocityX)
      {
        pageScrollTo = (this.scroller.currentVelocityX > 0 ? currentPage.nextSibling : currentPage.previousSibling) || currentPage;
      }
      else if ((this.scroller.viewportX > (pagePosition + pageWidth / 2)) 
        || (this.scroller.viewportX < (pagePosition - pageWidth / 2))
      )
      {
        var dir = this.scroller.viewportX - pagePosition;
        pageScrollTo = (dir > 0 ? currentPage.nextSibling : currentPage.previousSibling) || currentPage;
      }

      this.scrollToPage(pageScrollTo);
    },

    scrollToPage: function(page){
      if (this.scroller)
      {
        page.select();
        this.scroller.setPositionX(page.element.offsetLeft, true);
      }
    },

    destroy: function(){
      PageControl.prototype.init.call(this, config);

      /*DOM.Style.getStyleSheet().removeCssRule(this.pageSliderCssRule.rule);
      this.pageSliderCssRule = null;*/

      this.scroller.destroy();
    }
  });


  //
  // export names
  //

  this.extend({
    PageSlider: PageSlider
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/pageslider.js").call(basis.namespace("basis.ui.pageslider"), basis.namespace("basis.ui.pageslider"), basis.namespace("basis.ui.pageslider").exports, this, __curLocation + "src/basis/ui/pageslider.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/canvas.js
//

new Function(__wrapArgs, function(){

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

/*window.FlashCanvasOptions = {
  swfPath: "../../src/basis/ext/"
};
basis_require('basis.ext.flashcanvas');*/

  'use strict';

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.html');
  basis.require('basis.ui');


 /**
  * @namespace basis.ui.canvas
  */

  var namespace = this.path;


  //
  // import names
  //

  var Node = basis.dom.wrapper.Node;
  var UINode = basis.ui.Node;

  var createEvent = basis.event.create;


  //
  // Main part
  //

  var CanvasLayer = UINode.subclass({
    className: namespace + '.CanvasLayer',

    template:
      '<canvas{canvas} class="{selected} {disabled}">' +
        '<div>Canvas doesn\'t support.</div>' +
      '</canvas>',

    init: function(config){
      UINode.prototype.init.call(this, config);
     
      this.tmpl.canvas.width = this.width || 600;
      this.tmpl.canvas.height = this.height || 400;

      var canvasElement = this.tmpl.canvas;

      if (typeof FlashCanvas != "undefined") {
        FlashCanvas.initElement(canvasElement);
      }
      
      if (canvasElement && canvasElement.getContext)
        this.context = canvasElement.getContext('2d');
    },
    reset: function(){
      if (this.context)
        this.context.clearRect(0, 0, this.element.offsetWidth, this.element.offsetHeight)
    },

    draw: Function.undef
  });

  var Shape = Node.subclass({
    className: namespace + '.Shape',
    draw: function(context){
      context.save();
      context.fillStyle = 'red';
      context.fillRect(this.data.value * 10,10,30,30);
      context.restore();
    },
    listen: {
      childNode: {
        update: function(){
          this.updateCount++;
        }
      }
    }/*
    update: function(){
      var result = Node.prototype.update.apply(this, arguments);

      if (result)
      {
        var parent = this.parentNode;
        while (parent)
        {
          if (parent instanceof Canvas)
          {
            parent.updateCount++;
            break;
          }
          parent = parent.parentNode;
        }
      }

      return result;
    }*/
  });

 /**
  * @class
  */
  var Canvas = CanvasLayer.subclass({
    className: namespace + '.Canvas',

    childFactory: function(config){
      return new this.childClass(config);
    },
    childClass: Shape,

    drawCount: 0,
    lastDrawUpdateCount: -1,

    event_draw: createEvent('draw', 'object'),
    listen: {
      childNode: {
        update: function(){
          this.updateCount++;
        }
      }
    },

    init: function(config){
      CanvasLayer.prototype.init.call(this, config);
     
      this.updateCount = 0;

      var canvasElement = this.tmpl.canvas;
      if (canvasElement && canvasElement.getContext)
        this.updateTimer_ = setInterval(this.draw.bind(this), 1000/60);
    },
    isNeedToDraw: function(){
      return this.context && (
        this.updateCount != this.lastDrawUpdateCount
        ||
        this.tmpl.canvas.width != this.lastDrawWidth
        ||
        this.tmpl.canvas.height != this.lastDrawHeight
      );
    },
    draw: function(){
      if (!this.isNeedToDraw())
        return false;

      this.lastDrawWidth = this.tmpl.canvas.width;
      this.lastDrawHeight = this.tmpl.canvas.height;
      this.lastDrawUpdateCount = this.updateCount;
      this.drawCount = this.drawCount + 1;

      this.reset();

      this.drawFrame();

      this.event_draw(this);

      return true;
    },
    drawFrame: function(){
      for (var node = this.firstChild; node; node = node.nextSibling)
        node.draw(this.context);
    },
    destroy: function(){
      clearInterval(this.updateTimer_);

      CanvasLayer.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    CanvasLayer: CanvasLayer,
    Canvas: Canvas,
    Shape: Shape
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/canvas.js").call(basis.namespace("basis.ui.canvas"), basis.namespace("basis.ui.canvas"), basis.namespace("basis.ui.canvas").exports, this, __curLocation + "src/basis/ui/canvas.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/ui/graph.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 * Roman Dvornov <rdvornov@gmail.com>
 *
 */

  'use strict';

  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');
  basis.require('basis.ui.canvas');


 /**
  * @see ./demo/graph/range.html
  * @see ./demo/graph/dynamic-threads.html
  * @namespace basis.ui.graph
  */

  var namespace = this.path;


  //
  // import names
  //
  var oneFunctionProperty = basis.Class.oneFunctionProperty;


  var Event = basis.dom.event;
  var DOM = basis.dom;

  var DataObject = basis.data.DataObject;
  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var Node = basis.dom.wrapper.Node;
  var uiNode = basis.ui.Node;
  var uiContainer = basis.ui.Container;
  var Canvas = basis.ui.canvas.Canvas;
  var CanvasLayer = basis.ui.canvas.CanvasLayer;
  var ChildNodesDataset = basis.dom.wrapper.ChildNodesDataset;
  var Selection = basis.dom.wrapper.Selection;

  var createEvent = basis.event.create;
  var getter = Function.getter;

  //
  // Main part
  //


  function getDegree(number){
    number = Math.abs(number);
    if (Math.abs(number) > 1)
    {
      return String(Math.floor(number)).length - 1;
    }
    else
    {
      /0\.(0+)?[^0]/.test(String(number));
      return (-1) * (RegExp.$1 || '').length - 1;
    }
  }


  //generate random color func

  function generateColor(){
    var golden_ratio_conjugate = 0.618033988749895;

    var h = Math.random();
    h += golden_ratio_conjugate;
    h %= 1;

    var rgb = hsv_to_rgb(h, 0.6, 0.95);
 
    return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
  }
  function hsv_to_rgb(h, s, v)
  {
    var h1 = h * 6;
    var c = v * s;
    var x = c * (1 - Math.abs(h1 % 2 - 1));
    var rgb;
    switch(Math.floor(h1))
    { 
      case 0: rgb = [c, x, 0]; break;
      case 1: rgb = [x, c, 0]; break;
      case 2: rgb = [0, c, x]; break;
      case 3: rgb = [0, x, c]; break;
      case 4: rgb = [x, 0, c]; break;
      case 5: rgb = [c, 0, x]; break;
    }
    var m = v - c; 
    return [
      Math.floor((rgb[0] + m) * 256), 
      Math.floor((rgb[1] + m) * 256), 
      Math.floor((rgb[2] + m) * 256) 
    ];
  }


 /**
  * @class
  */
  var ColorPicker = Node.subclass({
    usedColors: null,
    presetColors: [
      '#F80',
      '#BB7BF1',
      '#FF3030',
      '#090',
      '#6699DD'
    ],

    listen: {
      owner: {
        childNodesModified: function(object, delta){
          if (delta.deleted)
            delta.deleted.forEach(this.releaseColor, this);

          if (delta.inserted)
            delta.inserted.forEach(this.setColor, this);
        }
      }
    },

    init: function(config){
      this.presetColors = Array.from(this.presetColors);
      this.usedColors = {};
      Node.prototype.init.call(this, config);
    },

    setColor: function(object){
      if (!object.color)
        object.color = this.getColor();

      this.usedColors[object.color] = true;
    },
    releaseColor: function(object){
      delete this.usedColors[object.color];
      this.presetColors.push(object.color);
    },
    getColor: function(){
      var color = this.presetColors.pop();
      if (!color)
      {
        do
        {
          color = generateColor();
        }
        while (this.usedColors[color])
      }
      return color;
    }
  });


 /**
  * @class
  */
  var GraphNode = Node.subclass({
    event_requestRedraw: createEvent('requestRedraw')
  });

 /**
  * @class
  */
  var Graph = Canvas.subclass({
    className: namespace + '.Graph',

    childClass: GraphNode,

    template:
      '<div class="Basis-Graph {selected} {disabled}" style="position: relative; display: inline; display: inline-block; zoom: 1; outline: none">' +
        '<!-- {graphSelection} -->' +
        '<canvas{canvas} style="vertical-align: top; position:relative">' +
          '<div>Canvas doesn\'t support.</div>' +
        '</canvas>' +
        '<!-- {graphViewer} -->' +
      '</div>',

    binding: {
      graphSelection: 'satellite:',
      graphViewer: 'satellite:'
    },

    style: {},

    event_sortingChanged: function(node, oldSorting, oldSortingDesc){
      Canvas.prototype.event_sortingChanged.call(this, node, oldSorting, oldSortingDesc);
      this.redrawRequest();
    },
    event_groupingChanged: function(node, oldGrouping){
      Canvas.prototype.event_groupingChanged.call(this, node, oldGrouping);
      this.redrawRequest();
    },
    event_childNodesModified: function(node, delta){
      Canvas.prototype.event_childNodesModified.call(this, node, delta);
      this.redrawRequest();
    },

    listen: {
      childNode: {
        requestRedraw: function(){
          this.redrawRequest();
        }
      }
    },

    setStyle: function(newStyle){
      Object.extend(this.style, Object.slice(newStyle, ['strokeStyle', 'lineWidth']));
      this.redrawRequest();
    },

    redrawRequest: function(){
      this.updateCount++;
    },

    drawFrame: Function.$undef
  });

  //
  // Series Graph
  //
  var SERIES_SOURCE_HANDLER = {
    datasetChanged: function(object, delta){
      var key;
      var value;
      var valuesDelta = [];

      if (delta.inserted)
        for (var i = 0, child; child = delta.inserted[i]; i++)
        {
          key = this.keyGetter(child);
          value = this.valueGetter(child);

          valuesDelta[key] = value;
          this.valuesMap[key] = value;

          child.addHandler(SERIES_ITEM_HANDLER, this);
        }

      if (delta.deleted)
        for (var i = 0, child; child = delta.deleted[i]; i++)
        {
          key = this.keyGetter(child);
          valuesDelta[key] = null
          this.valuesMap[key] = null;

          child.removeHandler(SERIES_ITEM_HANDLER, this);
        }

      this.event_valuesChanged(this, valuesDelta);
    } 
  }

  var SERIES_ITEM_HANDLER = {
    update: function(object, delta){ 
      var key = this.keyGetter(object);
      var value = this.valueGetter(object);

      var valuesDelta = {};
      this.valuesMap[key] = value;
      valuesDelta[key] = value;

      this.event_valuesChanged(this, valuesDelta);
    }
  }

 /**
  * @class
  */
  var GraphSeries = AbstractNode.subclass({
    className: namespace + '.GraphSeries',

    valuesMap: null,

    sourceGetter: getter('source'),
    keyGetter: Function.$undef,
    
    valueGetter: Function.$const(0),
    getValue: function(object, key){
      return this.source ? this.valuesMap[key] : this.valueGetter(object);
    },

    legendGetter: getter('legend'),
    getLegend: function(){
      return this.legendGetter(this)
    },

    colorGetter: getter('color'),
    getColor: function(){
      return this.colorGetter(this);
    },

    //events
    event_valuesChanged: createEvent('valuesChanged', 'object', 'delta'),
    event_sourceChanged: createEvent('sourceChanged', 'object', 'oldSource'),

    init: function(config){
      this.valuesMap = {};

      Node.prototype.init.call(this, config);

      this.source = this.sourceGetter(this);

      if (this.source)
      {
        var source = this.source;
        this.source = null;
        this.setSource(source);
      }
    },

    setSource: function(source){
      if (this.source !== source)
      {
        var oldSource = this.source;
        if (oldSource)
        {
          oldSource.removeHandler(SERIES_SOURCE_HANDLER, this);
          SERIES_SOURCE_HANDLER.datasetChanged.call(this, oldSource, { deleted: oldSource.getItems() });
        }

        this.source = source;
        if (this.source)
        {
          this.source.addHandler(SERIES_SOURCE_HANDLER, this);
          SERIES_SOURCE_HANDLER.datasetChanged.call(this, oldSource, { inserted: this.source.getItems() });
        }

        this.event_sourceChanged(this, oldSource);
      }
    },

    destroy: function(){
      this.setSource(null);
      AbstractNode.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var GraphSeriesList = Node.subclass({
    childClass: GraphSeries,

    childFactory: function(config){
      return new this.childClass(config);
    },

    listen: {
      childNode: {
        valuesChanged: function(seria, delta){
          this.event_valuesChanged(seria, delta);
        }
      }
    },

    init: function(config){
      this.colorPicker = new ColorPicker(Object.extend({ owner: this }, this.colorPicker));
      Node.prototype.init.call(this, config);
    },

    destroy: function(){
      this.colorPicker.destroy();
      this.colorPicker = null;

      Node.prototype.destroy.call(this);
    }
  });

  var GRAPH_SERIES_HANDLER = {
    childNodesModified: function(object, delta){
      if (delta.inserted)
        for (var i = 0, seria; seria = delta.inserted[i]; i++)
        {
          for (var j = 0, child; child = this.childNodes[j]; j++)
            child.values[seria.eventObjectId] = seria.getValue(child, this.keyGetter(child));
        }

      if (delta.deleted)
        for (var i = 0, seria; seria = delta.deleted[i]; i++)
        {
          for (var j = 0, child; child = this.childNodes[j]; j++)
            delete child.values[seria.eventObjectId];
        }

      this.redrawRequest();
    },
    valuesChanged: function(seria, delta){
      var needRedraw = false;

      var key;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        key = this.keyGetter(child);
        if (delta[key])
        {
          if (delta[key])
            child.values[seria.eventObjectId] = delta[key];
          else
            delete child.values[seria.eventObjectId];

          needRedraw = true;
        }
      }

      if (needRedraw)
        this.redrawRequest();
    }
  }

  var GRAPH_NODE_UPDATE_HANDLER = function(object){
    for (var i = 0, seria; seria = this.series.childNides[i]; i++)
      object.values[seria.eventObjectId] = seria.getValue(object, this.keyGetter(object));

    this.redrawRequest();
  }

 /**
  * @class
  */
  var SeriesGraphNode = GraphNode.subclass({
    values: {},

    valueChangeEvents: oneFunctionProperty(
      GRAPH_NODE_UPDATE_HANDLER,
      {
        update: true
      }
    ),

    init: function(config){
      this.values = {};
      GraphNode.prototype.init.call(this, config);
    }
  });

 /**
  * @class
  */
  var SeriesGraph = Graph.subclass({
    childClass: SeriesGraphNode,    

    keyGetter: Function.$self,
    keyTitleGetter: function(object){
      return this.keyGetter(object); 
    },
    
    event_childNodesModified: function(object, delta){
      Graph.prototype.event_childNodesModified.call(this, object, delta);

      if (!this.series || !this.series.childNodes)
        return;
    
      if (delta.inserted)
        for (var i = 0, child; child = delta.inserted[i]; i++)
        {
          for (var j = 0, seria; seria = this.series.childNodes[j]; j++)
            if (seria.getValue)
              child.values[seria.eventObjectId] = seria.getValue(child, this.keyGetter(child));

          child.addHandler(child.valueChangeEvents, this);
        }

      if (delta.deleted)
        for (var i = 0, child; child = delta.deleted[i]; i++)
        {
          for (var j = 0, seria; seria = this.series.childNodes[j]; j++)
            child.values[seria.eventObjectId] = null;

          child.removeHandler(child.valueChangeEvents, this);
        }

      this.redrawRequest();
    },

    //init
    init: function(config){
      Graph.prototype.init.call(this, config);

      if (Array.isArray(this.series))
      {
        var series = [];
        for (var i = 0, seria; seria = this.series[i]; i++)
          series[i] = (typeof seria == 'function') ? { valueGetter: seria } : seria;
        
        this.series = {
          childNodes: series
        }
      }

      this.series = new GraphSeriesList(Object.extend({ owner: this }, this.series));
      this.series.addHandler(GRAPH_SERIES_HANDLER, this);
      GRAPH_SERIES_HANDLER.childNodesModified.call(this, this.series, { inserted: this.series.childNodes });
    },

    getValuesForSeria: function(seria){
      var values = [];
      for (var i = 0, child; child = this.childNodes[i]; i++)
        values.push(child.values[seria.eventObjectId]);
      
      return values;
    },

    destroy: function(){
      this.series.destroy();
      delete this.series;

      Graph.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var AxisGraph = SeriesGraph.subclass({
    showLegend: true,
    showYLabels: true,
    showXLabels: true,
    showBoundLines: true,
    showGrid: true,
    keyValuesOnEdges: true,
    invertAxis: false,
    autoRotateScale: false,
    scaleAngle: 0,

    min: 0,
    max: 'auto',

    //init
    init: function(config){
      this.clientRect = {};

      SeriesGraph.prototype.init.call(this, config);
    },

    drawFrame: function(){
      var context = this.context;

      var TOP = 0;
      var LEFT = 0;
      var RIGHT = 10;
      var BOTTOM = 0;
      var WIDTH = context.canvas.width;
      var HEIGHT = context.canvas.height;

      var series = this.series.childNodes;
      var keys = this.childNodes.map(this.keyTitleGetter, this);
      var keysCount = keys.length;

      if (keysCount < 2 || !series.length)
      {
        context.textAlign = 'center';
        context.fillStyle = '#777';
        context.font = '20px tahoma';
        context.fillText(keysCount == 0 ? 'No data' : 'Not enough data', WIDTH / 2, HEIGHT / 2);

        return;
      }

      var maxValue = this.getMaxGridValue();
      var minValue = this.getMinGridValue();
      var gridPart = this.getGridPart(Math.max(Math.abs(minValue), Math.abs(maxValue))); 

      //correct min/max
      if (Math.abs(minValue) > Math.abs(maxValue))
        maxValue = Math.ceil(maxValue / gridPart) * gridPart;
      else 
        minValue = Math.floor(minValue / gridPart) * gridPart;

      var partCount = (maxValue - minValue) / gridPart;

      // prepare labels
      context.font = '10px tahoma';

      var xLabels = [];
      var yLabels = [];

      var maxValueTextWidth = 0;
      var maxKeyTextWidth = 0;

      var showValueAxis = this.invertAxis ? this.showXLabels : this.showYLabels;
      var showKeyAxis = this.invertAxis ? this.showYLabels : this.showXLabels;

      // calc y labels max width
      if (showValueAxis)
      {
        var valueLabels = this.invertAxis ? xLabels : yLabels;
        
        var tw;
        for (var i = 0; i < partCount + 1; i++)
        {
          valueLabels[i] = Math.round(minValue + gridPart * i).group();
          tw = context.measureText(valueLabels[i]).width;

          if (tw > maxValueTextWidth)
            maxValueTextWidth = tw;
        }

        maxValueTextWidth += 6;
        TOP += 10;
      }

      // calc x labels max width
      if (showKeyAxis)
      {
        var keyLabels = this.invertAxis ? yLabels : xLabels;

        var tw;
        for (var i = 0; i < keysCount; i++)
        {
          keyLabels[i] = keys[i];
          tw = context.measureText(keyLabels[i]).width;

          if (tw > maxKeyTextWidth)
            maxKeyTextWidth = tw;
        }

        maxKeyTextWidth += 6;
      }

      // calc left offset
      var firstXLabelWidth = 0;
      var lastXLabelWidth = 0;
      if (this.showXLabels)
      {
        firstXLabelWidth = context.measureText(xLabels[0]).width + 12; // 12 = padding + border
        lastXLabelWidth = context.measureText(xLabels[(this.invertAxis ? partCount : keysCount) - 1]).width + 12;
      }

      var maxXLabelWidth = this.invertAxis ? maxValueTextWidth : maxKeyTextWidth;
      var maxYLabelWidth = this.invertAxis ? maxKeyTextWidth : maxValueTextWidth;

      LEFT = Math.max(maxYLabelWidth, Math.round(firstXLabelWidth / 2));
      RIGHT = Math.round(lastXLabelWidth / 2);

      // Legend
      if (this.showLegend)
      {
        var LEGEND_ROW_HEIGHT = 30;
        var LEGEND_BAR_SIZE = 20;

        var maxtw = 0;
        for (var i = 0, seria; seria = series[i]; i++)
        {
          var tw = context.measureText(seria.getLegend()).width + LEGEND_BAR_SIZE + 20;
          if (tw > maxtw)
            maxtw = tw;
        }

        var legendColumnCount = Math.floor((WIDTH - LEFT - RIGHT) / maxtw);
        var legendColumnWidth = (WIDTH - LEFT - RIGHT) / legendColumnCount;
        var legendRowCount = Math.ceil(series.length / legendColumnCount);

        //draw legend
        BOTTOM += LEGEND_ROW_HEIGHT * legendRowCount; // legend height

        for (var i = 0, seria; seria = series[i]; i++)
        {
          var lx = Math.round(LEFT + (i % legendColumnCount) * legendColumnWidth);
          var ly = HEIGHT - BOTTOM + 5 + (Math.ceil((i + 1) / legendColumnCount) - 1) * LEGEND_ROW_HEIGHT;

          context.fillStyle = seria.getColor();
          context.fillRect(lx, ly, LEGEND_BAR_SIZE, LEGEND_BAR_SIZE);

          context.fillStyle = 'black';
          context.textAlign = 'left';
          context.fillText(seria.getLegend(), lx + LEGEND_BAR_SIZE + 5, ly + LEGEND_BAR_SIZE / 2 + 3);
        }
      }

      BOTTOM += this.showXLabels ? 30 : 1; // space for xscale;

      //
      // Draw Scales
      //
      context.font = '10px tahoma';
      context.lineWidth = 1;
      context.fillStyle = 'black';
      context.strokeStyle = 'black';

      var textHeight = 10;
      var skipLabel;
      var skipScale;
      var skipLabelCount;

      // xscale
      var xStep = (WIDTH - LEFT - RIGHT) / (this.invertAxis ? partCount : keysCount - (this.keyValuesOnEdges ? 1 : 0)) 
      if (this.showXLabels)
      {
        var angle;
        if (this.autoRotateScale)
        {
          skipLabelCount = Math.ceil((textHeight + 3) / xStep) - 1;
          angle = (skipLabelCount + 1) * xStep < maxXLabelWidth ? Math.asin((textHeight + 3) / ((skipLabelCount + 1) * xStep)) : 0;
        }
        else
        {
          angle = (this.scaleAngle % 180) * Math.PI / 180;
          var optimalLabelSpace = angle ? Math.min(textHeight / Math.sin(angle), maxXLabelWidth) : maxXLabelWidth;
          skipLabelCount = Math.ceil((optimalLabelSpace + 3) / xStep) - 1;
        }
        
        BOTTOM += Math.round(maxXLabelWidth * Math.sin(angle));

        skipScale = skipLabelCount > 10 || xStep < 4;
        context.textAlign = angle ? 'right' : 'center';        
        context.beginPath();
        
        var leftOffset = !this.keyValuesOnEdges && !this.invertAxis ? xStep / 2 : 0;
        for (var i = 0; i < xLabels.length; i++)
        {
          var x = Math.round(leftOffset + LEFT + i * xStep) + .5;//xLabelsX[i];
          skipLabel = skipLabelCount && (i % (skipLabelCount + 1) != 0);

          context.save();
          if (!skipLabel)
          {
            context.translate(x + 3, HEIGHT - BOTTOM + 15);
            context.rotate(-angle);
            context.fillText(xLabels[i], 0, 0);
          }
          context.restore();
 
          if (!skipLabel || !skipScale)
          {
            context.moveTo(x, HEIGHT - BOTTOM + .5);
            context.lineTo(x, HEIGHT - BOTTOM + (skipLabel ? 3 : 5));
          }
        }
        
        context.stroke();
        context.closePath();
      }

      // yscale
      var yStep = (HEIGHT - TOP - BOTTOM) / (this.invertAxis ? keysCount - (this.keyValuesOnEdges ? 1 : 0) : partCount);
      if (this.showYLabels)
      {
        context.textAlign = 'right';

        var topOffset = !this.keyValuesOnEdges && this.invertAxis ? yStep / 2 : 0;

        skipLabelCount = Math.ceil(15 / yStep) - 1;
        //skipLabelCount = 0;
        skipScale = skipLabelCount > 10 || yStep < 4;
 
        context.beginPath();        
        
        for (var i = 0, label; label = yLabels[i]; i++)
        {
          var labelY = Math.round(this.invertAxis ? (TOP + topOffset + i * yStep) : (HEIGHT - BOTTOM - topOffset - i * yStep)) + .5;

          skipLabel = skipLabelCount && (i % (skipLabelCount + 1) != 0);

          if (!skipLabel)
            context.fillText(label, LEFT - 6, labelY + 2.5);

          if (!skipLabel || !skipScale)
          {
            context.moveTo(LEFT + .5 - 3, labelY);
            context.lineTo(LEFT + .5, labelY);
          }
        }

        context.stroke();
        context.closePath();
      }

      // draw grid
      if (this.showGrid)
      {
        context.beginPath();

        var labelX, labelY;
        var gridStep = this.invertAxis ? xStep : yStep;
        for (var i = 0; i < partCount; i++)
        {
          if (this.invertAxis)
          {
            labelX = WIDTH - RIGHT - Math.round(i * gridStep) + .5;
            context.moveTo(labelX, TOP + .5);
            context.lineTo(labelX, HEIGHT - BOTTOM + .5);
          }
          else
          {
            labelY = TOP + Math.round(i * gridStep) + .5;
            context.moveTo(LEFT + .5, labelY);
            context.lineTo(WIDTH - RIGHT + .5, labelY);
          }
        }

        context.strokeStyle = 'rgba(128, 128, 128, .25)';
        context.stroke();
        context.closePath();
      }

      // draw bounds lines
      if (this.showBoundLines)
      {
        //var zeroOffsetX = minValue < 0 && this.invertAxis ? Math.round(WIDTH * -minValue / (maxValue - minValue)) : 0;
        //var zeroOffsetY = minValue < 0 && ! this.invertAxis ? Math.round(HEIGHT * -minValue / (maxValue - minValue)) : 0;

        context.beginPath();
        context.moveTo(LEFT + .5, TOP);
        context.lineTo(LEFT + .5, HEIGHT - BOTTOM + .5);
        context.moveTo(LEFT + .5, HEIGHT - BOTTOM + .5);
        context.lineTo(WIDTH - RIGHT + .5, HEIGHT - BOTTOM + .5);
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.stroke();
        context.closePath();
      }
      
      // Series
      var step = this.invertAxis ? yStep : xStep;
      for (var i = 0, seria; seria = series[i]; i++)
      {
        this.drawSeria(this.getValuesForSeria(seria), seria.getColor(), i, minValue, maxValue, step, LEFT, TOP, WIDTH - LEFT - RIGHT, HEIGHT - TOP - BOTTOM);
      }  

      //save graph data
      Object.extend(this.clientRect, {
        left: LEFT,
        top: TOP,
        width: WIDTH - LEFT - RIGHT,
        height: HEIGHT - TOP - BOTTOM
      });
      this.minValue = minValue;
      this.maxValue = maxValue;
    },

    setMin: function(min){
      this.min = min;
      this.updateCount++;
    },
    setMax: function(max){
      this.max = max;
      this.updateCount++;
    },
    getMinValue: function(){
      var min;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        for (var j in child.values)
          if (child.values[j] < min || min == null)
            min = child.values[j]
      }
      return min;
    },
    getMaxValue: function(){
      var max;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        for (var j in child.values)
          if (child.values[j] > max || max == null)
            max = child.values[j]
      }
      return max;
    },
    getMinGridValue: function(){
      var minValue = this.min == 'auto' ? this.getMinValue() : this.min;
      return Math.floor(Math.ceil(minValue) / Math.pow(10, getDegree(minValue))) * Math.pow(10, getDegree(minValue));
    },
    getMaxGridValue: function(){
      var maxValue = this.max == 'auto' ? this.getMaxValue() : this.max;
      return Math.ceil(Math.ceil(maxValue) / Math.pow(10, getDegree(maxValue))) * Math.pow(10, getDegree(maxValue));
    },
    getGridPart: function(maxGridValue){
      var MIN_PART_COUNT = 5;
      var MAX_PART_COUNT = 20;

      var result;
      var maxDegree = getDegree(maxGridValue);

      if (maxDegree == 0)
        result = maxGridValue;

      if (maxGridValue % Math.pow(10, maxDegree) == 0)
      {
        var res = maxGridValue / Math.pow(10, maxDegree);
        if (res >= MIN_PART_COUNT)
          result = res;
      }

      if (!result)
      {
        var count = 1;
        var canDivide = true;
        var step;
        var newVal;
        var curVal = maxGridValue;
        var divisionCount = 0;

        while (count < MIN_PART_COUNT && divisionCount <= maxDegree)
        {
          for (var i = 2; i <= 5; i++)
          {
            step = curVal / i;
            newVal = (curVal - step) / Math.pow(10, maxDegree - divisionCount);
            if ((newVal - Math.floor(newVal) == 0) && (count*i < MAX_PART_COUNT))
            {
              curVal = step;
              count *= i;
              break;
            }
          } 

          divisionCount++;
        }

        result = count;
      }

      return maxGridValue / result;
    },

    // abstract methods
    drawSeria: Function.$undef
  });


  //
  // GraphSelection
  // 
  var ctrlPressed = false;
  var shiftPressed = false;
  var selectionStart = false;
  var lastItemPosition = -1;
  var startItemPosition = -1;
  var addSelectionMode = true;

  function getGraphXByMouseX(graph, globalX){
    var graphRect = graph.element.getBoundingClientRect();
    return globalX - graphRect.left - graph.clientRect.left;
  }
  function getGraphYByMouseY(graph, globalY){
    var graphRect = graph.element.getBoundingClientRect();
    return globalY - graphRect.top - graph.clientRect.top;
  }
  function getGraphItemPositionByMouseX(graph, mouseX){
    var width = graph.clientRect.width;
    var itemCount = graph.childNodes.length;
    var x = getGraphXByMouseX(graph, mouseX);
    return Math.max(0, Math.min(itemCount - 1, Math.round(x / (width / (itemCount - 1)))));
  }

  function rebuildGraphSelection(graph, curItemPosition, startItemPosition)
  {
    var curItem = graph.childNodes[curItemPosition];
    var applyItems = graph.childNodes.slice(Math.min(startItemPosition, curItemPosition), Math.max(startItemPosition, curItemPosition) + 1);

    var selectedItems = Array.from(graph.selection.getItems());
    if (addSelectionMode)
    {
      selectedItems = selectedItems.concat(applyItems);
    }
    else
    {
      var pos;
      for (var i = 0, item; item = applyItems[i]; i++)
      {
        if ((pos = selectedItems.indexOf(item)) != -1)
          selectedItems.splice(pos, 1); 
      }      
    }
    
    return selectedItems;
  }

  var GRAPH_ELEMENT_HANDLER = {
    mousedown: function(event){
      var graph = this.owner; 
      var x = getGraphXByMouseX(graph, Event.mouseX(event));
      var y = getGraphYByMouseY(graph, Event.mouseY(event));

      if (x > 0 && x < this.clientRect.width && y > 0 && y < this.clientRect.height)
      {
        for (var i in GRAPH_SELECTION_GLOBAL_HANDLER)
          Event.addGlobalHandler(i, GRAPH_SELECTION_GLOBAL_HANDLER[i], this);

        addSelectionMode = Event.mouseButton(event, Event.MOUSE_LEFT);

        var curItemPosition = getGraphItemPositionByMouseX(graph, Event.mouseX(event));
        //if (/*!shiftPressed || */!startItemPosition)
          startItemPosition = curItemPosition;

        //lastItemPosition = curItemPosition;
        var selectedItems = rebuildGraphSelection(graph, curItemPosition, startItemPosition);

        if (!ctrlPressed && addSelectionMode)
          graph.selection.clear();

        this.draw(selectedItems);
      }

      this.owner.element.setAttribute('tabindex', 1);
      this.owner.element.focus();
      
      Event.kill(event);
    },
    contextmenu: function(event){
      Event.kill(event);
    },
    keydown: function(event){
      if (Event.key(event) == Event.KEY.CTRL)
        ctrlPressed = true;

      /*if (Event.key(event) == Event.KEY.SHIFT)
        shiftPressed = true;*/
    },
    keyup: function(event){
      if (Event.key(event) == Event.KEY.CTRL)
        ctrlPressed = false;

      /*if (Event.key(event) == Event.KEY.SHIFT)
        shiftPressed = false;*/
    },
    blur: function(){
      //lastItemPosition = -1;
      startItemPosition = -1;
      addSelectionMode = true;
      ctrlPressed = false;
      //shiftPressed = false;
    }
  }

  var GRAPH_SELECTION_GLOBAL_HANDLER = {
    mousemove: function(event){
      var graph = this.owner; 
      
      var curItemPosition = getGraphItemPositionByMouseX(graph, Event.mouseX(event));
  
      /*if (curItemPosition != lastItemPosition)
      {*/
        //lastItemPosition = curItemPosition;
        var selectedItems = rebuildGraphSelection(graph, curItemPosition, startItemPosition);
        this.draw(selectedItems);
      //}
    },
    mouseup: function(event){
      var graph = this.owner; 

      var curItemPosition = getGraphItemPositionByMouseX(graph, Event.mouseX(event));
      var selectedItems = rebuildGraphSelection(graph, curItemPosition, startItemPosition);
      
      graph.selection.set(selectedItems);

      for (var i in GRAPH_SELECTION_GLOBAL_HANDLER)
        Event.removeGlobalHandler(i, GRAPH_SELECTION_GLOBAL_HANDLER[i], this);
    }
  }

  var GRAPH_SELECTION_HANDLER = {
    datasetChanged: function(object, delta){
      this.draw();
    }
  }

 /**
  * @class
  */
  var GraphSelection = CanvasLayer.subclass({
    className: namespace + '.GraphSelection',

    style: {
      fillStyle: '#dfdaff', 
      strokeStyle: '#9a89ff',
      alpha: '.7'
    },

    template: '<canvas{canvas} class="{selected} {disabled}" style="position:absolute;left:0;top:0"/>',

    listen: {
      owner: {
        draw: function(){
          this.recalc();
          this.draw();
        }
      }
    },

    event_ownerChanged: function(object, oldOwner){
      CanvasLayer.prototype.event_ownerChanged.call(this, object, oldOwner);
      
      if (oldOwner && oldOwner.selection)
      {
        oldOwner.selection.removeHandler(GRAPH_SELECTION_HANDLER, this);
        Event.removeHandlers(oldOwner.element, GRAPH_ELEMENT_HANDLER, this);
      }

      if (this.owner && this.owner.selection)
      {
        this.recalc();
        this.owner.selection.addHandler(GRAPH_SELECTION_HANDLER, this);

        Event.addHandlers(this.owner.element, GRAPH_ELEMENT_HANDLER, this);
      }
    },

    recalc: function(){
      this.tmpl.canvas.width = this.owner.tmpl.canvas.width;
      this.tmpl.canvas.height = this.owner.tmpl.canvas.height;

      this.clientRect = this.owner.clientRect;
    },

    draw: function(selectedItems){
      this.reset();

      this.context.save();
      this.context.translate(this.clientRect.left, this.clientRect.top);

      var selectionBarWidth = this.clientRect.width / (this.owner.childNodes.length - 1);

      if (!selectedItems)
        selectedItems = this.owner.selection.getItems();

      var selectedItemsMap = {};

      for (var i = 0; i < selectedItems.length; i++)
        selectedItemsMap[selectedItems[i].eventObjectId] = true;

      var left, right;
      var lastPos = -1;

      Object.extend(this.context, this.style);

      for (var i = 0; i < this.owner.childNodes.length + 1; i++)
      {
        var child = this.owner.childNodes[i];
        if (child && selectedItemsMap[child.eventObjectId])
        {
          if (lastPos == -1)
            lastPos = i;
        }
        else
        {
          if (lastPos != -1)
          {
            left = Math.round(lastPos * selectionBarWidth - (lastPos == i - 1 ? 1 : 0));
            right = Math.round((i - 1) * selectionBarWidth + (lastPos == i - 1 ? 1 : 0));
            this.context.fillRect(left + .5, .5, right - left, this.clientRect.height);
            this.context.strokeRect(left + .5, .5, right - left, this.clientRect.height);
            lastPos = -1;
          }
        }
      }

      this.context.restore();
    }
  });

 /**
  * @class
  */
  var GraphViewer = CanvasLayer.subclass({
    className: namespace + '.GraphViewer',

    template: '<canvas{canvas} class="{selected} {disabled}" event-mousemove="move" event-mouseout="out" style="position:absolute;left:0;top:0"/>',

    action: {
      move: function(event){
        this.mx = Event.mouseX(event);
        this.my = Event.mouseY(event);

        this.updatePosition(this.mx, this.my);
      },
      out: function(){
        this.mx = null;
        this.my = null;

        this.reset();
      }
    },

    listen: {
      owner: {
        draw: function(){
          this.recalc();

          if (this.mx)
            this.updatePosition(this.mx, this.my);
        }
      }
    },

    event_ownerChanged: function(object, oldOwner){
      CanvasLayer.prototype.event_ownerChanged.call(this, object, oldOwner);

      if (this.owner)
        this.recalc();
    },

    recalc: function(){
      this.element.width = this.owner.tmpl.canvas.width;
      this.element.height = this.owner.tmpl.canvas.height;

      this.clientRect = this.owner.clientRect;
      this.max = this.owner.maxValue;
    },

    updatePosition: function(mx, my){
      this.reset();

      var canvasRect = this.element.getBoundingClientRect();
      var x = mx - canvasRect.left - this.clientRect.left;
      var y = my - canvasRect.top - this.clientRect.top;

      var needToDraw = x > 0 && x < this.clientRect.width && y > 0 && y < this.clientRect.height;

      if (needToDraw)
        this.draw(x, y);
    },

    draw: function(x, y){
      var context = this.context;

      context.save();
      context.translate(this.clientRect.left, this.clientRect.top);

      var TOP = this.clientRect.top;
      var WIDTH = this.clientRect.width;
      var HEIGHT = this.clientRect.height;
      var MAX = this.max;

      var series = this.owner.series.childNodes;
      var keyCount = this.owner.childNodes.length;
      var step = WIDTH / (keyCount - 1);
      var keyPosition = Math.round(x / step);
      var xPosition = Math.round(keyPosition * step);

      context.beginPath();
      context.moveTo(xPosition + .5, 0);
      context.lineTo(xPosition + .5, HEIGHT);
      context.strokeStyle = '#CCC';
      context.stroke();
      context.closePath();

      context.font = "10px tahoma";
      context.textAlign = "center";
      var keyText = this.owner.keyTitleGetter(this.owner.childNodes[keyPosition]);
      var keyTextWidth = context.measureText(keyText).width;
      var keyTextHeight = 10;

      context.beginPath();
      context.moveTo(xPosition + .5, HEIGHT + 1 + .5);
      context.lineTo(xPosition - 3 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition - Math.round(keyTextWidth / 2) - 5 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition - Math.round(keyTextWidth / 2) - 5 + .5, HEIGHT + 4 + keyTextHeight + 5 + .5);
      context.lineTo(xPosition + Math.round(keyTextWidth / 2) + 5 + .5, HEIGHT + 4 + keyTextHeight + 5 + .5);
      context.lineTo(xPosition + Math.round(keyTextWidth / 2) + 5 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition + 3 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition + .5, HEIGHT + 1);
      context.fillStyle = '#c29e22';
      context.strokeStyle = '#070';
      context.fill();
      context.stroke();
      context.closePath();

      context.fillStyle = 'black';
      context.fillText(keyText, xPosition +.5, TOP + HEIGHT + 5);

      var labels = [];

      var labelPadding = 7;
      var labelHeight = 10 + 2*labelPadding;
      var labelWidth = 0;

      //var key = this.owner.keyGetter(this.owner.childNodes[keyPosition]);
      for (var i = 0, seria; seria = series[i]; i++)
      {
        var value = this.owner.childNodes[keyPosition].values[seria.eventObjectId];

        if (isNaN(value))
          continue;

        var valueText = Number(value.toFixed(2)).group();
        var valueTextWidth = context.measureText(valueText).width;

        if (labelWidth < valueTextWidth)
          labelWidth = valueTextWidth; 

        var valueY = Math.round((1 - value / MAX) * HEIGHT);
        var labelY = Math.max(labelHeight / 2, Math.min(valueY, HEIGHT - labelHeight / 2));

        labels[i] = {
          color: seria.getColor(),
          text: valueText,
          valueY: valueY,
          labelY: labelY
        }
      }

      // adjust label positions 
      var labels = labels.sortAsObject(getter('valueY'));
      var crossGroup = labels.map(function(label){
        return { labels: [label], y: label.labelY, height: labelHeight };
      })
      var hasCrossing = true;
      while (crossGroup.length > 1 && hasCrossing)
      {
        var i = 1;
        while (i < crossGroup.length)
        {
          hasCrossing = false;
          if ((crossGroup[i].y - crossGroup[i].height / 2) < (crossGroup[i - 1].y + crossGroup[i - 1].height / 2))
          {
            crossGroup[i].y = crossGroup[i - 1].y + (crossGroup[i].y - crossGroup[i - 1].y) * crossGroup[i].labels.length / crossGroup[i - 1].labels.length / 2;
            crossGroup[i].labels = crossGroup[i - 1].labels.concat(crossGroup[i].labels);
            crossGroup[i].height = crossGroup[i].labels.length * labelHeight;
            crossGroup[i].y = Math.max(crossGroup[i].height / 2, Math.min(crossGroup[i].y, HEIGHT - crossGroup[i].height / 2));
            crossGroup.splice(i - 1, 1);
            hasCrossing = true;
          }
          else
            i++;
        }
      }
      for (var i = 0; i < crossGroup.length; i++)
      {
        for (var j = 0; j < crossGroup[i].labels.length; j++)
        {
          var label = crossGroup[i].labels[j];
          label.labelY = crossGroup[i].y - crossGroup[i].height / 2 + j * labelHeight + labelHeight / 2;
        }
      }

      // draw labels
      var align = keyPosition >= (keyCount / 2) ? -1 : 1;

      for (var i = 0, label; label = labels[i]; i++)
      {
        var pointWidth = 3;
        context.strokeStyle = label.color;
        context.fillStyle = 'white';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(xPosition + .5, label.valueY + .5, pointWidth, 0, 2*Math.PI);
        context.stroke();         
        context.fill();
        context.closePath();
        
        
        var tongueSize = 10;
        context.beginPath();
        context.moveTo(xPosition + (pointWidth + 1) * align + .5, label.valueY + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY - 5 + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY - Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + (labelWidth + 2*labelPadding)*align + .5, label.labelY - Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + (labelWidth + 2*labelPadding)*align + .5, label.labelY + Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY + Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY + 5 + .5);
        context.lineTo(xPosition + (pointWidth + 1) * align + .5, label.valueY + .5);
        context.fillStyle = label.color;
        context.strokeStyle = '#444';
        context.lineWidth = 1;
        context.stroke();
        context.fill();
        context.closePath();

        context.fillStyle = 'black';
        context.textAlign = 'right';
        context.fillText(label.text, xPosition + (pointWidth + tongueSize + labelPadding)*align + (align == 1 ? labelWidth : 0) + .5, label.labelY + 4);
      }

      context.restore();
    }
  });

 /**
  * @class
  */
  var LinearGraph = AxisGraph.subclass({
    className: namespace + '.LinearGraph',

    fillArea: true,
    style: {
      strokeStyle: '#090',
      lineWidth: 2.5,
      lineJoin: 'bevel'
    },

    satelliteConfig: {
      graphViewer: {
        instanceOf: GraphViewer
      },
      graphSelection: {
        instanceOf: GraphSelection,
        existsIf: getter('selection')
      }
    },

    init: function(config){
      if (this.selection && !(this.selection instanceof Selection))
        this.selection = Object.complete({ multiple: true }, this.selection)

      AxisGraph.prototype.init.call(this, config);
    },

    drawSeria: function(values, color, pos, min, max, step, left, top, width, height){
      var context = this.context;

      if (!this.keyValuesOnEdges)
        left += step / 2;

      //var color = seria.getColor();
      this.style.strokeStyle = color;
      //var values = seria.getValues(keys);

      context.save();
      context.translate(left, top);
      context.beginPath();

      var x, y;
      for (var i = 0; i < values.length; i++)
      {
        x = i * step;
        y = height * (1 - (values[i] - min) / (max - min))
        
        if (i == 0)
          context.moveTo(x, y);
        else
          context.lineTo(x, y);
      }

      Object.extend(context, this.style);
      context.stroke();

      if (this.fillArea && this.childNodes.length == 1)
      {
        context.lineWidth = 0;
        var zeroPosition = min < 0 ? Math.max(0, max) / (max - min) * height : height;
        context.lineTo(width, zeroPosition);
        context.lineTo(0, zeroPosition);
        context.globalAlpha = .15;
        context.fillStyle = color;
        context.fill();
      }

      context.closePath();
      context.restore();
    }
  });

  //
  // Bar Graph
  //

  /**
   * @class
   */
  var BarGraphViewer = GraphViewer.subclass({
    draw: function(x, y){
      var context = this.context;

      context.save();
      context.translate(this.clientRect.left, this.clientRect.top);

      var clientRect = this.owner.clientRect;
      var bars = this.owner.bars;
      var series = this.owner.series.childNodes;
      //var keys = this.owner.getKeys();
            
      var invertAxis = this.owner.invertAxis; 
      var WIDTH = clientRect.width;
      var HEIGHT = clientRect.height;

      var step = (invertAxis ? HEIGHT : WIDTH) / bars[0].length;
      var position = invertAxis ? y : x;
      var barPosition = Math.floor(position / step);

      var keyTitle = this.owner.keyTitleGetter(this.owner.childNodes[barPosition]);
      
      var legendText;
      var hoveredBar;
      var bar;
      for (var i = 0; i < bars.length; i++)
      {
        bar = bars[i][barPosition];
        if (x >= bar.x && x <= (bar.x + bar.width) && y >= bar.y && y <= (bar.y + bar.height))
        {
          hoveredBar = bar;
          legendText = series[i].getLegend();
          break;
        }
      }

      if (!hoveredBar)
      {
        context.restore();
        return;
      }

      var TOOLTIP_PADDING = 5;

      var tooltipText = keyTitle + ', ' + legendText + ', ' + Number(hoveredBar.value.toFixed(2)).group();
      context.font = "10px Tahoma";
      
      var tooltipTextWidth = context.measureText(tooltipText).width;
      var tooltipWidth = tooltipTextWidth + 2*TOOLTIP_PADDING;
      var tooltipHeight = 10 + 2*TOOLTIP_PADDING;

      var tooltipX = Math.round(Math.max(0, Math.min(this.clientRect.width - tooltipWidth, x - tooltipWidth / 2)));
      var tooltipY = Math.round(y - tooltipHeight - 5);

      if (tooltipY < 0) //show under cursor
        tooltipY = Math.round(y + 20); 

      context.strokeStyle = 'black';
      context.lineWidth = 1.5;
      context.shadowColor = '#000';
      context.shadowBlur = 5;
      context.strokeRect(hoveredBar.x + .5, hoveredBar.y + .5, hoveredBar.width, hoveredBar.height);
      context.clearRect(hoveredBar.x + .5, hoveredBar.y + .5, hoveredBar.width, hoveredBar.height);

      context.strokeStyle = '#333';
      context.fillStyle = 'white';
      context.lineWidth = 1;
      context.shadowBlur = 3;
      context.fillRect(tooltipX + .5, tooltipY + .5, tooltipWidth, tooltipHeight);        
      context.shadowBlur = 0;
      context.strokeRect(tooltipX + .5, tooltipY + .5, tooltipWidth, tooltipHeight);

      context.fillStyle = 'black';
      context.fillText(tooltipText, tooltipX + TOOLTIP_PADDING, tooltipY + tooltipHeight - TOOLTIP_PADDING);

      context.restore();
    }
  });
  

  /**
   * @class
   */
  var BarGraph = AxisGraph.subclass({
    className: namespace + '.BarGraph',
    
    bars: null,
    keyValuesOnEdges: false,

    satelliteConfig: {
      graphViewer: BarGraphViewer
    },

    drawFrame: function(){
      this.bars = [];
      AxisGraph.prototype.drawFrame.call(this);
    },

    drawSeria: function(values, color, pos, min, max, step, left, top, width, height){
      var context = this.context;

      //var values = seria.getValues(keys);
      //var color = seria.getColor();

      context.save();
      context.translate(left, top);
      context.fillStyle = color;

      Object.extend(context, this.style);
      context.strokeStyle = '#333';
      context.lineWidth = 1;

      var zeroLinePosition = min >= 0 ? 0 : (max <= 0 ? height : Math.abs(min / (max - min) * height));

      var bar;
      this.bars[pos] = [];
      for (var i = 0; i < values.length; i++)
      {
        bar = this.getBarRect(values[i], pos, i, min, max, step, width, height, zeroLinePosition);

        bar.value = values[i];
        this.bars[pos].push(bar);

        bar.x = Math.round(bar.x);
        bar.y = Math.round(bar.y);
        bar.width = Math.round(bar.width);
        bar.height = Math.round(bar.height);

        this.drawBar(bar);
      }

      context.restore();
    },
    getBarRect: function(value, seriaPos, barPos, min, max, step, width, height, zeroLinePosition){                                                                        
      var cnt = this.series.childNodes.length;
      var barSize = Math.round(0.7 * step / cnt);

      var bar = {};
      if (this.invertAxis)
      {
        bar.height = barSize;          
        bar.y = step / 2 + barPos * step - bar.height * cnt / 2 + seriaPos * bar.height;

        var x = (value - min) / (max - min) * width;
        bar.width = (x - zeroLinePosition) * (value > 0 ? 1 : -1);
        bar.x = zeroLinePosition - (value < 0 ? bar.width : 0);
      }
      else
      {
        bar.width = barSize;          
        bar.x = step / 2 + barPos * step - bar.width * cnt / 2 + seriaPos * bar.width;
        var y = (value - min) / (max - min) * height;
        bar.height = (y - zeroLinePosition) * (value > 0 ? 1 : -1);
        bar.y = height - zeroLinePosition - (value > 0 ? bar.height : 0);
      }

      return bar;
    },
    drawBar: function(bar){
      this.context.fillRect(bar.x + .5, bar.y + .5, bar.width, bar.height);
      if(bar.width > 10 && bar.height > 10)
        this.context.strokeRect(bar.x + .5, bar.y + .5, bar.width, bar.height);
    }
  });

  /**
   * @class
   */
  var StackedBarGraph = BarGraph.subclass({
    getMaxValue: function(){
      var max;
      var sum;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        sum = 0;
        for (var j in child.values)
          sum += child.values[j];

        if (sum > max || max == null)
          max = sum
      }
      return max;

      /*var keys = this.getKeys();
      var series = this.seriesList.childNodes;
      var values = series[0].getValues(keys);
      for (var i = 1, seria; seria = series[i]; i++)
      {
        seria.getValues(keys).forEach(function(value, pos) { values[pos] += value });
      }

      return Math.max.apply(null, values);*/
    },
    getBarRect: function(value, seriaPos, barPos, min, max, step, width, height, zeroLinePosition){
      var bar = {};
      var previousBar = seriaPos > 0 && this.bars[seriaPos - 1][barPos];
      var barSize = 0.7 * step;
            
      if (this.invertAxis)
      {
        bar.height = barSize;          
        bar.y = step / 2 + barPos * step - barSize / 2;

        bar.width = value / max * width;
        bar.x = (previousBar && (previousBar.x + previousBar.width)) || 0;
      }
      else
      {
        bar.width = barSize;          
        bar.x = step / 2 + barPos * step - bar.width / 2;

        bar.height = value / max * height;
        bar.y = height - bar.height - (previousBar && (height - previousBar.y));
      }

      return bar;
    }
  });


  //
  // export names
  //

  this.extend({
    LinearGraph: LinearGraph,
    BarGraph: BarGraph,
    StackedBarGraph: StackedBarGraph
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/ui/graph.js").call(basis.namespace("basis.ui.graph"), basis.namespace("basis.ui.graph"), basis.namespace("basis.ui.graph").exports, this, __curLocation + "src/basis/ui/graph.js", __curLocation + "src/basis/ui/", basis, function(url){ return basis.resource(__curLocation + "src/basis/ui/" + url) });

//
// src/basis/format/highlight.js
//

new Function(__wrapArgs, function(){

/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  'use strict';

  basis.require('basis.ui');

  
 /**
  * @namespace basis.format.highlight
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var UINode = basis.ui.Node;


  //
  // Main part
  //

  var LANG_PARSER = {};
  var PARSER = {
    add: function(lang, fn){
      LANG_PARSER[lang] = fn;
    }
  };

  //
  // default parser
  //

  PARSER.add('text', Array.from);

  //
  // javascript parser
  //

  PARSER.add('js', (function(){
    var keywords = 
      'break case catch continue ' +
      'default delete do else false ' +
      'for function if in instanceof ' +
      'new null return super switch ' +
      'this throw true try typeof var while with';

    var keywordRegExp = new RegExp('\\b(' + keywords.qw().join('|') + ')\\b', 'g');

    return function(text){
      function addMatch(kind, start, end, rn){
        if (lastMatchPos != start)
          result.push(text.substring(lastMatchPos, start).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));

        lastMatchPos = end + 1;

        if (kind)
          result.push('<span class="token-' + kind + '">' + text.substring(start, end + 1) + '</span>' + (rn || ''));
      }

      var result = [];
      var sym = text.toArray();
      var start;
      var lastMatchPos = 0;
      var strSym;

      for (var i = 0; i < sym.length; i++)
      {
        if (sym[i] == '\'' || sym[i] == '\"')
        {
          strSym = sym[i];
          start = i;
          while (++i < sym.length)
          {
            if (sym[i] == '\\')
            {
              if (sym[i + 1] == '\n')
              {
                addMatch('string', start, i);
                start = ++i + 1;
              }
              else
                i += 2;
            }

            if (sym[i] == strSym)
            {
              addMatch('string', start, i);
              break;
            }

            if (sym[i] == '\n')
              break;
          }
        }
        else if (sym[i] == '/')
        {
          start = i;
          i++;

          if (sym[i] == '/')
          {
            while (++i < sym.length)
            {
              if (sym[i] == '\n')
                break;
            }

            addMatch('comment', start, i - 1);
          }
          else if (sym[i] == '*')
          {
            while (++i < sym.length)
            {
              if (sym[i] == '*' && sym[i + 1] == '/')
              {
                addMatch('comment', start, ++i);
                break;
              }
              else if (sym[i] == '\n')
              {
                addMatch('comment', start, i - 1, '\n');
                lastMatchPos = start = i + 1;
              }
            }
          }
        }
      }

      addMatch(null, text.length);

      return result;
    }
  })());

  PARSER.add('css', (function(){
    var prefixes =
      '-webkit- -o- -ms- -moz- -khtml-';
    var properties = 
      'azimuth background-attachment background-color background-image background-position ' +
      'background-repeat background border-collapse border-color border-spacing border-style ' +
      'border-top border-right border-bottom border-left border-top-color border-right-color ' +
      'border-bottom-color border-left-color border-top-style border-right-style border-bottom-style ' +
      'border-left-style border-top-width border-right-width border-bottom-width border-left-width ' +
      'border-width border bottom caption-side clear clip color content counter-increment ' +
      'counter-reset cue-after cue-before cue cursor direction display elevation empty-cells ' +
      'float font-family font-size font-style font-variant font-weight font height left ' +
      'letter-spacing line-height list-style-image list-style-position list-style-type ' +
      'list-style margin-right margin-left margin-top margin-bottom margin max-height ' +
      'max-width min-height min-width orphans outline-color outline-style outline-width ' +
      'outline overflow padding-top padding-right padding-bottom padding-left padding ' +
      'page-break-after page-break-before page-break-inside pause-after pause-before ' +
      'pause pitch-range pitch play-during position quotes richness right speak-header ' +
      'speak-numeral speak-punctuation speak speech-rate stress table-layout text-align ' +
      'text-decoration text-indent text-transform top unicode-bidi vertical-align visibility ' +
      'voice-family volume white-space widows width word-spacing z-index';
    var css3properties = 
      // CSS Transitions Module Level 3 (http://www.w3.org/TR/css3-transitions/)
      'transition transition-delay transition-duration transition-property transition-timing-function ' +
      // CSS 2D Transforms (http://www.w3.org/TR/css3-2d-transforms/)
      'transform transform-origin ' + 
      // CSS Backgrounds and Borders Module Level 3 (http://www.w3.org/TR/css3-background/)
      'background-origin background-clip background-size ' +
      'border-image border-image-outset border-image-repeat border-image-slice border-image-source border-image-width ' +
      'border-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-top-left-radius ' +
      'box-decoration-break box-shadow ' +
      // CSS Multi-column Layout Module (http://www.w3.org/TR/css3-multicol/)
      'column-count column-fill column-gap column-rule column-rule-color column-rule-style column-rule-width columns column-span column-width';

    var values =
      'left-side far-left left center-left center-right center far-right right-side ' +
      'right behind leftwards rightwards inherit scroll fixed transparent none repeat-x ' +
      'repeat-y repeat no-repeat collapse separate auto top bottom both open-quote ' +
      'close-quote no-open-quote no-close-quote crosshair default pointer move e-resize ' +
      'ne-resize nw-resize n-resize se-resize sw-resize s-resize text wait help ltr rtl ' +
      'inline block list-item run-in compact marker table inline-table table-row-group ' +
      'table-header-group table-footer-group table-row table-column-group table-column ' +
      'table-cell table-caption below level above higher lower show hide caption icon ' +
      'menu message-box small-caption status-bar normal wider narrower ultra-condensed ' +
      'extra-condensed condensed semi-condensed semi-expanded expanded extra-expanded ' +
      'ultra-expanded italic oblique small-caps bold bolder lighter inside outside ' +
      'disc circle square decimal decimal-leading-zero lower-roman upper-roman lower-greek ' +
      'lower-alpha lower-latin upper-alpha upper-latin hebrew armenian georgian ' +
      'cjk-ideographic hiragana katakana hiragana-iroha katakana-iroha crop cross invert ' +
      'visible hidden always avoid x-low low medium high x-high static relative absolute ' +
      'portrait landscape spell-out once digits continuous code x-slow slow fast x-fast ' +
      'faster slower justify underline overline line-through blink capitalize uppercase ' +
      'lowercase embed bidi-override baseline sub super text-top middle text-bottom silent ' +
      'x-soft soft loud x-loud pre nowrap serif sans-serif cursive fantasy monospace empty ' +
      'string strict loose char true false dotted dashed solid double groove ridge inset ' +
      'outset larger smaller xx-small x-small small large x-large xx-large all newspaper ' +
      'distribute distribute-all-lines distribute-center-last inter-word inter-ideograph ' +
      'inter-cluster kashida ideograph-alpha ideograph-numeric ideograph-parenthesis ' +
      'ideograph-space keep-all break-all break-word lr-tb tb-rl thin thick inline-block ' +
      'w-resize hand distribute-letter distribute-space whitespace ignore';

    var propertiesRegExp = new RegExp('(^|[^a-z0-9\-])((?:' + prefixes.qw().join('|') + ')?(?:' + css3properties.qw().join('|') + ')|(?:' + properties.qw().join('|') + '))(\s|:|$)', 'gi');
    var valuesRegExp = new RegExp('\\b(' + values.qw().join('|') + ')\\b', 'g');

    return function(text){
      function addMatch(kind, start, end, rn){
        if (lastMatchPos != start)
        {
          var fragment = text.substring(lastMatchPos, start);

          if (blockScope)
          {
            if (valueScope)
              fragment = fragment.replace(valuesRegExp, '<span class="token-value">$1</span>');
            else
              fragment = fragment.replace(propertiesRegExp, '$1<span class="token-key">$2</span>$3');
          }

          result.push(fragment);
        }

        lastMatchPos = end + 1;

        if (kind)
          result.push('<span class="token-' + kind + '">' + text.substring(start, end + 1) + '</span>' + (rn || ''));
      }

      var result = [];
      var sym = text.toArray();
      var start = 0;
      var lastMatchPos = 0;
      var strSym;
      var blockScope = false;
      var valueScope = false;
      var braceScope = false;

      for (var i = 0; i < sym.length; i++)
      {
        if (sym[i] == '\'' || sym[i] == '\"')
        {
          strSym = sym[i];
          start = i;
          while (++i < sym.length)
          {
            if (sym[i] == strSym)
            {
              addMatch('string', start, i);
              break;
            }

            if (sym[i] == '\n')
              break;

            if (sym[i] == '\\' && sym[i + 1] == '\n')
            {
              addMatch('string', start, i);
              start = ++i + 1;
            }
          }
        }
        else if (sym[i] == '/')
        {
          start = i;
          i++;

          if (sym[i] == '*')
          {
            while (++i < sym.length)
            {
              if (sym[i] == '*' && sym[i + 1] == '/')
              {
                addMatch('comment', start, ++i);
                break;
              }
              else if (sym[i] == '\n')
              {
                addMatch('comment', start, i - 1, '\n');
                lastMatchPos = start = i + 1;
              }
            }
          }
        }
        else if (sym[i] == '{')
        {
          blockScope = true;
          valueScope = false;
          braceScope = false;
          start = i + 1;
          addMatch('', start, i);
        }
        else if (sym[i] == '(')
        {
          if (valueScope)
            braceScope = true;
        }
        else if (sym[i] == ')')
        {
          if (valueScope)
            braceScope = false;
        }
        else if (sym[i] == ':')
        {
          if (blockScope && !braceScope)
          {
            start = i + 1;
            addMatch('', start, i);
            valueScope = true;
          }
        }
        else if (sym[i] == ';')
        {
          if (blockScope && !braceScope)
          {
            start = i + 1;
            addMatch('', start, i);
            valueScope = false;
          }
        }
        else if (sym[i] == '}')
        {
          blockScope = false;
          valueScope = false;
        }
      }

      addMatch(null, text.length);

      return result;
    }
  })());


 /**
  * @func
  */
  function highlight(text, lang, options){

    function normalize(text, offset){
      text = text
               .trimRight()
               .replace(/\r\n|\n\r|\r/g, '\n')

      if (!options.keepFormat)
        text = text.replace(/^(?:\s*[\n]+)+?([ \t]*)/, '$1');

      // fix empty strings
      text = text
               .replace(/\n[ \t]+/g, function(m){ return m.replace(/\t/g, '  '); })
               .replace(/\n[ \t]+\n/g, '\n\n');

      if (!options.keepFormat)
      {
        // normalize text offset
        var minOffset = 1000;
        var lines = text.split(/\n+/);
        var startLine = Number(text.match(/^function/) != null); // fix for function.toString()
        for (var i = startLine; i < lines.length; i++)
        {
          var m = lines[i].match(/^\s*/);
          if (m[0].length < minOffset)
            minOffset = m[0].length;
          if (minOffset == 0)
            break;
        }

        if (minOffset > 0)
          text = text.replace(new RegExp('(^|\\n) {' + minOffset + '}', 'g'), '$1');
      }

      text = text.replace(new RegExp('(^|\\n)( +)', 'g'), function(m, a, b){ return a + '\xA0'.repeat(b.length)});

      return text; 
    }

    //  MAIN PART

    if (!options)
      options = {};

    var parser = LANG_PARSER[lang] || LANG_PARSER['text'];
    var html = parser(normalize(text || '').replace(/</g, '&lt;'));

    var lines = html.join('').split('\n');
    var numberWidth = String(lines.length).length;
    var res = [];
    var lineClass = (options.noLineNumber ? '' : ' hasLineNumber');
    for (var i = 0; i < lines.length; i++)
    {
      res.push(
        '<div class="line ' + (i % 2 ? 'odd' : 'even') + lineClass + '">' +
          '<span class="lineContent">' + 
            (!options.noLineNumber
              ? '<input class="lineNumber" value="' + (i + 1).lead(numberWidth) + '" type="none" unselectable="on" readonly="readonly" tabindex="-1" />' +
                '<span class="over"></span>'
              : ''
            ) +
            (lines[i] + '\r\n') + 
          '</span>' +
        '</div>'
      )
    }

    return res.join('');
  }

 /**
  * @class
  */
  var SourceCodeNode = Class(UINode, {
    className: namespace + '.SourceCodeNode',

    template:
      '<pre{code} class="Basis-SyntaxHighlight"/>',

    codeGetter: Function.getter('data.code'),
    normalize: true,
    lineNumber: true,
    lang: 'text',

    templateUpdate: function(tmpl, event, delta){
      var code = this.codeGetter(this);
      if (code != this.code_)
      {
        this.code_ = code;
        this.tmpl.code.innerHTML = highlight(code, this.lang, {
          keepFormat: !this.normalize,
          noLineNumber: !this.lineNumber
        });
      }
    }
  });

  //
  // export names
  //

  this.extend({
    // functions
    highlight: highlight,

    // classes
    SourceCodeNode: SourceCodeNode
  });


}.body() + "//@ sourceURL=" + __curLocation + "src/basis/format/highlight.js").call(basis.namespace("basis.format.highlight"), basis.namespace("basis.format.highlight"), basis.namespace("basis.format.highlight").exports, this, __curLocation + "src/basis/format/highlight.js", __curLocation + "src/basis/format/", basis, function(url){ return basis.resource(__curLocation + "src/basis/format/" + url) });

//
// src/package/all.js
//

new Function(__wrapArgs, function(){


  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.ua.visibility');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.template');
  basis.require('basis.html');
  basis.require('basis.date');
  basis.require('basis.dragdrop');
  basis.require('basis.animation');
  basis.require('basis.xml');
  basis.require('basis.layout');
  basis.require('basis.crypt');
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.data.generator');
  basis.require('basis.data.property');
  basis.require('basis.data.index');
  basis.require('basis.entity');
  basis.require('basis.session');
  basis.require('basis.net.ajax');
  basis.require('basis.net.soap');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.label');
  basis.require('basis.ui.tree');
  basis.require('basis.ui.popup');
  basis.require('basis.ui.table');
  basis.require('basis.ui.scrolltable');
  basis.require('basis.ui.window');
  basis.require('basis.ui.tabs');
  basis.require('basis.ui.calendar');
  basis.require('basis.ui.form');
  basis.require('basis.ui.scroller');
  basis.require('basis.ui.slider');
  basis.require('basis.ui.resizer');
  basis.require('basis.ui.paginator');
  basis.require('basis.ui.pageslider');
  basis.require('basis.ui.canvas');
  basis.require('basis.ui.graph');
  basis.require('basis.format.highlight');

}.body() + "//@ sourceURL=" + __curLocation + "src/package/all.js").call(basis.namespace("package.all"), basis.namespace("package.all"), basis.namespace("package.all").exports, this, __curLocation + "src/package/all.js", __curLocation + "src/package/", basis, function(url){ return basis.resource(__curLocation + "src/package/" + url) });})();