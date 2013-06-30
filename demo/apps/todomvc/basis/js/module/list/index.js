basis.require('basis.ui');
basis.require('basis.data.property');
basis.require('basis.data.index');
basis.require('app.type');

module.exports = new basis.ui.Node({
  autoDelegate: true,
  handler: {
    rootChanged: function(){
      this.setDataSource(this.root);
    }
  },

  template: resource('template/list.tmpl'),
  binding: {
    noActive: new basis.data.property.Expression(
      basis.data.index.count(app.type.Todo.active),
      function(value){
        return !value;
      }
    )
  },
  action: {
    toggle: function(event){
      var dataset = event.sender.checked ? app.type.Todo.active : app.type.Todo.completed;

      // invert completed flag for dataset members
      dataset.getItems().forEach(function(todo){
        todo.set('completed', !todo.data.completed);
      });
    }
  },

  sorting: 'data.id',
  sortingDesc: true,

  childClass: {
    editing: false,

    template: resource('template/item.tmpl'),
    binding: {
      title: 'data:',
      completed: 'data:',
      editing: 'editing'
    },
    action: {
      toggle: function(){
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
  }
});
