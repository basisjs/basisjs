basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.layout');
basis.require('basis.ui');
basis.require('basis.ui.popup');

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.html').marker;
var inspectBasisEvent = inspectBasis.require('basis.dom.event');

var document = global.document;
var DOM = basis.dom;
var transport = require('../api/transport.js');

var inspectDepth = 0;
var inspectMode;

var overlay = DOM.createElement({
  css: {
    pointerEvents: 'none',
    transition: 'all .05s',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    background: 'rgba(110,163,217,0.7)'
  }
});

function pickHandler(event){
  event.die();

  if (event.mouseRight)
  {
    endInspect();
    return;
  }

  var template = pickupTarget.value ? inspectBasisTemplate.resolveTemplateById(pickupTarget.value) : null;

  if (template)
  {
    var source = template.source;

    if (source.url && template.source instanceof inspectBasisTemplate.L10nProxyToken == false)
    {
      var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

      if (basisjsTools && typeof basisjsTools.openFile == 'function' && (event.ctrlKey || event.metaKey))
        basisjsTools.openFile(source.url);
      else
        transport.sendData('pickTemplate', {
          filename: source.url
        });
    }
    else
      transport.sendData('pickTemplate', {
        content: typeof source == 'string' ? source : ''
      });

    endInspect();
  }
}

var pickupTarget = new basis.data.Value({
  handler: {
    change: function(){
      var tmpl = this.value ? inspectBasisTemplate.resolveTmplById(this.value) : null;

      if (tmpl)
      {
        var rect = basis.layout.getBoundingRect(tmpl.element);
        if (rect)
        {
          basis.cssom.setStyle(overlay, {
            left: rect.left + 'px',
            top: rect.top + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
          });
          document.body.appendChild(overlay);
        }
      }
      else
      {
        DOM.remove(overlay);
        inspectDepth = 0;
      }

      nodeInfoPopup().update({
        tmpl: tmpl,
        template: tmpl && inspectBasisTemplate.resolveTemplateById(this.value),
        object: tmpl && inspectBasisTemplate.resolveObjectById(this.value)
      });
    }
  }
});

var nodeInfoPopup = basis.fn.lazyInit(function(){
  return new basis.ui.popup.Balloon({
    dir: 'left bottom left top',
    template: resource('./template/template_hintPopup.tmpl'),
    autorotate: [
      'left top left bottom',
      'left bottom left bottom',
      'left top left top',
      'right bottom right top',
      'right top right bottom',
      'right bottom right bottom',
      'right top right top'
    ],
    binding: {
      instanceName: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
          {
            return object.constructor.className + '#' + object.basisObjectId;
          }
        }
      },
      rootNodeSelector: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.data.tmpl)
          {
            var el = node.data.tmpl.element;
            return el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '');
          }
        }
      },
      source: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.data.template)
          {
            var template = node.data.template;
            var url = template.source.url ? basis.path.relative(template.source.url) : '[inline template]';
            return url.charAt(0) == '.' ? basis.path.resolve(url) : url;
          }
        }
      },
      name: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.data.template)
          {
            var source = node.data.template.source;
            return source instanceof inspectBasisTemplate.SourceWrapper ? source.path : '';
          }
        }
      }
    },
    handler: {
      update: function(){
        if (this.data.tmpl)
          this.show(this.data.tmpl.element);
        else
          this.hide();
      },
      hide: function(){
        this.update({
          tmpl: null
        });
      }
    }
  });
});

function startInspect(){
  if (!inspectMode)
  {
    basis.dom.event.addGlobalHandler('mousemove', mousemoveHandler);
    basis.dom.event.addGlobalHandler('mousewheel', mouseWheelHandler);
    inspectBasisEvent.captureEvent('mousedown', basis.dom.event.kill);
    inspectBasisEvent.captureEvent('mouseup', basis.dom.event.kill);
    inspectBasisEvent.captureEvent('contextmenu', endInspect);
    inspectBasisEvent.captureEvent('click', pickHandler);

    basis.cssom.classList(document.body).add('devpanel-inspectMode');
    inspectMode = true;
    transport.sendData('startInspect', 'template');
  }
}

function endInspect(){
  if (inspectMode)
  {
    basis.dom.event.removeGlobalHandler('mousemove', mousemoveHandler);
    basis.dom.event.removeGlobalHandler('mousewheel', mouseWheelHandler);
    inspectBasisEvent.releaseEvent('mousedown');
    inspectBasisEvent.releaseEvent('mouseup');
    inspectBasisEvent.releaseEvent('contextmenu');
    inspectBasisEvent.releaseEvent('click');

    basis.cssom.classList(document.body).remove('devpanel-inspectMode');
    inspectMode = false;
    transport.sendData('endInspect', 'template');
    pickupTarget.set();
  }
}

var lastMouseX;
var lastMouseY;
var DEPTH_MODE_MOVE_THRESHOLD = 8;

function mousemoveHandler(event){
  var dx = Math.abs(event.mouseX - lastMouseX);
  var dy = Math.abs(event.mouseY - lastMouseY);
  var cursor = event.sender;
  var refId;

  if (inspectDepth && lastMouseX && dx < DEPTH_MODE_MOVE_THRESHOLD && dy < DEPTH_MODE_MOVE_THRESHOLD)
    return;

  lastMouseX = event.mouseX;
  lastMouseY = event.mouseY;

  do {
    if (refId = cursor[inspectBasisTemplateMarker])
    {
      inspectDepth = 0;
      break;
    }
  }
  while (cursor = cursor.parentNode);

  pickupTarget.set(refId);
}

function mouseWheelHandler(event){
  var delta = event.wheelDelta;
  var sender = event.sender;
  var cursor = sender;

  var tempDepth = inspectDepth + delta;
  var curDepth = 0;
  var lastRefId;
  var lastDepth;
  var refId;

  do {
    if (refId = cursor[inspectBasisTemplateMarker])
    {
      lastRefId = refId;
      lastDepth = curDepth;

      if (tempDepth < 0 || curDepth == tempDepth)
        break;

      curDepth++;
    }
  }
  while (cursor = cursor.parentNode);

  pickupTarget.set(lastRefId);
  inspectDepth = lastDepth;

  event.die();
}

//
//  exports
//
module.exports = {
  startInspect: startInspect,
  endInspect: endInspect,
  isActive: function(){
    return !!inspectMode;
  }
};
