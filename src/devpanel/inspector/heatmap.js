var domEventUtils = require('basis.dom.event');
var setStyle = require('basis.cssom').setStyle;
var getBoundingRect = require('basis.layout').getBoundingRect;
var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.html').marker;
var inspectBasisEvent = inspectBasis.require('basis.dom.event');

var document = global.document;
var inspectMode = new Value({ value: false });
var elements = [];

var overlayNode = new Node({
  template: resource('./template/heat_overlay.tmpl'),
  hide: new basis.Token(false),
  binding: {
    hide: 'hide'
  }
});

var overlay = overlayNode.element;
var overlayContent = overlayNode.tmpl.content || overlay;
var tokenDomProto = overlayNode.tmpl.token;

// dom mutation observer

var observer = (function(){
  var names = ['MutationObserver', 'WebKitMutationObserver'];

  for (var i = 0, name; name = names[i]; i++)
  {
    var ObserverClass = global[name];
    if (typeof ObserverClass == 'function')
      return new ObserverClass(updateHighlight);
  }
})();

function startInspect(){
  if (!inspectMode.value)
  {
    updateOnScroll();
    inspectMode.set(true);
    highlight();

    domEventUtils.addGlobalHandler('scroll', updateOnScroll);
    domEventUtils.addHandler(window, 'resize', updateOnResize);
    inspectBasisEvent.captureEvent('contextmenu', endInspect);

    if (observer)
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        characterData: true,
        childList: true
      });
  }
}

function endInspect(){
  if (inspectMode.value)
  {
    if (observer)
      observer.disconnect();

    domEventUtils.removeGlobalHandler('scroll', updateOnScroll);
    domEventUtils.removeHandler(window, 'resize', updateOnResize);
    inspectBasisEvent.releaseEvent('contextmenu');

    unhighlight();
    inspectMode.set(false);
  }
}

function updateOnScroll(event){
  var scrollElement = document.compatMode == 'CSS1Compat' ? document.documentElement : document.body;
  overlayContent.style.top = -(global.pageYOffset || scrollElement.scrollTop) + 'px';
  overlayContent.style.left = -(global.pageXOffset || scrollElement.scrollLeft) + 'px';

  if (event && event.target !== document)
    highlight(true);
}

var resizeTimer;
function updateOnResize(){
  clearTimeout(resizeTimer);
  overlayNode.hide.set(true);
  resizeTimer = setTimeout(function(){
    overlayNode.hide.set(false);
    highlight(true);
  }, 100);
}

function highlight(keepOverlay){
  unhighlight(keepOverlay);

  domTreeHighlight(document.body);

  var tokenElements = document.createDocumentFragment();
  var min = Infinity;
  var max = -Infinity;

  for (var i = 0, data; data = elements[i]; i++)
  {
    min = Math.min(min, data.updates);
    max = Math.max(max, data.updates);
  }

  for (var i = 0, data; data = elements[i]; i++)
  {
    var temp = max != min ? 1 - ((data.updates - min) / (max - min)) : 1;
    var bgColor = 'rgba(' + [255 - parseInt(128 * temp), parseInt(temp * 255), 0].join(',') + ', .4)';
    var borderColor = 'rgba(' + [200 - parseInt(128 * temp), parseInt(temp * 200), 0].join(',') + ', .75)';
    data.element = tokenElements.appendChild(setStyle(tokenDomProto.cloneNode(false), {
      backgroundColor: bgColor,
      outline: '1px solid ' + borderColor,
      top: data.rect.top + 'px',
      left: data.rect.left + 'px',
      width: data.rect.width + 'px',
      height: data.rect.height + 'px'
    }));
    data.element.appendChild(document.createTextNode(data.updates == 1 ? '' : data.updates));
  }

  overlayContent.appendChild(tokenElements);

  if (!keepOverlay)
    document.body.appendChild(overlay);
}

function unhighlight(keepOverlay){
  var data;

  while (data = elements.pop())
    if (data.element.parentNode)
      data.element.parentNode.removeChild(data.element);

  if (!keepOverlay && overlay.parentNode)
    overlay.parentNode.removeChild(overlay);
}

function updateHighlight(records){
  for (var i = 0; i < records.length; i++)
    if (records[i].target != overlayContent &&
        records[i].target.parentNode != overlayContent &&
        records[i].target.id != 'devpanelSharedDom')
    {
      highlight(true);
      break;
    }
}

function domTreeHighlight(root){
  for (var i = 0, child; child = root.childNodes[i]; i++)
  {
    if (child[inspectBasisTemplateMarker])
    {
      var debugInfo = inspectBasisTemplate.getDebugInfoById(child[inspectBasisTemplateMarker]);
      if (debugInfo)
      {
        for (var j = 0, binding; binding = debugInfo[j]; j++)
        {
          if (!binding.updates)
            continue;

          var rect;
          var domNode = binding.val instanceof Node ? binding.val : binding.dom;

          if (domNode)
          {
            switch (domNode.nodeType)
            {
              case 1:
                rect = getBoundingRect(domNode);
                break;
              case 3:
                var range = document.createRange();
                range.selectNodeContents(domNode);
                rect = getBoundingRect(range);
                break;
            }
          }

          if (rect)
          {
            elements.push({
              updates: binding.updates,
              rect: rect
            });
          }
        }
      }
    }

    if (child.nodeType == 1) // ELEMENT_NODE
      domTreeHighlight(child);
  }
}

//
// exports
//

module.exports = {
  startInspect: startInspect,
  endInspect: endInspect,
  inspectMode: inspectMode,
  isActive: function(){
    return !!inspectMode;
  }
};
