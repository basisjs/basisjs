var arrayRemove = basis.array.remove;
var arrayAdd = basis.array.add;
var walk = require('../ast.js').walk;
var utils = require('../utils.js');
var addUnique = utils.addUnique;
var getTokenAttrValues = utils.getTokenAttrValues;
var getTokenAttrs = utils.getTokenAttrs;
var parseOptionsValue = utils.parseOptionsValue;
var normalizeRefs = utils.normalizeRefs;
var addTokenRef = utils.addTokenRef;
var removeTokenRef = utils.removeTokenRef;
var styleUtils = require('../style.js');
var styleNamespaceIsolate = styleUtils.styleNamespaceIsolate;
var adoptStyles = styleUtils.adoptStyles;
var addStyle = styleUtils.addStyle;
var isolateTokens = styleUtils.isolateTokens;
var applyStyleNamespaces = styleUtils.applyStyleNamespaces;
var attrUtils = require('../attr.js');
var getAttrByName = attrUtils.getAttrByName;
var addRoleAttribute = attrUtils.addRoleAttribute;
var applyShowHideAttribute = attrUtils.applyShowHideAttribute;
var modifyAttr = attrUtils.modifyAttr;
var consts = require('../../const.js');
var TOKEN_TYPE = consts.TOKEN_TYPE;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var ATTR_NAME = consts.ATTR_NAME;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var CONTENT_CHILDREN = consts.CONTENT_CHILDREN;

function applyRole(ast, role, sourceToken, location){
  walk(ast, function(type, node){
    if (type !== TYPE_ATTRIBUTE || node[ATTR_NAME] != 'role-marker')
      return;

    var roleExpression = node[TOKEN_BINDINGS][1];
    var currentRole = roleExpression[1];

    roleExpression[1] = '/' + role + (currentRole ? '/' + currentRole : '');

    /** @cut */ node.sourceToken = sourceToken;
    /** @cut */ node.loc = location;
  });
}

function clone(value){
  if (Array.isArray(value))
    return value.map(clone);

  if (value && value.constructor === Object)
  {
    var result = {};
    for (var key in value)
      result[key] = clone(value[key]);
    return result;
  }

  return value;
}

module.exports = function(template, options, token, result){
  var elAttrs = getTokenAttrValues(token);
  var elAttrs_ = getTokenAttrs(token);
  var includeStack = options.includeStack;
  var templateSrc = elAttrs.src;

  /** @cut */ if ('src' in elAttrs == false)
  /** @cut */   utils.addTemplateWarn(template, options, '<b:include> has no `src` attribute', token.loc);

  if (templateSrc)
  {
    var resource;

    // Add resolve warnings to template warnings list
    // TODO: improve solution with no basis.dev.warn overloading
    /** @cut */ var basisWarn = basis.dev.warn;
    /** @cut */ basis.dev.warn = function(){
    /** @cut */   utils.addTemplateWarn(template, options, basis.array(arguments).join(' '), token.loc);
    /** @cut */   if (!basis.NODE_ENV)
    /** @cut */     basisWarn.apply(this, arguments);
    /** @cut */ };

    if (/^#[^\d]/.test(templateSrc))
    {
      resource = template.templates[templateSrc.substr(1)];
      if (resource)
        resource = options.makeDeclaration(
          clone(resource.tokens),
          resource.baseURI,
          resource.options,
          resource.sourceUrl
        );
    }
    else
      resource = options.resolveResource(templateSrc, template.baseURI);

    /** @cut */ basis.dev.warn = basisWarn;

    if (!resource)
    {
      /** @cut */ utils.addTemplateWarn(template, options, '<b:include src="' + templateSrc + '"> is not resolved, instruction ignored', token.loc);
      return;
    }

    // prevent recursion
    if (includeStack.indexOf(resource) == -1)
    {
      var isolatePrefix = elAttrs_.isolate ? elAttrs_.isolate.value || options.genIsolateMarker() : '';
      var includeOptions = elAttrs.options ? parseOptionsValue(elAttrs.options) : null;
      var decl = options.getDeclFromSource(resource, '', true, basis.object.merge(options, {
        includeOptions: includeOptions
      }));

      template.includes.push({
        token: token,
        resource: resource,
        nested: decl.includes
      });

      // template -> s4, s5, s6, s3 {s1}, {s2}
      //   -> include(template1) s4, s5, s6, {s3}
      //     -> include(template2) {s4}, {s5}
      //     -> include(template3) {s6}

      if (resource.bindingBridge)
        arrayAdd(template.deps, resource);

      if (decl.deps)
        addUnique(template.deps, decl.deps);

      if (decl.warns)
      {
        /** @cut */ decl.warns.forEach(function(warn){
        /** @cut */   warn.source = warn.source || token;
        /** @cut */ });
        template.warns.push.apply(template.warns, decl.warns);
      }

      /** @cut */ if (decl.removals)
      /** @cut */   template.removals.push.apply(template.removals, decl.removals);

      if (decl.resources)
      {
        var resources = decl.resources;

        if ('no-style' in elAttrs)
          // ignore style resource when <b:include no-style/>
          resources = resources.filter(function(item){
            return item.type != 'style';
          });
        else
          adoptStyles(resources, isolatePrefix, token); // TODO: move filter by type here

        // TODO: fix order
        // now {include2-style} {include1-style} {own-style}
        // should be {include1-style} {include2-style} {own-style}
        template.resources.unshift.apply(template.resources, resources);
      }

      var instructions = basis.array(token.children);
      var tokenRefMap = normalizeRefs(decl.tokens); // ast

      // TODO: something strange here
      var styleNSIsolate = {
        /** @cut */ map: options.styleNSIsolateMap,
        prefix: options.genIsolateMarker()
      };

      applyStyleNamespaces(decl.tokens, styleNSIsolate);

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

      // TODO: add instructions in right order
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
            // TODO: convert to instruction
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
            // TODO: convert to instruction
            var tokenRef = tokenRefMap.element;
            var token = tokenRef && tokenRef.token;

            if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
              applyShowHideAttribute(template, options, token, elAttrs_[includeAttrName]);
            break;

          case 'role':
            // TODO: convert to instruction
            var role = elAttrs_.role.value;

            if (role)
            {
              if (!/[\/\(\)]/.test(role))
              {
                var loc;
                /** @cut */ loc = utils.getLocation(template, elAttrs_.role.loc);
                applyRole(decl.tokens, role, elAttrs_.role, loc);
              }
              /** @cut */ else
              /** @cut */   utils.addTemplateWarn(template, options, 'Value for role was ignored as value can\'t contains ["/", "(", ")"]: ' + role, elAttrs_.role.loc);
            }

            break;
          default:
            // TODO: warn on unknown attr
        }

      for (var j = 0, child; child = instructions[j]; j++)
      {
        // process special elements (basis namespace)
        if (child.type == TYPE_ELEMENT && child.prefix == 'b')
        {
          // TODO: split into modules
          // TODO: move common parts up (ref)
          switch (child.name)
          {
            case 'style':
              var childAttrs = getTokenAttrValues(child);
              var childAttrs_ = getTokenAttrs(child);
              var useStyle = true;

              if (childAttrs.options)
              {
                var filterOptions = parseOptionsValue(childAttrs.options);
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
                    styleNamespaceIsolate[src] = options.genIsolateMarker();

                  template.styleNSPrefix[styleNSIsolate.prefix + styleNamespace] = {
                    /** @cut */ loc: utils.getLocation(template, childAttrs_[namespaceAttrName].loc),
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
              var childAttrs = getTokenAttrValues(child);
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
                    args = args.concat(options.process(child.children, template, options));

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
              var childAttrs = getTokenAttrValues(child);
              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
              var tokenRef = ref && tokenRefMap[ref];
              var token = tokenRef && tokenRef.token;

              if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
              {
                var children = options.process(child.children, template, options);

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
              var childAttrs = getTokenAttrValues(child);
              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
              var tokenRef = ref && tokenRefMap[ref];
              var token = tokenRef && tokenRef.token;

              if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
              {
                var expr = getTokenAttrs(child).expr;

                if (!expr)
                {
                  /** @cut */ utils.addTemplateWarn(template, options, 'Instruction <b:' + child.name + '> has no `expr` attribute', child.loc);
                  break;
                }

                applyShowHideAttribute(template, options, token, basis.object.complete({
                  name: child.name,
                }, getTokenAttrs(child).expr));
              }

              break;

            case 'attr':
            case 'set-attr':
              modifyAttr(template, options, token, tokenRefMap, child, false, 'set');
              break;

            case 'append-attr':
              modifyAttr(template, options, token, tokenRefMap, child, false, 'append');
              break;

            case 'remove-attr':
              modifyAttr(template, options, token, tokenRefMap, child, false, 'remove');
              break;

            case 'class':
            case 'append-class':
              modifyAttr(template, options, token, tokenRefMap, child, 'class', 'append');
              break;

            case 'set-class':
              modifyAttr(template, options, token, tokenRefMap, child, 'class', 'set');
              break;

            case 'remove-class':
              var childAttrs_ = getTokenAttrs(child);
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

              modifyAttr(template, options, token, tokenRefMap, child, 'class', 'remove-class');
              break;

            case 'add-ref':
              var childAttrs = getTokenAttrValues(child);
              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
              var tokenRef = ref && tokenRefMap[ref];
              var token = tokenRef && tokenRef.token;
              var refName = (childAttrs.name || '').trim();

              if (token)
              {
                if (/^[a-z_][a-z0-9_]*$/i.test(refName))
                  addTokenRef(token, childAttrs.name);
                /** @cut */ else
                /** @cut */   utils.addTemplateWarn(template, options, 'Bad reference name for <b:add-ref>:' + refName, child.loc);
              }
              break;

            case 'remove-ref':
              var childAttrs = getTokenAttrValues(child);
              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
              var tokenRef = ref && tokenRefMap[ref];
              var token = tokenRef && tokenRef.token;
              var refName = (childAttrs.name || '').trim();

              if (token)
              {
                if (/^[a-z_][a-z0-9_]*$/i.test(refName))
                  removeTokenRef(token, childAttrs.name || childAttrs.ref);
                /** @cut */ else
                /** @cut */   utils.addTemplateWarn(template, options, 'Bad reference name for <b:remove-ref>:' + refName, child.loc);
              }
              break;

            case 'role':
            case 'set-role':
              var childAttrs = getTokenAttrValues(child);
              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
              var tokenRef = ref && tokenRefMap[ref];
              var token = tokenRef && tokenRef.token;

              if (token)
              {
                arrayRemove(token, getAttrByName(token, 'role-marker'));
                addRoleAttribute(template, options, token, childAttrs.value || '', child);
              }
              break;

            case 'remove-role':
              var childAttrs = getTokenAttrValues(child);
              var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
              var tokenRef = ref && tokenRefMap[ref];
              var token = tokenRef && tokenRef.token;

              if (token)
                arrayRemove(token, getAttrByName(token, 'role-marker'));
              break;

            default:
              /** @cut */ utils.addTemplateWarn(template, options, 'Unknown instruction tag: <b:' + child.name + '>', child.loc);
          }
        }
        else
        {
          var tokenRef = tokenRefMap[':content'];
          var processedChild = options.process([child], template, options);

          if (tokenRef)
          {
            var parent = tokenRef.owner;
            var pos = parent.indexOf(tokenRef.token);

            tokenRef.token.splice(CONTENT_CHILDREN);
            parent.splice.apply(parent, [pos, 0].concat(processedChild));
          }
          else
          {
            decl.tokens.push.apply(decl.tokens, processedChild);
          }
        }
      }

      if (tokenRefMap.element)
        removeTokenRef(tokenRefMap.element.token, 'element');

      result.push.apply(result, decl.tokens);
    }
    else
    {
      /** @cut */ var stack = includeStack.slice(includeStack.indexOf(resource) || 0).concat(resource).map(function(res){
      /** @cut */   if (res instanceof options.Template)
      /** @cut */     res = res.source;
      /** @cut */   return res.id || res.url || '[inline template]';
      /** @cut */ });
      /** @cut */ template.warns.push('Recursion: ', stack.join(' -> '));
    }
  }
};
