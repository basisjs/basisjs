var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisGroupingNode = inspectBasis.require('basis.dom.wrapper').GroupingNode;

var fileAPI = require('../../api/file.js');
var parseDom = require('./parse-dom.js');
var buildTree = require('./build-tree.js');
var Dataset = require('basis.data').Dataset;
var Window = require('basis.ui.window').Window;
var getBindingsFromNode = require('./binding.js').getBindingsFromNode;
var sourceView = require('./source.js');
var jsSourcePopup = require('../../module/js-source-popup/index.js');
var showSource = new basis.Token(false);
var selectedDomNode = new basis.Token();
var selectedObject = selectedDomNode.as(function(node){
  return node ? inspectBasisTemplate.resolveObjectById(node[inspectBasisTemplateMarker]) : null;
});
var selectedTemplate = selectedDomNode.as(function(node){
  var template = node ? inspectBasisTemplate.resolveTemplateById(node[inspectBasisTemplateMarker]) : null;
  if (this.value)
    this.value.bindingBridge.detach(this.value, syncSelectedNode);
  if (template)
    template.bindingBridge.attach(template, syncSelectedNode);
  return template;
});
var bindingDataset = new Dataset();

selectedDomNode
  .as(getBindingsFromNode)
  .attach(bindingDataset.set, bindingDataset);

selectedTemplate
  .as(function(template){
    if (this.value)
      this.value.bindingBridge.detach(this.value, this.apply, this);
    if (template)
      template.bindingBridge.attach(template, this.apply, this);
    return template;
  })
  .attach(function(template){
    sourceView.decl.set(template ? template.decl_ : null);
  });

function syncSelectedNode(){
  var element = selectedObject.value && selectedObject.value.element;

  if (selectedDomNode.value === element)
    selectedDomNode.apply();
  else
    selectedDomNode.set(element);
}

// dom mutation observer
var observer = (function(){
  var names = ['MutationObserver', 'WebKitMutationObserver'];

  for (var i = 0, name; name = names[i]; i++)
  {
    var ObserverClass = global[name];
    if (typeof ObserverClass == 'function')
      return new ObserverClass(syncSelectedNode);
  }

  // fallback for case if MutationObserver doesn't support
  setInterval(syncSelectedNode, 100);
})();

selectedDomNode.attach(function(node){
  if (observer)
    observer.disconnect();

  if (observer && node)
    observer.observe(node, {
      subtree: true,
      attributes: true,
      characterData: true,
      childList: true
    });
});

selectedDomNode.attach(function(node){
  if (!node)
    return view.clear();

  var nodes = parseDom(node);
  var templateId = nodes[0][inspectBasisTemplateMarker];
  var debugInfo = inspectBasisTemplate.getDebugInfoById(templateId) || {};
  var object = inspectBasisTemplate.resolveObjectById(templateId) || {};
  var actions = object.action || {};
  var bindings = debugInfo.bindings || [];

  view.setChildNodes(buildTree(nodes, bindings, actions, function(node){
    selectedDomNode.set(node);
  }));
});

var captureEvents = [
  'click',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseenter',
  'mouseleave'
];

function up(upNode){
  if (upNode && upNode.element)
    selectedDomNode.set(upNode.element);
}

var view = new Window({
  modal: true,
  visible: selectedDomNode.as(Boolean),
  template: resource('./template/window.tmpl'),
  binding: {
    hasParent: selectedObject.as(function(object){
      return Boolean(object && object.parentNode);
    }),
    hasOwner: selectedObject.as(function(object){
      return Boolean(object && object.owner);
    }),
    hasGroup: selectedObject.as(function(object){
      return Boolean(object && object.groupNode);
    }),
    sourceTitle: selectedTemplate.as(function(template){
      if (template)
        return template.source.url || '[inline]';
    }),
    isFile: selectedTemplate.as(function(template){
      if (template)
        return Boolean(template.source.url);
    }),
    warningCount: sourceView.decl.as(function(decl){
      return decl && decl.warns ? decl.warns.length : 0;
    }),
    objectClassName: selectedObject.as(function(object){
      if (object)
        return object.constructor.className || '';
    }),
    objectId: selectedObject.as(function(object){
      if (object)
        return object.basisObjectId;
    }),
    objectLocation: selectedObject.as(function(object){
      return inspectBasis.dev.getInfo(object, 'loc');
    }),
    source: sourceView,
    showSource: showSource,
    bindings: 'satellite:'
  },
  action: {
    upParent: function(){
      var object = selectedObject.value;
      if (object && object.parentNode)
      {
        var upNode = object.parentNode;

        if (upNode instanceof inspectBasisGroupingNode)
          upNode = upNode.owner;

        up(upNode);
      }
    },
    upOwner: function(){
      var object = selectedObject.value;
      if (object && object.owner)
        up(object.owner);
    },
    upGroup: function(){
      var object = selectedObject.value;
      if (object && object.groupNode)
        up(object.groupNode);
    },
    close: function(){
      selectedDomNode.set();
    },
    openSource: function(){
      var template = selectedTemplate.value;
      if (template && template.source.url)
        fileAPI.openFile(template.source.url);
    },
    openObjectLocation: function(){
      var loc = inspectBasis.dev.getInfo(selectedObject.value, 'loc');
      if (loc)
        fileAPI.openFile(loc);
    },
    enterObjectLocation: function(e){
      var loc = inspectBasis.dev.getInfo(selectedObject.value, 'loc');
      if (loc)
      {
        jsSourcePopup.loc.set(loc);
        jsSourcePopup.show(e.actionTarget);
      }
    },
    leaveObjectLocation: function(){
      jsSourcePopup.hide();
    },
    toggleSource: function(){
      showSource.set(!showSource.value);
    },
    logInfo: function(){
      var object = selectedObject.value;
      var debugInfo = null;
      var values = null;

      if (selectedDomNode.value)
      {
        var id = selectedDomNode.value[inspectBasisTemplateMarker];
        var objectBinding = object ? object.binding : {};

        debugInfo = inspectBasisTemplate.getDebugInfoById(id);

        if (debugInfo)
          values = debugInfo.values || null;

        if (values)
          values = basis.object.slice(values, basis.object.keys(objectBinding));
      }

      global.$basisjsInfo = {
        object: object,
        template: {
          debugInfo: debugInfo,
          declaration: sourceView.decl.value || '<no info>',
          values: values
        }
      };
      console.log(global.$basisjsInfo);
    }
  },

  satellite: {
    bindings: {
      dataSource: bindingDataset,
      instance: resource('./binding-list.js')
    }
  },

  realign: function(){},
  setZIndex: function(){},
  init: function(){
    Window.prototype.init.call(this);
    this.dde.fixLeft = false;
    this.dde.fixTop = false;
  },

  handler: {
    open: function(){
      captureEvents.forEach(function(eventName){
        inspectBasisDomEvent.captureEvent(eventName, function(){});
      });
    },
    close: function(){
      captureEvents.forEach(function(eventName){
        inspectBasisDomEvent.releaseEvent(eventName);
      });
    }
  }
});

module.exports = selectedDomNode;
