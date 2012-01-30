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
    var number = Math.abs(number);
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
  var GraphComponent = Node.subclass({
    className: namespace + '.GraphComponent',

    legendGetter: Function.getter('legend'),
    getLegend: function(){
      return this.legendGetter(this)
    },

    colorGetter: Function.getter('color'),
    getColor: function(){
      return this.colorGetter(this);
    },

    valueGetter: Function.$const(0),

    //events
    event_redrawRequest: createEvent('redrawRequest'),

    event_update: function(object, delta){
      Node.prototype.event_update.call(this, object, delta);
      this.event_redrawRequest();
    }
  });


 /**
  * @class
  */
  var Graph = Canvas.subclass({
    className: namespace + '.Graph',

    childClass: GraphComponent,

    template:
      '<div class="Basis-Graph" style="position: relative; display: inline; display: inline-block; zoom: 1">' +
        '<canvas{canvas}>' +
          '<div>Canvas doesn\'t support.</div>' +
        '</canvas>' +
        '<!-- {graphViewer} -->' +
      '</div>',

    style: {},

    usedColors: null,
    presetColors: [
      '#F80',
      '#BB7BF1',
      '#FF3030',
      '#090',
      '#6699DD'
    ],

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
        delta.deleted.forEach(this.releaseColorFromComponent, this);

      if (delta.inserted)
        delta.inserted.forEach(this.setColorForComponent, this);

      this.updateCount++;
    },

    //init
    init: function(config){
      this.presetColors = Array.from(this.presetColors);
      this.usedColors = {}; 

      Canvas.prototype.init.call(this, config);
    },

    setStyle: function(newStyle){
      Object.extend(this.style, Object.slice(newStyle, ['strokeStyle', 'lineWidth']));
      this.updateCount++;
    },
    setColorForComponent: function(component){
      if (!component.color)
        component.color = this.getColor();

      this.usedColors[component.color] = true;
    },
    releaseColorFromComponent: function(component){
      delete this.usedColors[component.color];
      this.presetColors.push(component.color);
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

    drawFrame: Function.$undef
  });

 /**
  * @class
  */
  var AxisGraphThread = GraphComponent.subclass({
    className: namespace + '.AxisGraphThread',

    dataSourceGetter: Function.$null,

    getValues: function(){
      return this.childNodes.map(this.valueGetter);
    },

    event_childNodesModified: function(object, delta){
      GraphComponent.prototype.event_childNodesModified.call(this, object, delta);
      this.event_redrawRequest();
    },

    childClass: {
      className: namespace + '.AxisGraphNode',
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
  var AxisGraph = Graph.subclass({
    className: namespace + '.AxisGraph',

    childClass: AxisGraphThread,

    propGetter: Function.getter('data.prop'),
    showLegend: true,
    showYLabels: true,
    showXLabels: true,
    showBoundLines: true,
    showGrid: true,
    propValuesOnEdges: true,
    invertAxis: false,
    autoRotateScale: false,
    scaleAngle: 0,

    min: 0,
    max: 'auto',

    //init
    init: function(config){
      this.clientRect = {};
      Graph.prototype.init.call(this, config);
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
      var propCount = propValues.length;

      if (propCount < 2)
      {
        context.textAlign = 'center';
        context.fillStyle = '#777';
        context.font = '20px tahoma';
        context.fillText(propCount == 0 ? 'No data' : 'Not enough data', WIDTH / 2, HEIGHT / 2);

        return;
      }

      var maxValue = this.getMaxGridValue();
      var minValue = this.getMinGridValue();
      var gridPart = this.getGridPart(Math.max(Math.abs(minValue), Math.abs(maxValue))); 

      //correct min/max
      if (Math.abs(minValue) > Math.abs(maxValue))
        maxValue = Math.ceil(maxValue / gridPart) * gridPart;
      else 
        minValue = Math.floor(minValue / gridPart) * gridPart;

      var partCount = (maxValue - minValue) / gridPart;

      // prepare labels
      context.font = '10px tahoma';

      var xLabels = [];
      var yLabels = [];

      var maxValueTextWidth = 0;
      var maxPropTextWidth = 0;

      var showValueAxis = this.invertAxis ? this.showXLabels : this.showYLabels;
      var showPropAxis = this.invertAxis ? this.showYLabels : this.showXLabels;

      // calc y labels max width
      if (showValueAxis)
      {
        var valueLabels = this.invertAxis ? xLabels : yLabels;
        
        var tw;
        for (var i = 0; i < partCount + 1; i++)
        {
          valueLabels[i] = Math.round(minValue + gridPart * i).group();
          tw = context.measureText(valueLabels[i]).width;

          if (tw > maxValueTextWidth)
            maxValueTextWidth = tw;
        }

        TOP += 10;
      }

      // calc x labels max width
      if (showPropAxis)
      {
        var propLabels = this.invertAxis ? yLabels : xLabels;

        var tw;
        for (var i = 0; i < propCount; i++)
        {
          propLabels[i] = propValues[i];
          tw = context.measureText(propLabels[i]).width;

          if (tw > maxPropTextWidth)
            maxPropTextWidth = tw;
        }
      }

      // calc left offset
      var firstXLabelWidth = 0;
      var lastXLabelWidth = 0;
      if (this.showXLabels)
      {
        firstXLabelWidth = context.measureText(xLabels[0]).width + 12; // 12 = padding + border
        lastXLabelWidth = context.measureText(xLabels[(this.invertAxis ? partCount : propCount) - 1]).width + 12;
      }

      var maxXLabelWidth = this.invertAxis ? maxValueTextWidth : maxPropTextWidth;
      var maxYLabelWidth = this.invertAxis ? maxPropTextWidth : maxValueTextWidth;

      LEFT = Math.max(maxYLabelWidth + 6, Math.round(firstXLabelWidth / 2));
      RIGHT = Math.round(lastXLabelWidth / 2);

      // Legend
      if (this.showLegend)
      {
        var LEGEND_ROW_HEIGHT = 30;
        var LEGEND_BAR_SIZE = 20;

        var maxtw = 0;
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

      //
      // Draw Scales
      //
      context.font = '10px tahoma';
      context.lineWidth = 1;
      context.fillStyle = 'black';
      context.strokeStyle = 'black';

      var textHeight = 10;
      var skipLabel;
      var skipScale;
      var skipLabelCount;

      // xscale
      var xStep = (WIDTH - LEFT - RIGHT) / (this.invertAxis ? partCount : propCount - (this.propValuesOnEdges ? 1 : 0)) 
      if (this.showXLabels)
      {
        var angle;
        if (this.autoRotateScale)
        {
          skipLabelCount = Math.ceil((textHeight + 3) / xStep) - 1;
          angle = (skipLabelCount + 1) * xStep < maxXLabelWidth ? Math.asin((textHeight + 3) / ((skipLabelCount + 1) * xStep)) : 0;
        }
        else
        {
          angle = (this.scaleAngle % 180) * Math.PI / 180;
          var optimalLabelSpace = angle ? Math.min(textHeight / Math.sin(angle), maxXLabelWidth) : maxXLabelWidth;
          skipLabelCount = Math.ceil((optimalLabelSpace + 3) / xStep) - 1;
        }
        
        BOTTOM += Math.round(maxXLabelWidth * Math.sin(angle));

        skipScale = skipLabelCount > 10 || xStep < 4;
        context.textAlign = angle ? 'right' : 'center';        
        context.beginPath();
        
        var leftOffset = !this.propValuesOnEdges && !this.invertAxis ? xStep / 2 : 0;
        for (var i = 0; i < xLabels.length; i++)
        {
          var x = Math.round(leftOffset + LEFT + i * xStep) + .5;//xLabelsX[i];
          skipLabel = skipLabelCount && (i % (skipLabelCount + 1) != 0);

          context.save();
          if (!skipLabel)
          {
            context.translate(x + 3, HEIGHT - BOTTOM + 15);
            context.rotate(-angle);
            context.fillText(xLabels[i], 0, 0);
          }
          context.restore();
 
          if (!skipLabel || !skipScale)
          {
            context.moveTo(x, HEIGHT - BOTTOM + .5);
            context.lineTo(x, HEIGHT - BOTTOM + (skipLabel ? 3 : 5));
          }
        }
        
        context.stroke();
        context.closePath();
      }

      // yscale
      var yStep = (HEIGHT - TOP - BOTTOM) / (this.invertAxis ? propCount - (this.propValuesOnEdges ? 1 : 0) : partCount);
      if (this.showYLabels)
      {
        context.textAlign = 'right';

        var topOffset = !this.propValuesOnEdges && this.invertAxis ? yStep / 2 : 0;

        skipLabelCount = Math.ceil(15 / yStep) - 1;
        //skipLabelCount = 0;
        skipScale = skipLabelCount > 10 || yStep < 4;
 
        context.beginPath();        
        
        for (var i = 0, label; label = yLabels[i]; i++)
        {
          var labelY = Math.round(HEIGHT - BOTTOM - topOffset - i * yStep) + .5;

          /*context.fillText(label, LEFT - 6, labelY + 2.5);*/

          skipLabel = skipLabelCount && (i % (skipLabelCount + 1) != 0);

          if (!skipLabel)
            context.fillText(label, LEFT - 6, labelY + 2.5);

          if (!skipLabel || !skipScale)
          {
            context.moveTo(LEFT + .5 - 3, labelY);
            context.lineTo(LEFT + .5, labelY);
          }
        }

        context.stroke();
        context.closePath();
      }

      // draw grid
      if (this.showGrid)
      {
        context.beginPath();

        var labelX, labelY;
        var gridStep = this.invertAxis ? xStep : yStep;
        for (var i = 0; i < partCount; i++)
        {
          if (this.invertAxis)
          {
            labelX = WIDTH - RIGHT - Math.round(i * gridStep) + .5;
            context.moveTo(labelX, TOP + .5);
            context.lineTo(labelX, HEIGHT - BOTTOM + .5);
          }
          else
          {
            labelY = TOP + Math.round(i * gridStep) + .5;
            context.moveTo(LEFT + .5, labelY);
            context.lineTo(WIDTH - RIGHT + .5, labelY);
          }
        }

        context.strokeStyle = 'rgba(128, 128, 128, .25)';
        context.stroke();
        context.closePath();
      }

      // draw bounds lines
      if (this.showBoundLines)
      {
        //var zeroOffsetX = minValue < 0 && this.invertAxis ? Math.round(WIDTH * -minValue / (maxValue - minValue)) : 0;
        //var zeroOffsetY = minValue < 0 && ! this.invertAxis ? Math.round(HEIGHT * -minValue / (maxValue - minValue)) : 0;

        context.beginPath();
        context.moveTo(LEFT + .5, TOP);
        context.lineTo(LEFT + .5, HEIGHT - BOTTOM + .5);
        context.moveTo(LEFT + .5, HEIGHT - BOTTOM + .5);
        context.lineTo(WIDTH - RIGHT + .5, HEIGHT - BOTTOM + .5);
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.stroke();
        context.closePath();
      }
      
      // Threads
      var step = this.invertAxis ? yStep : xStep;
      for (var i = 0, thread; thread = this.childNodes[i]; i++)
      {
        this.drawThread(thread, i, minValue, maxValue, step, LEFT, TOP, WIDTH - LEFT - RIGHT, HEIGHT - TOP - BOTTOM);
      }  

      //save graph data
      Object.extend(this.clientRect, {
        left: LEFT,
        top: TOP,
        width: WIDTH - LEFT - RIGHT,
        height: HEIGHT - TOP - BOTTOM
      });
      this.minValue = minValue;
      this.maxValue = maxValue;
    },

    drawThread: Function.$undef,

    getPropValues: function(){
      return (this.childNodes[0] && this.childNodes[0].childNodes.map(this.propGetter)) || [];
    },

    setMin: function(min){
      this.min = min;
      this.updateCount++;
    },
    setMax: function(max){
      this.max = max;
      this.updateCount++;
    },
    getMinValue: function(){
      var values;
      var min;
      
      for (var i = 0, thread; thread = this.childNodes[i]; i++)
      {
        values = thread.getValues();
        if (min)
          values.push(min);
        min = Math.min.apply(null, values);
      }
      return min;
    },
    getMaxValue: function(){
      var values;
      var max;
      
      for (var i = 0, thread; thread = this.childNodes[i]; i++)
      {
        values = thread.getValues();
        if (max)
          values.push(max);
        max = Math.max.apply(null, values);
      }
      return max;
    },
    getMinGridValue: function(){
      var minValue = this.min == 'auto' ? this.getMinValue() : this.min;
      return Math.floor(Math.ceil(minValue) / Math.pow(10, getDegree(minValue))) * Math.pow(10, getDegree(minValue));
    },
    getMaxGridValue: function(){
      var maxValue = this.max == 'auto' ? this.getMaxValue() : this.max;
      return Math.ceil(Math.ceil(maxValue) / Math.pow(10, getDegree(maxValue))) * Math.pow(10, getDegree(maxValue));
    },
    getGridPart: function(maxGridValue){
      var MIN_PART_COUNT = 5;
      var MAX_PART_COUNT = 20;

      var result;
      var maxDegree = getDegree(maxGridValue);

      if (maxDegree == 0)
        result = maxGridValue;

      if (maxGridValue % Math.pow(10, maxDegree) == 0)
      {
        var res = maxGridValue / Math.pow(10, maxDegree);
        if (res >= MIN_PART_COUNT)
          result = res;
      }

      if (!result)
      {
        var count = 1;
        var canDivide = true;
        var step;
        var newVal;
        var curVal = maxGridValue;
        var divisionCount = 0;

        while (count < MIN_PART_COUNT && divisionCount <= maxDegree)
        {
          for (var i = 2; i <= 5; i++)
          {
            step = curVal / i;
            newVal = (curVal - step) / Math.pow(10, maxDegree - divisionCount);
            if ((newVal - Math.floor(newVal) == 0) && (count*i < MAX_PART_COUNT))
            {
              curVal = step;
              count *= i;
              break;
            }
          } 

          divisionCount++;
        }

        result = count;
      }

      return maxGridValue / result;
    }
  });
  

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

      if (typeof FlashCanvas != "undefined") {
        FlashCanvas.initElement(this.element);
      }

      if (this.element.getContext)
        this.context = this.element.getContext('2d');

      if (this.owner)
        this.recalc();
    },

    recalc: function(){
      this.element.width = this.owner.tmpl.canvas.width;
      this.element.height = this.owner.tmpl.canvas.height;

      this.clientRect = this.owner.clientRect;
      this.max = this.owner.maxValue;
      this.min = this.owner.minValue;
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
      var MIN = this.min;

      var propValues = this.owner.getPropValues();
      if (propValues.length < 2)
        return;

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

        var valueY = Math.round((1 - (value - MIN) / (MAX - MIN)) * HEIGHT);
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
  var LinearGraph = AxisGraph.subclass({
    className: namespace + '.LinearGraph',

    points: [],
    style: {
      strokeStyle: '#090',
      lineWidth: 2.5,
      lineJoin: 'bevel'
    },

    satelliteConfig: {
      graphViewer: {
        instanceOf: GraphViewer
      }
    },

    drawFrame: function(){
      this.points = [];
      AxisGraph.prototype.drawFrame.call(this);
    },

    drawThread: function(thread, pos, min, max, step, left, top, width, height){
      var context = this.context;

      if (!this.propValuesOnEdges)
        left += step / 2;

      this.style.strokeStyle = thread.getColor();// || this.threadColor[i];
      var values = thread.getValues();

      context.save();
      context.translate(left, top);
      context.beginPath();


      this.points[pos] = [];
      var x, y;
      for (var i = 0; i < values.length; i++)
      {
        x = i * step;
        y = height * (1 - (values[i] - min) / (max - min))
        
        if (i == 0)
          context.moveTo(x, y);
        else
          context.lineTo(x, y);

        this.points[pos].push({
          x: x,
          y: y,
          value: values[i]
        });
      }

      Object.extend(context, this.style);
      context.stroke();
      context.closePath();
      context.restore();
    }
  });

  //
  // Bar Graph
  //

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
            
      var invertAxis = this.owner.invertAxis; 
      var WIDTH = clientRect.width;
      var HEIGHT = clientRect.height;

      var step = (invertAxis ? HEIGHT : WIDTH) / bars[0].length;
      var position = invertAxis ? HEIGHT - y : x;
      var barPosition = Math.floor(position / step);
      
      var legendText;
      var hoveredBar;
      var bar;
      for (var i = 0; i < bars.length; i++)
      {
        bar = bars[i][barPosition];
        if (x >= bar.x && x <= (bar.x + bar.width) && y >= bar.y && y <= (bar.y + bar.height))
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
  var BarGraph = AxisGraph.subclass({
    className: namespace + '.BarGraph',
    
    bars: null,
    propValuesOnEdges: false,

    satelliteConfig: {
      graphViewer: {
        instanceOf: BarGraphViewer
      }
    },

    drawFrame: function(){
      this.bars = [];
      AxisGraph.prototype.drawFrame.call(this);
    },

    drawThread: function(thread, pos, min, max, step, left, top, width, height){
      var context = this.context;

      var values = thread.getValues();
      var color = thread.getColor();

      context.save();
      context.translate(left, top);
      context.fillStyle = color;

      Object.extend(context, this.style);
      context.strokeStyle = '#333';
      context.lineWidth = 1;

      this.bars[pos] = [];

      var size = this.invertAxis ? width : height;
      var cnt = this.childNodes.length;
      var barSize = Math.round(0.7 * step / cnt);
      var needStroke = barSize > 10;
      var zeroOffset = min < 0 ? Math.abs(min / (max - min) * size) : 0;

      var barX, barY;
      var barWidth, barHeight;
      for (var i = 0; i < values.length; i++)
      {
        if (this.invertAxis)
        {
          barHeight = barSize;          
          barY = height - Math.round((i + 1) * step - pos * barHeight - barHeight / 2);

          var x = (values[i] - min) / (max - min) * size;
          barWidth = (x - zeroOffset) * (values[i] > 0 ? 1 : -1);
          barX = values[i] > 0 ? zeroOffset : zeroOffset - barWidth;
        }
        else
        {
          barWidth = barSize;          
          barX = Math.round(step / 2 + i * step - barWidth * cnt / 2 + pos * barWidth);

          var y = (values[i] - min) / (max - min) * size;
          barHeight = (y - zeroOffset) * (values[i] > 0 ? 1 : -1);
          barY = values[i] > 0 ? size - y : size - zeroOffset;
        }

        context.fillRect(barX + .5, barY + .5, barWidth, barHeight);
        if(needStroke)
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
    LinearGraph: LinearGraph,
    BarGraph: BarGraph
  });

}(basis);
