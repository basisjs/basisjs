
  var document = global.document;
  var resizeHandlers = 'basisjsResizeHandlers' + basis.genUID();
  var getComputedStyle = require('./computedStyle.js').get;
  var STUB_DOCUMENT = '<html></html>';
  var STUB_DOCUMENT_SRC = 'javascript:"' + STUB_DOCUMENT + '"';

  function createSensorProto(name){
    var sensorProto = document.createElement(name);
    sensorProto.setAttribute('data-dev-role', 'basis.dom.resize.sensor');
    sensorProto.setAttribute('scrolling', 'no');
    sensorProto.setAttribute('tabindex', '-1');
    sensorProto.setAttribute('srcdoc', STUB_DOCUMENT);
    sensorProto.setAttribute('src', STUB_DOCUMENT_SRC);
    sensorProto.setAttribute('style', [
      'display:block',
      'pointer-events:none',
      'position:absolute',
      //'visibility: hidden',  // visibility: hidden prevent onresize events in Firefox
      'opacity:0',
      'top:-100000px',
      'left:0',
      'width:100%',
      'height:100%',
      'border:none',
      'overflow:hidden',
      'z-index:-1',
      ''
    ].join('!important;'));
    return sensorProto;
  }

  var iframeSensorProto = createSensorProto('iframe'); // using <object> looks the same, but has issues in old IE

  function addResizeListener(element, fn, context){
    var events = element[resizeHandlers];

    if (!events)
      events = element[resizeHandlers] = [];

    if (!events.resizeSensor_)
    {
      // NOTE: we don't use `onresize` event in IE, because it doesn't fire when
      // element inserting into document;
      // overflow/underflow events also not using as target for remove from browsers;
      // so using iframe is better solution for now

      var handler = function(){
        events.forEach(function(handler){
          handler.fn.call(handler.context, element);
        });
      };

      var init = function(){
        if (getComputedStyle(element, 'position') == 'static')
          element.style.position = 'relative';

        var document = sensor.contentDocument;
        var win = document.defaultView || document.parentWindow;
        win.onresize = handler;
        win.document.body.onresize = handler;

        handler();
      };

      var sensor = iframeSensorProto.cloneNode();

      // https://github.com/jugglinmike/srcdoc-polyfill/blob/master/srcdoc-polyfill.js
      // Explicitly set the iFrame's window.location for
      // compatability with IE9, which does not react to changes in
      // the `src` attribute when it is a `javascript:` URL, for
      // some reason
      if (sensor.contentWindow)
        sensor.contentWindow.location = STUB_DOCUMENT_SRC;

      if (sensor.attachEvent) // IE8 don't fire load event otherwise
        sensor.attachEvent('onload', init);
      else
        sensor.onload = init;

      element.appendChild(sensor);

      events.resizeSensor_ = sensor;
    }

    events.push({
      fn: fn,
      context: context || element
    });

    return element;
  };

  function removeResizeListener(element, fn, context){
    var events = element[resizeHandlers];

    if (!events)
      return;

    for (var i = 0, handler; handler = events[i]; i++)
      if (handler.fn == fn && handler.context === (context || element))
      {
        events.splice(i, 1);
        break;
      }

    if (!events.length)
    {
      var sensor = events.resizeSensor_;

      if (sensor.parentNode)
        sensor.parentNode.removeChild(sensor);

      element[resizeHandlers] = null;
    }
  };

  module.exports = {
    add: addResizeListener,
    remove: removeResizeListener
  };
