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

  var Class = Basis.Class;
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

  //
  // Slider
  //

  var DRAGDROP_HANDLER = {
    move: function(config){
      //var pos = (this.initOffset + config.deltaX)/this.tmpl.scrollbar.offsetWidth;
      var scrollbar = this.tmpl.scrollbar;
      var pos = (Event.mouseX(event) - (new Basis.Layout.Box(scrollbar)).left)/scrollbar.offsetWidth;
      this.setValue(this.min + this.range_ * pos + (this.step/2));
    }
  };

 /**
  * @class
  */
  var Label = nsWrapper.TmplNode.subclass({
    template:
      '<div class="Basis-Slider-Label">' +
        '<span class="Basis-Slider-Label-Caption">' +
          '{text}' +
        '</span>' +
      '</div>',

    init: function(){
      nsWrapper.TmplNode
    }
  });

 /**
  * @class
  */
  var LabelLayer = nsWrapper.TmplContainer.subclass({
    className: namespace + '.Slider.LabelLayer',

    template: 
      '<div class="Basis-Slider-LabelLayer"/>',

    childNodes: Label,

    init: function(){}
      
  });

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

    template:
    	'<div{element} class="Basis-Slider" event-mousewheel="step" event-keyup="step" event-mousedown="focus" tabindex="0">' +
        '<div{scrollbarContainer} class="Basis-Slider-ScrollbarContainer" event-click="jumpTo">' +
      	  '<div{ticks} class="Basis-Slider-Ticks">' +
      	    '<div class="Basis-Slider-Tick" style="left: 0"><span class="caption min">{minValue}</span></div>' +
      	    '<div class="Basis-Slider-Tick" style="left: 100%"><span class="caption max">{maxValue}</span></div>' +
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
        this.setValue(this.min + this.range_ * pos + (this.step/2))
      },
      focus: function(){
        DOM.focus(this.element);
      },
      step: function(event){
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
    },

    init: function(config){
      nsWrapper.TmplNode.prototype.init.call(this, config);

      // save init values
      var step = this.step;
      var value = this.value;

      // make new values possible
      this.step = 0;
      this.value = this.min;

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
        this.step = step;
        this.min = min;
        this.max = max = Math.floor((max - min)/step) * step;
        this.range_ = this.max - this.min;

        var tickCount = Math.min(this.range_/this.step, 20);

        this.tmpl.minValue.nodeValue = this.captionFormat(this.min);
        this.tmpl.maxValue.nodeValue = this.captionFormat(this.max);

        DOM.insert(this.tmpl.ticks, Array.create(tickCount + 1, function(idx){
          if (!idx || idx == tickCount)
            return null;

          var p = idx/tickCount;
          var value = this.closest(p);
          var pos = 100 * ((value - this.min)/this.range_);

          return DOM.createElement('SPAN.Basis-Slider-Tick[style="left: {0:.5}%"]'.format(pos),
            DOM.createElement('SPAN.caption',
              this.captionFormat(value)
            )
          );
        }, this));

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
      this.setValue(this.value + (count || 1) * this.step);
    },
    stepDown: function(count){
      this.setValue(this.value - (count || 1) * this.step);
    },
    setValue: function(newValue){
      newValue = this.normalize(newValue);

      if (newValue < this.min)
        newValue = this.min;
      else
        if (newValue > this.max)
          newValue = this.max;

      if (this.value != newValue)
      {
        var oldValue = this.value;

        this.value = newValue;
        this.tmpl.scrollTrumb.style.left = percent((newValue - this.min)/this.range_);

        this.event_change(this, oldValue);
      }
    },
    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      nsWrapper.TmplNode.prototype.destroy.call(this);
    }
  });

  // export names

  Basis.namespace(namespace).extend({
    Slider: Slider
  });

})(Basis);
