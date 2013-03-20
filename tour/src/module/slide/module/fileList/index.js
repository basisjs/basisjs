basis.require('basis.ui.tabs');

module.exports = new basis.ui.tabs.TabControl({
  autoDelegate: true,
  handler: {
    update: function(sender, delta){
      this.setDataSource(this.data.files);
      // if ('files' in delta)
      //   this.setChildNodes(this.data.files ? this.data.files.getItems() : []);
    }
  },

  template: resource('template/list.tmpl'),

  childClass: {
    active: true,

    template: resource('template/item.tmpl'),
    binding: {
      title: 'data:name',
      modified: function(node){
        return !!node.target.modified;
      }
    },

    listen: {
      target: {
        rollbackUpdate: function(){
          this.updateBind('modified');
        }
      }
    }
  }
});