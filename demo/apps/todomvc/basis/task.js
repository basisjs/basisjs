var entity = require('basis.entity');
var Filter = require('basis.data.dataset').Filter;

var Task = entity.createType('Task', { name: String, completed: Boolean, created: Number });
var LS_KEY = 'basisjs-todos';

Task.extendClass(function(_super, proto){
  return {
    init: function(){
      proto.init.apply(this, arguments);
    },
    handler: {
      update: function(){
        Task.save();
      }
    }
  };
});

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

try {
  Task.all.setAndDestroyRemoved(JSON.parse(localStorage[LS_KEY]));
} catch(e) {
  //  nothing to do
}

Task.all.addHandler({
  itemsChanged: function(){
    Task.save();
  }
});

module.exports = Task;
