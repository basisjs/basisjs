basis.require('basis.ui');
basis.require('basis.data.index');
basis.require('app.type');

var Todo = app.type.Todo;

var view = new basis.ui.Node({
  template: resource('template/list.tmpl'),
  binding: {
    noActive: basis.data.index.count(Todo.active).as(basis.bool.invert)
  },
  action: {
    toggle: function(event){
      var dataset = event.sender.checked ? Todo.active : Todo.completed;

      // invert completed flag for dataset members
      dataset.forEach(function(item){
        item.set_completed(!item.data.completed);
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

Todo.selected.link(view, view.setDataSource);

module.exports = view;
