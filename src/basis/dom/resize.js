
  var document = global.document;

  var EVENT_OVERFLOWCHANGED = 'OverflowEvent' in global ? 'overflowchanged' : '';
  var EVENT_OVERFLOW = EVENT_OVERFLOWCHANGED || 'overflow';
  var EVENT_UNDERFLOW = EVENT_OVERFLOWCHANGED || 'underflow';
  var SUPPORT_RESIZE = 'onresize' in document.documentElement;
  var OVERFLOW_EVENT_SUPPORTED = !!EVENT_OVERFLOWCHANGED;

  if (!OVERFLOW_EVENT_SUPPORTED && document.addEventListener)
    (function(){
      // test for support overflow/underflow events in Firefox
      // TODO: make test better
      var el = createDiv('position:absolute;overflow:hidden;width:1px;height:1px');
      el.appendChild(createDiv('width:9px;height:9px;'));
      addFlowListener(el, EVENT_OVERFLOW, function(){
        OVERFLOW_EVENT_SUPPORTED = true;
      }, true);
      document.documentElement.appendChild(el);
      basis.ready(function(){
       el.parentNode.removeChild(el);
      });
    })();

  function addFlowListener(element, type, fn){
    element.addEventListener(type, fn, false);
  };

  function createDiv(role, style){
    var el = document.createElement('div');
    if (role)
      el.setAttribute('data-dev-role', role);
    if (style)
      el.setAttribute('style', style);
    return el;
  }

  function createFitDiv(childA, childB, role){
    var el = createDiv(role, [
      'position: absolute',
      'visibility: hidden',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'overflow: hidden',
      'z-index: -1',
      ''
    ].join(' !important;'));

    childA && el.appendChild(childA);
    childB && el.appendChild(childB);

    return el;
  }

  var overflowSensorProto = createFitDiv(
        createFitDiv(createDiv()),
        createFitDiv(createDiv()),
        'basis.dom.resize.sensor'
      );

  var iframeSensorProto = document.createElement('iframe');
  iframeSensorProto.setAttribute('data-dev-role', 'basis.dom.resize.sensor');
  iframeSensorProto.setAttribute('style', [
    'position: absolute',
    //'visibility: hidden',  // visibility: hidden prevent onresize events in Firefox
    'opacity: 0',
    'top: -100000px',
    'left: 0',
    'width: 100%',
    'height: 100%',
    'overflow: hidden',
    'z-index: -1',
    ''
  ].join(' !important;'));


  function addResizeListener(element, fn, context){
    var events = element.flowEvents_;

    if (!events)
      events = element.flowEvents_ = [];

    if (!events.resizeSensor_)
    {
      // NOTE: we don't use `onresize` in IE, because it doesn't fire when
      // element insert into document, so using iframe is better solution

      if (OVERFLOW_EVENT_SUPPORTED)
      {
        var sensor = overflowSensorProto.cloneNode(true);
        var x = -1;
        var y = -1;
        var first = sensor.firstElementChild.firstChild;
        var last = sensor.lastElementChild.firstChild;

        var matchFlow = function(event){
          var change = false;
          var width = sensor.offsetWidth;
          var height = sensor.offsetHeight;
          var step = 1;
          var cs = global.getComputedStyle(sensor);

          if (/\.\d+px$/.test(cs.width))
          {
            width = parseFloat(cs.width);
            step = 0.1;
          }

          if (/\.\d+px$/.test(cs.height))
          {
            height = parseFloat(cs.height);
            step = 0.1;
          }

          if (x != width)
          {
            first.style.width = (width || 1000000) - step + 'px';
            last.style.width = width + step + 'px';
            change = true;
            x = width;
          }

          if (y != height)
          {
            first.style.height = (height || 1000000) - step + 'px';
            last.style.height = height + step + 'px';
            change = true;
            y = height;
          }

          if (change)
            events.forEach(function(handler){
              handler.fn.call(handler.context, element);
            });
        };

        if (global.getComputedStyle(element).position == 'static')
          element.style.position = 'relative';

        //addFlowListener(sensor, 'over', matchFlow);
        //addFlowListener(sensor, 'under', matchFlow);
        addFlowListener(sensor.firstElementChild, EVENT_OVERFLOW, matchFlow);
        addFlowListener(sensor.lastElementChild, EVENT_UNDERFLOW, matchFlow);
        element.appendChild(sensor);
        matchFlow();
      }
      else
      {
        var sensor = iframeSensorProto.cloneNode();
        var init = function(){
          var win = sensor.contentWindow;
          win.onresize = handler;
          win.document.body.onresize = handler;
          handler();
        };
        var handler = function(){
          events.forEach(function(handler){
            handler.fn.call(handler.context, element);
          });
        };

        if (sensor.attachEvent) // IE8 don't fire load event otherwise
          sensor.attachEvent('onload', init);
        else
          sensor.onload = init;

        element.appendChild(sensor);
      }

      events.resizeSensor_ = sensor;
    }

    events.push({
      fn: fn,
      context: context || element
    });

    return element;
  };

  function removeResizeListener(element, fn, context){
    var events = element.flowEvents_;

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

      delete element.flowEvents_;
    }
  };

  module.exports = {
    add: addResizeListener,
    remove: removeResizeListener
  };
