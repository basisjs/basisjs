
  basis.require('basis.timer');
  basis.require('basis.l10n');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.template.html');


 /**
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

  var classList = basis.cssom.classList;
  var getter = basis.getter;
  var createEvent = basis.event.create;

  var Template = basis.template.html.Template;
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
  * @param {object} binding
  * @param {object} extension
  */
  function extendBinding(binding, extension){
    binding.bindingId = bindingSeed++;
    for (var key in extension)
    {
      var def = null;
      var value = extension[key];

      // NOTE: check for Node, because first call of extendBinding happens before Node declared
      if (Node && value instanceof Node)
      {
        def = {
          events: 'satelliteChanged',
          getter: (function(key, satellite){
            var init = basis.fn.runOnce(function(node){
              node.setSatellite(key, satellite);
              ;;;if (node.satellite[key] !== satellite) basis.dev.warn('basis.ui.binding: implicit satellite `' + key + '` attach to owner failed');
            });
            return function(node){
              init(node);
              return node.satellite[key] ? node.satellite[key].element : null;
            };
          })(key, value)
        };
      }
      else
      {
        if (value)
        {
          if (typeof value == 'string')
            value = BINDING_PRESET.process(key, value);
          else
            // getter is function that returns value if value is basis.Token or basis.data.Object instance
            // those sort of instance have mechanism (via bindingBridge) to update itself
            // TODO: basis.data.DataObject should be replace for basis.data.AbstractData
            if (value instanceof basis.Token || (value instanceof basis.data.DataObject && value.bindingBridge))
              value = basis.fn.$const(value);

          if (typeof value != 'object')
          {
            def = {
              getter: getter(value)
            };
          }
          else
            if (Array.isArray(value))
            {
              def = {
                getter: getter(value[0]),
                events: value[1]
              };
            }
            else
            {
              def = {
                getter: getter(value.getter),
                events: value.events
              };
            }
        }
      }

      binding[key] = def;
    }
  }

  // binding preset

  var BINDING_PRESET = (function(){
    var presets = {};
    var prefixRegExp = /^([a-z_][a-z0-9_]*):(.*)/i;

    return {
      add: function(prefix, func){
        if (!presets[prefix])
        {
          presets[prefix] = func;
        }
        else
        {
          ;;;basis.dev.warn('Preset `' + prefix + '` already exists, new definition ignored');
        }
      },
      process: function(key, value){
        var preset;
        var m = value.match(prefixRegExp);

        if (m)
        {
          preset = presets[m[1]];
          value = m[2] || key;
        }

        return preset
          ? preset(value)
          : value;
      }
    };
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
    return basis.fn.$const(basis.l10n.getToken(token));
  });


 /**
  * Base binding
  */
  var TEMPLATE_BINDING = Class.customExtendProperty({
    selected: {
      events: 'select unselect',
      getter: function(node){
        return node.selected;
      }
    },
    unselected: {
      events: 'select unselect',
      getter: function(node){
        return !node.selected;
      }
    },
    disabled: {
      events: 'disable enable',
      getter: function(node){
        return node.disabled || node.contextDisabled;
      }
    },
    enabled: {
      events: 'disable enable',
      getter: function(node){
        return !(node.disabled || node.contextDisabled);
      }
    },
    state: {
      events: 'stateChanged',
      getter: function(node){
        return String(node.state);
      }
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
        return !!node.firstChild;
      }
    },
    empty: {
      events: 'childNodesModified',
      getter: function(node){
        return !node.firstChild;
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
      * @type {basis.html.Template}
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
      * @type {string}
      * @deprecated
      */
      id: null,

     /**
      * Classes for template elements.
      * @type {object}
      * @deprecated
      */
      cssClassName: null,

     /**
      * Identify node can have focus. Useful when search for next/previous node to focus.
      * @type {boolean}
      */
      focusable: true,

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
      event_update: function(delta){
        this.templateUpdate(this.tmpl, 'update', delta);

        super_.event_update.call(this, delta);
      },

     /**
      * @inheritDoc
      */
      event_match: function(){
        super_.event_match.call(this);

        cssom.display(this.element, true);
      },

     /**
      * @inheritDoc
      */
      event_unmatch: function(){
        super_.event_unmatch.call(this);

        cssom.display(this.element, false);
      },

     /**
      * @inheritDoc
      */
      init: function(){
        // create dom fragment by template
        var template = this.template;
        if (template)
        {
          this.template = null;
          this.setTemplate(template);
        }

        // inherit init
        super_.init.call(this);
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
            ;;;this.noChildNodesElement = false;

            if (!this.childNodesElement || this.childNodesElement.nodeType != 1)
            {
              this.childNodesElement = document.createDocumentFragment();
              ;;;this.noChildNodesElement = true;
            }
          }

          // insert content
          if (this.content)
          {
            if (this.content instanceof basis.l10n.Token)
            {
              var token = this.content;
              var textNode = DOM.createText(token.value);
              var handler = function(value){
                this.nodeValue = value;
              };

              token.attach(handler, textNode);
              this.addHandler({
                destroy: function(){
                  token.detach(handler, textNode);
                }
              });

              DOM.insert(tmpl.content || tmpl.element, textNode);
            }
            else
              DOM.insert(tmpl.content || tmpl.element, this.content);
          }

          // update template
          if (this.id)
          {
            ;;;basis.dev.warn('WARN: basis.ui.Node#id property is prohibited and being removed soon, class:', this.constructor.className, ', value:', this.id);

            tmpl.element.id = this.id;
          }

          var cssClassNames = this.cssClassName;
          if (cssClassNames)
          {
            ;;;basis.dev.warn('WARN: basis.ui.Node#cssClassName property is prohibited and being removed soon, class:', this.constructor.className, ', value:', this.cssClassName);

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

          if (this instanceof PartitionNode)
          {
            var nodes = this.nodes;
            if (nodes)
              for (var i = nodes.length; i-- > 0;)
              {
                var child = nodes[i];
                child.parentNode.insertBefore(child, child.nextSibling);
              }
          }
          else
            for (var child = this.lastChild; child; child = child.previousSibling)
              this.insertBefore(child, child.nextSibling);

          if (oldElement && this.element && oldElement !== this.element)
          {
            var parentNode = oldElement && oldElement.parentNode;
            if (parentNode)
              parentNode.replaceChild(this.element, oldElement);

            // ??? fire event
            this.event_templateChanged();
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
            oldTemplate.clearInstance(this.tmpl);

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

            ;;;this.noChildNodesElement = false;

            if (!this.childNodesElement || this.childNodesElement.nodeType != 1)
            {
              this.childNodesElement = document.createDocumentFragment();
              ;;;this.noChildNodesElement = true;
            }

            if (oldTemplate)
              this.templateSync(true);
          }
          else
          {
            this.tmpl = null;
            this.element = null;
            this.childNodesElement = null;
          }

          if (oldElement)
          {
            if (!this.element || this.element != oldElement)
            {
              var parentNode = oldElement && oldElement.parentNode;
              if (parentNode && parentNode.nodeType == DOM.ELEMENT_NODE)
                parentNode.removeChild(oldElement);
            }
          }

          // ??? fire event
          //if (oldTemplate && template)
          //  this.event_templateChanged();
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
      * @param {object} tmpl
      * @param {string} eventName
      * @param {object} delta
      */
      templateUpdate: function(tmpl, eventName, delta){
        /** nothing to do, override it in sub classes */
      },

     /**
      * Set focus on element in template, if possible.
      * @param {boolean=} select
      */
      focus: function(select){
        if (this.focusable)
        {
          var focusElement = this.tmpl.focus || this.element;
          if (focusElement)
            setImmediate(function(){
              DOM.focus(focusElement, select);
            });
        }
      },

     /**
      * Remove focus from element.
      */
      blur: function(){
        if (this.focusable)
        {
          var focusElement = this.tmpl.focus || this.element;
          if (focusElement)
            focusElement.blur();
        }
      },

     /**
      * @inheritDoc
      */
      destroy: function(){
        super_.destroy.call(this);

        this.setTemplate();
      }
    };
  };

 /**
  * Template mixin for containers classes
  * @mixin
  */
  var ContainerTemplateMixin = function(super_){
    return {
      // methods
      insertBefore: function(newChild, refChild){
        ;;;if (this.noChildNodesElement){ this.noChildNodesElement = false; basis.dev.warn('Bug: Template has no childNodesElement container, but insertBefore call'); }

        // inherit
        newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var container = target.childNodesElement || target.element || this.childNodesElement || this.element;

        var nextSibling = newChild.nextSibling;
        //var insertPoint = nextSibling && (target == this || nextSibling.groupNode === target) ? nextSibling.element : null;
        var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;

        var element = newChild.element;
        var refNode = insertPoint || container.insertPoint || null; // NOTE: null at the end for IE

        if (element.parentNode !== container || element.nextSibling !== refNode) // prevent dom update
          container.insertBefore(element, refNode);
          
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
        ;;;if (this.noChildNodesElement){ this.noChildNodesElement = false; basis.dev.warn('Template has no childNodesElement container, probably it is bug'); }

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
    };
  };


 /**
  * @class
  */
  var PartitionNode = Class(DWPartitionNode, TemplateMixin, {
    className: namespace + '.PartitionNode',

    binding: {
      title: 'data:'
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
    event_ownerChanged: function(oldOwner){
      this.syncDomRefs();
      DWGroupingNode.prototype.event_ownerChanged.call(this, oldOwner);
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

    init: function(){
      this.nullElement = DOM.createFragment();
      this.element = this.childNodesElement = this.nullElement;
      DWGroupingNode.prototype.init.call(this);
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
  var Node = Class(DWNode, TemplateMixin, ContainerTemplateMixin, {
    className: namespace + '.Node',

    childClass: Class.SELF,
    childFactory: function(config){
      return new this.childClass(config);
    },

    groupingClass: GroupingNode
  });


  //
  // export names
  //

  module.exports = {
    BINDING_PRESET: BINDING_PRESET,

    Node: Node,
    PartitionNode: PartitionNode,
    GroupingNode: GroupingNode
  };

  // deprecated, left here for backward capability
  // TODO: remove in future
  module.exports.Container = Node;
