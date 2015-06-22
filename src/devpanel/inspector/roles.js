var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;

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

function getActions(domNode){
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
  template: resource('./template/roles/overlay.tmpl'),

  childClass: {
    template: resource('./template/roles/token.tmpl'),
    binding: {
      missedActions: 'data:missedActions',
      role: {
        events: 'update',
        getter: function(node){
          return node.data.role || '(no role)';
        }
      },
      problem: {
        events: 'update',
        getter: function(node){
          return !node.data.role || node.data.missedActions;
        }
      }
    }
  },

  processNode: function(domNode){
    if (domNode.nodeType == 1)
    {
      var actions = getActions(domNode);
      var roleMarker = domNode.getAttribute('role-marker') || '';
      if (actions || roleMarker)
      {
        var object = actions ? findObject(domNode) : false;
        var brokenActions = false;

        if (object && object.action)
          brokenActions = actions.filter(function(actionName){
            return typeof object.action[actionName] != 'function' &&
              actionName != 'prevent-default' &&
              actionName != 'stop-propagation' &&
              actionName != 'log-event';
          });

        this.highlight(domNode, {
          role: roleMarker,
          missedActions: brokenActions && brokenActions.length
            ? brokenActions.join(' ')
            : ''
        });
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
  isActive: function(){
    return overlay.active;
  }
};
