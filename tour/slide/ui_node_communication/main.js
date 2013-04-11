basis.require('basis.ui');

var editor = new basis.ui.Node({
  container: document.body,
  template:
    '<input{focus} value="{title}" event-keyup="update" event-change="update"/>',
  binding: {
    title: 'data:'
  },
  action: {
    update: function(event){
      this.update({
        title: event.sender.value
      });
    }
  }
});

var list = new basis.ui.Node({
  container: document.body,
  template: resource('list.tmpl'),

  selection: {
    handler: {
      // selection is dataset, itemsChanged fires when it changes
      itemsChanged: function(){
        editor.setDelegate(this.pick());
        editor.focus();
      }
    }
  },
  childClass: {
    template: resource('item.tmpl'),
    binding: {
      title: 'data:'
    }
  },
  childNodes: [
    { data: { title: 'Item foo' } },
    { data: { title: 'Item bar' } },
    { data: { title: 'Item baz' } }
  ]
});