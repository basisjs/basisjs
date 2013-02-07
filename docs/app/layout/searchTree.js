
  basis.require('app.core');
  basis.require('app.ext.docTree');
  
  module.exports = new app.ext.docTree.DocSearchTree({
    id: 'SearchTree',
    selection: {},
    sorting: basis.getter('data.title', String.toLowerCase)
  });
