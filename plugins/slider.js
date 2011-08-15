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
    start: function(config){
      this.initOffset = this.tmpl.scrollTrumb.offsetLeft;
    },
    move: function(config){
//      console.log(this.initOffset, config.deltaX, this.initOffset + config.deltaX, this.tmpl.scrollTrumbWrapper.offsetWidth);
      //console.log(pos, this.min + pos * (this.max - this.min), this.step * Math.floor(pos/this.stepWidth_));
      //this.setValue(this.step * Math.floor(pos/this.stepWidth_));*/

        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Basis.Layout.Box(scrollbar)).left)/scrollbar.offsetWidth;
        this.setValue(this.step * Math.floor(pos/this.stepWidth_));

      var pos = ((this.initOffset + config.deltaX)/this.tmpl.scrollTrumbWrapper.offsetWidth).fit(0, 1);
      this.tmpl.scrollTrumb.style.left = percent(pos);
    },
    over: function(config){
      var scrollTrumbWidth = this.stepWidth_/(1 - this.stepWidth_);
      var newVal = (this.value - this.min)/(this.max - this.min);
      this.tmpl.scrollTrumb.style.left = percent(newVal);
    }
  };

 /**
  * @class
  */
  var Slider = Class(nsWrapper.Control, {
    className: namespace + '.Slider',

    template:
    	'<div{element} class="Basis-Slider">' +
    	  '<div{ticks} class="Basis-Slider-Ticks"/>' +
        '<div{scrollbarContainer} class="Basis-Slider-ScrollbarContainer">' +
          '<div{scrollbar} class="Basis-Slider-Scrollbar" event-click="jumpTo">' +
            '<div{scrollTrumbWrapper}>' + 
              '<div{scrollTrumb} class="Basis-Slider-ScrollbarSlider"><div{scrollTrumbElement}><span/></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
    	'</div>',

    action: {
      jumpTo: function(event){
        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Basis.Layout.Box(scrollbar)).left)/scrollbar.offsetWidth;
        this.setValue(this.step * Math.floor(pos/this.stepWidth_));
      }
    },

    event_change: createEvent('change'),

    min: 0,
    max: 100,
    step: 1,
    value: NaN,

    init: function(config){
      nsWrapper.Control.prototype.init.call(this, config);

      var step = this.step;
      this.step = 0;
      this.setProperties(this.min, this.max, step);

      this.scrollbarDD = new Basis.DragDrop.DragDropElement({
        element: this.tmpl.scrollTrumb,
        handler: DRAGDROP_HANDLER,
        handlerContext: this
      });
    },

    captionFormat: function(value){
      return Math.round(Number(value));
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
        min = this.normalize(min);
        max = this.normalize(max);

        var tickCount = Math.min((this.max - this.min)/this.step, 25);

        DOM.insert(DOM.clear(this.tmpl.ticks), Array.create(tickCount + 1, function(idx){
          return DOM.createElement('SPAN.Basis-Slider-Tick[style="left: {0:.5}%"]'.format(100*idx/tickCount),
            DOM.createElement('SPAN.caption' + (idx == 0 ? '.left' : (idx == tickCount ? '.right' : '')), this.captionFormat(idx * ((max - min)/tickCount)))
          );
        }, this));

        /*var stepCount = (this.max - this.min)/this.step;
        this.tmpl.scrollTrumbWrapper.style.width = percent(1 - 1/stepCount);
        this.tmpl.scrollTrumb.style.width = percent(1/stepCount);*/

        this.stepCount_ = 1 + (this.max - this.min)/this.step;
        this.stepWidth_ = 1/this.stepCount_;
        var scrollTrumbWidth = this.stepWidth_/(1 - this.stepWidth_);

        this.tmpl.scrollTrumbWrapper.style.width = percent(1 - this.stepWidth_);
        this.tmpl.scrollTrumb.style.width = percent(scrollTrumbWidth);

        this.setValue(this.value || this.min);
      }
    },
    normalize: function(value){
      var value = Math.round(value * this.step)/this.step;
      return value - (value % this.step);
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
        var scrollTrumbWidth = this.stepWidth_/(1 - this.stepWidth_);
        var newVal = (newValue - this.min)/(this.max - this.min);
        this.tmpl.scrollTrumb.style.left = percent(newVal);

        console.log(oldValue , '->', this.value);

        this.event_change(this, oldValue);
      }
    },
    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      nsWrapper.Control.prototype.destroy.call(this);
    }
  });

  // export names

  Basis.namespace(namespace).extend({
    Slider: Slider
  });

})(Basis);
