var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var remoteInspectors = new Value({ value: 0 });

var View = require('./view/index.js');
var data = require('./data/index.js');
var api = require('./createLocalApi.js')(data, inspectBasis);

// transport
function sendDataToClient(data){
  if (remoteInspectors.value)
    socket.emit('devtool:session data', {
      type: 'template',
      payload: data.data
    });
}

data.output.link(null, sendDataToClient);

socket.on('devtool:session command', function(command){
  if (command && command.target !== 'template-inspector')
    return;

  if (command.method === 'init')
    sendDataToClient(data.output.value);
  else if (api.hasOwnProperty(command.method))
    api[command.method].apply(null, command.args);
});

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
var getView = basis.fn.lazyInit(function(){
  return new View({ api: api });
});

new Expression(data.input, remoteInspectors, function(input, inspectors){
  if (input && !inspectors)
    return getView();
}).link(null, function(view, oldView){
  if (view)
  {
    data.input.attach(blockEvents);
    data.output.link(view, function(output){
      this.set(JSON.parse(JSON.stringify(output.data)));
    });
  }
  else if (oldView)
  {
    data.input.detach(blockEvents);
    data.output.unlink(oldView);
    oldView.set({ hasTarget: false });
  }
});

if (typeof basisjsToolsFileSync != 'undefined')
{
  remoteInspectors.set(basisjsToolsFileSync.remoteInspectors.value);
  basisjsToolsFileSync.remoteInspectors.attach(remoteInspectors.set, remoteInspectors);
}

module.exports = data.input;
