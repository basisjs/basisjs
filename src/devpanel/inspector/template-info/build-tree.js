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
    inline: 'inlineChildren',
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

function buildAttribute(attr, attrBindings){
  var value = {
    type: 'static',
    value: attr.value
  };

  switch (attr.name)
  {
    case 'class':
      var bindingMap = {};

      for (var i = 0, bind; bind = attrBindings[i]; i++)
        if (bind.val)
          bindingMap[bind.val] = bind;

      value = attr.value.split(/(\s+)/).map(function(part){
        var bind = bindingMap.hasOwnProperty(part) ? bindingMap[part] : null;
        return {
          type: bind ? 'binding' : 'static',
          value: part,
          bindingName: bind && bind.binding
        };
      });

      break;

    case 'style':
      // todo
      break;

    default:
      if (attr.value)
        if (/^event-/.test(attr.name))
          value.type = 'action';
        else
        {
          if (attrBindings.length)
          {
            var baseBinding = attrBindings[0];
            var bindingValues = {};

            // build value map
            for (var i = 0, bind; bind = attrBindings[i]; i++)
              if (bind.binding)
                bindingValues[bind.binding] = bind.raw;

            if (baseBinding.type == 'bool')
              value = {
                type: 'binding',
                value: baseBinding.val,
                bindingName: attrBindings.length > 1 ? 'multiple' : baseBinding.binding
              };
            else
              // convert expression to value parts
              if (baseBinding.expr)
                value = baseBinding.expr[0].map(function(item){
                  if (typeof item == 'number')
                    return {
                      type: 'binding',
                      value: String(bindingValues[this[item]]),
                      bindingName: this[item]
                    };

                  return {
                    type: 'static',
                    value: item
                  };
                }, attrBindings[0].expr[1]);
          }
        }
  }

  return {
    name: attr.name,
    childNodes: value
  };
}

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
      var attrs = basis.array(node.attributes).map(function(attr){
        return buildAttribute(attr, bindings.filter(function(bind){
          return bind.dom === node && bind.attr === attr.name;
        }));
      });
      var children = item[1].map(function(child){
        return buildNode(child, bindings);
      });
      var inline =
        children.every(function(node){
          return node instanceof Text;
        }) &&
        children.reduce(function(res, node){
          return res + node.value.length;
        }, 0) < 32;

      return new Element({
        name: node.tagName.toLowerCase(),
        childrenHidden: node.firstChild && !item[1].length,
        inlineChildren: inline,
        attributes: attrs,
        childNodes: children
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
