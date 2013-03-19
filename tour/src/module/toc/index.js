basis.require('basis.ui');
basis.require('app.type');

module.exports = new basis.ui.Node({
  dataSource: app.type.Slide.all,
  active: true,

  template: resource('template/list.tmpl'),
  
  sorting: 'data.num',
  childClass: {
    active: true,
    template: resource('template/item.tmpl'),
    binding: {
      title: 'data:'
    },
    action: {
      openSlide: function(){
        basis.router.navigate(this.data.id);
      }
    }
  }
});