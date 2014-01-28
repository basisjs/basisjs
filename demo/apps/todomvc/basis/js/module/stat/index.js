require('basis.ui');
require('basis.data.index');

//
// import names
//

var Todo = require('app.type').Todo;


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

module.exports = new basis.ui.Node({
  template: resource('template/footer.tmpl'),
  binding: {
    filters: filters,
    completed: basis.data.index.count(Todo.completed),
    active: basis.data.index.count(Todo.active)
  },
  action: {
    clearCompleted: function(){
      Todo.completed.forEach(function(item){
        item.destroy();
      });
    }
  }
});
