basis.require('basis.dom');

var transferDiv;
var transferDataEvent;

module.exports = document.createEvent
  ? {
      init: function(){
        transferDataEvent = document.createEvent('Event');
        transferDataEvent.initEvent('devpanelData', false, false);

        transferDiv = document.body.appendChild(
          basis.dom.createElement('pre#devpanelSharedDom[style="position: absolute; left: -2000px"]')
        );

        // dispatch init
        var initEvent = document.createEvent('Event');
        initEvent.initEvent('devpanelInit', false, false);
        document.body.dispatchEvent(initEvent);
      },
      sendData: function(action, data){
        transferDiv.setAttribute('action', action);
        transferDiv.innerHTML = '';
        transferDiv.appendChild(document.createTextNode(JSON.stringify(data)));
        transferDiv.dispatchEvent(transferDataEvent);
        transferDiv.innerHTML = '';
      }
    }
  : {
      init: function(){},
      sendData: function(){}
    };
