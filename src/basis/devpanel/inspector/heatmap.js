basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.ui');

var DOM = basis.dom;

//var transport = resource('../API/transport.js').fetch();

var inspectMode;
var elements = [];

var overlayNode = new basis.ui.Node({
  template: resource('template/heat_overlay.tmpl'),
  action: {
    mouseover: function(e){
      basis.cssom.classList(overlayContent).add('hover');
    },
    mouseout: function(e){
      basis.cssom.classList(overlayContent).remove('hover');
    }
  }
});

var overlay = overlayNode.tmpl.element;
var overlayContent = overlayNode.tmpl.content;

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
  if (!inspectMode)
  {
    basis.cssom.classList(document.body).add('devpanel-inspectMode');
    updateOnScroll();
    inspectMode = true;
    highlight();

    basis.dom.event.addGlobalHandler('scroll', updateOnScroll);
    basis.dom.event.addHandler(window, 'resize', updateOnResize);
    DOM.event.captureEvent('contextmenu', endInspect);

    //transport.sendData('startInspect', 'l10n');

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
  if (inspectMode)
  {
    if (observer)
      observer.disconnect();

    basis.cssom.classList(document.body).remove('devpanel-inspectMode');

    basis.dom.event.removeGlobalHandler('scroll', updateOnScroll);
    basis.dom.event.removeHandler(window, 'resize', updateOnResize);
    DOM.event.releaseEvent('contextmenu');

    unhighlight();
    inspectMode = false;

    //transport.sendData('endInspect', 'l10n');
  }
}

function updateOnScroll(event){
  overlayContent.style.top = -document.body.scrollTop + 'px';
  overlayContent.style.left = -document.body.scrollLeft + 'px';

  if (event && event.target !== document)
    highlight(true);
}

var resizeTimer;
function updateOnResize(){
  clearTimeout(resizeTimer);
  basis.cssom.classList(overlayContent).add('hide');
  resizeTimer = setTimeout(function(){
    basis.cssom.classList(overlayContent).remove('hide');
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
    data.element = tokenElements.appendChild(basis.dom.createElement({
      description: '.devpanel-heat-token',
      css: {
        backgroundColor: bgColor,
        outline: '1px solid ' + borderColor,
        top: document.body.scrollTop + data.rect.top + 'px',
        left: document.body.scrollLeft + data.rect.left + 'px',
        width: data.rect.width + 'px',
        height: data.rect.height + 'px'
      }
    }, data.updates == 1 ? '' : data.updates));
  }

  overlayContent.appendChild(tokenElements);

  if (!keepOverlay)
    DOM.insert(document.body, overlay);
}

function unhighlight(keepOverlay){
  var data;

  while (data = elements.pop())
    DOM.remove(data.element);

  if (!keepOverlay)
  {
    basis.cssom.classList(overlayContent).remove('hover');
    DOM.remove(overlay);
  }
}

function updateHighlight(records){
  for (var i = 0; i < records.length; i++)
    if (records[i].target != overlayContent
        && records[i].target.parentNode != overlayContent
        && records[i].target.id != 'devpanelSharedDom')
    {
      highlight(true);
      break;
    }
}

function domTreeHighlight(root){
  for (var i = 0, child; child = root.childNodes[i]; i++)
  {
    if (child.basisTemplateId)
    {
      var debugInfo = basis.template.getDebugInfoById(child.basisTemplateId);
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
                rect = domNode.getBoundingClientRect();
                break;
              case 3:
                var range = document.createRange();
                range.selectNodeContents(domNode);
                rect = range.getBoundingClientRect();
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

    if (child.nodeType == basis.dom.ELEMENT_NODE)
      domTreeHighlight(child);
  }
}

//
// exports
//

module.exports = {
  startInspect: startInspect,
  endInspect: endInspect,
  isActive: function(){
    return !!inspectMode;
  }
};
