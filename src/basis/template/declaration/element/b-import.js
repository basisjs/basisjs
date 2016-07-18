var hasOwnProperty = Object.prototype.hasOwnProperty;
var arrayAdd = basis.array.add;
var utils = require('../utils.js');
var getTokenAttrValues = utils.getTokenAttrValues;
var styleUtils = require('../style.js');
var adoptStyles = styleUtils.adoptStyles;
var isolateTokens = styleUtils.isolateTokens;

module.exports = function(template, options, token){
  var elAttrs = getTokenAttrValues(token);

  /** @cut */ if ('src' in elAttrs == false)
  /** @cut */   utils.addTemplateWarn(template, options, '<b:template> has no `src` attribute', token.loc);

  if (elAttrs.src)
  {
    var importTemplate = options.resolveResource(elAttrs.src, template.baseURI);
    var decl = importTemplate.decl;

    if (!importTemplate.decl || (importTemplate.bindingBridge && importTemplate.declSource !== importTemplate.bindingBridge.get(importTemplate)))
    {
      importTemplate.declSource = importTemplate.bindingBridge.get(importTemplate);
      decl = importTemplate.decl = options.getDeclFromSource(importTemplate, '', true);
    }

    arrayAdd(template.deps, importTemplate);

    for (var name in decl.templates)
    {
      if (!hasOwnProperty.call(options.templates, name))
      {
        var templateConfig = decl.templates[name];
        var importDecl = templateConfig.importDecl;

        if (!importDecl) {
          var isolatePrefix = options.genIsolateMarker();
          importDecl = templateConfig.importDecl = options.makeDeclaration(
            templateConfig.tokens,
            templateConfig.baseURI,
            templateConfig.options,
            templateConfig.sourceUrl
          );

          // isolate
          isolateTokens(importDecl.tokens, isolatePrefix);

          if (importDecl.resources)
            adoptStyles(importDecl.resources, isolatePrefix, token);

          /** @cut */ if (importDecl.removals)
          /** @cut */   importDecl.removals.forEach(function(item){
          /** @cut */     isolateTokens([item.node], isolatePrefix);
          /** @cut */   });
        }

        options.templates[name] = importDecl;
      }
      /** @cut */ else
      /** @cut */   utils.addTemplateWarn(template, options, 'Template with name `' + name + '` is already added by other <b:import>', token.loc);
    }
  }
};
