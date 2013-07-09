basis.require('basis.ui');
basis.require('basis.data.value');
basis.require('basis.data.index');
basis.require('app.type');


// import names

var Todo = app.type.Todo;


//
// filters
//

var filters = new basis.ui.Node({
  template: resource('template/filters.tmpl'),

  autoDelegate: true,
  handler: {
    rootChanged: function(){
      var child = this.getChild(this.root, 'dataset');
      if (child)
        child.select();
    }
  },
  
  selection: true,
  childClass: {
    template: resource('template/filter-button.tmpl'),
    binding: {
      url: 'url',
      title: 'title'
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
  autoDelegate: true,

  itemLabel: '',

  template: resource('template/footer.tmpl'),
  binding: {
    completed: basis.data.index.count(Todo.completed),
    active: basis.data.index.count(Todo.active),
    itemLabel: new basis.data.value.Expression(basis.data.index.count(app.type.Todo.active), function(value){
      return value == 1 ? 'item' : 'items';
    }),
    filters: filters
  },
  action: {
    clearCompleted: function(){
      Todo.completed.getItems().forEach(function(item){
        item.destroy();
      });
    }
  }
});
