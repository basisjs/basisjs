var document = global.document;
var sendData = function(){};
var transferEl;

// if (!global.CustomEvent)
// {
//   var CustomEvent = function(event, params){
//     var evt = document.createEvent('CustomEvent');

//     basis.object.complete(params || {}, {
//       bubbles: false,
//       cancelable: false,
//       detail: undefined
//     });

//     evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);

//     return evt;
//    };

//   CustomEvent.prototype = global.Event.prototype;
// }

if (document.createEvent)
{
  transferEl = document.createElement('pre');
  transferEl.id = 'devpanelSharedDom';  // for old plugin
  transferEl.style.display = 'none';

  sendData = function(action, data){
    var dataTextNode = document.createTextNode(JSON.stringify(data));
    var transferDataEvent = document.createEvent('Event');
    transferDataEvent.initEvent('devpanelData', true, false);

    transferEl.setAttribute('action', action);
    transferEl.appendChild(dataTextNode);
    transferEl.dispatchEvent(transferDataEvent);

    transferEl.removeChild(dataTextNode);
  };

  // add to document and fire init event
  var initEvent = document.createEvent('Event');
  initEvent.initEvent('devpanelInit', true, false);

  document.body
    .appendChild(transferEl)
    .dispatchEvent(initEvent);
}
else
{
  basis.dev.warn('basis.devpanel: cross-process messaging is not supported');
}

module.exports = {
  transferEl: transferEl,
  sendData: sendData
};
