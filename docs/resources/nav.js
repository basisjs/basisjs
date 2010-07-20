(function(){

  var namespace = 'BasisDoc.Nav';

  var Class = Basis.Class;
  var Data = Basis.Data;
  var DOM = Basis.DOM;

  var cssClass = Basis.CSS.cssClass;

  var nsWrapers = Basis.DOM.Wrapers;
  var nsTree = Basis.Controls.Tree;
  var nsCore = BasisDoc.Core;
  var nsView = BasisDoc.View;

  var groupTitle = {
    Namespace: 'Namespaces',
    Method: 'Methods',
    Function: 'Functions',
    Property: 'Properties',
    Constant: 'Constants',
    Class: 'Classes',
    Object: 'Objects',
    HtmlElement: 'DOM elements',
    ClassMember: 'Class members'
  };
  var kindNodeType = {
    'namespace': 'Namespace',
    'method': 'Method',
    'function': 'Function',
    'property': 'Property',
    'classMember': 'ClassMember',
    'constant': 'Constant',
    'htmlElement': 'HtmlElement',
    'class': 'Class',
    'object': 'Object'
  };

  var groupWeight = {
    Namespace: 0,
    ClassMember: 1,
    Constant: 2,
    Class: 3,
    Object: 4,
    HtmlElement: 5,
    Property: 5.1,
    Method: 6,
    Function: 6
  };

  var baseTreeNode = Class.create(nsTree.TreeNode, {
    nodeType: 'baseTreeNode',
    behaviour: nsWrapers.createBehaviour(nsTree.TreeNode, {
      update: function(object, newInfo, oldInfo, delta){
        this.inherit(object, newInfo, oldInfo, delta);
        this.title.href = '#' + this.info.objPath;
        cssClass(this.content).add(this.nodeType + '-Content');
      }
    }),
    altTitle: false,
    localSorting: Data('info.title')
  });

  var docMethod = Class.create(baseTreeNode, {
    nodeType: 'Method',
    views: [nsView.viewInheritance, nsView.viewSourceCode],
    init: function(config){
      config = this.inherit(config);
      
      DOM.insert(this.title, DOM.createElement('SPAN.args', nsCore.getFunctionDescription(this.info.obj).args.quote('(')));

      return config;
    }
  });

  var docFunction = Class.create(baseTreeNode, {
    nodeType: 'Function',
    views: [nsView.viewSourceCode],
    init: function(config){
      config = this.inherit(config);
      
      DOM.insert(this.title, DOM.createElement('SPAN.args', nsCore.getFunctionDescription(this.info.obj).args.quote('(')));

      return config;
    }
  });

  var docProperty = Class.create(baseTreeNode, {
    nodeType: 'Property',
    views: [nsView.viewInheritance]
  });

  var docClassMember = Class.create(baseTreeNode, {
    nodeType: 'ClassMember'
  });

  var docConstant = Class.create(baseTreeNode, {
    nodeType: 'Constant'
  });

  var docHtmlElement = Class.create(baseTreeNode, {
    nodeType: 'HtmlElement'
  });

  var baseTreeFolder = Class.create(nsTree.TreeFolder, {
    nodeType: 'baseTreeFolder',
    behaviour: nsWrapers.createBehaviour(nsTree.TreeFolder, {
      update: function(object, newInfo, oldInfo, delta){
        this.inherit(object, newInfo, oldInfo, delta);
        this.title.href = '#' + this.info.objPath;
        cssClass(this.content).add(this.nodeType + '-Content');
      }
    }),

    localSorting: function(node){ return groupWeight[node.nodeType] + '-' + node.info.title },

    collapsed: true,

    inited: false,
    getMembers: Function.$null,
    expand: function(){
      if (this.inherit())
      {
        DOM.insert(this, this.getMembers());
        this.expand = this.inherit;
      }
    }
  });

  var docSection = Class.create(baseTreeFolder, {
    nodeType: 'Section',
    collapsed: false,
    selectable: false
  });

  var nodeTypeGrouping = {
    groupGetter: function(node){ return node.info.isClassMember ? 'ClassMember' : kindNodeType[node.info.kind] },
    titleGetter: Data('info.id', groupTitle),
    localSorting: Data('info.id', groupWeight)
  };
  var docNamespace = Class.create(baseTreeFolder, {
    nodeType: 'Namespace',
    childFactory: function(config){
      var childClass = kindNodeClass[config.info.kind];
      return new childClass(config);
    },
    localGrouping: nodeTypeGrouping,
    getMembers: function(){
      return nsCore.getMembers(this.info.objPath);
    }
  });

  var docClass = Class.create(baseTreeFolder, {
    nodeType: 'Class',
    views: [nsView.viewInheritance, nsView.viewTemplate, nsView.viewConstructor, nsView.viewConfig, nsView.viewPrototype],
    childFactory: function(config){
      var childClass = kindNodeClass[config.info.kind];
      return new childClass(config);
    },
    localGrouping: nodeTypeGrouping,
    init: function(config){
      config = this.inherit(config);
      
      DOM.insert(this.title, DOM.createElement('SPAN.args', nsCore.getFunctionDescription(this.info.obj).args.quote('(')));

      return config;
    },
    getMembers: function(){
      return nsCore.getMembers(this.info.objPath + '.prototype')
             .concat(nsCore.getMembers(this.info.objPath));
    }
  });

  var docObject = Class.create(baseTreeFolder, {
    nodeType: 'Object',
    childFactory: function(config){
      var childClass = kindNodeClass[config.info.kind];
      return new childClass(config);
    },
    localGrouping: nodeTypeGrouping,
    getMembers: function(){
      return nsCore.getMembers(this.info.objPath);
    }
  });

  var kindNodeClass = {
    'namespace': docNamespace,
    'method': docMethod,
    'function': docFunction,
    'property': docProperty,
    'classMember': docClassMember,
    'constant': docConstant,
    'htmlElement': docHtmlElement,
    'class': docClass,
    'object': docObject
  };

  Basis.namespace(namespace).extend({
    nodeTypeGrouping: nodeTypeGrouping,
    docClass: docClass,
    docNamespace: docNamespace,
    docSection: docSection
  });

})();