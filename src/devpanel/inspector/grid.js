var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisConfig = inspectBasis.config.devpanel;
var Value = require('basis.data').Value;
var Overlay = require('./utils/overlay.js');
var getComputedStyle = require('basis.dom.computedStyle').get;
var getBaseline = require('./utils/baseline.js');
var gridSize;

if (inspectBasisConfig)
  gridSize = inspectBasisConfig.grid;

var overlay = new Overlay({
  processTextLines: true,

  template: resource('./template/grid/overlay.tmpl'),
  binding: {
    gridSize: function(){
      return gridSize;
    },
    doubleGridSize: function(){
      return gridSize * 2;
    }
  },

  childClass: {
    template: resource('./template/grid/token.tmpl'),
    binding: {
      miss: {
        events: 'update',
        getter: function(node){
          return Boolean((node.data.bottom - node.data.baseline) % gridSize);
        }
      },
      top: {
        events: 'update',
        getter: function(node){
          return node.data.bottom - node.data.baseline;
        }
      }
    }
  },

  processNode: function(domNode){
    if (domNode.nodeType == 3)
      this.highlight(domNode, {
        baseline: getBaseline(domNode)
      });

    if (domNode.nodeType == 1 && domNode.tagName == 'INPUT' && domNode.type != 'file')
      this.highlight(domNode, {
        baseline: getBaseline(domNode)
          + parseInt(getComputedStyle(domNode, 'padding-bottom'))
          //+ parseInt(getComputedStyle(domNode, 'border-bottom-width'))
      });
  }
});


//
// exports
//

module.exports = {
  startInspect: function(){
    overlay.activate();
  },
  endInspect: function(){
    overlay.deactivate();
  },
  inspectMode: Value.from(overlay, 'activeChanged', 'active'),
  isActive: function(){
    return overlay.active;
  }
};
