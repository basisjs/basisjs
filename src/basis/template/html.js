
 /**
  * @namespace basis.template.html
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Node = global.Node;
  var camelize = basis.string.camelize;

  var isMarkupToken = require('basis.l10n').isMarkupToken;
  var getL10nToken = require('basis.l10n').token;
  var getFunctions = require('basis.template.htmlfgen').getFunctions;

  var basisTemplate = require('basis.template');
  var TemplateSwitchConfig = basisTemplate.TemplateSwitchConfig;
  var TemplateSwitcher = basisTemplate.TemplateSwitcher;
  var Template = basisTemplate.Template;
  var getSourceByPath = basisTemplate.get;

  var buildDOM = require('basis.template.buildDom');
  var CLONE_NORMALIZATION_TEXT_BUG = require('basis.template.const').CLONE_NORMALIZATION_TEXT_BUG;


  //
  // main part
  //

  // test set style properties doesn't throw an error (IE8 and lower)
  var IS_SET_STYLE_SAFE = !!(function(){
    try {
      return document.documentElement.style.color = 'x';
    } catch(e) {}
  })();


  //
  // l10n
  //
  var l10nTemplates = {};

  function getSourceFromL10nToken(token){
    var dict = token.dictionary;
    var url = dict.resource ? dict.resource.url : '';
    var id = token.name + '@' + url;
    var sourceWrapper;
    var result = token.as(function(value){
      if (token.getType() == 'markup')
      {
        if (value != this.value)
          if (sourceWrapper)
          {
            sourceWrapper.detach(token, token.apply);
            sourceWrapper = null;
          }

        if (value && String(value).substr(0, 5) == 'path:')
        {
          sourceWrapper = getSourceByPath(value.substr(5));
          sourceWrapper.attach(token, token.apply);
        }

        return sourceWrapper ? sourceWrapper.bindingBridge.get(sourceWrapper) : value;
      }

      return this.value;
    });

    result.id = '{l10n:' + id + '}';
    result.url = url + ':' + token.name;

    return result;
  }

  function getL10nHtmlTemplate(token){
    if (typeof token == 'string')
      token = getL10nToken(token);

    if (!token)
      return null;

    var id = token.basisObjectId;
    var htmlTemplate = l10nTemplates[id];

    if (!htmlTemplate)
    {
      htmlTemplate = l10nTemplates[id] = new HtmlTemplate(getSourceFromL10nToken(token));
      htmlTemplate.protoOnly = true;
    }

    return htmlTemplate;
  }


  //
  // html template
  //

 /**
  * Build functions for creating instance of template.
  */
  var builder = (function(){

    var WHITESPACE = /\s+/;
    var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;
    var W3C_DOM_NODE_SUPPORTED = (function(){
      try {
        // typeof Node returns 'object' instead of 'function' in Safari (at least 7.1.2)
        // so try check document is instanceof Node, but this may occurs to exception in old IE
        return document instanceof Node;
      } catch(e) {}
    })() || false;


   /**
    * @func
    */
    var bind_node = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue, domNodeBindingProhibited){
          var newNode = !domNodeBindingProhibited && newValue && newValue instanceof Node ? newValue : domRef;

          if (newNode !== oldNode)
          {
            if (newNode.nodeType === 11 && !newNode.insertedNodes)
            {
              newNode.insertBefore(document.createTextNode(''), newNode.firstChild);
              newNode.insertedNodes = basis.array(newNode.childNodes);
            }

            if (oldNode.nodeType === 11)
            {
              var insertedNodes = oldNode.insertedNodes;
              if (insertedNodes)
              {
                oldNode = insertedNodes[0];
                for (var i = 1, node; node = insertedNodes[i]; i++)
                  oldNode.parentNode.removeChild(node);
              }
            }

            oldNode.parentNode.replaceChild(newNode, oldNode);
          }

          return newNode;
        }
      // Old browsers way (IE6-8 and other)
      : function(domRef, oldNode, newValue, domNodeBindingProhibited){
          var newNode = !domNodeBindingProhibited && newValue && typeof newValue == 'object' ? newValue : domRef;

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
    var bind_element = function(domRef, oldNode, newValue, domNodeBindingProhibited){
      var newNode = bind_node(domRef, oldNode, newValue, domNodeBindingProhibited);

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
    var bind_textNode = function(domRef, oldNode, newValue, domNodeBindingProhibited){
      var newNode = bind_node(domRef, oldNode, newValue, domNodeBindingProhibited);

      if (newNode === domRef)
        // explicit convert to string to be consistent across browsers:
        // some browsers set string value of null/undefined, but some set empty string instead
        domRef.nodeValue = String(newValue);

      return newNode;
    };

   /**
    * @func
    */
    var bind_attrClass = CLASSLIST_SUPPORTED
      // classList supported
      ? function(domRef, oldClass, newValue, anim){
          var newClass = newValue ? newValue : '';

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
      : function(domRef, oldClass, newValue, anim){
          var newClass = newValue ? newValue : '';

          if (newClass != oldClass)
          {
            var className = domRef.className;
            var classNameIsObject = typeof className != 'string';
            var classList;

            if (classNameIsObject)
              className = className.baseVal;

            classList = className.split(WHITESPACE);

            if (oldClass)
              basis.array.remove(classList, oldClass);

            if (newClass)
            {
              classList.push(newClass);

              if (anim)
              {
                basis.array.add(classList, newClass + '-anim');
                basis.nextTick(function(){
                  var classList = (classNameIsObject ? domRef.className.baseVal : domRef.className).split(WHITESPACE);

                  basis.array.remove(classList, newClass + '-anim');

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
    var bind_attrStyle = IS_SET_STYLE_SAFE
      ? function(domRef, propertyName, oldValue, newValue){
          if (oldValue !== newValue)
            domRef.style[camelize(propertyName)] = newValue;

          return newValue;
        }
      : function(domRef, propertyName, oldValue, newValue){
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
          if (!oldAttach ||
              value !== oldAttach.value ||
              (!oldAttach.tmpl && isMarkupToken(value)))
          {
            if (oldAttach)
            {
              if (oldAttach.tmpl)
                getL10nHtmlTemplate(oldAttach.value).clearInstance(oldAttach.tmpl);

              oldAttach.value.bindingBridge.detach(oldAttach.value, updateAttach, oldAttach);
            }

            if (isMarkupToken(value))
            {
              var template = getL10nHtmlTemplate(value);
              var context = this.context;
              var bindings = this.bindings;
              var bindingInterface = this.bindingInterface;
              tmpl = template.createInstance(context, null, function onRebuild(){
                tmpl = newAttach.tmpl = template.createInstance(context, null, onRebuild, bindings, bindingInterface);
                tmpl.parent = tmpl.element.parentNode || tmpl.element;
                updateAttach.call(newAttach);
              }, bindings, bindingInterface);
              tmpl.parent = tmpl.element.parentNode || tmpl.element;
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
            tmpl = value && isMarkupToken(value) ? oldAttach.tmpl : null;

          if (tmpl)
            return tmpl.parent;

          value = bridge.get(value);
        }
        else
        {
          if (oldAttach)
          {
            if (oldAttach.tmpl)
              getL10nHtmlTemplate(oldAttach.value).clearInstance(oldAttach.tmpl);

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
      var name1 = names[0];
      var name2 = names[1];
      var getter1 = getters[name1];
      var getter2 = getters[name2];

      switch (names.length) {
        case 1:
          return function bindingUpdater1(object){
            this(name1, getter1(object));
          };

        case 2:
          return function bindingUpdater2(object){
            this(name1, getter1(object));
            this(name2, getter2(object));
          };

        default:
          var getters_ = names.map(function(name){
            return getters[name];
          });
          return function bindingUpdaterN(object){
            for (var i = 0; i < names.length; i++)
              this(names[i], getters_[i](object));
          };
      };
    }

    function makeHandler(events, getters){
      for (var name in events)
        events[name] = createBindingUpdater(events[name], getters);

      return name ? events : null;
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

          result = {
            names: names,
            sync: createBindingUpdater(names, getters),
            handler: makeHandler(events, getters)
          };

          if (cacheId)
            bindingCache[cacheId] = result;
        }

        if (set)
          result.sync.call(set, obj);

        if (!bindingInterface)
          return;

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
      l10nToken: getL10nToken,
      createBindingFunction: createBindingFunction
    };

    return function(tokens, instances){
      var fn = getFunctions(tokens, true, this.source.url, tokens.source_, !CLONE_NORMALIZATION_TEXT_BUG);
      var hasL10n = fn.createL10nSync;
      var createInstance;
      var l10nProtoSync;
      var l10nMap = {};
      var l10nLinks = [];
      var l10nMarkupTokens = [];
      var seed = 0;
      var proto = {
        cloneNode: function(){
          if (!protoOnly && seed == 1)
            return buildDOM(tokens);

          proto = buildDOM(tokens);
          if (hasL10n)
          {
            l10nProtoSync = fn.createL10nSync(proto, l10nMap, bind_attr, CLONE_NORMALIZATION_TEXT_BUG);
            for (var i = 0, l10nToken; l10nToken = l10nLinks[i]; i++)
              l10nProtoSync(l10nToken.path, l10nMap[l10nToken.path]);
          }

          return proto.cloneNode(true);
        }
      };

      // temporary solution as l10n markup token templates aren't work
      // with no proto cloning (tests fail with exception)
      // TODO: investigate case and remove this flag
      var protoOnly = this.protoOnly;

      var createDOM = function(){
        return proto.cloneNode(true);
      };

      if (hasL10n)
      {
        var initL10n = function(set){
          for (var i = 0, token; token = l10nLinks[i]; i++)
            set(token.path, l10nMap[token.path]);
        };
        var linkHandler = function(value){
          var isMarkup = isMarkupToken(this.token);

          if (isMarkup)
            basis.array.add(l10nMarkupTokens, this);
          else
            basis.array.remove(l10nMarkupTokens, this);

          l10nMap[this.path] = isMarkup ? undefined : value == null ? '{' + this.path + '}' : value;
          if (l10nProtoSync)
            l10nProtoSync(this.path, l10nMap[this.path]);

          for (var key in instances)
            instances[key].tmpl.set(this.path, isMarkup ? this.token : value);
        };

        l10nLinks = fn.l10nKeys.map(function(key){
          var token = getL10nToken(key);
          var link = {
            path: key,
            token: token,
            handler: linkHandler
          };

          token.attach(linkHandler, link);

          if (isMarkupToken(token))
            l10nMarkupTokens.push(link);
          else
            l10nMap[key] = token.value == null ? '{' + key + '}' : token.value;

          return link;
        });
      }

      createInstance = fn.createInstance(
        this.templateId, instances, createDOM, tools,
        l10nMap, CLONE_NORMALIZATION_TEXT_BUG
      );

      return {
        createInstance: function(obj, onAction, onRebuild, bindings, bindingInterface){
          var instanceId = seed++;
          var instance = createInstance(
            instanceId, obj, onAction, onRebuild,
            bindings, bindingInterface,
            hasL10n && !instanceId && !protoOnly ? initL10n : null
          );

          if (hasL10n && l10nMarkupTokens.length)
            for (var i = 0, l10nToken; l10nToken = l10nMarkupTokens[i]; i++)
              instance.tmpl.set(l10nToken.path, l10nToken.token);

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
            for (var key in instance.attaches)
              resolveValue.call(instance, key, null);

            delete instances[instanceId];
          }
        },

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
              for (var key in instance.attaches)
                resolveValue.call(key, null);
            }
          }

          fn = null;
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
