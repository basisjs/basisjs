var document = global.document;
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisEvent = inspectBasis.require('basis.dom.event');
var domUtils = require('basis.dom');
var eventUtils = require('basis.dom.event');
var getBoundingRect = require('basis.layout').getBoundingRect;
var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;


var left = new basis.Token();
var top = new basis.Token();
var hide = new basis.Token(false);

//
// Watching for changes
//

var observer = (function(){
  var names = ['MutationObserver', 'WebKitMutationObserver'];

  function processRecords(records){
    var overlayElement = activeOverlay.value && activeOverlay.value.element;

    if (!overlayElement)
      return;

    for (var i = 0; i < records.length; i++)
    {
      var target = records[i].target;
      if (target.id != 'devpanelSharedDom' && !domUtils.parentOf(overlayElement, target))
      {
        activeOverlay.value.apply();
        break;
      }
    }
  }

  for (var i = 0, name; name = names[i]; i++)
  {
    var ObserverClass = global[name];
    if (typeof ObserverClass == 'function')
      return new ObserverClass(processRecords);
  }
})();

var updateOnScroll = function(){
  var scrollElement = document.compatMode == 'CSS1Compat'
    ? document.documentElement
    : document.body;

  left.set(global.pageXOffset || scrollElement.scrollLeft);
  top.set(global.pageYOffset || scrollElement.scrollTop);

  activeOverlay.value.apply();
};

var updateOnResize = (function(){
  var resizeTimer;
  return function updateOnResize(){
    clearTimeout(resizeTimer);
    hide.set(true);
    resizeTimer = setTimeout(function(){
      activeOverlay.value.apply();
      hide.set(false);
    }, 100);
  };
})();

function startWatch(){
  eventUtils.addGlobalHandler('scroll', updateOnScroll);
  eventUtils.addHandler(global, 'resize', updateOnResize);
  inspectBasisEvent.captureEvent('contextmenu', function(){
    activeOverlay.set();
  });

  if (observer)
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      characterData: true,
      childList: true
    });
}

function stopWatch(){
  if (observer)
    observer.disconnect();

  eventUtils.removeGlobalHandler('scroll', updateOnScroll);
  eventUtils.removeHandler(global, 'resize', updateOnResize);
  inspectBasisEvent.releaseEvent('contextmenu');
}

var mutedEvents = {};
function muteEvents(toMute){
  var eventNames = basis.object.keys(basis.object.merge(mutedEvents, toMute));
  var eventName;
  while (eventName = eventNames.pop())
    if (mutedEvents[eventName] != Boolean(toMute[eventName]))
    {
      mutedEvents[eventName] = Boolean(toMute[eventName]);
      if (toMute[eventName])
      {
        console.log(eventName, 'mute');
        inspectBasisEvent.captureEvent(eventName, eventUtils.kill);
      }
      else
      {
        console.log(eventName, 'unmute');
        inspectBasisEvent.releaseEvent(eventName);
      }
    }
}


//
// Current overlay if any
//

var activeOverlay = new Value();
activeOverlay.link(null, function(newOverlay, oldOverlay){
  if (oldOverlay)
  {
    domUtils.remove(oldOverlay.element);
    oldOverlay.deactivate();
  }
  else
  {
    startWatch();
  }

  if (newOverlay)
  {
    muteEvents(newOverlay.muteEvents || {});
    newOverlay.activate();
    updateOnScroll();
    domUtils.insert(document.body, newOverlay.element);
  }
  else
  {
    muteEvents({}); // unmute all
    stopWatch();
  }
});


/**
* @class
*/
var Overlay = Node.subclass({
  className: 'devpanel.Overlay',

  active: activeOverlay.compute(function(node, value){
    return node === value;
  }),
  muteEvents: false,
  hide: hide,
  left: left,
  top: top,

  generation: 1,

  binding: {
    hide: 'hide',
    left: 'left',
    top: 'top'
  },

  childClass: {
    domNode: null,
    binding: {
      top: 'data:',
      left: 'data:',
      width: 'data:',
      height: 'data:'
    },
    action: {
      click: function(){
        this.click();
      }
    },
    click: function(){
      // nothing to do by default
    },
    destroy: function(){
      this.domNode = null;
      Node.prototype.destroy.call(this);
    }
  },

  activate: function(){
    if (!this.active)
    {
      activeOverlay.set(this);
      this.apply();
    }
  },
  deactivate: function(){
    if (this.active)
    {
      activeOverlay.set();
      this.clear();
    }
  },

  apply: function(){
    this.generation += 1;
    this.traverse(document.body);

    basis.array(this.childNodes).forEach(function(child){
      if (child.generation != this.generation)
        child.destroy();
    }, this);
  },

  highlight: function(domNode, options){
    var rectNode = domNode;
    var rect;

    if (rectNode.nodeType == domUtils.TEXT_NODE)
    {
      rectNode = document.createRange();
      rectNode.selectNodeContents(domNode);
    }

    rect = getBoundingRect(rectNode);

    if (rect && rect.width && domNode.parentNode)
    {
      var node = this.getChild(domNode, 'domNode');
      var data = basis.object.extend({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }, options);

      if (!node)
      {
        //this.decorate(element, options, rect, node);
        node = this.appendChild({
          domNode: domNode,
          data: data
        });
      }
      else
      {
        node.update(data);
      }

      node.generation = this.generation;
    }
  },
  processNode: function(domNode){
    // should be overrided
  },

  traverse: function(domNode){
    for (var i = 0, child; child = domNode.childNodes[i]; i++)
    {
      this.processNode(child);

      if (child.nodeType == 1)
        this.traverse(child);
    }
  }
});

//
// exports
//

module.exports = Overlay;
