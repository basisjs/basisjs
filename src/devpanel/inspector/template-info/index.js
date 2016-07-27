var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var View = require('./view/index.js');
var data = require('./data/index.js');
var api = require('./createLocalApi.js')(data, inspectBasis);

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

// attach to view
data.output
  .link(new View({ api: api }), function(output){
    this.set(JSON.parse(JSON.stringify(output.data)));
  });

// transport
function sendDataToClient(data){
  socket.emit('basisjs.devpanel.data', {
    type: 'template',
    payload: data.data
  });
}

data.output.link(null, sendDataToClient);

socket.on('basisjs.devpanel.command', function(command){
  if (command && command.target === 'template-inspector')
  {
    if (command.method === 'init')
      sendDataToClient(data.output.value);
    else if (api.hasOwnProperty(command.method))
      api[command.method].apply(null, command.args);
  }
});

module.exports = data.input;
