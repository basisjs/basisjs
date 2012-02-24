/**
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');
basis.require('basis.dom.event');

(function(basis, global){

  'use strict';

 /**
  * @namespace basis.template
  */

  var namespace = 'basis.template';


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var dom = basis.dom;
  var domEvent = basis.dom.event;


  //
  // Main part
  //

  // token types
  /** @const */ var TYPE_ELEMENT = 1;
  /** @const */ var TYPE_ATTRIBUTE = 2;
  /** @const */ var TYPE_TEXT = 3;
  /** @const */ var TYPE_COMMENT = 8;

  // references on fields in declaration
  /** @const */ var TOKEN_TYPE = 0
  /** @const */ var TOKEN_BINDINGS = 1;
  /** @const */ var TOKEN_REFS = 2;

  /** @const */ var ATTR_NAME = 3;
  /** @const */ var ATTR_VALUE = 4;

  /** @const */ var ELEMENT_NAME = 3;
  /** @const */ var ELEMENT_ATTRS = 4;
  /** @const */ var ELEMENT_CHILDS = 5;

  /** @const */ var TEXT_VALUE = 3;
  /** @const */ var COMMENT_VALUE = 3;

  // parsing variables
  var SYNTAX_ERROR = 'Invalid or unsupported syntax';

  // html parsing states
  var TEXT = /((?:.|[\r\n])*?)(\{|<(\/|!--(\s*\{)?)?|$)/g;
  var TAG_NAME = /([a-z\_][a-z0-9\-\_]*)(\:|\{|\s*(\/?>)?)/ig;
  var ATTRIBUTE_NAME_OR_END = /([a-z\_][a-z0-9\-\_]*)(\:|\{|=|\s*)|(\/?>)/ig;
  var COMMENT = /.*?-->/ig;
  var CLOSE_TAG = /([a-z\_][a-z0-9\-\_]*(?:\:[a-z\_][a-z0-9\-\_]*)?)>/ig;
  var REFERENCE = /([a-z\_][a-z0-9\_]*)(\||\}\s*)/ig;
  var ATTRIBUTE_VALUE = /"((?:(\\")|[^"])*?)"\s*/g;

  var quoteEscape = /"/g;
  var quoteUnescape = /\\"/g;

  var eventAttr = /^event-(.+)+/;

  // dictonaries
  var tmplEventListeners = {};
  var tmplNodeMap = { seed: 1 };


 /**
  * Parse html into tokens.
  */
  var tokenize = function(source, debug){
    var result = [];
    var tagStack = [];
    var lastTag = { childs: result };
    var token;
    var bufferPos;
    var startPos;
    var parseTag = false;
    var textStateEndPos = 0;
    var textEndPos;
    var refMap = {};
    var refName;

    var state = TEXT;
    var pos = 0;
    var m;

    try {
      while (pos < source.length)
      {
        state.lastIndex = pos;
        startPos = pos;

        m = state.exec(source);

        if (!m || m.index !== pos)
        {
          //throw SYNTAX_ERROR;
          if (parseTag)
            lastTag = tagStack.pop();

          lastTag.childs.pop();

          parseTag = false;
          state = TEXT;
          continue;
        }

        pos = state.lastIndex;

        //stat[state] = (stat[state] || 0) + 1;
        switch(state)
        {
          case TEXT:

            textEndPos = startPos + m[1].length;

            if (textStateEndPos != textEndPos)
              lastTag.childs.push({
                type: TYPE_TEXT,
                value: textStateEndPos == startPos
                  ? m[1]
                  : source.substring(textStateEndPos, textEndPos)
              });

            textStateEndPos = textEndPos;

            if (m[2] == '{')
            {
              bufferPos = pos - 1;
              lastTag.childs.push(token = {
                type: TYPE_TEXT
              });
              state = REFERENCE;
            }
            else if (m[3])
            {
              if (m[3] == '/')
              {
                state = CLOSE_TAG;
              }
              else //if (m[3] == '!--')
              {
                lastTag.childs.push(token = {
                  type: TYPE_COMMENT
                });

                if (m[4])
                {
                  bufferPos = pos - m[4].length;
                  state = REFERENCE;
                }
                else
                {
                  bufferPos = pos;
                  state = COMMENT;
                }
              }
            }
            else if (m[2]) // m[2] == '<' open tag
            {
              parseTag = true;
              tagStack.push(lastTag);

              lastTag.childs.push(token = {
                type: TYPE_ELEMENT,
                attrs: [],
                childs: []
              });
              lastTag = token;

              state = TAG_NAME;
            }

            break;

          case CLOSE_TAG:
            if (m[1] !== (lastTag.prefix ? lastTag.prefix + ':' : '') + lastTag.name)
            {
              //throw 'Wrong close tag';
              lastTag.childs.push({
                type: TYPE_TEXT,
                value: '</' + m[0]
              });
            }
            else
              lastTag = tagStack.pop();

            state = TEXT;
            break;

          case TAG_NAME:
          case ATTRIBUTE_NAME_OR_END:
            if (m[2] == ':')
            {
              if (token.prefix)  // if '/' or prefix was before
                throw SYNTAX_ERROR;

              token.prefix = m[1];
              break;
            }

            if (m[1])
            {
              // store name (it may be null when check for attribute and end)
              token.name = m[1];

              // store attribute
              if (token.type == TYPE_ATTRIBUTE)
                lastTag.attrs.push(token);
            }

            if (m[2] == '{')
            {
              state = REFERENCE;
              break;
            }

            if (m[3]) // end tag declaration
            {
              if (m[3] == '/>') // otherwise m[3] == '>', nothing to do
                lastTag = tagStack.pop();

              parseTag = false;
              state = TEXT;
              break;
            }

            if (m[2] == '=') // ATTRIBUTE_NAME_OR_END only
            {
              state = ATTRIBUTE_VALUE;
              break;
            }

            // m[2] == '\s+' next attr, state doesn't change
            token = {
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;
            break;

          case COMMENT:
            token.value = source.substring(bufferPos, pos - 3);
            state = TEXT;
            break;

          case REFERENCE:
            refName = m[1];

            // if ref is already in use, remove it from another holder
            if (refMap[refName])
            {
              var holder = refMap[refName];

              ;;;if (debug) debug.push('Html parse: Dublicate reference `' + refName + '` in template');

              //token.refs.remove(refName);
              holder.refs.splice(holder.refs.indexOf(refName), 1);

              // if no more refs in list - delete it
              if (!holder.refs.length)
                delete holder.refs;
            }

            // add to map
            if (token.type != TYPE_TEXT)
              refMap[refName] = token;

            // add reference to token list name
            if (token.refs)
              token.refs.push(m[1]);
            else
              token.refs = [m[1]];

            // go next
            if (m[2] != '|') // m[2] == '}\s*'
            {
              if (token.type == TYPE_TEXT)
              {
                token.value = source.substring(bufferPos, pos);
                state = TEXT;
              }
              else if (token.type == TYPE_COMMENT)
              {
                state = COMMENT;
              }
              else if (token.type == TYPE_ATTRIBUTE && source[pos] == '=')
              {
                pos++;
                state = ATTRIBUTE_VALUE;
              }
              else // ATTRIBUTE || ELEMENT
              {
                token = {
                  type: TYPE_ATTRIBUTE
                };
                state = ATTRIBUTE_NAME_OR_END;
              }
            }

            // continue to collect references
            break;

          case ATTRIBUTE_VALUE:
            token.value = m[1].replace(quoteUnescape, '"');

            token = {
              type: TYPE_ATTRIBUTE
            };
            state = ATTRIBUTE_NAME_OR_END;

            break;

          default:
            throw 'Parser bug'; // Must never to be here; bug in parser otherwise
        }

        if (state == TEXT)
          textStateEndPos = pos;
      }

      if (state != TEXT)    // must end on text parsing
        throw SYNTAX_ERROR;

      if (!result.length)   // there must be at least one token in result
        result.push({ type: TYPE_TEXT, value: '' });

      if ('element' in refMap == false)
      {
        if (!result[0].refs)
          result[0].refs = ['element'];
        else
          result[0].refs.push('element');
      }

      if (tagStack.length > 1)
        throw 'No close tag for ' + tagStack.pop().name;

      result.templateDeclaration = true;

    } catch(e) {
      /*if (e === SYNTAX_ERROR)
        console.warn('Syntax error:\n' + source.substr(0, pos) + '\n** here **\n' + source.substr(pos));
      else
      /*var br = source.indexOf('\n', i);
      var offset = source.lastIndexOf('\n', i);
      if (br == -1)
        br = source.length;
      if (offset == -1)
        offset = 0;

      console.warn(e + ':\n' + source.substr(0, br) + '\n' + Array(i - offset + 1).join(' ') + '\u25b2-- problem here \n' + source.substr(br));
      /*/console.warn(e, source); /* */
    }

    return result;
  };

 /**
  * make compiled version of template
  */
  var makeDeclaration = (function(){

    var CLASS_ATTR_PARTS = /(\S+)/g;
    var CLASS_ATTR_BINDING = /^([a-z\_][a-z0-9\-\_]*)?\{([a-z\_][a-z0-9\-\_]*)\}$/i;
    var ATTR_BINDING = /\{([a-z\_][a-z0-9\_]*)\}/i;

    function name(token){
      return (token.prefix ? token.prefix + ':' : '') + token.name;
    }

    function refList(token){
      var array = token.refs;

      if (!array || !array.length)
        return 0;

      return array;
    }

    function attrs(token){
      var attrs = token.attrs;
      var result = [];
      var bindings;
      var parts;
      var m;

      for (var i = 0, attr; attr = attrs[i]; i++)
      {
        bindings = 0;

        if (attr.value)
        {
          if (attr.name == 'class')
          {
            if (parts = attr.value.match(CLASS_ATTR_PARTS))
            {
              var newValue = [];
              var map = {};
              var prefixes;

              bindings = [[]];

              for (var j = 0, part; part = parts[j]; j++)
              {
                if (m = part.match(CLASS_ATTR_BINDING))
                {
                  prefixes = map[m[2]];
                  if (!map[m[2]])
                  {
                    prefixes = map[m[2]] = [];
                    bindings[0].push(m[2]);
                    bindings.push(prefixes);
                  }
                  prefixes.push(m[1] || '');
                }
                else
                  newValue.push(part);
              }
              
              // set new value
              attr.value = newValue.join(' ');

              if (bindings.length == 1)
                bindings = 0;
            }
          }
          else
          {
            parts = attr.value.split(ATTR_BINDING);
            if (parts.length > 1)
            {
              var bindName;
              var names = [];
              var expression = [];
              var map = {};
              
              for (var j = 0; j < parts.length; j++)
                if (j % 2)
                {
                  bindName = parts[j];
                  
                  if (!map[bindName])
                  {
                    map[bindName] = names.length;
                    names.push(bindName);
                  }

                  expression.push(map[bindName]);
                }
                else
                {
                  if (parts[j])
                    expression.push(parts[j]);
                }

              bindings = [names, expression];
            }
          }
        }

        result.push([
          2,                      // TOKEN_TYPE = 0
          bindings,               // TOKEN_BINDINGS = 1
          refList(attr),          // TOKEN_REFS = 2
          name(attr),             // ATTR_NAME = 2
          attr.value              // ATTR_VALUE = 3
        ]);
      }

      return result.length ? result : 0;
    }

    function optimize(tokens){
      var result = [];

      for (var i = 0, token, item; token = tokens[i]; i++)
      {
        var refs = refList(token);
        var bindings = refs && refs.length == 1 ? 1 : 0;

        switch (token.type)
        {
          case TYPE_ELEMENT:
            item = [
              1,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              name(token),             // ELEMENT_NAME = 3
              attrs(token),            // ELEMENT_ATTRS = 4
              optimize(token.childs)   // ELEMENT_CHILDS = 5
            ];

            break;

          case TYPE_TEXT:
            item = [
              3,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              token.value              // TEXT_VALUE = 3
            ];

            break;

          case TYPE_COMMENT:
            item = [
              8,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              token.value              // COMMENT_VALUE = 3
            ];

            break;
        }

        result.push(item);
      }

      return result.length ? result : 0;
    }

    return function(source, debug){
      if (!source.templateDeclaration)
        source = tokenize('' + source, debug);

      var result = optimize(source);

      ;;;if ('JSON' in window) result.toString = function(){ return JSON.stringify(this) };

      return result;
    }
  })();

 /**
  *
  */
  var buildPathes = (function(){
    var PATH_REF_NAME = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.toArray();

    var pathList;
    var refList;
    var bindingList;

    function putRefs(refs, pathIdx){
      for (var i = 0, refName; refName = refs[i]; i++)
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
      var hasBindings;
      var attrs;
      var childs;
      var refs;
      var myRef;
      var explicitRef;
      var bindings;

      for (var i = 0, token; token = tokens[i]; i++, explicitRef = false)
      {
        if (!i)
          localPath = path + '.firstChild';
        else
          if (!tokens[i + 1])
            localPath = path + '.lastChild';
          else
            localPath = path + '.childNodes[' + i + ']';

        if (refs = token[TOKEN_REFS])
        {
          explicitRef = true;
          localPath = putPath(localPath);
          putRefs(refs, localPath);

          if (token[TOKEN_BINDINGS])
            putBinding([token[TOKEN_TYPE], localPath, refs[0]]);
        }

        if (token[TOKEN_TYPE] == TYPE_ELEMENT)
        {
          myRef = -1;

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
                var binding = [2, localPath];

                explicitRef = true;

                for (var k = 0, bindName; bindName = bindings[0][k]; k++)
                  if (attrName == 'class')
                    putBinding(binding.concat([bindName, attrName, bindings[k + 1]]));
                  else
                    putBinding(binding.concat([bindName, attrName, bindings[0], bindings[1]]));
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

      processTokens(tokens, path);

      return {
        path: pathList,
        ref: refList,
        binding: bindingList
      };
    }
  })();


 /**
  * Build functions for creating instance of template.
  */
  var makeFunctions = (function(){

   /**
    * @func
    */
    function templateBindingUpdateFactory(names, getters){
      return function templateBindingUpdate(){
        for (var i = 0, bindingName; bindingName = names[i]; i++)
          this.tmpl.set(bindingName, getters[bindingName](this));
      }
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

        ;;;if (!cacheId) console.warn('basis.html.Template.getBinding: bindings has no id property, cache not used');

        var result = bindingCache[cacheId];
        if (!result)
        {
          var names = [];
          var events = {};
          var handler = {};
          var getters = {};
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
                  ;;;if (testNode && ('event_' + eventName) in testNode == false && typeof console != 'undefined') console.warn('basis.html.Template.getBinding: unknown event `' + eventName + '` for ' + (testNode.constructor && testNode.constructor.className));
                  if (events[eventName])
                  {
                    events[eventName].push(key);
                  }
                  else
                  {
                    if (!handler) handler = {};
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
      }
    }

   /**
    * @func
    */
    function bind_node(domRef, oldNode, newValue){
      var newNode = newValue instanceof Node ? newValue : domRef;

      if (newNode !== oldNode)
        oldNode.parentNode.replaceChild(newNode, oldNode);

      return newNode;
    }

   /**
    * @func
    */
    function bind_nodeValue(domRef, oldNode, newValue){
      var newNode = newValue instanceof Node ? newValue : domRef;

      if (newNode !== oldNode)
        oldNode.parentNode.replaceChild(newNode, oldNode);
      if (newNode === domRef)
        newNode.nodeValue = newValue;

      return newNode;
    }

   /**
    * @func
    */
    function bind_attrClass(domRef, oldClass, newValue, prefix){
      var newClass = newValue ? prefix + newValue : "";

      if (newClass != oldClass)
      {
        if (oldClass) domRef.classList.remove(oldClass);
        if (newClass) domRef.classList.add(newClass);
      }

      return newClass;
    }

   /**
    * @func
    */
    function buildBindings(bindings){
      var bindMap = {};
      var bindCode;
      var bindVar;
      var domRef;
      var varList = [];
      var result = [];

      for (var i = 0, binding; binding = bindings[i]; i++)
      {
        domRef = binding[1];
        bindName = binding[2];
        bindCode = bindMap[bindName];
        bindVar = '_' + i;

        if (!bindMap[bindName])
        {
          bindCode = bindMap[bindName] = [];
          varList.push('__' + bindName);
        }

        switch(binding[0])
        {
          case TYPE_ELEMENT:
          case TYPE_COMMENT:
            varList.push(bindVar + '=' + domRef);
            bindCode.push(
              bindVar + '=bind_node(' + [domRef, bindVar] + ',value);'
            );
            break;
          case TYPE_TEXT:
            varList.push(bindVar + '=' + domRef);
            bindCode.push(
              bindVar + '=bind_nodeValue(' + [domRef, bindVar] + ',value);'
            );   
            break;
          case TYPE_ATTRIBUTE:
            var attrName = binding[3];

            if (attrName == 'class')
            {
              var prefixes = binding[4];

              for (var j = 0; j < prefixes.length; j++)
              {
                varList.push(bindVar + '=""');
                bindCode.push(
                  bindVar + '=bind_attrClass(' + [domRef, bindVar, 'value', '"' + prefixes[j] + '"'] + ');'
                );
              }
            }
            else
            {
              var expression = [];
              var symbols = binding[5];
              var dictonary = binding[4];

              for (var j = 0; j < symbols.length; j++)
                expression.push(typeof symbols[j] == 'string' ? '"' + symbols[j].replace(quoteEscape, '\\"') + '"' : '__' + dictonary[symbols[j]]);

              if (expression.length == 1)
                expression.push('""');

              bindCode.push(
                domRef + '.setAttribute("' + attrName + '",' + expression.join('+') + ');'
              );
            }
            break;
        }
      }

      result.push(
        'function(bindName,value){\n' +
          'switch(bindName){'
      );
      for (var bindName in bindMap)
      {
        result.push(
          'case"' + bindName + '":' +
          'if(__' + bindName + '!==value)' +
          '{' +
            '__' + bindName + '=value;' +
            bindMap[bindName].join('') +
          '}' +
          'break;'
        );
      }
      result.push('}}');

      return {
        vars: varList,
        getBinding: getBindingFactory(bindMap),
        body: result.join('')
      };
    }

    return function(tokens){
      var pathes = buildPathes(tokens, '_');
      var bindings = buildBindings(pathes.binding);
      var proto = buildHtml(tokens);
      var templateMap = {};

      var build = function(){
        return proto.cloneNode(true);
      };

      /** @cut */try {
      var fnBody;
      var createInstance = new Function('gMap', 'tMap', 'build', 'bind_node', 'bind_nodeValue', 'bind_attrClass', fnBody = 'return function(obj,actionCallback,updateCallback){' + 
        'var _=build(),id=gMap.seed++,' + pathes.path.concat(bindings.vars) + ';\n' +
        'if(obj)gMap[a.basisObjectId=id]=obj;\n' +
        'return tMap[id]={' + [pathes.ref, 'set:' + bindings.body, 'rebuild:function(){if(updateCallback)updateCallback.call(obj)},destroy:function(){delete tMap[id];if(obj)delete gMap[id]}'] + '}' +
      '}')(tmplNodeMap, templateMap, build, bind_node, bind_nodeValue, bind_attrClass);
      /** @cut */} catch(e) { console.warn("can't build createInstance\n", fnBody); }

      return {
        createInstance: createInstance,
        getBinding: bindings.getBinding,
        map: templateMap
      };
    }
  })();


  //
  // Constructs dom structure
  //

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
      do {
        if (refId = cursor.basisObjectId)
        {
          // if found call templateAction method
          var node = tmplNodeMap[refId];
          if (node && node.templateAction)
          {
            var actions = attr.nodeValue.qw();

            for (var i = 0, actionName; actionName = actions[i++];)
              node.templateAction(actionName, domEvent(event));

            break;
          }
        }
      } while (cursor = cursor.parentNode);
    }
  }


 /**
  * Creates dom structure by declaration.
  */
  var buildHtml = function(tokens){
    var result = document.createDocumentFragment();
    var attrs;
    var childs;
    var element;

    for (var i = 0, token; token = tokens[i]; i++)
    {
      switch(token[TOKEN_TYPE])
      {
        case TYPE_ELEMENT: 
          var tagName = token[ELEMENT_NAME];

          element = document.createElement(tagName);

          // process for attributes
          if (attrs = token[ELEMENT_ATTRS])
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
                    element.attachEvent('on' + eventName, function(eventName){
                      return function(){
                        domEvent.fireEvent(document, eventName);
                      }
                    }(eventName));
                }
              }
            }

          // precess for childs
          if (childs = token[ELEMENT_CHILDS]) // childs
            element.appendChild(buildHtml(childs));

          // add to result
          result.appendChild(element);
          break;

        case TYPE_COMMENT:
          result.appendChild(document.createComment(token[COMMENT_VALUE]));
          break;

        case TYPE_TEXT:
          result.appendChild(document.createTextNode(token[TEXT_VALUE]));
          break;
      }
    }

    return result;
  };


 /**
  * @func
  */
  function buildTemplate(){
    var source = String(typeof this.source == 'function'
      ? this.source()
      : this.source);

    var decl = makeDeclaration(source);
    var funcs = makeFunctions(decl);

    this.createInstance = funcs.createInstance;
    this.getBinding = funcs.getBinding;
    this.instances_ = funcs.map;
  }


 /**
  * Creates DOM structure template from marked HTML. Use {basis.Html.Template#createInstance}
  * method to apply template to object. It creates clone of DOM structure and adds
  * links into object to pointed parts of structure.
  *
  * To remove links to DOM structure from object use {basis.Html.Template#clearInstance}
  * method.
  * @example
  *   // create a template
  *   var template = new basis.html.Template(
  *     '<li{element} class="listitem">' +
  *       '<a href{hrefAttr}="#">{titleText}</a>' + 
  *       '<span class="description">{descriptionText}</span>' +
  *     '</li>'
  *   );
  *   
  *   // create 10 DOM elements using template
  *   for (var i = 0; i < 10; i++)
  *   {
  *     var tmpl = template.createInstance();
  *     basis.cssom.classList(tmpl.element).add('item' + i);
  *     tmpl.hrefAttr.nodeValue = '/foo/bar.html';
  *     tmpl.titleText.nodeValue = 'some title';
  *     tmpl.descriptionText.nodeValue = 'description text';
  *   }
  *   
  * @class
  */
  var Template = Class(null, {
    className: namespace + '.Template',

    __extend__: function(value){
      if (value instanceof Template)
        return value;
      else
        return new Template(value);
    },

   /**
    * @param {string|function()} template Template source code that will be parsed
    * into DOM structure prototype. Parsing will be initiated on first
    * {basis.Html.Template#createInstance} call. If function passed it be called at
    * first {basis.Html.Template#createInstance} and it's result will be used as
    * template source code.
    * @constructor
    */
    init: function(templateSource){
      this.setSource(templateSource);
    },

   /**
    * Create DOM structure and return object with references for it's nodes.
    * @param {Object=} object Storage for DOM references.
    * @param {Object=} node Object which templateAction method will be called on events.
    * @return {Object}
    */
    createInstance: function(node, ac, uc){
      buildTemplate.call(this);
      return this.createInstance(node, ac, uc);
    },

   /**
    * Remove reference from DOM structure
    * @param {Object=} object Storage of DOM references.
    * @param {Object=} node Object which templateAction method.
    */
    clearInstance: function(object, node){
      object.destroy();
    },

    getBinding: function(bindings){
      buildTemplate.call(this);
      return this.getBinding(bindings);
    },

    setSource: function(source){
      if (this.source != source)
      {
        this.source = source;
        var instances = this.instances_;

        if (instances)
        {
          buildTemplate.call(this);
          for (var id in instances)
            instances[id].rebuild();
        }
      }
    }
  });


  //
  // export names
  //

  return basis.namespace(namespace).extend({
    Template: Template,

    // for debug purposes
    tokenize: tokenize,
    makeDeclaration: makeDeclaration,
    buildPathes: buildPathes,
    makeFunctions: makeFunctions,
    buildHtml: buildHtml
  });

})(basis, this);