// test suite
module.exports = {
  name: 'basis.js test suite',
  html: __dirname + 'env.html', // base env
  test: [
    //require('./spec/common/classes.js'),
    require('./spec/core.js'),
    require('./spec/date.js'),
    require('./spec/crypt.js'),
    require('./spec/ua.js'),
    require('./spec/router.js'),
    require('./spec/l10n.js'),
    require('./spec/data.js'),
    require('./spec/data.object.js'),
    require('./spec/data.dataset.js'),
    require('./spec/data.value.js'),
    require('./spec/data.index.js'),
    require('./spec/data.vector.js'),
    require('./spec/entity.js'),
    require('./spec/dom.wrapper.js'),
    require('./spec/template.js'),
    require('./spec/ui.js'),
    require('./spec/dom.js'),
    require('./spec/cssom.js'),
    require('./spec/layout.js'),
    require('./spec/utils.info.js')
  ]
};

// it's a hack to mark basis.js to be updatable
// do it only when global __resources__ available, which using as a implicit
// indicator that we run on basisjs-tools dev-server
if (typeof __resources__ != 'undefined')
{
  var xhr = new XMLHttpRequest();
  xhr.open('HEAD', '../src/basis.js', true);
  xhr.setRequestHeader('X-Basis-Resource', 1);
  xhr.send('');
}
