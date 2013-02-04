basis.require('basis.ui');
basis.require('app.type');

module.exports = new basis.ui.Node({
  dataSource: app.type.Page.all,
  active: true,

  template: resource('template/list.tmpl'),
  
  childClass: {
    template: resource('template/item.tmpl'),
    binding: {
      title: 'data:filename'
    }
  }
});