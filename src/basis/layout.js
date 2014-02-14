
  basis.require('basis.dom.computedStyle');
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

  var Class = basis.Class;


  //
  // Main part
  //

  function getOffsetParent(node){
    var offsetParent = node.offsetParent || documentElement;

    while (offsetParent && offsetParent !== documentElement && computedStyle(offsetParent, 'position') == 'static')
      offsetParent = offsetParent.offsetParent;

    return offsetParent || documentElement;
  }

  function getPageOffset(){
    var top = 0;
    var left = 0;

    if (document.compatMode == 'CSS1Compat')
    {
      top = global.pageYOffset || documentElement.scrollTop;
      left = global.pageXOffset || documentElement.scrollLeft;
    }
    else
    {
      // IE6 and lower
      var body = document.body;
      if (element !== body)
      {
        top = body.scrollTop - body.clientTop;
        left = body.scrollLeft - body.clientLeft;
      }
    }

    return {
      x: left,
      y: top
    };
  }

  function getTopLeftPoint(element){
    var left = 0;
    var top = 0;

    if (element && element.getBoundingClientRect)
    {
      var box = element.getBoundingClientRect();
      var offset = getPageOffset();

      top = box.top + offset.y;
      left = box.left + offset.x;
    }

    return {
      top: top,
      left: left
    };
  }

  function getBoundingRect(element, relElement){
    var top = 0;
    var left = 0;
    var right = 0;
    var bottom = 0;

    if (element && element.getBoundingClientRect)
    {
      var rect = element.getBoundingClientRect();
      var offset;

      // coords relative of relElement
      if (relElement && relElement.getBoundingClientRect)
      {
        var relRect = relElement.getBoundingClientRect();
        offset = {
          x: -relRect.left,
          y: -relRect.top
        };
      }
      else
      {
        offset = getPageOffset();
      }

      top = rect.top + offset.y;
      left = rect.left + offset.x;
      right = rect.right + offset.x;
      bottom = rect.bottom + offset.y;
    }

    return {
      top: top,
      left: left,
      right: right,
      bottom: bottom,
      width: right - left,
      height: bottom - top
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
  // export names
  //

  module.exports = {
    Box: Box,
    Viewport: Viewport,

    getOffsetParent: getOffsetParent,
    getTopLeftPoint: getTopLeftPoint,
    getBoundingRect: getBoundingRect,
    getViewportRect: getViewportRect,

    addBlockResizeHandler: function(element, fn){
      /** @cut */ basis.dev.warn('`basis.layout.addBlockResizeHandler` is deprecated now, use basis.dom.resize.add/basis.dom.resize.remove functions instead.');
      listenResize(element, fn);
    }
  };
