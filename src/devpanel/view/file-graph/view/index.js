var appProfile = require('type').AppProfile();
var Node = require('basis.ui').Node;

module.exports = Node.subclass({
  active: true,
  delegate: appProfile,

  template: resource('./template/view.tmpl'),
  binding: {
    fileStat: resource('./file-stat/index.js'),
    graph: resource('./graph/index.js')
  }
});
