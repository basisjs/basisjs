var Node = require('basis.ui').Node;

module.exports = new Node({
  template: resource('./editor.tmpl'),
  binding: {
    title: 'data:'
  },
  action: {
    update: function(event){
      this.update({
        title: event.sender.value
      });
    }
  }
});
