/**
* @namespace basis.tracker
*/

/** @cut */ var namespace = 'basis.tracker';

var hasOwnProperty = Object.prototype.hasOwnProperty;
var eventUtils = require('basis.dom.event');
var getComputedStyle = require('basis.dom.computedStyle').get;
var getBoundingRect = require('basis.layout').getBoundingRect;

/**
 * @typedef {TrackingDataObject}
 * @property {string} type 'ui|net',
 * @property {string} path result of `stringifyPath` function,
 * @property {string} event browser event.type or SHOW_EVENT,
 * @property {string=} path Real path in DOM, stringifyPath(getPathByNode(visibleElement)),
 * @property {string=} selector Custom path from loaded tracking maps, selector.selectorStr = stringifyPath(selector),
 * @property {Object=} data custom data
 * @property {string=} action first argument in PartitionNode.templateAction, like 'scrollTo'
 */

/**
 * This token is used to pass some data about an event to a custom functions through an `attach` method.
 * The value of this token can be changed only by `track` function here.
 * @private
 */
var tracker = new basis.Token();

/**
 * All selectors from tracking maps, that are loaded with `loadMap` method.
 * Maps a selector string to a list of tracking objects as described in custom tracking maps.
 * @private
 * @type Object
 */
var selectorMap = {};

/**
 * Maps an event name to a list of tracking objects as described in custom tracking maps.
 * Event names can be like these: `click`, `focus`, `input`, `blur`, `success`, etc.
 * eventMap.show will be a list of tracking objects, and taht list has `visibility` property,
 * eventMap.show.visibility is an object: custom selector string --> boolean
 * @private
 * @type Object
 */
var eventMap = {};

var VISIBLE_CHECK_INTERVAL = 250;
var SHOW_EVENT = 'show';
var INPUT_DEBOUNCE_TIMEOUT = 1000;

/**
 * Maps an event name to a list of tracking objects
 * @param {TrackingDataObject} event a tracking object
 * @private
 * @return
 */
function track(event){
  try {
    // TODO look up for event.data.transformer before setting data
    tracker.set(event);
  } catch(e) {
    /** @cut */ basis.dev.error(namespace + '.track(): Error during tracking event processing', event, e);
  }
}

// Examples:

// 1. ui activity
// resource('./ui.js').ready(function(exports){
//   [exports.Node, exports.PartitionNode].forEach(function(Class){
//     Class.extend(function(super_, current_){
//       return {
//         templateAction: function(actionName, event){
//           if (tracker.handler)
//           {
//             var cursor = event.actionTarget;
//             var path = [];
//             var role;

//             if (cursor.hasAttribute('role-marker'))
//             {
//               while (cursor && cursor !== document)
//               {
//                 var role = cursor.getAttribute('role-marker');
//                 if (role)
//                   path.unshift(role);
//                 cursor = cursor.parentNode;
//               }

//               track({
//                 type: 'ui',
//                 path: path,
//                 event: event.type,
//                 action: actionName
//               });
//             }
//           }

//           current_.templateAction.call(this, actionName, event);
//         }
//       };
//     });
//   });
// });

// 2. net activity
// resource('./net.js').ready(function(exports){
//   var trackEvents = ['start', 'success', 'failure', 'abort'];

//   exports.transportDispatcher.addHandler({
//     '*': function(event){
//       var request = event.args[1];
//       if (request instanceof exports.AbstractRequest &&
//           trackEvents.indexOf(event.type) != -1)
//         track({
//           type: 'net',
//           path: [request.requestData.url],
//           event: event.type
//         });
//     }
//   });
// });

// 3. http://localhost:8123/demo/data/userlist-with-roles.html
// Do test with this page.

//
// `show` event
//

/**
 * Transforms given path to a css selector
 * @param {string} path
 * @param {string} selector
 * @private
 * @return {string}
 */
function getCssSelectorFromPath(path, selector){
  return parsePath(path).map(function(role){
    if (!role.role)
      return '';

    var start = escapeQuotes(role.role);
    var end = (role.subrole ? '/' + escapeQuotes(role.subrole) : '') + '"]';

    if (role.roleId)
    {
      if (selector && role.roleId == '*')
        start = '[role-marker^="' + start + '("][role-marker$=")';
      else
        start = '[role-marker="' + start + '(' + escapeQuotes(role.roleId) + ')';
    }
    else
    {
      start = '[role-marker="' + start;
    }

    return start + end;
  }).join(' ');
}

/**
 * Tracks visibilty changes for nodes marked with show event in custom tracking maps
 * @private
 * @return
 */
function checkShow(){
  /**
   * Checks visibility of an element on a page in a browser
   * @param {HTMLElement} element some DOM node
   * @private
   * @return {boolean}
   */
  function isVisible(element){
    if (getComputedStyle(element, 'visibility') != 'visible')
      return false;

    var box = getBoundingRect(element);

    if (!box.width || !box.height)
      return false;

    return true;
  }

  var list = getSelectorList(SHOW_EVENT);

  for (var i = 0; i < list.length; i++)
  {
    var selector = list[i];
    var elements = document.querySelectorAll(getCssSelectorFromPath(selector.selector, true));
    var visibleElement = basis.array.search(basis.array(elements), true, isVisible);
    var visible = Boolean(visibleElement);
    var state;

    if (!hasOwnProperty.call(list.visible, selector.selectorStr))
      state = list.visible[selector.selectorStr] = false;
    else
      state = list.visible[selector.selectorStr];

    list.visible[selector.selectorStr] = visible;

    if (state == false && visible)
      track({
        type: 'ui',
        path: stringifyPath(getPathByNode(visibleElement)),
        selector: selector.selectorStr,
        event: SHOW_EVENT,
        data: selector.data
      });
  }
}

/**
 * Search for the first key in `obj` (`obj` can be a nested object)
 * and replaces a value of the finded key with `value`
 * private except for tests
 * @param {Object} obj any object
 * @param {string} sample some stub like '*'
 * @param {string} value a dynamic value
 * @return
 */
function setDeep(obj, sample, value){
  for (var key in obj)
  {
    if (hasOwnProperty.call(obj, key))
    {
      if (obj[key] === sample)
      {
        obj[key] = value;
        return;
      }
      else if (typeof obj[key] === 'object')
        return setDeep(obj[key], sample, value);
    }
  }
}

/**
 * Clean up string
 * @param {string} value
 * @private
 * @return {string}
 */
function escapeQuotes(value){
  return String(value).replace(/\"/g, '\\"');
}

/**
 * Search for the first key in `obj` (`obj` can be a nested object)
 * and replaces a value of the finded key with `value`
 * private except for tests
 * @param {Array.<RoleObject>} path
 * @param {Object} item custom tracking data object from some tracking map
 * @param {Object} item.data
 * @param {Array.<string>} item.selector
 * @param {string} item.selectorStr
 * @param {DOMEvent} event
 * @return {{ debounce: boolean, dataToTrack: TrackingDataObject }}
 */
function handleEventFor(path, item, event){
  if (!isPathMatchSelector(path, item.selector))
    return;

  var data = basis.object.slice(item.data);
  var INPUT_EVENTS = ['keyup', 'keydown', 'keypress', 'input']; // when a user is typing

  if (INPUT_EVENTS.indexOf(event.type) != -1)
  {
    data.inputValue = event.target.value;

    return {
      debounce: true,
      dataToTrack: {
        type: 'ui',
        path: stringifyPath(path),
        selector: stringifyPath(item.selector),
        event: event.type,
        data: data.transformWithUIEvent(data, event)
      }
    };
  }
  else
  {
    // roleId can be data generated
    if (item.selectorStr.indexOf('*') !== -1)
    {
      var roleId = path[path.length - 1].roleId;
      var starWasFound = false;

      for (var key in data)
        if (hasOwnProperty.call(data, key))
          if (data[key] === '*')
          {
            data[key] = roleId;
            starWasFound = true;
            break;
          }

      if (!starWasFound)
      {
        data = JSON.parse(JSON.stringify(item.data));
        setDeep(data, '*', roleId);
      }
    }

    return {
      dataToTrack: {
        type: 'ui',
        path: stringifyPath(path),
        selector: stringifyPath(item.selector),
        event: event.type,
        data: data.transformWithUIEvent(data, event)
      }
    };
  }
}

/**
 * Fills up the eventMap, also adds a handler for each browser event, mentioned in custom tracking maps
 * @param {string} eventName browser event.type or SHOW_EVENT
 * @private
 * @return {Array}
 */
function getSelectorList(eventName){
  if (hasOwnProperty.call(eventMap, eventName))
    return eventMap[eventName];

  var selectorList = eventMap[eventName] = [];
  var inputTimeout = null;

  switch (eventName) {
    case SHOW_EVENT:
      selectorList.visible = {};
      setInterval(checkShow, VISIBLE_CHECK_INTERVAL);
      break;

    default:
      eventUtils.addGlobalHandler(eventName, function(event){
        var path = event.path.reduce(function(res, node){
          var role = node.getAttribute ? node.getAttribute('role-marker') : null;
          if (role)
            res.unshift(parseRole(role));
          return res;
        }, []);

        // if there is at least one `role-marker` attribute in the DOM [x]path for the clicked (or hovered or `event`ed) element
        // then lets search a matching selector in our loaded track map
        if (path.length)
          selectorList.forEach(function(item){
            var result = handleEventFor(path, item, event);
            if (result)
              if (result.debounce)
              {
                clearTimeout(inputTimeout);
                inputTimeout = setTimeout(function(){
                  track(result.dataToTrack);
                }, INPUT_DEBOUNCE_TIMEOUT);
              }
              else
              {
                track(result.dataToTrack);
              }
          });
      });
  }

  return selectorList;
}

/**
 * if there is no such selector in the `selectorMap`, creates empty array
 * @param {string} selector
 * @private
 * @return {Array}
 */
function getEventList(selector){
  var selectorStr = stringifyPath(selector);

  if (hasOwnProperty.call(selectorMap, selectorStr))
    return selectorMap[selectorStr];

  var eventList = selectorMap[selectorStr] = [];

  eventList.selectorStr = selectorStr;
  eventList.selector = selector;

  return eventList;
}

/**
 * Adds some tracking data description to a selector list choosen by event name
 * and vice versa – to an event list choosen by selector from the map
 * @param {string} selector
 * @param {string} eventName
 * @param {Object} data custom tracking data from custom tracking maps
 * @private
 * @return
 */
function registrateSelector(selector, eventName, data){
  var selectorList = getSelectorList(eventName);
  var eventList = getEventList(selector);
  var selectorStr = eventList.selectorStr;

  if (basis.array.search(selectorList, selectorStr, 'selectorStr'))
  {
    /** @cut */ basis.dev.warn(namespace + '.registrateSelector(): Duplicate selector for event `' + eventName + '`:' + selector);
    return;
  }

  if (typeof data.transformWithUIEvent !== 'function')
    data.transformWithUIEvent = basis.fn.$self;

  selectorList.push({
    selector: selector,
    selectorStr: selectorStr,
    data: data
  });

  eventList.push({
    event: eventName,
    data: data
  });
}

var roleRegExp = /^(.+?)(?:\((.+)\))?$/;
var subroleRegExp = /\/([^\/\(\)]+)$/;

/**
 * @typedef {RoleObject}
 * @property {string} role
 * @property {string} roleId
 * @property {string} subrole
 */

/**
 * Parses a string to a role object.
 * Is used in devpanel
 * @param {string} str
 * @return {RoleObject}
 */
function parseRole(str){
  var role = '';
  var roleId = '';
  var subrole = '';
  var m;

  if (m = str.match(subroleRegExp))
  {
    subrole = m[1];
    str = str.substr(0, str.length - m[0].length);
  }

  if (m = str.match(roleRegExp))
  {
    role = m[1] || '';
    roleId = m[2] || '';
  }

  return {
    role: role,
    roleId: roleId,
    subrole: subrole
  };
}

/**
 * Inverse to parseRole function.
 * Is used in devpanel.
 * @param {string|RoleObject} role
 * @return {string}
 */
function stringifyRole(role){
  if (typeof role == 'string')
    return role;

  if (!role)
    return '';

  return [
    role.role || '',
    role.roleId ? '(' + role.roleId + ')' : '',
    role.subrole ? '/' + role.subrole : ''
  ].join('');
}

/**
 * Parses a string or a list to a list of role objects.
 * Private except for tests.
 * @param {string|Array.<string>} value
 * @return {Array.<RoleObject>}
 */
function parsePath(value){
  if (!Array.isArray(value))
    value = String(value || '').trim().split(/\s+/);

  return value.map(function(part){
    if (typeof part == 'string')
      return parseRole(part);

    return part || {
      role: '',
      roleId: '',
      subrole: ''
    };
  });
}

/**
 * Inverse to parsePath function.
 * Is used in devpanel.
 * @param {string|Array.<RoleObject|string>} path
 * @return {string}
 */
function stringifyPath(path){
  if (typeof path == 'string')
    return path;

  return path.map(stringifyRole).join(' ');
}

/**
 * private except for tests
 * @param {Array.<RoleObject>} path
 * @param {string|RoleObject} selector
 * @return {boolean}
 */
function isPathMatchSelector(path, selector){
  function isMatch(path, selector){
    path = typeof path == 'string' ? parseRole(path) : path || '';
    selector = typeof selector == 'string' ? parseRole(selector) : selector || '';

    return selector.role == path.role &&
           (selector.roleId == '*' || selector.roleId == path.roleId) &&
           selector.subrole == path.subrole;
  }

  var pathIndex = path.length;
  var selectorIndex = selector.length;

  if (!selectorIndex)
    return true;

  if (!isMatch(path[--pathIndex], selector[--selectorIndex]))
    return false;

  while (pathIndex > 0 && selectorIndex > 0)
    if (!isMatch(path[--pathIndex], selector[--selectorIndex]))
      selectorIndex++;

  return selectorIndex === 0;
}

/**
 * Relies on `selectorMap`
 * Is used in devpanel.
 * @param {string|Array.<RoleObject>} path
 * @return {Array.<Object>|boolean} here Object is a tracking data object
 */
function getInfo(path){
  var result = [];

  if (typeof path == 'string')
    path = parsePath(path);

  for (var key in selectorMap)
    if (isPathMatchSelector(path, selectorMap[key].selector))
      result.push.apply(result, selectorMap[key].map(function(item){
        return basis.object.extend({
          selector: selectorMap[key].selector,
          selectorStr: selectorMap[key].selectorStr
        }, item);
      }));

  return result.length ? result : false;
}

/**
 * Works similar to `parsePath` but for DOM nodes, not for strings
 * Is used in devpanel.
 * @param {HTMLElement} node
 * @return {Array.<RoleObject>}
 */
function getPathByNode(node){
  var cursor = node;
  var path = [];
  var role;

  while (cursor && cursor !== document)
  {
    if (role = cursor.getAttribute('role-marker'))
      path.unshift(parseRole(role));
    cursor = cursor.parentNode;
  }

  return path;
}

//
// main API
//

/**
 * Registers all selectors from a given map
 * @param {Object} map
 * @return
 */
function loadMap(map){
  if (!map)
  {
    /** @cut */ basis.dev.warn(namespace + '.loadMap(): Wrong value for map');
    return;
  }

  for (var key in map)
  {
    var eventsMap = map[key];

    if (!eventsMap)
    {
      /** @cut */ basis.dev.warn(namespace + '.loadMap(): Value of map should be an object for path: ' + key);
      continue;
    }

    var selector = parsePath(key);
    for (var events in eventsMap)
    {
      var data = eventsMap[events];

      events.trim().split(/\s+/).forEach(function(eventName){
        registrateSelector(selector, eventName, data);
      });
    }
  }
}

/**
 * A way to add custom data to a tracking data object
 * @param {{ addHandler: function(object) }} dispatcher basis.net.transportDispatcher or another basis.event.Emitter or any object with addHandler function
 * @param {string|Array} events list of events recognizable by `dispatcher`
 * @param {function(event, item):object} transformer function should return a tracking data object
 * @return {undefined|boolean}
 */
function addDispatcher(dispatcher, events, transformer){
  if (!dispatcher || typeof dispatcher.addHandler != 'function')
  {
    /** @cut */ basis.dev.warn(namespace + '.addDispatcher(): First argument should have `addHandler` method');
    return;
  }

  if (typeof events == 'string')
    events = events.split(/\s+/);

  if (!Array.isArray(events))
  {
    /** @cut */ basis.dev.warn(namespace + '.addDispatcher(): Second argument should be a list of events');
    return;
  }

  if (typeof transformer != 'function')
  {
    /** @cut */ basis.dev.warn(namespace + '.addDispatcher(): Third argument should be a function');
    return;
  }

  dispatcher.addHandler({
    '*': function(event){
      if (events.indexOf(event.type) != -1)
      {
        var eventName = event.type;
        var selectorList = getSelectorList(eventName);

        selectorList.forEach(function(item){
          var data = transformer(event, item);

          if (data)
            track(data);
        });
      }
    }
  });

  return true;
}

module.exports = {
  /** @cut */ parseRole: parseRole,
  /** @cut */ stringifyPath: stringifyPath,
  /** @cut */ stringifyRole: stringifyRole,

  getInfo: getInfo,
  /** @cut */ getPathByNode: getPathByNode,
  /** @cut */ isPathMatchSelector: isPathMatchSelector,
  /** @cut */ setDeep: setDeep,
  /** @cut */ handleEventFor: handleEventFor,

  loadMap: loadMap,
  addDispatcher: addDispatcher,
  attach: function(fn, context){
    tracker.attach(fn, context);
  },
  detach: function(fn, context){
    tracker.detach(fn, context);
  }
};
