var fileAPI = require('../../api/file.js');
var Node = require('basis.ui').Node;
var SINGLETON = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source'];
var hoveredBinding = require('./view-bindings.js').hover;
var jsSourcePopup = require('../../module/js-source-popup/index.js');
var templateSwitcher = require('basis.template').switcher;
var NodeClassByType = {};

function childFactory(config){
  var ChildClass = NodeClassByType[config.type] || this.childClass;

  return new ChildClass(basis.object.merge(config, {
    selectDomNode: this.selectDomNode
  }));
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
        jsSourcePopup.loc.set(this.loc);
        jsSourcePopup.show(this.element);
      }
    },
    leave: function(){
      hoveredBinding.set();
      jsSourcePopup.hide();
    },
    inspect: function(){
      if (this.nestedView && this.domNode)
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

NodeClassByType.element = DOMNode.subclass({
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
  childFactory: childFactory,
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

NodeClassByType.text = DOMNode.subclass({
  template: resource('./template/tree/text.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName',
    l10n: 'l10n',
    nestedView: 'nestedView'
  }
});

NodeClassByType.comment = DOMNode.subclass({
  template: resource('./template/tree/comment.tmpl'),
  binding: {
    value: 'value',
    binding: 'bindingName',
    nestedView: 'nestedView'
  }
});

module.exports = new Node({
  autoDelegate: true,
  handler: {
    update: function(sender, delta){
      if ('domTree' in delta)
        this.setChildNodes(this.data.domTree);
    }
  },
  childFactory: childFactory,
  selectDomNode: function(id){
    module.exports.owner.api.select(id);
  }
});
