basis.require('basis.data');
basis.require('basis.data.dataset');
basis.require('basis.ui.tree');
//
// process resources
//
var fileMap = {};
var fileSet = new basis.data.Dataset({});
var fileGroup = new basis.data.dataset.Split({
  source: fileSet,
  rule: basis.fn.getter('data.folder')
});

var files = basis.resource.getFiles();
for (var i = 0, file; file = files[i]; i++)
  extractPath(file);

function extractPath(path){
  if (!fileMap[path])
  {
    var folder = basis.path.relative(basis.path.dirname(path));
    var isFolder = !basis.path.extname(path)
    fileSet.add(basis.data.wrapObject({
      path: path,
      name: basis.path.basename(path),
      folder: folder,
      isFolder: isFolder,
      code: !isFolder ? basis.resource.getSource(path) : null
    }));

    fileMap[path] = true;

    // extract containing folder
    if (folder)
      extractPath(folder);
  }  
}

//
// tree
//
var treeChildFactory = function(config){
  var childClass = config.delegate.data.isFolder ? TreeFolder : TreeNode;
  return new childClass(config);
}

var TreeNode = basis.ui.tree.Node.subclass({
  binding: {
    title: 'data:name'
  }
});

var TreeFolder = basis.ui.tree.Folder.subclass({
  collapsed: true,
  childFactory: treeChildFactory,  

  sorting: function(object){
    return (object.data.isFolder ? 0 : 1) + '_' + object.data.path;
  },

  binding: {
    title: 'data:name'
  },
  action: {
    select: function(event){
      basis.ui.tree.Folder.prototype.action.select.call(this, event);
      this.toggle();
    }
  },
  
  init: function(){
    basis.ui.tree.Folder.prototype.init.call(this);
    this.setDataSource(fileGroup.getSubset(this.data.path, true));
  }
});

module.exports = new basis.ui.tree.Tree({
  dataSource: fileGroup.getSubset("", true),
  childFactory: treeChildFactory
});

