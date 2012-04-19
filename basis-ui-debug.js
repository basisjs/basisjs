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
// src/package/ui.js
//

new Function(__wrapArgs, function(){


  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.template');
  basis.require('basis.html');
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.data.property');
  basis.require('basis.data.index');
  basis.require('basis.entity');
  basis.require('basis.ui');

}.body() + "//@ sourceURL=" + __curLocation + "src/package/ui.js").call(basis.namespace("package.ui"), basis.namespace("package.ui"), basis.namespace("package.ui").exports, this, __curLocation + "src/package/ui.js", __curLocation + "src/package/", basis, function(url){ return basis.resource(__curLocation + "src/package/" + url) });})();