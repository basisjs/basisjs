basis.require('basis.ui');

module.exports = new basis.ui.Node({
  template: resource('template/editor.tmpl'),
  binding: {
    content: 'data:'
  },
  action: {
    update: function(event){
      this.runOnUpdate = !this.data.updatable;
      this.target.update({
        content: event.sender.value
      }, true);
      this.runOnUpdate = false;
    }
  },
  handler: {
    update: function(sender, delta){
      if ('content' in delta && this.runOnUpdate)
        this.owner.prepareToRun();
    }
  }
});