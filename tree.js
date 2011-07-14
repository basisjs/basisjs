/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

'use strict';

(function(){

 /**
  * This namespace contains {Basis.Controls.Tree.Tree} control class and it's
  * child nodes classes. There are two base child classes for tree
  * {Basis.Controls.Tree.TreeNode} and {Basis.Controls.Tree.TreeFolder}.
  *
  * The main difference between this classes is that
  * {Basis.Controls.Tree.TreeNode} has abstact {Basis.Controls.Tree.TreeNode#expand}
  * and {Basis.Controls.Tree.TreeNode#collapse} methods and can't be
  * collapsed/expanded, but {Basis.Controls.Tree.TreeFolder} can.
  *
  * Also this namespace has two additional classes for child nodes grouping
  * {Basis.Controls.Tree.TreeGroupingNode} and
  * {Basis.Controls.Tree.TreePartitionNode}.
  *
  * Most part of component logic implemented in {Basis.DOM.Wrapper} namespace,
  * and this one just contains templates and collapse/expand implementation.
  *
  * @link ./test/speed-tree.html
  * @link ./demo/simple/tree.html
  * @link ./demo/data/entity.html
  *
  * @namespace Basis.Controls.Tree
  */

  var namespace = 'Basis.Controls.Tree';
  
  // import names

  var Class = Basis.Class;
  var Event = Basis.Event;
  var DOM = Basis.DOM;

  var classList = Basis.CSS.classList;
  var getter = Function.getter;

  var nsWrappers = DOM.Wrapper;

  var TmplContainer = nsWrappers.TmplContainer;
  var Control = nsWrappers.Control;

  var createEvent = Basis.EventObject.createEvent;
  var basisEvent = Basis.EventObject.event;

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

    expand: Function(),
    collapse: Function(),
    toggle: Function()
  };

 /**
  * Here is an example for tree recursive childFactory
  */
  /*function treeChildFactory(config){
    if (config.childNodes)
      return new TreeFolder(Object.complete({ childFactory: this.childFactory }, config));
    else
      return new TreeNode(config);
  }*/

 /**
  * @class
  */
  var TreePartitionNode = Class(nsWrappers.TmplPartitionNode, {
    className: namespace + '.TreePartitionNode',
    template: 
      '<li{element} class="Basis-TreePartitionNode">' + 
        '<div class="Basis-TreePartitionNode-Title">' +
          '<span>{titleText}</span>' +
        '</div>' +
        '<ul{childNodesElement} class="Basis-TreePartitionNode-Content"/>' +
      '</li>'
  });

 /**
  * @class
  */
  var TreeGroupingNode = Class(nsWrappers.TmplGroupingNode, {
    className: namespace + '.TreeGroupingNode',
    childClass: TreePartitionNode
  });

 /**
  * Base child class for {Basis.Controls.Tree.Tree}
  * @class
  */
  var TreeNode = Class(TmplContainer, ExpandCollapseMixin, {
    className: namespace + '.TreeNode',

    canHaveChildren: false,
    childFactory: null,

    event_update: function(object, delta){
      TmplContainer.prototype.event_update.call(this, object, delta);

      // set new title
      this.tmpl.titleText.nodeValue = String(this.titleGetter(this)) || '[no title]';
    },

    event_collapse: createEvent('collapse'),
    event_expand: createEvent('expand'),

   /**
    * Template for node element. 
    * @type {Basis.Html.Template}
    * @private
    */
    template: 
      '<li{element} class="Basis-TreeNode">' +
        '<div{content} class="Basis-TreeNode-Title">' +
          '<span{title} class="Basis-TreeNode-Caption" event-click="select">' +
            '{titleText}' +
          '</span>' +
        '</div>' +
      '</li>',

   /**
    * @inheritDoc
    */
    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select(Event(event).ctrlKey);
      },
      toggle: function(event){
        this.toggle();
      }
    },

   /**
    * @type {function()}
    */
    titleGetter: getter('info.title')
  });

 /**
  * Base child class for {Basis.Controls.Tree.Tree} that can has children.
  * @class
  * @extends {Basis.Controls.Tree.TreeNode}
  */
  var TreeFolder = Class(TreeNode, {
    className: namespace + '.TreeFolder',

    canHaveChildren: true,
    childClass: TreeNode,
    localGroupingClass: TreeGroupingNode,

    event_expand: function(){
      TreeNode.prototype.event_expand.call(this);
      classList(this.element).remove('collapsed');
    },
    event_collapse: function(){
      TreeNode.prototype.event_collapse.call(this);
      classList(this.element).add('collapsed');
    },

   /**
    * Template for node element. 
    * @type {Basis.Html.Template}
    * @private
    */
    template: 
      '<li{element} class="Basis-TreeNode">' +
        '<div{content} class="Basis-TreeNode-Title Basis-TreeNode-CanHaveChildren">' +
          '<div{expander} class="Basis-TreeNode-Expander" event-click="toggle"/>' +
          '<span{title} class="Basis-TreeNode-Caption" event-click="select">' +
            '{titleText}' +
          '</span>' +
        '</div>' + 
        '<ul{childNodesElement} class="Basis-TreeNode-Content"/>' + 
      '</li>',

   /**
    * @type {boolean}
    */
    collapsable: true,

   /**
    * @type {boolean}
    */
    collapsed: false,

   /**
    * @param {Object} config
    * @config {boolean} collapsable
    * @config {boolean} collapsed
    * @constructor
    */
    init: function(config){
      // inherit
      TreeNode.prototype.init.call(this, config);

      if (this.collapsed && this.collapsable)
        this.event_collapse();
    },

   /**
    * Makes child nodes visible.
    * @return {boolean} Returns true if node was expanded.
    */
    expand: function(){
      if (this.collapsed)
      {
        this.collapsed = false;
        this.event_expand();
        return true;
      }
    },

   /**
    * Makes child nodes invisible.
    * @return {boolean} Returns true if node was collpased.
    */
    collapse: function(){
      if (!this.collapsed && this.collapsable)
      {
        this.collapsed = true;
        this.event_collapse();
        return true;
      }
    },

   /**
    * Inverts node collapsed state. If node was collapsed expand it, otherwise collapse it.
    */
    toggle: function(){
      this.collapsed ? this.expand() : this.collapse();
    }
  });

 /**
  * @class
  */
  var Tree = Class(Control, ExpandCollapseMixin, {
    className: namespace + '.Tree',

    childClass: TreeNode,
    localGroupingClass: TreeGroupingNode,

    //childFactory: treeChildFactory,

   /**
    * Template for node element. 
    * @type {Basis.Html.Template}
    * @private
    */
    template: '<ul class="Basis-Tree"/>'
  });

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    Tree: Tree,
    TreeNode: TreeNode,
    TreeFolder: TreeFolder,
    TreeGroupingNode: TreeGroupingNode,
    TreePartitionNode: TreePartitionNode
  });

})();
