
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.layout');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');
  basis.require('basis.ui.canvas');


 /**
  * @see ./demo/chart/range.html
  * @see ./demo/chart/dynamic-threads.html
  * @namespace basis.ui.chart
  */

  var namespace = this.path;


  //
  // import names
  //

  var Event = basis.dom.event;
  var DOM = basis.dom;

  var getter = basis.getter;
  var arrayFrom = basis.array.from;
  var $undef = basis.fn.$undef;
  var $const = basis.fn.$const;
  var $self = basis.fn.$self;
  var extend = basis.object.extend;
  var complete = basis.object.complete;
  var objSlice = basis.object.slice;
  var oneFunctionProperty = basis.Class.oneFunctionProperty;
  var createEvent = basis.event.create;

  var DataObject = basis.data.Object;
  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var Node = basis.dom.wrapper.Node;
  var Selection = basis.dom.wrapper.Selection;
  var Canvas = basis.ui.canvas.Canvas;
  var AbstractCanvas = basis.ui.canvas.AbstractCanvas;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Chart: resource('templates/chart/Chart.tmpl'),
    ChartSelection: resource('templates/chart/ChartSelection.tmpl'),
    ChartViewer: resource('templates/chart/ChartViewer.tmpl')
  });


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
      var m = String(number).match(/0\.(0+)?[^0]/);
      return (m ? -m[1].length : 0) - 1;
    }
  }

  function hex2(num){
    var res = num.toString(16);
    return res.length == 1 ? '0' + res : res;
  }


  //generate random color func

  function hsv2rgb(h, s, v){
    var h1 = h * 6;
    var c = v * s;
    var x = c * (1 - Math.abs(h1 % 2 - 1));
    var m = v - c;
    var rgb;

    switch (Math.floor(h1))
    {
      case 0: rgb = [c, x, 0]; break;
      case 1: rgb = [x, c, 0]; break;
      case 2: rgb = [0, c, x]; break;
      case 3: rgb = [0, x, c]; break;
      case 4: rgb = [x, 0, c]; break;
      case 5: rgb = [c, 0, x]; break;
    }

    return [
      Math.floor((rgb[0] + m) * 256),
      Math.floor((rgb[1] + m) * 256),
      Math.floor((rgb[2] + m) * 256)
    ];
  }

  function generateColor(){
    var GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
    var h = (Math.random() + GOLDEN_RATIO_CONJUGATE) % 1;

    return '#' + hsv2rgb(h, 0.6, 0.95).map(hex2).join('');
  }

  function colorLuminance(hex, lum){
    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');

    if (hex.length == 3)
      hex = hex.replace(/./g, '$&$&');

    if (!lum)
      lum = 0;

    // convert to decimal and change luminosity
    return '#' + hex.replace(/../g, function(m){
      var val = parseInt(m, 16) * (1 + lum);
      return hex2(Math.round(basis.number.fit(val, 0, 255)))
    });
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
      '#69D'
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
    },
    getColor: function(){
      for (var i = 0, color; i < this.presetColors.length; i++)
      {
        if (!this.usedColors[this.presetColors[i]])
        {
          color = this.presetColors[i];
          break;
        }
      }

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
  var ChartNode = Node.subclass({
    className: namespace + '.ChartNode',
    emit_requestRedraw: createEvent('requestRedraw'),
    emit_disable: createEvent('disable'),
    emit_enable: createEvent('enable')
  });

 /**
  * @class
  */
  var Chart = Canvas.subclass({
    className: namespace + '.Chart',

    childClass: ChartNode,

    template: templates.Chart,
    binding: {
      chartSelection: 'satellite:',
      chartViewer: 'satellite:'
    },

    style: {},

    emit_sortingChanged: function(oldSorting, oldSortingDesc){
      Canvas.prototype.emit_sortingChanged.call(this, oldSorting, oldSortingDesc);
      this.redrawRequest();
    },
    emit_groupingChanged: function(oldGrouping){
      Canvas.prototype.emit_groupingChanged.call(this, oldGrouping);
      this.redrawRequest();
    },
    emit_childNodesModified: function(delta){
      Canvas.prototype.emit_childNodesModified.call(this, delta);
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
      extend(this.style, objSlice(newStyle, ['strokeStyle', 'lineWidth']));
      this.redrawRequest();
    },

    redrawRequest: function(){
      this.updateCount++;
    },

    drawFrame: $undef
  });

  //
  // Series Chart
  //
  var SERIA_SOURCE_HANDLER = {
    itemsChanged: function(object, delta){
      var key;
      var value;
      var valuesDelta = {};

      if (delta.deleted)
      {
        for (var i = 0, child; child = delta.deleted[i]; i++)
        {
          key = this.keyGetter(child);
          valuesDelta[key] = null;
          this.valuesMap[key] = undefined;

          child.removeHandler(SERIA_ITEM_HANDLER, this);
        }
      }

      if (delta.inserted)
        for (var i = 0, child; child = delta.inserted[i]; i++)
        {
          key = this.keyGetter(child);
          value = this.valueGetter(child);

          valuesDelta[key] = value;
          this.valuesMap[key] = value;

          child.addHandler(SERIA_ITEM_HANDLER, this);
        }

      this.emit_valuesChanged(valuesDelta);
    }
  };

  var SERIA_ITEM_HANDLER = {
    update: function(object){
      var key = this.keyGetter(object);
      var value = this.valueGetter(object);

      var valuesDelta = {};
      this.valuesMap[key] = value;
      valuesDelta[key] = value;

      this.emit_valuesChanged(valuesDelta);
    }
  };

 /**
  * @class
  */
  var ChartSeria = AbstractNode.subclass({
    className: namespace + '.ChartSeria',

    valuesMap: null,

    sourceGetter: getter('source'),
    keyGetter: getter(),

    valueGetter: getter($const(0)),
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
    emit_valuesChanged: createEvent('valuesChanged', 'delta'),
    emit_sourceChanged: createEvent('sourceChanged', 'oldSource'),
    emit_disable: createEvent('disable'),
    emit_enable: createEvent('enable'),

    init: function(){
      this.valuesMap = {};

      AbstractNode.prototype.init.call(this);

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
          oldSource.removeHandler(SERIA_SOURCE_HANDLER, this);
          SERIA_SOURCE_HANDLER.itemsChanged.call(this, oldSource, { deleted: oldSource.getItems() });
        }

        this.source = source;
        if (this.source)
        {
          this.source.addHandler(SERIA_SOURCE_HANDLER, this);
          SERIA_SOURCE_HANDLER.itemsChanged.call(this, oldSource, { inserted: this.source.getItems() });
        }

        this.emit_sourceChanged(oldSource);
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
  var ChartSeriesList = Node.subclass({
    className: namespace + '.ChartSeriesList',

    emit_valuesChanged: createEvent('valuesChanged', 'delta'),

    childClass: ChartSeria,
    childFactory: function(config){
      return new this.childClass(config);
    },

    listen: {
      childNode: { // seria
        valuesChanged: function(seria, delta){
          this.emit_valuesChanged(seria, delta);
        }
      }
    },

    init: function(){
      this.colorPicker = new ColorPicker(extend({ owner: this }, this.colorPicker));
      Node.prototype.init.call(this);
    },

    destroy: function(){
      this.colorPicker.destroy();
      this.colorPicker = null;

      Node.prototype.destroy.call(this);
    }
  });

  var CHART_SERIES_HANDLER = {
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
    valuesChanged: function(object, seria, delta){
      var needRedraw = false;

      var key;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        key = this.keyGetter(child);
        if (key in delta)
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

  var CHART_NODE_UPDATE_HANDLER = function(object){
    for (var i = 0, seria; seria = this.series.childNodes[i]; i++)
      object.values[seria.basisObjectId] = seria.getValue(object, this.keyGetter(object));

    this.redrawRequest();
  };

 /**
  * @class
  */
  var SeriesChartNode = ChartNode.subclass({
    className: namespace + '.SeriesChartNode',

    values: {},

    valueChangeEvents: oneFunctionProperty(
      CHART_NODE_UPDATE_HANDLER,
      {
        update: true
      }
    ),

    init: function(){
      this.values = {};
      ChartNode.prototype.init.call(this);
    }
  });

 /**
  * @class
  */
  var SeriesChart = Chart.subclass({
    className: namespace + '.SeriesChart',

    childClass: SeriesChartNode,

    keyGetter: $self,
    keyTitleGetter: function(object){
      return this.keyGetter(object);
    },

    emit_childNodesModified: function(delta){
      Chart.prototype.emit_childNodesModified.call(this, delta);

      if (delta.inserted)
        for (var i = 0, child; child = delta.inserted[i]; i++)
        {
          if (this.series && this.series.childNodes)
            for (var j = 0, seria; seria = this.series.childNodes[j]; j++)
              if (seria.getValue)
                child.values[seria.basisObjectId] = seria.getValue(child, this.keyGetter(child));

          child.addHandler(child.valueChangeEvents, this);
        }

      if (delta.deleted)
        for (var i = 0, child; child = delta.deleted[i]; i++)
        {
          if (this.series && this.series.childNodes)
            for (var j = 0, seria; seria = this.series.childNodes[j]; j++)
              child.values[seria.basisObjectId] = undefined;

          child.removeHandler(child.valueChangeEvents, this);
        }

      this.redrawRequest();
    },

    //init
    init: function(){
      Chart.prototype.init.call(this);

      if (Array.isArray(this.series))
      {
        var series = [];
        for (var i = 0, seria; seria = this.series[i]; i++)
          series[i] = (typeof seria == 'function') ? { valueGetter: seria } : seria;

        this.series = {
          childNodes: series
        };
      }

      this.series = new ChartSeriesList(extend({ owner: this }, this.series));
      this.series.addHandler(CHART_SERIES_HANDLER, this);
      CHART_SERIES_HANDLER.childNodesModified.call(this, this.series, { inserted: this.series.childNodes });
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

      Chart.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var AxisChart = SeriesChart.subclass({
    className: namespace + '.AxisChart',

    showLegend: true,
    showYLabels: true,
    showXLabels: true,
    showBoundLines: true,
    showGrid: true,
    keyValuesOnEdges: true,
    invertAxis: false,
    autoRotateScale: false,
    scaleAngle: 0,
    showScale: true,
    gridColor: '#edeef2',
    scaleXLabelColor: 'black',
    scaleYLabelColor: 'black',

    min: 0,
    max: 'auto',

    //init
    init: function(){
      this.clientRect = {};

      SeriesChart.prototype.init.call(this);
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
      var gridPart = this.getGridPart(minValue, maxValue);

      //correct min/max
      /*if (Math.abs(minValue) > Math.abs(maxValue))
        maxValue = Math.ceil(maxValue / gridPart) * gridPart;
      else
        minValue = Math.floor(minValue / gridPart) * gridPart;*/

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
        for (var i = 0; i <= partCount; i++)
        {
          valueLabels[i] = basis.number.group(Math.round(minValue + gridPart * i));
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
      context.strokeStyle = this.gridColor;

      var textHeight = 10;
      var skipLabel;
      var skipScale;
      var skipXLabelCount;
      var skipYLabelCount;

      // xscale
      context.fillStyle = this.scaleXLabelColor;
      var xStep = (WIDTH - LEFT - RIGHT) / (this.invertAxis ? partCount : keysCount - (this.keyValuesOnEdges ? 1 : 0));
      if (this.showXLabels)
      {
        var angle;
        if (this.autoRotateScale)
        {
          skipXLabelCount = Math.ceil((textHeight + 3) / xStep) - 1;
          angle = (skipXLabelCount + 1) * xStep < maxXLabelWidth ? Math.asin((textHeight + 3) / ((skipXLabelCount + 1) * xStep)) : 0;
        }
        else
        {
          angle = (this.scaleAngle % 180) * Math.PI / 180;
          var optimalLabelSpace = angle ? Math.min(textHeight / Math.sin(angle), maxXLabelWidth) : maxXLabelWidth;
          skipXLabelCount = Math.ceil((optimalLabelSpace + 3) / xStep) - 1;
        }

        BOTTOM += Math.round(maxXLabelWidth * Math.sin(angle));

        skipScale = skipXLabelCount > 10 || xStep < 4;
        context.textAlign = angle ? 'right' : 'center';
        context.beginPath();

        var leftOffset = !this.keyValuesOnEdges && !this.invertAxis ? xStep / 2 : 0;
        for (var i = 0; i < xLabels.length; i++)
        {
          var x = Math.round(leftOffset + LEFT + i * xStep) + .5;//xLabelsX[i];
          skipLabel = skipXLabelCount && (i % (skipXLabelCount + 1) != 0);

          context.save();
          if (!skipLabel)
          {
            context.translate(x, HEIGHT - BOTTOM + 15);
            context.rotate(-angle);
            context.fillText(xLabels[i], 0, 0);
          }
          context.restore();

          if (this.showScale && (!skipLabel || !skipScale))
          {
            context.moveTo(x, HEIGHT - BOTTOM + .5);
            context.lineTo(x, HEIGHT - BOTTOM + (skipLabel ? 3 : 5));
          }
        }

        context.stroke();
        context.closePath();
      }

      // yscale
      context.fillStyle = this.scaleYLabelColor;
      var yStep = (HEIGHT - TOP - BOTTOM) / (this.invertAxis ? keysCount - (this.keyValuesOnEdges ? 1 : 0) : partCount);
      if (this.showYLabels)
      {
        context.textAlign = 'right';

        var topOffset = !this.keyValuesOnEdges && this.invertAxis ? yStep / 2 : 0;

        skipYLabelCount = Math.ceil(15 / yStep) - 1;
        //skipYLabelCount = 0;
        skipScale = skipYLabelCount > 10 || yStep < 4;

        context.beginPath();

        for (var i = 0, label; label = yLabels[i]; i++)
        {
          var labelY = Math.round(this.invertAxis ? (TOP + topOffset + i * yStep) : (HEIGHT - BOTTOM - topOffset - i * yStep)) + .5;

          skipLabel = skipYLabelCount && (i % (skipYLabelCount + 1) != 0);

          if (!skipLabel)
            context.fillText(label, LEFT - 6, labelY + 2.5);

          if (this.showScale && (!skipLabel || !skipScale))
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

        var labelX;
        var labelY;
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

        context.strokeStyle = this.gridColor;
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
        context.strokeStyle = this.gridColor;
        context.stroke();
        context.closePath();
      }

      // Series
      var step = this.invertAxis ? yStep : xStep;
      for (var i = 0, seria; seria = series[i]; i++)
        this.drawSeria(this.getValuesForSeria(seria), seria.getColor(), i, minValue, maxValue, step, LEFT, TOP, WIDTH - LEFT - RIGHT, HEIGHT - TOP - BOTTOM, skipXLabelCount);

      //save chart data
      extend(this.clientRect, {
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
        {
          var value = child.values[j];
          if (!isNaN(value) && value < min)
            min = value;
        }
      }
      return min;
    },
    getMaxValue: function(){
      var max = -Infinity;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        for (var j in child.values)
        {
          var value = child.values[j];
          if (!isNaN(value) && value > max)
            max = value;
        }

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
    getGridPart: function(minGridValue, maxGridValue){
      var MIN_PART_COUNT = 2;
      var MAX_PART_COUNT = 20;

      var maxDegree = getDegree(maxGridValue);
      var range = maxGridValue - minGridValue;
      var result;

      if (maxDegree == 0)
        result = maxGridValue;

      if (!minGridValue && maxGridValue % Math.pow(10, maxDegree) == 0)
      {
        var res = maxGridValue / Math.pow(10, maxDegree);
        if (res >= MIN_PART_COUNT && res <= MAX_PART_COUNT)
          result = res;
      }

      if (!result)
      {
        var count = 1;
        var divisionCount = 0;
        var curVal = range;
        var newVal;
        var step;

        while (count < MIN_PART_COUNT && divisionCount <= maxDegree)
        {
          for (var i = 2; i <= 5; i++)
          {
            step = curVal / i;
            newVal = (curVal - step) / Math.pow(10, maxDegree - divisionCount);
            if ((newVal % 1) == 0 && (count * i < MAX_PART_COUNT))
            {
              curVal = step;
              count *= i;
              break;
            }
          }

          divisionCount++;
        }

        if (count == 1)
          result = basis.number.fit(getDegree(range), 4, MAX_PART_COUNT)
        else
          result = count;
      }


      return range / Math.max(MIN_PART_COUNT, result);
    },

    // abstract methods
    drawSeria: $undef
  });


  //
  // ChartSelection
  //
  var startItemPosition = -1;
  var addSelectionMode = true;

  function getChartXByMouseX(chart, globalX){
    var chartRect = chart.element.getBoundingClientRect();
    return globalX - chartRect.left - chart.clientRect.left;
  }

  function getChartYByMouseY(chart, globalY){
    var chartRect = chart.element.getBoundingClientRect();
    return globalY - chartRect.top - chart.clientRect.top;
  }

  function getChartItemPositionByMouseX(chart, mouseX){
    var width = chart.clientRect.width;
    var itemCount = chart.childNodes.length;
    var x = getChartXByMouseX(chart, mouseX);
    return Math.max(0, Math.min(itemCount - 1, Math.round(x / (width / (itemCount - 1)))));
  }

  function rebuildChartSelection(chart, curItemPosition, startItemPosition){
    var applyItems = chart.childNodes.slice(Math.min(startItemPosition, curItemPosition), Math.max(startItemPosition, curItemPosition) + 1);

    var selectedItems = arrayFrom(chart.selection.getItems());
    if (addSelectionMode)
    {
      selectedItems = selectedItems.concat(applyItems);
    }
    else
    {
      for (var i = 0, item, pos; item = applyItems[i]; i++)
        basis.array.remove(selectedItems, item);
    }

    return selectedItems;
  }

  var CHART_ELEMENT_HANDLER = {
    mousedown: function(event){
      if (!event.mouseLeft)
        return;

      var chart = this.owner;
      var x = getChartXByMouseX(chart, Event.mouseX(event));
      var y = getChartYByMouseY(chart, Event.mouseY(event));

      if (x > 0 && x < this.clientRect.width && y > 0 && y < this.clientRect.height)
      {
        for (var eventName in CHART_SELECTION_GLOBAL_HANDLER)
          Event.addGlobalHandler(eventName, CHART_SELECTION_GLOBAL_HANDLER[eventName], this);

        addSelectionMode = true; //event.mouseLeft;

        var curItemPosition = getChartItemPositionByMouseX(chart, Event.mouseX(event));
        startItemPosition = curItemPosition;

        var selectedItems = rebuildChartSelection(chart, curItemPosition, startItemPosition);

        if (!event.ctrlKey && !event.metaKey && addSelectionMode)
          chart.selection.clear();

        this.draw(selectedItems);
      }

      chart.element.setAttribute('tabindex', 1);
      chart.element.focus();

      event.die();
    },
    contextmenu: function(event){
      //event.die();
    },
    blur: function(){
      //lastItemPosition = -1;
      startItemPosition = -1;
      addSelectionMode = true;
    }
  };

  var CHART_SELECTION_GLOBAL_HANDLER = {
    mousemove: function(event){
      var chart = this.owner;

      var curItemPosition = getChartItemPositionByMouseX(chart, Event.mouseX(event));

      var selectedItems = rebuildChartSelection(chart, curItemPosition, startItemPosition);
      this.draw(selectedItems);
    },
    mouseup: function(event){
      var chart = this.owner;

      var curItemPosition = getChartItemPositionByMouseX(chart, Event.mouseX(event));
      var selectedItems = rebuildChartSelection(chart, curItemPosition, startItemPosition);

      chart.selection.lastSelectedRange = {
        start: Math.min(curItemPosition, startItemPosition),
        end: Math.max(curItemPosition, startItemPosition)
      };
      chart.selection.set(selectedItems);

      for (var key in CHART_SELECTION_GLOBAL_HANDLER)
        Event.removeGlobalHandler(key, CHART_SELECTION_GLOBAL_HANDLER[key], this);
    }
  };

  var CHART_SELECTION_HANDLER = {
    itemsChanged: function(){
      this.draw();
    }
  };

 /**
  * @class
  */
  var ChartSelection = AbstractCanvas.subclass({
    className: namespace + '.ChartSelection',

    style: {
      fillStyle: '#dfdaff',
      strokeStyle: '#9a89ff',
      alpha: '.6'
    },

    template: templates.ChartSelection,

    listen: {
      owner: {
        draw: function(){
          this.recalc();
          this.draw();
        },
        templateChanged: function(){
          Event.addHandlers(this.owner.element, CHART_ELEMENT_HANDLER, this);
        }
      }
    },

    templateSync: function(){
      AbstractCanvas.prototype.templateSync.call(this);

      this.recalc();
      Event.addHandlers(this.element, CHART_ELEMENT_HANDLER, this);
    },

    emit_ownerChanged: function(oldOwner){
      AbstractCanvas.prototype.emit_ownerChanged.call(this, oldOwner);

      if (oldOwner && oldOwner.selection)
        oldOwner.selection.removeHandler(CHART_SELECTION_HANDLER, this);

      if (this.owner && this.owner.selection)
      {
        this.recalc();
        this.owner.selection.addHandler(CHART_SELECTION_HANDLER, this);
      }
    },

    recalc: function(){
      if (!this.context || !this.owner || !this.owner.context)
        return;

      if (this.tmpl.canvas && this.owner.tmpl.canvas)
      {
        this.tmpl.canvas.width = this.owner.tmpl.canvas.width;
        this.tmpl.canvas.height = this.owner.tmpl.canvas.height;
      }

      this.clientRect = this.owner.clientRect;
    },

    draw: function(selectedItems){
      if (!this.context)
        return;

      this.reset();

      var context = this.context;

      context.save();
      context.translate(this.clientRect.left, this.clientRect.top);
      context.globalAlpha = this.style.alpha;

      var selectionBarWidth = this.clientRect.width / (this.owner.childNodes.length - 1);

      if (!selectedItems)
        selectedItems = this.owner.selection.getItems();

      var selectedItemsMap = {};

      for (var i = 0; i < selectedItems.length; i++)
        selectedItemsMap[selectedItems[i].basisObjectId] = true;

      var left;
      var right;
      var lastPos = -1;

      extend(this.context, this.style);

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
            left = Math.round(lastPos * selectionBarWidth - (lastPos == i - 1));
            right = Math.round((i - 1) * selectionBarWidth + (lastPos == i - 1));
            context.fillRect(left + .5, .5, right - left, this.clientRect.height);
            context.strokeRect(left + .5, .5, right - left, this.clientRect.height);
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
  var ChartViewer = AbstractCanvas.subclass({
    className: namespace + '.ChartViewer',

    template: templates.ChartViewer,

    action: {
      move: function(event){
        this.mx = event.mouseX;
        this.my = event.mouseY;

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

    emit_ownerChanged: function(oldOwner){
      AbstractCanvas.prototype.emit_ownerChanged.call(this, oldOwner);

      if (this.owner)
        this.recalc();
    },

    recalc: function(){
      if (!this.context)
        return;

      if (this.tmpl.canvas && this.owner.tmpl.canvas)
      {
        this.tmpl.canvas.width = this.owner.tmpl.canvas.width;
        this.tmpl.canvas.height = this.owner.tmpl.canvas.height;
      }

      this.clientRect = this.owner.clientRect;
      //this.max = this.owner.maxValue;
    },

    updatePosition: function(mx, my){
      this.reset();
      this.recalc();

      var canvasRect = basis.layout.getBoundingRect(this.element, false, this.owner.element.offsetParent);
      var x = mx - canvasRect.left - this.clientRect.left;
      var y = my - canvasRect.top - this.clientRect.top;

      var needToDraw = x > 0 && x < this.clientRect.width && y > 0 && y < this.clientRect.height;

      if (needToDraw)
        this.draw(x, y);
    },

    draw: function(x, y){
      var context = this.context;

      if (!context)
        return;

      context.save();
      context.translate(this.clientRect.left, this.clientRect.top);

      var TOP = this.clientRect.top;
      var WIDTH = this.clientRect.width;
      var HEIGHT = this.clientRect.height;
      var MIN = this.owner ? this.owner.getMinGridValue() : this.min;
      var MAX = this.owner ? this.owner.getMaxGridValue() : this.max;

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

      context.font = '10px tahoma';
      context.textAlign = 'center';
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
      context.lineTo(xPosition + .5, HEIGHT + 1 + .5);
      context.fillStyle = '#c29e22';
      context.strokeStyle = colorLuminance('#c29e22', -.25);
      context.fill();
      context.stroke();
      context.closePath();

      context.fillStyle = 'black';
      context.fillText(keyText, xPosition + .5, TOP + HEIGHT + 5);

      var labels = [];

      var labelPadding = 7;
      var labelHeight = 10 + 2 * labelPadding;
      var labelWidth = 0;

      //var key = this.owner.keyGetter(this.owner.childNodes[keyPosition]);
      for (var i = 0, seria; seria = series[i]; i++)
      {
        var value = this.owner.childNodes[keyPosition].values[seria.basisObjectId];

        if (isNaN(value))
          continue;

        var valueText = basis.number.group(value.toFixed(2));
        var valueTextWidth = context.measureText(valueText).width;

        if (labelWidth < valueTextWidth)
          labelWidth = valueTextWidth;

        var valueY = Math.round(HEIGHT * (1 - (value - MIN) / (MAX - MIN)));
        var labelY = Math.max(labelHeight / 2, Math.min(valueY, HEIGHT - labelHeight / 2));

        labels.push({
          color: seria.getColor(),
          text: valueText,
          valueY: valueY,
          labelY: labelY
        });
      }

      // adjust label positions
      labels = basis.array.sortAsObject(labels, 'valueY');

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

      for (var i = 0, group; group = crossGroup[i]; i++)
        for (var j = 0, label; label = group.labels[j]; j++)
          label.labelY = group.y - (group.height / 2) + j * labelHeight + (labelHeight / 2);

      // draw labels
      var align = keyPosition >= (keyCount / 2) ? -1 : 1;

      for (var i = 0, label; label = labels[i]; i++)
      {
        var pointWidth = 3;
        context.strokeStyle = label.color;
        context.fillStyle = 'white';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(xPosition + .5, label.valueY + .5, pointWidth, 0, 2 * Math.PI);
        context.stroke();
        context.fill();
        context.closePath();

        var tongueSize = 10;
        context.beginPath();
        context.moveTo(xPosition + (pointWidth + 1) * align + .5, label.valueY + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize) * align + .5, label.labelY - 5 + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize) * align + .5, label.labelY - Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize) * align + (labelWidth + 2 * labelPadding) * align + .5, label.labelY - Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize) * align + (labelWidth + 2 * labelPadding) * align + .5, label.labelY + Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize) * align + .5, label.labelY + Math.round(labelHeight / 2) + .5);
        context.lineTo(xPosition + (pointWidth + 1 + tongueSize) * align + .5, label.labelY + 5 + .5);
        context.lineTo(xPosition + (pointWidth + 1) * align + .5, label.valueY + .5);
        context.fillStyle = label.color;
        context.strokeStyle = colorLuminance(label.color, -.25);
        context.lineWidth = 1;
        context.stroke();
        context.fill();
        context.closePath();

        context.fillStyle = 'black';
        context.textAlign = 'right';
        context.fillText(label.text, xPosition + (pointWidth + tongueSize + labelPadding) * align + (align == 1 ? labelWidth : 0) + .5, label.labelY + 4);
      }

      context.restore();
    }
  });

 /**
  * @class
  */
  var LinearChart = AxisChart.subclass({
    className: namespace + '.LinearChart',

    fillArea: false,
    drawPoints: false,
    style: {
      strokeStyle: '#090',
      lineWidth: 2.5,
      lineJoin: 'bevel'
    },

    satellite: {
      chartViewer: {
        instanceOf: ChartViewer
      },
      chartSelection: {
        instanceOf: ChartSelection,
        existsIf: getter('selection')
      }
    },

    init: function(){
      if (this.selection && !(this.selection instanceof Selection))
        this.selection = complete({ multiple: true }, this.selection);

      AxisChart.prototype.init.call(this);
    },

    drawSeria: function(values, color, pos, min, max, step, left, top, width, height, pointFrequency){
      var context = this.context;

      if (!this.keyValuesOnEdges)
        left += step / 2;

      context.save();

      context.translate(left, top);
      context.fillStyle = color;
      extend(context, this.style);
      context.strokeStyle = color;

      var points = [];
      var started = false;
      var ended = false;
      for (var i = 0; i <= values.length; i++) // <= for final stroke
      {
        if (!isNaN(values[i]))
        {
          var x = i * step;
          var y = height * (1 - (values[i] - min) / (max - min));
          var point = [x, y];
          if (!started)
          {
            started = point;
            context.beginPath();
            context.moveTo(x, y);
          }
          else
            context.lineTo(x, y);

          ended = point;
          points.push({
            x: x,
            y: y
          });
        }
        else
        {
          if (started)
          {
            if (started == ended)
            {
              started = [started[0] - context.lineWidth / 2 - .5, started[1]];
              ended = [started[0] + context.lineWidth / 2 + .5, started[1]];
              context.moveTo(started[0], started[1]);
              context.lineTo(ended[0], ended[1]);
            }

            context.stroke();

            // fill
            if (this.fillArea)
            {
              context.lineTo(ended[0], height);
              context.lineTo(started[0], height);

              context.lineWidth = 0;
              context.globalAlpha = .15;
              context.fill();
              context.globalAlpha = 1;
            }

            context.closePath();
            started = false;
            ended = false;
          }
        }
      }

      if (this.drawPoints)
      {
        var direction = 0;
        var angle = 0;

        for (var i = 0; i < points.length; i++)
        {
          var x = points[i].x;
          var y = points[i].y;

          if (i != points.length - 1)
          {
            var nextX = points[i + 1].x;
            var nextY = points[i + 1].y;

            var nextDirection = nextY == y ? 0 : (nextY > y ? 1 : -1);
            var nextAngle = Math.abs(Math.atan(Math.abs(nextY - y) / (nextX - x)) / Math.PI * 180);
          }

          var isLabelPoint = !pointFrequency || (i % (pointFrequency + 1) == 0);

          if (i == 0 || i == points.length - 1 || nextDirection != direction || Math.abs(nextAngle - angle) > 30 || isLabelPoint)
          {
            context.beginPath();
            context.arc(x, y, 4, 0, 2 * Math.PI, false);
            context.fillStyle = color;
            context.lineWidth = 1.5;
            context.strokeStyle = 'rgba(255,255,255,.9)';
            context.fill();
            context.stroke();
            context.closePath();
          }

          direction = nextDirection;
          angle = nextAngle;
        }
      }

      context.restore();
    }
  });

  //
  // Bar Chart
  //

  /**
   * @class
   */
  var BarChartViewer = ChartViewer.subclass({
    className: namespace + '.BarChartViewer',

    draw: function(x, y){
      var context = this.context;

      if (!context)
        return;

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

      var tooltipText = keyTitle + ', ' + legendText + ', ' + basis.number.group(hoveredBar.value.toFixed(2));
      context.font = '10px Tahoma';

      var tooltipTextWidth = context.measureText(tooltipText).width;
      var tooltipWidth = tooltipTextWidth + 2 * TOOLTIP_PADDING;
      var tooltipHeight = 10 + 2 * TOOLTIP_PADDING;

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
  var BarChart = AxisChart.subclass({
    className: namespace + '.BarChart',

    bars: null,
    keyValuesOnEdges: false,

    satellite: {
      chartViewer: BarChartViewer
    },

    drawFrame: function(){
      this.bars = [];
      AxisChart.prototype.drawFrame.call(this);
    },

    drawSeria: function(values, color, pos, min, max, step, left, top, width, height){
      var context = this.context;

      //var values = seria.getValues(keys);
      //var color = seria.getColor();

      context.save();
      context.translate(left, top);
      context.fillStyle = color;

      extend(context, this.style);
      context.strokeStyle = '#333';
      context.lineWidth = 1;

      var zeroLinePosition = min >= 0 ? 0 : (max <= 0 ? height : Math.abs(min / (max - min) * height));

      var bar;
      this.bars[pos] = [];
      for (var i = 0; i < values.length; i++)
      {
        bar = this.getBarRect(values[i], pos, i, min, max, step, width, height, zeroLinePosition);

        bar.value = values[i] || 0;
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
      if (bar.width > 10 && bar.height > 10)
        this.context.strokeRect(bar.x + .5, bar.y + .5, bar.width, bar.height);
    }
  });

  /**
   * @class
   */
  var StackedBarChart = BarChart.subclass({
    className: namespace + '.StackedBarChart',

    getMaxValue: function(){
      var max = -Infinity;
      var sum;

      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        sum = 0;
        for (var j in child.values)
          if (!isNaN(child.values[j]))
            sum += child.values[j];

        if (sum > max || max == null)
          max = sum;
      }

      return max;
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
    ChartNode: ChartNode,
    Chart: Chart,
    ChartSeria: ChartSeria,
    ChartSeriesList: ChartSeriesList,
    SeriesChartNode: SeriesChartNode,
    SeriesChart: SeriesChart,
    AxisChart: AxisChart,
    ChartSelection: ChartSelection,
    ChartViewer: ChartViewer,
    LinearChart: LinearChart,
    BarChartViewer: BarChartViewer,
    BarChart: BarChart,
    StackedBarChart: StackedBarChart
  };
