var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var Expression = require('basis.data.value').Expression;
var remoteInspectors = require('../../basisjs-tools-sync.js').remoteInspectors;

var View = require('./view/index.js');
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'), data, inspectBasis)
  .channel(data.output.as(basis.getter('data')));

// view
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
var blockEvents = function(node){
  if (node)
    captureEvents.forEach(function(eventName){
      inspectBasisDomEvent.captureEvent(eventName, function(){});
    });
  else
    captureEvents.forEach(function(eventName){
      inspectBasisDomEvent.releaseEvent(eventName);
    });
};

new Expression(data.input, remoteInspectors, function(input, inspectors){
  return input && !inspectors;
})
  .as(function(showView){
    return showView ? new View() : null;
  })
  .link(null, function(view, oldView){
    if (view)
    {
      data.input.attach(blockEvents);
    }
    else if (oldView)
    {
      data.input.detach(blockEvents);
      oldView.destroy();
    }
  });

module.exports = data.input;
