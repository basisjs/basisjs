require('basis.dom');
require('basis.dom.event');
require('basis.cssom');
require('basis.layout');
require('basis.ui');

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.html').marker;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var inspectBasisEvent = inspectBasis.require('basis.dom.event');

var document = global.document;
var colorPicker = require('./colorPicker.js');
var transport = require('../api/transport.js');

var elements = [];
var inspectMode = new basis.data.Value({ value: false });

var overlayNode = new basis.ui.Node({
  template: resource('./template/l10n_overlay.tmpl'),
  hover: new basis.Token(false),
  hide: new basis.Token(false),
  top: new basis.Token(0),
  left: new basis.Token(0),
  binding: {
    hover: 'hover',
    hide: 'hide',
    top: 'top',
    left: 'left'
  },
  action: {
    mouseover: function(e){
      this.hover.set(true);
    },
    mouseout: function(e){
      this.hover.set(false);
    }
  }
});

var overlay = overlayNode.tmpl.element;
var overlayContent = overlayNode.tmpl.content;
var tokenDomProto = overlayNode.tmpl.token;

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
  var cultureList = inspectBasisL10n.getCultureList();

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
  if (!inspectMode.value)
  {
    updateOnScroll();
    inspectMode.set(true);
    highlight();

    basis.dom.event.addGlobalHandler('scroll', updateOnScroll);
    basis.dom.event.addHandler(window, 'resize', updateOnResize);
    inspectBasisEvent.captureEvent('mousedown', basis.dom.event.kill);
    inspectBasisEvent.captureEvent('mouseup', basis.dom.event.kill);
    inspectBasisEvent.captureEvent('contextmenu', endInspect);
    inspectBasisEvent.captureEvent('click', pickHandler);

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
  if (inspectMode.value)
  {
    if (observer)
      observer.disconnect();

    basis.dom.event.removeGlobalHandler('scroll', updateOnScroll);
    basis.dom.event.removeHandler(window, 'resize', updateOnResize);
    inspectBasisEvent.releaseEvent('mousedown');
    inspectBasisEvent.releaseEvent('mouseup');
    inspectBasisEvent.releaseEvent('contextmenu');
    inspectBasisEvent.releaseEvent('click');

    unhighlight();
    inspectMode.set(false);
    transport.sendData('endInspect', 'l10n');
  }
}

function updateOnScroll(event){
  var scrollElement = document.compatMode == 'CSS1Compat' ? document.documentElement : document.body;

  overlayNode.top.set(global.pageYOffset || scrollElement.scrollTop);
  overlayNode.left.set(global.pageXOffset || scrollElement.scrollLeft);

  //if (event && event.target !== document)
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

  if (!keepOverlay)
    basis.dom.insert(document.body, overlay);
}

function unhighlight(keepOverlay){
  var node;

  while (node = elements.pop())
  {
    node.token = null;
    basis.dom.remove(node);
  }

  if (!keepOverlay)
  {
    overlayNode.hover.set(false);
    basis.dom.remove(overlay);
  }
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

function addTokenToHighlight(token, ref, domNode){
  if (token instanceof inspectBasisL10n.Token && token.dictionary)
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
      var element = overlayContent.appendChild(basis.cssom.setStyle(tokenDomProto.cloneNode(false), {
        backgroundColor: bgColor,
        outline: '1px solid ' + borderColor,
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px'
      }));

      element.token = token;
      elements.push(element);
    }
  }
}

function domTreeHighlight(root){
  for (var i = 0, child, l10nRef; child = root.childNodes[i]; i++)
  {
    if (child[inspectBasisTemplateMarker])
    {
      var debugInfo = inspectBasisTemplate.getDebugInfoById(child[inspectBasisTemplateMarker]);
      if (debugInfo)
      {
        for (var j = 0, binding; binding = debugInfo[j]; j++)
        {
          var token = binding.attachment;

          if (token instanceof inspectBasisL10n.ComputeToken)
            token = token.token;

          addTokenToHighlight(token, binding.val, binding.dom);
        }
      }
    }

    if (child.nodeType == basis.dom.ELEMENT_NODE)
    {
      if (l10nRef = child.getAttribute('data-basisjs-l10n'))
        addTokenToHighlight(inspectBasisL10n.token(l10nRef), child, child);

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
  inspectMode: inspectMode,
  isActive: function(){
    return inspectMode.value;
  }
};
