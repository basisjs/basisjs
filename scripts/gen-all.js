var fs = require('fs');
var requires = [];

(function walk(path){
  fs.readdirSync(path).forEach(function(fn){
    var fullpath = path + '/' + fn;

    if (/\.js$/.test(fn))
    {
      if (fn != 'all.js')
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
      if (fs.statSync(fullpath).isDirectory())
        walk(fullpath);
  });
})('../src/basis');

fs.writeFileSync('../src/basis/all.js', requires.join('\n') + '\n');
