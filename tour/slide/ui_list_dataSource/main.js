var DataObject = require('basis.data').Object;
var Dataset = require('basis.data').Dataset;
var Node = require('basis.ui').Node;

var dataset = new Dataset({
  items: ['foo', 'bar', 'baz'].map(function(value){
    return new DataObject({
      data: {
        name: value
      }
    });
  })
});

var list = new Node({
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
dataset.add(new DataObject({
  data: {
    name: 'extra'
  }
}));
