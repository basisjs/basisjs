var document = global.document;
var sendData = function(){};
var emitEvent = false;
var transferEl;

//
// check and set up event based transport
//
if (document.createEvent)
{
  var EventClass = global.CustomEvent;
  if (EventClass || document.createEvent('CustomEvent').initCustomEvent);
  {
    // polyfil CustomEvent
    if (!EventClass)
    {
      EventClass = function(name, params){
        var event = document.createEvent('CustomEvent');

        params = basis.object.extend({
          bubbles: false,
          cancelable: false,
          detail: undefined
        }, params);

        event.initCustomEvent(name, params.bubbles, params.cancelable, params.detail);

        return event;
      };

      EventClass.prototype = global.Event.prototype;
    }

    emitEvent = function(name, data){
      document.dispatchEvent(new EventClass('devpanel:' + name, {
        detail: data
      }));
    };
  }
}

//
// main part
//
if (emitEvent)
{
  sendData = function(action, data){
    console.log('send to acp: ', action, data);
    emitEvent('data', {
      action: action,
      data: data
    });
  };

  document.addEventListener('devpanel:ping', function(){
    emitEvent('pong');
  });

  document.addEventListener('devpanel:command', function(event){
    console.log('command', event.detail);
    var detail = event.detail || {};
    var command = detail.command;
    var args = detail.args;
    var api = require('devpanel').api;

    if (api.hasOwnProperty(command))
      api[command].apply(null, [function(err, data){
        sendData('response', {
          id: detail.id,
          status: err ? 'error' : 'ok',
          data: err || data
        });
      }].concat(args));
    else
      basis.dev.warn('[basis.devpanel] ACP call for unknown command `' + command + '`');
  });

  emitEvent('init');

  // transferEl = document.createElement('pre');
  // transferEl.id = 'devpanelSharedDom';  // for old plugin
  // transferEl.style.display = 'none';

  // sendData = function(action, data){
  //   var dataTextNode = document.createTextNode(JSON.stringify(data));
  //   var transferDataEvent = document.createEvent('Event');
  //   transferDataEvent.initEvent('devpanelData', true, false);

  //   transferEl.setAttribute('action', action);
  //   transferEl.appendChild(dataTextNode);
  //   transferEl.dispatchEvent(transferDataEvent);

  //   transferEl.removeChild(dataTextNode);
  // };

  // // add to document and fire init event
  // var initEvent = document.createEvent('Event');
  // initEvent.initEvent('devpanelInit', true, false);

  // document.body
  //   .appendChild(transferEl)
  //   .dispatchEvent(initEvent);
}
else
{
  basis.dev.warn('[basis.devpanel] Cross-process messaging is not supported');
}

module.exports = {
  sendData: sendData
};
