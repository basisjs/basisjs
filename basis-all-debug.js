// Package basis-all-debug.js
//   src/basis.js
//   src/basis/ua.js
//   src/basis/dom.js
//   src/basis/dom/event.js
//   src/basis/data.js
//   src/basis/html.js
//   src/basis/dom/wrapper.js
//   src/basis/cssom.js
//   src/basis/date.js
//   src/basis/ui.js
//   src/basis/layout.js
//   src/basis/dragdrop.js
//   src/basis/data/property.js
//   src/basis/animation.js
//   src/basis/xml.js
//   src/basis/crypt.js
//   src/basis/data/dataset.js
//   src/basis/data/index.js
//   src/basis/entity.js
//   src/basis/session.js
//   src/basis/net/ajax.js
//   src/basis/net/soap.js
//   src/basis/ui/button.js
//   src/basis/ui/label.js
//   src/basis/ui/tree.js
//   src/basis/ui/popup.js
//   src/basis/ui/table.js
//   src/basis/ui/scrolltable.js
//   src/basis/ui/window.js
//   src/basis/ui/tabs.js
//   src/basis/ui/calendar.js
//   src/basis/ui/form.js
//   src/basis/ui/scroller.js
//   src/basis/ui/toc.js
//   src/basis/ui/slider.js
//   src/basis/ui/resizer.js
//   src/basis/ui/paginator.js
//   src/basis/ui/pageslider.js
//   src/basis/ui/canvas.js
//   src/basis/format/highlight.js
//   src/package/all.js

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

!function(){

  'use strict';

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

  var namespace = 'basis.data';

  //
  // import names
  //

  var Class = basis.Class;

  var EventObject = basis.EventObject;

  var values = Object.values;
  var $self = Function.$self;
  var createEvent = EventObject.createEvent;
  var event = EventObject.event;

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

    values_: {},

   /**
    * Registrate new state
    */
    add: function(state, order){
      var name = state.toUpperCase();
      var value = state.toLowerCase();

      this[name] = value;
      STATE_EXISTS[value] = true;

      if (order)
      {
        order = this.indexOf(order);
        if (order == -1)
          this.PRIORITY.push(value)
        else
          this.PRIORITY.splice(order, 0, value);
      }
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
    MASK: 0,

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
      SUBSCRIPTION.MASK |= subscriptionSeed;

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
  // 
  //


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
    * Subscriber type indicates what sort of influence has currency object on
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
      var listenHandler = this.listen.target;

      if (listenHandler)
      {
        if (oldTarget)
          oldTarget.removeHandler(listenHandler, this);

        if (this.target)
          this.target.addHandler(listenHandler, this);
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
        applySubscription(this, this.subscribeTo, SUBSCRIPTION.MASK);
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
        var listenHandler = this.listen.delegate;

        if (oldDelegate && listenHandler)
          oldDelegate.removeHandler(listenHandler, this);

        if (newDelegate)
        {
          // assing new delegate
          this.delegate = newDelegate;
          this.root = newDelegate.root;
          this.data = newDelegate.data;
          this.state = newDelegate.state;
          this.target = newDelegate.target;

          if (listenHandler)
            newDelegate.addHandler(listenHandler, this);

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
    * Default action on deprecate, set object state to basis.data.STATE.DEPRECATED,
    * but only if object isn't in baiss.data.STATE.PROCESSING state.
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
    * @param {boolean} isActive New value for {basis.data.DataObject#isActiveSubscriber} property.
    * @return {boolean} Returns true if {basis.data.DataObject#isActiveSubscriber} was changed.
    */
    setActive: function(isActive){
      isActive = !!isActive;

      if (this.active != isActive)
      {
        this.active = isActive;
        this.event_activeChanged(this);

        applySubscription(this, this.subscribeTo, SUBSCRIPTION.MASK * isActive);

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
      var newSubscriptionType = subscriptionType & SUBSCRIPTION.MASK;
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
  // namespace wrapper
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

  basis.namespace(namespace, wrapper).extend({
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

}(basis, this);

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
  var SUBSCRIPTION = nsData.SUBSCRIPTION;
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

  var DELEGATE = {
    NONE: 'none',
    PARENT: 'parent',
    OWNER: 'owner'
  };

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
  //  NODE
  //

  var NULL_SATELLITE_CONFIG = Class.ExtensibleProperty();
  var SATELLITE_DESTROY_HANDLER = {
    ownerChanged: function(sender, oldOwner){
      if (sender.owner !== this)
      {
        // ???
      }
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
          this.match(parentNode.matchFunction);

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
    * @param {basis.data.AbstractDataset} oldDataSource
    */
    event_dataSourceChanged: createEvent('dataSourceChanged', 'node', 'oldDataSource'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.GroupingNode} oldGroupingNode
    */
    event_localGroupingChanged: createEvent('localGroupingChanged', 'node', 'oldGroupingNode'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {function()} oldLocalSorting
    * @param {boolean} oldLocalSortingDesc
    */
    event_localSortingChanged: createEvent('localSortingChanged', 'node', 'oldLocalSorting', 'oldLocalSortingDesc'),

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
    * @type {basis.data.AbstractDataset}
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

      ;;;if (('autoDelegateParent' in this) && typeof console != 'undefined') console.warn('autoDelegateParent property is deprecate. Use autoDelegate instead');

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
    * @param {basis.data.AbstractDataset} dataSource
    */
    setDataSource: function(dataSource){
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode}
    */
    setOwner: function(owner){
      if (!owner || owner instanceof AbstractNode == false)
        owner = null;

      if (this.owner !== owner)
      {
        var oldOwner = this.owner;
        var listenHandler = this.listen.owner;

        this.owner = owner;

        if (listenHandler)
        {
          if (oldOwner)
            oldOwner.removeHandler(listenHandler, this);

          if (owner)
            owner.addHandler(listenHandler, this);
        }

        this.event_ownerChanged(this, oldOwner);

        if (this.autoDelegate == DELEGATE.OWNER)
          this.setDelagate(owner);
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
      var localSortingDesc;
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

      if (localSorting)
      {
        // if localSorting is using - refChild is ignore
        refChild = null; // ignore
        localSortingDesc = this.localSortingDesc;
        newChildValue = localSorting(newChild) || 0;

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
                (!nextSibling || (localSortingDesc ? nextSibling.sortingValue <= newChildValue : nextSibling.sortingValue >= newChildValue))
                &&
                (!prevSibling || (localSortingDesc ? prevSibling.sortingValue >= newChildValue : prevSibling.sortingValue <= newChildValue))
               )
            {
              newChild.sortingValue = newChildValue;
              correctSortPos = true;
            }
          }
        }
      }

      if (localGrouping)
      {
        var cursor;
        group = localGrouping.getGroupNode(newChild);
        groupNodes = group.nodes;

        // optimization: test node position, possible it on right place
        if (currentNewChildGroup === group)
          if (correctSortPos || (isInside && nextSibling === refChild))
            return newChild;

        // calculate newChild position
        if (localSorting)
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
            // when localSorting use binary search
            pos = groupNodes.binarySearchPos(newChildValue, sortingSearch, localSortingDesc);
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
          if (correctSortPos)
            return newChild;

          // search for refChild
          pos = childNodes.binarySearchPos(newChildValue, sortingSearch, localSortingDesc);
          refChild = childNodes[pos];
          newChild.sortingValue = newChildValue; // change sortingValue AFTER search

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

          if (child.autoDelegate == DELEGATE.PARENT)
            child.setDelegate();
        }
        else
          child.destroy();
      }

      // if local grouping, clear groups
      if (this.localGrouping)
      {
        //this.localGrouping.clear();
        var cn = this.localGrouping.childNodes;
        for (var i = cn.length - 1, group; group = cn[i]; i--)
          group.clear();
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
        var listenHandler = this.listen.dataSource;

        this.dataSource = dataSource;

        // detach
        if (oldDataSource)
        {
          this.colMap_ = null;

          if (listenHandler)
            oldDataSource.removeHandler(listenHandler, this);

          if (oldDataSource.itemCount)
            this.clear();
        }

        // TODO: switch off localSorting & localGrouping

        // attach
        if (dataSource)
        {
          this.colMap_ = {};

          if (listenHandler)
          {
            dataSource.addHandler(listenHandler, this);

            if (dataSource.itemCount && listenHandler.datasetChanged)
              listenHandler.datasetChanged.call(this, dataSource, {
                inserted: dataSource.getItems()
              });
          }
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
          if (!grouping)
          {
            //NOTE: it's important to clear locaGrouping before calling fastChildNodesOrder
            //because it sorts nodes in according to localGrouping
            this.localGrouping = null;

            if (this.firstChild)
            {
              order = this.localSorting
                        ? sortChildNodes(this)
                        : this.childNodes;

              for (var i = order.length; i --> 0;)
                order[i].groupNode = null;

              fastChildNodesOrder(this, order);
            }
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
        var oldLocalSorting = this.localSorting;
        var oldLocalSortingDesc = this.localSortingDesc;

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

        this.event_localSortingChanged(this, oldLocalSorting, oldLocalSortingDesc);
      }
    },

   /**
    * @inheritDoc
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
    // const
    DELEGATE: DELEGATE,

    // classes
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
gj   */
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
    classList: classListProxy,

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
// src/basis/date.js
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

!function(basis){

 /**
  * @namespace basis.date
  */
  var namespace = 'basis.date';

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

  // export names

  basis.namespace(namespace).extend({
    isLeapYear: isLeapYear,
    getMonthDayCount: getMonthDayCount,
    format: dateFormat
  });

}(basis);

//
// src/basis/ui.js
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

basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.html');

!function(basis){

  'use strict';

 /**
  * Classes:
  *   {basis.ui.Node}, {basis.ui.Container}, 
  *   {basis.ui.PartitionNode}, {basis.ui.GroupingNode},
  *   {basis.ui.Control}
  *
  * @namespace basis.ui
  */

  var namespace = 'basis.ui';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var Template = basis.html.Template;
  var classList = basis.cssom.classList;
  var getter = Function.getter;
  var Cleaner = basis.Cleaner;

  var DWNode = basis.dom.wrapper.Node;
  var DWPartitionNode = basis.dom.wrapper.PartitionNode;
  var DWGroupingNode = basis.dom.wrapper.GroupingNode;

  //
  // main part
  //

 /**
  *
  */
  var TEMPLATE_ACTION = Class.ExtensibleProperty();

 /**
  * @mixin
  */
  var TemplateMixin = function(super_){
    return {
     /**
      * Template for object.
      * @type {basis.Html.Template}
      */
      template: new Template( // NOTE: explicit template constructor here;
        '<div/>'              //       it could be ommited in subclasses
      ),

     /**
      * Handlers for template actions.
      * @type {Object}
      */
      action: TEMPLATE_ACTION,

     /**
      * Classes for template elements.
      * @type {object}
      */
      cssClassName: null,

     /**
      *
      */
      event_update: function(object, delta){
        this.templateUpdate(this.tmpl, 'update', delta);

        super_.event_update.call(this, object, delta);
      },

     /**
      * @inheritDoc
      */
      event_select: function(node){
        super_.event_select.call(this, node);

        classList(this.tmpl.selected || this.tmpl.content || this.element).add('selected');
      },

     /**
      * @inheritDoc
      */
      event_unselect: function(node){
        super_.event_unselect.call(this, node);

        classList(this.tmpl.selected || this.tmpl.content || this.element).remove('selected');
      },

     /**
      * @inheritDoc
      */
      event_disable: function(node){
        super_.event_disable.call(this, node);

        classList(this.tmpl.disabled || this.element).add('disabled');
      },

     /**
      * @inheritDoc
      */
      event_enable: function(node){
        super_.event_enable.call(this, node);

        classList(this.tmpl.disabled || this.element).remove('disabled');
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
        this.tmpl = {};
        if (this.template)
        {
          this.template.createInstance(this.tmpl, this);
          this.element = this.tmpl.element;

          if (this.tmpl.childNodesHere)
          {
            this.tmpl.childNodesElement = this.tmpl.childNodesHere.parentNode;
            this.tmpl.childNodesElement.insertPoint = this.tmpl.childNodesHere;
          }

          // insert content
          if (this.content)
            DOM.insert(this.tmpl.content || this.element, this.content);
        }
        else
          this.element = this.tmpl.element = DOM.createElement();

        this.childNodesElement = this.tmpl.childNodesElement || this.element;

        // inherit init
        super_.init.call(this, config);

        // update template
        if (this.id)
          this.element.id = this.id;

        var cssClassNames = this.cssClassName;
        if (cssClassNames)
        {
          if (typeof cssClassNames == 'string')
            cssClassNames = { element: cssClassNames };

          for (var alias in cssClassNames)
          {
            var node = this.tmpl[alias];
            if (node)
            {
              var nodeClassName = classList(node);
              var names = String(cssClassNames[alias]).qw();
              for (var i = 0, name; name = names[i++];)
                nodeClassName.add(name);
            }
          }
        }

        /*if (true) // this.template
        {
          var delta = {};
          for (var key in this.data)
            delta[key] = undefined;

          this.event_update(this, delta);
        }*/
        if (this.tmpl)
          this.templateUpdate(this.tmpl);

        if (this.container)
          DOM.insert(this.container, this.element);
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
      * Handler on template actions.
      * @param {string} actionName
      * @param {object} event
      */
      templateUpdate: function(tmpl, eventName, delta){
        /** nothing to do, override it in descendant classes */
      },

     /**
      * @inheritDoc
      */
      destroy: function(){
        var element = this.element;

        super_.destroy.call(this);

        if (element && element.parentNode)
          element.parentNode.removeChild(element);

        if (this.template)
          this.template.clearInstance(this.tmpl, this);

        this.element = null;
        this.tmpl = null;
        this.childNodesElement = null;
      }
    }
  };

 /**
  * @class
  */
  var Node = Class(DWNode, TemplateMixin, {
    className: namespace + '.Node'
  });

 /**
  * @class
  */
  var PartitionNode = Class(DWPartitionNode, TemplateMixin, {
    className: namespace + '.PartitionNode',

    titleGetter: getter('data.title'),

    /*template: new Template(
      '<div{element} class="Basis-PartitionNode">' + 
        '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
        '<div{content|childNodesElement} class="Basis-PartitionNode-Content"/>' + 
      '</div>'
    ),*/

    templateUpdate: function(tmpl, eventName, delta){
      if (tmpl.titleText)
        tmpl.titleText.nodeValue = String(this.titleGetter(this));
    }
  });

 /**
  * Template mixin for containers classes
  * @mixin
  */
  var ContainerTemplateMixin = function(super_){
    return {
      // methods
      insertBefore: function(newChild, refChild){
        // inherit
        var newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var nextSibling = newChild.nextSibling;
        var container = target.childNodesElement || target.element || this.childNodesElement || this.element;

        //var insertPoint = nextSibling && (target == this || nextSibling.groupNode === target) ? nextSibling.element : null;
        var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;

        var element = newChild.element;
        var refNode = insertPoint || container.insertPoint || null;

        if (element.parentNode !== container || element.nextSibling !== refNode) // prevent dom update
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
            if (element.parentNode)
              element.parentNode.removeChild(element);

            node = node.nextSibling;
          }
        }

        // inherit
        super_.clear.call(this, alive);
      },
      setChildNodes: function(childNodes, keepAlive){
        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.localGrouping || this;
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
  var GroupingNode = Class(DWGroupingNode, ContainerTemplateMixin, {
    className: namespace + '.GroupingNode',

   /**
    * @inheritDoc
    */
    childClass: PartitionNode,

   /**
    * @inheritDoc
    */
    localGroupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    event_ownerChanged: function(node, oldOwner){
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
      while (cursor = cursor.localGrouping);

      DWGroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

    init: function(config){
      this.nullElement = DOM.createFragment();
      this.element = this.childNodesElement = this.nullElement;
      DWGroupingNode.prototype.init.call(this, config);
    }
  });

  //GroupingNode.prototype.localGroupingClass = GroupingNode;

 /**
  * @class
  */
  var Container = Class(Node, ContainerTemplateMixin, {
    className: namespace + '.Container',

    childClass: Node,
    childFactory: function(config){
      return new this.childClass(config);
    },

    localGroupingClass: GroupingNode
  });

 /**
  * @class
  */
  var Control = Class(Container, {
    className: namespace + '.Control',

   /**
    * Create selection by default with empty config.
    */
    selection: {},

   /**
    * @inheritDoc
    */
    init: function(config){
      // make document link to itself
      // NOTE: we make it before inherit because in other way
      //       child nodes (passed by config.childNodes) will be with no document
      this.document = this;

      // inherit
      Container.prototype.init.call(this, config);
                   
      // add to basis.Cleaner
      Cleaner.add(this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // selection destroy - clean selected nodes
      if (this.selection)
      {
        this.selection.destroy(); // how about shared selection?
        this.selection = null;
      }

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

  basis.namespace(namespace, simpleTemplate).extend({
    simpleTemplate: simpleTemplate,

    Node: Node,
    Container: Container,
    PartitionNode: PartitionNode,
    GroupingNode: GroupingNode,
    Control: Control
  });

  /*
  basis.namespace('basis.dom.wrapper').extend({
    Control: Control,

    // template classes
    TmplGroupingNode: TmplGroupingNode,
    TmplPartitionNode: TmplPartitionNode,
    TmplNode: TmplNode,
    TmplContainer: TmplContainer,
    TmplControl: Control
  });*/

}(basis);

//
// src/basis/layout.js
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
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.ui');

!function(basis, global){

  'use strict';

 /**
  * @namespace basis.layout
  */

  var namespace = 'basis.layout';

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

      var element = DOM.get(element) || this.element;
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

  var VerticalPanelRule = cssom.cssRule('.Basis-VerticalPanel');
  VerticalPanelRule.setStyle({
    position: 'relative'
  });

  var VerticalPanelStackRule = cssom.cssRule('.Basis-VerticalPanelStack');
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
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    Box: Box,
    Intersection: Intersection,
    Viewport: Viewport,

    VerticalPanel: VerticalPanel,
    VerticalPanelStack: VerticalPanelStack,

    Helper: Helper,
    addBlockResizeHandler: addBlockResizeHandler
  });

}(basis, this);


//
// src/basis/dragdrop.js
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
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.layout');

!function(basis){

  'use strict';

 /**
  * @namespace basis.dragdrop
  */
  var namespace = 'basis.dragdrop';

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

  var EventObject = basis.EventObject;

  var createEvent = EventObject.createEvent;

  var nsWrappers = basis.dom.wrapper;
  var nsLayout = basis.layout;
  var ua = basis.ua;
  
  //
  // Main part
  //

  var isIE = basis.ua.is('IE9-');

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

      // set handlers
      addGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
      addGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
      addGlobalHandler('mousedown', DDEHandler.over, DDEConfig);

      // kill event
      Event.cancelDefault(event);

      // ready to drag start, make other preparations if need
      this.event_prepare(DDEConfig.event);
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

      dde.event_move(DDEConfig.event);
    },
    over: function(event){  // `this` store DDE config
      var dde = DDEConfig.dde;

      // remove document handler if exists
      removeGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
      removeGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
      removeGlobalHandler('mousedown', DDEHandler.over, DDEConfig);

      dde.draging = false;

      if (DDEConfig.run)
        dde.event_over(DDEConfig.event);
      
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
      var element = element && DOM.get(element);
      var trigger = (trigger && DOM.get(trigger)) || element;

      if (this.trigger != trigger)
      {
        if (this.trigger)
        {
          Event.removeHandler(this.trigger, 'mousedown', DDEHandler.start, this);
          if (isIE)
            Event.removeHandler(this.trigger, 'selectstart', DDEHandler.start, this);
        }

        this.trigger = trigger;

        if (this.trigger)
        {
          //if (isIE) Event.kill(this.trigger, 'selectstart'); // ?
          Event.addHandler(this.trigger, 'mousedown', DDEHandler.start, this);
          if (isIE)
            Event.addHandler(this.trigger, 'selectstart', DDEHandler.start, this);
        }
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

  basis.namespace(namespace).extend({
    DragDropElement: DragDropElement,
    MoveableElement: MoveableElement
  });

}(basis);


//
// src/basis/data/property.js
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
basis.require('basis.cssom');
basis.require('basis.data');

!function(){

  'use strict';

 /**
  * Namespace overview:
  * - {basis.data.property.DataObjectSet}
  * - {basis.data.property.AbstractProperty}
  * - {basis.data.property.Property}
  * - {basis.data.property.PropertySet} as aliases for {basis.data.property.DataObjectSet}
  *
  * @namespace basis.data.property
  */

  var namespace = 'basis.data.property';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var Cleaner = basis.Cleaner;

  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var EventObject = basis.EventObject;
  var TimeEventManager = basis.TimeEventManager;
  var event = EventObject.event;
  var createEvent = EventObject.createEvent;

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
    * If object instance of {Basis.EventObject}, property attached handler. This handler
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
      // object must be an Object
      // IE HtmlNode isn't instanceof Object, therefore additionaly used typeof
      if (typeof object != 'object' && object instanceof Object == false)
        throw new Error(EXCEPTION_BAD_OBJECT_LINK);

      // process field name
      if (field == null)
        field = getFieldHandler(object);

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
    *   // for cases when object is instance of {Basis.EventObject} removing link on destroy is not required
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
    * @type {Array.<Basis.Data.DataObject>}
    */
    objects: [],

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
    * @config {Array.<Basis.Data.DataObject>} objects
    * @constructor
    */
    init: function(config){
      var handlers = this.handler;
      delete this.handler;

      Property.prototype.init.call(this, this.value || 0, handlers, this.proxy);

      /*if (typeof config.calculateValue == 'function')
        this.calculateValue = config.calculateValue;*/

      if (this.objects.length)
      {
        var objects = this.objects;
        this.objects = [];
        this.lock();
        this.add.apply(this, objects);
        this.unlock();
      }
      else
        this.objects = [];

      this.valueChanged_ = this.stateChanged_ = !!this.calculateOnInit;
      this.update();

      Cleaner.add(this);
    },

   /**
    * Adds one or more DataObject instances to objects collection.
    * @param {...Basis.Data.DataObject} args
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
    * @param {Basis.Data.DataObject} object
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

  basis.namespace(namespace).extend({
    DataObjectSet: DataObjectSet,
    AbstractProperty: AbstractProperty,
    Property: Property,
    PropertySet: DataObjectSet
  });

}();


//
// src/basis/animation.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.data.property');

!function(basis){

  'use strict';

 /**
  * @namespace basis.animation
  */

  var namespace = 'basis.animation';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var nsWrappers = basis.dom.wrapper;
  var Property = basis.data.property.Property;

  var createEvent = basis.EventObject.createEvent;

  // MAIN PART

  function timePosition(startTime, duration){
    var elapsed = Date.now() - startTime;
    if (elapsed >= duration)
      return 1.0;
    else
      return elapsed/duration;
  }

  var Thread = Class(Property, {
    className: namespace + '.Thread',

    duration: 1000,
    interval: 50,
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

      Property.prototype.init.call(this, config);
    },
    start: function(invertOnStarted){
      if (!this.started)
      {
        this.startTime = Date.now();
        this.started = true;
        this.run();
      }
      else
        if (invertOnStarted)
          this.invert();
    },
    run: function(){
      clearTimeout(this.timer);
      if (this.started)
      {
        var progress = timePosition(this.startTime, this.duration);

        if (progress >= 1.0)
          this.stop();
        else
        {
          this.set(progress);
          this.timer = setTimeout(this.run, this.interval);
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
      clearTimeout(this.timer);
      if (this.started)
      {
        this.started = false;
        this.set(1.0);
      }
    },
    destroy: function(){
      this.stop();
      this.clear();

      Property.prototype.destroy.call();
    }
  });

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

  var FX = {
    CSS: {
      FadeIn: function(thread, element){
        return new Modificator(thread, function(value){ DOM.setStyle(element, { opacity: value }) }, 0, 1);
      },
      FadeOut: function(thread, element){
        return new Modificator(thread, function(value){ DOM.setStyle(element, { opacity: value }) }, 1, 0);
      }
    }
  };

  //
  // export names
  //

  basis.namespace(namespace).extend({
    Thread: Thread,
    Modificator: Modificator,
    FX: FX
  });

}(basis);


//
// src/basis/xml.js
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
basis.require('basis.dom');

!function(basis){

  'use strict';

 /**
  * @namespace basis.xml
  */

  var namespace = 'basis.xml';

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

  basis.namespace(namespace).extend({
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
    XML2Object: XML2Object, //function(){  var d = new Date(); var r = XML2Object.apply(this, arguments); console.log('xml2object', new Date - d, arguments); return r },
    XML2String: XML2String,
    Object2XML: Object2XML
  });

}(basis);


//
// src/basis/crypt.js
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

!function(basis){

 /**
  * @namespace basis.crypt
  */

  var namespace = 'basis.crypt';

  basis.namespace(namespace, setCryptTarget);

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
      var output = new Array();
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      var input = input.replace(/[^a-z0-9\+\/]/ig, '');
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

  /*
   *  Extend Array & String prototypes
   */

  var cryptTarget = '';
  function setCryptTarget(target){
    cryptTarget = target || '';
    return context_;
  }

  var cryptMethods = {
    sha1:    function(useUTF8){ return SHA1(this, useUTF8); },
    sha1hex: function(useUTF8){ return HEX(SHA1(this, useUTF8)); },
    md5:     function(useUTF8){ return MD5(this, useUTF8); },
    md5hex:  function(useUTF8){ return HEX(MD5(this, useUTF8)); },
    base64:  function(useUTF8){ return Base64.encode(this, useUTF8); },
    base64decode: function(useUTF8){ return Base64.encode(this, useUTF8); },
    hex:     function(){ return HEX(this) }
  };

  var context_ = {};
  Object.iterate(cryptMethods, function(name, value){
    context_[name] = function(useUTF8){
      var result = value.call(cryptTarget, useUTF8);
      return cryptTarget = Object.extend(typeof result != 'object' ? Object(result) : result, context_);
    }
  });

  //String.extend(cryptMethods);
  //Array.extend(cryptMethods);

  //
  // export names
  //

  basis.namespace(namespace).extend({
    HEX: HEX,
    SHA1: SHA1,
    MD5: MD5
  });

}(basis);


//
// src/basis/data/dataset.js
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

!function(){

  'use strict';

 /**
  * Namespace overview:
  * - Classes:
  *   {basis.data.dataset.Merge}, {basis.data.dataset.Subtract},
  *   {basis.data.dataset.MapReduce}, {basis.data.dataset.Subset},
  *   {basis.data.dataset.Split}, {basis.data.dataset.Slice}
  *
  * @namespace basis.data.dataset
  */

  var namespace = 'basis.data.dataset';


  //
  // import names
  //

  var Class = basis.Class;

  var extend = Object.extend;
  var values = Object.values;
  var $self = Function.$self;
  var $true = Function.$true;
  var $false = Function.$false;
  var createEvent = basis.EventObject.createEvent;

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
  * @namespace basis.data.Dataset
  */

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
    * Set new operands.
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

      AbstractDataset.prototype.init.call(this, config);

      var source = this.source;
      if (source)
      {
        this.source = null;
        this.setSource(source);
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

  var MAPREDUCE_SOURCEOBJECT_HANDLER = {
    update: function(sourceObject){
      var newMember = this.map ? this.map(sourceObject) : object; // fetch new member ref
      
      if (newMember instanceof DataObject == false || this.reduce(newMember))
        newMember = null;

      var sourceMap = this.sourceMap_[sourceObject.eventObjectId];
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
      var listenHandler = this.listen.sourceObject;

      Dataset.setAccumulateState(true);

      if (delta.inserted)
      {
        for (var i = 0; sourceObject = delta.inserted[i]; i++)
        {
          member = this.map ? this.map(sourceObject) : sourceObject;

          if (member instanceof DataObject == false || this.reduce(member))
            member = null;

          if (listenHandler)
            sourceObject.addHandler(listenHandler, this);

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

          if (listenHandler)
            sourceObject.removeHandler(listenHandler, this);

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
    rule: $true,

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
      sourceObject: MAPREDUCE_SOURCEOBJECT_HANDLER,
      source: MAPREDUCE_SOURCE_HANDLER
    },

    // no special init

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

    // no special destroy
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
    * @inheritDoc
    */
    map: function(sourceObject){
      return this.keyMap.resolve(sourceObject);
    },

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
  // Slice
  //

  function binarySearchPos(array, map){ 
    if (!array.length)  // empty array check
      return 0;

    var pos;
    var value;
    var cmpValue;
    var l = 0;
    var r = array.length - 1;

    do 
    {
      pos = (l + r) >> 1;

      cmpValue = array[pos].value || 0;
      if (cmpValue === value)
      {
        cmpValue = array[pos].object.eventObjectId;
        value = map.object.eventObjectId;
      }
      else
        value = map.value || 0;

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

  var SLICE_SOURCEOBJECT_HANDLER = {
    update: function(sourceObject){
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
    }
  };

  var SLICE_SOURCE_HANDLER = {
    datasetChanged: function(source, delta){
      var sourceMap_ = this.sourceMap_;
      var index_ = this.index_;
      var listenHandler = this.listen.sourceObject;
      var sourceObjectInfo;
      var array;

      if (array = delta.inserted)
        for (var i = 0, sourceObject; sourceObject = array[i]; i++)
        {
          sourceObjectInfo = {
            object: sourceObject,
            value: this.rule(sourceObject)
          };
          sourceMap_[sourceObject.eventObjectId] = sourceObjectInfo;

          index_.splice(binarySearchPos(index_, sourceObjectInfo), 0, sourceObjectInfo);

          if (listenHandler)
            sourceObject.addHandler(listenHandler, this);
        }

      if (array = delta.deleted)
        for (var i = 0, sourceObject; sourceObject = array[i]; i++)
        {
          sourceObjectInfo = sourceMap_[sourceObject.eventObjectId];

          index_.splice(binarySearchPos(index_, sourceObjectInfo), 1);

          if (listenHandler)
            sourceObject.removeHandler(listenHandler, this);
        }

      this.applyRule();
    }
  };

 /**
  * @class
  */
  var Slice = Class(AbstractDataset, SourceDatasetMixin, {
    className: namespace + '.Slice',

   /**
    * Ordering items function.
    * @type {function(basis.data.DataObject)}
    * @readonly
    */
    rule: $true,

   /**
    * Calculated source object values
    * @type {}
    * @private
    */
    index_: null,

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
      sourceObject: SLICE_SOURCEOBJECT_HANDLER,
      source: SLICE_SOURCE_HANDLER
    },

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
    */
    setRange: function(offset, limit){
      this.offset = offset;
      this.limit = limit;

      this.applyRule();
    },

    applyRule: function(){
      var curSet = Object.slice(this.item_);
      var newSet = this.index_.slice(this.offset, this.offset + this.limit);
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

  var CLOUD_SOURCEOBJECT_HANDLER = {
    update: function(sourceObject, delta){
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
    }
  };

  var CLOUD_SOURCE_HANDLER = {
    datasetChanged: function(dataset, delta){
      var sourceMap = this.sourceMap_;
      var memberMap = this.memberMap_;
      var listenHandler = this.listen.sourceObject;
      var objectInfo;
      var array;
      var subset;
      var subsetId;
      var inserted = [];
      var deleted = [];

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
              subset = this.keyMap.resolve(list[j]);

              if (subset)
              {
                subset.event_datasetChanged(subset, { inserted: [sourceObject] });
                subsetId = subset.eventObjectId;
                sourceObjectInfo.list[subsetId] = subset;

                if (!memberMap[subsetId])
                {
                  inserted.push(subset);
                  memberMap[subsetId] = 1;
                }
                else
                  memberMap[subsetId]++;
              }
            }

          if (listenHandler)
            sourceObject.addHandler(listenHandler, this);
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

          if (listenHandler)
            sourceObject.removeHandler(listenHandler, this);
        }

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
    * @type {function(basis.data.DataObject)}
    */
    rule: $true,

   /**
    * @inheritDoc
    */
    map: $self,

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
    listen: {
      sourceObject: CLOUD_SOURCEOBJECT_HANDLER,
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

  basis.namespace(namespace).extend({
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

}(basis, this);


//
// src/basis/data/index.js
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
basis.require('basis.data.dataset');
basis.require('basis.data.property');

!function(basis){

  'use strict';

 /**
  * @namespace basis.data.index
  */
  var namespace = 'basis.data.index';

  var Class = basis.Class;
  var TimeEventManager = basis.TimeEventManager;
  
  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var KeyObjectMap = nsData.KeyObjectMap;
  var Property = nsData.property.Property;

  var AbstractDataset = nsData.AbstractDataset;
  var MapReduce = nsData.dataset.MapReduce;

  //
  // IndexedDataset
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
    * @type {function(object):any}
    */
    valueGetter: Function.$null,

   /**
    * @type {Basis.Data.AbstractDataset}
    */
    dataSource: null,
    
   /**
    * @constructor
    */
    init: function(valueGetter){
      Property.prototype.init.call(this, this.value || 0);

      this.indexCache_ = {};
      this.valueGetter = valueGetter;
    },

   /**
    * Set data source
    * @param {Basis.Data.AbstractDataset} dataSource
    */
    /*setDataSource: function(dataSource){
      if (dataSource instanceof AbstractDataset == false)
        dataSource = null;

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;
        this.dataSource = dataSource;

        if (oldDataSource)
        {
          this.indexCache_ = null;
          getIndexController(oldDataSource).remove(this);
          this.reset();  // Q: should we avoid unnecessary updates?
        }

        if (dataSource)
        {
          this.indexCache_ = {};
          getIndexController(dataSource).add(this);
        }
        else
        {
          if (this.autoDestroy)
            this.destroy();
        }

        // data source changed event?
      }
    },*/

   /**
    * Add value to index
    */
    add: function(item, value){
    },
   /**
    * Remove value to index
    */
    remove: function(item, value){
    },

   /**
    * Change value
    */
    upd: function(item, newValue, oldValue){
    }

   /**
    * @destructor
    */
    /*destroy: function(){
      Property.prototype.destroy.call(this);

      // drop datasource
      this.setDataSource();
    }*/
  });

 /**
  * @class
  */
  var IndexSum = Class(Index, {
    className: namespace + '.Sum',
    add: function(item, value){
      this.value += value;
    },
    remove: function(item, value){
      this.value -= value;
    },
    upd: function(item, newValue, oldValue){
      this.set(this.value + newValue - oldValue);
    }
  });

 /**
  * @class
  */
  var IndexAvg = Class(Index, {
    className: namespace + '.Avg',
    sum_: 0,
    count_: 0,

    add: function(item, value){
      this.sum_ += value;
      this.count_ += 1;
      this.value = this.sum_/this.count_;
    },
    remove: function(item, value){
      this.sum_ -= value;
      this.count_ -= 1;
      this.value = this.count_ ? this.sum_/this.count_ : 0;
    },
    upd: function(item, newValue, oldValue){
      this.sum_ += newValue - oldValue;
      this.set(this.sum_/this.count_);
    }
  });

 /**
  * @class
  */
  var IndexCount = Class(Index, {
    className: namespace + '.Count',
    valueGetter: Function.$true,
    add: function(item, value){
      if (value)
        this.value += 1;
    },
    remove: function(item, value){
      if (value)
        this.value -= 1;
    },
    upd: function(item, newValue, oldValue){
      this.set(this.value + (newValue ? 1 : -1));
    }
  });

 /**
  * @class
  */
  var IndexMax = Class(Index, {
    className: namespace + '.Max',
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(binarySearchPos(this.stack, value), 0, value);
      this.value = this.stack[this.stack.length - 1];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[this.stack.length - 1];
    },
    upd: function(item, newValue, oldValue){
      //this.stack.remove(oldValue);
      this.stack.splice(binarySearchPos(this.stack, oldValue), 1);
      this.stack.splice(binarySearchPos(this.stack, newValue), 0, newValue);
      this.set(this.stack[this.stack.length - 1]);
    }
  });

 /**
  * @class
  */
  var IndexMin = Class(Index, {
    className: namespace + '.Min',
    init: function(valueGetter, dataSource){
      this.stack = [];
      Index.prototype.init.call(this, valueGetter, dataSource);
    },
    add: function(item, value){
      this.stack.splice(binarySearchPos(this.stack, value), 0, value);
      this.value = this.stack[0];
    },
    remove: function(item, value){
      this.stack.remove(value);
      this.value = this.stack[0];
    },
    upd: function(item, newValue, oldValue){
      //this.stack.remove(oldValue);
      this.stack.splice(binarySearchPos(this.stack, oldValue), 1);
      this.stack.splice(binarySearchPos(this.stack, newValue), 0, newValue);
      this.set(this.stack[0]);
    }
  });

  var indexConstructorCache_= {};

  function IndexConstructor(getter, indexClass){
    getter = Function.getter(getter);

    var key = indexClass.indexClassId + '_' + getter.getterIdx_;
    var indexConstructor = indexConstructorCache_[key];

    if (!indexConstructor)
    {
      indexConstructor = indexConstructorCache_[key] = this;
      
      this.indexClass = indexClass;
      this.getter = getter;
      this.key = key;
      
      this.createInstance = function(dataset){
        if (dataset instanceof AbstractDataset)
        {
          var result = dataset.indexes && dataset.indexes[key];

          if (!result)
          {
            result = new indexClass(getter);
            result.addHandler(DATASET_INDEX_HANDLER, dataset);
            result.key = key;
          }

          return result;
        }
      }
    }

    return indexConstructor;
  }

  var indexClassId = 1;
  var createIndexConstructor = function(indexClass){
    indexClass.indexClassId = indexClassId++;
    return function(getter){
      return new IndexConstructor(getter, indexClass);
    }
  }

  var Sum   = createIndexConstructor(IndexSum);
  var Avg   = createIndexConstructor(IndexAvg);
  var Count = createIndexConstructor(IndexCount);
  var Min   = createIndexConstructor(IndexMin);
  var Max   = createIndexConstructor(IndexMax);



  /*AbstractDataset.prototype.createIndex = function(indexContructor){
    return new indexContructor.indexClass(indexContructor.getter, this);
  } */


  function applyIndexDelta(index, inserted, deleted){
    var cache = index.indexCache_;
    index.lock();

    if (inserted)
      for (var i = 0, object; object = inserted[i++];)
      {
        var newValue = index.valueGetter(object);
        cache[object.eventObjectId] = newValue;
        index.add(object, newValue);
      }

    if (deleted)
      for (var i = 0, object; object = deleted[i++];)
      {
        index.remove(object, cache[object.eventObjectId]);
        delete cache[object.eventObjectId];
      }

    index.unlock();
  }


  var INDEX_ITEM_UPDATE = function(object, delta){
    var oldValue;
    var newValue;
    var index;
    var objectId = object.eventObjectId;

    for (var i in this.indexes)
    {
      index = this.indexes[i];
      // fetch oldValue
      oldValue = index.indexCache_[objectId];

      // calc new value
      newValue = index.valueGetter(object);

      // update if value has changed
      if (newValue !== oldValue)
      {
        index.upd(object, newValue, oldValue);
        index.indexCache_[objectId] = newValue;
      }
    }
  };

  var INDEX_ITEM_HANDLER = {
    update: INDEX_ITEM_UPDATE,
    datasetChanged: INDEX_ITEM_UPDATE
  };

  var DATASET_WITH_INDEX_HANDLER = {
    datasetChanged: function(object, delta){
      // add handler to new source object
      if (delta.inserted)
        for (var i = 0, object; object = delta.inserted[i++];)
          object.addHandler(INDEX_ITEM_HANDLER, this);

      // remove handler from old source object
      if (delta.deleted)
        for (var i = 0, object; object = delta.deleted[i++];)
          object.removeHandler(INDEX_ITEM_HANDLER, this);

      // apply changes for indexes
      for (var j in this.indexes)
        applyIndexDelta(this.indexes[j], delta.inserted, delta.deleted);
    },
    
    destroy: function(){
      for (var i in this.indexes)
        this.indexes[i].destroy();
    }
  };

  var DATASET_INDEX_HANDLER = {
    destroy: function(object){
      this.removeIndex(object);
    }
  };

  AbstractDataset.prototype.createIndex = function(indexConstructor){
    if (indexConstructor instanceof IndexConstructor == false)
    {
      /** @cut */ if (typeof console != 'undefined') console.warn('indexConstructor must be an instance of IndexConstructor');
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

    var key = indexConstructor.key;
    if (!this.indexes[key])
    {
      var index = indexConstructor.createInstance(this);

      this.indexes[key] = index;

      applyIndexDelta(index, this.getItems());
    }

    return this.indexes[key]; 
  }

  AbstractDataset.prototype.removeIndex = function(index){
    if (this.indexes && this.indexes[index.key])
    {
      delete this.indexes[index.key];

      //index.removeHandler(DATASET_INDEX_HANDLER);
      index.destroy();

      for (var key in this.indexes)
        return;

      this.removeHandler(DATASET_WITH_INDEX_HANDLER);
      delete this.indexes;
    }
  }

 /**
  * @class
  */
  var IndexMap = Class(MapReduce, {
    className: namespace + '.IndexMap',

    calcs: null,

    indexes: null,
    indexes_: null,

    timer_: null,
    indexUpdated: null,
    memberSourceMap: null,
    keyMap: null,

    event_sourceChanged: function(dataset, oldSource){
      MapReduce.prototype.event_sourceChanged.call(this, dataset, oldSource);
      
      var index;

      for (var indexName in this.indexes_)
      {
        index = this.indexes_[indexName];
        if (oldSource)
        { 
          this.removeIndex(indexName);
          oldSource.removeIndex(this.indexes[indexName]);
        }

        if (this.source)
          this.addIndex(indexName, this.source.createIndex(index));
      }
    },

    listen: {
      sourceObject: {
        update: function(sourceObject, delta){
          MapReduce.prototype.listen.sourceObject.update.call(this, sourceObject, delta);

          this.sourceMap_[sourceObject.eventObjectId].updated = true;
          this.fireUpdate();
        }
      },
      index: {
        change: function(value){
          var indexMap = this.indexMap;

          indexMap.indexValues[this.key] = value;
          indexMap.indexUpdated = true;
          indexMap.fireUpdate();
        }
      },
      member: {
        subscribersChanged: function(object, oldCount){
          if (object.subscriberCount > 0 && oldCount == 0)
            this.calcMember(object);
        }
      }
    },

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

    init: function(config){
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
            index = this.source && this.source.createIndex(index);
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
      this.fireUpdate();
    },
    removeCalc: function(name){
      delete this.calcs[name];
    },

    lock: function(){
      Object.values(this.indexes).forEach(function(idx){
        idx.lock();
      });
    },
    unlock: function(){
      Object.values(this.indexes).forEach(function(idx){
        idx.unlock();
      });
    },

    fireUpdate: function(){
      if (!this.timer_)
      {
        this.timer_ = true;
        TimeEventManager.add(this, 'apply', Date.now());
      }
    },

    apply: function(){
      for (var idx in this.item_)
        this.calcMember(this.item_[idx]);

      this.indexUpdated = false;
      this.timer_ = false;
    },

    calcMember: function(member){
      var sourceObject = this.sourceMap_[this.memberSourceMap[member.eventObjectId]];

      if (member.subscriberCount && (sourceObject.updated || this.indexUpdated))
      {
        sourceObject.updated = false;

        var data = {};
        var newValue;
        var update;
        for (var calcName in this.calcs)
        {
          newValue = this.calcs[calcName](sourceObject.sourceObject.data, this.indexValues, sourceObject.sourceObject);
          if (member.data[calcName] !== newValue && (!isNaN(newValue) || !isNaN(member.data[calcName])))
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
      this.timer_ = null;
      this.calcs = null;
      this.indexUpdated = null;
      this.memberSourceMap = null;
      this.indexesBind_ = null;

      this.keyMap.destroy();
      this.keyMap = null;

      for (var indexName in this.indexes)
        this.removeIndexConstructor(indexName);

      MapReduce.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    IndexConstructor: IndexConstructor,
    Index: Index,
    Sum: Sum,
    Avg: Avg,
    Count: Count,
    Max: Max,
    Min: Min,
    IndexMap: IndexMap
  });

}(basis);

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
basis.require('basis.data.dataset');

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
// src/basis/session.js
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

!function(basis){

  'use strict';

 /**
  * @namespace basis.session
  */

  var namespace = 'basis.session';

  // import names

  var Class = basis.Class;
  var extend = Object.extend;

  var EventObject = basis.EventObject;

  var createEvent = EventObject.createEvent;

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

  basis.namespace(namespace).extend({
    SessionManager: SessionManager
  });

}(basis);


//
// src/basis/net/ajax.js
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
basis.require('basis.dom.event');
basis.require('basis.data');

!function(basis){

  'use strict';

  /** @namespace basis.net.ajax */

  var namespace = 'basis.net.ajax';

  // import names

  var Class = basis.Class;
  var Event = basis.dom.event;

  var Browser = basis.ua;
  var Cookies = basis.ua.Cookies;
  var Cleaner = basis.Cleaner;

  var TimeEventManager = basis.TimeEventManager;

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

  var DEBUG_MODE = Cookies.get('DEBUG_AJAX');

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
  * @function createEvent
  */
  function createEvent(eventName){
    var event = basis.EventObject.createEvent(eventName);
    var args = [eventName];
    return function(){
      TransportDispatcher.dispatch.apply(this, args.concat(arguments));
      event.apply(this, arguments);
    }
  }

 /**
  * @function createTransport
  * Creates transport constructor
  */
  var XHRSupport = 'native';
  var createTransport = function(){

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

  //
  // TransportDispatcher
  //

  var TransportDispatcher = (function(){

    var inprogressTransports = new Array();
    var handlers = [
      {
        handler: {
          start: function(){
            //console.log('add transport', this);
            inprogressTransports.add(this);
          },
          complete: function(){
            //console.log('remove transport', this);
            inprogressTransports.remove(this);
          }
        }
      }
    ];

    // clear handlers on destroy
    Event.onUnload(function(){
      handlers.clear();
    });

    return {
      addHandler: function(handler, thisObject){
        // search for duplicate
        for (var i = 0, item; item = handlers[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
            return false;

        // add handler
        handlers.push({ 
          handler: handler,
          thisObject: thisObject
        });

        return true;
      },
      removeHandler: function(handler, thisObject){
        // search for handler and remove
        for (var i = 0, item; item = handlers[i]; i++)
          if (item.handler === handler && item.thisObject === thisObject)
          {
            handlers.splice(i, 1);
            return true;
          }

        // handler not found
        return false;
      },
      dispatch: function(event){
        // self event dispatch
        if (handlers.length)
        {
          var args = Array.prototype.slice.call(arguments, 1);
          var item, handler;
          for (var i = handlers.length - 1; item = handlers[i]; i--)
          {
            handler = item.handler[event];
            if (typeof handler == 'function')
              handler.apply(item.thisObject || this, args)
          }
        }
      },
      abort: function(){
        var result = Array.from(inprogressTransports);
        for (var i = 0; i < result.length; i++)
          result[i].abort();
        return result;
      }
    };
  })();

 /**
  * Sets transport request headers
  * @private
  */
  function setRequestHeaders(transport, requestData){
    var headers = {
      'JS-Framework': 'Basis'
    };

    if (IS_POST_REGEXP.test(requestData.method)) 
    {
      headers['Content-Type'] = requestData.contentType + (requestData.encoding ? '\x3Bcharset=' + requestData.encoding : '');
      if (Browser.test('gecko'))
        headers['Connection'] = 'close';
    }
    else
      if (Browser.test('ie')) // disable IE caching
        headers['If-Modified-Since'] = new Date(0).toGMTString();

    Object.iterate(Object.extend(headers, requestData.headers), function(key, value){
      if (value != null)
        this.setRequestHeader(key, value);
    }, transport);
  };

 /**
  * readyState change handler
  * private method
  * @function readyStateChangeHandler
  */
  function readyStateChangeHandler(readyState){
    var transport = this.transport;

    if (!transport)
      return;

    if (typeof readyState != 'number')
      readyState = transport.readyState;

    // BUGFIX: IE & Gecko fire OPEN readystate twice
    if (readyState == this.prevReadyState_)
      return;
    else
      this.prevReadyState_ = readyState;

    ;;;if (this.debug) logOutput('State: (' + readyState + ') ' + ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'][readyState]);

    // dispatch self event
    this.event_readyStateChanged(readyState);

    if (readyState == STATE_DONE)
    {
      TimeEventManager.remove(this, 'timeoutAbort');

      var newState = STATE.UNDEFINED;
      var error;

      // progress over (otherwise any abort method call may occur double readyStateChangeHandler call)
      this.progress = false;

      // clean event handler
      transport.onreadystatechange = Function.$undef;

      // case abort, success, fault
      if (this.aborted)
      {
        var abortedByTimeout = this.abortedByTimeout_;

        if (abortedByTimeout)
          this.event_timeout();

        // dispatch event
        this.event_abort(abortedByTimeout);

        ;;;if (this.debug) logOutput('Request aborted' + (abortedByTimeout ? ' (timeout)' : ''));
      }
      else
      {
        var isSuccess = this.responseIsSuccess();

        this.update({
          text: transport.responseText,
          xml: transport.responseXML
        });

        // dispatch events
        if (isSuccess)
        {
          this.event_success(transport);
          newState = STATE.READY;
        }
        else
        {
          this.event_failure(transport);
          newState = STATE.ERROR;
          error = this.getRequestError(transport);
        }

        // dispatch status
        this.event_httpStatus(transport, transport.status);
      }

      // dispatch complete event
      this.event_complete(transport);

      // set new state
      this.setState(newState, error);
    }
    else
      this.setState(STATE.PROCESSING);

    // dispatch event
    // there is not need any more
    // this.dispatch('state' + state);
  };

  function doRequest(requestData){
    TimeEventManager.remove(this, 'timeoutAbort'); // ???

    // set flags
    this.progress = false;
    this.aborted = false;
    this.abortedByTimeout_ = false;
    this.prevReadyState_ = -1;

    // create new XMLHTTPRequest instance for gecko browsers in asynchronous mode
    // object crash otherwise
    if (Browser.test('gecko1.8.1-') && requestData.asynchronous)
    {
      ;;;if (typeof console != 'undefined') console.info('Recreate transport (fix for current gecko version)');
      this.transport = createTransport();
    }

    var transport = this.transport;

    if (this.asynchronous)
      // set ready state change handler
      transport.onreadystatechange = readyStateChangeHandler.bind(this);
    else
      // catch state change for 'loading' in synchronous mode
      readyStateChangeHandler.call(this, STATE_UNSENT);

    // open transport
    transport.open(requestData.method, requestData.location, requestData.asynchronous);
    this.progress = true;
    this.aborted = false;
    this.abortedByTimeout_ = false;

    // set headers
    setRequestHeaders(transport, requestData);

    // progress started
    this.event_start();
    if (this.aborted)
    {
      ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted while `start` event dispatch');
      readyStateChangeHandler.call(this, STATE_DONE);
      return;  // request aborted
    }

    if (this.aborted || !this.progress)
    {
      ;;;if (this.debug && typeof console != 'undefined') console.warn('Transport: request was aborted while response to readyState change dispatch');
      return;
    }

    // save transfer start point time & set timeout
    this.requestStartTime = Date.now();
    TimeEventManager.add(this, 'timeoutAbort', this.requestStartTime + this.timeout);

    // prepare post body
    var postBody = requestData.postBody;

    // BUGFIX: IE fixes for post body
    if (requestData.method == 'POST' && Browser.test('ie9-'))
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
            postBody = '[empty request]';      
    }

    // send data
    transport.send(postBody);

    // catching for
    //   - 'complete' state in synchronous mode
    //   - 'loading'  state for Opera
    /*if (!this.asynchronous)
    {
      var readyState = transport.readyState;
      while (readyState++ < STATE_DONE)
        readyStateChangeHandler.call(this, readyState);
    }*/

    ;;;if (this.debug) logOutput('Request over, waiting for response');

    return true;
  }

  //
  // Transport
  //

 /**
  * @class
  */
  var Transport = Class(DataObject, {
    className: namespace + '.Transport',

    state:     STATE.UNDEFINED,

    event_start: createEvent('start'),
    event_readyStateChanged: createEvent('readyStateChanged'),
    event_timeout: createEvent('timeout'),
    event_abort: createEvent('abort'),
    event_success: createEvent('success'),
    event_failure: createEvent('failure'),
    event_httpStatus: createEvent('httpStatus'),
    event_complete: createEvent('complete'),

    event_stateChanged: function(object, oldState){
      DataObject.prototype.event_stateChanged.call(this, object, oldState);

      for (var i = 0; i < this.influence.length; i++)
        this.influence[i].setState(this.state, this.state.data);
    },

    influence: null,
    debug: DEBUG_MODE,

    // object states
    progress: false,
    aborted: false,
    abortedByTimeout_: false,
    abortCalled: false,

    // times
    timeout:  30000, // 30 sec

    requestStartTime: 0,

    requestData_: null,

    // transport properties
    asynchronous: true,
    method: DEFAULT_METHOD,
    contentType: DEFAULT_CONTENT_TYPE,
    encoding: null,

    //
    // constructor
    //
    init: function(config){
      var influence = this.influence;

      // transport object
      this.transport = createTransport();
      this.requestHeaders = {};
      this.influence = new Array();

      // request params
      this.params = {};

      // transport transfer properties

      if (influence)
        this.setInfluence.apply(this, influence);

      Cleaner.add(this);  // ???

      // create inherit

      DataObject.prototype.init.call(this, config);

      // handlers
      if (this.callback)
        this.addHandler(this.callback, this);
    },

    setInfluence: function(){
      var list = Array.from(arguments);
      for (var i = 0; i < list.length; i++)
        list[i].setState(this.state, this.state.data);
      this.influence.set(list);
    },
    clearInfluence: function(){
      this.influence.clear();
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

    //
    // Event handlers
    //
    /*dispatch: function(eventName){
      // global event dispatch
      TransportDispatcher.dispatch.apply(this, arguments);
      //this.inherit.apply(this, arguments);
      DataObject.prototype.dispatch.apply(this, arguments);
    },*/

    //
    // Main actions
    //

    timeoutAbort: function(){
      this.abortedByTimeout_ = true;
      this.abort();
    },

    // abort request
    abort: function(timeout){
      ;;;if (this.debug && typeof console != 'undefined') console.info('Transport: abort method called');

      this.aborted = true;

      if (!this.progress)
        return;

      TimeEventManager.remove(this, 'timeoutAbort');

      this.progress = false;
      this.transport.abort();

      // BUGFIX: catching for 'Complete' state in asynchronous mode
      if (this.asynchronous && this.transport.onreadystatechange && this.transport.onreadystatechange !== Function.$undef)
        readyStateChangeHandler.call(this, STATE_DONE);
    },

    // do request
    request: function(url){
      //debugger;
      var location = url || this.url;
      var method = this.method.toUpperCase();
      var params;
      var postBody;
      var transport = this.transport;

      if (!transport)
        throw new Error('Transport is not allowed');

      if (!location)
        throw new Error('URL is not defined');

      // abort request for double sure that it doesn't in progress
      this.abort();

      // reset requestData & stored info
      delete this.requestData_;
      this.update({
        responseText: '',
        responseXml: null
      });

      this.progress = false;
      this.aborted = false;
      this.abortedByTimeout_ = false;

      // dispatch prepare event
      //this.dispatch('prepare');
      /*var handlers = this.handlers_;
      if (handlers)
      {
        var handler;
        for (var i = handlers.length; i --> 0;)
        {
          handler = handlers[i];
          if (handler.handler.prepare)
            handler.handler.prepare.call(handler.thisObject || this);
        }
      }

      if (this.aborted)
      {
        ;;;if (this.debug && typeof console != 'undefined') console.info('Transport: request was aborted while `prepare` event dispatch');
        //this.dispatch('abort', false);
        return;
      }*/

      // prepare url
      params = Object.iterate(this.params, function(key, value){
        return (value == null) || (value && typeof value.toString == 'function' && value.toString() == null)
          ? null
          : key + '=' + String(value.toString()).replace(/[\%\=\&\<\>\s\+]/g, function(m){ var code = m.charCodeAt(0).toHex(); return '%' + (code.length < 2 ? '0' : '') + code })//Encode.escape(basis.Crypt.UTF8.fromUTF16(value.toString()))
      }).filter(Function.$isNotNull).join('&');

      // prepare location & postBody
      if (IS_POST_REGEXP.test(method))
      {
        postBody = this.postBody || params || '';
      }
      else
      {
        if (params)
          location += (location.indexOf('?') == -1 ? '?' : '&') + params;
      }

      this.requestData_ = {
        method: method,
        location: location,
        contentType: this.contentType,
        encoding: this.encoding,
        asynchronous: this.asynchronous,
        headers: Object.extend({}, this.requestHeaders),
        postBody: postBody
      };

      return doRequest.call(this, this.requestData_);
    },

    repeat: function(){
      if (this.requestData_)
      {
        this.abort();
        return doRequest.call(this, this.requestData_);
      }
    },

    get: function(){
      this.request.apply(this, arguments);
    },

    // response status
    responseIsSuccess: function(){
      try {
        if (!this.aborted)
        {
          var status = this.transport.status;
          return (status == undefined)
              || (status == 0)
              || (status >= 200 && this.transport.status < 300);
        }
      } catch(e) {
      }
      return false;
    },

    getRequestError: function(req){
      return {
        code: 'SERVER_ERROR',
        msg: req.responseText
      }
    },

    destroy: function(){
      this.destroy = Function.$undef;

      delete this.requestData_;
      this.transport.onreadystatechange = Function.$undef;
      this.transport.abort();

      this.clearInfluence();

      DataObject.prototype.destroy.call(this);

      delete this.transport;
      Cleaner.remove(this);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    Transport: Transport,
    TransportDispatcher: TransportDispatcher,
    createEvent: createEvent
  });

}(basis);


//
// src/basis/net/soap.js
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
basis.require('basis.xml');
basis.require('basis.net.ajax');

!function(basis){

  'use strict';

 /**
  * Interface for communication with SOAP services.
  *
  * @see ./demo/ajax/soap-simple.html
  * @see ./demo/ajax/soap-list.html
  *
  * @namespace basis.net.soap
  */

  var namespace = 'basis.net.soap';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var nsAjax = basis.net.ajax;
  var XML = basis.xml;

  var Transport = nsAjax.Transport;

  var QName = XML.QName;
  var addNamespace = XML.addNamespace;
  var XML2Object = XML.XML2Object;
  var Object2XML = XML.Object2XML;
  var createElementNS = XML.createElementNS;
  var NAMESPACE = XML.NAMESPACE;

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

  
  //
  //  Service / ServiceCall / ServiceCallTransport
  //

 /**
  * @class
  */
  var Service = Class(null, {
    className: namespace + '.Service',

   /**
    * @type {string}
    * @readonly
    */
    url: null,

   /**
    * @type {string}
    * @readonly
    */
    namespace: null,

   /**
    * @contructor
    */
    init: function(url, namespace){
      this.url = url;
      this.namespace = namespace;
    },

   /**
    * @param {string} method
    * @param {object} config
    */
    call: function(method, config){
      var method = this.createMethodCall(method, config, false);
      method.transport.abort();
      method.invoke(config.header, config.body, config.callback, config.mapping);
    },

   /**
    * @param {string} method
    * @param {object} config
    * @return {basis.soap.ServiceCall} Return new ServiceCall instance
    */
    createMethodCall: function(method, config, staticData){
      return new ServiceCall(this, new QName(method, this.namespace), config, staticData);
    }

   /**
    * @destructor
    */
  });

 /**
  * @class
  */
  var ServiceCall = Class(null, {
    className: namespace + '.ServiceCall',

   /**
    * @type {basis.soap.Service}
    */
    service: null,

   /**
    * @type {basis.soap.ServiceCallTransport}
    * @readonly
    */
    transport: null,

   /**
    * @type {basis.xml.QName}
    */
    method: null,

   /**
    * Request envelope
    * @type {basis.soap.Envelope}
    * @private
    */
    envelope: null,

   /**
    * Request body content
    * @type {Object}
    */
    body: null,

   /**
    * @constructor
    */
    init: function(service, method, config, staticData){
      config = config || {};

      //this.service = service;
      this.method = method;
      this.envelope = new Envelope();

      this.url = service.url;

      // transport
      this.transport = new ServiceCallTransport(method, config.callback);
      //this.transport.completeRequest = Object.coalesce(config.completeRequest, false);
      this.transport.requestHeaders = { SOAPAction: (method.namespace + (!/\/$/.test(method.namespace) ? '/' : '') + method) };

      this.transport.requestEnvelope = this.envelope;
      this.transport.postBody = this.envelope.document;
      this.transport.url = {
        toString: function(){
          return service.url;
        }
      }

      if (config.mapping)  this.transport.setMapping(config.mapping);
      if (config.callback) this.transport.setCallback(config.callback);

      if (staticData)
      {
        this.body = config.body || {};
      }
    },
    repeatCall: function(){
      this.transport.get(); // this.service.url
    },
    call: function(body){
      return this.invoke(null, body || this.body);
    },
    invoke: function(headerData, bodyData, callback, mapping){
      this.transport.abort();

      this.envelope.getBody(true).setValue(this.method, bodyData);

      if (headerData)
        this.envelope.getHeader(true).setValue(headerData, this.method.namespace);

      if (callback)
        this.transport.setCallback(callback);

      if (mapping)
        this.transport.setMapping(mapping);

      this.transport.get(); // this.service.url
    },
    destroy: function(){
      this.destroy = Function.$undef;

      this.transport.destroy();
      this.envelope.destroy();

      this.contructor.prototype.destroy.call(this);
      //this.inherit();
    }
  });

  //
  // Service call transport
  //

 /**
  * @class
  */
  var ServiceCallTransport = Class(Transport, {
    className: namespace + '.ServiceCallTransport',
    callback: {},
    mapping: null,

    method: 'POST',
    contentType: 'text/xml',
    encoding: 'utf-8',

    event_success: function(request){
      var xml = request.responseXML;
      if (xml === undefined || xml.documentElement === undefined)
      {
        //eventName = 'failure';
        //Transport.prototype.event_failure.call(this, arguments);
        this.event_failure(this);
      }
      else
      {
        var args = Array.from(arguments);

        if (xml.xml && DOMParser)
        {
          var parser = new DOMParser();
          xml = parser.parseFromString(xml.xml, "text/xml");
        }

        this.responseEnvelope = new Envelope(xml.documentElement);
        //this.responseData = XML2Object(this.responseEnvelope.element, this.mapping);
      
        args.push(
          this.getResponseData(),
          this.getRequestData()
        );

        Transport.prototype.event_success.apply(this, args);
      }
    },
    event_failure: function(request){
      var args = Array.from(arguments);

      var error = this.state.data || this.getRequestError(request);
      if (error.isSoapFailure)
        this.event_soapfailure(request, error.code, error.msg);
        //nsAjax.TransportDispatcher.dispatch.call(this, 'soapfailure', error.code, error.msg);

      args.push(
        error.code,
        error.msg
      );

      Transport.prototype.event_failure.apply(this, args);
    },
    event_soapfailure: nsAjax.createEvent('soapfailure'),

    /*behaviour: {
      failure: function(req, code, message){
      }
    },*/

    requestDataGetter: Function.$self,
    responseDataGetter: Function.$self,

    errorCodeGetter: function(node){
      return DOM.tag(node, 'code')[0];
    },
    errorMessageGetter: function(node){
      return DOM.tag(node, 'message')[0];
    },

    extendConstructor_: false,
    init: function(soapMethod, callback){
      //this.inherit();
      Transport.prototype.init.call(this);
      this.soapMethod = soapMethod;
    },
    /*dispatch: function(eventName, request){
      var args = Array.from(arguments);
      if (eventName == 'success')
      {
        var xml = request.responseXML;
        if (xml === undefined || xml.documentElement === undefined)
          eventName = 'failure';
        else
        {
          if (xml.xml && DOMParser)
          {
            var parser = new DOMParser();
            xml = parser.parseFromString(xml.xml, "text/xml");
          }

          this.responseEnvelope = new Envelope(xml.documentElement);
          //this.responseData = XML2Object(this.responseEnvelope.element, this.mapping);
        
          args.push(
            this.getResponseData(),
            this.getRequestData()
          );
        }
      }

      if (eventName == 'failure')
      {
        var error = this.state.data || this.getRequestError(request);
        if (error.isSoapFailure)
          //this.event_soapfailure(error.code, error.msg);
          nsAjax.TransportDispatcher.dispatch.call(this, 'soapfailure', error.code, error.msg);

        args.push(
          error.code,
          error.msg
        );
      }

      Transport.prototype.dispatch.apply(this, args);
    },*/
    setCallback: function(callback){
      if (typeof callback == 'object')
      {
        ;;;if (callback.fault) { throw new Error('callback.failure must be used instead of callback.fault'); }
        ;;;if (typeof callback == 'function') { console.warn('Callback must be an object, callback ignored') } else

        this.addHandler(callback);
      }
    },
    setMapping: function(mapping){
      this.mapping = mapping;
    },
    //invoke: function(headerData, bodyData, callback){ /* deprecate */ },
    getRequestData: function(){
      return this.requestDataGetter(this.requestEnvelope.getBody().getValue());
    },
    getResponseData: function(){
      var body = this.responseEnvelope && this.responseEnvelope.getBody();
      if (body)
        return this.responseDataGetter(body.getValue(this.mapping));
    },
    getRequestError: function(req){
      var code, message, isSoapFailure = false;
      var xml = req.responseXML;
      if (xml != undefined && xml.documentElement != undefined)
      {
        var element = xml.documentElement;
        var codeElement = this.errorCodeGetter(element);
        var messageElement = this.errorMessageGetter(element);

        this.responseEnvelope = new Envelope(element);

        code = codeElement ? codeElement.firstChild.nodeValue : 'UNKNOWN_ERROR';
        message = messageElement ? messageElement.firstChild.nodeValue : 'Unknown error';

        console.log('SoapError:', code.quote('('), message)

        isSoapFailure = true;
      }

      return {
        code: code || 'TRANSPORT_ERROR',
        msg: message,
        //faultactor: faultactor,
        isSoapFailure: isSoapFailure
      }
    }

    // full destroy in Transport class
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

  basis.namespace(namespace).extend({
    Service: Service,
    ServiceCall: ServiceCall,
    ServiceCallTransport: ServiceCallTransport,
    Envelope: Envelope,
    EnvelopeHeader: EnvelopeHeader,
    EnvelopeBody: EnvelopeBody
  });

}(basis);


//
// src/basis/ui/button.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.html');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = 'basis.ui.button';


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

    captionGetter: getter('caption'),
    caption: '[no caption]',
    groupId: 0,
    name: null,

    template:
      '<button{buttonElement} class="Basis-Button" event-click="click">' +
        '<span class="Basis-Button-Back"/>' +
        '<div class="Basis-Button-Caption">{captionText}</div>' +
      '</button>',

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

    event_select: function(){
      UINode.prototype.event_select.call(this);
      DOM.focus(this.element);
    },
    event_disable: function(){
      UINode.prototype.event_disable.call(this);
      this.tmpl.buttonElement.disabled = true;
    },
    event_enable: function(){
      UINode.prototype.event_enable.call(this);
      this.tmpl.buttonElement.disabled = false;
    },

    init: function(config){
      ;;;if (typeof this.handler == 'function' && typeof console != 'undefined') console.warn(namespace + '.Button: this.handler must be an object. Use this.click instead.')

      // inherit
      UINode.prototype.init.call(this, config);

      //this.setCaption('caption' in config ? config.caption : this.caption);
      this.setCaption(this.caption);
    },
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.tmpl.captionText.nodeValue = this.captionGetter(this);
    }
  });

 /**
  * @class
  */
  //var ButtonGrouping = Class(TmplGroupingNode, );

 /**
  * @class
  */
  var ButtonPanel = Class(UIControl, {
    className: namespace + '.ButtonPanel',

    template:
      '<div class="Basis-ButtonPanel">' +
        '<div{childNodesElement|content} class="Basis-ButtonPanel-Content"/>' +
      '</div>',

    childClass: Button,
    getButtonByName: function(name){
      return this.childNodes.search(name, getter('name'));
    },

    localGrouping: {},
    localGroupingClass: {
      className: namespace + '.ButtonGroupingNode',

      groupGetter: function(button){
        return button.groupId || -button.eventObjectId;
      },

      childClass: {
        className: namespace + '.ButtonPartitionNode',

        template:
          '<div class="Basis-ButtonGroup"/>'
      }
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    Button: Button,
    ButtonPanel: ButtonPanel
  });

}(basis);


//
// src/basis/ui/label.js
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

basis.require('basis.html');
basis.require('basis.dom');
basis.require('basis.data');
basis.require('basis.dom.wrapper');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.label
  */

  var namespace = 'basis.ui.label';

  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Template = basis.html.Template;

  var getter = Function.getter;
  var createEvent = basis.EventObject.createEvent;

  var STATE = basis.data.STATE;

  var UINode = basis.ui.Node;


  //
  // main part
  //

  var stateTemplate = new Template(
    '<div{element|content} class="Basis-Label-State"/>'
  );
  var processingTemplate = new Template(
    '<div{element|content} class="Basis-Label-Processing"/>'
  );
  var errorTemplate = new Template(
    '<div{element|content} class="Basis-Label-Error"/>'
  );

  //
  // NodeLabel
  //

 /**
  * Base class for all labels.
  * @class
  */
  var NodeLabel = Class(UINode, {
    className: namespace + '.NodeLabel',

    cascadeDestroy: true,

    show_: false,
    visible_: false,
    visibilityGetter: Function.$false,

    insertPoint: DOM.INSERT_END,

    content: '[no text]',

    event_delegateChanged: function(object, oldDelegate){
      var newContainer = oldDelegate ? oldDelegate.element == this.container : !this.container;
      if (newContainer)
        this.setContainer(this.delegate && this.delegate.element);
    },
    event_visibilityChanged: createEvent('visibilityChanged'),

    init: function(config){
      var container = this.container;
      this.container = null;

      UINode.prototype.init.call(this, config);

      if (container)
        this.container = container;

      this.traceChanges_();

      return config;
    },

    traceChanges_: function(){
      if (this.container && this.visible_)
      {
        if (this.container != this.element.parentNode)
          DOM.insert(this.container, this.tmpl.element, this.insertPoint);
      }
      else
        DOM.remove(this.element);
    },

    setContainer: function(container){
      if (this.container != container)
      {
        this.container = container;
        this.traceChanges_()
      }
    },
    setVisibility: function(visible){
      if (this.visible_ != visible)
      {
        this.visible_ = visible;
        this.traceChanges_();
        this.event_visibilityChanged(this.visible_);
      }
    },

    destroy: function(){
      delete this.container;
      UINode.prototype.destroy.call(this);
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

    init: function(config){
      if (this.visibleStates && !this.visibilityGetter)
      {
        var map = {};
        for (var state, i = 0; state = this.visibleStates[i++];)
          map[state] = true;
        this.visibilityGetter = getter(Function.$self, map);
      }

      NodeLabel.prototype.init.call(this, config);
    }
  });

  var ObjectState = Class(State, {
    className: namespace + '.ObjectState',

    event_delegateChanged: function(object, oldDelegate){
      State.prototype.event_delegateChanged.call(this, object, oldDelegate);

      if (this.delegate)
        this.event_stateChanged(this);
    },
    event_stateChanged: function(object, oldState){
      State.prototype.event_stateChanged.call(this, object, oldState);
      this.setVisibility(this.visibilityGetter(this.state, oldState));
    }
  });

 /**
  * Label that shows only when delegate node in processing state.
  * @class
  */
  var Processing = Class(ObjectState, {
    className: namespace + '.Processing',

    visibilityGetter: function(newState){ 
      return newState == STATE.PROCESSING 
    },
    content: 'Processing...',
    template: processingTemplate
  });

  var Error = Class(ObjectState, {
    className: namespace + '.Error',

    visibilityGetter: function(newState){ 
      return newState == STATE.ERROR
    },
    content: 'Error',
    template: errorTemplate
  })

  //
  // Node dataSource state label
  //

  var DataSourceState_DataSourceHandler = {
    stateChanged: function(object, oldState){
      this.setVisibility(this.visibilityGetter(object.state, oldState));
    }
  };

  var DataSourceState_DelegateHandler = {
    dataSourceChanged: function(object, oldDataSource){
      if (oldDataSource)
        oldDataSource.removeHandler(DataSourceState_DataSourceHandler, this);

      if (object.dataSource)
      {
        object.dataSource.addHandler(DataSourceState_DataSourceHandler, this);
        DataSourceState_DataSourceHandler.stateChanged.call(this, object.dataSource, object.dataSource.state);
      }
    }
  };

 /**
  * @class
  */
  var DataSourceState = Class(State, {
    className: namespace + '.DataSourceState',

    event_delegateChanged: function(object, oldDelegate){
      State.prototype.event_delegateChanged.call(this, object, oldDelegate);

      if (oldDelegate)
        oldDelegate.removeHandler(DataSourceState_DelegateHandler, this);

      if (this.delegate)
      {
        this.delegate.addHandler(DataSourceState_DelegateHandler, this);
        DataSourceState_DelegateHandler.dataSourceChanged.call(this, this.delegate, oldDelegate && oldDelegate.dataSource);
      }
    },
    template: stateTemplate
  });

 /**
  * Label that shows only when delegate's dataSource in processing state.
  * @class
  */
  var DataSourceProcessing = Class(DataSourceState, {
    className: namespace + '.DataSourceProcessing',

    visibilityGetter: function(newState){ return newState == STATE.PROCESSING },
    content: 'Processing...',
    template: processingTemplate
  });

  //
  // Child nodes count labels
  //

  var CHILD_COUNT_FUNCTION = function(){
    this.setVisibility(this.visibilityGetter(this.delegate ? this.delegate.childNodes.length : 0, this.delegate));
  };

  var ChildCount_DataSourceHandler = {
    stateChanged: function(object, oldState){
      this.setVisibility(this.visibilityGetter(object.itemCount, this.delegate));
    }
  };

  var ChildCount_DelegateHandler = {
    childNodesModified: CHILD_COUNT_FUNCTION,
    dataSourceStateChanged: CHILD_COUNT_FUNCTION,
    stateChanged: CHILD_COUNT_FUNCTION,

    dataSourceChanged: function(object, oldDataSource){
      if (oldDataSource)
        oldDataSource.removeHandler(ChildCount_DataSourceHandler, this);

      if (object.dataSource)
      {
        object.dataSource.addHandler(ChildCount_DataSourceHandler, this);
        ChildCount_DataSourceHandler.stateChanged.call(this, object.dataSource, object.dataSource.state);
      }
    }
  };

 /**
  * @class
  */
  var ChildCount = Class(NodeLabel, {
    className: namespace + '.ChildCount',

    event_delegateChanged: function(object, oldDelegate){
      NodeLabel.prototype.event_delegateChanged.call(this, object, oldDelegate);

      if (oldDelegate)
        oldDelegate.removeHandler(ChildCount_DelegateHandler, this);

      if (this.delegate)
      {
        this.delegate.addHandler(ChildCount_DelegateHandler, this);
        ChildCount_DelegateHandler.dataSourceChanged.call(this, this.delegate);
      }

      CHILD_COUNT_FUNCTION.call(this);
    },
    template: new Template(
      '<div{element|content} class="Basis-CountLabel"/>'
    )
  });

 /**
  * @class
  */
  var IsEmpty = Class(ChildCount, {
    className: namespace + '.IsEmpty',

    visibilityGetter: function(childCount, object){ 
      var state = object.dataSource ? object.dataSource.state : object.state;
      return !childCount && state == STATE.READY;
    },
    content: 'Empty'
  })


  //
  // export names
  //

  basis.namespace(namespace).extend({
    NodeLabel: NodeLabel,
    State: State,
    ObjectState: ObjectState,
    Processing: Processing,
    Error: Error,
    DataSourceState: DataSourceState,
    DataSourceProcessing: DataSourceProcessing,
    ChildCount: ChildCount,
    IsEmpty: IsEmpty
  });

}(basis);

//
// src/basis/ui/tree.js
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
basis.require('basis.cssom');
basis.require('basis.ui');

!function(basis){

  'use strict';

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
  * @see ./demo/simple/tree.html
  * @see ./demo/data/entity.html
  *
  * @namespace basis.ui.tree
  */

  var namespace = 'basis.ui.tree';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var classList = basis.cssom.classList;
  var getter = Function.getter;
  var createEvent = basis.EventObject.createEvent;

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
      '<li{element} class="Basis-TreePartitionNode">' + 
        '<div class="Basis-TreePartitionNode-Title">' +
          '<span>{titleText}</span>' +
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

    canHaveChildren: false,
    childFactory: null,

    event_collapse: createEvent('collapse'),
    event_expand: createEvent('expand'),

   /**
    * Template for node element. 
    * @type {basis.Html.Template}
    * @private
    */
    template: 
      '<li{element} class="Basis-TreeNode">' +
        '<div{content} class="Basis-TreeNode-Title">' +
          '<span{title} class="Basis-TreeNode-Caption" event-click="select">' +
            '{titleText}' +
          '</span>' +
        '</div>' +
      '</li>',

    templateUpdate: function(tmpl, eventName, delta){
      // set new title
      tmpl.titleText.nodeValue = String(this.titleGetter(this)) || '[no title]';
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
    },

   /**
    * @type {function()}
    */
    titleGetter: getter('data.title')
  });

 /**
  * Base child class for {basis.ui.tree.Tree} that can has children.
  * @class
  * @extends {basis.ui.tree.Node}
  */
  var Folder = Class(Node, {
    className: namespace + '.Folder',

    canHaveChildren: true,
    childClass: Node,
    localGroupingClass: GroupingNode,

    event_expand: function(){
      Node.prototype.event_expand.call(this);
      classList(this.element).remove('collapsed');
    },
    event_collapse: function(){
      Node.prototype.event_collapse.call(this);
      classList(this.element).add('collapsed');
    },

   /**
    * Template for node element. 
    * @type {basis.Html.Template}
    * @private
    */
    template: 
      '<li{element} class="Basis-TreeNode">' +
        '<div{content} class="Basis-TreeNode-Title Basis-TreeNode-CanHaveChildren">' +
          '<div{expander} class="Basis-TreeNode-Expander" event-click="toggle"/>' +
          '<span{title} class="Basis-TreeNode-Caption" event-click="select">' +
            '{titleText}' +
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

    childClass: Node,
    localGroupingClass: GroupingNode,

    //childFactory: treeChildFactory,

   /**
    * Template for node element. 
    * @type {basis.Html.Template}
    * @private
    */
    template:
      '<ul class="Basis-Tree"/>'
  });


  //
  // export names
  //

  basis.namespace('basis.ui').extend({
    Tree: Tree
  });

  basis.namespace('basis.ui.tree').extend({
    Tree: Tree,
    Node: Node,
    Folder: Folder,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode
  });

}(basis);

//
// src/basis/ui/popup.js
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
basis.require('basis.cssom');
basis.require('basis.layout');
basis.require('basis.ui');

!function(){

  'use strict';

 /**
  * @namespace basis.ui.popup
  */

  var namespace = 'basis.ui.popup';


  // import names

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var Cleaner = basis.Cleaner;

  var nsWrapper = basis.dom.wrapper;
  var nsLayout = basis.layout;

  var createEvent = basis.EventObject.createEvent;

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
      '<div{element|selected} class="Basis-Popup">' +
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
    ignoreClickFor: [],

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

        var dir = String(dir || this.dir).toUpperCase().qw();

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
      '<div{element|selected} class="Basis-Balloon" event-click="click">' +
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

    //childFactory: function(cfg){ return new this.childClass(cfg) },

    template:
      '<div{element} class="Basis-Menu-Item" event-click="click">' +
        '<a{content|selected} href="#"><span>{captionText}</span></a>' +
      '</div>'/* +
      '<div{childNodesElement}/>'*/,

    action: {
      click: function(event){
        this.click();
        Event.kill(event); // prevent default for <a>
      }
    },

    event_childNodesModified: function(node, delta){
      classList(this.element).bool('hasSubItems', this.hasChildNodes());

      UIContainer.prototype.event_childNodesModified.call(this, node, delta);
    },

    groupId: 0,
    caption: '[untitled]',
    captionGetter: getter('caption'),
    handler: null,
    defaultHandler: function(node){
      if (this.parentNode)
        this.parentNode.defaultHandler(node);
    },

    init: function(config){
      // inherit
      UIContainer.prototype.init.call(this, config);

      this.setCaption(this.caption);
    },
    setCaption: function(newCaption){
      this.caption = newCaption;

      if (this.tmpl.captionText)
        this.tmpl.captionText.nodeValue = this.captionGetter(this);
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
  MenuItem.prototype.childClass = MenuItem;

 /**
  * @class
  */
  var MenuItemSet = Class(MenuItem, {
    className: namespace + '.MenuItemSet',
    event_childNodesModified: UINode.prototype.event_childNodesModified,

    template: 
      '<div class="Basis-Menu-ItemSet"/>'
  });

 /**
  * @class
  */
  var MenuPartitionNode = Class(UIPartitionNode, {
    className: namespace + '.MenuPartitionNode',

    template:
      '<div{element} class="Basis-Menu-ItemGroup">' +
        '<div{childNodesElement|content} class="Basis-Menu-ItemGroup-Content"></div>' +
      '</div>'
  });

 /**
  * @class
  */
  var MenuGroupControl = Class(UIGroupingNode, {
    className: namespace + '.MenuGroupControl',
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

    localGroupingClass: MenuGroupControl,
    localGrouping: getter('groupId'),

    defaultHandler: function(){
      this.hide();
    },

    template:
      '<div{element|selected} class="Basis-Menu">' +
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
        newChild.element.style.zIndex = basis.ui.Window ? basis.ui.Window.getWindowTopZIndex() : 2001;
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

      var popups = this.childNodes.filter(Function.getter('hideOnAnyClick')).reverse();

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

  basis.namespace(namespace).extend({
    // const
    ORIENTATION: ORIENTATION,

    // methods
    setHandheldMode: setHandheldMode,

    // classes
    Popup: Popup,
    Balloon: Balloon,
    Menu: Menu,
    MenuGroupControl: MenuGroupControl,
    MenuPartitionNode: MenuPartitionNode,
    MenuItem: MenuItem,
    MenuItemSet: MenuItemSet
  });

}(basis);


//
// src/basis/ui/table.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * Table namespace
  *
  * @see ./test/speed-table.html
  * @see ./demo/common/match.html
  * @see ./demo/common/grouping.html
  *
  * @namespace basis.ui.table
  */

  var namespace = 'basis.ui.table';


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;
  var Template = basis.html.Template;

  var getter = Function.getter;
  var extend = Object.extend;
  var classList = basis.cssom.classList;

  var nsWrapper = basis.dom.wrapper;
  var GroupingNode = nsWrapper.GroupingNode;
  var PartitionNode = nsWrapper.PartitionNode;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // main part
  //

  //
  // Table Header
  //

  var HEADERCELL_CSS_SORTABLE = 'sortable';
  var HEADERCELL_CSS_SORTDESC = 'sort-order-desc';

 /**
  * @class
  */
  var HeaderPartitionNode = Class(UINode, {
    className: namespace + '.HeaderPartitionNode',
    template: new Template(
      '<th{element|selected} class="Basis-Table-Header-Cell">' +
        '<div class="Basis-Table-Sort-Direction"></div>' +
        '<div class="Basis-Table-Header-Cell-Content">' + 
          '<span{content} class="Basis-Table-Header-Cell-Title">{titleText}</span>' +
        '</div>' +
      '</th>'
    ),
    templateUpdate: function(tmpl, eventName, delta){
      tmpl.titleText.nodeValue = this.titleGetter(this);
    }
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
        } while (cursor = cursor.localGrouping);
      }
      
      GroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

    childClass: {
      init: function(config){
        PartitionNode.prototype.init.call(this, config);
        this.cell = new HeaderPartitionNode({ titleGetter: this.titleGetter, delegate: this });
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

    init: function(config){
      GroupingNode.prototype.init.call(this, config);
      this.element = this.childNodesElement = this.headerRow = DOM.createElement('tr.Basis-Table-Header-GroupContent');
    },
    insertBefore: function(newChild, refChild){
      var newChild = GroupingNode.prototype.insertBefore.call(this, newChild, refChild);

      var refElement = newChild.nextSibling && newChild.nextSibling.cell.element;
      DOM.insert(this.headerRow, newChild.cell.element, DOM.INSERT_BEFORE, refElement);

      return newChild;
    },
    removeChild: function(oldChild){
      DOM.remove(oldChild.cell.element);
      GroupingNode.prototype.removeChild.call(oldChild);
    },
    destroy: function(){
      GroupingNode.prototype.destroy.call(this);
      this.headerRow = null;
    }
  });
  HeaderGroupingNode.prototype.localGroupingClass = HeaderGroupingNode;

 /**
  * @class
  */
  var HeaderCell = Class(UINode, {
    className: namespace + '.HeaderCell',

    sorting: null,
    defaultOrder: false,
    groupId: 0,

    template: new Template(
      '<th{element|selected} class="Basis-Table-Header-Cell" event-click="click">' +
        '<div class="Basis-Table-Sort-Direction"/>' +
        '<div class="Basis-Table-Header-Cell-Content">' + 
          '<span{content} class="Basis-Table-Header-Cell-Title"/>' +
        '</div>' +
      '</th>'
    ),

    action: {
      click: function(event){
        if (this.selected)
        {
          var owner = this.parentNode && this.parentNode.owner;
          if (owner)
            owner.setLocalSorting(owner.localSorting, !owner.localSortingDesc);
        }
        else
          this.select();         
      }
    },

    init: function(config){
      UINode.prototype.init.call(this, config);

      //DOM.insert(this.content, config.content || '');

      this.selectable = !!this.sorting;
      if (this.sorting)
      {
        this.sorting = Function.getter(this.sorting);
        this.defaultOrder = this.defaultOrder == 'desc';
        classList(this.element).add(HEADERCELL_CSS_SORTABLE);
      }
    },
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

    localGroupingClass: HeaderGroupingNode,

    template: new Template(
      '<thead{element} class="Basis-Table-Header">' +
        '<tr{groupsElement} class="Basis-Table-Header-GroupContent" />' +
        '<tr{childNodesElement|content} />' +
      '</thead>'
    ),

    listen: {
      owner: {
        localSortingChanged: function(owner, oldLocalSorting, oldLocalSortingDesc){
          var cell = this.childNodes.search(owner.localSorting, 'sorting');
          if (cell)
          {
            cell.select();
            cell.order = owner.localSortingDesc;
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
              this.owner.setLocalSorting(cell.sorting, cell.order);
          }
        }
      };

      UIContainer.prototype.init.call(this, config);

      this.applyConfig_(this.structure)
    },
    applyConfig_: function(structure){
      if (structure)
      {
        this.setChildNodes(structure.map(function(colConfig){
          var headerConfig = colConfig.header;
          var config = Object.slice(colConfig, ['sorting', 'defaultOrder', 'groupId']);

          config.content = (headerConfig == null || typeof headerConfig != 'object'
            ? headerConfig 
            : headerConfig.content) || String.Entity.nbsp;

          if (typeof config.content == 'function')
            config.content = config.content.call(this);

          config.cssClassName = (headerConfig.cssClassName || '') + ' ' + (colConfig.cssClassName || '');

          return config;
        }, this));
      }
    }
  });

  //
  // Table Footer
  //

 /**
  * @class
  */
  var FooterCell = Class(UINode, {
    className: namespace + '.FooterCell',

    colSpan: 1,

    template: new Template(
      '<td{element} class="Basis-Table-Footer-Cell">' +
        '<div{content}>\xA0</div>' +
      '</td>'
    ),

    setColSpan: function(colSpan){
      this.element.colSpan = this.colSpan = colSpan || 1;
    }
  });

 /**
  * @class
  */
  var Footer = Class(UIContainer, {
    className: namespace + '.Footer',

    childClass: FooterCell,
    childFactory: function(config){
      return new this.childClass(config);
    },

    template: new Template(
      '<tfoot{element} class="Basis-Table-Footer">' +
        '<tr{content|childNodesElement}></tr>' +
      '</tfoot>'
    ),

    init: function(config){
      UIContainer.prototype.init.call(this, config);

      this.applyConfig_(this.structure);

      if (this.useFooter)
        DOM.insert(this.container || this.owner.element, this.element, 1);
    },

    applyConfig_: function(structure){
      //console.dir(this);
      if (structure)
      {
        var prevCell = null;

        this.clear();
        this.useFooter = false;

        for (var i = 0; i < structure.length; i++)
        {
          var colConfig = structure[i];
          var cell;

          if (colConfig.footer)
          {
            var content = colConfig.footer.content;

            if (typeof content == 'function')
              content = content.call(this);
              
            this.useFooter = true;
            
            cell = this.appendChild({
              cssClassName: (colConfig.cssClassName || '') + ' ' + (colConfig.footer.cssClassName || ''),
              content: content,
              template: colConfig.footer.template || FooterCell.prototype.template
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
    
    canHaveChildren: false,

    repaintCount: 0,
    getters: [],
    classNames: [],

    template:
      '<tr class="Basis-Table-Row" event-click="select">' +
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
      '<tbody class="Basis-Table-Body" event-click="click">' +
        '<tr class="Basis-Table-GroupHeader">' +
          '<td{content} colspan="100"><span class="expander"/>{titleText}</td>'+ 
        '</tr>' +
        '<!-- {childNodesHere} -->' +
      '</tbody>',

    action: {
      click: function(){
        classList(this.element).toggle('collapsed');
      }
    }
  });
  
 /**
  * @class
  */
  var Table = Class(UIControl, {
    className: namespace + '.Table',
    
    canHaveChildren: true,
    childClass: Row,

    localGroupingClass: Class(UIGroupingNode, {
      className: namespace + '.TableGroupingNode',
      childClass: Body
    }),

    template: new Template(
      '<table{element|groupsElement} class="Basis-Table" cellspacing="0" event-click="click">' +
        '<!-- {headerElement} -->' +
        '<tbody{content|childNodesElement} class="Basis-Table-Body"></tbody>' +
        '<!-- {footerElement} -->' +
      '</table>'
    ),

    templateAction: function(actionName, event){
      UIControl.prototype.templateAction.call(this, actionName, event);
    },

    //canHaveChildren: false,

    init: function(config){

      this.applyConfig_(this.structure);

      UIControl.prototype.init.call(this, config);

      this.headerConfig = this.header;
      this.footerConfig = this.footer;

      this.header = new Header(Object.extend({ owner: this, structure: this.structure }, this.header));
      this.footer = new Footer(Object.extend({ owner: this, structure: this.structure }, this.footer));

      DOM.replace(this.tmpl.headerElement, this.header.element);
    
      if (!this.localSorting && this.structure && this.structure.search(true, function(item){ return item.sorting && ('autosorting' in item) }))
      {
        var col = this.structure[Array.lastSearchIndex];
        this.setLocalSorting(col.sorting, col.defaultOrder == 'desc');
      }

      // add event handlers
      /*this.addEventListener('click');
      this.addEventListener('contextmenu', 'contextmenu', true);*/
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

        this.childClass = this.childClass.subclass({
          //behaviour: config.rowBehaviour,
          satelliteConfig: this.rowSatellite,
          template: new Template(this.childClass.prototype.template.source.replace('<!--{cells}-->', template)),
          updaters: updaters
        });

        if (this.rowBehaviour)
        {
          var rowBehaviour = this.rowBehaviour;

          Object.keys(rowBehaviour).forEach(function(method){
            this.childClass.prototype[method] = function(){
              rowBehaviour[method].apply(this, arguments);
              Row.prototype[method].apply(this, arguments);
            }
          }, this);
        }

      }
    },

    loadData: function(items){
      this.setChildNodes(items.map(Function.wrapper('data')))
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

  basis.namespace(namespace).extend({
    Table: Table,
    Body: Body,
    Header: Header,
    HeaderCell: HeaderCell,
    Row: Row,
    Footer: Footer
  });

  basis.namespace('basis.ui').extend({
    Table: Table
  });

}(basis);


//
// src/basis/ui/scrolltable.js
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
 * Vladimir Ratsev <wuzykk@gmail.com>
 */

basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.layout');
basis.require('basis.ui.table');

!function(basis){

 /**
  * @namespace basis.ui.scrolltable
  */

  var namespace = 'basis.ui.scrolltable';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var cssom = basis.cssom;
  var TimeEventManager = basis.TimeEventManager;
  var Table = basis.ui.table.Table;
  var Box = basis.layout.Box;
  var Viewport = basis.layout.Viewport;

  var nsTable = basis.ui.table;


  //
  // main part
  //

  /* caculate scroll width */
  var SCROLLBAR_WIDTH = 17;
  Event.onLoad(function(){
    var tester = DOM.createElement('');
    DOM.setStyle(tester, { height: '100px', overflow: 'scroll' });
    DOM.insert(document.body, tester);
    SCROLLBAR_WIDTH = (new Box(tester)).width - (new Viewport(tester)).width;
    cssom.cssRule('.ScrollBarWidthOwner').setStyle({ width: SCROLLBAR_WIDTH + 'px' });
    DOM.remove(tester);
  });

  function createHeaderExpandCell(){
    return DOM.createElement('.Basis-ScrollTable-ExpandHeaderCell', DOM.createElement('.Basis-ScrollTable-ExpandCell-Content')); 
  }

  function createFooterExpandCell(){
    return DOM.createElement('.Basis-ScrollTable-ExpandFooterCell');
  }

 /**
  * @class
  */
  var ScrollTable = Class(Table, {
    className: namespace + '.ScrollTable',

    template:
      '<div{element} class="Basis-Table Basis-ScrollTable">' +
        '<div{headerFooterContainer} class="Basis-ScrollTable-HeaderFooterContainer">' +
          //'<div{headerFooterWrapper} style="position: absolute; height: 100%; width: 100%; top: 0; left: 0">' +
            '<table{head} cellspacing="0" border="0" class="Basis-ScrollTable-Header"><!-- {headerElement} --></table>' +
            '<table{foot} cellspacing="0" border="0" class="Basis-ScrollTable-Footer"></table>' +
          //'</div>' +
        '</div>' +
        '<div{scrollContainer} class="Basis-ScrollTable-ScrollContainer">' +
          '<div{tableWrapperElement} class="Basis-ScrollTable-TableWrapper">' +
            '<table{tableElement|groupsElement} class="Basis-Table" cellspacing="0">' +
              '<tbody{content|childNodesElement} class="Basis-Table-Body"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>',

    event_childNodesModified: function(node, delta){
      Table.prototype.event_childNodesModified.call(this, node, delta);
      TimeEventManager.add(this, 'adjust', Date.now());
    },
    /*event_childUpdated: function(child, delta){
      Table.prototype.event_childUpdated.call(this, child, delta);
      TimeEventManager.add(this, 'adjust', Date.now());
    },*/

    init: function(config){
      Table.prototype.init.call(this, config);

      //DOM.insert(this.tmpl.head, this.header.element);

      /*create header clone*/
      this.headerClone = new nsTable.Header(Object.extend({ 
        owner: this.header.owner,
        container: this.tmpl.tableElement, 
        structure: this.structure
      }, this.headerConfig));

      /*get header cells including groupCells*/
      this.originalCells = this.header.childNodes;
      if (this.header.groupControl)
        this.originalCells = this.originalCells.concat(this.header.groupControl.childNodes);

      /*get cloned header cells including groupCells*/
      this.clonedCells   = this.headerClone.childNodes;
      if (this.headerClone.groupControl)
        this.clonedCells = this.clonedCells.concat(this.headerClone.groupControl.childNodes);
        
      this.headerExpandCell = DOM.insert(this.element, createHeaderExpandCell());

      this.headerBox = new Box(this.header.element);

      if (this.footer.useFooter)
      {
        /*create footer clone*/
        DOM.insert(this.tmpl.foot, this.footer.element);
        this.footerClone = new nsTable.Footer(Object.extend({ 
          owner: this.footer.owner,
          container: this.tmpl.tableElement, 
          structure: this.structure 
        }, this.footerConfig));

        this.originalCells = this.originalCells.concat(this.footer.childNodes);
        this.clonedCells = this.clonedCells.concat(this.footerClone.childNodes)
        DOM.setStyle(this.footerClone.element, { visibility: 'hidden' });

        //this.footer.expandCell = DOM.insert(this.footer.childNodesElement, createFooterExpandCell());
        
        this.footerBox = new Box(this.footer.element);

        this.footerExpandCell = DOM.insert(this.element, createFooterExpandCell());
      }

      this.cellsAdjustmentInfo = [];

      for (var i = 0, originalCell, clonedCell; originalCell = this.originalCells[i]; i++)
      {
        clonedCell = this.clonedCells[i]; 
        this.cellsAdjustmentInfo.push({
          element: clonedCell.element,
          boxChangeListener: originalCell.element,
          contentSource: originalCell.content,
          contentDestination: clonedCell.content
        });
      }

      this.tableBox = new Box(this.tmpl.tableElement);
      this.lastScrollLeftPosition = 0;

      Event.addHandler(this.tmpl.scrollContainer, 'scroll', this.onScroll.bind(this));
      Event.addHandler(window, 'resize', this.adjust.bind(this));

      this.sync();
      TimeEventManager.add(this, 'adjust', Date.now());
    },
    onScroll: function(event){
      var scrollLeft = this.tmpl.scrollContainer.scrollLeft;
      if (scrollLeft != this.lastScrollLeftPosition) 
      {
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'left', -scrollLeft + 'px');
        this.lastScrollLeftPosition = scrollLeft;
      }
    },
    adjust: function(event){
      this.onScroll();

      /*recalc table width*/
      this.tableBox.recalc();
      var tableWidth = this.tableBox.width || 0;

      if (this.tmpl.tableWrapperElement.scrollWidth > this.tmpl.scrollContainer.clientWidth)
      {
        DOM.setStyleProperty(this.tmpl.tableWrapperElement, 'width',  tableWidth + 'px');
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'width', tableWidth + SCROLLBAR_WIDTH + 'px');
      }
      else
      {
        DOM.setStyleProperty(this.tmpl.tableWrapperElement, 'width', '100%');
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'width', '100%');
      }

      /*adjust cells width*/
      this.cellsAdjustmentInfo.forEach(this.adjustCell);
      /*recalc expanderCell width*/
      var freeSpaceWidth = Math.max(0, this.tmpl.tableWrapperElement.clientWidth - this.tmpl.tableElement.offsetWidth + SCROLLBAR_WIDTH);

      /*recalc header heights*/
      this.headerBox.recalc();
      var headerHeight = this.headerBox.height || 0;

      cssom.setStyleProperty(this.element, 'paddingTop', headerHeight + 'px');
      cssom.setStyleProperty(this.tmpl.tableElement, 'marginTop', -headerHeight + 'px');
      cssom.setStyle(this.headerExpandCell, { width: freeSpaceWidth + 'px', height: headerHeight + 'px' });

      /*recalc footer heights*/
      if (this.footer.useFooter)
      {
        this.footerBox.recalc();
        var footerHeight = this.footerBox.height || 0;

        cssom.setStyleProperty(this.element, 'paddingBottom', footerHeight + 'px');
        cssom.setStyleProperty(this.tmpl.tableElement, 'marginBottom', -footerHeight + 'px');

        cssom.setStyle(this.footerExpandCell, { width: freeSpaceWidth + 'px', height: footerHeight + 'px' });
      }
    },
    sync: function(cellNumber){
      /*this.cellsAdjustmentInfo.forEach(function(cell){
        DOM.insert(DOM.clear(cell.contentDestination), DOM.axis(cell.contentSource, DOM.AXIS_CHILD).map(DOM.clone));
      });*/
      this.adjust();
    },
    adjustCell: function(cell){
      var width;

      if (document.defaultView && document.defaultView.getComputedStyle)
        width = document.defaultView.getComputedStyle(cell.element, null).width;
      else
        width = cell.element.clientWidth + 'px';

      cssom.setStyleProperty(cell.boxChangeListener, 'width', width);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    ScrollTable: ScrollTable
  });
 
}(basis);


//
// src/basis/ui/window.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.ui');
basis.require('basis.ui.button');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.window
  */

  var namespace = 'basis.ui.window';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var Cleaner = basis.Cleaner;

  var createEvent = basis.EventObject.createEvent;
  var dragdrop = basis.dragdrop; // optional

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var ButtonPanel = basis.ui.button.ButtonPanel;


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
      '<div class="Basis-Window" event-mousedown="mousedown" event-keypress="keypress">' +
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
            '<div{title} class="Basis-Window-TitleCaption"/>' +
          '</div>' +
          '<div{content} class="Basis-Window-Content">' +
            '<!-- {childNodesHere} -->' +
          '</div>' +
        '</div>' +
      '</div>',

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

    title: '[no title]',

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
            DOM.createElement('A[href=#].Basis-Window-Title-CloseButton[event-click="close"]',
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
      DOM.insert(DOM.clear(this.tmpl.title), title);
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

  basis.namespace(namespace).extend({
    Window: Window,
    Blocker: Blocker,
    getWindowTopZIndex: function(){ return windowManager.childNodes.length * 2 + 2001 }
  });

}(basis);


//
// src/basis/ui/tabs.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @see ./demo/defile/tabs.html
  * @namespace basis.ui.tabs
  */

  var namespace = 'basis.ui.tabs';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var createEvent = basis.EventObject.createEvent;
  var basisEvent = basis.EventObject.event;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

  function findAndSelectActiveNode(control){
    if (control.selection && !control.selection.itemCount)
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

    canHaveChildren: true,
    childClass: UINode,

    event_childEnabled: createEvent('childEnabled', 'document', 'node') && function(document, node){
      if (this.selection && !this.selection.itemCount)
        child.select();

      basisEvent.childEnabled.call(this, document, node);
    },
    event_childDisabled: createEvent('childDisabled', 'document', 'node') && function(document, node){
      findAndSelectActiveNode(this);

      basisEvent.childDisabled.call(this, document, node);
    },
    event_childNodesModified: function(node, delta){
      findAndSelectActiveNode(this);

      UIControl.prototype.event_childNodesModified.call(this, node, delta);
    },

    //
    //  common methods
    //
    item: function(indexOrName){
      var index = isNaN(indexOrName) ? this.indexOf(indexOrName) : parseInt(indexOrName);
      return index.between(0, this.childNodes.length - 1) ? this.childNodes[index] : null;
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

  function tabCaptionFormat(value){ 
    return value == null || String(value) == '' ? '[no title]' : value;
  };

 /**
  * @class
  */
  var Tab = Class(UIContainer, {
    className: namespace + '.Tab',

    canHaveChildren: false,

    event_disable: function(){ 
      UIContainer.prototype.event_disable.call(this);

      this.unselect();
      if (this.document)
        this.document.event_childDisabled(this.document, this);
    },
    event_enable: function(){ 
      UIContainer.prototype.event_enable.call(this);

      if (this.document)
        this.document.event_childEnabled(this.document, this);
    },

    template: 
      '<div{element|selected} class="Basis-Tab" event-click="select">' +
        '<span class="Basis-Tab-Start"/>' +
        '<span class="Basis-Tab-Content">' +
          '<span class="Basis-Tab-Caption">' +
            '{titleText}' +
          '</span>' +
        '</span>' + 
        '<span class="Basis-Tab-End"/>' +
      '</div>' +
      '<div{content}/>',

    templateUpdate: function(tmpl, eventName, delta){
      // set new title
      this.tmpl.titleText.nodeValue = tabCaptionFormat(this.titleGetter(this));
    },
    
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
    localGroupingClass: {
      className: namespace + '.TabsGroupingNode',

      childClass: {
        className: namespace + '.TabsPartitionNode',
        template: 
          '<div class="Basis-TabControl-TabGroup"/>'
      }
    },

    template: 
      '<div class="Basis-TabControl">' +
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

    event_select: function(){
      classList(this.element).remove('Basis-Page-Hidden');
      UIContainer.prototype.event_select.call(this);
    },
    event_unselect: function(){
      classList(this.element).add('Basis-Page-Hidden');
      UIContainer.prototype.event_unselect.call(this);
    },
    
    template: 
      '<div{element|selected} class="Basis-Page Basis-Page-Hidden">' + 
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
      '<div class="Basis-PageControl"/>'
  });


  //
  // TabSheet Node
  //

 /**
  * @class
  */
  var TabSheet = Class(Tab, {
    className: namespace + '.TabSheet',

    canHaveChildren: true,
    childClass: UINode,

    event_select: function(){
      Tab.prototype.event_select.call(this);
      classList(this.tmpl.pageElement).remove('Basis-Page-Hidden');
    },
    event_unselect: function(){
      Tab.prototype.event_unselect.call(this);
      classList(this.tmpl.pageElement).add('Basis-Page-Hidden');
    },
    
    template: 
      '<div{element|selected} class="Basis-TabSheet" event-click="select">' +
        '<div{tabElement} class="Basis-Tab">' +
          '<span class="Basis-Tab-Start"/>' +
          '<span class="Basis-Tab-Content">' +
            '<span class="Basis-Tab-Caption">' +
              '{titleText}' +
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
      '<div class="Basis-AccordionControl">' +
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
      '<div class="Basis-TabSheetControl">' +
        '<div{tabsElement} class="Basis-TabControl">' +
          '<div class="Basis-TabControl-Start"/>' +
          '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
          '<div class="Basis-TabControl-End"/>' +
        '</div>' +
        '<div{pagesElement} class="Basis-PageControl"/>' +
      '</div>',

    insertBefore: function(newChild, refChild){
      if (newChild = TabControl.prototype.insertBefore.call(this, newChild, refChild))
      {
        if (this.tmpl.pagesElement)
          this.tmpl.pagesElement.insertBefore(newChild.tmpl.pageElement, this.nextSibling ? this.nextSibling.tmpl.pageElement : null)

        return newChild;
      }
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

  basis.namespace(namespace).extend({
    AbstractTabsControl: AbstractTabsControl,

    TabControl: TabControl,
    Tab: Tab,

    PageControl: PageControl,
    Page: Page,
    
    AccordionControl: AccordionControl,
    TabSheetControl: TabSheetControl,
    TabSheet: TabSheet
  });

}(basis);


//
// src/basis/ui/calendar.js
//

/**
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.date');
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.html');
basis.require('basis.data.property');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.calendar
  */

  var namespace = 'basis.ui.calendar';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var createEvent = basis.EventObject.createEvent;

  var Template = basis.html.Template;
  var Property = basis.data.property.Property;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

  var YEAR  = 'year';
  var MONTH = 'month';
  var DAY   = 'day';
  var HOUR  = 'hour';
  var FORWARD  = true;
  var BACKWARD = false;

  var TAB_TEMPLATE = '<div{tabElement} class="Basis-Calendar-SectionTab" event-click="select">{tabTitleText}</div>';

  // locale

  var LOCALE = function(section){
    var locale = basis.locale['ui.calendar'];
    return locale ? locale[section] : section;
  };

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
      if (value < (lv = compareValue.data.periodStart))
        r = pos - 1;
      else 
        if (value > (rv = compareValue.data.periodEnd))
          l = pos + 1;
        else
          return value >= lv && value <= rv ? pos : -1; // founded element
                                                        // -1 returns when it seems as founded element,
                                                        // but not equal (array item or value looked for have wrong data type for compare)
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
    quarter: function(period){ return LOCALE('QUARTER').toLowerCase().format(1 + period.periodStart.getMonth().base(3)/3) },
    month:   function(period){ return LOCALE('MONTH').SHORT[period.periodStart.getMonth()].toLowerCase() }, 
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
      result.periodStart = new Date(result.periodEnd = new Date(date));

    return result;
  }


  //
  // SECTIONS
  //

  var CalendarNode = Class(UINode, {
    className: namespace + '.Calendar.Node',

    canHaveChildren: false,

    template: new Template(
      '<a{element} class="Basis-Calendar-Node" event-click="click">{title|-}</a>'
    ),
    templateAction: function(actionName, event){
      if (actionName == 'click')
        this.document.templateAction(actionName, event, this);
      else
        UINode.prototype.templateAction.call(this, actionName, event);
    },

    templateUpdate: function(object, actionName, delta){
      if (!actionName || 'periodStart' in delta || 'periodEnd' in delta)
      {
        this.tmpl.title.nodeValue = this.titleGetter(this.data);

        if (this.parentNode)
        {
          var clsList = classList(this.element);
          clsList.bool('before', this.data.periodStart < this.parentNode.data.periodStart);
          clsList.bool('after', this.data.periodEnd > this.parentNode.data.periodEnd);
        }
      }
    },

    event_select: function(){
      UINode.prototype.event_select.call(this);

      DOM.focus(this.element);
    }/*,
    event_update: function(object, delta){
      UINode.prototype.event_update.call(this, object, delta);

      if ('periodStart' in delta || 'periodEnd' in delta)
      {
        this.tmpl.title.nodeValue = this.titleGetter(this.data);

        if (this.parentNode)
        {
          var clsList = classList(this.element);
          clsList.bool('before', this.data.periodStart < this.parentNode.data.periodStart);
          clsList.bool('after', this.data.periodEnd > this.parentNode.data.periodEnd);
        }
      }
    }*/
  });

  var CalendarSection = Class(UIContainer, {
    className: namespace + '.CalendarSection',

    childClass: CalendarNode,

    template: new Template(
      '<div{element|selected} class="Basis-Calendar-Section">' +
        '<div class="Basis-Calendar-SectionTitle">{titleText}</div>' +
        '<div{content|childNodesElement} class="Basis-Calendar-SectionContent"/>' +
      '</div>' +
      TAB_TEMPLATE
    ),
    /*templateAction: function(actionName, event){
      if (actionName == 'select')
        this.select();
      else
        UIContainer.prototype.templateAction.call(this, actionName, event);
    },*/

    event_select: function(){
      UIContainer.prototype.event_select.call(this);
      classList(this.tmpl.tabElement).add('selected');
    },
    event_unselect: function(){
      UIContainer.prototype.event_unselect.call(this);
      classList(this.tmpl.tabElement).remove('selected');
    },
    event_update: function(object, delta){
      UIContainer.prototype.event_update.call(this, object, delta);

      var newData = this.data;
      var newNodes;
      if ('periodStart' in delta || 'periodEnd' in delta)
      {
        this.tmpl.titleText.nodeValue = this.getTitle(newData.periodStart) || '-';

        // insert child nodes
        if (!this.firstChild)
          newNodes = [];

        // update nodes
        var nodePeriod = getPeriod(this.nodePeriodName, new Date(newData.periodStart).add(this.nodePeriodUnit, -this.nodePeriodUnitCount * (this.getInitOffset(newData.periodStart) || 0)));

        for (var i = 0; i < this.nodeCount; i++)
        {
          if (newNodes)
            // create new node
            newNodes.push({
              cssClassName: this.nodePeriodName,
              titleGetter: PERIOD_TITLE[this.nodePeriodName],
              data: nodePeriod
            });
          else
            // update existing one
            this.childNodes[i].update(nodePeriod);

          // move to next period
          nodePeriod = getPeriod(this.nodePeriodName, new Date(nodePeriod.periodStart).add(this.nodePeriodUnit, this.nodePeriodUnitCount));
        }

        if (newNodes)
          this.setChildNodes(newNodes);

        this.minDate = this.firstChild.periodStart;
        this.maxDate = this.lastChild.periodEnd;
      }

      this.tmpl.tabTitleText.nodeValue = this.getTabTitle(newData.selectedDate) || '-';

      var node = this.getNodeByDate(newData.selectedDate);
      if (node)
        node.select();
      else
      {
        if (newData.selectedDate && this.minDate <= newData.selectedDate && newData.selectedDate <= this.maxDate)
          this.setViewDate(newData.selectedDate);
        else
          this.selection.clear();
      }
    },

    // dates

    minDate: new Date(),
    maxDate: new Date(),/*
    periodStart: new Date(),
    periodEnd: new Date(),*/

    // period

    isPrevPeriodEnabled: true,
    isNextPeriodEnabled: true,

    periodName: 'period',

    // nodes properties

    nodeCount: 12,
    nodePeriodName: '-',
    nodePeriodUnit: '-',
    nodePeriodUnitCount: 1,

    selection: {},

    init: function(config){
      UIContainer.prototype.init.call(this, config);

      classList(this.element).add('Basis-Calendar-Section-' + this.sectionName);
      Event.addHandler(this.tmpl.tabElement, 'click', this.select.bind(this, false));
    },

    getTitle: function(){},
    getTabTitle: function(){},

    // nodes methods

    getNodeByDate: function(date){
      if (date && this.data.periodStart <= date && date <= this.data.periodEnd)
      {
        var pos = binarySearchIntervalPos(this.childNodes, date);
        if (pos != -1)
          return this.childNodes[pos];
      }

      return null;
    },

    prevPeriod: function(forward){
      if (this.isPrevPeriodEnabled)
        this.update(getPeriod(this.periodName, new Date(+this.data.periodStart - 1)));
    },

    nextPeriod: function(forward){
      if (this.isNextPeriodEnabled)
        this.update(getPeriod(this.periodName, new Date(+this.data.periodEnd + 1)));
    },

    setViewDate: function(date){
      this.update(getPeriod(this.periodName, date));
    },

    // bild methods
    getInitOffset: Function.$null
  });


  CalendarSection.Month = Class(CalendarSection, {
    className: namespace + '.CalendarSection.Month',

    sectionName: 'Month',
    periodName: MONTH,

    template: new Template(Function.lazyInit(function(){
      return '' +
      '<div{element|selected} class="Basis-Calendar-Section">' +
        '<div class="Basis-Calendar-SectionTitle">{titleText}</div>' +
        '<div{content|childNodesElement} class="Basis-Calendar-SectionContent">' +
          '<div class="Basis-Calendar-MonthWeekDays">' +
            LOCALE('DAY').SHORT2.map(String.format, '<span class="Basis-Calendar-MonthWeekDays-Day">{0}</span>').join('') +
          '</div>' +
        '</div>' +
      '</div>' +
      TAB_TEMPLATE
    })),

    nodeCount: 6 * 7,       // 6 weeks
    nodePeriodName: DAY,
    nodePeriodUnit: DAY,

    getTabTitle: getter('getDate()'),
    getTitle: function(periodStart){
      return LOCALE('MONTH').FULL[periodStart.getMonth()] + ' ' + periodStart.getFullYear();
    },
    getInitOffset: function(date){
      return 1 + (new Date(date).set(DAY, 1).getDay() + 5) % 7;
    }
  });

  CalendarSection.Year = Class(CalendarSection, {
    className:  namespace + '.CalendarSection.Year',

    sectionName: 'Year',
    periodName: YEAR,

    nodePeriodName: MONTH,
    nodePeriodUnit: MONTH,

    getTabTitle: getter('getMonth()', function(key){ return LOCALE('MONTH').FULL[key] }),
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
      return periodStart.getFullYear() + ' - ' + this.data.periodEnd.getFullYear();
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

    getTitle: function(periodStart){
      return [Math.floor(1 + periodStart.getMonth().base(3)/3), LOCALE('QUARTER').toLowerCase(), periodStart.getFullYear()].join(' ');
    }
  });

  //
  // Calendar
  //

  var Calendar = Class(UIControl, {
    className: namespace + '.Calendar',

    childClass: CalendarSection,
    childFactory: Function(),

    template: new Template(Function.lazyInit(function(){
      return '' +
      '<div{element} class="Basis-Calendar">' +
        '<div class="Basis-Calendar-Header">' +
          '<div{sectionTabs} class="Basis-Calendar-SectionTabs" />' +
        '</div>' +
        '<div class="Basis-Calendar-Body">' +
          '<span event-click="move_prev" class="Basis-Calendar-ButtonPrevPeriod">' +
            '<span>\u2039</span><span class="over"></span>' +
          '</span>' +
          '<span event-click="move_next" class="Basis-Calendar-ButtonNextPeriod">' +
            '<span>\u203A</span><span class="over"></span>' +
          '</span>' +
          '<div{content|childNodesElement} class="Basis-Calendar-Content"/>' +
        '</div>' +
        '<div class="Basis-Calendar-Footer">' +
          '<div class="Basis-Calendar-Footer-Date">' +
            '<span class="Basis-Calendar-Footer-Label">' + LOCALE('TODAY') + ':</span>' +
            '<span event-click="select_today" class="Basis-Calendar-Footer-Value">{todayText}</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    })),

    event_change: createEvent('change'),

    event_childNodesModified: function(node, delta){
      if (delta.inserted)
        for (var i = 0, section; section = delta.inserted[i++];)
        {
          section.setViewDate(this.date.value);
          section.update({
            selectedDate: this.selectedDate.value
          });
        }

      UIControl.prototype.event_childNodesModified.call(this, node, delta);

      DOM.insert(
        DOM.clear(this.tmpl.sectionTabs),
        this.childNodes.map(getter('tmpl.tabElement'))
      );

      if (!this.selection.itemCount && this.firstChild)
        this.firstChild.select();
    },
    templateAction: function(actionName, event, node){
      UIControl.prototype.templateAction.call(this, actionName, event);

      if (node instanceof CalendarNode)
      {
        var newDate = node.data.periodStart;
        var activeSection = this.selection.pick();
        this.selectedDate.set(new Date(this.selectedDate.value).add(activeSection.nodePeriodUnit, this.selectedDate.value.diff(activeSection.nodePeriodUnit, newDate)));
        this.nextSection(BACKWARD);
      }
      else
      {
        if (classList(Event.sender(event)).contains('disabled'))
          return;

        switch (actionName)
        {
          case 'select_today':
            this.selectedDate.set(new Date());
          break;

          case 'select_current':
            this.selectDate(this.date.value);
          break;

          case 'move_prev':
            this.selection.pick().prevPeriod();
          break;

          case 'move_next':
            this.selection.pick().nextPeriod();
          break;

          case 'move_up':
            this.nextSection(FORWARD);
          break;
        }
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
      this.todayDate = new Property(new Date());
      this.selectedDate = new Property(new Date(this.date || new Date()));
      this.date = new Property(new Date(this.date || new Date()));

      this.selection = {
        selectedDate: this.selectedDate,
        event_datasetChanged: function(dataset, delta){
          this.constructor.prototype.event_datasetChanged.call(this, dataset, delta);

          var activeSection = this.pick();
          if (activeSection)
            activeSection.update({ selectedDate: this.selectedDate.value });
        }
      };

      // inherit
      UIControl.prototype.init.call(this, config);

      // add links
      this.selectedDate.addHandler({
        change: function(value){
          for (var section = this.firstChild; section; section = section.nextSibling)
            section.update({ selectedDate: value });
        }
      }, this);

      this.todayDate.addLink(this.tmpl.todayText, null, getter("toFormat('%D.%M.%Y')"));

      // min/max dates

      // insert sections
      if (this.sections)
        DOM.insert(this, this.sections.map(function(sectionClass, index){
          return new CalendarSection[sectionClass]()
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
      this.todayDate.destroy();
    }

  });


  //
  //  export names
  //

  basis.namespace(namespace).extend({
    Calendar: Calendar,
    CalendarSection: CalendarSection
  });

}(basis);


//
// src/basis/ui/form.js
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

basis.require('basis.html');
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.data');
basis.require('basis.data.property');
basis.require('basis.cssom');
basis.require('basis.ui');
basis.require('basis.ui.popup');

!function(basis){

  'use strict';

 /**
  * @see ./demo/defile/form.html
  * @namespace basis.ui.form
  */

  var namespace = 'basis.ui.form';

  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;
  var Template = basis.html.Template;
  var Cleaner = basis.Cleaner;

  var complete = Object.complete;
  var coalesce = Object.coalesce;
  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var AbstractProperty = basis.data.property.AbstractProperty;
  var Property = basis.data.property.Property;
  var EventObject = basis.EventObject;

  var Selection = basis.dom.wrapper.Selection;
  var UIControl = basis.ui.Control;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var Popup = basis.ui.popup.Popup;

  var createEvent = EventObject.createEvent;


  //
  // main part
  //

  var baseFieldTemplate = new Template(
    '<div{selected|sampleContainer} class="Basis-Field">' +
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

    canHaveChildren: false,
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

      EventObject.event.keyup.call(this, event);
    },
    event_focus: createEvent('focus', 'event') && function(event){
      if (this.valid)
        this.setValid();

      EventObject.event.focus.call(this, event);
    },
    event_blur: createEvent('blur', 'event') && function(event){
      this.validate(true);

      EventObject.event.blur.call(this, event);
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
        '<div{content} class="Basis-Field-Container">' +
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

    canHaveChildren: false,

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
      '<label class="Basis-RadioGroup-Item" event-click="select">' + 
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
      '<label event-click="click">' + 
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
      '<div class="Basis-Combobox-Item" event-click="click">{titleText}</div>',

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

      this.satelliteConfig = {
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
      };

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
      if (value != '' && !value.match(/^[a-z0-9\.\-\_]+\@(([a-z][a-z0-9\-]*\.)+[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/i))
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
    
    canHaveChildren: true,
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
      '<div class="Basis-FormContent" />',

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
      '<form{formElement} class="Basis-Form">' +
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

      this.match();
    },

    init: function(config){
      MatchProperty.prototype.init.call(this, config);

      this.node.addHandler(NodeMatchHandler, this);
    },

    match: function(){
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

  basis.namespace(namespace).extend({
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
    MatchFilter: MatchFilter,
    MatchInput: MatchInput
  });

}(basis);


//
// src/basis/ui/scroller.js
//


basis.require('basis.ui');

!function() {

 /**
  * @namespace App.Ext
  */

  var namespace = 'basis.ui.scroller';

  /*basis.require('basis.layout');
  basis.require('basis.ui');*/

  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var EventObject = basis.EventObject;
  var Event = basis.dom.event;

  var classList = basis.cssom.classList;

  //
  // Main part
  //

  function getComputedStyle(element, styleProp){
    if (window.getComputedStyle)
    {
      var computedStyle = document.defaultView.getComputedStyle(element, null);
      if (computedStyle)
        return computedStyle.getPropertyValue(styleProp);
    }
    else
    {
      if (element.currentStyle)
        return element.currentStyle[styleProp];
    }
  }

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

  //requestAnimationFrame features
  var prefixes = ['webkit', 'moz', 'o', 'ms'];

  function createMethod(name, fallback){
    if (window[name])
      return window[name];

    name = name.charAt(0).toUpperCase() + name.substr(1);
    for (var i = 0, prefix; prefix = prefixes[i++];)
      if (window[prefix + name])
        return window[prefix + name];

    return fallback;
  }

  var requestAnimFrame = createMethod('requestAnimationFrame',
    function(callback, element){
      return window.setTimeout(callback, 15);
    }
  );

  var cancelRequestAnimFrame = createMethod('cancelRequestAnimFrame', clearInterval);

  //consts
  var AVARAGE_TICK_TIME_INTERVAl = 15;
  var VELOCITY_DECREASE_FACTOR = 0.94;

  //class
  var Scroller = Class(EventObject, {
    className: namespace + '.Scroller',
    /*minScrollDeltaX: 0,
    minScrollDeltaY: 0,*/
    minScrollDelta: 0,
    preventScrollX: false,
    preventScrollY: false,
    scrollPropertyType: 'style',

    event_start: EventObject.createEvent('start', 'scrollerObject'),
    event_finish: EventObject.createEvent('finish', 'scrollerObject'),
    event_startInertia: EventObject.createEvent('startInertia', 'scrollerObject'),
    event_updatePosition: EventObject.createEvent('updatePosition', 'scrollerObject', 'scrollPosition'),

    init: function(config){
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;

      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.minPositionX = 0;
      this.minPositionY = 0;

      this.maxPositionX = 0;
      this.maxPositionY = 0;

      this.viewportX = 0;
      this.viewportY = 0;

      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      this.lastViewportTargetX = this.viewportX;
      this.lastViewportTargetY = this.viewportY;

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

      /*this.onMouseMoveHandler = this.onMouseMove.bind(this);
      this.onMouseUpHandler = this.onMouseUp.bind(this);*/
      this.onUpdateHandler = this.onUpdate.bind(this);

      if (this.scrollPropertyType == 'scroll')
      {
        DOM.setStyle(this.targetElement, { overflow: 'hidden' }); 
        this.updateElementPosition = this.updatePosition_scrollTopLeft;
        this.calcDimentions = this.calcDimentions_scrollTopLeft;
      }
      else
      {
        DOM.setStyle(this.targetElement, { position: 'relative' });
        this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePosition_styleTransform : this.updatePosition_styleTopLeft;
        this.calcDimentions = this.calcDimentions_styleTopLeft;
      }

      if (this.minScrollDelta == 0)
      {
        this.minScrollDeltaYReached = true;
        this.minScrollDeltaXReached = true;
      }
    },

    updatePosition_scrollTopLeft: function(){
      if (this.scrollX)
        this.targetElement.scrollLeft = this.viewportX;
      if (this.scrollY)
        this.targetElement.scrollTop = this.viewportY;
    },
    
    updatePosition_styleTopLeft: function(){
      if (this.scrollX)
        this.targetElement.style.left = -this.viewportX + 'px';
      if (this.scrollY)
        this.targetElement.style.top = -this.viewportY + 'px';
    },

    updatePosition_styleTransform: function(){
      var deltaX = -(this.isUpdating ? this.viewportX : Math.round(this.viewportX)) + 'px';
      var deltaY = -(this.isUpdating ? this.viewportY : Math.round(this.viewportY)) + 'px';

      var style = {};
      style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');

      DOM.setStyle(this.targetElement, style);
    },

    calcDimentions_scrollTopLeft: function(){
      this.minPositionX = 0;
      this.maxPositionX = this.targetElement.scrollWidth - this.targetElement.offsetWidth;
      this.scrollX = !this.preventScrollX && this.maxPositionX > 0;

      this.minPositionY = 0;
      this.maxPositionY = this.targetElement.scrollHeight - this.targetElement.offsetHeight;
      this.scrollY = !this.preventScrollY && this.maxPositionY > 0;
    },

    calcDimentions_styleTopLeft: function(){
      this.minPositionX = 0;
      this.minPositionY = 0;

      //DOM.setStyle(this.targetElement, { overflow: 'hidden' });

      var scrollWidth = this.targetElement.scrollWidth;
      var scrollHeight = this.targetElement.scrollHeight;

      var offsetParent = this.targetElement.offsetParent;

      if (!offsetParent)
        return;

      var offsetParentWidth = offsetParent.offsetWidth;
      var offsetParentHeight = offsetParent.offsetHeight;
      
      this.maxPositionX = this.targetElement.scrollWidth - offsetParent.offsetWidth;
      this.scrollX = !this.preventScrollX && this.maxPositionX > 0;

      this.maxPositionY = this.targetElement.scrollHeight - offsetParent.offsetHeight;
      this.scrollY = !this.preventScrollY && this.maxPositionY > 0;

      //DOM.setStyle(this.targetElement, { overflow: 'visible' });
    },

    resetVariables: function(){
      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      this.lastViewportTargetX = this.viewportTargetX;
      this.lastViewportTargetY = this.viewportTargetY;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;
      
      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.minScrollDeltaXReached = false;
      this.minScrollDeltaYReached = false;

      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      if (this.targetElement.offsetWidth)
        this.calcDimentions();

      this.startViewportX = this.viewportX;
      this.startViewportY = this.viewportY;

      this.isUpdating = true;
      this.updateFrameHandle = this.nextFrame();
      this.lastUpdateTime = Date.now();

      this.startTime = this.lastUpdateTime;

      this.event_start(this);
    },

    stopUpdate: function(){
      if (!this.isUpdating)
        return;

      this.resetVariables();

      this.isUpdating = false;
      cancelRequestAnimFrame(this.updateFrameHandle);

      this.updateElementPosition();

      this.event_finish(this);
    },

    onMouseDown: function(event){
      this.stopUpdate();

      this.panningActive = true;

      this.lastMouseX = Event.mouseX(event);
      this.lastMouseY = Event.mouseY(event);

      this.lastMotionUpdateTime = Date.now();

      Event.addHandler(document, 'mousemove', this.onMouseMove, this);
      Event.addHandler(document, 'touchmove', this.onMouseMove, this);
      Event.addHandler(document, 'mouseup', this.onMouseUp, this);
      Event.addHandler(document, 'touchend', this.onMouseUp, this);

      //Event.kill(event);
      Event.cancelDefault(event);
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

        /*if (deltaX)
        {
          this.currentVelocityX = Math.abs(deltaX) / deltaTime;
          this.currentDirectionX = deltaX == 0 ? 0 : (deltaX < 0 ? -1 : 1);

          console.log('deltaX: ' + Math.abs(deltaX));
          console.log('time: ' + deltaTime);
          console.log('velocity: ' + this.currentVelocityX);
        }*/
      }

      if (this.minScrollDeltaYReached || !this.minScrollDeltaXReached)
      {
        var curMouseY = Event.mouseY(event)
        var deltaY = this.lastMouseY - curMouseY;
        this.lastMouseY = curMouseY;
        this.viewportTargetY += deltaY;
        
        /*if (deltaY)
        {
          this.currentVelocityY = Math.abs(deltaY) / deltaTime;
          this.currentDirectionY = deltaY == 0 ? 0 : (deltaY < 0 ? -1 : 1);
        }*/
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
    },

    onMouseUp: function(){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdateTime;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdateTime = 0;
      
      // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia

      //var distance = this.viewportTargetX - this.startViewportX;
      //var time = timeNow - this.startTime;
      //console.log('distance: ' + distance);
      //console.log('time: ' + time);
      /*if (time)
        console.log('expected speed: ' + (Math.abs(distance) / time));
      else
        console.log('zero time');*/

      //console.log('real speed: ' + this.currentVelocityX);

      if (this.scrollX)
      {
        this.currentVelocityX *= 1 - Math.min(1, Math.max(0, deltaTime / 100));
        //console.log('inertia speed: ' + this.currentVelocityX);
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

        //console.log('update');
        //console.log(time);
        if (this.scrollX)
        {
          delta = (this.viewportTargetX - this.lastViewportTargetX);
          this.lastViewportTargetX = this.viewportTargetX;

          if (delta)
          {
            this.currentVelocityX = Math.abs(delta) / deltaTime;
            this.currentDirectionX = delta == 0 ? 0 : (delta < 0 ? -1 : 1);

            /*console.log('deltaX: ' + Math.abs(delta));
            console.log('time: ' + deltaTime);
            console.log('velocity: ' + this.currentVelocityX);*/
          }
        }

        if (this.scrollY)
        {
          delta = (this.viewportTargetY - this.lastViewportTargetY);
          this.lastViewportTargetY = this.viewportTargetY;

          if (delta)
          {
            this.currentVelocityY = Math.abs(delta) / deltaTime;
            this.currentDirectionY = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }
      }
      else if (this.processInertia)
      {
        if (this.scrollX)
        {
          //console.log(this.currentVelocityX);
          this.viewportTargetX += this.currentDirectionX * (this.currentVelocityX *  deltaTime);
          this.currentVelocityX *= VELOCITY_DECREASE_FACTOR;

          if (this.currentVelocityX < 0.001 || this.viewportX < this.minPositionX || this.viewportX > this.maxPositionX)
          {
            this.viewportTargetX = Math.min(this.maxPositionX, Math.max(this.minPositionX, this.viewportTargetX));
            this.currentVelocityX = 0;
          }
        }

        if (this.scrollY)
        {
          this.viewportTargetY += this.currentDirectionY * (this.currentVelocityY *  deltaTime);
          this.currentVelocityY *= VELOCITY_DECREASE_FACTOR;

          if (this.currentVelocityY < 0.001 || this.viewportY < this.minPositionY || this.viewportY > this.maxPositionY)
          {
            this.viewportTargetY = Math.min(this.maxPositionY, Math.max(this.minPositionY, this.viewportTargetY));
            this.currentVelocityY = 0;
          }          
        }

        if (this.currentVelocityX == 0 && this.currentVelocityY == 0)
        {
          this.processInertia = false;          
        }
      }

      var deltaX = 0;
      var deltaY = 0;

      
      if (this.scrollX)
      {
        deltaX = (this.viewportTargetX - this.viewportX);
        var smoothingFactorX = this.panningActive || this.currentVelocityX > 0 ? 1 : 0.12;
        this.viewportX += deltaX * smoothingFactorX;
      }
      //console.log(this.scrollX);
      //console.log(this.viewportX);

      if (this.scrollY)
      {
        deltaY = (this.viewportTargetY - this.viewportY);
        var smoothingFactorY = this.panningActive || this.currentVelocityY > 0 ? 1 : 0.12;
        this.viewportY += deltaY * smoothingFactorY;
      }

      var scrollXStop = !this.scrollX || (this.currentVelocityX < 0.001 && Math.abs(deltaX) < 0.1);
      var scrollYStop = !this.scrollY || (this.currentVelocityY < 0.001 && Math.abs(deltaY) < 0.1);

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
        this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler, this.targetElement);
    },

    setPosition: function(positionX, positionY){
      this.viewportX = positionX;
      this.viewportY = positionY;
      if (this.isUpdating)
        this.stopUpdate();
      else
      {
        this.resetVariables();
        this.updateElementPosition();
      }
    },

    setTargetPosition: function(targetPositionX, targetPositionY){
      this.viewportTargetX = targetPositionX || 0;
      this.viewportTargetY = targetPositionY || 0;
      this.startUpdate();
      this.processInertia = true;
    },

    calcExpectedPosition: function(axis){
      var expectedInertiaDelta = 0;

      var currentVelocity = axis == 'x' ? this.currentVelocityX : this.currentVelocityY;
      var currentDirection = axis == 'x' ? this.currentDirectionX : this.currentDirectionY;
      var viewportTargetPosition = axis == 'x' ? this.viewportTargetX : this.viewportTargetY;
      var minPosition = axis == 'x' ? this.minPositionX : this.minPositionY;
      var maxPosition = axis == 'x' ? this.maxPositionX : this.maxPositionY;

      if (currentVelocity)
      {
        var expectedInertiaIterationCount = Math.log(0.001 / currentVelocity) / Math.log(VELOCITY_DECREASE_FACTOR);
        var velocity = currentVelocity;
        for (var i = 0; i < expectedInertiaIterationCount; i++)
        {
          expectedInertiaDelta += currentDirection * velocity * AVARAGE_TICK_TIME_INTERVAl;
          velocity *= VELOCITY_DECREASE_FACTOR;
        }
      }
      var expectedPosition = viewportTargetPosition + expectedInertiaDelta;

      return Math.max(minPosition, Math.min(maxPosition, expectedPosition));
    },
    calcExpectedPositionX: function(){
      return this.calcExpectedPosition('x');
    },
    calcExpectedPositionY: function(){
      return this.calcExpectedPosition('y');
    }
  });


  var Scroller2 = Class(EventObject, {
    //className: namespace + '.Scroller',
    minScrollDelta: 0,
    scrollX: true,
    scrollY: true,

    event_start: EventObject.createEvent('start', 'scrollerObject'),
    event_finish: EventObject.createEvent('finish', 'scrollerObject'),
    event_startInertia: EventObject.createEvent('startInertia', 'scrollerObject'),
    event_updatePosition: EventObject.createEvent('updatePosition', 'scrollerObject', 'scrollPosition'),

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

      this.lastViewportTargetX = this.viewportX;
      this.lastViewportTargetY = this.viewportY;

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

      /*this.onMouseMoveHandler = this.onMouseMove.bind(this);
      this.onMouseUpHandler = this.onMouseUp.bind(this);*/
      this.onUpdateHandler = this.onUpdate.bind(this);

      /*if (this.scrollPropertyType == 'scroll')
      {
        DOM.setStyle(this.targetElement, { overflow: 'hidden' }); 
        this.updateElementPosition = this.updatePosition_scrollTopLeft;
        this.calcDimentions = this.calcDimentions_scrollTopLeft;
      }
      else
      {
        DOM.setStyle(this.targetElement, { position: 'relative' });
        this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePosition_styleTransform : this.updatePosition_styleTopLeft;
        this.calcDimentions = this.calcDimentions_styleTopLeft;
      }*/

      this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePosition_styleTransform : this.updatePosition_styleTopLeft;

      if (this.minScrollDelta == 0)
      {
        this.minScrollDeltaYReached = true;
        this.minScrollDeltaXReached = true;
      }
    },

    /*updatePosition_scrollTopLeft: function(){
      if (this.scrollX)
        this.targetElement.scrollLeft = this.viewportX;
      if (this.scrollY)
        this.targetElement.scrollTop = this.viewportY;
    },*/
    
    updatePosition_styleTopLeft: function(){
      if (this.scrollX)
        this.targetElement.style.left = -this.viewportX + 'px';
      if (this.scrollY)
        this.targetElement.style.top = -this.viewportY + 'px';
    },

    updatePosition_styleTransform: function(){
      var deltaX = -(this.isUpdating ? this.viewportX : Math.round(this.viewportX)) + 'px';
      var deltaY = -(this.isUpdating ? this.viewportY : Math.round(this.viewportY)) + 'px';

      /*var style = {};
      style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
      DOM.setStyle(this.targetElement, style);*/

      this.targetElement.style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
    },

    resetVariables: function(){
      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      this.lastViewportTargetX = this.viewportTargetX;
      this.lastViewportTargetY = this.viewportTargetY;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;
      
      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.minScrollDeltaXReached = false;
      this.minScrollDeltaYReached = false;

      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      /*if (this.targetElement.offsetWidth)
        this.calcDimentions();*/

      /*this.startViewportX = this.viewportX;
      this.startViewportY = this.viewportY;*/

      this.isUpdating = true;
      this.updateFrameHandle = this.nextFrame();
      this.lastUpdateTime = Date.now();

      //this.startTime = this.lastUpdateTime;

      this.event_start(this);
    },

    stopUpdate: function(){
      if (!this.isUpdating)
        return;

      this.resetVariables();

      this.isUpdating = false;
      cancelRequestAnimFrame(this.updateFrameHandle);

      this.updateElementPosition();

      this.event_finish(this);
    },

    onMouseDown: function(event){
      this.stopUpdate();

      this.panningActive = true;

      this.lastMouseX = Event.mouseX(event);
      this.lastMouseY = Event.mouseY(event);

      this.lastMotionUpdateTime = Date.now();

      Event.addHandler(document, 'mousemove', this.onMouseMove, this);
      Event.addHandler(document, 'touchmove', this.onMouseMove, this);
      Event.addHandler(document, 'mouseup', this.onMouseUp, this);
      Event.addHandler(document, 'touchend', this.onMouseUp, this);

      //Event.kill(event);
      Event.cancelDefault(event);
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

        /*if (deltaX)
        {
          this.currentVelocityX = Math.abs(deltaX) / deltaTime;
          this.currentDirectionX = deltaX == 0 ? 0 : (deltaX < 0 ? -1 : 1);

          console.log('deltaX: ' + Math.abs(deltaX));
          console.log('time: ' + deltaTime);
          console.log('velocity: ' + this.currentVelocityX);
        }*/
      }

      if (this.minScrollDeltaYReached || !this.minScrollDeltaXReached)
      {
        var curMouseY = Event.mouseY(event)
        var deltaY = this.lastMouseY - curMouseY;
        this.lastMouseY = curMouseY;
        this.viewportTargetY += deltaY;
        
        /*if (deltaY)
        {
          this.currentVelocityY = Math.abs(deltaY) / deltaTime;
          this.currentDirectionY = deltaY == 0 ? 0 : (deltaY < 0 ? -1 : 1);
        }*/
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
    },

    onMouseUp: function(){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdateTime;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdateTime = 0;
      

      //var distance = this.viewportTargetX - this.startViewportX;
      //var time = timeNow - this.startTime;
      //console.log('distance: ' + distance);
      //console.log('time: ' + time);
      /*if (time)
        console.log('expected speed: ' + (Math.abs(distance) / time));
      else
        console.log('zero time');*/

      //console.log('real speed: ' + this.currentVelocityX);

      if (this.scrollX)
      {
        // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia
        this.currentVelocityX *= 1 - Math.min(1, Math.max(0, deltaTime / 100));
        //console.log('inertia speed: ' + this.currentVelocityX);
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

        //console.log('update');
        //console.log(time);
        if (this.scrollX)
        {
          delta = (this.viewportTargetX - this.lastViewportTargetX);
          this.lastViewportTargetX = this.viewportTargetX;

          if (delta)
          {
            this.currentVelocityX = Math.abs(delta) / deltaTime;
            this.currentDirectionX = delta == 0 ? 0 : (delta < 0 ? -1 : 1);

            /*
            console.log('deltaX: ' + Math.abs(delta));
            console.log('time: ' + deltaTime);
            console.log('velocity: ' + this.currentVelocityX);
            */
          }
        }

        if (this.scrollY)
        {
          delta = (this.viewportTargetY - this.lastViewportTargetY);
          this.lastViewportTargetY = this.viewportTargetY;

          if (delta)
          {
            this.currentVelocityY = Math.abs(delta) / deltaTime;
            this.currentDirectionY = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }
      }
      else if (this.processInertia)
      {
        if (this.scrollX)
        {
          //console.log(this.currentVelocityX);
          this.viewportTargetX += this.currentDirectionX * (this.currentVelocityX *  deltaTime);
          this.currentVelocityX *= VELOCITY_DECREASE_FACTOR;

          /*if (this.currentVelocityX < 0.001)
            this.currentVelocityX = 0;*/
        }

        if (this.scrollY)
        {
          this.viewportTargetY += this.currentDirectionY * (this.currentVelocityY *  deltaTime);
          this.currentVelocityY *= VELOCITY_DECREASE_FACTOR;

          /*if (this.currentVelocityY < 0.001)
            this.currentVelocityY = 0;*/
        }

        /*if (this.currentVelocityX == 0 && this.currentVelocityY == 0)
        {
          this.processInertia = false;          
        }*/
      }

      var deltaX = 0;
      var deltaY = 0;

      
      if (this.scrollX)
      {
        deltaX = (this.viewportTargetX - this.viewportX);
        var smoothingFactorX = this.panningActive || this.currentVelocityX > 0 ? 1 : 0.12;
        this.viewportX += deltaX * smoothingFactorX;
      }
      //console.log(this.scrollX);
      //console.log(this.viewportX);

      if (this.scrollY)
      {
        deltaY = (this.viewportTargetY - this.viewportY);
        var smoothingFactorY = this.panningActive || this.currentVelocityY > 0 ? 1 : 0.12;
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

      /*console.log(this.viewportX);
      console.log(this.currentVelocityX);*/
    },

    nextFrame: function(){
      if (this.isUpdating)
        this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler, this.targetElement);
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

    /*setTargetPosition: function(targetPositionX, targetPositionY){
      this.viewportTargetX = targetPositionX || 0;
      this.viewportTargetY = targetPositionY || 0;
      this.startUpdate();
      this.processInertia = true;
    }, */

    calcExpectedPosition: function(axis){
      var expectedInertiaDelta = 0;

      var currentVelocity = axis == 'x' ? this.currentVelocityX : this.currentVelocityY;
      var currentDirection = axis == 'x' ? this.currentDirectionX : this.currentDirectionY;
      var viewportTargetPosition = axis == 'x' ? this.viewportTargetX : this.viewportTargetY;

      if (currentVelocity)
      {
        var expectedInertiaIterationCount = Math.log(0.001 / currentVelocity) / Math.log(VELOCITY_DECREASE_FACTOR);
        var velocity = currentVelocity;
        for (var i = 0; i < expectedInertiaIterationCount; i++)
        {
          expectedInertiaDelta += currentDirection * velocity * AVARAGE_TICK_TIME_INTERVAl;
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


  var Scrollbar = Class(basis.ui.Node, {
    cssClassName: 'Basis-ScrollPanel-Scrollbar',

    template: 
      '<div class="Basis-Scrollbar">' +
        '<div{trackElement} class="Basis-Scrollbar-Track"></div>' +
      '</div>',

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);

      this.startProperty = this.type == 'horizontal' ? 'left' : 'top';
      this.endProperty = this.type == 'horizontal' ? 'right' : 'bottom';

      classList(this.element).add(this.type);
    },

    recalcSize: function(sizePercentage){
      DOM.display(this.element, sizePercentage < 1);

      var scrollbarSize = this.type == 'horizontal' ?  this.element.offsetWidth : this.element.offsetHeight;
      this.trackSize = scrollbarSize - scrollbarSize * sizePercentage;
    },

    updatePosition: function(positionPercentage){
      var startPosition = this.trackSize  * positionPercentage;
      var endPosition = this.trackSize - this.trackSize  * positionPercentage;

      if (startPosition < 0)
        startPosition = 0;

      if (endPosition < 0)
        endPosition = 0;

      var style = {};
      style[this.startProperty] = startPosition + 'px';
      style[this.endProperty] = endPosition + 'px';
      
      DOM.setStyle(this.tmpl.trackElement, style);
    }
  });


  var ScrollPanel = Class(basis.ui.Container, {
    useScrollbars: true,
    scrollX: true, 
    scrollY: true,
    wheelDelta: 40,

    event_realign: EventObject.createEvent('realign'),

    template: 
      '<div{element} class="Basis-ScrollPanel" event-mousewheel="onwheel">' +
        '<div{scrollElement|childNodesElement|content} class="Basis-ScrollPanel-Content"></div>' +
      '</div>',


    action: {
      onwheel: function(event){
        var delta = Event.wheelDelta(event);

        if (this.scrollX)
          this.scroller.setPositionX(this.scroller.viewportTargetX - this.wheelDelta * delta, true);
        else if (this.scrollY)
          this.scroller.setPositionY(this.scroller.viewportTargetY - this.wheelDelta * delta, true);
      }
    },

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);

      //init variables
      this.minPositionX = 0;
      this.minPositionY = 0;

      this.maxPositionX = 0;
      this.maxPositionY = 0;

      this.oldOffsetWidth = 0;
      this.oldOffsetHeight = 0;

      // create scroller
      var scrollerConfig = Object.extend(this.scroller || {}, {
        targetElement: this.tmpl.scrollElement,
        scrollX: this.scrollX,
        scrollY: this.scrollY
      });

      this.scroller = new Scroller2(scrollerConfig);

      this.scroller.addHandler({
        updatePosition: this.scrollUpdatePosition
      }, this);

      // add resize handler
      basis.layout.addBlockResizeHandler(this.tmpl.scrollElement, this.realign.bind(this));

      if (this.useScrollbars)
      {
        if (this.scrollX)
        {
          this.hScrollbar = new Scrollbar({
            type: 'horizontal',
            container: this.element
          });
        }
        
        if (this.scrollY)
        {
          this.vScrollbar = new Scrollbar({
            type: 'vertical',
            container: this.element
          });
        }

        this.scroller.addHandler({
          start: function(){
            classList(this.element).add('scrollProcess');
          },
          finish: function(){
            classList(this.element).remove('scrollProcess');
          }
        }, this);
      }
    },

    scrollUpdatePosition: function(){
      var scroller = this.scroller;
      if (!scroller.panningActive)
      {
        this.fixPosition();
        /*if (scroller.scrollX)
        {
          if (scroller.viewportX < this.minPositionX || scroller.viewportX > this.maxPositionX)
          {
            scroller.viewportTargetX = Math.min(this.maxPositionX, Math.max(this.minPositionX, scroller.viewportTargetX));
            scroller.currentVelocityX = 0;
            scroller.startUpdate();
          }
        }

        if (scroller.scrollY)
        {
          if (scroller.viewportY < this.minPositionY || scroller.viewportY > this.maxPositionY)
          {
            scroller.viewportTargetY = Math.min(this.maxPositionY, Math.max(this.minPositionY, scroller.viewportTargetY));
            scroller.currentVelocityY = 0;
            scroller.startUpdate();
          }          
        }*/

        //scroller.startUpdate();
      }

      if (this.useScrollbars)
      {
        if (this.scrollX)
          this.hScrollbar.updatePosition(scroller.viewportX / this.maxPositionX);

        if (this.scrollY)
          this.vScrollbar.updatePosition(scroller.viewportY / this.maxPositionY);
      }
    },

    fixPosition: function(){
      var scroller = this.scroller;

      /*var positionX = scroller.viewportX;
      var positionY = scroller.viewportY;
      var needFix = false;*/

      if (this.scrollX && (scroller.viewportX < this.minPositionX || scroller.viewportX > this.maxPositionX))
      {
        var positionX = Math.min(this.maxPositionX, Math.max(this.minPositionX, scroller.viewportX));
        //needFix = true;
        scroller.setPositionX(positionX, true);
      }

      if (this.scrollY && (scroller.viewportY < this.minPositionY || this.scroller.viewportY > this.maxPositionY))
      {
        var positionY = Math.min(this.maxPositionY, Math.max(this.minPositionY, scroller.viewportY));
        scroller.setPositionY(positionY, true);
        //needFix = true;
      }

      /*if (needFix)
        scroller.setPosition(positionX, positionY, smooth);*/
    },

    realign: function(){
      this.calcDimentions();

      this.scrollUpdatePosition();
      this.event_realign();
    },
    
    calcDimentions: function(){
      if (!this.element.parentNode)
        return;

      if (this.scrollX)
      {
        //DOM.setStyle(this.tmpl.scrollElement, { overflowX: 'hidden' });

        var containerWidth = this.element.offsetWidth;
        var scrollWidth = this.tmpl.scrollElement.scrollWidth;
        this.maxPositionX = Math.max(0, scrollWidth - containerWidth);

        //DOM.setStyle(this.tmpl.scrollElement, { overflowX: 'visible' });
      }

      if (this.scrollY)
      {
        var containerHeight = this.element.offsetHeight;
        var scrollHeight = this.tmpl.scrollElement.scrollHeight;
        this.maxPositionY = Math.max(0, scrollHeight - containerHeight);
      }

      //var scrollX = !this.preventScrollX && this.maxPositionX > 0;

      //var scrollY = !this.preventScrollY && this.maxPositionY > 0;

      if (this.useScrollbars)
      {
        /*DOM.display(this.hScrollbar.element, scrollX);
        DOM.display(this.vScrollbar.element, scrollY);*/

        if (this.scrollX)
          this.hScrollbar.recalcSize(containerWidth / scrollWidth);

        if (this.scrollY)
          this.vScrollbar.recalcSize(containerHeight / scrollHeight);
      }

      /*this.scroller.scrollX = scrollX;
      this.scroller.scrollY = scrollY;*/
    },

    destroy: function(){
      this.scroller.destroy();

      basis.ui.Node.prototype.destroy.call(this);
    }
  });



  //
  // export names
  //

  basis.namespace(namespace).extend({
    Scroller: Scroller,
    Scroller2: Scroller2,
    ScrollPanel: ScrollPanel
  });

}(basis);


//
// src/basis/ui/toc.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.html');
basis.require('basis.cssom');

//
// TODO: migrate to new basis (remove behaviour, events and so on)
//

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.toc
  */  

  var namespace = 'basis.ui.toc';


  //
  // import names
  //
    
  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;

  var nsWrappers = basis.dom.wrapper;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var Modificator = basis.animation.Modificator;


  //
  // main part
  //

 /**
  * @class
  */
  var TocControlItemHeader = Class(UINode, {
    className: namespace + '.TocControlItemHeader',
    template:
      '<div class="TocControl-Item-Header" event-click="scrollTo">' +
        '<span>{titleText}</span>' +
      '</div>',

    action: {
      scrollTo: function(){
        if (this.owner && this.owner.parentNode)
          this.owner.parentNode.scrollToNode(this.owner);
      }
    },

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.titleText.nodeValue = this.titleGetter(this) || '[no title]';
    },

    titleGetter: Function.getter('data.title')
  });

  var TocControlItem = Class(UIContainer, {
    className: namespace + '.TocControlItem',
    template:
      '<div class="TocControl-Item">' +
        '<span{header}/>' +
        '<div{content|childNodesElement} class="TocControl-Item-Content"/>' +
      '</div>',

    satelliteConfig: {
      header: {
        delegate: Function.$self,
        instanceOf: TocControlItemHeader
      }
    }
  });

  var MW_SUPPORTED = true;
  var TocControlHeaderList = Class(UIContainer, {
    className: namespace + '.TocControlHeaderList',
    behaviour: {
      click: function(event, node){
        if (node)
          node.delegate.parentNode.scrollToNode(node.delegate);
      }
    },
    init: function(config){
      this.inherit(config);

      this.document = this;

      if (MW_SUPPORTED)
      {
        Event.addHandler(this.element, 'mousewheel', function(event){
          //console.log('mousewheel')
          try {
            this.owner.content.dispatchEvent(event);
          } catch(e) {
            MW_SUPPORTED = false;
            Event.removeHandler(this.element, 'mousewheel');
          }
        }, this);
      }

      this.addEventListener('click');
    }
  });

 /**
  * @class
  */
  var TocControl = Class(nsWrappers.Control, {
    className: namespace + '.Control',
    childClass: TocControlItem,
    template:
      '<div{element} class="TocControl">' +
        '<div{content|childNodesElement} class="TocControl-Content"/>' +
      '</div>',

    behaviour: {
      childNodesModified: function(object, delta){
        this.recalc();
      }
    },

    clientHeight_: -1,
    scrollHeight_: -1,
    scrollTop_: -1,
    lastTopPoint: -1,
    lastBottomPoint: -1,
    isFit: true,

    init: function(config){
      this.inherit(Object.complete({ childNodes: null }, config));

      var headerClass = this.childClass.prototype.satelliteConfig.header.instanceOf;
      this.meterHeader = new headerClass({
        container: this.element,
        data: { title: 'meter' }
      });
      this.meterElement = this.meterHeader.element;
      cssom.setStyle(this.meterElement, {
        position: 'absolute',
        visibility: 'hidden'
      });

      this.childNodesDataset = new nsWrappers.ChildNodesDataset(this);

      this.header = new TocControlHeaderList({
        container: this.element,
        childClass: headerClass,
        collection: this.childNodesDataset,
        cssClassName: 'TocControlHeader'
      });
      this.footer = new TocControlHeaderList({
        container: this.element,
        childClass: headerClass,
        collection: this.childNodesDataset,
        cssClassName: 'TocControlFooter'
      });

      DOM.hide(this.header.element);
      DOM.hide(this.footer.element);

      this.header.owner = this;
      this.footer.owner = this;
      
      this.thread = new basis.Animation.Thread({
        duration: 400,
        interval: 15
      });
      var self = this;
      this.modificator = new Modificator(this.thread, function(value){
        //console.log('set scrollTop ', self.content.scrollTop = parseInt(value));
        self.content.scrollTop = parseInt(value);
        self.recalc();
      }, 0, 0, true)
      this.modificator.timeFunction = function(value){
        return Math.sin(Math.acos(1 - value));
      }

      Event.addHandler(this.content, 'scroll', this.recalc, this);
      Event.addHandler(window, 'resize', this.recalc, this);
      this.addEventListener('click', 'click', true);

      if (config.childNodes)
        this.setChildNodes(config.childNodes);

      this.timer_ = setInterval(function(){ self.recalc() }, 500);
    },
    scrollToNode: function(node){
      if (node && node.parentNode === this)
      {
        var scrollTop = Math.min(this.content.scrollHeight - this.content.clientHeight, this.topPoints[DOM.index(node)]);

        if (this.thread)
        {
          var curScrollTop = this.content.scrollTop;
          this.modificator.setRange(curScrollTop, curScrollTop);
          this.thread.stop();
          this.modificator.setRange(curScrollTop, scrollTop);
          this.thread.start();
        }
        else
        {
          this.content.scrollTop = scrollTop;
          //console.log('set scroll top#2', this.content.scrollTop = scrollTop);
        }
      }
    },

   /**
    * xx
    */
    recalc: function(){
      //console.log('>>', this.content.scrollTop);

      var content = this.content;
      var clientHeight = content.clientHeight;
      var scrollHeight = content.scrollHeight;
      var scrollTop = content.scrollTop;
      var isFit = clientHeight == scrollHeight;

      if (this.clientHeight_ != clientHeight || this.scrollHeight_ != scrollHeight)
      {
        // save values 
        this.clientHeight_ = clientHeight;
        this.scrollHeight_ = scrollHeight;

        var top = [];
        var bottom = [];

        if (!isFit)
        {
          // calc scroll points
          var headerElementHeight = this.meterElement.offsetHeight;
          var topHeight = 0;
          var bottomHeight = headerElementHeight * this.childNodes.length - clientHeight;
          for (var node, i = 0; node = this.childNodes[i]; i++)
          {
            var height = node.element.offsetHeight;
            var offsetTop = node.element.offsetTop;

            top.push(offsetTop ? offsetTop - topHeight : top[i - 1] || 0);
            bottom.push(offsetTop ? offsetTop + bottomHeight : bottom[i - 1] || bottomHeight);

            topHeight += headerElementHeight;
            bottomHeight -= headerElementHeight;
          }
        }

        this.topPoints = top;
        this.bottomPoints = bottom;

        // values that's trigger for update headers
        this.scrollTop_ = -1;
        this.lastTopPoint = -1;
        this.lastBottomPoint = -1;
      }

      if (this.isFit != isFit)
      {
        this.isFit = isFit;
        DOM.display(this.header.element, !isFit);
        DOM.display(this.footer.element, !isFit);
      }

      if (isFit)
        return;

      if (this.scrollTop_ != scrollTop)
      {
        this.scrollTop_ = scrollTop;

        if (!isFit)
        {
          var topPoint = this.topPoints.binarySearchPos(scrollTop);
          var bottomPoint = this.bottomPoints.binarySearchPos(scrollTop);
          
          if (this.lastTopPoint != topPoint)
          {
            this.lastTopPoint = topPoint;
            this.header.childNodes.forEach(function(node, index){
              node.element.style.display = index >= topPoint ? 'none' : '';
            });
          }

          if (this.lastBottomPoint != bottomPoint)
          {
            this.lastBottomPoint = bottomPoint;
            this.footer.childNodes.forEach(function(node, index){
              node.element.style.display = index < bottomPoint ? 'none' : '';
            });
          }
        }
        else
        {
          this.lastTopPoint = 0;
          this.lastBottomPoint = this.childNodes.length;
        }
      }
    },
    destroy: function(){
      clearInterval(this.timer_);

      this.thread.destroy();
      this.modificator.destroy();
      this.header.destroy();
      this.footer.destroy();
      this.childNodesDataset.destroy();

      Event.removeHandler(this.content, 'scroll', this.recalc, this);
      Event.removeHandler(window, 'resize', this.recalc, this);

      this.inherit();
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    Control: TocControl,
    ControlItem: TocControlItem,
    ControlItemHeader: TocControlItemHeader,
    ControlHeaderList: TocControlHeaderList
  });

}(basis);

//
// src/basis/ui/slider.js
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
 */

basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.html');
basis.require('basis.layout');
basis.require('basis.dragdrop');

!function(basis){

 /**
  * @namespace basis.ui.slider
  */ 
  
  var namespace = 'basis.ui.slider';


  //
  // import names
  //

  var DOM = basis.dom;
  var Event = basis.dom.event;

  var createEvent = basis.EventObject.createEvent;
  var classList = basis.cssom.classList;

  var DragDropElement = basis.dragdrop.DragDropElement;
  var Box = basis.layout.Box;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;


  //
  // main part
  //

  var KEY_PLUS = 187;      // +
  var KEY_KP_PLUS = 107;   // KEYPAD +
  var KEY_MINUS = 189;     // -
  var KEY_KP_MINUS = 109;  // KEYPAD -

  function percent(value){
    return (100 * value).toFixed(4) + '%';
  }

  function updateSelection(paginator){
    var node = paginator.childNodes.search(paginator.activePage_, 'data.pageNumber');
    if (node)
      node.select();
    else
      paginator.selection.clear();
  }

 /**
  * @class
  */
  var Mark = UINode.subclass({
    className: namespace + '.Slider.Mark',

    pos: 0,
    caption: String.Entity.nbsp,

    template:
      '<div class="Basis-Slider-Mark">' +
        '<span class="Basis-Slider-Mark-CaptionWrapper">' +
          '<span class="Basis-Slider-Mark-Caption">' +
            '{text}' +
          '</span>' +
        '</span>' +
      '</div>',

    init: function(config){
      UINode.prototype.init.call(this, config);
      DOM.setStyle(this.element, {
        left: (100 * this.pos) + '%',
        width: (100 * this.width) + '%'
      });

      this.tmpl.text.nodeValue = this.caption;

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
    className: namespace + '.Slider.MarkLayer',

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
      if (this.count > 0)
      {
        var self = this;
        marks.push.apply(marks, Array.create(this.count, function(idx){
          var p = (idx + 1) / self.count;
          var value = this.closest(p);
          var pos = ((value - this.min) / this.range_);

          return {
            pos: pos,
            caption: self.captionFormat(value),
            isLast: self.count == idx + 1
          }
        }, this.owner_));
      }

      var pos = 0;
      marks = marks.filter(Function.$isNotNull).sortAsObject('pos').map(function(mark){
        var s = mark.pos;
        mark.width = mark.pos - pos;
        mark.pos = pos;
        pos = s;
        return mark;
      }, this);

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

  var DRAGDROP_HANDLER = {
    move: function(config){
      var scrollbar = this.tmpl.scrollbar;
      var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
      this.setValue_(pos * this.count_);
    }
  };

  function stepAction(event){
    var delta = Event.wheelDelta(event);

    if (delta)
    {
      DOM.focus(this.element);
      if (delta < 0)
        this.stepDown();
      else
        this.stepUp();
    }
    else
    {
      var key = Event.key(event);
      switch(key){
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
    }
  }

 /**
  * @class
  */
  var Slider = UINode.subclass({
    className: namespace + '.Slider',

    event_change: createEvent('change'),

    captionFormat: function(value){
      return Math.round(Number(value));
    },

    min: 0,
    max: 100,
    step: 1,
    value: NaN,
    value_: NaN,

    template:
    	'<div{element} class="Basis-Slider Basis-Slider-MinMaxInside" event-mousewheel="step" event-keyup="step" event-mousedown="focus" tabindex="0">' +
        '<div class="Basis-Slider-MinLabel"><span class="caption">{minValue}</span></div>' +
        '<div class="Basis-Slider-MaxLabel"><span class="caption">{maxValue}</span></div>' +
        '<div{scrollbarContainer} class="Basis-Slider-ScrollbarContainer" event-click="jumpTo">' +
      	  '<div{marks} class="Basis-Slider-MarkLayers"/>' +
          '<div{scrollbar} class="Basis-Slider-Scrollbar">' +
            '<div{scrollTrumb} class="Basis-Slider-ScrollbarSlider"></div>' +
          '</div>' +
        '</div>' +
    	'</div>',

    action: {
      jumpTo: function(event){
        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
        this.setValue_(pos * this.count_);
      },
      focus: function(){
        DOM.focus(this.element);
      },
      step: stepAction
    },

    satelliteConfig: {
      marks: {
        instanceOf: UIContainer.subclass({
          className: namespace + '.MarkLayers',
          template: '<div class="Basis-Slider-MarkLayers"/>',
          childClass: MarkLayer
        })
      }
    },

    marks: 'auto',

    init: function(config){
      // save init values
      var step = this.step;
      var value = this.value;

      // make new values possible
      this.step = 0;
      this.value = this.min;
      this.value_ = 0;

      // inherit
      UINode.prototype.init.call(this, config);

      // set properties
      this.setProperties(this.min, this.max, step);
      this.setValue(isNaN(value) ? this.min : value);

      // add drag posibility for slider
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
    setProperties: function(min, max, step){
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
        this.count_ = Math.ceil((max - min) / step);

        this.step = step;
        this.min = min;
        this.max = this.min + this.count_ * this.step;

        this.range_ = this.max - this.min;

        this.tmpl.minValue.nodeValue = this.captionFormat(this.min);
        this.tmpl.maxValue.nodeValue = this.captionFormat(this.max);
        classList(this.element).bool('NoMax', this.max == this.min);

        if (this.marks)
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
              layerConfig.count = Math.min(this.count_, 20);

            return layerConfig;
          }, this));
        }

        this.setValue(this.value || this.min);
      }
    },
    closest: function(pos){
      return this.normalize(this.min + this.range_ * pos.fit(0, 1) + (this.step / 2));
    },
    normalize: function(value){
      if (value < this.min)
        value = this.min;
      else
        if (value > this.max)
          value = this.max;

      return this.min + Math.floor(0.00001 + (value - this.min) / this.step) * this.step;
    },
    stepUp: function(count){
      this.setValue_(this.value_ + parseInt(count || 1));
    },
    stepDown: function(count){
      this.setValue_(this.value_ - parseInt(count || 1));
    },
    setValue_: function(newValue){
      newValue = Math.round(newValue).fit(0, this.count_);

      if (this.value_ != newValue)
      {
        this.value_ = newValue;

        var oldValue = this.value;

        this.value = this.normalize(this.min + newValue * this.step);
        this.tmpl.scrollTrumb.style.left = percent(newValue / this.count_);

        this.event_change(this, oldValue);
      }
    },
    setValue: function(newValue){
      this.setValue_((newValue - this.min) / this.step);
    },
    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  Object.extend(Slider, {
    MarkLayer: MarkLayer,
    Mark: Mark
  });

  basis.namespace(namespace).extend({
    Slider: Slider
  });

}(basis);

//
// src/basis/ui/resizer.js
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
 * Roman Dvornov <rdvornov@gmail.com>
 * Vladimir Ratsev <wuzykk@gmail.com>
 * Vladimir Fateev <vnfateev@gmail.com>
 *
 */

basis.require('basis.dom');
basis.require('basis.cssom');
basis.require('basis.dragdrop');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.resizer
  */

  var namespace = 'basis.ui.resizer';


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

  function getComputedStyle(element, styleProp){
    if (window.getComputedStyle)
    {
      var computedStyle = document.defaultView.getComputedStyle(element, null);
      if (computedStyle)
        return computedStyle.getPropertyValue(styleProp);
    }
    else
    {
      if (element.currentStyle)
        return element.currentStyle[styleProp];
    }
  }

  var resizerDisableRule = cssom.cssRule('IFRAME');

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
    },
    event_start: function(cfg){
      super_.event_start.call(this, cfg);

      cfg.delta = PROPERTY_DELTA[this.property];
      cfg.factor = this.factor;

      var parentNode = this.element.parentNode;
      var parentNodeSize;

      // determine dir
      var cssFloat = getComputedStyle(this.element, 'float');
      var cssPosition = getComputedStyle(this.element, 'position');
      
      if (cfg.delta == 'deltaY')
      {
        parentNodeSize = parentNode.clientHeight - parseFloat(getComputedStyle(parentNode, 'padding-top')) - parseFloat(getComputedStyle(parentNode, 'padding-bottom'));
        cfg.offsetStart = this.element.offsetHeight;
        if (isNaN(cfg.factor))
          cfg.factor = cssPosition != 'static' && getComputedStyle(this.element, 'bottom') != 'auto'
            ? -1
            : 1;
      }
      else
      {
        parentNodeSize = parentNode.clientWidth - parseFloat(getComputedStyle(parentNode, 'padding-left')) - parseFloat(getComputedStyle(parentNode, 'padding-right'));
        cfg.offsetStart = this.element.offsetWidth;

        if (isNaN(cfg.factor))
          cfg.factor = cssFloat == 'right' || (cssPosition != 'static' && getComputedStyle(this.element, 'right') != 'auto')
            ? -1
            : 1;
      }

      cfg.offsetStartInPercent = 100/parentNodeSize;
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
    },

   /**
    * @constructor
    */
    init: function(config){
      this.resizer = DOM.createElement('.Basis-Resizer');
      this.resizer.style.cursor = PROPERTY_CURSOR[this.property][1];
      
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
    }
  }});


  //
  // export names
  //

  basis.namespace(namespace).extend({
    Resizer: Resizer
  });

}(basis);

//
// src/basis/ui/paginator.js
//

/*!
 * Basis javasript library 
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

basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.dragdrop');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.paginator
  */ 
  

  var namespace = 'basis.ui.paginator';

  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var createEvent = basis.EventObject.createEvent;
  var classList = basis.cssom.classList;

  var Box = basis.layout.Box;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var UIControl = basis.ui.Control;
  var UINode = basis.ui.Node;


  //
  // main part
  //

  function percent(value){
    return (100 * value).toFixed(4) + '%';
  }

  function updateSelection(paginator){
    var node = paginator.childNodes.search(paginator.activePage_, 'data.pageNumber');
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

    pageGetter: Function.getter('data.pageNumber'),
    urlGetter: Function.$self,

    template:
      '<td{element} class="Basis-PaginatorNode">' +
        '<span>' +
          '<a{link|selected} event-click="click" href="#">{pageNumber}</a>' +
        '</span>' +
      '</td>',

    templateUpdate: function(tmpl, event, delta){
      var page = this.pageGetter(this);

      tmpl.pageNumber.nodeValue = page + 1;
      tmpl.link.href = this.urlGetter(page);
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
        this.parentNode.setActivePage(this.pageGetter(this));
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
      this.setSpanStartPage(Math.round(pos * (this.pageCount_ - this.pageSpan_)));
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
    	'<div{element} class="Basis-Paginator" event-mousewheel="scroll">' +
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
        this.setSpanStartPage(Math.floor(pos * this.pageCount_) - Math.floor(this.pageSpan_ / 2));
      },
      scroll: function(event){
        var delta = Event.wheelDelta(event);
        if (delta)
          this.setSpanStartPage(this.spanStartPage_ + delta);
      }
    },

    event_activePageChanged: createEvent('activePageChanged'),
    event_pageCountChanged: createEvent('pageCountChanged'),

    pageSpan_: 0,
    pageCount_: 0,
    activePage_: 0,
    spanStartPage_: -1,

    init: function(config){
      UIControl.prototype.init.call(this, config);

      this.setProperties(config.pageCount || 0, config.pageSpan);
      this.setActivePage(Math.max(config.activePage - 1, 0), true);

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

      if (pageSpan != this.pageSpan_)
      {
        this.pageSpan_ = pageSpan;
        this.setChildNodes(Array.create(pageSpan, function(idx){
          return {
            data: {
              pageNumber: idx
            }
          }
        }));
      }

      if (this.pageCount_ != pageCount)
      {
        this.pageCount_ = pageCount;

        var rangeWidth = 1 / pageCount;
        var activePageMarkWidth = rangeWidth / (1 - rangeWidth);

        this.tmpl.activePageMark.style.width = percent(activePageMarkWidth);
        this.tmpl.activePageMarkWrapper.style.width = percent(1 - rangeWidth);

        this.event_pageCountChanged(this.pageCount_);
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
      this.setActivePage(arguments.length == 3 ? activePage : this.activePage_);
    },
    setActivePage: function(newActivePage, spotlightActivePage){
      newActivePage = newActivePage.fit(0, this.pageCount_ - 1);
      if (newActivePage != this.activePage_)
      {
        this.activePage_ = Number(newActivePage);
        updateSelection(this);
        this.event_activePageChanged(newActivePage);
      }

      this.tmpl.activePageMark.style.left = percent(newActivePage / Math.max(this.pageCount_ - 1, 1));

      if (spotlightActivePage)
        this.spotlightPage(this.activePage_);
    },
    spotlightPage: function(pageNumber){
      this.setSpanStartPage(pageNumber - Math.round(this.pageSpan_ / 2) + 1);
    },
    setSpanStartPage: function(pageNumber){
      pageNumber = pageNumber.fit(0, this.pageCount_ - this.pageSpan_);
      if (pageNumber != this.spanStartPage_)
      {
        this.spanStartPage_ = pageNumber;

        for (var i = this.childNodes.length; i --> 0;)
          this.childNodes[i].update({ pageNumber: pageNumber + i });

        updateSelection(this);
      }

      this.tmpl.scrollTrumb.style.left = percent((pageNumber / Math.max(this.pageCount_ - this.pageSpan_, 1)).fit(0, 1));
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UIControl.prototype.destroy.call(this);
    }
  });

  // export names

  basis.namespace(namespace).extend({
    Paginator: Paginator
  });

}(basis);


//
// src/basis/ui/pageslider.js
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
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

basis.require('basis.dom');
basis.require('basis.cssom');
basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.ui.scroller');

!function(basis){

  'use strict';

 /**
  * @namespace Basis.Plugin
  */ 

  var namespace = 'basis.ui.pageslider';


  //
  // import names
  //

  var DOM = basis.dom;
  var Class = basis.Class;

  var classList = basis.cssom.classList;


  //
  // main part
  //
  
  var namespace = 'basis.ui';

  var PageSlider = Class(basis.ui.tabs.PageControl, {
    className: namespace + '.PageSlider',

    template: 
      '<div class="Basis-PageControl Basis-PageSlider">' +
        '<div/>' +
      '</div>',

    event_childNodesModified: function(node, delta){
      basis.ui.tabs.PageControl.event_childNodesModified.call(this, node, delta);

      /*this.pageSliderCssRule.setStyle({
        width: (100 / this.childNodes.length) + '%'
      });*/

      /*DOM.setStyle(this.element, {
        width: (100 * this.childNodes.length) + '%'
      });*/

      for (var i = 0, child; child = this.childNodes[i]; i++)
        basis.cssom.setStyle(child.element, { left: (100 * i) + '%' });
    },

    init: function(config){
      var cssClassName = 'gerericRule_' + this.eventObjectId;
      this.pageSliderCssRule = basis.cssom.cssRule('.' + cssClassName + ' > .Basis-Page');

      this.constructor.superClass_.prototype.init.call(this, config);

      classList(this.element).add(cssClassName);

      this.scroller = new basis.ui.Scroller({
        targetElement: this.element,
        preventScrollY: true,
        minScrollDelta: 10,
        handler: {
          startInertia: function(scroller){
            var selectedItem = this.selection.pick();
            if (selectedItem)
            {
              var slideToItem = selectedItem;
              if (scroller.currentDirectionX == 0 || 
                (scroller.currentDirectionX == 1 && scroller.viewportX < selectedItem.element.offsetLeft) || 
                (scroller.currentDirectionX == -1 && scroller.viewportX > selectedItem.element.offsetLeft)
              )
              {
                scroller.minScrollDeltaXReached = true;
                var slideToItemPosition = Math.round(scroller.viewportX / selectedItem.element.offsetWidth);
                slideToItem = this.childNodes[slideToItemPosition];
              }
              else
                slideToItem = scroller.currentDirectionX == 1 ? selectedItem.nextSibling : selectedItem.previousSibling;

              if (!slideToItem)
                slideToItem = selectedItem;

              if (slideToItem == selectedItem)
                this.slideToPage(selectedItem);
              else
                slideToItem.select();
            }

            scroller.currentVelocityX = 0;
          }
        },
        handlerContext: this
      });

      this.selection.addHandler({
        datasetChanged: function(){
          var item = this.pick();
          if (item)
            item.parentNode.slideToPage(item);
        }
      });

      if (this.selection.itemCount)
      {
        var self = this;
        setTimeout(function(){
          self.slideToPage(self.selection.pick())
        }, 0);
      }
    },

    slideToPage: function(page){
      this.scroller.setTargetPosition(page.element.offsetLeft);
    },

    destroy: function(){
      this.constructor.superClass_.prototype.init.call(this, config);

      DOM.Style.getStyleSheet().removeCssRule(this.pageSliderCssRule.rule);
      this.pageSliderCssRule = null;

      this.scroller.destroy();
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    PageSlider: PageSlider
  });

}(basis);

//
// src/basis/ui/canvas.js
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
basis.require('basis.dom.wrapper');
basis.require('basis.html');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.canvas
  */

  var namespace = 'basis.ui.canvas';


  //
  // import names
  //

  var Node = basis.dom.wrapper.Node;
  var UINode = basis.ui.Node;


  //
  // Main part
  //

  var Shape = Node.subclass({
    draw: function(context){
      context.save();
      context.fillStyle = 'red';
      context.fillRect(this.data.value * 10,10,30,30);
      context.restore();
    },
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
    }
  });

 /**
  * @class
  */
  var Canvas = UINode.subclass({
    template:
      '<canvas{canvas}>' +
        '<div>Canvas doesn\'t support.</div>' +
      '</canvas>',

    childFactory: function(config){
      return new this.childClass(config);
    },
    childClass: Shape,

    drawCount: 0,
    lastDrawUpdateCount: -1,

    init: function(config){
      UINode.prototype.init.call(this, config);
     
      this.element.width = this.width;
      this.element.height = this.height;
      this.updateCount = 0;

      var canvasElement = this.tmpl.canvas;
      if (canvasElement && canvasElement.getContext)
        this.context = canvasElement.getContext('2d');

      this.updateTimer_ = setInterval(this.draw.bind(this), 1000/60);
    },
    reset: function(){
      /*var ctx = this.context;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, this.element.clientWidth, this.element.clientHeight);
      ctx.restore();/**/
      this.element.width = this.element.clientWidth;
      this.element.height = this.element.clientHeight;
      /*if (this.context)
      {
        this.context.clearRect(0, 0, this.element.width, this.element.height)
      }*/
    },
    isNeedToDraw: function(){
      return this.context && (
        this.updateCount != this.lastDrawUpdateCount
        ||
        this.element.width != this.lastDrawWidth
        ||
        this.element.height != this.lastDrawHeight
      );
    },
    draw: function(){
      if (!this.isNeedToDraw())
        return false;

      this.lastDrawWidth = this.element.width;
      this.lastDrawHeight = this.element.height;
      this.lastDrawUpdateCount = this.updateCount;
      this.drawCount = this.drawCount + 1;

      this.reset();

      this.drawFrame();

      return true;
    },
    drawFrame: function(){
      for (var node = this.firstChild; node; node = node.nextSibling)
        node.draw(this.context);
    },
    destroy: function(){
      clearInterval(this.updateTimer_);

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    Canvas: Canvas,
    Shape: Shape
  });

}(basis);


//
// src/basis/format/highlight.js
//

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

basis.require('basis.ui');

!function(basis){ 

  'use strict';
  
 /**
  * @namespace basis.format.highlight
  */

  var namespace = 'basis.format.highlight';


  //
  // import names
  //

  var Class = basis.Class;
  var UINode = basis.ui.Node;


  //
  // Main part
  //

  var keywords = 
    'break case catch continue ' +
    'default delete do else false ' +
    'for function if in instanceof ' +
    'new null return super switch ' +
    'this throw true try typeof var while with';

  var keywordRegExp = new RegExp('\\b(' + keywords.qw().join('|') + ')\\b', 'g');

 /**
  * @func
  */
  function highlight(code, keepFormat){

    function normalize(code, offset){
      code = code
               .trimRight()
               .replace(/\r\n|\n\r|\r/g, '\n')

      if (!keepFormat)
        code = code.replace(/^(?:\s*[\n]+)+?([ \t]*)/, '$1');

      // fix empty strings
      code = code
               .replace(/\n[ \t]+/g, function(m){ return m.replace(/\t/g, '  '); })
               .replace(/\n[ \t]+\n/g, '\n\n');

      if (!keepFormat)
      {
        // normalize code offset
        var minOffset = 1000;
        var lines = code.split(/\n+/);
        var startLine = Number(code.match(/^function/) != null); // hotfix for function.toString()
        for (var i = startLine; i < lines.length; i++)
        {
          var m = lines[i].match(/^\s*/);
          if (m[0].length < minOffset)
            minOffset = m[0].length;
          if (minOffset == 0)
            break;
        }

        if (minOffset > 0)
          code = code.replace(new RegExp('(^|\\n) {' + minOffset + '}', 'g'), '$1');
      }

      code = code.replace(new RegExp('(^|\\n)( +)', 'g'), function(m, a, b){ return a + '\xA0'.repeat(b.length)});

      return code; 
    }

    function getMatches(code){
      function addMatch(kind, start, end, rn){
        if (lastMatchPos != start)
          result.push(code.substring(lastMatchPos, start).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));

        lastMatchPos = end + 1;

        result.push('<span class="token-' + kind + '">' + code.substring(start, end + 1) + '</span>' + (rn || ''));
      }

      var result = [];
      var sym = code.toArray();
      var start;
      var lastMatchPos = 0;

      for (var i = 0; i < sym.length; i++)
      {
        if (sym[i] == '\'')
        {
          start = i;
          while (++i < sym.length)
          {
            if (sym[i] == '\'')
            {
              addMatch('string', start, i);
              break;
            }

            if (sym[i] == '\n')
              break;

            if (sym[i] == '\\')
            {
              i++;
              if (sym[i] == '\n')
              {
                addMatch('string', start, i - 1);
                start = i + 1;
              }
            }
          }
        }
        else if (sym[i] == '\"')
        {
          start = i;
          while (++i < sym.length)
          {
            if (sym[i] == '\"')
            {
              addMatch('string', start, i);
              break;
            }

            if (sym[i] == '\n')
              break;

            if (sym[i] == '\\')
            {
              i++;
              if (sym[i] == '\n')
              {
                addMatch('string', start, i - 1);
                start = i;
              }
            }
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
      }

      result.push(code.substr(lastMatchPos).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));

      return result;
    }

    //  MAIN PART

    var html = getMatches(normalize(code).replace(/</g, '&lt;'));

    //console.log('getmatches ' + (new Date - t));

    var lines = html.join('').split('\n');
    var numberWidth = String(lines.length >> 1).length;
    var res = [];
    for (var i = 0; i < lines.length; i++)
    {
      res.push(
        '<div class="line ' + (i % 2 ? 'odd' : 'even') + '">' +
          '<span class="lineContent">' + 
            '<input class="lineNumber" value="' + (i + 1).lead(numberWidth) + '" type="none" unselectable="on" readonly="readonly" tabindex="-1" />' +
            '<span class="over"></span>' +
            (lines[i] + '\r\n') + 
          '</span>' +
        '</div>'
      )
    }
    //console.log('build html ' + (new Date - t));
    return res.join('');
  }

 /**
  * @class
  */
  var SourceCodeNode = Class(UINode, {
    className: namespace + '.SourceCodeNode',

    template:
      '<pre{element|codeElement} class="Basis-SyntaxHighlight"/>',

    codeGetter: Function.getter('data.code'),
    normalize: true,

    templateUpdate: function(tmpl, event, delta){
      var code = this.codeGetter(this);
      if (code != this.code_)
      {
        this.code_ = code;
        this.tmpl.codeElement.innerHTML = highlight(code, !this.normalize);
      }
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    // functions
    highlight: highlight,

    // classes
    SourceCodeNode: SourceCodeNode
  });

}(basis);


//
// src/package/all.js
//


  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.html');
  basis.require('basis.date');
  basis.require('basis.dragdrop');
  basis.require('basis.animation');
  basis.require('basis.xml');
  basis.require('basis.layout');
  basis.require('basis.crypt');
  basis.require('basis.data');
  basis.require('basis.data.dataset');
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
  basis.require('basis.ui.toc');
  basis.require('basis.ui.slider');
  basis.require('basis.ui.resizer');
  basis.require('basis.ui.paginator');
  basis.require('basis.ui.pageslider');
  basis.require('basis.ui.canvas');
  basis.require('basis.format.highlight');