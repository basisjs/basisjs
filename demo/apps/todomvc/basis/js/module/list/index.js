require('basis.ui');
require('basis.data.index');

//
// Import names
//

var Todo = require('app.type').Todo;


//
// List item class
//

var TodoView = basis.ui.Node.subclass({
  editing: false,

  template: resource('template/item.tmpl'),
  binding: {
    title: 'data:',
    completed: 'data:',
    editing: 'editing'
  },
  action: {
    toggleCompleted: function(){
      // invert todo completed flag
      this.update({
        completed: !this.data.completed
      });
    },
    startEditing: function(){
      this.editing = true;
      this.updateBind('editing');
      this.focus();
    },
    stopEditing: function(event){
      this.editing = false;
      this.updateBind('editing');
      this.update({
        title: event.sender.value
      });
    },
    key: function(event){
      if (event.key == event.KEY.ENTER)
        this.action.stopEditing.call(this, event);
    },
    destroy: function(){
      this.target.destroy();
    }
  }
});


//
// Main view
//

module.exports = new basis.ui.Node({
  dataSource: Todo.selected,

  template: resource('template/list.tmpl'),
  binding: {
    noActive: basis.data.index.count(Todo.active).as(basis.bool.invert)
  },
  action: {
    toggleCompletedForAll: function(event){
      var dataset = event.sender.checked ? Todo.active : Todo.completed;

      // invert completed flag for dataset members
      dataset.forEach(function(item){
        item.update({
          completed: !item.data.completed
        });
      });
    }
  },

  sorting: 'data.id',  // shortcut for function(child){ return child.data.id }
  sortingDesc: true,

  childClass: TodoView
});
