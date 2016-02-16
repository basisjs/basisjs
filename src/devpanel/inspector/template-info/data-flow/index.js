var Node = require('basis.ui').Node;

function escapeString(value){
  return value
    .replace(/'/g, '\\\'')
    .replace(/\t/, '\\\t')
    .replace(/\r/, '\\\r')
    .replace(/\n/, '\\\n');
}

var FlowNode = Node.subclass({
  template: resource('./template/node.tmpl'),
  binding: {
    type: 'type',
    isSource: 'source',
    initial: 'initial',
    events: 'events',
    marker: 'marker',
    loc: 'loc',
    className: function(node){
      var value = node.value;

      if (value && typeof value == 'object' && value.constructor)
        return value.constructor.className || '';

      return '';
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
    },
    fn: 'transform'
  },
  action: {
    open: function(){
      if (this.loc)
        this.parentNode.fileAPI.openFile(this.loc);
    }
  }
});

var Flow = Node.subclass({
  template: resource('./template/flow.tmpl'),
  childFactory: function(config){
    var ChildClass = config.split ? FlowSplit : FlowNode;
    return new ChildClass(config);
  }
});

var FlowSplit = Node.subclass({
  template: resource('./template/split.tmpl'),
  childClass: Flow
});

Flow.buildTree = require('./build-tree.js');

module.exports = Flow;
