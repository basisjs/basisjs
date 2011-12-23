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

    var requireFunc;
    if (typeof require == 'function')
      requireFunc = function(filename){
        return require(requirePath + filename.replace(/\./g, '/'));
      }
    else
    {
      requireFunc = function(filename, path_){
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
              var requestUrl = requirePath + (path_ || '') + filename.replace(/\./g, '/') + '.js';
              var req = new XMLHttpRequest();
              req.open('POST', requestUrl, false);
              req.send(null);
              if (req.status == 200)
              {
                try {
                  (global.execScript || function(scriptText){
                    global["eval"].call(global, scriptText + '//@ sourceURL=' + requestUrl);
                  })(req.responseText);
                  //new Function(req.responseText).call(global);
                } catch(e) {
                  ;;;console.log('run ' + requirePath + (path_ || '') + filename.replace(/\./g, '/') + '.js' + ' ( ' + filename + ' )');
                  throw e;
                }
                requireFunc.sequence.push(filename.replace(/\./g, '/') + '.js');
              }
              else
              {
                if (req.status == 404 && path)
                  requireNamespace(namespace);
                else
                  throw 'unable to load module ' + filename + ' by basis.require()';
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
      requireFunc.sequence = [];
    }

    return requireFunc;
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
      return typeof object == 'function' && object.basisClass_;
    };

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

        var newProto = new SuperClass_();
        var newClassProps = {
          className: SuperClass.className + '._SubClass_',
          basisClass_: true,
          superClass_: SuperClass,
          extendConstructor_: !!SuperClass.extendConstructor_,

          // class methods
          __extend__: function(value){
            if (value && (typeof value == 'object' || (typeof value == 'function' && !isClass(value))) && value !== SELF)
              return BaseClass.create.call(null, newClass, value);
            else
              return value;
          },
          extend: BaseClass.extend,
          subclass: function(){
            return BaseClass.create.apply(null, [newClass].concat(Array.from(arguments)));
          },

          // new class prototype
          prototype: newProto
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

        /** @cut */if (/^function[^(]*\(config\)/.test(newProto.init) ^ newClassProps.extendConstructor_) console.warn('probably wrong extendConstructor_ value for ' + newClassProps.className);

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
        newProto.constructor = newClass;

        for (var key in newProto)
          if (newProto[key] === SELF)
            newProto[key] = newClass;

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

        for (var key in source)
        {
          var value = source[key];
          var protoValue = proto[key];

          if (key == 'className' || key == 'extendConstructor_')
            this[key] = value;
          else
            proto[key] = protoValue && protoValue.__extend__ 
                           ? protoValue.__extend__(value)
                           : value;
        }

        // for browsers that doesn't enum toString
        if (TOSTRING_BUG && source[key = 'toString'] !== Object.prototype[key])
          proto[key] = source[key];
        
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
      SELF: SELF,
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
                if (func = config.handler[eventName])
                  if (typeof func == 'function')
                    func.apply(config.thisObject, arguments);

                if (func = config.handler['*'])
                  if (typeof func == 'function')
                    func.call(config.thisObject, {
                      type: eventName,
                      args: arguments
                    });
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
