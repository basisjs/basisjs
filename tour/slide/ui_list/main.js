basis.require('basis.ui');

var Item = basis.ui.Node.subclass({
  className: 'Item',
  template:
    '<li>{title}</li>',
  binding: {
    title: 'title'
  }
});

var list = new basis.ui.Node({
  container: document.body,
  template:
    '<ul/>',
  childNodes: [
    new Item({ title: 'foo' }),
    new Item({ title: 'bar' })
  ]
});

list.appendChild(new Item({ title: 'baz' }));
list.insertBefore(new Item({ title: 'first' }), list.firstChild);