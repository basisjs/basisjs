var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

global.document = require('jsdom-nocontextifiy').jsdom();
global.basis = require('./src/basis').basis;
basis.require('basis.template');

var LOG_FILENAME = 'build.log';

var fileCache = {};
var packages = [];
var asyncCallCount = 0;
var processStart = new Date;

var flags = process.argv.slice(2);
var buildMode = flags.indexOf('-build') != -1;
var packFiles = flags.indexOf('-nopack') == -1;

function readFile(filepath){
  //console.log("read " + filepath);

  var fileContent = fs.readFileSync(filepath, 'utf-8');
  var depends = ['basis']; 

  var buildContent = fileContent
    .replace(/;;;.*$/gm, '')
    .replace(/\/\*\*\s*\@cut.*?\*\/.*$/gm, '')
    .replace(/className:\s*(namespace\s*\+\s*)?('|")[a-zA-Z0-9\.\_]+\2,?/g, '')
    .replace(/basis\.require\((['"])([^'"]+)\1\);?/g, function(m, q, path){
      depends.push(path);
      return '';
    });

  fileCache[filepath] = {
    path: filepath,
    srcContent: fileContent,
    buildContent: buildContent,
    depends: depends
  };

  if (/^src\/package/.test(filepath))
    packages.push(fileCache[filepath]);
}

function readfiles(path){
  //console.log('dir [' + path + ']');

  var filelist = fs.readdirSync(path);

  for (var i = 0, filename; filename = filelist[i]; i++)
  {
    var filepath = path + '/' + filename;
    var stat = fs.statSync(filepath);
    if (stat.isDirectory())
    {
      if (!/\.svn$/.test(filepath))
        readfiles(filepath);
    }
    else
    {
      if (/\.js$/.test(filepath))
        readFile(filepath);
    }
  }
}

function buildDep(namespace, context){
  if (!context)
    context = {};

  var filename = 'src/' + namespace.replace(/\./g, '/') + '.js';

  var cfg = fileCache[filename];
  var result = {
    files: [],
    srcContent: [],
    buildContent: []
  };

  if (!context[filename])
  {
    context[filename] = 1;

    for (var i = 0, dep; dep = cfg.depends[i]; i++)
    {
      var build = buildDep(dep, context);
      result.files.push.apply(result.files, build.files);
      result.srcContent.push.apply(result.srcContent, build.srcContent);
      result.buildContent.push.apply(result.buildContent, build.buildContent);
    }

    if (buildMode)
    {
      var contentTemplate = ["//\n// " + filename + "\n//"];
      var contentPos = 1;

      if (namespace != 'basis')
      {
        contentPos = 2;
        contentTemplate.push(
          'new Function(__wrapArgs, function(){',
          '/*content*/',
          '}.body() + "//@ sourceURL=" + __curLocation + "' + filename + '").call(basis.namespace("' + namespace + '"), basis.namespace("' + namespace + '"), basis.namespace("' + namespace + '").exports, this, __curLocation + "' + filename + '", __curLocation + "' + path.dirname(cfg.path) + '/", basis, function(url){ return basis.resource(__curLocation + "' + path.dirname(cfg.path) + '/" + url) });'
        );
      }

      contentTemplate[contentPos] = cfg.srcContent;
      result.srcContent.push.apply(result.srcContent, contentTemplate);

      contentTemplate[contentPos] = cfg.buildContent;
      result.buildContent.push.apply(result.buildContent, contentTemplate);
    }

    result.files.push(filename);
  }

  return result;
}

function writeLog(data, hideFromConsole){
  var fd = fs.openSync(LOG_FILENAME, 'a');
  fs.writeSync(fd, data + '\n');
  fs.closeSync(fd);

  if (!hideFromConsole)
    console.log(data);
}

function checkForEnd(count){
  asyncCallCount -= count || 0;

  if (!asyncCallCount)
    writeLog('\n=====================\nBuild done in ' + ((new Date - processStart)/1000).toFixed(3) + 's\n');
}

if (path.existsSync(LOG_FILENAME))
  fs.unlinkSync(LOG_FILENAME);

//
// read src files
//
readfiles('src');

writeLog(Object.keys(fileCache).length + ' files read / ' + packages.length + ' packages');
writeLog('==============');

//
// build packages
//
//packages = [packages[0]];
packages.forEach(function(pack){
  var packageFilename = pack.path;

  var namespace = packageFilename
    .replace(/^src\/|\.js$/g, '')
    .replace(/\//g, '.');

  var packageName = namespace
    .replace(/^package\./g, '')
    .replace(/\./g, '-');

  var packageResFilename = 'basis-' + packageName + '.js';
  var packageDebugResFilename = 'basis-' + packageName + '-debug.js';
  var build = buildDep(namespace);

  writeLog("\nBuild package `" + packageName + "`:\n  ");
  writeLog(build.files.join('\n'));

  if (buildMode)
  {
    var packStartTime = new Date;
    var packageWrapper = [
      "(function(){\n" +
      "var __wrapArgs = 'module, exports, global, __filename, __dirname, basis, resource';\n" +
      "var __scripts = document.getElementsByTagName('script');\n" +
      "var __curLocation = __scripts[__scripts.length - 1].src.replace(/[^\/]+\.js$/, '');\n\n",

      "})();"
    ];

    var srcContent = packageWrapper[0] + build.srcContent.join('\n\n') + packageWrapper[1];
    var buildContent = packageWrapper[0] + build.buildContent.join('\n\n') + packageWrapper[1];

    fs.writeFileSync(packageDebugResFilename, srcContent, 'utf-8');

    if (!packFiles)
    {
      fs.writeFileSync(packageResFilename, buildContent, 'utf-8');
    }
    else
    {
      var tmpFilename = packageResFilename + '.tmp';
      fs.writeFileSync(tmpFilename, buildContent, 'utf-8');

      writeLog('init packing for ' + packageResFilename + ' and continue...');

      asyncCallCount++;
      exec('java -jar c:\\tools\\gcc.jar --js ' + tmpFilename, { maxBuffer: 1024 *1024 }, function(error, stdout, stderr){
        writeLog('\n' + packageResFilename + ' packing - done in ' + ((new Date - packStartTime)/1000).toFixed(3) + 's');

        var fileContent = stdout/*.replace(/template:(?:'((?:\\'|[^'])+?)'|"((?:\\"|[^"])+?)")(?=[^\+])/g, function(m, a, b){
          var templateStr = a || b;

          if (!/^[a-z]+:/.test(templateStr))
          {
            var tokens = basis.template.makeDeclaration(templateStr) + '';

            var sqMatch = tokens.match(/\'/g);
            var dqMatch = tokens.match(/\"/g);
            var sqCount = sqMatch ? sqMatch.length : 0;
            var dqCount = dqMatch ? dqMatch.length : 0;

            if (sqCount < dqCount)
              templateStr = "template:'tokens:" + tokens.replace(/'/g, "\\'") + "'";
            else
              templateStr = 'template:"tokens:' + tokens.replace(/"/g, '\\"') + '"';
          }

          return templateStr;
        })*/;

        asyncCallCount++;
        fs.unlink(tmpFilename, function(err){
          console.log('Temp package file ' + tmpFilename + (err ? ' don\'t deleted (' + err + ')' : ' deleted'));
          checkForEnd(1);
        });

        asyncCallCount++;
        fs.writeFile(packageResFilename, fileContent, 'utf-8', function(err){
          console.log('Package file ' + packageResFilename + (err ? ' don\'t saved (' + err + ')' : ' saved'));
          checkForEnd(1);
        });

        writeLog(stderr, true);

        checkForEnd(1);

        if (error !== null){
          console.log('exec error: ' + error);
        }
      });
    }
  }
  else
  {
    var fileContent = ['// Package basis-' + packageName + '.js\n\n!function(){\n\  if (typeof document != \'undefined\')\n\  {\n\    var scripts = document.getElementsByTagName(\'script\');\n\    var curLocation = scripts[scripts.length - 1].src.replace(/[^\\/]+\\.js\$/, \'\');\n'];

    fileContent.push("\n    document.write('<script src=\"' + curLocation + '" + build.files[0] + "\"></script>');\n");
    fileContent.push("\n    document.write('<script src=\"' + curLocation + '" + packageFilename + "\"></script>');\n");
    /*fileContent.push("\n    document.write('<script>');\n");

    var reqFiles = build.files.slice(1, -1);
    var base = path.dirname(build.files[0]);
    for (var i = 0, filename; filename = reqFiles[i]; i++)
    {
      var namespace = path.relative(base, filename).replace(/\.js$/, '').replace(/[\/\\]/g, '.');
      fileContent.push(
        "    document.write('  basis.require(\"" + namespace + "\");');\n"
      );
    }

    fileContent.push("    document.write('</script>');");*/
    fileContent.push("\n  }\n}();");

    fs.writeFileSync(packageDebugResFilename, fileContent.join(''), 'utf-8')
    fs.writeFileSync(packageResFilename, fileContent.join(''), 'utf-8')
  }

});

checkForEnd();