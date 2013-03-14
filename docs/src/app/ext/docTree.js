
  basis.require('app.core');

  //
  // Maps
  //

  var groupTitle = {
    Namespace: 'Namespaces',
    Method: 'Methods',
    Function: 'Functions',
    Property: 'Properties',
    Constant: 'Constants',
    ConstantObject: 'Constants',
    Class: 'Classes',
    Object: 'Objects',
    HtmlElement: 'DOM elements',
    ClassMember: 'Class members',
    Event: 'Events'
  };

  var groupWeight = {
    Namespace: 0,
    ClassMember: 1,
    Constant: 2,
    Class: 3,
    Object: 4,
    HtmlElement: 5,
    Event: 6,
    Property: 7,
    Method: 8,
    Function: 9
  };

  var nodeTypeGrouping = {
    sorting: basis.getter('data.id', groupWeight),
    groupGetter: function(node){
      return node.data.isClassMember ? 'ClassMember' : node.data.kind.capitalize();
    },
    childClass: {
      titleGetter: basis.getter('data.id', groupTitle),
      template: resource('docTree/template/docTreePartitionNode.tmpl')
    }
  };

 /**
  * @class
  */
  var DocTreeNode = basis.ui.tree.Folder.subclass({
    template: resource('docTree/template/docTreeNode.tmpl'),

    binding: {
      kind: function(node){
        return node.data.kind && node.data.kind.capitalize();
      },
      args: function(node){
        if (/^(function|method|class|classMember)$/i.test(node.data.kind))
          return basis.dom.createElement('SPAN.args', app.core.getFunctionDescription(node.data.obj).args.quote('('));
      }
    }
  });

 /**
  * @class
  */
  var DocSearchTreeNode = DocTreeNode.subclass({
    template: resource('docTree/template/docSearchTreeNode.tmpl'),

    binding: {
      namespace: function(node){
        return node.data.kind != 'namespace' ? node.data.path + '.' : '';
      }
    }
  });


 /**
  * @class
  */
  var DocBaseTreeFolder = DocTreeNode.subclass({
    template: resource('docTree/template/docTreeFolder.tmpl'),

    childFactory: function(config){
      var kind = config.delegate.data.kind;
      if (kind == 'constant' && typeof config.delegate.data.obj == 'object' && !Array.isArray(config.delegate.data.obj))
        kind = 'constantObject';
      return new kindNodeClass[kind](config);
    },
    sorting: function(node){
      return groupWeight[node.nodeType] + '_' + node.data.title;
    }
  });


 /**
  * @class
  */
  var DocTreeFolder = DocBaseTreeFolder.subclass({
    collapsed: true,

    grouping: nodeTypeGrouping,

    getMembers: function(){
      return app.core.getMembers(this.data.fullPath);
    },
    expand: function(){
      if (basis.ui.tree.Folder.prototype.expand.call(this))
      {
        this.setChildNodes(this.getMembers());
        this.expand = basis.ui.tree.Folder.prototype.expand;
      }
    }
  });

 /**
  * @class
  */
  var DocTreeClassNode = DocTreeFolder.subclass({
    getMembers: function(){
      return [
        app.core.getMembers(this.data.fullPath + '.prototype'),
        app.core.getMembers(this.data.fullPath).map(function(item){ item.data.isClassMember = true; return item; })
      ].flatten();
    }
  });

 /**
  * @class
  */
  var DocTree = basis.ui.tree.Tree.subclass({
    childClass: DocBaseTreeFolder
  });

 /**
  * @class
  */
  var DocSearchTree = basis.ui.tree.Tree.subclass({
    childClass: DocSearchTreeNode,
    grouping: nodeTypeGrouping
  });


  //
  // map node type -> tree child class
  //

  var kindNodeClass = {
    'method':         DocTreeNode,
    'event':          DocTreeNode,
    'function':       DocTreeNode,
    'property':       DocTreeNode,
    'classMember':    DocTreeNode,
    'constant':       DocTreeNode,
    'htmlElement':    DocTreeNode,
    'constantObject': DocTreeFolder,
    'object':         DocTreeFolder,
    'namespace':      DocTreeFolder,
    'class':          DocTreeClassNode
  };


  //
  // export names
  //
  module.exports = {
    DocTree: DocTree,
    DocSearchTree: DocSearchTree,
    DocTreeClassNode: DocTreeClassNode
  };
