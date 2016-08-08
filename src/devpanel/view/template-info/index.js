var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var createDynamicView = require('../utils.js').createDynamicView;
var remote = require('../../basisjs-tools-sync.js').remoteInspectors;

var View = require('./view/index.js');
var data = require('./data/index.js');

require('api')
  .local(require('./api.js'), data, inspectBasis)
  .channel(data.output.as('data'), remote.send);

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

var view = createDynamicView(data.input, View, {
  container: document.body,
  getRemoteUrl: remote.getRemoteUrl
});

view.link(null, function(view, oldView){
  if (view)
  {
    captureEvents.forEach(function(eventName){
      inspectBasisDomEvent.captureEvent(eventName, function(){});
    });
  }
  else if (oldView)
  {
    captureEvents.forEach(function(eventName){
      inspectBasisDomEvent.releaseEvent(eventName);
    });
  }
});

module.exports = {
  view: view,
  set: data.input.set.bind(data.input)
};
