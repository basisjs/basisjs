basis.require('basis.ui');
basis.require('app.type');

module.exports = new basis.ui.Node({
  dataSource: app.type.Page.all,
  active: true,

  template: resource('template/list.tmpl'),
  
  childClass: {
    active: true,
    template: resource('template/item.tmpl'),
    binding: {
      title: 'data:'
    },
    action: {
      openPage: function(){
        basis.router.navigate(this.data.filename.replace(/\.html$/, ''));
      }
    }
  }
});