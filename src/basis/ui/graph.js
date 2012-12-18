
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');
  basis.require('basis.ui.canvas');


 /**
  * @see ./demo/graph/range.html
  * @see ./demo/graph/dynamic-threads.html
  * @namespace basis.ui.graph
  */

  var namespace = this.path;


  //
  // import names
  //

  var oneFunctionProperty = basis.Class.oneFunctionProperty;

  var Event = basis.dom.event;
  var DOM = basis.dom;

  var DataObject = basis.data.DataObject;
  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var Node = basis.dom.wrapper.Node;
  var Canvas = basis.ui.canvas.Canvas;
  var CanvasLayer = basis.ui.canvas.CanvasLayer;
  var Selection = basis.dom.wrapper.Selection;

  var createEvent = basis.event.create;
  var getter = Function.getter;
  var arrayFrom = basis.array.from;

  //
  // Main part
  //


  function getDegree(number){
    number = Math.abs(number);
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
  var ColorPicker = Node.subclass({
    className: namespace + '.ColorPicker',
    usedColors: null,
    presetColors: [
      '#F80',
      '#BB7BF1',
      '#FF3030',
      '#090',
      '#6699DD'
    ],

    listen: {
      owner: {
        childNodesModified: function(object, delta){
          if (delta.deleted)
            delta.deleted.forEach(this.releaseColor, this);

          if (delta.inserted)
            delta.inserted.forEach(this.setColor, this);
        }
      }
    },

    init: function(){
      this.presetColors = arrayFrom(this.presetColors);
      this.usedColors = {};
      Node.prototype.init.call(this);
    },

    setColor: function(object){
      if (!object.color)
        object.color = this.getColor();

      this.usedColors[object.color] = true;
    },
    releaseColor: function(object){
      delete this.usedColors[object.color];
      this.presetColors.push(object.color);
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
    }
  });


 /**
  * @class
  */
  var GraphNode = Node.subclass({
    className: namespace + '.GraphNode',
    event_requestRedraw: createEvent('requestRedraw'),
    event_disable: createEvent('disable'),
    event_enable: createEvent('enable')
  });

 /**
  * @class
  */
  var Graph = Canvas.subclass({
    className: namespace + '.Graph',

    childClass: GraphNode,

    template: resource('templates/graph/Graph.tmpl'),

    binding: {
      graphSelection: 'satellite:',
      graphViewer: 'satellite:'
    },

    style: {},

    event_sortingChanged: function(oldSorting, oldSortingDesc){
      Canvas.prototype.event_sortingChanged.call(this, oldSorting, oldSortingDesc);
      this.redrawRequest();
    },
    event_groupingChanged: function(oldGrouping){
      Canvas.prototype.event_groupingChanged.call(this, oldGrouping);
      this.redrawRequest();
    },
    event_childNodesModified: function(delta){
      Canvas.prototype.event_childNodesModified.call(this, delta);
      this.redrawRequest();
    },

    listen: {
      childNode: {
        requestRedraw: function(){
          this.redrawRequest();
        }
      }
    },

    setStyle: function(newStyle){
      Object.extend(this.style, Object.slice(newStyle, ['strokeStyle', 'lineWidth']));
      this.redrawRequest();
    },

    redrawRequest: function(){
      this.updateCount++;
    },

    drawFrame: Function.$undef
  });

  //
  // Series Graph
  //
  var SERIES_SOURCE_HANDLER = {
    datasetChanged: function(object, delta){
      var key;
      var value;
      var valuesDelta = [];

      if (delta.inserted)
        for (var i = 0, child; child = delta.inserted[i]; i++)
        {
          key = this.keyGetter(child);
          value = this.valueGetter(child);

          valuesDelta[key] = value;
          this.valuesMap[key] = value;

          child.addHandler(SERIES_ITEM_HANDLER, this);
        }

      if (delta.deleted)
        for (var i = 0, child; child = delta.deleted[i]; i++)
        {
          key = this.keyGetter(child);
          valuesDelta[key] = null;
          this.valuesMap[key] = null;

          child.removeHandler(SERIES_ITEM_HANDLER, this);
        }

      this.event_valuesChanged(valuesDelta);
    } 
  };

  var SERIES_ITEM_HANDLER = {
    update: function(object){ 
      var key = this.keyGetter(object);
      var value = this.valueGetter(object);

      var valuesDelta = {};
      this.valuesMap[key] = value;
      valuesDelta[key] = value;

      this.event_valuesChanged(valuesDelta);
    }
  };

 /**
  * @class
  */
  var GraphSeries = AbstractNode.subclass({
    className: namespace + '.GraphSeries',

    valuesMap: null,

    sourceGetter: getter('source'),
    keyGetter: Function.$undef,
    
    valueGetter: Function.$const(0),
    getValue: function(object, key){
      return this.source ? this.valuesMap[key] : this.valueGetter(object);
    },

    legendGetter: getter('legend'),
    getLegend: function(){
      return this.legendGetter(this);
    },

    colorGetter: getter('color'),
    getColor: function(){
      return this.colorGetter(this);
    },

    //events
    event_valuesChanged: createEvent('valuesChanged', 'delta'),
    event_sourceChanged: createEvent('sourceChanged', 'oldSource'),
    event_disable: createEvent('disable'),
    event_enable: createEvent('enable'),

    init: function(){
      this.valuesMap = {};

      Node.prototype.init.call(this);

      this.source = this.sourceGetter(this);

      if (this.source)
      {
        var source = this.source;
        this.source = null;
        this.setSource(source);
      }
    },

    setSource: function(source){
      if (this.source !== source)
      {
        var oldSource = this.source;
        if (oldSource)
        {
          oldSource.removeHandler(SERIES_SOURCE_HANDLER, this);
          SERIES_SOURCE_HANDLER.datasetChanged.call(this, oldSource, { deleted: oldSource.getItems() });
        }

        this.source = source;
        if (this.source)
        {
          this.source.addHandler(SERIES_SOURCE_HANDLER, this);
          SERIES_SOURCE_HANDLER.datasetChanged.call(this, oldSource, { inserted: this.source.getItems() });
        }

        this.event_sourceChanged(oldSource);
      }
    },

    destroy: function(){
      this.setSource(null);
      AbstractNode.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var GraphSeriesList = Node.subclass({
    className: namespace + '.GraphSeriesList',
    childClass: GraphSeries,

    childFactory: function(config){
      return new this.childClass(config);
    },

    listen: {
      childNode: {
        valuesChanged: function(seria, delta){
          this.event_valuesChanged(seria, delta);
        }
      }
    },

    init: function(){
      this.colorPicker = new ColorPicker(Object.extend({ owner: this }, this.colorPicker));
      Node.prototype.init.call(this);
    },

    destroy: function(){
      this.colorPicker.destroy();
      this.colorPicker = null;

      Node.prototype.destroy.call(this);
    }
  });

  var GRAPH_SERIES_HANDLER = {
    childNodesModified: function(object, delta){
      if (delta.inserted)
        for (var i = 0, seria; seria = delta.inserted[i]; i++)
        {
          for (var j = 0, child; child = this.childNodes[j]; j++)
            child.values[seria.basisObjectId] = seria.getValue(child, this.keyGetter(child));
        }

      if (delta.deleted)
        for (var i = 0, seria; seria = delta.deleted[i]; i++)
        {
          for (var j = 0, child; child = this.childNodes[j]; j++)
            delete child.values[seria.basisObjectId];
        }

      this.redrawRequest();
    },
    valuesChanged: function(seria, delta){
      var needRedraw = false;

      var key;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        key = this.keyGetter(child);
        if (delta[key])
        {
          if (delta[key])
            child.values[seria.basisObjectId] = delta[key];
          else
            delete child.values[seria.basisObjectId];

          needRedraw = true;
        }
      }

      if (needRedraw)
        this.redrawRequest();
    }
  };

  var GRAPH_NODE_UPDATE_HANDLER = function(object){
    for (var i = 0, seria; seria = this.series.childNides[i]; i++)
      object.values[seria.basisObjectId] = seria.getValue(object, this.keyGetter(object));

    this.redrawRequest();
  };

 /**
  * @class
  */
  var SeriesGraphNode = GraphNode.subclass({
    className: namespace + '.SeriesGraphNode',
    values: {},

    valueChangeEvents: oneFunctionProperty(
      GRAPH_NODE_UPDATE_HANDLER,
      {
        update: true
      }
    ),

    init: function(){
      this.values = {};
      GraphNode.prototype.init.call(this);
    }
  });

 /**
  * @class
  */
  var SeriesGraph = Graph.subclass({
    className: namespace + '.SeriesGraph',
    childClass: SeriesGraphNode,    

    keyGetter: Function.$self,
    keyTitleGetter: function(object){
      return this.keyGetter(object); 
    },
    
    event_childNodesModified: function(delta){
      Graph.prototype.event_childNodesModified.call(this, delta);

      if (!this.series || !this.series.childNodes)
        return;
    
      if (delta.inserted)
        for (var i = 0, child; child = delta.inserted[i]; i++)
        {
          for (var j = 0, seria; seria = this.series.childNodes[j]; j++)
            if (seria.getValue)
              child.values[seria.basisObjectId] = seria.getValue(child, this.keyGetter(child));

          child.addHandler(child.valueChangeEvents, this);
        }

      if (delta.deleted)
        for (var i = 0, child; child = delta.deleted[i]; i++)
        {
          for (var j = 0, seria; seria = this.series.childNodes[j]; j++)
            child.values[seria.basisObjectId] = null;

          child.removeHandler(child.valueChangeEvents, this);
        }

      this.redrawRequest();
    },

    //init
    init: function(){
      Graph.prototype.init.call(this);

      if (Array.isArray(this.series))
      {
        var series = [];
        for (var i = 0, seria; seria = this.series[i]; i++)
          series[i] = (typeof seria == 'function') ? { valueGetter: seria } : seria;
        
        this.series = {
          childNodes: series
        };
      }

      this.series = new GraphSeriesList(Object.extend({ owner: this }, this.series));
      this.series.addHandler(GRAPH_SERIES_HANDLER, this);
      GRAPH_SERIES_HANDLER.childNodesModified.call(this, this.series, { inserted: this.series.childNodes });
    },

    getValuesForSeria: function(seria){
      var values = [];
      for (var i = 0, child; child = this.childNodes[i]; i++)
        values.push(child.values[seria.basisObjectId]);
      
      return values;
    },

    destroy: function(){
      this.series.destroy();
      delete this.series;

      Graph.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var AxisGraph = SeriesGraph.subclass({
    className: namespace + '.AxisGraph',

    showLegend: true,
    showYLabels: true,
    showXLabels: true,
    showBoundLines: true,
    showGrid: true,
    keyValuesOnEdges: true,
    invertAxis: false,
    autoRotateScale: false,
    scaleAngle: 0,

    min: 0,
    max: 'auto',

    //init
    init: function(){
      this.clientRect = {};

      SeriesGraph.prototype.init.call(this);
    },

    drawFrame: function(){
      var context = this.context;

      var TOP = 0;
      var BOTTOM = 0;      
      var LEFT = 0;
      var RIGHT = 0;
      var WIDTH = context.canvas.width;
      var HEIGHT = context.canvas.height;

      var series = this.series.childNodes;
      var keys = this.childNodes.map(this.keyTitleGetter, this);
      var keysCount = keys.length;

      if (keysCount < 2 || !series.length)
      {
        context.textAlign = 'center';
        context.fillStyle = '#777';
        context.font = '20px tahoma';
        context.fillText(keysCount == 0 ? 'No data' : 'Not enough data', WIDTH / 2, HEIGHT / 2);

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
      var maxKeyTextWidth = 0;

      var showValueAxis = this.invertAxis ? this.showXLabels : this.showYLabels;
      var showKeyAxis = this.invertAxis ? this.showYLabels : this.showXLabels;

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

        maxValueTextWidth += 6;
        TOP += 10;
      }

      // calc x labels max width
      if (showKeyAxis)
      {
        var keyLabels = this.invertAxis ? yLabels : xLabels;

        var tw;
        for (var i = 0; i < keysCount; i++)
        {
          keyLabels[i] = keys[i];
          tw = context.measureText(keyLabels[i]).width;

          if (tw > maxKeyTextWidth)
            maxKeyTextWidth = tw;
        }

        maxKeyTextWidth += 6;
      }

      // calc left offset
      var firstXLabelWidth = 0;
      var lastXLabelWidth = 0;
      if (this.showXLabels)
      {
        firstXLabelWidth = context.measureText(xLabels[0]).width + 12; // 12 = padding + border
        lastXLabelWidth = context.measureText(xLabels[(this.invertAxis ? partCount : keysCount) - 1]).width + 12;
      }

      var maxXLabelWidth = this.invertAxis ? maxValueTextWidth : maxKeyTextWidth;
      var maxYLabelWidth = this.invertAxis ? maxKeyTextWidth : maxValueTextWidth;

      LEFT += Math.max(maxYLabelWidth, Math.round(firstXLabelWidth / 2));
      RIGHT += Math.round(lastXLabelWidth / 2);

      // Legend
      if (this.showLegend)
      {
        var LEGEND_ROW_HEIGHT = 30;
        var LEGEND_BAR_SIZE = 20;

        var maxtw = 0;
        for (var i = 0, seria; seria = series[i]; i++)
        {
          var tw = context.measureText(seria.getLegend()).width + LEGEND_BAR_SIZE + 20;
          if (tw > maxtw)
            maxtw = tw;
        }

        var legendColumnCount = Math.floor((WIDTH - LEFT - RIGHT) / maxtw);
        var legendColumnWidth = (WIDTH - LEFT - RIGHT) / legendColumnCount;
        var legendRowCount = Math.ceil(series.length / legendColumnCount);

        //draw legend
        BOTTOM += LEGEND_ROW_HEIGHT * legendRowCount; // legend height

        for (var i = 0, seria; seria = series[i]; i++)
        {
          var lx = Math.round(LEFT + (i % legendColumnCount) * legendColumnWidth);
          var ly = HEIGHT - BOTTOM + 5 + (Math.ceil((i + 1) / legendColumnCount) - 1) * LEGEND_ROW_HEIGHT;

          context.fillStyle = seria.getColor();
          context.fillRect(lx, ly, LEGEND_BAR_SIZE, LEGEND_BAR_SIZE);

          context.fillStyle = 'black';
          context.textAlign = 'left';
          context.fillText(seria.getLegend(), lx + LEGEND_BAR_SIZE + 5, ly + LEGEND_BAR_SIZE / 2 + 3);
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
      var xStep = (WIDTH - LEFT - RIGHT) / (this.invertAxis ? partCount : keysCount - (this.keyValuesOnEdges ? 1 : 0)); 
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
        
        var leftOffset = !this.keyValuesOnEdges && !this.invertAxis ? xStep / 2 : 0;
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
      var yStep = (HEIGHT - TOP - BOTTOM) / (this.invertAxis ? keysCount - (this.keyValuesOnEdges ? 1 : 0) : partCount);
      if (this.showYLabels)
      {
        context.textAlign = 'right';

        var topOffset = !this.keyValuesOnEdges && this.invertAxis ? yStep / 2 : 0;

        skipLabelCount = Math.ceil(15 / yStep) - 1;
        //skipLabelCount = 0;
        skipScale = skipLabelCount > 10 || yStep < 4;
 
        context.beginPath();        
        
        for (var i = 0, label; label = yLabels[i]; i++)
        {
          var labelY = Math.round(this.invertAxis ? (TOP + topOffset + i * yStep) : (HEIGHT - BOTTOM - topOffset - i * yStep)) + .5;

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
      
      // Series
      var step = this.invertAxis ? yStep : xStep;
      for (var i = 0, seria; seria = series[i]; i++)
      {
        this.drawSeria(this.getValuesForSeria(seria), seria.getColor(), i, minValue, maxValue, step, LEFT, TOP, WIDTH - LEFT - RIGHT, HEIGHT - TOP - BOTTOM);
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

    setMin: function(min){
      this.min = min;
      this.updateCount++;
    },
    setMax: function(max){
      this.max = max;
      this.updateCount++;
    },
    getMinValue: function(){
      var min = Infinity;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        for (var j in child.values)
          if (child.values[j] < min)
            min = child.values[j];
      }
      return min;
    },
    getMaxValue: function(){
      var max = -Infinity;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        for (var j in child.values)
          if (child.values[j] > max)
            max = child.values[j];
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
    },

    // abstract methods
    drawSeria: Function.$undef
  });


  //
  // GraphSelection
  // 
  var ctrlPressed = false;
  var startItemPosition = -1;
  var addSelectionMode = true;

  function getGraphXByMouseX(graph, globalX){
    var graphRect = graph.element.getBoundingClientRect();
    return globalX - graphRect.left - graph.clientRect.left;
  }
  function getGraphYByMouseY(graph, globalY){
    var graphRect = graph.element.getBoundingClientRect();
    return globalY - graphRect.top - graph.clientRect.top;
  }
  function getGraphItemPositionByMouseX(graph, mouseX){
    var width = graph.clientRect.width;
    var itemCount = graph.childNodes.length;
    var x = getGraphXByMouseX(graph, mouseX);
    return Math.max(0, Math.min(itemCount - 1, Math.round(x / (width / (itemCount - 1)))));
  }

  function rebuildGraphSelection(graph, curItemPosition, startItemPosition)
  {
    var applyItems = graph.childNodes.slice(Math.min(startItemPosition, curItemPosition), Math.max(startItemPosition, curItemPosition) + 1);

    var selectedItems = arrayFrom(graph.selection.getItems());
    if (addSelectionMode)
    {
      selectedItems = selectedItems.concat(applyItems);
    }
    else
    {
      var pos;
      for (var i = 0, item; item = applyItems[i]; i++)
      {
        if ((pos = selectedItems.indexOf(item)) != -1)
          selectedItems.splice(pos, 1); 
      }      
    }
    
    return selectedItems;
  }

  var GRAPH_ELEMENT_HANDLER = {
    mousedown: function(event){
      var graph = this.owner; 
      var x = getGraphXByMouseX(graph, Event.mouseX(event));
      var y = getGraphYByMouseY(graph, Event.mouseY(event));

      if (x > 0 && x < this.clientRect.width && y > 0 && y < this.clientRect.height)
      {
        for (var eventName in GRAPH_SELECTION_GLOBAL_HANDLER)
          Event.addGlobalHandler(eventName, GRAPH_SELECTION_GLOBAL_HANDLER[eventName], this);

        addSelectionMode = Event.mouseButton(event, Event.MOUSE_LEFT);

        var curItemPosition = getGraphItemPositionByMouseX(graph, Event.mouseX(event));
        //if (/*!shiftPressed || */!startItemPosition)
          startItemPosition = curItemPosition;

        //lastItemPosition = curItemPosition;
        var selectedItems = rebuildGraphSelection(graph, curItemPosition, startItemPosition);

        if (!ctrlPressed && addSelectionMode)
          graph.selection.clear();

        this.draw(selectedItems);
      }

      this.owner.element.setAttribute('tabindex', 1);
      this.owner.element.focus();
      
      Event.kill(event);
    },
    contextmenu: function(event){
      Event.kill(event);
    },
    keydown: function(event){
      if (Event.key(event) == Event.KEY.CTRL)
        ctrlPressed = true;

      /*if (Event.key(event) == Event.KEY.SHIFT)
        shiftPressed = true;*/
    },
    keyup: function(event){
      if (Event.key(event) == Event.KEY.CTRL)
        ctrlPressed = false;

      /*if (Event.key(event) == Event.KEY.SHIFT)
        shiftPressed = false;*/
    },
    blur: function(){
      //lastItemPosition = -1;
      startItemPosition = -1;
      addSelectionMode = true;
      ctrlPressed = false;
      //shiftPressed = false;
    }
  };

  var GRAPH_SELECTION_GLOBAL_HANDLER = {
    mousemove: function(event){
      var graph = this.owner; 
      
      var curItemPosition = getGraphItemPositionByMouseX(graph, Event.mouseX(event));
  
      /*if (curItemPosition != lastItemPosition)
      {*/
        //lastItemPosition = curItemPosition;
        var selectedItems = rebuildGraphSelection(graph, curItemPosition, startItemPosition);
        this.draw(selectedItems);
      //}
    },
    mouseup: function(event){
      var graph = this.owner; 

      var curItemPosition = getGraphItemPositionByMouseX(graph, Event.mouseX(event));
      var selectedItems = rebuildGraphSelection(graph, curItemPosition, startItemPosition);
      
      graph.selection.set(selectedItems);

      for (var i in GRAPH_SELECTION_GLOBAL_HANDLER)
        Event.removeGlobalHandler(i, GRAPH_SELECTION_GLOBAL_HANDLER[i], this);
    }
  };

  var GRAPH_SELECTION_HANDLER = {
    datasetChanged: function(){
      this.draw();
    }
  };

 /**
  * @class
  */
  var GraphSelection = CanvasLayer.subclass({
    className: namespace + '.GraphSelection',

    style: {
      fillStyle: '#dfdaff', 
      strokeStyle: '#9a89ff',
      alpha: '.7'
    },

    template: resource('templates/graph/GraphSelection.tmpl'),

    listen: {
      owner: {
        draw: function(){
          this.recalc();
          this.draw();
        }
      }
    },

    event_ownerChanged: function(oldOwner){
      CanvasLayer.prototype.event_ownerChanged.call(this, oldOwner);
      
      if (oldOwner && oldOwner.selection)
      {
        oldOwner.selection.removeHandler(GRAPH_SELECTION_HANDLER, this);
        Event.removeHandlers(oldOwner.element, GRAPH_ELEMENT_HANDLER, this);
      }

      if (this.owner && this.owner.selection)
      {
        this.recalc();
        this.owner.selection.addHandler(GRAPH_SELECTION_HANDLER, this);

        Event.addHandlers(this.owner.element, GRAPH_ELEMENT_HANDLER, this);
      }
    },

    recalc: function(){
      this.tmpl.canvas.width = this.owner.tmpl.canvas.width;
      this.tmpl.canvas.height = this.owner.tmpl.canvas.height;

      this.clientRect = this.owner.clientRect;
    },

    draw: function(selectedItems){
      this.reset();

      this.context.save();
      this.context.translate(this.clientRect.left, this.clientRect.top);

      var selectionBarWidth = this.clientRect.width / (this.owner.childNodes.length - 1);

      if (!selectedItems)
        selectedItems = this.owner.selection.getItems();

      var selectedItemsMap = {};

      for (var i = 0; i < selectedItems.length; i++)
        selectedItemsMap[selectedItems[i].basisObjectId] = true;

      var left, right;
      var lastPos = -1;

      Object.extend(this.context, this.style);

      for (var i = 0; i < this.owner.childNodes.length + 1; i++)
      {
        var child = this.owner.childNodes[i];
        if (child && selectedItemsMap[child.basisObjectId])
        {
          if (lastPos == -1)
            lastPos = i;
        }
        else
        {
          if (lastPos != -1)
          {
            left = Math.round(lastPos * selectionBarWidth - (lastPos == i - 1 ? 1 : 0));
            right = Math.round((i - 1) * selectionBarWidth + (lastPos == i - 1 ? 1 : 0));
            this.context.fillRect(left + .5, .5, right - left, this.clientRect.height);
            this.context.strokeRect(left + .5, .5, right - left, this.clientRect.height);
            lastPos = -1;
          }
        }
      }

      this.context.restore();
    }
  });

 /**
  * @class
  */
  var GraphViewer = CanvasLayer.subclass({
    className: namespace + '.GraphViewer',

    template: resource('templates/graph/GraphViewer.tmpl'),

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

    event_ownerChanged: function(oldOwner){
      CanvasLayer.prototype.event_ownerChanged.call(this, oldOwner);

      if (this.owner)
        this.recalc();
    },

    recalc: function(){
      this.element.width = this.owner.tmpl.canvas.width;
      this.element.height = this.owner.tmpl.canvas.height;

      this.clientRect = this.owner.clientRect;
      this.max = this.owner.maxValue;
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

      context.save();
      context.translate(this.clientRect.left, this.clientRect.top);

      var TOP = this.clientRect.top;
      var WIDTH = this.clientRect.width;
      var HEIGHT = this.clientRect.height;
      var MAX = this.max;

      var series = this.owner.series.childNodes;
      var keyCount = this.owner.childNodes.length;
      var step = WIDTH / (keyCount - 1);
      var keyPosition = Math.round(x / step);
      var xPosition = Math.round(keyPosition * step);

      context.beginPath();
      context.moveTo(xPosition + .5, 0);
      context.lineTo(xPosition + .5, HEIGHT);
      context.strokeStyle = '#CCC';
      context.stroke();
      context.closePath();

      context.font = "10px tahoma";
      context.textAlign = "center";
      var keyText = this.owner.keyTitleGetter(this.owner.childNodes[keyPosition]);
      var keyTextWidth = context.measureText(keyText).width;
      var keyTextHeight = 10;

      context.beginPath();
      context.moveTo(xPosition + .5, HEIGHT + 1 + .5);
      context.lineTo(xPosition - 3 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition - Math.round(keyTextWidth / 2) - 5 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition - Math.round(keyTextWidth / 2) - 5 + .5, HEIGHT + 4 + keyTextHeight + 5 + .5);
      context.lineTo(xPosition + Math.round(keyTextWidth / 2) + 5 + .5, HEIGHT + 4 + keyTextHeight + 5 + .5);
      context.lineTo(xPosition + Math.round(keyTextWidth / 2) + 5 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition + 3 + .5, HEIGHT + 4 + .5);
      context.lineTo(xPosition + .5, HEIGHT + 1);
      context.fillStyle = '#c29e22';
      context.strokeStyle = '#070';
      context.fill();
      context.stroke();
      context.closePath();

      context.fillStyle = 'black';
      context.fillText(keyText, xPosition +.5, TOP + HEIGHT + 5);

      var labels = [];

      var labelPadding = 7;
      var labelHeight = 10 + 2*labelPadding;
      var labelWidth = 0;

      //var key = this.owner.keyGetter(this.owner.childNodes[keyPosition]);
      for (var i = 0, seria; seria = series[i]; i++)
      {
        var value = this.owner.childNodes[keyPosition].values[seria.basisObjectId];

        if (isNaN(value))
          continue;

        var valueText = Number(value.toFixed(2)).group();
        var valueTextWidth = context.measureText(valueText).width;

        if (labelWidth < valueTextWidth)
          labelWidth = valueTextWidth; 

        var valueY = Math.round((1 - value / MAX) * HEIGHT);
        var labelY = Math.max(labelHeight / 2, Math.min(valueY, HEIGHT - labelHeight / 2));

        labels[i] = {
          color: seria.getColor(),
          text: valueText,
          valueY: valueY,
          labelY: labelY
        };
      }

      // adjust label positions 
      labels = labels.sortAsObject(getter('valueY'));

      var hasCrossing = true;
      var crossGroup = labels.map(function(label){
        return { labels: [label], y: label.labelY, height: labelHeight };
      });
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
      var align = keyPosition >= (keyCount / 2) ? -1 : 1;

      for (var i = 0, label; label = labels[i]; i++)
      {
        var pointWidth = 3;
        context.strokeStyle = label.color;
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
        context.fillStyle = label.color;
        context.strokeStyle = '#444';
        context.lineWidth = 1;
        context.stroke();
        context.fill();
        context.closePath();

        context.fillStyle = 'black';
        context.textAlign = 'right';
        context.fillText(label.text, xPosition + (pointWidth + tongueSize + labelPadding)*align + (align == 1 ? labelWidth : 0) + .5, label.labelY + 4);
      }

      context.restore();
    }
  });

 /**
  * @class
  */
  var LinearGraph = AxisGraph.subclass({
    className: namespace + '.LinearGraph',

    fillArea: true,
    style: {
      strokeStyle: '#090',
      lineWidth: 2.5,
      lineJoin: 'bevel'
    },

    satelliteConfig: {
      graphViewer: {
        instanceOf: GraphViewer
      },
      graphSelection: {
        instanceOf: GraphSelection,
        existsIf: getter('selection')
      }
    },

    init: function(){
      if (this.selection && !(this.selection instanceof Selection))
        this.selection = Object.complete({ multiple: true }, this.selection);

      AxisGraph.prototype.init.call(this);
    },

    drawSeria: function(values, color, pos, min, max, step, left, top, width, height){
      var context = this.context;

      if (!this.keyValuesOnEdges)
        left += step / 2;

      //var color = seria.getColor();
      this.style.strokeStyle = color;
      //var values = seria.getValues(keys);

      context.save();
      context.translate(left, top);
      context.beginPath();

      var x, y;
      for (var i = 0; i < values.length; i++)
      {
        x = i * step;
        y = height * (1 - (values[i] - min) / (max - min));
        
        if (i == 0)
          context.moveTo(x, y);
        else
          context.lineTo(x, y);
      }

      Object.extend(context, this.style);
      context.stroke();

      if (this.fillArea && this.childNodes.length == 1)
      {
        context.lineWidth = 0;
        var zeroPosition = min < 0 ? Math.max(0, max) / (max - min) * height : height;
        context.lineTo(width, zeroPosition);
        context.lineTo(0, zeroPosition);
        context.globalAlpha = .15;
        context.fillStyle = color;
        context.fill();
      }

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
    className: namespace + '.BarGraphViewer',
    draw: function(x, y){
      var context = this.context;

      context.save();
      context.translate(this.clientRect.left, this.clientRect.top);

      var clientRect = this.owner.clientRect;
      var bars = this.owner.bars;
      var series = this.owner.series.childNodes;
      //var keys = this.owner.getKeys();
            
      var invertAxis = this.owner.invertAxis; 
      var WIDTH = clientRect.width;
      var HEIGHT = clientRect.height;

      var step = (invertAxis ? HEIGHT : WIDTH) / bars[0].length;
      var position = invertAxis ? y : x;
      var barPosition = Math.floor(position / step);

      var keyTitle = this.owner.keyTitleGetter(this.owner.childNodes[barPosition]);
      
      var legendText;
      var hoveredBar;
      var bar;
      for (var i = 0; i < bars.length; i++)
      {
        bar = bars[i][barPosition];
        if (x >= bar.x && x <= (bar.x + bar.width) && y >= bar.y && y <= (bar.y + bar.height))
        {
          hoveredBar = bar;
          legendText = series[i].getLegend();
          break;
        }
      }

      if (!hoveredBar)
      {
        context.restore();
        return;
      }

      var TOOLTIP_PADDING = 5;

      var tooltipText = keyTitle + ', ' + legendText + ', ' + Number(hoveredBar.value.toFixed(2)).group();
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

      context.restore();
    }
  });
  

  /**
   * @class
   */
  var BarGraph = AxisGraph.subclass({
    className: namespace + '.BarGraph',
    
    bars: null,
    keyValuesOnEdges: false,

    satelliteConfig: {
      graphViewer: BarGraphViewer
    },

    drawFrame: function(){
      this.bars = [];
      AxisGraph.prototype.drawFrame.call(this);
    },

    drawSeria: function(values, color, pos, min, max, step, left, top, width, height){
      var context = this.context;

      //var values = seria.getValues(keys);
      //var color = seria.getColor();

      context.save();
      context.translate(left, top);
      context.fillStyle = color;

      Object.extend(context, this.style);
      context.strokeStyle = '#333';
      context.lineWidth = 1;

      var zeroLinePosition = min >= 0 ? 0 : (max <= 0 ? height : Math.abs(min / (max - min) * height));

      var bar;
      this.bars[pos] = [];
      for (var i = 0; i < values.length; i++)
      {
        bar = this.getBarRect(values[i], pos, i, min, max, step, width, height, zeroLinePosition);

        bar.value = values[i];
        this.bars[pos].push(bar);

        bar.x = Math.round(bar.x);
        bar.y = Math.round(bar.y);
        bar.width = Math.round(bar.width);
        bar.height = Math.round(bar.height);

        this.drawBar(bar);
      }

      context.restore();
    },
    getBarRect: function(value, seriaPos, barPos, min, max, step, width, height, zeroLinePosition){                                                                        
      var cnt = this.series.childNodes.length;
      var barSize = Math.round(0.7 * step / cnt);

      var bar = {};
      if (this.invertAxis)
      {
        bar.height = barSize;          
        bar.y = step / 2 + barPos * step - bar.height * cnt / 2 + seriaPos * bar.height;

        var x = (value - min) / (max - min) * width;
        bar.width = (x - zeroLinePosition) * (value > 0 ? 1 : -1);
        bar.x = zeroLinePosition - (value < 0 ? bar.width : 0);
      }
      else
      {
        bar.width = barSize;          
        bar.x = step / 2 + barPos * step - bar.width * cnt / 2 + seriaPos * bar.width;
        var y = (value - min) / (max - min) * height;
        bar.height = (y - zeroLinePosition) * (value > 0 ? 1 : -1);
        bar.y = height - zeroLinePosition - (value > 0 ? bar.height : 0);
      }

      return bar;
    },
    drawBar: function(bar){
      this.context.fillRect(bar.x + .5, bar.y + .5, bar.width, bar.height);
      if(bar.width > 10 && bar.height > 10)
        this.context.strokeRect(bar.x + .5, bar.y + .5, bar.width, bar.height);
    }
  });

  /**
   * @class
   */
  var StackedBarGraph = BarGraph.subclass({
    className: namespace + '.StackedBarGraph',
    getMaxValue: function(){
      var max = -Infinity;
      var sum;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        sum = 0;
        for (var j in child.values)
          sum += child.values[j];

        if (sum > max || max == null)
          max = sum;
      }
      return max;

      /*var keys = this.getKeys();
      var series = this.seriesList.childNodes;
      var values = series[0].getValues(keys);
      for (var i = 1, seria; seria = series[i]; i++)
      {
        seria.getValues(keys).forEach(function(value, pos) { values[pos] += value });
      }

      return Math.max.apply(null, values);*/
    },
    getBarRect: function(value, seriaPos, barPos, min, max, step, width, height){
      var bar = {};
      var previousBar = seriaPos > 0 && this.bars[seriaPos - 1][barPos];
      var barSize = 0.7 * step;
            
      if (this.invertAxis)
      {
        bar.height = barSize;          
        bar.y = step / 2 + barPos * step - barSize / 2;

        bar.width = value / max * width;
        bar.x = (previousBar && (previousBar.x + previousBar.width)) || 0;
      }
      else
      {
        bar.width = barSize;          
        bar.x = step / 2 + barPos * step - bar.width / 2;

        bar.height = value / max * height;
        bar.y = height - bar.height - (previousBar && (height - previousBar.y));
      }

      return bar;
    }
  });


  //
  // export names
  //

  module.exports = {
    ColorPicker: ColorPicker,
    GraphNode: GraphNode,
    Graph: Graph,
    GraphSeries: GraphSeries,
    GraphSeriesList: GraphSeriesList,
    SeriesGraphNode: SeriesGraphNode,
    SeriesGraph: SeriesGraph,
    AxisGraph: AxisGraph,
    GraphSelection: GraphSelection,
    GraphViewer: GraphViewer,
    LinearGraph: LinearGraph,
    BarGraphViewer: BarGraphViewer,
    BarGraph: BarGraph,
    StackedBarGraph: StackedBarGraph
  };
