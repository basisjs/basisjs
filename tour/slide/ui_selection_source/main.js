basis.require('basis.ui');

var List = basis.ui.Node.subclass({
  container: document.body,
  template: resource('list.tmpl'),
  binding: {
    header: 'header'
  },
  childClass: {
    template: resource('item.tmpl'),
    binding: {
      title: 'data:title'
    }
  }
});

var list1 = new List({
  header: 'All items',
  selection: {
    multiple: true
  },
  childNodes: [
    { data: { title: 'Item foo' } },
    { data: { title: 'Item bar' } },
    { data: { title: 'Item baz' } }
  ]
});

var list2 = new List({
  header: 'Selected items',
  dataSource: list1.selection,
  template: '<b:include src="list.tmpl"><b:after ref="header"> ({childCount})</b:after></b:include>'
});