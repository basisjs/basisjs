
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');

var DOM = basis.dom;

var colorPicker = resource('colorPicker.js').fetch();
var transport = resource('transport.js').fetch();

var inspectMode;
var elements = [];
var overlay;

var overlay = DOM.createElement({
  description: 'DIV[style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(110,163,217,0.2)"]',
  click: function(event){
    var sender = DOM.event.sender(event);

    var token = sender.token;
    if (token)
    {
      endInspect();
      loadToken(token);
    } 
  }
});

DOM.event.addHandler(overlay, 'contextmenu', function(event){
  DOM.event.kill(event);  
  endInspect();
});

function loadToken(token){
  var dictionary = token.dictionary;
  var cultureList = basis.l10n.getCultureList();

  var data = { 
    cultureList: cultureList,
    selectedToken: token.name,
    dictionaryName: dictionary.namespace, 
    tokens: {}
  };

  for (var key in dictionary.tokens)
  {
    var tkn = dictionary.tokens[key];
    data.tokens[tkn.name] = {};
    for (var j = 0, culture; culture = cultureList[j]; j++)
      data.tokens[tkn.name][culture] = dictionary.getCultureValue(culture, tkn.name);
  }

  transport.sendData('token', data);        
}

// dom mutation observer

var observerConfig = {
  subtree: true,
  attributes: true,
  characterData: true
};
var observer = (function(){
  var names = ['MutationObserver', 'WebKitMutationObserver'];
  
  for (var i = 0, name; name = names[i]; i++)
    if (name in global)
      return new global[name](function(mutations){
        unhighlight();
        highlight();  
      });
})();

function startInspect(){ 
  if (!inspectMode)
  {
    basis.cssom.classList(document.body).add('devpanel-inspectMode');
    inspectMode = true;
    highlight();
    if (observer)
      observer.observe(document.body, observerConfig);
  }
}
function endInspect(){
  if (inspectMode)
  {
    basis.cssom.classList(document.body).remove('devpanel-inspectMode');    
    if (observer)
      observer.disconnect();

    unhighlight();
    inspectMode = false;
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

function domTreeHighlight(root){
  var range = document.createRange();

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
            if (binding.attachment && binding.dom.nodeType == basis.dom.TEXT_NODE/* && child.contains(binding.dom)*/)
            {
              //nodes.push(binding.dom);
              range.selectNodeContents(binding.dom);
              var rect = range.getBoundingClientRect();
              if (rect)
              {
                var color = getColorForDictionary(binding.attachment.dictionary.namespace);
                var bgColor = 'rgba(' + color.join(',') + ', .3)';
                var borderColor = 'rgba(' + color.join(',') + ', .6)';
                var element = overlay.appendChild(basis.dom.createElement({
                  css: {
                    backgroundColor: bgColor,
                    outline: '1px solid ' + borderColor,
                    zIndex: 65000,
                    position: 'fixed',
                    cursor: 'pointer',
                    top: rect.top + 'px',
                    left: rect.left + 'px',
                    width: rect.width + 'px', 
                    height: rect.height + 'px'
                  }
                }));

                element.token = binding.attachment;

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
  endInspect: endInspect
}