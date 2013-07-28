basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');

var DOM = basis.dom;

var colorPicker = resource('colorPicker.js').fetch();
var transport = resource('../API/transport.js').fetch();

var inspectMode;
var elements = [];
var range = document.createRange();

var overlayContent = DOM.createElement('[style="position: absolute; top: 0; left: 0"]');
var overlay = DOM.createElement('[style="position: fixed; pointer-events: none; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(110,163,217,0.2)"]',
  overlayContent
);

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
    dictionaryName: '/' + basis.path.relative('/', dictionary.resource.url)
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
    DOM.event.captureEvent('mousedown', DOM.event.kill);
    DOM.event.captureEvent('mouseup', DOM.event.kill);
    DOM.event.captureEvent('contextmenu', endInspect);
    DOM.event.captureEvent('click', pickHandler);    

    transport.sendData('startInspect', 'l10n');

    if (observer)
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        characterData: true
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
  {
    unhighlight();
    highlight();
  }
}

function highlight(){
  DOM.insert(document.body, overlay);
  domTreeHighlight(document.body);
}

function unhighlight(){
  var node;

  while (node = elements.pop())
  {
    node.token = null;
    DOM.remove(node);
  }

  DOM.remove(overlay);
}

function updateHighlight(records){
  for (var i = 0; i < records.length; i++)
    if (records[i].target != overlayContent)
    {
      unhighlight();
      highlight();
      break;
    }
}

function domTreeHighlight(root){
  for (var i = 0, child; child = root.childNodes[i]; i++)
  {
    if (child.nodeType == basis.dom.ELEMENT_NODE) 
    {
      if (child.basisObjectId)
      {
        var node = basis.template.resolveObjectById(child.basisObjectId);
        if (node)
        {
          var bindings = (node.tmpl.set.debug && node.tmpl.set.debug()) || [];
          for (var j = 0, binding; binding = bindings[j]; j++)
          {
            var token = binding.attachment;

            if (token instanceof basis.l10n.ComputeToken)
              token = token.valueToken;

            if (token instanceof basis.l10n.Token && token.dictionary)
            {
              var rect;

              if (binding.val && binding.val.nodeType == 1)
              {
                rect = binding.val.getBoundingClientRect();
              }
              else
              {
                range.selectNodeContents(binding.dom);
                var rect = range.getBoundingClientRect();
              }

              if (rect)
              {
                var color = getColorForDictionary(token.dictionary.resource.url);
                var bgColor = 'rgba(' + color.join(',') + ', .3)';
                var borderColor = 'rgba(' + color.join(',') + ', .6)';
                var element = overlayContent.appendChild(basis.dom.createElement({
                  css: {
                    backgroundColor: bgColor,
                    outline: '1px solid ' + borderColor,
                    zIndex: 65000,
                    position: 'absolute',
                    cursor: 'pointer',
                    top: document.body.scrollTop + rect.top + 'px',
                    left: document.body.scrollLeft + rect.left + 'px',
                    width: rect.width + 'px', 
                    height: rect.height + 'px',
                    pointerEvents: 'auto'
                  }
                }));

                element.token = token;
                elements.push(element);
              }
            }
          }
        }
      }

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
