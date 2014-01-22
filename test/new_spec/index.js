module.exports = {
  name: 'basis.js test suite',
  html: resource('env.html').url, // base env
  test: [
    require('spec/util_functions.js'),
    require('spec/getter.js'),
    require('spec/date.js'),
    require('spec/crypt.js'),
    require('spec/ua.js'),
    require('spec/router.js'),
    require('spec/l10n.js'),
    require('spec/data_Value.js'),
    require('spec/data_Object.js'),
    require('spec/data_value_ObjectSet.js'),
    require('spec/data_dataset.js'),
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
