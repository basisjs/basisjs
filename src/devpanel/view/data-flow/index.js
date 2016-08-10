var remote = require('../../remote.js');
var createDynamicView = require('../utils.js').createDynamicView;

var View = require('./view/index.js');
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'))
  .channel(data.output, remote.send);

module.exports = {
  view: createDynamicView(data.input, View),
  set: data.input.set.bind(data.input)
};
