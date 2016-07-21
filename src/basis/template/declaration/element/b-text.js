var getTokenAttrValues = require('../utils.js').getTokenAttrValues;

module.exports = function(template, options, token, result){
  var elAttrs = getTokenAttrValues(token);
  var refs = (elAttrs.ref || '').trim();
  var text = token.children[0] || { type: 3, value: '' };

  text = basis.object.merge(text, {
    refs: refs ? refs.split(/\s+/) : [],
    value: 'notrim' in elAttrs ? text.value : (text.value || '').replace(/^ *(\r\n?|\n)( *$)?|(\r\n?|\n) *$/g, '')
  });

  result.push.apply(result, options.process([text], template, options));
};
