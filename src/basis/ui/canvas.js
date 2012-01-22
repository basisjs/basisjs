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

basis.require('basis.event');
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.html');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.canvas
  */

  var namespace = 'basis.ui.canvas';


  //
  // import names
  //

  var Node = basis.dom.wrapper.Node;
  var UINode = basis.ui.Node;

  var createEvent = basis.event.create;


  //
  // Main part
  //

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
  var Canvas = UINode.subclass({
    className: namespace + '.Canvas',

    template:
      '<canvas{canvas}>' +
        '<div>Canvas doesn\'t support.</div>' +
      '</canvas>',

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
      UINode.prototype.init.call(this, config);
     
      this.tmpl.canvas.width = this.width;
      this.tmpl.canvas.height = this.height;
      this.updateCount = 0;

      var canvasElement = this.tmpl.canvas;
      if (canvasElement && canvasElement.getContext)
      {
        this.context = canvasElement.getContext('2d');
        this.updateTimer_ = setInterval(this.draw.bind(this), 1000/60);
      }
    },
    reset: function(){
      /*var ctx = this.context;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, this.element.clientWidth, this.element.clientHeight);
      ctx.restore();/**/
      this.tmpl.canvas.width = this.tmpl.canvas.clientWidth;
      this.tmpl.canvas.height = this.tmpl.canvas.clientHeight;
      /*if (this.context)
      {
        this.context.clearRect(0, 0, this.element.width, this.element.height)
      }*/
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

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    Canvas: Canvas,
    Shape: Shape
  });

}(basis);
