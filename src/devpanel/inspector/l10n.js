var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisL10n = inspectBasis.require('basis.l10n');

var NativeDomNode = global.Node;
var fileAPI = require('../api/file.js');
var Value = require('basis.data').Value;
var getColor = require('../module/color.js');
var transport = require('devpanel.transport');
var Overlay = require('./utils/overlay.js');
var Popup = require('basis.ui.popup').Popup;

var dictionaryColor = {};
function getColorForDictionary(dictionaryName){
  if (!dictionaryColor[dictionaryName])
    dictionaryColor[dictionaryName] = getColor().join(', ');

  return dictionaryColor[dictionaryName];
}

function tokenBinding(fn){
  fn = basis.getter(fn);
  return {
    events: 'update',
    getter: function(node){
      return node.data.token ? fn(node.data) : '';
    }
  };
}

var nodeInfoPopup = basis.fn.lazyInit(function(){
  return new Popup({
    dir: 'left bottom left top',
    template: resource('./l10n/token_hintPopup.tmpl'),
    autorotate: [
      'left top left bottom',
      'right bottom right top',
      'right top right bottom'
    ],
    binding: {
      dictionary: tokenBinding('token.dictionary.id'),
      patches: tokenBinding(function(data){
        return data.token.dictionary._data._patches;
      }),
      culture: tokenBinding('token.descriptor.culture.name'),
      path: tokenBinding('token.descriptor.name'),
      tokenLocation: tokenBinding(function(data){
        return data.descriptor.loc || data.descriptor.source;
      }),
      type: tokenBinding(function(data){
        var type = data.token.getType();
        return type != 'default' ? type : '';
      }),
      computed: tokenBinding(function(data){
        return data.token.descriptor !== data.descriptor;
      }),
      computedValue: tokenBinding(function(data){
        return data.value;
      }),
      computedKey: tokenBinding('key'),
      computedKeyValueEqual: tokenBinding(function(data){
        return data.key === data.value;
      }),
      computedType: tokenBinding(function(data){
        if (!data.computed)
          return;

        var type = data.computed.getType();
        return type != 'default' ? type : '';
      }),
      openFileSupported: {
        events: 'delegateChanged update',
        getter: function(){
          var basisjsTools = global.basisjsToolsFileSync || inspectBasis.devtools;
          return basisjsTools && typeof basisjsTools.openFile == 'function';
        }
      }
    },
    handler: {
      delegateChanged: function(){
        if (this.delegate)
          this.show(this.delegate.element);
        else
          this.hide();
      },
      hide: function(){
        this.setDelegate();
      }
    }
  });
});

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
    action: {
      showInfo: function(){
        nodeInfoPopup().setDelegate(this);
      },
      hideInfo: function(){
        nodeInfoPopup().setDelegate();
      }
    },
    click: function(){
      var descriptor = this.data.descriptor;
      if (descriptor)
      {
        this.parentNode.deactivate();

        var loc = descriptor.loc || descriptor.source;
        if (loc)
          fileAPI.openFile(loc);
      }
    }
  },

  processNode: function(domNode){
    function highlight(token, domNode){
      var key = null;
      var value = null;
      var computed = null;
      var descriptor;

      if (token instanceof inspectBasisL10n.ComputeToken)
      {
        descriptor = token.token.dictionary.getDescriptor(token.getName());
        computed = token;
        value = token.value;
        key = token.getName().split('.').pop();
        token = token.token;
      }

      if (token instanceof inspectBasisL10n.Token && token.dictionary)
        this.highlight(domNode, {
          color: getColorForDictionary(token.dictionary.resource.url),
          token: token,
          computed: computed,
          descriptor: descriptor || token.descriptor,
          value: value,
          key: key
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
          highlight.call(this, binding.attachment, binding.val instanceof NativeDomNode ? binding.val : binding.dom);
      }
    }
  }
});


//
// exports
//

module.exports = {
  name: 'Localization',
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
