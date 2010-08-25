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
 * - Class (provides inheritance)
 * - Browser (version detections & Cookies interface)
 * - DOM
 * - Event
 * - Html (generaly template)
 * - CSS (generaly className interface)
 * - Data
 * - Cleaner
 */

(function(){

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
    for (var i = 0; i < arguments.length; i++)
      if (arguments[i] != null)
        return arguments[i];
  }

 /**
  * Copy all properties from source object(s) to object.
  * @param {object} object Any object should be extended.
  * @param {object} source
  * @return {object} Extended object.
  */
  function extend(object, source){
    ;;;if (arguments.length > 2 && typeof arguments[2] != 'number') { console.warn('extend: more than 2 arguments!'); debugger; }
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
    ;;;if (arguments.length > 2) { console.warn('complete: more than 2 arguments!'); debugger; }
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
  function $undefined(value) { return value == undefined };

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is not undefined.
  */
  function $defined(value)   { return value != undefined };

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is null.
  */
  function $isNull(value)    { return value == null || value == undefined };

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is not null.
  */
  function $isNotNull(value) { return value != null && value != undefined };

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is equal (===) to this.
  */
  function $isSame(value)    { return value === this };

 /**
  * @param {any} value
  * @return {boolean} Returns true if value is not equal (!==) to this.
  */
  function $isNotSame(value) { return value !== this };

 /**
  * Just returns first param.
  * @param {any} value
  * @return {boolean} Returns value argument.
  */
  function $self(value) { return value };

 /**
  * Always returns false.
  * @return {boolean}
  */
  function $false()     { return false };

 /**
  * Always returns true.
  * @return {boolean}
  */
  function $true()      { return true };

 /**
  * Always returns null.
  */
  function $null()      { return null };

 /**
  * Always returns undefined.
  */
  function $undef()     { };

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
    $false:     $false,
    $true:      $true,
    $null:      $null,
    $undef:     $undef,

   /**
    * @param {function()} init Function that should be called at first time.
    * @param {Object=} thisObject
    * @return {function()} Returns lazy function.
    */
    lazyInit: function(init, thisObject){
      var inited = 0, _self, data;
      return _self = function(){
        if (!inited++)
        {
          _self.inited = true;
          _self.data = data = init.apply(thisObject || this);
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
      var inited = 0, _self, data;
      return _self = function(){
        if (!inited++)
        {
          _self.inited = true;
          _self.data = data = init.apply(thisObject || this);
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
    * arguments for function.
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

  // EXTENSIONS
  /*
  extend(Function.prototype, {
    extend: function(proto){
      debugger;
      var classProto  = this.prototype;
      var constructor = classProto.constructor;

      extend(classProto, proto.prototype || proto);

      // prevent constructor overwrite for browsers where constructor property haven't DontEnum flag
      if ('constructor' in proto)
        classProto.constructor = constructor;

      return this;
    },
    complete: function(proto){
      debugger;
      return complete(this.prototype, proto.prototype || proto);
    }
  });
  */

  
 /**
  * Boolean extensions
  * @namespace Boolean
  */

  extend(Boolean, {
   /**
    * Inverse value to opposite boolean value.
    * @param {any} value
    * @return {boolean}
    */
    invert: function(value){
      return !value;
    },

   /**
    * Convert value to bollean.
    * @param {any} value
    * @return {boolean}
    */
    normalize: function(value){
      return !!value;
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
      var result;
      
      if (object != null)
      {
        var len = object.length;
        
        if (typeof len == 'undefined')
          return [object];
        
        if (!offset)
          offset = 0;

        if (len - offset > 0)
        {
          result = new Array();
          for (var i = offset, k = 0; i < len; i++)
            result[k++] = object[i];
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

      // no value to return if no initial value and an empty array
      if (len == 0 && arguments.length == 1)
        throw new TypeError();

      var result;
      var inited = 0;
      if (arguments.length >= 2)
      {
        result = arguments[1];
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
    clone: function(){
      return Array.from(this);
    },
    flatten: function(){
      return this.concat.apply([], this);
    },
    unique: function(sorted){
      if (!this.length)
        return [];

      var source, result;

      if (sorted)
        // no source array copy, no array sorting
        // O = N
        result = [(source = this)[0]];
      else
        // copy source array, sort copy of array
        // O = N*log(N)
        source = result = Array.from(this).sort(function(a, b){
          if (a === b) return 0;
          else return typeof a == typeof b ? a > b || -1 : typeof a > typeof b || -1;
        });

      for (var i = 1, k = 0; i < source.length; i++)
        if (result[k] !== source[i])
          result[++k] = source[i];
      result.length = k + 1;

      return result;
    },
    collapse: function(callback, thisObject){
      var len = this.length;
      for (var i = 0, k = 0; i < len; i++)
        if (!callback.call(thisObject, this[i], i, this))
          this[k++] = this[i];
      this.length = k;
      return this;
    },
    exclude: function(array){
      return this.filter(this.absent, array);
    },
    repeat: function(count){
      return Array.create(parseInt(count) || 0, this).flatten();
    },

    // getters
    item: function(index){
      index = parseInt(index || 0);
      return this[index >= 0 ? index : this.length + index];
    },
    first: function(index){
      return this[0];
    },
    last: function(){
      return this[this.length - 1];
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
    *   var result = list.filter(Data.getter('a == 1'));
    *
    * @param {any} value
    * @param {function(object)|string} getter
    * @param {number=} offset
    * @return {any}
    */
    search: function(value, getter, offset){
      Array.lastSearchIndex = -1;
      getter = Data.getter(getter || $self);
      
      for (var index = parseInt(offset || 0), len = this.length; index < len; index++)
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
      getter = Data.getter(getter || $self);

      var len = this.length - 1;
      var index = isNaN(offset) || offset == null ? len : parseInt(offset);
      
      for (var i = index > len ? len : index; i >= 0; i--)
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

      getter = Data.getter(getter || $self);
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
            return value == compareValue ? pos : -1;  // founded element
                                                      // -1 returns when it seems as founded element,
                                                      // but not equal (array item or value looked for have wrong data type for compare)
      }
      while (l <= r);

      return strong ? -1 : pos + ((compareValue < value) ^ desc);
    },
    binarySearch: function(value, getter){ // position of value
      return this.binarySearchPos(value, getter, false, true);
    },

    binarySearchIntervalPos: function(value, leftGetter, rightGetter, strong, left, right){
      if (!this.length)  // empty array check
        return -1;

      leftGetter  = Data.getter(leftGetter || $self);
      rightGetter = Data.getter(rightGetter || $self);

      var pos, compareValue;
      var l = isNaN(left) ? 0 : left;
      var r = isNaN(right) ? this.length - 1 : right;
      var lv, rv;

      // binary search
      do 
      {
        compareValue = this[pos = (l + r) >> 1];
        if (value < (lv = leftGetter(compareValue)))
          r = pos - 1;
        else 
          if (value > (rv = rightGetter(compareValue)))
            l = pos + 1;
          else
            return value >= lv && value <= rv ? pos : -1; // founded element
                                                          // -1 returns when it seems as founded element,
                                                          // but not equal (array item or value looked for have wrong data type for compare)
      }
      while (l <= r);

      return strong ? -1 : pos + (rightGetter(compareValue) < value);
    },
    binarySearchInterval: function(value, leftGetter, rightGetter){
      return this.binarySearchIntervalPos(value, leftGetter, rightGetter, true);
    },

    // array comparators
    equal: function(array){
      return this.length == array.length && this.every(function(item, index){ return item === array[index] });
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
    absent: function(value){
      return this.indexOf(value) == -1;
    },

    // misc.
    merge: function(object){
      return this.reduce(extend, object || {});
    },
    sortAsObject: function(getter, comparator, desc){
      getter = Data.getter(getter);
      desc = desc ? -1 : 1;

      return this
        .map(function(item, index){
               return { 
                 i: index,       // index
                 v: getter(item) // value
               };
             })                                                                           // strong sorting (neccessary only for browsers with no strong sorting, just for sure)
        .sort(comparator || function(a, b){ return desc * ((a.v > b.v) || -(a.v < b.v) || (a.i > b.i ? 1 : -1)) })
        //.map(function(item){ return this[item.index] }, this);
        .map(Data.getter('i', this));
    },
    set: function(array){
      if (this !== array)
        this.clear().push.apply(this, array);
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
    trimLeft: String.prototype.trimLeft || function(){
      return this.replace(/^\s\s*/, '');
    },
    trimRight: String.prototype.trimRight || function(){
      return this.replace(/\s\s*$/, '');
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
      try { return Function('return ' + this)() } catch(e) {}
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
    ellipsis: function(length){
      var str = this.substr(0, length || 0);
      return this.length > str.length ? str + '\u2026' : str;
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
      return String(this).quote(start, end);
    },
    toHex: function(){
      return parseInt(this).toString(16).toUpperCase();
    },
    sign: function(){
      return this < 0 ? -1 : Number(this != 0);
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
    extend(Date.prototype, {
      getYear: function(){
        return this.getFullYear() - 1900;
      },
      setYear: function(year){
        return this.setFullYear(!isNaN(year) && year < 100 ? Number(year) + 1900 : year);
      }
    });



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
    var cursor = window;
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
    *   var bar = new classA('Ivan', 25);
    *   alert(foo.say()); // My name is John.
    *   alert(bar.say()); // My name is Ivan. I'm 25 year old.
    *   alert(bar instanceof Basis.Class); // false (for some reasons it false now)
    *   alert(bar instanceof classA); // true
    *   alert(bar instanceof classB); // true
    * @namespace Basis.Class
    */

    var namespace = 'Basis.Class';

   /** 
    * Abstract method is using when no method to be wrapped.
    * Using by wrapMethod.
    * @type {function()}
    * @private
    */
    var abstractMethod = extend(function(){}, {
      inherit: $undef,
      proto: null,
      toString: function(){ return '[abstract method]' }
    });
    
   /**
    * Creates method wrapper that makes this.inherit to work.
    * @param {function()} method Function to be wrapped.
    * @param {function()} ancestorMethod Function that will be able to called through this.inherit.
    * @param {object} proto Reference to ancestor prototype. Generaly for debug purposes.
    * @return {function()} Wrapped method.
    * @private
    */
    function wrapMethod(method, ancestorMethod, proto){
      if (!ancestorMethod)
        ancestorMethod = abstractMethod;

      // create method wrapper
      var methodWrapper = function(){
        var saveInherit = this.inherit;
        this.inherit = ancestorMethod;
        var result = methodWrapper.method.apply(this, arguments);
        this.inherit = saveInherit;
        return result;
      };

      // workaroud for browsers which doesn't enum for toString
      methodWrapper.toString = function(){ return methodWrapper.method.toString() };
      methodWrapper.valueOf = function(){ return methodWrapper.method.valueOf() };

      // extend and return wrapped method
      return extend(methodWrapper, {
        method: method,
        proto: proto
      });
    }

   /**
    * Root class for all classes created by Basis class model.
    * @type {function()}
    */
    var BaseClass = function(){};

    extend(BaseClass, {
      // Base class name
      className: 'Basis.Class',

      // prototype defaults
      prototype: { 
        constructor: null, 
        toString: function(){
          return '[object ' + (this.constructor || this).className + ']';
        }
      },

     /**
      * Class constructor.
      * @param {function()} SuperClass CLass that new one inherite of.
      * @param {...object} extensions Objects that extends new class prototype.
      * @return {function()} A new class.
      */
      create: function(SuperClass){

        //function newClass(){
        var newClass = function BasisClass(){
          if (typeof this.init == 'function')
            return this.init.apply(this, arguments) & undefined;
        };

        if (typeof SuperClass != 'function')
          SuperClass = BaseClass;

        // save init method if exists 
        var init = SuperClass.prototype.init;
        var hasInit = typeof init == 'function';
        if (hasInit)
          SuperClass.prototype.init = undefined;

        // assign SuperClass instance for newClass prototype, 
        // this makes newClass instanceof SuperClass
        newClass.prototype = new SuperClass();
        newClass.superClass_ = SuperClass;
        
        // restore init value
        if (hasInit)
          SuperClass.prototype.init = init;

        // override extend method for newClass, new one extending prototype with method wrapping
        newClass.extend = BaseClass.extend;
        newClass.complete = BaseClass.complete;
        
        // extend newClass prototype
        for (var i = 1; i < arguments.length; i++)
          newClass.extend(arguments[i]);

        // deal with className
        if (!newClass.className)
          newClass.className = 'subclass of ' + SuperClass.className;
        
        // TODO: remove className from prototype
        //newClass.prototype.className = newClass.className;
        
        // WARN: don't use extend() to assign this (IE doesn't enumerate it)
        newClass.prototype.constructor = newClass;
        
        return newClass;
      },

      /* isn't need for complete method, because existing prototype methods aren't overriding and new methods aren't required to be wrapped
      complete: function(source){
      },*/
      extend: function(source){
        var proto = this.prototype;
        
        if (source.prototype)
          source = source.prototype;

        var keys = Object.keys(source);
        
        // for browsers that doesn't enum toString
        if (source.toString !== Object.prototype.toString)
          keys.add('toString');
        
        var i = keys.length;
        while (i--)
        {
          var key = keys[i];
          var value = source[key];

          if (key == 'className')
            this.className = value;
          else
          {
            if (typeof value == 'function' && value.extend !== BaseClass.extend) // wrap only functions, but not a classes 
              value = wrapMethod(value.method || value, proto[key], proto)
              
            proto[key] = value;
          }
        }
        
        return this;
      },
      destroy: function(){
        for (var prop in this)
          delete this[prop];
        
        this.destroy = $undef;
      }
    });

    return getNamespace(namespace, BaseClass.create).extend({
      BaseClass: BaseClass,
      create: BaseClass.create
    });
  })();

  // ============================================ 
  // Browser

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
      dataurl: false
    };

    // DATA URL SHEME test
    var testImage = new Image();
    testImage.onload = function(){ FeatureSupport.dataurl = true };
    testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

    var answers = {};
    var versions = {};
    var userAgent = window.navigator.userAgent;
    var browserName = 'unknown';
    var browserPrettyName = 'unknown';
    var browserNames = {
      'MSIE':        ['Internet Explorer', 'msie', 'ie'],
      'Gecko':       ['Gecko', 'gecko'],
      'Safari':      ['Safari', 'safari'],
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
      if (name == 'MSIE' && window.opera)
        continue;  // opera identifies as IE :(

      if (name == 'Safari' && userAgent.match(/chrome/i))
        continue;  // Chrome identifies as Safari :(

      if (userAgent.match(new RegExp(name + '.' + '(\\d+(\\.\\d+)*)', 'i')))
      {
        var version   = RegExp.$1;
        var verNumber = versionToInt(version);
        var names     = browserNames[name];

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
                        ";path=" + (path || location.pathname) +
                        (expire ? ";expires=" + (new Date(Number(new Date) + expire * 1000)).toGMTString() : '');
    }

    function getCookie(name){
      var m = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*(.*?)\\s*(;|$)"));
      return m && unescape(m[2]);
    }

    function removeCookie(name, path){
      document.cookie = name + "=;expires=" + new Date(0).toGMTString() + ";path=" + (path || location.pathname);
    }

    //
    // export names
    //

    namespace = getNamespace(namespace);
    namespace.toString = function(){ return browserPrettyName };
    return namespace.extend({
      FeatureSupport: FeatureSupport,
      testImage: testImage,

      name: browserName,
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
  // DOM

  var DOM = (function(){

   /**
    * This namespace provides functions for manupulations with DOM - transerval,
    * node creation, moving and test nodes. Most of functions are compatible with
    * native and simulated (object that generaly has properties like firsChild,
    * lastChild, parentNode etc) DOM structures.
    *
    * Function overview:
    * - Order & position functions:
    *     {Basis.DOM.sort}, {Basis.DOM.comparePosition}, {Basis.DOM.index},
    *     {Basis.DOM.lastIndex}, {Basis.DOM.deep}
    * - Getters:
    *     {Basis.DOM.get}, {Basis.DOM.tag}, {Basis.DOM.tags}, {Basis.DOM.axis}
    * - Traversal:
    *     {Basis.DOM.TreeWalker}, {Basis.DOM.first}, {Basis.DOM.last},
    *     {Basis.DOM.next}, {Basis.DOM.prev}, {Basis.DOM.parent}
    * - Constructors:
    *     {Basis.DOM.createElement}, {Basis.DOM.createText},
    *     {Basis.DOM.createFragment}
    * - DOM manipulations:
    *     {Basis.DOM.insert}, {Basis.DOM.remove}, {Basis.DOM.replace},
    *     {Basis.DOM.swap}, {Basis.DOM.clone}, {Basis.DOM.clear}, {Basis.DOM.wrap}
    * - Style and attribute setters/getters:
    *     {Basis.DOM.setAttribute}, {Basis.DOM.display}, {Basis.DOM.show},
    *     {Basis.DOM.hide}, {Basis.DOM.visibility}, {Basis.DOM.visible},
    *     {Basis.DOM.invisible}, {Basis.DOM.css}
    * - Checkers:
    *     {Basis.DOM.IS_ELEMENT_NODE}, {Basis.DOM.IS_TEXT_NODE}, {Basis.DOM.is},
    *     {Basis.DOM.parentOf}, {Basis.DOM.isInside}
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
    var document = window.document;

    // element for DOM support tests
    var testElement = document.createElement('DIV');

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
    * Sort nodes in their DOM order.
    * @function
    * @param {[Node]} nodes List of nodes.
    * @return {[Node]} Sorted node list.
    */
    var sort = $self;
    
   /**
    * Returns result of node comparation.
    * @function
    * @param {Node} nodeA
    * @param {Node} nodeB
    * @return {number}
    */ 
    var comparePosition = function(nodeA, nodeB){ return 0 };

    // init functions depends on browser support
    if (typeof testElement.compareDocumentPosition == 'function')
    {
      // W3C DOM sheme
      sort = function(nodes){
        return nodes.sort(function(a, b){ return 3 - (comparePosition(a, b) & (POSITION_PRECENDING | POSITION_FOLLOWING)) }); // 6
      };

      comparePosition = function(nodeA, nodeB){
        return nodeA.compareDocumentPosition(nodeB)
      };
    }
    else
    {
      // IE6-8 DOM sheme
      sort = function(nodes){
        return nodes.sortAsObject(Data.getter('sourceIndex'));
      };

      comparePosition = function(nodeA, nodeB){
        if (nodeA == nodeB)
          return 0;

        if (nodeA.document != nodeB.document)
          return POSITION_DISCONNECTED | POSITION_IMPLEMENTATION_SPECIFIC;
        
        if (nodeA.sourceIndex > nodeB.sourceIndex)
          return POSITION_PRECENDING | (POSITION_CONTAINS * parentOf(nodeB, nodeA));
        else
          return POSITION_FOLLOWING  | (POSITION_CONTAINED_BY * parentOf(nodeA, nodeB));
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
          return !!(comparePosition(this, node) & POSITION_CONTAINED_BY)
        }
      }
    }
    else
      isNode = function(node){ return node && node.ownerDocument === document };

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
      root_: document,

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

        Cleaner.add(this);
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
        Cleaner.remove(this);
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
      return axis(node, AXIS_DESCENDANT, IS_TEXT_NODE).map(Data.getter('nodeValue')).join('');
    };

    // extract tag names
    function tagNames(names){
      if (!names) return;
      var result = String(names).trim().split(/\s*,\s*|\s+/).unique();
      return result.indexOf('*') == -1 && result;
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

   /**
    * Returns all descendant elements with names for node.
    * @param {string|[string]} names Comma or space separated names string, or string list of names.
    * @param {Element} node Context element.
    * @return {[Element]}
    */
    function tags(node, names){
      return sort(
        (tagNames(names) || ['*'])
        .map(function(name){ return tag(node, name) })
        .flatten()
      );
    }

    //
    // Navigation
    //

   /**
    * Returns nodes axis in XPath like way.
    * @param {Node} root Relative point for axis.
    * @param {number} AXIS Axis constant.
    * @param {function(node):boolean} filter Filter function. If it's returns true node will be in result list.
    * @return {[Node]}
    */
    function axis(root, axis, filter){
      var walker, cursor;
      var result = new Array;

      filter = typeof filter == 'string' ? Data.getter(filter) : filter || $true;

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
            (new TreeWalker(root)).nodes(filter, result);
        break;

        case AXIS_FOLLOWING:
          walker = new TreeWalker(document, filter);
          walker.cursor = root[NEXT_SIBLING] || root[PARENT_NODE];
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
          walker = new TreeWalker(document, filter, TreeWalker.BACKWARD);
          walker.cursor = root[PREVIOUS_SIBLING] || root[PARENT_NODE];
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

      if (axis & (AXIS_SELF | AXIS_ANCESTOR_OR_SELF | AXIS_DESCENDANT_OR_SELF))
        if (filter(root))
          result.unshift(root);

      return result;
    }


    function nextElement(node, filter, viewDeep, root){
      if (!filter || filter == '*')
        filter = $true;

      if (typeof filter == 'string')
        filter = Data.getter('tagName=='+filter.quote());

      viewDeep = viewDeep || 0;

      do
      {
        node = node[this];  // this contains direction
      
        if (!node || node === root)
          break;

        if (filter(node))
          return node;
      }
      while (--viewDeep); 

      return null;
    }

    var prev = nextElement.bind(PREVIOUS_SIBLING);
    var next = nextElement.bind(NEXT_SIBLING);
    var parent = nextElement.bind(PARENT_NODE);

    function first(node, filter, viewDeep){
      node = node[FIRST_CHILD];
      
      return !node || !filter || filter(node) ? node : next(node, filter, viewDeep);
    }

    function last(node, filter, viewDeep){
      node = node[LAST_CHILD];
      
      return !node || !filter || filter(node) ? node : prev(node, filter, viewDeep);
    }

    function count(node, filter, root){
      var count = 0;
      // this contains direction
      while (node = nextElement.call(this, node, filter, 0, root))
        count++;
      return count;
    }

    var index = count.bind(PREVIOUS_SIBLING);
    var lastIndex = count.bind(NEXT_SIBLING);
    var deep = count.bind(PARENT_NODE);

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
    * Using by createElement.
    * @type {boolean}
    * @privare
    */
    var IS_NAME_ATTRIBUTE_BUG = (function(){
      var input = document.createElement('INPUT');
      input.name = 'a';
      return !/name/.test(outerHTML(input))
    })();

   /**
    * Using by createElement.
    * @type {RegExp}
    * @private
    */
    var DESCRIPTION_PART_REGEXP = /([\#\.])([a-z0-9\_\-\:]+)|\[([a-z0-9\_\-]+)(=(?:\"((?:\\.|[^\"])+)\"|\'((?:\\.|[^\'])+)\'|((?:\\.|[^\]])+)))?\s*\]|\s*(\S)/gi;

   /**
    * Creates a new Element with arguments as childs.
    * @param {string|object} def CSS-selector like definition or object for extended Element creation.
    * @param {...Node|object} childs Child nodes 
    * @return {!Element} The new Element.
    */
    function createElement(def, childs){
      var isComplexDef = def != undefined && typeof def != 'string';
      var description = (isComplexDef ? def.description : def) || '';

      var elementName = 'DIV';
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
              '\n\nElement description:\n> ' + description + 
              '\n\nProblem place:\n> ' + description.substr(0, m.index) + '-->' + description.substr(m.index) + '<--'
            );
          }

          entryName = m[2] || m[3];

          switch (m[1]){
            case '#': attributes.id = entryName; break;
            case '.': classNames.push(entryName); break;
            default:
              if (entryName != 'class')                 
                attributes[entryName] = m[4] ? m[5] || m[6] || m[7] : entryName;
          }
        }

        // create element
        if (IS_NAME_ATTRIBUTE_BUG && attributes.name && /^(input|textarea|select)$/i.test(elementName))
          elementName = '<' + elementName + ' name=' + attributes.name + '>';
          //delete attributes.name; // check in ie6
      }
        
      // create element
      element = document.createElement(elementName);

      // set attributes
      if (attributes)
        for (var attrName in attributes)
          element.setAttribute(attrName, attributes[attrName], 0);

      // set css classes
      if (classNames && classNames.length)
        element.className = classNames.join(' ');

      // append child nodes
      if (arguments.length > 1)
        handleInsert(element, createFragment.apply(0, Array.from(arguments, 1).flatten()));

      // attach event handlers
      if (isComplexDef)
      {
        if (def.css)
          css(element, def.css);

        for (var event in def)
          if (typeof def[event] == 'function')
            Event.addHandler(element, event, def[event], element);
          else
            if (def[event] instanceof Event.Handler)
              Event.addHandler(element, event, def[event].handler, def[event].thisObject);
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
        throw new Error('DOM.insert: destination node can\'t be null');

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
      getter = Data.getter(getter || $self);
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
    // Style
    //

   /**
    * Changes for node display value.
    * @param {Node} node
    * @param {boolean|string} display
    * @return {Node}
    */
    function display(node, display){
      node.style.display = typeof display == 'string' ? display : (display ? '' : 'none');
      return node;
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
      node.style.visibility = visible ? '' : 'hidden';
      return node;
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

    // create style property map
    var styleMap = {};

    function addStyleMapping(property, names){
      var name, mapping = {};
      names = names.qw();
      for (var i = 0; name = names[i++];)
      {
        if (typeof testElement.style[name] != 'undefined')
        {
          Browser.FeatureSupport['css-' + property] = name;
          mapping.key = name;
          break;
        }
      }
      styleMap[property] = mapping;
    };

    addStyleMapping('opacity', 'opacity MozOpacity KhtmlOpacity filter');
    addStyleMapping('float', 'cssFloat styleFloat');

    if (styleMap.opacity.key == 'filter')
      styleMap.opacity.getter = function(value){ return 'alpha(opacity:{0:.0})'.format(Math.round(value * 100)) };

   /**
    * Apply new style property values for node.
    * @param {Node} node Node which style to be changed.
    * @param {object} style Object contains new values for node style properties.
    * @return {Node} 
    */
    function css(node, style){
      node = get(node);
      if (node)
      {
        var value, mapping;
        for (var key in style)
        {
          value = style[key];
          mapping = styleMap[key];
          key = mapping ? mapping.key : key.camelize();
            
          if (key)
            node.style[key] = mapping && mapping.getter ? mapping.getter(value) : value;
        }
      }
      return node;
    }

    //
    // Checkers
    //

    function IS_ELEMENT_NODE(node){ 
      return !!(node && node.nodeType == ELEMENT_NODE);
    }
    function IS_TEXT_NODE(node){ 
      return !!(node && node.nodeType == TEXT_NODE);
    }
    function is(element, names){ // names may be a string (comma or space separated tag names) or an array
      return (tagNames(names) || []).has(element.tagName);
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

    function ieGetInputPosition(isStart){
      if (document.selection)
      {
        var range = document.selection.createRange();
        if (range.compareEndPoints("StartToEnd", range) != 0)
          range.collapse(isStart);
        return range.getBookmark().charCodeAt(2) - 2;
      }
    }

    // funny stuff

    var functionReflections = {};
    'insert parentOf isInside'.qw().forEach(function(name){
      functionReflections[name] = function(){
        var args = Array.from(arguments);
        args.unshift(chainContext);
        return DOM[name].apply(DOM, args);
      }
    });

    var chainContext;
    function setContext(node){
      chainContext = get(node);
      return functionReflections;
    }

    // Export names

    return getNamespace(namespace, setContext).extend({
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
      sort: sort,
      comparePosition: comparePosition,

      // Classes
      TreeWalker: TreeWalker,

      // MISC
      outerHTML: outerHTML,
      textContent: textContent,

      // getters
      get: get,
      tag: tag,
      tags: tags,
      axis: axis,
      
      // navigation
      first: first,
      last: last,
      next: next,
      prev: prev,
      parent: parent,

      // node position
      index: index,
      lastIndex: lastIndex,
      deep: deep,

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

      // style
      display: display,
      show: show,
      hide: hide,
      visibility: visibility,
      visible: visible,
      invisible: invisible,
      css: css,

      // checkers
      IS_ELEMENT_NODE: IS_ELEMENT_NODE,
      IS_TEXT_NODE: IS_TEXT_NODE,
      is: is,
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
  // Html
  //

  var Html = (function(){

   /** @namespace Basis.Html */

    var namespace = 'Basis.Html';

    // Test for browser (IE) normalize text nodes during cloning
    var CLONE_NORMALIZE_TEXT_BUG = (function(){
      return DOM.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
    })();

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
    *     cssClass(node.element).add('item' + i);
    *     node.hrefAttr.nodeValue = '/foo/bar.html';
    *     node.titleText.nodeValue = 'some title';
    *     node.descriptionText.nodeValue = 'description text';
    *   }
    *   
    *   // create and attach DOM structure to existing object
    *   var dataObject = new Basis.DOM.Wrapers.DataObject({
    *     info: { title: 'Some data', value: 123 },
    *     handlers: {
    *       update: function(object, newInfo, oldInfo, delta){
    *         this.titleText.nodeValue = newInfo.title;
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

     /**
      * @param {string|function()} template Template source code that will be parsed
      * into DOM structure prototype. Parsing will be initiated on first
      * {Basis.Html.Template#createInstance} call. If function passed it be called at
      * first {Basis.Html.Template#createInstance} and it's result will be used as
      * template source code.
      * @constructor
      */
      init: function(template){
        this.source = template;
      },
      parse: function(){
        if (this.proto)
          return;

        var str = this.source;
        var getters = {};
        var stack = [];

        if (typeof str == 'function')
          this.source = str = str();

        //console.log('parse:', htmlCode);

        //this.source = htmlCode;

        function parseText(str, path, pos){
          //console.log('parseText: ', arguments);
          var parts = str.split(/\{([a-z0-9\_]+(?:\|[^}]*)?)\}/i);
          var result = [];
          var node;
          for (var i = 0; i < parts.length; i++)
          {
            if (i % 2)
            {
              var p = parts[i].split(/\|/);
              getters[p[0]] = path + 'childNodes[' + pos + ']';
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
                if (result.length)
                  result.push(document.createComment(''));
                pos++;
              }
              result.push(node);
              pos++;
            }
          }
          return DOM.createFragment.apply(null, result);
        }

        var re = /<([a-z0-9\_]+)(\{([a-z0-9\_\|]+)\})?([^>\/]*)(\/?)>|<\/([a-z0-9\_]+)>/i;
        function parseHtml(path, pos){
          var result = DOM.createFragment();
          var m;

          while (m = re.exec(str))
          {
            str = RegExp.rightContext;
            var pre = RegExp.leftContext;

            if (pre.length)
            {
              var tnodes = parseText(pre, path, pos);
              pos += tnodes.childNodes.length;
              result.appendChild(tnodes);
            }
           
            if (m[6])
            {
              if (m[6] == stack.last())
              {
                stack.pop();
                return result;
              }
              else
              {
                ;;; if (typeof console != undefined) console.log('Wrong end tag </' + m[6] + '> in Html.Template (ignored)\n\n' + str.replace(new RegExp('(</' + m[6] + '>)(' + str + ')$'), '==[here]=>$1<=$2'));
              }
            }
            else
            {
              var descr = m[0];
              var tagName = m[1];
              var name = m[3];
              var params = m[4];
              var singleton = !!m[5];

              if (name)
                getters[name] = path + 'childNodes[' + pos + ']';

              if (params)
              {
                var strings = [];
                var tmp = params.replace(/("(\\"|[^"])*?"|'([^']|\\')*?')/g, function(m){ strings.push(m); return '\0' });
                params = tmp.trim()
                  .replace(/([a-z0-9\_]+)(\{([a-z0-9\_\|]+)\})?(=\0)?\s*/gi, function(m, attr, ref, name, value){
                    if (name)
                      getters[name] = path + 'childNodes[' + pos + ']' + '.getAttributeNode("' + attr + '")';

                    if (value)
                      value = strings.shift();

                    return attr == 'class' ? CSS.makeClassName(value.replace(/^([\'\"]?)(.*?)\1$/, "$2")) : '[' + attr + (value ? '=' + value : '') + ']'
                  });
                //console.log(params);
              }

              var element = DOM.createElement(tagName + params);

              if (str.length && !singleton)
              {
                stack.push(tagName);
                element.appendChild(parseHtml(path + 'childNodes[' + pos + '].', 0));
              }

              result.appendChild(element);
              pos++;
            }
          }
          
          if (str.length)
            parseText(str);

          return result;
        }

        var proto = parseHtml('', 0);

        var aliases = [];
        //console.log(htmlCode, DOM.createElement('', '\n\n', proto.cloneNode(true)).innerHTML);
        //console.log(keys(getters).map(function(k){ return k + ' = ' + getters[k] }).join('\n'));
        var body = keys(getters).map(function(name, idx){
          // optimize path
          var indexPath = getters[name].replace(/\.?childNodes\[(\d+)\]/g, "$1 ").qw();
          var newPath = getters[name].split('.');
          var node = proto;
          for (var i = 0; i < indexPath.length; i++)
          {
            if (!isNaN(indexPath[i]))
            {
              node = node.childNodes[indexPath[i]];

              if (node == node.parentNode.firstChild)
                newPath[i] = 'firstChild';
              else
                if (node == node.parentNode.lastChild)
                  newPath[i] = 'lastChild';
            }
          }

          var names = name.split(/\|/);
          aliases.push.apply(aliases, names);

          return {
            name:  'object.' + names.first(),
            alias: 'object.' + names.reverse().join(' = object.'), // reverse names to save alias order for iterate (for most browsers it should be work)
            path:  'html.' + newPath.join('.')
          }
        }, this).sortAsObject('path');

        for (var i = 0; i < body.length; i++)
        {
          var path_re = new RegExp('^' + body[i].path.forRegExp());
          for (var j = i + 1; j < body.length; j++)
            body[j].path = body[j].path.replace(path_re, body[i].name);
        }

        this.proto = proto;
        //console.log(DOM.outerHTML(proto));
        //this.proto.html = DOM.outerHTML(proto);
        //this.x = document.createElement("DIV");
        this.createInstance = new Function('object',
          'object = object || {};' + 
          //'var html = this.x;' +
          //'html.innerHTML = this.proto.html;' +
          'var html = this.proto.cloneNode(true);' + 
          body.map(String.format, '{alias} = {path};').join('') +
          'return object;'
        );

        this.clearInstance = new Function('object',
          aliases.map(String.format, 'delete object.{0};').join('')
        );
      },
      createInstance: function(object){
        this.parse();
        return this.createInstance(object);
      },
      clearInstance: function(object){
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

    var document = window.document;

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
      return event || window.event;
    }

   /**
    * Returns DOM node if possible.
    * @param {Node|string} object
    * @return {Node}
    */
    function getNode(object){ 
      return object === window || (object = DOM.get(object)) ? object : null;
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

      if ('which' in event)
        return event.which == button.VALUE;
      else
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
      return item.handler == this.handler && item.thisObject == this.thisObject;
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
        var i = handlers.length;
        while (i--)
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
        var i = handlers.length;
        while (i--)
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
        handlers.collapse(compareHandlers, { handler: handler, thisObject: thisObject });
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
        
      var handlers = node[EVENT_HOLDER];
      var eventTypeHandlers = handlers[eventType];
      if (!eventTypeHandlers)
      {
        eventTypeHandlers = handlers[eventType] = new Array();
        eventTypeHandlers.fireEvent = function(event){ // closure
          // simulate capture phase for old browsers
          event = wrap(event);
          if (noCaptureSheme && event)
            if (typeof event.returnValue == 'undefined')
            {
              observeGlobalEvents(event);
              if (event.cancelBubble === true)
                return;
              if (typeof event.returnValue == 'undefined')
                event.returnValue = true;
            }

          // call eventType handlers
          for (var i = 0, handlerObject; handlerObject = eventTypeHandlers[i++];)
            handlerObject.handler.call(handlerObject.thisObject, event);
        };

        if (node.addEventListener) 
          // W3C DOM event model
          node.addEventListener(eventType, eventTypeHandlers.fireEvent, false);
        else 
          // old IE event model
          node.attachEvent('on' + eventType, eventTypeHandlers.fireEvent);
      }

      // attach new event handler (unique only)
      var handlerObject = {
        handler: handler,
        thisObject: thisObject
      };

      if (!eventTypeHandlers.some(compareHandlers, handlerObject)) 
        eventTypeHandlers.push(handlerObject);
    };

   /**
    * Adds multiple handlers for node.
    * @param {Node|string} node
    * @param {object} handlers
    * @param {object=} thisObject Context for handlers
    */
    function addHandlers(node, handlers, thisObject){
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
        if (eventTypeHandlers && !handlers[eventType].collapse(compareHandlers, { handler: handler, thisObject: thisObject }).length)
          clearHandlers(node, eventType);
      }
    };

   /**
    * Removes all node's handlers for eventType. If eventType omited, all handlers for all eventTypes will be deleted.
    * @param {Node|string} node
    * @param {string} eventType
    */
    function clearHandlers(node, eventType){
      node = getNode(node)
      
      var handlers = node[EVENT_HOLDER];
      if (handlers)
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
          var secretId = '_' + (new Date - 0);
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
      addHandler(window, "load", fireHandlers, false);

      // return attach function
      return function(callback, thisObject){
        if (fired)
        {
          ;;;if (typeof console != 'undefined') console.warn('Event.onLoad(): Can\'t attach handler to onload event, because it\'s alredy fired!');
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
      addHandler(window, 'unload', handler, thisObject);
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

    function makeClassName(classes){
      return classes != null ? String.trim(classes).replace(/^(.)|\s+|\s*,\s*/g, '.$1') : '';
    };

    var ClassNameWraper = Class(null, {
      className: namespace + '.ClassName',

      init: function(element){ 
        this.element = typeof element == 'string' ? DOM.get(element) : element;
        this.sync();
        ;;;if (!this.element) throw new Error('ClassName wraper: Element ' + element + ' not found!');
      },
      sync: function(){
        this.cache = this.element.className.qw();
      },
      toArray: function(){
        return this.cache;
      },
      has: function(className){
        return this.cache.has(className);    
      },
      absent: function(className){
        return !this.has(className);
      },
      set: function(newValue){
        this.element.className = (this.cache = newValue.qw()).join(' ');
        return this;
      },
      add: function(newClass){ 
        var classes = this.cache;
        var count = classes.length;
        var args = arguments;

        if (args.length == 1)
          classes.add(newClass);
        else
          classes.forEach.call(args, classes.add, classes);
          //Array.from(args).forEach(classes.add, classes);

        if (classes.length > count)
          this.element.className = classes.join(' ');

        return this;
      },
      remove: function(oldClass){
        var classes = this.cache;
        var count = classes.length;
        var args = arguments;

        if (args.length == 1)
          classes.remove(oldClass)
        else
          classes.forEach.call(args, classes.remove, classes);
          //Array.from(args).forEach(classes.remove, classes);

        if (classes.length < count)
          this.element.className = classes.join(' ');

        return this;
      },
      replace: function(searchFor, replaceFor, prefix){
        var classes = this.cache;
        var udpateCount = 0;
        prefix = prefix || '';

        if (typeof searchFor != 'undefined')
          udpateCount += classes.remove(prefix + searchFor);
        
        if (typeof replaceFor != 'undefined')
          udpateCount += classes.add(prefix + replaceFor);
        
        if (udpateCount)
          this.element.className = classes.join(' ');
        
        return this;
      },
      clear: function(){
        this.element.className = this.cache.clear();
        return this;
      },
      bool: function(className, mustExists) {
        if (mustExists)
          this.add(className);
        else
          this.remove(className);
        return this;
      },
      toggle: function(className){
        var exists = this.has(className);
        if (exists)
          this.remove(className);
        else
          this.add(className);
        return !exists;
      }/*,
      destroy: function(){
        delete this.element;
      }*/
    });

    //var cache = {};
    function cssClass(element){ 
      return new ClassNameWraper(element);
    }

    function unit(value, unit){ return value == 0 || isNaN(value) ? '0' : value + unit }
    function em(value){ return unit(value, 'em') }
    function ex(value){ return unit(value, 'ex') }
    function px(value){ return unit(value, 'px') }
    function percent(value){ return unit(value, '%') }

    // export
    return getNamespace(namespace).extend({
      cssClass: cssClass,
      makeClassName: makeClassName,
      em: em,
      ex: ex,
      px: px,
      percent: percent
    });

  })();
 
  // ============================================
  // Data
  //

  var Data = (function(){

   /** @namespace Basis.Data */

    var namespace = 'Basis.Data';

    var getterCache = {};
    var getterPathCache = {};
    //var setterCache = {};

    var mGetter = new Function('item', 'return item.modificator');
    mGetter.getter = mGetter;

    function getter(path, modificator){
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
          getterPathCache[path] = func;
        }
      }
      else
        func = path;

      if (getterCache[func] && getterCache[func].search(modificator, mGetter))
        return getterCache[func][Array.lastSearchIndex].getter;

      switch (typeof modificator)
      {
        case 'string': 
          result = function(object){ return modificator.format(func(object)) };
          break;

        case 'function': 
          result = function(object){ return modificator(func(object)) };
          break;

        case 'object':
          result = function(object){ return modificator[func(object)] }; 
          break;

        default:
          if (!func.path)
            result = function(object){ return func(object) };
          else
            result = func;
      }

      if (!getterCache[func])
        getterCache[func] = [];

      getterCache[func].push({
        getter: result,
        modificator: modificator
      });

      result.getter = result;

      return result;
    };

    function def(getter, defValue, checker){
      checker = checker || $isNull;
      var result = function(object){
        var res = getter(object);
        return checker(res) ? defValue : res;
      };
      return result;
    };

    function wrapper(key){
      return function(value){
        var result = {};
        result[key] = value;
        return result;
      }
    };

    /*
     *  experimental
     */
    /*
    function proxy(getter, setter, modificator, validator){
      if (!getter)
        getter = $self;

      var result = function(object){
        var value = getter(object);
        if (setter)
        {
          return setter(object, value);
        }
        else
          return value;
      };
    };

    function validator(validator, ignoreException){
      return function(value){
        var result = validator.call(this, value);
        if (!result && !ignoreException)
          throw new Error('Value is not passed validator check');

        return result;
      };
    };*//*

    function setter(path, modificator, validator, ignoreException){
      if (path && path.isDataSetter)
        return path;

      var setter, validate, result;
      if (typeof path != 'function')
      {
        if (!setterCache[path])
          setterCache[path] = new Function('object', 'value', 'return object.' + path + ' = value');

        setter = setterCache[path];
      }
      else 
        setter = path;

      if (typeof validator == 'function')
      {
        validate = function(object, value){
          if (!validator.call(object, value))
          {
            if (ignoreException)
              return;
            else
              throw new Error('Value is not passed validator check');
          }

          return setter(object, value);
        }
      }
      else
        validate = setter;

      result = validate;

      switch (typeof modificator)
      {
        case 'string': 
          result = function(object, value){ return validate(object, modificator.format(value)) };
          break;
        case 'function': 
          result = function(object, value){ return validate(object, modificator.call(object, value)) };
          break;
      }

      result.isDataSetter = true;

      return result;
    };*/

    // export

    return getNamespace(namespace, getter).extend({
      getter: getter,
      def: def,
      wrapper: wrapper/*,
      setter: setter,
      proxy: proxy,
      validator: validator*/
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

    var eventScheme = typeof window.addEventListener == 'function' && typeof window.postMessage == 'function';
    var messageName = "zero-timeout-message";

    var timeoutQueue = [];
    var map = {};
    var idx = 1;

    // Like setTimeout, but only takes a function argument.  There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeout(fn) {
      //;;;if (typeof console != 'undefined') console.info('Set zero timeout', fn);

      var callback = { key: 'z' + (idx++), fn: fn };
      map[callback.key] = callback;
      timeoutQueue.push(callback);

      if (eventScheme)
        postMessage(messageName, "*");
      else
        callback.timer = nativeSetTimeout.call(window, handleMessage, 0);

      return callback.key;
    }

    function handleMessage(event){
      if (eventScheme)
      {
        if (event.source != window || event.data != messageName)
          return;

        Event.kill(event);
      }

      //;;;if (typeof console != 'undefined') console.info('Zero timeout call: ' + timeoutQueue.length + ' function(s) left');

      if (timeoutQueue.length)
      {
        var callback = timeoutQueue.shift();
        delete map[callback.key];
        callback.fn();
      }
    }

    if (eventScheme)
      window.addEventListener("message", handleMessage, true);

    //;;;if (typeof console != 'undefined') console.info('Zero timeout based on ' + (eventScheme ? 'postMessage' : 'setTimeout(.., 0)'));

    //
    // override setTimeout
    //
    var naviteSetTimeout = setTimeout;
    window.setTimeout = function(fn, timeout){
      if (timeout)
        return naviteSetTimeout.call(window, fn, timeout);
      else
        return setZeroTimeout(fn);
    }

    //
    // override clearTimeout
    //
    var nativeClearTimeout = clearTimeout;
    window.clearTimeout = function(timer){
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
        return nativeClearTimeout.call(window, timer);
    }
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

    Cleaner: Cleaner   
  });

  Basis.Locale = {};

})();
