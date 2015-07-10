/**
* @namespace basis.tracker
*/

var hasOwnProperty = Object.prototype.hasOwnProperty;
var eventUtils = require('basis.dom.event');
var tracker = new basis.Token();
var map = {};
var selectorMap = {};
var eventMap = {};

function track(event){
  tracker.set({
    event: event,
    data: event.data
  });
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

function stringifyPath(path){
  if (typeof path == 'string')
    return path;

  return path.map(function(item){
    return [
      item.role || '',
      item.roleId ? '(' + item.roleId + ')' : '',
      item.subrole ? '/' + item.subrole : ''
    ].join('');
  }).join(' ');
}

function getSelectorList(eventName){
  if (hasOwnProperty.call(eventMap, eventName))
    return eventMap[eventName];

  var selectorList = eventMap[eventName] = [];

  eventUtils.addGlobalHandler(eventName, function(event){
    var path = getPathByNode(event.sender);

    if (path.length)
      selectorList.forEach(function(item){
        if (isPathMatchSelector(path, item.selector))
          track({
            type: 'ui',
            path: stringifyPath(path),
            selector: stringifyPath(item.selector),
            event: event.type,
            data: item.data
          });
      });
  });

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

    var selector = key.trim().split(/\s+/).map(parseRole);
    var selectorStr = stringifyPath(selector);
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

  for (var key in selectorMap)
    if (isPathMatchSelector(path, selectorMap[key].selector))
      result.push.apply(result, selectorMap[key]);

  return result.length ? result : false;
}


module.exports = {
  getInfo: getInfo,
  parseRole: parseRole,
  isPathMatchSelector: isPathMatchSelector,

  loadMap: loadMap,
  attach: function(fn, context){
    tracker.attach(fn, context);
  },
  detach: function(fn, context){
    tracker.detach(fn, context);
  }
};
