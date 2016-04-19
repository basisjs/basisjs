var Node = require('basis.ui').Node;

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
    className: function(node){
      var host = node.host || node.value;

      if (host && typeof host == 'object' && host.constructor)
        return host.constructor.className || '';

      return '';
    },
    id: function(node){
      var host = node.host || node.value;

      return (host && host.basisObjectId) || '';
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
      if (this.loc)
      {
        var cursor = this;

        while (cursor && !cursor.fileAPI)
          cursor = cursor.parentNode;

        if (cursor && cursor.fileAPI)
          cursor.fileAPI.openFile(this.loc);
      }
    }
  }
});

var DatasetFlowNode = FlowNode.subclass({
  binding: {
    value: function(node){
      return '{ ' + node.value.itemCount + (node.value.itemCount > 1 ? ' items' : ' item') + ' }';
    }
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
  dataset: DatasetFlowNode
};

Flow.buildTree = require('./build-tree.js');

module.exports = Flow;
