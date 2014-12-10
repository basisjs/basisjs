var Node = require('basis.ui').Node;
var SINGLETON = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source'];
var hoveredBinding = require('./binding.js').hover;

var DOMNode = Node.subclass({
  binding: {
    matchBinding: hoveredBinding.compute(function(node, hover){
      return node.bindingName && (!hover || hover === node.bindingName);
    })
  },
  action: {
    enter: function(e){
      hoveredBinding.set(this.bindingName);
    },
    leave: function(e){
      hoveredBinding.set();
    }
  }
});

var ValuePart = DOMNode.subclass({
  type: 'static',
  template: resource('./template/attribute-value.tmpl'),
  binding: {
    type: 'type',
    value: 'value'
  }
});

var Attribute = DOMNode.subclass({
  template: resource('./template/attritube.tmpl'),
  binding: {
    name: 'name'
  },
  childClass: ValuePart
});

var Element = DOMNode.subclass({
  template: resource('./template/element.tmpl'),
  binding: {
    name: 'name',
    childrenHidden: 'childrenHidden',
    attributes: 'satellite:',
    singleton: function(node){
      return SINGLETON.indexOf(node.name) != -1;
    }
  },
  satellite: {
    attributes: {
      satelliteClass: Node.subclass({
        template: resource('./template/attritubes.tmpl'),
        childClass: Attribute
      }),
      config: function(owner){
        return {
          childNodes: owner.attributes
        };
      }
    }
  }
});

var Text = DOMNode.subclass({
  template: resource('./template/text.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName'
  }
});

var Comment = DOMNode.subclass({
  template: resource('./template/comment.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName'
  }
});

module.exports = function buildNode(item, bindings){
  function findBinding(node){
    return basis.array.search(bindings, node, 'dom');
  }

  function fundBindingVal(node){
    return basis.array.search(bindings, node, 'val');
  }

  var node = item[0];
  var binding;

  switch (node.nodeType)
  {
    case 1:
      var attrs = Array.prototype.slice.call(node.attributes).map(function(attr){
        var value;

        if (attr.name == 'class')
        {
          var bindingMap = {};
          for (var i = 0; i < bindings.length; i++)
          {
            var bind = bindings[i];
            var val = bind.dom === node && bind.attr === attr.name && bind.val;
            if (val)
              bindingMap[val] = bind;
          }

          value = attr.value.split(/(\s+)/).map(function(part){
            var bind = bindingMap.hasOwnProperty(part) ? bindingMap[part] : null;
            return {
              type: bind ? 'binding' : 'static',
              value: part,
              bindingName: bind && bind.binding
            };
          });
        }
        else
        {
          if (attr.value)
            value = [{
              type: /^event-/.test(attr.name) ? 'action' : 'static',
              value: attr.value
            }];
        }

        return {
          name: attr.name,
          childNodes: value
        };
      });

      return new Element({
        name: node.tagName.toLowerCase(),
        childrenHidden: node.firstChild && !item[1].length,
        attributes: attrs,
        childNodes: item[1].map(function(child){
          return buildNode(child, bindings);
        })
      });

      break;
    case 3:
      binding = findBinding(node);

      return new Text({
        bindingName: binding ? binding.binding : null,
        value: node.nodeValue
      });

    case 8:
      binding = findBinding(node);

      return new Comment({
        bindingName: binding ? binding.binding : null,
        value: node.nodeValue
      });
  }

  return '';
};
