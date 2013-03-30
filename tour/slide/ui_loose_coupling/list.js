basis.require('basis.ui');

module.exports = new basis.ui.Node({
  template: resource('list.tmpl'),

  selection: true,
  childClass: {
    template: resource('item.tmpl'),
    binding: {
      title: 'data:'
    }
  },
  childNodes: [
    { data: { title: 'Item foo' } },
    { data: { title: 'Item bar' } },
    { data: { title: 'Item baz' } }
  ]
});