basis.require('basis.ui');
var list = basis.ui.Node({
  template: resource('list.tmpl'),
  childClass: {
    template: resource('item.tmpl'),
    binding: {
      title: 'title'
    }
  },
  childNodes: [
    { title: 'Item foo' },
    { title: 'Item bar' },
    { title: 'Item baz' }
  ]
});