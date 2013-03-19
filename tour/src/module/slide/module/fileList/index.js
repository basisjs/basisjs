basis.require('basis.ui.tabs');

module.exports = new basis.ui.tabs.TabControl({
  autoDelegate: true,
  handler: {
    update: function(sender, delta){
      if ('files' in delta)
        this.setChildNodes(this.data.files ? this.data.files.getItems() : []);
    }
  },
  childClass: {
    active: true,
    binding: {
      title: 'data:name'
    }
  }
});