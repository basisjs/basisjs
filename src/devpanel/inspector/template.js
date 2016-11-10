var domUtils = require('basis.dom');
var domEventUtils = require('basis.dom.event');
var setStyle = require('basis.cssom').setStyle;
var getBoundingRect = require('basis.layout').getBoundingRect;
var Value = require('basis.data').Value;
var Balloon = require('basis.ui.popup').Balloon;

var fileAPI = require('api').ns('file');
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;
var inspectBasisEvent = inspectBasis.require('basis.dom.event');

var document = global.document;
var templateInfo = resource('../view/template-info/index.js');

var inspect = require('api').inspect;
var inspecting = false;
var inspectDepth = 0;

var overlay = domUtils.createElement({
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
var boxElement = domUtils.createElement({
  css: {
    visibility: 'hidden',
    position: 'absolute'
  }
});

function pickHandler(event){
  event.die();

  if (event.mouseRight)
  {
    inspect.set(false);
    return;
  }

  var templateId = pickupTarget.value;
  var template = templateId ? inspectBasisTemplate.resolveTemplateById(templateId) : null;

  if (template)
  {
    var source = template.source;

    inspect.set(false);

    if (source.url)
    {
      if (event.ctrlKey || event.metaKey)
      {
        fileAPI.open(source.url);
      }
      else
      {
        var object = inspectBasisTemplate.resolveObjectById(templateId);

        if (event.altKey)
        {
          var info = inspectBasis.dev.getInfo(object);

          if (info && info.loc)
            fileAPI.open(info.loc);
          else
            console.info('Object create location doesn\'t resolved:', object, info);
        }
        else
        {
          templateInfo().set(object.element);
        }
      }
    }
    else
    {
      templateInfo().set(inspectBasisTemplate.resolveObjectById(templateId).element);
    }
  }
}

var pickupTarget = new Value({
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

        rect = getBoundingRect(rectNode);

        if (rect)
        {
          var style = {
            left: rect.left + 'px',
            top: rect.top + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
          };
          setStyle(overlay, style);
          setStyle(boxElement, style);
          document.body.appendChild(overlay);
          document.body.appendChild(boxElement);
        }
      }
      else
      {
        domUtils.remove(overlay);
        domUtils.remove(boxElement);
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
  return new Balloon({
    dir: 'left bottom left top',
    template: resource('./template/popup.tmpl'),
    autorotate: [
      'left top left bottom',
      //'center center center center',
      // 'left top left top',
      // 'left bottom left bottom',
      'right bottom right top',
      'right top right bottom'
      // 'right bottom right bottom',
      // 'right top right top'
    ],
    binding: {
      templateOpenSpecialKey: function(){
        return /^mac/i.test(navigator.platform) ? 'cmd' : 'ctrl';
      },
      openFileSupported: fileAPI.isOpenFileSupported,
      instanceNamespace: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
            return object.constructor.className.indexOf('.') != -1
              ? object.constructor.className.replace(/\.[^\.]+$/, '')
              : '';
        }
      },
      instanceName: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
            return object.constructor.className.split('.').pop();
        }
      },
      instanceId: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
            return object.basisObjectId;
        }
      },
      satelliteName: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
            return object.ownerSatelliteName;
        }
      },
      equalNames: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
          {
            var roleGetter = object.binding && object.binding.$role && object.binding.$role.getter;
            return typeof roleGetter == 'function' ? roleGetter(object) == object.ownerSatelliteName : undefined;
          }
        }
      },
      role: {
        events: 'delegateChanged update',
        getter: function(node){
          var object = node.data.object;
          if (object)
          {
            var roleGetter = object.binding && object.binding.$role && object.binding.$role.getter;
            return typeof roleGetter == 'function' ? roleGetter(object) : undefined;
          }
        }
      },
      instanceLocation: {
        events: 'delegateChanged update',
        getter: function(node){
          return inspectBasis.dev.getInfo(node.data.object, 'loc');
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
      namespace: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.data.template)
          {
            var source = node.data.template.source;
            return source instanceof inspectBasisTemplate.SourceWrapper && source.path.indexOf('.') != -1
              ? source.path.replace(/\.[^\.]+$/, '')
              : '';
          }
        }
      },
      name: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.data.template)
          {
            var source = node.data.template.source;
            return source instanceof inspectBasisTemplate.SourceWrapper
              ? source.path.split('.').pop()
              : '';
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
  if (!inspecting)
  {
    if (templateInfo.isResolved())
      templateInfo().set();

    domEventUtils.addGlobalHandler('mousemove', mousemoveHandler);
    domEventUtils.addGlobalHandler('mousewheel', mouseWheelHandler);
    domEventUtils.addGlobalHandler('wheel', mouseWheelHandler);
    domEventUtils.addGlobalHandler('DOMMouseScroll', mouseWheelHandler);
    inspectBasisEvent.captureEvent('mousedown', domEventUtils.kill);
    inspectBasisEvent.captureEvent('mouseup', domEventUtils.kill);
    inspectBasisEvent.captureEvent('contextmenu', stopInspect);
    inspectBasisEvent.captureEvent('click', pickHandler);

    inspecting = true;
  }
}

function stopInspect(){
  if (inspecting)
  {
    domEventUtils.removeGlobalHandler('mousemove', mousemoveHandler);
    domEventUtils.removeGlobalHandler('mousewheel', mouseWheelHandler);
    domEventUtils.removeGlobalHandler('wheel', mouseWheelHandler);
    domEventUtils.removeGlobalHandler('DOMMouseScroll', mouseWheelHandler);
    inspectBasisEvent.releaseEvent('mousedown');
    inspectBasisEvent.releaseEvent('mouseup');
    inspectBasisEvent.releaseEvent('contextmenu');
    inspectBasisEvent.releaseEvent('click');

    inspecting = false;
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
  stopInspect: stopInspect
};
