var Node = require('basis.ui').Node;

// load our components as modules
var editor = require('./editor.js');
var list = require('./list.js');

// link editor & list together
// all we need to know, that both are basis.ui.Node, and list has selection
list.selection.addHandler({
  itemsChanged: function(sender){
    editor.setDelegate(sender.pick());
    editor.focus();
  }
});

// create view that host nested components
var view = new Node({
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
