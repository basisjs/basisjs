/**
* @namespace basis.tracker
*/

var hasOwnProperty = Object.prototype.hasOwnProperty;
var eventUtils = require('basis.dom.event');
var getComputedStyle = require('basis.dom.computedStyle').get;
var getBoundingRect = require('basis.layout').getBoundingRect;
var tracker = new basis.Token();
var selectorMap = {};
var eventMap = {};

var VISIBLE_CHECK_INTERVAL = 250;

function track(event){
  try {
    tracker.set(event);
  } catch(e) {
    /** @cut */ basis.dev.error('Error during tracking event processing', event, e);
  }
}

// ui activity
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

// net activity
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

//
// show
//

function checkShow(){
  function isVisible(element){
    if (getComputedStyle(element, 'visibility') != 'visible')
      return false;

    var box = getBoundingRect(element);

    if (!box.width || !box.height)
      return false;

    return true;
  }

  var list = getSelectorList('show');

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
        event: 'show',
        data: selector.data
      });
  }
}

//
// main API
//

var roleRegExp = /^(.+?)(?:\((.+)\))?$/;
var subroleRegExp = /\/([^\/\(\)]+)$/;
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

function stringifyPath(path){
  if (typeof path == 'string')
    return path;

  return path.map(stringifyRole).join(' ');
}

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

function escapeQuotes(value){
  return String(value).replace(/\"/g, '\\"');
}

function setDeep(obj, sample, value){
  // search for the first key in `obj` (`obj` can be a nested object)
  // and replace a value of the finded key with `value`
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

function getSelectorList(eventName){
  if (hasOwnProperty.call(eventMap, eventName))
    return eventMap[eventName];

  var selectorList = eventMap[eventName] = [];

  switch (eventName) {
    case 'show':
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
            if (isPathMatchSelector(path, item.selector))
              var data = basis.object.slice(item.data);

              // roleId can be data generated
              if (item.selectorStr.indexOf('*') !== -1) {
                var roleId = path[path.length - 1].roleId;

                setDeep(data, '*', roleId);
              }

              track({
                type: 'ui',
                path: stringifyPath(path),
                selector: stringifyPath(item.selector),
                event: event.type,
                data: data
              });
          });
      });
  }

  return selectorList;
}

function getEventList(selector){
  var selectorStr = stringifyPath(selector);

  if (hasOwnProperty.call(selectorMap, selectorStr))
    return selectorMap[selectorStr];

  var eventList = selectorMap[selectorStr] = [];

  eventList.selectorStr = selectorStr;
  eventList.selector = selector;

  return eventList;
}

function registrateSelector(selector, eventName, data){
  var selectorList = getSelectorList(eventName);
  var eventList = getEventList(selector);
  var selectorStr = eventList.selectorStr;

  if (basis.array.search(selectorList, selectorStr, 'selectorStr'))
  {
    /** @cut */ basis.dev.warn('Duplicate selector for event `' + eventName + '`:' + selector);
    return;
  }

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

function loadMap(map){
  if (!map)
  {
    /** @cut */ basis.dev.warn('Wrong value for map');
    return;
  }

  for (var key in map)
  {
    var eventsMap = map[key];

    if (!eventsMap)
    {
      /** @cut */ basis.dev.warn('Value of map should be an object for path: ' + key);
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
};

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


module.exports = {
  parsePath: parsePath,
  parseRole: parseRole,
  stringifyPath: stringifyPath,
  stringifyRole: stringifyRole,

  getInfo: getInfo,
  getPathByNode: getPathByNode,
  isPathMatchSelector: isPathMatchSelector,
  getCssSelectorFromPath: getCssSelectorFromPath,
  setDeep: setDeep,

  loadMap: loadMap,
  attach: function(fn, context){
    tracker.attach(fn, context);
  },
  detach: function(fn, context){
    tracker.detach(fn, context);
  }
};
