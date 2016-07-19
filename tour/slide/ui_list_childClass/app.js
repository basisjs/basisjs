var Node = require('basis.ui').Node;

var list = new Node({
  container: document.body,
  template: '<ul/>',

  childClass: {
    className: 'Item',
    template: '<li>{title}</li>',
    binding: {
      title: 'title'
    }
  },
  childNodes: [
    { title: 'foo' },
    { title: 'bar' }
  ]
});

list.appendChild({ title: 'to be last' });
list.insertBefore({ title: 'to be first' }, list.firstChild);
