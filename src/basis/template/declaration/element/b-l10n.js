var getTokenAttrValues = require('../utils.js').getTokenAttrValues;

module.exports = function(template, options, token){
  var elAttrs = getTokenAttrValues(token);

  if (elAttrs.src)
    options.dictURI = basis.resource.resolveURI(elAttrs.src, template.baseURI, '<b:' + token.name + ' src=\"{url}\"/>');
};
