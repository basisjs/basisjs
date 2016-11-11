var hasOwnProperty = Object.prototype.hasOwnProperty;
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisTracker = inspectBasis.require('basis.tracker');
var getTrackInfo = inspectBasisTracker.getInfo;
var trackingInfo = resource('../view/tracking-info/index.js');
var inspectMode = require('api').inspect;

var Overlay = require('./common/overlay.js');
var Node = require('basis.ui').Node;
var events = [
  'click',
  'mousedown',
  'mouseup',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'mousemove',

  'pointerdown',
  'pointerup',
  'pointerenter',
  'pointerleave',
  'pointerover',
  'pointerout',
  'pointermove',
  'pointercancel',

  'touchstart',
  'touchend',
  'touchcancel',
  'touchleave',
  'touchmove',

  'keyup',
  'keydown',
  'keypress',
  'input',

  'change',
  'focus',
  'blur'
];

function findObject(domNode){
  var cursor = domNode;

  while (cursor && inspectBasisTemplateMarker in cursor == false)
    cursor = cursor.parentNode;

  if (cursor)
    return inspectBasisTemplate.resolveObjectById(cursor[inspectBasisTemplateMarker]);
}

function getEvents(domNode){
  return events.filter(function(eventName){
    return domNode.hasAttribute('event-' + eventName);
  });
}

function getActions(domNode, events){
  var result = events
    .map(function(eventName){
      return domNode.getAttribute('event-' + eventName);
    })
    .filter(Boolean)
    .join(' ')
    .trim();

  if (result)
    return result.split(/\s+/);

  return false;
}

var eventLog = new Node({
  template: resource('./roles/event-log.tmpl'),
  childClass: {
    template: resource('./roles/event-log-entry.tmpl'),
    binding: {
      event: 'data:',
      selector: 'data:',
      data: function(node){
        return JSON.stringify(node.data.data, null, 2);
      },
      destroing: 'data:'
    },
    init: function(){
      Node.prototype.init.call(this);
      setTimeout(this.destroy.bind(this), 8000);
      setTimeout(function(){
        this.update({ destroing: true });
      }.bind(this), 7500);
    }
  }
});

inspectBasisTracker.attach(function(event){
  eventLog.appendChild({
    data: event
  });
});

var overlay = new Overlay({
  pickMode: inspectMode.as(function(value){
    return value === 'pick-roles';
  }),

  template: resource('./roles/overlay.tmpl'),
  binding: {
    pickMode: 'pickMode',
    eventLog: eventLog
  },

  childClass: {
    template: resource('./roles/token.tmpl'),
    binding: {
      hasActions: 'data:',
      missedActions: 'data:',
      conflict: 'data:',
      track: 'data:',
      role: {
        events: 'update',
        getter: function(node){
          return node.data.role || '(no role)';
        }
      },
      problem: {
        events: 'update',
        getter: function(node){
          return !node.data.role || node.data.missedActions || node.data.conflict;
        }
      }
    },
    action: {
      showPath: function(){
        trackingInfo().set(this.domNode);
        inspectMode.set(false);
        overlay.deactivate();
      }
    }
  },

  activate: function(){
    if (trackingInfo.isResolved())
      trackingInfo().set();

    Overlay.prototype.activate.apply(this, arguments);
  },

  apply: function(){
    this.pathMap = {};
    Overlay.prototype.apply.call(this);
  },

  processNode: function(domNode){
    if (domNode.nodeType == 1)
    {
      var events = getEvents(domNode);
      var actions = getActions(domNode, events);
      var roleMarker = domNode.getAttribute('role-marker') || '';

      if (actions || roleMarker)
      {
        var object = actions ? findObject(domNode) : false;
        var brokenActions = false;
        var path = [];
        var knownPath = false;

        if (roleMarker)
        {
          var cursor = domNode;

          while (cursor && cursor !== document)
          {
            var role = cursor.getAttribute('role-marker');
            if (role)
              path.unshift(role);
            cursor = cursor.parentNode;
          }

          knownPath = hasOwnProperty.call(this.pathMap, path);
          if (knownPath)
          {
            if (this.pathMap[path] !== true)
            {
              this.pathMap[path].update({
                conflict: true
              });
              this.pathMap[path] = true;
            }
          }
        }

        if (object && object.action)
          brokenActions = actions.filter(function(actionName){
            return typeof object.action[actionName] != 'function' &&
              actionName != 'prevent-default' &&
              actionName != 'stop-propagation' &&
              actionName != 'log-event';
          });

        var node = this.highlight(domNode, {
          role: roleMarker,
          hasActions: !!actions,
          missedActions: brokenActions && brokenActions.length ? brokenActions.join(' ') : '',
          conflict: knownPath,
          track: !!getTrackInfo(path),
          path: path.join(' ')
        });


        if (roleMarker && !knownPath && node)
          this.pathMap[path] = node;
      }
    }
  }
});

overlay.pickMode.link(overlay, function(pickMode){
  var events = {};

  if (pickMode)
    events = {
      click: true,
      mousedown: true,
      mouseup: true
    };

  this.setMuteEvents(events);
});

//
// exports
//

module.exports = {
  name: 'Roles',
  startInspect: function(){
    overlay.activate();
  },
  stopInspect: function(){
    overlay.deactivate();
  }
};
