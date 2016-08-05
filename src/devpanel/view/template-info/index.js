var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var remote = require('../../basisjs-tools-sync.js').remoteInspectors;

var View = require('./view/index.js');
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'), data, inspectBasis)
  .channel(data.output.as(basis.getter('data')), remote.send);

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

new Expression(data.input, remote, function(input, remote){
  return {
    input: input,
    remote: remote
  };
})
  .link(new Value(), function(value, oldValue){
    this.set(value.input && !value.remote && (!oldValue || value.input !== oldValue.input));
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
