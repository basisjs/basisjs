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

  'use strict';

  basis.require('basis.l10n');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.html');


 /**
  * Classes:
  *   {basis.ui.Node}, {basis.ui.Container}, 
  *   {basis.ui.PartitionNode}, {basis.ui.GroupingNode},
  *   {basis.ui.Control}
  *
  * @namespace basis.ui
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var DOM = basis.dom;
  var cssom = basis.cssom;

  var Cleaner = basis.Cleaner;
  var Template = basis.template.Template;
  var classList = basis.cssom.classList;
  var getter = Function.getter;
  var createEvent = basis.event.create;

  var DWNode = basis.dom.wrapper.Node;
  var DWPartitionNode = basis.dom.wrapper.PartitionNode;
  var DWGroupingNode = basis.dom.wrapper.GroupingNode;


  //
  // main part
  //

  //
  // Binding
  //

  var bindingSeed = 1;

 /**
  * Function that extends list of binding by extension.
  * @func
  */
  function extendBinding(binding, extension){
    binding.bindingId = bindingSeed++;
    for (var key in extension)
    {
      var def = null;
      var value = extension[key];

      if (!value)
        def = null
      else
      {
        value = BINDING_PRESET.process(key, value);

        if (typeof value != 'object')
          def = {
            getter: getter(value)
          };
        else
          if (Array.isArray(value))
            def = {
              getter: getter(value[0]),
              events: value[1]
            };
          else
          {
            def = {
              getter: getter(value.getter),
              l10n: !!value.l10n,
              l10nProxy: value.l10nProxy,
              events: value.events
            };
          }
      }

      def.update = function(node){
        return node.tmpl.set(key, this.getter(node));
      };

      binding[key] = def;
    }
  };

  // binding preset

  var BINDING_PRESET = (function(){
    var presets = {};
    var prefixRegExp = /^([a-z\_][a-z0-9\_]*)\:(.*)/i;

    return {
      add: function(prefix, func){
        if (!presets[prefix])
          presets[prefix] = func;

        /** @cut */else console.warn('Preset `' + prefix + '` already exists, new definition ignored');
      },
      process: function(key, value){
        var preset;

        if (typeof value == 'string')
        {
          var m = value.match(prefixRegExp);

          if (m)
          {
            preset = presets[m[1]];
            value = m[2] || key;
          }
        }

        return preset
          ? preset(value)
          : value;
      }
    }
  })();

  //
  // Default binding presets
  //

  BINDING_PRESET.add('data', function(path){
    return ['data.' + path, 'update'];
  });

  BINDING_PRESET.add('satellite', function(satelliteName){
    return {
      events: 'satelliteChanged',
      getter: function(node){
        return node.satellite[satelliteName]
          ? node.satellite[satelliteName].element
          : null;
      }
    };
  });

  BINDING_PRESET.add('l10n', function(token){
    return Function.$const(basis.l10n.getToken(token));
  });

  BINDING_PRESET.add('resource', function(url){
    return Function.$const(basis.resource(url));
  });


 /**
  * Base binding
  */
  var TEMPLATE_BINDING = Class.customExtendProperty({
    selected: {
      events: 'select unselect',
      getter: function(node){
        return node.selected ? 'selected' : '';
      }
    },
    unselected: {
      events: 'select unselect',
      getter: function(node){
        return node.selected ? '' : 'unselected';
      }
    },
    disabled: {
      events: 'disable enable',
      getter: function(node){
        return node.disabled || node.contextDisabled ? 'disabled' : '';
      }
    },
    enabled: {
      events: 'disable enable',
      getter: function(node){
        return node.disabled || node.contextDisabled ? '' : 'enabled';
      }
    },
    state: {
      events: 'stateChanged',
      getter: 'state'
    },
    childCount: {
      events: 'childNodesModified',
      getter: function(node){
        return node.childNodes ? node.childNodes.length : 0;
      }
    },
    hasChildren: {
      events: 'childNodesModified',
      getter: function(node){
        return !!node.firstChild ? 'hasChildren' : '';
      }
    },
    empty: {
      events: 'childNodesModified',
      getter: function(node){
        return !node.firstChild ? 'empty' : '';
      }
    }
  }, extendBinding);


 /**
  * Base action
  */
  var EMPTY_TEMPLATE_ACTION = Class.extensibleProperty();


 /**
  * Base template for TemplateMixin
  */
  var EMPTY_TEMPLATE = new Template('<div/>');


 /**
  * @mixin
  */
  var TemplateMixin = function(super_){
    return {
     /**
      * Template for object.
      * @type {basis.Html.Template}
      */
      template: EMPTY_TEMPLATE,   // NOTE: explicit template constructor here;
                                  // it could be ommited in subclasses

     /**
      * Contains references to template nodes.
      * @type {Object}
      */
      tmpl: null,

     /**
      * Handlers for template actions.
      * @type {Object}
      */
      action: EMPTY_TEMPLATE_ACTION,

     /**
      * @type {Object}
      */
      binding: TEMPLATE_BINDING,

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
      * Fires when template had changed.
      * @event
      */
      event_templateChanged: createEvent('templateChanged'),

     /**
      * Fires when template parse it source.
      * @event
      */
      event_templateUpdate: createEvent('templateUpdate'),

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
      event_match: function(node){
        super_.event_match.call(this, node);

        cssom.display(this.element, true);
      },

     /**
      * @inheritDoc
      */
      event_unmatch: function(node){
        super_.event_unmatch.call(this, node);

        cssom.display(this.element, false);
      },

     /**
      * @inheritDoc
      */
      init: function(config){
        // create dom fragment by template
        var template = this.template;
        if (template)
        {
          this.template = null;
          this.setTemplate(template);
        }

        // inherit init
        super_.init.call(this, config);
      },

     /**
      * 
      */
      postInit: function(){
        super_.postInit.call(this);

        if (this.template)
        {
          this.templateSync(true);

          if (this.container)
          {
            DOM.insert(this.container, this.element);
            this.container = null;
          }
        }
      },

      templateSync: function(noRecreate){
        var template = this.template;
        var binding = template.getBinding(this.binding, this) || null;
        var oldBinding = this.templateBinding_;
        var tmpl = this.tmpl;
        var oldElement = this.element;

        if (binding !== oldBinding)
        {
          if (oldBinding && oldBinding.handler)
            this.removeHandler(oldBinding.handler);

          if (!noRecreate)
          {
            if (this.tmpl)
              this.tmpl.destroy();
     
            tmpl = template.createInstance(this, this.templateAction, this.templateSync);

            if (tmpl.childNodesHere)
            {
              tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
              tmpl.childNodesElement.insertPoint = tmpl.childNodesHere;
            }

            this.tmpl = tmpl;
            this.element = tmpl.element;
            this.childNodesElement = tmpl.childNodesElement || tmpl.element;
          }

          // insert content
          if (this.content)
          {
            if (this.content instanceof basis.l10n.Token)
            {
              var token = this.content;
              var textNode = DOM.createText(token.value);
              var handler = function(value){ this.nodeValue = value };

              token.attach(handler, textNode);
              this.addHandler({
                destroy: function(){
                  token.detach(handler, textNode);
                }
              });

              DOM.insert(tmpl.content || tmpl.element, textNode)
            }
            else
              DOM.insert(tmpl.content || tmpl.element, this.content);
          }

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

          this.templateUpdate(this.tmpl);
          if (binding && binding.names.length)
          {
            if (binding.handler)
              this.addHandler(binding.handler);

            binding.sync.call(this);
          }

          for (var child = this.lastChild; child; child = child.previousSibling)
            this.insertBefore(child, child.nextSibling);

          if (oldElement && this.element && oldElement !== this.element)
          {
            var parentNode = oldElement && oldElement.parentNode;
            if (parentNode)
              parentNode.replaceChild(this.element, oldElement);

            // ??? fire event
            this.event_templateChanged(this);
          }

          this.templateBinding_ = binding;
        }
      },

     /**
      *
      */
      setTemplate: function(template){
        if (template instanceof Template == false)
          template = null;

        if (this.template !== template)
        {
          var tmpl;
          var oldTemplate = this.template;
          var oldElement = this.element;

          // drop old template
          if (oldTemplate)
          {
            oldTemplate.clearInstance(this.tmpl, this);

            var oldBinding = oldTemplate.getBinding(this.binding, this);
            if (oldBinding && oldBinding.handler)
              this.removeHandler(oldBinding.handler);

            this.templateBinding_ = null;
          }

          this.template = template;

          // set new template
          if (template)
          {
            tmpl = template.createInstance(this, this.templateAction, this.templateSync);

            if (tmpl.childNodesHere)
            {
              tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
              tmpl.childNodesElement.insertPoint = tmpl.childNodesHere;
            }

            this.tmpl = tmpl;
            this.element = tmpl.element;
            this.childNodesElement = tmpl.childNodesElement || tmpl.element;

            if (oldTemplate)
              this.templateSync(true);
          }
          else
          {
            this.tmpl = null;
            this.element = null;
            this.childNodesElement = null;
          }

          if (oldElement && !this.element)
          {
            var parentNode = oldElement && oldElement.parentNode;
            if (parentNode && parentNode.nodeType == DOM.ELEMENT_NODE)
              parentNode.removeChild(oldElement);
          }

          // ??? fire event
          //if (oldTemplate && template)
          //  this.event_templateChanged(this);
        }
      },

      updateBind: function(bindName){
        var binding = this.binding[bindName];
        var getter = binding && binding.getter;
        if (getter && this.tmpl)
          this.tmpl.set(bindName, getter(this));
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
        super_.destroy.call(this);

        this.setTemplate();
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
        var marker = this.domVersion_;

        // inherit
        newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var container = target.childNodesElement || target.element || this.childNodesElement || this.element;

        var nextSibling = newChild.nextSibling;
        //var insertPoint = nextSibling && (target == this || nextSibling.groupNode === target) ? nextSibling.element : null;
        var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;

        var element = newChild.element;
        var refNode = insertPoint || container.insertPoint || null;

        if (element.parentNode !== container || (element.nextSibling !== refNode/* && marker != this.domVersion_*/)) // prevent dom update
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

    //titleGetter: getter('data.title'),

    binding: {
      title: 'data:'
    }

    /*template: new Template(
      '<div{element} class="Basis-PartitionNode">' + 
        '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
        '<div{content|childNodesElement} class="Basis-PartitionNode-Content"/>' + 
      '</div>'
    ),*//*

    templateUpdate: function(tmpl, eventName, delta){
      if (tmpl.titleText)
        tmpl.titleText.nodeValue = String(this.titleGetter(this));
    }*/
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
      this.syncDomRefs();
      DWGroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

    listen: {
      owner: {
        templateChanged: function(){
          this.syncDomRefs();
          for (var child = this.lastChild; child; child = child.previousSibling)
            this.insertBefore(child, child.nextSibling);
        }
      }
    },

    init: function(config){
      this.nullElement = DOM.createFragment();
      this.element = this.childNodesElement = this.nullElement;
      DWGroupingNode.prototype.init.call(this, config);
    },

    syncDomRefs: function(){
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

  this.setWrapper(simpleTemplate);

  this.extend({
    simpleTemplate: simpleTemplate,
    BINDING_PRESET: BINDING_PRESET,

    Node: Node,
    Container: Container,
    PartitionNode: PartitionNode,
    GroupingNode: GroupingNode,
    Control: Control
  });

