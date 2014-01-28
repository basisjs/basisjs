
  basis.require('basis.dom.computedStyle');
  basis.require('basis.dom.resize');
  basis.require('basis.template');
  basis.require('basis.ui');
  basis.require('basis.dom');


 /**
  * @namespace basis.layout
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var documentElement = document.documentElement;

  var extend = basis.object.extend;
  var computedStyle = basis.dom.computedStyle.get;
  var listenResize = basis.dom.resize.add;

  var Class = basis.Class;
  var UINode = basis.ui.Node;


  //
  // Main part
  //

  // tests

  var testElement = document.createElement('div');
  var SUPPORT_ONRESIZE = typeof testElement.onresize != 'undefined';
  var SUPPORT_DISPLAYBOX = (function(){
    var prefixes = ['', '-webkit-'];

    for (var i = 0; i < prefixes.length; i++)
      try
      {
        // Opera tries to use -webkit-box but doesn't set "-webkit-box-orient" dynamically for cssRule
        if (prefixes[i] == '-webkit-' && 'WebkitBoxOrient' in testElement.style == false)
          continue;

        var value = prefixes[i] + 'box';
        testElement.style.display = value;
        if (testElement.style.display == value)
          return true;
      } catch(e) {}

    return false;
  })();


  //
  // helpers
  //

  function getHeight(element){
    return element.clientHeight
      - parseInt(basis.dom.computedStyle.get(element, 'padding-top'))
      - parseInt(basis.dom.computedStyle.get(element, 'padding-bottom'));
  }


  //
  // main functions
  //

  function getOffsetParent(node){
    var offsetParent = node.offsetParent || documentElement;

    while (offsetParent && offsetParent !== documentElement && computedStyle(offsetParent, 'position') == 'static')
      offsetParent = offsetParent.offsetParent;

    return offsetParent || documentElement;
  }

  function getTopLeftPoint(element){
    var left = 0;
    var top = 0;

    if (element && element.getBoundingClientRect)
    {
      // Internet Explorer, FF3, Opera9.50 sheme
      var box = element.getBoundingClientRect();

      top = box.top;
      left = box.left;

      // offset fix
      if (document.compatMode == 'CSS1Compat')
      {
        top += (global.pageYOffset || documentElement.scrollTop);
        left += (global.pageXOffset || documentElement.scrollLeft);
      }
      else
      {
        // IE6 and lower
        var body = document.body;
        if (element !== body)
        {
          top += body.scrollTop - body.clientTop;
          left += body.scrollLeft - body.clientLeft;
        }
      }
    }

    return {
      top: top,
      left: left
    };
  }

  function getBoundingRect(element, relElement){
    var point = getTopLeftPoint(element);
    var top = point.top;
    var left = point.left;
    var width = element.offsetWidth;
    var height = element.offsetHeight;

    // coords relative of relElement
    if (relElement)
    {
      var relPoint = getTopLeftPoint(relElement);
      top -= relPoint.top;
      left -= relPoint.left;
    }

    return {
      top: top,
      left: left,
      bottom: top + height,
      right: left + width,
      width: width,
      height: height
    };
  }

  function getViewportRect(element){
    var point = getTopLeftPoint(element);
    var top = point.top;
    var left = point.left;
    var width = element.clientWidth;
    var height = element.clientHeight;

    top += element.clientTop + (global.pageYOffset || documentElement.scrollTop);
    left += element.clientLeft + (global.pageXOffset || documentElement.scrollLeft);

    return {
      top: top,
      left: left,
      bottom: top + height,
      right: left + width,
      width: width,
      height: height
    };
  }


  //
  // Boxes
  //

 /**
  * @class
  * @deprecated
  */
  var Box = Class(null, {
    className: namespace + '.Box',

    init: function(element, woCalc, relElement){
      /** @cut */ basis.dev.warn('Class `basis.layout.Box` is deprecated now, use basis.layout.getBoundingRect function instead.');
      this.reset();
      this.element = element;
      this.relElement = relElement;
      if (!woCalc)
        this.recalc(this.relElement);
    },
    reset: function(){
      extend(this, {
        top: NaN,
        left: NaN,
        bottom: NaN,
        right: NaN,
        width: NaN,
        height: NaN,
        defined: false
      });
    },
    set: function(property, value){
      if (this.defined)
      {
        switch (property.toLowerCase())
        {
          case 'left':   this.left   = value; this.right  = this.left  + this.width; break;
          case 'right':  this.right  = value; this.left   = this.right - this.width; break;
          case 'width':  this.width  = value; this.right  = this.left  + this.width; break;
          case 'top':    this.top    = value; this.bottom = this.top    + this.height; break;
          case 'bottom': this.bottom = value; this.top    = this.bottom - this.height; break;
          case 'height': this.height = value; this.bottom = this.top    + this.height; break;
        }

        if (this.width <= 0 || this.height <= 0)
          this.reset();
      }

      return this;
    },
    recalc: function(relElement){
      this.reset();

      var element = this.element;
      if (element)
      {
        extend(this, getBoundingRect(element, relElement));
        this.defined = true;
      }

      return this.defined;
    },
    intersect: function(box){
      if (!this.defined)
        return false;

      if (box instanceof Box == false)
        box = new Box(box);

      return box.defined &&
             box.right  > this.left &&
             box.left   < this.right &&
             box.bottom > this.top &&
             box.top    < this.bottom;
    },
    destroy: function(){
      this.element = null;
      this.relElement = null;
    }
  });


 /**
  * @class
  * @deprecated
  */
  var Viewport = Class(Box, {
    className: namespace + '.Viewport',

    init: function(){
       /** @cut */ basis.dev.warn('Class `basis.layout.Viewport` is deprecated now, use basis.layout.getBoundingRect function instead.');
       Box.prototype.init.call(this);
    },

    recalc: function(){
      this.reset();

      var element = this.element;
      if (element)
      {
        extend(this, getViewportRect(element));
        this.defined = true;
      }

      return this.defined;
    }
  });


  //
  // Vertical stack panel
  //

  var templates = basis.template.define(namespace, {
    Panel: resource('ui/templates/layout/VerticalPanel.tmpl'),
    Stack: resource('ui/templates/layout/VerticalPanelStack.tmpl')
  });

 /**
  * @class
  */
  var VerticalPanel = Class(UINode, {
    className: namespace + '.VerticalPanel',

    template: templates.Panel,
    binding: {
      height: 'height',
      isFlex: function(node){
        return !!node.flex;
      },
      flexboxSupported: function(){
        return SUPPORT_DISPLAYBOX;
      }
    },

    flex: 0,
    height: 'auto',

    setHeight: function(height){
      this.height = height;
      this.updateBind('height');
    }
  });

 /**
  * @class
  */
  var VerticalPanelStack = Class(UINode, {
    className: namespace + '.VerticalPanelStack',

    template: templates.Stack,
    binding: {
      flexboxSupported: function(){
        return SUPPORT_DISPLAYBOX;
      }
    },

    childClass: VerticalPanel,

    templateSync: function(){
      UINode.prototype.templateSync.call(this);

      if (!SUPPORT_DISPLAYBOX)
      {
        listenResize(this.element, this.realign, this);
        listenResize(this.childNodesElement, this.realign, this);
      }
    },
    realign: function(){
      if (SUPPORT_DISPLAYBOX || !this.tmpl)
        return;

      var contentHeight = this.childNodesElement.offsetHeight;
      var availHeight = getHeight(this.element);
      var delta = availHeight - contentHeight;

      if (!delta)
        return;

      var flexNodes = [];
      var flexHeight = delta;

      for (var i = 0, node; node = this.childNodes[i]; i++)
      {
        if (node.flex)
        {
          flexNodes.push(node);
          flexHeight += getHeight(node.element);
        }
      }

      while (node = flexNodes.shift())
      {
        var height = Math.max(0, parseInt(flexHeight / (flexNodes.length + 1)));
        flexHeight -= height;

        node.setHeight(height);
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    Box: Box,
    Viewport: Viewport,

    getOffsetParent: getOffsetParent,
    getTopLeftPoint: getTopLeftPoint,
    getBoundingRect: getBoundingRect,
    getViewportRect: getViewportRect,

    VerticalPanel: VerticalPanel,
    VerticalPanelStack: VerticalPanelStack,

    addBlockResizeHandler: function(element, fn){
      /** @cut */ basis.dev.warn('`basis.layout.addBlockResizeHandler` is deprecated now, use basis.dom.resize.add/basis.dom.resize.remove functions instead.');
      listenResize(element, fn);
    }
  };
