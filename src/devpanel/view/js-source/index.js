var remote = require('../../remote.js');
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'))
  .channel(data.output, remote.send);

module.exports = {
  set: data.input.set.bind(data.input)
};
