/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 */

(function(Basis){

 /**
  * @namespace Basis.Plugin
  */ 
  
  var namespace = 'Basis.Plugin';

  // import names

  var DOM = Basis.DOM;
  var Event = Basis.Event;

  var createEvent = Basis.EventObject.createEvent;
  var classList = Basis.CSS.classList;

  var nsWrapper = Basis.DOM.Wrapper;

  var Template = Basis.Html.Template;

  var KEY_PLUS = 187;      // +
  var KEY_KP_PLUS = 107;   // KEYPAD +
  var KEY_MINUS = 189;     // -
  var KEY_KP_MINUS = 109;  // KEYPAD -

  //
  // main part
  //

  function percent(value){
    return (100 * value).toFixed(4) + '%';
  }

  function updateSelection(paginator){
    var node = paginator.childNodes.search(paginator.activePage_, 'data.pageNumber');
    if (node)
      node.select();
    else
      paginator.selection.clear();
  }

 /**
  * @class
  */
  var Mark = nsWrapper.TmplNode.subclass({
    className: namespace + '.Slider.Mark',

    pos: 0,
    caption: String.Entity.nbsp,

    template:
      '<div class="Basis-Slider-Mark">' +
        '<span class="Basis-Slider-Mark-CaptionWrapper">' +
          '<span class="Basis-Slider-Mark-Caption">' +
            '{text}' +
          '</span>' +
        '</span>' +
      '</div>',

    init: function(config){
      nsWrapper.TmplNode.prototype.init.call(this, config);
      DOM.setStyle(this.element, {
        left: (100 * this.pos) + '%',
        width: (100 * this.width) + '%'
      });
      this.tmpl.text.nodeValue = this.caption;
      if (this.isLast)
        classList(this.element).add('last');
      if (this.isRange)
        classList(this.element).add('range');
    }
  });

 /**
  * @class
  */
  var MarkLayer = nsWrapper.TmplContainer.subclass({
    className: namespace + '.Slider.MarkLayer',

    template: 
      '<div class="Basis-Slider-MarkLayer"/>',

    childClass: Mark,

    captionGetter: Function.$self,

    count: 0,
    marks: null,

    init: function(config){
      nsWrapper.TmplContainer.prototype.init.call(this, config);
      this.apply();
    },

    apply: function(){
      var marks = this.marks || [];
      if (this.count > 0)
      {
        var self = this;
        marks.push.apply(marks, Array.create(this.count, function(idx){
          var p = (idx + 1)/self.count;
          var value = this.closest(p);
          var pos = ((value - this.min)/this.range_);

          return {
            pos: pos,
            caption: self.captionFormat(value),
            isLast: self.count == idx + 1
          }
        }, this.owner_));
      }

      var pos = 0;
      marks = marks.filter(Function.$isNotNull).sortAsObject('pos').map(function(mark){
        var s = mark.pos;
        mark.width = mark.pos - pos;
        mark.pos = pos;
        pos = s;
        return mark;
      }, this);

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

  var DRAGDROP_HANDLER = {
    move: function(config){
      var scrollbar = this.tmpl.scrollbar;
      var pos = (Event.mouseX(event) - (new Basis.Layout.Box(scrollbar)).left)/scrollbar.offsetWidth;
      this.setValue_(pos * this.count_);
    }
  };

  function stepAction(event){
    var delta = Event.wheelDelta(event);

    if (delta)
    {
      DOM.focus(this.element);
      if (delta < 0)
        this.stepDown();
      else
        this.stepUp();
    }
    else
    {
      var key = Event.key(event);
      switch(key){
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
    }
  }

 /**
  * @class
  */
  var Slider = nsWrapper.TmplNode.subclass({
    className: namespace + '.Slider',

    event_change: createEvent('change'),

    captionFormat: function(value){
      return Math.round(Number(value));
    },

    min: 0,
    max: 100,
    step: 1,
    value: NaN,
    value_: NaN,

    template:
    	'<div{element} class="Basis-Slider Basis-Slider-MinMaxInside" event-mousewheel="step" event-keyup="step" event-mousedown="focus" tabindex="0">' +
        '<div class="Basis-Slider-MinLabel"><span class="caption">{minValue}</span></div>' +
        '<div class="Basis-Slider-MaxLabel"><span class="caption">{maxValue}</span></div>' +
        '<div{scrollbarContainer} class="Basis-Slider-ScrollbarContainer" event-click="jumpTo">' +
      	  '<div class="Basis-Slider-MarkLayers">' +
      	    '<!--{marks}-->' +
      	  '</div>' +
          '<div{scrollbar} class="Basis-Slider-Scrollbar">' +
            '<div{scrollTrumb} class="Basis-Slider-ScrollbarSlider"></div>' +
          '</div>' +
        '</div>' +
    	'</div>',

    action: {
      jumpTo: function(event){
        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Basis.Layout.Box(scrollbar)).left)/scrollbar.offsetWidth;
        this.setValue_(pos * this.count_);
      },
      focus: function(){
        DOM.focus(this.element);
      },
      step: stepAction
    },

    satelliteConfig: {
      marks: {
        instanceOf: nsWrapper.TmplContainer.subclass({
          childClass: MarkLayer
        })
      }
    },

    marks: 'auto',

    init: function(config){
      // save init values
      var step = this.step;
      var value = this.value;

      // make new values possible
      this.step = 0;
      this.value = this.min;
      this.value_ = 0;

      // inherit
      nsWrapper.TmplNode.prototype.init.call(this, config);

      // set properties
      this.setProperties(this.min, this.max, step);
      this.setValue(isNaN(value) ? this.min : value);

      // add drag posibility for slider
      this.scrollbarDD = new Basis.DragDrop.DragDropElement({
        element: this.tmpl.scrollTrumb,
        handler: DRAGDROP_HANDLER,
        handlerContext: this
      });
    },

   /**
    * @param {number} pageCount
    * @param {number} pageSpan
    * @param {number} activePage
    */
    setProperties: function(min, max, step){
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
        this.count_ = Math.ceil((max - min)/step);

        this.step = step;
        this.min = min;
        this.max = this.min + this.count_ * this.step;

        this.range_ = this.max - this.min;

        this.tmpl.minValue.nodeValue = this.captionFormat(this.min);
        this.tmpl.maxValue.nodeValue = this.captionFormat(this.max);
        classList(this.element).bool('NoMax', this.max == this.min);

        if (this.marks)
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
              layerConfig.count = Math.min(this.count_, 20);

            return layerConfig;
          }, this));
        }

        this.setValue(this.value || this.min);
      }
    },
    closest: function(pos){
      return this.normalize(this.min + this.range_ * pos.fit(0, 1) + (this.step/2));
    },
    normalize: function(value){
      if (value < this.min)
        value = this.min;
      else
        if (value > this.max)
          value = this.max;

      return this.min + Math.floor(0.00001 + (value - this.min)/this.step) * this.step;
    },
    stepUp: function(count){
      this.setValue_(this.value_ + parseInt(count || 1));
    },
    stepDown: function(count){
      this.setValue_(this.value_ - parseInt(count || 1));
    },
    setValue_: function(newValue){
      newValue = Math.round(newValue).fit(0, this.count_);

      if (this.value_ != newValue)
      {
        this.value_ = newValue;

        var oldValue = this.value;

        this.value = this.normalize(this.min + newValue * this.step);
        this.tmpl.scrollTrumb.style.left = percent(newValue/this.count_);

        this.event_change(this, oldValue);
      }
    },
    setValue: function(newValue){
      this.setValue_((newValue - this.min)/this.step);
    },
    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      nsWrapper.TmplNode.prototype.destroy.call(this);
    }
  });

  // export names

  Object.extend(Slider, {
    MarkLayer: MarkLayer,
    Mark: Mark
  });

  Basis.namespace(namespace).extend({
    Slider: Slider
  });

})(Basis);
