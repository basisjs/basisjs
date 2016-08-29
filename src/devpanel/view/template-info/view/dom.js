var Node = require('basis.ui').Node;
var templateSwitcher = require('basis.template').switcher;
var hoveredBinding = require('./bindings.js').hover;
var jsSourcePopup = resource('./js-source-popup.js');
var templateApi = require('../api.js');
var fileApi = require('api').ns('file');
var SINGLETON = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source'];
var NodeClassByType = {};

function childFactory(config){
  var ChildClass = NodeClassByType[config.type] || this.childClass;

  return new ChildClass(config);
}

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
        templateApi.setSourceFragment(this.loc);
        jsSourcePopup().show(this.element);
      }
    },
    leave: function(){
      hoveredBinding.set();
      jsSourcePopup().hide();
    },
    inspect: function(){
      if (this.nestedView && this.domNode)
      {
        hoveredBinding.set();
        templateApi.select(this.domNode);
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
      ? resource('./dom/attribute-value-static.tmpl')
      : resource('./dom/attribute-value.tmpl');
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
        fileApi.open(this.loc);
    }
  }
});

var Attribute = DOMNode.subclass({
  template: resource('./dom/attritube.tmpl'),
  binding: {
    name: 'name'
  },
  childClass: ValuePart
});

NodeClassByType.element = DOMNode.subclass({
  template: resource('./dom/element.tmpl'),
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
  childFactory: childFactory,
  satellite: {
    attributes: {
      instance: Node.subclass({
        template: resource('./dom/attritubes.tmpl'),
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

NodeClassByType.text = DOMNode.subclass({
  template: resource('./dom/text.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName',
    l10n: 'l10n',
    nestedView: 'nestedView'
  }
});

NodeClassByType.comment = DOMNode.subclass({
  template: resource('./dom/comment.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName',
    nestedView: 'nestedView'
  }
});

module.exports = Node.subclass({
  autoDelegate: true,
  childFactory: childFactory,
  handler: {
    update: function(sender, delta){
      if ('domTree' in delta)
        this.setChildNodes(this.data.domTree);
    }
  }
});
