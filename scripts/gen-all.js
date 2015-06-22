var fs = require('fs');
var requires = [];

process.chdir(__dirname + '/..');

(function walk(path){
  fs.readdirSync(path).forEach(function(fn){
    var fullpath = path + '/' + fn;

    if (/\.js$/.test(fn))
    {
      if (fn != 'all.js' && fn != 'devpanel.js')
        requires.push(
          'require(\'' + fullpath
            .replace(/^(\.+\/)*/, '')
            .replace(/^src\//, '')
            .replace(/\.js$/, '')
            .replace(/\//g, '.') +
          '\');'
        );
    }
    else
    {
      if (fs.statSync(fullpath).isDirectory())
        walk(fullpath);
    }
  });
})('src/basis');

fs.writeFileSync('src/basis/all.js', requires.sort().join('\n') + '\n');
