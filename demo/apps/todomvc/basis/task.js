var entity = require('basis.entity');
var Filter = require('basis.data.dataset').Filter;

var Task = entity.createType('Task', { name: String, completed: Boolean, created: Number });
var LS_KEY = 'basisjs-todos';
var HANDLER_ITEM_UPDATE = {
  update: function(){
    Task.save();
  }
};

Task.save = function(){
  localStorage[LS_KEY] = JSON.stringify(Task.all.getValues('data'));
};

Task.edit = function(task, newName){
  newName = newName.trim();

  if (newName) {
    task.set('name', newName);
  }
  else {
    task.destroy();
  }
};

Task.completed = new Filter({
  source: Task.all,
  rule: 'data.completed'
});

Task.active = new Filter({
  source: Task.all,
  rule: basis.getter('data.completed').as(basis.bool.invert)
});

Task.all.addHandler({
  itemsChanged: function(sender, delta){
    if (delta.inserted){
      delta.inserted.forEach(function(item){
        item.addHandler(HANDLER_ITEM_UPDATE);
      });
    }
    Task.save();
  }
});

try {
  Task.all.setAndDestroyRemoved(JSON.parse(localStorage[LS_KEY]));
} catch(e) {
  //  nothing to do
}

module.exports = Task;
