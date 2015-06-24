/**
* @namespace basis.tracker
*/

var hasOwnProperty = Object.prototype.hasOwnProperty;
var tracker = new basis.Token();
var map = {};

function loadMap(newMap){
  for (var key in newMap)
  {
    if (hasOwnProperty.call(map, key))
    {
      /** @cut */ basis.dev.warn('basis.tracker: duplicate data for path `' + key + '`');
      continue;
    }

    map[key] = newMap[key];
  }
}

function getData(event){
  var key;

  key = event.path.concat('action:' + event.action).join(' ');
  if (hasOwnProperty.call(map, key))
    return map[key];

  key = event.path.concat('event:' + event.event).join(' ');
  if (hasOwnProperty.call(map, key))
    return map[key];
}

function track(event){
  tracker.set({
    event: event,
    data: getData(event)
  });
}

resource('./ui.js').ready(function(exports){
  [exports.Node, exports.PartitionNode].forEach(function(Class){
    Class.extend(function(super_, current_){
      return {
        templateAction: function(actionName, event){
          if (tracker.handler)
          {
            var cursor = event.actionTarget;
            var path = [];
            var role;

            if (cursor.hasAttribute('role-marker'))
            {
              while (cursor && cursor !== document)
              {
                var role = cursor.getAttribute('role-marker');
                if (role)
                  path.push(role);
                cursor = cursor.parentNode;
              }

              track({
                type: 'ui',
                path: path.reverse(),
                event: event.type,
                action: actionName
              });
            }
          }

          current_.templateAction.call(this, actionName, event);
        }
      };
    });
  });
});

resource('./net.js').ready(function(exports){
  var trackEvents = ['start', 'success', 'failure', 'abort'];

  exports.transportDispatcher.addHandler({
    '*': function(event){
      var request = event.args[1];
      if (request instanceof exports.AbstractRequest &&
          trackEvents.indexOf(event.type) != -1)
        track({
          type: 'net',
          path: [request.requestData.url],
          event: event.type
        });
    }
  });
});

module.exports = {
  loadMap: loadMap,
  getData: getData,
  attach: function(fn, context){
    tracker.attach(fn, context);
  },
  detach: function(fn, context){
    tracker.detach(fn, context);
  }
};
