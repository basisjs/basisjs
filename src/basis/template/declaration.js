
var hasOwnProperty = Object.prototype.hasOwnProperty;
var arraySearch = basis.array.search;
var arrayAdd = basis.array.add;
var arrayRemove = basis.array.remove;

var tokenize = require('./tokenize.js');
var isolateCss = require('./isolateCss.js');
var consts = require('./const.js');
var utils = require('./declaration/utils.js');
var styleUtils = require('./declaration/style.js');
var attrUtils = require('./declaration/attr.js');
var elementHandlers = {
  style: require('./declaration/b-style.js'),
  isolate: require('./declaration/b-isolate.js'),
  svg: require('./declaration/b-svg.js'),
  l10n: require('./declaration/b-l10n.js')
};

var resourceHash = utils.resourceHash;
var addUnique = utils.addUnique;
var getTokenName = utils.getTokenName;
var refList = utils.refList;
var bindingList = utils.bindingList;
var addTokenRef = utils.addTokenRef;
var removeTokenRef = utils.removeTokenRef;
var getTokenAttrValues = utils.getTokenAttrValues;
var getTokenAttrs = utils.getTokenAttrs;
var getLocation = utils.getLocation;
var parseOptionsValue = utils.parseOptionsValue;
var addTemplateWarn = utils.addTemplateWarn;
var addTokenLocation = utils.addTokenLocation;

var applyShowHideAttribute = attrUtils.applyShowHideAttribute;
var modifyAttr = attrUtils.modifyAttr;
var getAttrByName = attrUtils.getAttrByName;
var addRoleAttribute = attrUtils.addRoleAttribute;
var applyAttrs = attrUtils.applyAttrs;

var styleNamespaceIsolate = styleUtils.styleNamespaceIsolate;
var adoptStyles = styleUtils.adoptStyles;
var addStyle = styleUtils.addStyle;

var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
var TYPE_TEXT = consts.TYPE_TEXT;
var TYPE_COMMENT = consts.TYPE_COMMENT;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var TOKEN_REFS = consts.TOKEN_REFS;
var ATTR_NAME = consts.ATTR_NAME;
var ATTR_VALUE_INDEX = consts.ATTR_VALUE_INDEX;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var TEXT_VALUE = consts.TEXT_VALUE;
var CLASS_BINDING_ENUM = consts.CLASS_BINDING_ENUM;
var CLASS_BINDING_BOOL = consts.CLASS_BINDING_BOOL;
var CLASS_BINDING_INVERT = consts.CLASS_BINDING_INVERT;

// TODO: remove
var Template = function(){};
var resolveResource = function(){};
var genIsolateMarker = function(){
  return basis.genUID() + '__';
};


/**
* make compiled version of template
*/
var makeDeclaration = (function(){
  var includeStack = [];
  var styleNamespaceResource = {};

  //
  // main function
  //
  function process(tokens, template, options){

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


    var result = [];

    for (var i = 0, token, item; token = tokens[i]; i++)
    {
      var refs = refList(token);
      var bindings = bindingList(token);

      switch (token.type)
      {
        case TYPE_ELEMENT:
          // special elements (basis namespace)
          if (token.prefix == 'b')
          {
            if (elementHandlers.hasOwnProperty(token.name))
            {
              elementHandlers[token.name](template, options, token, result);
              continue;
            }

            var elAttrs = getTokenAttrValues(token);
            var elAttrs_ = getTokenAttrs(token);

            switch (token.name)
            {
              // processing by separate handlers
              // case 'style':
              // case 'svg':
              // case 'isolate':
              // case 'l10n':

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

                      /** @cut */ if ('default' in elAttrs && !elAttrs['default'])
                      /** @cut */   addTemplateWarn(template, options, 'Bool <b:define> has no value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

                      break;

                    case 'invert':
                      define = [
                        bindingName,
                        CLASS_BINDING_INVERT,
                        defineName,
                        !elAttrs['default'] || elAttrs['default'] == 'true' ? 1 : 0
                      ];

                      /** @cut */ addStateInfo(bindingName, 'invert', false);

                      /** @cut */ if ('default' in elAttrs && !elAttrs['default'])
                      /** @cut */   addTemplateWarn(template, options, 'Invert <b:define> has no value as default (value ignored)', elAttrs_['default'] && elAttrs_['default'].loc);

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
                    /** @cut */ addTokenLocation(template, options, define, token);
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
                  var resource;

                  // Add resolve warnings to template warnings list
                  // TODO: improve solution with no basis.dev.warn overloading
                  /** @cut */ var basisWarn = basis.dev.warn;
                  /** @cut */ basis.dev.warn = function(){
                  /** @cut */   addTemplateWarn(template, options, basis.array(arguments).join(' '), token.loc);
                  /** @cut */   if (!basis.NODE_ENV)
                  /** @cut */     basisWarn.apply(this, arguments);
                  /** @cut */ };

                  resource = resolveResource(templateSrc, template.baseURI);

                  /** @cut */ basis.dev.warn = basisWarn;

                  if (!resource)
                  {
                    /** @cut */ addTemplateWarn(template, options, '<b:include src="' + templateSrc + '"> is not resolved, instruction ignored', token.loc);
                    continue;
                  }

                  // prevent recursion
                  if (includeStack.indexOf(resource) == -1)
                  {
                    var isolatePrefix = elAttrs_.isolate ? elAttrs_.isolate.value || options.genIsolateMarker() : '';
                    var includeOptions = elAttrs.options ? parseOptionsValue(elAttrs.options) : null;
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

                    if (decl.resources)
                    {
                      var resources = decl.resources;

                      if ('no-style' in elAttrs)
                        // ignore style resource when <b:include no-style/>
                        resources = resources.filter(function(item){
                          return item.type != 'style';
                        });
                      else
                        adoptStyles(resources, isolatePrefix, token);

                      template.resources.unshift.apply(template.resources, resources);
                    }

                    var instructions = basis.array(token.children);
                    var styleNSIsolate = {
                      /** @cut */ map: options.styleNSIsolateMap,
                      prefix: options.genIsolateMarker()
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
                            applyShowHideAttribute(template, options, token, elAttrs_[includeAttrName]);
                          break;

                        case 'role':
                          var role = elAttrs_.role.value;

                          if (role)
                          {
                            if (!/[\/\(\)]/.test(role))
                            {
                              var loc;
                              /** @cut */ loc = getLocation(template, elAttrs_.role.loc);
                              applyRole(decl.tokens, role, elAttrs_.role, loc);
                            }
                            /** @cut */ else
                            /** @cut */   addTemplateWarn(template, options, 'Value for role was ignored as value can\'t contains ["/", "(", ")"]: ' + role, elAttrs_.role.loc);
                          }

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
                            var childAttrs = getTokenAttrValues(child);
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
                            var childAttrs = getTokenAttrValues(child);
                            var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];
                            var token = tokenRef && tokenRef.token;

                            if (token && token[TOKEN_TYPE] == TYPE_ELEMENT)
                            {
                              var expr = getTokenAttrs(child).expr;

                              if (!expr)
                              {
                                /** @cut */ addTemplateWarn(template, options, 'Instruction <b:' + child.name + '> has no `expr` attribute', child.loc);
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

                            if (token && childAttrs.name)
                              addTokenRef(token, childAttrs.name);
                            break;

                          case 'remove-ref':
                            var childAttrs = getTokenAttrValues(child);
                            var ref = 'ref' in childAttrs ? childAttrs.ref : 'element';
                            var tokenRef = ref && tokenRefMap[ref];
                            var token = tokenRef && tokenRef.token;

                            if (token)
                              removeTokenRef(token, childAttrs.name || childAttrs.ref);
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

          applyAttrs(template, options, item, token.attrs);
          item.push.apply(item, process(token.children, template, options) || []);

          /** @cut */ addTokenLocation(template, options, item, token);
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

          /** @cut */ addTokenLocation(template, options, item, token);
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

          /** @cut */ addTokenLocation(template, options, item, token);
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

      if (key && parts[0] == 'l10n')
      {
        if (parts.length == 2 && key.indexOf('@') == -1)
        {
          if (!dictURI)
            return false; // warning will be added at place where absl10n() was called

          key = key + '@' + dictURI;
          value = 'l10n:' + key;
        }
        arrayAdd(l10nMap, key);
      }
    }

    return value;
  }

  function applyRole(tokens, role, sourceToken, location, stIdx){
    for (var i = stIdx || 0, token; token = tokens[i]; i++)
    {
      var tokenType = token[TOKEN_TYPE];

      switch (tokenType)
      {
        case TYPE_ELEMENT:
          applyRole(token, role, sourceToken, location, ELEMENT_ATTRIBUTES_AND_CHILDREN);
          break;

        case TYPE_ATTRIBUTE:
          if (token[ATTR_NAME] == 'role-marker')
          {
            var roleExpression = token[TOKEN_BINDINGS][1];
            var currentRole = roleExpression[1];

            roleExpression[1] = '/' + role + (currentRole ? '/' + currentRole : '');

            /** @cut */ token.sourceToken = sourceToken;
            /** @cut */ token.loc = location;
          }
          break;
      }
    }
  }

  function normalizeRefs(tokens, isolate, map, stIdx){
    function processName(name){
      // add prefix only for `ns:name` and ignore global namespace `:name`
      if (name.indexOf(':') <= 0)
        return name;

      /** @cut */ var prefix = name.split(':')[0];
      /** @cut */ isolate.map[isolate.prefix + prefix] = prefix;

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

      switch (tokenType)
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
            for (var j = array.length - 1; j >= 0; j--)
            {
              var binding = absl10n(array[j], options.dictURI, template.l10n);   // TODO: move l10n binding process in separate function
              if (binding === false)
              {
                /** @cut */ addTemplateWarn(template, options, 'Dictionary for l10n binding on attribute can\'t be resolved: {' + array[j] + '}', token.loc);

                // make l10n binding static, i.e.
                //   [['l10n:unresolved', 'x'], [0, '-', 1]]
                // ->
                //   [['x'], ['{l10n:unresolved}', '-', 0]]
                var expr = bindings[1];
                for (var k = 0; k < expr.length; k++)
                  if (typeof expr[k] == 'number')
                  {
                    if (expr[k] == j)
                      expr[k] = '{' + array[j] + '}';
                    else if (expr[k] > j)
                      expr[k] = expr[k] - 1;
                  }

                array.splice(j, 1);

                if (!array.length)
                  token[TOKEN_BINDINGS] = 0;
              }
              else
                array[j] = binding;
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

              /** @cut */ addTokenLocation(template, options, bind, bind.info_);

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

  return function makeDeclaration(source, baseURI, options, sourceUrl, sourceOrigin){
    var warns = [];
    /** @cut */ var source_;

    // make copy of options (as modify it) and normalize
    options = basis.object.slice(options);
    options.genIsolateMarker = genIsolateMarker;
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

      // isolate removed tokens, since devtools may process them
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
          if (item.type == 'style' && item.isolate !== styleNamespaceIsolate)  // ignore namespaced styles
            item.isolate = result.isolate + item.isolate;

      // save all resources for debug purposes as it will be filtered
      /** @cut */ var originalResources = result.resources;

      result.resources = result.resources
        // remove duplicates
        .filter(function(item, idx, array){
          return item.url && !basis.array.search(array, resourceHash(item), resourceHash, idx + 1);
        })
        .map(function(item){
          if (item.type != 'style') {
            return {
              type: item.type,
              url: item.url
            };
          }

          // map and isolate styles
          var url = item.url;
          var isolate = item.isolate;
          var namespaceIsolate = isolate === styleNamespaceIsolate;
          var cssMap;

          // resolve namespaced style
          if (namespaceIsolate)
          {
            isolate = styleNamespaceIsolate[url];
            if (url in styleNamespaceResource)
            {
              /** @cut */ item.url = styleNamespaceResource[url].url;
              return {
                type: 'style',
                url: styleNamespaceResource[url].url
              };
            }
          }

          // if no isolate prefix -> nothing todo
          if (!isolate)
          {
            /** @cut */ item.url = url;
            return {
              type: 'style',
              url: url
            };
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

          return {
            type: 'style',
            url: resource.url
          };
        });

      // process styles list
      /** @cut */ result.styles = originalResources.map(function(item){
      /** @cut */   var sourceUrl = item.url || getTokenAttrValues(item.token).src;
      /** @cut */   return {
      /** @cut */     resource: item.url || false,
      /** @cut */     sourceUrl: basis.resource.resolveURI(sourceUrl),
      /** @cut */     isolate: item.isolate === styleNamespaceIsolate ? styleNamespaceIsolate[item.url] : item.isolate || false,
      /** @cut */     namespace: item.namespace || false,
      /** @cut */     inline: item.inline,
      /** @cut */     styleToken: item.token,
      /** @cut */     includeToken: item.includeToken
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
  getDeclFromSource: getDeclFromSource,
  setIsolatePrefixGenerator: function(fn){
    genIsolateMarker = fn;
  }
};
