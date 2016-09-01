var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;

function valueToString(val){
  if (typeof val == 'string')
    return '\'' + val.replace(/\'/g, '\\\'') + '\'';

  if (val && typeof val == 'object' && val.constructor.className)
    return '[object ' + val.constructor.className + ']';

  return String(val);
}

module.exports = function getBindingsFromNode(node){
  var list = [];
  var map = {};

  if (node)
  {
    var id = node[inspectBasisTemplateMarker];
    var object = inspectBasisTemplate.resolveObjectById(id) || {};
    var objectBinding = object.binding;
    var debugInfo = inspectBasisTemplate.getDebugInfoById(id) || {};
    var usedValues = debugInfo.values;
    var rawValues = debugInfo.rawValues;

    for (var key in objectBinding)
      if (key != '__extend__' && key != 'bindingId')
      {
        var used = Object.prototype.hasOwnProperty.call(usedValues, key);
        var value = used ? usedValues[key] : undefined;
        var isReactive = rawValues ? value !== rawValues[key] : false;
        var realValueId = basis.genUID();

        map[realValueId] = rawValues[key];
        list.push({
          name: key,
          realValue: realValueId,
          value: valueToString(value),
          isReactive: isReactive,
          used: used,
          nestedView: Boolean(value && value[inspectBasisTemplateMarker]),
          loc: objectBinding[key] ? objectBinding[key].loc : null
        });
      }
  }

  return {
    list: list,
    map: map
  };
};
