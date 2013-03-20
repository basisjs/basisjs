basis.require('basis.ui');

module.exports = new basis.ui.Node({
  template: resource('template/editor.tmpl'),
  binding: {
    content: 'data:'
  },
  action: {
    update: function(event){
      this.target.update({
        content: event.sender.value
      }, true); // update with rollback
    }
  }
});