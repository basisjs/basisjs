basis.require('basis.data');
basis.require('basis.ui');

var dataset = new basis.data.Dataset({
  items: ['foo', 'bar', 'baz'].map(function(value){
    return new basis.data.Object({
      data: {
        name: value
      }
    });
  })
});

var list = new basis.ui.Node({
  container: document.body,
  dataSource: dataset,
  template: '<ul/>',
  childClass: {
    template: '<li>{name}</li>',
    binding: {
      name: 'data:'
    }
  }
});

dataset.remove(dataset.pick());
dataset.add(new basis.data.Object({
  data: {
    name: 'extra'
  }
}));
