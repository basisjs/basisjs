var Node = require('basis.ui').Node;
var Task = require('../task');

module.exports = Node.subclass({
  template: resource('./item.tmpl'),
  binding: {
    name: 'data:',
    completed: 'data:',
    editing: new basis.Token(false)
  },
  action: {
    toggle: function(){
      this.target.set('completed', !this.data.completed);
    },
    startEdit: function(){
      this.tmpl.editRef.value = this.data.name;
      this.tmpl.set('editing', true);
      this.tmpl.editRef.focus();
    },
    keydown: function(event){
      if (event.keyCode === 13) {
        this.tmpl.set('editing', false);
        Task.edit(this.target, this.tmpl.editRef.value);
      }
    },
    endEdit: function(){
      this.tmpl.set('editing', false);
      Task.edit(this.target, this.tmpl.editRef.value);
    },
    destroy: function(){
      this.target.destroy();
    }
  }
});
