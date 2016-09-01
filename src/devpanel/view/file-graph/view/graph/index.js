var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var Slider = require('basis.ui.slider').Slider;
var Balloon = require('basis.ui.popup').Balloon;
var File = require('type').AppFile;
var FileLink = require('type').AppFileLink;
var Viva = require('./vivagraph.js');

var fileInfoPopup = new Balloon({
  template: resource('./template/popup.tmpl'),
  binding: {
    filename: 'data:',
    name: 'data:',
    parent: 'data:'
  },

  dir: 'center top center bottom',
  autorotate: true,
  handler: {
    delegateChanged: function(){
      if (this.delegate)
        this.show(this.delegate.element);
      else
        this.hide();
    }
  }
});

function coord(name){
  return function(node){
    return node[name] && node[name].toFixed(2);
  };
}

var GraphNode = Node.subclass({
  matched: false,

  template: resource('./template/node.tmpl'),
  binding: {
    x: coord('x'),
    y: coord('y'),
    type: 'data:',
    hasSelected: Value.query('parentNode.selection.itemCount').as(Boolean),
    matched: Value.query(File.matched, 'dataset')
      .pipe('itemsChanged', function(dataset){
        return basis.array((dataset || File.all).getItems());
      })
      .compute(function(node, matched){
        return matched.indexOf(node.target) !== -1;
      })
  },
  action: {
    hover: function(){
      fileInfoPopup.setDelegate(this);
    },
    unhover: function(){
      fileInfoPopup.setDelegate();
    }
  },

  updatePos: function(pos){
    this.x = pos.x;
    this.y = pos.y;
    this.updateBind('x');
    this.updateBind('y');
  }
});

var GraphLink = Node.subclass({
  template: resource('./template/link.tmpl'),
  binding: {
    x1: coord('x1'),
    y1: coord('y1'),
    x2: coord('x2'),
    y2: coord('y2'),
  },
  updatePos: function(pos1, pos2){
    this.x1 = pos1.x;
    this.y1 = pos1.y;
    this.x2 = pos2.x;
    this.y2 = pos2.y;
    this.updateBind('x1');
    this.updateBind('y1');
    this.updateBind('x2');
    this.updateBind('y2');
  }
});

var svgBase = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
var svgGraphics = new Node({
  initialScale: .45,
  actualScale: 1,
  offsetX: 0,
  offsetY: 0,

  template: resource('./template/graph.tmpl'),
  binding: {
    matrix: function(node){
      return 'matrix(' + [
        node.actualScale, 0, 0,
        node.actualScale, node.offsetX, node.offsetY
      ] + ')';
    }
  },
  action: {
    resetSelection: function(){
      this.selection.clear();
    }
  },

  init: function(){
    Node.prototype.init.call(this);
    this.init = function(){}; // otherwise Viva graph doesn't work
  },

  handler: {
    ownerChanged: function(){
      basis.nextTick(function(){
        renderer.reset();
      });
    }
  },

  selection: {
    multiple: true
  },
  grouping: {
    rule: function(node){
      return node instanceof GraphNode;
    },
    sorting: 'data.id',
    childClass: {
      template: '<svg:g/>'
    }
  },

  childFactory: function(config){
    var Class = config.delegate.data.filename ? GraphNode : GraphLink;
    return new Class(config);
  },

  //
  // node
  //
  node: function(graphNode){
    return this.appendChild(File.getSlot(graphNode.id));
  },
  initNode: function(){},
  updateNodePosition: function(node, pos){
    node.updatePos(pos);
  },
  releaseNode: function(node){
    node.destroy();
  },

  //
  // link
  //
  link: function(graphNode){
    return this.appendChild(FileLink.getSlot({
      from: graphNode.fromId,
      to: graphNode.toId
    }));
  },
  initLink: function(){},
  updateLinkPosition: function(node, fromPos, toPos){
    node.updatePos(fromPos, toPos);
  },
  releaseLink: function(node){
    node.destroy();
  },

  //
  // transformation
  //

  updateTransform: function(){
    this.updateBind('matrix');
  },

  // Sets translate operation that should be applied to all nodes and links.
  graphCenterChanged: function(x, y){
    this.offsetX = x;
    this.offsetY = y;
    this.updateTransform();
  },

  // Default input manager listens to DOM events to process nodes drag-n-drop
  inputManager: function(){
    return {
      bindDragNDrop: function(node, handlers){
        if (handlers)
        {
          var events = Viva.Graph.Utils.dragndrop(node.ui.element);

          ['onStart', 'onDrag', 'onStop'].forEach(function(name){
            if (typeof handlers[name] === 'function')
              events[name](handlers[name]);
          });

          node.events = events;
        }
        else if (node.events)
        { // TODO: i'm not sure if this is required in JS world...
          node.events.release();
          node.events = null;
        }
      }
    };
  },

  translateRel: function(dx, dy){
    var p = svgBase.createSVGPoint();
    var t = this.tmpl.transformElement.getCTM();
    var origin = svgBase.createSVGPoint().matrixTransform(t.inverse());

    p.x = dx;
    p.y = dy;

    p = p.matrixTransform(t.inverse());
    p.x = (p.x - origin.x) * t.a;
    p.y = (p.y - origin.y) * t.d;

    t.e += p.x;
    t.f += p.y;

    this.actualScale = t.a;
    this.offsetX = t.e;
    this.offsetY = t.f;

    this.updateTransform();
  },

  scale: function(scaleFactor, scrollPoint){
    var p = svgBase.createSVGPoint();
    p.x = scrollPoint.x;
    p.y = scrollPoint.y;

    p = p.matrixTransform(this.tmpl.transformElement.getCTM().inverse()); // translate to svg coordinates

    // Compute new scale matrix in current mouse position
    var t = this.tmpl.transformElement
      .getCTM()
      .multiply(
        svgBase
          .createSVGMatrix()
          .translate(p.x, p.y)
          .scale(scaleFactor)
          .translate(-p.x, -p.y)
      );

    this.actualScale = t.a;
    this.offsetX = t.e;
    this.offsetY = t.f;

    this.updateTransform();

    return this.actualScale;
  },

  resetScale: function(){
    this.actualScale = this.initialScale;
    this.offsetX = 0;
    this.offsetY = 0;

    this.updateTransform();
  },

  beginRender: function(){},
  endRender: function(){}
});

var graph = Viva.Graph.graph();
var renderer = Viva.Graph.View.renderer(graph, {
  container: svgGraphics.element,
  graphics: svgGraphics,
  prerender: 50
});
renderer.run();

var speedSlider = new Slider({
  template: resource('./template/slider.tmpl'),
  max: 100,
  step: 10,
  value: 30
});

// sync links & nodes with graph
(function(){
  var links = FileLink.all.getValues(function(link){
    return [link.data.from, link.data.to];
  });

  File.all.addHandler({
    itemsChanged: function(dataset, delta){
      if (delta.deleted)
        delta.deleted.forEach(function(file){
          graph.removeNode(file.getId());
        });
    }
  });

  FileLink.all.addHandler({
    itemsChanged: function(dataset, delta){
      if (delta.inserted)
        delta.inserted.forEach(function(link){
          return links.push([link.data.from, link.data.to]);
        });

      if (delta.deleted)
        delta.deleted.forEach(function(link){
          graph.removeLink(link.data.from, link.data.to);
        });
    }
  });

  (function popNode(){
    if (links.length)
    {
      var link;
      while (link = links.shift())
      {
        var fileLink = FileLink.get({
          from: link[0],
          to: link[1]
        });
        if (fileLink)
        {
          graph.addLink.apply(graph, link);
          break;
        }
      }
    }
    setTimeout(popNode, speedSlider.value);
  })();
})();

module.exports = new Node({
  template: resource('./template/view.tmpl'),
  binding: {
    graph: svgGraphics,
    speedSlider: speedSlider
  }
});
