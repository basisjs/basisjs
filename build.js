var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var LOG_FILENAME = 'build.log';

var fileCache = {};
var packages = [];
var childProcessCount = 0;
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
      result.srcContent.push("//\n// " + filename + "\n//", cfg.srcContent);
      result.buildContent.push("//\n// " + filename + "\n//", cfg.buildContent);
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
    var tmpFilename = packageResFilename + '.tmp';
    var packStartTime = new Date;

    fs.writeFileSync(packageDebugResFilename, build.srcContent.join('\n\n'), 'utf-8');
    fs.writeFileSync(tmpFilename, build.buildContent.join('\n\n'), 'utf-8');

    writeLog('init packing for ' + packageResFilename + ' and continue...');
    childProcessCount++;
    exec('java -jar c:\\tools\\gcc.jar --js ' + tmpFilename, { maxBuffer: 1024 *1024 }, function(error, stdout, stderr){
      writeLog('\n' + packageResFilename + ' packing - done in ' + ((new Date - packStartTime)/1000).toFixed(3) + 's');

      fs.writeFileSync(packageResFilename, stdout, 'utf-8');
      fs.unlinkSync(tmpFilename);

      if (!--childProcessCount)
        writeLog('\n=====================\nBuild done in ' + ((new Date - processStart)/1000).toFixed(3) + 's');

      writeLog(stderr, true);
      if (error !== null){
        console.log('exec error: ' + error);
      }
    });
  }
  else
  {
    var fileContent = ['// Package basis-' + packageName + '.js\n\n!function(){\n\  if (typeof document != \'undefined\')\n\  {\n\    var scripts = document.getElementsByTagName(\'script\');\n\    var curLocation = scripts[scripts.length - 1].src.replace(/[^\\/]+\\.js\$/, \'\');\n'];

    for (var i = 0, filename; filename = build.files[i]; i++)
    {
      if (packageFilename == filename)
        continue;

      fileContent.push("\n    document.write('<script src=\"' + curLocation + '" + filename + "\"></script>');");
    }

    fileContent.push("\n  }\n}();");

    fs.writeFileSync(packageDebugResFilename, fileContent.join(''), 'utf-8')
    fs.writeFileSync(packageResFilename, fileContent.join(''), 'utf-8')
  }

});

if (!childProcessCount)
  writeLog('\n=====================\nBuild done in ' + ((new Date - processStart)/1000).toFixed(3) + 's');
