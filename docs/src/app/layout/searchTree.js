var DocSearchTree = require('app.ext.docTree').DocSearchTree;

module.exports = new DocSearchTree({
  template: '<b:include src="basis.ui.tree.Tree" id="SearchTree"/>',
  selection: true,
  sorting: function(child){
    return child.data.title.toLowerCase();
  }
});
