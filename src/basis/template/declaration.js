
var hasOwnProperty = Object.prototype.hasOwnProperty;
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
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var TEXT_VALUE = consts.TEXT_VALUE;
var CLASS_BINDING_ENUM = consts.CLASS_BINDING_ENUM;
var CLASS_BINDING_BOOL = consts.CLASS_BINDING_BOOL;

var IDENT = /^[a-z_][a-z0-9_\-]*$/i;
var ATTR_EVENT_RX = /^event-(.+)$/;


// TODO: remove
var Template = function(){};
var resolveResource = function(){};


function genIsolateMarker(){
  return basis.genUID() + '__';
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

  function addStyle(template, token, src, isolatePrefix, namespace){
    var text = token.children[0];
    var url = src
      ? basis.resource.resolveURI(src, template.baseURI, '<b:style src=\"{url}\"/>')
      : basis.resource.virtual('css', text ? text.value : '', template.sourceUrl).url;

    /** @cut */ token.sourceUrl = template.sourceUrl;

    template.resources.push([url, isolatePrefix, token, null, src ? false : text || true, namespace]);

    return url;
  }

  /** @cut */ function getLocation(template, loc){
  /** @cut */   if (loc)
  /** @cut */     return (template.sourceUrl || '') + ':' + loc.start.line + ':' + (loc.start.column + 1);
  /** @cut */ }

  /** @cut */ function addTemplateWarn(template, options, message, loc){
  /** @cut */   if (loc && options.loc)
  /** @cut */   {
  /** @cut */     message = Object(message);
  /** @cut */     message.loc = typeof loc == 'string' ? loc : getLocation(template, loc);
  /** @cut */   }
  /** @cut */
  /** @cut */   template.warns.push(message);
  /** @cut */ }

  /** @cut */ function applyTokenLocation(template, options, dest, source){
  /** @cut */   if (options.loc && source && source.loc && !dest.loc)
  /** @cut */     dest.loc = getLocation(template, source.loc);
  /** @cut */ }

  //
  // main function
  //
  function process(tokens, template, options){

    /** @cut */ function addTokenLocation(item, token){
    /** @cut */   applyTokenLocation(template, options, item, token);
    /** @cut */ }

    /** @cut */ function getAttributeValueLocationMap(token){
    /** @cut */   if (!token || !token.map_)
    /** @cut */     return null;
    /** @cut */
    /** @cut */   return token.map_.reduce(function(res, part){
    /** @cut */     if (!part.binding)
    /** @cut */       res[part.value] = getLocation(template, part.loc);
    /** @cut */     return res;
    /** @cut */   }, {});
    /** @cut */ }

    /** @cut */ function addStateInfo(name, type, value){
    /** @cut */   if (!hasOwnProperty.call(template.states, name))
    /** @cut */     template.states[name] = {};
    /** @cut */
    /** @cut */   var info = template.states[name];
    /** @cut */   var isArray = Array.isArray(value);
    /** @cut */
    /** @cut */   if (!hasOwnProperty.call(info, type) || !isArray)
    /** @cut */     info[type] = isArray ? basis.array(value) : value;
    /** @cut */   else
    /** @cut */     addUnique(info[type], value);
    /** @cut */ }

    function parseIncludeOptions(str){
      var result = {};
      var pairs = (str || '').trim().split(/\s*,\s*/);

      for (var i = 0; i < pairs.length; i++)
      {
        var pair = pairs[i].split(/\s*:\s*/);

        if (pair.length != 2)
        {
          // error
          return {};
        }

        result[pair[0]] = pair[1];
      }

      return result;
    }

    function getAttrByName(token, name){
      var offset = typeof token[0] == 'number' ? ELEMENT_ATTRIBUTES_AND_CHILDREN : 0;
      for (var i = offset, attr, attrName; attr = token[i]; i++)
      {
        if (attr[TOKEN_TYPE] == TYPE_ATTRIBUTE_EVENT)
          attrName = 'event-' + attr[1];
        else
          attrName = ATTR_NAME_BY_TYPE[attr[TOKEN_TYPE]] || attr[ATTR_NAME];

        if (attrName == name)
          return attr;
      }
    }

    function getStyleBindingProperty(attr, name){
      var bindings = attr[TOKEN_BINDINGS];

      if (bindings)
        for (var i = 0, binding; binding = bindings[i]; i++)
          if (binding[2] == name)
            return binding;
    }

    function setStylePropertyBinding(host, attr, property, showByDefault, defaultValue){
      var styleAttr = getAttrByName(host, 'style');

      if (!styleAttr)
      {
        styleAttr = [TYPE_ATTRIBUTE_STYLE, 0, 0];
        /** @cut */ addTokenLocation(styleAttr, attr);
        host.push(styleAttr);
      }

      var binding = attr.binding;
      var addDefault = false;
      var show = attr.name == showByDefault;
      var value = styleAttr[3];

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
        var bindings = styleAttr[TOKEN_BINDINGS];
        binding = binding.concat(property, attr.name);

        addDefault = show;

        if (bindings)
        {
          arrayRemove(bindings, getStyleBindingProperty(styleAttr, property));
          bindings.push(binding);
        }
        else
          styleAttr[TOKEN_BINDINGS] = [binding];
      }

      if (value)
        value = value.replace(new RegExp(property + '\\s*:\\s*[^;]+(;|$)'), '');

      if (addDefault)
        value = (value ? value + ' ' : '') + defaultValue;

      styleAttr[3] = value;
    }

    function applyShowHideAttribute(host, attr){
      if (attr.name == 'show' || attr.name == 'hide')
        setStylePropertyBinding(host, attr, 'display', 'show', 'display: none;');

      if (attr.name == 'visible' || attr.name == 'hidden')
        setStylePropertyBinding(host, attr, 'visibility', 'visible', 'visibility: hidden;');
    }

    function processAttrs(token, declToken){
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
            0                       // TOKEN_REFS = 2
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

        /** @cut */ item.valueLocMap = getAttributeValueLocationMap(attr);
        /** @cut */ item.sourceToken = attr;
        /** @cut */ addTokenLocation(item, attr);

        result.push(item);
      }

      if (displayAttr)
        applyShowHideAttribute(result, displayAttr);
      if (visibilityAttr)
        applyShowHideAttribute(result, visibilityAttr);

      return result.length ? result : 0;
    }

    function modifyAttr(include, token, name, action){
      var attrs = tokenAttrs(token);
      var attrs_ = tokenAttrs_(token);

      if (name)
        attrs.name = name;

      if (!attrs.name)
      {
        /** @cut */ addTemplateWarn(template, options, 'Instruction <b:' + token.name + '> has no `name` attribute', token.loc);
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
          var isClassOrStyle = attrs.name == 'class' || attrs.name == 'style';
          var itType = isEvent ? TYPE_ATTRIBUTE_EVENT : ATTR_TYPE_BY_NAME[attrs.name] || TYPE_ATTRIBUTE;
          var valueIdx = ATTR_VALUE_INDEX[itType] || ATTR_VALUE;
          /** @cut */ var valueLocMap = getAttributeValueLocationMap(attrs_.value);
          var itAttrToken = itAttrs && getAttrByName(itAttrs, attrs.name);

          // if set operation and attribute exists than remove it first
          if (itAttrToken && action == 'set')
          {
            /** @cut */ template.removals.push({
            /** @cut */   reason: '<b:' + token.name + '>',
            /** @cut */   removeToken: token,
            /** @cut */   includeToken: include,
            /** @cut */   token: itAttrToken
            /** @cut */ });

            arrayRemove(itAttrs, itAttrToken);
            itAttrToken = null;
          }

          // if set/append operation and no attribute exists than create new one
          if (!itAttrToken && (action == 'set' || action == 'append'))
          {
            // if attribute isn't exist, it's always `set` operation
            action = 'set';

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
            /** @cut */ itAttrToken.valueLocMap = valueLocMap;
            /** @cut */ addTokenLocation(itAttrToken, token);
          }

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
              /** @cut */ itAttrToken.valueLocMap = valueLocMap;

              if (!options.optimizeSize || !itAttrToken[TOKEN_BINDINGS] || isClassOrStyle)
                itAttrToken[valueIdx] = valueAttr.value || '';
              else
                itAttrToken.length = valueIdx;

              // if no bindgings and no value -> remove attribute from element
              if (isClassOrStyle)
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
                        for (var i = 0, newBinding; newBinding = appendBinding[i]; i++)
                        {
                          arrayRemove(attrBindings, getStyleBindingProperty(itAttrToken, newBinding[2]));
                          attrBindings.push(newBinding);
                        }

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
                    if (!isClassOrStyle)
                      itAttrToken[TOKEN_BINDINGS][1].unshift(itAttrToken[valueIdx]);
                  }
                }
                else
                {
                  if (!isClassOrStyle && itAttrToken[TOKEN_BINDINGS])
                    itAttrToken[TOKEN_BINDINGS][1].push(attrs.value);
                }
              }

              if (appendValue)
              {
                if (isEvent || attrs.name == 'class')
                {
                  var parts = (itAttrToken[valueIdx] || '').trim();
                  var appendParts = appendValue.trim();

                  parts = parts ? parts.split(/\s+/) : [];
                  appendParts = appendParts ? appendParts.split(/\s+/) : [];

                  for (var i = 0; i < appendParts.length; i++)
                  {
                    var part = appendParts[i];
                    basis.array.remove(parts, part); // TODO: add to removals?
                    parts.push(part);
                  }

                  itAttrToken[valueIdx] = parts.join(' ');
                }
                else
                {
                  itAttrToken[valueIdx] =
                    (itAttrToken[valueIdx] || '') +
                    (itAttrToken[valueIdx] && isClassOrStyle ? ' ' : '') +
                    appendValue;
                }

                /** @cut */ if (valueLocMap)
                /** @cut */ {
                /** @cut */   if (itAttrToken.valueLocMap)
                /** @cut */     for (var name in valueLocMap)
                /** @cut */       itAttrToken.valueLocMap[name] = valueLocMap[name];
                /** @cut */   else
                /** @cut */     itAttrToken.valueLocMap = valueLocMap;
                /** @cut */ }
              }

              if (isClassOrStyle && !itAttrToken[TOKEN_BINDINGS] && !itAttrToken[valueIdx])
                arrayRemove(itAttrs, itAttrToken);

              break;

            case 'remove-class':
              if (itAttrToken)
              {
                var valueAttr = attrs_.value || {};
                var values = (itAttrToken[valueIdx] || '').split(' ');
                var removeValues = (valueAttr.value || '').split(' ');
                var bindings = itAttrToken[TOKEN_BINDINGS];
                /** @cut */ var removedValues = [];
                /** @cut */ var removedBindings = 0;

                if (valueAttr.binding && bindings)
                {
                  for (var i = 0, removeBinding; removeBinding = valueAttr.binding[i]; i++)
                    for (var j = bindings.length - 1, classBinding; classBinding = bindings[j]; j--)
                    {
                      // removeBinding
                      //      -> [prefix, name]
                      // classBinding
                      //      -> [prefix, bindingName, type, name, defaultValue, values]
                      //   or -> [prefix, name, -1]
                      var prefix = classBinding[0];
                      var bindingName = classBinding[3] || classBinding[1];

                      if (prefix === removeBinding[0] && bindingName === removeBinding[1])
                      {
                        bindings.splice(j, 1);

                        /** @cut */ if (!removedBindings)
                        /** @cut */   removedBindings = [classBinding];
                        /** @cut */ else
                        /** @cut */   removedBindings.push(classBinding);
                      }
                    }

                  if (!bindings.length)
                    itAttrToken[TOKEN_BINDINGS] = 0;
                }

                for (var i = 0; i < removeValues.length; i++)
                {
                  /** @cut */ if (values.indexOf(removeValues[i]) != -1)
                  /** @cut */   removedValues.push(removeValues[i]);

                  arrayRemove(values, removeValues[i]);

                  /** @cut */ if (itAttrToken.valueLocMap)
                  /** @cut */   delete itAttrToken.valueLocMap[removeValues[i]];
                }

                itAttrToken[valueIdx] = values.join(' ');

                if (!bindings.length && !values.length)
                  arrayRemove(itAttrs, itAttrToken);

                /** @cut */ if (removedValues.length || removedBindings.length)
                /** @cut */   template.removals.push({
                /** @cut */     reason: '<b:' + token.name + '>',
                /** @cut */     removeToken: token,
                /** @cut */     includeToken: include,
                /** @cut */     token: [
                /** @cut */       TYPE_ATTRIBUTE_CLASS,
                /** @cut */       removedBindings,
                /** @cut */       0,
                /** @cut */       removedValues.join(' ')
                /** @cut */     ]
                /** @cut */   });
              }
              break;

            case 'remove':
              if (itAttrToken)
              {
                arrayRemove(itAttrs, itAttrToken);

                /** @cut */ template.removals.push({
                /** @cut */   reason: '<b:' + token.name + '>',
                /** @cut */   removeToken: token,
                /** @cut */   includeToken: include,
                /** @cut */   token: itAttrToken
                /** @cut */ });
              }

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
                var useStyle = true;

                if (elAttrs.options)
                {
                  var filterOptions = parseIncludeOptions(elAttrs.options);
                  for (var name in filterOptions)
                    useStyle = useStyle && filterOptions[name] == options.includeOptions[name];
                }

                if (useStyle)
                {
                  var namespaceAttrName = elAttrs.namespace ? 'namespace' : 'ns';
                  var styleNamespace = elAttrs[namespaceAttrName];
                  var styleIsolate = styleNamespace ? styleNamespaceIsolate : '';
                  var src = addStyle(template, token, elAttrs.src, styleIsolate, styleNamespace);

                  if (styleNamespace)
                  {
                    if (src in styleNamespaceIsolate == false)
                      styleNamespaceIsolate[src] = genIsolateMarker();

                    template.styleNSPrefix[styleNamespace] = {
                      /** @cut */ loc: getLocation(template, elAttrs_[namespaceAttrName].loc),
                      /** @cut */ used: false,
                      name: styleNamespace,
                      prefix: styleNamespaceIsolate[src]
                    };
                  }
                }
                /** @cut */ else
                /** @cut */ {
                /** @cut */   token.sourceUrl = template.sourceUrl;
                /** @cut */   template.resources.push([null, styleIsolate, token, null, elAttrs.src ? false : token.children[0] || true, styleNamespace]);
                /** @cut */ }
              break;

              case 'isolate':
                if (!template.isolate)
                  template.isolate = elAttrs.prefix || options.isolate || genIsolateMarker();

                /** @cut */ else
                /** @cut */   addTemplateWarn(template, options, '<b:isolate> is already set to `' + template.isolate + '`', token.loc);
              break;

              case 'l10n':
                if (elAttrs.src)
                  options.dictURI = basis.resource.resolveURI(elAttrs.src, template.baseURI, '<b:' + token.name + ' src=\"{url}\"/>');
              break;

              case 'define':
                /** @cut */ if ('name' in elAttrs == false)
                /** @cut */   addTemplateWarn(template, options, '<b:define> has no `name` attribute', token.loc);
                /** @cut */ if ('type' in elAttrs == false)
                /** @cut */   addTemplateWarn(template, options, '<b:define> has no `type` attribute', token.loc);
                /** @cut */ if (hasOwnProperty.call(options.defines, elAttrs.name))
                /** @cut */   addTemplateWarn(template, options, '<b:define> for `' + elAttrs.name + '` has already defined', token.loc);

                if ('name' in elAttrs && 'type' in elAttrs && !hasOwnProperty.call(options.defines, elAttrs.name))
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

                      /** @cut */ addStateInfo(bindingName, 'bool', true);

                      break;

                    case 'enum':
                      if ('values' in elAttrs == false)
                      {
                        /** @cut */ addTemplateWarn(template, options, 'Enum <b:define> has no `values` attribute', token.loc);
                        break;
                      }

                      values = (elAttrs.values || '').trim();

                      if (!values)
                      {
                        /** @cut */ addTemplateWarn(template, options, 'Enum <b:define> has no variants (`values` attribute is empty)', elAttrs_.values && elAttrs_.values.loc);
                        break;
                      }

                      values = values.split(/\s+/);
                      defaultIndex = values.indexOf(elAttrs['default']);

                      /** @cut */ if ('default' in elAttrs && defaultIndex == -1)
                      /** @cut */   addTemplateWarn(template, options, 'Enum <b:define> has bad value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

                      define = [
                        bindingName,
                        CLASS_BINDING_ENUM,
                        defineName,
                        defaultIndex + 1,
                        values
                      ];

                      /** @cut */ addStateInfo(bindingName, 'enum', values);

                      break;

                    /** @cut */ default:
                    /** @cut */   addTemplateWarn(template, options, 'Bad type in <b:define> for `' + defineName + '`: ' + elAttrs.type, elAttrs_.type && elAttrs_.type.valueLoc);
                  }

                  if (define)
                  {
                    /** @cut */ addTokenLocation(define, token);
                    options.defines[defineName] = define;
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
                    var includeOptions = elAttrs.options ? parseIncludeOptions(elAttrs.options) : null;
                    var declarationOptions = basis.object.merge(options, {
                      includeOptions: includeOptions
                    });
                    var decl = getDeclFromSource(resource, '', true, declarationOptions);

                    arrayAdd(template.deps, resource);
                    template.includes.push({
                      token: token,
                      resource: resource,
                      nested: decl.includes
                    });

                    if (decl.deps)
                      addUnique(template.deps, decl.deps);

                    if (decl.warns)
                      template.warns.push.apply(template.warns, decl.warns);

                    /** @cut */ if (decl.removals)
                    /** @cut */   template.removals.push.apply(template.removals, decl.removals);

                    if (decl.resources && 'no-style' in elAttrs == false)
                      importStyles(template.resources, decl.resources, isolatePrefix, token);

                    var instructions = basis.array(token.children);
                    var styleNSIsolate = {
                      /** @cut */ map: options.styleNSIsolateMap,
                      prefix: genIsolateMarker()
                    };
                    var tokenRefMap = normalizeRefs(decl.tokens, styleNSIsolate);

                    for (var key in decl.styleNSPrefix)
                      template.styleNSPrefix[styleNSIsolate.prefix + key] = basis.object.merge(decl.styleNSPrefix[key], {
                        /** @cut */ used: hasOwnProperty.call(options.styleNSIsolateMap, styleNSIsolate.prefix + key)
                      });

                    // isolate
                    if (isolatePrefix)
                    {
                      isolateTokens(decl.tokens, isolatePrefix);

                      /** @cut */ if (decl.removals)
                      /** @cut */   decl.removals.forEach(function(item){
                      /** @cut */     isolateTokens([item.token], isolatePrefix);
                      /** @cut */   });
                    }

                    for (var includeAttrName in elAttrs_)
                      switch (includeAttrName)
                      {
                        case 'class':
                          // <b:include class=".."> -> <b:append-class value="..">
                          instructions.unshift({
                            type: TYPE_ELEMENT,
                            prefix: 'b',
                            name: 'append-class',
                            attrs: [
                              basis.object.complete({
                                name: 'value'
                              }, elAttrs_['class'])
                            ]
                          });
                          break;

                        case 'id':
                          // <b:include id=".."> -> <b:set-attr name="id" value="..">
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
                              basis.object.complete({
                                name: 'value'
                              }, elAttrs_.id)
                            ]
                          });
                          break;

                        case 'ref':
                          // <b:include ref="..">
                          if (tokenRefMap.element)
                            elAttrs.ref.trim().split(/\s+/).map(function(refName){
                              addTokenRef(tokenRefMap.element.token, refName);
                            });
                          break;

                        case 'show':
                        case 'hide':
                        case 'visible':
                        case 'hidden':
                          var tokenRef = tokenRefMap.element;
                          var token = tokenRef && tokenRef.token;

                          if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
                            applyShowHideAttribute(token, elAttrs_[includeAttrName]);
                          break;
                      }

                    for (var j = 0, child; child = instructions[j]; j++)
                    {
                      // process special elements (basis namespace)
                      if (child.type == TYPE_ELEMENT && child.prefix == 'b')
                      {
                        switch (child.name)
                        {
                          case 'style':
                            var childAttrs = tokenAttrs(child);
                            var childAttrs_ = tokenAttrs_(child);
                            var useStyle = true;

                            if (childAttrs.options)
                            {
                              var filterOptions = parseIncludeOptions(childAttrs.options);
                              for (var name in filterOptions)
                                useStyle = useStyle && filterOptions[name] == includeOptions[name];
                            }

                            if (useStyle)
                            {
                              var namespaceAttrName = childAttrs.namespace ? 'namespace' : 'ns';
                              var styleNamespace = childAttrs[namespaceAttrName];
                              var styleIsolate = styleNamespace ? styleNamespaceIsolate : isolatePrefix;
                              var src = addStyle(template, child, childAttrs.src, styleIsolate, styleNamespace);

                              if (styleNamespace)
                              {
                                if (src in styleNamespaceIsolate == false)
                                  styleNamespaceIsolate[src] = genIsolateMarker();

                                template.styleNSPrefix[styleNSIsolate.prefix + styleNamespace] = {
                                  /** @cut */ loc: getLocation(template, childAttrs_[namespaceAttrName].loc),
                                  /** @cut */ used: false,
                                  name: styleNamespace,
                                  prefix: styleNamespaceIsolate[src]
                                };
                              }
                            }
                            /** @cut */ else
                            /** @cut */ {
                            /** @cut */   child.sourceUrl = template.sourceUrl;
                            /** @cut */   template.resources.push([null, styleIsolate, child, token, childAttrs.src ? false : child.children[0] || true, styleNamespace]);
                            /** @cut */ }
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
                              var parent = tokenRef.owner;
                              var pos = parent.indexOf(tokenRef.token);
                              if (pos != -1)
                              {
                                var args = [pos + (child.name == 'after'), replaceOrRemove];

                                if (child.name != 'remove')
                                  args = args.concat(process(child.children, template, options) || []);

                                parent.splice.apply(parent, args);

                                /** @cut */ if (replaceOrRemove)
                                /** @cut */   template.removals.push({
                                /** @cut */     reason: '<b:' + child.name + '>',
                                /** @cut */     removeToken: child,
                                /** @cut */     includeToken: token,
                                /** @cut */     token: tokenRef.token
                                /** @cut */   });
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
                                token.splice.apply(token, [ELEMENT_ATTRIBUTES_AND_CHILDREN, 0].concat(children));
                              else
                                token.push.apply(token, children);
                            }
                            break;

                          case 'show':
                          case 'hide':
                          case 'visible':
                          case 'hidden':
                            var childAttrs = tokenAttrs(child);
                            var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];
                            var token = tokenRef && tokenRef.token;

                            if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
                            {
                              var expr = tokenAttrs_(child).expr;

                              if (!expr)
                              {
                                /** @cut */ addTemplateWarn(template, options, 'Instruction <b:' + child.name + '> has no `expr` attribute', child.loc);
                                break;
                              }

                              applyShowHideAttribute(token, basis.object.complete({
                                name: child.name,
                              }, tokenAttrs_(child).expr));
                            }

                            break;

                          case 'attr':
                          case 'set-attr':
                            modifyAttr(token, child, false, 'set');
                            break;

                          case 'append-attr':
                            modifyAttr(token, child, false, 'append');
                            break;

                          case 'remove-attr':
                            modifyAttr(token, child, false, 'remove');
                            break;

                          case 'class':
                          case 'append-class':
                            modifyAttr(token, child, 'class', 'append');
                            break;

                          case 'set-class':
                            modifyAttr(token, child, 'class', 'set');
                            break;

                          case 'remove-class':
                            var childAttrs_ = tokenAttrs_(child);
                            var valueAttr = childAttrs_.value;

                            // apply namespace prefix for values
                            if (valueAttr)
                            {
                              valueAttr.value = valueAttr.value
                                .split(/\s+/)
                                .map(function(name){
                                  return name.indexOf(':') > 0 ? styleNSIsolate.prefix + name : name;
                                })
                                .join(' ');

                              if (valueAttr.binding)
                                valueAttr.binding.forEach(function(bind){
                                  if (bind[0].indexOf(':') > 0)
                                    bind[0] = styleNSIsolate.prefix + bind[0];
                                });

                              // probably should be removed, as map_ is not used
                              if (valueAttr.map_)
                                valueAttr.map_.forEach(function(item){
                                  if (item.value.indexOf(':') > 0)
                                    item.value = styleNSIsolate.prefix + item.value;
                                });
                            }

                            modifyAttr(token, child, 'class', 'remove-class');
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
                            /** @cut */ addTemplateWarn(template, options, 'Unknown instruction tag: <b:' + child.name + '>', child.loc);
                        }
                      }
                      else
                      {
                        decl.tokens.push.apply(decl.tokens, process([child], template, options) || []);
                      }
                    }

                    if (tokenRefMap.element)
                      removeTokenRef(tokenRefMap.element.token, 'element');

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

              default:
                /** @cut */ addTemplateWarn(template, options, 'Unknown instruction tag: <b:' + token.name + '>', token.loc);
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
          item.push.apply(item, processAttrs(token, item, options.optimizeSize) || []);
          item.push.apply(item, process(token.children, template, options) || []);

          /** @cut */ addTokenLocation(item, token);
          /** @cut */ item.sourceToken = token;

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
          /** @cut */ item.sourceToken = token;

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
          /** @cut */ item.sourceToken = token;

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
      var key = parts[1];

      if (parts[0] == 'l10n')
      {
        if (parts.length == 2 && key.indexOf('@') == -1)
        {
          if (!dictURI)
            return false;  // TODO: add warning that dictionary is not found

          key = key + '@' + dictURI;
          value = 'l10n:' + key;
        }
        arrayAdd(l10nMap, key);
      }
    }

    return value;
  }

  function normalizeRefs(tokens, isolate, map, stIdx){
    function processName(name){
      // add prefix only for `ns:name` and ignore global namespace `:name`
      if (name.indexOf(':') <= 0)
        return name;

      var prefix = name.split(':')[0];
      isolate.map[isolate.prefix + prefix] = prefix;

      return isolate.prefix + name;
    }

    if (!map)
      map = {};

    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];
      var refs = token[TOKEN_REFS];

      if (isolate && tokenType == TYPE_ATTRIBUTE_CLASS)
      {
        var bindings = token[TOKEN_BINDINGS];
        var valueIndex = ATTR_VALUE_INDEX[tokenType];

        if (token[valueIndex])
          token[valueIndex] = token[valueIndex]
            .split(/\s+/)
            .map(processName)
            .join(' ');

        /** @cut */ if (token.valueLocMap)
        /** @cut */ {
        /** @cut */   var oldValueLocMap = token.valueLocMap;
        /** @cut */   token.valueLocMap = {};
        /** @cut */   for (var name in oldValueLocMap)
        /** @cut */     token.valueLocMap[processName(name)] = oldValueLocMap[name];
        /** @cut */ }

        if (bindings)
          for (var k = 0, bind; bind = bindings[k]; k++)
            bind[0] = processName(bind[0]);
      }

      if (tokenType != TYPE_ATTRIBUTE_EVENT && refs)
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
        normalizeRefs(token, isolate, map, ELEMENT_ATTRIBUTES_AND_CHILDREN);
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
          applyDefines(token, template, options, ELEMENT_ATTRIBUTES_AND_CHILDREN);
          break;

        case TYPE_TEXT:
          if (bindings)
          {
            var binding = absl10n(bindings, options.dictURI, template.l10n);
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
              var binding = absl10n(array[j], options.dictURI, template.l10n);   // TODO: move l10n binding process in separate function
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

              if (hasOwnProperty.call(options.defines, bindName))
              {
                var define = options.defines[bindName];
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

  function isolateTokens(tokens, isolate, template, options, stIdx){
    function processName(name){
      if (name.indexOf(':') == -1)
        return isolate + name;

      // don't resolve namespaced names if not template isolate mode
      if (!template)
        return name;

      var parts = name.split(':');

      // global namespace
      if (!parts[0])
        return parts[1];

      var namespace = hasOwnProperty.call(template.styleNSPrefix, parts[0]) ? template.styleNSPrefix[parts[0]] : false;

      // if namespace not found, no prefix and show warning
      if (!namespace)
      {
        /** @cut */ var isolatedPrefix = options.styleNSIsolateMap[parts[0]];
        /** @cut */ var oldPrefix = parts[0];
        /** @cut */ var fullName = arguments[1];
        /** @cut */ var loc = arguments[2];
        /** @cut */ if (fullName)
        /** @cut */ {
        /** @cut */   if (isolatedPrefix)
        /** @cut */     fullName = fullName.replace(oldPrefix, isolatedPrefix);
        /** @cut */   addTemplateWarn(template, options, 'Namespace `' + (isolatedPrefix || oldPrefix) + '` is not defined: ' + fullName, loc);
        /** @cut */ }
        return false;
      }
      else
      {
        /** @cut */ namespace.used = true;
        return namespace.prefix + parts[1];
      }
    }

    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];

      if (tokenType == TYPE_ELEMENT)
        isolateTokens(token, isolate, template, options, ELEMENT_ATTRIBUTES_AND_CHILDREN);

      if (tokenType == TYPE_ATTRIBUTE_CLASS)
      {
        var bindings = token[TOKEN_BINDINGS];
        var valueIndex = ATTR_VALUE_INDEX[tokenType];

        if (token[valueIndex])
          token[valueIndex] = token[valueIndex]
            .split(/\s+/)
            .map(function(name){
              return processName(name, name, token.valueLocMap ? token.valueLocMap[name] : null);
            })
            .filter(Boolean)
            .join(' ');

        if (bindings)
        {
          for (var j = 0, bind, prefix, removed; bind = bindings[j]; j++)
          {
            prefix = processName(bind[0], bind[0] + '{' + bind[1] + '}', bind.loc);

            if (prefix === false)
            {
              // prefix is false for non-resolved namespaced prefixes -> remove binding
              removed = true;
              bindings[j] = null;
            }
            else
              bind[0] = prefix;
          }

          if (removed)
          {
            bindings = bindings.filter(Boolean);
            token[TOKEN_BINDINGS] = bindings.length ? bindings : 0;
          }
        }

        /** @cut */ if (token.valueLocMap)
        /** @cut */ {
        /** @cut */   var oldValueLocMap = token.valueLocMap;
        /** @cut */   token.valueLocMap = {};
        /** @cut */   for (var name in oldValueLocMap)
        /** @cut */   {
        /** @cut */     var newKey = processName(name);
        /** @cut */     if (newKey)
        /** @cut */       token.valueLocMap[newKey] = oldValueLocMap[name];
        /** @cut */   }
        /** @cut */ }
      }
    }
  }

  function styleHash(style){
    return style[0] + '|' + style[1];
  }

  return function makeDeclaration(source, baseURI, options, sourceUrl, sourceOrigin){
    var warns = [];
    /** @cut */ var source_;

    // make copy of options (as modify it) and normalize
    options = basis.object.slice(options);
    options.includeOptions = options.includeOptions || {};
    options.defines = {};
    options.dictURI = sourceUrl  // resolve l10n dictionary url
      ? basis.path.resolve(sourceUrl)
      : baseURI || '';
    /** @cut */ options.styleNSIsolateMap = {};
    // force fetch locations and ranges in dev mode for debug and build purposes
    /** @cut */ options.loc = true;
    /** @cut */ options.range = true;

    // result object
    var result = {
      sourceUrl: sourceUrl,
      baseURI: baseURI || '',

      tokens: null,
      includes: [],
      deps: [],

      isolate: false,
      styleNSPrefix: {},  // TODO: investigate, could we remove this from declaration?
      resources: [],      // probably we should use `styles` instead of `resources`

      l10n: [],

      warns: warns
    };

    /** @cut */ result.removals = [];
    /** @cut */ result.states = {};

    // normalize dictionary ext name
    if (options.dictURI)
    {
      var extname = basis.path.extname(options.dictURI);
      if (extname && extname != '.l10n')
        options.dictURI = options.dictURI.substr(0, options.dictURI.length - extname.length) + '.l10n';
    }

    // tokenize source if needed
    if (!source.templateTokens)
    {
      /** @cut */ source_ = source;
      source = tokenize(String(source), {
        loc: !!options.loc,
        range: !!options.range
      });
    }

    // copy tokenizer warnings to template if any
    /** @cut */ if (source.warns)
    /** @cut */   source.warns.forEach(function(warn){
    /** @cut */     addTemplateWarn(result, options, warn[0], warn[1].loc);
    /** @cut */   });

    // start prevent recursion
    includeStack.push((sourceOrigin !== true && sourceOrigin) || {}); // basisjs-tools pass true

    // main task
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
    normalizeRefs(result.tokens);

    // deal with defines
    applyDefines(result.tokens, result, options);

    /** @cut */ if (/^[^a-z]/i.test(result.isolate))
    /** @cut */   basis.dev.error('basis.template: isolation prefix `' + result.isolate + '` should not starts with symbol other than letter, otherwise it leads to incorrect css class names and broken styles');

    // top-level declaration
    if (includeStack.length == 0)
    {
      // isolate tokens
      isolateTokens(result.tokens, result.isolate || '', result, options);

      /** @cut */ result.warns = [];
      /** @cut */ if (result.removals)
      /** @cut */   result.removals.forEach(function(item){
      /** @cut */     isolateTokens([item.token], result.isolate || '', result, options);
      /** @cut */   });
      /** @cut */ result.warns = warns;


      // check for unused namespaces
      /** @cut */ for (var key in result.styleNSPrefix)
      /** @cut */ {
      /** @cut */   var styleNSPrefix = result.styleNSPrefix[key];
      /** @cut */   if (!styleNSPrefix.used)
      /** @cut */     addTemplateWarn(result, options, 'Unused namespace: ' + styleNSPrefix.name, styleNSPrefix.loc);
      /** @cut */ }

      // resolve style prefix
      if (result.isolate)
        for (var i = 0, item; item = result.resources[i]; i++)
          if (item[1] !== styleNamespaceIsolate)  // ignore namespaced styles
            item[1] = result.isolate + item[1];

      // save all styles for debug purposes as it will be filtered
      /** @cut */ var styles = result.resources;

      // map and isolate styles
      result.resources = result.resources
        // remove duplicates
        .filter(function(item, idx, array){
          return item[0] && !basis.array.search(array, styleHash(item), styleHash, idx + 1);
        })
        .map(function(item){
          var url = item[0];
          var isolate = item[1];
          var namespaceIsolate = isolate === styleNamespaceIsolate;
          var cssMap;

          // resolve namespaced style
          if (namespaceIsolate)
          {
            isolate = styleNamespaceIsolate[url];
            if (url in styleNamespaceResource)
            {
              /** @cut */ item.url = styleNamespaceResource[url].url;
              return styleNamespaceResource[url].url;
            }
          }

          // if no isolate prefix -> nothing todo
          if (!isolate)
          {
            /** @cut */ item.url = url;
            return url;
          }

          // otherwise create virtual resource with prefixed classes in selectors
          var resource = basis.resource.virtual('css', '').ready(function(cssResource){
            cssResource.url = url + '?isolate-prefix=' + isolate;
            cssResource.baseURI = basis.path.dirname(url) + '/';
            cssResource.map = cssMap;
            sourceResource();
          });

          var sourceResource = basis.resource(url).ready(function(cssResource){
            var isolated = isolateCss(cssResource.cssText || '', isolate, true);

            /** @cut */ if (typeof global.btoa == 'function')
            /** @cut */   isolated.css += '\n/*# sourceMappingURL=data:application/json;base64,' +
            /** @cut */     global.btoa('{"version":3,"sources":["' + basis.path.origin + url + '"],' +
            /** @cut */     '"mappings":"AAAA' + basis.string.repeat(';AACA', isolated.css.split('\n').length) +
            /** @cut */     '"}') + ' */';

            cssMap = isolated.map;
            resource.update(isolated.css);
          });

          if (namespaceIsolate)
            styleNamespaceResource[url] = resource;

          /** @cut */ item.url = resource.url;
          return resource.url;
        });

      // process styles list
      /** @cut */ result.styles = styles.map(function(item, idx){
      /** @cut */   var sourceUrl = item[0] || tokenAttrs(item[2]).src;
      /** @cut */   return {
      /** @cut */     resource: item.url || false,
      /** @cut */     sourceUrl: basis.resource.resolveURI(sourceUrl),
      /** @cut */     isolate: item[1] === styleNamespaceIsolate ? styleNamespaceIsolate[item[0]] : item[1] || false,
      /** @cut */     namespace: item[5] || false,
      /** @cut */     inline: item[4],
      /** @cut */     styleToken: item[2],
      /** @cut */     includeToken: item[3]
      /** @cut */   };
      /** @cut */ });
    }

    /** @cut */ for (var key in options.defines)
    /** @cut */ {
    /** @cut */   var define = options.defines[key];
    /** @cut */   if (!define.used)
    /** @cut */     addTemplateWarn(result, options, 'Unused define: ' + key, define.loc);
    /** @cut */ }

    if (!warns.length)
      result.warns = false;

    // for backward capability with basisjs-tools
    // l10nTokens was implemented and renamed to l10n during 1.4 developing
    // TODO: remove before 1.4 release
    /** @cut */ result.l10nTokens = result.l10n;

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
  VERSION: 3,
  makeDeclaration: makeDeclaration,
  getDeclFromSource: getDeclFromSource
};
