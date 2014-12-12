var Node = require('basis.ui').Node;
var Todo = require('app.type').Todo;
var count = require('basis.data.index').count;


//
// List item class
//

var TodoView = Node.subclass({
  editing: false,
  startEditing: function(){
    this.editing = true;
    this.updateBind('editing');
    this.focus();
  },
  stopEditing: function(value){
    this.editing = false;
    this.updateBind('editing');
    this.update({
      title: value
    });
  },

  template: resource('./template/item.tmpl'),
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
      this.startEditing();
    },
    stopEditing: function(event){
      this.stopEditing(event.sender.value);
    },
    key: function(event){
      if (event.key == event.KEY.ENTER)
        this.stopEditing(event.sender.value);
    },
    destroy: function(){
      this.target.destroy();
    }
  }
});


//
// Main view
//

module.exports = new Node({
  template: resource('./template/list.tmpl'),
  binding: {
    hidden: count(Todo.all).as(basis.bool.invert),
    noActive: count(Todo.active).as(basis.bool.invert)
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

  dataSource: Todo.selected,
  childClass: TodoView
});
