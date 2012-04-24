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

        if (namespaces[namespace])
          return namespaces[namespace].exports;
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
      var extMatch = resourceUrl.match(/\.[a-z0-9]+$/);
      var extWrapper;
      if (extMatch)
        extWrapper = fetchResourceFunction.extensions[extMatch[0]];

      //console.log('new resource resolver:' + resourceUrl);
      var attaches = [];
      var resource = extWrapper
        ? Function.lazyInit(function(){
            return extWrapper(externalResource(resourceUrl), resourceUrl);
          })
        : function(){
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

  fetchResourceFunction.extensions = {
    '.js': function(resource, url){
      return runScriptInContext({ exports: {} }, url, resource).exports;
    },
    '.json': function(resource, url){
      var result;
      try {
        result = JSON.parse(String(resource));
      } catch(e) {
        if (typeof console != 'undefined') console.warn('basis.resource: Can\'t parse JSON from ' + url, { url: url, source: String(resource) });
      }
      return result || false;
    }
  };

  var runScriptInContext = function(context, sourceURL, scriptText){
    var baseURL = dirname(sourceURL);
    var scriptFn;

    if (typeof context.exports != 'object')
      context.exports = {};

    // compile context function
    try {
      scriptFn = Function('exports, module, basis, global, __filename, __dirname, resource',
        '"use strict";\n\n' +
        scriptText +
        '//@ sourceURL=' + sourceURL
      );
    } catch(e) {
      ;;;console.log('Compilation error ' + sourceURL);
      throw e;
    }

    // run
    scriptFn.call(
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
  }

  var wrapScript = function(context, sourceURL){
    var baseURL = dirname(sourceURL);

    return function(){
      var scriptText = externalResource(sourceURL);
      var scriptFn;

      if (typeof context.exports != 'object')
        context.exports = {};

      // compile context function
      try {
        scriptFn = Function('exports, module, basis, global, __filename, __dirname, resource',
          '"use strict";\n\n' +
          scriptText +
          '//@ sourceURL=' + sourceURL
        );
      } catch(e) {
        ;;;console.log('Compilation error ' + sourceURL);
        throw e;
      }

      // run
      scriptFn.call(
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
      if (typeof document != 'undefined' && document.readyState != 'complete')
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
        document.addEventListener("DOMContentLoaded", fireHandlers, false);

        // A fallback to window.onload, that will always work
        window.addEventListener("load", fireHandlers, false);
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
    }
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

    ready: onLoad,

    platformFeature: {},

    Cleaner: Cleaner
  });

}(this);
//alert(document.getElementsByTagName('script').length + '/' + document.scripts.length);