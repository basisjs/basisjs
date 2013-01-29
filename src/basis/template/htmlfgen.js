
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
  var ATTR_VALUE = basis.template.ATTR_VALUE;

  var ELEMENT_NAME = basis.template.ELEMENT_NAME;
  var ELEMENT_ATTRS = basis.template.ELEMENT_ATTRS;
  var ELEMENT_CHILDS = basis.template.ELEMENT_CHILDS;

  var TEXT_VALUE = basis.template.TEXT_VALUE;
  var COMMENT_VALUE = basis.template.COMMENT_VALUE;


  //
  // main part
  //

  var tmplFunctions = {};


 /**
  * build path references to dom nodes in template
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
  * build template bindings code
  */
  var buildBindings = (function(){
    var quoteEscape = /"/g;

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
        if (typeof symbols[j] == 'string')
          expression.push('"' + symbols[j].replace(quoteEscape, '\\"') + '"');
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

      if (expression.length == 1)
        expression.push('""');

      return expression.join('+');
    }

   /**
    * @func
    */
    return function(bindings){
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
          //anim = TRANSITION_SUPPORTED;
        }

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
            l10nMap[l10nName].push('bind_attr(' + [domRef, attrName, 'NaN', buildAttrExpression(binding, 'l10n')] + ');');

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
              else
              {
                // quirks mode
                // number || string set as it
                // otherwise treat as boolean, if true set binding name and empty string in other cases
                valueExpr = 'typeof value=="string"||typeof value=="number"?value:(value?"' + bindName + '":"")';
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
              varList.push(bindVar + '=' + buildAttrExpression(binding, 'l10n'));
              toolsUsed.bind_attr = true;

              specialAttr = SPECIAL_ATTR_MAP[attrName];

              bindCode.push(
                bindVar + '=bind_attr(' + [domRef, '"' + attrName + '"', bindVar,
                  specialAttr && SPECIAL_ATTR_SINGLE[attrName]
                    ? buildAttrExpression(binding, 'bool') + '?"' + attrName + '":""'
                    : buildAttrExpression(binding)
                  ] +
                ');'
              );

              if (specialAttr)
              {
                if (specialAttr == '*' || specialAttr.has(binding[6].toLowerCase()))
                {
                  bindCode.push('if(' + domRef + '.' + attrName + '!=' + bindVar + ')' + domRef + '.' + attrName + '=' + (SPECIAL_ATTR_SINGLE[attrName] ? '!!' : '') + '(' + bindVar + ');');
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
        keys: basis.object.keys(bindMap),
        vars: varList,
        body: result.join(''),
        l10n: l10nMap,
        l10nKeys: l10nKeys
      };
    }
  })();


  var getFunctions = (function(){

    function addBasisObjectId(ref){
      return ref + '.basisObjectId';
    }

    return function(tokens, debug, uri, source){
      var fn = tmplFunctions[uri && basis.path.relative(uri)];
      var paths = buildPathes(tokens, '_');
      var bindings = buildBindings(paths.binding);
      var result = {
        keys: bindings.keys,
        l10nKeys: bindings.l10nKeys
      };

      // try get functions by templateId
      if (fn)
      {
        return fn;
        //result.createInstance = fn[0];
        //result.createL10nSync = fn[1];
      }
      else
      {
        var objectRefs = paths.objectRefList.map(addBasisObjectId).join('=');
        var createInstance;
        var fnBody;

        if (bindings.l10n)
        {
          var code = [];
          for (var key in bindings.l10n)
            code.push(
              'case"' + key +'":\n' +
              'if(value==null)value="{' + key + '}";' +
              '__l10n[token]=value;' +
              bindings.l10n[key].join(';') +
              'break;'
            );

          result.createL10nSync = new Function('_', '__l10n', 'bind_attr', 'TEXT_BUG',
            (source ? '/*\n' + source + '\n*/\n' : '') +
            'var ' + paths.path + ';return function(token, value){' +
            'switch(token){' +
              code.join('') +
            '}}'
            /**@cut*/ + (uri ? '//@ sourceURL=' + uri + '_l10n' : '')
          );
        }

        /**@cut*/try {
        result.createInstance = new Function('gMap', 'tMap', 'build', 'tools', '__l10n', 'TEXT_BUG',
          fnBody = (source ? '/*\n' + source + '\n*/\n' : '') +
          'return function createInstance_(obj,actionCallback,updateCallback){' + 
          'var id=gMap.seed++,attaches={},resolve=tools.resolve,_=build(),' + paths.path.concat(bindings.vars) + ';\n' +
          (objectRefs ? 'if(obj)gMap[' + objectRefs + '=id]=obj;\n' : '') +
          'function updateAttach(){set(String(this),attaches[this])};\n' +
          bindings.body +
          /**@cut*/(debug ? ';set.debug=function(){return[' + bindings.debugList.join(',') + ']}' : '') +
          ';return tMap[id]={' + [paths.ref, 'set:set,rebuild:function(){if(updateCallback)updateCallback.call(obj)},' +
          'destroy:function(){' +
            'for(var key in attaches)if(attaches[key])attaches[key].bindingBridge.detach(attaches[key],updateAttach,key);' +
            'attaches=null;' +
            /**@cut*/(debug ? 'delete set.debug;' : '') + 
            'delete tMap[id];' + 
            'delete gMap[id];' +
            '}'] +
          '}' + /**@cut*/ (uri ? '//@ sourceURL=' + uri + '\n' : '') +
        '}');
        /**@cut*/} catch(e) { basis.dev.warn("can't build createInstance\n", fnBody); }
      }

      return result;
    }
  })();

  module.exports = {
  	getFunctions: getFunctions
  };
  