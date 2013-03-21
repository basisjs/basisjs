basis.require('basis.ui');

var list = new basis.ui.Node({
  container: document.body,
  template: resource('list.tmpl'),

  selection: true,
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