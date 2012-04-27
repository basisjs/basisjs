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
 */

  'use strict';

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.html');
  basis.require('basis.layout');
  basis.require('basis.dragdrop');


 /**
  * @see ./demo/defile/slider.html
  * @namespace basis.ui.slider
  */ 
  
  var namespace = this.path;


  //
  // import names
  //

  var DOM = basis.dom;
  var Event = basis.dom.event;

  var events = basis.event.events;
  var createEvent = basis.event.create;
  var cssom = basis.cssom;

  var AbstractNode = basis.dom.wrapper.AbstractNode;
  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var Box = basis.layout.Box;


  //
  // main part
  //

  var KEY_PLUS = 187;      // +
  var KEY_KP_PLUS = 107;   // KEYPAD +
  var KEY_MINUS = 189;     // -
  var KEY_KP_MINUS = 109;  // KEYPAD -

  function percent(value){
    return (100 * value || 0).toFixed(4) + '%';
  }


 /**
  * @class
  */
  var Mark = UINode.subclass({
    className: namespace + '.Mark',

    pos: 0,
    caption: '\xA0',

    template:
      '<div class="Basis-Slider-Mark {last} {range} {selected} {disabled}">' +
        '<span class="Basis-Slider-Mark-CaptionWrapper">' +
          '<span class="Basis-Slider-Mark-Caption">' +
            '{text}' +
          '</span>' +
        '</span>' +
      '</div>',

    binding: {
      last: function(node){
        return node.isLast ? 'last' : '';
      },
      range: function(node){
        return node.isRange ? 'range' : '';
      },
      text: 'caption'
    },

    templateUpdate: function(tmpl){
      cssom.setStyle(this.element, {
        left: percent(this.pos),
        width: percent(this.width)
      });
    }
  });

 /**
  * @class
  */
  var MarkLayer = UIContainer.subclass({
    className: namespace + '.MarkLayer',

    template: 
      '<div class="Basis-Slider-MarkLayer"/>',

    childClass: Mark,

    captionGetter: Function.$self,

    count: 0,
    marks: null,

    init: function(config){
      UIContainer.prototype.init.call(this, config);
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

      marks = marks.filter(Function.$isNotNull).sortAsObject('pos');

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
    var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
    this.setStepValue(pos * this.stepCount);
  };

  var DRAGDROP_HANDLER = {
    move: function(config, event){
      eventToValue.call(this, event);
    }
  };

 /**
  * @class
  */
  var Slider = UINode.subclass({
    className: namespace + '.Slider',

    event_change: createEvent('change', 'oldValue') && function(sender, oldValue){
      events.change.call(this, sender, oldValue);
      this.templateUpdate(this.tmpl, 'change');
    },

    event_rangeChanged: createEvent('rangeChanged') && function(sender){
      events.rangeChanged.call(this, sender);
      this.templateUpdate(this.tmpl, 'rangeChanged');
    },

    captionFormat: function(value){
      return Math.round(Number(value));
    },

    marks: 'auto',

    min: 0,
    max: 100,
    step: NaN,
    value: NaN,

    stepCount: NaN,
    stepValue: NaN,

   /**
    * @inheritDoc
    */
    template:
    	'<div class="Basis-Slider {isEmptyRange} Basis-Slider-MinMaxOutside {selected} {disabled}" event-mousewheel="focus wheelStep" event-keyup="keyStep" event-mousedown="focus" tabindex="0">' +
        '<div class="Basis-Slider-MinLabel"><span class="caption">{minValue}</span></div>' +
        '<div class="Basis-Slider-MaxLabel"><span class="caption">{maxValue}</span></div>' +
        '<div class="Basis-Slider-ScrollbarContainer" event-click="jumpTo">' +
      	  '<!--{marks}-->' +
          '<div{scrollbar} class="Basis-Slider-Scrollbar">' +
            '<div{valueBar} class="Basis-Slider-ValueBar">' +
              '<div{scrollTrumb} class="Basis-Slider-Thumb"/>' +
            '</div>' +
            '<div{leftBar} class="Basis-Slider-LeftBar"/>' +
          '</div>' +
        '</div>' +
    	'</div>',

    binding: {
      marks: 'satellite:',
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

   /**
    * @inheritDoc
    */
    action: {
      jumpTo: eventToValue,
      focus: function(){
        DOM.focus(this.element);
      },
      keyStep: function(event){
        switch(Event.key(event))
        {
          case Event.KEY.DOWN:
          case Event.KEY.LEFT:
          case KEY_MINUS:
          case KEY_KP_MINUS:
            this.stepDown();
          break;
          
          case Event.KEY.UP:
          case Event.KEY.RIGHT:
          case KEY_PLUS:
          case KEY_KP_PLUS:
            this.stepUp();
          break;

          case Event.KEY.PAGEDOWN:
            this.stepDown(10);
          break;
          
          case Event.KEY.PAGEUP:
            this.stepUp(10);
          break;
          
          case Event.KEY.HOME:
            this.setValue(this.min);
          break;
          
          case Event.KEY.END:
            this.setValue(this.max);
          break;
        }
      },
      wheelStep: function(event){
        if (Event.wheelDelta(event) < 0)
          this.stepDown();
        else
          this.stepUp();
      }
    },

   /**
    * @inheritDoc
    */
    satelliteConfig: {
      marks: UIContainer.subclass({
        className: namespace + '.MarkLayers',
        template: '<div class="Basis-Slider-MarkLayers {selected} {disabled}"/>',
        childClass: MarkLayer
      })
    },

   /**
    * @inheritDoc
    */
    templateUpdate: function(tmpl, eventName){
      if (!eventName || eventName == 'change')
      {
        cssom.setStyle(tmpl.valueBar, {
          width: percent(this.value2pos(this.value))
        });
      }
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      // save init values
      var step = this.step;
      var value = this.value;

      // make new values possible
      this.step = NaN;
      this.value = NaN;

      // inherit
      UINode.prototype.init.call(this, config);

      // set properties
      this.setRange(this.min, this.max, step || 1);
      this.setValue(isNaN(value) ? this.min : value);

      // add drag posibility for slider
      this.scrollbarDD = new DragDropElement({
        element: this.tmpl.scrollTrumb,
        handler: DRAGDROP_HANDLER,
        handlerContext: this
      });
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

            var layerConfig = Object.extend({
              captionFormat: this.captionFormat,
              owner_: this
            }, layer);

            if (layerConfig.count == 'auto')
              layerConfig.count = Math.min(this.stepCount, 20);

            return layerConfig;
          }, this));
        }
      }
    },

   /**
    * @param {number} pos Float value between 0 and 1.
    * @return {number} Closest to pos value.
    */
    closest: function(pos){
      return this.normalize(this.min + (this.max - this.min) * pos.fit(0, 1) + (this.step / 2));
    },

   /**
    */
    value2pos: function(value){     
      return (value.fit(this.min, this.max) - this.min) / (this.max - this.min);
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
      this.setStepValue(this.stepValue + parseInt(count || 1));
    },

   /**
    * Subtracts count steps to value.
    * @param {number} count
    */
    stepDown: function(count){
      this.setStepValue(this.stepValue - parseInt(count || 1));
    },

   /**
    * Set value in step count
    * @param {number} stepCount
    */
    setStepValue: function(stepValue){
      stepValue = Math.round(stepValue).fit(0, this.stepCount);

      if (this.stepValue != stepValue)
      {
        var oldValue = this.value;

        this.value = this.normalize(this.min + stepValue * this.step);
        this.stepValue = stepValue;

        this.event_change(this, oldValue);
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
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  this.extend({
    Slider: Slider,
    MarkLayer: MarkLayer,
    Mark: Mark
  });
