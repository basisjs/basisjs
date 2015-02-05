
 /**
  * @namespace basis.dom.event
  */

  var namespace = this.path;

  var document = global.document;
  var $null = basis.fn.$null;
  var arrayFrom = basis.array.from;
  var globalEvents = {};


  //
  // Const
  //

  var EVENT_HOLDER = 'basisEvents_' + basis.genUID();
  var W3CSUPPORT = !!document.addEventListener;

  var KEY = {
    BACKSPACE: 8,
    TAB: 9,
    CTRL_ENTER: 10,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    ESCAPE: 27,
    SPACE: 32,
    PAGEUP: 33,
    PAGEDOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    INSERT: 45,
    DELETE: 46,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123
  };

  var MOUSE_LEFT = {
    VALUE: 1,
    BIT:   1
  };
  var MOUSE_MIDDLE = {
    VALUE: 2,
    BIT:   4
  };
  var MOUSE_RIGHT = {
    VALUE: 3,
    BIT:   2
  };

  var BROWSER_EVENTS = {
    mousewheel: ['wheel', 'mousewheel', 'DOMMouseScroll']
  };

 /**
  * @param {string} eventName
  * @return {Array.<string>}
  */
  function browserEvents(eventName){
    return BROWSER_EVENTS[eventName] || [eventName];
  }


 /**
  * @class
  */
  var Event = basis.Class(null, {
    className: namespace + '.Event',

    KEY: KEY,

    init: function(event){
      event = wrap(event);

      for (var name in event)
        /** prevent warnings on deprecated properties */
        /** @cut*/ if (name != 'returnValue' && name != 'keyLocation' && name != 'layerX' && name != 'layerY' && (event.type != 'progress' || (name != 'totalSize' && name != 'position')))
        if (typeof event[name] != 'function' && name in this == false)
          this[name] = event[name];

      var target = sender(event);
      basis.object.extend(this, {
        event_: event,

        sender: target,
        target: target,

        key: key(event),
        charCode: charCode(event),

        mouseLeft: mouseButton(event, MOUSE_LEFT),
        mouseMiddle: mouseButton(event, MOUSE_MIDDLE),
        mouseRight: mouseButton(event, MOUSE_RIGHT),
        mouseX: mouseX(event),
        mouseY: mouseY(event),
        wheelDelta: wheelDelta(event)
      });
    },
    stopBubble: function(){
      cancelBubble(this.event_);
    },
    stopPropagation: function(){
      cancelBubble(this.event_);
    },
    preventDefault: function(){
      cancelDefault(this.event_);
    },
    die: function(){
      this.stopBubble();
      this.preventDefault();
    }
  });

 /**
  * Cross-browser event wrapper.
  * @param {Event} event
  * @return {Event}
  */
  function wrap(event){
    return event instanceof Event ? event.event_ : event || global.event;
  }

 /**
  * Returns DOM node if possible.
  * @param {Node|string} ref
  * @return {Node}
  */
  function getNode(ref){
    return typeof ref == 'string' ? document.getElementById(ref) : ref;
  }

 /**
  * Returns event sender (target element).
  * @param {Event} event
  * @return {Node}
  */
  function sender(event){
    // all events should has a target (see http://bugs.jquery.com/ticket/13255)
    var target = event.target || event.srcElement || document;
    // sometimes target may be a text node (see http://bugs.jquery.com/ticket/13143)
    return target.nodeType == 3 ? target.parentNode : target;
  }

 /**
  * Stops event bubbling.
  * @param {Event} event
  */
  function cancelBubble(event){
    if (event.stopPropagation)
      event.stopPropagation();
    else
      event.cancelBubble = true;
  }

 /**
  * Prevents default actions for event.
  * @param {Event} event
  */
  function cancelDefault(event){
    if (event.preventDefault)
      event.preventDefault();
    else
      event.returnValue = false;
  }

 /**
  * Stops event bubbling and prevent default actions for event.
  * @param {Event|string} event
  * @param {Node=} node
  */
  function kill(event, node){
    node = getNode(node);

    if (node)
      addHandler(node, event, kill);
    else
    {
      cancelDefault(event);
      cancelBubble(event);
    }
  }

 /**
  * Returns key code for keyboard events.
  * @param {Event} event
  * @return {number}
  */
  function key(event){
    return event.keyCode || event.which || 0;
  }

 /**
  * Returns char for keyboard events.
  * @param {Event} event
  * @return {number}
  */
  function charCode(event){
    return event.charCode || event.keyCode || 0;
  }

 /**
  * Checks if pressed mouse button equal to desire mouse button.
  * @param {Event} event
  * @param {object} button One of MOUSE constant
  * @return {boolean}
  */
  function mouseButton(event, button){
    if (typeof event.which == 'number')
      // DOM scheme
      return event.which == button.VALUE;
    else
      // IE6-8
      return !!(event.button & button.BIT);
  }

 /**
  * Returns mouse click horizontal page coordinate.
  * @param {Event} event
  * @return {number}
  */
  function mouseX(event){
    if (event.changedTouches)               // touch device
      return event.changedTouches[0].pageX;
    else
      if ('pageX' in event)                 // all others
        return event.pageX;
      else
        return 'clientX' in event
          ? event.clientX +
              (document.compatMode == 'CSS1Compat' ? document.documentElement.scrollLeft : document.body.scrollLeft)
          : 0;
  }

 /**
  * Returns mouse click vertical page coordinate.
  * @param {Event} event
  * @return {number}
  */
  function mouseY(event){
    if (event.changedTouches)             // touch device
      return event.changedTouches[0].pageY;
    else
      if ('pageY' in event)               // all others
        return event.pageY;
      else
        return 'clientY' in event
          ? event.clientY +
              (document.compatMode == 'CSS1Compat' ? document.documentElement.scrollTop : document.body.scrollTop)
          : 0;
  }

 /**
  * Returns mouse wheel delta.
  * @param {Event} event
  * @return {number} -1, 0, 1
  */
  function wheelDelta(event){
    var delta = 0;

    if ('deltaY' in event)
      delta = -event.deltaY;      // safari & gecko
    else
      if ('wheelDelta' in event)
        delta = event.wheelDelta; // IE, webkit, opera
      else
        if (event.type == 'DOMMouseScroll')
          delta = -event.detail;  // old gecko

    return delta && (delta / Math.abs(delta));
  }

  //
  // Global events
  //

 /**
  * Global events storage.
  * @private
  */
  var globalHandlers = {};
  var captureHandlers = {};

 /**
  * There is another global events sheme for browser doesn't support for event capture phase (generaly old IE).
  * @private
  * @const
  */
  var noCaptureScheme = !W3CSUPPORT;

 /**
  * Flush asap handlers
  */
  var flushAsap = true;
  var lastAsapEvent;


 /**
  *
  */
  function processAsap(event){
    if (flushAsap && event !== lastAsapEvent)
    {
      lastAsapEvent = event;
      basis.asap.process();
    }
  }

 /**
  * Observe handlers for event
  * @private
  * @param {Event} event
  */
  function observeGlobalEvents(event){
    var handlers = arrayFrom(globalHandlers[event.type]);
    var captureHandler = captureHandlers[event.type];
    var wrappedEvent = new Event(event);

    if (captureHandler)
    {
      captureHandler.handler.call(captureHandler.thisObject, wrappedEvent);
    }
    else
    {
      if (handlers)
      {
        for (var i = handlers.length; i-- > 0;)
        {
          var handlerObject = handlers[i];
          handlerObject.handler.call(handlerObject.thisObject, wrappedEvent);
        }
      }
    }

    processAsap(event);
  }

 /**
  * @param {string} eventType
  * @param {function(event)} handler
  * @param {object=} thisObject Context for handler
  */
  function captureEvent(eventType, handler, thisObject){
    if (captureHandlers[eventType])
      releaseEvent(eventType);

    if (!handler)
      handler = basis.fn.$undef;

    addGlobalHandler(eventType, handler, thisObject);
    captureHandlers[eventType] = {
      handler: handler,
      thisObject: thisObject
    };
  }

 /**
  * @param {string} eventType
  */
  function releaseEvent(eventType){
    var handlerObject = captureHandlers[eventType];
    if (handlerObject)
    {
      removeGlobalHandler(eventType, handlerObject.handler, handlerObject.thisObject);
      delete captureHandlers[eventType];
    }
  }

 /**
  * Adds global handler for some event type.
  * @param {string} eventType
  * @param {function(event)} handler
  * @param {object=} thisObject Context for handler
  */
  function addGlobalHandler(eventType, handler, thisObject){
    var handlers = globalHandlers[eventType];
    if (handlers)
    {
      // search for similar handler, returns if found (prevent for handler dublicates)
      for (var i = 0, item; item = handlers[i]; i++)
        if (item.handler === handler && item.thisObject === thisObject)
          return;
    }
    else
    {
      if (noCaptureScheme)
        // nothing to do, but it will provide observeGlobalEvents calls if other one doesn't
        addHandler(document, eventType, $null);
      else
        document.addEventListener(eventType, observeGlobalEvents, true);

      handlers = globalHandlers[eventType] = [];
    }

    // add new handler
    handlers.push({
      handler: handler,
      thisObject: thisObject
    });
  }

 /**
  * Removes global handler for eventType storage.
  * @param {string} eventType
  * @param {function(event)} handler
  * @param {object=} thisObject Context for handler
  */
  function removeGlobalHandler(eventType, handler, thisObject){
    var handlers = globalHandlers[eventType];
    if (handlers)
    {
      for (var i = 0, item; item = handlers[i]; i++)
      {
        if (item.handler === handler && item.thisObject === thisObject)
        {
          handlers.splice(i, 1);

          if (!handlers.length)
          {
            delete globalHandlers[eventType];
            if (noCaptureScheme)
              removeHandler(document, eventType, $null);
            else
              document.removeEventListener(eventType, observeGlobalEvents, true);
          }

          return;
        }
      }
    }
  }

  //
  //  common event handlers
  //

 /**
  * Adds handler for node for eventType events.
  * @param {Node|Window|string} node
  * @param {string} eventType
  * @param {function(event)} handler
  * @param {object=} thisObject Context for handler
  */
  function addHandler(node, eventType, handler, thisObject){
    node = getNode(node);

    if (!node)
      throw 'basis.event.addHandler: can\'t attach event listener to undefined';

    if (typeof handler != 'function')
      throw 'basis.event.addHandler: handler is not a function';

    var handlers = node === global ? globalEvents : node[EVENT_HOLDER];

    if (!handlers)
      handlers = node[EVENT_HOLDER] = {};

    var eventTypeHandlers = handlers[eventType];
    var handlerObject = {
      handler: handler,
      thisObject: thisObject
    };

    if (!eventTypeHandlers)
    {
      eventTypeHandlers = handlers[eventType] = [handlerObject];
      eventTypeHandlers.fireEvent = function(event){ // closure
        // simulate capture phase for old browsers
        event = wrap(event);
        if (noCaptureScheme && event && globalHandlers[eventType])
        {
          if (typeof event.returnValue == 'undefined')
          {
            observeGlobalEvents(event);
            if (event.cancelBubble === true)
              return;
            if (typeof event.returnValue == 'undefined')
              event.returnValue = true;
          }
        }

        // call eventType handlers
        for (var i = 0, wrappedEvent = new Event(event), item; item = eventTypeHandlers[i++];)
          item.handler.call(item.thisObject, wrappedEvent);

        processAsap(event);
      };

      if (W3CSUPPORT)
        // W3C DOM event model
        node.addEventListener(eventType, eventTypeHandlers.fireEvent, false);
      else
        // old IE event model
        node.attachEvent('on' + eventType, eventTypeHandlers.fireEvent);
    }
    else
    {
      // check for duplicates, exit if found
      for (var i = 0, item; item = eventTypeHandlers[i]; i++)
        if (item.handler === handler && item.thisObject === thisObject)
          return;

      // add only unique handlers
      eventTypeHandlers.push(handlerObject);
    }
  }

 /**
  * Adds multiple handlers for node.
  * @param {Node|Window|string} node
  * @param {object} handlers
  * @param {object=} thisObject Context for handlers
  */
  function addHandlers(node, handlers, thisObject){
    node = getNode(node);

    for (var eventType in handlers)
      addHandler(node, eventType, handlers[eventType], thisObject);
  }

 /**
  * Removes handler from node's handler holder.
  * @param {Node|Window|string} node
  * @param {string} eventType
  * @param {object} handler
  * @param {object=} thisObject Context for handlers
  */
  function removeHandler(node, eventType, handler, thisObject){
    node = getNode(node);

    var handlers = node === global ? globalEvents : node[EVENT_HOLDER];
    if (handlers)
    {
      var eventTypeHandlers = handlers[eventType];
      if (eventTypeHandlers)
      {
        for (var i = 0, item; item = eventTypeHandlers[i]; i++)
        {
          if (item.handler === handler && item.thisObject === thisObject)
          {
            // delete event handler
            eventTypeHandlers.splice(i, 1);

            // if there is no more handler for this event, clear it
            if (!eventTypeHandlers.length)
              clearHandlers(node, eventType);

            return;
          }
        }
      }
    }
  }

 /**
  * Removes all node's handlers for eventType. If eventType omited, all handlers for all eventTypes will be deleted.
  * @param {Node|string} node
  * @param {string} eventType
  */
  function clearHandlers(node, eventType){
    node = getNode(node);

    var handlers = node === global ? globalEvents : node[EVENT_HOLDER];
    if (handlers)
    {
      if (typeof eventType != 'string')
      {
        // no eventType - delete handlers for all events
        for (eventType in handlers)
          clearHandlers(node, eventType);
      }
      else
      {
        // delete eventType handlers
        var eventTypeHandlers = handlers[eventType];
        if (eventTypeHandlers)
        {
          if (node.removeEventListener)
            node.removeEventListener(eventType, eventTypeHandlers.fireEvent, false);
          else
            node.detachEvent('on' + eventType, eventTypeHandlers.fireEvent);

          delete handlers[eventType];
        }
      }
    }
  }

 /**
  * Fires eventType
  */
  function fireEvent(node, eventType, event){
    node = getNode(node);

    var handlers = node === global ? globalEvents : node[EVENT_HOLDER];
    if (handlers && handlers[eventType])
    {
      try {
        flushAsap = false;
        handlers[eventType].fireEvent(event);
      } finally {
        flushAsap = true;
      }
    }
  }

  //
  // on document load event dispatcher
  //

 /**
  * Attach unload handlers for page
  * @param {function(event)} handler
  * @param {object=} thisObject Context for handler
  */
  function onUnload(handler, thisObject){
    // deprecated in 1.4
    /** @cut */ basis.dev.warn('basis.dom.event.onUnload() is deprecated, use basis.teardown() instead');
    basis.teardown(handler, thisObject);
  }


  //
  // Event tests
  //

  var tagNameEventMap = {};

 /**
  * @param {string} eventName
  * @param {string?} tagName
  * @func
  */
  function getEventInfo(eventName, tagName){
    if (!tagName)
      tagName = 'div';

    var id = tagName + '-' + eventName;

    if (tagNameEventMap[id])
      return tagNameEventMap[id];
    else
    {
      var supported = false;
      var bubble = false;

      if (!W3CSUPPORT)
      {
        var onevent = 'on' + eventName;
        var host = document.createElement('div');
        var target = host.appendChild(document.createElement(tagName));

        host[onevent] = function(){
          bubble = true;
        };

        try {
          target.fireEvent(onevent);
          supported = true;
        } catch(e){
          // if exception event doesn't support
        }
      }

      return tagNameEventMap[id] = {
        supported: supported,
        bubble: bubble
      };
    }
  }

  function wrapEventFunction(fn){
    return function(event, arg){
      return fn(wrap(event), arg);
    };
  }


  //
  // export names
  //

  module.exports = {
    // support and testing
    W3CSUPPORT: W3CSUPPORT,
    browserEvents: browserEvents,
    getEventInfo: getEventInfo,

    // const
    KEY: KEY,
    MOUSE_LEFT: MOUSE_LEFT,
    MOUSE_RIGHT: MOUSE_RIGHT,
    MOUSE_MIDDLE: MOUSE_MIDDLE,

    // classes
    Event: Event,

    // event functions
    sender: wrapEventFunction(sender),

    cancelBubble: wrapEventFunction(cancelBubble),
    cancelDefault: wrapEventFunction(cancelDefault),
    kill: wrapEventFunction(kill),

    key: wrapEventFunction(key),
    charCode: wrapEventFunction(charCode),
    mouseButton: wrapEventFunction(mouseButton),
    mouseX: wrapEventFunction(mouseX),
    mouseY: wrapEventFunction(mouseY),
    wheelDelta: wrapEventFunction(wheelDelta),

    // attach & detach event handler helpers
    addGlobalHandler: addGlobalHandler,
    removeGlobalHandler: removeGlobalHandler,

    captureEvent: captureEvent,
    releaseEvent: releaseEvent,

    addHandler: addHandler,
    addHandlers: addHandlers,
    removeHandler: removeHandler,
    clearHandlers: clearHandlers,

    fireEvent: fireEvent,

    onUnload: onUnload,

    // helpers
    wrap: wrap
  };
