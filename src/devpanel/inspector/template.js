require('basis.dom');
require('basis.dom.event');
require('basis.layout');
require('basis.ui');
require('basis.ui.popup');

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisEvent = inspectBasis.require('basis.dom.event');

var document = global.document;
var transport = require('../api/transport.js');
var templateInfo = require('./template-info/index.js');

var inspectDepth = 0;
var inspectMode = new basis.data.Value({ value: false });

var overlay = basis.dom.createElement({
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
var boxElement = basis.dom.createElement({
  css: {
    visibility: 'hidden',
    position: 'absolute'
  }
});

function pickHandler(event){
  event.die();

  if (event.mouseRight)
  {
    stopInspect();
    return;
  }

  var templateId = pickupTarget.value;
  var template = templateId ? inspectBasisTemplate.resolveTemplateById(templateId) : null;

  if (template)
  {
    var source = template.source;

    stopInspect();

    if (source.url)
    {
      var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

      if (basisjsTools && typeof basisjsTools.openFile == 'function' && (event.ctrlKey || event.metaKey))
        basisjsTools.openFile(source.url);
      else
      {
        templateInfo.set(inspectBasisTemplate.resolveObjectById(templateId).element);
        transport.sendData('pickTemplate', {
          filename: source.url
        });
      }
    }
    else
    {
      templateInfo.set(inspectBasisTemplate.resolveObjectById(templateId).element);
      transport.sendData('pickTemplate', {
        content: typeof source == 'string' ? source : ''
      });
    }

  }
}

var pickupTarget = new basis.data.Value({
  handler: {
    change: function(){
      var tmpl = this.value ? inspectBasisTemplate.resolveTmplById(this.value) : null;

      if (tmpl)
      {
        var rectNode = tmpl.element;
        var rect;

        if (rectNode.nodeType == 3)
        {
          rectNode = document.createRange();
          rectNode.selectNodeContents(tmpl.element);
        }

        rect = basis.layout.getBoundingRect(rectNode);

        if (rect)
        {
          var style = {
            left: rect.left + 'px',
            top: rect.top + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
          };
          basis.cssom.setStyle(overlay, style);
          basis.cssom.setStyle(boxElement, style);
          document.body.appendChild(overlay);
          document.body.appendChild(boxElement);
        }
      }
      else
      {
        basis.dom.remove(overlay);
        basis.dom.remove(boxElement);
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
            var cls = el.nodeType == 1 ? (typeof el.className == 'string' ? el.className : el.className.baseVal) : '';
            return (el.nodeType == 3 ? '#text' : el.tagName) + (el.id ? '#' + el.id : '') + (cls ? '.' + cls.split(' ').join('.') : '');
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
          this.show(boxElement);
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
  if (!inspectMode.value)
  {
    templateInfo.set();
    basis.dom.event.addGlobalHandler('mousemove', mousemoveHandler);
    basis.dom.event.addGlobalHandler('mousewheel', mouseWheelHandler);
    basis.dom.event.addGlobalHandler('wheel', mouseWheelHandler);
    basis.dom.event.addGlobalHandler('DOMMouseScroll', mouseWheelHandler);
    inspectBasisEvent.captureEvent('mousedown', basis.dom.event.kill);
    inspectBasisEvent.captureEvent('mouseup', basis.dom.event.kill);
    inspectBasisEvent.captureEvent('contextmenu', stopInspect);
    inspectBasisEvent.captureEvent('click', pickHandler);

    inspectMode.set(true);
    transport.sendData('startInspect', 'template');
  }
}

function stopInspect(){
  if (inspectMode.value)
  {
    basis.dom.event.removeGlobalHandler('mousemove', mousemoveHandler);
    basis.dom.event.removeGlobalHandler('mousewheel', mouseWheelHandler);
    basis.dom.event.removeGlobalHandler('wheel', mouseWheelHandler);
    basis.dom.event.removeGlobalHandler('DOMMouseScroll', mouseWheelHandler);
    inspectBasisEvent.releaseEvent('mousedown');
    inspectBasisEvent.releaseEvent('mouseup');
    inspectBasisEvent.releaseEvent('contextmenu');
    inspectBasisEvent.releaseEvent('click');

    inspectMode.set(false);
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
  name: 'Template',
  startInspect: startInspect,
  stopInspect: stopInspect,
  inspectMode: inspectMode,
  isActive: function(){
    return inspectMode.value;
  }
};
