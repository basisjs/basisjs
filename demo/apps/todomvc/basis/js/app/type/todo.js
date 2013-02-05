
  basis.require('basis.entity');
  basis.require('basis.data.dataset');

  var Todo = new basis.entity.EntityType({
    name: 'Todo',
    fields: {
      id: {
        type: basis.entity.IntId,
        calc: function(delta, data, oldValue){
          return data.id || ((lastId.value || 0) + 1);
        }
      },
      title: String,
      completed: Boolean
    }
  });

  var lastId = basis.data.index.max(Todo.all, 'data.id');

  //
  // datasets
  //

  var splitByCompleted = new basis.data.dataset.Split({
    source: Todo.all,
    rule: 'data.completed'
  });

  Todo.active = splitByCompleted.getSubset(false, true);
  Todo.completed = splitByCompleted.getSubset(true, true);

  module.exports = Todo;
