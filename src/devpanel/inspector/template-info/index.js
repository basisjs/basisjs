var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');
var inspectBasisGroupingNode = inspectBasis.require('basis.dom.wrapper').GroupingNode;

var data = require('./data/index.js');
var view = require('./view/index.js');

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

data.input.attach(function(node){
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
    data.input.set(upNode.element);
}

// === attach data to view

view.api = {
  select: function(){},
  upParent: function(){
    var object = data.output.value.object;
    if (object && object.parentNode)
    {
      var upNode = object.parentNode;

      if (upNode instanceof inspectBasisGroupingNode)
        upNode = upNode.owner;

      up(upNode);
    }
  },
  upOwner: function(){
    var object = data.output.value.object;
    if (object && object.owner)
      up(object.owner);
  },
  upGroup: function(){
    var object = data.output.value.object;
    if (object && object.groupNode)
      up(object.groupNode);
  },
  dropTarget: function(){
    data.input.set();
  },
  logInfo: function(){
    var object = data.output.value.object;
    var debugInfo = null;
    var values = null;

    if (data.input.value)
    {
      var id = data.input.value[inspectBasisTemplateMarker];
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
        declaration: data.output.value.decl || '<no info>',
        values: values
      }
    };
    console.log(global.$basisjsInfo);
  }
};

data.output
  .link(null, function(output){
    view.api.select = output.selectNodeById;
    view.set(JSON.stringify(output.data));
  });

// =====

module.exports = data.input;
