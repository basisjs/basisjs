
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.ui');
  basis.require('basis.template');


 /**
  * This namespace contains {basis.ui.tree.Tree} control class and it's
  * child nodes classes. There are two base child classes for tree
  * {basis.ui.tree.Node} and {basis.ui.tree.Folder}.
  *
  * The main difference between this classes is that
  * {basis.ui.tree.Node} has abstact {basis.ui.tree.Node#expand}
  * and {basis.ui.tree.Node#collapse} methods and can't be
  * collapsed/expanded, but {basis.ui.tree.Folder} can.
  *
  * Also this namespace has two additional classes for child nodes grouping
  * {basis.ui.tree.GroupingNode} and
  * {basis.ui.tree.PartitionNode}.
  *
  * Most part of component logic implemented in {basis.dom.wrapper} namespace,
  * and this one just contains templates and collapse/expand implementation.
  *
  * @see ./test/speed/tree.html
  * @see ./demo/data/entity.html
  *
  * @namespace basis.ui.tree
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var createEvent = basis.event.create;

  var UINode = basis.ui.Node;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Tree: resource('templates/tree/Tree.tmpl'),
    PartitionNode: resource('templates/tree/PartitionNode.tmpl'),
    Node: resource('templates/tree/Node.tmpl'),
    Folder: resource('templates/tree/Folder.tmpl')
  });


  //
  // main part
  //

  function expand(node){
    if (typeof node.expand == 'function')
      node.expand();
  }

  function collapse(node){
    if (typeof node.collapse == 'function')
      node.collapse();
  }

  var ExpandCollapseMixin = {
   /**
    * Expand all descendant nodes.
    */
    expandAll: function(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, expand);
    },

   /**
    * Collapse all descendant nodes.
    */
    collapseAll: function(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, collapse);
    },

    expand: function(){},
    collapse: function(){},
    toggle: function(){}
  };

 /**
  * Here is an example for tree recursive childFactory
  */
  /*function treeChildFactory(config){
    if (config.childNodes)
      return new Folder(basis.object.complete({ childFactory: this.childFactory }, config));
    else
      return new Node(config);
  }*/

 /**
  * @class
  */
  var PartitionNode = Class(UIPartitionNode, {
    className: namespace + '.PartitionNode',

    template: templates.PartitionNode
  });

 /**
  * @class
  */
  var GroupingNode = Class(UIGroupingNode, {
    className: namespace + '.GroupingNode',

    childClass: PartitionNode
  });

 /**
  * Base child class for {basis.ui.tree.Tree}
  * @class
  */
  var Node = Class(UINode, ExpandCollapseMixin, {
    className: namespace + '.Node',

   /**
    * @inheritDoc
    */
    childClass: null,

   /**
    * @inheritDoc
    */
    childFactory: null,

    emit_collapse: createEvent('collapse'),
    emit_expand: createEvent('expand'),

   /**
    * Template for node element.
    * @type {basis.template.Template}
    * @private
    */
    template: templates.Node,

    binding: {
      title: {
        events: 'update',
        getter: function(node){
          return node.data.title || '[no title]'
        }
      },
      collapsed: {
        events: 'expand collapse',
        getter: function(node){
          return node.collapsed ? 'collapsed' : '';
        }
      }
    },

   /**
    * @inheritDoc
    */
    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select(event.ctrlKey || event.metaKey);
      },
      toggle: function(){
        this.toggle();
      }
    }
  });

 /**
  * Base child class for {basis.ui.tree.Tree} that can has children.
  * @class
  * @extends {basis.ui.tree.Node}
  */
  var Folder = Class(Node, {
    className: namespace + '.Folder',

   /**
    * @inheritDoc
    */
    childClass: Node,

   /**
    * @inheritDoc
    */
    groupingClass: GroupingNode,

   /**
    * @inheritDoc
    */
    template: templates.Folder,

   /**
    * @type {boolean}
    */
    collapsible: true,

   /**
    * @type {boolean}
    */
    collapsed: false,

   /**
    * @constructor
    */
    init: function(){
      // inherit
      Node.prototype.init.call(this);

      if (this.collapsed && this.collapsible)
        this.emit_collapse();
    },

   /**
    * Makes child nodes visible.
    * @return {boolean} Returns true if node was expanded.
    */
    expand: function(){
      if (this.collapsed)
      {
        this.collapsed = false;
        this.emit_expand();

        return true;
      }
      return false;
    },

   /**
    * Makes child nodes invisible.
    * @return {boolean} Returns true if node was collpased.
    */
    collapse: function(){
      if (!this.collapsed && this.collapsible)
      {
        this.collapsed = true;
        this.emit_collapse();

        return true;
      }
      return false;
    },

   /**
    * Inverts node collapsed state. If node was collapsed expand it, otherwise collapse it.
    */
    toggle: function(){
      if (this.collapsed)
        this.expand();
      else
        this.collapse();
    }
  });


 /**
  * @class
  */
  var Tree = Class(UINode, ExpandCollapseMixin, {
    className: namespace + '.Tree',

   /**
    * @inheritDoc
    */
    selection: true,

   /**
    * Template for node element.
    * @type {basis.template.Template}
    * @private
    */
    template: templates.Tree,

   /**
    * @inheritDoc
    */
    childClass: Node,

   /**
    * @inheritDoc
    */
    groupingClass: GroupingNode
  });


  //
  // export names
  //

  module.exports = {
    Tree: Tree,
    Node: Node,
    Folder: Folder,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode
  };
