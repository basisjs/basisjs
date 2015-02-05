basis.patch('basis.net', function(exports){
  var ajax = require('basis.net.ajax');

  // import names from basis.net.ajax
  basis.net.AjaxTransport = ajax.Transport;
  basis.net.AjaxRequest = ajax.Request;
  basis.net.Transport = ajax.Transport;
  basis.net.request = ajax.request;
  exports.AjaxTransport = ajax.Transport;
  exports.AjaxRequest = ajax.Request;
  exports.Transport = ajax.Transport;
  exports.request = ajax.request;

  // function rename
  exports.createEvent = exports.createTransportEvent;
});

basis.patch('basis.layout', function(exports){
  var panel = require('basis.ui.panel');

  basis.layout.VerticalPanel = panel.VerticalPanel;
  basis.layout.VerticalPanelStack = panel.VerticalPanelStack;
  exports.VerticalPanel = panel.VerticalPanel;
  exports.VerticalPanelStack = panel.VerticalPanelStack;

  require('basis.template').define('basis.layout', {
    Panel: basis.resource(panel.VerticalPanel.prototype.template.source.url),
    Stack: basis.resource(panel.VerticalPanelStack.prototype.template.source.url)
  });

  //
  // Boxes
  //

 /**
  * @class
  * @deprecated
  */
  var Box = basis.Class(null, {
    className: 'basis.layout.Box',

    init: function(element, woCalc, relElement){
      /** @cut */ basis.dev.warn('Class `basis.layout.Box` is deprecated now, use basis.layout.getBoundingRect function instead.');
      this.reset();
      this.element = element;
      this.relElement = relElement;
      if (!woCalc)
        this.recalc(this.relElement);
    },
    reset: function(){
      basis.object.extend(this, {
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
          case 'left':   this.left   = value; this.right  = this.left  + this.width;
            break;
          case 'right':  this.right  = value; this.left   = this.right - this.width;
            break;
          case 'width':  this.width  = value; this.right  = this.left  + this.width;
            break;
          case 'top':    this.top    = value; this.bottom = this.top    + this.height;
            break;
          case 'bottom': this.bottom = value; this.top    = this.bottom - this.height;
            break;
          case 'height': this.height = value; this.bottom = this.top    + this.height;
            break;
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
        extend(this, exports.getBoundingRect(element, relElement));
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
  var Viewport = Box.subclass({
    className: 'basis.layout.Viewport',

    init: function(){
       /** @cut */ basis.dev.warn('Class `basis.layout.Viewport` is deprecated now, use basis.layout.getBoundingRect function instead.');
       Box.prototype.init.call(this);
    },

    recalc: function(){
      this.reset();

      var element = this.element;
      if (element)
      {
        extend(this, exports.getViewportRect(element));
        this.defined = true;
      }

      return this.defined;
    }
  });

  basis.layout.Box = Box;
  basis.layout.Viewport = Viewport;
  exports.Box = Box;
  exports.Viewport = Viewport;

  //
  // addBlockResizeHandler
  //
  function addBlockResizeHandler(element, fn){
    /** @cut */ basis.dev.warn('`basis.layout.addBlockResizeHandler` is deprecated now, use basis.dom.resize.add/basis.dom.resize.remove functions instead.');
    require('basis.dom.resize').add(element, fn);
  }

  basis.layout.addBlockResizeHandler = addBlockResizeHandler;
  exports.addBlockResizeHandler = addBlockResizeHandler;
});
