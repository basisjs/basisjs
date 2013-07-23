basis.require('basis.ui');
basis.require('basis.data.value');
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
  selection: true,
  childClass: {
    template: resource('template/filter-button.tmpl'),
    binding: {
      url: 'url',
      title: 'title',
      selected: app.selectedDataset.compute(function(node, value){
        return node.dataset === value;
      })
    }
  },
  childNodes: [
    {
      url: '',
      title: 'All',
      dataset: Todo.all
    },
    {
      url: 'active',
      title: 'Active',
      dataset: Todo.active
    },
    {
      url: 'completed',
      title: 'Completed',
      dataset: Todo.completed
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
    active: count(Todo.active),
    itemLabel: count(app.type.Todo.active).as(function(value){
      return value == 1 ? 'item' : 'items';
    })
  },
  action: {
    clearCompleted: function(){
      Todo.completed.forEach(function(item){
        item.destroy();
      });
    }
  }
});
