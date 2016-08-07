var data = require('./data/index.js');

require('api')
  .local(require('./api.js'), data);

module.exports = {
  // view: require('./view/index.js')
};
