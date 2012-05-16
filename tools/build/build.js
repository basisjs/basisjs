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
var JSCOMPILER = 'java -jar c:\\tools\\gcc.jar';


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
      logDeep++;
    },
    decDeep: function(){
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


//
//
//

var flags = (function(){
  function hasFlag(flag){
    return args.indexOf(flag) != -1;
  }

  var args = process.argv.slice(2);
  var publishMode = hasFlag('-publish');
  return {
    production:  hasFlag('-production'),
    pack:        publishMode || hasFlag('-pack'),
    archive:     publishMode || hasFlag('-archive'),
    clear:       publishMode || hasFlag('-clear'),
    deploy:      publishMode || hasFlag('-deploy'),
    jsBuildMode: publishMode || hasFlag('-pack') || hasFlag('-js-build-mode'),  // evaluate module code (close to basis.require works)
    jsCutDev:    publishMode || hasFlag('-pack') || hasFlag('-js-cut-dev'),     // cut from source ;;; and /** @cut .. */
    jsPack:      publishMode || hasFlag('-pack') || hasFlag('-js-pack'), // pack source code
    cssPack:     publishMode || hasFlag('-pack') || hasFlag('-css-pack') // pack source code
  };
})();


if (flags.production)
{
  SECRET_KEY = '???';
}



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
var indexFileContent = fs.readFileSync(INDEX_FILE, 'utf-8')
  .replace(/<!--[^\[](.|[\r\n])+?-->/g, '')
  .replace(/([\t ]*)<script(?:\s+.+?)?\s+src="([^"]+)"(.*?)><\/script>/gmi,
    function(m, offset, scriptPath){
      jsFiles.push(scriptPath);

      return /\s+basis-config/.test(m)
        ? offset + [
            '<script type="text/javascript" src="basis.js?' + buildLabel + '"><\/script>',
            '<script type="text/javascript" src="app.js?' + buildLabel + '"><\/script>'
          ].join('\n' + offset)
        : m;
    }
  )
  .replace(/<link(?:\s+id="[^"]+?")?\s+rel="stylesheet"\s+type="text\/css"\s+title="Default Style"\s+href="([^"]+?)"/gmi, 
    function(m, stylePath){
      var filename = path.resolve(INDEX_FILE, stylePath);
      var basename = path.basename(filename);

      if (baseFilenames[basename])
      {
        console.warn('Dublicate css file basename `' + basename + '` for ' + stylePath);
        process.exit();
      }
      
      cssFiles.push(stylePath);

      return m.replace(new RegExp(stylePath + '"$'), basename + '?' + buildLabel + '"');
    }
  );

jsFiles.push('app.js');

//console.log(cssFiles);
//console.log(jsFiles);

var resourceMap = {};
var resourceDigestMap = {};

///////////////////////////////////////////
// build js


(function buildJs(){
  var buildMode = flags.jsBuildMode;
  var cutDev = flags.jsCutDev;
  var packBuild = flags.jsPack;

  var rootDepends = ['basis', 'app'];
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

  function resolveResource(filepath){

    if (!jsResourceMap[filepath])
    {
      treeConsole.incDeep();

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
            /*try {
              resource.obj = new Function(resource.content);
            } catch(e) {
              console.log('[ERROR] Compilation error: ' + filepath);
              resource.obj = Function();
            }*/
            break;
          case 'css':
            genericCssContent.push(filepath);
            addResource = false;
            break;
          case 'tmpl':
            var fileContent = fs.readFileSync(filepath, 'utf-8');
            var decl = basis.template.makeDeclaration(fileContent);

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

            delete decl.resources;
            resource.obj = decl;
            resource.content = decl.toString();

            //resource.contentObject = basis.template.makeDeclaration(resource.content);
            break;
          default:
            resource.content = fs.readFileSync(filepath, 'utf-8');
        }

        if (addResource)
          resource.id = jsResourceList.push(resource) - 1;
      }

      treeConsole.decDeep();
    }

    return jsResourceMap[filepath];
  }

  function getJsFile(filepath, namespace){
    //console.log("read " + filepath);

    var absFilepath = path.resolve(BASE_PATH, filepath);
    var fileDir = path.dirname(absFilepath) + '/';

    function evalExpr(expr, basePath){
      return path.resolve(basePath || fileDir, Function('__dirname, namespace', 'return ' + expr)(fileDir, namespace));
    }

    if (!fileCache[absFilepath])
    {
      if (path.existsSync(absFilepath))
      {
        treeConsole.incDeep();

        var fileContent = fs.readFileSync(absFilepath, 'utf-8');
        var depends = []; 
        var resources = [];
        var resourceFound = false;

        if (cutDev)
        {
          fileContent = fileContent
            .replace(/;;;.*$/gm, '')
            .replace(/\/\*\*\s*\@cut.*?\*\/.*$/gm, '')
            .replace(/className:\s*(namespace\s*\+\s*)?('|")[a-zA-Z0-9\.\_]+\2,?/g, '');
        }

        fileContent = fileContent
          .replace(/basis\.require\((['"])([^'"]+)\1\);?/g, function(m, q, path){
            depends.push(path);
            return m; //buildMode ? '' : m;
          })
          .replace(/(createDictionary\(\s*([^,]+?)\s*,\s*)([^,]+)/g, function(m, pre, dictName, path){
            //console.log('>>>>>>', m, namespace, filepath);
            try {
              path = evalExpr(path)
              dictName = evalExpr(dictName);
            } catch(e){
              treeConsole.log('Can\'t evalute path `' + path + '` in ' + filepath);
              return m;
            }

            if (dictName in l10nDictionary)
              treeConsole.log('Dictonary '  + dictName + ' already declared ');

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
              resources.add(resource);

              treeConsole.log(
                '[+]', path.relative(INDEX_PATH, resource.path).replace(/\\/g, '/')
              );
              treeConsole.log(
                ' ~  ' + fn + '(' + resourceExpr + ') -> ' + replaceFor + '\n'
              );
            }
            else
              treeConsole.log('[!] Error: ', error, 'for ' + fn + '(' + resourceExpr + ') in ' + filepath);

            if (messages.length)
            {
              treeConsole.flush(messages);
            }

            return replaceFor;
          });

        if (resourceFound)
          treeConsole.log('');

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
    var filename = nsBase[nsParts[0]] + nsParts.join('/') + '.js';

    var jsFile = namespace != '__build__'
      ? getJsFile(filename, namespace)
      : { depends: rootDepends };
    var package = packages[nsParts[0]];

    if (jsFile && !context[filename])
    {
      context[filename] = true;

      for (var i = 0, dep; dep = jsFile.depends[i]; i++)
      {
        reqGraph.push('"' + namespace +'"->"' + dep + '";');

        buildDep(dep, context);
      }

      if (namespace != 'basis' && namespace != '__build__')
      {
        if (buildMode)
          package.content.push(
            "// " + filename + "\n" +
            '{' +
              '"' + namespace + '": function(basis, global, __dirname, exports, resource, module, __filename){' +
                //'console.log(arguments)'+
                jsFile.content +
              '}' + 
            '}'
          );
        else
          package.content.push(
            "//\n// " + relpath(filename) + "\n//\n" +
            '{\n' +
            '  ns: "' + namespace + '",\n' + 
            '  path: "' + relpath(path.dirname(jsFile.path)) + '/",\n' + 
            '  fn: "' + path.basename(jsFile.path) + '",\n' +
            '  body: function(){' +
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

  function wrapPackage(package){
   return !buildMode
    // pack mode
    ? [
        packageWrapper[0],
        'var __curLocation = "' + package.path + '";\n',
        package == packages.basis
          ? 'var externalResourceCache = ' + resourceMapCode + ';\n' + 
            fileCache[nsBase.basis + 'basis.js'].content
          : '',
        '[\n',
          package.content.join(',\n'),
        '].forEach(' + function(module){
           var path = __curLocation + module.path;    
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
    // source mode
    : [
        packageWrapper[0],
        'var __curLocation = "' + package.path + '";\n',
        package == packages.basis
          ? 'var externalResourceCache = ' + resourceMapCode + ';\n' + 
            fileCache[nsBase.basis + 'basis.js'].content
          : '',
        '[\n',
          package.content.join(',\n'),
        '].forEach(' + function(module){
           for (var ns in module)
           {
             var fn = module[ns];
             var nsParts = ns.split(".");
             var filename = nsParts.pop() + '.js';
             var path = __curLocation + nsParts.join('/') + '/';
             var ns = basis.namespace(ns);
             fn.call(ns, basis, this, path, ns.exports, function(url){ return basis.resource(path + url) }, ns, path + filename);
             Object.complete(ns, ns.exports);
           }
         } + ', this)',
        packageWrapper[1]
      ].join('');
  }

  ///////////////////////////////////////////

  var nsBase = {
    __build__: ''
  };
  var packages = {};

  // build base namespace map
  for (var i = 0; i < jsFiles.length; i++)
  {
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
//  console.log(INDEX_PATH);


  ///////////////////////////////////////////


  printHeader('JavaScript:');

  // import basis.template to deal with templates
  global.document = require('jsdom-nocontextifiy').jsdom();
  global.basis = require('../../src/basis.js').basis;
  basis.require('basis.template');

  buildDep('__build__');

  //console.log(build);
  //console.log(reqGraph.join('\n'));


  ///////////////////////////////////////////

  // build resource map
  var resourceMapCode = '[' + jsResourceList.map(function(resource){
    if (resource.obj)
      return typeof resource.obj == 'function'
        ? resource.obj.toString().replace(/function\s+anonymous/, 'function')
        : JSON.stringify(resource.obj);
    else
      return JSON.stringify(String(resource.contentObject ? resource.contentObject.content : resource.content).replace(/\r\n?|\n\r?/g, '\n'));
  }).join(',\n') + ']';

  var allSource = [];
  for (var packageName in packages)
    allSource.push(packages[packageName].content = wrapPackage(packages[packageName]));

  allSource = allSource.join('');
  packages.basis.content = packages.basis.content
    .replace(/resourceUrl\s*=\s*resolveUrl\(resourceUrl\)/, '')
    .replace(/\/\*\{resourceResolver\}\*\/(?:.|[\r\n])+\/\*\{resourceResolverEnd\}\*\//,
      'var externalResource = ' + function(ref){
        return externalResourceCache[parseInt(ref)] || "";
      }.toString() +';\n'
    );


  ////////////////////////////////
  // save js files

  if (!packBuild)
  {
    for (var packageName in packages)
      fs.writeFile(BUILD_DIR + '/' + packageName + '.js', packages[packageName].content, 'utf-8');
  }
  else
  {
    [
      { name: 'basis', content: packages.basis.content },
      { name: 'app', content: packages.app.content }
    ].forEach(function(cfg){
      var packStartTime = new Date;
      var tmpFilename = BUILD_DIR + '/' + cfg.name + '.tmp';
      var resFilename = BUILD_DIR + '/' + cfg.name + '.js';

      fs.writeFile(tmpFilename, cfg.content, 'utf-8');

      console.log('Task for ' + resFilename + '.js packing added...');

      childProcessTask.push({
        name: 'Pack ' + resFilename,
        task: function(){
          exec(JSCOMPILER + ' --js ' + tmpFilename + ' --js_output_file ' + resFilename, { maxBuffer: 1024 *1024 }, function(error, stdout, stderr){
            console.log('\n' + resFilename + ' packing - done in ' + ((new Date - packStartTime)/1000).toFixed(3) + 's');
            console.log(stderr);

            fs.unlink(tmpFilename);

            if (error !== null){
              console.log('exec error: ' + error);
            }
          })
        }
      });

    })
  }

  ////////////////////////////////

  printHeader('l10n:');

  var cultureList = allSource.match(/basis\.l10n\.setCultureList\([^\)]+\)/g);
  if (cultureList)
  {
    cultureList = cultureList.pop();
    cultureList = eval(cultureList.substring(26, cultureList.length - 1));
    if (typeof cultureList == 'string')
      cultureList = cultureList.trim().split(/\s+/)
    if (Array.isArray(cultureList))
    {
      console.log('  Culture list is [' + cultureList.join(', ') + ']');

      mkdir(BUILD_DIR + '/l10n');

      for (var i = 0; i < cultureList.length; i++)
      {
        console.log('  * ' + cultureList[i]);
        var dictFileContent = l10nPathes
          .map(function(filepath){
            filepath = filepath + '/' + this + '.json';
            if (path.existsSync(filepath))
              try {
                return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
              } catch(e){}
            else
              console.log('    [ERROR] Dictionary file ' + filepath + ' not found');

            return {};
          }, cultureList[i])
          .reduce(function(res, dict){
            for (var key in dict)
            {
              if (res[key])
                console.log(key + ' is already exists');

              res[key] = dict[key];
            }

            return res;
          }, {});

        var dictFilename = BUILD_DIR + '/l10n/' + cultureList[i] + '.json';
        fs.writeFile(dictFilename, JSON.stringify(dictFileContent), 'utf-8');
        console.log('    dictionary saved to ' + dictFilename + '\n');
      }
    }
  }

  //console.log(l10nDictionary);

  /*for (var key in resourceMap)
  {
    var resource = resourceMap[key];
    console.log(resource.type, resource.path, resource.id, (resource.content || '').length);
  }*/


/*
*/

})();


//
// Build css
//

printHeader("CSS:");

(function buildCSS(){

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
        console.log('    !                          [NOT FOUND] ' + relpath(filename));
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

        var hash = crypto.createHash('md5');
        hash.update(resourceContent);
        var digest = hash.digest('base64')
          // remove trailing == which always appear on md5 digest, save 2 bytes
          .replace(/=+$/, '')
          // make digest web safe
          .replace(/\//g, '_')
          .replace(/\+/g, '-');

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
      console.log('    + ' + resourceDesc.replacement + (newResource ? ' [NEW]' : ' [DUP]') + ' -> ' + relpath(filename) + ' (' + resourceDesc.content.length + ' bytes)');

    resourceDesc.references.push(cssFile);
    resourceDesc.refCount++;

    return resourceMap[filename].replacement;
  }

  function processFileContent(fileContent, filename, context){
    var comments = [];
    var imports = [];
    var sourceSize = 0;
    var baseURI = path.dirname(filename);

    // remove comments
    fileContent = fileContent.replace(/\/\*(.|[\r\n])*?\*\//g, function(m){ comments.push(m); return '\x00' });

    fileContent = fileContent.replace(cssImportRuleRx, function(m, sq1, dq1, url, sq2, dq2, media){
      var sq = sq1 || sq2;
      var dq = dq1 || dq2;

      if (sq)
        url = sq.replace(/\\'/g, "'");

      if (dq)
        url = dq.replace(/\\"/g, '"');

      imports.push({
        src: m,
        url: path.resolve(baseURI, url),
        media: media
      });

      return '\x01';
    });

    // resolve urls
    fileContent = fileContent.replace(cssUrlRx, function(m, sq, dq, raw){
      var url = raw;

      if (sq)
        url = sq.replace(/\\'/g, "'");

      if (dq)
        url = dq.replace(/\\"/g, '"');

      var n = RegExp.leftContext.match(/\n/g);

      return 'url(' + resolveResource(url, baseURI, filename + ':' + (n ? n.length : 0)) + ')';
    });

    // restore/resolve imports
    fileContent = fileContent.replace(/\x01/g, function(){
      var importRule = imports.shift();
      var result = '\n/* ' + importRule.src + ' */\n';

      if (context[importRule.url])
        result += '/* WARN: Recursive @import rule ignored */\n';
      else
      {
        var cssBuild = linearCssFile(importRule.url, context);

        result += cssBuild.content;
        sourceSize += cssBuild.sourceSize;
      }

      return result;
    });

    // restore comments
    fileContent = fileContent.replace(/\x00/g, function(){
      return comments.shift();
    });
    
    return {
      sourceSize: sourceSize,
      content: fileContent
    };
  }

  function linearCssFile(filename, context){

    var fileContent;
    var sourceSize = 0;

    if (!path.existsSync(filename))
    {
      console.log('  # [NOT FOUND] ' + relpath(filename));
      fileContent = '\n/* WARN: File ' + filename + ' not found */\n';
    }
    else
    {
      console.log('  # [OK] ' + relpath(filename));

      if (!context)
        context = {};

      context[filename] = true;

      // read file content
      fileContent = fs.readFileSync(filename, 'utf-8');
      sourceSize = fileContent.length;

      // consume original file size
      total_init_css_size += fileContent.length;  

      var processed = processFileContent(fileContent, filename, context);
      fileContent = processed.content;
      sourceSize += processed.sourceSize;

      delete context[filename];
    }

    return {
      sourceSize: sourceSize,
      content: fileContent
    };
  }


  cssFiles.forEach(function(filename, idx){
    var absFilename = path.resolve(path.dirname(INDEX_FILE), filename);
    var basename = path.basename(filename);
    var targetFilename = BUILD_DIR + '/' + basename;

    console.log('  Build ' + basename + '...');
    var cssBuild = linearCssFile(absFilename);

    if (0&&flags.cssPack)
    {
      console.log('  Pack ' + basename + '...');
      cssBuild.content = csso.justDoIt(cssBuild.content);
      console.log('    * ' + cssBuild.sourceSize + ' -> ' + cssBuild.content.length);
    }

    total_final_css_size += cssBuild.content;

    console.log('  Save ' + filename + ' to ' + targetFilename + '...\n');
    fs.writeFile(targetFilename, cssBuild.content, 'utf-8');
  });

  if (genericCssContent.length)
  {
    console.log('  Build resources css');
    var resourceCss = processFileContent(genericCssContent.map(function(cssFilename){
      return '@import url(' + relpath(path.resolve(BASE_PATH, cssFilename)) + ');';
    }).join('\n'), INDEX_FILE, {});

    if (flags.cssPack)
    {
      console.log('  Pack /resources.css ...');
      resourceCss.content = csso.justDoIt(resourceCss.content);
      console.log('    * ' + resourceCss.sourceSize + ' -> ' + resourceCss.content.length);
    }

    fs.writeFile(BUILD_DIR + '/resources.css', resourceCss.content, 'utf-8');

    indexFileContent = indexFileContent.replace(/<\/head>/i, '  <link rel="stylesheet" type="text/css" href="resources.css?' + buildLabel + '"/>\n$&')
  }

})();

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
fs.writeFile(BUILD_DIR + '/' + path.basename(path.resolve(BASE_PATH, INDEX_FILE)), indexFileContent);

if (childProcessTask.length)
{
  printHeader('Child process tasks:');  
  childProcessTask.forEach(function(task){
    console.log(task.name + ' inited ...');
    task.task();
  });
}