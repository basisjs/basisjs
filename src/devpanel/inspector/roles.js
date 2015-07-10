var hasOwnProperty = Object.prototype.hasOwnProperty;
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisUI = inspectBasis.require('basis.ui');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var getTrackInfo = inspectBasis.require('basis.tracker').getInfo;

var Node = global.Node;
var Value = require('basis.data').Value;
var Overlay = require('./utils/overlay.js');
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

var overlay = new Overlay({
  pickMode: new basis.Token(false),

  template: resource('./template/roles/overlay.tmpl'),
  binding: {
    pickMode: 'pickMode'
  },

  childClass: {
    template: resource('./template/roles/token.tmpl'),
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
        global.prompt('Path:', this.data.path);
      }
    }
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
  },
  inspectMode: Value.from(overlay, 'activeChanged', 'active'),
  pickMode: overlay.pickMode,
  isActive: function(){
    return overlay.active;
  }
};
