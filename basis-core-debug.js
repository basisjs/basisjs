// Package basis-core-debug.js
//   src/basis.js
//   src/basis/ua.js
//   src/basis/dom.js
//   src/basis/dom/event.js
//   src/basis/data.js
//   src/basis/html.js
//   src/basis/dom/wrapper.js
//   src/basis/cssom.js
//   src/basis/entity.js
//   src/package/core.js

//
// src/basis.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
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
 * - Basis.Browser namespace (version detections & Cookies interface)
 * - Basis.Class namespace (provides inheritance)
 * - class EventObject
 * - Basis.DOM namespace
 * - Basis.DOM.Style namespace
 * - Basis.Event namespace
 * - Basis.Html namespace (generaly template)
 * - Basis.CSS namespace (generaly className interface)
 * - Cleaner
 * - TimeEventManager
 */

// Define global scope: `window` in the browser, or `global` on the server
!function(global){

  'use strict';

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
    var getterIdx = 1;
    var getterCache = {};
    var getterPathCache = {};

    var mGetter = function(item){ return item.modificator };
    mGetter.getter = mGetter;
    mGetter.getterIdx_ = getterIdx++;

    return function(path, modificator){
      var func, result;

      if (!modificator)
      {
        if (path.getter)
          return path.getter;
        
        if (typeof path == 'function')
          return path;
      }

      if (typeof path != 'function')
      {
        if (getterPathCache[path])
          func = getterPathCache[path];
        else
        {
          func = new Function('object', 'return object != null ? object.' + path + ' : object');
          func.path = path;
          func.getterIdx_ = getterIdx++;
          getterPathCache[path] = func;
        }
      }
      else
      {
        func = path;
        if (!func.getterIdx_)
          func.getterIdx_ = getterIdx++;
      }

      var getterIdx_ = func.getterIdx_;
      var modList = getterCache[getterIdx_];
      if (modList)
      {
        if (typeof modificator == 'undefined')
        {
          if (modList.nmg)
            return modList.nmg;
        }
        else
        {
          for (var i = 0; i < modList.length; i++) 
            if (modList[i].modificator === modificator)
              return modList[i].getter;
        }
      }
      else
        modList = getterCache[getterIdx_] = [];

      var cacheResult = true;
      switch (modificator && typeof modificator)
      {
        case 'string': 
          result = function(object){ return modificator.format(func(object)) };
          break;

        case 'function': 
          result = function(object){ return modificator(func(object)) };
          break;

        case 'object':
          cacheResult = false;
          result = function(object){ return modificator[func(object)] }; 
          break;

        default:
          if (!func.path)
            result = function(object){ return func(object) };
          else
            result = func;
      }

      if (cacheResult)
      {
        modList.push({
          getter: result,
          modificator: modificator
        });

        // save null modificator getter
        if (typeof modificator == 'undefined')
          modList.nmg = result;
      }

      result.getter = result;

      return result;
    };

  })();

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
      return this.replace(/[\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$]/g, "\\$&");
    },
    format: function(first){
      var data = {};

      for (var i = 0; i < arguments.length; i++)
        data[i] = arguments[i];

      if (typeof first == 'object')
        extend(data, first);

      return this.replace(/\{([a-z\d\_]+)(?::([\.0])(\d+)|:(\?))?\}/gi,
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
      return quoteS + (rx ? this.replace(new RegExp('[' + rx.forRegExp() + ']', 'g'), "\\$&") : this) + quoteE;
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

  // IE 5.0-7.0 fix
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
  * @namespace Basis
  */

  var namespace = 'basis';

  // ============================================ 
  // Namespace subsystem
  //

  var namespaces = {};

  function createNamespace(namespace, name){
    var names = {};

    namespace.names = function(keys){
      return Object.slice(names, typeof keys == 'string' ? keys.qw() : keys);
    };

    namespace.extend = function(newNames){
      complete(names, newNames);
      extend(this, newNames);
      return this;
    };
    //namespace.toString = function(){ return name };

    return namespace;
  }

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
        cursor[name] = createNamespace((!path.length ? wrapFunction : null) || function(){}, stepPath);
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

  var requireNamespace = (function(){
    var scripts = global.document ? global.document.getElementsByTagName('SCRIPT') : null;
    var basisRequirePath = (scripts ? scripts[scripts.length - 1].src : module.filename).replace(/[^\/]+$/, '');
    var requested = {};

    function resolve(namespace, path){
      var cursor = namespaces[namespace];
      var parts = path ? path.split(/\./) : [];

      while (cursor && parts.length)
        cursor = cursor[parts.shift()];

      return cursor;
    }

    return typeof require == 'function'
      ? function(filename){
          return require(requirePath + filename.replace(/\./g, '/'));
        }
      : function(filename, path_){
          var namespace = filename.match(/^([a-z][a-zA-Z0-9\_]*(\.[a-z][a-zA-Z0-9\_]*)*)?/)[0];
          var path = filename.substr(namespace.length ? namespace.length + 1 : 0);
          var result = resolve(namespace, path);

          var requirePath = /^basis\./.test(namespace) ? basisRequirePath : (location ? location.href : '').replace(/[a-z0-9\-\_\.]+\.[a-z0-9]+$/, '');

          if (!namespaces[namespace] || !result)
          {
            if (/^https?:/.test(requirePath))
            {
              if (!requested[filename])
              {
                requested[filename] = 1;
                var req = new XMLHttpRequest();
                req.open('POST', requirePath + (path_ || '') + filename.replace(/\./g, '/') + '.js', false);
                req.send(null);
                if (req.status == 200)
                {
                  try {
                    new Function(req.responseText).call(global);
                  } catch(e) {
                    ;;;console.log('run ' + requirePath + (path_ || '') + filename.replace(/\./g, '/') + '.js' + ' ( ' + filename + ' )');
                    throw e;
                  }
                }
                else
                {
                  if (req.status == 404 && path)
                    requireNamespace(namespace);
                  else
                    throw '!';
                }
              }
              else
              {
                throw 'Attempt to load namespace, probably cycle require';
              }
            }
            else
              throw 'Path `' + filename + '` can\'t be resolved';
          }

          return result || resolve(namespace, path);
        };
  })();


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
    *   var classA = Basis.Class(Basis.Class, { // you can use null instead of Basis.Class
    *     name: 'default value',
    *     init: function(title){ // special method - constructor
    *       this.title = title;
    *     },
    *     say: function(){
    *       return 'My name is {0}.'.format(this.title);
    *     }
    *   });
    *
    *   var classB = Basis.Class(classA, {
    *     age: 0,
    *     init: function(title, age){
    *       this.inherit(title);
    *       this.age = age;
    *     },
    *     say: function(){
    *       return this.inherit() + ' I\'m {0} year old.'.format(this.age);
    *     }
    *   });
    *
    *   var foo = new classA('John');
    *   var bar = new classB('Ivan', 25);
    *   alert(foo.say()); // My name is John.
    *   alert(bar.say()); // My name is Ivan. I'm 25 year old.
    *   alert(bar instanceof Basis.Class); // false (for some reasons it false now)
    *   alert(bar instanceof classA); // true
    *   alert(bar instanceof classB); // true
    * @namespace Basis.Class
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

   /**
    * Test object is it a class.
    * @func
    * @param {Object} object
    * @return {boolean} Returns true if object is class.
    */
    function isClass(object){
      return typeof object == 'function' && object.basisClass_;
    };

    extend(BaseClass, {
      // Base class name
      className: namespace,

      extendConstructor_: false, 

      // prototype defaults
      prototype: { 
        constructor: null,
        init: Function(),
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

        var newClassProps = {
          className: SuperClass.className + '._SubClass_',
          basisClass_: true,
          superClass_: SuperClass,
          extendConstructor_: !!SuperClass.extendConstructor_,

          // class methods
          __extend__: function(value){
            if (value && (typeof value == 'object' || (typeof value == 'function' && !isClass(value))))
              return BaseClass.create.call(null, newClass, value);
            else
              return value;
          },
          extend: BaseClass.extend,
          subclass: function(){
            return BaseClass.create.apply(null, [newClass].concat(Array.from(arguments)));
          },

          // new class prototype
          prototype: new SuperClass_()
        };

        // extend newClass prototype
        for (var args = arguments, i = 1; i < args.length; i++)
        {
          //if (typeof args[i] == 'function' && !args[i].className)
          //  console.log(args[i]);
          newClassProps.extend(
            typeof args[i] == 'function' && !isClass(args[i])
              ? args[i](SuperClass.prototype)
              : args[i]
          );
        }

        /** @cut */if (/^function[^(]*\(config\)/.test(newClassProps.prototype.init) ^ newClassProps.extendConstructor_) console.warn('probably wrong extendConstructor_ value for ' + newClassProps.className);

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
                  }

                // simple constructor
                : function(){
                    // mark object
                    this.eventObjectId = seed.id++;

                    // call constructor
                    this.init.apply(this, arguments);
                  }

            /** @cut for more verbose in dev */ ) + '\n}["' + className + '"]')(seed, NULL_CONFIG);

        // add constructor property to prototype
        newClassProps.prototype.constructor = newClass;

        // extend constructor with properties
        extend(newClass, newClassProps);

        //if (!window.classCount) window.classCount = 0; window.classCount++;
        //if (!window.classList) window.classList = []; window.classList.push(newClass);
        
        return newClass;
      },

      // isn't need for complete method, because existing prototype methods aren't overriding and new methods aren't required to be wrapped
      // complete: function(source){
      // },

     /**
      * Extend class prototype
      * @param {Object} source If source has a prototype, it will be used to extend current prototype.
      * @return {function()} Returns `this`.
      */
      extend: function(source){
        var proto = this.prototype;
        
        if (source.prototype)
          source = source.prototype;

        var keys = Object.keys(source);
        
        // for browsers that doesn't enum toString
        if (source.toString !== Object.prototype.toString)
          keys.add('toString');
        
        for (var i = keys.length; i --> 0;)
        {
          var key = keys[i];
          var value = source[key];
          var protoValue = proto[key];

          if (key == 'className' || key == 'extendConstructor_')
            this[key] = value;
          else
            proto[key] = protoValue && protoValue.__extend__ 
                           ? protoValue.__extend__(value)
                           : value;
        }
        
        return this;
      }
    });


    var CustomExtendProperty = function(extension, func){
      return {
        __extend__: function(extension){
          var Base = Function();
          Base.prototype = this;
          var result = new Base;
          func(result, extension);
          return result;
        }
      }.__extend__(extension);
    };

    var ExtensibleProperty = function(extension){
      return CustomExtendProperty(extension, extend);
    };

    var NestedExtProperty = function(extension){
      return CustomExtendProperty(extension, function(result, extension){
        for (var key in extension)
        {
          var value = result[key];
          result[key] = value && value.__extend__
                       ? value.__extend__(extension[key])
                       : ExtensibleProperty(extension[key]);
        }
      });
    };

    return getNamespace(namespace, BaseClass.create).extend({
      BaseClass: BaseClass,
      create: BaseClass.create,
      isClass: isClass,
      CustomExtendProperty: CustomExtendProperty,
      ExtensibleProperty: ExtensibleProperty,
      NestedExtProperty: NestedExtProperty
    });
  })();

  // ================================
  // EventObject
  //

  var EventObject = (function(){

   /**
    * @namespace basis
    */

    var slice = Array.prototype.slice;
    var warnOnDestroy = function(){ throw 'Object had beed destroed before. Destroy method shouldn\'t be call more than once.' }

    // EventObject seed ID
    var eventObjectId = 1;
    var events = {};
    var destroyEvent;

    function dispatchEvent(eventName){
      var eventFunction = events[eventName];

      if (!eventFunction)
      {
        eventFunction = events[eventName] = 
          /** @cut for more verbose in dev */ Function('eventName', 'slice', 'return function _event_' + eventName + '(){' + (

            function(){
              var handlers = this.handlers_;
              var config;
              var func;

              if (!handlers || !handlers.length)
                return;

              handlers = slice.call(handlers);

              for (var i = handlers.length; i --> 0;)
              {
                config = handlers[i];

                // handler call
                func = config.handler[eventName];
                if (typeof func == 'function')
                  func.apply(config.thisObject, arguments);
              }
            }

          /** @cut for more verbose in dev */ ).toString().replace(/^\(?function[^(]*\(\)[^{]*\{|\}\)?$/g, '') + '}')(eventName, slice);

        /** @cut for more verbose in dev */;;;if (arguments.length > 1){ var text = eventFunction.toString().replace(/\(\)/, '(' + Array.from(arguments, 1).join(', ') + ')'); eventFunction.toString = function(){ return text } };
      }

      return eventFunction;
    };

   /**
    * Base class for event dispacthing. It provides model when it's instance
    * can registrate handlers for events, and call it when event happend. 
    * @class
    */
    var EventObject = Class(null, {

     /**
      * Name of class.
      * @type {string}
      * @readonly
      */
      className: namespace + '.EventObject',

     /**
      * List of event handler sets.
      * @type {Array.<Object>}
      * @private
      */
      handlers_: null,

     /**
      * Fires when object is destroing.
      * NOTE: don't override
      * @param {Basis.EventObject} object Reference for object wich is destroing.
      * @event
      */
      event_destroy: destroyEvent = dispatchEvent('destroy', 'object'),

     /**
      * Related object listeners.
      */
      listen: Class.NestedExtProperty(),

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
          thisObject: thisObject || this
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
        // warn on destroy method call (only in debug)
        ;;;this.destroy = warnOnDestroy;

        if (this.handlers_)
        {
          // fire object destroy event handlers
          destroyEvent.call(this, this);

          // remove all event handler sets
          this.handlers_ = null;
        }
      }
    });

    EventObject.createEvent = dispatchEvent;
    EventObject.event = events;

    return EventObject;
  })();



 
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
  // setZeroTimeout
  //

  // inspired on David Baron's Weblog http://dbaron.org/log/20100309-faster-timeouts
  // Adds setZeroTimeout to the window object, and hide everything
  // else in a closure.
  (function() {

    var eventScheme = typeof addEventListener == 'function' && typeof postMessage == 'function';
    var messageName = "zeroTimeoutMessage";

    var timeoutQueue = [];
    var map = {};
    var idx = 1;

    // Like setTimeout, but only takes a function argument.  There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeout(fn) {
      //;;;if (typeof console != 'undefined') console.info('Set zero timeout', fn);

      var callback = { key: 'z' + (idx++), fn: typeof fn == 'function' ? fn : new Function(fn) };
      map[callback.key] = callback;
      timeoutQueue.push(callback);

      if (eventScheme)
        postMessage(messageName, "*");
      else
        callback.timer = nativeSetTimeout.call(global, handleMessage, 0);

      return callback.key;
    }

    function handleMessage(event){
      if (eventScheme)
      {
        if (event.source != global || event.data != messageName)
          return;

        basis.dom.event.kill(event);
      }

      if (timeoutQueue.length)
      {
        var callback = timeoutQueue.shift();
        delete map[callback.key];
        callback.fn();
      }
    }

    if (eventScheme)
      global.addEventListener("message", handleMessage, true);

    //
    // override setTimeout
    //
    var nativeSetTimeout = setTimeout;
    global.setTimeout = function(fn, timeout){
      if (timeout)
        return nativeSetTimeout.call(global, fn, timeout);
      else
        return setZeroTimeout(fn);
    }

    //
    // override clearTimeout
    //
    var nativeClearTimeout = clearTimeout;
    global.clearTimeout = function(timer){
      if (/z\d+/.test(timer))
      {
        var callback = map[timer];
        if (callback)
        {
          clearTimeout(callback.timer);
          timeoutQueue.remove(callback);
          delete map[timer];
        }
      }
      else
        return nativeClearTimeout.call(global, timer);
    }
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
        //eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
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

  // extend Basis
  getNamespace(namespace).extend({
    namespace: getNamespace,

    platformFeature: {},

    EventObject: EventObject,
    TimeEventManager: TimeEventManager,

    Cleaner: Cleaner,

    require: requireNamespace
  });

  global.basis.locale = {};

}(this);


//
// src/basis/ua.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

!function(basis, global){

  'use strict';

 /**
  * @namespace basis.ua
  */

  var namespace = 'basis.ua';

  //
  // main part
  //

  var answers = {};
  var versions = {};
  var userAgent = global.navigator && global.navigator.userAgent;
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
  testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

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

  namespace = basis.namespace(namespace);
  namespace.toString = function(){ return browserPrettyName };

  return namespace.extend({
    testImage: testImage,

    //name: browserName,
    prettyName: browserPrettyName,
    
    test: testBrowser,  // multiple test
    is: function(name){ return testBrowser(name) },  // single test

    // Cookie interface
    Cookies: cookies
  });

}(basis, this);


//
// src/basis/dom.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.ua');

!function(basis, global){

  'use strict';

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
  *     {basis.dom.is}, {basis.dom.parentOf}, {basis.dom.isInside}
  * - Input interface:
  *     {basis.dom.focus}, {basis.dom.setSelectionRange},
  *     {basis.dom.getSelectionStart}, {basis.dom.getSelectionEnd}
  * - Misc:
  *     {basis.dom.outerHTML}, {basis.dom.textContent}
  *
  * @namespace basis.dom
  */

  var namespace = 'basis.dom';

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
  * @return {string}
  */
  function outerHTML(node){
    return createElement('', node.cloneNode(true)).innerHTML;
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
              attributes[entryName] = m[4] ? coalesce(m[5], m[6], m[7]) : entryName;
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

  // Export names

  return basis.namespace(namespace).extend({
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

}(basis, this);


//
// src/basis/dom/event.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');

!function(basis, global){
 
  'use strict';

 /**
  * @namespace basis.dom.event
  */

  var namespace = 'basis.dom.event';

  // for better pack

  var document = global.document;
  var dom = basis.dom;
  var $null = Function.$null;

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
    F5: 116
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
      addHandler(node, event, Event.kill);
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
      if (document.addEventListener)
        document.addEventListener(eventType, observeGlobalEvents, true);
      else
        // nothing to do, but it will provide observeGlobalEvents calls if other one doesn't
        addHandler(document, eventType, $null);

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
            if (document.removeEventListener)
              document.removeEventListener(eventType, observeGlobalEvents, true);
            else
              removeHandler(document, eventType, $null);
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
      throw new Error('Event.addHandler: can\'t attach event listener to undefined');

    if (typeof handler != 'function')
      throw new Error('Event.addHandler: handler must be a function');

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
        if (noCaptureSheme && event)
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
  function fireEvent(node, eventType){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
    if (handlers && handlers[eventType])
        handlers[eventType].fireEvent();
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
    var loadHandler = new Array();

    function fireHandlers(){
      if (!fired++)
        setTimeout(function(){
          for (var i = 0; i < loadHandler.length; i++)
            loadHandler[i].callback.call(loadHandler[i].thisObject);
        }, 10);
    }

    if (basis.ua.is('ie7-'))
    {
      (function(){
        var secretId = '_' + Date.now();
        document.write('<script id="' + secretId + '" defer src="//:"><\/script>');
        getNode(secretId).onreadystatechange = function(){
          if (this.readyState == 'complete')
          {
            dom.remove(this);
            fireHandlers(); 
          }
        };
      })();
    }
    else
      /* WebKit for */ 
      if (basis.ua.is('safari525-'))
      {
        var _timer = setInterval(function(){
          if (/loaded|complete/.test(document.readyState))
          {
            clearInterval(_timer);
            fireHandlers();
          }
        }, 15);
      }
      else
        // use the real event for browsers that support it (opera & firefox)
        addHandler(document, "DOMContentLoaded", fireHandlers, false);

    // if all else fails fall back on window.onload/document.onload
    addHandler(document, "load", fireHandlers, false);
    addHandler(global, "load", fireHandlers, false);

    // return attach function
    return function(callback, thisObject){
      if (fired)
      {
        ;;;if (typeof console != 'undefined') console.warn('Event.onLoad(): Can\'t attach handler to onload event, because it\'s already fired!');
        return;
      }

      loadHandler.push({
        callback: callback,
        thisObject: thisObject
      });
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
  // export names
  //

  return basis.namespace(namespace, wrap).extend({
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
    onUnload: onUnload
  });

}(basis, this);


//
// src/basis/data.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

(function(){

  'use strict';

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Const:
  *   {basis.data.STATE}, {basis.data.Subscription}
  * - Classes:
  *   {basis.data.DataObject}, {basis.data.KeyObjectMap},
  *   {basis.data.AbstractDataset}, {basis.data.Dataset}
  * - Various dataset classes:
  *   {basis.data.Dataset.Merge}, {basis.data.Dataset.Subtract},
  *   {basis.data.Dataset.MapReduce}, {basis.data.Dataset.Subset},
  *   {basis.data.Dataset.Split}
  *
  * @namespace basis.data
  */
  var namespace = 'basis.data';

  //
  // import names
  //

  var Class = basis.Class;

  var EventObject = basis.EventObject;

  var extend = Object.extend;
  var values = Object.values;
  var $self = Function.$self;
  var $true = Function.$true;
  var $false = Function.$false;
  var createEvent = EventObject.createEvent;
  var event = EventObject.event;

  //
  // Main part
  //

  var NULL_OBJECT = {};
  var EMPTY_ARRAY = [];

  // States for StateObject

  /** @const */ var STATE_UNDEFINED  = 'undefined';
  /** @const */ var STATE_READY      = 'ready';
  /** @const */ var STATE_PROCESSING = 'processing';
  /** @const */ var STATE_ERROR      = 'error';
  /** @const */ var STATE_DEPRECATED = 'deprecated';

  // New events

  //
  // Subscription sheme
  //

  var subscriptionHandlers = {};
  var subscriptionSeed = 1;

  var Subscription = {
    NONE: 0,
    MASK: 0,

   /**
    * Registrate new type of subscription
    * @param {string} name
    * @param {Object} handler
    * @param {function()} action
    */
    regType: function(name, handler, action){
      subscriptionHandlers[subscriptionSeed] = {
        handler: handler,
        action: action,
        context: {
          add: function(thisObject, object){
            if (object)
            {
              var subscriberId = Subscription[name] + '_' + thisObject.eventObjectId;

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
              var subscriberId = Subscription[name] + '_' + thisObject.eventObjectId;
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

      Subscription[name] = subscriptionSeed;
      Subscription.MASK |= subscriptionSeed;

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

  //
  // Registrate base subscription types
  //

  Subscription.regType(
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

  Subscription.regType(
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

  Subscription.regType(
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
    state: STATE_READY,

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
    * Subscriber type indicates what sort of influence has currency object on
    * related objects (delegate, source, dataSource etc).
    * @type {basis.data.Subscription|number}
    */
    subscribeTo: Subscription.DELEGATE + Subscription.TARGET,

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
    * Fires when state or state.data was changed.
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
    event_targetChanged: createEvent('targetChanged', 'object', 'oldTarget') && function(object, oldTarget){
      var targetHandler = this.listen.target;

      if (targetHandler)
      {
        if (oldTarget)
          oldTarget.removeHandler(targetHandler, this);

        if (this.target)
          this.target.addHandler(targetHandler, this);
      }

      event.targetChanged.call(this, object, oldTarget);
    },

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
        applySubscription(this, this.subscribeTo, Subscription.MASK);
    },

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
          ;;;if (newDelegate && typeof console != 'undefined') console.warn('(debug) New delegate has already connected to object. Delegate assign has been ignored.', this, newDelegate);

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

        if (oldDelegate)
          oldDelegate.removeHandler(this.listen.delegate, this);

        if (newDelegate)
        {
          // assing new delegate
          this.delegate = newDelegate;
          this.root = newDelegate.root;
          this.data = newDelegate.data;
          this.state = newDelegate.state;
          this.target = newDelegate.target;

          newDelegate.addHandler(this.listen.delegate, this);

          // calculate delta as difference between current data and delegate info
          for (var key in newDelegate.data)
            if (key in oldData === false)
              delta[key] = undefined;

          for (var key in oldData)
            if (oldData[key] !== newDelegate.data[key])
              delta[key] = oldData[key];
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

        // fire event if delegate changed
        this.event_delegateChanged(this, oldDelegate);

        // fire event if target changed
        if (this.root !== oldRoot)
          this.event_rootChanged(this, oldRoot);

        // fire event if target changed
        if (this.target !== oldTarget)
          this.event_targetChanged(this, oldTarget);

        // update & stateChanged can be fired only if new delegate was assigned;
        // otherwise (delegate drop) do nothing -> performance benefits
        if (newDelegate)
        {
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

      // set new state for object
      if (this.state != String(state) || this.state.data != data)
      {
        var oldState = this.state;

        this.state = Object(String(state));
        this.state.data = data;

        this.event_stateChanged(this, oldState);

        return true; // state was changed
      }

      return false; // state wasn't changed
    },

   /**
    * Default action on deprecate, set object state to STATE_DEPRECATED,
    * but only if object isn't in STATE_PROCESSING state.
    */
    deprecate: function(){
      if (this.state != STATE_PROCESSING)
        this.setState(STATE_DEPRECATED);
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
    * @param {boolean} isActive New value for {basis.data.DataObject#isActiveSubscriber} property.
    * @return {boolean} Returns true if {basis.data.DataObject#isActiveSubscriber} was changed.
    */
    setActive: function(isActive){
      isActive = !!isActive;

      if (this.active != isActive)
      {
        this.active = isActive;
        this.event_activeChanged(this);

        applySubscription(this, this.subscribeTo, Subscription.MASK * isActive);

        return true;
      }

      return false;
    },

   /**
    * Set new value for subscriptionType property.
    * @param {number} subscriptionType New value for {basis.data.DataObject#subscriptionType} property.
    * @return {boolean} Returns true if {basis.data.DataObject#subscribeTo} was changed.
    */
    setSubscription: function(subscriptionType){
      var curSubscriptionType = this.subscribeTo;
      var newSubscriptionType = subscriptionType & Subscription.MASK;
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
      this.state = STATE_UNDEFINED;
      this.root = null;
      this.target = null;
    }
  });

  //
  // KeyObjectMap
  //

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
      var isDataObject = key instanceof DataObject;
      var itemId = isDataObject ? key.eventObjectId : key;
      var item = this.map_[itemId];

      if (!item && object)
      {
        item = this.map_[itemId] = this.create(key, object);
        item.addHandler({
          destroy: function(){
            delete this.map_[itemId];
          }
        }, this);
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
    state: STATE_UNDEFINED,

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
    * @private
    */
    memberMap_: null,

   /**
    * Cache array of members, for getItems method.
    * @private
    */
    cache_: null,

   /**
    * Fires when items changed.
    * @param {basis.data.AbstractDataset} dataset
    * @param {object} delta Delta of changes. Must have property `inserted`
    * or `deleted`, or both of them. `inserted` property is array of new items
    * and `deleted` property is array of removed items.
    * @event
    */
    event_datasetChanged: createEvent('datasetChanged', 'dataset', 'delta') && function(dataset, delta){
      // before event
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
      event.datasetChanged.call(this, dataset, delta);
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
          if (this.memberMap_[object.eventObjectId])
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
        this.set(items);
        this.items = null;
      }
    },

    add: function(data){
      var delta;
      var memberMap = this.memberMap_;
      var inserted = [];

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (!memberMap[objectId])
          {
            memberMap[objectId] = object;
            object.addHandler(this.listen.item, this);

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

      for (var i = 0; i < data.length; i++)
      {
        var object = data[i];
        if (object instanceof DataObject)
        {
          var objectId = object.eventObjectId;
          if (memberMap[objectId])
          {
            object.removeHandler(this.listen.item, this);
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
            object.addHandler(this.listen.item, this);

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

          object.removeHandler(this.listen.item, this);
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

      if (deleted.length)
      {
        for (var i = deleted.length; i --> 0;)
          deleted[i].removeHandler(this.listen.item, this);

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
      values(eventCacheCopy).forEach(flushCache);
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
      ;;;if (typeof console != 'undefined') console.warn('(debug) Urgent flush dataset changes');
      setStateCount = 1;
      setAccumulateState(false);
    }

    return function setAccumulateState(state){
      if (state)
      {
        if (setStateCount == 0)
        {
          proto.event_datasetChanged = storeDatasetDelta;
          urgentTimer = setTimeout(urgentFlush, 0);
        }
        setStateCount++;
      }
      else
      {
        setStateCount -= setStateCount > 0;
        if (setStateCount == 0)
        {
          clearTimeout(urgentTimer);
          proto.event_datasetChanged = realEvent;
          flushAllDataset();
        }
      }
    }
  })();


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
  * @namespace basis.data.Dataset
  */

 /**
  * @class
  */
  var Merge = Class(AbstractDataset, {
    className: namespace + '.Dataset.Merge',

   /**
    * @inheritDoc
    */
    subscribeTo: Subscription.SOURCE,

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
    className: namespace + '.Dataset.Subtract',

   /**
    * @type {basis.data.AbstractDataset}
    */ 
    minuend: null,

   /**
    * @type {basis.data.AbstractDataset}
    */
    subtrahend: null,

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
    * Set new operands.
    * @param {basis.data.AbstractDataset} minuend
    * @param {basis.data.AbstractDataset} subtrahend
    * @return {Object} Delta if changes happend
    */
    setOperands: function(minuend, subtrahend){
      var delta;

      if (minuend instanceof AbstractDataset == false)
        minuend = null;

      if (subtrahend instanceof AbstractDataset == false)
        subtrahend = null;

      var oldMinuend = this.minuend;
      var oldSubtrahend = this.subtrahend;

      if (oldMinuend !== minuend)
      {
        if (oldMinuend)
          oldMinuend.removeHandler(this.listen.minuend, this);

        if (this.minuend = minuend)
          minuend.addHandler(this.listen.minuend, this)
      }

      if (oldSubtrahend !== subtrahend)
      {
        if (oldSubtrahend)
          oldSubtrahend.removeHandler(this.listen.subtrahend, this);

        if (this.subtrahend = subtrahend)
          subtrahend.addHandler(this.listen.subtrahend, this);
      }

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

    clear: function(){
      this.setOperands();
    }
  });


  //
  // MapReduce
  //

  var MAPREDUCEDATASET_SOURCEOBJECT_HANDLER = {
    update: function(object){
      var newMember = this.map ? this.map(object) : object; // fetch new member ref
      
      if (newMember instanceof DataObject == false || this.reduce(newMember))
        newMember = null;

      var sourceMap = this.sourceMap_[object.eventObjectId];
      var curMember = sourceMap.member;

      // if member ref is changed
      if (curMember != newMember)
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
            this.removeMemberRef(curMember, object);

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
            this.addMemberRef(newMember, object);

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
    }
  };

  var MAPREDUCEDATASET_SOURCE_HANDLER = {
    datasetChanged: function(dataset, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var inserted = [];
      var deleted = [];
      var sourceObject;
      var sourceObjectId;
      var member;

      Dataset.setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          member = this.map ? this.map(sourceObject) : sourceObject;

          if (member instanceof DataObject == false || this.reduce(member))
            member = null;

          sourceObject.addHandler(this.listen.sourceObject, this);
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

          sourceObject.removeHandler(this.listen.sourceObject, this);
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
    },
    destroy: function(){
      this.setSource();
    }
  };

 /**
  * @class
  */
  var MapReduce = Class(AbstractDataset, {
    className: namespace + '.Dataset.MapReduce',

   /**
    * Data source.
    * @type {basis.data.AbstractDataset}
    */
    source: null,

   /**
    * Fires when source property changed.
    * @param {basis.data.AbstractDataset} dataset Event initiator.
    * @param {basis.data.AbstractDataset} oldSource Previous value for source property.
    * @event
    */
    event_sourceChanged: createEvent('sourceChanged', 'dataset', 'oldSource'),

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
    rule: $false,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.DataObject)}
    * @readonly
    */
    addMemberRef: null,

   /**
    * NOTE: Can't be changed after init.
    * @type {function(basis.data.DataObject)}
    * @readonly
    */
    removeMemberRef: null,

   /**
    * Map of source objects.
    * @type {object}
    * @private
    */
    sourceMap_: null,

   /**
    * @inheritDoc
    */
    listen: {
      sourceObject: MAPREDUCEDATASET_SOURCEOBJECT_HANDLER,
      source: MAPREDUCEDATASET_SOURCE_HANDLER
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      ;;;if (this.sources) throw 'Dataset.MapReduce instances no more support for sources property, use source property instead.';
      ;;;if (this.dataset) throw 'Dataset.MapReduce instances no more support for dataset property, use source property instead.';

      AbstractDataset.prototype.init.call(this, config);

      this.sourceMap_ = {};

      var source = this.source;
      if (source)
      {
        this.source = null;
        this.setSource(source);
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
    * Set new transform function and apply new function to source objects.
    * @param {function(basis.data.DataObject):basis.data.DataObject} transform
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
    * Set new source dataset.
    * @param {basis.data.AbstractDataset} dataset
    */
    setSource: function(source){
      if (source instanceof AbstractDataset == false)
        source = null;

      if (this.source !== source)
      {
        var oldSource = this.source;

        if (oldSource)
        {
          oldSource.removeHandler(this.listen.source, this);
          this.listen.source.datasetChanged.call(this, oldSource, {
            deleted: oldSource.getItems()
          });
        }

        if (this.source = source)
        {
          source.addHandler(this.listen.source, this);
          this.listen.source.datasetChanged.call(this, source, {
            inserted: source.getItems()
          });
        }

        this.event_sourceChanged(this, oldSource);
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
    },

   /**
    * Drop dataset. All members are removing as side effect.
    */
    clear: function(){
      this.setSource();
    },

    destroy: function(){
      // inherit
      AbstractDataset.prototype.destroy.call(this);

      this.sourceMap_ = null;
    }
  });


  //
  // Subset
  //

 /**
  * @class
  */
  var Subset = Class(MapReduce, {
    className: namespace + '.Dataset.Subset',

   /**
    * @inheritDoc
    */
    reduce: function(object){
      return !this.rule(object);
    },

   /**
    * @inheritDoc
    */
    rule: $true
  });


  //
  // Split
  //

 /**
  * @class
  */
  var Split = Class(MapReduce, {
    className: namespace + '.Dataset.Split',

   /**
    * @inheritDoc
    */
    map: function(object){
      return this.keyMap.resolve(object);
    },

   /**
    * @type {function(data):key}
    */
    rule: $true,

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
    addMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { inserted: [sourceObject] });
    },

   /**
    * @inheritDoc
    */
    removeMemberRef: function(group, sourceObject){
      group.event_datasetChanged(group, { deleted: [sourceObject] });
    },

   /**
    * @config {function} filter Group function.
    * @config {class} groupClass Class for group instances. Should be instance of AbstractDataset.
    * @config {boolean} destroyEmpty Destroy empty groups automaticaly or not.
    * @constructor
    */ 
    init: function(config){
      //this.groupMap_ = {};

      if (!this.keyMap || this.keyMap instanceof KeyObjectMap == false)
        this.keyMap = new KeyObjectMap(Object.extend({
          keyGetter: this.rule,
          itemClass: this.subsetClass
        }, this.keyMap));

      // inherit
      MapReduce.prototype.init.call(this, config);
    },

    getSubset: function(data, autocreate){
      return this.keyMap.get(data, autocreate);
    },

    destroy: function(){
      // inherit
      MapReduce.prototype.destroy.call(this);

      // destroy keyMap
      this.keyMap.destroy();
      this.keyMap = null;
    }
  });

  //

  function wrapper(data){
    if (Array.isArray(data))
      return data.map(wrapper);
    else
      return { data: data };
  }

  //
  // export names
  //

  Object.extend(Dataset, {
    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // transform dataset
    MapReduce: MapReduce,
    Subset: Subset,
    Split: Split
  });

  //
  // export names
  //

  basis.namespace(namespace, wrapper).extend({
   /**
    * @enum {string}
    */
    STATE: {
      UNDEFINED: STATE_UNDEFINED,
      READY: STATE_READY,
      PROCESSING: STATE_PROCESSING,
      ERROR: STATE_ERROR,
      DEPRECATED: STATE_DEPRECATED
    },

    Subscription: Subscription,

    // classes
    Object: DataObject,
    DataObject: DataObject,

    KeyObjectMap: KeyObjectMap,

    AbstractDataset: AbstractDataset,
    Dataset: Dataset,

    // deprecate
    AggregateDataset: Merge,
    Collection: Subset,
    Grouping: Split
  });

  basis.namespace('basis.data.dataset').extend({
    // operable datasets
    Merge: Merge,
    Subtract: Subtract,

    // transform dataset
    MapReduce: MapReduce,
    Subset: Subset,
    Split: Split
  });

})();

//
// src/basis/html.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');
basis.require('basis.dom.event');

!function(basis, global){

 /**
  * @namespace basis.html
  */

  var namespace = 'basis.html';

  // import names

  var document = global.document;
  var dom = basis.dom;
  var Class = basis.Class;

  //
  // Main part
  //

  var tmplEventListeners = {};
  var tmplNodeMap = { seed: 1 };

  var tmplPartFinderRx = /<([a-z0-9\_]+)(?:\{([a-z0-9\_\|]+)\})?([^>]*?)(\/?)>|<\/([a-z0-9\_]+)>|<!--(\s*\{([a-z0-9\_\|]+)\}\s*|.*?)-->/i;
  var tmplAttrRx = /(?:([a-z0-9\_\-]+):)?([a-z0-9\_\-]+)(?:\{([a-z0-9\_\|]+)\})?(?:="((?:\\.|[^"])*?)"|='((?:\\.|[^'])*?)')?\s*/gi;
  var domFragment = dom.createFragment();

  // Test for browser (IE) normalize text nodes during cloning
  var CLONE_NORMALIZE_TEXT_BUG = (function(){
    return dom.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
  })();

  
  var createFragment = dom.createFragment;
  var createText = dom.createText;
  var createComment = function(value){
    return document.createComment(value);
  };

  //
  // PARSE TEXT
  //
  function parseText(context, str, nodePath, pos){
    var parts = str.split(/\{([a-z0-9\_]+(?:\|[^}]*)?)\}/i);
    var result = createFragment();
    var node;
    for (var i = 0; i < parts.length; i++)
    {
      if (i % 2)
      {
        var p = parts[i].split(/\|/);
        context.getters[p[0]] = nodePath + 'childNodes[' + pos + ']';
        node = p.length > 1 ? p[1] : p[0];
      }
      else
        node = parts[i].length ? parts[i] : null;

      if (node != null)
      {
        // Some browsers (Internet Explorer) can normalize text nodes during cloning, that why 
        // we need to insert comment nodes between text nodes to prevent text node merge
        if (CLONE_NORMALIZE_TEXT_BUG)
        {
          if (result.lastChild)
            result.appendChild(createComment(''));
          pos++;
        }
        result.appendChild(createText(node));
        pos++;
      }
    }
    return result;
  }

  //
  // PARSE ATTRIBUTES
  //
  function createEventHandler(name){
    return function(event){
      if (event && event.type == 'click' && event.which == 3)
        return;

      var cursor = basis.dom.event.sender(event);
      var attr;
      var refId;

      // search for nearest node with event-{eventName} attribute
      do {
        if (attr = (cursor.getAttributeNode && cursor.getAttributeNode(name)))
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
              node.templateAction(actionName, basis.dom.event(event));

            break;
          }
        }
      } while (cursor = cursor.parentNode);
    }
  }

  function parseAttributes(context, str, nodePath){
    str = str.trim();

    if (!str)
      return '';

    var result = '';
    var m;

    while (m = tmplAttrRx.exec(str))
    {
      //    0      1   2     3      4       5
      // m: match, ns, name, alias, value1, value2

      var name = m[2];
      var value = m[4] || m[5] || name;

      // store reference for attribute
      if (m[3])
        context.getters[m[3]] = nodePath + '.getAttributeNode("' + name + '")';

      // if attribute is event binding, add global event handler
      var eventMatch = name.match(/^event-([a-z]+)/i);
      if (eventMatch)
      {
        var eventName = eventMatch[1];
        if (!tmplEventListeners[eventName])
        {
          tmplEventListeners[eventName] = true;

          for (var i = 0, names = basis.dom.event.browserEvents(eventName), browserEventName; browserEventName = names[i++];)
            basis.dom.event.addGlobalHandler(browserEventName, createEventHandler(name));
        }

        if (!window.__basis_emitEvent)
        {
          window.__basis_emitEvent = function(event, actionList){
            var event = basis.dom.event(event);
            var cursor = this;
            var refId;
            do {
              if (refId = cursor.basisObjectId)
              {
                // if found call templateAction method
                var node = tmplNodeMap[refId];
                if (node && node.templateAction)
                {
                  var actions = actionList.qw();
                  for (var i = 0, actionName; actionName = actions[i++];)
                    node.templateAction(actionName, basis.dom.event(event));

                  break;
                }
              }
            } while (cursor = cursor.parentNode);
          }
        }
          
        //result += '[on' + eventName + '="alert(\'!\');__basis_emitEvent.call(this, event || window.event, ' + value.quote("'") + ')"]';
        //continue;
      }

      result += name == 'class'
                  ? value.trim().replace(/^(.)|\s+/g, '.$1')
                  : '[' + name + (value ? '=' + value.quote('"') : '') + ']';
    }

    return result;
  }

  //
  // PARSE HTML
  //
  function parseHtml(context, path){
    if (!context.stack)
      context.stack = [];

    if (!context.source)
      context.source = context.str;

    if (!path)
      path = '.';

    var result = createFragment();
    var preText;
    var pos = 0;
    var m;
    var stack = context.stack;

    while (m = tmplPartFinderRx.exec(context.str))
    {
      //    0      1        2      3           4            5         6        7
      // m: match, tagName, alias, attributes, isSingleton, closeTag, comment, commentAlias

      preText = RegExp.leftContext;
      context.str = context.str.substr(preText.length + m[0].length);

      // if something before -> parse text & append result
      if (preText.length)
      {
        result.appendChild(parseText(context, preText, path, pos));
        pos = result.childNodes.length;
      }

      // end tag
      if (m[5])
      {
        // if end tag match to last stack tag -> remove last tag from tag and return
        if (m[5] == stack[stack.length - 1])
        {
          stack.pop();
          return result;
        }
        else
        {
          ;;;if (typeof console != undefined) console.log('Wrong end tag </' + m[5] + '> in Html.Template (ignored)\n\n' + context.source.replace(new RegExp('(</' + m[5] + '>)(' + context.str + ')$'), '\n ==[here]=>$1<== \n$2'));
          throw "Wrong end tag";
        }
      }

      // comment
      if (m[6])
      {
        if (m[7])
          context.getters[m[7]] = path + 'childNodes[' + pos + ']';

        result.appendChild(createComment(m[6]));
      }
      // open tag
      else
      {
        var descr = m[0];
        var tagName = m[1];
        var name = m[2];
        var attributes = m[3];
        var singleton = !!m[4];
        var nodePath = path + 'childNodes[' + pos + ']';
        var element = dom.createElement(tagName + parseAttributes(context, attributes, nodePath));

        if (name)
          context.getters[name] = nodePath;

        if (!singleton)
        {
          stack.push(tagName);
          element.appendChild(parseHtml(context, nodePath + '.'));
        }

        result.appendChild(element);
      }

      pos++;
    }
    
    // no tag found, but there can be trailing text -> parse text
    if (context.str.length)
      result.appendChild(parseText(context, context.str, path, pos));

    if (stack.length)
    {
      ;;;if (typeof console != undefined) console.log('No end tag for ' + stack.reverse() + ' in Html.Template:\n\n' + context.source);
      throw "No end tag for " + stack.reverse();
    }

    return result;
  }


 /**
  * Parsing template
  * @func
  */
  function parseTemplate(source){
    if (this.proto)
      return;

    var str = this.source;

    if (typeof str == 'function')
      this.source = str = str();

    var source = str.trim();
    var context = {
      str: source,
      getters: {
        element: '.childNodes[0]'
      }
    };

    // parse html
    var proto = parseHtml(context);

    // build pathes for references
    var body = Object.iterate(context.getters, function(name, getter){
      var names = name.split(/\|/).map(String.format, 'obj_.{0}');

      // optimize path (1)
      var path = getter.split(/(\.?childNodes\[(\d+)\])/);
      var cursor = proto;
      for (var i = 0; i < path.length; i += 3)
      {
        var pos = path[i + 2];
        if (!pos)
          break;

        path[i + 2] = '';
        cursor = cursor.childNodes[pos];

        if (!cursor.previousSibling)
          path[i + 1] = '.firstChild';
        else
          if (!cursor.nextSibling)
            path[i + 1] = '.lastChild';
      }

      // return body parts
      return {
        name:  names[0],
        alias: names.join('='),
        path:  'dom_' + path.join('')
      }
    }).sortAsObject('path');

    // optimize pathes (2)
    for (var i = 0; i < body.length; i++)
    {
      var pathRx = new RegExp('^' + body[i].path.forRegExp());
      for (var j = i + 1, nextBodyPart; nextBodyPart = body[j++];)
        nextBodyPart.path = nextBodyPart.path.replace(pathRx, body[i].name);
    }

    //
    // build createInstance function
    //
    this.createInstance = new Function('proto_', 'map_', 'var obj_, dom_; return ' + 
      // mark variable names with dangling _ to avoid renaming by compiler, because
      // this names using by generated code, and must be unchanged

      // WARN: don't use global scope variables, resulting function has isolated scope

      function(object, node){
        obj_ = object || {};
        dom_ = proto_.cloneNode(true);

        // specific code start
        _code_(); // <-- will be replaced for specific code
        // specific code end

        if (node && obj_.element)
        {
          var id = obj_.element.basisObjectId = map_.seed++;
          map_[id] = node;
        }

        return obj_;
      }

    .toString().replace('_code_()', body.map(String.format,'{alias}={path};\n').join('')))(proto, tmplNodeMap);

    //
    // build clearInstance function
    //
    this.clearInstance = new Function('map_', 'var obj_; return ' +

      function(object, node){
        obj_ = object;
        var id = obj_.element && obj_.element.basisObjectId;
        if (id)
          delete map_[id];

        // specific code start
        _code_(); // <-- will be replaced for specific code
        // specific code end

      }

    .toString().replace('_code_()', body.map(String.format,'{alias}=null;\n').join('')))(tmplNodeMap);
  };


 /**
  * Creates DOM structure template from marked HTML. Use {basis.Html.Template#createInstance}
  * method to apply template to object. It creates clone of DOM structure and adds
  * links into object to pointed parts of structure.
  *
  * To remove links to DOM structure from object use {basis.Html.Template#clearInstance}
  * method.
  * @example
  *   // create a template
  *   var template = new basis.Template(
  *     '<li{element} class="listitem">' +
  *       '<a href{hrefAttr}="#">{titleText}</a>' + 
  *       '<span class="description">{descriptionText}</span>' +
  *     '</li>'
  *   );
  *   
  *   // create 10 DOM elements using template
  *   for (var i = 0; i < 10; i++)
  *   {
  *     var node = template.createInstance();
  *     basis.CSS.cssClass(node.element).add('item' + i);
  *     node.hrefAttr.nodeValue = '/foo/bar.html';
  *     node.titleText.nodeValue = 'some title';
  *     node.descriptionText.nodeValue = 'description text';
  *   }
  *   
  *   // create and attach DOM structure to existing object
  *   var dataObject = new basis.Data.DataObject({
  *     data: { title: 'Some data', value: 123 },
  *     handlers: {
  *       update: function(object, delta){
  *         this.titleText.nodeValue = this.info.title;
  *         // other DOM manipulations
  *       }
  *     }
  *   });
  *   // apply template to object
  *   template.createInstance(dataObject);
  *   // trigger update event that fill template with data
  *   dataObject.update(null, true);
  *   ...
  *   basis.dom.insert(someElement, dataObject.element);
  *   ...
  *   // destroy object
  *   template.clearInstance(dataObject);
  *   dataObject.destroy();
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
      this.source = templateSource;
    },

   /**
    * Create DOM structure and return object with references for it's nodes.
    * @param {Object=} object Storage for DOM references.
    * @param {Object=} node Object which templateAction method will be called on events.
    * @return {Object}
    */
    createInstance: function(object, node){
      parseTemplate.call(this);
      return this.createInstance(object, node);
    },
    clearInstance: function(object, node){
      parseTemplate.call(this);
    }
  });

  function escape(html){
    return dom.createElement('DIV', dom.createText(html)).innerHTML;
  }

  var unescapeElement = document.createElement('DIV');
  function unescape(escapedHtml){
    unescapeElement.innerHTML = escapedHtml;
    return unescapeElement.firstChild.nodeValue;
  }

  function string2Html(text){
    unescapeElement.innerHTML = text;
    return dom.createFragment.apply(null, Array.from(unescapeElement.childNodes));
  }

  //
  // export names
  //

  return basis.namespace(namespace).extend({
    Template: Template,
    escape: escape,
    unescape: unescape,
    string2Html: string2Html
  });

}(basis, this);


//
// src/basis/dom/wrapper.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');
basis.require('basis.data');
basis.require('basis.html');

!function(basis){

  'use strict';

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Non-visual DOM classes:
  *   {basis.dom.wrapper.AbstractNode}, {basis.dom.wrapper.InteractiveNode},
  *   {basis.dom.wrapper.Node}, {basis.dom.wrapper.PartitionNode},
  *   {basis.dom.wrapper.GroupingNode}
  * - Misc:
  *   {basis.dom.wrapper.Selection}
  *
  * @namespace basis.dom.wrapper
  */

  var namespace = 'basis.dom.wrapper';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;
  var nsData = basis.data;

  var EventObject = basis.EventObject;
  var Subscription = nsData.Subscription;
  var DataObject = nsData.DataObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;

  var STATE = nsData.STATE;
  var AXIS_DESCENDANT = DOM.AXIS_DESCENDANT;
  var AXIS_DESCENDANT_OR_SELF = DOM.AXIS_DESCENDANT_OR_SELF;

  var getter = Function.getter;
  var extend = Object.extend;
  var complete = Object.complete;
  var axis = DOM.axis;
  var createEvent = basis.EventObject.createEvent;
  var event = basis.EventObject.event;

  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
  /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
  /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
  /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';
  /** @const */ var EXCEPTION_DATASOURCE_CONFLICT = namespace + ': Operation is not allowed because node is under dataSource control';

  function sortingSearch(node){
    return node.sortingValue || 0; // it's important return zero when sortingValue is undefined,
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
      obj.localSortingDesc
        ? sortDesc
        : sortAsc
    );
  }

  //
  // registrate new subscription type
  //

  Subscription.regType(
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
  //  NODE
  //

  var NULL_SATELLITE_CONFIG = Class.ExtensibleProperty();
  var SATELLITE_DESTROY_HANDLER = {
    ownerChanged: function(sender, oldOwner){
      if (sender.owner !== this)
        ;// ???
    },
    destroy: function(object){
      DOM.replace(object.element, this);
    }
  };

  var SATELLITE_UPDATE = function(){
    // this -> {
    //   key: satelliteName,
    //   owner: owner,
    //   config: satelliteConfig
    // }
    var key = this.key;
    var config = this.config;
    var owner = this.owner;

    var exists = typeof config.existsIf != 'function' || config.existsIf(owner);
    var satellite = owner.satellite[key];

    if (exists)
    {
      var setDelegate = 'delegate' in config;
      var setDataSource = 'dataSource' in config;

      var delegate = typeof config.delegate == 'function' ? config.delegate(owner) : null;
      var dataSource = typeof config.dataSource == 'function' ? config.dataSource(owner) : null;

      if (satellite)
      {
        if (setDelegate)
          satellite.setDelegate(delegate);

        if (setDataSource)
          satellite.setDataSource(dataSource);
      }
      else
      {
        var replaceElement = owner.tmpl[config.replace || key];
        var instanceConfig = {
          owner: owner
        };

        if (setDelegate)
          instanceConfig.delegate = delegate;

        if (setDataSource)
          instanceConfig.dataSource = dataSource;

        if (config.config)
          Object.complete(instanceConfig, typeof config.config == 'function' ? config.config(owner) : config.config);

        satellite = new config.instanceOf(instanceConfig);
        //if (satellite.listen.owner)
        //  owner.addHandler(satellite.listen.owner, satellite);

        owner.satellite[key] = satellite;

        if (replaceElement && satellite instanceof basis.ui.Node && satellite.element)
        {
          DOM.replace(replaceElement, satellite.element);
          satellite.addHandler(SATELLITE_DESTROY_HANDLER, replaceElement);
        }
      }
    }
    else
    {
      if (satellite)
      {
        //if (satellite.listen.owner)
        //  owner.removeHandler(satellite.listen.owner, satellite);

        satellite.destroy();
        satellite.owner = null;
        delete owner.satellite[key];
      }
    }
  };

  var SATELLITE_OWNER_HOOK = Class.CustomExtendProperty(
    {
      update: true
    },
    function(result, extend){
      for (var key in extend)
        result[key] = extend[key] ? SATELLITE_UPDATE : null;    
    }
  );

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
        {
          this.match();
          this.match(parentNode.matchFunction);
        }

        // re-insert to change position, group, sortingValue etc.
        parentNode.insertBefore(this, this.nextSibling);
      }
    },

    // new events

   /**
    * This is a general event for notification of childs changes to the document.
    * It may be dispatched after a single modification to the childNodes or after
    * multiple changes have occurred. 
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {object} delta Delta of changes.
    * @event
    */
    event_childNodesModified: createEvent('childNodesModified', 'node', 'delta'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.Data.AbstractDataset} oldDataSource
    */
    event_dataSourceChanged: createEvent('dataSourceChanged', 'node', 'oldDataSource'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.GroupingNode} oldGroupingNode
    */
    event_localGroupingChanged: createEvent('localGroupingChanged', 'node', 'oldGroupingNode'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    */
    event_localSortingChanged: createEvent('localSortingChanged', 'node'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    event_ownerChanged: createEvent('ownerChanged', 'node', 'oldOwner'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    event_satellitesChanged: createEvent('satellitesChanged', 'node', 'delta'),

    //
    // properties
    //

   /**
    * @inheritDoc
    */
    subscribeTo: DataObject.prototype.subscribeTo + Subscription.DATASOURCE,

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
    * Flag determines object behaviour when parentNode changing:
    * - true: set same delegate as parentNode has on insert, or unlink delegate on remove
    * - false: nothing to do
    * @type {boolean}
    */
    autoDelegateParent: false,

   /**
    * @type {string}
    * @readonly
    */
    nodeType: 'DOMWrapperNode',

   /**
    * @type {boolean}
    * @readonly
    */
    canHaveChildren: false,

   /**
    * A list that contains all children of this node. If there are no children,
    * this is a list containing no nodes.
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    childNodes: null,

   /**
    * Object that's manage childNodes updates.
    * @type {basis.Data.AbstractDataset}
    */
    dataSource: null,

   /**
    * Map dataSource members to child nodes.
    * @type {Object}
    * @private
    */
    colMap_: null,

   /**
    * @type {Boolean}
    */
    destroyDataSourceMember: true,

   /**
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    document: null,

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
    * @type {Function}
    */
    localSorting: null,

   /**
    * Sorting direction
    * @type {boolean}
    */
    localSortingDesc: false,

   /**
    * GroupingNode config
    * @see ./demo/common/grouping.html
    * @see ./demo/common/grouping_of_grouping.html
    * @type {basis.dom.wrapper.GroupingNode}
    */
    localGrouping: null,

   /**
    * Class for grouping control. Class should be inherited from {basis.dom.wrapper.GroupingNode}
    * @type {Class}
    */
    localGroupingClass: null,

   /**
    * Reference to group node in localGrouping
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
    *   - localGrouping
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
      var localGrouping = this.localGrouping;

      if (dataSource)
        this.dataSource = null; // NOTE: reset dataSource before inherit -> prevent double subscription activation
                                // when this.active == true and dataSource is assigned

      // inherit
      DataObject.prototype.init.call(this, config);

      if (localGrouping)
      {
        this.localGrouping = null;
        this.setLocalGrouping(localGrouping);
      }

      // init properties
      if (this.canHaveChildren)
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

      if (this.satelliteConfig !== NULL_SATELLITE_CONFIG)
      {
        //this.addHandler(SATELLITE_HANDLER);
        for (var key in this.satelliteConfig)
        {
          var config = this.satelliteConfig[key];

          if (Class.isClass(config))
            config = { instanceOf: config };

          if (typeof config == 'object')
          {
            var context = {
              key: key,
              owner: this,
              config: config
            };

            var hook = config.hook
              ? SATELLITE_OWNER_HOOK.__extend__(config.hook)
              : SATELLITE_OWNER_HOOK;

            for (var key in hook)
              if (hook[key] === SATELLITE_UPDATE)
              {
                this.addHandler(hook, context);
                break;
              }

            SATELLITE_UPDATE.call(context)
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
    hasChildNodes: function(){
      return this.childNodes.length > 0;
    },

   /**
    * Returns whether this node has any children. 
    * @return {boolean} Returns true if this node has any children, false otherwise.
    */
    setChildNodes: function(){
    },

   /**
    * @param {Object|function()|string} grouping
    * @param {boolean} alive Keep localGrouping alive after unlink
    */
    setLocalGrouping: function(grouping, alive){
    },

   /**
    * @param {function()|string} sorting
    * @param {boolean} desc
    */
    setLocalSorting: function(sorting, desc){
    },

   /**
    * @param {basis.Data.AbstractDataset} dataSource
    */
    setDataSource: function(dataSource){
    },

   /**
    *
    */
    setOwner: function(owner){
      if (!owner || owner instanceof AbstractNode == false)
        owner = null;

      if (this.owner !== owner)
      {
        var oldOwner = this.owner;

        if (oldOwner)
          oldOwner.removeHandler(this.listen.owner, this);

        if (this.owner = owner)
          owner.addHandler(this.listen.owner, this);

        this.event_ownerChanged(this, oldOwner);
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // This order of actions is better for perfomance: 
      // inherit destroy -> clear childNodes -> remove from parent
      // DON'T CHANGE WITH NO ANALIZE AND TESTS

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
      if (this.localGrouping)
      {
        this.localGrouping.destroy();
        this.localGrouping = null;
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
          satellite.destroy();
          satellite.owner = null;
        }
        this.satellite = null;
      }

      // remove pointers
      this.document = null;
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
      var pos = refNode ? nodes.indexOf(refNode) : nodes.length;

      if (pos == -1)
        pos = nodes.length;

      nodes.splice(pos, 0, newNode);
      this.first = nodes[0] || null;
      this.last = nodes[nodes.length - 1] || null;
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
    datasetChanged: function(dataset, delta){

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
          deleted.push.apply(deleted, this.childNodes);

          // optimization: if all old nodes deleted -> clear childNodes
          var tmp = this.dataSource;
          this.dataSource = null;
          this.clear(true);   // keep alive, event fires
          this.dataSource = tmp;
          this.colMap_ = {};
        }
        else
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
          {
            var delegateId = item.eventObjectId;
            var oldChild = this.colMap_[delegateId];

            delete this.colMap_[delegateId];
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
          this.colMap_[item.eventObjectId] = newChild;
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
    destroy: function(object){
      //this.clear();
      if (this.dataSource === object)
        this.setDataSource();
    }
  };

  function fastChildNodesOrder(node, order){
    node.childNodes = order;
    node.firstChild = order[0] || null;
    node.lastChild = order[order.length - 1] || null;

    //DOM.insert(this, order);
    for (var i = order.length - 1; i >= 0; i--)
    {
      order[i].nextSibling = order[i + 1] || null;
      order[i].previousSibling = order[i - 1] || null;
      node.insertBefore(order[i], order[i].nextSibling);
    }
  }

  function fastChildNodesGroupOrder(node, order){
    for (var i = 0, child; child = order[i]; i++)
      child.groupNode.nodes.push(child);

    order.length = 0;
    for (var group = node.localGrouping.nullGroup; group; group = group.nextSibling)
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
    var factory = node.childFactory || (node.document && node.document.childFactory);
    var child;

    config = Object.extend({
      document: node.document,
      contextSelection: node.selection || node.contextSelection
    }, config);

    if (factory)
    {
      child = factory.call(node, config);
      if (child instanceof node.childClass)
        return child;
    }

    if (!child)
      throw EXCEPTION_NULL_CHILD;

    throw (EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.constructor && child.constructor.className) + ')');
  }

 /**
  * @mixin
  */
  var DomMixin = {
   /**
    * @inheritDoc
    */
    canHaveChildren: true,

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
      if (!this.canHaveChildren)
        throw EXCEPTION_CANT_INSERT;

      if (newChild.firstChild)
      {
        // newChild can't be ancestor of current node
        var cursor = this;
        do {
          if (cursor == newChild)
            throw EXCEPTION_CANT_INSERT;
        }
        while (cursor = cursor.parentNode)
      }

      // check for dataSource
      if (this.dataSource && !this.dataSource.has(newChild.delegate))
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // construct new childClass instance if newChild is not instance of childClass
      if (newChild instanceof this.childClass == false)
        newChild = createChildByFactory(this, newChild instanceof DataObject ? { delegate: newChild } : newChild);

      // search for insert point
      var isInside = newChild.parentNode === this;
      var currentNewChildGroup = newChild.groupNode;
      var localGrouping = this.localGrouping;
      var localSorting = this.localSorting;
      var childNodes = this.childNodes;
      var newChildValue;
      var groupNodes;
      var group = null;
      var pos = -1;

      if (localGrouping)
      {
        var cursor;
        group = localGrouping.getGroupNode(newChild);
        groupNodes = group.nodes;

        // optimization: test node position, possible it on right place
        if (isInside && newChild.nextSibling === refChild && currentNewChildGroup === group)
          return newChild;

        // calculate newChild position
        if (localSorting)
        {
          // when localSorting use binary search
          newChildValue = localSorting(newChild) || 0;
          pos = groupNodes.binarySearchPos(newChildValue, sortingSearch, this.localSortingDesc);
          newChild.sortingValue = newChildValue;
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

        if (newChild === refChild || (isInside && newChild.nextSibling === refChild))
        {
          if (currentNewChildGroup !== group)
          {
            if (currentNewChildGroup)
              currentNewChildGroup.remove(newChild);

            group.insert(newChild);
          }

          return newChild;
        }

        pos = -1; // NOTE: drop pos, because this index for group nodes
                  // TODO: re-calculate pos as sum of previous groups nodes.length and pos
      }
      else
      {
        if (localSorting)
        {
          // if localSorting is using - refChild is ignore
          var sortingDesc = this.localSortingDesc;
          var next = newChild.nextSibling;
          var prev = newChild.previousSibling;

          newChildValue = localSorting(newChild) || 0;

          // some optimizations if node had already inside current node
          if (isInside)
          {
            if (newChildValue === newChild.localSorting)
              return newChild;

            if (
                (!next || (sortingDesc ? next.sortingValue <= newChildValue : next.sortingValue >= newChildValue))
                &&
                (!prev || (sortingDesc ? prev.sortingValue >= newChildValue : prev.sortingValue <= newChildValue))
               )
            {
              newChild.sortingValue = newChildValue;
              return newChild;
            }
          }

          // search for refChild
          pos = childNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc);
          refChild = childNodes[pos];
          newChild.sortingValue = newChildValue; // change sortingValue AFTER search

          if (newChild === refChild || (isInside && next === refChild))
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
            if (newChild.nextSibling === refChild)
              return newChild;

            if (newChild === refChild)
              throw EXCEPTION_CANT_INSERT;
          }
        }
      }

      //
      // ======= after this point newChild inserting or moving into new position =======
      //

      // unlink from old parent
      if (isInside)
      {
        // emulate removeChild if parentNode doesn't change (no events, speed benefits)

        // update nextSibling/lastChild
        if (newChild.nextSibling)
          newChild.nextSibling.previousSibling = newChild.previousSibling;
        else
          this.lastChild = newChild.previousSibling;

        // update previousSibling/firstChild
        if (newChild.previousSibling) 
          newChild.previousSibling.nextSibling = newChild.nextSibling;      
        else
          this.firstChild = newChild.nextSibling;

        // don't move this, this values using above to update first/last child
        newChild.previousSibling = null;
        newChild.nextSibling = null;

        if (pos == -1)
          childNodes.remove(newChild);
        else
        {
          var oldPos = childNodes.indexOf(newChild);
          childNodes.splice(oldPos, 1);
          if (oldPos < pos)
            pos--;
        }

        // remove from old group (always remove for correct order)
        if (currentNewChildGroup)  // initial newChild.groupNode
          currentNewChildGroup.remove(newChild);
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
        // NOTE: if position is not equal -1 than position was found before (localSorting, logN)
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
      //newChild.document = this.document;
      newChild.previousSibling = refChild.previousSibling;

      // not need update this.lastChild, insert always before some node
      // if insert into begins
      if (pos == 0)
        this.firstChild = newChild;
      else
        refChild.previousSibling.nextSibling = newChild;

      // update refChild
      refChild.previousSibling = newChild;

      // update document & selection
      var updateDocument = false;
      var updateSelection = false;
      var newChildSelection = this.selection || this.contextSelection;

      if (!newChild.document && newChild.document !== this.document)
      {
        updateDocument = this.document;
        newChild.document = this.document;
      }

      if (!newChild.contextSelection && newChild.contextSelection !== newChildSelection)
      {
        newChild.contextSelection = newChildSelection;
        updateSelection = !newChild.selection;

        if (newChild.selected)
        {
          //newChild.unselect();
          newChildSelection.add([newChild]);
        }
      }

      if (newChild.firstChild && (updateDocument || updateSelection))
        axis(newChild, AXIS_DESCENDANT).forEach(function(node){
          if (updateDocument && !node.document)
            node.document = updateDocument;

          if (updateSelection && !node.contextSelection)
          {
            if (node.selected)
              node.unselect();

            node.contextSelection = newChildSelection;
          }
        });

      // if node doesn't move inside the same parent (parentNode changed)
      if (!isInside)
      {
        // re-match
        if (newChild.match)
          newChild.match(this.matchFunction);

        // delegate parentNode automatically, if necessary
        if (newChild.autoDelegateParent)
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
      if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
        throw EXCEPTION_NODE_NOT_FOUND;

      if (oldChild instanceof this.childClass == false)
        throw EXCEPTION_BAD_CHILD_CLASS;

      if (this.dataSource && this.dataSource.has(oldChild))
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // update this
      var pos = this.childNodes.indexOf(oldChild);
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

      //
      // update document
      //
      if (oldChild.document === this.document)
      {
        axis(oldChild, AXIS_DESCENDANT_OR_SELF).forEach(function(node){
          if (node.document == this.document)
            node.document = null;
        }, this);
      }

      //
      // update selection
      //
      if (oldChild.contextSelection)
      {
        var contextSelection = oldChild.contextSelection;
        var cursor = oldChild;
        var unselect = [];
        while (cursor)  // cursor will be null at the end, because oldChild.parentNode == null
        {
          if (cursor.contextSelection === contextSelection)
          {
            if (cursor.selected)
              unselect.push(cursor);
            cursor.contextSelection = null;
          }

          if (!cursor.selection && cursor.firstChild)
            cursor = cursor.firstChild;
          else
          {
            if (cursor.nextSibling)
              cursor = cursor.nextSibling;
            else
            {
              while (cursor = cursor.parentNode)
              {
                if (cursor.nextSibling)
                {
                  cursor = cursor.nextSibling;
                  break;
                }
              }
            }
          }
        }

        contextSelection.remove(unselect);
      }

      if (oldChild.groupNode)
        oldChild.groupNode.remove(oldChild);

      // dispatch event
      if (!this.dataSource)
        this.event_childNodesModified(this, { deleted: [oldChild] });

      if (oldChild.autoDelegateParent)
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

      if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
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

      // drop dataSource
      if (this.dataSource)
      {
        this.setDataSource(); // it'll call clear again, but with no this.dataSource
        return;
      }

      // if node haven't childs nothing to do (event don't fire)
      if (!this.firstChild)
        return;

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
          // clear document/selection
          if (child.selection || child.document)
          {
            axis(child, DOM.AXIS_DESCENDANT_OR_SELF).forEach(function(node){
              //node.unselect();
              if (this.selection && node.selection === this.selection)
              {
                if (node.selected)
                  node.selection.remove([node]);
                node.selection = null;
              }
              if (node.document === this.document)
                node.document = null;
            }, this);
          }

          child.nextSibling = null;
          child.previousSibling = null;

          if (child.autoDelegateParent)
            child.setDelegate();
        }
        else
          child.destroy();
      }

      // if local grouping, clear groups
      if (this.localGrouping)
      {
        this.localGrouping.clear();
        /*var cn = this.localGrouping.childNodes;
        for (var i = cn.length - 1, group; group = cn[i]; i--)
          group.clear(alive);*/
      }
    },

   /**
    * @params {Array.<Object>} childNodes
    */
    setChildNodes: function(newChildNodes, keepAlive){
      if (!this.dataSource)
        this.clear(!!keepAlive);

      if (newChildNodes)
      {
        if ('length' in newChildNodes == false) // we don't use Array.from here to avoid make a copy of array
          newChildNodes = [newChildNodes];

        if (newChildNodes.length)
        {
          // switch off dispatch
          var tmp = this.event_childNodesModified;
          this.event_childNodesModified = Function.$undef;

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
      if (!dataSource || !this.canHaveChildren || dataSource instanceof AbstractDataset == false)
        dataSource = null;

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;

        // detach
        if (oldDataSource)
        {
          this.dataSource = null;
          this.colMap_ = null;

          oldDataSource.removeHandler(this.listen.dataSource, this);

          if (oldDataSource.itemCount)
            this.clear();
        }

        // TODO: switch off localSorting & localGrouping

        // attach
        if (dataSource)
        {
          this.dataSource = dataSource;
          this.colMap_ = {};

          dataSource.addHandler(this.listen.dataSource, this);

          if (dataSource.itemCount)
            this.listen.dataSource.datasetChanged.call(this, dataSource, {
              inserted: dataSource.getItems()
            });
        }

        // TODO: restore localSorting & localGrouping, fast node reorder

        this.event_dataSourceChanged(this, oldDataSource);
      }
    },

   /**
    * @inheritDoc
    */
    setLocalGrouping: function(grouping, alive){
      if (typeof grouping == 'function' || typeof grouping == 'string')
        grouping = {
          groupGetter: getter(grouping)
        };

      if (grouping instanceof GroupingNode == false)
      {
        grouping = grouping != null && typeof grouping == 'object'
          ? new this.localGroupingClass(Object.complete({
              //owner: this
            }, grouping))
          : null;
      }

      if (this.localGrouping !== grouping)
      {
        var oldGroupingNode = this.localGrouping;
        var order;

        if (this.localGrouping)
        {
          if (!grouping && this.firstChild)
          {
            this.localGrouping = null;

            order = this.localSorting
                      ? sortChildNodes(this)
                      : this.childNodes;

            for (var i = order.length; i --> 0;)
              order[i].groupNode = null;

            fastChildNodesOrder(this, order);
          }

          oldGroupingNode.setOwner();
        }

        if (grouping)
        {
          // NOTE: it important set localGrouping before set owner for grouping,
          // because grouping will try set localGrouping property on owner change
          // for it's new owner and it fall in recursion
          this.localGrouping = grouping;
          grouping.setOwner(this);

          // if there is child nodes - reorder it
          if (this.firstChild)
          {
            // new order
            if (this.localSorting)
              order = sortChildNodes(this);
            else
              order = this.childNodes;

            // split nodes by new groups
            for (var i = 0, child; child = order[i]; i++)
              child.groupNode = this.localGrouping.getGroupNode(child);

            // fill groups
            order = fastChildNodesGroupOrder(this, order);

            // apply new order
            fastChildNodesOrder(this, order);
          }
        }

        this.event_localGroupingChanged(this, oldGroupingNode);
      }
    },

   /**
    * @inheritDoc
    */
    setLocalSorting: function(sorting, desc){
      if (sorting)
        sorting = getter(sorting);

      // TODO: fix when direction changes only
      if (this.localSorting != sorting || this.localSortingDesc != !!desc)
      {
        this.localSortingDesc = !!desc;
        this.localSorting = sorting || null;

        // reorder nodes only if sorting and child nodes exists
        if (sorting && this.firstChild)
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
          if (this.localGrouping)
          {
            for (var group = this.localGrouping.nullGroup; group; group = group.nextSibling)
            {
              // sort, clear and set new order, no override childNodes
              nodes = group.nodes = sortChildNodes({ childNodes: group.nodes, localSortingDesc: this.localSortingDesc });

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

        this.event_localSortingChanged(this);
      }
    },

   /**
    * @inheritDoc
    */
    setMatchFunction: function(matchFunction){
      if (this.matchFunction != matchFunction)
      {
        this.matchFunction = matchFunction;
        for (var node = this.lastChild; node; node = node.previousSibling)
          node.match(matchFunction);
      }
    }
  };

 /**
  * @class
  */
  var InteractiveNode = Class(AbstractNode, {
    className: namespace + '.InteractiveNode',
  
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
      if (this.selection == selection)
        return false;
        
      var oldSelection = this.selection;
      axis(this, AXIS_DESCENDANT, function(node){
        if (node.contextSelection == oldSelection)
        {
          if (node.selected)
          {
            if (oldSelection)
              oldSelection.remove([node]);
          }
          node.contextSelection = selection;
        }
      });
      this.selection = selection;
        
      return true;
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
        if (!selected && this.selectable && !this.isDisabled())
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
             || (this.document && this.document.disabled)
             || !!DOM.findAncestor(this, getter('disabled'));
    },

   /**
    * @param {function()} func
    * @return {boolean}
    */
    match: function(func){
      if (typeof func != 'function')
      {
        if (this.matched)
        {
          if (this.underMatch_)
          {
            // restore init state
            this.underMatch_(this, true);
            this.underMatch_ = null;
          }
        }
        else
        {
          this.matched = true;
          this.event_match(this)
        }
      }
      else
      {
        if (func(this))
        {
          // match
          this.underMatch_ = func;
          if (!this.matched)
          {
            this.matched = true;
            this.event_match(this);
          }
        }
        else
        {
          // don't match
          this.underMatch_ = null;
          if (this.matched)
          {
            this.matched = false;
            this.event_unmatch(this);
          }
        }
      }
    },

   /**
    * Set match function for child nodes.
    * @param {function(node):bollean} func
    */
    setMatchFunction: function(func){
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.hasOwnSelection())
      {
        this.selection.destroy(); // how about shared selection?
        delete this.selection;
      }

      this.unselect();

      // inherit
      AbstractNode.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var Node = Class(InteractiveNode, DomMixin, {
    className: namespace + '.Node'
  });

 /**
  * @see ./demo/common/grouping.html
  * @see ./demo/common/grouping_of_grouping.html
  * @class
  */
  var GroupingNode = Class(AbstractNode, DomMixin, {
    className: namespace + '.GroupingNode',

    // events

    event_childNodesModified: function(node, delta){
      event.childNodesModified.call(this, node, delta);

      this.nullGroup.nextSibling = this.firstChild;

      if (delta.inserted && this.dataSource && this.nullGroup.first)
      {
        var parentNode = this.owner;
        var nodes = Array.from(this.nullGroup.nodes); // ??? Array.from?
        for (var i = nodes.length; i --> 0;)
          parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
      }
    },

    event_ownerChanged: function(node, oldOwner){
      // detach from old owner, if it still connected
      if (oldOwner && oldOwner.localGrouping === this)
        oldOwner.setLocalGrouping(null, true);

      // attach to new owner, if any and doesn't connected
      if (this.owner && this.owner.localGrouping !== this)
        this.owner.setLocalGrouping(this);

      event.ownerChanged.call(this, node, oldOwner);

      if (!this.owner && this.autoDestroyWithNoOwner)
        this.destroy();
    },

    // properties

    map_: null,

    autoDestroyWithNoOwner: true,
    autoDestroyEmptyGroups: true,
    titleGetter: getter('data.title'),
    groupGetter: Function.$undef,

    childClass: PartitionNode,
    childFactory: function(config){
      return new this.childClass(complete(config, {
        titleGetter: this.titleGetter,
        autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      }));
    },

    // methods

    init: function(config){
      this.map_ = {};

      this.nullGroup = new PartitionNode({
        autoDestroyIfEmpty: false
      });

      AbstractNode.prototype.init.call(this, config);
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @return {basis.dom.wrapper.PartitionNode}
    */
    getGroupNode: function(node){
      var groupRef = this.groupGetter(node);
      var isDelegate = groupRef instanceof DataObject;
      var group = this.map_[isDelegate ? groupRef.eventObjectId : groupRef];

      if (!group && !this.dataSource)
      {
        group = this.appendChild(
          isDelegate
            ? { delegate: groupRef }
            : { data: {
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

      if ('groupId_' in newChild == false)
      {
        newChild.groupId_ = newChild.delegate ? newChild.delegate.eventObjectId : newChild.data.id;
        this.map_[newChild.groupId_] = newChild;
      }

      if (newChild.first)
      {
        var owner = this.owner;
        var childNodes = owner.childNodes;

        var first = newChild.first;
        var last = newChild.last;

        var cursor;
        var insertArgs;
        var nextGroupFirst;
        var prevGroupLast;

        // search for prev group lastChild
        cursor = newChild;
        while (cursor = cursor.previousSibling)
        {
          if (prevGroupLast = cursor.last)
            break;
        }

        if (!prevGroupLast)
          prevGroupLast = this.nullGroup.last;

        // search for next group firstChild
        cursor = newChild;
        while (cursor = cursor.nextSibling)
        {
          if (nextGroupFirst = cursor.first)
            break;
        }

        if (first.previousSibling !== prevGroupLast || last.nextSibling !== nextGroupFirst)
        {
          // cut nodes from old position
          if (first.previousSibling)
            first.previousSibling.nextSibling = last.nextSibling;
          if (last.nextSibling)
            last.nextSibling.previousSibling = first.previousSibling;

          // remove group nodes from childNodes
          insertArgs = childNodes.splice(childNodes.indexOf(first), newChild.nodes.length);

          // insert nodes on new position and link edge nodes
          var pos = childNodes.indexOf(nextGroupFirst);
          insertArgs.unshift(pos != -1 ? pos : childNodes.length, 0);
          childNodes.splice.apply(childNodes, insertArgs);

          // firstChild/lastChild are present anyway
          first.previousSibling = prevGroupLast;
          last.nextSibling = nextGroupFirst;

          if (prevGroupLast)
            prevGroupLast.nextSibling = first;
          if (nextGroupFirst)
            nextGroupFirst.previousSibling = last;

          // update firstChild/lastChild of owner
          owner.firstChild = childNodes[0];
          owner.lastChild = childNodes[childNodes.length - 1];
        }
      }

      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      DomMixin.removeChild.call(this, oldChild);

      delete this.map_[oldChild.groupId_];

      return oldChild;
    },

    clear: function(alive){
      DomMixin.clear.call(this);
      this.map_ = {};
    },

    destroy: function(){
      this.setOwner();

      AbstractNode.prototype.destroy.call(this);

      this.map_ = null;
    }
  });

  AbstractNode.prototype.localGroupingClass = GroupingNode;


  //
  // ChildNodesDataset
  //

  var CHILDNODESDATASET_HANDLER = {
    childNodesModified: function(node, delta){
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
      event.sourceNodeChanged.call(this, object, oldSourceNode);

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

        if (oldSourceNode)
        {
          oldSourceNode.removeHandler(this.listen.sourceNode, this);
          this.listen.sourceNode.childNodesModified.call(this, oldSourceNode, {
            deleted: oldSourceNode.childNodes
          });
        }

        if (node)
        {
          node.addHandler(this.listen.sourceNode, this);
          this.listen.sourceNode.childNodesModified.call(this, node, {
            inserted: node.childNodes
          });
        }

        this.sourceNode = node;

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
            node.event_select();
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
            node.event_unselect();
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
          nodes.splice(1);
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
        nodes.splice(1);

      return Dataset.prototype.set.call(this, items);
    }
  });

  function simpleTemplate(){
    return basis.ui.apply(this, arguments);
  }

  //
  // export names
  //

  basis.namespace(namespace, simpleTemplate).extend({
    // non-template classes
    AbstractNode: AbstractNode,
    InteractiveNode: InteractiveNode,
    Node: Node,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode,

    simpleTemplate: simpleTemplate,

    // datasets
    ChildNodesDataset: ChildNodesDataset,
    Selection: Selection
  });

}(basis);


//
// src/basis/cssom.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev
 * Roman Dvornov
 */

basis.require('basis.dom');
basis.require('basis.dom.event');

!function(basis, global){

 'use strict';

 /**
  * @namespace basis.cssom
  */
  
  var namespace = 'basis.cssom';

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

  var IMPORTANT_REGEXP = /\s*!important/i;
  var IMPORTANT = String('important');
  var GENERIC_RULE_SEED = 1;
  var cssStyleSheets = {};

  //
  // shortcut
  //
  
  function cssRule(selector, styleSheet){
    return getStyleSheet(styleSheet, true).getRule(selector, true);
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

    var result = cssRule('.' + token);
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
  * @return {basis.cssom.CssStyleSheetWrapper}
  */
  function getStyleSheet(id, createIfNotExists){
    if (!id)
      id = 'DefaultGenericStyleSheet';

    if (!cssStyleSheets[id])
      if (createIfNotExists)
        cssStyleSheets[id] = new CssStyleSheetWrapper(addStyleSheet())

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
  * @param {string} key Name of property.
  * @param {string} value Value of property.
  */
  function setStyleProperty(node, key, value){
    if (typeof node.setProperty == 'function')
      return node.setProperty(key, value);

    var mapping = getStylePropertyMapping(key, value);
    if (mapping)
      return node.style[mapping.key] = mapping.value;
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
  * @deprecated use Basis.DOM.display instead.
  */
  function show(element){
    return display(element, 1);
  }
 /**
  * @deprecated use Basis.DOM.display instead.
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
  * @deprecated use Basis.DOM.visibility instead.
  */
  function visible(element){
    return visibility(element, 1);
  }
 /**
  * @deprecated use Basis.DOM.visibility instead.
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
  var CssStyleSheetWrapper = Class(null, {
    className: namespace + '.CssStyleSheetWrapper',

   /**
    * Wrapped stylesheet
    * @type {StyleSheet}
    */
    styleSheet: null,

   /**
    * @type {Array.<CssRuleWrapper|CssRuleWrapperSet>}
    */
    rules: null,

   /**
    * @param {StyleSheet} styleSheet
    * @constructor
    */
    init: function(styleSheet){
      this.styleSheet = styleSheet;
      this.rules = [];
      this.map_ = {};
    },

   /**
    * @param {string} selector
    * @param {boolean=} createIfNotExists
    * @return {CssRuleWrapper|CssRuleWrapperSet}
    */
    getRule: function(selector, createIfNotExists){
      if (!this.map_[selector])
      {
        if (createIfNotExists)
        {
          var styleSheet = this.styleSheet;
          var index = this.rules.length;
          var newIndex = styleSheet.insertRule(selector + '{}', index);

          for (var i = index; i <= newIndex; i++)
            this.rules.push(new CssRuleWrapper(styleSheet.cssRules[i]));

          this.map_[selector] = index != newIndex ? new CssRuleWrapperSet(this.rules.splice(index)) : this.rules[index];
        }
      }

      return this.map_[selector];
    },

   /**
    * @param {string} selector
    */
    deleteRule: function(selector){
      var rule = this.map_[selector];
      if (rule)
      {
        var rules = rule.rules || [rule];
        for (var i = 0; i < rules.length; i++)
        {
          var ruleIndex = this.rules.indexOf(rules[i]);
          this.stylesheet.deleteRule(ruleIndex);
          this.rules.splice(ruleIndex, 1);
        }
        delete this.map_[selector];
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      delete this.rules;
    }
  });

 /**
  * @class
  */
  var CssRuleWrapper = Class(null, {
    className: namespace + '.CssRuleWrapper',

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
    init: function(rule){
      if (rule)
      {
        this.rule = rule;
        this.selector = rule.selectorText;
      }
    },

   /**
    * @param {string} property
    * @param {any} value
    */
    setProperty: function(property, value){
      var mapping;
      var imp = !!IMPORTANT_REGEXP.test(value);
      var style = this.rule.style;
      if (imp || isPropertyImportant(style, property))
      {
        value = value.replace(IMPORTANT_REGEXP, '');

        if (mapping = getStylePropertyMapping(property, value))
        {
          var key = mapping.key;

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

            style.cssText = style.cssText.replace(new RegExp(rxText, 'i'), newValue);
          }
        }
      }
      else 
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
      delete this.rule;
    }
  });

 /**
  * @class
  */
  var CssRuleWrapperSet = Class(null, {
    className: namespace + '.CssRuleWrapperSet',

   /**
    * @type {Array.<CssRuleWrapper>}
    */
    rules: null,

   /**
    * @param {Array.<CssRuleWrapper>} rules
    * @constructor
    */
    init: function(rules){
      this.rules = rules;
    },
    destroy: function(){
      delete this.rules;
    }
  });

  ['setProperty', 'setStyle', 'clear'].forEach(function(method){
    CssRuleWrapperSet.prototype[method] = function(){
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
  var rxCache = {};

  function tokenRegExp(token){
    return rxCache[token] || (rxCache[token] = new RegExp('\\s*\\b' + token + '\\b'));
  }

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
    bool: function(token, exists) {
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

  if (global.DOMTokenList && document.documentElement.classList)
  {
    var proto = ClassList.prototype;
    Object.extend(global.DOMTokenList.prototype, {
      set: proto.set,
      replace: proto.replace,
      bool: proto.bool,
      clear: function(){
        for (var i = this.length; i --> 0;)
          this.remove(this[i]);
      }
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

  //
  // platform specific actions
  //

  event.onLoad(function(){
    classList(document.body).bool('opacity-not-support', !basis.platformFeature['css-opacity']);
  });

  // export names

  dom.extend({
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

  return basis.namespace(namespace).extend({
    // style interface
    setStyleProperty: setStyleProperty,
    setStyle: setStyle,
    classList: classList,

    // rule and stylesheet interfaces
    uniqueRule: uniqueRule,
    cssRule: cssRule,
    getStyleSheet: getStyleSheet,
    addStyleSheet: addStyleSheet,

    // classes
    CssStyleSheetWrapper: CssStyleSheetWrapper,
    CssRuleWrapper: CssRuleWrapper,
    CssRuleWrapperSet: CssRuleWrapperSet
  }).extend(unitFunc);

}(basis, this);


//
// src/basis/entity.js
//

/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.data');

!function(basis){

  'use strict';

 /**
  * @namespace basis.entity
  */

  var namespace = 'basis.entity';

  // import names

  var Class = basis.Class;
  var Cleaner = basis.Cleaner;

  var extend = Object.extend;
  var complete = Object.complete;
  var arrayFrom = Array.from;
  var $self = Function.$self;
  var getter = Function.getter;

  var nsData = basis.data;

  var EventObject = basis.EventObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;
  var AggregateDataset = nsData.AggregateDataset;
  var Collection = nsData.Collection;
  var Grouping = nsData.Grouping;
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
      var entitySetType = new EntitySetConstructor(wrapper || $self);

      return function(data, entitySet){
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
    }
  };
  EntitySetWrapper.className = namespace + '.EntitySetWrapper';

  //
  // EntitySetConstructor
  //

 /**
  * @class
  */
  var EntitySetConstructor = Class(null, {
    className: namespace + '.EntitySetConstructor',

    init: function(wrapper){
      this.wrapper = wrapper;
    },
    createEntitySet: function(){
      return new EntitySet({
        wrapper: this.wrapper,
        name: 'Set of ' + ((this.wrapper.entityType || this.wrapper).name || '').quote('{')
      });
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
  EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

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
        args: wrapper.args,
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
          if (typeof console != 'undefined') console.log('Calculate fields are readonly');
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
    event_rollbackUpdate: EventObject.createEvent('rollbackUpdate')
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
          this.data[key].removeHandler(fieldDestroyHandlers[key], this);

        this.fieldHandlers_ = NULL_INFO;

        // delete from index
        if (this.__id__)
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

  basis.namespace(namespace).extend({
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

}(basis);

//
// src/package/core.js
//


  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.html');
  basis.require('basis.data');
  basis.require('basis.entity');