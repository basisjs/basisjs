
var arraySearch = basis.array.search;
var arrayAdd = basis.array.add;
var arrayRemove = basis.array.remove;

var tokenize = require('./tokenize.js');
var isolateCss = require('./isolateCss.js');
var consts = require('./const.js');
var getL10nToken = require('basis.l10n').token;
var L10nProxyToken = function(){};
var getL10nTemplate = function(){};

var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
var TYPE_ATTRIBUTE_STYLE = consts.TYPE_ATTRIBUTE_STYLE;
var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
var TYPE_TEXT = consts.TYPE_TEXT;
var TYPE_COMMENT = consts.TYPE_COMMENT;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var TOKEN_REFS = consts.TOKEN_REFS;
var ATTR_NAME = consts.ATTR_NAME;
var ATTR_VALUE = consts.ATTR_VALUE;
var ATTR_NAME_BY_TYPE = consts.ATTR_NAME_BY_TYPE;
var ATTR_TYPE_BY_NAME = consts.ATTR_TYPE_BY_NAME;
var ATTR_VALUE_INDEX = consts.ATTR_VALUE_INDEX;
var ELEMENT_NAME = consts.ELEMENT_NAME;
var ELEMENT_ATTRS = consts.ELEMENT_ATTRS;
var ELEMENT_CHILDS = consts.ELEMENT_CHILDS;
var TEXT_VALUE = consts.TEXT_VALUE;
var COMMENT_VALUE = consts.COMMENT_VALUE;

var IDENT = /^[a-z_][a-z0-9_\-]*$/i;
var ATTR_EVENT_RX = /^event-(.+)$/;


function genIsolateMarker(){
  return 'i' + basis.genUID() + '__';
}


/**
* make compiled version of template
*/
var makeDeclaration = (function(){
  var includeStack = [];
  var styleNamespaceIsolate = {};
  var styleNamespaceResource = {};

  function name(token){
    return (token.prefix ? token.prefix + ':' : '') + token.name;
  }

  function refList(token){
    var array = token.refs;

    if (!array || !array.length)
      return 0;

    return array;
  }

  function attrs(token, declToken, optimizeSize){
    var attrs = token.attrs;
    var result = [];
    var styleAttr;
    var display;
    var m;

    for (var i = 0, attr; attr = attrs[i]; i++)
    {
      // process special attributes (basis namespace)
      if (attr.prefix == 'b')
      {
        switch (attr.name)
        {
          case 'ref':
            var refs = (attr.value || '').trim().split(/\s+/);
            for (var j = 0; j < refs.length; j++)
              addTokenRef(declToken, refs[j]);
            break;

          case 'show':
          case 'hide':
            display = attr;
            break;
        }

        continue;
      }

      if (m = attr.name.match(ATTR_EVENT_RX))
      {
        result.push(m[1] == attr.value ? [TYPE_ATTRIBUTE_EVENT, m[1]] : [TYPE_ATTRIBUTE_EVENT, m[1], attr.value]);
        continue;
      }

      var item = [
        attr.type,              // TOKEN_TYPE = 0
        attr.binding,           // TOKEN_BINDINGS = 1
        refList(attr)           // TOKEN_REFS = 2
      ];

      // ATTR_NAME = 3
      if (attr.type == 2)
        item.push(name(attr));

      // ATTR_VALUE = 4
      if (attr.value && (!optimizeSize || !attr.binding || attr.type != 2))
        item.push(attr.value);

      if (attr.type == TYPE_ATTRIBUTE_STYLE)
        styleAttr = item;

      result.push(item);
    }

    if (display)
    {
      if (!styleAttr)
      {
        styleAttr = [TYPE_ATTRIBUTE_STYLE, 0, 0];
        result.push(styleAttr);
      }

      if (!styleAttr[1])
        styleAttr[1] = [];

      var displayExpr = display.binding || [[], [display.value]];

      if (displayExpr[0].length - displayExpr[1].length)
      {
        // expression has non-binding parts, treat as constant
        styleAttr[3] = (styleAttr[3] ? styleAttr[3] + '; ' : '') +
          // visible when:
          //   show & value is not empty
          //   or
          //   hide & value is empty
          (display.name == 'show' ^ display.value === '' ? '' : 'display: none');
      }
      else
      {
        if (display.name == 'show')
          styleAttr[3] = (styleAttr[3] ? styleAttr[3] + '; ' : '') + 'display: none';

        styleAttr[1].push(displayExpr.concat('display', display.name));
      }
    }

    return result.length ? result : 0;
  }

  function addTokenRef(token, refName){
    if (!token[TOKEN_REFS])
      token[TOKEN_REFS] = [];

    arrayAdd(token[TOKEN_REFS], refName);

    if (refName != 'element')
      token[TOKEN_BINDINGS] = token[TOKEN_REFS].length == 1 ? refName : 0;
  }

  function removeTokenRef(token, refName){
    var idx = token[TOKEN_REFS].indexOf(refName);
    if (idx != -1)
    {
      var indexBinding = token[TOKEN_BINDINGS] && typeof token[TOKEN_BINDINGS] == 'number';
      token[TOKEN_REFS].splice(idx, 1);

      if (indexBinding)
        if (idx == token[TOKEN_BINDINGS] - 1)
          token[TOKEN_BINDINGS] = refName;

      if (!token[TOKEN_REFS].length)
        token[TOKEN_REFS] = 0;
      else
      {
        if (indexBinding)
          token[TOKEN_BINDINGS] -= idx < (token[TOKEN_BINDINGS] - 1);
      }
    }
  }

  function tokenAttrs(token){
    var result = {};

    if (token.attrs)
      for (var i = 0, attr; attr = token.attrs[i]; i++)
        result[name(attr)] = attr.value;

    return result;
  }

  function tokenAttrs_(token){
    var result = {};

    if (token.attrs)
      for (var i = 0, attr; attr = token.attrs[i]; i++)
        result[name(attr)] = attr;

    return result;
  }

  function addUnique(array, items){
    for (var i = 0; i < items.length; i++)
      arrayAdd(array, items[i]);
  }

  function addStyles(array, items, prefix){
    for (var i = 0, item; item = items[i]; i++)
      if (item[1] !== styleNamespaceIsolate)
        item[1] = prefix + item[1];

    array.unshift.apply(array, items);
  }

  function addStyle(template, token, src, isolatePrefix){
    var url;

    if (src)
    {
      url = basis.resource.resolveURI(src, template.baseURI, '<b:' + token.name + ' src=\"{url}\"/>');
    }
    else
    {
      var text = token.children[0];
      url = basis.resource.virtual('css', text ? text.value : '', template.sourceUrl).url;
    }

    template.resources.push([url, isolatePrefix]);

    return url;
  }

  //
  // main function
  //
  function process(tokens, template, options, context){

    function modifyAttr(token, name, action){
      var attrs = tokenAttrs(token);
      var attrs_ = tokenAttrs_(token);

      if (name)
        attrs.name = name;

      if (!attrs.name)
      {
        /** @cut */ template.warns.push('Instruction <b:' + token.name + '> has no attribute name');
        return;
      }

      if (!IDENT.test(attrs.name))
      {
        /** @cut */ template.warns.push('Bad attribute name `' + attrs.name + '`');
        return;
      }

      var includedToken = tokenRefMap[attrs.ref || 'element'];
      if (includedToken)
      {
        if (includedToken.token[TOKEN_TYPE] == TYPE_ELEMENT)
        {
          var itAttrs = includedToken.token;
          var isEvent = attrs.name.match(ATTR_EVENT_RX);
          var itType = isEvent ? TYPE_ATTRIBUTE_EVENT : ATTR_TYPE_BY_NAME[attrs.name] || TYPE_ATTRIBUTE;
          var valueIdx = ATTR_VALUE_INDEX[itType] || ATTR_VALUE;
          var itAttrToken = itAttrs && arraySearch(itAttrs, attrs.name, function(token){
            if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT)
              return 'event-' + token[1];

            return ATTR_NAME_BY_TYPE[token[TOKEN_TYPE]] || token[ATTR_NAME];
          }, ELEMENT_ATTRS);

          if (!itAttrToken && action != 'remove')
          {
            if (isEvent)
            {
              itAttrToken = [
                itType,
                isEvent[1]
              ];
            }
            else
            {
              itAttrToken = [
                itType,
                0,
                0,
                itType == TYPE_ATTRIBUTE ? attrs.name : ''
              ];

              if (itType == TYPE_ATTRIBUTE)
                itAttrToken.push('');
            }

            if (!itAttrs)
            {
              itAttrs = [];
              includedToken.token.push(itAttrs);
            }

            itAttrs.push(itAttrToken);
          }

          var classOrStyle = attrs.name == 'class' || attrs.name == 'style';
          switch (action){
            case 'set':
              // event-* attribute special case
              if (itAttrToken[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT)
              {
                if (attrs.value == isEvent[1])
                  itAttrToken.length = 2;
                else
                  itAttrToken[valueIdx] = attrs.value;
                return;
              }

              // other attributes
              var valueAttr = attrs_.value || {};
              var parsed = {
                value: valueAttr.value || '',
                binding: valueAttr.binding || ''
              };

              itAttrToken[TOKEN_BINDINGS] = parsed.binding;

              if (!options.optimizeSize || !itAttrToken[TOKEN_BINDINGS] || classOrStyle)
                itAttrToken[valueIdx] = parsed.value || '';
              else
                itAttrToken.length = valueIdx;

              if (classOrStyle)
                if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                {
                  arrayRemove(itAttrs, itAttrToken);
                  return;
                }

              break;

            case 'append':
              var valueAttr = attrs_.value || {};
              var parsed = {
                value: valueAttr.value || '',
                binding: valueAttr.binding || ''
              };

              if (!isEvent)
              {
                if (parsed.binding)
                {
                  var attrBindings = itAttrToken[TOKEN_BINDINGS];
                  if (attrBindings)
                  {
                    switch (attrs.name)
                    {
                      case 'style':
                        var oldBindingMap = {};

                        for (var i = 0, oldBinding; oldBinding = attrBindings[i]; i++)
                          oldBindingMap[oldBinding[2]] = i;

                        for (var i = 0, newBinding; newBinding = parsed.binding[i]; i++)
                          if (newBinding[2] in oldBindingMap)
                            attrBindings[oldBindingMap[newBinding[2]]] = newBinding;
                          else
                            attrBindings.push(newBinding);

                        break;

                      case 'class':
                        attrBindings.push.apply(attrBindings, parsed.binding);
                        break;

                      default:
                        parsed.binding[0].forEach(function(name){
                          arrayAdd(this, name);
                        }, attrBindings[0]);

                        for (var i = 0; i < parsed.binding[1].length; i++)
                        {
                          var value = parsed.binding[1][i];

                          if (typeof value == 'number')
                            value = attrBindings[0].indexOf(parsed.binding[0][value]);

                          attrBindings[1].push(value);
                        }
                    }
                  }
                  else
                  {
                    itAttrToken[TOKEN_BINDINGS] = parsed.binding;
                    if (!classOrStyle)
                      itAttrToken[TOKEN_BINDINGS][1].unshift(itAttrToken[valueIdx]);
                  }
                }
                else
                {
                  if (!classOrStyle && itAttrToken[TOKEN_BINDINGS])
                    itAttrToken[TOKEN_BINDINGS][1].push(attrs.value);
                }
              }

              if (parsed.value)
                itAttrToken[valueIdx] =
                  (itAttrToken[valueIdx] || '') +
                  (itAttrToken[valueIdx] && (isEvent || classOrStyle) ? ' ' : '') +
                  parsed.value;

              if (classOrStyle)
                if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                {
                  arrayRemove(itAttrs, itAttrToken);
                  return;
                }

              break;

            case 'remove':
              if (itAttrToken)
                arrayRemove(itAttrs, itAttrToken);

              break;
          }
        }
        else
        {
          /** @cut */ template.warns.push('Attribute modificator is not reference to element token (reference name: ' + (attrs.ref || 'element') + ')');
        }
      }
    }

    var result = [];

    for (var i = 0, token, item; token = tokens[i]; i++)
    {
      var refs = refList(token);
      var bindings = refs && refs.length == 1 ? refs[0] : 0;

      switch (token.type)
      {
        case TYPE_ELEMENT:
          // special elements (basis namespace)
          if (token.prefix == 'b')
          {
            var elAttrs = tokenAttrs(token);
            var elAttrs_ = tokenAttrs_(token);

            switch (token.name)
            {
              case 'style':
                var styleNamespace = elAttrs.namespace || elAttrs.ns;
                var styleIsolate = styleNamespace ? styleNamespaceIsolate : (context && context.isolate) || '';
                var src = addStyle(template, token, elAttrs.src, styleIsolate);

                if (styleNamespace)
                {
                  if (src in styleNamespaceIsolate == false)
                    styleNamespaceIsolate[src] = genIsolateMarker();
                  template.styleNSPrefix[styleNamespace] = styleNamespaceIsolate[src];
                }
              break;

              case 'isolate':
                if (!template.isolate)
                  template.isolate = elAttrs.prefix || options.isolate || genIsolateMarker();

                /** @cut */ else
                /** @cut */   basis.dev.warn('<b:isolate> is set already to `' + template.isolate + '`');
              break;

              case 'l10n':
                /** @cut */ if (template.l10nResolved)
                /** @cut */   template.warns.push('<b:l10n> must be declared before any `l10n:` token (instruction ignored)');

                if (elAttrs.src)
                  template.dictURI = basis.resource.resolveURI(elAttrs.src, template.baseURI, '<b:' + token.name + ' src=\"{url}\"/>');
              break;

              case 'define':
                /** @cut */ if ('name' in elAttrs == false)
                /** @cut */   template.warns.push('Define has no `name` attribute');
                /** @cut */ if (hasOwnProperty.call(template.defines, elAttrs.name))
                /** @cut */   template.warns.push('Define for `' + elAttrs.name + '` has already defined');

                if ('name' in elAttrs && !template.defines[elAttrs.name])
                {
                  switch (elAttrs.type)
                  {
                    case 'bool':
                      template.defines[elAttrs.name] = [
                        elAttrs.from || elAttrs.name,
                        elAttrs['default'] == 'true' ? 1 : 0
                      ];
                      break;
                    case 'enum':
                      var values = elAttrs.values ? elAttrs.values.trim().split(' ') : [];
                      template.defines[elAttrs.name] = [
                        elAttrs.from || elAttrs.name,
                        values.indexOf(elAttrs['default']) + 1,
                        values
                      ];
                      break;
                    /** @cut */ default:
                    /** @cut */  template.warns.push('Bad define type `' + elAttrs.type + '` for ' + elAttrs.name);
                  }
                }
              break;

              case 'text':
                var text = token.children[0];
                tokens[i--] = basis.object.extend(text, {
                  refs: (elAttrs.ref || '').trim().split(/\s+/),
                  value: 'notrim' in elAttrs ? text.value : text.value.replace(/^\s*[\r\n]+|[\r\n]\s*$/g, '')
                });
              break;

              case 'include':
                var templateSrc = elAttrs.src;
                if (templateSrc)
                {
                  var isTemplateRef = /^#\d+$/.test(templateSrc);
                  var isDocumentIdRef = /^id:/.test(templateSrc);
                  var url = isTemplateRef ? templateSrc.substr(1) : templateSrc;
                  var resource;

                  if (isTemplateRef)
                  {
                    // <b:include src="#123"/>
                    resource = options.templateList[url];
                  }
                  else if (isDocumentIdRef)
                  {
                    // <b:include src="id:foo"/>
                    resource = resolveSourceByDocumentId(url.substr(3));
                  }
                  else if (/^[a-z0-9\.]+$/i.test(url) && !/\.tmpl$/.test(url))
                  {
                    // <b:include src="foo.bar.baz"/>
                    resource = getSourceByPath(url);
                  }
                  else
                  {
                    // <b:include src="./path/to/file.tmpl"/>
                    resource = basis.resource(basis.resource.resolveURI(url, template.baseURI,  '<b:include src=\"{url}\"/>'));
                  }

                  if (!resource)
                  {
                    /** @cut */ template.warns.push('<b:include src="' + templateSrc + '"> is not resolved, instruction ignored');
                    /** @cut */ basis.dev.warn('<b:include src="' + templateSrc + '"> is not resolved, instruction ignored');
                    continue;
                  }

                  // prevent recursion
                  if (includeStack.indexOf(resource) == -1)
                  {
                    var isolatePrefix = elAttrs_.isolate ? elAttrs_.isolate.value || genIsolateMarker() : '';
                    var decl;

                    if (!isDocumentIdRef)
                      arrayAdd(template.deps, resource);

                    if (isTemplateRef)
                    {
                      // source wrapper
                      if (resource.source.bindingBridge)
                        arrayAdd(template.deps, resource.source);

                      decl = getDeclFromSource(resource.source, resource.baseURI, true, options);
                    }
                    else
                    {
                      decl = getDeclFromSource(resource, resource.url ? basis.path.dirname(resource.url) + '/' : '', true, options);
                    }

                    if (decl.resources && 'no-style' in elAttrs == false)
                      addStyles(template.resources, decl.resources, isolatePrefix);

                    if (decl.deps)
                      addUnique(template.deps, decl.deps);

                    /** @cut */ if (decl.l10n)
                    /** @cut */   addUnique(template.l10n, decl.l10n);

                    var tokenRefMap = normalizeRefs(decl.tokens);
                    var instructions = (token.children || []).slice();
                    var styleNSPrefixMap = basis.object.slice(decl.styleNSPrefix);

                    if (elAttrs_['class'])
                    {
                      instructions.push({
                        type: TYPE_ELEMENT,
                        prefix: 'b',
                        name: 'append-class',
                        attrs: [
                          basis.object.extend(basis.object.slice(elAttrs_['class']), {
                            name: 'value'
                          })
                        ]
                      });
                    }

                    if (elAttrs.id)
                      instructions.push({
                        type: TYPE_ELEMENT,
                        prefix: 'b',
                        name: 'set-attr',
                        attrs: [
                          {
                            type: TYPE_ATTRIBUTE,
                            name: 'name',
                            value: 'id'
                          },
                          {
                            type: TYPE_ATTRIBUTE,
                            name: 'value',
                            value: elAttrs.id
                          }
                        ]
                      });

                    if (elAttrs.ref)
                      if (tokenRefMap.element)
                        elAttrs.ref.trim().split(/\s+/).map(function(refName){
                          addTokenRef(tokenRefMap.element.token, refName);
                        });

                    for (var j = 0, child; child = instructions[j]; j++)
                    {
                      // process special elements (basis namespace)
                      if (child.type == TYPE_ELEMENT && child.prefix == 'b')
                      {
                        switch (child.name)
                        {
                          case 'style':
                            var childAttrs = tokenAttrs(child);
                            var styleNamespace = childAttrs.namespace || childAttrs.ns;
                            var styleIsolate = styleNamespace ? styleNamespaceIsolate : isolatePrefix;
                            var src = addStyle(template, child, childAttrs.src, styleIsolate);

                            if (styleNamespace)
                            {
                              if (src in styleNamespaceIsolate == false)
                                styleNamespaceIsolate[src] = genIsolateMarker();
                              styleNSPrefixMap[styleNamespace] = styleNamespaceIsolate[src];
                            }
                            break;

                          case 'replace':
                          case 'remove':
                          case 'before':
                          case 'after':
                            var replaceOrRemove = child.name == 'replace' || child.name == 'remove';
                            var childAttrs = tokenAttrs(child);
                            var ref = 'ref' in childAttrs || !replaceOrRemove ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];

                            //if (!tokenRef)

                            if (tokenRef)
                            {
                              var pos = tokenRef.owner.indexOf(tokenRef.token);
                              if (pos != -1)
                              {
                                var args = [pos + (child.name == 'after'), replaceOrRemove];

                                if (child.name != 'remove')
                                  args = args.concat(process(child.children, template, options) || []);

                                tokenRef.owner.splice.apply(tokenRef.owner, args);
                              }
                            }
                            break;

                          case 'prepend':
                          case 'append':
                            var childAttrs = tokenAttrs(child);
                            var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];
                            var token = tokenRef && tokenRef.token;

                            if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
                            {
                              var children = process(child.children, template, options) || [];

                              if (child.name == 'prepend')
                                token.splice.apply(token, [ELEMENT_ATTRS, 0].concat(children));
                              else
                                token.push.apply(token, children);
                            }
                            break;

                          case 'attr':
                          case 'set-attr':
                            modifyAttr(child, false, 'set');
                            break;

                          case 'append-attr':
                            modifyAttr(child, false, 'append');
                            break;

                          case 'remove-attr':
                            modifyAttr(child, false, 'remove');
                            break;

                          case 'class':
                          case 'append-class':
                            modifyAttr(child, 'class', 'append');
                            break;

                          case 'set-class':
                            modifyAttr(child, 'class', 'set');
                            break;

                          case 'remove-class':
                            modifyAttr(child, 'class', 'remove');
                            break;

                          case 'add-ref':
                            var childAttrs = tokenAttrs(child);
                            var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];
                            var token = tokenRef && tokenRef.token;

                            if (token && childAttrs.name)
                              addTokenRef(token, childAttrs.name);
                            break;

                          case 'remove-ref':
                            var childAttrs = tokenAttrs(child);
                            var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];
                            var token = tokenRef && tokenRef.token;

                            if (token)
                              removeTokenRef(token, childAttrs.name || childAttrs.ref);
                            break;

                          default:
                            /** @cut */ template.warns.push('Unknown instruction tag <b:' + child.name + '>');
                        }
                      }
                      else
                      {
                        decl.tokens.push.apply(decl.tokens, process([child], template, options) || []);
                      }
                    }

                    if (tokenRefMap.element)
                      removeTokenRef(tokenRefMap.element.token, 'element');

                    // complete template namespace prefix map
                    basis.object.complete(template.styleNSPrefix, styleNSPrefixMap);

                    // isolate
                    if (isolatePrefix)
                      isolateTokens(decl.tokens, isolatePrefix);
                    else
                      // inherit isolate from nested template
                      if (decl.isolate && !template.isolate)
                        template.isolate = options.isolate || genIsolateMarker();

                    //resources.push.apply(resources, tokens.resources);
                    result.push.apply(result, decl.tokens);
                  }
                  else
                  {
                    /** @cut */ var stack = includeStack.slice(includeStack.indexOf(resource) || 0).concat(resource).map(function(res){
                    /** @cut */   if (res instanceof Template)
                    /** @cut */     res = res.source;
                    /** @cut */   if (res instanceof L10nProxyToken)
                    /** @cut */     return '{l10n:' + res.token.name + '@' + res.token.dictionary.resource.url + '}';
                    /** @cut */   return res.url || '[inline template]';
                    /** @cut */ });
                    /** @cut */ template.warns.push('Recursion: ', stack.join(' -> '));
                    /** @cut */ basis.dev.warn('Recursion in template: ', stack.join(' -> '));
                  }
                }

              break;
            }

            // don't add to declaration
            continue;
          }

          item = [
            1,                       // TOKEN_TYPE = 0
            bindings,                // TOKEN_BINDINGS = 1
            refs,                    // TOKEN_REFS = 2
            name(token)              // ELEMENT_NAME = 3
          ];
          item.push.apply(item, attrs(token, item, options.optimizeSize) || []);
          item.push.apply(item, process(token.children, template, options) || []);

          break;

        case TYPE_TEXT:
          if (refs && refs.length == 2 && arraySearch(refs, 'element'))
            bindings = refs[+!refs.lastSearchIndex]; // get first one reference but not `element`

          // process l10n
          if (bindings)
          {
            var l10nBinding = absl10n(bindings, template.dictURI);  // l10n:foo.bar.{binding}@dict/path/to.l10n
            var parts = l10nBinding.split(/[:@\{]/);

            // if prefix is l10n: and token has no value bindings
            if (parts[0] == 'l10n' && parts.length == 3)
            {
              // check for dictionary
              if (!parts[2])
              {
                // reset binding with no dictionary
                arrayRemove(refs, bindings);
                if (refs.length == 0)
                  refs = null;
                bindings = 0;
                token.value = token.value.replace(/\}$/, '@undefined}');
              }
              else
              {
                var l10nId = parts.slice(1).join('@');
                var l10nToken = getL10nToken(l10nId);
                var l10nTemplate = getL10nTemplate(l10nToken);

                template.l10nResolved = true;

                if (l10nTemplate && l10nToken.type == 'markup')
                {
                  tokens[i--] = tokenize('<b:include src="#' + l10nTemplate.templateId + '"/>')[0];
                  continue;
                }
                /** @cut for token type change in dev mode */
                /** @cut */ else
                /** @cut */   arrayAdd(template.l10n, l10nId);
              }
            }
          }

          item = [
            3,                       // TOKEN_TYPE = 0
            bindings,                // TOKEN_BINDINGS = 1
            refs                     // TOKEN_REFS = 2
          ];

          // TEXT_VALUE = 3
          if (!refs || token.value != '{' + refs.join('|') + '}')
            item.push(token.value);

          break;

        case TYPE_COMMENT:
          if (options.optimizeSize && !bindings && !refs)
            continue;

          item = [
            8,                       // TOKEN_TYPE = 0
            bindings,                // TOKEN_BINDINGS = 1
            refs                     // TOKEN_REFS = 2
          ];

          // COMMENT_VALUE = 3
          if (!options.optimizeSize)
            if (!refs || token.value != '{' + refs.join('|') + '}')
              item.push(token.value);

          break;
      }

      while (item[item.length - 1] === 0)
        item.pop();

      result.push(item);
    }


    return result.length ? result : 0;
  }

  function absl10n(value, dictURI){
    if (typeof value != 'string')
      return value;

    var parts = value.split(':');
    if (parts.length == 2 && parts[0] == 'l10n' && parts[1].indexOf('@') == -1)
      parts[1] = parts[1] + '@' + dictURI;

    return parts.join(':');
  }

  function normalizeRefs(tokens, dictURI, map, stIdx){
    if (!map)
      map = {};

    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      if (token[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT)
        continue;

      var refs = token[TOKEN_REFS];

      if (refs)
      {
        for (var j = refs.length - 1, refName; refName = refs[j]; j--)
        {
          if (refName.indexOf(':') != -1)
          {
            removeTokenRef(token, refName);
            continue;
          }

          if (map[refName])
            removeTokenRef(map[refName].token, refName);

          if (token[TOKEN_BINDINGS] == refName)
            token[TOKEN_BINDINGS] = j + 1;

          map[refName] = {
            owner: tokens,
            token: token
          };
        }
      }

      switch (token[TOKEN_TYPE])
      {
        case TYPE_TEXT:
          token[TOKEN_BINDINGS] = absl10n(token[TOKEN_BINDINGS], dictURI);
          break;

        case TYPE_ATTRIBUTE:
          if (token[TOKEN_BINDINGS])
          {
            var array = token[TOKEN_BINDINGS][0];
            for (var j = 0; j < array.length; j++)
              array[j] = absl10n(array[j], dictURI);
          }
          break;

        case TYPE_ELEMENT:
          normalizeRefs(token, dictURI, map, ELEMENT_ATTRS);
          break;
      }
    }

    return map;
  }

  function applyDefines(tokens, template, options, stIdx){
    var unpredictable = 0;

    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];

      if (tokenType == TYPE_ELEMENT)
        unpredictable += applyDefines(token, template, options, ELEMENT_ATTRS);

      if (tokenType == TYPE_ATTRIBUTE_CLASS || (tokenType == TYPE_ATTRIBUTE && token[ATTR_NAME] == 'class'))
      {
        var bindings = token[TOKEN_BINDINGS];
        var valueIdx = ATTR_VALUE_INDEX[tokenType];

        if (bindings)
        {
          var newAttrValue = (token[valueIdx] || '').trim();
          newAttrValue = newAttrValue == '' ? [] : newAttrValue.split(' ');

          for (var k = 0, bind; bind = bindings[k]; k++)
          {
            if (bind.length > 2)  // bind already processed
              continue;

            var bindNameParts = bind[1].split(':');
            var bindName = bindNameParts.pop();
            var bindPrefix = bindNameParts.pop() || '';
            var bindDef = template.defines[bindName];

            if (bindDef)
            {
              bind[1] = (bindPrefix ? bindPrefix + ':' : '') + bindDef[0];
              bind.push.apply(bind, bindDef.slice(1)); // add define
              bindDef.used = true;  // mark as used

              if (bindDef[1])
              {
                if (bindDef.length == 2)
                  // bool
                  arrayAdd(newAttrValue, bind[0] + bindName);
                else
                  // enum
                  arrayAdd(newAttrValue, bind[0] + bindDef[2][bindDef[1] - 1]);
              }
            }
            else
            {
              /** @cut */ template.warns.push('Unpredictable value `' + bindName + '` in class binding: ' + bind[0] + '{' + bind[1] + '}');
              unpredictable++;
            }
          }

          token[valueIdx] = newAttrValue.join(' ');
          if (options.optimizeSize && !token[valueIdx])
            token.length = valueIdx;
        }
      }
    }

    return unpredictable;
  }

  function isolateTokens(tokens, isolate, template, stIdx){
    function processName(name){
      var parts = name.split(':');

      if (parts.length == 1)
        return isolate + parts[0];

      // don't resolve namespaced names if not template isolate mode
      if (!template)
        return name;

      // global namespace
      if (!parts[0])
        return parts[1];

      // if namespace not found, no prefix and show warning
      if (parts[0] in template.styleNSPrefix == false)
      {
        /** @cut */ template.warns.push('Namespace `' + parts[0] + '` is not defined in template, no prefix added');
        return name;
      }

      return template.styleNSPrefix[parts[0]] + parts[1];
    }

    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];

      if (tokenType == TYPE_ELEMENT)
        isolateTokens(token, isolate, template, ELEMENT_ATTRS);

      if (tokenType == TYPE_ATTRIBUTE_CLASS || (tokenType == TYPE_ATTRIBUTE && token[ATTR_NAME] == 'class'))
      {
        var bindings = token[TOKEN_BINDINGS];
        var valueIndex = ATTR_VALUE_INDEX[tokenType];

        if (token[valueIndex])
          token[valueIndex] = token[valueIndex]
            .split(/\s+/)
            .map(processName)
            .join(' ');

        if (bindings)
          for (var k = 0, bind; bind = bindings[k]; k++)
            bind[0] = processName(bind[0]);
      }
    }
  }

  return function makeDeclaration(source, baseURI, options, sourceUrl, sourceOrigin){
    options = options || {};
    var warns = [];
    /** @cut */ var source_;

    // result object
    var result = {
      sourceUrl: sourceUrl,
      baseURI: baseURI || '',
      tokens: null,
      resources: [],
      styleNSPrefix: {},
      deps: [],
      /** @cut for token type change in dev mode */ l10n: [],
      defines: {},
      unpredictable: true,
      warns: warns,
      isolate: false
    };

    // resolve l10n dictionary url
    result.dictURI = sourceUrl
      ? basis.path.resolve(sourceUrl)
      : baseURI || '';

    // normalize dictionary ext name
    if (result.dictURI)
    {
      var extname = basis.path.extname(result.dictURI);
      if (extname && extname != '.l10n')
        result.dictURI = result.dictURI.substr(0, result.dictURI.length - extname.length) + '.l10n';
    }

    if (!source.templateTokens)
    {
      /** @cut */ source_ = source;
      source = tokenize(String(source));
    }

    // add tokenizer warnings if any
    if (source.warns)
      warns.push.apply(warns, source.warns);

    // start prevent recursion
    includeStack.push((sourceOrigin !== true && sourceOrigin) || {}); // basisjs-tools pass true

    //
    // main task
    //
    result.tokens = process(source, result, options);

    // stop prevent recursion
    includeStack.pop();

    // there must be at least one token in result
    if (!result.tokens)
      result.tokens = [[3, 0, 0, '']];

    // store source for debug
    /** @cut */ if (source_)
    /** @cut */   result.tokens.source_ = source_;

    // normalize refs
    addTokenRef(result.tokens[0], 'element');
    normalizeRefs(result.tokens, result.dictURI);

    // deal with defines
    result.unpredictable = !!applyDefines(result.tokens, result, options);

    /** @cut */ if (/^[^a-z]/i.test(result.isolate))
    /** @cut */   basis.dev.error('basis.template: isolation prefix `' + result.isolate + '` should not starts with symbol other than letter, otherwise it leads to incorrect css class names and broken styles');

    if (includeStack.length == 0)
    {
      // isolate tokens
      isolateTokens(result.tokens, result.isolate || '', result);

      // resolve style prefix
      if (result.isolate)
        for (var i = 0, item; item = result.resources[i]; i++)
          if (item[1] !== styleNamespaceIsolate)  // ignore namespaced styles
            item[1] = result.isolate + item[1];

      // isolate styles
      result.resources = result.resources
        // remove duplicates
        .filter(function(item, idx, array){
          return !basis.array.search(array, String(item), String, idx + 1);
        })
        // isolate
        .map(function(item){
          var url = item[0];
          var isolate = item[1];
          var namespaceIsolate = isolate === styleNamespaceIsolate;

          // resolve namespaced style
          if (namespaceIsolate)
          {
            isolate = styleNamespaceIsolate[url];
            if (url in styleNamespaceResource)
              return styleNamespaceResource[url].url;
          }

          // if no isolate prefix -> nothing todo
          if (!isolate)
            return url;

          // otherwise create virtual resource with prefixed classes in selectors
          var resource = basis.resource.virtual('css', '').ready(function(cssResource){
            sourceResource();
            basis.object.extend(cssResource, {
              url: url + '?isolate-prefix=' + isolate,
              baseURI: basis.path.dirname(url) + '/'
            });
          });

          var sourceResource = basis.resource(url).ready(function(cssResource){
            var cssText = isolateCss(cssResource.cssText || '', isolate);

            /** @cut */ if (typeof btoa == 'function')
            /** @cut */   cssText += '\n/*# sourceMappingURL=data:application/json;base64,' +
            /** @cut */     btoa('{"version":3,"sources":["' + basis.path.origin + url + '"],' +
            /** @cut */     '"mappings":"AAAA' + basis.string.repeat(';AACA', cssText.split('\n').length) +
            /** @cut */     '"}') + ' */';

            resource.update(cssText);
          });

          if (namespaceIsolate)
            styleNamespaceResource[url] = resource;

          return resource.url;
        });
    }

    /** @cut */ for (var key in result.defines)
    /** @cut */   if (!result.defines[key].used)
    /** @cut */     warns.push('Unused define for ' + key);

    // delete unnecessary keys
    delete result.defines;
    delete result.l10nResolved;

    if (!warns.length)
      result.warns = false;

    return result;
  };
})();

/**
*
*/
function cloneDecl(array){
  var result = [];

  /** @cut */ if (array.source_)
  /** @cut */   result.source_ = array.source_;

  for (var i = 0; i < array.length; i++)
    result.push(
      Array.isArray(array[i])
        ? cloneDecl(array[i])
        : array[i]
    );

  return result;
}

/**
* @param {*} source
* @param {string=} baseURI
* @param {boolean=} clone
* @param {object=} options
*/
function getDeclFromSource(source, baseURI, clone, options){
  var result = source;
  var sourceUrl;

  if (typeof source == 'function')
  {
    baseURI = 'baseURI' in source ? source.baseURI : baseURI;
    sourceUrl = 'url' in source ? source.url : sourceUrl;
    result = source();
  }

  if (result instanceof basis.Token)
  {
    baseURI = 'baseURI' in result ? result.baseURI : baseURI;
    sourceUrl = 'url' in result ? result.url : sourceUrl;
    result = result.get();
  }

  if (Array.isArray(result))
  {
    if (clone)
      result = cloneDecl(result);

    result = {
      tokens: result
    };
  }
  else
  {
    if (typeof result != 'object' || !Array.isArray(result.tokens))
      result = String(result);
  }

  if (typeof result == 'string')
    result = makeDeclaration(result, baseURI, options, sourceUrl, source);

  return result;
}

resource('../template.js').ready(function(exports){
  L10nProxyToken = exports.L10nProxyToken;
  getL10nTemplate = exports.getL10nTemplate;
});

module.exports = {
  makeDeclaration: makeDeclaration,
  getDeclFromSource: getDeclFromSource
};
