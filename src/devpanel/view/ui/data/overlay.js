var Value = require('basis.data').Value;
var getBoundingRect = require('basis.layout').getBoundingRect;
var Node = require('basis.ui').Node;
var map = require('./index.js').map;
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

hoverById
  .as(function(id){
    return map[id] ? map[id].instance : null;
  })
  .link(null, function(instance){
    var element = instance && instance.tmpl.element;

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
