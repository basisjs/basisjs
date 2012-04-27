/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

/*window.FlashCanvasOptions = {
  swfPath: "../../src/basis/ext/"
};
basis_require('basis.ext.flashcanvas');*/

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.html');
  basis.require('basis.ui');


 /**
  * @namespace basis.ui.canvas
  */

  var namespace = this.path;


  //
  // import names
  //

  var Node = basis.dom.wrapper.Node;
  var UINode = basis.ui.Node;

  var createEvent = basis.event.create;


  //
  // Main part
  //

  var CanvasLayer = UINode.subclass({
    className: namespace + '.CanvasLayer',

    template:
      '<canvas{canvas} class="{selected} {disabled}">' +
        '<div>Canvas doesn\'t support.</div>' +
      '</canvas>',

    init: function(config){
      UINode.prototype.init.call(this, config);
     
      this.tmpl.canvas.width = this.width || 600;
      this.tmpl.canvas.height = this.height || 400;

      var canvasElement = this.tmpl.canvas;

      if (typeof FlashCanvas != "undefined") {
        FlashCanvas.initElement(canvasElement);
      }
      
      if (canvasElement && canvasElement.getContext)
        this.context = canvasElement.getContext('2d');
    },
    reset: function(){
      if (this.context)
        this.context.clearRect(0, 0, this.element.offsetWidth, this.element.offsetHeight)
    },

    draw: Function.undef
  });

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
    }/*
    update: function(){
      var result = Node.prototype.update.apply(this, arguments);

      if (result)
      {
        var parent = this.parentNode;
        while (parent)
        {
          if (parent instanceof Canvas)
          {
            parent.updateCount++;
            break;
          }
          parent = parent.parentNode;
        }
      }

      return result;
    }*/
  });

 /**
  * @class
  */
  var Canvas = CanvasLayer.subclass({
    className: namespace + '.Canvas',

    childFactory: function(config){
      return new this.childClass(config);
    },
    childClass: Shape,

    drawCount: 0,
    lastDrawUpdateCount: -1,

    event_draw: createEvent('draw', 'object'),
    listen: {
      childNode: {
        update: function(){
          this.updateCount++;
        }
      }
    },

    init: function(config){
      CanvasLayer.prototype.init.call(this, config);
     
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
      if (!this.isNeedToDraw())
        return false;

      this.lastDrawWidth = this.tmpl.canvas.width;
      this.lastDrawHeight = this.tmpl.canvas.height;
      this.lastDrawUpdateCount = this.updateCount;
      this.drawCount = this.drawCount + 1;

      this.reset();

      this.drawFrame();

      this.event_draw(this);

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
