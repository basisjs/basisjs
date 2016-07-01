var inspectBasis = require('devpanel').inspectBasis;
var fileAPI = require('../../api/file.js');
var Node = require('basis.ui').Node;
var SINGLETON = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source'];
var hoveredBinding = require('./binding.js').hover;
var jsSourcePopup = require('../../module/js-source-popup/index.js');
var templateSwitcher = require('basis.template').switcher;

var DOMNode = Node.subclass({
  binding: {
    matchBinding: hoveredBinding.compute(function(node, hover){
      return node.bindingName && (!hover || hover === node.bindingName);
    })
  },
  action: {
    enter: function(){
      if (this.bindingName)
        hoveredBinding.set(this.bindingName);
      if (this.loc)
      {
        jsSourcePopup.loc.set(this.loc);
        jsSourcePopup.show(this.element);
      }
    },
    leave: function(){
      hoveredBinding.set();
      jsSourcePopup.hide();
    },
    inspect: function(){
      if (this.selectDomNode && this.domNode)
      {
        hoveredBinding.set();
        this.selectDomNode(this.domNode);
      }
    }
  },
  destroy: function(){
    Node.prototype.destroy.call(this);

    // clean up references
    for (var property in this)
      if (hasOwnProperty.call(this, property))
        if (this[property] && typeof this[property] == 'object')
          this[property] = null;
  }
});

var ValuePart = DOMNode.subclass({
  type: 'static',
  template: templateSwitcher(function(node){
    return node.type == 'static'
      ? resource('./template/tree/attribute-value-static.tmpl')
      : resource('./template/tree/attribute-value.tmpl');
  }),
  binding: {
    type: 'type',
    value: 'value',
    l10n: 'l10n || ""',
    loc: 'loc || ""'
  },
  action: {
    openLoc: function(){
      if (this.loc)
        fileAPI.openFile(this.loc);
    }
  }
});

var Attribute = DOMNode.subclass({
  template: resource('./template/tree/attritube.tmpl'),
  binding: {
    name: 'name'
  },
  childClass: ValuePart
});

var Element = DOMNode.subclass({
  template: resource('./template/tree/element.tmpl'),
  binding: {
    name: 'name',
    binding: 'bindingName',
    nestedView: 'nestedView',
    childrenHidden: 'childrenHidden',
    inline: 'inlineChildren',
    attributes: 'satellite:',
    singleton: function(node){
      return SINGLETON.indexOf(node.name) != -1;
    }
  },
  satellite: {
    attributes: {
      instance: Node.subclass({
        template: resource('./template/tree/attritubes.tmpl'),
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
  template: resource('./template/tree/text.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName',
    l10n: 'l10n',
    nestedView: 'nestedView'
  }
});

var Comment = DOMNode.subclass({
  template: resource('./template/tree/comment.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName',
    nestedView: 'nestedView'
  }
});

function buildAttribute(attr, attrBindings, actions){
  var value = [{
    type: 'static',
    value: attr.value
  }];

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
          value = attr.value.split(/(\s+)/).map(function(value){
            return {
              type: /\S/.test(value) ? 'action' : 'static',
              value: value,
              loc: inspectBasis.dev.getInfo(actions[value], 'loc') || ''
            };
          });
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
              value = [{
                type: 'binding',
                value: baseBinding.val,
                bindingName: attrBindings.length > 1 ? 'multiple' : baseBinding.binding
              }];
            else
              // convert expression to value parts
              if (baseBinding.expr)
              {
                var expr = baseBinding.expr[0];
                var bindingNames = baseBinding.expr[1];
                var bindingKeys = baseBinding.expr[2];
                var newValue = expr.map(function(item){
                  if (typeof item == 'number')
                  {
                    var name = bindingNames[item];
                    var value = String(bindingValues[bindingKeys[item]]);
                    if (/^l10n:/.test(name))
                      return {
                        type: 'l10n',
                        value: value,
                        l10n: name
                      };
                    else
                      return {
                        type: 'binding',
                        value: value,
                        bindingName: name
                      };
                  }

                  return {
                    type: 'static',
                    value: item
                  };
                });

                var newValueStr = newValue.map(function(item){
                  return item.value;
                }).join('');

                if (newValueStr == attr.value)
                  value = newValue;
              }
          }
        }
  }

  if (value.length == 1 && value[0].type == 'static' && !value[0].value)
    value = [];

  return {
    name: attr.name,
    childNodes: value
  };
}

module.exports = function buildNode(item, bindings, actions, selectDomNode){
  function findBinding(node){
    return basis.array.search(bindings, node, 'dom');
  }

  function findNodeBinding(node){
    return basis.array.search(bindings, true, function(binding){
      return binding.val !== binding.dom && binding.val === node;
    });
  }

  var node = item[0];
  var children = item[1];
  var properties = item[2];
  var binding;

  switch (node.nodeType)
  {
    case 1:
      var binding = findNodeBinding(node);
      var nestedView = properties.nestedView;
      var attrs;
      var inline;

      if (binding && binding.binding == 'element')
        binding = null;

      attrs = binding || nestedView
        ? basis.array(node.attributes).map(function(attr){
            return {
              name: attr.name,
              childNodes: [
                {
                  type: 'static',
                  value: attr.value
                }
              ]
            };
          })
        : basis.array(node.attributes).map(function(attr){
            return buildAttribute(attr, bindings.filter(function(bind){
              return bind.dom === node && bind.attr === attr.name;
            }), actions);
          });

      children = children.map(function(child){
        return buildNode(child, bindings, actions, selectDomNode);
      });

      inline =
        children.every(function(node){
          return node instanceof Text;
        }) &&
        children.reduce(function(res, node){
          return res + node.value.length;
        }, 0) < 32;

      return new Element({
        domNode: node,
        name: node.tagName.toLowerCase(),
        bindingName: binding ? binding.binding : null,
        childrenHidden: node.firstChild && !children.length,
        inlineChildren: inline,
        nestedView: nestedView,
        selectDomNode: nestedView ? selectDomNode : null,
        attributes: attrs,
        childNodes: children
      });

      break;
    case 3:
      binding = findBinding(node) || findNodeBinding(node);

      return new Text({
        domNode: node,
        bindingName: binding && !binding.l10n ? binding.binding : null,
        value: node.nodeValue,
        l10n: binding ? binding.l10n : false,
        nestedView: properties.nestedView,
        selectDomNode: properties.nestedView ? selectDomNode : null
      });

    case 8:
      binding = findNodeBinding(node);

      return new Comment({
        domNode: node,
        bindingName: binding ? binding.binding : null,
        value: node.nodeValue,
        nestedView: properties.nestedView,
        selectDomNode: properties.nestedView ? selectDomNode : null
      });
  }

  return '';
};
