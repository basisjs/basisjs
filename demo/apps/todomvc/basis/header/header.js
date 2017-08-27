var Node = require('basis.ui').Node;
var Task = require('../task');

module.exports = new Node({
  template: resource('./header.tmpl'),
  action: {
    keydown: function(event){
      if (event.keyCode === 13) {
        var name = event.target.value.trim();

        if (name) {
          Task({ name: name, created: Date.now() });
          event.target.value = '';
        }
      }
    }
  }
});
