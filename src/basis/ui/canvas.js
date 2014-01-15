
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

  var createEvent = basis.event.create;

  var dwNode = basis.dom.wrapper.Node;
  var Node = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Canvas: resource('templates/canvas/Canvas.tmpl')
  });


  //
  // Main part
  //

 /**
  * @class
  */
  var Shape = dwNode.subclass({
    className: namespace + '.Shape',
    draw: function(context){
      // context.save();
      // context.fillStyle = 'red';
      // context.fillRect(this.data.value * 10,10,30,30);
      // context.restore();
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
  var AbstractCanvas = Node.subclass({
    className: namespace + '.AbstractCanvas',

    template: templates.Canvas,

    templateSync: function(){
      Node.prototype.templateSync.call(this);

      var canvasElement = this.tmpl.canvas;

      if (canvasElement)
      {
        canvasElement.width = this.width || 600;
        canvasElement.height = this.height || 400;
      }

      this.context = canvasElement && canvasElement.getContext ? canvasElement.getContext('2d') : null;

      this.redrawRequest();
    },

    childClass: Shape,

    // FIXME: it is a hack, to find better way do the same
    insertBefore: dwNode.prototype.insertBefore,
    removeChild: dwNode.prototype.removeChild,
    clear: dwNode.prototype.clear,

    draw: basis.fn.$undef,
    redrawRequest: function(){
    },

    reset: function(){
      if (this.context)
        this.context.clearRect(0, 0, this.tmpl.canvas.width, this.tmpl.canvas.height);
    }
  });


 /**
  * @class
  */
  var Canvas = AbstractCanvas.subclass({
    className: namespace + '.Canvas',

    drawCount: 0,
    updateCount: 0,
    lastDrawUpdateCount: -1,

    emit_draw: createEvent('draw'),
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
      AbstractCanvas.prototype.init.call(this);

      this.updateCount = 0;
      this.updateTimer_ = setInterval(this.draw.bind(this), 1000 / 60);
    },
    isNeedToDraw: function(){
      if (!this.context)
        return false;

      return this.updateCount != this.lastDrawUpdateCount
          || this.tmpl.canvas.width != this.lastDrawWidth
          || this.tmpl.canvas.height != this.lastDrawHeight;
    },
    draw: function(){
      if (!this.context)
        return false;

      var canvas = this.tmpl.canvas;

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

      this.emit_draw();

      return true;
    },
    drawFrame: function(){
      for (var node = this.firstChild; node; node = node.nextSibling)
        node.draw(this.context);
    },
    destroy: function(){
      clearInterval(this.updateTimer_);

      AbstractCanvas.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    AbstractCanvas: AbstractCanvas,
    Canvas: Canvas,
    Shape: Shape
  };
