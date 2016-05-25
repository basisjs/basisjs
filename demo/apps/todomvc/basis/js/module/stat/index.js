var Todo = require('app.type').Todo;
var Node = require('basis.ui').Node;
var count = require('basis.data.index').count;


//
// filters
//

var filters = new Node({
  template: resource('./template/filters.tmpl'),
  childClass: {
    template: resource('./template/filter-button.tmpl'),
    binding: {
      url: 'url',
      title: 'title',
      selected: Todo.selected.compute(function(node, value){
        return node.dataset === value;
      })
    }
  },
  childNodes: [
    {
      dataset: Todo.all,
      url: '',
      title: 'All'
    },
    {
      dataset: Todo.active,
      url: 'active',
      title: 'Active'
    },
    {
      dataset: Todo.completed,
      url: 'completed',
      title: 'Completed'
    }
  ]
});


//
// panel
//

module.exports = new Node({
  template: resource('./template/footer.tmpl'),
  binding: {
    filters: filters,
    hidden: count(Todo.all).as(basis.bool.invert),
    completed: count(Todo.completed),
    active: count(Todo.active)
  },
  action: {
    clearCompleted: function(){
      Todo.completed.forEach(function(item){
        item.destroy();
      });
    }
  }
});
