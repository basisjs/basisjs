/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
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
    * Most part of component logic implemented in {Basis.DOM.Wrapers} namespace,
    * and this one just contains templates and collapse/expand implementation.
    *
    * @link ./test/speed-tree.html
    * @link ./demo/simple/tree.html
    * @link ./demo/entity/basic.html
    *
    * @namespace Basis.Controls.Tree
    */

    var namespace = 'Basis.Controls.Tree';
    
    // import names

    var Class = Basis.Class;
    var Event = Basis.Event;
    var Data = Basis.Data;
    var DOM = Basis.DOM;

    var Template = Basis.Html.Template;
    var cssClass = Basis.CSS.cssClass;

    var nsWrapers = DOM.Wrapers;

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
    * @class
    */
    var TreePartitionNode = Class(nsWrapers.HtmlPartitionNode, {
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
    var TreeGroupControl = Class(nsWrapers.HtmlGroupControl, {
      className: namespace + '.TreeGroupControl',
      childClass: TreePartitionNode
    });

   /**
    * Base child class for {Basis.Controls.Tree.Tree}
    * @class
    * @extends {Basis.DOM.Wrapers.HtmlNode}
    */
    var TreeNode = Class(nsWrapers.HtmlNode, {
      className: namespace + '.TreeNode',

      canHaveChildren: false,

      // node behaviour handlers
      behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
        click: function(event){
          if (DOM(Event.sender(event)).isInside(this.title || this.element))
            this.select(Event(event).ctrlKey);
        },
        update: function(node, newInfo, oldInfo, delta){
          this.inherit(node, newInfo, oldInfo, delta);

          var title = this.titleGetter(this);
          if (title !== this._title)
          {
            this._title = title;

            // check out a title value
            var isText = title != null && title != '';
            
            // set new title
            this.titleText.nodeValue = isText ? title : '[no title]';

            // update alt
            if (this.altTitle)
              DOM.setAttribute(this.content, 'title', isText ? title : null);
          }
        }
      }),

     /**
      * Template for node element. 
      * @property {Basis.Html.Template} template
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
      * @property {boolean} altTitle
      */
      altTitle: true,

     /**
      * @property {function()} titleGetter
      */
      titleGetter: Data('info.title'),

      /* no custom constructor */

      // there are abstract methods, implemented for capability with TreeFolder
      expand: Function.$undef,
      expandAll: expandAll,
      collapse: Function.$undef,
      collapseAll: collapseAll

      /* no custom destructor */

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

      behaviour: nsWrapers.createBehaviour(TreeNode, {
        //dblclick: function(){ this.toggle() },
        click: function(event){
          if (this.expander && DOM(Event.sender(event)).isInside(this.expander))
            this.toggle();
          else
            this.inherit(event);
        },
        expand: function(){
          cssClass(this.element).remove('collapsed');
          DOM.display(this.childNodesElement, true);
        },
        collapse: function(){
          DOM.display(this.childNodesElement, false);
          cssClass(this.element).add('collapsed');
        }
      }),

     /**
      * Template for node element. 
      * @property {Basis.Html.Template} template
      * @private
      */
      template: new Template(
        '<li{element} class="Basis-Tree-Folder">' + 
          '<div{content|selectedElement} class="Tree-Node-Title Tree-Folder-Content">' + 
            '<div{expander} class="Basis-Tree-Expander"></div>' + 
            '<a{title} href="#">{titleText|[no title]}</a>' + 
          '</div>' + 
          '<ul{childNodesElement}></ul>' + 
        '</li>'
      ),

     /**
      * @property {boolean} canCollapse
      */
      canCollapse: true,

     /**
      * @property {boolean} collapsed
      */
      collapsed: false,

     /**
      * @param {Object} config
      * @config {boolean} canCollapse
      * @config {boolean} collapsed
      * @return {Object} Returns a config.
      * @constructor
      */
      init: function(config){
        config = this.inherit(config);

        // can this node collapse
        if ('canCollapse' in config)
          this.canCollapse = !!config.canCollapse;

        // collapse node
        // using this statements instead of this.collapse() is decrease node create time
        if ('collapsed' in config)
          this.collapsed = !!config.collapsed;

        if (this.collapsed && this.canCollapse)
          this.dispatch('collapse');

        return config;
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
        if (!this.collapsed && this.canCollapse)
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

      /* no custom destructor */

    });

   /**
    * @class
    * @extends {Basis.DOM.Wrapers.Control}
    */
    var Tree = Class(nsWrapers.Control, {
      className: namespace + '.Tree',

      childClass: TreeNode,
      groupControlClass: TreeGroupControl,

     /**
      * Template for node element. 
      * @property {Basis.Html.Template} template
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
      * @return {Object} Returns a config.
      * @constructor
      */
      init: function(config){
        if (config instanceof Object)
        {
          // childClass
          if (typeof config.childClass == 'function')
            this.childClass = config.childClass;
        }

        // inherit
        config = this.inherit(config);

        // attach event handlers
        this.addEventListener('click');
        this.addEventListener('dblclick');

        return config;
      },
     /**
      * Expand all descendant nodes.
      * @method expandAll
      */
      expandAll: expandAll,

     /**
      * Collapse all descendant nodes.
      * @method collapseAll
      */
      collapseAll: collapseAll

      /* no custom destructor */

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
