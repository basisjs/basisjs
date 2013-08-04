basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.data.value');
basis.require('basis.ui');
basis.require('basis.ui.popup');

var DOM = basis.dom;
var transport = resource('../API/transport.js').fetch();

var inspectMode;
var inspectDepth = 0;

var overlay = DOM.createElement('DIV[style="pointer-events: none; position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(110,163,217,0.7)"]');


function pickHandler(event){
  DOM.event.kill(event);

  var node = pickupTarget.value;

  if (node){
    var source = node.template.source;

    transport.sendData('pickTemplate', {
      filename: source.url || source
    });

    endInspect();
  }
}

var pickupTarget = new basis.data.value.Property(null, {
  change: function(sender, value, oldValue){
    updatePickupElement(sender, oldValue);
  }
}, function(value){
  return value && value.element && value.template instanceof basis.template.Template ? value : null;
});

function updatePickupElement(property, oldValue){
  var node = property.value;
  if (node)
  {
    var rect = getOffsetRect(node.element);
    if (rect)
    {
      basis.cssom.setStyle(overlay, {                              
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px'
      });
      document.body.appendChild(overlay);
      DOM.event.captureEvent('mousedown', DOM.event.kill);
      DOM.event.captureEvent('mouseup', DOM.event.kill);
      DOM.event.captureEvent('contextmenu', endInspect);
      DOM.event.captureEvent('click', pickHandler);
    }
  }
  else
  {
    document.body.removeChild(overlay);
    DOM.event.releaseEvent('mousedown');
    DOM.event.releaseEvent('mouseup');
    DOM.event.releaseEvent('contextmenu');    
    DOM.event.releaseEvent('click');
    inspectDepth = 0;
  }

  nodeInfoPopup().setDelegate(node);
}

var nodeInfoPopup = basis.fn.lazyInit(function(){
  return new basis.ui.popup.Balloon({
    dir: 'left bottom left top',
    template: resource('template/template_hintPopup.tmpl'),
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
          if (node.delegate)
          {
            var el = node.delegate.element;
            return node.delegate.constructor.className + '#' + node.delegate.basisObjectId;
          }
        }
      },
      rootNodeSelector: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.delegate)
          {
            var el = node.delegate.element;
            return el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '');
          }
        }
      },
      source: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.delegate)
          {
            var template = node.delegate.template;
            var url = template.source.url ? basis.path.relative(template.source.url) : '[inline template]'
            return url.charAt(0) == '.' ? basis.path.resolve(url) : url;
          }
        }
      },
      name: {
        events: 'delegateChanged update',
        getter: function(node){
          if (node.delegate)
          {
            var source = node.delegate.template.source;
            return source instanceof basis.template.SourceWrapper ? source.path : '';
          }
        }
      }
    },
    handler: {
      delegateChanged: function(){
        if (this.delegate)
          this.show(this.delegate.element);
        else
          this.hide();
      },
      hide: function(){
        this.setDelegate();
      }
    }
  });
});

function startInspect(){ 
  if (!inspectMode)
  {
    DOM.event.addGlobalHandler('mousemove', mousemoveHandler);
    DOM.event.addGlobalHandler('mousewheel', mouseWheelHandler);
    basis.cssom.classList(document.body).add('devpanel-inspectMode');    
    inspectMode = true;
    transport.sendData('startInspect', 'template');
  }
}
function endInspect(){
  if (inspectMode)
  {
    DOM.event.removeGlobalHandler('mousemove', mousemoveHandler);
    DOM.event.removeGlobalHandler('mousewheel', mouseWheelHandler);
    basis.cssom.classList(document.body).remove('devpanel-inspectMode');    
    inspectMode = false;
    transport.sendData('endInspect', 'template');
    pickupTarget.set();
  }
}

var lastMouseX;
var lastMouseY;
var DEPTH_MODE_MOVE_THRESHOLD = 15;

function mousemoveHandler(){
  var mouseX = DOM.event.mouseX(event);
  var mouseY = DOM.event.mouseY(event);

  if (inspectDepth)
  {
    var realMove = !lastMouseX || Math.abs(mouseX - lastMouseX) > DEPTH_MODE_MOVE_THRESHOLD || Math.abs(mouseY - lastMouseY) > DEPTH_MODE_MOVE_THRESHOLD;

    if (!realMove)
      return;
  }

  lastMouseX = mouseX;
  lastMouseY = mouseY;


  var sender = DOM.event.sender(event);
  var cursor = sender;
  var refId;
  do {
    if (refId = cursor.basisTemplateId)
    { 
      inspectDepth = 0;
      return pickupTarget.set(basis.template.resolveObjectById(refId));
    }
  } while (cursor = cursor.parentNode);

  pickupTarget.set();
}

function mouseWheelHandler(){
  var delta = DOM.event.wheelDelta(event);
  var sender = DOM.event.sender(event);
  var cursor = sender;

  var tempDepth = inspectDepth + delta;

  var curDepth = 0;
  var lastRefId;
  var lastDepth;

  var refId;
  do {
    if (refId = cursor.basisTemplateId)
    {
      lastRefId = refId;
      lastDepth = curDepth;
      if (tempDepth < 0 || curDepth == tempDepth)
        break;

      curDepth++;
    }
  } while (cursor = cursor.parentNode);

  pickupTarget.set(basis.template.resolveObjectById(lastRefId));
  inspectDepth = lastDepth;

  DOM.event.kill(event);
}

function getOffsetRect(elem){
  var box = elem.getBoundingClientRect();

  var body = document.body;
  var docElem = document.documentElement;

  var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
  var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

  var clientTop = docElem.clientTop || body.clientTop || 0;
  var clientLeft = docElem.clientLeft || body.clientLeft || 0;

  var top  = box.top + scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;

  return { 
    top: Math.round(top), 
    left: Math.round(left),
    width: box.width,
    height: box.height
  };
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
