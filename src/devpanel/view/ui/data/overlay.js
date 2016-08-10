var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var getBoundingRect = require('basis.layout').getBoundingRect;
var Node = require('basis.ui').Node;
var map = require('./index.js').map;
var output = require('./index.js').output;
var hoverById = new Value();
var overlay = new Node({
  template: resource('./overlay.tmpl'),
  binding: {
    top: 'data:',
    left: 'data:',
    width: 'data:',
    height: 'data:'
  }
});

// output uses as mediator to recalculate element
new Expression(hoverById, output, function(id){
  var instance = map[id] && map[id].instance;
  var element = instance && instance.tmpl && instance.tmpl.element;
  return element || null;
})
  .link(null, function(element){
    if (!element)
    {
      if (overlay.element.parentNode)
        overlay.element.parentNode.removeChild(overlay.element);
      return;
    }

    var rect = getBoundingRect(element);
    if (rect)
    {
      overlay.update(rect);
      document.body.appendChild(overlay.element);
      return;
    }
  });

module.exports = hoverById;
