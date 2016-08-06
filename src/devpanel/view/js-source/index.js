var remote = require('../../basisjs-tools-sync.js').remoteInspectors;
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'))
  .channel(data.output, remote.send);

module.exports = {
  set: data.input.set.bind(data.input)
};
