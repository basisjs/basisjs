basis.require('basis.ui');

module.exports = new basis.ui.Node({
  template: resource('editor.tmpl'),
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