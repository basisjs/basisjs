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


 /**
  * @namespace basis.template
  */

  var namespace = this.path;


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

  // Test for browser (IE) normalize text nodes during cloning
  var CLONE_NORMALIZE_TEXT_BUG = typeof window != 'undefined' && (function(){
    return dom.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
  })();

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
  var TEXT = /((?:.|[\r\n])*?)(\{(?:l10n:([a-zA-Z\_][a-zA-Z0-9\-\_]*(?:\.[a-zA-Z\_][a-zA-Z0-9\-\_]*)*)\})?|<(\/|!--(\s*\{)?)?|$)/g;
  var TAG_NAME = /([a-z\_][a-z0-9\-\_]*)(\:|\{|\s*(\/?>)?)/ig;
  var ATTRIBUTE_NAME_OR_END = /([a-z\_][a-z0-9\-\_]*)(\:|\{|=|\s*)|(\/?>)/ig;
  var COMMENT = /(.|[\r\n])*?-->/g;
  var CLOSE_TAG = /([a-z\_][a-z0-9\-\_]*(?:\:[a-z\_][a-z0-9\-\_]*)?)>/ig;
  var REFERENCE = /([a-z\_][a-z0-9\_]*)(\||\}\s*)/ig;
  var ATTRIBUTE_VALUE = /"((?:(\\")|[^"])*?)"\s*/g;

  var quoteEscape = /"/g;
  var quoteUnescape = /\\"/g;

  var eventAttr = /^event-(.+)+/;

  // dictonaries
  var tmplEventListeners = {};
  var tmplNodeMap = { seed: 1 };
  var tmplFilesMap = {};
  var namespaceURI = {
    svg: 'http://www.w3.org/2000/svg'
  };

 /**
  * Parse html into tokens.
  */
  var tokenize = function(source, debug){
    var result = [];
    var tagStack = [];
    var lastTag = { childs: result };
    var sourceText;
    var token;
    var bufferPos;
    var startPos;
    var parseTag = false;
    var textStateEndPos = 0;
    var textEndPos;
    var refMap = {};
    var refName;
    var l10nMatch;

    var state = TEXT;
    var pos = 0;
    var m;

    source = source.trim();

    try {
      while (pos < source.length || state != TEXT)
      {
        state.lastIndex = pos;
        startPos = pos;

        m = state.exec(source);

        if (!m || m.index !== pos)
        {
          //throw SYNTAX_ERROR;

          // treats broken comment reference as comment content
          if (state == REFERENCE && token && token.type == TYPE_COMMENT)
          {
            state = COMMENT;
            continue;
          }

          if (parseTag)
            lastTag = tagStack.pop();

          if (token)
            lastTag.childs.pop();

          if (token = lastTag.childs.pop())
          {
            if (token.type == TYPE_TEXT && !token.refs)
              textStateEndPos -= 'len' in token ? token.len : token.value.length;
            else
              lastTag.childs.push(token);
          }

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
            {
              sourceText = textStateEndPos == startPos
                ? m[1]
                : source.substring(textStateEndPos, textEndPos)

              token = sourceText.replace(/\s*(\r\n?|\n\r?)\s*/g, '');

              if (token)
                lastTag.childs.push({
                  type: TYPE_TEXT,
                  len: sourceText.length,
                  value: token
                });
            }

            textStateEndPos = textEndPos;

            if (m[3])
            {
              lastTag.childs.push({
                type: TYPE_TEXT,
                refs: ['l10n:' + m[3]],
                value: '{l10n:' + m[3] + '}'
              });
            }
            else if (m[2] == '{')
            {
              bufferPos = pos - 1;
              lastTag.childs.push(token = {
                type: TYPE_TEXT
              });
              state = REFERENCE;
            }
            else if (m[4])
            {
              if (m[4] == '/')
              {
                token = null;
                state = CLOSE_TAG;
              }
              else //if (m[3] == '!--')
              {
                lastTag.childs.push(token = {
                  type: TYPE_COMMENT
                });

                if (m[5])
                {
                  bufferPos = pos - m[5].length;
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
                pos -= m[2].length - 1;
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

      if (textStateEndPos != pos)
        lastTag.childs.push({
          type: TYPE_TEXT,
          value: source.substring(textStateEndPos, pos)
        });

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
    var ATTR_BINDING = /\{([a-z\_][a-z0-9\_]*|l10n:[a-z\_][a-z0-9\_]*(?:\.[a-z\_][a-z0-9\_]*)*)\}/i;
    var NAMED_CHARACTER_REF = /&([a-z]+|#[0-9]+|#x[0-9a-f]{1,4});?/gi;
    var tokenMap = {};
    var tokenElement = document.createElement('div');

    function name(token){
      return (token.prefix ? token.prefix + ':' : '') + token.name;
    }

    function namedCharReplace(m, token){
      if (!tokenMap[token])
      {
        if (token.charAt(0) == '#')
        {
          tokenMap[token] = String.fromCharCode(
            token.charAt(1) == 'x' || token.charAt(1) == 'X'
              ? parseInt(token.substr(2), 16)
              : token.substr(1)
          );
        }
        else
        {
          tokenElement.innerHTML = m;
          tokenMap[token] = tokenElement.firstChild ? tokenElement.firstChild.nodeValue : '';
        }
      }
      return tokenMap[token];
    }

    function untoken(value){
      return value.replace(NAMED_CHARACTER_REF, namedCharReplace);
    }

    function refList(token){
      var array = token.refs;

      if (!array || !array.length)
        return 0;

      /*for (var i = 0, j = 0; i < array.length; i++)
        if (array[i].indexOf(':') == -1)
          array[j++] = array[i];

      array.length = j;*/

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
                    expression.push(untoken(parts[j]));
                }

              bindings = [names, expression];
            }
            else
              attr.value = untoken(attr.value);
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
        var bindings = refs && (refs.length == 1 || (refs.length == 2 && token.type == TYPE_TEXT && refs[1] == 'element')) ? 1 : 0;

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
              untoken(token.value)     // TEXT_VALUE = 3
            ];

            break;

          case TYPE_COMMENT:
            item = [
              8,                       // TOKEN_TYPE = 0
              bindings,                // TOKEN_BINDINGS = 1
              refs,                    // TOKEN_REFS = 2
              untoken(token.value)     // COMMENT_VALUE = 3
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

      ;;;if ('JSON' in global) result.toString = function(){ return JSON.stringify(this) };

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
      var hasBindings;
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

    var WHITESPACE = /\s+/;
    var W3C_DOM_NODE_SUPPORTED = typeof Node == 'function' && document instanceof Node;
    var CLASSLIST_SUPPORTED = global.DOMTokenList && document && document.documentElement.classList instanceof global.DOMTokenList;

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

        ;;;if (!cacheId) console.warn('basis.template.Template.getBinding: bindings has no bindingId property, cache is not used');

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
                  ;;;if (testNode && ('event_' + eventName) in testNode == false && typeof console != 'undefined') console.warn('basis.template.Template.getBinding: unknown event `' + eventName + '` for ' + (testNode.constructor && testNode.constructor.className));
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
    var bind_node = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue){
          var newNode = newValue instanceof Node ? newValue : domRef;

          if (newNode !== oldNode)
            oldNode.parentNode.replaceChild(newNode, oldNode);

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
    var bind_nodeValue = W3C_DOM_NODE_SUPPORTED
      // W3C DOM way
      ? function(domRef, oldNode, newValue){
          var newNode = newValue instanceof Node ? newValue : domRef;

          if (newNode !== oldNode)
            oldNode.parentNode.replaceChild(newNode, oldNode);

          if (newNode === domRef)
            newNode.nodeValue = newValue;

          return newNode;
        }
      : function(domRef, oldNode, newValue){
          var newNode = bind_node(domRef, oldNode, newValue);

          if (newNode === domRef)
            newNode.nodeValue = newValue;

          return newNode;
        };

   /**
    * @func
    */
    var bind_attrClass = CLASSLIST_SUPPORTED
      // classList supported
      ? function(domRef, oldClass, newValue, prefix){
          var newClass = newValue ? prefix + newValue : "";

          if (newClass != oldClass)
          {
            if (oldClass)
              domRef.classList.remove(oldClass);

            if (newClass)
              domRef.classList.add(newClass);
          }

          return newClass;
        }
      // old browsers are not support for classList
      : function(domRef, oldClass, newValue, prefix){
          var newClass = newValue ? prefix + newValue : "";

          if (newClass != oldClass)
          {
            var classList = domRef.className.split(WHITESPACE);

            if (oldClass)
              classList.remove(oldClass);

            if (newClass)
              classList.push(newClass);

            domRef.className = classList.join(' ');
          }

          return newClass;
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
    }

    function buildAttrExpression(binding, l10n){
      var expression = [];
      var symbols = binding[5];
      var dictonary = binding[4];
      var exprVar;
      var colonPos;

      for (var j = 0; j < symbols.length; j++)
        if (typeof symbols[j] == 'string')
          expression.push('"' + symbols[j].replace(quoteEscape, '\\"') + '"');
        else
        {
          exprVar = dictonary[symbols[j]];
          colonPos = exprVar.indexOf(':');
          if (colonPos == -1)
            expression.push(l10n ? '"{' + exprVar + '}"' : '__' + exprVar);
          else
            expression.push('__l10n["' + exprVar.substr(colonPos + 1) + '"]');
        }

      if (expression.length == 1)
        expression.push('""');

      return expression.join('+')
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
      var varName;
      var l10nMap;
      var toolsUsed = {};
      ;;;var debugList = [];

      for (var i = 0, binding; binding = bindings[i]; i++)
      {
        domRef = binding[1];
        bindName = binding[2];
        bindCode = bindMap[bindName];
        bindVar = '_' + i;
        varName = '__' + bindName;

        var namePart = bindName.split(':');
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

          bindCode = bindMap[l10nName]
          bindCode.l10n = true;

          if (binding[0] == TYPE_TEXT)
          {
            bindCode.push(domRef + '.nodeValue=__l10n["' + l10nName + '"];');
            l10nMap[l10nName].push(domRef + '.nodeValue=value;')
          }
          else
          {
            l10nMap[l10nName].push('bind_attr(' + [domRef, '"' + attrName + '"', '{}', buildAttrExpression(binding, true)] + ');')
            varList.push(bindVar);
            bindCode.push(
              bindVar + '=bind_attr(' + [domRef, '"' + attrName + '"', bindVar, buildAttrExpression(binding)] + ');'
            );
          }

          continue;
        }

        if (!bindMap[bindName])
        {
          bindCode = bindMap[bindName] = [];
          varList.push(varName);
        }

        switch(binding[0])
        {
          case TYPE_ELEMENT:
          case TYPE_COMMENT:
            ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

            varList.push(bindVar + '=' + domRef);
            toolsUsed.bind_node = true;
            bindCode.push(
              bindVar + '=bind_node(' + [domRef, bindVar] + ',value);'
            );
            break;
          case TYPE_TEXT:
            ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

            varList.push(bindVar + '=' + domRef);
            toolsUsed.bind_nodeValue = true;
            bindCode.push(
              bindVar + '=bind_nodeValue(' + [domRef, bindVar] + ',value);'
            );   
            break;
          case TYPE_ATTRIBUTE:
            var attrName = binding[3];

            ;;;debugList.push('{binding:"' + bindName + '",dom:' + domRef + ',attr:"' + attrName + '",val:' + bindVar + ',attachment:attaches["' + bindName + '"]}');

            if (attrName == 'class')
            {
              var prefixes = binding[4];

              for (var j = 0; j < prefixes.length; j++)
              {
                varList.push(bindVar + '=""');
                toolsUsed.bind_attrClass = true;
                bindCode.push(
                  bindVar + '=bind_attrClass(' + [domRef, bindVar, 'value', '"' + prefixes[j] + '"'] + ');'
                );
              }
            }
            else
            {
              toolsUsed.bind_attr = true;
              varList.push(bindVar + '=' + buildAttrExpression(binding, true));
              bindCode.push(
                bindVar + '=bind_attr(' + [domRef, '"' + attrName + '"', bindVar, buildAttrExpression(binding)] + ');'
              );
            }
            break;
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
    };

    var tools = {
      bind_nodeValue: bind_nodeValue,
      bind_node: bind_node,
      bind_attr: bind_attr,
      bind_attrClass: bind_attrClass,
      resolve: resolveValue
    };

    return function(tokens){
      var pathes = buildPathes(tokens, '_');
      var bindings = buildBindings(pathes.binding);
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
            'if(value==null)value="{"+token+"}";' +
            '__l10n[token]=value;' +
            bindings.l10n[key].join(';') +
            'break;'
          );

        var l10nProtoUpdate = new Function('_', '__l10n', 'bind_attr', 'var ' + pathes.path + ';return function(token, value){' +
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

      /** @cut */try {
      var fnBody;
      var createInstance = new Function('gMap', 'tMap', 'build', 'tools', '__l10n', fnBody = 'return function createInstance_(obj,actionCallback,updateCallback){' + 
        'var _=build(),id=gMap.seed++,attaches={},resolve=tools.resolve,' + pathes.path.concat(bindings.vars) + ';\n' +
        'if(obj&&a&&a.nodeType!=3)gMap[a.basisObjectId=id]=obj;\n' +
        'function updateAttach(){set(String(this),attaches[this])};\n' +
        bindings.body +
        /**@cut*/';set.debug=function(){return[' + bindings.debugList.join(',') + ']}' +
        ';return tMap[id]={' + [pathes.ref, 'set:set,rebuild:function(){if(updateCallback)updateCallback.call(obj)},' +
        'destroy:function(){' +
          'for(var key in attaches)if(attaches[key])attaches[key].bindingBridge.detach(attaches[key],updateAttach,key);' +
          'attaches=null;' +
          'delete tMap[id];' + 
          /**@cut*/'delete set.debug;' + 
          'if(obj)delete gMap[id]}'] +
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
          var parts = tagName.split(/:/);

          element = parts.length > 1
            ? document.createElementNS(namespaceURI[parts[0]], tagName)
            : document.createElement(tagName);

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
          // fix bug with normalize text node in IE8-
          if (CLONE_NORMALIZE_TEXT_BUG && i && tokens[i - 1][TOKEN_TYPE] == TYPE_TEXT)
            result.appendChild(document.createComment(''));

          result.appendChild(document.createTextNode(token[TEXT_VALUE]));
          break;
      }
    }

    return result;
  };


 /**
  * @func
  */
  function templateSourceUpdate(){
    if (this.instances_)
      buildTemplate.call(this);
  }

 /**
  * @func
  */
  function buildTemplate(){
    var instances = this.instances_;
    var source = String(
      typeof this.source == 'function'
        ? this.source()
        : this.source
    );

    var decl = this.isDecl ? source.toObject() : makeDeclaration(source);
    var funcs = makeFunctions(decl);
    var l10n = this.l10n_;

    if (l10n)
    {
      this.l10n_ = null;
      for (var i = 0, link; link = l10n[i]; i++)
        link.token.detach(link.handler, link);
    }

    this.createInstance = funcs.createInstance;
    this.getBinding = funcs.getBinding;
    this.instances_ = funcs.map;
    var l10nProtoUpdate = funcs.l10nProtoUpdate;

    if (instances)
    {
      for (var id in instances)
        instances[id].rebuild();
    }

    if (funcs.l10n)
    {
      l10n = [];
      this.l10n_ = l10n;
      instances = funcs.map;
      for (var key in funcs.l10n)
      {
        var link = {
          path: key,
          token: basis.l10n.getToken(key),
          handler: function(value){
            l10nProtoUpdate(this.path, value);
            for (var id in instances)
              instances[id].set(this.path, value);
          }
        };
        link.token.attach(link.handler, link);
        l10n.push(link);
      }
    }
  }


  //
  // source from script by id
  //

  function sourceById(sourceId){
    var host = document.getElementById(sourceId);
    if (host && host.tagName == 'SCRIPT')
    {
      var content = host.textContent || host.text;

      switch (host.type)
      {
        case 'text/basis-template':
        default:
          return content;
      }
    }

    ;;;if (typeof console != 'undefined') console.warn('Template script element with id `' + sourceId + '` not found');
  }

  function resolveSourceById(sourceId){
    return function(){
      return sourceById(sourceId);
    }
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
      var oldSource = this.source;
      if (oldSource != source)
      {
        this.isDecl = false;

        if (typeof source == 'string')
        {
          var m = source.match(/^([a-z]+):/);
          if (m)
          {
            var prefix = m[1];

            source = source.substr(m[0].length);

            switch (prefix)
            {
              case 'file':
                source = basis.resource(source);
                break;
              case 'id':
                // source from script element
                source = resolveSourceById(source);
              case 'tokens':
                this.isDecl = true;
              case 'raw':
                //source = source;
                break;
              default:
                ;;;console.warn(namespace + '.Template.setSource: Unknown prefix ' + prefix + ' for template source was ingnored.')
            }
          }
        }

        if (oldSource && oldSource.bindingBridge)
        {
          var tmplList = oldSource.url && tmplFilesMap[oldSource.url];
          if (tmplList)
          {
            tmplList.remove(this);
            if (!tmplList.length)
              delete tmplFilesMap[oldSource.url];
          }

          this.source.bindingBridge.detach(oldSource, templateSourceUpdate, this);
        }

        if (source && source.bindingBridge)
        {
          if (source.url)
          {
            if (!tmplFilesMap[source.url])
              tmplFilesMap[source.url] = [];
            tmplFilesMap[source.url].add(this);
          }

          source.bindingBridge.attach(source, templateSourceUpdate, this);
        }

        this.source = source;

        templateSourceUpdate.call(this);
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    Template: Template,

    // for debug purposes
    tokenize: tokenize,
    makeDeclaration: makeDeclaration,
    buildPathes: buildPathes,
    makeFunctions: makeFunctions,
    buildHtml: buildHtml,

    filesMap: tmplFilesMap,
    resolveObjectById: function(refId){
      return tmplNodeMap[refId];
    }
  };
