
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.l10n');
  basis.require('basis.template');

  var namespace = this.path;

  var document = global.document;
  var dom = basis.dom;
  var domEvent = basis.dom.event;
  var arrayFrom = basis.array.from;

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

  var ELEMENT_NAME = basis.template.ELEMENT_NAME;
  var ELEMENT_ATTRS = basis.template.ELEMENT_ATTRS;
  var ELEMENT_CHILDS = basis.template.ELEMENT_CHILDS;

  var TEXT_VALUE = basis.template.TEXT_VALUE;
  var COMMENT_VALUE = basis.template.COMMENT_VALUE;

  // Test for browser (IE) normalize text nodes during cloning
  var CLONE_NORMALIZE_TEXT_BUG = typeof window != 'undefined' && (function(){
    return dom.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
  })();

  var quoteEscape = /"/g;

  var eventAttr = /^event-(.+)+/;

  // dictionaries
  var tmplEventListeners = {};
  var tmplNodeMap = { seed: 1 };
  var namespaceURI = {
    svg: 'http://www.w3.org/2000/svg'
  };

 /**
  *
  */
  var buildPathes = (function(){
    var PATH_REF_NAME = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.toArray();

    var pathList;
    var refList;
    var bindingList;
    var objectRefList;
    var rootPath;

    function putRefs(refs, pathIdx){
      for (var i = 0, refName; refName = refs[i]; i++)
        if (refName.indexOf(':') == -1)
          refList.push(refName + ':' + pathIdx);
    }

    function putPath(path){
      var len = pathList.length;
      var pathRef = PATH_REF_NAME[len] || ('r' + len);

      pathList.push(pathRef + '=' + path);

      return pathRef;
    }

    function putBinding(binding){
      bindingList.push(binding);
    }
  
    function processTokens(tokens, path){
      var localPath;
      var attrs;
      var childs;
      var refs;
      var myRef;
      var explicitRef;
      var bindings;

      for (var i = 0, cp = 0, token; token = tokens[i]; i++, cp++, explicitRef = false)
      {
        if (!i)
          localPath = path + '.firstChild';
        else
        {
          if (!tokens[i + 1])
            localPath = path + '.lastChild';
          else
          {
            // fix bug with normalize text node in IE8-
            if (CLONE_NORMALIZE_TEXT_BUG && token[TOKEN_TYPE] == tokens[i - 1][TOKEN_TYPE] && token[TOKEN_TYPE] == TYPE_TEXT)
              cp++;

            localPath = path + '.childNodes[' + cp + ']';
          }
        }

        if (refs = token[TOKEN_REFS])
        {
          explicitRef = true;
          localPath = putPath(localPath);
          putRefs(refs, localPath);
        }

        if (token[TOKEN_BINDINGS])
        {
          if (!explicitRef)
          {
            explicitRef = true;
            localPath = putPath(localPath);
          }

          putBinding([token[TOKEN_TYPE], localPath, token[TOKEN_BINDINGS]]);
        }


        if (token[TOKEN_TYPE] == TYPE_ELEMENT)
        {
          myRef = -1;

          if (!i && path == rootPath)
            objectRefList.push(localPath);

          if (!explicitRef)
          {
            localPath = putPath(localPath);
            myRef = pathList.length;
          }

          if (attrs = token[ELEMENT_ATTRS]) // attrs
            for (var j = 0, attr; attr = attrs[j]; j++)
            {
              var attrName = attr[ATTR_NAME];

              if (refs = attr[TOKEN_REFS])
              {
                explicitRef = true;
                putRefs(refs, putPath(localPath + '.getAttributeNode("' + attrName + '")'));
              }

              if (bindings = attr[TOKEN_BINDINGS])
              {
                explicitRef = true;

                switch (attrName)
                {
                  case 'class':
                    for (var k = 0, binding; binding = bindings[k]; k++)
                      putBinding([2, localPath, binding[1], attrName, binding[0]].concat(binding.slice(2)));
                  break;

                  case 'style':
                    for (var k = 0, property; property = bindings[k]; k++)
                      for (var m = 0, bindName; bindName = property[0][m]; m++)
                        putBinding([2, localPath, bindName, attrName, property[0], property[1], property[2]]);
                  break;

                  default:
                    for (var k = 0, bindName; bindName = bindings[0][k]; k++)
                      putBinding([2, localPath, bindName, attrName, bindings[0], bindings[1], token[ELEMENT_NAME]]);
                }
              }
            }

          if (childs = token[ELEMENT_CHILDS]) // childs
            processTokens(childs, localPath);

          if (!explicitRef && myRef == pathList.length)
            pathList.pop();
        }
      }
    }

    return function(tokens, path){
      pathList = [];
      refList = [];
      bindingList = [];
      objectRefList = [];
      rootPath = path || '_';

      processTokens(tokens, rootPath);

      return {
        path: pathList,
        ref: refList,
        binding: bindingList,
        objectRefList: objectRefList
      };
    };
  })();


 /**
  * Build functions for creating instance of template.
  */
  var makeFunctions = (function(){

    var WHITESPACE = /\s+/;
    var W3C_DOM_NODE_SUPPORTED = typeof Node == 'function' && document instanceof Node;
    var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;
    var TRANSITION_SUPPORTED = !!(document && (function(){
      var properties = ['webkitTransition', 'MozTransition', 'msTransition', 'OTransition', 'transition'];
      var style = document.documentElement.style;
      for (var i = 0; i < properties.length; i++)
        if (properties[i] in style)
          return true;
      return false;
    })());

    var SPECIAL_ATTR_MAP = {
      disabled: true,
      checked: ['input'],
      value: ['input', 'textarea'],
      minlength: ['input'],
      maxlength: ['input'],
      selected: ['option']
    };


   /**
    * @func
    */
    function templateBindingUpdateFactory(names, getters){
      return function templateBindingUpdate(){
        for (var i = 0, bindingName; bindingName = names[i]; i++)
          this.tmpl.set(bindingName, getters[bindingName](this));
      };
    }

   /**
    * @func
    */
    function getBindingFactory(templateBindings){
      var bindingCache = {};
      return function getBinding(bindings, testNode){
        var cacheId = 'bindingId' in bindings
          ? bindings.bindingId
          : null;

        ;;;if (!cacheId) console.warn('basis.template.Template.getBinding: bindings has no bindingId property, cache is not used');

        var result = bindingCache[cacheId];

        if (!result)
        {
          var names = [];
          var getters = {};
          var events = {};
          var handler;
          for (var key in templateBindings)
          {
            var binding = bindings[key];
            var getter = binding && binding.getter;

            if (getter)
            {
              getters[key] = getter;
              names.push(key);

              if (binding.events)
              {
                var eventList = String(binding.events).qw();
                for (var i = 0, eventName; eventName = eventList[i]; i++)
                {
                  ;;;if (testNode && ('event_' + eventName) in testNode == false && typeof console != 'undefined') console.warn('basis.template.Template.getBinding: unknown event `' + eventName + '` for ' + (testNode.constructor && testNode.constructor.className));
                  if (events[eventName])
                  {
                    events[eventName].push(key);
                  }
                  else
                  {
                    handler = handler || {};
                    events[eventName] = [key];
                    handler[eventName] = templateBindingUpdateFactory(events[eventName], getters);
                  }
                }
              }
            }
          }

          result = {
            names: names,
            events: events,
            sync: templateBindingUpdateFactory(names, getters),
            handler: handler
          };

          if (cacheId)
            bindingCache[cacheId] = result;
        }

        return result;
      };
    }

   /**
    * @func
    */
    var bind_node = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue){
          var newNode = domRef;

          if (newValue instanceof Node)
          {
            if (newValue.nodeType == 11)  // fragment
            {
              if (newValue.firstChild === newValue.lastChild)
                newNode = newValue.firstChild;
              else
                newNode = arrayFrom(newValue);
            }
            else
              newNode = newValue;
          }
          /*else
          {
            if (newValue && Array.isArray(newValue))
              if (newValue.length == 1)
                newNode = newValue[0];
              else
                newNode = arrayFrom(newValue);
          }*/

          if (newNode !== oldNode)
          {
            if (Array.isArray(newNode))
            {
              if (oldNode.fragmentStart)
              {
                newNode.fragmentStart = oldNode.fragmentStart;
                newNode.fragmentEnd = oldNode.fragmentEnd;

                var cursor = newNode.fragmentStart.nextSibling;
                while (cursor && cursor != newNode.fragmentEnd)
                {
                  var tmp = cursor;
                  cursor = cursor.nextSibling;
                  tmp.parentNode.removeChild(tmp);
                }
              }
              else
              {
                newNode.fragmentStart = document.createComment('start');
                newNode.fragmentEnd = document.createComment('end');
                oldNode.parentNode.insertBefore(newNode.fragmentStart, oldNode);
                oldNode.parentNode.replaceChild(newNode.fragmentEnd, oldNode);
              }

              for (var i = 0, node; node = newNode[i]; i++)
                newNode.fragmentEnd.parentNode.insertBefore(node, newNode.fragmentEnd);
            }
            else
            {
              if (oldNode && oldNode.fragmentStart)
              {
                var cursor = oldNode.fragmentStart.nextSibling;
                while (cursor && cursor != oldNode.fragmentEnd)
                {
                  var tmp = cursor;
                  cursor = cursor.nextSibling;
                  tmp.parentNode.removeChild(tmp);
                }
                oldNode.fragmentStart.parentNode.removeChild(oldNode.fragmentStart);
                oldNode = oldNode.fragmentEnd;
              }

              oldNode.parentNode.replaceChild(newNode, oldNode);
            }
          }

          return newNode;
        }
      // Old browsers way (IE6-8 and other)
      : function(domRef, oldNode, newValue){
          var newNode = newValue && typeof newValue == 'object' ? newValue : domRef;

          if (newNode !== oldNode)
            try {
              oldNode.parentNode.replaceChild(newNode, oldNode);
            } catch(e) {
              newNode = domRef;
              if (oldNode !== newNode)
                oldNode.parentNode.replaceChild(newNode, oldNode);
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
                setTimeout(function(){
                  domRef.classList.remove(newClass + '-anim');
                }, 0);
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
            var classList = domRef.className.split(WHITESPACE);

            if (oldClass)
              classList.remove(oldClass);

            if (newClass)
            {
              classList.push(newClass);

              if (anim)
              {
                classList.add(newClass + '-anim');
                setTimeout(function(){
                  var classList = domRef.className.split(WHITESPACE);
                  classList.remove(newClass + '-anim');
                  domRef.className = classList.join(' ');
                }, 0);
              }
            }

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
          domRef.style[propertyName.camelize()] = newValue;
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
    * @param {object} binding
    * @param {boolean=} l10n
    */
    function buildAttrExpression(binding, l10n){
      var expression = [];
      var symbols = binding[5];
      var dictionary = binding[4];
      var exprVar;
      var colonPos;

      for (var j = 0; j < symbols.length; j++)
        if (typeof symbols[j] == 'string')
          expression.push('"' + symbols[j].replace(quoteEscape, '\\"') + '"');
        else
        {
          exprVar = dictionary[symbols[j]];
          colonPos = exprVar.indexOf(':');
          if (colonPos == -1)
            expression.push(l10n ? '"{' + exprVar + '}"' : '__' + exprVar);
          else
            expression.push('__l10n["' + exprVar.substr(colonPos + 1) + '"]');
        }

      if (expression.length == 1)
        expression.push('""');

      return expression.join('+');
    }

    var bindFunctions = {
      1: 'bind_element',
      3: 'bind_textNode',
      8: 'bind_comment'
    };

   /**
    * @func
    */
    function buildBindings(bindings){
      var bindMap = {};
      var bindCode;
      var bindVar;
      var varList = [];
      var result = [];
      var varName;
      var l10nMap;
      var toolsUsed = {};
      var specialAttr;
      ;;;var debugList = [];

      for (var i = 0, binding; binding = bindings[i]; i++)
      {
        var bindType = binding[0];
        var domRef = binding[1];
        var bindName = binding[2];

        var namePart = bindName.split(':');
        var anim = namePart[0] == 'anim';
        if (anim)
        {
          bindName = namePart[1];
          anim = TRANSITION_SUPPORTED;
        }

        bindCode = bindMap[bindName];
        bindVar = '_' + i;
        varName = '__' + bindName;

        if (namePart[0] == 'l10n' && namePart[1])
        {
          var l10nName = namePart[1];

          if (!l10nMap)
            l10nMap = {};

          if (!bindMap[l10nName])
          {
            bindMap[l10nName] = [];
            l10nMap[l10nName] = [];
          }

          bindCode = bindMap[l10nName];
          bindCode.l10n = true;

          if (binding[0] == TYPE_TEXT)
          {
            ;;;debugList.push('{binding:"' + l10nName + '",dom:' + domRef + ',val:__l10n["' + l10nName + '"],attachment:l10nToken("' + l10nName + '")}');
            ;;;toolsUsed.l10nToken = true;
            bindCode.push(domRef + '.nodeValue=__l10n["' + l10nName + '"];');
            l10nMap[l10nName].push(domRef + '.nodeValue=value;');
          }
          else
          {
            attrName = '"' + binding[ATTR_NAME] + '"';
            l10nMap[l10nName].push('bind_attr(' + [domRef, attrName, 'NaN', buildAttrExpression(binding, true)] + ');');

            toolsUsed.bind_attr = true;
            varList.push(bindVar);
            bindCode.push(
              bindVar + '=bind_attr(' + [domRef, attrName, bindVar, buildAttrExpression(binding)] + ');'
            );
          }

          continue;
        }

        if (!bindMap[bindName])
        {
          bindCode = bindMap[bindName] = [];
          varList.push(varName);
        }

        if (bindType != TYPE_ATTRIBUTE)
        {
          ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

          var bindFunction = bindFunctions[bindType];
          varList.push(bindVar + '=' + domRef);
          toolsUsed[bindFunction] = true;
          bindCode.push(
            bindVar + '=' + bindFunction + '(' + [domRef, bindVar] + ',value);'
          );
        }
        else
        {
          var attrName = binding[ATTR_NAME];

          ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',attr:"' + attrName + '",val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

          switch (attrName)
          {
            case 'class':
              var defaultExpr = '';
              var valueExpr = 'value';
              var prefix = binding[4];

              if (binding.length >= 6)
              {
                if (binding.length == 6 || typeof binding[6] == 'string') // bool
                {
                  if (binding.length == 6)
                  {
                    valueExpr = 'value?"' + bindName + '":""';
                    if (binding[5])
                      defaultExpr = prefix + bindName;
                  }
                  else
                  {
                    prefix = '';
                    valueExpr = 'value?"' + binding[6] + '":""';
                    if (binding[5])
                      defaultExpr = binding[6];
                  }
                }
                else // enum
                {
                  if (binding.length == 7)
                  {
                    valueExpr = binding[6].map(function(val){ return 'value=="' + val + '"'; }).join('||');
                    
                    if (!valueExpr)  // if enum list is empty - ignore binding; Probably we should remove it in makeDeclaration
                      continue;

                    valueExpr += '?value:""';
                    if (binding[5])
                      defaultExpr = prefix + binding[6][binding[5] - 1];
                  }
                  else
                  {
                    prefix = "";
                    valueExpr = [];
                    var values = binding[6];
                    for (var jj = 0; jj < values.length; jj++)
                      valueExpr.push('value=="' + values[jj] + '"?"' + binding[7][jj] + '"');
                    
                    if (!valueExpr.length)  // if enum list is empty - ignore binding; Probably we should remove it in makeDeclaration
                      continue;

                    valueExpr.push('""');
                    valueExpr = valueExpr.join(':');
                    if (binding[5])
                      defaultExpr = binding[7][binding[5] - 1];
                  }
                }
              }

              varList.push(bindVar + '="' + defaultExpr + '"');
              toolsUsed.bind_attrClass = true;
              bindCode.push(
                bindVar + '=bind_attrClass(' + [domRef, bindVar, valueExpr, '"' + prefix + '"'] + (anim ? ',1' : '') + ');'
              );

              break;

            case 'style':
              varList.push(bindVar + '=""');
              toolsUsed.bind_attrStyle = true;
              bindCode.push(
                bindVar + '=bind_attrStyle(' + [domRef, '"' + binding[6] + '"', bindVar, buildAttrExpression(binding)] + ');'
              );

              break;

            default:
              varList.push(bindVar + '=' + buildAttrExpression(binding, true));
              toolsUsed.bind_attr = true;
              bindCode.push(
                bindVar + '=bind_attr(' + [domRef, '"' + attrName + '"', bindVar, buildAttrExpression(binding)] + ');'
              );

              specialAttr = SPECIAL_ATTR_MAP[attrName];
              if (specialAttr)
              {
                if (specialAttr === true || specialAttr.has(binding[6].toLowerCase()))
                {
                  bindCode.push('if(' + domRef + '.' + attrName + '!=' + bindVar + ')' + domRef + '.' + attrName + '=' + bindVar + ';');
                }
              }
          }
        }
      }

      result.push(
        'function set(bindName,value){\n' +
          'value=resolve(attaches,updateAttach,bindName,value);' +
          'switch(bindName){'
      );

      for (var bindName in bindMap)
        result.push(
          'case"' + bindName + '":\n' +
          (bindMap[bindName].l10n
            ? bindMap[bindName].join('\n')
            : 'if(__' + bindName + '!==value)' +
              '{' +
                '__' + bindName + '=value;\n' +
                bindMap[bindName].join('\n') +
              '}') +
          'break;'
        );

      result.push('}}');

      for (var key in toolsUsed)
        varList.push(key + '=tools.' + key);

      return {
        /** @cut */debugList: debugList,
        vars: varList,
        l10n: l10nMap,
        getBinding: getBindingFactory(bindMap),
        body: result.join('')
      };
    }

    function resolveValue(attaches, updateAttach, bindingName, value){
      var bridge = value && value.bindingBridge;
      var oldAttach = attaches[bindingName];

      if (bridge || oldAttach)
      {
        if (bridge)
        {
          if (value !== oldAttach)
          {
            if (oldAttach)
              oldAttach.bindingBridge.detach(oldAttach, updateAttach, bindingName);
            bridge.attach(value, updateAttach, bindingName);
            attaches[bindingName] = value;
          }

          value = bridge.get(value);
        }
        else
        {
          if (oldAttach)
          {
            oldAttach.bindingBridge.detach(oldAttach, updateAttach, bindingName);
            delete attaches[bindingName];
          }
        }
      }
      return value;
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
      l10nToken: basis.l10n.getToken
    };

    return function(tokens){
      var paths = buildPathes(tokens, '_');
      var bindings = buildBindings(paths.binding);
      var proto = buildHtml(tokens);
      var templateMap = {};
      var l10nMap;

      if (bindings.l10n)
      {
        l10nMap = {};

        var code = [];
        for (var key in bindings.l10n)
          code.push(
            'case"' + key +'":\n' +
            'if(value==null)value="{' + key + '}";' +
            '__l10n[token]=value;' +
            bindings.l10n[key].join(';') +
            'break;'
          );

        var l10nProtoUpdate = new Function('_', '__l10n', 'bind_attr', 'var ' + paths.path + ';return function(token, value){' +
          'switch(token){' +
            code.join('') +
          '}' +
        '}');
        //console.log(l10nProtoUpdate);
        l10nProtoUpdate = l10nProtoUpdate(proto, l10nMap, bind_attr);

        //console.log('>>>> ' + l10nProtoUpdate);

        for (var key in bindings.l10n)
          l10nProtoUpdate(key, basis.l10n.getToken(key).value);
      }

      var build = function(){
        return proto.cloneNode(true);
      };

      var objectRefs = paths.objectRefList;
      for (var i = 0; objectRefs[i]; i++)
        objectRefs[i] += '.basisObjectId';

      objectRefs = objectRefs.join('=');

      /** @cut */try {
      var fnBody;
      var createInstance = new Function('gMap', 'tMap', 'build', 'tools', '__l10n', fnBody = 'return function createInstance_(obj,actionCallback,updateCallback){' + 
        'var id=gMap.seed++,attaches={},resolve=tools.resolve,_=build(),' + paths.path.concat(bindings.vars) + ';\n' +
        (objectRefs ? 'if(obj)gMap[' + objectRefs + '=id]=obj;\n' : '') +
        'function updateAttach(){set(String(this),attaches[this])};\n' +
        bindings.body +
        /**@cut*/';set.debug=function(){return[' + bindings.debugList.join(',') + ']}' +
        ';return tMap[id]={' + [paths.ref, 'set:set,rebuild:function(){if(updateCallback)updateCallback.call(obj)},' +
        'destroy:function(){' +
          'for(var key in attaches)if(attaches[key])attaches[key].bindingBridge.detach(attaches[key],updateAttach,key);' +
          'attaches=null;' +
          /**@cut*/'delete set.debug;' + 
          'delete tMap[id];' + 
          'delete gMap[id];' +
          '}'] +
        '}' +
      '}');
      //console.log(createInstance);
      createInstance = createInstance(tmplNodeMap, templateMap, build, tools, l10nMap);
      /** @cut */} catch(e) { console.warn("can't build createInstance\n", fnBody); }

      return {
        createInstance: createInstance,
        getBinding: bindings.getBinding,
        l10nProtoUpdate: l10nProtoUpdate,
        l10n: bindings.l10n,
        map: templateMap
      };
    };
  })();


  //
  // Constructs dom structure
  //

 /**
  * @func
  */
  function findHostNode(cursor){
    var refId;
    var node;

    do {
      if (refId = cursor.basisObjectId)
      {
        // if node found, return it
        if (node = tmplNodeMap[refId])
          return node;
      }
    } while (cursor = cursor.parentNode);

    return cursor;
  }

 /**
  * @func
  */
  function createEventHandler(attrName){
    return function(event){
      if (event && event.type == 'click' && event.which == 3)
        return;

      var cursor = domEvent.sender(event);
      var attr;
      var refId;

      // IE events may have no source
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

      // search for nearest node refer to basis.Class instance
      var node = findHostNode(cursor);
      if (node && typeof node.templateAction == 'function')
      {
        var actions = attr.nodeValue.qw();
        for (var i = 0, actionName; actionName = actions[i++];)
          node.templateAction(actionName, domEvent(event));
      }
    };
  }

  function createEventTrigger(eventName){
    return function(){
      domEvent.fireEvent(document, eventName);
    };
  }

 /**
  * Creates dom structure by declaration.
  */
  var buildHtml = function(tokens){
    var result = document.createDocumentFragment();
    var attrs;
    var children;
    var element;

    for (var i = 0, token; token = tokens[i]; i++)
    {
      switch(token[TOKEN_TYPE])
      {
        case TYPE_ELEMENT: 
          var tagName = token[ELEMENT_NAME];
          var parts = tagName.split(/:/);

          element = parts.length > 1
            ? document.createElementNS(namespaceURI[parts[0]], tagName)
            : document.createElement(tagName);

          // process for attributes
          if (attrs = token[ELEMENT_ATTRS])
          {
            for (var j = 0, attr; attr = attrs[j]; j++)
            {
              var attrName = attr[ATTR_NAME];
              var m;

              element.setAttribute(attrName, attr[ATTR_VALUE]);

              if (m = attrName.match(eventAttr))
              {
                var eventName = m[1];
                if (!tmplEventListeners[eventName])
                {
                  tmplEventListeners[eventName] = createEventHandler(attrName);

                  for (var k = 0, names = domEvent.browserEvents(eventName), browserEventName; browserEventName = names[k++];)
                    domEvent.addGlobalHandler(browserEventName, tmplEventListeners[eventName]);
                }

                // hack for non-bubble events in IE<=8
                if (!domEvent.W3CSUPPORT)
                {
                  var eventInfo = domEvent.getEventInfo(eventName, tagName);
                  if (eventInfo.supported && !eventInfo.bubble)
                    element.attachEvent('on' + eventName, createEventTrigger(eventName));
                }
              }
            }
          }

          // precess for children
          if (children = token[ELEMENT_CHILDS]) // children
            element.appendChild(buildHtml(children));

          // add to result
          result.appendChild(element);
          break;

        case TYPE_COMMENT:
          result.appendChild(document.createComment(token[COMMENT_VALUE] || (token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : '')));
          break;

        case TYPE_TEXT:
          // fix bug with normalize text node in IE8-
          if (CLONE_NORMALIZE_TEXT_BUG && i && tokens[i - 1][TOKEN_TYPE] == TYPE_TEXT)
            result.appendChild(document.createComment(''));

          result.appendChild(document.createTextNode(token[TEXT_VALUE] || (token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : '') || (token[TOKEN_BINDINGS] ? '!' : '')));
          break;
      }
    }

    return result;
  };

  function resolveObjectById(refId){
    return tmplNodeMap[refId];
  }

  var HtmlTemplate = Template.subclass({
    className: namespace + '.Template',

    __extend__: function(value){
      if (value instanceof HtmlTemplate)
        return value;
      else
        return new HtmlTemplate(value);
    },

    builder: makeFunctions
  });


  //
  // exports name
  //

  module.exports = {
    Template: HtmlTemplate
  };

  //
  // for backward capability
  // TODO: remove
  //
  basis.template.extend({
    buildPathes: buildPathes,
    makeFunctions: makeFunctions,
    buildHtml: buildHtml,
    resolveObjectById: resolveObjectById
  });
