
  (function(){

    // namespace

    var namespace = 'BasisDoc.Nav';

    //
    // import names
    //

    var Class = Basis.Class;
    var DOM = Basis.DOM;

    var cssClass = Basis.CSS.cssClass;

    var nsWrapers = Basis.DOM.Wrapers;
    var nsTree = Basis.Controls.Tree;
    var nsCore = BasisDoc.Core;
    var nsView = BasisDoc.View;

    //
    // Maps
    //

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

    var nodeTypeGrouping = {
      groupGetter: function(node){
        return node.info.isClassMember ? 'ClassMember' : kindNodeType[node.info.kind];
      },
      titleGetter: Function.getter('info.id', groupTitle),
      localSorting: Function.getter('info.id', groupWeight)
    };

    //
    // Base navigation tree child node classes
    //

    //
    // Nodes
    //

   /**
    * @class
    */
    var baseTreeNode = Class(nsTree.TreeNode, {
      nodeType: 'baseTreeNode',
      altTitle: false,
      init: function(config){
        nsTree.TreeNode.prototype.init.call(this, config);

        this.tmpl.title.href = '#' + this.info.objPath;
        this.tmpl.content.className += ' ' + this.nodeType + '-Content';
      }
    });

   /**
    * @class
    */
    var docFunction = Class(baseTreeNode, {
      nodeType: 'Function',
      views: [
        nsView.viewSourceCode
      ],

      template: new Basis.Html.Template(
        baseTreeNode.prototype.template.source.replace('</span>', '<span class="args">({argsText})</span></span>')
      ),

      init: function(config){
        baseTreeNode.prototype.init.call(this, config);
        this.tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.info.obj).args;
      }
    });

   /**
    * @class
    */
    var docMethod = Class(docFunction, {
      nodeType: 'Method',
      views: [
        nsView.viewInheritance,
        nsView.viewSourceCode
      ]
    });


   /**
    * @class
    */
    var docProperty = Class(baseTreeNode, {
      nodeType: 'Property',
      views: [
        nsView.viewInheritance
      ]
    });

   /**
    * @class
    */
    var docClassMember = Class(baseTreeNode, {
      nodeType: 'ClassMember'
    });

   /**
    * @class
    */
    var docConstant = Class(baseTreeNode, {
      nodeType: 'Constant'
    });

   /**
    * @class
    */
    var docHtmlElement = Class(baseTreeNode, {
      nodeType: 'HtmlElement'
    });


    //
    // Folders
    //

   /**
    * @class
    */
    var baseTreeFolder = Class(nsTree.TreeFolder, {
      nodeType: 'baseTreeFolder',

      collapsed: true,

      childFactory: function(config){
        var childClass = kindNodeClass[config.info.kind];
        return new childClass(config);
      },
      localSorting: function(node){
        return groupWeight[node.nodeType] + '-' + node.info.title
      },
      localGrouping: nodeTypeGrouping,

      init: function(config){
        baseTreeNode.prototype.init.call(this, config);
        if (this.collapsed)
          this.event_collapse();
      },

      getMembers: Function.$null,
      expand: function(){
        if (nsTree.TreeFolder.prototype.expand.call(this))
        {
          DOM.insert(this, this.getMembers());
          this.expand = nsTree.TreeFolder.prototype.expand;
        }
      }
    });

   /**
    * @class
    */
    var docSection = Class(baseTreeFolder, {
      nodeType: 'Section',
      collapsed: false,
      selectable: false,
      localGrouping: null
    });

   /**
    * @class
    */
    var docNamespace = Class(baseTreeFolder, {
      nodeType: 'Namespace',
      getMembers: function(){
        return nsCore.getMembers(this.info.objPath);
      }
    });

   /**
    * @class
    */
    var docClass = Class(baseTreeFolder, {
      nodeType: 'Class',

      template: new Basis.Html.Template(
        baseTreeFolder.prototype.template.source.replace('</span>', '<span class="args">({argsText})</span></span>')
      ),

      views: [
        nsView.viewInheritance,
        nsView.viewTemplate,
        nsView.viewConstructor,
        nsView.viewConfig,
        nsView.viewPrototype
      ],
      init: function(config){
        baseTreeFolder.prototype.init.call(this, config);
        this.tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.info.obj).args;
      },
      getMembers: function(){
        return [
                 nsCore.getMembers(this.info.objPath + '.prototype'),
                 nsCore.getMembers(this.info.objPath)
               ].flatten();
      }
    });

   /**
    * @class
    */
    var docObject = Class(baseTreeFolder, {
      nodeType: 'Object',
      getMembers: function(){
        return nsCore.getMembers(this.info.objPath);
      }
    });

    //
    // map node type -> tree child class
    //

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


    //
    // export names
    //

    Basis.namespace(namespace).extend({
      nodeTypeGrouping: nodeTypeGrouping,
      docClass: docClass,
      docNamespace: docNamespace,
      docSection: docSection
    });

  })();
