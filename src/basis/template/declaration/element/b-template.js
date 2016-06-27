var utils = require('../utils.js');
var getTokenAttrValues = utils.getTokenAttrValues;

module.exports = function(template, options, token){
  var elAttrs = getTokenAttrValues(token);

  /** @cut */ if ('name' in elAttrs == false)
  /** @cut */   utils.addTemplateWarn(template, options, '<b:template> has no `name` attribute', token.loc);
  /** @cut */ else if (/^\d/.test(elAttrs.name))
  /** @cut */   utils.addTemplateWarn(template, options, '<b:template> name can\'t starts with number', token.loc);
  /** @cut */ if (hasOwnProperty.call(template.templates, elAttrs.name))
  /** @cut */   utils.addTemplateWarn(template, options, '<b:template> with name `' + elAttrs.name + '` is already defined', token.loc);

  if ('name' in elAttrs && !hasOwnProperty.call(template.templates, elAttrs.name))
  {
    // store to map
    template.templates[elAttrs.name] = {
      tokens: token.children,
      baseURI: template.baseURI,
      options: options,
      sourceUrl: template.sourceUrl
    };
  }
};
