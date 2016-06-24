var utils = require('./utils.js');
var styleUtils = require('./style.js');
var styleNamespaceIsolate = styleUtils.styleNamespaceIsolate;
var addStyle = styleUtils.addStyle;
var parseOptionsValue = utils.parseOptionsValue;
var getTokenAttrValues = utils.getTokenAttrValues;
var getLocation = utils.getLocation;

module.exports = function(template, options, token){
  var useStyle = true;
  var elAttrs = getTokenAttrValues(token);

  if (elAttrs.options)
  {
    var filterOptions = parseOptionsValue(elAttrs.options);
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
        styleNamespaceIsolate[src] = options.genIsolateMarker();

      template.styleNSPrefix[styleNamespace] = {
        /** @cut */ loc: getLocation(template, utils.getTokenAttrs(token)[namespaceAttrName].loc),
        /** @cut */ used: false,
        name: styleNamespace,
        prefix: styleNamespaceIsolate[src]
      };
    }
  }
  /** @cut */ else
  /** @cut */ {
  /** @cut */   token.sourceUrl = template.sourceUrl;
  /** @cut */   template.resources.push({
  /** @cut */     type: 'style',
  /** @cut */     url: null,
  /** @cut */     isolate: styleIsolate,
  /** @cut */     token: token,
  /** @cut */     includeToken: null,
  /** @cut */     inline: elAttrs.src ? false : token.children[0] || true,
  /** @cut */     namespace: styleNamespace
  /** @cut */   });
  /** @cut */ }
};
