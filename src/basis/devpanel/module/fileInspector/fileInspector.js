basis.require('basis.ui');
basis.require('basis.ui.resizer');

var fileTree = resource('module/fileTree/fileTree.js').fetch();
var fileView = resource('module/fileView/fileView.js').fetch();

fileTree.selection.addHandler({
  datasetChanged: function(object){
    fileView.setDelegate(this.pick());
  }
});

module.exports = new basis.ui.Node({
  container: document.body,
  opened: false,
  
  template: resource('template/fileInspector.tmpl'),
  
  binding: {
    opened: 'opened',
    fileTree: fileTree,
    fileView: fileView
  },

  action: {
    close: function(){
      this.close();
    }
  },
  toggle: function(){
    if (this.opened)
      this.close();
    else 
      this.open();
  },
  open: function(){
    this.opened = true;
    this.updateBind('opened');
  },
  close: function(){
    this.opened = false;
    this.updateBind('opened');
  }
});

new basis.ui.resizer.Resizer({
  element: module.exports.element,
  property: 'height',
  factor: -1
});

new basis.ui.resizer.Resizer({
  element: module.exports.tmpl.fileList,
});

