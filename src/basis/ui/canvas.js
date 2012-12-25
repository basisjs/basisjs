
/*window.FlashCanvasOptions = {
  swfPath: "../../src/basis/ext/"
};
basis_require('basis.ext.flashcanvas');*/

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');


 /**
  * @namespace basis.ui.canvas
  */

  var namespace = this.path;


  //
  // import names
  //

  var Node = basis.dom.wrapper.Node;
  var nodePrototype = Node.prototype;
  var UINode = basis.ui.Node;

  var createEvent = basis.event.create;


  //
  // Main part
  //

 /**
  * @class
  */
  var Shape = Node.subclass({
    className: namespace + '.Shape',
    draw: function(context){
      context.save();
      context.fillStyle = 'red';
      context.fillRect(this.data.value * 10,10,30,30);
      context.restore();
    },
    listen: {
      childNode: {
        update: function(){
          this.updateCount++;
        }
      }
    }
  });

 /**
  * @class
  */
  var CanvasLayer = UINode.subclass({
    className: namespace + '.CanvasLayer',

    template:
      '<canvas{canvas} class="{selected} {disabled}">' +
        '<div>Canvas doesn\'t support.</div>' +
      '</canvas>',

    templateSync: function(noRecreate){
      this.tmpl.canvas.width = this.width || 600;
      this.tmpl.canvas.height = this.height || 400;

      UINode.prototype.templateSync.call(this, noRecreate);

      var canvasElement = this.tmpl.canvas;

      if (typeof global.FlashCanvas != "undefined")
        global.FlashCanvas.initElement(canvasElement);
      
      if (canvasElement && canvasElement.getContext)
        this.context = canvasElement.getContext('2d');

      if (this.redrawRequest)
        this.redrawRequest();
    },

    childClass: Shape,
    insertBefore: nodePrototype.insertBefore,
    removeChild: nodePrototype.removeChild,
    clear: nodePrototype.clear,

    draw: Function.undef,
    reset: function(){
      if (this.context)
        this.context.clearRect(0, 0, this.element.offsetWidth, this.element.offsetHeight);
    }
  });


 /**
  * @class
  */
  var Canvas = CanvasLayer.subclass({
    className: namespace + '.Canvas',

    drawCount: 0,
    updateCount: 0,
    lastDrawUpdateCount: -1,

    event_draw: createEvent('draw'),
    listen: {
      childNode: {
        redrawRequest: function(){
          this.updateCount++;
        },
        update: function(){
          this.updateCount++;
        }
      }
    },

    init: function(){
      CanvasLayer.prototype.init.call(this);
     
      this.updateCount = 0;

      var canvasElement = this.tmpl.canvas;
      if (canvasElement && canvasElement.getContext)
        this.updateTimer_ = setInterval(this.draw.bind(this), 1000/60);
    },
    isNeedToDraw: function(){
      return this.context && (
        this.updateCount != this.lastDrawUpdateCount
        ||
        this.tmpl.canvas.width != this.lastDrawWidth
        ||
        this.tmpl.canvas.height != this.lastDrawHeight
      );
    },
    draw: function(){
      var canvas = this.tmpl.canvas;

      if (!canvas || !this.context)
        return false;

      if (canvas.offsetWidth && canvas.width != canvas.offsetWidth)
        canvas.width = canvas.offsetWidth;
      if (canvas.offsetHeight && canvas.height != canvas.offsetHeight)
        canvas.height = canvas.offsetHeight;

      if (!this.isNeedToDraw())
        return false;

      this.lastDrawWidth = canvas.width;
      this.lastDrawHeight = canvas.height;
      this.lastDrawUpdateCount = this.updateCount;
      this.drawCount = this.drawCount + 1;

      this.reset();

      this.drawFrame();

      this.event_draw();

      return true;
    },
    drawFrame: function(){
      for (var node = this.firstChild; node; node = node.nextSibling)
        node.draw(this.context);
    },
    destroy: function(){
      clearInterval(this.updateTimer_);

      CanvasLayer.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    CanvasLayer: CanvasLayer,
    Canvas: Canvas,
    Shape: Shape
  };
