var Flow = require('./flow.js');
var fileApi = require('api').ns('file');
var flowApi = require('../api.js');

module.exports = Flow.subclass({
  fileAPI: fileApi,
  init: function(){
    Flow.prototype.init.call(this);

    flowApi.channel.link(this, function(nodes){
      this.setChildNodes(nodes);
    });
    flowApi.init();
  }
});
