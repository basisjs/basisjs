basis.require('basis.dom');

var transferDiv;
var transferDataEvent;

module.exports = {
  init: function(){
    transferDataEvent = document.createEvent('Event');
    transferDataEvent.initEvent('transferData', true, true);

    transferDiv = document.body.appendChild(
      basis.dom.createElement('pre#transferDiv[style="position: absolute; left: -2000px"]')
    );
  },
  sendData: function(action, data){
    transferDiv.setAttribute('action', action);
    transferDiv.innerHTML = '';
    transferDiv.appendChild(document.createTextNode(JSON.stringify(data || {})));
    transferDiv.dispatchEvent(transferDataEvent);
    transferDiv.innerHTML = '';
  }
};
