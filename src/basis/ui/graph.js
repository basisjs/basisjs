/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.ui.canvas');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.canvas
  */

  var namespace = 'basis.ui.graph';


  //
  // import names
  //

  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var Node = basis.dom.wrapper.Node;
  var Canvas = basis.ui.canvas.Canvas;

  //
  // Main part
  //


  function getDegree(number){
    if (Math.abs(number) > 1)
    {
      return String(Math.floor(number)).length - 1;
    }
    else
    {
      /0\.(0+)?[^0]/.test(String(number));
      return (-1) * (RegExp.$1 || '').length - 1;
    }
  }

  var GraphThread = Node.subclass({
    canHaveChildren: true,
    legendGetter: Function.getter('legend'),
    colorGetter: Function.getter('color'),
    valueGetterGetter: Function.getter('valueGetter'),
    dataSourceGetter: Function.$null,

    getColor: function(){
      return this.colorGetter(this);
    },
    getLegend: function(){
      return this.legendGetter(this)
    },
    getValueGetter: function(){
      return this.valueGetterGetter(this);
    },
    getValues: function(){
      return this.childNodes.map(this.getValueGetter());
    },

    init: function(config){
      Node.prototype.init.call(this, config);

      if (!this.dataSource)
        this.setDataSource(this.dataSourceGetter(this));
    },

    childClass: {
      event_update: function(object, delta){
        if (this.parentNode && this.parentNode.parentNode)
          this.parentNode.parentNode.updateCount++; 

        AbstractNode.prototype.event_update.call(this, object, delta);
      }        
    },
    childFactory: function(config){
      return new this.childClass(config);
    }
  });

  var Graph = Canvas.subclass({
    className: 'Graph',
    childClass: GraphThread,

    propGetter: Function.getter('data.prop'),
    showLegend: true,

    style: {
      strokeStyle: '#090',
      lineWidth: 2.5,
      lineJoin: 'bevel'
    },

    threadColor: [
      '#6699DD',
      '#090',
      '#FF3030',
      '#BB7BF1',
      '#F80'
    ],
    
    event_childNodesModified: function(node, delta){
      this.updateCount++;
      Canvas.prototype.event_childNodesModified.call(this, node, delta);
    },
    event_localSortingChanged: function(node, oldLocalSorting, oldLocalSortingDesc){
      this.updateCount++;
      Canvas.prototype.event_localSortingChanged.call(this, node, oldLocalSorting, oldLocalSortingDesc);
    },

    draw: function(){
      Canvas.prototype.draw.call(this);
    },

    drawFrame: function(){
      var context = this.context;

      var TOP = 10;
      var LEFT = 0;
      var RIGHT = 10;
      var BOTTOM = 0;
      var WIDTH = context.canvas.width;
      var HEIGHT = context.canvas.height;

      var propValues = this.getPropValues();

      if (!propValues.length)
      {
        context.beginPath();

        context.moveTo(LEFT, TOP);
        context.lineTo(LEFT, HEIGHT - BOTTOM);
        context.lineTo(WIDTH - RIGHT, HEIGHT - BOTTOM);
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.stroke();
        context.closePath();

        context.textAlign = 'center';
        context.fillStyle = '#777';
        context.font = '20px tahoma';
        context.fillText('No data', WIDTH / 2, HEIGHT / 2);

        return;
      }

      var minValue = this.getMinGridValue();
      var maxValue = this.getMaxGridValue();
      var partCount = this.getGridPartCount(minValue, maxValue); 

      //
      // calc yscale labels max width
      //
      var maxtw = 0;                            
      var y_labels = [];

      context.font = '10px tahoma';

      for (var i = 0; i < partCount; i++)
      {
        y_labels[i] = Math.round(maxValue * (partCount - i) / partCount).group();

        var tw = context.measureText(y_labels[i]).width;
        if (tw > maxtw)
          maxtw = tw;
      }
      
      LEFT =  maxtw + 6;

      var cnt = propValues.length + 1; 
      var step = (WIDTH - LEFT - RIGHT) / (cnt < 2 ? 1 : cnt) ;
      
      // Legend
      if (this.showLegend)
      {
        var LEGEND_ROW_HEIGHT = 30;
        var LEGEND_BAR_SIZE = 20;

        maxtw = 0;
        for (var i = 0, thread; thread = this.childNodes[i]; i++)
        {
          var tw = context.measureText(thread.getLegend()).width + LEGEND_BAR_SIZE + 20;
          if (tw > maxtw)
            maxtw = tw;
        }

        var legendColumnCount = Math.floor((WIDTH - LEFT - RIGHT) / maxtw);
        var legendColumnWidth = (WIDTH - LEFT - RIGHT) / legendColumnCount;
        var legendRowCount = Math.ceil(this.childNodes.length / legendColumnCount);

        //draw legend
        BOTTOM += LEGEND_ROW_HEIGHT * legendRowCount; // legend height

        for (var i = 0, thread; thread = this.childNodes[i]; i++)
        {
          var lx = LEFT + (i % legendColumnCount) * legendColumnWidth;
          var ly = HEIGHT - BOTTOM + 5 + (Math.ceil((i + 1) / legendColumnCount) - 1) * LEGEND_ROW_HEIGHT;

          context.fillStyle = thread.getColor() || this.threadColor[i];
          context.fillRect(lx, ly, LEGEND_BAR_SIZE, LEGEND_BAR_SIZE);

          context.fillStyle = 'black';
          context.textAlign = 'left';
          context.fillText(thread.getLegend(), lx + LEGEND_BAR_SIZE + 5, ly + LEGEND_BAR_SIZE / 2 + 3);
        }

      }

      BOTTOM += 30; // space for xscale;

      // yscale
      context.lineWidth = 1;
      context.fillStyle = 'black';
      context.textAlign = 'right';
      var labelStep = (HEIGHT - TOP - BOTTOM) / partCount;
      for (var i = 0, label; label = y_labels[i]; i++)
      {
        var labelY = TOP + Math.round(i * labelStep) + .5;

        context.beginPath();
        context.moveTo(LEFT + .5, labelY);
        context.lineTo(WIDTH - RIGHT, labelY);
        context.strokeStyle = 'rgba(128, 128, 128, .25)';
        context.stroke();
        context.closePath();

        context.beginPath();
        context.moveTo(LEFT + .5 - 3, labelY);
        context.lineTo(LEFT + .5, labelY);
        context.strokeStyle = 'black';
        context.stroke();
        context.closePath();

        context.fillText(label, LEFT - 6, labelY + 2.5);
      }

      context.beginPath();
      context.moveTo(LEFT + .5, TOP);
      context.lineTo(LEFT + .5, HEIGHT - BOTTOM + .5);
      context.lineTo(WIDTH, HEIGHT - BOTTOM + .5);
      context.lineWidth = 1;
      context.strokeStyle = 'black';
      context.stroke();
      context.closePath();

      // xscale
      var lastLabelPos = 0;
      var xLabelsX = [];
      var maxSkipCount = 0;
      var skipCount = 0;
      var x;
      var tw;

      context.font = '9px tahoma';
      context.textAlign = 'center';

      for (var i = 0; i < cnt - 1; i++)
      {
        x = xLabelsX[i] = Math.round(LEFT + (i + 1) * step) + .5;
        tw = context.measureText(propValues[i]).width;

        if (lastLabelPos + 10 < (x - tw / 2))
        {
          maxSkipCount = Math.max(maxSkipCount, skipCount);
          skipCount = 0;

          lastLabelPos = x + tw / 2;
        }
        else
        {
          skipCount++;
        }
      }
      skipCount = maxSkipCount ? maxSkipCount + 1 : 0;

      var skip;

      context.beginPath();
      for (var i = 0; i < cnt - 1; i++)
      {
        x = xLabelsX[i];
        skip = skipCount && (i % skipCount != 0);

        if (!skip)
          context.fillText(propValues[i], x, HEIGHT - BOTTOM + 15);

        context.moveTo(x, HEIGHT - BOTTOM + .5);
        context.lineTo(x, HEIGHT - BOTTOM + (skip ? 3 : 5));
      }
      context.lineWidth = 1;
      context.strokeStyle = 'black';
      context.stroke();
      context.closePath();

      
      // Threads
      var values;
      for (var i = 0, thread; thread = this.childNodes[i]; i++)
      {
        this.style.strokeStyle = thread.getColor() || this.threadColor[i];
        values = thread.getValues();
        this.drawThread(values, maxValue, LEFT + step, TOP, step, (HEIGHT - TOP - BOTTOM))
      }  
    },
    drawThread: function(values, max, left, top, step, height){
      var context = this.context;

      context.save();
      context.translate(left, top);
      context.beginPath();
      context.moveTo(0, height * (1 - values[0] / max));

      for (var i = 1; i < values.length; i++)
        context.lineTo(i * step, height * (1 - values[i] / max));

      Object.extend(context, this.style);
      context.stroke();
      context.closePath();
      context.restore();
    },
    getPropValues: function(){
      return (this.childNodes[0] && this.childNodes[0].childNodes.map(this.propGetter)) || [];
    },
    getMaxValue: function(){
      var values;
      var max = 0;
      
      for (var i = 0, thread; thread = this.childNodes[i]; i++)
      {
        values = thread.getValues();
        values.push(max);
        max = Math.max.apply(null, values);
      }

      return max;
    },
    getMinGridValue: function(){
      return 0;
    },
    getMaxGridValue: function(){
      var maxValue = this.getMaxValue();
      return Math.ceil(Math.round(maxValue) / Math.pow(10, getDegree(maxValue))) * Math.pow(10, getDegree(maxValue));
    },
    getGridPartCount: function(minValue, maxValue){
      var MIN_PART_COUNT = 5;
      var MAX_PART_COUNT = 20;

      var count = 1;
      var canDivide = true;
      var step;
      var newVal;
      var divisionCount = 0;

      var maxDegree = getDegree(maxValue);

      while (count < MIN_PART_COUNT && divisionCount < maxDegree)
      {
        for (var i = 2; i <= 5; i++)
        {
          step = (maxValue - minValue) / i;
          newVal = (maxValue - step) / Math.pow(10, maxDegree - divisionCount);
          if ((newVal - Math.floor(newVal) == 0) && (count*i < MAX_PART_COUNT))
          {
            maxValue = minValue + step;
            count *= i;
            break;
          }
        } 

        divisionCount++;
      }

      return count;
    },
    setStyle: function(newStyle){
      Object.extend(this.style, Object.slice(newStyle, ['strokeStyle', 'lineWidth']));
      this.updateCount++;
    }
  });
  
  
  
  //
  // export names
  //

  basis.namespace(namespace).extend({
    Graph: Graph
  });

}(basis);
