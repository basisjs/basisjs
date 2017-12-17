
 /**
  * @see ./demo/defile/slider.html
  * @namespace basis.ui.slider
  */

  var namespace = 'basis.ui.slider';


  //
  // import names
  //

  var basisEvent = require('../event.js');
  var createEvent = basisEvent.create;
  var getBoundingRect = require('../layout.js').getBoundingRect;
  var AbstractNode = require('../dom/wrapper.js').AbstractNode;
  var DragDropElement = require('../dragdrop.js').DragDropElement;
  var Node = require('../ui.js').Node;


  //
  // definitions
  //

  var templates = require('../template.js').define(namespace, {
    Slider: resource('./templates/slider/Slider.tmpl'),
    MarkLayers: resource('./templates/slider/MarkLayers.tmpl'),
    MarkLayer: resource('./templates/slider/MarkLayer.tmpl'),
    Mark: resource('./templates/slider/Mark.tmpl')
  });


  //
  // main part
  //

  var KEY_PLUS = 187;      // +
  var KEY_KP_PLUS = 107;   // KEYPAD +
  var KEY_MINUS = 189;     // -
  var KEY_KP_MINUS = 109;  // KEYPAD -

  function percentValue(value){
    return (100 * value || 0).toFixed(4);
  }


 /**
  * @class
  */
  var Mark = Node.subclass({
    className: namespace + '.Mark',

    template: templates.Mark,

    pos: 0,
    caption: '\xA0',

    binding: {
      pos: function(node){
        return percentValue(node.pos);
      },
      width: function(node){
        return percentValue(node.width);
      },
      last: function(node){
        return node.isLast ? 'last' : '';
      },
      range: function(node){
        return node.isRange ? 'range' : '';
      },
      text: 'caption'
    }
  });

 /**
  * @class
  */
  var MarkLayer = Node.subclass({
    className: namespace + '.MarkLayer',

    template: templates.MarkLayer,

    childClass: Mark,

    captionGetter: basis.fn.$self,

    count: 0,
    marks: null,

    init: function(){
      Node.prototype.init.call(this);
      this.apply();
    },

    apply: function(){
      var marks = this.marks || [];
      var owner = this.owner_;

      if (!owner)
        return;

      if (this.count > 0)
      {
        for (var i = 1, count = this.count; i <= count; i++)
        {
          var value = owner.closest(i / count);

          marks.push({
            pos: owner.value2pos(value),
            caption: this.captionFormat(value),
            isLast: count == i
          });
        }
      }

      marks = basis.array.sort(marks.filter(basis.fn.$isNotNull), 'pos');

      var pos = 0;
      for (var i = 0, mark; mark = marks[i]; i++)
      {
        mark.width = mark.pos - pos;
        mark.pos = pos;
        pos += mark.width;
      }

      if (pos != 1)
        marks.push({
          pos: pos,
          width: 1 - pos,
          isLast: true
        });

      this.setChildNodes(marks);
    }
  });


  //
  // Slider
  //

  var eventToValue = function(event){
    var scrollbar = this.tmpl.scrollbar;
    var pos = (event.mouseX - getBoundingRect(scrollbar).left) / scrollbar.offsetWidth;
    this.setStepValue(pos * this.stepCount);
  };

  var DRAGDROP_HANDLER = {
    drag: function(sender, dragData, event){
      eventToValue.call(this, event);
    }
  };

 /**
  * @class
  */
  var Slider = Node.subclass({
    className: namespace + '.Slider',

    propertyDescriptors: {
      value: 'change',
      min: 'rangeChanged',
      max: 'rangeChanged',
      step: 'rangeChanged'
    },

    emit_change: createEvent('change', 'oldValue'),
    emit_rangeChanged: createEvent('rangeChanged'),

    captionFormat: function(value){
      return Math.round(Number(value));
    },

    dde: null,

    marks: 'auto',

    min: 0,
    max: 100,
    step: NaN,
    value: NaN,

    stepCount: NaN,
    stepValue: NaN,

    template: templates.Slider,
    binding: {
      marks: 'satellite:',
      thumbPos: {
        events: 'change rangeChanged',
        getter: function(node){
          return percentValue(node.value2pos(node.value));
        }
      },
      minValue: {
        events: 'rangeChanged',
        getter: function(node){
          return node.captionFormat(node.min);
        }
      },
      maxValue: {
        events: 'rangeChanged',
        getter: function(node){
          return node.captionFormat(node.max);
        }
      },
      isEmptyRange: {
        events: 'rangeChanged',
        getter: function(node){
          return node.min == node.max ? 'isEmptyRange' : '';
        }
      }
    },
    action: {
      jumpTo: eventToValue,
      focus: function(){
        this.focus();
      },
      keyStep: function(event){
        switch (event.key)
        {
          case event.KEY.DOWN:
          case event.KEY.LEFT:
          case KEY_MINUS:
          case KEY_KP_MINUS:
            this.stepDown();
            break;

          case event.KEY.UP:
          case event.KEY.RIGHT:
          case KEY_PLUS:
          case KEY_KP_PLUS:
            this.stepUp();
            break;

          case event.KEY.PAGEDOWN:
            this.stepDown(10);
            break;

          case event.KEY.PAGEUP:
            this.stepUp(10);
            break;

          case event.KEY.HOME:
            this.setValue(this.min);
            break;

          case event.KEY.END:
            this.setValue(this.max);
            break;
        }
      },
      wheelStep: function(event){
        if (event.wheelDelta < 0)
          this.stepDown();
        else
          this.stepUp();

        // prevent page scrolling
        event.preventDefault();
      }
    },

   /**
    * @inheritDoc
    */
    satellite: {
      marks: Node.subclass({
        className: namespace + '.MarkLayers',
        template: templates.MarkLayers,
        childClass: MarkLayer
      })
    },

   /**
    * @inheritDoc
    */
    init: function(){
      // save init values
      var step = this.step;
      var value = this.value;

      // make new values possible
      this.step = NaN;
      this.value = NaN;

      // inherit
      Node.prototype.init.call(this);

      // set properties
      this.setRange(this.min, this.max, step || 1);
      this.setValue(isNaN(value) ? this.min : value);

      // add drag possibility for slider
      this.dde = new DragDropElement({
        handler: {
          context: this,
          callbacks: DRAGDROP_HANDLER
        }
      });
    },

    templateSync: function(){
      Node.prototype.templateSync.call(this);

      if (this.tmpl.scrollThumb)
        this.dde.setElement(this.tmpl.scrollThumb);
    },

   /**
    * @param {number} min
    * @param {number} max
    * @param {number} step
    */
    setRange: function(min, max, step){
      if (min > max)
      {
        var t = min;
        min = max;
        max = t;
      }

      step = step || 1;
      min = min || 0;

      if (this.min != min || this.max != max || this.step != step)
      {
        this.stepCount = Math.ceil((max - min) / step);

        this.step = step;
        this.min = min;
        this.max = this.min + this.stepCount * this.step;

        this.setValue(this.value || this.min);

        //
        // update marks
        //

        if (this.marks && this.satellite.marks instanceof AbstractNode)
        {
          var marks = Array.isArray(this.marks) ? this.marks : [this.marks];
          this.satellite.marks.setChildNodes(marks.map(function(layer){
            if (typeof layer != 'object')
              layer = { count: layer };

            var layerConfig = basis.object.extend({
              captionFormat: this.captionFormat,
              owner_: this
            }, layer);

            if (layerConfig.count == 'auto')
              layerConfig.count = Math.min(this.stepCount, 20);

            return layerConfig;
          }, this));
        }

        this.emit_rangeChanged();
      }
    },

   /**
    * @param {number} pos Float value between 0 and 1.
    * @return {number} Closest to pos value.
    */
    closest: function(pos){
      return this.normalize(this.min + (this.max - this.min) * basis.number.fit(pos, 0, 1) + (this.step / 2));
    },

   /**
    * @return {number}
    */
    value2pos: function(value){
      return (basis.number.fit(value, this.min, this.max) - this.min) / (this.max - this.min);
    },

   /**
    * Returns valid value according to min, max and step.
    * @param {number} value Value to normalize.
    * @return {number} Normalized value
    */
    normalize: function(value){
      if (value < this.min)
        value = this.min;
      else
        if (value > this.max)
          value = this.max;

      return this.min + Math.floor(0.00001 + (value - this.min) / this.step) * this.step;
    },

   /**
    * Adds count steps to value.
    * @param {number} count
    */
    stepUp: function(count){
      this.setStepValue(this.stepValue + parseInt(count || 1, 10));
    },

   /**
    * Subtracts count steps to value.
    * @param {number} count
    */
    stepDown: function(count){
      this.setStepValue(this.stepValue - parseInt(count || 1, 10));
    },

   /**
    * Set value in step count
    * @param {number} stepValue
    */
    setStepValue: function(stepValue){
      stepValue = basis.number.fit(Math.round(stepValue), 0, this.stepCount);

      if (this.stepValue != stepValue)
      {
        var oldValue = this.value;

        this.value = this.normalize(this.min + stepValue * this.step);
        this.stepValue = stepValue;

        if (oldValue != this.value)
          this.emit_change(oldValue);
      }
    },

   /**
    * Set new value
    * @param {number} newValue
    */
    setValue: function(newValue){
      this.setStepValue((newValue - this.min) / this.step);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.dde.destroy();
      this.dde = null;

      Node.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Slider: Slider,
    MarkLayer: MarkLayer,
    Mark: Mark
  };
