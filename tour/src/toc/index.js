var router = require('basis.router');
var Node = require('basis.ui').Node;
var Slide = require('app.type').Slide;

module.exports = new Node({
  active: true,
  dataSource: Slide.all,

  template: resource('./template/list.tmpl'),

  sorting: 'data.num',
  childClass: {
    active: true,
    template: resource('./template/item.tmpl'),
    binding: {
      title: 'data:'
    },
    action: {
      openSlide: function(){
        router.navigate(this.data.id);
      }
    }
  }
});
