var Node = require('basis.ui').Node;
var RuntimeFile = require('type').RuntimeFile;
var appProfile = require('type').AppProfile();
var api = require('api');
var graphApi = require('../api.js');

graphApi.channel.link(this, RuntimeFile);
api.connected.link(this, function(connected){
  if (connected)
    graphApi.init(function(data){
      RuntimeFile.all.set(data.files);
    });
});

module.exports = Node.subclass({
  active: true,
  delegate: appProfile,

  template: resource('./template/view.tmpl'),
  binding: {
    fileStat: resource('./file-stat/index.js'),
    graph: resource('./graph/index.js')
  }
});
