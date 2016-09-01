var remote = require('../../remote.js');
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'), data)
  .channel(data.output, remote.send);

module.exports = {
};
