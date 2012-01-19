/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 * Roman Dvornov <rdvornov@gmail.com>
 *
 */

basis.require('basis.ui.canvas');

!function(basis){

  'use strict';

 /**
  * @see ./demo/graph/range.html
  * @see ./demo/graph/dynamic-threads.html
  * @namespace basis.ui.graph
  */

  var namespace = 'basis.ui.graph';


  //
  // import names
  //
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var Node = basis.dom.wrapper.Node;
  var uiNode = basis.ui.Node;
  var uiContainer = basis.ui.Container;
  var Canvas = basis.ui.canvas.Canvas;

  var createEvent = basis.event.create;

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


  //generate random color func

  function generateColor(){
    var golden_ratio_conjugate = 0.618033988749895;

    var h = Math.random();
    h += golden_ratio_conjugate;
    h %= 1;

    var rgb = hsv_to_rgb(h, 0.6, 0.95);
 
    return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
  }
  function hsv_to_rgb(h, s, v)
  {
    var h1 = h * 6;
    var c = v * s;
    var x = c * (1 - Math.abs(h1 % 2 - 1));
    var rgb;
    switch(Math.floor(h1))
    { 
      case 0: rgb = [c, x, 0]; break;
      case 1: rgb = [x, c, 0]; break;
      case 2: rgb = [0, c, x]; break;
      case 3: rgb = [0, x, c]; break;
      case 4: rgb = [x, 0, c]; break;
      case 5: rgb = [c, 0, x]; break;
    }
    var m = v - c; 
    return [
      Math.floor((rgb[0] + m) * 256), 
      Math.floor((rgb[1] + m) * 256), 
      Math.floor((rgb[2] + m) * 256) 
    ];
  }



 /**
  * @class
  */
  var GraphViewer = uiNode.subclass({
    className: namespace + '.GraphViewer',

    template: '<canvas event-mousemove="move" event-mouseout="out" style="position:absolute;left:0;top:0"></canvas>',

    action: {
      move: function(event){
        this.mx = Event.mouseX(event);
        this.my = Event.mouseY(event);

        this.updatePosition(this.mx, this.my);
      },
      out: function(){
        this.mx = null;
        this.my = null;

        this.reset();
      }
    },

    listen: {
      owner: {
        draw: function(){
          this.recalc();

          if (this.mx)
            this.updatePosition(this.mx, this.my);
        }
      }
    },

    init: function(config){
      uiNode.prototype.init.call(this, config);

      this.context = this.element.getContext('2d');

      if (this.owner)
        this.recalc();
    },

    recalc: function(){
      this.element.width = this.owner.tmpl.canvas.width;
      this.element.height = this.owner.tmpl.canvas.height;

      this.clientRect = this.owner.clientRect;
      this.max = this.owner.maxValue;
    },

    reset: function(){
      this.element.width = this.element.clientWidth;
      this.element.height = this.element.clientHeight;
      this.context.translate(this.clientRect.left, this.clientRect.top);
    },

    updatePosition: function(mx, my){
      this.reset();

      var canvasRect = this.element.getBoundingClientRect();
      var x = mx - canvasRect.left - this.clientRect.left;
      var y = my - canvasRect.top - this.clientRect.top;

      var needToDraw = x > 0 && x < this.clientRect.width && y > 0 && y < this.clientRect.height;

      if (needToDraw)
        this.draw(x, y);
    },

    draw: function(x, y){
      var context = this.context;

      var TOP = this.clientRect.top;
      var WIDTH = this.clientRect.width;
      var HEIGHT = this.clientRect.height;
      var MAX = this.max;

      var propValues = this.owner.getPropValues();
      var step = WIDTH / (propValues.length - 1);
      var propPosition = Math.round(x / step);
      var xPosition = Math.round(propPosition * step);

      context.beginPath();
      context.moveTo(xPosition + .5, 0);
      context.lineTo(xPosition + .5, HEIGHT);
      context.strokeStyle = '#CCC';
      context.stroke();
      context.closePath();

      context.font = "10px tahoma";
      context.textAlign = "center";
      var propText = propValues[propPosition];
      var propTextWidth = context.measureText(propText).width;
      var propTextHeight = 10;

      context.beginPath();
      context.moveTo(xPosition + .5, HEIGHT + 1 + .5);
      context.lineTo(xPosition - 3 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition - Math.round(propTextWidth / 2) - 5 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition - Math.round(propTextWidth / 2) - 5 + .5, HEIGHT + 4 + propTextHeight + 5 + .5);
      context.lineTo(xPosition + Math.round(propTextWidth / 2) + 5 + .5, HEIGHT + 4 + propTextHeight + 5 + .5);
      context.lineTo(xPosition + Math.round(propTextWidth / 2) + 5 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition + 3 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition + .5, HEIGHT + 1);
      context.fillStyle = '#c29e22';
      context.strokeStyle = '#070';
      context.fill();
      context.stroke();
      context.closePath();

      context.fillStyle = 'black';
      context.fillText(propText, xPosition +.5, TOP + HEIGHT + 5);

      var labels = [];

      var labelPadding = 7;
      var labelHeight = 10 + 2*labelPadding;
      var labelWidth = 0;
      for (var i = 0, thread; thread = this.owner.childNodes[i]; i++)
      {
        var values = thread.getValues();
        var value = values[propPosition];

        if (isNaN(value))
          continue;

        var valueText = Number(value.toFixed(2)).group();
        var valueTextWidth = context.measureText(valueText).width;

        if (labelWidth < valueTextWidth)
          labelWidth = valueTextWidth; 

        var valueY = Math.round((1 - value / MAX) * HEIGHT);
        var labelY = Math.max(labelHeight / 2, Math.min(valueY, HEIGHT - labelHeight / 2));

        labels[i] = {
          thread: thread,
          text: valueText,
          valueY: valueY,
          labelY: labelY
        }
      }

      // adjust label positions 
      var labels = labels.sortAsObject(Function.getter('valueY'));
      var crossGroup = labels.map(function(label){
        return { labels: [label], y: label.labelY, height: labelHeight };
      })
      var hasCrossing = true;
      while (crossGroup.length > 1 && hasCrossing)
      {
        var i = 1;
        while (i < crossGroup.length)
        {
          hasCrossing = false;
          if ((crossGroup[i].y - crossGroup[i].height / 2) < (crossGroup[i - 1].y + crossGroup[i - 1].height / 2))
          {
            crossGroup[i].y = crossGroup[i - 1].y + (crossGroup[i].y - crossGroup[i - 1].y) * crossGroup[i].labels.length / crossGroup[i - 1].labels.length / 2;
            crossGroup[i].labels = crossGroup[i - 1].labels.concat(crossGroup[i].labels);
            crossGroup[i].height = crossGroup[i].labels.length * labelHeight;
            crossGroup[i].y = Math.max(crossGroup[i].height / 2, Math.min(crossGroup[i].y, HEIGHT - crossGroup[i].height / 2));
            crossGroup.splice(i - 1, 1);
            hasCrossing = true;
          }
          else
            i++;
        }
      }
      for (var i = 0; i < crossGroup.length; i++)
      {
        for (var j = 0; j < crossGroup[i].labels.length; j++)
        {
          var label = crossGroup[i].labels[j];
          label.labelY = crossGroup[i].y - crossGroup[i].height / 2 + j * labelHeight + labelHeight / 2;
        }
      }

      // draw labels
      var align = propPosition >= (propValues.length / 2) ? -1 : 1;

      for (var i = 0, label; label = labels[i]; i++)
      {
        var pointWidth = 3;
        context.strokeStyle = label.thread.getColor();
        context.fillStyle = 'white';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(xPosition + .5, label.valueY + .5, pointWidth, 0, 2*Math.PI);
        context.stroke();         
        context.fill();
        context.closePath();
        
        
        var tongueSize = 10;
        context.beginPath();
        context.moveTo(xPosition + (pointWidth + 1) * align + .5, label.valueY + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY - 5 + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY - Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + (labelWidth + 2*labelPadding)*align + .5, label.labelY - Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + (labelWidth + 2*labelPadding)*align + .5, label.labelY + Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY + Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize)*align + .5, label.labelY + 5 + .5);
        context.lineTo(xPosition + (pointWidth + 1) * align + .5, label.valueY + .5);
        context.fillStyle = label.thread.getColor();
        context.strokeStyle = '#444';
        context.lineWidth = 1;
        context.stroke();
        context.fill();
        context.closePath();

        context.fillStyle = 'black';
        context.textAlign = 'right';
        context.fillText(label.text, xPosition + (pointWidth + tongueSize + labelPadding)*align + (align == 1 ? labelWidth : 0) + .5, label.labelY + 4);
      }
    }
  });

 /**
  * @class
  */
  var GraphThread = Node.subclass({
    className: namespace + '.GraphThread',

    dataSourceGetter: Function.$null,

    legendGetter: Function.getter('legend'),
    getLegend: function(){
      return this.legendGetter(this)
    },

    colorGetter: Function.getter('color'),
    getColor: function(){
      return this.colorGetter(this);
    },

    valueGetter: Function.$const(0),
    getValues: function(){
      return this.childNodes.map(this.valueGetter);
    },

    //events
    event_redrawRequest: createEvent('redrawRequest'),

    event_update: function(object, delta){
      Node.prototype.event_update.call(this, object, delta);
      this.event_redrawRequest();
    },

    event_childNodesModified: function(object, delta){
      Node.prototype.event_childNodesModified.call(this, object, delta);
      this.event_redrawRequest();
    },

    childClass: {
      className: namespace + '.GraphNode',
      event_update: function(object, delta){
        if (this.parentNode)
          this.parentNode.event_redrawRequest(); 

        AbstractNode.prototype.event_update.call(this, object, delta);
      }        
    },
    
    childFactory: function(config){
      return new this.childClass(config);
    },

    //init
    init: function(config){
      Node.prototype.init.call(this, config);

      if (!this.dataSource)
        this.setDataSource(this.dataSourceGetter(this));
    }
  });


 /**
  * @class
  */
  var Graph = Canvas.subclass({
    className: namespace + '.Graph',

    template:
      '<div class="Basis-Graph" style="position: relative; display: inline-block">' +
        '<canvas{canvas}>' +
          '<div>Canvas doesn\'t support.</div>' +
        '</canvas>' +
        '<!-- {graphViewer} -->' +
      '</div>',

    childClass: GraphThread,

    propGetter: Function.getter('data.prop'),
    showLegend: true,
    showYLabels: true,
    showXLabels: true,
    showBoundLines: true,
    scaleValuesOnEdges: true,

    style: {
      strokeStyle: '#090',
      lineWidth: 2.5,
      lineJoin: 'bevel'
    },

    usedColors: null,
    presetColors: [
      '#F80',
      '#BB7BF1',
      '#FF3030',
      '#090',
      '#6699DD'
    ],

    satelliteConfig: {
      graphViewer: {
        instanceOf: GraphViewer
      }
    },

    listen: {
      childNode: {
        redrawRequest: function(){
          this.updateCount++;
        }
      }
    },

    event_localSortingChanged: function(node, oldLocalSorting, oldLocalSortingDesc){
      Canvas.prototype.event_localSortingChanged.call(this, node, oldLocalSorting, oldLocalSortingDesc);
      this.updateCount++;
    },
    event_childNodesModified: function(node, delta){
      Canvas.prototype.event_childNodesModified.call(this, node, delta);
      
      if (delta.deleted)
        delta.deleted.forEach(this.releaseColorFromThread, this);

      if (delta.inserted)
        delta.inserted.forEach(this.setColorForThread, this);

      this.updateCount++;
    },

    //init
    init: function(config){
      this.clientRect = {};
      this.presetColors = Array.from(this.presetColors);
      this.usedColors = {}; 

      Canvas.prototype.init.call(this, config);
    },

    setColorForThread: function(thread){
      if (!thread.color)
        thread.color = this.getColor();

      this.usedColors[thread.color] = true;
    },
    releaseColorFromThread: function(thread){
      delete this.usedColors[thread.color];
      this.presetColors.push(thread.color);
    },
    getColor: function(){
      var color = this.presetColors.pop();
      if (!color)
      {
        do
        {
          color = generateColor();
        }
        while (this.usedColors[color])
      }
      return color;
    },

    drawFrame: function(){
      var context = this.context;

      var TOP = 0;
      var LEFT = 0;
      var RIGHT = 10;
      var BOTTOM = 0;
      var WIDTH = context.canvas.width;
      var HEIGHT = context.canvas.height;

      var propValues = this.getPropValues();

      if (propValues.length < 2)
      {
        context.textAlign = 'center';
        context.fillStyle = '#777';
        context.font = '20px tahoma';
        context.fillText(propValues.length == 0 ? 'No data' : 'Not enough data', WIDTH / 2, HEIGHT / 2);

        return;
      }

      var max = this.getMaxValue();
      var maxValue = this.getMaxGridValue(max);
      var minValue = this.getMinGridValue();
      var partCount = this.getGridPartCount(minValue, maxValue); 

      //
      // calc yscale labels max width
      //
      var maxtw = 0;                            
      var y_labels = [];

      context.font = '10px tahoma';

      if (this.showYLabels)
      {
        TOP += 10;

        for (var i = 0; i < partCount; i++)
        {
          y_labels[i] = Math.round(maxValue * (partCount - i) / partCount).group();
          
          var tw = context.measureText(y_labels[i]).width + 6;
          if (tw > maxtw)
            maxtw = tw;
        }
      }
      
      var firstXLabelWidth = 0;
      var lastXLabelWidth = 0;
      
      if (this.showXLabels)
      {
        firstXLabelWidth = context.measureText(propValues[0]).width + 12; // 12 = padding + border
        lastXLabelWidth = context.measureText(propValues[propValues.length - 1]).width + 12;
      }

      LEFT = Math.max(maxtw, Math.round(firstXLabelWidth / 2));
      RIGHT = Math.round(lastXLabelWidth / 2);

      var cnt = propValues.length; 
      var step = (WIDTH - LEFT - RIGHT) / (cnt - (this.scaleValuesOnEdges ? 1 : 0)) ;
      
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
          var lx = Math.round(LEFT + (i % legendColumnCount) * legendColumnWidth);
          var ly = HEIGHT - BOTTOM + 5 + (Math.ceil((i + 1) / legendColumnCount) - 1) * LEGEND_ROW_HEIGHT;

          context.fillStyle = thread.getColor();// || this.threadColor[i];
          context.fillRect(lx, ly, LEGEND_BAR_SIZE, LEGEND_BAR_SIZE);

          context.fillStyle = 'black';
          context.textAlign = 'left';
          context.fillText(thread.getLegend(), lx + LEGEND_BAR_SIZE + 5, ly + LEGEND_BAR_SIZE / 2 + 3);
        }

      }

      BOTTOM += this.showXLabels ? 30 : 1; // space for xscale;

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
        context.lineTo(WIDTH - RIGHT + .5, labelY);
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

      if (this.showBoundLines)
      {
        context.beginPath();
        context.moveTo(LEFT + .5, TOP);
        context.lineTo(LEFT + .5, HEIGHT - BOTTOM + .5);
        context.lineTo(WIDTH - RIGHT + .5, HEIGHT - BOTTOM + .5);
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.stroke();
        context.closePath();
      }

      // xscale
      if (this.showXLabels)
      {
        var lastLabelPos = 0;
        var xLabelsX = [];
        var maxSkipLabelCount = 0;
        var skipLabelCount = 0;
        var x;
        var tw;

        context.font = '10px tahoma';
        context.textAlign = 'center';

        for (var i = 0; i < cnt; i++)
        {
          x = xLabelsX[i] = Math.round(LEFT + i * step + (this.scaleValuesOnEdges ? 0 : step / 2)) + .5;
          tw = context.measureText(propValues[i]).width;

          if (i == 0 || lastLabelPos + 10 < (x - tw / 2))
          {
            maxSkipLabelCount = Math.max(maxSkipLabelCount, skipLabelCount);
            skipLabelCount = 0;

            lastLabelPos = x + tw / 2;
          }
          else
          {
            skipLabelCount++;
          }
        }
        skipLabelCount = maxSkipLabelCount

        var skipLabel;
        var skipScale = skipLabelCount > 10;
        context.beginPath();
        for (var i = 0; i < cnt; i++)
        {
          x = xLabelsX[i];
          skipLabel = skipLabelCount && (i % (skipLabelCount + 1) != 0);

          if (!skipLabel)
            context.fillText(propValues[i], x, HEIGHT - BOTTOM + 15);

          if (!skipLabel || !skipScale)
          {
            context.moveTo(x, HEIGHT - BOTTOM + .5);
            context.lineTo(x, HEIGHT - BOTTOM + (skipLabel ? 3 : 5));
          }
        }
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.stroke();
        context.closePath();
      }
      
      // Threads
      var values;
      for (var i = 0, thread; thread = this.childNodes[i]; i++)
      {
        this.drawThread(thread, i, maxValue, LEFT, TOP, step, (HEIGHT - TOP - BOTTOM));
      }  

      //save graph data
      Object.extend(this.clientRect, {
        left: LEFT,
        top: TOP,
        width: WIDTH - LEFT - RIGHT,
        height: HEIGHT - TOP - BOTTOM
      });
      this.maxValue = maxValue;
    },
    drawThread: function(thread, pos, max, left, top, step, height){
      var context = this.context;

      if (!this.scaleValuesOnEdges)
        left += step / 2;

      this.style.strokeStyle = thread.getColor();// || this.threadColor[i];
      var values = thread.getValues();

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
    getMaxGridValue: function(maxValue){
      return Math.ceil(Math.ceil(maxValue) / Math.pow(10, getDegree(maxValue))) * Math.pow(10, getDegree(maxValue));
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

      if (maxDegree == 0)
        return maxValue;
      
      while (count < MIN_PART_COUNT && divisionCount <= maxDegree)
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
  // Bar Chart
  //

  var BAR_WIDTH_PART = 0.7;
  
  /**
   * @class
   */
  var BarGraphViewer = GraphViewer.subclass({
    draw: function(x, y){
      var context = this.context;

      var clientRect = this.owner.clientRect;
      var bars = this.owner.bars;
      var threads = this.owner.childNodes;
      var propValues = this.owner.getPropValues();
            
      var WIDTH = clientRect.width;
      var HEIGHT = clientRect.height;

      var step = WIDTH / bars[0].length;
      var barPosition = Math.floor(x / step);
      
      var legendText;
      var hoveredBar;
      var bar;
      for (var i = 0; i < bars.length; i++)
      {
        bar = bars[i][barPosition];
        if (x > bar.x && x < (bar.x + bar.width) && y > bar.y && y < (bar.y + bar.height))
        {
          hoveredBar = bar;
          legendText = threads[i].getLegend();
          break;
        }
      }

      if (!hoveredBar)
        return;

      var TOOLTIP_PADDING = 5;

      var tooltipText = propValues[barPosition] + ', ' + legendText + ', ' + Number(hoveredBar.value.toFixed(2)).group();
      context.font = "10px Tahoma";
      
      var tooltipTextWidth = context.measureText(tooltipText).width;
      var tooltipWidth = tooltipTextWidth + 2*TOOLTIP_PADDING;
      var tooltipHeight = 10 + 2*TOOLTIP_PADDING;

      var tooltipX = Math.round(Math.max(0, Math.min(this.clientRect.width - tooltipWidth, x - tooltipWidth / 2)));
      var tooltipY = Math.round(y - tooltipHeight - 5);

      if (tooltipY < 0) //show under cursor
        tooltipY = Math.round(y + 20); 

      context.strokeStyle = 'black';
      context.lineWidth = 1.5;
      context.shadowColor = '#000';
      context.shadowBlur = 5;
      context.strokeRect(hoveredBar.x + .5, hoveredBar.y + .5, hoveredBar.width, hoveredBar.height);
      context.clearRect(hoveredBar.x + .5, hoveredBar.y + .5, hoveredBar.width, hoveredBar.height);

      context.strokeStyle = '#333';
      context.fillStyle = 'white';
      context.lineWidth = 1;
      context.shadowBlur = 3;
      context.fillRect(tooltipX + .5, tooltipY + .5, tooltipWidth, tooltipHeight);        
      context.shadowBlur = 0;
      context.strokeRect(tooltipX + .5, tooltipY + .5, tooltipWidth, tooltipHeight);

      context.fillStyle = 'black';
      context.fillText(tooltipText, tooltipX + TOOLTIP_PADDING, tooltipY + tooltipHeight - TOOLTIP_PADDING);
    }
  });

  /**
   * @class
   */
  var BarChart = Graph.subclass({
    className: namespace + '.BarChart',
    
    bars: null,
    scaleValuesOnEdges: false,

    satelliteConfig: {
      graphViewer: {
        instanceOf: BarGraphViewer
      }
    },

    drawFrame: function(){
      this.bars = [];
      Graph.prototype.drawFrame.call(this);
    },

    drawThread: function(thread, pos, max, left, top, step, height){
      var context = this.context;

      var values = thread.getValues();
      var color = thread.getColor();

      var cnt = this.childNodes.length;
      var barWidth = Math.round(BAR_WIDTH_PART * step / cnt);
      //var startPosition = step / 2 + 0.15 * step + pos * barWidth;

      context.save();
      context.translate(left, top);
      context.fillStyle = color;

      Object.extend(context, this.style);
      context.strokeStyle = '#333';
      context.lineWidth = 1;

      this.bars[pos] = [];

      var barX, barY;
      var barHeight;
      for (var i = 0; i < values.length; i++)
      {
        barHeight = Math.round(height * values[i] / max);
 
        barX = Math.round(step / 2 + i * step - barWidth * cnt / 2 + pos * barWidth);
        barY = height - barHeight;

        context.fillRect(barX + .5, barY + .5, barWidth, barHeight);
        context.strokeRect(barX + .5, barY + .5, barWidth, barHeight);

        this.bars[pos].push({
          x: barX,
          y: barY,
          width: barWidth,
          height: barHeight,
          value: values[i]
        });
      }

      context.restore();
    }
  });
  
  
  //
  // export names
  //

  basis.namespace(namespace).extend({
    GraphViewer: GraphViewer,
    GraphThread: GraphThread,
    Graph: Graph,
    BarChart: BarChart
  });

}(basis);
