/*
  Basis javascript library
  http://github.com/basisjs/basisjs
*/

/**
 * @annotation
 * Basis library core module. It provides various most using functions,
 * classes and functionality.
 *
 * This file should be loaded first.
 *
 * Content overview:
 * - util functions
 * - basis.getter
 * - console method wrappers (basis.dev)
 * - timer functions (basis.setImmediate, basis.clearImmediate, basis.nextTick)
 * - path utils (basis.path)
 * - process config (basis.config)
 * - basis.namespace
 * - basis.Class namespace (provides inheritance)
 * - basis.Token
 * - basis.resource
 * - basis.require
 * - polyfills for `Function#bind`, `Array.isArray`, `Array#indexOf`, `Array#lastIndexOf`, `Array#forEach`, `Array#map`, `Array#filter`, `Array#some`, `Array#every`, `Array#reduce`, `String#trim`, `Date#now`
 * - function to work with primitives
 *   - Function
 *   - Array
 *   - String
 *   - Number
 * - basis.ready
 * - async document interface (basis.doc)
 * - basis.cleaner
 */

// context is `window` in browser and module on node.js
;(function createBasisInstance(context, __basisFilename, __config){
  'use strict';

  var VERSION = '1.4.0-dev';

  var global = Function('return this')();
  var NODE_ENV = global !== context ? global : false;
  var document = global.document;
  var toString = Object.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  // It's old behaviour that looks odd. For now we leave everything as is.
  // But we should use context as something to store into, and global as source
  // of global things.
  // TODO: to do this stuff right
  global = context;


 /**
  * Generates unique id (mix datetime and random).
  * @param {number=} len Required length of id (16 by default).
  * @returns {string} Generated id.
  */
  function genUID(len){
    function base36(val){
      return Math.round(val).toString(36);
    }

    // uid should starts with alpha
    var result = base36(10 + 25 * Math.random());

    if (!len)
      len = 16;

    while (result.length < len)
      result += base36(new Date * Math.random());

    return result.substr(0, len);
  }

 /**
  * Define property (if possible) that show warning on access.
  * @param {object} object
  * @param {string} name Property name
  * @param {*} value
  * @param {string} warning Warning messsage
  */
  var warnPropertyAccess = (function(object, name, value, warning){
    /** @cut */ // show warnings only in dev mode
    /** @cut */ try {
    /** @cut */   if (Object.defineProperty)
    /** @cut */   {
    /** @cut */     // IE8 has Object.defineProperty(), but it works for DOM nodes only
    /** @cut */     var obj = {};
    /** @cut */     Object.defineProperty(obj, 'foo', {
    /** @cut */       get: function(){
    /** @cut */         return true;
    /** @cut */       }
    /** @cut */     });
    /** @cut */
    /** @cut */     // if no exception and property returns true
    /** @cut */     // looks like we could use Object.defineProperty()
    /** @cut */     if (obj.foo === true)
    /** @cut */     {
    /** @cut */       return function(object, name, value, warning){
    /** @cut */         Object.defineProperty(object, name, {
    /** @cut */           get: function(){
    /** @cut */             consoleMethods.warn(warning);
    /** @cut */             return value;
    /** @cut */           },
    /** @cut */           set: function(newValue){
    /** @cut */             value = newValue;
    /** @cut */           }
    /** @cut */         });
    /** @cut */       };
    /** @cut */     }
    /** @cut */   }
    /** @cut */ } catch(e){ }

    return function(){};
  })();

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
  * Merge several objects into new object and returns it.
  * @param {...*} args
  * @return {object}
  */
  function merge(/* obj1 .. objN */){
    var result = {};

    for (var i = 0; i < arguments.length; i++)
      extend(result, arguments[i]);

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
    return function(){
      return value;
    };
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
    var GETTER_ID_PREFIX = 'basisGetterId' + genUID() + '_';
    var GETTER_ID = GETTER_ID_PREFIX + 'root';
    var ID = GETTER_ID_PREFIX;
    var SOURCE = GETTER_ID_PREFIX + 'base';
    var PARENT = GETTER_ID_PREFIX + 'parent';
    var getterSeed = 1;
    var pathCache = {};

    function as(path){
      var self = this;
      var wrapper;
      var result;
      var id;

      if (typeof path == 'function' || typeof path == 'string')
      {
        wrapper = resolveFunction(path, self[ID]);
        id = GETTER_ID_PREFIX + wrapper[ID];

        if (hasOwnProperty.call(self, id))
          return self[id];

        // recover original function, reduce functions call stack
        if (typeof wrapper[SOURCE] == 'function')
          wrapper = wrapper[SOURCE];

        result = function(value){
          return wrapper(self(value));
        };
      }
      else
      {
        // theat non-function/non-string values as maps
        var map = path;

        if (!map)
          return nullGetter;

        result = function(value){
          return map[self(value)];
        };
      }

      /** @cut */ result[PARENT] = self;
      result[ID] = getterSeed++;
      result[SOURCE] = path;
      result.__extend__ = getter;
      result.as = as;

      // cache function/string getters only
      if (id)
        self[id] = result;

      return result;
    }

    function buildFunction(path){
      return new Function('object', 'return object != null ? object.' + path + ' : object');
    }

    function resolveFunction(value, id){
      var fn = value;
      var result;

      if (value && typeof value == 'string')
      {
        if (hasOwnProperty.call(pathCache, value))
          return pathCache[value];

        fn = pathCache[value] = buildFunction(value);
      }

      if (typeof fn != 'function')
      {
        /** @cut */ basis.dev.warn('path for root getter should be function or non-empty string');
        return nullGetter;
      }

      // if function is getter return it
      if (fn.__extend__ === getter)
        return fn;

      // check function cache for getter
      if (hasOwnProperty.call(fn, id))
        return fn[id];

      // if no function, create new getter (function wrapper)
      result = fn[id] = fn !== value
        ? fn  // don't wrap getter from string
        : function(value){
            return fn(value);
          };

      result[ID] = getterSeed++;
      result[SOURCE] = value;
      result.__extend__ = getter;
      result.as = as;

      return result;
    }

    function getter(path, value){
      var result = path && path !== nullGetter
        ? resolveFunction(path, GETTER_ID)
        : nullGetter;

      // backward capability
      if (value || value === '')
      {
        /** @cut basis.js 1.4 */ basis.dev.warn('second argument for getter is deprecated, use `as` method of getter instead');

        if (typeof value == 'string')
          value = stringFunctions.formatter(value);

        return result.as(value);
      }

      return result;
    }

    getter.ID = ID;
    getter.SOURCE = SOURCE;
    getter.PARENT = PARENT;

    return getter;
  })();

  var nullGetter = (function(){
    var nullGetter = function(){};
    nullGetter[getter.ID] = getter.ID + 'nullGetter';
    nullGetter.__extend__ = getter,
    nullGetter.as = function(){
      return nullGetter;
    };
    return nullGetter;
  })();


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
    var inited = 0;
    var self;
    var data;
    return self = function(){
      if (!inited++)
      {
        self.inited = true;  // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        self.data =          // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        data = init.apply(thisObject || this, arguments);
        /** @cut */ if (typeof data == 'undefined') consoleMethods.warn('lazyInit function returns nothing:\n' + init);
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
    var inited = 0;
    var self;
    var data;
    return self = function(){
      if (!inited++)
      {
        self.inited = true;  // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        self.data =          // DON'T USE THIS PROPERTY, IT'S FOR DEBUG PURPOSES ONLY
        data = init.call(thisObject || this);
        /** @cut */ if (typeof data == 'undefined') consoleMethods.warn('lazyInitAndRun function returns nothing:\n' + init);
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
  * Generates name for function and registrates it in global scope.
  * @param {function()} fn Function that should available in global scope.
  * @param {boolean} permanent If false callback will be removed after fiest invoke.
  * @return {string} Function name in global scope.
  */
  function publicCallback(fn, permanent){
    var name = 'basisjsCallback' + genUID();

    global[name] = permanent ? fn : function(){
      delete global[name];
      fn.apply(this, arguments);
    };

    return name;
  }


  // ============================================
  // safe console method wrappers
  //

  var consoleMethods = (function(){
    var methods = {
      log: $undef,
      info: $undef,
      warn: $undef,
      error: $undef
    };

    if (typeof console != 'undefined')
      iterate(methods, function(methodName){
        methods[methodName] = 'bind' in Function.prototype && typeof console[methodName] == 'function'
          ? Function.prototype.bind.call(console[methodName], console)
            // IE8 and lower solution. It's also more safe when Function.prototype.bind
            // defines by other libraries (like es5-shim).
          : function(){
              Function.prototype.apply.call(console[methodName], console, arguments);
            };
      });

    return methods;
  })();


  //
  // Timers
  //

  var setImmediate = global.setImmediate || global.msSetImmediate;
  var clearImmediate = global.clearImmediate || global.msSetImmediate;

  // bind context for setImmediate/clearImmediate, IE10 throw exception if context isn't a global
  if (setImmediate)
    setImmediate = setImmediate.bind(global);

  if (clearImmediate)
    clearImmediate = clearImmediate.bind(global);

  //
  // emulate setImmediate/clearImmediate
  // Inspired on Domenic Denicola's solution https://github.com/NobleJS/setImmediate
  //
  if (!setImmediate)
  {
    (function(){
      var runTask = (function(){
        var taskById = {};
        var taskId = 0;

        // emulate setImmediate
        setImmediate = function(fn/*, ..args */){
          if (typeof fn != 'function')
          {
            /** @cut */ consoleMethods.warn('basis.setImmediate() and basis.nextTick() accept functions only (call ignored)');
            return;
          }

          taskById[++taskId] = {
            fn: fn,
            args: arrayFrom(arguments, 1)
          };

          addToQueue(taskId);

          return taskId;
        };

        // emulate clearImmediate
        clearImmediate = function(taskId){
          delete taskById[taskId];
        };

        //
        // return result function for task run
        //
        return function(taskId){
          var task = taskById[taskId];

          if (task)
          {
            delete taskById[taskId];
            task.fn.apply(undefined, task.args);
          }

          asap.process();
        };
      })();

      // by default
      var addToQueue = function(taskId){
        setTimeout(function(){
          runTask(taskId);
        }, 0);
      };

      //
      // implement platform specific solution
      //
      if (NODE_ENV && NODE_ENV.process && typeof process.nextTick == 'function')
      {
        // use next tick on node.js
        addToQueue = function(taskId){
          process.nextTick(function(){
            runTask(taskId);
          });
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
          global.postMessage('', '*');
          global.onmessage = oldOnMessage;
        }

        if (postMessageSupported)
        {
          // postMessage scheme
          var taskIdByMessage = {};
          var setImmediateHandler = function(event){
            if (event && event.source == global)
            {
              var data = event.data;
              if (hasOwnProperty.call(taskIdByMessage, data))
              {
                var taskId = taskIdByMessage[data];
                delete taskIdByMessage[data];
                runTask(taskId);
              }
            }
          };

          if (global.addEventListener)
            global.addEventListener('message', setImmediateHandler, true);
          else
            global.attachEvent('onmessage', setImmediateHandler);

          // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
          // invoking our onGlobalMessage listener above.
          addToQueue = function(taskId){
            var message = genUID(32);
            taskIdByMessage[message] = taskId;
            global.postMessage(message, '*');
          };
        }
        else
        {
          //
          if (global.MessageChannel)
          {
            var channel = new global.MessageChannel();

            channel.port1.onmessage = function(event){
              runTask(event.data);
            };

            addToQueue = function(taskId){
              channel.port2.postMessage(taskId);
            };
          }
          else
          {
            var createScript = function(){
              return document.createElement('script');
            };

            if (document && 'onreadystatechange' in createScript())
            {
              // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
              // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called
              var defaultAddToQueue = addToQueue;
              addToQueue = function beforeHeadReady(taskId){
                if (typeof documentInterface != 'undefined')
                {
                  addToQueue = defaultAddToQueue;

                  documentInterface.head.ready(function(){
                    addToQueue = function(taskId){
                      var scriptEl = createScript();
                      scriptEl.onreadystatechange = function(){
                        scriptEl.onreadystatechange = null;
                        //scriptEl.parentNode.removeChild(scriptEl);
                        documentInterface.remove(scriptEl);
                        scriptEl = null;

                        // should be called last as exception possible
                        runTask(taskId);
                      };
                      //document.documentElement.appendChild(scriptEl);
                      documentInterface.head.add(scriptEl);
                    };
                  });
                }

                if (addToQueue === beforeHeadReady)
                  defaultAddToQueue(taskId);
                else
                  addToQueue(taskId);
              };
            }
          }
        }
      }
    })();
  }

  //
  // asap
  //
  var asap = (function(){
    var queue = [];
    var processing = false;
    var timer;

    // run process queue function only if any task
    // as try/finally doesn't optimize
    function processQueue(){
      try {
        // mark queue as processing to avoid concurrency
        processing = true;

        // process queue
        var item;
        while (item = queue.shift())
          item.fn.call(item.context);
      } finally {
        // queue is not processing anymore
        processing = false;

        // if any function in queue than exception was occured,
        // run rest functions in next code frame
        if (queue.length)
          timer = setImmediate(process);
      }
    }

    function process(){
      // if any timer - reset it
      if (timer)
        timer = clearImmediate(timer);

      // process queue only if any task
      if (queue.length)
        processQueue();
    }

   /**
    * Invoke function as soon as possible. The ideal case is invocation in the end
    * of current code frame (after all changes done). It's possible when code frame
    * inited by browser events or timers (setImmediate/clearImmediate/nextTick), so
    * we can process asap functions right after handler function was invoked.
    * Asap function invocation can't be aborted.
    *
    * Single timer is using for asap functions invocation. Exceptions aren't catching.
    * If any exception rest functions will be invoked in next code frame.
    *
    * @param {function} fn Function that should be invoked ASAP.
    * @param {*=} context Context for function invocation.
    */
    var asap = function(fn, context){
      // add function to queue
      queue.push({
        fn: fn,
        context: context
      });

      // set timer to process queue, if timer is not set yet
      if (!timer)
        timer = setImmediate(process);

      return true;
    };

   /**
    * Run asap functions processing.
    */
    asap.process = function(){
      // run queue process only if queue isn't processing
      if (!processing)
        process();
    };

    return asap;
  })();


  // ============================================
  // path utils
  //

 /**
  * Utilities for handling and transforming file paths. All these functions perform
  * only string transformations. Server or something else are not consulted to
  * check whether paths are valid.
  *
  * Functions are work similar to node.js `path` module. For node.js environment
  * `path` module is used.
  *
  * @name path
  * @namespace basis.path
  */
  var pathUtils = (function(){
    var ABSOLUTE_RX = /^([^\/]+:|\/)/;
    var PROTOCOL_RX = /^[a-zA-Z0-9\-]+:\/?/;
    var ORIGIN_RX = /^(?:[a-zA-Z0-9\-]+:)?\/\/[^\/]+\/?/;
    var SEARCH_HASH_RX = /[\?#].*$/;

    var baseURI;
    var origin;
    var utils;

    if (NODE_ENV)
    {
      // try to use baseURI from process, it may be provided by parent module
      var path = (process.basisjsBaseURI || require('path').resolve('.')).replace(/\\/g, '/'); // on Windows path contains backslashes
      baseURI = path.replace(/^[^\/]*/, '');
      origin = path.replace(/\/.*/, '');
    }
    else
    {
      baseURI = location.pathname.replace(/[^\/]+$/, '');
      origin = location.protocol + '//' + location.host;
    }

    utils = {
      baseURI: baseURI,
      origin: origin,

     /**
      * Normalize a string path, taking care of '..' and '.' parts.
      * When multiple slashes are found, they're replaced by a single one;
      * when the path contains a trailing slash, it is preserved.
      *
      * Origin is not includes in result path.
      *
      * @example
      *   basis.path.normalize('/foo/bar//baz/asdf/quux/..');
      *   // returns '/foo/bar/baz/asdf'
      *
      *   basis.path.normalize('http://example.com:8080/foo//..//bar/');
      *   // returns '/bar'
      *
      *   basis.path.normalize('//localhost/foo/./..//bar/');
      *   // returns '/bar'
      *
      * @param {string} path
      * @return {string}
      */
      normalize: function(path){
        path = (path || '')
              .replace(PROTOCOL_RX, '/')
              .replace(ORIGIN_RX, '/')        // but cut off origin
              .replace(SEARCH_HASH_RX, '');   // cut off query search and hash

        // use link element as path resolver
        var result = [];
        var parts = path.split('/');             // split

        // process path parts
        for (var i = 0; i < parts.length; i++)
        {
          if (parts[i] == '..')
          {
            if (result.length > 1 || result[0])
              result.pop();
          }
          else
          {
            if ((parts[i] || !i) && parts[i] != '.')
              result.push(parts[i]);
          }
        }

        return result.join('/') ||
               (path[0] === '/' ? '/' : '');
      },

     /**
      * Return the directory name of a path. Similar to node.js path.dirname
      * or the Unix dirname command.
      *
      * @example
      *   basis.path.dirname('/foo/bar/baz/whatever'); // returns '/foo/bar/baz'
      *
      * @param {string} path
      * @return {string}
      */
      dirname: function(path){
        var result = utils.normalize(path);
        return result.replace(/\/([^\/]*)$|^[^\/]+$/, '') ||
               (result[0] == '/' ? '/' : '.');
      },

     /**
      * Return the extension of the path, from the last '.' to end of string
      * in the last portion of the path. If there is no '.' in the last
      * portion of the path or the first character of it is '.', then it
      * returns an empty string.
      *
      * @example
      *   basis.path.extname('index.html'); // returns '.html'
      *   basis.path.extname('index.');     // returns '.'
      *   basis.path.extname('index');      // returns ''
      *
      * @param {string} path
      * @return {string} Path extension with leading dot or empty string.
      */
      extname: function(path){
        var ext = utils.normalize(path).match(/[^\/](\.[^\/\.]*)$/);
        return ext ? ext[1] : '';
      },

     /**
      * Return the last portion of a path. Similar to node.js path.basename
      * or the Unix basename command.
      *
      * @example
      *   basis.path.basename('/foo/bar/baz.html');          // returns 'baz.html'
      *   basis.path.basename('/foo/bar/baz.html', '.html'); // returns 'baz'
      *
      * @param {string} path
      * @param {string=} ext
      * @return {string}
      */
      basename: function(path, ext){
        var filename = utils.normalize(path).match(/[^\\\/]*$/);
        filename = filename ? filename[0] : '';

        if (ext == utils.extname(filename))
          filename = filename.substring(0, filename.length - ext.length);

        return filename;
      },

     /**
      * Resolves to to an absolute path.
      *
      * If to isn't already absolute from arguments are prepended in right
      * to left order, until an absolute path is found. If after using all
      * from paths still no absolute path is found, the current location is
      * used as well. The resulting path is normalized, and trailing slashes
      * are removed unless the path gets resolved to the root directory.
      * Non-string arguments are ignored.
      *
      * @example
      *   basis.path.resolve('/foo/bar', './baz');
      *   // returns '/foo/bar/baz'
      *
      *   basis.path.resolve('/foo/bar', '/demo/file/');
      *   // returns '/demo/file'
      *
      *   basis.path.resolve('foo', 'bar/baz/', '../gif/image.gif');
      *   // if current location is /demo, it returns '/demo/foo/bar/gif/image.gif'
      *
      * @param {..string=} from
      * @param {string} to
      * @return {string}
      */
      resolve: function(from, to){
        var args = arrayFrom(arguments).reverse();
        var path = [];
        var absoluteFound = false;

        for (var i = 0; !absoluteFound && i < args.length; i++)
          if (typeof args[i] == 'string')
          {
            path.unshift(args[i]);
            absoluteFound = ABSOLUTE_RX.test(args[i]);
          }

        if (!absoluteFound)
          path.unshift(baseURI == '/' ? '' : baseURI);

        return utils.normalize(path.join('/'));
      },

     /**
      * Solve the relative path from from to to.
      *
      * At times we have two absolute paths, and we need to derive the
      * relative path from one to the other. This is actually the reverse
      * transform of {basis.path.resolve}, which means we see that:
      *
      *   basis.path.resolve(from, basis.path.relative(from, to)) == basis.path.resolve(to)
      *
      * If `to` argument omitted than resolve `from` relative to current baseURI.
      *
      * Function also could be used with Array#map method as well. In this case
      * every array member resolves to current baseURI.
      *
      * @example
      *   basis.path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
      *   // returns '../../impl/bbb'
      *
      *   ['foo', '/a/b/bar', 'a/b/baz'].map(basis.path.relative);
      *   // if baseURI is '/a/b' it produces
      *   // ['../../foo', 'bar', '../../a/b/baz']
      *
      * @param {string} from
      * @param {string=} to
      * @return {string}
      */
      relative: function(from, to){
        // it makes function useful with array iterate methods, i.e.
        // ['foo', 'bar'].map(basis.path.relative)
        if (typeof to != 'string')
        {
          to = from;
          from = baseURI;
        }

        from = utils.normalize(from);
        to = utils.normalize(to);

        if (from[0] == '/' && to[0] != '/')
          return from;
        if (to[0] == '/' && from[0] != '/')
          return to;

        var base = from.replace(/^\/$/, '').split(/\//);
        var path = to.replace(/^\/$/, '').split(/\//);
        var result = [];
        var i = 0;

        while (path[i] == base[i] && typeof base[i] == 'string')
          i++;

        for (var j = base.length - i; j > 0; j--)
          result.push('..');

        return result.concat(path.slice(i).filter(Boolean)).join('/');
      }
    };

    return utils;
  })();


  // =============================================
  // apply config
  //

 /**
  * @namespace basis
  */

  var basisFilename = __basisFilename || '';
  var config = fetchConfig();

 /**
  * Fetch basis.js options from script's `basis-config` or `data-basis-config` attribute.
  */
  function fetchConfig(){
    var config = __config;

    if (!config)
    {
      if (NODE_ENV)
      {
        // node.js env
        basisFilename = process.basisjsFilename || __filename.replace(/\\/g, '/');  // on Windows path contains backslashes

        /** @cut */ if (process.basisjsConfig)
        /** @cut */ {
        /** @cut */   config = process.basisjsConfig;
        /** @cut */   if (typeof config == 'string')
        /** @cut */   {
        /** @cut */     try {
        /** @cut */       config = Function('return{' + config + '}')();
        /** @cut */     } catch(e) {
        /** @cut */       /** @cut */ consoleMethods.error('basis-config: basis.js config parse fault: ' + e);
        /** @cut */     }
        /** @cut */   }
        /** @cut */ }
      }
      else
      {
        // browser env
        var scripts = document.scripts;
        for (var i = 0, scriptEl; scriptEl = scripts[i]; i++)
        {
          var configAttrValue = scriptEl.hasAttribute('basis-config')
            ? scriptEl.getAttribute('basis-config')
            : scriptEl.getAttribute('data-basis-config');

          scriptEl.removeAttribute('basis-config');
          scriptEl.removeAttribute('data-basis-config');

          if (configAttrValue !== null)
          {
            basisFilename = pathUtils.normalize(scriptEl.src);

            try {
              config = Function('return{' + configAttrValue + '}')();
            } catch(e) {
              /** @cut */ consoleMethods.error('basis-config: basis.js config parse fault: ' + e);
            }

            break;
          }
        }
      }
    }

    return processConfig(config);
  }

 /**
  * Process config object and returns adopted config.
  *
  * Special options:
  * - autoload: namespace that must be loaded right after core loaded
  * - path: dictionary of paths for root namespaces
  * - modules: dictionary of modules with options
  *
  * Other options copy into basis.config as is.
  */
  function processConfig(config, verbose){
    // make a copy of config
    config = slice(config);

    // extend by default settings
    complete(config, {
      implicitExt: NODE_ENV ? true : 'warn'  // true, false, 'warn'
    });

    // warn about extProto in basis-config, this option was removed in 1.3.0
    /** @cut */ if ('extProto' in config)
    /** @cut */   consoleMethods.warn('basis-config: `extProto` option in basis-config is not support anymore');

    // warn about path in basis-config, this option was deprecated in 1.3.0
    /** @cut */ if ('path' in config)
    /** @cut */   consoleMethods.warn('basis-config: `path` option in basis-config is deprecated, use `modules` instead');

    // build modules list
    var autoload = [];
    var modules = merge(config.path, config.modules, {
      basis: basisFilename
    });

    // reset modules
    config.modules = {};

    // process autoload
    if (config.autoload)
    {
      // [path/to/][name][.rest.ext] -> {
      //   name: name,
      //   filename: path + name + rest
      // }

      var m = String(config.autoload).match(/^((?:[^\/]*\/)*)([a-z$_][a-z0-9$_]*)((?:\.[a-z$_][a-z0-9$_]*)*)$/i);
      if (m)
      {
        modules[m[2]] = {
          autoload: true,
          filename: m[1] + m[2] + (m[3] || '.js')
        };
      }
      else
      {
        /** @cut */ consoleMethods.warn('basis-config: wrong `autoload` value (setting ignored): ' + config.autoload);
      }

      delete config.autoload;
    }

    // process modules
    for (var name in modules)
    {
      // name: {
      //   autoload: boolean,
      //   path: 'path/to',
      //   filename: 'module.js'
      // }
      //
      // or
      //
      // name: 'filename'

      var module = modules[name];

      // if value is string, convert to config
      if (typeof module == 'string')
        // value is filename
        module = {
          // if path ends with `/` add `[name].js` to the end
          filename: module.replace(/\/$/, '/' + name + '.js')
        };

      // get and resolve path and filename
      var filename = module.filename;
      var path = module.path;

      // if no path but filename
      // let filename equals to 'path/to/file[.ext]', then
      //   path = 'path/to/file'
      //   filename = '../file[.ext]'
      if (filename && !path)
      {
        filename = pathUtils.resolve(filename);
        path = filename.substr(0, filename.length - pathUtils.extname(filename).length);
        filename = '../' + pathUtils.basename(filename);
      }

      // path should be absolute
      // at this point path is defined in any case
      path = pathUtils.resolve(path);

      // if no filename but path
      // let path equals to 'path/to/file[.ext]', then
      //   path = 'path/to'
      //   filename = 'file[.ext]'
      if (!filename && path)
      {
        filename = pathUtils.basename(path);
        path = pathUtils.dirname(path);
      }

      // if filename has no extension, adds `.js`
      if (!pathUtils.extname(filename))
        filename += '.js';

      // resolve filename
      filename = pathUtils.resolve(path, filename);

      // store results
      config.modules[name] = {
        path: path,
        filename: filename
      };

      // store autoload modules
      if (module.autoload)
      {
        config.autoload = autoload;
        autoload.push(name);
      }
    }

    return config;
  }


  // ============================================
  // OOP section: Class implementation
  //

  var Class = (function(){

   /**
    * This namespace introduce class creation scheme. It recomended for new
    * classes creation, but use able to use buildin sheme for your purposes.
    *
    * All Basis classes and components (with some exceptions) are
    * building using this sheme.
    *
    * @example
    *   var Foo = basis.Class(null, { // you can use basis.Class instead of null
    *     name: 'default value',
    *     init: function(title){ // special method - constructor
    *       this.title = title;
    *     },
    *     say: function(){
    *       return 'My name is ' + this.title;
    *     }
    *   });
    *
    *   var Bar = basis.Class(Foo, {
    *     age: 0,
    *     init: function(title, age){
    *       Foo.prototype.init.call(this, title);
    *       this.age = age;
    *     },
    *     say: function(){
    *       return Foo.prototype.say.call(this) + ' I\'m ' + this.age + ' year old.';
    *     }
    *   });
    *
    *   var foo = new Foo('John');
    *   var bar = new Bar('Ivan', 25);
    *   console.log(foo.say()); // My name is John.
    *   console.log(bar.say()); // My name is Ivan. I'm 25 year old.
    *   console.log(bar instanceof basis.Class); // true
    *   console.log(bar instanceof Foo); // true
    *   console.log(bar instanceof Bar); // true
    *
    * @namespace basis.Class
    */

   /**
    * Global instances seed.
    */
    var instanceSeed = { id: 1 };
    var classSeed = 1;
    /** @cut */ var classes = [];

   /**
    * Class construct helper: self reference value
    */
    var SELF = {};

   /**
    * Test object is it a class.
    * @param {Object} object
    * @return {boolean} Returns true if object is class.
    */
    function isClass(object){
      return typeof object == 'function' && !!object.basisClassId_;
    }

   /**
    * @param {function()} superClass
    * @return {boolean}
    */
    function isSubclassOf(superClass){
      var cursor = this;

      while (cursor && cursor !== superClass)
        cursor = cursor.superClass_;

      return cursor === superClass;
    }

   /**
    * dev mode only
    */
    function devVerboseName(name, args, fn){
      return new Function(keys(args), 'return {"' + name + '": ' + fn + '\n}["' + name + '"]').apply(null, values(args));
    }


    // test is toString property enumerable
    var TOSTRING_BUG = (function(){
      for (var key in { toString: 1 })
        return false;
      return true;
    })();


   /**
    * Class constructor.
    * @param {function()} SuperClass Class that new one inherits of.
    * @param {...object} extensions Objects that extends new class prototype.
    * @return {function()} A new class.
    */
    function createClass(SuperClass, extensions){
      var classId = classSeed++;

      if (typeof SuperClass != 'function')
        SuperClass = BaseClass;

      /** @cut */ var className = '';

      /** @cut */ for (var i = 1, extension; extension = arguments[i]; i++)
      /** @cut */   if (typeof extension != 'function' && extension.className)
      /** @cut */     className = extension.className;

      /** @cut */ if (!className)
      /** @cut */   className = SuperClass.className + '._Class' + classId;
      /** @cut */ // consoleMethods.warn('Class has no name');

      // temp class constructor with no init call
      var NewClassProto = function(){};

      // verbose name in dev
      /** @cut */ NewClassProto = devVerboseName(className, {}, NewClassProto);

      NewClassProto.prototype = SuperClass.prototype;

      var newProto = new NewClassProto;
      var newClassProps = {
        /** @cut */ className: className,

        basisClassId_: classId,
        superClass_: SuperClass,
        extendConstructor_: !!SuperClass.extendConstructor_,

        // class methods
        isSubclassOf: isSubclassOf,
        subclass: function(){
          return createClass.apply(null, [newClass].concat(arrayFrom(arguments)));
        },
        extend: extendClass,

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
        newClassProps.extend(extension);

      /** @cut */if (newProto.init !== BaseClass.prototype.init && !/^function[^(]*\(\)/.test(newProto.init) && newClassProps.extendConstructor_) consoleMethods.warn('probably wrong extendConstructor_ value for ' + newClassProps.className);

      // new class constructor
      var newClass = newClassProps.extendConstructor_
        // constructor with instance extension
        ? function(extend){
            // mark object
            this.basisObjectId = instanceSeed.id++;

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
            this.init();

            // post init
            this.postInit();
          }

        // simple constructor
        : function(){
            // mark object
            this.basisObjectId = instanceSeed.id++;

            // call constructor
            this.init.apply(this, arguments);

            // post init
            this.postInit();
          };

      // verbose name in dev
      // NOTE: this code makes Chrome and Firefox show class name in console
      /** @cut */ newClass = devVerboseName(className, { instanceSeed: instanceSeed }, newClass);

      // add constructor property to prototype
      newProto.constructor = newClass;

      for (var key in newProto)
        if (newProto[key] === SELF)
          newProto[key] = newClass;
        //else
        //  newProto[key] = newProto[key];

      // extend constructor with properties
      extend(newClass, newClassProps);

      // for class introspection
      /** @cut */ classes.push(newClass);

      // return new class
      return newClass;
    }

   /**
    * Extend class prototype
    * @param {Object} source If source has a prototype, it will be used to extend current prototype.
    * @return {function()} Returns `this`.
    */
    function extendClass(source){
      var proto = this.prototype;

      if (typeof source == 'function' && !isClass(source))
        source = source(this.superClass_.prototype, slice(proto));

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
            ///** @cut */ if (value && !value.__extend__ && (value.constructor == Object || value.constructor == Array)){ consoleMethods.warn('!' + key); }
          }
        }
      }

      // for browsers that doesn't enum toString
      if (TOSTRING_BUG && source[key = 'toString'] !== toString)
        proto[key] = source[key];

      return this;
    }


    //
    // base class
    //
    var BaseClass = extend(createClass, {
      className: 'basis.Class',

      // non-auto extend by default
      extendConstructor_: false,

      // prototype defaults
      prototype: {
        basisObjectId: 0,

        constructor: null,

        init: function(){
        },
        postInit: function(){
        },

        /** @cut */ toString: function(){ // verbose in dev
        /** @cut */   return '[object ' + (this.constructor || this).className + ']';
        /** @cut */ },

        destroy: function(){
          for (var prop in this)
            if (hasOwnProperty.call(this, prop))
              this[prop] = null;

          this.destroy = $undef;
        }
      }
    });


   /**
    * @param {object} extension
    * @param {function()=} fn
    * @param {string} devName Dev only
    * @return {object}
    */
    var customExtendProperty = function(extension, fn, devName){
      return {
        __extend__: function(extension){
          if (!extension)
            return extension;

          if (extension && extension.__extend__)
            return extension;

          var Base = function(){};
          /** @cut verbose name in dev */ Base = devVerboseName(devName || 'customExtendProperty', {}, Base);
          Base.prototype = this;

          var result = new Base;

          fn(result, extension);

          return result;
        }
      }.__extend__(extension || {});
    };


   /**
    * @param {object} extension
    * @return {object}
    */
    var extensibleProperty = function(extension){
      return customExtendProperty(extension, extend, 'extensibleProperty');
    };


   /**
    * @param {object} extension
    * @return {object}
    */
    var nestedExtendProperty = function(extension){
      return customExtendProperty(extension, function(result, extension){
        for (var key in extension)
          if (hasOwnProperty.call(extension, key))
          {
            var value = result[key];
            var newValue = extension[key];
            if (newValue)
              result[key] = value && value.__extend__
                ? value.__extend__(newValue)
                : extensibleProperty(newValue);
            else
              result[key] = null;
          }
      }, 'nestedExtendProperty');
    };

   /**
    * @param {function()} fn
    * @param {object=} keys
    * @return {object}
    */
    var oneFunctionProperty = function(fn, keys){
      var create = function(keys){
        var result = {
          __extend__: create
        };

        if (keys)
        {
          if (keys.__extend__)
            return keys;

          // verbose name in dev
          /** @cut */ var Cls = devVerboseName('oneFunctionProperty', {}, function(){});
          /** @cut */ result = new Cls;
          /** @cut */ result.__extend__ = create;

          for (var key in keys)
            if (hasOwnProperty.call(keys, key) && keys[key])
              result[key] = fn;
        }

        return result;
      };

      return create(keys || {});
    };


    //
    // export names
    //

    return extend(BaseClass, {
      /** @cut */ all_: classes,

      SELF: SELF,

      create: createClass,
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

 /**
  * @class
  */
  var Token = Class(null, {
    className: 'basis.Token',

   /**
    * @type {*}
    */
    value: null,

   /**
    * @type {object}
    */
    handler: null,

   /**
    * @type {basis.DeferredToken}
    */
    deferredToken: null,

   /**
    * Binding interface.
    * @type {object}
    */
    bindingBridge: {
      attach: function(host, fn, context, onDestroy){
        host.attach(fn, context, onDestroy);
      },
      detach: function(host, fn, context){
        host.detach(fn, context);
      },
      get: function(host){
        return host.get();
      }
    },

   /**
    * @constructor
    */
    init: function(value){
      this.value = value;
    },

   /**
    * Returns token value.
    * @return {*} Current token value.
    */
    get: function(){
      return this.value;
    },

   /**
    * Set new value for token. Call apply method if value has been changed.
    * @param {*} value
    */
    set: function(value){
      if (this.value !== value)
      {
        this.value = value;
        this.apply();
      }
    },

   /**
    * Add callback on token value changes.
    * @param {function(value)} fn
    * @param {object=} context
    */
    attach: function(fn, context, onDestroy){
      /** @cut */ var cursor = this;
      /** @cut */ while (cursor = cursor.handler)
      /** @cut */   if (cursor.fn === fn && cursor.context === context)
      /** @cut */     consoleMethods.warn('basis.Token#attach: duplicate fn & context pair');

      this.handler = {
        fn: fn,
        context: context,
        destroy: onDestroy || null,
        handler: this.handler
      };
    },

   /**
    * Remove callback. Must be passed the same arguments as for {basis.Token#attach} method.
    * @param {function(value)} fn
    * @param {object=} context
    */
    detach: function(fn, context){
      var cursor = this;
      var prev;

      while (prev = cursor, cursor = cursor.handler)
        if (cursor.fn === fn && cursor.context === context)
        {
          // make it non-callable
          cursor.fn = $undef;
          cursor.destroy = cursor.destroy && $undef;

          // remove from list
          prev.handler = cursor.handler;

          return;
        }

      /** @cut */ consoleMethods.warn('basis.Token#detach: fn & context pair not found, nothing was removed');
    },

   /**
    * Call every attached callbacks with current token value.
    */
    apply: function(){
      var value = this.get();
      var cursor = this;

      while (cursor = cursor.handler)
        cursor.fn.call(cursor.context, value);
    },

   /**
    * Returns deferred token based on this token. Every token can has
    * only one it's own deferred token.
    * @return {basis.DeferredToken}
    */
    deferred: function(){
      var token = this.deferredToken;

      if (!token)
      {
        token = this.deferredToken = new DeferredToken(this.get());
        this.attach(token.set, token);
      }

      return token;
    },

   /**
    * Creates new token from token that contains modified through fn value.
    * @param {function(value):value} fn
    * @return {*}
    */
    as: function(fn){
      var token = new Token();
      var setter = function(value){
        this.set(fn.call(this, value));
      };

      setter.call(token, this.get());

      this.attach(setter, token, token.destroy);
      token.attach($undef, this, function(){
        this.detach(setter, token);
      });

      return token;
    },

   /**
    * Actually it's not require invoke destroy method for token, garbage
    * collector have no problems to free token's memory when all references
    * to token are removed.
    * @destructor
    */
    destroy: function(){
      if (this.deferredToken)
      {
        this.deferredToken.destroy();
        this.deferredToken = null;
      }

      this.attach = $undef;
      this.detach = $undef;

      var cursor = this;
      while (cursor = cursor.handler)
        if (cursor.destroy)
          cursor.destroy.call(cursor.context);

      this.handler = null;
      this.value = null;
    }
  });

  //
  // Deferred token
  //

  var awaitToApply = (function(){
    var tokens = {};
    var timer;

    function applyTokens(){
      var list = tokens;

      // reset list & timer
      tokens = {};
      timer = null;

      // call apply method for all tokens in the list
      for (var key in list)
        list[key].apply();
    }

    return function(token){
      if (token.basisObjectId in tokens)
        return;

      tokens[token.basisObjectId] = token;

      if (!timer)
        setImmediate(applyTokens);
    };
  })();

 /**
  * @class
  */
  var DeferredToken = Token.subclass({
    className: 'basis.DeferredToken',

   /**
    * Set new value for token and schedule to call apply method.
    * @param {*} value
    */
    set: function(value){
      if (this.value !== value)
      {
        this.value = value;
        awaitToApply(this);
      }
    },

   /**
    * That method for DeferredToken returns token itself.
    */
    deferred: function(){
      return this;
    }
  });


  //
  // Resources
  //

  var resources = {};
  var resourceContentCache = {};
  var resourcePatch = {};
  var virtualResourceSeed = 1;
  /** @cut */ var resourceResolvingStack = [];
  /** @cut */ var requires;
  // var resourceUpdateNotifier = extend(new Token(), {
  //   set: function(value){
  //     this.value = value;
  //     this.apply();
  //   }
  // });

  // apply prefetched resources to cache
  (function(){
    var map = typeof __resources__ != 'undefined' ? __resources__ : null;
    if (map)
    {
      for (var key in map)
        resourceContentCache[pathUtils.resolve(key)] = map[key];

      //__resources__ = null; // reset prefetched to reduce memory leaks
    }
  })();

  function applyResourcePatches(resource){
    var patches = resourcePatch[resource.url];

    if (patches)
      for (var i = 0; i < patches.length; i++)
      {
        /** @cut */ consoleMethods.info('Apply patch for ' + resource.url);
        patches[i](resource.get(), resource.url);
      }
  }

  var resolveResourceUri = function(url, baseURI, clr){
    var rootNS = url.match(/^([a-zA-Z0-9\_\-]+):/);

    if (rootNS)
    {
      var namespaceRoot = rootNS[1];

      if (namespaceRoot in nsRootPath == false)
        nsRootPath[namespaceRoot] = pathUtils.baseURI + namespaceRoot + '/';

      url = nsRootPath[namespaceRoot] + pathUtils.normalize('./' + url.substr(rootNS[0].length));
    }
    else
    {
      url = pathUtils.resolve(baseURI, url);
    }

    /** @cut */ if (!/^(\.\/|\.\.|\/)/.test(url))
    /** @cut */   consoleMethods.warn('Bad usage: ' + (clr ? clr.replace('{url}', url) : url) + '.\nFilenames should starts with `./`, `..` or `/`. Otherwise it will treats as special reference in next minor release.');

    return url;
  };

  var getResourceContent = function(url, ignoreCache){
    if (ignoreCache || !hasOwnProperty.call(resourceContentCache, url))
    {
      var resourceContent = '';

      if (!NODE_ENV)
      {
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        // set if-modified-since header since begining prevents cache using;
        // otherwise browser could never ask server for new file content
        // and use file content from cache
        req.setRequestHeader('If-Modified-Since', new Date(0).toGMTString());
        req.setRequestHeader('X-Basis-Resource', 1);
        req.send('');

        if (req.status >= 200 && req.status < 400)
          resourceContent = req.responseText;
        else
        {
          /** @cut */ consoleMethods.error('basis.resource: Unable to load ' + url + ' (status code ' + req.status + ')');
        }
      }
      else
      {
        try {
          // try to use special read file function, it may be provided by parent module
          resourceContent = process.basisjsReadFile
            ? process.basisjsReadFile(url)
            : require('fs').readFileSync(url, 'utf-8');
        } catch(e){
          /** @cut */ consoleMethods.error('basis.resource: Unable to load ' + url, e);
        }
      }

      resourceContentCache[url] = resourceContent;
    }

    return resourceContentCache[url];
  };

  var createResource = function(resourceUrl, content){
    var contentType = pathUtils.extname(resourceUrl);
    var contentWrapper = getResource.extensions[contentType];
    var isVirtual = arguments.length > 1;
    var resolved = false;
    var wrapped = false;
    /** @cut */ var wrappedContent;

    if (isVirtual)
      resourceUrl += '#virtual';

    var resource = function(){
      // if resource resolved, just return content
      if (resolved)
        return content;

      // fetch url content
      var urlContent = isVirtual ? content : getResourceContent(resourceUrl);

      /** @cut    recursion warning */
      /** @cut */ var idx = resourceResolvingStack.indexOf(resourceUrl);
      /** @cut */ if (idx != -1)
      /** @cut */   consoleMethods.warn('basis.resource recursion:', resourceResolvingStack.slice(idx).concat(resourceUrl).map(pathUtils.relative, pathUtils).join(' -> '));
      /** @cut */ resourceResolvingStack.push(resourceUrl);

      // if resource type has wrapper - wrap it, or use url content as result
      if (contentWrapper)
      {
        if (!wrapped)
        {
          wrapped = true;
          content = contentWrapper(urlContent, resourceUrl);
          /** @cut */ wrappedContent = urlContent;
        }
      }
      else
      {
        content = urlContent;
      }

      // mark as resolved and apply binded functions
      resolved = true;
      applyResourcePatches(resource);
      resource.apply();

      // resourceUpdateNotifier.value = resourceUrl;
      // resourceUpdateNotifier.apply();

      /** @cut    recursion warning */
      /** @cut */ resourceResolvingStack.pop();

      return content;
    };

    extend(resource, extend(new Token(), {
      url: resourceUrl,
      type: contentType,
      virtual: isVirtual,

      fetch: function(){
        return resource();
      },
      toString: function(){
        return '[basis.resource ' + resourceUrl + ']';
      },
      isResolved: function(){
        return resolved;
      },
      /** @cut */ hasChanges: function(){
      /** @cut */   return contentWrapper ? resourceContentCache[resourceUrl] !== wrappedContent : false;
      /** @cut */ },
      update: function(newContent){
        if (!resolved || isVirtual || newContent != resourceContentCache[resourceUrl])
        {
          if (!isVirtual)
            resourceContentCache[resourceUrl] = newContent;

          if (contentWrapper)
          {
            if (!wrapped && isVirtual)
              content = newContent;

            // wrap content only if it wrapped already and non-updatable
            if (wrapped && !contentWrapper.permanent)
            {
              content = contentWrapper(newContent, resourceUrl, content);
              applyResourcePatches(resource);
              resource.apply();
            }
          }
          else
          {
            content = newContent;
            resolved = true;
            applyResourcePatches(resource);
            resource.apply();
          }

          // resourceUpdateNotifier.value = resourceUrl;
          // resourceUpdateNotifier.apply();
        }
      },
      reload: function(){
        if (isVirtual)
          return;

        var oldContent = resourceContentCache[resourceUrl];
        var newContent = getResourceContent(resourceUrl, true);

        if (newContent != oldContent)
        {
          resolved = false;
          resource.update(newContent);
        }
      },
      get: function(source){
        if (isVirtual)
          if (source)
            return contentWrapper ? wrappedContent : content;

        return source ? getResourceContent(resourceUrl) : resource();
      },
      ready: function(fn, context){
        if (resolved)
        {
          fn.call(context, resource());

          if (contentWrapper && contentWrapper.permanent)
            return;
        }

        resource.attach(fn, context);

        return resource;
      }
    }));

    // cache it
    resources[resourceUrl] = resource;

    return resource;
  };

 /**
  * @name resource
  */
  var getResource = function(url){
    var resource = resources[url];

    if (!resource)
    {
      var resolvedUrl = resolveResourceUri(url, null, 'basis.resource(\'{url}\')');

      resource = resources[resolvedUrl] || createResource(resolvedUrl);
      resources[url] = resource;
    }

    // return resource or create it
    return resource;
  };

  extend(getResource, {
    resolveURI: resolveResourceUri,
    // onUpdate: function(fn, context){
    //   resourceUpdateNotifier.attach(fn, context);
    // },
    isResource: function(value){
      return value ? resources[value.url] === value : false;
    },
    isResolved: function(resourceUrl){
      var resource = getResource.get(resourceUrl);

      return resource ? resource.isResolved() : false;
    },
    exists: function(resourceUrl){
      return hasOwnProperty.call(resources, resolveResourceUri(resourceUrl, null, 'basis.resource.exists(\'{url}\')'));
    },
    get: function(resourceUrl){
      resourceUrl = resolveResourceUri(resourceUrl, null, 'basis.resource.get(\'{url}\')');

      if (!getResource.exists(resourceUrl))
        return null;

      return getResource(resourceUrl);
    },
    getFiles: function(cache){
      return cache
        ? keys(resourceContentCache)
        : keys(resources).filter(function(filename){
            return !resources[filename].virtual;
          });
    },

    virtual: function(type, content, ownerUrl){
      return createResource(
        (ownerUrl ? ownerUrl + ':' : pathUtils.normalize(pathUtils.baseURI == '/' ? '' : pathUtils.baseURI) + '/') +
          'virtual-resource' + (virtualResourceSeed++) + '.' + type,
        content
      );
    },

    extensions: {
      '.js': extend(function processJsResourceContent(content, filename){
        var namespace = filename2namespace[filename];

        if (!namespace)
        {
          var implicitNamespace = true;
          var resolvedFilename = (pathUtils.dirname(filename) + '/' + pathUtils.basename(filename, pathUtils.extname(filename))).replace(/^\/\//, '/');

          for (var ns in nsRootPath)
          {
            var path = nsRootPath[ns] + ns + '/';
            if (resolvedFilename.substr(0, path.length) == path)
            {
              implicitNamespace = false;
              resolvedFilename = resolvedFilename.substr(nsRootPath[ns].length);
              break;
            }
          }

          namespace = resolvedFilename
            .replace(/\./g, '_')
            .replace(/^\//g, '')
            .replace(/\//g, '.');

          if (implicitNamespace)
            namespace = 'implicit.' + namespace;
        }

        /** @cut */ if (requires)
        /** @cut */   arrayFunctions.add(requires, namespace);

        var ns = getNamespace(namespace);
        if (!ns.inited)
        {
          /** @cut */ var savedRequires = requires;
          /** @cut */ requires = [];

          ns.inited = true;
          ns.exports = runScriptInContext({
            path: ns.path,
            exports: ns.exports
          }, filename, content).exports;

          if (ns.exports && ns.exports.constructor === Object)
          {
            if (config.implicitExt)
            {
              /** @cut */ if (config.implicitExt == 'warn')
              /** @cut */ {
              /** @cut */   for (var key in ns.exports)
              /** @cut */     if (key in ns == false && key != 'path')
              /** @cut */     {
              /** @cut */       ns[key] = ns.exports[key];
              /** @cut */       warnPropertyAccess(ns, key, ns.exports[key],
              /** @cut */         'basis.js: Access to implicit namespace property `' + namespace + '.' + key + '`'
              /** @cut */       );
              /** @cut */     }
              /** @cut */ }
              /** @cut */ else
              complete(ns, ns.exports);
            }
          }

          /** @cut */ ns.filename_ = filename;
          /** @cut */ ns.source_ = content;
          /** @cut */ ns.requires_ = requires;

          /** @cut */ requires = savedRequires;
        }

        return ns.exports;
      }, {
        permanent: true
      }),

      '.css': function processCssResourceContent(content, url, cssResource){
        if (!cssResource)
          cssResource = new CssResource(url);

        cssResource.updateCssText(content);

        return cssResource;
      },

      '.json': function processJsonResourceContent(content, url){
        if (typeof content == 'object')
          return content;

        var result;
        try {
          content = String(content);
          result = basis.json.parse(content);
        } catch(e) {
          /** @cut */ consoleMethods.warn('basis.resource: Can\'t parse JSON from ' + url, { url: url, content: content });
        }
        return result || null;
      }
    }
  });


  // ================================
  // script compilation and execution
  //

  function compileFunction(sourceURL, args, body){
    try {
      return new Function(args,
        '"use strict";\n' +
        /** @cut */ (NODE_ENV ? 'var __nodejsRequire = require;\n' : '') +
        body
        /** @cut */ + '\n\n//# sourceURL=' + pathUtils.origin + sourceURL
      );
    } catch(e) {
      /** @cut */ if (document && 'line' in e == false && 'addEventListener' in global)
      /** @cut */ {
      /** @cut */   // Chrome (V8) doesn't provide line number where does error occur,
      /** @cut */   // here is tricky aproach to fetch line number in second 'compilation error' message
      /** @cut */   global.addEventListener('error', function onerror(event){
      /** @cut */     if (event.filename == pathUtils.origin + sourceURL)
      /** @cut */     {
      /** @cut */       global.removeEventListener('error', onerror);
      /** @cut */       consoleMethods.error('Compilation error at ' + event.filename + ':' + event.lineno + ': ' + e);
      /** @cut */       event.preventDefault();
      /** @cut */     }
      /** @cut */   });
      /** @cut */
      /** @cut */   var script = document.createElement('script');
      /** @cut */   script.src = sourceURL;
      /** @cut */   script.async = false;
      /** @cut */   document.head.appendChild(script);
      /** @cut */   document.head.removeChild(script);
      /** @cut */ }

      // don't throw new exception, just output error message and return undefined
      // in this case more chances for other modules continue to work
      consoleMethods.error('Compilation error at ' + sourceURL + ('line' in e ? ':' + (e.line - 1) : '') + ': ' + e);
    }
  }

  var runScriptInContext = function(context, sourceURL, sourceCode){
    var baseURL = pathUtils.dirname(sourceURL) + '/';
    var compiledSourceCode = sourceCode;

    if (!context.exports)
      context.exports = {};

    // compile function if required
    if (typeof compiledSourceCode != 'function')
      compiledSourceCode = compileFunction(sourceURL, ['exports', 'module', 'basis', 'global', '__filename', '__dirname', 'resource', 'require', 'asset'],
        sourceCode
      );

    // run
    if (typeof compiledSourceCode == 'function')
    {
      /** @cut */ compiledSourceCode.displayName = '[module] ' + (filename2namespace[sourceURL] || sourceURL);
      compiledSourceCode.call(
        context.exports,
        context.exports,
        context,
        basis,
        global,
        sourceURL,
        baseURL,
        function(path){
          return getResource(resolveResourceUri(path, baseURL, 'resource(\'{url}\')'));
        },
        function(path, base){
          return requireNamespace(path, base || baseURL);
        },
        function(path){
          return resolveResourceUri(path, baseURL, 'asset(\'{url}\')');
        }
      );
    }

    return context;
  };


  // ============================================
  // Namespace subsystem
  //

  var namespaces = {};
  var namespace2filename = {};
  var filename2namespace = {};
  var nsRootPath = {};

  iterate(config.modules, function(name, module){
    nsRootPath[name] = module.path + '/';
    namespace2filename[name] = module.filename;
    filename2namespace[module.filename] = name;
  });

  (function(map){
    var map = typeof __namespace_map__ != 'undefined' ? __namespace_map__ : null;
    if (map)
    {
      for (var key in map)
      {
        var filename = pathUtils.resolve(key);
        var namespace = map[key];
        filename2namespace[filename] = namespace;
        namespace2filename[namespace] = filename;
      }
    }
  })();


  var Namespace = Class(null, {
    className: 'basis.Namespace',
    init: function(name){
      this.name = name;
      this.exports = {
        path: this.name
      };
    },
    toString: function(){
      return '[basis.namespace ' + this.path + ']';
    },
    extend: function(names){
      extend(this.exports, names);
      return complete(this, names);
    }
  });

  function resolveNSFilename(namespace){
    if (namespace in namespace2filename == false)
    {
      var parts = namespace.split('.');
      var namespaceRoot = parts.shift();
      var filename = resolveResourceUri(namespaceRoot + ':' + parts.join('/') + '.js').replace(/\/\.js$/, '.js');

      namespace2filename[namespace] = filename;
      filename2namespace[filename] = namespace;
    }

    return namespace2filename[namespace];
  }

  function getRootNamespace(name){
    var namespace = namespaces[name];

    if (!namespace)
    {
      namespace = namespaces[name] = new Namespace(name);

      namespace.namespaces_ = {};
      namespace.namespaces_[name] = namespace;

      if (!config.noConflict)
        global[name] = namespace;
    }

    // builder could generate some code here, something like this
    // if (name == 'app' && !app)
    //   return app = namespace;

    return namespace;
  }

 /**
  * Returns namespace by path or creates new one (if namespace isn't exists).
  * @example
  *   var fooBarNamespace = basis.namespace('foo.bar');
  * @name namespace
  * @param {string} path
  * @return {basis.Namespace}
  */
  function getNamespace(path){
    if (hasOwnProperty.call(namespaces, path))
      return namespaces[path];

    path = path.split('.');

    var rootNs = getRootNamespace(path[0]);
    var cursor = rootNs;

    for (var i = 1; i < path.length; i++)
    {
      var name = path[i];
      var nspath = path.slice(0, i + 1).join('.');

      if (!hasOwnProperty.call(rootNs.namespaces_, nspath))
      {
        // create new namespace
        var namespace = new Namespace(nspath);

        // cursor[name] = namespace;
        if (config.implicitExt)
        {
          cursor[name] = namespace;

          /** @cut */ if (config.implicitExt == 'warn')
          /** @cut */ {
          /** @cut */   cursor[name] = namespace;
          /** @cut */   warnPropertyAccess(cursor, name, namespace,
          /** @cut */     'basis.js: Access to implicit namespace `' + nspath + '`'
          /** @cut */   );
          /** @cut */ }
        }

        rootNs.namespaces_[nspath] = namespace;
      }

      cursor = rootNs.namespaces_[nspath];
    }

    namespaces[path.join('.')] = cursor;

    return cursor;
  }


 /**
  * @param {string} filename
  * @param {string} dirname
  * @name require
  */
  var requireNamespace = function(filename, dirname){
    if (!/[^a-z0-9_\.]/i.test(filename) && pathUtils.extname(filename) != '.js')
    {
      // namespace, like 'foo.bar.baz'
      filename = resolveNSFilename(filename);
    }
    else
    {
      // regular filename
      filename = resolveResourceUri(filename, dirname, 'require(\'{url}\')');
    }

    return getResource(filename).fetch();
  };
  /** @cut */ requireNamespace.displayName = 'basis.require';


  function patch(filename, patchFn){
    if (!/[^a-z0-9_\.]/i.test(filename) && pathUtils.extname(filename) != '.js')
    {
      // namespace, like 'foo.bar.baz'
      filename = resolveNSFilename(filename);
    }
    else
    {
      // regular filename
      filename = resolveResourceUri(filename, null, 'basis.patch(\'{url}\')');
    }

    if (!resourcePatch[filename])
      resourcePatch[filename] = [patchFn];
    else
      resourcePatch[filename].push(patchFn);

    // if resource exists and resolved -> apply patch
    var resource = getResource.get(filename);
    if (resource && resource.isResolved())
    {
      /** @cut */ consoleMethods.info('Apply patch for ' + resource.url);
      patchFn(resource.get(), resource.url);
    }
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
      return toString.call(value) === '[object Array]';
    }
  });

  function arrayFrom(object, offset){
    if (object != null)
    {
      var len = object.length;

      if (typeof len == 'undefined' ||
          toString.call(object) == '[object Function]') // Safari 5.1 has a bug, typeof for node collection returns `function`
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
    reduce: function(callback, initialValue){
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

  var arrayFunctions = {
    from: arrayFrom,
    create: createArray,

    // extractors
    flatten: function(this_){
      return this_.concat.apply([], this_);
    },
    repeat: function(this_, count){
      return arrayFunctions.flatten(createArray(parseInt(count, 10) || 0, this_));
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
    *     item = list.search(1, 'a', list.lastSearchIndex + 1);
    *                                   // lastSearchIndex store index of last founded item
    *   }
    *     // result -> [{ a: 1, b: 2 }, { a: 1, b: 4}]
    *
    *   // but if you need all items of array with filtered by condition use Array#filter method instead
    *   var result = list.filter(basis.getter('a == 1'));
    *
    * @param {Array} this_
    * @param {*} value
    * @param {function(object)|string} getter_
    * @param {number=} offset
    * @return {*}
    */
    search: function(this_, value, getter_, offset){
      this_.lastSearchIndex = -1;
      getter_ = getter(getter_ || $self);

      for (var index = parseInt(offset, 10) || 0, len = this_.length; index < len; index++)
        if (getter_(this_[index]) === value)
          return this_[this_.lastSearchIndex = index];
    },

   /**
    * @param {Array} this_
    * @param {*} value
    * @param {function(object)|string} getter_
    * @param {number=} offset
    * @return {*}
    */
    lastSearch: function(this_, value, getter_, offset){
      this_.lastSearchIndex = -1;
      getter_ = getter(getter_ || $self);

      var len = this_.length;
      var index = isNaN(offset) || offset == null ? len : parseInt(offset, 10);

      for (var i = index > len ? len : index; i-- > 0;)
        if (getter_(this_[i]) === value)
          return this_[this_.lastSearchIndex = i];
    },

    // collection for
    add: function(this_, value){
      return this_.indexOf(value) == -1 && !!this_.push(value);
    },
    remove: function(this_, value){
      var index = this_.indexOf(value);
      return index != -1 && !!this_.splice(index, 1);
    },
    has: function(this_, value){
      return this_.indexOf(value) != -1;
    },

    // misc.
    sortAsObject: function(){
      // deprecated in basis.js 1.3.0
      /** @cut */ consoleMethods.warn('basis.array.sortAsObject is deprecated, use basis.array.sort instead');
      return arrayFunctions.sort.apply(this, arguments);
    },
    sort: function(this_, getter_, comparator, desc){
      getter_ = getter(getter_);
      desc = desc ? -1 : 1;

      return this_
        .map(function(item, index){
          return {
            i: index,        // index
            v: getter_(item) // value
          };
        })
        .sort(comparator || function(a, b){             // stability sorting (neccessary only for browsers with no strong sorting, just for sure)
          return desc * ((a.v > b.v) || -(a.v < b.v) || (a.i > b.i ? 1 : -1));
        })
        .map(function(item){
          return this[item.i];
        }, this_);
    }
  };

  // IE 5.5+ & Opera
  // when second argument is omited, method set this parameter equal zero (must be equal array length)
  if (![1, 2].splice(1).length)
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

  var ESCAPE_FOR_REGEXP = /([\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$])/g;
  var FORMAT_REGEXP = /\{([a-z\d_]+)(?::([\.0])(\d+)|:(\?))?\}/gi;
  var stringFormatCache = {};

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

  var stringFunctions = {
   /**
    * @return {*}
    */
    toObject: function(this_, rethrow){
      // try { return eval('0,' + this_) } catch(e) {}
      // safe solution with no eval:
      try {
        return new Function('return 0,' + this_)();
      } catch(e) {
        if (rethrow)
          throw e;
      }
    },
    repeat: function(this_, count){
      return (new Array(parseInt(count, 10) + 1 || 0)).join(this_);
    },
    qw: function(this_){
      var trimmed = this_.trim();
      return trimmed ? trimmed.split(/\s+/) : [];
    },
    forRegExp: function(this_){
      return this_.replace(ESCAPE_FOR_REGEXP, '\\$1');
    },
    format: function(this_, first){
      var data = arrayFrom(arguments, 1);

      if (typeof first == 'object')
        extend(data, first);

      return this_.replace(FORMAT_REGEXP,
        function(m, key, numFormat, num, noNull){
          var value = key in data ? data[key] : (noNull ? '' : m);
          if (numFormat && !isNaN(value))
          {
            value = Number(value);
            return numFormat == '.'
              ? value.toFixed(num)
              : numberFunctions.lead(value, num);
          }
          return value;
        }
      );
    },
    formatter: function(formatString){
      formatString = String(formatString);

      if (hasOwnProperty.call(stringFormatCache, formatString))
        return stringFormatCache[formatString];

      var formatter = function(value){
        return stringFunctions.format(formatString, value);
      };

      // verbose dev
      /** @cut */ var escapsedFormatString = '"' + formatString.replace(/"/g, '\\"') + '"';
      /** @cut */ formatter = new Function('stringFunctions', 'return ' + formatter.toString().replace('formatString', escapsedFormatString))(stringFunctions);
      /** @cut */ formatter.toString = function(){
      /** @cut */   return 'basis.string.formatter(' + escapsedFormatString + ')';
      /** @cut */ };

      stringFormatCache[formatString] = formatter;

      return formatter;
    },
    capitalize: function(this_){
      return this_.charAt(0).toUpperCase() + this_.substr(1).toLowerCase();
    },
    camelize: function(this_){
      return this_.replace(/-(.)/g, function(m, chr){
        return chr.toUpperCase();
      });
    },
    dasherize: function(this_){
      return this_.replace(/[A-Z]/g, function(m){
        return '-' + m.toLowerCase();
      });
    },

    isEmpty: function(value){
      return value == null || String(value) == '';
    },
    isNotEmpty: function(value){
      return value != null && String(value) != '';
    }
  };


  // Fix some methods
  // ----------------
  // IE 5.0-8.0 fix
  // 1. result array without null elements
  // 2. when parenthesis uses, result array with no parenthesis value
  if ('|||'.split(/\|/).length + '|||'.split(/(\|)/).length != 11)
  {
    var nativeStringSplit = String.prototype.split;
    String.prototype.split = function(pattern, count){
      if (!pattern || pattern instanceof RegExp == false || pattern.source == '')
        return nativeStringSplit.apply(this, arguments);

      var result = [];
      var pos = 0;
      var match;

      if (!pattern.global)
        pattern = new RegExp(pattern.source, /\/([mi]*)$/.exec(pattern)[1] + 'g');

      while (match = pattern.exec(this))
      {
        match[0] = this.substring(pos, match.index);
        result.push.apply(result, match);
        pos = pattern.lastIndex;
      }

      result.push(this.substr(pos));

      return result;
    };
  }

  // IE 5.0-8.0 fix
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

  var numberFunctions = {
    fit: function(this_, min, max){
      if (!isNaN(min) && this_ < min)
        return Number(min);
      if (!isNaN(max) && this_ > max)
        return Number(max);
      return this_;
    },
    lead: function(this_, len, leadChar){
      // convert to string and lead first digits by leadChar
      return String(this_).replace(/\d+/, function(number){
        // substract number length from desired length converting len to Number and indicates how much leadChars we need to add
        // here is no isNaN(len) check, because comparation of NaN and a Number is always false
        return (len -= number.length - 1) > 1 ? new Array(len).join(leadChar || 0) + number : number;
      });
    },
    group: function(this_, len, splitter){
      return String(this_).replace(/\d+/, function(number){
        return number.replace(/\d/g, function(m, pos){
          return !pos + (number.length - pos) % (len || 3) ? m : (splitter || ' ') + m;
        });
      });
    },
    format: function(this_, prec, gs, prefix, postfix, comma){
      var res = this_.toFixed(prec);
      if (gs || comma)
        res = res.replace(/(\d+)(\.?)/, function(m, number, c){
          return (gs ? basis.number.group(Number(number), 3, gs) : number) + (c ? comma || c : '');
        });
      if (prefix)
        res = res.replace(/^-?/, '$&' + (prefix || ''));
      return res + (postfix || '');
    }
  };


  // ============================================
  // Date (other extensions & fixes moved to basis.date)
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
      return Number(new Date());
    }
  });


  // ============================================
  // Main part
  //

 /**
  * Root namespace for basis.js framework.
  * @namespace basis
  */

 /**
  * Attach document ready handlers
  * @param {function()} callback
  * @param {*} context Context for handler
  */
  var ready = (function(){
    var eventFired = !document || document.readyState == 'complete';
    var readyHandlers = [];
    var timer;

    function processReadyHandler(){
      var handler;

      // if any timer - reset it
      if (timer)
        timer = clearImmediate(timer);

      // if handlers queue has more than one handler, set emergency timer
      // make sure we continue to process the queue on exception
      // helps to avoid try/catch
      if (readyHandlers.length > 1)
        timer = setImmediate(processReadyHandler);

      // process handler queue
      while (handler = readyHandlers.shift())
        handler[0].call(handler[1]);

      // remove emergency timer as all handlers are process
      timer = clearImmediate(timer);

      // process asap queue
      asap.process();
    }

    function fireHandlers(e){
      if (!eventFired++)
        processReadyHandler();
    }

    // the DOM ready check for Internet Explorer
    function doScrollCheck(){
      try {
        // use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        document.documentElement.doScroll('left');
        fireHandlers();
      } catch(e) {
        setTimeout(doScrollCheck, 1);
      }
    }

    if (!eventFired)
    {
      if (document.addEventListener)
      {
        // use the real event for browsers that support it (all modern browsers support it)
        document.addEventListener('DOMContentLoaded', fireHandlers, false);

        // a fallback to window.onload, that will always work
        global.addEventListener('load', fireHandlers, false);
      }
      else
      {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent('onreadystatechange', fireHandlers);

        // a fallback to window.onload, that will always work
        global.attachEvent('onload', fireHandlers);

        // if not a frame continually check to see if the document is ready
        try {
          if (!global.frameElement && document.documentElement.doScroll)
            doScrollCheck();
        } catch(e) {}
      }
    }

    // return attach function
    return function(callback, context){
      // if no ready handlers yet and no event fired,
      // set timer to run handlers async
      if (!readyHandlers.length && eventFired && !timer)
        timer = setImmediate(processReadyHandler);

      // add handler to queue
      readyHandlers.push([callback, context]);
    };
  })();

 /**
  * Add handler on sandbox teardown.
  * @param {function()} callback
  * @param {*=} context
  */
  var teardown = (function(callback, context){
    if ('addEventListener' in global)
      return function(callback, context){
        global.addEventListener('unload', function(event){
          callback.call(context || null, event || global.event);
        }, false);
      };

    if ('attachEvent' in global)
      return function(callback, context){
        global.attachEvent('onunload', function(event){
          callback.call(context || null, event || global.event);
        });
      };

    return $undef;
  })();


 /**
  * Document interface for safe add/remove nodes to/from head and body.
  */
  var documentInterface = (function(){
    var timer;
    var reference = {};
    var callbacks = {
      head: [],
      body: []
    };

    function getParent(name){
      if (document && !reference[name])
      {
        reference[name] = document[name] || document.getElementsByTagName(name)[0];

        if (reference[name])
        {
          var items = callbacks[name];
          delete callbacks[name];
          for (var i = 0, cb; cb = items[i]; i++)
            cb[0].call(cb[1], reference[name]);
        }
      }

      return reference[name];
    }

    function add(){
      var name = this[0];
      var node = this[1];
      var ref = this[2];

      remove(node);

      var parent = getParent(name);
      if (parent)
      {
        if (ref === true)
          ref = parent.firstChild;

        if (!ref || ref.parentNode !== parent)
          ref = null;

        parent.insertBefore(node, ref);
      }
      else
        callbacks[name].push([add, [name, node, ref]]);
    }

    function docReady(name, fn, context){
      if (callbacks[name])
        callbacks[name].push([fn, context]);
      else
        fn.call(context, reference[name]);
    }

    function remove(node){
      for (var key in callbacks)
      {
        var entry = arrayFunctions.search(callbacks[key], node, function(item){
          return item[1] && item[1][1];
        });

        if (entry)
          arrayFunctions.remove(callbacks[key], entry);
      }

      if (node && node.parentNode && node.parentNode.nodeType == 1)
        node.parentNode.removeChild(node);
    }

    function checkParents(){
      if (timer && getParent('head') && getParent('body'))
        timer = clearInterval(timer);
    }

    if (document && (!getParent('head') || !getParent('body')))
    {
      timer = setInterval(checkParents, 5);
      ready(checkParents);
    }

    return {
      head: {
        ready: function(fn, context){
          docReady('head', fn, context);
        },
        add: function(node, ref){
          add.call(['head', node, ref]);
        }
      },
      body: {
        ready: function(fn, context){
          docReady('body', fn, context);
        },
        add: function(node, ref){
          add.call(['body', node, ref]);
        }
      },
      remove: remove
    };
  })();


 /**
  * @namespace basis
  */

 /**
  * Singleton object to destroy registred via {basis.cleaner.add} method objects on page unload event.
  */
  var cleaner = (function(){
    var objects = [];

    function destroy(log){
      /** @cut */ var logDestroy = log && typeof log == 'boolean';
      result.globalDestroy = true;
      result.add = $undef;
      result.remove = $undef;

      var object;
      while (object = objects.pop())
      {
        if (typeof object.destroy == 'function')
        {
          try {
            /** @cut */ if (logDestroy) consoleMethods.log('destroy', '[' + String(object.className) + ']', object);
            object.destroy();
          } catch(e) {
            /** @cut */ consoleMethods.warn(String(object), e);
          }
        }
        else
        {
          for (var prop in object)
            object[prop] = null;
        }
      }
      objects = [];
    }

    // returns interfaces that does nothing if unload is not supported
    if (teardown === $undef)
      return {
        add: $undef,
        remove: $undef
      };

    teardown(destroy);

    var result = {
      add: function(object){
        if (object != null)
          objects.push(object);
      },
      remove: function(object){
        arrayFunctions.remove(objects, object);
      }
    };

    // for debug purposes
    /** @cut */ result.destroy_ = destroy;
    /** @cut */ result.objects_ = objects;

    return result;
  })();


  //
  // CSS resource
  //

  var CssResource = (function(){
    // Test for appendChild bugs (old IE browsers has a problem with append textNode into <style>)
    var STYLE_APPEND_BUGGY = (function(){
      try {
        return !document.createElement('style').appendChild(
          document.createTextNode('')
        );
      } catch(e) {
        return true;
      }
    })();


   /**
    * Helper functions for path resolving
    */
    var baseEl = document && document.createElement('base');

    function setBase(baseURI){
      // Opera and IE doesn't resolve pathes correctly, if base href is not an absolute path
      // convert path to absolute value
      baseEl.setAttribute('href', baseURI);

      // if more than one <base> elements in document, only first has effect
      // put our <base> resolver at the begining of <head>
      documentInterface.head.add(baseEl, true);
    }

    function restoreBase(){
      // Opera left document base as <base> element specified,
      // even if this element is removed from document
      // so we set current location for base
      baseEl.setAttribute('href', location.href);

      documentInterface.remove(baseEl);
    }

    // inject style into document
    function injectStyleToHead(){
      // set base before <style> element creating, because IE9+ set baseURI
      // for <style> element on element creation
      setBase(this.baseURI);

      // create <style> element for first time
      if (!this.element)
      {
        this.element = document.createElement('style');

        if (!STYLE_APPEND_BUGGY)
          this.element.appendChild(document.createTextNode(''));

        /** @cut */ this.element.setAttribute('src', this.url);
      }

      // add element to document
      documentInterface.head.add(this.element);

      // set css text after node inserted into document,
      // IE8 and lower crash otherwise (this.element.styleSheet is not defined)
      this.syncCssText();

      restoreBase();
    }


   /**
    * @class
    */
    return Class(null, {
      className: 'basis.CssResource',

      inUse: 0,

      url: '',
      baseURI: '',
      cssText: undefined,

      element: null,

      init: function(url){
        this.url = url;
        this.baseURI = pathUtils.dirname(url) + '/';
      },

      updateCssText: function(cssText){
        if (this.cssText != cssText)
        {
          this.cssText = cssText;

          if (this.inUse && this.element)
          {
            setBase(this.baseURI);
            this.syncCssText();
            restoreBase();
          }
        }
      },

      syncCssText: STYLE_APPEND_BUGGY
        // old IE
        ? function(){
            this.element.styleSheet.cssText = this.cssText;
          }
        // W3C browsers
        : function(){
            var cssText = this.cssText;

            /** @cut add source url for debug */
            /** @cut */ cssText += '\n/*# sourceURL=' + pathUtils.origin + this.url + ' */';

            this.element.firstChild.nodeValue = cssText;
          },

      startUse: function(){
        if (!this.inUse)
          documentInterface.head.ready(injectStyleToHead, this);

        this.inUse += 1;
      },

      stopUse: function(){
        if (this.inUse)
        {
          // decrease usage count
          this.inUse -= 1;

          // remove element if nobody use it
          if (!this.inUse && this.element)
            documentInterface.remove(this.element);
        }
      },

      destroy: function(){
        if (this.element)
          documentInterface.remove(this.element);

        this.element = null;
        this.cssText = null;
      }
    });
  })();


  //
  // export names
  //

  // create and extend basis namespace
  var basis = getNamespace('basis').extend({
    /** @cut */ filename_: basisFilename,
    /** @cut */ processConfig: processConfig,

    // properties and settings
    version: VERSION,

    // config and environment
    NODE_ENV: NODE_ENV,
    config: config,
    createSandbox: function(config){
      return createBasisInstance(
        global,
        basisFilename,
        complete({ noConflict: true }, config)
      );
    },
    dev: (new Namespace('basis.dev'))
      .extend(consoleMethods)
      .extend({
        warnPropertyAccess: warnPropertyAccess
      }),

    // modularity
    resolveNSFilename: resolveNSFilename,
    patch: patch,
    namespace: getNamespace,
    require: requireNamespace,
    resource: getResource,
    asset: function(path){
      return resolveResourceUri(path, null, 'basis.asset(\'{url}\')');
    },

    // timers
    setImmediate: setImmediate,
    clearImmediate: clearImmediate,
    nextTick: function(){
      setImmediate.apply(null, arguments);
    },
    asap: asap,

    // classes
    Class: Class,
    Token: Token,
    DeferredToken: DeferredToken,

    // life cycle functions
    ready: ready,
    teardown: teardown,
    cleaner: cleaner,

    // util functions
    genUID: genUID,
    getter: getter,
    console: consoleMethods,
    path: pathUtils,
    doc: documentInterface,

    // types utils
    object: {
      extend: extend,
      complete: complete,
      keys: keys,
      values: values,
      slice: slice,
      splice: splice,
      merge: merge,
      iterate: iterate
    },
    fn: {
      // test functions
      $undefined: $undefined,
      $defined: $defined,
      $isNull: $isNull,
      $isNotNull: $isNotNull,
      $isSame: $isSame,
      $isNotSame: $isNotSame,

      // gag functions
      $self: $self,
      $const: $const,
      $false: $false,
      $true: $true,
      $null: $null,
      $undef: $undef,

      // getters and modificators
      getter: getter,
      nullGetter: nullGetter,
      wrapper: wrapper,

      // callbacks
      lazyInit: lazyInit,
      lazyInitAndRun: lazyInitAndRun,
      runOnce: runOnce,
      publicCallback: publicCallback
    },
    array: extend(arrayFrom, arrayFunctions),
    string: stringFunctions,
    number: numberFunctions,
    bool: {
      invert: function(value){
        return !value;
      }
    },
    json: {
      parse: typeof JSON != 'undefined'
        ? JSON.parse
        : function(str){
            return stringFunctions.toObject(str, true);
          }
    }
  });


  //
  // auto load section
  //

  if (config.autoload && !NODE_ENV)
    config.autoload.forEach(function(name){
      requireNamespace(name);
    });


  //
  // extend exports when node.js environment
  //

  if (NODE_ENV && exports)
    exports.basis = basis;


  //
  // return basis instance (needs for createSandbox)
  //

  return basis;

})(this);
