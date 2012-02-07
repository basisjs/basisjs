/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.html');

!function(basis){

  'use strict';

 /**
  * Classes:
  *   {basis.ui.Node}, {basis.ui.Container}, 
  *   {basis.ui.PartitionNode}, {basis.ui.GroupingNode},
  *   {basis.ui.Control}
  *
  * @namespace basis.ui
  */

  var namespace = 'basis.ui';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var Template = basis.html.Template;
  var classList = basis.cssom.classList;
  var getter = Function.getter;
  var Cleaner = basis.Cleaner;

  var DWNode = basis.dom.wrapper.Node;
  var DWPartitionNode = basis.dom.wrapper.PartitionNode;
  var DWGroupingNode = basis.dom.wrapper.GroupingNode;

  //
  // main part
  //

 /**
  *
  */
  var TEMPLATE_ACTION = Class.ExtensibleProperty();

 /**
  * @mixin
  */
  var TemplateMixin = function(super_){
    return {
     /**
      * Template for object.
      * @type {basis.Html.Template}
      */
      template: new Template( // NOTE: explicit template constructor here;
        '<div/>'              //       it could be ommited in subclasses
      ),

     /**
      * Contains references to template nodes.
      * @type {Object}
      */
      tmpl: null,

     /**
      * Handlers for template actions.
      * @type {Object}
      */
      action: TEMPLATE_ACTION,

     /**
      * @type
      */
      id: null,

     /**
      * Classes for template elements.
      * @type {object}
      */
      cssClassName: null,

     /**
      * @inheritDoc
      */
      listen: {
        satellite: {
          ownerChanged: function(satellite, oldOwner){
            if (oldOwner)
            {
              if (satellite.ownerReplacedNode_)
              {
                DOM.replace(satellite.element, satellite.ownerReplacedNode_);
                satellite.ownerReplacedNode_ = null;
              }
            }
          },
          destroy: function(satellite){
            if (satellite.ownerReplacedNode_)
            {
              DOM.replace(satellite.element, satellite.ownerReplacedNode_);
              satellite.ownerReplacedNode_ = null;
            }
          }          
        }
      },

     /**
      * @inheritDoc
      */
      event_satelliteChanged: function(node, key, oldSatellite){
        super_.event_satelliteChanged.call(this, node, key, oldSatellite);

        var satellite = this.satellite[key];

        if (satellite)
        {
          if (satellite instanceof Node && satellite.element)
          {
            var config = this.satelliteConfig && this.satelliteConfig[key];
            var replaceElement = this.tmpl[(config && config.replace) || key];
            if (replaceElement)
            {
              DOM.replace(satellite.ownerReplacedNode_ = replaceElement, satellite.element);
              //satellite.addHandler(SATELLITE_DESTROY_HANDLER, replaceElement);
            }
          }
        }
      },

     /**
      * @inheritDoc
      */
      event_update: function(object, delta){
        this.templateUpdate(this.tmpl, 'update', delta);

        super_.event_update.call(this, object, delta);
      },

     /**
      * @inheritDoc
      */
      event_select: function(node){
        super_.event_select.call(this, node);

        classList(this.tmpl.selected || this.tmpl.content || this.element).add('selected');
      },

     /**
      * @inheritDoc
      */
      event_unselect: function(node){
        super_.event_unselect.call(this, node);

        classList(this.tmpl.selected || this.tmpl.content || this.element).remove('selected');
      },

     /**
      * @inheritDoc
      */
      event_disable: function(node){
        super_.event_disable.call(this, node);

        classList(this.tmpl.disabled || this.element).add('disabled');
      },

     /**
      * @inheritDoc
      */
      event_enable: function(node){
        super_.event_enable.call(this, node);

        classList(this.tmpl.disabled || this.element).remove('disabled');
      },

     /**
      * @inheritDoc
      */
      event_match: function(node){
        super_.event_match.call(this, node);

        DOM.display(this.element, true);
      },

     /**
      * @inheritDoc
      */
      event_unmatch: function(node){
        super_.event_unmatch.call(this, node);

        DOM.display(this.element, false);
      },

     /**
      * @inheritDoc
      */
      init: function(config){

        // create dom fragment by template
        var tmpl = {};

        if (this.template)
        {
          this.template.createInstance(tmpl, this);

          if (tmpl.childNodesHere)
          {
            tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
            tmpl.childNodesElement.insertPoint = tmpl.childNodesHere;
          }

          // insert content
          if (this.content)
          {
            DOM.insert(tmpl.content || tmpl.element, this.content);
            this.content = null;
          }
        }
        else
          tmpl.element = DOM.createElement();

        // make shortcuts
        this.tmpl = tmpl;
        this.element = tmpl.element;
        this.childNodesElement = tmpl.childNodesElement || tmpl.element;

        // inherit init
        super_.init.call(this, config);

        // update template
        if (this.id)
          tmpl.element.id = this.id;

        var cssClassNames = this.cssClassName;
        if (cssClassNames)
        {
          if (typeof cssClassNames == 'string')
            cssClassNames = { element: cssClassNames };

          for (var alias in cssClassNames)
          {
            var node = tmpl[alias];
            if (node)
            {
              var nodeClassName = classList(node);
              var names = String(cssClassNames[alias]).qw();
              for (var i = 0, name; name = names[i++];)
                nodeClassName.add(name);
            }
          }
        }

        this.templateUpdate(tmpl);

        if (this.container)
        {
          DOM.insert(this.container, tmpl.element);
          this.container = null;
        }
      },

     /**
      * Handler on template actions.
      * @param {string} actionName
      * @param {object} event
      */
      templateAction: function(actionName, event){
        var action = this.action[actionName];

        if (action)
          action.call(this, event);
      },

     /**
      * Template update function. It calls on init and on update event by default.
      * @param {Object} tmpl
      * @param {string} eventName
      * @param {Object} delta
      */
      templateUpdate: function(tmpl, eventName, delta){
        /** nothing to do, override it in sub classes */
      },

     /**
      * @inheritDoc
      */
      destroy: function(){
        var element = this.element;

        super_.destroy.call(this);

        var parentNode = element && element.parentNode;
        if (parentNode && parentNode.nodeType == DOM.ELEMENT_NODE)
          parentNode.removeChild(element);

        if (this.template)
          this.template.clearInstance(this.tmpl, this);

        this.tmpl = null;
        this.element = null;
        this.childNodesElement = null;
      }
    }
  };

 /**
  * Template mixin for containers classes
  * @mixin
  */
  var ContainerTemplateMixin = function(super_){
    return {
      // methods
      insertBefore: function(newChild, refChild){
        // inherit
        var newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var container = target.childNodesElement || target.element || this.childNodesElement || this.element;

        var nextSibling = newChild.nextSibling;
        //var insertPoint = nextSibling && (target == this || nextSibling.groupNode === target) ? nextSibling.element : null;
        var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;

        var element = newChild.element;
        var refNode = insertPoint || container.insertPoint || null;

        if (element.parentNode !== container || element.nextSibling !== refNode) // prevent dom update
          container.insertBefore(element, refNode); // NOTE: null at the end for IE
          
        return newChild;
      },
      removeChild: function(oldChild){
        // inherit
        super_.removeChild.call(this, oldChild);

        // remove from dom
        var element = oldChild.element;
        var parent = element.parentNode;

        if (parent)
          parent.removeChild(element);

        return oldChild;
      },
      clear: function(alive){
        // if not alive mode node element will be removed on node destroy
        if (alive)
        {
          var node = this.firstChild;
          while (node)
          {
            var element = node.element;
            var parent = element.parentNode;

            if (parent)
              parent.removeChild(element);

            node = node.nextSibling;
          }
        }

        // inherit
        super_.clear.call(this, alive);
      },
      setChildNodes: function(childNodes, keepAlive){
        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.grouping || this;
        var container = target.childNodesElement || target.element;
        target.childNodesElement = domFragment;

        // call inherited method
        // NOTE: make sure that dispatching childNodesModified event handlers are not sensetive
        // for child node positions at real DOM (html document), because all new child nodes
        // will be inserted into temporary DocumentFragment that will be inserted into html document
        // later (after inherited method call)
        super_.setChildNodes.call(this, childNodes, keepAlive);

        // restore childNodesElement
        container.insertBefore(domFragment, container.insertPoint || null); // NOTE: null at the end for IE
        target.childNodesElement = container;
      }
    }
  };

 /**
  * @class
  */
  var PartitionNode = Class(DWPartitionNode, TemplateMixin, {
    className: namespace + '.PartitionNode',

    titleGetter: getter('data.title'),

    /*template: new Template(
      '<div{element} class="Basis-PartitionNode">' + 
        '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
        '<div{content|childNodesElement} class="Basis-PartitionNode-Content"/>' + 
      '</div>'
    ),*/

    templateUpdate: function(tmpl, eventName, delta){
      if (tmpl.titleText)
        tmpl.titleText.nodeValue = String(this.titleGetter(this));
    }
  });


 /**
  * @class
  */
  var GroupingNode = Class(DWGroupingNode, ContainerTemplateMixin, {
    className: namespace + '.GroupingNode',

   /**
    * @inheritDoc
    */
    childClass: PartitionNode,

   /**
    * @inheritDoc
    */
    groupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    event_ownerChanged: function(node, oldOwner){
      var cursor = this;
      var owner = this.owner;
      var element = null;//this.nullElement;

      if (owner)
      {
        element = (owner.tmpl && owner.tmpl.groupsElement) || owner.childNodesElement || owner.element;
        element.appendChild(this.nullElement);
      }

      do
      {
        cursor.element = cursor.childNodesElement = element;
      }
      while (cursor = cursor.grouping);

      DWGroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

    init: function(config){
      this.nullElement = DOM.createFragment();
      this.element = this.childNodesElement = this.nullElement;
      DWGroupingNode.prototype.init.call(this, config);
    }
  });


 /**
  * @class
  */
  var Node = Class(DWNode, TemplateMixin, {
    className: namespace + '.Node',

    childClass: null
  });


 /**
  * @class
  */
  var Container = Class(Node, ContainerTemplateMixin, {
    className: namespace + '.Container',

    childClass: Node,//Class.SELF,
    childFactory: function(config){
      return new this.childClass(config);
    },

    groupingClass: GroupingNode
  });

 /**
  * @class
  */
  var Control = Class(Container, {
    className: namespace + '.Control',

   /**
    * Create selection by default with empty config.
    */
    selection: true,

   /**
    * @inheritDoc
    */
    init: function(config){
      // inherit
      Container.prototype.init.call(this, config);
                   
      // add to basis.Cleaner
      Cleaner.add(this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // inherit destroy, must be calling after inner objects destroyed
      Container.prototype.destroy.call(this);

      // remove from Cleaner
      Cleaner.remove(this);
    }
  });


 /**
  * @func
  */
  var simpleTemplate = function(template, config){
    var refs = template.match(/\{(this_[^\}]+)\}/g) || [];
    var lines = [];
    for (var i = 0; i < refs.length; i++)
    {
      var name = refs[i].match(/\{(this_[^\|\}]+)\}/)[1];
      lines.push('this.tmpl.' + name + '.nodeValue = ' + name.replace(/_/g, '.'));
    }
    
    return Function('tmpl_', 'config_', 'return ' + (function(super_){
      return Object.extend({
        template: tmpl_,
        templateUpdate: function(tmpl, eventName, delta){
          super_.templateUpdate.call(this, tmpl, eventName, delta);
          _code_();
        }
      }, config_);
    }).toString().replace('_code_()', lines.join(';\n')))(new Template(template), config);
  };


  //
  // export names
  //

  basis.namespace(namespace, simpleTemplate).extend({
    simpleTemplate: simpleTemplate,

    Node: Node,
    Container: Container,
    PartitionNode: PartitionNode,
    GroupingNode: GroupingNode,
    Control: Control
  });

}(basis);