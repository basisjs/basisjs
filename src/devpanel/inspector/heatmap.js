var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;

var Node = global.Node;
var Value = require('basis.data').Value;
var Overlay = require('./utils/overlay.js');
var children = new basis.Token();
var maxUpdates = require('basis.data.index')
  .max(children, 'update', 'data.updates')
  .deferred();

var overlay = new Overlay({
  template: resource('./template/heatmap/overlay.tmpl'),

  childClass: {
    template: resource('./template/heatmap/token.tmpl'),
    binding: {
      updates: {
        events: 'update',
        getter: function(node){
          return node.data.updates > 1 ? node.data.updates : '';
        }
      },
      bgColor: maxUpdates.compute('update', function(node, max){
        var temp = max != 1 ? 1 - ((node.data.updates - 1) / (max - 1)) : 1;
        return [255 - parseInt(128 * temp), parseInt(temp * 255), 0].join(',');
      }),
      borderColor: maxUpdates.compute('update', function(node, max){
        var temp = max != 1 ? 1 - ((node.data.updates - 1) / (max - 1)) : 1;
        return [200 - parseInt(128 * temp), parseInt(temp * 200), 0].join(',');
      })
    }
  },

  processNode: function(domNode){
    if (domNode[inspectBasisTemplateMarker])
    {
      var debugInfo = inspectBasisTemplate.getDebugInfoById(domNode[inspectBasisTemplateMarker]);
      if (debugInfo)
      {
        var bindings = debugInfo.bindings;
        for (var j = 0, binding; binding = bindings[j]; j++)
          if (binding.updates)
            this.highlight(binding.val instanceof Node ? binding.val : binding.dom, {
              updates: binding.updates
            });
      }
    }
  }
});

children.set(overlay.getChildNodesDataset());

//
// exports
//

module.exports = {
  name: 'Heat map',
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
