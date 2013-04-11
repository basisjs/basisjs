basis.require('basis.ui');

// load our components as modules
var editor = resource('editor.js').fetch();
var list = resource('list.js').fetch();

// link editor & list together
// all we need to know, that both are basis.ui.Node, and list has selection
list.selection.addHandler({
  itemsChanged: function(sender){
    this.setDelegate(sender.pick());
    this.focus();
  }
}, editor);

// create view that host nested components
var view = new basis.ui.Node({
  container: document.body,
  template:
    '<div>' + 
      '<!--{editor}-->' +
      '<!--{list}-->' +
    '</div>',
  binding: {
    editor: editor,
    list: list
  }
});