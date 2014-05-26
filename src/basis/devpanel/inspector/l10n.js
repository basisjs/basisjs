basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.layout');
basis.require('basis.ui');

var document = global.document;
var DOM = basis.dom;

var colorPicker = require('./colorPicker.js');
var transport = require('../API/transport.js');

var elements = [];
var inspectMode;

var overlayNode = new basis.ui.Node({
  template: resource('./template/l10n_overlay.tmpl'),
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

function pickHandler(event){
  var token = event.sender.token;
  if (token)
  {
    endInspect();
    loadToken(token);
  }
}

function loadToken(token){
  var dictionary = token.dictionary;
  var cultureList = basis.l10n.getCultureList();

  var data = {
    cultureList: cultureList,
    selectedToken: token.name,
    dictionaryName: basis.path.relative('/', dictionary.resource.url)
  };

  transport.sendData('token', data);
}

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

    DOM.event.addGlobalHandler('scroll', updateOnScroll);
    DOM.event.addHandler(window, 'resize', updateOnResize);
    DOM.event.captureEvent('mousedown', DOM.event.kill);
    DOM.event.captureEvent('mouseup', DOM.event.kill);
    DOM.event.captureEvent('contextmenu', endInspect);
    DOM.event.captureEvent('click', pickHandler);

    transport.sendData('startInspect', 'l10n');

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

    DOM.event.removeGlobalHandler('scroll', updateOnScroll);
    DOM.event.removeHandler(window, 'resize', updateOnResize);
    DOM.event.releaseEvent('mousedown');
    DOM.event.releaseEvent('mouseup');
    DOM.event.releaseEvent('contextmenu');
    DOM.event.releaseEvent('click');

    unhighlight();
    inspectMode = false;
    transport.sendData('endInspect', 'l10n');
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
  basis.cssom.classList(overlayContent).add('hide');
  resizeTimer = setTimeout(function(){
    basis.cssom.classList(overlayContent).remove('hide');
    highlight(true);
  }, 100);
}

function highlight(keepOverlay){
  unhighlight(keepOverlay);
  domTreeHighlight(document.body);

  if (!keepOverlay)
    DOM.insert(document.body, overlay);
}

function unhighlight(keepOverlay){
  var node;

  while (node = elements.pop())
  {
    node.token = null;
    DOM.remove(node);
  }

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

function addTokenToHighlight(token, ref, domNode){
  if (token instanceof basis.l10n.Token && token.dictionary)
  {
    var rect;

    if (ref && ref.nodeType == 1)
    {
      rect = basis.layout.getBoundingRect(ref);
    }
    else
    {
      var range = document.createRange();
      range.selectNodeContents(domNode);
      rect = basis.layout.getBoundingRect(range);
    }

    if (rect)
    {
      var color = getColorForDictionary(token.dictionary.resource.url);
      var bgColor = 'rgba(' + color.join(',') + ', .3)';
      var borderColor = 'rgba(' + color.join(',') + ', .6)';
      var element = overlayContent.appendChild(basis.dom.createElement({
        description: '.devpanel-l10n-token',
        css: {
          backgroundColor: bgColor,
          outline: '1px solid ' + borderColor,
          top: rect.top + 'px',
          left: rect.left + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px'
        }
      }));

      element.token = token;
      elements.push(element);
    }
  }
}

function domTreeHighlight(root){
  for (var i = 0, child, l10nRef; child = root.childNodes[i]; i++)
  {
    if (child.basisTemplateId)
    {
      var debugInfo = basis.template.getDebugInfoById(child.basisTemplateId);
      if (debugInfo)
      {
        for (var j = 0, binding; binding = debugInfo[j]; j++)
        {
          var token = binding.attachment;

          if (token instanceof basis.l10n.ComputeToken)
            token = token.token;

          addTokenToHighlight(token, binding.val, binding.dom);
        }
      }
    }

    if (child.nodeType == basis.dom.ELEMENT_NODE)
    {
      if (l10nRef = child.getAttribute('data-basisjs-l10n'))
        addTokenToHighlight(basis.l10n.token(l10nRef), child, child);

      domTreeHighlight(child);
    }
  }
}

var dictionaryColor = {};
function getColorForDictionary(dictionaryName){
  if (!dictionaryColor[dictionaryName])
    dictionaryColor[dictionaryName] = colorPicker.getColor();

  return dictionaryColor[dictionaryName];
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
