var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;

var wrap = require('basis.data').wrap;
var Value = require('basis.data').Value;
var hoveredBinding = new Value();

function valueToString(val){
  if (typeof val == 'string')
    return '\'' + val.replace(/\'/g, '\\\'') + '\'';

  if (val && typeof val == 'object' && val.constructor.className)
    return '[object ' + val.constructor.className + ']';

  return String(val);
}

function getBindingsFromNode(node){
  var items = [];

  if (node)
  {
    var id = node[inspectBasisTemplateMarker];
    var object = inspectBasisTemplate.resolveObjectById(id);
    var objectBinding = object.binding;
    var template = inspectBasisTemplate.resolveTemplateById(id);
    var templateBinding = template.getBinding();

    for (var key in objectBinding)
      if (key != '__extend__' && key != 'bindingId')
      {
        var used = templateBinding.names.indexOf(key) != -1;
        var value = used ? objectBinding[key].getter(object) : null;

        items.push({
          name: key,
          value: valueToString(value),
          used: used,
          nestedView: Boolean(value && value[inspectBasisTemplateMarker]),
          loc: objectBinding[key].loc
        });
      }
  }

  return wrap(items, true);
}

module.exports = {
  hover: hoveredBinding,
  getBindingsFromNode: getBindingsFromNode
};
