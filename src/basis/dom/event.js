/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');

!function(basis, global){
 
  'use strict';

 /**
  * @namespace basis.dom.event
  */

  var namespace = 'basis.dom.event';

  // for better pack

  var document = global.document;
  var dom = basis.dom;
  var $null = Function.$null;

  var W3CSUPPORT = !!document.addEventListener;

  //
  // Const
  //

  var EVENT_HOLDER = '__basisEvents';

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
    F5: 116
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
    mousewheel: ['mousewheel', 'DOMMouseScroll']
  };

 /**
  * 
  */
  function browserEvents(eventName){
    return BROWSER_EVENTS[eventName] || [eventName];
  }

 /**
  * Function wraper with thisObject as context.
  * @class
  */
  var Handler = function(handler, thisObject){
    this.handler = handler;
    this.thisObject = thisObject;
  };

 /**
  * Cross-browser event wrapper.
  * @param {Event} event
  * @return {Event}
  */
  function wrap(event){
    return event || global.event;
  }

 /**
  * Returns DOM node if possible.
  * @param {Node|string} object
  * @return {Node}
  */
  function getNode(object){ 
    return typeof object == 'string' ? dom.get(object) : object;
  }

 /**
  * Returns event sender (target element).
  * @param {Event} event
  * @return {Node}
  */
  function sender(event){
    event = wrap(event);

    return event.target || event.srcElement;
  }

 /**
  * Stops event bubbling.
  * @param {Event} event
  */
  function cancelBubble(event){
    event = wrap(event);

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
    event = wrap(event);

    if (event.preventDefault) 
      event.preventDefault();
    else
      event.returnValue = false;
  }

 /**
  * Stops event bubbling and prevent default actions for event.
  * @param {Event|string} event
  * @param {Node} node
  */
  function kill(event, node){
    node = getNode(node);

    if (node)
      addHandler(node, event, Event.kill);
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
    event = wrap(event);

    return event.keyCode || event.which || 0;
  }

 /**
  * Returns char for keyboard events.
  * @param {Event} event
  * @return {number}
  */
  function charCode(event){
    event = wrap(event);
  
    return event.charCode || event.keyCode || 0;
  }

 /**
  * Checks if pressed mouse button equal to desire mouse button.
  * @param {Event} event
  * @param {object} button One of MOUSE constant
  * @return {boolean}
  */
  function mouseButton(event, button){
    event = wrap(event);

    if (typeof event.which == 'number')
      // DOM scheme
      return event.which == button.VALUE;
    else
      // IE6-8
      return event.button & button.BIT;
  }

 /**
  * Returns mouse click horizontal page coordinate.
  * @param {Event} event
  * @return {number}
  */
  function mouseX(event){
    event = wrap(event);

    if (event.changedTouches)               // touch device
      return event.changedTouches[0].pageX;
    else
      if ('pageX' in event)                 // all others
        return event.pageX;
      else                                  
        return event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
  }

 /**
  * Returns mouse click vertical page coordinate.
  * @param {Event} event
  * @return {number}
  */
  function mouseY(event){
    event = wrap(event);

    if (event.changedTouches)             // touch device
      return event.changedTouches[0].pageY;
    else                                  // all others
      if ('pageY' in event)
        return event.pageY;
      else                                  
        return event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
  }

 /**
  * Returns mouse wheel delta.
  * @param {Event} event
  * @return {number} -1, 0, 1
  */
  function wheelDelta(event){
    event = wrap(event);

    if ('wheelDelta' in event) 
      return event.wheelDelta / 120; // IE, webkit, opera
    else
      if (event.type == 'DOMMouseScroll')
        return -event.detail / 3;    // gecko
      else
        return 0;                  // not a mousewheel event
  }

  //
  // Global events
  //

 /**
  * Global events storage.
  * @private
  */
  var globalHandlers = {};

 /**
  * There is another global events sheme for browser doesn't support for event capture phase (generaly old IE).
  * @private
  * @const
  */
  var noCaptureSheme = !document.addEventListener;

 /**
  * Observe handlers for event
  * @private
  * @param {Event} event
  */
  function observeGlobalEvents(event){
    var handlers = Array.from(globalHandlers[event.type]);

    if (handlers)
    {
      for (var i = handlers.length; i --> 0;)
      {
        var handlerObject = handlers[i];
        handlerObject.handler.call(handlerObject.thisObject, event);
      }
    }
  };

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
      for (var i = handlers.length; i --> 0;)
      {
        var handlerObject = handlers[i];
        if (handlerObject.handler === handler && handlerObject.thisObject === thisObject)
          return;
      }
    }
    else
    {
      if (noCaptureSheme)
        // nothing to do, but it will provide observeGlobalEvents calls if other one doesn't
        addHandler(document, eventType, $null);
      else
        document.addEventListener(eventType, observeGlobalEvents, true);

      handlers = globalHandlers[eventType] = new Array();
    }

    // add new handler
    handlers.push({
      handler: handler,
      thisObject: thisObject
    });
  };

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
            if (noCaptureSheme)
              removeHandler(document, eventType, $null);
            else
              document.removeEventListener(eventType, observeGlobalEvents, true);
          }

          return;
        }
      }
    }
  };

  //
  //  common event handlers
  //

 /**
  * Adds handler for node for eventType events.
  * @param {Node|string} node
  * @param {string} eventType
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  function addHandler(node, eventType, handler, thisObject){
    node = getNode(node);

    if (!node)
      throw new Error('Event.addHandler: can\'t attach event listener to undefined');

    if (typeof handler != 'function')
      throw new Error('Event.addHandler: handler must be a function');

    if (!node[EVENT_HOLDER])
      node[EVENT_HOLDER] = {};

    // event handler
    var handlerObject = {
      handler: handler,
      thisObject: thisObject
    };
      
    var handlers = node[EVENT_HOLDER];
    var eventTypeHandlers = handlers[eventType];
    if (!eventTypeHandlers)
    {
      eventTypeHandlers = handlers[eventType] = [handlerObject];
      eventTypeHandlers.fireEvent = function(event){ // closure
        // simulate capture phase for old browsers
        event = wrap(event);
        if (noCaptureSheme && event && globalHandlers[eventType])
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
        for (var i = 0, item; item = eventTypeHandlers[i++];)
          item.handler.call(item.thisObject, event);
      };

      if (node.addEventListener) 
        // W3C DOM event model
        node.addEventListener(eventType, eventTypeHandlers.fireEvent, false);
      else 
        // old IE event model
        node.attachEvent('on' + eventType, eventTypeHandlers.fireEvent);
    }
    else
    {
      // check for dublicates, exit if found
      for (var i = 0, item; item = eventTypeHandlers[i]; i++)
        if (item.handler === handler && item.thisObject === thisObject)
          return;

      // add only unique handlers
      eventTypeHandlers.push(handlerObject);
    }
  };

 /**
  * Adds multiple handlers for node.
  * @param {Node|string} node
  * @param {object} handlers
  * @param {object=} thisObject Context for handlers
  */
  function addHandlers(node, handlers, thisObject){
    node = getNode(node);

    for (var eventType in handlers)
      addHandler(node, eventType, handlers[eventType], thisObject);
  };

 /**
  * Removes handler from node's handler holder.
  * @param {Node|string} node
  * @param {sting} eventType
  * @param {object} handler
  * @param {object=} thisObject Context for handlers
  */
  function removeHandler(node, eventType, handler, thisObject){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
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
  };

 /**
  * Removes all node's handlers for eventType. If eventType omited, all handlers for all eventTypes will be deleted.
  * @param {Node|string} node
  * @param {string} eventType
  */
  function clearHandlers(node, eventType){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
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
  };

 /**
  * Fires eventType 
  */
  function fireEvent(node, eventType){
    node = getNode(node);

    var handlers = node[EVENT_HOLDER];
    if (handlers && handlers[eventType])
        handlers[eventType].fireEvent();
  };

  //
  // on document load event dispatcher
  //

 /**
  * Attach load handlers for page
  * @function
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  var onLoad = (function(){
    // Matthias Miller/Mark Wubben/Paul Sowden/Dean Edwards/John Resig and Me :)

    var fired = false;
    var loadHandler = new Array();

    function fireHandlers(){
      if (!fired++)
        setTimeout(function(){
          for (var i = 0; i < loadHandler.length; i++)
            loadHandler[i].callback.call(loadHandler[i].thisObject);
        }, 10);
    }

    if (basis.ua.is('ie7-'))
    {
      (function(){
        var secretId = '_' + Date.now();
        document.write('<script id="' + secretId + '" defer src="//:"><\/script>');
        getNode(secretId).onreadystatechange = function(){
          if (this.readyState == 'complete')
          {
            dom.remove(this);
            fireHandlers(); 
          }
        };
      })();
    }
    else
      /* WebKit for */ 
      if (basis.ua.is('safari525-'))
      {
        var _timer = setInterval(function(){
          if (/loaded|complete/.test(document.readyState))
          {
            clearInterval(_timer);
            fireHandlers();
          }
        }, 15);
      }
      else
        // use the real event for browsers that support it (opera & firefox)
        addHandler(document, "DOMContentLoaded", fireHandlers, false);

    // if all else fails fall back on window.onload/document.onload
    addHandler(document, "load", fireHandlers, false);
    addHandler(global, "load", fireHandlers, false);

    // return attach function
    return function(callback, thisObject){
      if (fired)
      {
        ;;;if (typeof console != 'undefined') console.warn('Event.onLoad(): Can\'t attach handler to onload event, because it\'s already fired!');
        return;
      }

      loadHandler.push({
        callback: callback,
        thisObject: thisObject
      });
    }
  })();

 /**
  * Attach unload handlers for page
  * @param {function(event)} handler 
  * @param {object=} thisObject Context for handler
  */
  function onUnload(handler, thisObject){ 
    addHandler(global, 'unload', handler, thisObject);
  }

  //
  //
  //

  var tagNameEventMap = {};
  function getEventInfo(tagName, eventName){
    var id = tagName + '-' + eventName;

    if (tagNameEventMap[id])
      return tagNameEventMap[id];
    else
    {
      var onevent = 'on' + eventName;
      var target = dom.createElement(tagName);
      var host = dom.createElement('div', target);
      var bubble = false;
      var supported = false;

      host[onevent] = function(){ bubble = true; };

      try {
        target.fireEvent(onevent);
        supported = true;
      } catch(e){}
      
      return tagNameEventMap[id] = {
        supported: supported,
        bubble: bubble
      }
    }
  }


  //
  // export names
  //

  basis.namespace(namespace, wrap).extend({
    W3CSUPPORT: W3CSUPPORT,

    KEY: KEY,

    MOUSE_LEFT: MOUSE_LEFT,
    MOUSE_RIGHT: MOUSE_RIGHT,
    MOUSE_MIDDLE: MOUSE_MIDDLE,

    browserEvents: browserEvents,

    Handler: Handler,

    sender: sender,

    cancelBubble: cancelBubble,
    cancelDefault: cancelDefault,
    kill: kill,

    key: key,
    charCode: charCode,
    mouseButton: mouseButton,
    mouseX: mouseX,
    mouseY: mouseY,
    wheelDelta: wheelDelta,

    addGlobalHandler: addGlobalHandler,
    removeGlobalHandler: removeGlobalHandler,

    addHandler: addHandler,
    addHandlers: addHandlers,
    removeHandler: removeHandler,
    clearHandlers: clearHandlers,
    
    fireEvent: fireEvent,

    onLoad: onLoad,
    onUnload: onUnload,

    getEventInfo: getEventInfo
  });

}(basis, this);
