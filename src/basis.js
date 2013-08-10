/*
  Basis javascript library
  http://github.com/basisjs/basisjs
 
  @license
  Dual licensed under the MIT or GPL Version 2 licenses.
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
 * - console method wrappers (basis.dev)
 * - basis.path (path utils)
 * - process config (basis.config)
 * - basis.namespace
 * - basis.Class namespace (provides inheritance)
 * - basis.Token
 * - basis.resource
 * - basis.require
 * - buildin class extensions and fixes
 *   o Function
 *   o Array
 *   o String
 *   o Number
 *   o Date (more extensions for Date in src/basis/date.js)
 * - basis.ready
 * - basis.cleaner
 */

;(function(global){ // global is current context (`window` in browser and `global` on node.js)
  'use strict';

  var document = global.document;
  var prefetchedResources = global.__resources__;
  var Object_toString = Object.prototype.toString;


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
  * Merge several objects into new object and returns it.
  * @param {...*} args
  * @return {object}
  */ 
  function merge(/* obj1 .. objN */){
    return arrayFrom(arguments).reduce(extend, {});
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
    var simplePath = /^[a-z$_][a-z$_0-9]*(\.[a-z$_][a-z$_0-9]*)*$/i;

    var getterMap = [];
    var pathCache = {};
    var modCache = {};

    function buildFunction(path){
      if (simplePath.test(path))
      {
        var parts = path.split('.');
        var foo = parts[0];
        var bar = parts[1];
        var baz = parts[2];
        var fn;

        switch (parts.length)
        {
          case 1:
            fn = function(object){
              return object != null ? object[foo] : object;
            };
            break;
          case 2:
            fn = function(object){
              return object != null ? object[foo][bar] : object;
            };
            break;
          case 3:
            fn = function(object){
              return object != null ? object[foo][bar][baz] : object;
            };
            break;
          default:
            fn = function(object){
              if (object != null)
              {
                object = object[foo][bar][baz];
                for (var i = 3, key; key = parts[i]; i++)
                  object = object[key];
              }

              return object;
            };
        }

        // verbose function code in dev mode
        /** @cut */ fn = Function('parts', 'return ' + fn.toString()
        /** @cut */   .replace(/(foo|bar|baz)/g, function(m, w){
        /** @cut */      return '"' + parts[w == 'foo' ? 0 : (w == 'bar' ? 1 : 2)] + '"';
        /** @cut */    })
        /** @cut */   .replace(/\[\"([^"]+)\"\]/g, '.$1'))(parts);
        
        return fn;
      }

      // for cases when path isn't a property name chain
      return new Function('object', 'return object != null ? object.' + path + ' : object');
    }

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
          func = buildFunction(path);
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
          result = function(object){
            return modificator.format(func(object));
          };
        break;

        case 'function':
          if (!modId)
          {
            // mark function with modificator id
            modId = modType + modificatorSeed++;
            modificator.basisModId_ = modId;
          }

          result = function(object){
            return modificator(func(object));
          };
        break;

        default: //case 'object':
          result = function(object){
            return modificator[func(object)];
          };
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

  var nullGetter = extend(function(){}, {
    __extend__: getter
  });

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
            // ie8 and lower, it's also more safe when Function.prototype.bind defined
            // by other libraries (like es5-shim)
          : function(){
              Function.prototype.apply.call(console[methodName], console, arguments)
            };
      });

    return methods;
  })();


  //
  // Support for setImmediate/clearImmediate
  //

  var setImmediate = global.setImmediate || global.msSetImmediate;
  var clearImmediate = global.clearImmediate || global.msSetImmediate;

  // bind context for setImmediate/clearImmediate, IE10 throw exception if context isn't global
  if (setImmediate)
    setImmediate = setImmediate.bind(global);

  if (clearImmediate)
    clearImmediate = clearImmediate.bind(global);

  //
  // emulate setImmediate/clearImmediate
  // Inspired on Domenic Denicola's solution https://github.com/NobleJS/setImmediate
  //
  if (!setImmediate)
    (function(){
      var MESSAGE_NAME = 'basisjs.setImmediate';
      var runTask = (function(){
        var taskById = {};
        var taskId = 1;

        // emulate setImmediate
        setImmediate = function(){
          taskById[++taskId] = {
            fn: arguments[0],
            args: arrayFrom(arguments, 1)
          };

          addToQueue(taskId);

          return taskId;
        };

        // emulate clearImmediate
        clearImmediate = function(id){
          delete taskById[id];
        };

        //
        // return result function for task run
        //
        return function(id){
          var task = taskById[id];

          if (task)
          {
            try {
              if (typeof task.fn == 'function')
                task.fn.apply(undefined, task.args);
              else
              {
                (global.execScript || function(fn){
                  global['eval'].call(global, fn);
                })(String(task.fn));
              }
            } finally {
              delete taskById[id];
            }
          }
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
      if (global.process && typeof process.nextTick == 'function')
      {
        // use next tick on node.js
        addToQueue = function(taskId){
          process.nextTick(function(){
            runTask(taskId);
          });
        }
      }
      else
      {
        if (global.MessageChannel)
        {
          addToQueue = function(taskId){
            var channel = new global.MessageChannel();
            channel.port1.onmessage = function(){
              runTask(taskId);
            };
            channel.port2.postMessage(''); // broken in Opera if no value
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
            var handleMessage = function(event){
              if (event && event.source == global)
              {
                var taskId = String(event.data).split(MESSAGE_NAME)[1];

                if (taskId)
                  runTask(taskId);
              }
            };

            if (global.addEventListener)
              global.addEventListener('message', handleMessage, true);
            else
              global.attachEvent('onmessage', handleMessage);

            // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
            // invoking our onGlobalMessage listener above.
            addToQueue = function(taskId){
              global.postMessage(MESSAGE_NAME + taskId, '*');
            };
          }
          else
          {
            if (document && 'onreadystatechange' in createScript())
            {
              // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
              // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called
              addToQueue = function(taskId){
                var scriptEl = createScript();
                scriptEl.onreadystatechange = function(){
                  runTask(taskId);

                  scriptEl.onreadystatechange = null;
                  scriptEl.parentNode.removeChild(scriptEl);
                  scriptEl = null;
                };
                document.documentElement.appendChild(scriptEl);
              };
            }
          }
        }
      }
    })();


  // ============================================
  // path utils
  //

  var NODE_ENV = typeof process == 'object' && Object_toString.call(process) == '[object process]';

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
    var origin = '';
    var baseURI;
    var utils;

    if (NODE_ENV)
    {
      utils = slice(require('path'), [
        'normalize',
        'dirname',
        'extname',
        'basename',
        'resolve',
        'relative'
      ]);

      baseURI = utils.resolve('.') + '/';
    }
    else
    {
      var ABSOLUTE_RX = /^([^\/]+:|\/)/;
      var ORIGIN_RX = /^([a-zA-Z0-9\-]+:)?\/\/[^\/]+/;
      var SEARCH_HASH_RX = /[\?#].*$/;

      utils = {
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
          // use link element as path resolver
          var result = [];
          var parts = (path || '')
                .replace(ORIGIN_RX, '')         // but cut off origin
                .replace(SEARCH_HASH_RX, '')    // cut off query search and hash
                .split('/');                    // split by `/`

          // process path parts
          for (var i = 0; i < parts.length; i++)
          {
            if (parts[i] == '..')
              result.pop();
            else
            {
              if ((parts[i] || !i) && parts[i] != '.')
                result.push(parts[i]);
            }
          }

          return result.join('/');
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
          return utils.normalize(path).replace(/\/[^\/]*$/, '');
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
          var ext = utils.normalize(path).match(/\.[^\\\/]*$/);
          return ext ? ext[0] : '';
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
        * @example
        *   basis.path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
        *   // returns '../../impl/bbb'
        *
        * @param {string} from
        * @param {string=} to
        * @return {string}
        */
        relative: function(from, to){
          if (typeof to != 'string')
          {
            to = from;
            from = baseURI;
          }

          var abs = utils.normalize(to).split(/\//);
          var loc = utils.normalize(from).split(/\//);
          var i = 0;

          while (abs[i] == loc[i] && typeof loc[i] == 'string')
            i++;

          var prefix = '';
          for (var j = loc.length - i; j > 0; j--)
            prefix += '../';

          return prefix + abs.slice(i).join('/');
        }
      };

      baseURI = location.pathname.replace(/[^\/]+$/, '');
      origin = location.protocol + '//' + location.host;
    }

    utils.baseURI = baseURI;
    utils.origin = origin;

    return utils;
  })();


  // =============================================
  // apply config
  //

 /**
  * @namespace basis
  */

  var basisFilename = '';

 /**
  * basis.js options read from script's `basis-config` or `data-basis-config` attribute.
  *
  * Special processing options:
  * - autoload: namespace that must be loaded right after core loaded
  * - path: dictionary of paths for root namespaces
  * - extClass: extend buildin classes (Object, Array, String, )
  *
  * Other options copy into basis.config as is.
  */
  var config = (function(){
    var basisBaseURI = '';
    var config = {
      extClass: true
    };

    if (NODE_ENV)
    {
      // node.js env
      basisFilename = __filename;
      basisBaseURI = __dirname;
    }
    else
    {
      // browser env
      var scripts = document.getElementsByTagName('script');
      for (var i = 0, scriptEl; scriptEl = scripts[i]; i++)
      {
        var configAttrNode = scriptEl.getAttributeNode('data-basis-config') || scriptEl.getAttributeNode('basis-config');
        if (configAttrNode)
        {
          try {
            extend(config, Function('return{' + configAttrNode.nodeValue + '}')() || {});
          } catch (e) {
            ;;;consoleMethods.error('basis.js config parse fault: ' + e);
          }

          basisFilename = pathUtils.normalize(scriptEl.src)
          basisBaseURI = pathUtils.dirname(basisFilename);

          break;
        }
      }
    }

    config.path = extend(config.path || {}, {
      basis: basisBaseURI
    });
      
    var autoload = config.autoload;
    config.autoload = false;
    if (autoload)
    {
      var m = autoload.match(/^((?:[^\/]*\/)*)([a-z$_][a-z0-9$_]*)((?:\.[a-z$_][a-z0-9$_]*)*)$/i);
      if (m)
      {
        if (m[2] != 'basis')
        {
          config.autoload = m[2] + (m[3] || '');
          if (m[1])
            config.path[m[2]] = m[1].replace(/\/$/, '');
        }
        else
        {
          ;;;consoleMethods.warn('value for autoload can\'t be `basis` (setting ignored): ' + autoload);
        }
      }
      else
      {
        ;;;consoleMethods.warn('wrong autoload value (setting ignored): ' + autoload);
      }
    }

    for (var key in config.path)
      config.path[key] = pathUtils.resolve(config.path[key]) + '/';

    return config;
  })();


  // ============================================
  // Namespace subsystem
  //

  var namespaces = {};

 /**
  * Returns namespace by path or creates new one (if namespace isn't exists).
  * @example
  *   var fooBarNamespace = basis.namespace('foo.bar');
  * @name namespace
  * @param {string} path
  * @param {function()} wrapFunction Deprecated.
  * @return {basis.Namespace}
  */
  var getNamespace = function(path, wrapFunction){
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
          function namespace_(){
            if (wrapFunction)
              return wrapFunction.apply(this, arguments);
          }

          var wrapFunction = typeof wrapFn == 'function' ? wrapFn : null;
          var pathFn = function(name){
            return path + (name ? '.' + name : '');
          };
          pathFn.toString = $const(path);

          return extend(namespace_, {
            path: pathFn,
            exports: {
              path: pathFn
            },
            toString: $const('[basis.namespace ' + path + ']'),
            extend: function(names){
              extend(this.exports, names);
              return complete(this, names);
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

   /**
    * @func
    * dev mode only
    */
    function dev_verboseNameWrap(name, args, fn){
      return new Function(keys(args), 'return {"' + name + '": ' + fn + '\n}["' + name + '"]').apply(null, values(args));
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
        var classId = classSeed++;        

        if (typeof SuperClass != 'function')
          SuperClass = BaseClass;

        /** @cut */ var className = '';

        /** @cut */ for (var i = 1, extension; extension = arguments[i]; i++)
        /** @cut */   if (typeof extension != 'function' && extension.className)
        /** @cut */     className = extension.className;

        /** @cut */ if (!className)
        /** @cut */   className = SuperClass.className + '._Class' + classId;
        /** @cut */// consoleMethods.warn('Class has no name');

        // temp class constructor with no init call
        var NewClassProto = function(){};

        // verbose name in dev
        /** @cut */ NewClassProto = dev_verboseNameWrap(className, {}, NewClassProto);

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
          newClassProps.extend(extension);


        /** @cut */if (newProto.init != NULL_FUNCTION && !/^function[^(]*\(\)/.test(newProto.init) && newClassProps.extendConstructor_) consoleMethods.warn('probably wrong extendConstructor_ value for ' + newClassProps.className);

        // new class constructor
        var newClass = newClassProps.extendConstructor_
          // constructor with instance extension
          ? function(extend){
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
            };

        // verbose name in dev
        // NOTE: this code makes Chrome and Firefox show class name in console
        ;;;newClass = dev_verboseNameWrap(className, { seed: seed }, newClass);

        // add constructor property to prototype
        newProto.constructor = newClass;

        for (var key in newProto)
          if (newProto[key] === SELF)
            newProto[key] = newClass;
          //else
          //  newProto[key] = newProto[key];

        // extend constructor with properties
        extend(newClass, newClassProps);

        return newClass;
      },

     /**
      * Extend class prototype
      * @param {Object} source If source has a prototype, it will be used to extend current prototype.
      * @return {function()} Returns `this`.
      */
      extend: function(source){
        var proto = this.prototype;

        if (typeof source == 'function' && !isClass(source))
          source = source(this.superClass_.prototype);

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
        if (TOSTRING_BUG && source[key = 'toString'] !== Object_toString)
          proto[key] = source[key];

        return this;
      }
    });


   /**
    * @func
    */
    var customExtendProperty = function(extension, func, devName){
      return {
        __extend__: function(extension){
          if (!extension)
            return extension;

          if (extension && extension.__extend__)
            return extension;

          var Base = function(){};
          /** @cut verbose name in dev */Base = dev_verboseNameWrap(devName || 'customExtendProperty', {}, Base);
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
      return customExtendProperty(extension, extend, 'extensibleProperty');
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
      }, 'nestedExtendProperty');
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

          // verbose name in dev
          ;;;var Cls = dev_verboseNameWrap('oneFunctionProperty', {}, function(){}); result = new Cls; result.__extend__ = create;

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
    attach: function(fn, context){
      /** @cut */ var cursor = this;
      /** @cut */ while (cursor = cursor.handler)
      /** @cut */  if (cursor.fn === fn && cursor.context === context)
      /** @cut */    consoleMethods.warn('basis.Token#attach: duplicate fn & context pair');

      this.handler = {
        fn: fn,
        context: context,
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
        token = this.deferredToken = new basis.DeferredToken(this.value);
        this.attach(token.set, token);
      }
   
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
    }
  })();
   
 /**
  * @class
  */ 
  var DeferredToken = Token.subclass({
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

  var resourceCache = {};
  var resourceRequestCache = {};
  /** @cut */ var resourceResolvingStack = [];

  // apply prefetched resources to cache
  (function(){
    if (prefetchedResources)
      for (var key in prefetchedResources)
        resourceRequestCache[pathUtils.resolve(key)] = prefetchedResources[key];

    prefetchedResources = null; // reset prefetched to reduce memory leaks
  })();

  var getResourceContent = function(url, ignoreCache){
    if (ignoreCache || !resourceRequestCache.hasOwnProperty(url))
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
          ;;;consoleMethods.error('basis.resource: Unable to load ' + url + ' (status code ' + req.status + ')');
        }
      }
      else
      {
        try
        {
          resourceContent = require('fs').readFileSync(url, 'utf-8');
        }
        catch (e)
        {
          ;;;consoleMethods.error('basis.resource: Unable to load ' + url, e);
        }
      }

      resourceRequestCache[url] = resourceContent;
    }

    return resourceRequestCache[url];
  };

 /**
  * @name resource
  */
  var getResource = function(resourceUrl){
    resourceUrl = pathUtils.resolve(resourceUrl);

    if (!resourceCache[resourceUrl])
    {
      var contentWrapper = getResource.extensions[pathUtils.extname(resourceUrl)];
      var resolved = false;
      var wrapped = false;
      var content;

      var resource = function(){
        // if resource resolved, just return content
        if (resolved)
          return content;

        // fetch url content
        var urlContent = getResourceContent(resourceUrl);

        /** @cut    recursion warning */
        /** @cut */ var idx = resourceResolvingStack.indexOf(resourceUrl);
        /** @cut */ if (idx != -1)
        /** @cut */   basis.dev.warn('basis.resource recursion:', resourceResolvingStack.slice(idx).concat(resourceUrl).map(pathUtils.relative, pathUtils).join(' -> '));
        /** @cut */ resourceResolvingStack.push(resourceUrl);

        // if resource type has wrapper - wrap it, or use url content as result
        if (contentWrapper)
        {
          if (!wrapped)
          {
            wrapped = true;
            content = contentWrapper(urlContent, resourceUrl);
          }
        }
        else
        {
          content = urlContent;
        }

        // mark as resolved and apply binded functions
        resolved = true;
        resource.apply();

        /** @cut    recursion warning */
        /** @cut */ resourceResolvingStack.pop();

        return content;
      };

      extend(resource, extend(new Token(), {
        url: resourceUrl,
        fetch: function(){
          return resource();
        },
        toString: function(){
          return '[basis.resource ' + resourceUrl + ']';
        },
        update: function(newContent){
          newContent = String(newContent);

          if (!resolved || newContent != resourceRequestCache[resourceUrl])
          {
            resourceRequestCache[resourceUrl] = newContent;

            if (contentWrapper)
            {
              // don't wrap content if it isn't wrapped yet or wrapped but not updatable
              if (!wrapped || !contentWrapper.updatable)
                return;

              content = contentWrapper(newContent, resourceUrl);
            }
            else
              content = newContent;

            resolved = true;
            resource.apply();
          }
        },
        reload: function(){
          var oldContent = resourceRequestCache[resourceUrl];
          var newContent = getResourceContent(resourceUrl, true);

          if (newContent != oldContent)
          {
            resolved = false;
            resource.update(newContent);
          }
        },
        get: function(source){
          return source ? getResourceContent(resourceUrl) : resource();
        },
        ready: function(fn, context){
          if (resolved)
          {
            fn.call(context, resource());

            if (contentWrapper && !contentWrapper.updatable)
              return;
          }

          resource.attach(fn, context);

          return resource;
        }
      }));

      // cache result
      resourceCache[resourceUrl] = resource;
    }

    return resourceCache[resourceUrl];
  };

  extend(getResource, {
    getFiles: function(){
      var result = [];

      for (var url in resourceCache)
        result.push(pathUtils.relative(url));
      
      return result;
    },
    getSource: function(resourceUrl){
      return getResourceContent(pathUtils.resolve(resourceUrl));
    },
    exists: function(resourceUrl){
      return !!resourceCache.hasOwnProperty(pathUtils.resolve(resourceUrl));
    },
    extensions: {
      '.js': function(resource, url){
        return runScriptInContext({ exports: {} }, url, resource).exports;
      },
      '.json': extend(function(resource, url){
        if (typeof resource == 'object')
          return resource;

        var result;
        try {
          result = JSON.parse(String(resource));
        } catch(e) {
          ;;;consoleMethods.warn('basis.resource: Can\'t parse JSON from ' + url, { url: url, source: String(resource) });
        }
        return result || null;
      }, {
        updatable: true
      })
    }
  });


  var runScriptInContext = function(context, sourceURL, sourceCode){
    var baseURL = pathUtils.dirname(sourceURL) + '/';
    var compiledSourceCode = sourceCode;

    if (!context.exports)
      context.exports = {};

    // compile context function
    if (typeof compiledSourceCode != 'function')
      try {
        compiledSourceCode = new Function('exports, module, basis, global, __filename, __dirname, resource',
          '//@ sourceURL=' + pathUtils.origin + sourceURL + '\n' +
          '//# sourceURL=' + pathUtils.origin + sourceURL + '\n' +
          '"use strict";\n\n' +
          sourceCode
        );
      } catch(e) {
        /** @cut */ if ('line' in e == false && 'addEventListener' in window)
        /** @cut */ {
        /** @cut */   // Chrome (V8) doesn't provide line number where does error occur,
        /** @cut */   // here is tricky aproach to fetch line number in second 'compilation error' message
        /** @cut */   window.addEventListener('error', function onerror(event){
        /** @cut */     if (event.filename == pathUtils.origin + sourceURL)
        /** @cut */     {
        /** @cut */       window.removeEventListener('error', onerror);
        /** @cut */       console.error('Compilation error at ' + event.filename + ':' + event.lineno + ': ' + e);
        /** @cut */       event.preventDefault()
        /** @cut */     }
        /** @cut */   })
        /** @cut */ 
        /** @cut */   var script = document.createElement('script');
        /** @cut */   script.src = sourceURL;
        /** @cut */   script.async = false;
        /** @cut */   document.head.appendChild(script);
        /** @cut */   document.head.removeChild(script);
        /** @cut */ }

        // don't throw new exception, just output error message and return undefined
        // in this case more chances for other modules continue to work
        basis.dev.error('Compilation error at ' + sourceURL + ('line' in e ? ':' + (e.line - 4) : '') + ': ' + e);
        return context;
      }

    // run
    compiledSourceCode.call(
      context.exports,
      context.exports,
      context,
      basis,
      global,
      sourceURL,
      baseURL,
      function(relativePath){
        return getResource(baseURL + relativePath);
      }
    );

    return context;
  };


 /**
  * @param {string} namespace
  * @name require
  */
  var requireNamespace = (function(){
    if (NODE_ENV)
    {
      var requirePath = pathUtils.dirname(module.filename) + '/';
      var moduleProto = module.constructor.prototype;
      return function(path){
        var _compile = moduleProto._compile;
        var namespace = getNamespace(path);

        // patch node.js module._compile
        moduleProto._compile = function(content, filename){
          this.basis = basis;
          content = 
            'var basis = module.basis;\n' +
            'var resource = function(filename){ return basis.require(__dirname + "/" + filename) };\n' +
            content;
          _compile.call(extend(this, namespace), content, filename);
        };

        var exports = require(requirePath + path.replace(/\./g, '/'));
        namespace.exports = exports;
        complete(namespace, exports);

        // restore node.js module._compile
        moduleProto._compile = _compile;

        return exports;
      };
    }
    else
    {
      var nsRootPath = config.path;
      var requested = {};
      /** @cut */ var requires;

      return function(namespace){
        if (/[^a-z0-9_\.]/i.test(namespace))
          throw 'Namespace `' + namespace + '` contains wrong chars.';

        /** @cut */ if (requires)
        /** @cut */   requires.push(namespace);

        var filename = namespace.replace(/\./g, '/') + '.js';
        var namespaceRoot = namespace.split('.')[0];

        if (namespaceRoot == namespace)
          nsRootPath[namespaceRoot] = nsRootPath[namespace] || pathUtils.baseURI;

        if (!namespaces[namespace])
        {
          var requirePath = nsRootPath[namespaceRoot];

          if (!/^\//.test(requirePath))
            throw 'Path `' + namespace + '` (' + requirePath + ') can\'t be resolved';

          if (!requested[namespace])
            requested[namespace] = true;
          else
            throw 'Recursive require for ' + namespace;

          var requestUrl = requirePath + filename;


          var ns = getNamespace(namespace);
          var sourceCode = getResourceContent(requestUrl);

          /** @cut */ var savedRequires = requires;
          /** @cut */ requires = [];

          runScriptInContext(ns, requestUrl, sourceCode);
          complete(ns, ns.exports);

          /** @cut */ ns.filename_ = requestUrl;
          /** @cut */ ns.source_ = sourceCode;
          /** @cut */ ns.requires_ = requires;

          /** @cut */ requires = savedRequires;
        }
      };
    }
  })();


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
      return Object_toString.call(value) === '[object Array]';
    }
  });

  function arrayFrom(object, offset){
    if (object != null)
    {
      var len = object.length;

                                       // Safari 5.1 has a bug, typeof for node collection returns `function`
      if (typeof len == 'undefined' || Object_toString.call(object) == '[object Function]')
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
    * @param {function(object)|string=} getter_
    * @param {boolean=} desc Must be true for reverse sorted arrays.
    * @param {boolean=} strong If true - returns result only if value found.
    * @param {number=} left Min left index. If omit it equals to zero.
    * @param {number=} right Max right index. If omit it equals to array length.
    * @return {number}
    */
    binarySearchPos: function(value, getter_, desc, strong, left, right){
      if (!this.length)  // empty array check
        return strong ? -1 : 0;

      getter_ = getter(getter_ || $self);
      desc = !!desc;

      var pos, compareValue;
      var l = isNaN(left) ? 0 : left;
      var r = isNaN(right) ? this.length - 1 : right;

      do
      {
        pos = (l + r) >> 1;
        compareValue = getter_(this[pos]);
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
    sortAsObject: function(getter_, comparator, desc){
      getter_ = getter(getter_);
      desc = desc ? -1 : 1;

      return this
        .map(function(item, index){
               return {
                 i: index,       // index
                 v: getter_(item) // value
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

  var STRING_QUOTE_PAIRS = { '<': '>', '[': ']', '(': ')', '{': '}', '\xAB': '\xBB' };
  var ESCAPE_FOR_REGEXP = /([\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$])/g;
  var FORMAT_REGEXP = /\{([a-z\d_]+)(?::([\.0])(\d+)|:(\?))?\}/gi;
  var QUOTE_REGEXP_CACHE = {};

  var Entity = {
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
        return number.replace(/\d/g, function(m, pos){
          return !pos + (number.length - pos) % (len || 3) ? m : (splitter || ' ') + m;
        });
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
  * Root namespace for basis.js framework.
  * @namespace basis
  */

 /**
  * Attach document ready handlers
  * @function
  * @param {function()} handler 
  * @param {*} thisObject Context for handler
  */
  var ready = (function(){
    // Matthias Miller/Mark Wubben/Paul Sowden/Dean Edwards/John Resig/Roman Dvornov

    var fired = !document || document.readyState == 'complete';
    var deferredHandler;

    function fireHandlers(){
      if (document.readyState == 'complete')
        if (!fired++)
          while (deferredHandler)
          {
            deferredHandler.callback.call(deferredHandler.context);
            deferredHandler = deferredHandler.next;
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

    if (!fired)
    {
      if (document.addEventListener)
      {
        // use the real event for browsers that support it (all modern browsers support it)
        document.addEventListener('DOMContentLoaded', fireHandlers, false);

        // A fallback to window.onload, that will always work
        global.addEventListener('load', fireHandlers, false);
      }
      else
      {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent('onreadystatechange', fireHandlers);

        // A fallback to window.onload, that will always work
        global.attachEvent('onload', fireHandlers);

        // If IE and not a frame
        // continually check to see if the document is ready
        try {
          if (!global.frameElement && document.documentElement.doScroll)
            doScrollCheck();
        } catch(e) {
        }
      }
    }

    // return attach function
    return function(callback, context){
      if (!fired)
      {
        deferredHandler = {
          callback: callback,
          context: context,
          next: deferredHandler
        };
      }
      else
        callback.call(context);
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
      ;;;var logDestroy = log && typeof log == 'boolean';
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


  //
  // export names
  //

  // create and extend basis namespace
  var basis = getNamespace('basis').extend({
    filename_: basisFilename,

    NODE_ENV: NODE_ENV,
    config: config,
    platformFeature: {},

    namespace: getNamespace,
    require: requireNamespace,
    resource: getResource,
    asset: function(url){
      return url;
    },

    getter: getter,
    ready: ready,

    setImmediate: setImmediate,
    clearImmediate: clearImmediate,
    nextTick: function(){
      setImmediate.apply(null, arguments);
    },

    Class: Class,
    Token: Token,
    DeferredToken: DeferredToken,

    cleaner: cleaner,
    console: consoleMethods,

    object: {
      extend: extend,
      complete: complete,
      keys: keys,
      values: values,
      slice: slice,
      splice: splice,
      merge: merge,
      iterate: iterate,
      coalesce: coalesce
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
      def: def,
      wrapper: wrapper,

      // lazy
      lazyInit: lazyInit,
      lazyInitAndRun: lazyInitAndRun,
      runOnce: runOnce,
      body: functionBody
    },
    array: extend(arrayFrom, {
      from: arrayFrom,
      create: createArray
    }),
    string: {
      entity: Entity,
      isEmpty: isEmptyString,
      isNotEmpty: isNotEmptyString,
      format: String.prototype.format
    },
    bool: {
      invert: function(value){
        return !value;
      }
    }
  });

  // add dev namespace, host for special functionality in development environment
  getNamespace('basis.dev').extend(consoleMethods);

  // TODO: rename path->stmElse and add path to exports
  basis.path = pathUtils;


  //
  // basis extenstions
  //

  if (config.extClass)
  {
    /** @cut */ consoleMethods.warn('Extension of build classes by custom functions (i.e. Object.*, Array.*, String.*, Function.*) is deprecated, but extends by default until 0.10 version; use `extClass: false` in basis.js config to prevent buildin class extenstion and make code ready to new basis.js versions');

    extend(Object, basis.object);
    extend(Function, basis.fn);
    extend(Array, basis.array);
    extend(String, basis.string);
  }


  //
  // auto load section
  //

  if (config.autoload)
    requireNamespace(config.autoload);

})(this);
