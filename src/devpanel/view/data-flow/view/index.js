var Flow = require('./flow.js');
var flowApi = require('../api.js');

module.exports = Flow.subclass({
  init: function(){
    Flow.prototype.init.call(this);

    flowApi.channel.link(this, function(nodes){
      this.setChildNodes(nodes);
    });
    flowApi.init(this.setChildNodes.bind(this));
  }
});
