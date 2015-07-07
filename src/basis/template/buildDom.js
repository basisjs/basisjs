var Node = global.Node;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var eventUtils = require('basis.dom.event');
var resolveActionById = require('basis.template.store').resolveActionById;

var consts = require('./const.js');
var MARKER = consts.MARKER;
var CLONE_NORMALIZATION_TEXT_BUG = consts.CLONE_NORMALIZATION_TEXT_BUG;
var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_ATTRIBUTE = consts.TYPE_ATTRIBUTE;
var TYPE_ATTRIBUTE_CLASS = consts.TYPE_ATTRIBUTE_CLASS;
var TYPE_ATTRIBUTE_STYLE = consts.TYPE_ATTRIBUTE_STYLE;
var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
var TYPE_TEXT = consts.TYPE_TEXT;
var TYPE_COMMENT = consts.TYPE_COMMENT;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var TOKEN_REFS = consts.TOKEN_REFS;
var ATTR_NAME = consts.ATTR_NAME;
var ATTR_VALUE = consts.ATTR_VALUE;
var ATTR_VALUE_INDEX = consts.ATTR_VALUE_INDEX;
var ELEMENT_NAME = consts.ELEMENT_NAME;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var TEXT_VALUE = consts.TEXT_VALUE;
var COMMENT_VALUE = consts.COMMENT_VALUE;
var CLASS_BINDING_ENUM = consts.CLASS_BINDING_ENUM;
var CLASS_BINDING_BOOL = consts.CLASS_BINDING_BOOL;


//
// Events
//

var MOUSE_ENTER_LEAVE_SUPPORT = 'onmouseenter' in document.documentElement;
var USE_CAPTURE_FALLBACK = false;
var tmplEventListeners = {};
var afterEventAction = {};
var insideElementEvent = {};
var contains;

// cross-browser Node#contains
if (Node && !Node.prototype.contains)
  // old Firefox has no Node#contains method (Firefox 8 and lower)
  contains = function(parent, child){
    // Node.DOCUMENT_POSITION_CONTAINED_BY = 16
    return parent.compareDocumentPosition(child) & 16;
  };
else
  contains = function(parent, child){
    return parent.contains(child);
  };

// fallback for browsers w/o capture phase (IE8 and lower)
if (!document.addEventListener)
  USE_CAPTURE_FALLBACK = basis.publicCallback(function(eventName, event){
     // trigger global handlers proceesing
    eventUtils.fireEvent(document, eventName);

    // prevent twice global handlers processing
    event.returnValue = true;

    var listener = tmplEventListeners[eventName];
    if (listener)
      listener(new eventUtils.Event(event));
  }, true);

/**
* @param {string} attrName
*/
function createEventHandler(attrName){
 /**
  * @param {basis.dom.event.Event} event
  */
  return function(event){

    // don't process right click - generaly FF problem
    if (event.type == 'click' && event.which == 3)
      return;

    var bubble = insideElementEvent[event.type] || (event.type != 'mouseenter' && event.type != 'mouseleave');
    var attrCursor = event.sender;
    var attr;

    // search for nearest node with event-{eventName} attribute
    // Note: IE events may have no event source, nothing to do in this case
    while (attrCursor)
    {
      attr = attrCursor.getAttribute && attrCursor.getAttribute(attrName);

      if (!bubble || typeof attr == 'string')
        break;

      attrCursor = attrCursor.parentNode;
    }

    // attribute found
    if (typeof attr == 'string')
    {
      // search for nearest node with basis template marker
      var cursor = attrCursor;
      var actionTarget = cursor;
      var refId;
      var tmplRef;

      if (insideElementEvent[event.type])
      {
        var relTarget = event.relatedTarget;
        if (relTarget && (cursor === relTarget || contains(cursor, relTarget)))
          cursor = null;  // prevent action processing
      }

      while (cursor)
      {
        refId = cursor[MARKER];
        if (typeof refId == 'number')
        {
          // if node found, return it
          if (tmplRef = resolveActionById(refId))
            break;
        }
        cursor = cursor.parentNode;
      }

      var actions = attr.trim().split(/\s+/);
      var actionCallback = tmplRef && tmplRef.action;
      for (var i = 0, actionName; actionName = actions[i++];)
        switch (actionName)
        {
          case 'prevent-default':
            event.preventDefault();
            break;
          case 'stop-propagation':
            event.stopPropagation();
            break;
          case 'log-event':
            /** @cut */ basis.dev.log('Template event:', event);
            break;
          default:
            if (actionCallback)
            {
              event.actionTarget = actionTarget;
              actionCallback.call(tmplRef.context, actionName, event);
            }
        }
    }

    if (event.type in afterEventAction)
      afterEventAction[event.type](event, attrCursor);
  };
}

function emulateEvent(origEventName, emulEventName){
  regEventHandler(emulEventName);
  insideElementEvent[origEventName] = true;

  afterEventAction[emulEventName] = function(event){
    event = new eventUtils.Event(event);
    event.type = origEventName;
    tmplEventListeners[origEventName](event);
  };

  afterEventAction[origEventName] = function(event, cursor){
    if (!cursor || !cursor.parentNode)
      return;

    event = new eventUtils.Event(event);
    event.type = origEventName;
    event.sender = cursor.parentNode;
    tmplEventListeners[origEventName](event);
  };
}

function regEventHandler(eventName){
  if (hasOwnProperty.call(tmplEventListeners, eventName))
    return;

  tmplEventListeners[eventName] = createEventHandler('event-' + eventName);

  if (USE_CAPTURE_FALLBACK)
    return;

  if (!MOUSE_ENTER_LEAVE_SUPPORT)
  {
    if (eventName == 'mouseenter')
      return emulateEvent(eventName, 'mouseover');
    if (eventName == 'mouseleave')
      return emulateEvent(eventName, 'mouseout');
  }

  for (var i = 0, names = eventUtils.browserEvents(eventName), browserEventName; browserEventName = names[i]; i++)
    eventUtils.addGlobalHandler(browserEventName, tmplEventListeners[eventName]);
}


//
// Construct dom structure by declaration.
//

var namespaceURI = {
  svg: 'http://www.w3.org/2000/svg'
};

// test for class attribute set via setAttribute bug (IE7 and lower)
var SET_CLASS_ATTRIBUTE_BUG = (function(){
  var element = document.createElement('div');
  element.setAttribute('class', 'a');
  return !element.className;
})();

// test for style attribute set via setAttribute bug (IE7 and lower)
var SET_STYLE_ATTRIBUTE_BUG = (function(){
  var element = document.createElement('div');
  element.setAttribute('style', 'position:absolute');
  return element.style.position != 'absolute';
})();

function setEventAttribute(node, eventName, actions){
  regEventHandler(eventName);

  // hack for non-bubble events in IE<=8
  if (USE_CAPTURE_FALLBACK)
    node.setAttribute('on' + eventName, USE_CAPTURE_FALLBACK + '("' + eventName + '",event)');

  node.setAttribute('event-' + eventName, actions);
}

function setAttribute(node, name, value){
  if (SET_CLASS_ATTRIBUTE_BUG && name == 'class')
    name = 'className';

  if (SET_STYLE_ATTRIBUTE_BUG && name == 'style')
    return node.style.cssText = value;

  node.setAttribute(name, value);
}

var buildDOM = function(tokens, parent){
  var result = parent || document.createDocumentFragment();
  var offset = parent ? ELEMENT_ATTRIBUTES_AND_CHILDREN : 0;

  for (var i = offset, token; token = tokens[i]; i++)
  {
    var tokenType = token[TOKEN_TYPE];
    switch (tokenType)
    {
      case TYPE_ELEMENT:
        var tagName = token[ELEMENT_NAME];
        var colonIndex = tagName.indexOf(':');
        var element = colonIndex != -1
          ? document.createElementNS(namespaceURI[tagName.substr(0, colonIndex)], tagName)
          : document.createElement(tagName);

        // precess for children and attributes
        buildDOM(token, element);

        // add to result
        result.appendChild(element);

        break;

      case TYPE_ATTRIBUTE:
        if (!token[TOKEN_BINDINGS])
          setAttribute(result, token[ATTR_NAME], token[ATTR_VALUE] || '');
        break;

      case TYPE_ATTRIBUTE_CLASS:
        var attrValue = token[ATTR_VALUE_INDEX[tokenType]];
        attrValue = attrValue ? [attrValue] : [];

        if (token[TOKEN_BINDINGS])
          for (var j = 0, binding; binding = token[TOKEN_BINDINGS][j]; j++)
          {
            var defaultValue = binding[4];
            if (defaultValue)
            {
              var prefix = binding[0];
              if (Array.isArray(prefix))
              {
                // precomputed classes
                // bool: [['prefix_name'],'binding',CLASS_BINDING_BOOL,'name',defaultValue]
                // enum: [['prefix_foo','prefix_bar'],'binding',CLASS_BINDING_ENUM,'name',defaultValue,['foo','bar']]
                attrValue.push(prefix[defaultValue - 1]);
              }
              else
              {
                switch (binding[2])
                {
                  case CLASS_BINDING_BOOL:
                    // ['prefix_','binding',CLASS_BINDING_BOOL,'name',defaultValue]
                    attrValue.push(prefix + binding[3]);
                    break;
                  case CLASS_BINDING_ENUM:
                    // ['prefix_','binding',CLASS_BINDING_ENUM,'name',defaultValue,['foo','bar']]
                    attrValue.push(prefix + binding[5][defaultValue - 1]);
                    break;
                }
              }
            }
          }

        if (attrValue.length)
          setAttribute(result, 'class', attrValue.join(' '));

        break;

      case TYPE_ATTRIBUTE_STYLE:
        var attrValue = token[ATTR_VALUE_INDEX[tokenType]];

        if (attrValue)
          setAttribute(result, 'style', attrValue);

        break;

      case TYPE_ATTRIBUTE_EVENT:
        setEventAttribute(result, token[1], token[2] || token[1]);
        break;

      case TYPE_COMMENT:
        result.appendChild(document.createComment(token[COMMENT_VALUE] || (token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : '')));
        break;

      case TYPE_TEXT:
        // fix bug with normalize text node in IE8-
        if (CLONE_NORMALIZATION_TEXT_BUG && i && tokens[i - 1][TOKEN_TYPE] == TYPE_TEXT)
          result.appendChild(document.createComment(''));

        result.appendChild(document.createTextNode(token[TEXT_VALUE] || (token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : '') || (token[TOKEN_BINDINGS] ? '{' + token[TOKEN_BINDINGS] + '}' : '')));
        break;
    }
  }

  // if there is only one root node, document fragment isn't required
  if (!parent && tokens.length == 1)
    result = result.firstChild;

  return result;
};

module.exports = buildDOM;
