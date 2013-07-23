basis.require('basis.entity');
basis.require('basis.data.dataset');

var Todo = basis.entity.createType('Todo', {
  id: {
    type: basis.entity.IntId,
    calc: function(delta, data, oldValue){
      return data.id || ((lastId.value || 0) + 1);
    }
  },
  title: String,
  completed: Boolean
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

//
// persistance
//

if (typeof localStorage != 'undefined')
{
  // read todo list from local storage
  var storedData = localStorage.getItem('todos-basisjs');
  if (storedData)
    JSON.parse(storedData).forEach(Todo);

  // add handler to save todos on page unload
  basis.dom.event.onUnload(function(){
    localStorage.setItem('todos-basisjs', JSON.stringify(Todo.all.getItems().map(function(item){
      return basis.object.slice(item.data, ['title', 'completed']);
    })));
  });
}

module.exports = Todo;
