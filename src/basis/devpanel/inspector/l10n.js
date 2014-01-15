basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.ui');

var DOM = basis.dom;

var colorPicker = resource('colorPicker.js').fetch();
var transport = resource('../API/transport.js').fetch();

var inspectMode;
var elements = [];

var overlayNode = new basis.ui.Node({
  template: resource('template/l10n_overlay.tmpl'),
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

function pickHandler(){
  var sender = DOM.event.sender(event);

  var token = sender.token;
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

    basis.dom.event.addGlobalHandler('scroll', updateOnScroll);
    basis.dom.event.addHandler(window, 'resize', updateOnResize);
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

    basis.dom.event.removeGlobalHandler('scroll', updateOnScroll);
    basis.dom.event.removeHandler(window, 'resize', updateOnResize);
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
      rect = ref.getBoundingClientRect();
    }
    else
    {
      var range = document.createRange();
      range.selectNodeContents(domNode);
      rect = range.getBoundingClientRect();
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
          top: document.body.scrollTop + rect.top + 'px',
          left: document.body.scrollLeft + rect.left + 'px',
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
