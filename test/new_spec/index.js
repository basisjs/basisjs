// test suite
module.exports = {
  name: 'basis.js test suite',
  html: resource('env.html').url, // base env
  test: [
    require('spec/core.js'),
    require('spec/date.js'),
    require('spec/crypt.js'),
    require('spec/ua.js'),
    require('spec/router.js'),
    require('spec/l10n.js'),
    require('spec/data.js'),
    require('spec/data_value.js'),
    require('spec/data_vector.js'),
    require('spec/entity.js'),
    require('spec/dom_wrapper.js'),
    require('spec/template.js'),
    require('spec/ui.js'),
    require('spec/dom.js'),
    require('spec/cssom.js'),
    require('spec/layout.js')
  ]
};

// it's a hack to mark basis.js to be updatable
var xhr = new XMLHttpRequest();
xhr.open('HEAD', '../../../src/basis.js', true);
xhr.setRequestHeader('X-Basis-Resource', 1);
xhr.send('');
