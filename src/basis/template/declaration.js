var hasOwnProperty = Object.prototype.hasOwnProperty;
var arraySearch = basis.array.search;
var arrayAdd = basis.array.add;

var tokenize = require('./tokenize.js');
var isolateCss = require('./isolateCss.js');
var consts = require('./const.js');
var utils = require('./declaration/utils.js');
var refUtils = require('./declaration/refs.js');
var styleUtils = require('./declaration/style.js');
var attrUtils = require('./declaration/attr.js');
var walk = require('./declaration/ast.js').walk;

var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
var TYPE_TEXT = consts.TYPE_TEXT;
var TYPE_COMMENT = consts.TYPE_COMMENT;
var TYPE_CONTENT = consts.TYPE_CONTENT;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var TOKEN_REFS = consts.TOKEN_REFS;
var ATTR_VALUE_INDEX = consts.ATTR_VALUE_INDEX;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var TEXT_VALUE = consts.TEXT_VALUE;
var CONTENT_PRIORITY = consts.CONTENT_PRIORITY;
var CONTENT_CHILDREN = consts.CONTENT_CHILDREN;

var resourceHash = utils.resourceHash;
var getTokenName = utils.getTokenName;
var bindingList = utils.bindingList;
var refList = refUtils.refList;
var addTokenRef = refUtils.addTokenRef;
var normalizeRefs = refUtils.normalizeRefs;
// var addUnique = utils.addUnique;
// var removeTokenRef = utils.removeTokenRef;

var applyAttrs = attrUtils.applyAttrs;

var styleNamespaceIsolate = styleUtils.styleNamespaceIsolate;
var isolateTokens = styleUtils.isolateTokens;

/** @cut */ var topLevelInstructions = ['define', 'isolate', 'l10n', 'style'];
/** @cut */ var humanTopLevelInstrcutionList = topLevelInstructions.map(function(name){
/** @cut */   return '<b:' + name + '>';
/** @cut */ }).join(', ').replace(/, (<b:[a-z]+>)$/, ' and $1');
var elementHandlers = {
  content: require('./declaration/element/b-content.js'),
  define: require('./declaration/element/b-define.js'),
  include: require('./declaration/element/b-include.js'),
  isolate: require('./declaration/element/b-isolate.js'),
  l10n: require('./declaration/element/b-l10n.js'),
  style: require('./declaration/element/b-style.js'),
  svg: require('./declaration/element/b-svg.js'),
  text: require('./declaration/element/b-text.js')
  // import: require('./declaration/element/b-import.js'),
  // template: require('./declaration/element/b-template.js'),
};

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
            /** @cut */ if (topLevelInstructions.indexOf(token.name) === -1)
            /** @cut */   options.allowTopInstruction = false;
            /** @cut */ else if (!options.allowTopInstruction)
            /** @cut */   utils.addTemplateWarn(template, options, 'Instruction tag <b:' + token.name + '> should be placed in the beginning of template before any markup or instructions other than ' + humanTopLevelInstrcutionList + '. Currently it may works but will be ignored in future.', token.loc);

            if (!elementHandlers.hasOwnProperty(token.name))
            {
              /** @cut */ utils.addTemplateWarn(template, options, 'Unknown instruction tag: <b:' + token.name + '>', token.loc);
              continue;
            }

            elementHandlers[token.name](template, options, token, result);

            // don't add to declaration
            continue;
          }

          /** @cut */ options.allowTopInstruction = false;

          // <b:template>/<b:import> part
          // var name = getTokenName(token);
          // if (hasOwnProperty.call(options.templates, name))
          // {
          //   var decl = options.templates[name];
          //   var declTokens = cloneDecl(decl.tokens);
          //   var tokenRefMap = normalizeRefs(declTokens);

          //   template.includes.push({
          //     token: token,
          //     resource: null, // TODO
          //     nested: decl.includes
          //   });

          //   if (decl.deps)
          //     addUnique(template.deps, decl.deps);

          //   if (decl.resources)
          //     addUnique(template.resources, decl.resources);

          //   if (decl.warns)
          //     template.warns.push.apply(template.warns, decl.warns);

          //   /** @cut */ if (decl.removals)
          //   /** @cut */   template.removals.push.apply(template.removals, decl.removals);

          //   // FIXME
          //   // var styleNSIsolate = {
          //   //   /** @cut */ map: options.styleNSIsolateMap,
          //   //   prefix: genIsolateMarker()
          //   // };

          //   // for (var key in decl.styleNSPrefix)
          //   //   template.styleNSPrefix[styleNSIsolate.prefix + key] = basis.object.merge(decl.styleNSPrefix[key], {
          //   //     /** @cut */ used: hasOwnProperty.call(options.styleNSIsolateMap, styleNSIsolate.prefix + key)
          //   //   });

          //   if (tokenRefMap.element)
          //     removeTokenRef(tokenRefMap.element.node, 'element');

          //   result.push.apply(result, declTokens);
          //   continue;
          // }

          item = [
            1,                       // TOKEN_TYPE = 0
            bindings,                // TOKEN_BINDINGS = 1
            refs,                    // TOKEN_REFS = 2
            getTokenName(token)      // ELEMENT_NAME = 3
          ];

          applyAttrs(template, options, item, token.attrs);
          item.push.apply(item, process(token.children, template, options));

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

        default:
          /** @cut */ utils.addTemplateWarn(template, options, 'Unknown token type: ' + token.type, token);
          continue;
      }

      /** @cut */ options.allowTopInstruction = false;
      /** @cut */ utils.addTokenLocation(template, options, item, token);
      /** @cut */ item.sourceToken = token;

      result.push(item);
    }


    return result;
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

  function applyDefines(ast, template, options){
    walk(ast, function(nodeType, node){
      var bindings = node[TOKEN_BINDINGS];

      switch (nodeType)
      {
        case TYPE_ELEMENT:
          applyDefines(node, template, options, ELEMENT_ATTRIBUTES_AND_CHILDREN);
          break;

        case TYPE_TEXT:
          if (bindings)
          {
            var binding = absl10n(bindings, options.dictURI, template.l10n);
            node[TOKEN_BINDINGS] = binding || 0;
            if (binding === false)
            {
              /** @cut */ utils.addTemplateWarn(template, options, 'Dictionary for l10n binding on text node can\'t be resolved: {' + bindings + '}', node.loc);
              node[TEXT_VALUE] = '{' + bindings + '}';
            }
            /** @cut */ else if (typeof binding === 'string')
            /** @cut */ {
            /** @cut */   var tokenNameParts = binding.match(/^l10n:(.+?)\.{(.+?)}@/);
            /** @cut */   var stateName = tokenNameParts && tokenNameParts[2];
            /** @cut */
            /** @cut */   if (stateName && options.defines.hasOwnProperty(stateName))
            /** @cut */     options.defines[tokenNameParts[2]].used = true;
            /** @cut */ }
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
                /** @cut */ utils.addTemplateWarn(template, options, 'Dictionary for l10n binding on attribute can\'t be resolved: {' + array[j] + '}', node.loc);

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
                  node[TOKEN_BINDINGS] = 0;
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

              /** @cut */ utils.addTokenLocation(template, options, bind, bind.info_);

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

                /** @cut */ utils.addTemplateWarn(template, options, 'Unpredictable class binding: ' + bind[0] + '{' + bind[1] + '}', bind.loc);
              }
            }

            if (options.optimizeSize)
            {
              var valueIdx = ATTR_VALUE_INDEX[nodeType];
              if (!node[valueIdx])
                node.length = valueIdx;
            }
          }
          break;
      }
    });
  }

  function findElementCandidateNode(ast){
    function find(node, offset){
      for (var i = offset; i < node.length; i++)
      {
        var child = node[i];
        var type = child[TOKEN_TYPE];
        var result;

        if (type == TYPE_ELEMENT ||
            type == TYPE_TEXT)
          return child;

        if (type == TYPE_COMMENT)
          if (child[TOKEN_REFS] || child[TOKEN_BINDINGS])
            return child;

        if (type == TYPE_CONTENT)
        {
          result = find(child, CONTENT_CHILDREN);
          if (result)
            return result;
        }
      }

      return null;
    }

    return find(ast, 0);
  }

  return function makeDeclaration(source, baseURI, options, sourceUrl, sourceOrigin){
    /** @cut */ var source_ = source;

    // make copy of options (as modify it) and normalize
    options = basis.object.slice(options);

    options.Template = Template;
    options.genIsolateMarker = genIsolateMarker;
    options.resolveResource = resolveResource;
    options.getDeclFromSource = getDeclFromSource;
    options.makeDeclaration = makeDeclaration;
    options.process = process;

    options.includeStack = includeStack;
    options.includeOptions = options.includeOptions || {};
    options.templates = {};
    options.defines = {};
    options.dictURI = sourceUrl  // resolve l10n dictionary url
      ? basis.path.resolve(sourceUrl)
      : baseURI || '';
    /** @cut */ options.allowTopInstruction = true;
    /** @cut */ options.styleNSIsolateMap = {};
    // force fetch locations and ranges in dev mode for debug and build purposes
    /** @cut */ options.loc = true;
    /** @cut */ options.range = true;

    // normalize dictionary ext name
    if (options.dictURI)
    {
      var extname = basis.path.extname(options.dictURI);
      if (extname && extname != '.l10n')
        options.dictURI = options.dictURI.substr(0, options.dictURI.length - extname.length) + '.l10n';
    }

    // result object
    var result = {
      sourceUrl: sourceUrl,
      baseURI: baseURI || '',

      tokens: null,
      includes: [],
      deps: [],
      templates: {},

      isolate: false,
      styleNSPrefix: {},  // TODO: investigate, could we remove this from declaration?
      resources: [],      // probably we should use `styles` instead of `resources`

      l10n: [],

      warns: []
    };

    /** @cut */ result.removals = [];
    /** @cut */ result.states = {};

    if (!source)
      source = '';

    // tokenize source if needed
    if (!Array.isArray(source))
      source = tokenize(String(source || ''), {
        loc: !!options.loc,
        range: !!options.range
      });

    // copy tokenizer warnings to template if any
    /** @cut */ if (source.warns)
    /** @cut */   source.warns.forEach(function(warn){
    /** @cut */     utils.addTemplateWarn(result, options, warn[0], warn[1].loc);
    /** @cut */   });

    // start prevent recursion
    includeStack.push((sourceOrigin !== true && sourceOrigin) || {}); // basisjs-tools pass true

    // main task
    result.tokens = process(source, result, options);

    // stop prevent recursion
    includeStack.pop();

    // store source for debug
    /** @cut */ result.tokens.source_ = source_ !== undefined ? source_ : source && source.source_;

    // add implicit <b:content> to the end
    // it will be removed during normalization if explicit exists
    result.tokens.push([TYPE_CONTENT, 0]);

    // normalize refs and find first non special node
    var tokenRefMap = normalizeRefs(result.tokens);
    var elementCandidateNode = findElementCandidateNode(result.tokens);
    var contentNodeRef = tokenRefMap[':content'];

    // downgrade explicit high priority content to normal explicit
    if (contentNodeRef.node[CONTENT_PRIORITY] > 1)
      contentNodeRef.node[CONTENT_PRIORITY] = 1;

    contentNodeRef.overrided.forEach(function(overridedContentNodeRef){
      var nodeIndex = overridedContentNodeRef.parent.indexOf(overridedContentNodeRef.node);

      if (nodeIndex != -1)
        overridedContentNodeRef.parent.splice.apply(
          overridedContentNodeRef.parent,
          [nodeIndex, 1].concat(overridedContentNodeRef.node.slice(CONTENT_CHILDREN))
        );

      // add removed <b:content> to removals but explicit only
      /** @cut */ if (overridedContentNodeRef.node[consts.CONTENT_PRIORITY] > 0)
      /** @cut */   result.removals.push({
      /** @cut */     reason: '<b:content/>',
      /** @cut */     removeToken: contentNodeRef.node,
      /** @cut */     includeToken: overridedContentNodeRef.node.includeToken,
      /** @cut */     token: overridedContentNodeRef.node, // for backward capability
      /** @cut */     node: overridedContentNodeRef.node
      /** @cut */   });
    });

    // there must be at least one normal node in result
    if (!elementCandidateNode)
    {
      elementCandidateNode = [TYPE_TEXT, 0, 0];
      result.tokens.unshift(elementCandidateNode);
    }

    // add explicit element ref if it doesn't exist yet
    if (!tokenRefMap.element)
      addTokenRef(elementCandidateNode, 'element');

    // deal with defines
    applyDefines(result.tokens, result, options);

    /** @cut */ if (/^[^a-z_-]/i.test(result.isolate))
    /** @cut */   basis.dev.error('basis.template: isolation prefix `' + result.isolate + '` should not starts with symbol other than letter, underscore or dash, otherwise it leads to incorrect css class names and broken styles');

    // top-level declaration
    if (includeStack.length == 0)
    {
      // isolate tokens
      isolateTokens(result.tokens, result.isolate || '', result, options);

      // isolate removed tokens, since devtools may process them
      /** @cut */ if (result.removals)
      /** @cut */ {
      /** @cut */   var warns = result.warns;
      /** @cut */   result.warns = [];
      /** @cut */   result.removals.forEach(function(item){
      /** @cut */     isolateTokens([item.token], result.isolate || '', result, options);
      /** @cut */   });
      /** @cut */   result.warns = warns;
      /** @cut */ }

      // check for unused namespaces
      /** @cut */ for (var key in result.styleNSPrefix)
      /** @cut */ {
      /** @cut */   var styleNSPrefix = result.styleNSPrefix[key];
      /** @cut */   if (!styleNSPrefix.used)
      /** @cut */     utils.addTemplateWarn(result, options, 'Unused namespace: ' + styleNSPrefix.name, styleNSPrefix.loc);
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
            var isolated = isolateCss((cssResource && cssResource.cssText) || '', isolate, true);

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
      /** @cut */   var sourceUrl = item.url || utils.getTokenAttrValues(item.token).src;
      /** @cut */   return {
      /** @cut */     resource: item.url || false,
      /** @cut */     sourceUrl: sourceUrl ? basis.resource.resolveURI(sourceUrl, baseURI) : null,
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
    /** @cut */     utils.addTemplateWarn(result, options, 'Unused define: ' + key, define.loc);
    /** @cut */ }

    if (!result.warns.length)
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
    if (result && (typeof result != 'object' || !Array.isArray(result.tokens)))
      result = String(result);
  }

  if (!result || typeof result == 'string')
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
  walk: walk,
  getDeclFromSource: getDeclFromSource,
  setIsolatePrefixGenerator: function(fn){
    genIsolateMarker = fn;
  }
};
