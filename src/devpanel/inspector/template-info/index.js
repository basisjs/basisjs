var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisGroupingNode = inspectBasis.require('basis.dom.wrapper').GroupingNode;

var Expression = require('basis.data.value').Expression;
var parseDom = require('./dom-parse.js');
var buildTree = require('./dom-build-tree.js');
var getBindingsFromNode = require('./bindings.js').getBindingsFromNode;
var selectedTemplateDecl = require('./source.js').decl;
var sourceSource = require('./source.js').source;

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

selectedTemplate
  .as(function(template){
    if (this.value)
      this.value.bindingBridge.detach(this.value, this.apply, this);
    if (template)
      template.bindingBridge.attach(template, this.apply, this);
    return template;
  })
  .attach(function(template){
    selectedTemplateDecl.set(template ? template.decl_ : null);
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

selectedDomNode.attach(function(node){
  if (node)
    captureEvents.forEach(function(eventName){
      inspectBasisDomEvent.captureEvent(eventName, function(){});
    });
  else
    captureEvents.forEach(function(eventName){
      inspectBasisDomEvent.releaseEvent(eventName);
    });
});


function up(upNode){
  if (upNode && upNode.element)
    selectedDomNode.set(upNode.element);
}

// === attach data to view

var domTree = require('./view-dom.js');
var bindingView = require('./view-bindings.js');
var sourceView = require('./view-source.js');
var view = require('./view-main.js');

selectedDomNode.attach(function(node){
  if (!node)
    return domTree.clear();

  var nodes = parseDom(node);
  var templateId = nodes[0][inspectBasisTemplateMarker];
  var debugInfo = inspectBasisTemplate.getDebugInfoById(templateId) || {};
  var object = inspectBasisTemplate.resolveObjectById(templateId) || {};
  var actions = object.action || {};
  var bindings = debugInfo.bindings || [];
  var dom = buildTree(nodes, bindings, actions);

  domTree.show(JSON.stringify(dom.tree), function(id){
    selectedDomNode.set(dom.map[id]);
  });
});

selectedDomNode
  .as(getBindingsFromNode)
  .as(JSON.stringify)
  .attach(bindingView.show, bindingView);

sourceSource
  .as(JSON.stringify)
  .attach(sourceView.show, sourceView);

new Expression(
  selectedDomNode,
  selectedObject,
  selectedTemplate,
  selectedTemplateDecl,
  function(target, object, template, decl){
    var data = {
      hasTarget: Boolean(target),
      hasParent: false,
      hasOwner: false,
      hasGroup: false,
      objectClassName: null,
      objectId: null,
      objectLocation: null,
      url: template ? template.source.url : null,
      warningCount: decl && decl.warns ? decl.warns.length : 0
    };

    if (object)
    {
      data.hasParent = Boolean(object.parentNode);
      data.hasOwner = Boolean(object.owner);
      data.hasGroup = Boolean(object.groupNode);
      data.objectId = object.basisObjectId;
      data.objectClassName = object.constructor.className || '';
      data.objectLocation = inspectBasis.dev.getInfo(object, 'loc');
    }

    return data;
  })
  .as(JSON.stringify)
  .link(view, view.set);

view.api = {
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
  dropTarget: function(){
    selectedDomNode.set();
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
        declaration: selectedTemplateDecl.value || '<no info>',
        values: values
      }
    };
    console.log(global.$basisjsInfo);
  }
};

// =====

module.exports = selectedDomNode;
