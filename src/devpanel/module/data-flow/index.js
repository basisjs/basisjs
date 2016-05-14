var Node = require('basis.ui').Node;
var jsSourcePopup = require('../js-source-popup/index.js');
var createEvent = require('basis.event').create;
var getBoundingRect = require('basis.layout').getBoundingRect;
var resize = require('basis.dom.resize');
var jsSourceTimer;

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

      if (value && value.bindingBridge)
      {
        value = value.bindingBridge.get(value);

        if (value && value.constructor.className)
          return '[object ' + value.constructor.className + ']';
      }

      switch (value && value.constructor === String ? 'string' : typeof value) {
        case 'string':
          return '\"' + escapeString(value) + '\"';
        case 'object':
          if (value)
            return '{ .. }';
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
        jsSourceTimer = setTimeout(function(){
          jsSourcePopup.show(e.actionTarget);
        }, 150);
      }
    },
    leaveLoc: function(){
      clearTimeout(jsSourceTimer);
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
  className: 'SetFlowNode',
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

function addConnection(buffer, fromBox, toBox, breakPoint){
  if (fromBox && toBox)
    buffer.push({
      data: {
        fromX: fromBox.left + fromBox.width / 2,
        fromY: fromBox.bottom,
        breakPoint: breakPoint ? breakPoint.top : false,
        toX: toBox.left + toBox.width / 2,
        toY: toBox.top
      }
    });
}

function getNodeBox(type, node, relElement){
  return getBoundingRect(node.tmpl[type] || node.element, relElement);
}

function collectConnections(node, toBox, breakPoint, relElement, result){
  if (node instanceof Flow)
  {
    var breakPoint;
    for (var fromBox, cursor = node.lastChild; cursor; cursor = cursor.previousSibling)
    {
      if (cursor instanceof FlowSplit)
      {
        breakPoint = getBoundingRect(cursor.nextSibling.element, relElement);
        collectConnections(cursor, toBox, breakPoint, relElement, result);
      }
      else
      {
        fromBox = getNodeBox('outPoint', cursor, relElement);
        addConnection(result, fromBox, toBox, breakPoint);
        toBox = getNodeBox('inPoint', cursor, relElement);
        breakPoint = null;
      }
    }
  }
  else
  {
    for (var cursor = node.firstChild; cursor; cursor = cursor.nextSibling)
      collectConnections(cursor, toBox, breakPoint, relElement, result);
  }

  return result;
}

var flows = [];
setInterval(function(){
  flows.forEach(function(flow){
    flow.updateInDocument();
  });
}, 150);

var FlowView = Flow.subclass({
  className: 'FlowView',

  template: resource('./template/view.tmpl'),
  binding: {
    connectors: 'satellite:'
  },

  inDocument: false,
  emit_inDocumentChanged: createEvent('inDocumentChanged'),
  updateInDocument: function(){
    var inDocument = document.documentElement.contains(this.element);
    if (inDocument != this.inDocument)
    {
      this.inDocument = inDocument;
      this.emit_inDocumentChanged();
    }
  },

  init: function(){
    Flow.prototype.init.call(this);
    flows.push(this);
  },
  postInit: function(){
    Flow.prototype.postInit.call(this);
    this.updateInDocument();
  },
  destroy: function(){
    Flow.prototype.destroy.call(this);
    basis.array.remove(flows, this);
  },

  satellite: {
    connectors: Node.subclass({
      template: resource('./template/connectors.tmpl'),
      childClass: {
        template: resource('./template/connector.tmpl'),
        binding: {
          fromX: 'data:',
          fromY: 'data:',
          break: {
            events: 'update',
            getter: function(node){
              if (node.data.breakPoint === false || node.data.fromX === node.data.toX)
                return '';

              var offset = Math.min((node.data.fromX - node.data.toX) / 2, 20);
              return (
                ' Q ' +
                  [node.data.fromX, node.data.breakPoint] + ' ' +
                  [node.data.fromX - offset, node.data.breakPoint] + ' ' +
                ' H ' + (node.data.toX + offset) + ' ' +
                ' Q ' +
                  [node.data.toX, node.data.breakPoint] + ' ' +
                  [node.data.toX, node.data.breakPoint + offset] + ' '
              );
            }
          },
          toX: 'data:',
          toY: 'data:'
        }
      },
      handler: {
        ownerChanged: function(){
          this.updateConnectors();
        }
      },
      listen: {
        owner: {
          inDocumentChanged: function(){
            this.updateConnectors();
          },
          childNodesModified: function(){
            this.updateConnectors();
          }
        }
      },
      updateConnectors: function(){
        this.setChildNodes(this.owner && this.owner.inDocument ? collectConnections(this.owner, null, null, this.element, []) : []);
      }
    })
  }
});

FlowView.createTreeBuilder = require('./build-tree.js');

module.exports = FlowView;
