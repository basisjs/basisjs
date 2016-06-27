var utils = require('../utils.js');
var getTokenAttrValues = utils.getTokenAttrValues;

module.exports = function(template, options, token){
  if (template.isolate)
  {
    /** @cut */ utils.addTemplateWarn(template, options, '<b:isolate> is already set to `' + template.isolate + '`', token.loc);
    return;
  }

  template.isolate = getTokenAttrValues(token).prefix || options.isolate || options.genIsolateMarker();
};
