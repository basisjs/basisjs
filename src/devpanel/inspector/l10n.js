var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisL10n = inspectBasis.require('basis.l10n');

var NativeDomNode = global.Node;
var fileAPI = require('../api/file.js');
var Value = require('basis.data').Value;
var colorPicker = require('./colorPicker.js');
var transport = require('../api/transport.js');
var Overlay = require('./utils/overlay.js');
var Balloon = require('basis.ui.popup').Balloon;

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

function tokenBinding(fn){
  fn = basis.getter(fn);
  return {
    events: 'update',
    getter: function(node){
      return node.data.token ? fn(node.data.token) : '';
    }
  };
}

var nodeInfoPopup = basis.fn.lazyInit(function(){
  return new Balloon({
    dir: 'left bottom left top',
    template: resource('./l10n/token_hintPopup.tmpl'),
    autorotate: [
      'left top left bottom',
      'right bottom right top',
      'right top right bottom'
    ],
    binding: {
      dictionary: tokenBinding('dictionary.id'),
      culture: tokenBinding('descriptor.culture.name'),
      path: tokenBinding('descriptor.name'),
      tokenLocation: tokenBinding(function(token){
        return token.descriptor.loc || token.descriptor.source;
      }),
      type: tokenBinding(function(token){
        var type = token.getType();
        return type != 'default' ? type : '';
      }),
      openFileSupported: {
        events: 'delegateChanged update',
        getter: function(){
          var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;
          return basisjsTools && typeof basisjsTools.openFile == 'function';
        }
      }
    },
    handler: {
      delegateChanged: function(){
        if (this.delegate)
        {
          console.log(this.data.token);
          this.show(this.delegate.element);
        }
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
      var token = this.data.token;
      if (token)
      {
        this.parentNode.deactivate();

        var loc = token.descriptor.loc || token.descriptor.source;
        if (loc)
          fileAPI.openFile(loc);
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
            highlight.call(this, token, binding.val instanceof NativeDomNode ? binding.val : binding.dom);
        }
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
