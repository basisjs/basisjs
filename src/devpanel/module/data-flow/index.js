var Node = require('basis.ui').Node;
var jsSourcePopup = require('../js-source-popup/index.js');

function escapeString(value){
  return value
    .replace(/'/g, '\\\'')
    .replace(/\t/, '\\\t')
    .replace(/\r/, '\\\r')
    .replace(/\n/, '\\\n');
}

var FlowNode = Node.subclass({
  className: 'FlowNode',
  template: resource('./template/node.tmpl'),
  binding: {
    type: 'type',
    isSource: 'source',
    initial: 'initial',
    events: 'events',
    marker: 'marker',
    loc: 'loc',
    fn: 'transform',
    fnLoc: 'transformLoc',
    className: function(node){
      var value = node.value;

      if (value && typeof value == 'object' && value.constructor)
        return value.constructor.className || '';

      return '';
    },
    id: function(node){
      var value = node.value;

      return (value && value.basisObjectId) || '';
    },
    value: function(node){
      var value = node.value;

      switch (typeof value) {
        case 'string':
          return '\"' + escapeString(value) + '\"';
        case 'object':
          if (value)
          {
            if (value.bindingBridge)
              return value.bindingBridge.get(value);
            return '{ .. }';
          }
        default:
          return String(value);
      }
    }
  },
  action: {
    open: function(){
      this.open(this.loc);
    },
    openFunctionLocation: function(){
      this.open(this.transformLoc);
    },
    enterLoc: function(e){
      if (this.loc)
      {
        jsSourcePopup.loc.set(this.loc);
        jsSourcePopup.show(e.actionTarget);
      }
    },
    leaveLoc: function(){
      jsSourcePopup.hide();
    },
  },
  open: function(loc){
    if (loc)
    {
      var cursor = this;

      while (cursor && !cursor.fileAPI)
        cursor = cursor.parentNode;

      if (cursor && cursor.fileAPI)
        cursor.fileAPI.openFile(loc);
    }
  }
});

var SetFlowNode = FlowNode.subclass({
  template: resource('./template/set.tmpl'),
  binding: {
    value: function(node){
      return '{ ' + node.value.itemCount + (node.value.itemCount > 1 ? ' items' : ' item') + ' }';
    },
    hasMoreItems: function(node){
      return Math.max(0, node.value ? node.value.itemCount - 2 : 0);
    }
  },
  childClass: {
    template: resource('./template/set-item.tmpl'),
    binding: {
      className: function(node){
        var object = node.data.object;

        if (object && typeof object == 'object' && object.constructor)
          return object.constructor.className || '';

        return '';
      },
      id: function(node){
        var object = node.data.object;

        return (object && object.basisObjectId) || '';
      }
    }
  },
  init: function(){
    FlowNode.prototype.init.call(this);

    this.setChildNodes(this.value.top(2).map(function(object){
      return {
        data: {
          object: object
        }
      };
    }));
  }
});

var Flow = Node.subclass({
  className: 'Flow',
  template: resource('./template/flow.tmpl'),
  childFactory: function(config){
    var ChildClass = childClassByType[config.nodeType] || FlowNode;
    return new ChildClass(config);
  }
});

var FlowSplit = Node.subclass({
  className: 'FlowSplit',
  template: resource('./template/split.tmpl'),
  childClass: Flow
});

var childClassByType = {
  split: FlowSplit,
  set: SetFlowNode
};

Flow.buildTree = require('./build-tree.js');

module.exports = Flow;
