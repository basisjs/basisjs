var arrayAdd = basis.array.add;
var arrayRemove = basis.array.remove;
var consts = require('../const.js');
var utils = require('./utils.js');
var addTokenRef = utils.addTokenRef;
var getTokenName = utils.getTokenName;
var getTokenAttrValues = utils.getTokenAttrValues;
var getTokenAttrs = utils.getTokenAttrs;

var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
var TYPE_ATTRIBUTE_STYLE = consts.TYPE_ATTRIBUTE_STYLE;
var ATTR_NAME = consts.ATTR_NAME;
var ATTR_NAME_BY_TYPE = consts.ATTR_NAME_BY_TYPE;
var ATTR_TYPE_BY_NAME = consts.ATTR_TYPE_BY_NAME;
var ATTR_VALUE_INDEX = consts.ATTR_VALUE_INDEX;
var ATTR_VALUE = consts.ATTR_VALUE;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;

var ATTR_NAME_RX = /^[a-z_][a-z0-9_\-:]*$/i;
var ATTR_EVENT_RX = /^event-(.+)$/;

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

/** @cut */ function getAttributeValueLocationMap(template, token){
/** @cut */   if (!token || !token.map_)
/** @cut */     return null;
/** @cut */
/** @cut */   return token.map_.reduce(function(res, part){
/** @cut */     if (!part.binding)
/** @cut */       res[part.value] = utils.getLocation(template, part.loc);
/** @cut */     return res;
/** @cut */   }, {});
/** @cut */ }

function setStylePropertyBinding(template, options, host, attr, property, showByDefault, defaultValue){
  debugger;
  var styleAttr = getAttrByName(host, 'style');

  if (!styleAttr)
  {
    styleAttr = [TYPE_ATTRIBUTE_STYLE, 0, 0];
    /** @cut */ utils.addTokenLocation(template, options, styleAttr, attr);
    host.push(styleAttr);
  }

  var binding = attr.binding;
  var styleBindings = styleAttr[TOKEN_BINDINGS];
  var addDefault = false;
  var show = attr.name == showByDefault;
  var value = styleAttr[3];

  if (styleBindings)
    arrayRemove(styleBindings, getStyleBindingProperty(styleAttr, property));

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
    binding = binding.concat(property, attr.name);

    addDefault = show;

    if (styleBindings)
      styleBindings.push(binding);
    else
      styleAttr[TOKEN_BINDINGS] = [binding];
  }

  if (value)
    value = value.replace(new RegExp(property + '\\s*:\\s*[^;]+(;|$)'), '');

  if (addDefault)
    value = (value ? value + ' ' : '') + defaultValue;

  styleAttr[3] = value;
}

function applyShowHideAttribute(template, options, host, attr){
  if (attr.name == 'show' || attr.name == 'hide')
    setStylePropertyBinding(template, options, host, attr, 'display', 'show', 'display: none;');

  if (attr.name == 'visible' || attr.name == 'hidden')
    setStylePropertyBinding(template, options, host, attr, 'visibility', 'visible', 'visibility: hidden;');
}

function addRoleAttribute(template, options, host, role/*, sourceToken*/){
  /** @cut */ var sourceToken = arguments[4];

  if (host[TOKEN_TYPE] !== TYPE_ELEMENT)
  {
    /** @cut */ utils.addTemplateWarn(template, options, 'Role can\'t be added to non-element node', sourceToken.loc);
    return;
  }

  if (!/[\/\(\)]/.test(role))
  {
    var item = [
      TYPE_ATTRIBUTE,
      [['$role'], [0, role ? '/' + role : '']],
      0,
      'role-marker'
    ];

    /** @cut */ item.sourceToken = sourceToken;
    /** @cut */ utils.addTokenLocation(template, options, item, sourceToken);

    host.push(item);
  }
  /** @cut */ else
  /** @cut */   utils.addTemplateWarn(template, options, 'Value for role was ignored as value can\'t contains ["/", "(", ")"]: ' + role, sourceToken.loc);
}

function applyAttrs(template, options, host, attrs){
  var displayAttr;
  var visibilityAttr;
  var item;
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
            addTokenRef(host, refs[j]);
          break;

        case 'show':
        case 'hide':
          displayAttr = attr;
          break;

        case 'visible':
        case 'hidden':
          visibilityAttr = attr;
          break;

        case 'role':
          addRoleAttribute(template, options, host, attr.value || '', attr);
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
      if (attr.type == TYPE_ATTRIBUTE)
        item.push(getTokenName(attr));

      // ATTR_VALUE = 4
      if (attr.value && (!options.optimizeSize || !attr.binding || attr.type != TYPE_ATTRIBUTE))
        item.push(attr.value);
    }

    /** @cut */ item.valueLocMap = getAttributeValueLocationMap(template, attr);
    /** @cut */ item.sourceToken = attr;
    /** @cut */ utils.addTokenLocation(template, options, item, attr);

    host.push(item);
  }

  if (displayAttr)
    applyShowHideAttribute(template, options, host, displayAttr);
  if (visibilityAttr)
    applyShowHideAttribute(template, options, host, visibilityAttr);

  return host;
}

function modifyAttr(template, options, include, tokenRefMap, token, name, action){
  var attrs = getTokenAttrValues(token);

  if (name)
    attrs.name = name;

  if (!attrs.name)
  {
    /** @cut */ utils.addTemplateWarn(template, options, 'Instruction <b:' + token.name + '> has no `name` attribute', token.loc);
    return;
  }

  if (!ATTR_NAME_RX.test(attrs.name))
  {
    /** @cut */ utils.addTemplateWarn(template, options, 'Bad attribute name `' + attrs.name + '`', token.loc);
    return;
  }

  // FIXME: tokenRefMap defined for <b:include/> only
  var includedToken = tokenRefMap[attrs.ref || 'element'];
  if (includedToken)
  {
    if (includedToken.token[TOKEN_TYPE] == TYPE_ELEMENT)
    {
      var attrs_ = getTokenAttrs(token);
      var itAttrs = includedToken.token;
      var isEvent = attrs.name.match(ATTR_EVENT_RX);
      var isClassOrStyle = attrs.name == 'class' || attrs.name == 'style';
      var itType = isEvent ? TYPE_ATTRIBUTE_EVENT : ATTR_TYPE_BY_NAME[attrs.name] || TYPE_ATTRIBUTE;
      var valueIdx = ATTR_VALUE_INDEX[itType] || ATTR_VALUE;
      /** @cut */ var valueLocMap = getAttributeValueLocationMap(template, attrs_.value);
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
        // if attribute doesn't exist, it's always a `set` operation
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
        /** @cut */ utils.addTokenLocation(template, options, itAttrToken, token);
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
            /** @cut */       consts.TYPE_ATTRIBUTE_CLASS,
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
      /** @cut */ utils.addTemplateWarn(template, options, 'Attribute modificator is not reference to element token (reference name: ' + (attrs.ref || 'element') + ')', token.loc);
    }
  }
}

module.exports = {
  getAttrByName: getAttrByName,
  applyShowHideAttribute: applyShowHideAttribute,
  addRoleAttribute: addRoleAttribute,
  applyAttrs: applyAttrs,
  modifyAttr: modifyAttr
};
