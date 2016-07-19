
 /**
  * @namespace basis.template.htmlfgen
  */

  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var consts = require('basis.template.const');
  var namespaces = require('basis.template.namespace');

  var MARKER = consts.MARKER;

  var TYPE_ELEMENT = consts.TYPE_ELEMENT;
  var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
  var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
  var TYPE_ATTRIBUTE_STYLE = consts.TYPE_ATTRIBUTE_STYLE;
  var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
  var TYPE_TEXT = consts.TYPE_TEXT;
  var TYPE_COMMENT = consts.TYPE_COMMENT;
  var TYPE_CONTENT = consts.TYPE_CONTENT;

  var TOKEN_TYPE = consts.TOKEN_TYPE;
  var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
  var TOKEN_REFS = consts.TOKEN_REFS;

  var ATTR_NAME = consts.ATTR_NAME;
  var ATTR_NAME_BY_TYPE = consts.ATTR_NAME_BY_TYPE;

  var ELEMENT_NAME = consts.ELEMENT_NAME;
  var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
  var CONTENT_CHILDREN = consts.CONTENT_CHILDREN;

  var CLASS_BINDING_ENUM = consts.CLASS_BINDING_ENUM;
  var CLASS_BINDING_BOOL = consts.CLASS_BINDING_BOOL;
  var CLASS_BINDING_INVERT = consts.CLASS_BINDING_INVERT;


  //
  // main part
  //

  /** @cut */ var inlineSeed = 1;
  var tmplFunctions = {}; // precompiled functions
  var SET_NONELEMENT_PROPERTY_SUPPORT = (function(){
    try {
      global.document.createTextNode('').x = 1;
      return true;
    } catch(e) {
      return false;
    }
  })();

  function cleanSpecial(tokens, offset){
    var result = [];

    for (var i = 0; i < tokens.length; i++)
    {
      if (i < offset) {
        result.push(tokens[i]);
        continue;
      }

      var token = tokens[i];
      switch (token[TOKEN_TYPE])
      {
        case TYPE_ELEMENT:
          result.push(cleanSpecial(token, ELEMENT_ATTRIBUTES_AND_CHILDREN));
          break;

        case TYPE_CONTENT:
          result.push.apply(result, cleanSpecial(token, CONTENT_CHILDREN).slice(CONTENT_CHILDREN));
          break;

        default:
          result.push(token);
      }
    }

    return result;
  }


 /**
  * build path references to dom nodes in template
  */
  var buildPathes = (function(){
    var PATH_REF_NAME = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    var pathList;
    var refList;
    var bindingList;
    var markedElementList;
    var rootPath;
    var attrExprId;

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

    function processTokens(tokens, path, noTextBug){
      var localPath;
      var refs;
      var myRef;
      var explicitRef;
      var bindings;

      for (var i = 0, cp = 0, closeText = 0, token; token = tokens[i]; i++, cp++, explicitRef = false)
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
            if (token[TOKEN_TYPE] == tokens[i - 1][TOKEN_TYPE] && token[TOKEN_TYPE] == TYPE_TEXT)
              closeText++;

            localPath = path + '.childNodes[' + (noTextBug ? cp : cp + (closeText ? ' + ' + closeText + ' * TEXT_BUG' : '')) + ']';
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
          if (token[TOKEN_BINDINGS] && typeof token[TOKEN_BINDINGS] == 'number')
            token[TOKEN_BINDINGS] = token[TOKEN_REFS][token[TOKEN_BINDINGS] - 1];

          if (!explicitRef)
          {
            explicitRef = true;
            localPath = putPath(localPath);
          }

          putBinding([token[TOKEN_TYPE], localPath, token[TOKEN_BINDINGS],
            refs ? refs.indexOf('element') != -1 : false // prohibit node binding
          ]);
        }

        if (path == rootPath && (SET_NONELEMENT_PROPERTY_SUPPORT || token[TOKEN_TYPE] == TYPE_ELEMENT))
          markedElementList.push(localPath + '.' + MARKER);

        if (token[TOKEN_TYPE] == TYPE_ELEMENT)
        {
          myRef = -1;

          if (!explicitRef)
          {
            localPath = putPath(localPath);
            myRef = pathList.length;
          }

          // TODO: temporary solution, rewrite function
          var attrs = [];
          var children = [];
          for (var j = ELEMENT_ATTRIBUTES_AND_CHILDREN, t; t = token[j]; j++)
            if (t[TOKEN_TYPE] == TYPE_ELEMENT || t[TOKEN_TYPE] == TYPE_TEXT || t[TOKEN_TYPE] == TYPE_COMMENT)
              children.push(t);
            else
              attrs.push(t);

          for (var j = 0, attr; attr = attrs[j]; j++)
          {
            var attrTokenType = attr[TOKEN_TYPE];

            if (attrTokenType == TYPE_ATTRIBUTE_EVENT)
              continue;

            var attrName = ATTR_NAME_BY_TYPE[attrTokenType] || attr[ATTR_NAME];

            if (refs = attr[TOKEN_REFS])
            {
              explicitRef = true;
              putRefs(refs, putPath(localPath + '.getAttributeNode("' + attrName + '")'));
            }

            if (bindings = attr[TOKEN_BINDINGS])
            {
              explicitRef = true;

              switch (attrTokenType)
              {
                case TYPE_ATTRIBUTE_CLASS:
                  for (var k = 0, binding; binding = bindings[k]; k++)
                    putBinding([2, localPath, binding[1], attrName, binding[0]].concat(binding[2] == -1 ? [] : binding.slice(2)));
                break;

                case TYPE_ATTRIBUTE_STYLE:
                  for (var k = 0, property; property = bindings[k]; k++)
                  {
                    attrExprId++;
                    for (var m = 0, bindName; bindName = property[0][m]; m++)
                      putBinding([2, localPath, bindName, attrName, property[0], property[1], property[2], property[3], attrExprId]);
                  }
                break;

                default:
                  attrExprId++;
                  for (var k = 0, bindName; bindName = bindings[0][k]; k++)
                    putBinding([2, localPath, bindName, attrName, bindings[0], bindings[1], token[ELEMENT_NAME], attrExprId]);
              }
            }
          }

          if (children.length)
            processTokens(children, localPath, noTextBug);

          if (!explicitRef && myRef == pathList.length)
            pathList.pop();
        }
      }
    }

    return function(tokens, path, noTextBug){
      pathList = [];
      refList = [];
      bindingList = [];
      markedElementList = [];
      rootPath = path || '_';
      attrExprId = 0;

      processTokens(tokens, rootPath, noTextBug);

      return {
        path: pathList,
        ref: refList,
        binding: bindingList,
        markedElementList: markedElementList
      };
    };
  })();


 /**
  * build template bindings code
  */
  var buildBindings = (function(){
    var L10N_BINDING = /\.\{([a-zA-Z_][a-zA-Z0-9_\-]*)\}/;

    var SPECIAL_ATTR_MAP = {
      disabled: '*',  // any tag
      checked: ['input'],
      indeterminate: ['input'],
      value: ['input', 'textarea', 'select'],
      minlength: ['input'],
      maxlength: ['input'],
      readonly: ['input'],
      selected: ['option'],
      multiple: ['select']
    };

    var SPECIAL_ATTR_SINGLE = {
      disabled: true,
      checked: true,
      selected: true,
      readonly: true,
      multiple: true,
      indeterminate: true
    };

    var STYLE_EXPR_VALUE = {
      'show': '"none"',
      'visible': '"hidden"'
    };
    var STYLE_EXPR_TOGGLE = {
      'hide': '?"none":""',
      'show': '?"":"none"',
      'hidden': '?"hidden":""',
      'visible': '?"":"hidden"'
    };

    var bindFunctions = {
      1: 'bind_element',
      3: 'bind_textNode',
      8: 'bind_comment'
    };

    function quoteString(value){
      return '"' + value
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r') + '"';
    }

    /** @cut */ function simpleStringify(val){
    /** @cut */   return typeof val == 'string' ? quoteString(val) : val;
    /** @cut */ }

    /** @cut */ function stringifyBindingNames(val){
    /** @cut */   if (val.indexOf('l10n:') == 0)
    /** @cut */     val = this[val.substr(5)] || val;
    /** @cut */   return quoteString(val);
    /** @cut */ }

   /**
    * @param {object} binding
    * @param {string=} special Possible values: l10n and bool
    */
    function buildAttrExpression(binding, special, l10n){
      var expression = [];
      var cond = [];
      var symbols = binding[5];
      var dictionary = binding[4];
      var exprVar;
      var colonPos;

      for (var j = 0; j < symbols.length; j++)
      {
        if (typeof symbols[j] == 'string')
          expression.push(quoteString(symbols[j]));
        else
        {
          exprVar = dictionary[symbols[j]];
          colonPos = exprVar.indexOf(':');
          if (colonPos == -1)
          {
            expression.push(
              special == 'l10n'
                ? '"{' + exprVar + '}"'
                : (special == 'bool'
                     ? '(__' + exprVar + '||"")'
                     : '__' + exprVar
                  )
            );

            if (!special)
              cond.push('__' + exprVar + '!==UNSET&&__' + exprVar + '!==undefined');
          }
          else
          {
            var bindingName = null;
            var l10nPath = exprVar.substr(colonPos + 1).replace(L10N_BINDING, function(m, name){
              bindingName = name;
              return '';
            });

            if (bindingName)
            {
              // if no l10n bindings return nothing
              if (l10n === false)
                return false;

              expression.push(l10n[exprVar.substr(colonPos + 1)]);

              if (!special)
                cond.push(l10n[exprVar.substr(colonPos + 1)] + '!==undefined');
            }
            else
              expression.push('l10n["' + l10nPath + '"]');
          }
        }
      }

      if (expression.length == 1)
        expression.push('""');

      expression = expression.join('+');

      if (!special && cond.length)
        expression = cond.join('&&') + '?(' + expression + '):""';

      return expression;
    }

   /**
    * @func
    */
    return function(bindings){
      function putBindCode(type){
        toolsUsed[type] = true;
        bindCode.push(
          bindVar + '=' + type + '(' + basis.array(arguments, 1) + ');'
        );
      }

      var bindMap = {};
      var bindCode;
      var bindVar;
      var bindVarSeed = 0;
      var varList = [];
      var bindingsWoL10nCompute = [];
      var l10nComputeBindings = [];
      var varName;
      var l10nMap;
      var l10nCompute = [];
      var l10nBindings = {};
      var l10nBindSeed = 0;
      var attrExprId;
      var attrExprMap = {};
      /** @cut */ var debugList = [];
      var toolsUsed = {};

      for (var i = 0, binding; binding = bindings[i]; i++)
      {
        var bindName = binding[2];
        var namePart = bindName.split(':');

        if (namePart[0] == 'l10n' && namePart[1])
        {
          var l10nFullPath = namePart[1];
          var l10nBinding = null;
          var l10nName = l10nFullPath.replace(L10N_BINDING, function(m, name){
            l10nBinding = name;
            return '';
          });

          if (l10nBinding)
          {
            l10nComputeBindings.push(binding);

            if (l10nFullPath in l10nBindings == false)
            {
              varName = '$l10n_' + (l10nBindSeed++);
              l10nBindings[l10nFullPath] = varName;
              l10nCompute.push(varName);
              varList.push(varName + '=tools.l10nToken("' + l10nName + '").computeToken()');

              bindCode = bindMap[l10nBinding];
              if (!bindCode)
              {
                bindCode = bindMap[l10nBinding] = [];
                varList.push('__' + l10nBinding + '=UNSET');
              }

              bindCode.push(varName + '.set(__' + l10nBinding + ');');
            }

            continue;
          }
        }

        bindingsWoL10nCompute.push(binding);
      }

      // process l10n bindings first
      for (var i = 0, binding; binding = l10nComputeBindings[i]; i++)
      {
        var bindType = binding[0];
        var domRef = binding[1];
        var bindName = binding[2];
        var nodeBindingProhibited = binding[3];
        var l10nFullPath = bindName.split(':')[1];

        bindName = l10nBindings[l10nFullPath];
        bindVar = '_' + (bindVarSeed++);
        varName = '__' + bindName;
        bindCode = bindMap[bindName];

        if (!bindCode)
        {
          bindCode = bindMap[bindName] = [];
          // don't set =UNSET here since it's change behaviour in some edge cases
          // TODO: solve the problem
          varList.push(varName);
        }

        if (bindType == TYPE_TEXT)
        {
          /** @cut */ debugList.push('{' + [
          /** @cut */   'binding:"' + bindName + '"',
          /** @cut */   'dom:' + domRef,
          /** @cut */   'val:' + bindVar,
          /** @cut */   'l10n:true',
          /** @cut */   'attachment:' + bindName
          /** @cut */ ] + '}');

          varList.push(bindVar + '=' + domRef);
          putBindCode(bindFunctions[bindType], domRef, bindVar, 'value', nodeBindingProhibited);
        }
        else
        {
          var expr = buildAttrExpression(binding, false, l10nBindings);

          attrExprId = binding[7];
          if (!attrExprMap[attrExprId])
          {
            varList.push(bindVar);
            attrExprMap[attrExprId] = bindVar;
          }

          bindVar = attrExprMap[attrExprId];
          attrName = '"' + binding[ATTR_NAME] + '"';

          /** @cut */ debugList.push('{' + [
          /** @cut */   'binding:"' + bindName + '"',
          /** @cut */   'raw:' + bindName + '.get()',
          /** @cut */   'l10n:true',
          /** @cut */   'type:"l10n"',
          /** @cut */   'expr:[[' + binding[5].map(simpleStringify) + '],[' + binding[4].map(simpleStringify) + '],[' + binding[4].map(stringifyBindingNames, l10nBindings) + ']]',
          /** @cut */   'dom:' + domRef,
          /** @cut */   'attr:' + attrName,
          /** @cut */   'val:' + bindVar,
          /** @cut */   'attachment:' + bindName
          /** @cut */ ] + '}');

          putBindCode('bind_attr', domRef, attrName, bindVar, expr);
        }
      }

      for (var i = 0, binding; binding = bindingsWoL10nCompute[i]; i++)
      {
        var bindType = binding[0];
        var domRef = binding[1];
        var bindName = binding[2];
        var nodeBindingProhibited = binding[3];

        if (['get', 'set', 'templateId_'].indexOf(bindName) != -1)
        {
          /** @cut */ basis.dev.warn('binding name `' + bindName + '` is prohibited, binding ignored');
          continue;
        }

        var namePart = bindName.split(':');
        var anim = namePart[0] == 'anim';
        var l10n = namePart[0] == 'l10n';

        if (anim)
          bindName = namePart[1];

        bindCode = hasOwnProperty.call(bindMap, bindName) ? bindMap[bindName] : null;
        bindVar = '_' + (bindVarSeed++);
        varName = '__' + bindName;

        if (l10n && namePart[1])
        {
          var l10nFullPath = namePart[1];
          var l10nBinding = null;
          var l10nName = l10nFullPath;

          if (!l10nMap)
            l10nMap = {};

          if (!bindMap[l10nName])
          {
            bindMap[l10nName] = [];
            bindMap[l10nName].l10n = '$l10n_' + (l10nBindSeed++);
            varList.push('__' + bindMap[l10nName].l10n + '=l10n["' + l10nName + '"]');
            l10nMap[l10nName] = [];
          }

          bindCode = bindMap[l10nName];

          if (bindType == TYPE_TEXT)
          {
            /** @cut */ debugList.push('{' + [
            /** @cut */   'binding:"' + l10nFullPath + '"',
            /** @cut */   'dom:' + domRef,
            /** @cut */   'val:l10n["' + l10nName + '"]',
            /** @cut */   'l10n:true',
            /** @cut */   'attachment:l10nToken("' + l10nName + '")'
            /** @cut */ ] + '}');
            /** @cut */ toolsUsed.l10nToken = true;

            l10nMap[l10nName].push(domRef + '.nodeValue=value;');

            if (!bindCode.nodeBind)
            {
              varList.push(bindVar + '=' + domRef);
              putBindCode(bindFunctions[bindType], domRef, bindVar, 'value', nodeBindingProhibited);
              bindCode.nodeBind = bindVar;
            }
            else
            {
              bindCode.push(domRef + '.nodeValue=value;');
            }

            continue;
          }
          else
          {
            // build expression, it can't contains any dynamic l10n tokens
            var expr = buildAttrExpression(binding, 'l10n', false);
            if (expr !== false)
            {
              // use NaN value to make sure it trigger in any case
              l10nMap[l10nName].push('bind_attr(' + [domRef, '"' + binding[ATTR_NAME] + '"', 'NaN', expr] + ');');
            }

            // attribute binding will be processed as common attribute binding
          }
        }

        if (!bindCode)
        {
          bindCode = bindMap[bindName] = [];
          varList.push(varName + '=UNSET');
        }

        if (bindType != TYPE_ATTRIBUTE)
        {
          /** @cut */ debugList.push('{' + [
          /** @cut */   'binding:"' + bindName + '"',
          /** @cut */   'dom:' + domRef,
          /** @cut */   'val:' + (bindCode.nodeBind ? varName : bindVar),
          /** @cut */   'updates:$$' + bindName,
          /** @cut */   'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value'
          /** @cut */ ] + '}');

          if (!bindCode.nodeBind)
          {
            varList.push(bindVar + '=' + domRef);
            putBindCode(bindFunctions[bindType], domRef, bindVar, 'value', nodeBindingProhibited);
            bindCode.nodeBind = bindVar;
          }
          else
          {
            switch (bindType)
            {
              case TYPE_ELEMENT:
                putBindCode(bindFunctions[bindType], domRef, domRef, 'value!==null?String(value):null');
                break;
              case TYPE_TEXT:
                bindCode.push(domRef + '.nodeValue=value;');
                break;

              // ignore bindings for comment, as we can't apply anything but Node to comment
            }
          }
        }
        else
        {
          var attrName = binding[ATTR_NAME];

          switch (attrName)
          {
            case 'role-marker':
              varList.push(bindVar + '=""');
              putBindCode('bind_attr', domRef, '"' + attrName + '"', bindVar, 'value?value' + (binding[5][1] ? '+' + quoteString(binding[5][1]) : '') + ':""');
              break;

            case 'class':
              var defaultExpr = '';
              var valueExpr = 'value';
              var bindingType = binding[5];
              var defaultValue = binding[7];

              switch (bindingType)
              {
                case CLASS_BINDING_BOOL:
                case CLASS_BINDING_INVERT:
                  // [2, localPath, 'binding', attrName, 'prefix_','binding',CLASS_BINDING_BOOL,'name',defaultValue]
                  // [2, localPath, 'binding', attrName, ['prefix_name'],'binding',CLASS_BINDING_BOOL,'name',defaultValue]
                  // [2, localPath, 'binding', attrName, 'prefix_','binding',CLASS_BINDING_INVERT,'name',defaultValue]
                  // [2, localPath, 'binding', attrName, ['prefix_name'],'binding',CLASS_BINDING_INVERT,'name',defaultValue]

                  var values = [binding[6]];
                  var prefix = binding[4];
                  var classes = Array.isArray(prefix) ? prefix : values.map(function(val){
                    return prefix + val;
                  });

                  valueExpr =
                    (bindingType == CLASS_BINDING_INVERT ? '!' : '') +
                    'value?"' + classes[0] + '":""';

                  if (defaultValue)
                    defaultExpr = classes[defaultValue - 1];

                  break;

                case CLASS_BINDING_ENUM:
                  // [2, localPath, 'binding', attrName, 'prefix_','binding',CLASS_BINDING_ENUM,'name',defaultValue,['foo','bar']]
                  // [2, localPath, 'binding', attrName, ['prefix_foo','prefix_bar'], CLASS_BINDING_ENUM,'name',defaultValue,['foo','bar']]
                  var values = binding[8];
                  var prefix = binding[4];
                  var classes = Array.isArray(prefix) ? prefix : values.map(function(val){
                    return prefix + val;
                  });

                  valueExpr = values.map(function(val, idx){
                    return 'value=="' + val + '"?"' + classes[idx] + '"';
                  }).join(':') + ':""';

                  if (defaultValue)
                    defaultExpr = classes[defaultValue - 1];

                  break;
                default:
                  // quirks mode (unpredictable binding)
                  // number || string set as is
                  // otherwise treat as boolean, if new value is true set binding name and empty string in other cases
                  var prefix = binding[4];
                  valueExpr = 'typeof value=="string"||typeof value=="number"?"' + prefix + '"+value:(value?"' + prefix + bindName + '":"")';
              }

              varList.push(bindVar + '="' + defaultExpr + '"');
              putBindCode('bind_attrClass', domRef, bindVar, valueExpr, anim);

              /** @cut */ debugList.push('{' + [
              /** @cut */   'binding:"' + bindName + '"',
              /** @cut */   'raw:__' + bindName,
              /** @cut */   'prefix:"' + prefix + '"',
              /** @cut */   'anim:' + anim,
              /** @cut */   'dom:' + domRef,
              /** @cut */   'attr:"' + attrName + '"',
              /** @cut */   'val:' + bindVar,
              /** @cut */   'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value'
              /** @cut */ ] + '}');

              break;

            case 'style':
              var expr = buildAttrExpression(binding, 'style', l10nBindings);

              // resolve expression bind var
              attrExprId = binding[8];
              if (!attrExprMap[attrExprId])
              {
                attrExprMap[attrExprId] = bindVar;
                varList.push(bindVar + '=' + (STYLE_EXPR_VALUE[binding[7]] || '""'));
              }

              if (binding[7])
                expr = expr.replace(/\+""$/, '') + (STYLE_EXPR_TOGGLE[binding[7]] || '');

              bindVar = attrExprMap[attrExprId];
              putBindCode('bind_attrStyle', domRef, '"' + binding[6] + '"', bindVar, expr);

              /** @cut */ debugList.push('{' + [
              /** @cut */   'binding:"' + bindName + '"',
              /** @cut */   'raw:__' + bindName,
              /** @cut */   'property:"' + binding[6] + '"',
              /** @cut */   'expr:[[' + binding[5].map(simpleStringify) + '],[' + binding[4].map(simpleStringify) + ']]',
              /** @cut */   'dom:' + domRef,
              /** @cut */   'attr:"' + attrName + '"',
              /** @cut */   'val:' + bindVar,
              /** @cut */   'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value'
              /** @cut */ ] + '}');

              break;

            default:
              var specialAttr = SPECIAL_ATTR_MAP[attrName];
              var tagName = binding[6].toLowerCase();

              var expr = specialAttr && SPECIAL_ATTR_SINGLE[attrName]
                    ? buildAttrExpression(binding, 'bool', l10nBindings) + '?"' + attrName + '":""'
                    : buildAttrExpression(binding, false, l10nBindings);

              // resolve expression bind var
              attrExprId = binding[7];
              if (!attrExprMap[attrExprId])
              {
                varList.push(bindVar + '=UNSET');
                attrExprMap[attrExprId] = bindVar;
              }

              bindVar = attrExprMap[attrExprId];
              if (attrName == 'tabindex')
                putBindCode('bind_attr', domRef, '"' + attrName + '"', bindVar,
                  // to disable tab stop on element, tabindex attribute should be -1 for inputs and no attribute for other elements
                  expr + '==-1?' + (['input', 'button', 'textarea'].indexOf(tagName) == -1 ? '""' : '-1') + ':' + expr);
              else
              {
                var namespace = namespaces.getNamespace(attrName);
                if (namespace)
                  putBindCode('bind_attrNS', domRef, '"' + namespace + '"', '"' + attrName + '"', bindVar, expr);
                else
                  putBindCode('bind_attr', domRef, '"' + attrName + '"', bindVar, expr);
              }


              if (specialAttr && (specialAttr == '*' || specialAttr.indexOf(tagName) != -1))
                bindCode.push(
                  'if(' + domRef + '.' + attrName + '!=' + bindVar + ')' +
                    domRef + '.' + attrName + '=' + (SPECIAL_ATTR_SINGLE[attrName] ? '!!' + bindVar : bindVar) + ';'
                );

              /** @cut */ debugList.push('{' + [
              /** @cut */   'binding:"' + bindName + '"',
              /** @cut */   'raw:' + (l10n ? 'l10n["' + l10nFullPath + '"]' : '__' + bindName),
              /** @cut */   'type:"' + (specialAttr && SPECIAL_ATTR_SINGLE[attrName] ? 'bool' : 'string') + '"',
              /** @cut */   'expr:[[' + binding[5].map(simpleStringify) + '],[' + binding[4].map(simpleStringify) + '],[' + binding[4].map(stringifyBindingNames, l10nBindings) + ']]',
              /** @cut */   'dom:' + domRef,
              /** @cut */   'attr:"' + attrName + '"',
              /** @cut */   'val:' + bindVar,
              /** @cut */   'attachment:instance.attaches&&instance.attaches["' + bindName + '"]&&instance.attaches["' + bindName + '"].value'
              /** @cut */ ] + '}');
          }
        }
      }

      var bindMapKeys = basis.object.keys(bindMap);
      var setFunction = '';

      // generate function body only if any binding
      if (bindMapKeys.length)
      {
        toolsUsed.resolve = true;

        setFunction = [
          ';function set(bindName,value){',
          'if(typeof bindName!="string")'
        ];

        for (var bindName in bindMap)
          if (bindMap[bindName].nodeBind)
          {
            setFunction.push(
              'if(bindName===' + bindMap[bindName].nodeBind + ')' +
                'bindName="' + bindName + '";' +
              'else '
            );
          }

        setFunction.push(
          'return;',
          /** @cut */ 'rawValues[bindName]=value;',
          'value=resolve.call(instance,bindName,value,Attaches);',
          'switch(bindName){'
        );

        for (var bindName in bindMap)
        {
          var stateVar = bindMap[bindName].l10n || bindName;
          /** @cut */ varList.push('$$' + stateVar + '=0');
          setFunction.push(
            'case"' + bindName + '":',
              'if(__' + stateVar + '!==value)',
              '{',
                ///** @cut */ 'history.push({binding:"' + stateVar + '",value:value});' +
                /** @cut */ '$$' + stateVar + '++;',
                '__' + stateVar + '=value;',
                bindMap[bindName].join(''),
              '}',
            'break;'
          );
        }

        setFunction = setFunction.join('') + '}}';
      }

      var toolsVarList = [];
      for (var key in toolsUsed)
        toolsVarList.push(key + '=tools.' + key);

      return {
        /** @cut */ debugList: debugList,
        allKeys: bindMapKeys,
        keys: bindMapKeys.filter(function(key){
          return key.indexOf('@') == -1;
        }),
        tools: toolsVarList,
        vars: varList,
        set: setFunction,
        l10n: l10nMap,
        l10nCompute: l10nCompute
      };
    };
  })();

  function compileFunction(args, body){
    /** @cut */ try {
      return new Function(args, body);
    /** @cut */ } catch(e) {
    /** @cut */   basis.dev.error('Can\'t build template function: ' + e + '\n', 'function(' + args + '){\n' + body + '\n}');
    /** @cut */ }
  }

  var getFunctions = function(tokens, debug, uri, source, noTextBug){
    // try get functions from cache by templateId
    var fn = tmplFunctions[uri && basis.path.relative(uri)];

    if (fn)
      return fn;

    // clean special instructions from AST
    tokens = cleanSpecial(tokens, 0);

    // build functions
    var paths = buildPathes(tokens, '_', noTextBug);
    var bindings = buildBindings(paths.binding);
    var objectRefs = paths.markedElementList.join('=');
    var result = {
      keys: bindings.keys,
      l10nKeys: basis.object.keys(bindings.l10n)
    };

    // document fragment isn't using if single root node
    if (tokens.length == 1)
      paths.path[0] = 'a=_';

    /** @cut */ if (!uri)
    /** @cut */   uri = basis.path.baseURI + 'inline_template' + (inlineSeed++) + '.tmpl';

    if (bindings.l10n)
    {
      var code = [];
      for (var key in bindings.l10n)
        code.push(
          'case"' + key + '":' +
            bindings.l10n[key].join('') +
          'break;'
        );

      result.createL10nSync = compileFunction(['_', 'l10n', 'bind_attr', 'TEXT_BUG'],
        /** @cut */ (source ? '\n// ' + source.split(/\r\n?|\n\r?/).join('\n// ') + '\n\n' : '') +

        'var ' + paths.path + ';' +
        'return function(path, value){' +
          'switch(path){' +
            code.join('') +
          '}' +
        '}'

        /** @cut */ + '\n\n//# sourceURL=' + basis.path.origin + uri + '_l10n'
      );
    }

    result.createInstanceFactory = compileFunction(['tid', 'createDOM', 'tools', 'l10nMap', 'l10nMarkup', 'getBindings', 'TEXT_BUG'],
      /** @cut */ (source ? '\n// ' + source.split(/\r\n?|\n\r?/).join('\n// ') + '\n\n' : '') +

      'var UNSET={valueOf:function(){}},' +
      (bindings.tools.length ? bindings.tools + ',' : '') +
      (bindings.set
        ? 'Attaches=function(){};' +
          'Attaches.prototype={' + bindings.keys.map(function(key){
            return key + ':null';
          }) + '};'
        : 'set=function(){};') +

      'return function createTmpl_(id,instance,initL10n){' +
        'var _=createDOM(),' +
        (bindings.l10n ? 'l10n=initL10n?{}:l10nMap,' : '') +
        paths.path.concat(bindings.vars) +
        /** @cut */ ',rawValues={}' +
        /** @cut */// ';instance.history=[]' +
        /** @cut */ (debug ? ';instance.debug=function debug(){' +
        /** @cut */   'return {' +
        /** @cut */     'bindings:[' + bindings.debugList + '],' +
        /** @cut *///     'history:Array.prototype.slice.call(history),' +
        /** @cut */     'values:{' + bindings.keys.map(function(key){
        /** @cut */       return '"' + key + '":__' + key;
        /** @cut */     }) + '},' +
        /** @cut */     'rawValues:rawValues,' +
        /** @cut */     (bindings.l10nCompute.length ? 'compute:Array.prototype.slice.call(instance.compute)' : 'compute:[]') +
        /** @cut */   '}' +
        /** @cut */ '}' : '') +
        (bindings.l10nCompute.length ? ';instance.compute=[' + bindings.l10nCompute + ']' : '') +
        ';instance.tmpl={' + [
          paths.ref,
          'templateId_:id',
          'set:set'
          ] +
        '}' +

        (objectRefs ? ';if(instance.context||instance.onAction)' + objectRefs + '=(id<<12)|tid' : '') +

        bindings.set +

        // sync template with bindings
        (bindings.l10n
          ? ';if(initL10n){l10n=l10nMap;initL10n(set)}' +
            ';if(l10nMarkup.length)for(var idx=0,token;token=l10nMarkup[idx];idx++)set(token.path,token.token);'
          : '') +
        (bindings.set
          ? ';if(instance.bindings)instance.handler=getBindings(instance,set)'
          : '') +
        ';' + bindings.l10nCompute.map(function(varName){
          return 'set("' + varName + '",' + varName + ')';
        }) +
      '}'

      /** @cut */ + '\n\n//# sourceURL=' + basis.path.origin + uri
    );

    return result;
  };


  //
  // exports
  //

  module.exports = {
    getFunctions: getFunctions
  };
