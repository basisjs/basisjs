var remote = require('../../basisjs-tools-sync.js').remoteInspectors;

require('api')
  .local(require('./api.js'), remote);

module.exports = {
  // view: require('./view/index.js')
};
