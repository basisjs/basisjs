
  basis.require('basis.template');


  //
  // import names
  //

  var TYPE_ELEMENT = basis.template.TYPE_ELEMENT;
  var TYPE_ATTRIBUTE = basis.template.TYPE_ATTRIBUTE;
  var TYPE_TEXT = basis.template.TYPE_TEXT;
  var TYPE_COMMENT = basis.template.TYPE_COMMENT;

  var TOKEN_TYPE = basis.template.TOKEN_TYPE;
  var TOKEN_BINDINGS = basis.template.TOKEN_BINDINGS;
  var TOKEN_REFS = basis.template.TOKEN_REFS;

  var ATTR_NAME = basis.template.ATTR_NAME;
  var ATTR_NAME_BY_TYPE = basis.template.ATTR_NAME_BY_TYPE;

  var ELEMENT_NAME = basis.template.ELEMENT_NAME;
  var ELEMENT_ATTRS = basis.template.ELEMENT_ATTRS;
  var ELEMENT_CHILDS = basis.template.ELEMENT_CHILDS;

  var TEXT_VALUE = basis.template.TEXT_VALUE;
  var COMMENT_VALUE = basis.template.COMMENT_VALUE;


  //
  // main part
  //

  var tmplFunctions = {}; // precompiled functions


 /**
  * build path references to dom nodes in template
  */
  var buildPathes = (function(){
    var PATH_REF_NAME = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.toArray();

    var pathList;
    var refList;
    var bindingList;
    var markedElementList;
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

            localPath = path + '.childNodes[' + cp + (closeText ? ' + ' + closeText + ' * TEXT_BUG' : '') + ']';
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

          putBinding([token[TOKEN_TYPE], localPath, token[TOKEN_BINDINGS]]);
        }


        if (token[TOKEN_TYPE] == TYPE_ELEMENT)
        {
          myRef = -1;

          if (path == rootPath)
            markedElementList.push(localPath + '.basisObjectId');

          if (!explicitRef)
          {
            localPath = putPath(localPath);
            myRef = pathList.length;
          }

          // TODO: temporary solution, rewrite function
          var attrs = [];
          var children = [];
          for (var j = ELEMENT_ATTRS, t; t = token[j]; j++)
            if (t[TOKEN_TYPE] == TYPE_ELEMENT || t[TOKEN_TYPE] == TYPE_TEXT || t[TOKEN_TYPE] == TYPE_COMMENT)
              children.push(t);
            else
              attrs.push(t);

          for (var j = 0, attr; attr = attrs[j]; j++)
          {
            if (attr[TOKEN_TYPE] == 6)
              continue;

            var attrName = ATTR_NAME_BY_TYPE[attr[TOKEN_TYPE]] || attr[ATTR_NAME];

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

          if (children.length)
            processTokens(children, localPath);

          if (!explicitRef && myRef == pathList.length)
            pathList.pop();
        }
      }
    }

    return function(tokens, path){
      pathList = [];
      refList = [];
      bindingList = [];
      markedElementList = [];
      rootPath = path || '_';

      processTokens(tokens, rootPath);

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
    var SPECIAL_ATTR_MAP = {
      disabled: '*',  // any tag
      checked: ['input'],
      value: ['input', 'textarea'],
      minlength: ['input'],
      maxlength: ['input'],
      readonly: ['input'],
      selected: ['option']
    };

    var SPECIAL_ATTR_SINGLE = {
      disabled: true,
      checked: true,
      selected: true,
      readonly: true
    };

    var bindFunctions = {
      1: 'bind_element',
      3: 'bind_textNode',
      8: 'bind_comment'
    };

   /**
    * @param {object} binding
    * @param {string=} special Possible values: l10n and bool
    */
    function buildAttrExpression(binding, special){
      var expression = [];
      var symbols = binding[5];
      var dictionary = binding[4];
      var exprVar;
      var colonPos;

      for (var j = 0; j < symbols.length; j++)
      {
        if (typeof symbols[j] == 'string')
          expression.push('"' + symbols[j].replace(/"/g, '\\"') + '"');
        else
        {
          exprVar = dictionary[symbols[j]];
          colonPos = exprVar.indexOf(':');
          if (colonPos == -1)
            expression.push(
              special == 'l10n'
                ? '"{' + exprVar + '}"'
                : (special == 'bool'
                     ? '(__' + exprVar + '||"")'
                     : '__' + exprVar
                  )
            );
          else
            expression.push('__l10n["' + exprVar.substr(colonPos + 1) + '"]');
        }
      }

      if (expression.length == 1)
        expression.push('""');

      return expression.join('+');
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
      var varList = [];
      var result = [];
      var varName;
      var l10nMap;
      var l10nKeys;
      var toolsUsed = {};
      var specialAttr;
      /** @cut */ var debugList = [];

      for (var i = 0, binding; binding = bindings[i]; i++)
      {
        var bindType = binding[0];
        var domRef = binding[1];
        var bindName = binding[2];

        var namePart = bindName.split(':');
        var anim = namePart[0] == 'anim';

        if (anim)
          bindName = namePart[1];

        bindCode = bindMap[bindName];
        bindVar = '_' + i;
        varName = '__' + bindName;

        if (namePart[0] == 'l10n' && namePart[1])
        {
          var l10nName = namePart[1];

          if (!l10nMap)
          {
            l10nMap = {};
            l10nKeys = [];
          }

          if (!bindMap[l10nName])
          {
            bindMap[l10nName] = [];
            l10nMap[l10nName] = [];
            l10nKeys.push(l10nName);
          }

          bindCode = bindMap[l10nName];
          bindCode.l10n = true;

          if (bindType == TYPE_TEXT)
          {
            /** @cut */ debugList.push('{' + [
            /** @cut */   'binding:"' + l10nName + '"',
            /** @cut */   'dom:' + domRef,
            /** @cut */   'val:__l10n["' + l10nName + '"]',
            /** @cut */   'attachment:l10nToken("' + l10nName + '")'
            /** @cut */ ] +'}');
            /** @cut */ toolsUsed.l10nToken = true;

            l10nMap[l10nName].push(domRef + '.nodeValue=value;');
            
            bindCode.push(domRef + '.nodeValue=__l10n["' + l10nName + '"];');
          }
          else
          {
            attrName = '"' + binding[ATTR_NAME] + '"';
            
            // use NaN value to make sure it trigger in any case
            l10nMap[l10nName].push('bind_attr(' + [domRef, attrName, 'NaN', buildAttrExpression(binding, 'l10n')] + ');');

            varList.push(bindVar);
            putBindCode('bind_attr', domRef, attrName, bindVar, buildAttrExpression(binding));
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
          /** @cut */ debugList.push('{' + [
          /** @cut */   'binding:"' + bindName + '"',
          /** @cut */   'dom:' + domRef,
          /** @cut */   'val:' + bindVar,
          /** @cut */   'attachment:attaches["' + bindName + '"]'
          /** @cut */ ] +'}');

          varList.push(bindVar + '=' + domRef);
          putBindCode(bindFunctions[bindType], domRef, bindVar, 'value');
        }
        else
        {
          var attrName = binding[ATTR_NAME];

          /** @cut */ debugList.push('{' + [
          /** @cut */   'binding:"' + bindName + '"',
          /** @cut */   'dom:' + domRef,
          /** @cut */   'attr:"' + attrName + '"',
          /** @cut */   'val:' + bindVar,
          /** @cut */   'attachment:attaches["' + bindName + '"]'
          /** @cut */ ] + '}');

          switch (attrName)
          {
            case 'class':
              var defaultExpr = '';
              var valueExpr = 'value';
              var prefix = binding[4];
              var bindingLength = binding.length;

              if (bindingLength >= 6)
              {
                // predictable binding

                if (bindingLength == 6 || typeof binding[6] == 'string')
                {
                  // bool binding

                  if (bindingLength == 6)
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
                else
                {
                  // enum binding

                  // if enum list is empty - ignore binding; Probably we should remove it in makeDeclaration
                  if (!binding[6].length)
                    continue;

                  if (bindingLength == 7)
                  {
                    valueExpr = binding[6].map(function(val){
                      return 'value=="' + val + '"';
                    }).join('||') + '?value:""';

                    if (binding[5])
                      defaultExpr = prefix + binding[6][binding[5] - 1];
                  }
                  else
                  {
                    prefix = '';
                    valueExpr = binding[6].map(function(val, idx){
                      return 'value=="' + val + '"?"' + this[idx] + '"';
                    }, binding[7]).join(':') + ':""';

                    if (binding[5])
                      defaultExpr = binding[7][binding[5] - 1];
                  }
                }
              }
              else
              {
                // quirks mode (unpredictable binding)
                // number || string set as is
                // otherwise treat as boolean, if new value is true set binding name and empty string in other cases
                valueExpr = 'typeof value=="string"||typeof value=="number"?value:(value?"' + bindName + '":"")';
              }

              varList.push(bindVar + '="' + defaultExpr + '"');
              putBindCode('bind_attrClass', domRef, bindVar, valueExpr, '"' + prefix + '"', anim);

              break;

            case 'style':
              varList.push(bindVar + '=""');
              putBindCode('bind_attrStyle', domRef, '"' + binding[6] + '"', bindVar, buildAttrExpression(binding));

              break;

            default:
              specialAttr = SPECIAL_ATTR_MAP[attrName];

              varList.push(bindVar + '=' + buildAttrExpression(binding, 'l10n'));
              putBindCode('bind_attr', domRef, '"' + attrName + '"', bindVar,
                specialAttr && SPECIAL_ATTR_SINGLE[attrName]
                  ? buildAttrExpression(binding, 'bool') + '?"' + attrName + '":""'
                  : buildAttrExpression(binding)
              );

              if (specialAttr && (specialAttr == '*' || specialAttr.has(binding[6].toLowerCase())))
                bindCode.push(
                  'if(' + domRef + '.' + attrName + '!=' + bindVar + ')' +
                    domRef + '.' + attrName + '=' + (SPECIAL_ATTR_SINGLE[attrName] ? '!!(' : '(') + bindVar + ');'
                );
          }
        }
      }

      result.push(
        'function set(bindName,value){' +
          'value=resolve(attaches,updateAttach,bindName,value);' +
          'switch(bindName){'
      );

      for (var bindName in bindMap)
        result.push(
          'case"' + bindName + '":' +
          (bindMap[bindName].l10n
            ? bindMap[bindName].join('')
            : 'if(__' + bindName + '!==value)' +
              '{' +
                '__' + bindName + '=value;' +
                bindMap[bindName].join('') +
              '}') +
          'break;'
        );

      result.push('}}');

      for (var key in toolsUsed)
        varList.push(key + '=tools.' + key);

      return {
        /** @cut */ debugList: debugList,
        keys: basis.object.keys(bindMap),
        vars: varList,
        set: result.join(''),
        l10n: l10nMap,
        l10nKeys: l10nKeys
      };
    }
  })();


  var getFunctions = function(tokens, debug, uri, source){
    // try get functions from cache by templateId
    var fn = tmplFunctions[uri && basis.path.relative(uri)];

    if (fn)
      return fn;

    // build functions
    var paths = buildPathes(tokens, '_');
    var bindings = buildBindings(paths.binding);
    var objectRefs = paths.markedElementList.join('=');
    var createInstance;
    var fnBody;
    var result = {
      keys: bindings.keys,
      l10nKeys: bindings.l10nKeys
    };      

    if (bindings.l10n)
    {
      var code = [];
      for (var key in bindings.l10n)
        code.push(
          'case"' + key +'":' +
            'if(value==null)value="{' + key + '}";' +
            '__l10n[token]=value;' +
            bindings.l10n[key].join(';') +
          'break;'
        );

      result.createL10nSync = new Function('_', '__l10n', 'bind_attr', 'TEXT_BUG',
        /** @cut */ (source ? '/*\n' + source + '\n*/\n' : '') +

        'var ' + paths.path + ';' +
        'return function(token, value){' +
          'switch(token){' +
            code.join('') +
          '}' +
        '}'
        
        /** @cut */ + (uri ? '//# sourceURL=' + basis.path.origin + uri + '_l10n' : '')
        /** @cut */ + (uri ? '//@ sourceURL=' + basis.path.origin + uri + '_l10n' : '')
      );
    }

    /** @cut */ try {
    result.createInstance = new Function('gMap', 'tMap', 'build', 'tools', '__l10n', 'TEXT_BUG',
      /** @cut */ fnBody = (source ? '/*\n' + source + '\n*/\n' : '') +
      'return function createInstance_(obj,onAction,onUpdate){' +
        'var id=gMap.seed++,' +
        'ref={context:obj},' +
        'attaches={},' + 
        'resolve=tools.resolve,' +
        '_=build(),' + 
        paths.path.concat(bindings.vars) + 

        (objectRefs ? ';if(obj)gMap[' + objectRefs + '=id]=ref' : '') +

        ';function updateAttach(){set(this+"",attaches[this])}' +

        bindings.set +
        /** @cut */ (debug ? 'set.debug=function(){return[' + bindings.debugList + ']}' : '') +

        ';return tMap[id]=ref.tmpl={' + [
          paths.ref,
          'set:set,' +
          'rebuild_:function(){if(onUpdate)onUpdate.call(obj)},' +
          'action_:function(action,event){if(onAction)onAction.call(obj,action,event)},' +
          'destroy_:function(){' +
            'for(var key in attaches)if(attaches[key])attaches[key].bindingBridge.detach(attaches[key],updateAttach,key);' +
            'attaches=null;' +
            'delete tMap[id];' + 
            (objectRefs ? 'delete gMap[id];' : '') +
          '}'] +
        '}' +

        /** @cut */ (uri ? '//# sourceURL=' + basis.path.origin + uri + '\n' : '') +
        /** @cut */ (uri ? '//@ sourceURL=' + basis.path.origin + uri + '\n' : '') +
      '}'
    );
    /** @cut */ } catch(e) { basis.dev.warn("can't build createInstance\n", fnBody); }

    return result;
  }

  module.exports = {
  	getFunctions: getFunctions
  };
