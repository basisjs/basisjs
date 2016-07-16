var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisConfig = inspectBasis.config.devpanel;
var Value = require('basis.data').Value;
var Overlay = require('./utils/overlay.js');
var getOffset = require('basis.layout').getOffset;
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
      settings: {
        events: 'update',
        getter: function(node){
          return [node.data.gridOffset, node.data.gridSize];
        }
      },
      miss: {
        events: 'update',
        getter: function(node){
          return Boolean((node.data.bottom - node.data.baseline - node.data.gridOffset) % node.data.gridSize);
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

  getInitialContext: function(){
    return {
      offset: 0,
      size: inspectBasisConfig.grid
    };
  },
  getContext: function(domNode, context){
    if (!domNode.hasAttribute('basis-devpanel-grid'))
      return context;

    var settings = domNode.getAttribute('basis-devpanel-grid');
    var offset = 0;

    if (settings == 'ignore')
      return;

    if (/^reset\s*/.test(settings))
    {
      settings = settings.replace(/^reset\s*/, '');
      offset = getOffset(domNode).top;
    }

    var nums = settings.match(/^(\d+)(?:\s+(\d+))?$/);

    if (!nums)
    {
      if (domNode.warnGridSettings_ != settings)
      {
        domNode.warnGridSettings_ = settings;
        console.warn('Wrong grid settings: "' + settings + '"', domNode);
      }

      return context;
    }
    else
    {
      if (!nums[2])
        nums = [0, 0, nums[1]];

      return {
        offset: Number(nums[1]) || offset,
        size: Number(nums[2])
      };
    }
  },

  processNode: function(domNode, context){
    if (domNode.nodeType == 3)
      this.highlight(domNode, {
        gridOffset: context.offset,
        gridSize: context.size,
        baseline: getBaseline(domNode)
      });

    if (domNode.nodeType == 1 && domNode.tagName == 'INPUT' && domNode.type != 'file')
      this.highlight(domNode, {
        gridOffset: context.offset,
        gridSize: context.size,
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
  name: 'Grid',
  startInspect: function(){
    overlay.activate();
  },
  stopInspect: function(){
    overlay.deactivate();
  },
  inspectMode: Value.from(overlay, 'activeChanged', 'active'),
  isActive: function(){
    return overlay.active;
  }
};
