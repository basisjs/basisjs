var fs = require('fs');
var dict = fs.readFileSync('description.l10n', 'utf-8');

var slideId = process.argv[2];
var dir = 'slide/' + slideId;

if (!slideId)
{
  console.warn('slide id is not specified');
  process.exit();
}

if (fs.existsSync(dir))
{
  console.warn('slide id is already in use');
  process.exit();
}

// create dir
fs.mkdirSync(dir);

// write files
fs.writeFile(dir + '/main.js', '// slide code goes here');
fs.writeFile(dir + '/ru.tmpl', 'Описание на русском');
fs.writeFile(dir + '/en.tmpl', 'Description in English');
fs.writeFile(dir + '/description.l10n', dict);

// update index
fs.writeFile('./slide/index.json',
  JSON.stringify(
    require('./slide/index.json').concat({
      id: slideId,
      title: slideId,
      files: []
    }),
    null,
    2
  )
);

console.log('Slide ' + slideId + ' successful created');
