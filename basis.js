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

(function(){

  'use strict';

  // Define global scope: `window` in the browser, or `global` on the server
  var global = this;

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
    return
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
    toObject: function(){
      // try { return eval('0,' + this) } catch(e) {}
      // safe solution with no eval:
      try { return Function('return 0,' + this)() } catch(e) {}
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

  var namespace = 'Basis';

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

  // ============================================ 
  // Browser
  //

  var Browser = (function(){

   /** @namespace Basis.Browser */

    var namespace = 'Basis.Browser';

    //
    // main part
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

    var FeatureSupport = {
      datauri: false
    };

    // DATA URI SHEME test
    var testImage = typeof Image != 'undefined' ? new Image() : {}; // NOTE test for Image neccesary for node.js
    testImage.onload = function(){ FeatureSupport.datauri = true };
    testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

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
    // Cookies
    //

    function setCookie(name, value, expire, path){
      document.cookie = name + "=" + (value == null ? '' : escape(value)) +
                        ";path=" + (path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname)) +
                        (expire ? ";expires=" + (new Date(Date.now() + expire * 1000)).toGMTString() : '');
    }

    function getCookie(name){
      var m = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*(.*?)\\s*(;|$)"));
      return m && unescape(m[2]);
    }

    function removeCookie(name, path){
      document.cookie = name + "=;expires=" + new Date(0).toGMTString() + ";path=" + (path || ((location.pathname.indexOf('/') == 0 ? '' : '/') + location.pathname));
    }

    //
    // export names
    //

    namespace = getNamespace(namespace);
    namespace.toString = function(){ return browserPrettyName };
    return namespace.extend({
      FeatureSupport: FeatureSupport,
      testImage: testImage,

      //name: browserName,
      prettyName: browserPrettyName,
      
      test: testBrowser,  // multiple test
      is: function(name){ return testBrowser(name) },  // single test

      // Cookie interface
      Cookies: {
        set: setCookie,
        get: getCookie,
        remove: removeCookie
      }
    });

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

    var namespace = 'Basis.Class';

   /**
    * Root class for all classes created by Basis class model.
    * @type {function()}
    */
    var BaseClass = function(){};
    var seed = { id: 1 };

    extend(BaseClass, {
      // Base class name
      className: 'Basis.Class',

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
          superClass_: SuperClass,
          extendConstructor_: !!SuperClass.extendConstructor_,

          // class methods
          __extend__: function(value){
            if (value && (typeof value == 'object' || (typeof value == 'function' && !value.className)))
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
            typeof args[i] == 'function' && !args[i].className
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
        newClass.constructor = { a: 1};

        // extend constructor with properties
        extend(newClass, newClassProps);
        
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

    var ExtensibleProperty = function(extension){
      return {
        __extend__: function(extension){
          var Base = Function();
          Base.prototype = this;
          return extend(new Base, extension);
        }
      }.__extend__(extension);
    };

    var NestedExtProperty = function(extension){
      return {
        __extend__: function(extension){
          var Base = Function();
          Base.prototype = this;
          var property = new Base;

          for (var key in extension)
          {
            var value = property[key];
            property[key] = value && value.__extend__
                         ? value.__extend__(extension[key])
                         : ExtensibleProperty(extension[key]);
          }

          return property;
        }
      }.__extend__(extension);
    };

    return getNamespace(namespace, BaseClass.create).extend({
      BaseClass: BaseClass,
      create: BaseClass.create,
      ExtensibleProperty: ExtensibleProperty,
      NestedExtProperty: NestedExtProperty
    });
  })();

  // ================================
  // EventObject
  //

  var EventObject = (function(){

   /**
    * @namespace Basis
    */

    var slice = Array.prototype.slice;
    var warnOnDestroy = function(){ throw 'Object had beed destroed before. Destroy method shouldn\'t be call more than once.' }

    // EventObject seed ID
    var eventObjectId = 1;
    var events = {};

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
    var destroyEvent;
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

     /** use extend constructor */
      extendConstructor_: true,

      listen: Class.NestedExtProperty(),

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

  // ============================================ 
  // DOM

  var DOM = (function(){

   /**
    * This namespace provides functions for manupulations with DOM - transerval,
    * node creation, moving and test nodes. Most of functions are compatible with
    * native and simulated (object that generaly has properties like firsChild,
    * lastChild, parentNode etc) DOM structures.
    *
    * Functions overview:
    * - Order & position functions:
    *     {Basis.DOM.comparePosition}
    * - Getters:
    *     {Basis.DOM.get}, {Basis.DOM.tag}, {Basis.DOM.axis}
    * - Traversal:
    *     {Basis.DOM.TreeWalker}
    * - Constructors:
    *     {Basis.DOM.createElement}, {Basis.DOM.createText},
    *     {Basis.DOM.createFragment}
    * - DOM manipulations:
    *     {Basis.DOM.insert}, {Basis.DOM.remove}, {Basis.DOM.replace},
    *     {Basis.DOM.swap}, {Basis.DOM.clone}, {Basis.DOM.clear}, {Basis.DOM.wrap}
    * - Attribute setters/getters:
    *     {Basis.DOM.setAttribute}
    * - Checkers:
    *     {Basis.DOM.is}, {Basis.DOM.parentOf}, {Basis.DOM.isInside}
    * - Input interface:
    *     {Basis.DOM.focus}, {Basis.DOM.setSelectionRange},
    *     {Basis.DOM.getSelectionStart}, {Basis.DOM.getSelectionEnd}
    * - Misc:
    *     {Basis.DOM.outerHTML}, {Basis.DOM.textContent}
    *
    * @namespace Basis.DOM
    */

    var namespace = 'Basis.DOM';

    // for better pack
    var document = global.document;

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
      filter: $true,

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
        extend(this,
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

      filter = typeof filter == 'string' ? getter(filter) : filter || $true;

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
              'Create element error in DOM.createElement()' +
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
        if (config.css)
          DOM.Style.setStyle(element, config.css);

        for (var event in config)
          if (typeof config[event] == 'function')
            Event.addHandler(element, event, config[event], element);
          else
            if (config[event] instanceof Event.Handler)
              Event.addHandler(element, event, config[event].handler, config[event].thisObject);
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
      {
        debugger;
        throw new Error('DOM.insert: destination node can\'t be null');
      }

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
    *   DOM.wrap([1,2,3,4,5], { 'SPAN.match': function(val, idx){ return idx % 2 } });
    *   // result: [1, <span class="match">2</span>, 3, <span class="match">4</span>, 5]
    *
    *   DOM.wrap([1,2,3], { A: Function.$true, B: function(val, idx){ return val == 3 } });
    *   // result: [<a>1</a>, <a>2</a>, <b><a>3</a></b>]
    * @param {[any]} array
    * @param {object} map
    * @return {[any]}
    */
    function wrap(array, map, getter){
      var result = [];
      getter = Function.getter(getter || $self);
      for (var k in map)
        for (var i = 0; i < array.length; i++)
        {
          var value = getter(array[i]);
          result[i] = map[k](array[i], i, value) ? DOM.createElement(k, value) : array[i];
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

    return getNamespace(namespace).extend({
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

  })();

  // ============================================
  // DOM.Style
  // 
  // Authors: Vladimir Ratsev
  //          Roman Dvornov
  //

  (function() {

   /**
    * @namespace
    */
    
    var namespace = 'Basis.DOM.Style';

    // main part

    var IMPORTANT_REGEXP = /\s*!important/i;
    var IMPORTANT = String('important');
    var cssStyleSheets = {};

    // shortcut
    
    function cssRule(selector, styleSheet){
      return getStyleSheet(styleSheet, true).getRule(selector, true);
    }

    var GENERIC_RULE_SEED = 10000;
    function uniqueRule(element){
      var token = 'genericRule-' + GENERIC_RULE_SEED++;

      if (element)
        CSS.classList(element).add(token);

      return cssRule('.' + token);
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
      var element = DOM.createElement(!url ? 'STYLE[type="text/css"]' : 'LINK[type="text/css"][rel="{alt}stylesheet"][href={url}]'.format({
        alt: title ? 'alternate ' : '',
        url: url.quote('"')
      }));

      DOM.tag(document, 'HEAD')[0].appendChild(element);

      return StyleSheet_makeCompatible(element.sheet || element.styleSheet);
    }

    var basisId = 1;

   /**
    * Returns generic stylesheet by it's id.
    * @param {string=} id
    * @param {boolean=} createIfNotExists
    * @return {Basis.DOM.Style.CssStyleSheetWrapper}
    */
    function getStyleSheet(id, createIfNotExists){
      if (!id)
        id = 'DefaultGenericStyleSheet';

      if (!cssStyleSheets[id])
        if (createIfNotExists)
          cssStyleSheets[id] = new CssStyleSheetWrapper(addStyleSheet())

      return cssStyleSheets[id];
    }

    // tools

    function isPropertyImportant(style, property){
      if (style.getPropertyPriority)
        return style.getPropertyPriority(property) == IMPORTANT;
      else
        return false;
    }

    //
    // Style mapping
    //

    var styleMapping = {};
    var testElement = DOM.createElement('DIV');

    function createStyleMapping(property, names, regSupport, getters){
      getters = getters || {};
      names = names.qw();

      for (var i = 0, name; name = names[i]; i++)
      {
        if (typeof testElement.style[name] != 'undefined')
        {
          if (regSupport)
            Browser.FeatureSupport['css-' + property] = name;

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
    // DOM node styling
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
          DOM.setStyleProperty(this.rule, property, value);
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


    // export names

    DOM.extend({
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

    return getNamespace(namespace).extend({
      // style interface
      setStyleProperty: setStyleProperty,
      setStyle: setStyle,

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

  })();

  // ============================================ 
  // Html
  //

  var Html = (function(){

   /** @namespace Basis.Html */

    var namespace = 'Basis.Html';

    var tmplEventListeners = {};
    var tmplNodeMap = { seed: 1 };

    var tmplPartFinderRx = /<([a-z0-9\_]+)(?:\{([a-z0-9\_\|]+)\})?([^>\/]*)(\/?)>|<\/([a-z0-9\_]+)>|<!--(\s*\{([a-z0-9\_\|]+)\}\s*|.*?)-->/i;
    var tmplAttrRx = /(?:([a-z0-9\_\-]+):)?([a-z0-9\_\-]+)(?:\{([a-z0-9\_\|]+)\})?(?:="((?:\\.|[^"])*?)"|='((?:\\.|[^'])*?)')?\s*/gi;
    var domFragment = DOM.createFragment();

    // Test for browser (IE) normalize text nodes during cloning
    var CLONE_NORMALIZE_TEXT_BUG = (function(){
      return DOM.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
    })();

    
    var createFragment = DOM.createFragment;
    var createText = DOM.createText;
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
            Event.addGlobalHandler(eventName, function(event){
              var cursor = Event.sender(event);
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

              // search for nearest node refer to Basis.Class instance
              do {
                if (refId = cursor.basisObjectId)
                {
                  // if found call templateAction method
                  var node = tmplNodeMap[refId];
                  if (node && node.templateAction)
                  {
                    var actions = attr.nodeValue.qw();

                    for (var i = 0, actionName; actionName = actions[i++];)
                      node.templateAction(actionName, event);

                    return;
                  }
                }
              } while (cursor = cursor.parentNode);
            });
          }
        }

        result += name == 'class'
                    ? value.trim().replace(/^(.)|\s+/g, '.$1')
                    : '[' + name + '=' + value.quote('"') + ']';
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
          var element = DOM.createElement(tagName + parseAttributes(context, attributes, nodePath));

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
    * Creates DOM structure template from marked HTML. Use {Basis.Html.Template#createInstance}
    * method to apply template to object. It creates clone of DOM structure and adds
    * links into object to pointed parts of structure.
    *
    * To remove links to DOM structure from object use {Basis.Html.Template#clearInstance}
    * method.
    * @example
    *   // create a template
    *   var template = new Basis.Template(
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
    *     Basis.CSS.cssClass(node.element).add('item' + i);
    *     node.hrefAttr.nodeValue = '/foo/bar.html';
    *     node.titleText.nodeValue = 'some title';
    *     node.descriptionText.nodeValue = 'description text';
    *   }
    *   
    *   // create and attach DOM structure to existing object
    *   var dataObject = new Basis.Data.DataObject({
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
    *   Basis.DOM.insert(someElement, dataObject.element);
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
      * {Basis.Html.Template#createInstance} call. If function passed it be called at
      * first {Basis.Html.Template#createInstance} and it's result will be used as
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
      return DOM.createElement('DIV', DOM.createText(html)).innerHTML;
    }

    var unescapeElement = document.createElement('DIV');
    function unescape(escapedHtml){
      unescapeElement.innerHTML = escapedHtml;
      return unescapeElement.firstChild.nodeValue;
    }

    function string2Html(text){
      unescapeElement.innerHTML = text;
      return DOM.createFragment.apply(null, Array.from(unescapeElement.childNodes));
    }

    //
    // export names
    //

    return getNamespace(namespace).extend({
      Template: Template,
      escape: escape,
      unescape: unescape,
      string2Html: string2Html
    });

  })();

  // ============================================ 
  //  [ Event ]

  var Event = (function(){

   /** @namespace Basis.Event */

    var namespace = 'Basis.Event';

    // for better pack

    var document = global.document;

    //
    // Const
    //

    var EVENT_HOLDER = '__basisEvents';

    // key constants
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
      return typeof object == 'string' ? DOM.get(object) : object;
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
                                     // W3C DOM3     // Other browsers
      var btn = 'buttons' in event ? event.buttons : event.which;
      if (typeof btn == 'number')
        // DOM scheme
        return btn == button.VALUE;
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

      if ('pageX' in event)
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

      if ('pageY' in event)
        return event.pageY;
      else
        return event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
    };

    //
    // Global events
    //

    var compareHandlers = function(item){
      return item.handler != this.handler || item.thisObject != this.thisObject;
    }

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

      if (Browser.is('ie7-'))
      {
        (function(){
          var secretId = '_' + Date.now();
          document.write('<script id="' + secretId + '" defer src="//:"><\/script>');
          getNode(secretId).onreadystatechange = function(){
            if (this.readyState == 'complete')
            {
              DOM.remove(this);
              fireHandlers(); 
            }
          };
        })();
      }
      else
        /* WebKit for */ 
        if (Browser.is('safari525-'))
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

    return getNamespace(namespace, wrap).extend({
      KEY: KEY,

      MOUSE_LEFT: MOUSE_LEFT,
      MOUSE_RIGHT: MOUSE_RIGHT,
      MOUSE_MIDDLE: MOUSE_MIDDLE,

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

  })();

  // ============================================ 
  // CSS
  //

  var CSS = (function(){

   /** @namespace Basis.CSS */
    var namespace = 'Basis.CSS';

    var rxCache = {};
    function tokenRegExp(token){
      return rxCache[token] || (rxCache[token] = new RegExp('\\s*\\b' + token + '\\b'));
    }

    var ClassList = Class(null, {
      className: namespace + '.ClassName',

      init: function(element){ 
        ;;;if (!element) throw new Error('ClassName wraper: Element ' + element + ' not found!');
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
          this.remove(className);
        else
          this.add(className);

        return !exists;
      }
    });

    var classList;

    if (window.DOMTokenList && document.documentElement.classList)
    {
      extend(window.DOMTokenList.prototype, {
        set: ClassList.prototype.set,
        replace: ClassList.prototype.replace,
        bool: ClassList.prototype.bool,
        clear: function(){
          for (var i = this.length; i --> 0;)
            this.remove(this[i]);
        }
      });
      classList = function(element){
        return (typeof element == 'string' ? DOM.get(element) : element).classList;
      }
    }
    else
    {
      classList = function(element){ 
        return new ClassList(typeof element == 'string' ? DOM.get(element) : element);
      }
    }

    // export
    return getNamespace(namespace).extend({
      cssClass: classList,
      classList: classList
    });

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

    Event.onUnload(destroy);

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

    var eventScheme = typeof global.addEventListener == 'function' && typeof global.postMessage == 'function';
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

        Event.kill(event);
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
        eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
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
        eventStack.splice(eventStack.binarySearchPos(eventObject), 1);
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
    })

    return {
      add: add,
      remove: remove
    };
  })();

  // ============================================ 
  // Init part
  //

  // Browser depended actions

  // enable background image cache for IE6
  if (Browser.test('IE7-')) 
    try { document.execCommand("BackgroundImageCache", false, true); } catch(e) {};

  Event.onLoad(function(){
    CSS.cssClass(document.body).bool('opacity-not-support', !Browser.FeatureSupport['css-opacity']);
  });

  //
  // export names
  //

  // extend Basis
  getNamespace(namespace).extend({
    namespace: getNamespace,

    EventObject: EventObject,
    TimeEventManager: TimeEventManager,

    Cleaner: Cleaner
  });

  global.Basis.Locale = {};

}).call(this);
