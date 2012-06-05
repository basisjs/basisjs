
var path = require('path');
var fs = require('fs');

global.document = require('jsdom-nocontextifiy').jsdom();
global.basis = require('../../src/basis.js').basis;
basis.require('basis.template');

var workDir = path.normalize(process.argv[2]);

var flags = (function(){
  function hasFlag(flag){
    return args.indexOf(flag) != -1;
  }

  var args = process.argv.slice(2);
  return {
    showAll: hasFlag('-all')
  };
})();


var problemTemplateCount = 0;
var templateCount = 0;
process.on('exit', function(){
  if (!problemTemplateCount)
    console.log('[OK] No problem templates found\n');
  else
    console.log('Problem templates:', problemTemplateCount);

  console.log('Templates found:', templateCount);
});


(function getTemplates(dir){
  function readAndCheck(filename){
    templateCount++;
    fs.readFile(filename, 'utf-8', function(err, content){
      if (err)
        return console.warn('readFile error:', err, filename);
      
      var decl = basis.template.makeDeclaration(content, path.dirname(filename) + '/', { debug: true });

      if (flags.showAll || decl.unpredictable || decl.warns)
      {
        var code = 'OK';

        if (decl.warns)
        {
          problemTemplateCount++;
          code = 'WARN';
        }
        else
          if (decl.unpredictable)
          {
            problemTemplateCount++;
            code = 'UNPREDICTABLE';
          }

        console.log('[' + code + ']', path.normalize(filename));

        if (decl.warns)
          console.log('  [!] ' + decl.warns.join('\n  [!] ') + '\n');
      }
    });
  }

  function getStat(filename){
    fs.stat(filename, function(err, stats){
      if (err)
        return console.warn('stat error:', err, filename);

      if (stats.isDirectory())
        getTemplates(filename);
      else
      {
        if (path.extname(filename) == '.tmpl')
          readAndCheck(filename);
      }
    })
  }

  fs.readdir(dir, function(err, files){
    if (err)
      return console.warn('readdir error:', err, dir);

    for (var i = 0; i < files.length; i++)
      getStat(dir + '/' + files[i]);
  });
})(workDir);
