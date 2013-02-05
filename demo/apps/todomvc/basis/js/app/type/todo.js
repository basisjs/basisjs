
  basis.require('basis.entity');
  basis.require('basis.data.dataset');

  var Todo = new basis.entity.EntityType({
  	name: 'Todo',
  	fields: {
  		id: basis.entity.IntId,
  		title: String,
  		completed: Boolean
  	}
  });

  var splitByCompleted = new basis.data.dataset.Split({
    source: Todo.all,
    rule: 'data.completed'
  });

  Todo.active = splitByCompleted.getSubset(false, true);
  Todo.completed = splitByCompleted.getSubset(true, true);

  module.exports = Todo;
