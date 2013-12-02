basis.require('basis.ui');
basis.require('basis.data.index');
basis.require('app.type');

// import names

var Todo = app.type.Todo;
var count = basis.data.index.count;

//
// filters
//

var filters = new basis.ui.Node({
  template: resource('template/filters.tmpl'),  
  childClass: {
    template: resource('template/filter-button.tmpl'),
    binding: {
      url: 'url',
      title: 'title',
      selected: Todo.selected.compute(function(node, value){
        return Todo[node.url || 'all'] === value;
      })
    }
  },
  childNodes: [
    {
      url: '',
      title: 'All'
    },
    {
      url: 'active',
      title: 'Active'
    },
    {
      url: 'completed',
      title: 'Completed'
    }
  ]
});

//
// panel
//

module.exports = new basis.ui.Node({
  template: resource('template/footer.tmpl'),
  binding: {
    filters: filters,
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
