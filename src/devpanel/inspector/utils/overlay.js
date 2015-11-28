var REFRESH_TIMER = 250;

var document = global.document;
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisEvent = inspectBasis.require('basis.dom.event');
var domUtils = require('basis.dom');
var eventUtils = require('basis.dom.event');
var getOffset = require('basis.layout').getOffset;
var getBoundingRect = require('basis.layout').getBoundingRect;
var getComputedStyle = require('basis.dom.computedStyle').get;
var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;


var left = new basis.Token();
var top = new basis.Token();
var hide = new basis.Token(false);

//
// Watching for changes
//

function update(){
  if (activeOverlay.value)
    activeOverlay.value.apply();
}

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
        update();
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

var updateOnScroll = function(e){
  var scrollElement = document.compatMode == 'CSS1Compat'
    ? document.documentElement
    : document.body;

  left.set(global.pageXOffset || scrollElement.scrollLeft);
  top.set(global.pageYOffset || scrollElement.scrollTop);

  update();
};

var updateOnResize = (function(){
  var resizeTimer;
  return function updateOnResize(){
    clearTimeout(resizeTimer);
    hide.set(true);
    resizeTimer = setTimeout(function(){
      update();
      hide.set(false);
    }, 100);
  };
})();

function startWatch(){
  eventUtils.addGlobalHandler('scroll', updateOnScroll);
  eventUtils.addGlobalHandler('mousemove', update);
  eventUtils.addGlobalHandler('pointermove', update);
  eventUtils.addGlobalHandler('focus', update);
  eventUtils.addGlobalHandler('focusIn', update);
  eventUtils.addGlobalHandler('focusOut', update);
  eventUtils.addGlobalHandler('blur', update);
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
  eventUtils.removeGlobalHandler('mousemove', update);
  eventUtils.removeGlobalHandler('pointermove', update);
  eventUtils.removeGlobalHandler('focus', update);
  eventUtils.removeGlobalHandler('focusIn', update);
  eventUtils.removeGlobalHandler('focusOut', update);
  eventUtils.removeGlobalHandler('blur', update);
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
        inspectBasisEvent.captureEvent(eventName, eventUtils.kill);
      else
        inspectBasisEvent.releaseEvent(eventName);
    }
}


//
// Current overlay if any
//

var refreshTimer;
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
    refreshTimer = setInterval(update, REFRESH_TIMER);
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
    clearInterval(refreshTimer);
    muteEvents({}); // unmute all
    stopWatch();
  }
});

var checkTimer;

/**
* @class
*/
var Overlay = Node.subclass({
  className: 'devpanel.Overlay',

  active: activeOverlay.compute(function(node, value){
    return node === value;
  }),
  processTextLines: false,
  ignoreInvisibleElements: true,
  muteEvents: false,
  hide: hide,
  left: left,
  top: top,

  generation: 1,
  order: 0,

  binding: {
    hide: 'hide',
    left: 'left',
    top: 'top'
  },

  sorting: 'data.order',
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
      clearInterval(checkTimer);
      activeOverlay.set();
      this.clear();
    }
  },

  setMuteEvents: function(events){
    this.muteEvents = events || {};
    if (this.active)
      muteEvents(this.muteEvents);
  },

  apply: function(){
    this.contextStack = [];
    this.order = 0;
    this.generation += 1;
    this.traverse(document.body, this.getInitialContext());

    basis.array(this.childNodes).forEach(function(child){
      if (child.generation != this.generation)
        child.destroy();
    }, this);
  },

  highlight: function(domNode, options){
    function findChild(childNodes, domNode, index){
      for (var i = 0; i < childNodes.length; i++)
      {
        var child = childNodes[i];
        if (child.domNode === domNode && child.domIndex == index)
          return child;
      }
    }

    function apply(rect, domNode, domIndex){
      if (rect && rect.width)
      {
        var node = findChild(this.childNodes, domNode, domIndex);
        var data = basis.object.extend({
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          order: this.order
        }, options);

        if (!node)
        {
          node = this.appendChild({
            domNode: domNode,
            domIndex: domIndex,
            data: data
          });
        }
        else
        {
          node.update(data);
        }

        node.generation = this.generation;

        return node;
      }
    }

    var rectNode = domNode;

    if (!domNode.parentNode)
      return;

    if (rectNode.nodeType == domUtils.TEXT_NODE)
    {
      if (!rectNode.nodeValue)
        return;

      rectNode = document.createRange();
      rectNode.selectNodeContents(domNode);

      if (this.processTextLines)
      {
        var offset = getOffset();
        var rects = rectNode.getClientRects();
        var result = [];

        for (var i = 0; i < rects.length; i++)
        {
          var rect = rects[i];
          result.push(apply.call(this, {
            top: rect.top + offset.top,
            left: rect.left + offset.left,
            right: rect.right + offset.left,
            bottom: rect.bottom + offset.top,
            width: rect.width,
            height: rect.height
          }, domNode, i));
        }

        return result;
      }
    }

    return apply.call(this, getBoundingRect(rectNode), domNode, 0);
  },
  processNode: function(domNode){
    // should be overrided
  },

  shouldTraverseDeep: function(){
    return true;
  },

  getInitialContext: function(){
    return {};
  },
  getContext: function(domNode, context){
    return context;
  },

  traverse: function(domNode, context, invisible){
    for (var i = 0, child; child = domNode.childNodes[i]; i++)
    {
      var isElement = child.nodeType == 1;

      if (isElement && child.hasAttribute('basis-devpanel-ignore'))
        continue;

      var visible = this.ignoreInvisibleElements
        ? !invisible && (!isElement || getComputedStyle(child, 'visibility') != 'hidden')
        : true;

      this.order += 1;
      if (visible)
        this.processNode(child, context);

      if (isElement)
      {
        var nodeContext = this.getContext(child, context);

        if (!nodeContext)
          continue;

        if (nodeContext !== context)
          this.contextStack.push(nodeContext);

        this.traverse(child, nodeContext, !visible);

        if (nodeContext !== context)
          this.contextStack.pop();
      }
    }
  }
});

//
// exports
//

module.exports = Overlay;
