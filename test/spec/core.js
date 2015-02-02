module.exports = {
  name: 'basis.js (core)',
  test: [
    require('./core/utils.js'),
    require('./core/path.js'),
    require('./core/getter.js'),
    require('./core/getter-old.js'),
    require('./core/resource.js'),
    require('./core/patch.js')
  ]
};
