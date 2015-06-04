var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisL10n = inspectBasis.require('basis.l10n');

var Node = global.Node;
var Value = require('basis.data').Value;
var colorPicker = require('./colorPicker.js');
var transport = require('../api/transport.js');
var Overlay = require('./utils/overlay.js');

var dictionaryColor = {};
function getColorForDictionary(dictionaryName){
  if (!dictionaryColor[dictionaryName])
    dictionaryColor[dictionaryName] = colorPicker.getColor().join(', ');

  return dictionaryColor[dictionaryName];
}

function loadToken(token){
  var dictionary = token.dictionary;
  var cultureList = inspectBasisL10n.getCultureList();

  var data = {
    cultureList: cultureList,
    selectedToken: token.name,
    dictionaryName: basis.path.relative('/', dictionary.resource.url)
  };

  transport.sendData('token', data);
}

var overlay = new Overlay({
  template: resource('./template/l10n/overlay.tmpl'),
  muteEvents: {
    click: true,
    mousedown: true,
    mouseup: true
  },
  handler: {
    activeChanged: function(){
      if (this.active)
        transport.sendData('startInspect', 'l10n');
      else
        transport.sendData('endInspect', 'l10n');
    }
  },

  childClass: {
    template: resource('./template/l10n/token.tmpl'),
    binding: {
      color: 'data:'
    },
    click: function(){
      var token = this.data.token;
      if (token)
      {
        this.parentNode.deactivate();
        loadToken(token);
      }
    }
  },

  processNode: function(domNode){
    function highlight(token, domNode){
      if (token instanceof inspectBasisL10n.Token && token.dictionary)
        this.highlight(domNode, {
          color: getColorForDictionary(token.dictionary.resource.url),
          token: token
        });
    }

    if (domNode.nodeType == 1)
    {
      var l10nRef = domNode.getAttribute('data-basisjs-l10n');
      if (l10nRef)
        highlight.call(this, inspectBasisL10n.token(l10nRef), domNode);
    }

    if (domNode[inspectBasisTemplateMarker])
    {
      var debugInfo = inspectBasisTemplate.getDebugInfoById(domNode[inspectBasisTemplateMarker]);
      if (debugInfo)
      {
        var bindings = debugInfo.bindings;
        for (var j = 0, binding; binding = bindings[j]; j++)
        {
          var token = binding.attachment;

          if (token instanceof inspectBasisL10n.ComputeToken)
            token = token.token;

          if (token instanceof inspectBasisL10n.Token && token.dictionary)
            highlight.call(this, token, binding.val instanceof Node ? binding.val : binding.dom);
        }
      }
    }
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
