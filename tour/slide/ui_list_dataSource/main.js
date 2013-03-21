basis.require('basis.data');
basis.require('basis.ui');

var dataset = new Dataset({
  items: ['foo', 'bar', 'baz'].map(function(value){
    return new basis.data.DataObject({
      data: {
        name: value
      }
    });
  })
});

var list = new basis.ui.Node({
  container: document.body,
  dataSource: dataset,

  template:
    '<ul/>',

  childClass: {
    template:
      '<li>{title}</li>',
    binding: {
      title: 'title'
    }
  }
});

dataset.remove(dataset.pick());
dataset.add(new basis.data.DataObject({
  data: {
    name: 'extra'
  }
}));