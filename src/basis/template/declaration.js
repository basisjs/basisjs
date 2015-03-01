
var arraySearch = basis.array.search;
var arrayAdd = basis.array.add;
var arrayRemove = basis.array.remove;

var tokenize = require('./tokenize.js');
var isolateCss = require('./isolateCss.js');
var consts = require('./const.js');

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
var CLASS_BINDING_ENUM = consts.CLASS_BINDING_ENUM;
var CLASS_BINDING_BOOL = consts.CLASS_BINDING_BOOL;

var IDENT = /^[a-z_][a-z0-9_\-]*$/i;
var ATTR_EVENT_RX = /^event-(.+)$/;


// TODO: remove
var Template = function(){};
var resolveResource = function(){};


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

  function getTokenName(token){
    return (token.prefix ? token.prefix + ':' : '') + token.name;
  }

  function refList(token){
    var array = token.refs;

    if (!array || !array.length)
      return 0;

    return array;
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
        // if binding is index in ref list and ref binding index points to is removing
        if (idx == token[TOKEN_BINDINGS] - 1)
        {
          // convert index to explicit binding value
          token[TOKEN_BINDINGS] = refName;
          indexBinding = false;
        }

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
        result[getTokenName(attr)] = attr.value;

    return result;
  }

  function tokenAttrs_(token){
    var result = {};

    if (token.attrs)
      for (var i = 0, attr; attr = token.attrs[i]; i++)
        result[getTokenName(attr)] = attr;

    return result;
  }

  function addUnique(array, items){
    for (var i = 0; i < items.length; i++)
      arrayAdd(array, items[i]);
  }

  function importStyles(array, items, prefix, includeToken){
    for (var i = 0, item; item = items[i]; i++)
    {
      if (item[1] !== styleNamespaceIsolate)
        item[1] = prefix + item[1];
      if (!item[3])
        item[3] = includeToken;
    }

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

    template.resources.push([url, isolatePrefix, token, false]);

    return url;
  }

  function getLocation(template, loc){
    if (loc)
      return (template.sourceUrl || '') + ':' + loc.start.line + ':' + (loc.start.column + 1);
  }

  function addTemplateWarn(template, options, message, loc){
    /** @cut */ if (loc && options.loc)
    /** @cut */ {
    /** @cut */   message = Object(message);
    /** @cut */   message.loc = typeof loc == 'string' ? loc : getLocation(template, loc);
    /** @cut */ }

    template.warns.push(message);
  }

  function applyTokenLocation(template, options, dest, source){
    /** @cut */ if (options.loc && source.loc && !dest.loc)
    /** @cut */   dest.loc = getLocation(template, source.loc);
  }

  //
  // main function
  //
  function process(tokens, template, options){

    function addTokenLocation(item, token){
      applyTokenLocation(template, options, item, token);
    }

    function attrs(token, declToken){
      function setStylePropertyBinding(attr, property, byDefault, defaultValue){
        if (!styleAttr)
        {
          styleAttr = [TYPE_ATTRIBUTE_STYLE, 0, 0];
          //styleAttr.loc = getLocation(template, attr.loc);
          addTokenLocation(styleAttr, attr);
          result.push(styleAttr);
        }

        var binding = attr.binding;
        var addDefault = false;
        var show = attr.name == byDefault;

        if (!binding || binding[0].length != binding[1].length)
        {
          // expression has non-binding parts, treat as constant
          // visible when:
          //   show & value is not empty
          //   or
          //   hide & value is empty
          addDefault = !(show ^ attr.value === '');
        }
        else
        {
          addDefault = show;

          if (!styleAttr[1])
            styleAttr[1] = [];

          styleAttr[1].push(binding.concat(property, attr.name));
        }

        if (addDefault)
          styleAttr[3] = (styleAttr[3] ? styleAttr[3] + '; ' : '') + defaultValue;
      }

      var result = [];
      var styleAttr;
      var displayAttr;
      var visibilityAttr;
      var item;
      var m;

      for (var i = 0, attr; attr = token.attrs[i]; i++)
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
              displayAttr = attr;
              break;

            case 'visible':
            case 'hidden':
              visibilityAttr = attr;
              break;
          }

          continue;
        }

        if (m = attr.name.match(ATTR_EVENT_RX))
        {
          item = m[1] == attr.value
            ? [TYPE_ATTRIBUTE_EVENT, m[1]]
            : [TYPE_ATTRIBUTE_EVENT, m[1], attr.value];
        }
        else
        {
          item = [
            attr.type,              // TOKEN_TYPE = 0
            attr.binding,           // TOKEN_BINDINGS = 1
            refList(attr)           // TOKEN_REFS = 2
          ];

          // ATTR_NAME = 3
          if (attr.type == 2)
            item.push(getTokenName(attr));

          // ATTR_VALUE = 4
          if (attr.value && (!options.optimizeSize || !attr.binding || attr.type != 2))
            item.push(attr.value);

          if (attr.type == TYPE_ATTRIBUTE_STYLE)
            styleAttr = item;
        }

        /** @cut */ addTokenLocation(item, attr);

        result.push(item);
      }

      if (displayAttr)
        setStylePropertyBinding(displayAttr, 'display', 'show', 'display: none');

      if (visibilityAttr)
        setStylePropertyBinding(visibilityAttr, 'visibility', 'visible', 'visibility: hidden');

      return result.length ? result : 0;
    }

    function modifyAttr(token, name, action){
      var attrs = tokenAttrs(token);
      var attrs_ = tokenAttrs_(token);

      if (name)
        attrs.name = name;

      if (!attrs.name)
      {
        /** @cut */ addTemplateWarn(template, options, 'Instruction <b:' + token.name + '> has no attribute name', token.loc);
        return;
      }

      if (!IDENT.test(attrs.name))
      {
        /** @cut */ addTemplateWarn(template, options, 'Bad attribute name `' + attrs.name + '`', token.loc);
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

          if (!itAttrToken && action != 'remove' && action != 'remove-class')
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
            //itAttrToken.loc = getLocation(template, token.loc);
            addTokenLocation(itAttrToken, token);
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

              itAttrToken[TOKEN_BINDINGS] = valueAttr.binding || 0;

              if (!options.optimizeSize || !itAttrToken[TOKEN_BINDINGS] || classOrStyle)
                itAttrToken[valueIdx] = valueAttr.value || '';
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
              var appendValue = valueAttr.value || '';
              var appendBinding = valueAttr.binding;

              if (!isEvent)
              {
                if (appendBinding)
                {
                  var attrBindings = itAttrToken[TOKEN_BINDINGS];
                  if (attrBindings)
                  {
                    switch (attrs.name)
                    {
                      case 'style':
                        var currentBindingMap = {};

                        for (var i = 0, oldBinding; oldBinding = attrBindings[i]; i++)
                          currentBindingMap[oldBinding[2]] = i;

                        for (var i = 0, newBinding; newBinding = appendBinding[i]; i++)
                          if (newBinding[2] in currentBindingMap)
                            attrBindings[currentBindingMap[newBinding[2]]] = newBinding;
                          else
                            attrBindings.push(newBinding);

                        break;

                      case 'class':
                        attrBindings.push.apply(attrBindings, appendBinding);
                        break;

                      default:
                        appendBinding[0].forEach(function(name){
                          arrayAdd(this, name);
                        }, attrBindings[0]);

                        for (var i = 0; i < appendBinding[1].length; i++)
                        {
                          var value = appendBinding[1][i];

                          if (typeof value == 'number')
                            value = attrBindings[0].indexOf(appendBinding[0][value]);

                          attrBindings[1].push(value);
                        }
                    }
                  }
                  else
                  {
                    itAttrToken[TOKEN_BINDINGS] = appendBinding;
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

              if (appendValue)
                itAttrToken[valueIdx] =
                  (itAttrToken[valueIdx] || '') +
                  (itAttrToken[valueIdx] && (isEvent || classOrStyle) ? ' ' : '') +
                  appendValue;

              if (classOrStyle && !itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                arrayRemove(itAttrs, itAttrToken);

              break;

            case 'remove-class':
              if (itAttrToken)
              {
                var valueAttr = attrs_.value || {};
                var remValues = (valueAttr.value || '').split(' ');
                var values = (itAttrToken[valueIdx] || '').split(' ');
                var bindings = itAttrToken[TOKEN_BINDINGS];

                if (valueAttr.binding && bindings)
                {
                  for (var i = 0, remBinding; remBinding = valueAttr.binding[i]; i++)
                    for (var j = bindings.length - 1, classBinding; classBinding = bindings[j]; j--)
                    {
                      // remBinding
                      //      -> [prefix, name]
                      // classBinding
                      //      -> [prefix, bindingName, type, name, defaultValue, values]
                      //   or -> [prefix, name, -1]
                      var prefix = classBinding[0];
                      var bindingName = classBinding[3] || classBinding[1];

                      if (prefix === remBinding[0] && bindingName === remBinding[1])
                        bindings.splice(j, 1);
                    }

                  if (!bindings.length)
                    itAttrToken[TOKEN_BINDINGS] = 0;
                }

                for (var i = 0; i < remValues.length; i++)
                  arrayRemove(values, remValues[i]);

                itAttrToken[valueIdx] = values.join(' ');

                if (!itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                  arrayRemove(itAttrs, itAttrToken);
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
          /** @cut */ addTemplateWarn(template, options, 'Attribute modificator is not reference to element token (reference name: ' + (attrs.ref || 'element') + ')', token.loc);
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
                var styleIsolate = styleNamespace ? styleNamespaceIsolate : '';
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
                /** @cut */   addTemplateWarn(template, options, '<b:isolate> is already set to `' + template.isolate + '`', token.loc);
              break;

              case 'l10n':
                if (elAttrs.src)
                  template.dictURI = basis.resource.resolveURI(elAttrs.src, template.baseURI, '<b:' + token.name + ' src=\"{url}\"/>');
              break;

              case 'define':
                /** @cut */ if ('name' in elAttrs == false)
                /** @cut */   addTemplateWarn(template, options, 'Define has no `name` attribute', token.loc);
                /** @cut */ if (hasOwnProperty.call(template.defines, elAttrs.name))
                /** @cut */   addTemplateWarn(template, options, 'Define for `' + elAttrs.name + '` has already defined', token.loc);

                if ('name' in elAttrs && !template.defines[elAttrs.name])
                {
                  var bindingName = elAttrs.from || elAttrs.name;
                  var defineName = elAttrs.name;
                  var define = false;
                  var defaultIndex;
                  var values;

                  switch (elAttrs.type)
                  {
                    case 'bool':
                      define = [
                        bindingName,
                        CLASS_BINDING_BOOL,
                        defineName,
                        elAttrs['default'] == 'true' ? 1 : 0
                      ];
                      break;
                    case 'enum':
                      if ('values' in elAttrs == false)
                      {
                        /** @cut */ addTemplateWarn(template, options, 'Enum define has no `values` attribute', token.loc);
                        break;
                      }

                      values = (elAttrs.values || '').trim();

                      if (!values)
                      {
                        /** @cut */ addTemplateWarn(template, options, 'Enum define has no variants (`values` attribute is empty)', elAttrs_.values && elAttrs_.values.loc);
                        break;
                      }

                      values = values.split(/\s+/);
                      defaultIndex = values.indexOf(elAttrs['default']);

                      /** @cut */ if ('default' in elAttrs && defaultIndex == -1)
                      /** @cut */   addTemplateWarn(template, options, 'Enum define has bad value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

                      define = [
                        bindingName,
                        CLASS_BINDING_ENUM,
                        defineName,
                        defaultIndex + 1,
                        values
                      ];

                      break;
                    /** @cut */ default:
                    /** @cut */   addTemplateWarn(template, options, 'Bad define type `' + elAttrs.type + '` for ' + defineName, elAttrs_.type && elAttrs_.type.valueLoc);
                  }

                  if (define)
                  {
                    //define.loc = token.loc;
                    addTokenLocation(define, token);
                    template.defines[defineName] = define;
                  }
                }
              break;

              case 'text':
                var text = token.children[0];
                tokens[i--] = basis.object.extend(text, {
                  refs: (elAttrs.ref || '').trim().split(/\s+/),
                  value: 'notrim' in elAttrs ? text.value : text.value.replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '')
                });
              break;

              case 'include':
                var templateSrc = elAttrs.src;
                if (templateSrc)
                {
                  var resource = resolveResource(templateSrc, template.baseURI);

                  if (!resource)
                  {
                    /** @cut */ addTemplateWarn(template, options, '<b:include src="' + templateSrc + '"> is not resolved, instruction ignored', token.loc);
                    continue;
                  }

                  // prevent recursion
                  if (includeStack.indexOf(resource) == -1)
                  {
                    var isolatePrefix = elAttrs_.isolate ? elAttrs_.isolate.value || genIsolateMarker() : '';
                    var decl = getDeclFromSource(resource, '', true, options);

                    arrayAdd(template.deps, resource);
                    template.includes.push([elAttrs_.src, resource, decl.includes]);

                    if (decl.deps)
                      addUnique(template.deps, decl.deps);

                    if (decl.warns)
                      template.warns.push.apply(template.warns, decl.warns);

                    if (decl.resources && 'no-style' in elAttrs == false)
                      importStyles(template.resources, decl.resources, isolatePrefix, token);

                    var tokenRefMap = normalizeRefs(decl.tokens);
                    var instructions = (token.children || []).slice();
                    var styleNSPrefixMap = basis.object.slice(decl.styleNSPrefix);

                    if (elAttrs_['class'])
                    {
                      instructions.unshift({
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
                      instructions.unshift({
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
                            modifyAttr(child, 'class', 'remove-class');
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
                            /** @cut */ addTemplateWarn(template, options, 'Unknown instruction tag <b:' + child.name + '>', child.loc);
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
                    /** @cut */   return res.id || res.url || '[inline template]';
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
            getTokenName(token)      // ELEMENT_NAME = 3
          ];
          item.push.apply(item, attrs(token, item, options.optimizeSize) || []);
          item.push.apply(item, process(token.children, template, options) || []);

          /** @cut */ addTokenLocation(item, token);

          break;

        case TYPE_TEXT:
          if (refs && refs.length == 2 && arraySearch(refs, 'element'))
            bindings = refs[+!refs.lastSearchIndex]; // get first one reference but not `element`

          item = [
            3,                       // TOKEN_TYPE = 0
            bindings,                // TOKEN_BINDINGS = 1
            refs                     // TOKEN_REFS = 2
          ];

          // TEXT_VALUE = 3
          if (!refs || token.value != '{' + refs.join('|') + '}')
            item.push(token.value);

          /** @cut */ addTokenLocation(item, token);

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

          /** @cut */ addTokenLocation(item, token);

          break;
      }

      while (item[item.length - 1] === 0)
        item.pop();

      result.push(item);
    }


    return result.length ? result : 0;
  }

  function absl10n(value, dictURI, l10nMap){
    if (typeof value == 'string')
    {
      var parts = value.split(':');
      var l10n = parts[0] == 'l10n';

      if (l10n)
        if (parts.length == 2 && value.indexOf('@') == -1)
        {
          if (!dictURI)
            return false;  // TODO: add warning that dictionary not found
          parts[1] = parts[1] + '@' + dictURI;
        }

      value = parts.join(':');

      if (l10n)
        l10nMap[value] = true;
    }

    return value;
  }

  function normalizeRefs(tokens, dictURI, map, stIdx){
    if (!map)
      map = {};

    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];
      var refs = token[TOKEN_REFS];

      if (tokenType !== TYPE_ATTRIBUTE_EVENT && refs)
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

      if (tokenType === TYPE_ELEMENT)
        normalizeRefs(token, dictURI, map, ELEMENT_ATTRS);
    }

    return map;
  }

  function applyDefines(tokens, template, options, stIdx){
    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];
      var bindings = token[TOKEN_BINDINGS];

      switch (token[TOKEN_TYPE])
      {
        case TYPE_ELEMENT:
          applyDefines(token, template, options, ELEMENT_ATTRS);
          break;

        case TYPE_TEXT:
          if (bindings)
          {
            var binding = absl10n(bindings, template.dictURI, template.l10nTokens);
            token[TOKEN_BINDINGS] = binding || 0;
            if (binding === false)
            {
              /** @cut */ addTemplateWarn(template, options, 'Dictionary for l10n binding on text node can\'t be resolved: {' + bindings + '}', token.loc);
              token[TEXT_VALUE] = '{' + bindings + '}';
            }
          }
          break;

        case TYPE_ATTRIBUTE:
          if (bindings)
          {
            var array = bindings[0];
            for (var j = 0; j < array.length; j++)
            {
              var binding = absl10n(array[j], template.dictURI, template.l10nTokens);   // TODO: move l10n binding process in separate function
              array[j] = binding === false ? '{' + array[j] + '}' : binding;
              /** @cut */ if (binding === false)
              /** @cut */   addTemplateWarn(template, options, 'Dictionary for l10n binding on attribute can\'t be resolved: {' + array[j] + '}', token.loc);
            }
          }
          break;

        case TYPE_ATTRIBUTE_CLASS:
          if (bindings)
          {
            for (var k = 0, bind; bind = bindings[k]; k++)
            {
              if (bind.length > 2)  // bind already processed
                continue;

              /** @cut */ applyTokenLocation(template, options, bind, bind.info_);

              var bindNameParts = bind[1].split(':');
              var bindName = bindNameParts.pop();
              var bindPrefix = bindNameParts.pop() || '';
              var define = template.defines[bindName];

              if (define)
              {
                bind[1] = (bindPrefix ? bindPrefix + ':' : '') + define[0];
                bind.push.apply(bind, define.slice(1)); // add define

                /** @cut */ define.used = true;  // mark as used
              }
              else
              {
                bind.push(0); // mark binding to not processing it anymore

                /** @cut */ addTemplateWarn(template, options, 'Unpredictable class binding: ' + bind[0] + '{' + bind[1] + '}', bind.loc);
              }
            }

            if (options.optimizeSize)
            {
              var valueIdx = ATTR_VALUE_INDEX[tokenType];
              if (!token[valueIdx])
                token.length = valueIdx;
            }
          }
          break;
      }
    }
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
        // TODO: attach warning to location
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

      if (tokenType == TYPE_ATTRIBUTE_CLASS)
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
    var warns = [];
    /** @cut */ var source_;

    options = options || {};
    /** @cut */ options = basis.object.complete({ loc: true, range: true }, options);

    // result object
    var result = {
      sourceUrl: sourceUrl,
      baseURI: baseURI || '',
      dictURI: sourceUrl  // resolve l10n dictionary url
        ? basis.path.resolve(sourceUrl)
        : baseURI || '',

      tokens: null,
      styleNSPrefix: {},
      resources: [],
      includes: [],
      deps: [],
      defines: {},
      l10nTokens: {},
      warns: warns,
      isolate: false
    };

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
      source = tokenize(String(source), {
        loc: !!options.loc,
        range: !!options.range
      });
    }

    // add tokenizer warnings if any
    if (source.warns)
      source.warns.forEach(function(warn){
        addTemplateWarn(result, options, warn[0], warn[1].loc);
      });

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
      result.tokens = [[TYPE_TEXT, 0, 0, '']];

    // store source for debug
    /** @cut */ if (source_)
    /** @cut */   result.tokens.source_ = source_;

    // normalize refs
    addTokenRef(result.tokens[0], 'element');
    normalizeRefs(result.tokens, result.dictURI);

    // deal with defines
    applyDefines(result.tokens, result, options);

    /** @cut */ if (/^[^a-z]/i.test(result.isolate))
    /** @cut */   basis.dev.error('basis.template: isolation prefix `' + result.isolate + '` should not starts with symbol other than letter, otherwise it leads to incorrect css class names and broken styles');

    // top-level declaration
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
      /** @cut */ result.styles = result.resources.slice(0);
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
            cssResource.url = url + '?isolate-prefix=' + isolate;
            cssResource.baseURI = basis.path.dirname(url) + '/';
            sourceResource();
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
    /** @cut */ {
    /** @cut */   var define = result.defines[key];
    /** @cut */   if (!define.used)
    /** @cut */     addTemplateWarn(result, options, 'Unused define: ' + key, define.loc);
    /** @cut */ }

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

  if (source.bindingBridge)
  {
    baseURI = 'baseURI' in source ? source.baseURI : 'url' in source ? basis.path.dirname(source.url) : baseURI;
    sourceUrl = 'url' in source ? source.url : sourceUrl;
    result = source.bindingBridge.get(source);
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

// TODO: remove
resource('../template.js').ready(function(exports){
  resolveResource = exports.resolveResource;
  Template = exports.Template;
});

module.exports = {
  makeDeclaration: makeDeclaration,
  getDeclFromSource: getDeclFromSource
};
