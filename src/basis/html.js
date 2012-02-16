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

basis.require('basis.dom');
basis.require('basis.cssom');
basis.require('basis.dom.event');

(function(basis, global){

  'use strict';

 /**
  * @namespace basis.html
  */

  var namespace = 'basis.html';


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var dom = basis.dom;
  var domEvent = basis.dom.event;
  var classList = basis.cssom.classList;


  //
  // Main part
  //

  var tmplEventListeners = {};
  var tmplNodeMap = { seed: 1 };

  var tmplPartFinderRx = /<([a-z0-9\_]+)(?:\{([a-z0-9\_\|]+)\})?([^>]*?)(\/?)>|<\/([a-z0-9\_]+)>|<!--(\s*\{([a-z0-9\_\|]+)\}\s*|.*?)-->/i;
  var tmplAttrRx = /(?:([a-z0-9\_\-]+):)?(event-)?([a-z0-9\_\-]+)(?:\{([a-z0-9\_\|]+)\})?(?:="((?:\\.|[^"])*?)"|='((?:\\.|[^'])*?)')?\s*/gi;
  var classNameRx = /^(.)|\s+/g;
  var domFragment = dom.createFragment();


  //
  // Feature detection tests
  //

  // Test for appendChild bugs (old IE browsers has a problem with some tags like <script> and <style>)
  function appendTest(tagName){
    try {
      return !dom.createElement(tagName, '');
    } catch(e) {
      return true;
    }
  }

  var SCRIPT_APPEND_BUGGY = appendTest('script');
  var STYLE_APPEND_BUGGY = appendTest('style');

  // Test for browser (IE) normalize text nodes during cloning
  var CLONE_NORMALIZE_TEXT_BUG = (function(){
    return dom.createElement('', 'a', 'b').cloneNode(true).childNodes.length == 1;
  })();

  //
  // Helpers
  //
  
  var createFragment = dom.createFragment;
  var createText = dom.createText;
  var createComment = function(value){
    return document.createComment(value);
  }

  function documentFragmentToText(fragment){
    return dom.outerHTML(fragment, true);
  }

  //
  // path
  //
  function addPath(context, path){
    var index = context.path.indexOf(path);

    if (index == -1)
      index = context.path.push(path) - 1;

    return index;
  }

  //
  // ref
  //
  function addRefList(context, refs, path){
    var pathId = addPath(context, path);

    refs = refs.split('|');
    for (var i = 0, refName; refName = refs[i]; i++)
    {
      ;;;if (context.refMap[refName] && typeof console != 'undefined') console.warn('Template.parse: dublicate reference `' + refName + '` in template');

      // save last ref for backward capability
      context.refMap[refName] = pathId;
    }
  }

  //
  // bindings
  //
  function addBinding(context, name, ref, code){
    var bindings = context.bindings;

    context.bindRef[ref] = true;

    if (!bindings[name])
      bindings[name] = [code];
    else
      bindings[name].push(code);
  }

  //
  //
  //

  function syncTemplate(names, getters){
    return function(){
      for (var i = 0, bindingName; bindingName = names[i]; i++)
        this.tmpl.updateBind(bindingName, getters[bindingName](this));
    }
  }

  function getBindingFactory(templateBindings){
    var bindingCache = {};
    return function(bindings){
      var cacheId = 'bindingId' in bindings ? bindings.bindingId : null;

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
          if (binding && binding.getter)
          {
            getters[key] = binding.getter;
            names.push(key);

            if (binding.events)
            {
              var eventList = String(binding.events).qw();
              for (var i = 0, eventName; eventName = eventList[i]; i++)
              {
                if (events[eventName])
                  events[eventName].push(key);
                else
                {
                  events[eventName] = [key];
                  handler[eventName] = syncTemplate(events[eventName], getters);
                }
              }
            }
          }
        }

        result = {
          names: names,
          events: events,
          sync: syncTemplate(names, getters),
          handler: events.length ? handler : null
        };

        if (cacheId)
          bindingCache[cacheId] = result;
      }

      return result;
    }
  }

  //
  // PARSE TEXT
  //
  function parseText(context, str, nodePath, pos){
    var result = createFragment();

    if (str)
    {
      var parts = str.split(/\{([a-z0-9\_]+(?:\|[a-z0-9\_]+)*)\}/i);
      var text;

      for (var i = 0; i < parts.length; i++)
      {
        text = parts[i];

        if (i & 1)
        {
          var path = nodePath + 'childNodes[' + pos + ']';
          addRefList(context, text, path);
          if (text.indexOf('|') == -1)
          {
            var ref = 'r' + addPath(context, path);
            addBinding(context, text, ref, ref + '.nodeValue=""+newValue');
          }
        }

        if (text) // don't add an empty strings
        {
          // Some browsers (Internet Explorer) may normalize text nodes during cloning, that's why 
          // we need to insert comment nodes between text nodes to prevent text node merge
          if (CLONE_NORMALIZE_TEXT_BUG)
          {
            if (result.lastChild)
              result.appendChild(createComment(''));
            pos++;
          }

          result.appendChild(createText(text));
          pos++;
        }
      }
    }

    return result;
  }

  //
  // PARSE ATTRIBUTES
  //
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

  function parseAttributes(context, str, nodePath, tagName){
    str = str.trim();

    if (!str)
      return { text: '', events: [] };

    var result = '';
    var events = [];
    var m;

    while (m = tmplAttrRx.exec(str))
    {
      //    0      1   2       3     4      5       6
      // m: match, ns, prefix, name, alias, value1, value2

      var prefix = m[2] || '';
      var name = m[3];
      var attrName = prefix + name;
      var value = m[5] || m[6] || name;
      var refList = m[4];

      // store reference for attribute
      if (refList)
        addRefList(context, refList, nodePath + '.getAttributeNode("' + attrName + '")');

      // if attribute is event binding, add global event handler
      if (prefix == 'event-')
      {
        if (!tmplEventListeners[name])
        {
          tmplEventListeners[name] = createEventHandler(attrName);

          for (var i = 0, names = domEvent.browserEvents(name), browserEventName; browserEventName = names[i++];)
            domEvent.addGlobalHandler(browserEventName, tmplEventListeners[name]);
        }

        // hack for non-bubble events in IE<=8
        if (!domEvent.W3CSUPPORT)
        {
          var eventInfo = domEvent.getEventInfo(name, tagName);
          if (eventInfo.supported && !eventInfo.bubble)
            events.push(name);
            //result += '[on' + eventName + '="basis.dom.event.fireEvent(document,\'' + eventName + '\')"]';
        }
      }
      else
      {
        if (value)
        {
          if (attrName == 'class')
          {
            var parts = value.qw();
            var newValue = [];

            for (var i = 0, part; part = parts[i]; i++)
            {
              var m = part.match(/^([a-z0-9\-\_]+)?\{([a-z0-9\_]+)\}$/i);
              if (m)
              {
                var prefix = m[1] || '';
                var bindName = m[2];
                var ref = 'r' + addPath(context, nodePath);

                expression =
                  'var oldClass = oldValue ? ' + prefix.quote() + ' + oldValue : "";\n' +
                  'var newClass = newValue ? ' + prefix.quote() + ' + newValue : "";\n' +
                  'if (oldClass || newClass)\n' +
                  '{\n' +
                  '  var cl = classList(' + ref + ');\n' +
                  '  if (oldClass) cl.remove(oldClass);\n' +
                  '  if (newClass) cl.add(newClass);\n' +
                  '}';
                //console.log(ref, expression)

                addBinding(context, bindName, ref, expression);
              }
              else
              {
                newValue.push(part);
              }
            }
            
            // compile
            value = newValue.join(' ');
          }
          else
          {
            var slots = value.split(/\{([a-z0-9\_]+)\}/i);
            if (slots.length > 1)
            {
              var binds = [];
              var expression = [];
              var ref = 'r' + addPath(context, nodePath);

              for (var i = 0; i < slots.length; i++)
              {
                if (i % 2)
                {
                  expression.push('values_.' + slots[i]);
                  binds.push(slots[i]);
                }
                else
                {
                  if (slots[i])
                    expression.push(slots[i].quote('"'));
                }
              }
              
              // compile
              expression = ref + '.setAttribute("' + attrName + '", ' + expression.join('+') + ');';

              // add bindings
              for (var i = 0, bindName; bindName = binds[i]; i++)
              {
                addBinding(context, bindName, ref, expression);
                //console.log(name, expression)
              }

              continue;
            }
          }
        }
      }

      result += attrName == 'class'
                  ? value.trim().replace(classNameRx, '.$1')
                  : '[' + attrName + (value ? '=' + value.quote('"') : '') + ']';
    }

    return {
      text: result,
      events: events
    };
  }

  //
  // PARSE HTML
  //
  function parseHtml(context, path){
    if (!context.stack)
      context.stack = [];

    if (!context.source)
      context.source = context.str;

    if (!path)
      path = '.';

    var result = createFragment();
    var preText;
    var pos = 0;
    var m;
    var stack = context.stack;
    var closeTag;
    var commentRefList;

    while (m = tmplPartFinderRx.exec(context.str))
    {
      //    0      1        2      3           4            5         6        7
      // m: match, tagName, alias, attributes, isSingleton, closeTag, comment, commentRefList

      preText = RegExp.leftContext;
      context.str = context.str.substr(preText.length + m[0].length);

      // if something before -> parse text & append result
      if (preText.length)
      {
        result.appendChild(parseText(context, preText, path, pos));
        pos = result.childNodes.length;
      }

      // end tag
      if (closeTag = m[5])
      {
        // if end tag match to last stack tag -> remove last tag from tag and return
        if (closeTag == stack[stack.length - 1])
        {
          stack.pop();
          return result;
        }
        else
        {
          ;;;if (typeof console != undefined) console.warn('Wrong end tag </' + closeTag + '> in Html.Template (ignored)\n\n' + context.source.replace(new RegExp('(</' + closeTag + '>)(' + context.str + ')$'), '\n ==[here]=>$1<== \n$2'));
          throw "Wrong end tag";
        }
      }

      // comment
      if (m[6])
      {
        if (commentRefList = m[7])
          addRefList(context, commentRefList, path + 'childNodes[' + pos + ']');

        result.appendChild(createComment(m[6]));
      }
      // open tag
      else
      {
        var descr = m[0];
        var tagName = m[1];
        var refList = m[2];
        var attributes = m[3];
        var singleton = !!m[4];
        var nodePath = path + 'childNodes[' + pos + ']';
        var attrs = parseAttributes(context, attributes, nodePath, tagName);
        var element = dom.createElement(tagName + attrs.text);

        // hack for non-bubble events in IE<=8
        for (var i = 0, eventName; eventName = attrs.events[i]; i++)
          element.attachEvent('on' + eventName, function(eventName){
            return function(){
              domEvent.fireEvent(document, eventName);
            }
          }(eventName));
          
        if (refList)
          addRefList(context, refList, nodePath);


        if (!singleton)
        {
          stack.push(tagName);

          var elementContent = parseHtml(context, nodePath + '.');
          tagName = element.tagName.toLowerCase();

          if (SCRIPT_APPEND_BUGGY && tagName == 'script')
            element.text = documentFragmentToText(elementContent);
          else
            if (STYLE_APPEND_BUGGY && tagName == 'style')
              element.styleSheet.cssText = documentFragmentToText(elementContent);
            else
              element.appendChild(elementContent);
        }

        result.appendChild(element);
      }

      pos++;
    }
    
    // no tag found, but there can be trailing text -> parse text
    if (context.str.length)
      result.appendChild(parseText(context, context.str, path, pos));

    if (stack.length)
    {
      ;;;if (typeof console != undefined) console.warn('No end tag for ' + stack.reverse() + ' in Html.Template:\n\n' + context.source);
      throw "No end tag for " + stack.reverse();
    }

    return result;
  }


 /**
  * Parsing template
  * @func
  */
  function parseTemplate(){
    if (this.proto)
      return;

    var source = this.source;

    if (typeof source == 'function')
      source = source();

    source = source.trim();

    this.source = source;

    var context = {
      str: source,
      refMap: {},
      path: [],
      bindings: {},
      bindRef: {}
    };

    // element reference by default points to first child
    addRefList(context, 'element', '.childNodes[0]')

    // parse html
    var proto = parseHtml(context);

    //
    // build function bodies
    //
    var createBody_refInit = [];
    var createBody_resObject = [];
    var clearBody_objClear = ['obj_.updateBind'];
    var pathList = context.path;

    // optimize pathes: replace for references
    for (var i = 0, path; path = pathList[i]; i++)
    {
      var pathParts = path.split(/(\.?childNodes\[(\d+)\])/);
      var cursor = proto;
      for (var j = 2, pos; pos = pathParts[j]; j += 3)
      {
        pathParts[j] = '';
        cursor = cursor.childNodes[pos];

        if (!cursor.previousSibling)
          pathParts[j - 1] = '.firstChild';
        else
          if (!cursor.nextSibling)
            pathParts[j - 1] = '.lastChild';
      }
      pathList[i] = 'dom_' + pathParts.join('');
    }

    // optimize pathes: make pathes shorter
    for (var i = 0, path; path = pathList[i]; i++)
    {
      var varName = 'r' + i;
      createBody_refInit.push(varName + '=' + path);

      // make next pathes shorter
      var pathRx = new RegExp('^' + path.forRegExp());
      for (var j = i + 1, nextPath; nextPath = pathList[j]; j++)
        pathList[j] = nextPath.replace(pathRx, varName);
    }

    // build bodies
    for (var refName in context.refMap)
    {
      createBody_resObject.push(refName + ':r' + context.refMap[refName]);
      clearBody_objClear.push('obj_.' + refName);
    }

    clearBody_objClear.push('null');

    // 

    // optimize pathes (2)
    //console.log('-'.repeat(20));
    //console.log('var ' + createBody_refInit + ';' + createBody_resObject);
    //console.log(clearBody_objClear);

    var getBindFunction;
    var getBindFunctionBody = '';
    var bindArgs = Object.keys(context.bindRef);
    var defObject = [];
    for (var key in context.bindings)
    {
      //console.log(key, context.bindings[key].code);
      defObject.push(key + ':' + context.bindings[key]['default']);

      getBindFunctionBody +=
        'case "' + key + '":\n' +
          'if (values_.' + key + '!==newValue){\n' +
          '  oldValue=values_.' + key + ';\n' +
          '  values_.' + key + '=newValue;\n'+
          context.bindings[key].join('\n') + '\n}' +
        'break;\n';
    }

    if (getBindFunctionBody)
    {
      //bindArgs.unshift('values_');

      getBindFunction = new Function(bindArgs, 'var classList=basis.cssom.classList,values_={' + defObject + '};return ' + 
        function(key, newValue){
          var oldValue;

          // generated code start
          _generated_code_(); // <-- will be replaced for generated code
          // generated code end
        }
      .toString().replace('_generated_code_()', 'switch(key){\n' + getBindFunctionBody + '\n}'));

      //console.log(getBindFunction.toString());

      //bindArgs[0] = 'new defs_';
      createBody_resObject.push('updateBind:getBindFunction(' + bindArgs + ')');

      // build get getBinding method
      this.getBinding = getBindingFactory(context.bindings)
    }
    else
    {
      createBody_resObject.push('updateBind:Function()');
      this.getBinding = Function.$undef;
    }

    createBody_refInit.push('\nobj_={' + createBody_resObject + '}');

    //
    // build createInstance function
    //
    this.createInstance = new Function('proto_', 'map_', 'getBindFunction', 'var dom_; return ' + 
      // mark variable names with dangling _ to avoid renaming by compiler, because
      // this names using by generated code, and must be unchanged

      // WARN: don't use global scope variables, resulting function has isolated scope

      function(node){
        dom_ = proto_.cloneNode(true);

        // generated code start
        _generated_code_();
        // generated code end

        if (node)
        {
          var id = map_.seed++;
          r0.basisObjectId = id;
          map_[id] = node;
        }

        return obj_;
      }

    .toString().replace('_generated_code_()', 'var ' + createBody_refInit))(proto, tmplNodeMap, getBindFunction); // body.map(String.format, '{alias}={path};\n').join('')

    /*if (hasBindings)
      console.log(this.createInstance.toString())/**/

    //
    // build clearInstance function
    //
    this.clearInstance = new Function('map_', 'var obj_; return ' +

      function(object, node){
        obj_ = object; // prevent renaming

        var id = obj_.element && obj_.element.basisObjectId;
        if (id)
          delete map_[id];

        // generated code start
        _generated_code_();
        // generated code end
      }

    .toString().replace('_generated_code_()', clearBody_objClear.join('=')))(tmplNodeMap);  // body.map(String.format, '{alias}=null;\n').join('')
  };


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
      this.source = templateSource;
    },

   /**
    * Create DOM structure and return object with references for it's nodes.
    * @param {Object=} object Storage for DOM references.
    * @param {Object=} node Object which templateAction method will be called on events.
    * @return {Object}
    */
    createInstance: function(node){
      parseTemplate.call(this);
      return this.createInstance(node);
    },

   /**
    * Remove reference from DOM structure
    * @param {Object=} object Storage of DOM references.
    * @param {Object=} node Object which templateAction method.
    */
    clearInstance: function(object, node){
      parseTemplate.call(this);
    },

    getBinding: function(bindings){
      parseTemplate.call(this);
      return this.getBinding(bindings);
    }
  });


 /**
  * @func
  */
  function escape(html){
    return dom.createElement('div', dom.createText(html)).innerHTML;
  }

 /**
  * @func
  */
  var unescapeElement = document.createElement('div');
  function unescape(escapedHtml){
    unescapeElement.innerHTML = escapedHtml;
    return unescapeElement.firstChild.nodeValue;
  }

 /**
  * @func
  */
  function string2Html(text){
    unescapeElement.innerHTML = text;
    return dom.createFragment.apply(null, Array.from(unescapeElement.childNodes));
  }


  //
  // export names
  //

  return basis.namespace(namespace).extend({
    Template: Template,
    escape: escape,
    unescape: unescape,
    string2Html: string2Html
  });

})(basis, this);
