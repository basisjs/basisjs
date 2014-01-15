
  basis.require('basis.l10n');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.template');
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
  var createEvent = basis.event.create;

  var HtmlTemplate = basis.template.html.Template;
  var TemplateSwitcher = basis.template.TemplateSwitcher;
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

  // check for wrong event names in bindings in dev mode
  /** @cut */ var unknownEventBindingCheck = {};

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

      // NOTE: check for Node, because first extendBinding invoke before Node class declared
      if ((Node && value instanceof Node) || basis.resource.isResource(value))
      {
        def = {
          events: 'satelliteChanged',
          getter: (function(key, satellite){
            var resource = typeof satellite == 'function' ? satellite : null;
            var init = function(node){
              init = false;

              if (resource)
              {
                satellite = resource();
                if (satellite instanceof Node == false)
                  return;
                resource = null;
              }

              node.setSatellite(key, satellite);

              /** @cut */ if (node.satellite[key] !== satellite)
              /** @cut */   basis.dev.warn('basis.ui.binding: implicit satellite `' + key + '` attach to owner failed');
            };
            return function(node){
              if (init)
                init(node);

              return resource || (node.satellite[key] ? node.satellite[key].element : null);
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
            // if value has bindingBridge means that it can update itself
            if (value.bindingBridge)
              value = basis.fn.$const(value);

          if (typeof value != 'object')
          {
            def = {
              getter: typeof value == 'function' ? value : basis.getter(value)
            };
          }
          else
            if (Array.isArray(value))
            {
              def = {
                events: value[0],
                getter: basis.getter(value[1])
              };
            }
            else
            {
              def = {
                events: value.events,
                getter: basis.getter(value.getter)
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
    return {
      events: 'update',
      getter: 'data.' + path
    };
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


 /**
  * Base binding
  */
  var TEMPLATE_BINDING = Class.customExtendProperty({
    state: {
      events: 'stateChanged',
      getter: function(node){
        return String(node.state);
      }
    },
    childNodesState: {
      events: 'childNodesStateChanged',
      getter: function(node){
        return String(node.childNodesState);
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

  // interface for attach/detach binding handler from/to template
  var BINDING_TEMPLATE_INTERFACE = {
    attach: function(object, handler, context){
      object.addHandler(handler, context);
    },
    detach: function(object, handler, context){
      object.removeHandler(handler, context);
    }
  };


 /**
  * Base action
  */
  var TEMPLATE_ACTION = Class.extensibleProperty({
    select: function(event){
      if (this.isDisabled())
        return;

      if (this.contextSelection && this.contextSelection.multiple)
        this.select(event.ctrlKey || event.metaKey);
      else
        this.select();
    }
  });

 /**
  */
  var TEMPLATE_SWITCHER_HANDLER = {
    '*': function(event){
      var switcher = this.templateSwitcher_;
      if (switcher && switcher.ruleEvents && switcher.ruleEvents[event.type])
        this.setTemplate(switcher.resolve(this));
    }
  };


 /**
  * Base template for TemplateMixin
  */
  var TEMPLATE = new HtmlTemplate('<div/>');


 /**
  * Fragment factory
  */
  var fragments = [];
  function getDocumentFragment(){
    return fragments.pop() || document.createDocumentFragment();
  }


 /**
  * Partition node
  */
  function reinsertPartitionNodes(partition){
    var nodes = partition.nodes;
    if (nodes)
      for (var i = nodes.length - 1, child; child = nodes[i]; i--)
        child.parentNode.insertBefore(child, child.nextSibling);
  }

 /**
  * @type {number}
  */
  var focusTimer;


 /**
  * @mixin
  */
  var TemplateMixin = function(super_){
    return {
     /**
      * Template for object.
      * @type {basis.template.html.Template}
      */
      template: TEMPLATE,         // NOTE: explicit template constructor here;
                                  // it could be ommited in subclasses
     /**
      * Fires when template had changed.
      * @event
      */
      emit_templateChanged: createEvent('templateChanged'),

     /**
      * @type {basis.template.TemplateSwitcher}
      */
      templateSwitcher_: null,

     /**
      * @type {Object}
      */
      binding: TEMPLATE_BINDING,

     /**
      * Handlers for template actions.
      * @type {Object}
      */
      action: TEMPLATE_ACTION,

     /**
      * Map for references to template nodes.
      * @type {Object}
      */
      tmpl: null,

     /**
      * Fast reference to template root node (tmpl.element)
      * @type {Node}
      */
      element: null,

     /**
      * Fast reference to child nodes container dom (tmpl.childNodesElement/tmpl.childNodesHere or tmpl.element)
      * @type {Node}
      */
      childNodesElement: null,

     /**
      * @inheritDoc
      */
      emit_update: function(delta){
        this.templateUpdate(this.tmpl, 'update', delta);

        super_.emit_update.call(this, delta);
      },

     /**
      * @inheritDoc
      */
      init: function(){
        this.element = this.childNodesElement = getDocumentFragment();

        // inherit init
        super_.init.call(this);
      },

     /**
      *
      */
      postInit: function(){
        super_.postInit.call(this);

        // create dom fragment by template
        var template = this.template;
        if (template)
        {
          var nodeDocumentFragment = this.element;

          // check for wrong event name in binding
          /** @cut */ var bindingId = this.constructor.basisClassId_ + '_' + this.binding.bindingId;
          /** @cut */ if (bindingId in unknownEventBindingCheck == false)
          /** @cut */ {
          /** @cut */   unknownEventBindingCheck[bindingId] = true;
          /** @cut */   for (var bindName in this.binding)
          /** @cut */   {
          /** @cut */     var events = this.binding[bindName] && this.binding[bindName].events;
          /** @cut */     if (events)
          /** @cut */     {
          /** @cut */       events = String(events).trim().split(/\s+|\s*,\s*/);
          /** @cut */       for (var i = 0, eventName; eventName = events[i]; i++)
          /** @cut */         if (('emit_' + eventName) in this == false)
          /** @cut */           basis.dev.warn('basis.ui: binding `' + bindName + '` has unknown event `' + eventName + '` for ' + this.constructor.className);
          /** @cut */     }
          /** @cut */   }
          /** @cut */ }

          this.template = null;
          this.setTemplate(template);

          // release fragment
          fragments.push(nodeDocumentFragment);

          // process container
          if (this.container)
          {
            this.container.appendChild(this.element);
            this.container = null;
          }
        }
      },

      templateSync: function(){
        var oldElement = this.element;
        var tmpl = this.template.createInstance(this, this.templateAction, this.templateSync, this.binding, BINDING_TEMPLATE_INTERFACE);
        var noChildNodesElement;

        if (tmpl.childNodesHere)
        {
          tmpl.childNodesElement = tmpl.childNodesHere.parentNode;
          tmpl.childNodesElement.insertPoint = tmpl.childNodesHere; // FIXME: we should avoid add expando to dom nodes
        }

        this.tmpl = tmpl;
        this.element = tmpl.element;
        this.childNodesElement = tmpl.childNodesElement || tmpl.element;
        noChildNodesElement = this.childNodesElement.nodeType != 1;

        if (noChildNodesElement)
          this.childNodesElement = document.createDocumentFragment();

        /** @cut */ if (noChildNodesElement)
        /** @cut */   this.noChildNodesElement_ = true;
        /** @cut */ else
        /** @cut */   delete this.noChildNodesElement_;

        if (this.grouping)
        {
          this.grouping.syncDomRefs();

          // search for top grouping
          var cursor = this;
          while (cursor.grouping)
            cursor = cursor.grouping;

          // process grouping partition nodes
          var topGrouping = cursor;
          for (var groupNode = topGrouping.lastChild; groupNode; groupNode = groupNode.previousSibling)
          {
            if (groupNode instanceof PartitionNode)
              // for basis.ui.PartitionNode instances we can move all partition nodes at once
              // by moving partition container
              topGrouping.insertBefore(groupNode, groupNode.nextSibling);
            else
              // for partitions with no DOM element move group nodes one by one
              reinsertPartitionNodes(groupNode);
          }

          // move grouping null group nodes
          reinsertPartitionNodes(topGrouping.nullGroup);
        }
        else
        {
          // with no grouping scenario
          for (var child = this.lastChild; child; child = child.previousSibling)
            this.insertBefore(child, child.nextSibling);
        }

        // partition nodes also moves their group nodes
        if (this instanceof PartitionNode)
          reinsertPartitionNodes(this);

        // insert content
        if (this.content)
          (tmpl.content || tmpl.element).appendChild(this.content.nodeType ? this.content : document.createTextNode(this.content));

        this.templateUpdate(this.tmpl);

        if (oldElement && oldElement !== this.element && oldElement.nodeType != 11) // 11 - DocumentFragment
        {
          var parentNode = oldElement && oldElement.parentNode;

          if (parentNode)
          {
            if (this.owner && this.owner.tmpl)
              this.owner.tmpl.set(oldElement, this.element);

            if (this.element.parentNode !== parentNode)
              parentNode.replaceChild(this.element, oldElement);
          }
        }

        // emit event
        this.emit_templateChanged();
      },

     /**
      * @param {basis.template.Template|basis.template.TemplateSwitcher} template
      */
      setTemplate: function(template){
        var curSwitcher = this.templateSwitcher_;
        var switcher;

        // dance with template switcher
        if (template instanceof TemplateSwitcher)
        {
          switcher = template;
          template = switcher.resolve(this);
        }

        // check template for correct class instance
        if (template instanceof HtmlTemplate == false)
          template = null;

        if (!template)
        {
          /** @cut */ basis.dev.warn('basis.ui.Node#setTemplate: set null to template possible only on node destroy');
          return;
        }

        if (switcher)
        {
          this.templateSwitcher_ = switcher;
          if (!curSwitcher)
            this.addHandler(TEMPLATE_SWITCHER_HANDLER, this);
        }

        // drop template switcher if no template, or new template is not a result of switcher resolving
        if (curSwitcher && curSwitcher.resolve(this) !== template)
        {
          this.templateSwitcher_ = null;
          this.removeHandler(TEMPLATE_SWITCHER_HANDLER, this);
        }

        // apply new value
        if (this.template !== template)
        {
          // set new template
          this.template = template;
          this.templateSync();
        }
      },

     /**
      * @param {string} bindName
      */
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

        /** @cut */ if (!action)
        /** @cut */   basis.dev.warn('template call `' + actionName + '` action, but it isn\'t defined in action list');
      },

     /**
      * Template update function. It calls on init and on update event by default.
      * @param {object} tmpl
      * @param {string} eventName
      * @param {object} delta
      */
      templateUpdate: function(tmpl, eventName, delta){
        /* nothing to do, override it in sub classes */
      },

     /**
      * Set focus on element in template, if possible.
      * @param {boolean=} select
      */
      focus: function(select){
        var focusElement = this.tmpl ? this.tmpl.focus || this.element : null;

        if (focusElement)
        {
          if (focusTimer)
            focusTimer = basis.clearImmediate(focusTimer);

          focusTimer = basis.setImmediate(function(){
            try {
              focusElement.focus();
              if (select)
                focusElement.select();
            } catch(e) {}
          });
        }
      },

     /**
      * Remove focus from element.
      */
      blur: function(){
        var focusElement = this.tmpl ? this.tmpl.focus || this.element : null;

        if (focusElement)
          try {
            focusElement.blur();
          } catch(e) {}
      },

     /**
      * @inheritDoc
      */
      destroy: function(){
        var template = this.template;
        var element = this.element;

        // remove template switcher handler
        if (this.templateSwitcher_)
        {
          this.templateSwitcher_ = null;
          this.removeHandler(TEMPLATE_SWITCHER_HANDLER, this);
        }

        // destroy template instance
        template.clearInstance(this.tmpl);

        // inherit
        super_.destroy.call(this);

        // reset DOM references
        this.tmpl = null;
        this.element = null;
        this.childNodesElement = null;

        // remove DOM node from it's parent, if parent is DOM element
        var parentNode = element && element.parentNode;
        if (parentNode && parentNode.nodeType == 1) // 1 – Element
          parentNode.removeChild(element);
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
        /** @cut */ if (this.noChildNodesElement_)
        /** @cut */ {
        /** @cut */   delete this.noChildNodesElement_;
        /** @cut */   basis.dev.warn('basis.ui: Template has no childNodesElement container, but insertBefore method called; probably it\'s a bug');
        /** @cut */ }

        // inherit
        newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var container = target.childNodesElement || this.childNodesElement;

        var nextSibling = newChild.nextSibling;
        var insertPoint = nextSibling && nextSibling.element.parentNode == container ? nextSibling.element : null;

        var childElement = newChild.element;
        var refNode = insertPoint || container.insertPoint || null; // NOTE: null at the end for IE

        if (childElement.parentNode !== container || childElement.nextSibling !== refNode) // prevent dom update
          container.insertBefore(childElement, refNode);

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
        /** @cut */ if (this.noChildNodesElement_)
        /** @cut */ {
        /** @cut */   delete this.noChildNodesElement_;
        /** @cut */   basis.dev.warn('basis.ui: Template has no childNodesElement container, but setChildNodes method called; probably it\'s a bug');
        /** @cut */ }

        // reallocate childNodesElement to new DocumentFragment
        var domFragment = document.createDocumentFragment();
        var target = this.grouping || this;
        var container = target.childNodesElement;

        // set child nodes element points to DOM fragment
        target.childNodesElement = domFragment;

        // call inherit method
        // NOTE: make sure that dispatching childNodesModified event handlers are not sensetive
        // for child node positions at real DOM (html document), because all new child nodes
        // will be inserted into temporary DocumentFragment that will be inserted into html document
        // later (after inherited method call)
        super_.setChildNodes.call(this, childNodes, keepAlive);

        // flush dom fragment nodes into container
        container.insertBefore(domFragment, container.insertPoint || null); // NOTE: null at the end for IE

        // restore childNodesElement
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

    element: null,
    childNodesElement: null,

   /**
    * @inheritDoc
    */
    emit_ownerChanged: function(oldOwner){
      this.syncDomRefs();
      DWGroupingNode.prototype.emit_ownerChanged.call(this, oldOwner);
    },

    init: function(){
      this.element = this.childNodesElement = document.createDocumentFragment();
      DWGroupingNode.prototype.init.call(this);
    },

    syncDomRefs: function(){
      var cursor = this;
      var owner = this.owner;
      var element = null;

      if (owner)
        element = (owner.tmpl && owner.tmpl.groupsElement) || owner.childNodesElement;

      do
      {
        cursor.element = cursor.childNodesElement = element;
      }
      while (cursor = cursor.grouping);
    },

    destroy: function(){
      DWGroupingNode.prototype.destroy.call(this);
      this.element = null;
      this.childNodesElement = null;
    }
  });


 /**
  * @class
  */
  var Node = Class(DWNode, TemplateMixin, ContainerTemplateMixin, {
    className: namespace + '.Node',

    // those bindings here because PartitionNode has no select/unselect/disable/enable events for now
    // TODO: move to proper place when PartitionNode will have those events
    binding: {
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
      }
    },

    childClass: Class.SELF,
    childFactory: function(config){
      return new this.childClass(config);
    },

    groupingClass: GroupingNode
  });


 /**
  * @class
  */
  var ShadowNodeList = Node.subclass({
    className: namespace + '.ShadowNodeList',

    emit_ownerChanged: function(oldOwner){
      Node.prototype.emit_ownerChanged.call(this, oldOwner);

      this.setDataSource(this.owner && this.owner.getChildNodesDataset());
    },

    getChildNodesElement: function(owner){
      return owner.childNodesElement;
    },

    listen: {
      owner: {
        templateChanged: function(){
          this.childNodes.forEach(function(child){
            this.appendChild(child.element);
          }, this.getChildNodesElement(this.owner) || this.owner.element);
        }
      }
    },

    childClass: {
      className: namespace + '.ShadowNode',

      getElement: function(node){
        return node.element;
      },
      templateSync: function(){
        Node.prototype.templateSync.call(this);

        var newElement = this.getElement(this.delegate);

        if (newElement)
        {
          newElement.basisTemplateId = this.delegate.element.basisTemplateId; // to make events work
          this.element = newElement;
        }
      },
      listen: {
        delegate: {
          templateChanged: function(){
            var oldElement = this.element;
            var oldElementParent = oldElement.parentNode;
            var newElement = this.getElement(this.delegate);

            if (newElement)
              newElement.basisTemplateId = this.delegate.element.basisTemplateId; // to make events work

            this.element = newElement || this.tmpl.element;

            if (oldElementParent)
              oldElementParent.replaceChild(this.element, oldElement);
          }
        }
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    BINDING_PRESET: BINDING_PRESET,

    Node: Node,
    PartitionNode: PartitionNode,
    GroupingNode: GroupingNode,

    ShadowNodeList: ShadowNodeList,
    ShadowNode: ShadowNodeList.prototype.childClass
  };
