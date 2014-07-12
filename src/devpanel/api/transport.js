var document = global.document;
var sendData = basis.fn.$undef;
var transferEl;

if (document.createEvent)
{
  var transferDataEvent = document.createEvent('Event');
  transferDataEvent.initEvent('devpanelData', true, false);

  // dispatch init
  var initEvent = document.createEvent('Event');
  initEvent.initEvent('devpanelInit', true, false);

  transferEl = document.createElement('pre');
  transferEl.id = 'devpanelSharedDom';  // for old plugin
  transferEl.style.display = 'none';

  sendData = function(action, data){
    var dataTextNode = document.createTextNode(JSON.stringify(data));

    transferEl.setAttribute('action', action);
    transferEl.appendChild(dataTextNode);
    transferEl.dispatchEvent(transferDataEvent);

    transferEl.removeChild(dataTextNode);
  };

  // add to document and fire init event
  document.body.appendChild(transferEl).dispatchEvent(initEvent);
}
else
{
  basis.dev.warn('basis.devpanel: cross-process messaging is not supported');
}

module.exports = {
  transferEl: transferEl,
  sendData: sendData
};
