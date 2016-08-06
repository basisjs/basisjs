var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;

var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var buildDomTree = require('./dom.js');
var getBindingsFromNode = require('./bindings.js');
var buildSourceTreeFromDecl = require('./source.js');
var dataFlow = require('../../data-flow/index.js');

var input = new Value(); // use Value since to be consistent
var selectedDomNode = new basis.Token(); // use basis.Token since we need trigger recalculations for the same value
input.link(selectedDomNode, selectedDomNode.set);

var selectedObject = selectedDomNode
  .as(function(node){
    return node ? inspectBasisTemplate.resolveObjectById(node[inspectBasisTemplateMarker]) : null;
  });

var selectedTemplate = selectedDomNode
  .as(function(node){
    var template = node ? inspectBasisTemplate.resolveTemplateById(node[inspectBasisTemplateMarker]) : null;
    if (this.value)
      this.value.bindingBridge.detach(this.value, syncSelectedNode);
    if (template)
      template.bindingBridge.attach(template, syncSelectedNode);
    return template;
  });

var selectedTemplateDecl = selectedTemplate
  .as(function(template){
    if (this.value)
      this.value.bindingBridge.detach(this.value, this.apply, this);
    if (template)
      template.bindingBridge.attach(template, this.apply, this);
    return template;
  })
  // use separate convertions because template can to not change
  // but decl change
  .as(function(template){
    return template ? template.decl_ : null;
  });

function syncSelectedNode(){
  var element = selectedObject.value && selectedObject.value.element;

  if (selectedDomNode.value === element)
    selectedDomNode.apply();
  else
    input.set(element);
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

var output = new Expression(
  selectedDomNode,
  selectedObject,
  selectedTemplate,
  selectedTemplateDecl,
  function(node, object, template, decl){
    var dom = buildDomTree(node);
    var bindings = getBindingsFromNode(node);
    var sourceTree = buildSourceTreeFromDecl(decl);

    var data = {
      domTree: dom.tree,
      bindings: bindings.list,
      source: sourceTree.source,
      sourceTree: sourceTree.tree,

      hasTarget: Boolean(node),
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

    return {
      object: object,
      template: template,
      decl: decl,
      data: data,
      setDataFlowValue: function(id){
        dataFlow.set(bindings.map[id]);
      },
      selectNodeById: function(id){
        input.set(dom.map[id]);
      }
    };
  });

module.exports = {
  input: input,
  output: output
};
