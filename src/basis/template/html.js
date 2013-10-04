
  basis.require('basis.dom.event');
  basis.require('basis.l10n');
  basis.require('basis.template');
  basis.require('basis.template.htmlfgen');


 /**
  * @namespace basis.template.html
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var domEvent = basis.dom.event;
  var arrayFrom = basis.array.from;
  var camelize = basis.string.camelize;
  var l10nToken = basis.l10n.token;
  var getFunctions = basis.template.htmlfgen.getFunctions;
  
  var TemplateSwitchConfig = basis.template.TemplateSwitchConfig;
  var TemplateSwitcher = basis.template.TemplateSwitcher;
  var Template = basis.template.Template;

  var TYPE_ELEMENT = basis.template.TYPE_ELEMENT;
  var TYPE_ATTRIBUTE = basis.template.TYPE_ATTRIBUTE;
  var TYPE_TEXT = basis.template.TYPE_TEXT;
  var TYPE_COMMENT = basis.template.TYPE_COMMENT;

  var TOKEN_TYPE = basis.template.TOKEN_TYPE;
  var TOKEN_BINDINGS = basis.template.TOKEN_BINDINGS;
  var TOKEN_REFS = basis.template.TOKEN_REFS;

  var ATTR_NAME = basis.template.ATTR_NAME;
  var ATTR_VALUE = basis.template.ATTR_VALUE;
  var ATTR_NAME_BY_TYPE = basis.template.ATTR_NAME_BY_TYPE;

  var ELEMENT_NAME = basis.template.ELEMENT_NAME;

  var TEXT_VALUE = basis.template.TEXT_VALUE;
  var COMMENT_VALUE = basis.template.COMMENT_VALUE;



  //
  // main part
  //

  var eventAttr = /^event-(.+)+/;

  // dictionaries
  var tmplEventListeners = {};
  var templates = {};

  var namespaceURI = {
    svg: 'http://www.w3.org/2000/svg'
  };

  var CAPTURE_FALLBACK = !document.addEventListener && '__basisTemplate' + parseInt(1e9 * Math.random());
  if (CAPTURE_FALLBACK)
    global[CAPTURE_FALLBACK] = function(eventName, event){
      domEvent.fireEvent(document, eventName);

      var listener = tmplEventListeners[eventName];
      if (listener)
        listener(event);
    };

  // test for browser (IE) normalize text nodes during cloning
  var CLONE_NORMALIZATION_TEXT_BUG = (function(){
    var element = document.createElement('div');
    element.appendChild(document.createTextNode('a'));
    element.appendChild(document.createTextNode('a'));
    return element.cloneNode(true).childNodes.length == 1;
  })();

  // test for class attribute set via setAttribute bug (IE7 and lower)
  var SET_CLASS_ATTRIBUTE_BUG = (function(){
    var element = document.createElement('div');
    element.setAttribute('class', 'a');
    return !element.className;
  })();


  var l10nTemplates = {};
  function getL10nTemplate(token){
    var template = basis.template.getL10nTemplate(token);
    var id = template.templateId
    var htmlTemplate = l10nTemplates[id];

    if (!htmlTemplate)
      htmlTemplate = l10nTemplates[id] = new HtmlTemplate(template.source);

    return htmlTemplate;
  }


  //
  // Constructs dom structure
  //

 /**
  * @func
  */
  function createEventHandler(attrName){
    return function(event){
      event = new domEvent.Event(event);

      // don't process right click - generaly FF problem
      if (event && event.type == 'click' && event.which == 3)
        return;

      var cursor = event.sender;
      var attr;

      // IE events may have no source, nothing to do in this case
      if (!cursor)
        return;

      // search for nearest node with event-{eventName} attribute
      do {
        if (attr = (cursor.getAttributeNode && cursor.getAttributeNode(attrName)))
          break;
      } while (cursor = cursor.parentNode);

      // if not found - exit
      if (!cursor || !attr)
        return;

      // search for nearest node with basisTemplateId property
      var actionTarget = cursor;
      var refId;
      var tmplRef;

      do {
        refId = cursor.basisTemplateId;
        if (typeof refId == 'number')
        {
          // if node found, return it
          if (tmplRef = resolveInstanceById(refId))
            break;
        }
      } while (cursor = cursor.parentNode);

      if (tmplRef && tmplRef.action)
      {
        var actions = attr.nodeValue.trim().split(' ');
        event.actionTarget = actionTarget;
        for (var i = 0, actionName; actionName = actions[i++];)
          tmplRef.action.call(tmplRef.context, actionName, event);
      }
    };
  }

 /**
  * Creates dom structure by declaration.
  */
  var buildHtml = function(tokens, parent){
    function setEventAttribute(eventName, actions){
      var attrName = 'event-' + eventName;

      if (!tmplEventListeners[eventName])
      {
        tmplEventListeners[eventName] = createEventHandler(attrName);

        if (!CAPTURE_FALLBACK)
          for (var k = 0, names = domEvent.browserEvents(eventName), browserEventName; browserEventName = names[k++];)
            domEvent.addGlobalHandler(browserEventName, tmplEventListeners[eventName]);
      }

      // hack for non-bubble events in IE<=8
      if (CAPTURE_FALLBACK)
        result.setAttribute('on' + eventName, CAPTURE_FALLBACK + '("' + eventName + '",event)');

      result.setAttribute(attrName, actions);
    }

    function setAttribute(name, value){
      if (SET_CLASS_ATTRIBUTE_BUG && name == 'class')
        name = 'className';

      result.setAttribute(name, value);
    }


    var result = parent || document.createDocumentFragment();

    for (var i = parent ? 4 : 0, token; token = tokens[i]; i++)
    {
      switch(token[TOKEN_TYPE])
      {
        case TYPE_ELEMENT: 
          var tagName = token[ELEMENT_NAME];
          var parts = tagName.split(/:/);

          var element = parts.length > 1
            ? document.createElementNS(namespaceURI[parts[0]], tagName)
            : document.createElement(tagName);

          // precess for children and attributes
          buildHtml(token, element);

          // add to result
          result.appendChild(element);

          break;

        case TYPE_ATTRIBUTE:
          var attrName = token[ATTR_NAME];
          var attrValue = token[ATTR_VALUE];
          var eventName = attrName.replace(/^event-/, '');

          if (eventName != attrName)
          {
            setEventAttribute(eventName, attrValue);
          }
          else
          {
            if (attrName != 'class' && attrName != 'style' ? !token[TOKEN_BINDINGS] : attrValue)
              setAttribute(attrName, attrValue || '');
          }

          break;

        case 4:
        case 5:
          var attrValue = token[ATTR_VALUE - 1];

          if (attrValue)
            setAttribute(ATTR_NAME_BY_TYPE[token[TOKEN_TYPE]], attrValue);

          break;

        case 6:
          setEventAttribute(token[1], token[2] || token[1]);
          break;

        case TYPE_COMMENT:
          result.appendChild(document.createComment(token[COMMENT_VALUE] || (token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : '')));
          break;

        case TYPE_TEXT:
          // fix bug with normalize text node in IE8-
          if (CLONE_NORMALIZATION_TEXT_BUG && i && tokens[i - 1][TOKEN_TYPE] == TYPE_TEXT)
            result.appendChild(document.createComment(''));

          result.appendChild(document.createTextNode(token[TEXT_VALUE] || (token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : '') || (token[TOKEN_BINDINGS] ? '{' + token[TOKEN_BINDINGS] + '}' : '')));
          break;
      }
    }

    return result;
  };

  function resolveTemplateById(refId){
    var templateId = refId & 0xFFF;
    var object = templates[templateId];

    return object && object.template;
  }

  function resolveInstanceById(refId){
    var templateId = refId & 0xFFF;
    var instanceId = refId >> 12;
    var object = templates[templateId];

    return object && object.instances[instanceId];
  }

  function resolveObjectById(refId){
    var templateRef = resolveInstanceById(refId);

    return templateRef && templateRef.context;
  }

  function resolveTmplById(refId){
    var templateRef = resolveInstanceById(refId);

    return templateRef && templateRef.tmpl;
  }

  function getDebugInfoById(refId){
    var templateRef = resolveInstanceById(refId);

    return templateRef && templateRef.debug && templateRef.debug();
  }


  //
  // html template
  //

 /**
  * Build functions for creating instance of template.
  */
  var builder = (function(){

    var WHITESPACE = /\s+/;
    var W3C_DOM_NODE_SUPPORTED = typeof Node == 'function' && document instanceof Node;
    var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;
    /*var TRANSITION_SUPPORTED = !!(document && (function(){
      var properties = ['webkitTransition', 'MozTransition', 'msTransition', 'OTransition', 'transition'];
      var style = document.documentElement.style;
      for (var i = 0; i < properties.length; i++)
        if (properties[i] in style)
          return true;
      return false;
    })());*/


   /**
    * @func
    */
    var bind_node = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue){
          var newNode = newValue instanceof Node && !newValue.basisNodeInUse ? newValue : domRef;

          if (newNode !== oldNode)
            oldNode.parentNode.replaceChild(newNode, oldNode);

          return newNode;
        }
      // Old browsers way (IE6-8 and other)
      : function(domRef, oldNode, newValue){
          var newNode = newValue && typeof newValue == 'object' && !newValue.basisNodeInUse ? newValue : domRef;

          if (newNode !== oldNode)
          {
            try {
              oldNode.parentNode.replaceChild(newNode, oldNode);
            } catch(e) {
              newNode = domRef;
              if (oldNode !== newNode)
                oldNode.parentNode.replaceChild(newNode, oldNode);
            }
          }

          return newNode;
        };

   /**
    * @func
    */
    var bind_element = function(domRef, oldNode, newValue){
      var newNode = bind_node(domRef, oldNode, newValue);

      if (newNode === domRef && typeof newValue == 'string')  // TODO: save inner nodes on first innerHTML and restore when newValue is not a string
        domRef.innerHTML = newValue;

      return newNode;
    };

   /**
    * @func
    */
    var bind_comment = bind_node;

   /**
    * @func
    */
    var bind_textNode = function(domRef, oldNode, newValue){
      var newNode = bind_node(domRef, oldNode, newValue);

      if (newNode === domRef)
        domRef.nodeValue = newValue;

      return newNode;
    };

   /**
    * @func
    */
    var bind_attrClass = CLASSLIST_SUPPORTED
      // classList supported
      ? function(domRef, oldClass, newValue, prefix, anim){
          var newClass = newValue ? prefix + newValue : "";

          if (newClass != oldClass)
          {
            if (oldClass)
              domRef.classList.remove(oldClass);

            if (newClass)
            {
              domRef.classList.add(newClass);

              if (anim)
              {
                domRef.classList.add(newClass + '-anim');
                basis.nextTick(function(){
                  domRef.classList.remove(newClass + '-anim');
                });
              }
            }
          }

          return newClass;
        }
      // old browsers are not support for classList
      : function(domRef, oldClass, newValue, prefix, anim){
          var newClass = newValue ? prefix + newValue : "";

          if (newClass != oldClass)
          {
            var className = domRef.className;
            var classNameIsObject = typeof className != 'string';
            var classList;

            if (classNameIsObject)
              className = className.baseVal;

            classList = className.split(WHITESPACE);

            if (oldClass)
              classList.remove(oldClass);

            if (newClass)
            {
              classList.push(newClass);

              if (anim)
              {
                classList.add(newClass + '-anim');
                basis.nextTick(function(){
                  var classList = (classNameIsObject ? domRef.className.baseVal : domRef.className).split(WHITESPACE);
                  
                  classList.remove(newClass + '-anim');

                  if (classNameIsObject)
                    domRef.className.baseVal = classList.join(' ');
                  else
                    domRef.className = classList.join(' ');                  
                });
              }
            }

            if (classNameIsObject)
              domRef.className.baseVal = classList.join(' ');
            else
              domRef.className = classList.join(' ');
          }

          return newClass;
        };

   /**
    * @func
    */
    var bind_attrStyle = function(domRef, propertyName, oldValue, newValue){
      if (oldValue !== newValue)
      {
        try {
          domRef.style[camelize(propertyName)] = newValue;
        } catch(e){
        }
      }

      return newValue;
    };

   /**
    * @func
    */
    var bind_attr = function(domRef, attrName, oldValue, newValue){
      if (oldValue !== newValue)
      {
        if (newValue)
          domRef.setAttribute(attrName, newValue);
        else
          domRef.removeAttribute(attrName);
      }

      return newValue;
    };

   /**
    * @func
    */ 
    function updateAttach(){
      this.set(this.name, this.value);
    }

   /**
    * @func
    */ 
    function resolveValue(bindingName, value, Attaches){
      var bridge = value && value.bindingBridge;
      var oldAttach = this.attaches && this.attaches[bindingName];
      var tmpl = null;

      if (bridge || oldAttach)
      {
        if (bridge)
        {
          if (!oldAttach || value !== oldAttach.value)
          {
            if (oldAttach)
            {
              if (oldAttach.tmpl)
              {
                // FIX ME
                oldAttach.tmpl.element.toString = null;
                getL10nTemplate(oldAttach.value).clearInstance(oldAttach.tmpl);
              }

              oldAttach.value.bindingBridge.detach(oldAttach.value, updateAttach, oldAttach);
            }

            if (value.type == 'markup' && value instanceof basis.l10n.Token)
            {
              var template = getL10nTemplate(value);
              var context = this.context;
              var bindings = this.bindings;
              var bindingInterface = this.bindingInterface;
              tmpl = template.createInstance(context, null, function onRebuild(){
                tmpl = newAttach.tmpl = template.createInstance(context, null, onRebuild, bindings, bindingInterface);
                tmpl.element.toString = function(){
                  return value.value;
                };
                updateAttach.call(newAttach);
              }, bindings, bindingInterface);
              tmpl.element.toString = function(){
                return value.value;
              }
            }

            if (!this.attaches)
              this.attaches = new Attaches;

            var newAttach = this.attaches[bindingName] = {
              name: bindingName,
              value: value,
              tmpl: tmpl,
              set: this.tmpl.set
            };

            bridge.attach(value, updateAttach, newAttach);
          }
          else
            tmpl = value && value.type == 'markup' ? oldAttach.tmpl : null;

          if (tmpl)
            return tmpl.element;

          value = bridge.get(value);
        }
        else
        {
          if (oldAttach)
          {
            if (oldAttach.tmpl)
            {
              // FIX ME
              oldAttach.tmpl.element.toString = null;
              getL10nTemplate(oldAttach.value).clearInstance(oldAttach.tmpl);
            }

            oldAttach.value.bindingBridge.detach(oldAttach.value, updateAttach, oldAttach);
            this.attaches[bindingName] = null;
          }
        }
      }

      return value;
    }

   /**
    * @func
    */
    function createBindingUpdater(names, getters){
      return function bindingUpdater(object){
        for (var i = 0, bindingName; bindingName = names[i]; i++)
          this(bindingName, getters[bindingName](object));
      };
    }

   /**
    * @func
    */
    function createBindingFunction(keys){
      var bindingCache = {};

     /**
      * @param {object} bindings
      */
      return function getBinding(bindings, obj, set, bindingInterface){
        if (!bindings)
          return {};

        var cacheId = 'bindingId' in bindings ? bindings.bindingId : null;

        /** @cut */ if (!cacheId)
        /** @cut */   basis.dev.warn('basis.template.Template.getBinding: bindings has no bindingId property, cache is not used');

        var result = bindingCache[cacheId];

        if (!result)
        {
          var names = [];
          var getters = {};
          var events = {};
          var handler = {};
          var hasEvents = false;

          for (var i = 0, bindingName; bindingName = keys[i]; i++)
          {
            var binding = bindings[bindingName];
            var getter = binding && binding.getter;

            if (getter)
            {
              getters[bindingName] = getter;
              names.push(bindingName);

              if (binding.events)
              {
                var eventList = String(binding.events).trim().split(/\s+|\s*,\s*/);

                for (var j = 0, eventName; eventName = eventList[j]; j++)
                {
                  if (events[eventName])
                    events[eventName].push(bindingName);
                  else
                    events[eventName] = [bindingName];
                }
              }
            }
          }

          for (var eventName in events)
          {
            hasEvents = true;
            handler[eventName] = createBindingUpdater(events[eventName], getters);
          }

          result = {
            names: names,
            sync: createBindingUpdater(names, getters),
            handler: hasEvents ? handler : null
          };

          if (cacheId)
            bindingCache[cacheId] = result;
        }

        if (obj && set)
          result.sync.call(set, obj)

        if (!bindingInterface)
          return {};

        if (result.handler)
          bindingInterface.attach(obj, result.handler, set);

        return result.handler;
      };
    }

    var tools = {
      bind_textNode: bind_textNode,
      bind_node: bind_node,
      bind_element: bind_element,
      bind_comment: bind_comment,
      bind_attr: bind_attr,
      bind_attrClass: bind_attrClass,
      bind_attrStyle: bind_attrStyle,
      resolve: resolveValue,
      l10nToken: l10nToken,
      createBindingFunction: createBindingFunction
    };

    return function(tokens){
      var fn = getFunctions(tokens, true, this.source.url, tokens.source_, !CLONE_NORMALIZATION_TEXT_BUG);
      var createInstance;
      var instances = {};
      var l10nMap = {};
      var l10nLinks = [];
      var seed = 0;

      var proto = buildHtml(tokens);
      var build = function(){
        return proto.cloneNode(true);
      };

      var id = this.templateId;
      templates[id] = {
        template: this,
        instances: instances
      };

      if (fn.createL10nSync)
      {
        var l10nProtoSync = fn.createL10nSync(proto, l10nMap, bind_attr, CLONE_NORMALIZATION_TEXT_BUG);

        for (var i = 0, key; key = fn.l10nKeys[i]; i++)
          l10nProtoSync(key, l10nToken(key).value);

        if (fn.l10nKeys)
          for (var i = 0, key; key = fn.l10nKeys[i]; i++)
          {
            var link = {
              path: key,
              token: l10nToken(key),
              handler: function(value){
                l10nProtoSync(this.path, value);
                for (var key in instances)
                  instances[key].tmpl.set(this.path, value);
              }
            };
            link.token.attach(link.handler, link);
            l10nLinks.push(link);
            link = null;
          }
      }

      createInstance = fn.createInstance(id, instances, build, tools, l10nMap, CLONE_NORMALIZATION_TEXT_BUG);

      return {
        createInstance: function(obj, onAction, onRebuild, bindings, bindingInterface){
          var instanceId = seed++;
          var instance = createInstance(instanceId, obj, onAction, onRebuild, bindings, bindingInterface);
          
          instances[instanceId] = instance;

          return instance.tmpl;
        },
        destroyInstance: function(tmpl){
          var instanceId = tmpl.templateId_;
          var instance = instances[instanceId];

          if (instance)
          {
            // detach handler if any
            if (instance.handler)
              instance.bindingInterface.detach(instance.context, instance.handler, instance.tmpl.set);

            // detach attaches
            for(var key in instance.attaches)
              resolveValue.call(instance, key, null);

            delete instances[instanceId];
          }
        },
        
        keys: fn.keys,
        /** @cut */ instances_: instances,

        destroy: function(rebuild){
          for (var i = 0, link; link = l10nLinks[i]; i++)
            link.token.detach(link.handler, link);

          for (var key in instances)
          {
            var instance = instances[key];

            if (rebuild && instance.rebuild)
              instance.rebuild.call(instance.context);

            if (!rebuild || key in instances)
            {
              // detach handler if any
              if (instance.handler)
                instance.bindingInterface.detach(instance.context, instance.handler, instance.tmpl.set);

              // detach attaches
              for(var key in instance.attaches)
                resolveValue.call(key, null);
            }
          }

          if (templates[id] && templates[id].instances === instances)
            delete templates[id];

          fn = null;
          build = null;
          proto = null;
          l10nMap = null;
          l10nLinks = null;
          l10nProtoSync = null;
          instances = null;
        }
      };
    };
  })();  

 /**
  * @class
  */
  var HtmlTemplate = Template.subclass({
    className: namespace + '.Template',

    __extend__: function(value){
      if (value instanceof HtmlTemplate)
        return value;

      if (value instanceof TemplateSwitchConfig)
        return new HtmlTemplateSwitcher(value);

      return new HtmlTemplate(value);
    },

    builder: builder
  });


 /**
  * @class
  */
  var HtmlTemplateSwitcher = TemplateSwitcher.subclass({
    className: namespace + '.TemplateSwitcher',

    templateClass: HtmlTemplate
  });  


  //
  // exports name
  //

  module.exports = {
    Template: HtmlTemplate,
    TemplateSwitcher: HtmlTemplateSwitcher
  };

  //
  // for backward capability
  // TODO: remove
  //
  basis.template.extend({
    /** @cut using only in dev mode */ getDebugInfoById: getDebugInfoById,

    buildHtml: buildHtml,

    resolveTemplateById: resolveTemplateById,
    resolveObjectById: resolveObjectById,
    resolveTmplById: resolveTmplById
  });
