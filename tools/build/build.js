var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var csso = require('csso');
var exec = require('child_process').exec;

var BASE_PATH = path.normalize(process.argv[2]);
var INDEX_FILE = path.resolve(BASE_PATH, 'index.html');
//var INDEX_PATH = path.dirname(INDEX_FILE);
var INDEX_PATH = path.dirname(INDEX_FILE) + '/';
var BUILD_DIR = path.resolve(BASE_PATH, 'build');
var BUILD_RESOURCE_DIR = BUILD_DIR + '/res';
var JSCOMPILER = 'java -jar c:\\tools\\gcc.jar --charset UTF-8';


if (!path.existsSync(INDEX_FILE))
{
  console.warn('Index file not found:', INDEX_FILE);
  process.exit();
}

var childProcessTask = [];


//
// Tree console output
//

var treeConsole = (function(){
  var logDeep = 0;
  var logBuffer = [];

  return {
    log: function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift(new Array(logDeep).join('  '));

      if (logBuffer.length)
        logBuffer[logBuffer.length - 1].push(args);
      else
        console.log.apply(console, args);
    },
    incDeep: function(){
      //console.log('deep++');
      logDeep++;
    },
    decDeep: function(){
      //console.log('deep--');
      logDeep--;
    },
    push: function(){
      logBuffer.push([]);
    },
    pop: function(){
      return logBuffer.pop();
    },
    flush: function(messages){
      if (logBuffer.length)
        Array.prototype.push.apply(logBuffer[logBuffer.length - 1], messages);
      else
        messages.forEach(function(args){
          console.log.apply(console, args);
        });
    },
    flushAll: function(){
      while (logBuffer.length)
        this.flush(this.pop());

      logDeep = 0;
    }
  }
})();

//
//
//

Array.prototype.add = function(value){
  return this.indexOf(value) == -1 && !!this.push(value);
}
String.prototype.repeat = function(count){
  var result = [];
  for (var i = 0; i < count; i++)
    result[i] = this;
  return result.join('');
}

function printHeader(text){
  treeConsole.flushAll();

  console.log('\n' + text + '\n' + ('='.repeat(text.length)) + '\n');
}

function mkdir(dirpath){
  if (!path.existsSync(dirpath))
    fs.mkdirSync(dirpath);  
}

function relpath(filename){
  return path.relative(INDEX_PATH, filename).replace(/\\/g, '/');
}

function getDigest(content){
  var hash = crypto.createHash('md5');
  hash.update(content);
  return hash.digest('base64')
    // remove trailing == which always appear on md5 digest, save 2 bytes
    .replace(/=+$/, '')
    // make digest web safe
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
}

//
// Set up flags
//

var flags = (function(){
  function hasFlag(flag){
    return args.indexOf(flag) != -1;
  }

  var args = process.argv.slice(2);
  var publishMode = hasFlag('-publish');
  return {
    production:    hasFlag('-production'),
    pack:          publishMode || hasFlag('-pack'),
    archive:       publishMode || hasFlag('-archive'),
    clear:         publishMode || hasFlag('-clear'),
    deploy:        publishMode || hasFlag('-deploy'),
    singleFile:    !hasFlag('-no-single-file'),

    jsSingleFile:  !hasFlag('-no-single-file') && !hasFlag('-js-no-single-file'),  // merge all javascript in one file
    jsBuildMode:   publishMode || hasFlag('-pack') || hasFlag('-js-build-mode'),   // evaluate module code (close to basis.require works)
    jsCutDev:      publishMode || hasFlag('-pack') || hasFlag('-js-cut-dev'),      // cut from source ;;; and /** @cut .. */
    jsPack:        publishMode || hasFlag('-pack') || hasFlag('-js-pack'),         // pack javascript source

    cssSingleFile: !hasFlag('-no-single-file') && !hasFlag('-css-no-single-file'), // merge all css in one file
    cssOptNames:   hasFlag('-css-optimize-names'),                                 // make css classes short
    cssPack:       publishMode || hasFlag('-pack') || hasFlag('-css-pack'),        // pack css code

    // experimental
    l10nPack:      hasFlag('-l10n-pack'),
    cssIgnoreDup:  hasFlag('-css-ignore-duplicates')
  };
})();


//
// Create output folder
//

mkdir(BUILD_DIR);
mkdir(BUILD_RESOURCE_DIR);


//
// Create build label
//

var buildLabel = new Date().toISOString().replace(/\D/g, '').substr(0, 14);
printHeader("BUILD: " + buildLabel);


//
// Fetch index file content and it's resources
//

var baseFilenames = {};
var cssFiles = [];
var jsFiles = [];
var genericCssContent = [];
var inlineJsContentId = 1;
var inlineJsContent = {};
var indexFileContent = fs.readFileSync(INDEX_FILE, 'utf-8')
  .replace(/<!--[^\[](.|[\r\n])+?-->/g, '')
  .replace(/([\t ]*)(?:<script(?:\s+.+?)?(?:\s+src="([^"]+)")(?:.*?)><\/script>|<script.*?>((?:.|[\r\n])*?)<\/script>)/gi,
    function(m, offset, scriptPath, code){
      if (scriptPath)
      {
        jsFiles.push(scriptPath);

        return /\s+basis-config/.test(m)
          ? offset + '<!--build inject point-->'
          : m;
      }
      else
      {
        inlineJsContent[inlineJsContentId] = {
          id: inlineJsContentId,
          content: code
        }
        jsFiles.push(inlineJsContent[inlineJsContentId]);
        inlineJsContentId++;
        return offset + '{inlinecode}';
      }
    }
  )
  .replace(/(<link(?:.*?\s)href=")([^"]+?)("(?:.*?)\/?>(?:[\t ]*\n)?)/gmi, 
    function(m, pre, stylePath, post){
      var filename = path.resolve(INDEX_FILE, stylePath);
      var basename = path.basename(filename);

      if (baseFilenames[basename])
      {
        console.warn('Dublicate css file basename `' + basename + '` for ' + stylePath);
        process.exit();
      }
      
      cssFiles.push(stylePath);

      return flags.cssSingleFile
        ? ''
        : pre + (basename + '?' + buildLabel) + post;
    }
  );

/// !!! jsFiles.push('app.js');

var resourceMap = {};
var resourceDigestMap = {};

///////////////////////////////////////////
// build js


var jsBuild = (function buildJs(){
  var buildMode = flags.jsBuildMode;
  var cutDev = flags.jsCutDev;
  var packBuild = flags.jsPack;
  var cssOptNames = flags.cssOptNames;

  var rootDepends = [];
  var fileCache = {};

  var jsResourceMap = {};
  var jsResourceList = [];
  var resourceRx = /\b((?:basis\.)?resource)\(([^\)]+)\)/g;
  var l10nDictionary = {};
  var l10nPathes = [];

  function getResourceDep(jsFile){
    var result = [];
    var resources = jsFile.resources;

    for (var i = 0, resource; resource = resources[i]; i++)
      if (resource.type == 'js')
      {
        if (!resource.depends)
        {
          var resourceJsFile = resource.contentObject;
          var resDepends = resourceJsFile.depends.slice();
          resource.depends = resDepends;

          var deps = getResourceDep(resourceJsFile);
          for (var j = 0, dep; dep = deps[j]; j++)
            resDepends.add(dep);
        }

        for (var j = 0, dep; dep = resource.depends[j]; j++)
          result.add(dep);
      }

    return result;
  }

  function createDictionaryKeyMap(keyMap){
    var stack = [];
    var res = [];
    var keys = Object.keys(keyMap).sort();
    var map = [];
    var pathMap = {};
    var keyIndex = 0;
    for (var i = 0, key; key = keys[i]; i++)
    {
      var parts = key.split('.');
      var reset = false;
      var offset = 0;

      if (stack.length && stack[0] != parts[0])
      {
        res.push('#');
        stack = [];
      }

      if (!stack.length)
        reset = true;
      else
      {
        for (; offset < parts.length; offset++)
          if (parts[offset] != stack[offset])
          {
            if (stack[offset])
            {
              reset = true;
              res.push(new Array(stack.length - offset + 1).join('<'));
              stack.splice(offset);
            }
            break;
          }
      }

      while (parts[offset])
      {
        if (!reset)
          res.push('>');

        reset = false;
        res.push(parts[offset]);
        stack.push(parts[offset]);
        offset++;

        var path = stack.join('.');
        keyMap[path] = map.length;
        map.push(path);
      }
    }
    return {
      keyMap: keyMap,
      map: map,
      content: res.join('')
    };
  }

  function packDictionary(dict, map){
    var linear = {};
    var result = [];

    for (var dictName in dict)
      for (var key in dict[dictName])
        linear[dictName + '.' + key] = dict[dictName][key];
     
    for (var i = 0, gap = -1; i < map.length; i++)
    {
      if (linear[map[i]])
      {
        if (gap != -1)
          result.push(gap);

        result.push(linear[map[i]]);

        gap = -1;
      }
      else
        gap++;
    }

    if (typeof result[result.length - 1] == 'number')
      result.pop();

    return result;
  }

  function resolveResource(filepath){

    if (!jsResourceMap[filepath])
    {
      //treeConsole.incDeep();

      var addResource = true;
      var resource = {
        id: 'null',
        type: 'unknown',
        path: filepath
      };

      jsResourceMap[filepath] = resource;

      if (path.existsSync(filepath))
      {
        resource.type = path.extname(filepath).substr(1);

        switch (resource.type){
          case 'js':
            resource.contentObject = getJsFile(filepath);
            resource.content = resource.contentObject.content;

            try {
              var compiled = new Function('exports, module, basis, global, __filename, __dirname, resource', resource.content);

              if (buildMode)
                resource.obj = compiled;

            } catch(e) {
              treeConsole.log('[ERROR] Compilation error: ' + filepath);
              console.warn('[ERROR] Compilation error: ' + filepath);

              if (buildMode)
                resource.obj = Function();
            }

            break;
          case 'css':
            genericCssContent.push(filepath);
            addResource = false;
            break;
          case 'tmpl':
            var fileContent = fs.readFileSync(filepath, 'utf-8');
            var decl = basis.template.makeDeclaration(fileContent, path.dirname(filepath) + '/', { classMap: cssOptNames });

            if (cssOptNames && decl.unpredictable)
              treeConsole.log('  [WARN] Unpredictable class names in template, class names optimization is not safe\n');

            if (decl.resources.length)
            {
              treeConsole.incDeep();
              for (var i = 0, res, ext; res = decl.resources[i]; i++)
              {
                res = path.resolve(path.dirname(filepath), res);
                ext = path.extname(res);
                if (ext == '.css')
                {
                  genericCssContent.push(res);
                  treeConsole.log('[+] ' + relpath(res));
                }
                else
                {
                  treeConsole.log('[!] ' + relpath(res) + ' (unknown type ignored)');
                }
              }
              treeConsole.log();
              treeConsole.decDeep();
            }

            resource.obj = decl.tokens;
            //resource.content = decl.toString();

            if (decl.classMap)
              resource.classMap = decl.classMap;

            break;
          default:
            resource.content = fs.readFileSync(filepath, 'utf-8');
        }

        if (addResource)
        {
          resource.id = jsResourceList.push(resource) - 1;
          resource.ref = resource.id + '.' + resource.type;
        }
      }

      //treeConsole.decDeep();
    }

    return jsResourceMap[filepath];
  }

  function getJsFile(filepath, namespace){
    //console.log("read " + filepath);

    var inlineJsId = filepath.match(/^#js-(\d+)/);
    if (inlineJsId)
    {
      inlineJsId = inlineJsId[1];
      filepath = '.';
    }

    var absFilepath = path.resolve(BASE_PATH, filepath);
    var fileDir = path.dirname(absFilepath) + '/';

    function evalExpr(expr, basePath){
      return path.resolve(basePath || fileDir, Function('__dirname, namespace', 'return ' + expr)(fileDir, namespace));
    }

    if (inlineJsId || !fileCache[absFilepath])
    {
      if (inlineJsId || path.existsSync(absFilepath))
      {
        treeConsole.incDeep();

        var fileContent = inlineJsId ? inlineJsContent[inlineJsId].content : fs.readFileSync(absFilepath, 'utf-8');
        var depends = []; 
        var resources = [];

        if (cutDev)
        {
          fileContent = fileContent
            .replace(/;;;.*$/gm, '')
            .replace(/\/\*\*\s*\@cut.*?\*\/.*$/gm, '')
            .replace(/className:\s*(namespace\s*\+\s*)?('|")[a-zA-Z0-9\.\_]+\2,?/g, '');
        }

        fileContent = fileContent
          .replace(/((\S?)\s*)basis\.require\((['"])([^'"]+)\3\)(;?)/g, function(m, pre, preSym, q, path, sym){
            depends.push(path);
            return !buildMode
              ? m // don't replace anything in non-build mode
              : ( // in build mode try to optimize code
                  preSym == '' || /[;\{\}]/.test(preSym)
                    ? pre
                    : pre + path + '.exports' + sym
                );
          })
          .replace(/(createDictionary\(\s*([^,]+?)\s*,\s*)([^,]+)/g, function(m, pre, dictName, path){
            //console.log('>>>>>>', m, namespace, filepath);
            try {
              path = evalExpr(path)
              dictName = Function('namespace', 'return ' + dictName)(namespace);
              console.log('  Dictionary declaration found: ' + dictName + ' -> ' + path);
            } catch(e){
              treeConsole.log('[!] Can\'t evaluate path `' + path + '` in createDictionary() call\n     filename: ' + absFilepath);
              return m;
            }

            if (dictName in l10nDictionary)
              treeConsole.log('Dictionary '  + dictName + ' is already declared ');

            l10nDictionary[dictName] = path;
            l10nPathes.add(path);

            return pre + '"l10n"';
          })
          .replace(resourceRx, function(m, fn, resourceExpr){
            var error = null;
            var replaceFor = m;
            var resource;

            treeConsole.push();

            try {
              resource = resolveResource(evalExpr(resourceExpr, (fn == 'resource' ? fileDir : INDEX_PATH)));
            } catch(e) {
              error = e;
            }

            var messages = treeConsole.pop();

            if (!error)
            {
              replaceFor = 'basis.resource("' + resource.id + '.' + resource.type + '")';
              //replaceFor = 'basis.resource("' + resource.ref + '")';
              resources.add(resource);

              treeConsole.log(
                '[+] ' + path.relative(INDEX_PATH, resource.path).replace(/\\/g, '/')
              );
              treeConsole.log(
                ' ~  ' + fn + '(' + resourceExpr + ') -> ' + replaceFor + '\n'
              );
            }
            else
              treeConsole.log('[!] Error: ', error, 'for ' + fn + '(' + resourceExpr + ')\n     filename: ' + filepath);

            if (messages.length)
            {
              treeConsole.flush(messages);
            }

            return replaceFor;
          });

        fileCache[filepath] = {
          path: filepath,
          content: fileContent,
          depends: depends,
          resources: resources
        };

        var resDeps = getResourceDep(fileCache[filepath]);
        for (var i = 0, dep; dep = resDeps[i]; i++)
          depends.add(dep);

        treeConsole.decDeep();
      }
      else
      {
        treeConsole.log('File not found: ', filepath);

        fileCache[filepath] = {
          path: filepath,
          srcContent: '',
          buildContent: '',
          depends: [],
          resources: []
        };
      }
    }

    return fileCache[filepath];
  }

  var reqGraph = [];
  function buildDep(namespace, context){
    if (!context)
      context = {};

    var nsParts = namespace.split('.');
    var pathRoot = nsParts[0];

    if (pathRoot in nsBase == false)
    {
      rootDepends.push(pathRoot);
      nsBase[pathRoot] = '';
      packages[pathRoot] = {
        path: '',
        files: [],
        content: []
      }
    }

    var filename = nsBase[pathRoot] + nsParts.join('/') + '.js';
    var jsFile = getJsFile(filename, namespace);
    var package = packages[pathRoot];

    if (jsFile && !context[filename])
    {
      context[filename] = true;

      for (var i = 0, dep; dep = jsFile.depends[i]; i++)
      {
        reqGraph.push('"' + namespace +'"->"' + dep + '";');

        buildDep(dep, context);
      }

      if (namespace != 'basis')
      {
        if (namespace == 'basis.l10n' && flags.l10nPack)
        {
          jsFile.content += '\n;(' + function(){
            var parts = basis.resource("_l10nIndex_").fetch().split(/([\<\>\#])/);
            var stack = [];
            for (var i = 0; i < parts.length; i++)
            {
              switch(parts[i])
              {
                case '#': stack.length = 0; break;
                case '<': stack.pop(); break;
                case '>': break;
                default:
                  if (parts[i])
                  {
                    stack.push(parts[i]);
                    getToken(stack.join('.'));
                  }
              }
            }
            getToken(stack.join('.'));
          } + ')();';
        }

        if (buildMode)
          package.content.push(
            "// " + filename + "\n" +
            '[' +
              '"' + namespace + '", function(basis, global, __dirname, exports, resource, module, __filename){' +
                //'console.log(arguments)'+
                jsFile.content +
              '}' + 
            ']'
          );
        else
          package.content.push(
            "//\n// " + filename + "\n//\n" +
            '{\n' +
            '  ns: "' + namespace + '",\n' + 
            '  path: "' + path.dirname(jsFile.path) + '/",\n' + 
            '  fn: "' + path.basename(jsFile.path) + '",\n' +
            '  body: function(){\n' +
                 jsFile.content + '\n' +
            '  }\n' + 
            '}'
          );
      }

      if (package)
        package.files.push(filename);
    }
  }


  var packageWrapper = [
    "(function(){\n" +
    "'use strict';\n\n",

    "\n}).call(this);"
  ];

  function wrapPackage(package, root){
    var isRoot = root || package == packages.basis;
    return !buildMode
      // source mode
      ? [
          '// filelist: \n//   ' + package.files.join('\n//   ') + '\n',
          packageWrapper[0],
          isRoot
            ? fileCache[nsBase.basis + 'basis.js'].content
            : '',
          '[\n',
            package.content.join(',\n'),
          '].forEach(' + function(module){
             var path = module.path;    
             var fn = path + module.fn;
             var ns = basis.namespace(module.ns);
             ns.source_ = Function.body(module.body);
             ns.filename_ = module.path + module.fn;
             new Function('module, exports, global, __filename, __dirname, basis, resource',
               '/** @namespace ' + ns.path + ' */\n' + ns.source_ + '//@ sourceURL=' + fn
             ).call(ns, ns, ns.exports, this, fn, path, basis, function(url){ return basis.resource(path + url) });
             Object.complete(ns, ns.exports);
           } + ', this)',
          packageWrapper[1]
        ].join('')
      // pack mode
      : [
          '// filelist: \n//   ' + package.files.join('\n//   ') + '\n',
          packageWrapper[0],
          isRoot
            ? fileCache[nsBase.basis + 'basis.js'].content
            : '',
          '[\n',
            package.content.join(',\n'),
          '].forEach(' + function(module){
             var fn = module[1];
             var ns = basis.namespace(module[0]);
             fn.call(ns, basis, this, "", ns.exports, basis.resource, ns, 'app.js');
             Object.complete(ns, ns.exports);
           } + ', this)',
          packageWrapper[1]
        ].join('');
  }

  ///////////////////////////////////////////

  var nsBase = {};
  var packages = {};

  // build base namespace map
  for (var i = 0; i < jsFiles.length; i++)
  {
    if (typeof jsFiles[i] != 'string')
      continue;

    var m = jsFiles[i].match(/([^\/\\]+)\.js$/i); //.test(jsFiles[i]))
    if (m)
    {
      var root = m[1];
      var packagePath = jsFiles[i].replace(/[^\\\/]+\.js$/, '');
      nsBase[root] = packagePath;
      packages[root] = {
        path: packagePath,
        files: [],
        content: []
      }
    }
  }

//  console.log(nsBase);
//  console.log(packages);
//  process.exit();
//  console.log(INDEX_PATH);


  ///////////////////////////////////////////


  printHeader('JavaScript:');

  // import basis.template to deal with templates
  global.document = require('jsdom-nocontextifiy').jsdom();
  global.basis = require('../../src/basis.js').basis;
  basis.require('basis.template');

  //buildDep('__build__');

  for (var i = 0; i < jsFiles.length; i++)
  {
    var jsFile;
    if (typeof jsFiles[i] == 'string')
      jsFile = getJsFile(jsFiles[i]);
    else
    {
      jsFile = getJsFile('#js-' + jsFiles[i].id);
      indexFileContent = indexFileContent.replace('{inlinecode}', function(){ return jsFile.content.trim() ? '<script>' + jsFile.content + '</script>' : '' });
    }

    jsFile.depends.forEach(rootDepends.add, rootDepends);
  }

  rootDepends.forEach(function(item){
    buildDep(item, this);
  }, {});

  //console.log('>>>>>!>!>!>!>', rootDepends.join(', '));
  //process.exit();

  //console.log(build);
  //console.log(reqGraph.join('\n'));


  ////////////////////////////////
  // wrap modules

  //fileCache[nsBase.basis + 'basis.js'].content = fileCache[nsBase.basis + 'basis.js'].content
  //  .replace(/resourceUrl\s*=\s*pathUtils.resolve\(resourceUrl\)/, '');

  if (flags.jsSingleFile)
  {
    (function(){
      var content = packages.basis.content;
      var files = packages.basis.files;

      for (var packageName in packages)
        if (packageName != 'basis')
        {
          content.push.apply(content, packages[packageName].content);
          files.push.apply(files, packages[packageName].files);
        }

      packages = {
        app: {
          files: files,
          content: content
        }
      };

      packages.app.content = wrapPackage(packages.app, true);
    })();
  }
  else
  {
    for (var packageName in packages)
      packages[packageName].content = wrapPackage(packages[packageName]);
  }

  ////////////////////////////////
  // build dictionaries

  printHeader('l10n:');

  // collect all source content for analyze
  var allSource = [];
  for (var packageName in packages)
    allSource.push(packages[packageName].content);
  allSource = allSource.join('');

  // process culture list
  var cultureList = allSource.match(/basis\.l10n\.setCultureList\([^\)]+\)/g);
  if (cultureList)
  {
    cultureList = cultureList.pop();
    cultureList = eval(cultureList.substring(26, cultureList.length - 1));
    if (typeof cultureList == 'string')
      cultureList = cultureList.trim().split(/\s+/)
    if (Array.isArray(cultureList))
    {
      console.log('Culture list is [' + cultureList.join(', ') + ']');

      treeConsole.incDeep();
      var dictKeyMap = {};
      var dictList = [];
      for (var i = 0, cultureId; cultureId = cultureList[i]; i++)
      {
        treeConsole.incDeep();
        treeConsole.log('* ' + cultureId);

        var dictFileContent = l10nPathes
          .map(function(filepath){
            filepath = path.normalize(filepath + '/' + cultureId + '.json');
            var res = {};
            if (path.existsSync(filepath))
            {
              var fileContent = fs.readFileSync(filepath, 'utf-8');
              try {
                res = JSON.parse(fileContent);
                treeConsole.log('[+] ' + filepath);
              } catch(e){
                treeConsole.log('[ERROR] ' + filepath + ' JSON parse error:' + e);
              }
            }
            else
              treeConsole.log('[ERROR] Dictionary not found: ' + filepath);

            return res;
          })
          .reduce(function(res, dict){
            for (var key in dict)
            {
              if (res[key])
                treeConsole.log(key + ' is already exists');

              res[key] = dict[key];

              for (var dk in dict[key])
                dictKeyMap[key + '.' + dk] = 1;
            }

            return res;
          }, {});

        dictList.push({
          cultureId: cultureId,
          content: dictFileContent
        });

        treeConsole.decDeep();

        console.log('');

        /*
        var dictFilename = BUILD_DIR + '/l10n/' + cultureList[i] + '.json';
        fs.writeFile(dictFilename, JSON.stringify(dictFileContent), 'utf-8');
        console.log('    dictionary saved to ' + dictFilename + '\n');
        */
      }

      treeConsole.decDeep();

      //
      // Pack dictionaries
      //

      if (flags.l10nPack)
      {
        console.log('  Pack dictionaries');

        var packedKeyMap = createDictionaryKeyMap(dictKeyMap);
        var l10nIndexSize = packedKeyMap.content.length;
        var l10nOriginalSize = 0;
        var l10nPackedSize = 0;

        var l10nGetPackToken = function(tokenName){
          return tokenName in packedKeyMap.keyMap
            ? packedKeyMap.keyMap[tokenName].toString(36)
            : null;
        };

        console.log('    Index: ' + packedKeyMap.map.length + ' keys ' + l10nIndexSize + ' bytes\n');

        jsResourceList.push({
          ref: '_l10nIndex_',
          type: 'sys',
          content: packedKeyMap.content
        });

        dictList.forEach(function(dict){
          var packedContent = packDictionary(dict.content, packedKeyMap.map);

          var originalSize = JSON.stringify(dict.content).length;
          var packedSize = JSON.stringify(packedContent).length;

          l10nOriginalSize += originalSize;
          l10nPackedSize += packedSize;

          console.log('    * ' + dict.cultureId + ': ');
          console.log('       Original size:', originalSize);
          console.log('       Packed size:', packedSize);
          console.log();

          jsResourceList.push({
            ref: 'l10n/' + dict.cultureId + '.json',
            type: 'json',
            obj: packedContent
          });
        });

        console.log('    Pack saving: ' + (l10nOriginalSize - (l10nPackedSize + l10nIndexSize)) + ' bytes');
      }
      else
      {
        dictList.forEach(function(dict){
          jsResourceList.push({
            ref: 'l10n/' + dict.cultureId + '.json',
            type: 'json',
            obj: dict.content
          });
        });
      }
    }
  }

  return {
    resources: jsResourceList,
    packages: packages,
    l10nGetPackToken: l10nGetPackToken || Function()
  };

})();


//
// Build css
//

printHeader("CSS:");

var cssClassNameMap = (function buildCSS(){

  var total_init_css_size = 0;
  var total_final_css_size = 0;

  var CSS_REL_RESOURCE_PATH = path.relative(BUILD_DIR, BUILD_RESOURCE_DIR) + '/';
  var CSS_RESOURCE_PATH = BUILD_RESOURCE_DIR + '/';

  var cssMediaRxToken = "[a-z][a-z\-0-9]+(?:\\([^\\)]+?\\))?";
  var cssMediaExprRxToken = cssMediaRxToken + '(?:\\b\\s*and\\s*' + cssMediaRxToken + ')*';
  var cssMediaListRxToken = cssMediaExprRxToken + '(?:\\s*,\\s*' + cssMediaExprRxToken + ')*';

  var cssQuotedValueRxToken = "'((?:\\\'|[^'])*?)'|\"((?:\\\"|[^\"])*?)\"";
  var cssUrlRxPart = 'url\\(\\s*(?:' + cssQuotedValueRxToken + '|([^\\)]*?))\\s*\\)';

  var cssImportRuleRx = new RegExp('@import(?:\\s*(?:' + cssQuotedValueRxToken + ')|\\s+' + cssUrlRxPart + ')(\\s+' + cssMediaListRxToken + ')?\s*;', 'g');
  var cssUrlRx = new RegExp('\\b' + cssUrlRxPart, 'g');

  var dataUriRx = /^data:text\/css;/;

  var fileCache = {};
  var processFileCount = 0;

  var classNameMap = {};
  var cssSourceClassNames = {};


  function resolveResource(url, baseUri, cssFile){
    // url(data:..) and so on -> nothing to do
    if (/^[a-z]+\:/.test(url))
      return url;

    var filename = path.resolve(baseUri, url);
    var newResource;
    var resourceDesc = resourceMap[filename];

    // read resource
    if (!resourceDesc)
    {
      if (!path.existsSync(filename))
      {
        treeConsole.log('    !                          [NOT FOUND] ' + relpath(filename));
        resourceMap[filename] = {
          state: 'error',
          url: url,
          refCount: 0,
          replacement: '',
          content: null,
          references: []
        }
      }
      else
      {
        var resourceContent = fs.readFileSync(filename);
        var digest = getDigest(resourceContent);

        if (!resourceDigestMap[digest])
        {
          var ext = path.extname(filename).replace(/^\./, '');

          newResource = true;
          resourceDigestMap[digest] = {
            state: 'ok',
            url: url,
            pathCount: 1,
            refCount: 0,
            references: [],
            filename: CSS_RESOURCE_PATH + digest + '.' + ext,
            replacement: CSS_REL_RESOURCE_PATH + digest + '.' + ext,
            content: resourceContent
          }
        }
        else
          resourceDigestMap[digest].pathCount++;

        resourceMap[filename] = resourceDigestMap[digest];
      }

      resourceDesc = resourceMap[filename];
    }

    if (resourceDesc.state == 'ok')
      treeConsole.log('    + ' + resourceDesc.replacement + (newResource ? ' [NEW]' : ' [DUP]') + ' -> ' + relpath(filename) + ' (' + resourceDesc.content.length + ' bytes)');

    resourceDesc.references.push(cssFile);
    resourceDesc.refCount++;

    return resourceMap[filename].replacement;
  }

  function processCssTree(tree, baseURI, context){

    function readString(val){
      return val.substr(1, val.length - 2);
    }

    function whitespaceAndComment(token){
      return token[1] != 's' && token[1] != 'comment';
    }

    function readUri(token){
      var val = token.slice(2).filter(whitespaceAndComment)[0];

      if (val[1] == 'string')
        return readString(val[2]);
      else
        return val[2];
    }

    function walkTree(topToken, offset){
      for (var i = offset || 0, token; token = topToken[i]; i++)
      {
        switch (token[1])
        { 
          case 'atrules':

            // @import
            if (token[2][1] == 'atkeyword' && token[2][2][1] == 'ident' && token[2][2][2] == 'import')
            {
              var parts = token.slice(3);
              var pos = 3;

              if (parts[0][1] == 's')
              {
                pos++;
                parts.shift();
              }

              var url = parts[0][1] == 'uri'
                ? readUri(parts[0])
                : readString(parts[0][2]);

              var media = parts.slice(1);
              var injection = buildCssTree(url, baseURI, context).slice(2);

              // @media wrap
              if (media.filter(whitespaceAndComment).length)
              {
                injection.unshift([{}, 's', '\n']);
                injection.push([{}, 's', '\n']);
                injection = [
                  [{}, 'atruler',
                    [{}, 'atkeyword',
                      [{}, 'ident', 'media' ]
                    ],
                    [{}, 'atrulerq'].concat(media),
                    [{}, 'atrulers'].concat(injection)
                  ]
                ];
              }

              // inject
              injection.unshift(i, 1,
                [{}, 'comment', csso.translate(csso.cleanInfo(token)).replace(/\*\//g, '* /')],
                [{}, 's', '\n\n']
              );
              topToken.splice.apply(topToken, injection);
              i += injection.length - 2;
            }

            break;

          case 'simpleselector':
            var selectorTokens = token.slice(2);
            for (var j = 0, part; part = selectorTokens[j]; j++)
            {
              if (part[1] == 'clazz')
              {
                var ident = part[2];
                var identName = ident[2];
                
                if (!cssSourceClassNames[identName])
                {
                  cssSourceClassNames[identName] = ident;
                  ident[3] = 1;
                }
                else
                {
                  part[2] = cssSourceClassNames[identName];
                  cssSourceClassNames[identName][3]++;
                }
              }
            }
            break;

          case 'uri':

            var url = readUri(token);
            token.splice(2);
            
            var replaceUrl = resolveResource(url, baseURI, 'filename' + ':' + (token[0].s));
            token.push([{}, 'string', replaceUrl.indexOf(')') == -1 ? replaceUrl : '"' + replaceUrl + '"']);

            break;

          default:

            walkTree(token, 2);

            break;
        }
      }
    }

    walkTree([tree]);
    return tree;
  }

  function buildCssTree(filename, baseURI, context){
    //console.log('buildCssTree:', filename);
    var content;
    var isInlineStyle = dataUriRx.test(filename);
    var offset = '';

    if (!context)
      context = [];
    else
      offset = (new Array(context.length + 1)).join('  ');

    if (isInlineStyle)
      content = filename.replace(dataUriRx, '');
    else
    {
      filename = path.resolve(baseURI, filename);
      baseURI = path.dirname(filename);

      if (!path.existsSync(filename))
      {
        treeConsole.log('  # [NOT FOUND] ' + relpath(filename));
        return [
          {}, 'stylesheet',
          [{}, 's', offset],
          [{}, 'comment', ' [WARN] File ' + filename + ' not found '],
          [{}, 's', '\n\n']
        ];
      }

      if (context.indexOf(filename) != -1)
      {
        treeConsole.log('  # [WARN] Recursion ' + context.map(relpath).join(' -> ') + ' -> ' + relpath(filename));
        return [
          {}, 'stylesheet',
          [{}, 's', offset],
          [{}, 'comment', ' [WARN] Recursion: ' + context.map(relpath).join(' -> ') + ' -> ' + relpath(filename) + ' '],
          [{}, 's', '\n\n']
        ];
      }

      treeConsole.log('  # [OK] ' + relpath(filename));

      content = fs.readFileSync(filename, 'utf-8');
      context.push(filename);
    }

    if (context.length)
      content = content.replace(/^|\n/g, "$&" + offset);

    // parse css into tree
    var cssTree = csso.parse(content, 'stylesheet');

    // add header
    cssTree.splice(2, 0,
      [{}, 's', offset],
      [{}, 'comment', '\n ' + offset + '* ' + filename + ' content injection\n ' + offset],
      [{}, 's', '\n']
    );
    cssTree.push(
      [{}, 's', '\n\n']
    );

    processCssTree(cssTree, baseURI, context);

    if (!isInlineStyle)
      context.pop();

    return cssTree;
  }


  //
  // build css files
  //

  treeConsole.incDeep();

  treeConsole.log('Build');
  treeConsole.incDeep();
  cssFiles = cssFiles.map(function(filename, idx){
    var absFilename = path.resolve(path.dirname(INDEX_FILE), filename);
    var basename = path.basename(filename);
    var targetFilename = BUILD_DIR + '/' + basename;

    treeConsole.log(basename);
    var cssBuild = {
      content: buildCssTree(absFilename)
    };

    return {
      filename: filename,
      targetFilename: targetFilename,
      basename: basename,
      content: cssBuild.content,
      sourceSize: cssBuild.sourceSize || 0
    };
  });

  if (genericCssContent.length)
  {
    treeConsole.log('[resources css]');
    /*var resourceCss = processFileContent(genericCssContent.map(function(cssFilename){
      return '@import url(' + relpath(path.resolve(BASE_PATH, cssFilename)) + ');';
    }).join('\n'), INDEX_FILE, {});*/

    var resourceCss = {
      content: buildCssTree('data:text/css;' + genericCssContent.map(function(cssFilename){
        return '@import url(' + relpath(path.resolve(BASE_PATH, cssFilename)) + ');';
      }).join('\n'), INDEX_PATH)
    };

    cssFiles.push({
      filename: '{resources}',
      targetFilename: BUILD_DIR + '/res.css',
      basename: '/res.css',
      content: resourceCss.content,
      sourceSize: resourceCss.sourceSize || 0
    });
  }

  treeConsole.log();
  treeConsole.decDeep();

  //
  // build className map and optimize
  //
  if (flags.cssOptNames)
  {
    (function(){
      function genNextClassName(curName){
        if (!curName)
          return 'a';

        return (parseInt(curName, 36) + 1).toString(36).replace(/^\d/, 'a');
      }

      var classNames = Object
        .keys(cssSourceClassNames) // all class names
        .sort(function(a, b){ return cssSourceClassNames[b][3] - cssSourceClassNames[a][3] }); // sorted desc by usage count

      for (var i = 0, name, replaceName; name = classNames[i]; i++)
      {
        do {
          replaceName = genNextClassName(replaceName);
        } while (cssSourceClassNames[replaceName]);
        //console.log(name, replaceName);

        cssSourceClassNames[name][2] = replaceName;
        classNameMap[name] = replaceName;
      }
    })();
  }

  //
  // Pack
  //
  if (flags.cssPack)
  {
    treeConsole.log('Pack');
    treeConsole.incDeep();

    cssFiles.forEach(function(cssFile){
      treeConsole.log(cssFile.basename);
      //content = csso.justDoIt(content);
      cssFile.content = csso.translate(csso.cleanInfo(csso.compress(cssFile.content)));
      treeConsole.log('  * ' + cssFile.sourceSize + ' -> ' + cssFile.content.length);
    });

    treeConsole.log();
    treeConsole.decDeep();
  }
  else
  {
    cssFiles.forEach(function(cssFile){
      cssFile.content = csso.translate(csso.cleanInfo(cssFile.content));
    });    
  }

  treeConsole.decDeep();


  //
  // insert link into index.html
  //

  if (flags.cssSingleFile)
  {
    var allCssContent = cssFiles.map(function(cssFile){ return cssFile.content }).join('');
    total_final_css_size = allCssContent.length;
    indexFileContent = indexFileContent.replace(/<\/head>/i, '<link rel="stylesheet" type="text/css" href="app.css?' + getDigest(allCssContent) + '"/>\n$&');

    treeConsole.log('Save all CSS to ' + path.normalize(BUILD_DIR + '/app.css') + '...\n');
    fs.writeFile(BUILD_DIR + '/app.css', allCssContent, 'utf-8');    
  }
  else
  {
    indexFileContent = indexFileContent.replace(/<\/head>/i, '  <link rel="stylesheet" type="text/css" href="res.css?' + buildLabel + '"/>\n$&');

    cssFiles.forEach(function(cssFile){
      treeConsole.log('Save ' + cssFile.filename + ' to ' + cssFile.targetFilename + '...\n');
      fs.writeFile(cssFile.targetFilename, cssFile.content, 'utf-8');
      total_final_css_size = cssFile.content.length;
    });
  }

  console.log(' ' + processFileCount + ' files (' + Object.keys(fileCache).length + ' unique) in ' + total_final_css_size + ' bytes (original ' + total_init_css_size + ' bytes)');

  return classNameMap;

})();


//
// Write js
//

printHeader("Javascript:");

(function(jsBuild){
  var buildMode = flags.jsBuildMode;
  var packBuild = flags.jsPack;

  var jsResourceList = jsBuild.resources;
  var packages = jsBuild.packages;
  var l10nGetPackToken = jsBuild.l10nGetPackToken;


  if (flags.cssOptNames)
  {
    console.log('Optimize class names');
    jsResourceList.forEach(function(res){
      function removeAttr(attrToRemove){
        function walkTree(tokens){
          for (var i = 0, token; token = tokens[i]; i++)
            if (token[0] == 1)
            {
              var attrs = token[4];
              if (attrs)
                for (var j = 0, attr; attr = attrs[j]; j++)
                  if (attr === attrToRemove)
                  {
                    attrs.splice(j, 1);
                    return true;
                  }

              if (walkTree(token[5]))
                return true;
            }
        }
        walkTree(res.obj);
      }

      function resolveClassName(ar, pos){
        ar[pos] = cssClassNameMap[ar[pos]];

        if (!ar[pos])
          ar.splice(pos--, 1);

        return pos;
      }

      if (res.type == 'tmpl' && res.classMap)
      {
        //console.log(JSON.stringify(res.classMap));
        for (var i = 0, attr; attr = res.classMap[i]; i++)
        {
          var bindings = attr[1];
          if (bindings)
          {
            for (var ii = 0, bind; bind = bindings[ii]; ii++)
            {
              if (bind.length < (4 + (typeof bind[3] != 'string')))
              {
                console.log('[WARN] Unpredictable binding ' + JSON.stringify(bind));
                continue;
              }

              var lastIdx = bind.length - 1;
              var last = bind[lastIdx];
              if (typeof last == 'string')  // bool
              {
                last = cssClassNameMap[last];
                if (!last)
                {
                  bindings.splice(ii, 1);
                  ii--;
                  continue;
                }
              }
              else
              {
                var refList = bind[lastIdx - 1];
                for (var j = 0; j < last.length; j++)
                {
                  last[j] = cssClassNameMap[last[j]];
                  if (!last[j])
                  {
                    last.splice(j, 1);
                    refList.splice(j, 1);
                    j--;
                  }
                }

                if (refList.length)
                {
                  bindings.splice(ii, 1);
                  ii--;
                  continue;
                }
              }

              bind[lastIdx] = last;
            }

            if (!bindings.length)
              attr[1] = bindings = 0;
          }

          if (attr[4])
          {
            attr[4] = attr[4].split(/\s+/).map(function(className){
              return cssClassNameMap[className] || '';
            }).join(' ').replace(/\s+/, ' ');
          }

          if (!attr[4] && !bindings)
          {
            //console.log('!!!attr remove');
            removeAttr(attr);
          }
        }
        //console.log('classMap:', JSON.stringify(res.classMap));
        //console.log(JSON.stringify(res.obj));
      }
      //cssClassNameMap
    });
  }


  ///////////////////////////////////////////
  // build resource map

  // TODO: fix problem with css resources and remove
  jsResourceList.push({
    ref: 'null.css',
    content: ''
  });

  //var xpack = require('./pack.js');
  //var _tmplPacked = 0;

  var resourceTypeWeight = {
    'json': 1,
    'tmpl': 2,
    'js': 100
  };

  function resourceSort(a, b){
    var wa = resourceTypeWeight[a.type] || 0;
    var wb = resourceTypeWeight[b.type] || 0;
    return wa > wb ? 1 : (wa < wb ? -1 : 0);
  }

  console.log('  Build resource map');
  var resourceStat = {};
  var resourceMapCode = '{' + jsResourceList.sort(resourceSort).map(function(resource){
    var content;
    if (resource.obj)
      content = typeof resource.obj == 'function'
        ? resource.obj.toString().replace(/function\s+anonymous/, 'function')
        : JSON.stringify(resource.obj);
    else
      content = JSON.stringify(String(resource.contentObject ? resource.contentObject.content : resource.content).replace(/\r\n?|\n\r?/g, '\n'));

    if (!resourceStat[resource.type])
      resourceStat[resource.type] = { count: 0, size: 0 };

    resourceStat[resource.type].count++;
    resourceStat[resource.type].size += content.length;

    if (resource.type == 'tmpl')
    {
      if (flags.l10nPack)
      {
        content = content.replace(/"l10n:([^"]+)"/g, function(m, key){
          var code = l10nGetPackToken(key);
          if (!code)
            console.log('    [!] Template l10n token `' + key + '` not found');
          return code ? '"l10n:#' + code + '"' : m;
        });
      }
     // var packed = xpack.pack(resource.obj);
     // _tmplPacked += packed.length;
    }

    return '"' + resource.ref + '": ' + content;
  }).join(',\n') + '}';

  /*console.log('!!!!!!!!!!!!  Template size  ' + resourceStat.tmpl.size + ', packed ' + _tmplPacked);
  console.log('!!!!!!!!!!!! String count:'  + Object.keys(xpack.dict).length);
  var xxxx = 0;
  var yyyy = 0;
  Object.iterate(xpack.dict, function(k, v){
    xxxx += v * (k.length + 1);
    yyyy += v * 2 + k.length + 3;
  });
//  console.log(Object.keys(xpack.dict).sort(function(a,b){ return xpack.dict[a] - xpack.dict[b] }).map(function(k){ return k + ' ' + xpack.dict[k]}).join('\n'));
  console.log('!!!!!!!!!!!! cur length '  + xxxx);
  console.log('!!!!!!!!!!!! length '  + yyyy);
  console.log('!!!!!!!!!!!! Saving:'  + (xxxx - yyyy));
  console.log('!!!!!!!!!!!! Packed:'  + (_tmplPacked - xxxx + yyyy));*/

  for (var key in resourceStat)
    console.log('    ' + key + ': ' + resourceStat[key].count + ' resources in ' + resourceStat[key].size + ' bytes');


  ////////////////////////////////
  // save js files

  var outputFiles = [];

  console.log('  Prepare output files');
  if (flags.jsSingleFile)
  {
    outputFiles.push({
      filename: path.normalize(BUILD_DIR + '/app.js'),
      content: packages.app.content.replace(/this\.__resources__ \|\| \{\}/, resourceMapCode)
    });
  }
  else
  {
    packages.res = {
      content: '"use strict";\nwindow.__resources__ = ' + resourceMapCode
    };

    for (var packageName in packages)
      outputFiles.push({
        filename: path.normalize(BUILD_DIR + '/' + packageName + '.js'),
        content: packages[packageName].content
      });
  }

  var jsDigests = {};

  console.log('  Write output files');
  outputFiles.forEach(
    !packBuild
      ? function(file){
          console.log('    Write ' + file.filename + '...');
          fs.writeFile(file.filename, file.content, 'utf-8');

          jsDigests[path.basename(file.filename)] = getDigest(file.content);
        }
      : function(file){
          var packStartTime = new Date;
          var resFilename = file.filename;
          var tmpFilename = file.filename + '.tmp';

          fs.writeFile(tmpFilename, file.content, 'utf-8');

          console.log('    Task for ' + resFilename + '.js packing added...');

          childProcessTask.push({
            name: 'Pack ' + resFilename,
            task: function(){
              exec(JSCOMPILER + ' --js ' + tmpFilename + ' --js_output_file ' + resFilename, { maxBuffer: 1024 *1024 }, function(error, stdout, stderr){
                console.log('\n' + resFilename + ' packed in ' + ((new Date - packStartTime)/1000).toFixed(3) + 's');

                if (stderr && stderr.length)
                  console.log(stderr);

                fs.unlink(tmpFilename);

                if (error !== null){
                  console.log('exec error: ' + error);
                }
                else
                {
                  var filename = path.basename(resFilename);
                  indexFileContent = indexFileContent.replace(' src="' + filename + '?"', function(){
                    return ' src="' + filename + '?' + getDigest(fs.readFileSync(resFilename, 'utf-8')) + '"'
                  });
                }

                taskCompleted();
              });
            }
          });
        }
  );


  ///////////////////////////////////
  // inject scripts into index.html

  indexFileContent = indexFileContent.replace(/([\t ]*)<!--build inject point-->/, function(m, offset){
    return offset + 
      (flags.jsSingleFile
        ? '<script type="text/javascript" src="app.js?' + (!packBuild ? jsDigests['app.js'] : '') + '"><\/script>'
        : [
           '<script type="text/javascript" src="res.js?' + (!packBuild ? jsDigests['res.js'] : '') + '"><\/script>',
           '<script type="text/javascript" src="basis.js?' + (!packBuild ? jsDigests['basis.js'] : '') + '"><\/script>',
           '<script type="text/javascript" src="app.js?' + (!packBuild ? jsDigests['app.js'] : '') + '"><\/script>'
          ].join('\n' + offset)
      )
  });
})(jsBuild);

//
// Copy resources to build folder
//

(function copyResources(){

  printHeader('Copy resources:');

  var refErrors = [];
  var refCount = 0;
  var pathCount = 0;
  var count = 0;
  var size = 0;

  for (var fn in resourceMap)
  {
    var resource = resourceMap[fn];
    if (resource.state == 'ok')
    {
      count++;
      pathCount += resource.pathCount;
      refCount += resource.refCount;
      size += resource.content.length;

      fs.writeFile(resource.filename, resource.content);
    }
    else
      refErrors.push(resource);
  }

  console.log('  ' + count + ' resources (ref count: ' + refCount + ', various pathes: ' + pathCount + '), ' + size + ' bytes');

  //////////////////////////////////////

  printHeader('Broken resource references found:');

  for (var i = 0, resource; resource = refErrors[i]; i++)
    for (var j = 0, ref; ref = resource.references[j]; j++)
      console.log('  ' + path.relative(INDEX_PATH, ref) + ' -> ' + resource.url);

})();

//console.log(indexFileContent);

function writeIndex(){
  indexFileContent = indexFileContent.replace(/([\t ]*)<title>(.|[\r\n])*?<\/title>/, '$&\n$1<meta name="build" content="' + buildLabel + '"/>');
  fs.writeFile(BUILD_DIR + '/' + path.basename(path.resolve(BASE_PATH, INDEX_FILE)), indexFileContent);
}

function taskCompleted(){
  childProcessTaskCount--;
  if (!childProcessTaskCount)
    writeIndex();
}

var childProcessTaskCount = childProcessTask.length;
if (childProcessTaskCount)
{
  printHeader('Child process tasks:');  
  childProcessTask.forEach(function(task){
    console.log(task.name + ' inited ...');
    task.task();
  });
}
else
  writeIndex();