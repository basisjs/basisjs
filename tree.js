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
    * {Basis.Controls.Tree.TreeGroupControl} and
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

    var Template = Basis.Html.Template;

    var cssClass = Basis.CSS.cssClass;
    var getter = Function.getter;

    var nsWrappers = DOM.Wrapper;

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
    var TreePartitionNode = Class(nsWrappers.HtmlPartitionNode, {
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
    var TreeGroupControl = Class(nsWrappers.HtmlGroupControl, {
      className: namespace + '.TreeGroupControl',
      childClass: TreePartitionNode
    });

   /**
    * Base child class for {Basis.Controls.Tree.Tree}
    * @class
    */
    var TreeNode = Class(nsWrappers.HtmlContainer, {
      className: namespace + '.TreeNode',

      canHaveChildren: false,
      //childFactory: null,

      // node behaviour handlers
      behaviour: {
        click: function(event){
          if (DOM(Event.sender(event)).isInside(this.tmpl.title || this.tmpl.element))
            this.select(Event(event).ctrlKey);
        },
        update: function(node, delta){
          this.inherit(node, delta);

          // set new title
          var title = String(this.titleGetter(this));
          this.tmpl.titleText.data = title || '[no title]';
        }
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
      groupControlClass: TreeGroupControl,

      behaviour: {
        click: function(event){
          if (this.expander && DOM(Event.sender(event)).isInside(this.tmpl.expander))
            this.toggle();
          else
            this.inherit(event);
        },
        expand: function(){
          cssClass(this.tmpl.element).remove('collapsed');
          DOM.display(this.tmpl.childNodesElement, true);
        },
        collapse: function(){
          DOM.display(this.tmpl.childNodesElement, false);
          cssClass(this.tmpl.element).add('collapsed');
        }
      },

     /**
      * Template for node element. 
      * @type {Basis.Html.Template}
      * @private
      */
      template: new Template(
        '<li{element} class="Basis-Tree-Folder">' + 
          '<div{content|selectedElement} class="Tree-Node-Title Tree-Folder-Content">' + 
            '<div{expander} class="Basis-Tree-Expander"/>' + 
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
        this.inherit(config);

        if (config)
        {
          // can this node collapse
          if ('collapsable' in config)
            this.collapsable = !!config.collapsable;

          // collapse node
          if ('collapsed' in config)
            this.collapsed = !!config.collapsed;
        }

        if (this.collapsed && this.collapsable)
          this.dispatch('collapse');
      },

     /**
      * Makes child nodes visible.
      * @return {boolean} Returns true if node was expanded.
      */
      expand: function(){
        if (this.collapsed)
        {
          this.collapsed = false;
          this.dispatch('expand');
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
          this.dispatch('collapse');
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
    var Tree = Class(nsWrappers.Control, {
      className: namespace + '.Tree',

      childClass: TreeNode,
      groupControlClass: TreeGroupControl,

      //childFactory: treeChildFactory,

     /**
      * Template for node element. 
      * @type {Basis.Html.Template}
      * @private
      */
      template: new Template(
        '<div{element} class="Basis-Tree">' + 
          '<ul{content|childNodesElement|disabledElement} class="Basis-Tree-Root"></ul>' + 
        '</div>'
      ),

     /**
      * @param {Object} config
      * @config {function()} childClass
      * @constructor
      */
      init: function(config){
        // inherit
        this.inherit(config);

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
      TreeGroupControl: TreeGroupControl,
      TreePartitionNode: TreePartitionNode
    });

  })();
