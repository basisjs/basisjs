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

    var Class = Basis.Class.createHP;
    var Event = Basis.Event;
    var DOM = Basis.DOM;

    var cssClass = Basis.CSS.cssClass;
    var getter = Function.getter;

    var nsWrappers = DOM.Wrapper;

    var Template = Basis.Html.Template;
    var TmplContainer = nsWrappers.TmplContainer;
    var Control = nsWrappers.Control;

    var createEvent = Basis.EventObject.createEvent;
    var basisEvent = Basis.EventObject.event;

    createEvent('collapse');
    createEvent('expand');

   /**
    * Expand all descendant nodes.
    */
    function expandAll(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, 'expand()');    
    }

   /**
    * Collapse all descendant nodes.
    */
    function collapseAll(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, 'collapse()');
    }

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
      template: new Template(
        '<li{element} class="Basis-Tree-NodeGroup">' + 
          '<div class="Basis-Tree-NodeGroup-Title"><span>{titleText}</span></div>' +
          '<ul{childNodesElement} class="Basis-Tree-NodeGroup-Content"/>' +
        '</li>'
      )
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
    var TreeNode = Class(TmplContainer, {
      className: namespace + '.TreeNode',

      canHaveChildren: false,
      //childFactory: null,

      event_update: function(object, delta){
        TmplContainer.prototype.event_update.call(this, object, delta);

        // set new title
        var title = String(this.titleGetter(this));
        this.tmpl.titleText.nodeValue = title || '[no title]';
      },

     /**
      * Template for node element. 
      * @type {Basis.Html.Template}
      * @private
      */
      template: new Template(
        '<li{element} class="Basis-Tree-Node">' +
          '<div{content|selectedElement} class="Tree-Node-Title Tree-Node-Content">' +
            '<a{title} href="#">{titleText|[no title]}</a>' +
          '</div>' +
        '</li>'
      ),

      dispatchEvent: function(eventName, event){
        if (eventName == 'click' && DOM.isInside(Event.sender(event), this.tmpl.title || this.element) && !this.isDisabled())
          this.select(Event(event).ctrlKey);
      },

     /**
      * @type {function()}
      */
      titleGetter: getter('info.title'),

      // there are abstract methods, implemented for capability with TreeFolder
      expand: Function.$undef,
      expandAll: expandAll,
      collapse: Function.$undef,
      collapseAll: collapseAll

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
        basisEvent.expand.call(this);

        cssClass(this.element).remove('collapsed');
        DOM.display(this.childNodesElement, true);
      },
      event_collapse: function(){
        basisEvent.collapse.call(this);

        DOM.display(this.childNodesElement, false);
        cssClass(this.element).add('collapsed');
      },

     /**
      * Template for node element. 
      * @type {Basis.Html.Template}
      * @private
      */
      template: new Template(
        '<li{element} class="Basis-Tree-Folder" event:click="click">' +
          '<div{content|selectedElement} class="Tree-Node-Title Tree-Folder-Content">' +
            '<div{expander} class="Basis-Tree-Expander" event:click="toggle"/>' +
            '<a{title} href="#">{titleText|[no title]}</a>' + 
          '</div>' + 
          '<ul{childNodesElement}/>' + 
        '</li>'
      ),

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

      dispatchEvent: function(eventName, event){
        if (eventName == 'click' && this.tmpl.expander && DOM.isInside(Event.sender(event), this.tmpl.expander))
          this.toggle();
        else
          TreeNode.prototype.dispatchEvent.call(this, eventName, event);
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
    var Tree = Class(Control, {
      className: namespace + '.Tree',

      childClass: TreeNode,
      localGroupingClass: TreeGroupingNode,

      //childFactory: treeChildFactory,

     /**
      * Template for node element. 
      * @type {Basis.Html.Template}
      * @private
      */
      template: new Template(
        '<div{element} class="Basis-Tree">' + 
          '<ul{childNodesElement|content|disabledElement} class="Basis-Tree-Root"></ul>' + 
        '</div>'
      ),

     /**
      * @param {Object} config
      * @config {function()} childClass
      * @constructor
      */
      init: function(config){
        // inherit
        Control.prototype.init.call(this, config);

        // attach event handlers
        this.addEventListener('click');
        this.addEventListener('dblclick');
      },

     /**
      * Expand all descendant nodes.
      */
      expandAll: expandAll,

     /**
      * Collapse all descendant nodes.
      */
      collapseAll: collapseAll,

      expand: Function.$undef,
      collapse: Function.$undef
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
