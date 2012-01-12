/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.event');
basis.require('basis.cssom');
basis.require('basis.data.property');

!function(global, basis){

  'use strict';

 /**
  * @namespace basis.animation
  */

  var namespace = 'basis.animation';


  //
  // import names
  //

  var Class = basis.Class;
  var Property = basis.data.property.Property;

  var setStyle = basis.cssom.setStyle;
  var createEvent = basis.event.create;

  
  //
  // MAIN PART
  //

  function timePosition(startTime, duration){
    return (Date.now() - startTime).fit(0, 1) / duration;
  }

  //
  // Add requestAnimationFrame/cancelAnimationFrame support
  //

  var prefixes = ['webkit', 'moz', 'o', 'ms'];

  function createMethod(name, fallback){
    if (global[name])
      return global[name];

    name = name.charAt(0).toUpperCase() + name.substr(1);
    for (var i = 0, prefix; prefix = prefixes[i++];)
      if (global[prefix + name])
        return global[prefix + name];

    return fallback;
  }

  var requestAnimationFrame = createMethod('requestAnimationFrame',
    function(callback){
      return setTimeout(callback, 1000 / 60);
    }
  );

  var cancelAnimationFrame = createMethod('cancelRequestAnimFrame') || createMethod('cancelAnimationFrame', clearTimeout);


 /**
  * @class
  */
  var Thread = Class(Property, {
    className: namespace + '.Thread',

    duration: 1000,
    //interval: 50,
    startTime: 0,
    timer: null,
    started: false,

    event_start: createEvent('start'),
    event_finish: createEvent('finish'),
    event_invert: createEvent('invert'),
    event_change: function(value, prevValue){
      if (value == 0.0)
        this.event_start();

      Property.prototype.event_change.call(this, value, prevValue);

      if (value == 1.0)
        this.event_finish();
    },

    extendConstructor_: true,
    init: function(config){
      this.run = this.run.bind(this);

      Property.prototype.init.call(this, 0);
    },
    start: function(invertIfRun){
      if (!this.started)
      {
        this.startTime = Date.now();
        this.started = true;
        this.run();
      }
      else
        if (invertIfRun)
          this.invert();
    },
    run: function(){
      cancelAnimationFrame(this.timer);
      if (this.started)
      {
        var progress = timePosition(this.startTime, this.duration);

        if (progress >= 1.0)
          this.stop();
        else
        {
          this.set(progress);
          this.timer = requestAnimationFrame(this.run);
        }
      }
    },
    invert: function(){
      this.event_invert();

      if (this.started)
      {
        var progress = timePosition(this.startTime, this.duration);
        this.startTime = Date.now() - this.duration * (1.0 - progress) ;
        this.run();
      }
    },
    stop: function(){
      cancelAnimationFrame(this.timer);

      if (this.started)
      {
        this.started = false;
        this.set(1.0);
      }
    },        
    destroy: function(){
      this.stop();

      Property.prototype.destroy.call();
    }
  });


 /**
  * @class
  */
  var Modificator = Class(null, {
    className: namespace + '.Modificator',
    thread: null,
    setter: Function.$null,
    notRevert: false,
    timeFunction: Function.$self,

    init: function(thread, setter, start, end, notInvert){
      if (thread instanceof Thread)
        this.thread = thread;
      else
        this.thread = new Thread(thread);

      this.setRange(start, end);

      this.setter = setter;
      this.notInvert = notInvert;

      this.thread.addHandler({
        start: function(){
          //;;;if (typeof console != 'undefined') console.log(this.className, 'start');
        },
        invert: function(){
          this.start += this.range;
          this.range *= -1;
          //;;;if (typeof console != 'undefined') console.log(this.className, 'invert');
        },
        change: function(progress){
          this.setter(this.start + this.range * this.timeFunction(progress));
          //console.log(this.className, progress);
        },
        finish: function(){
          if (!this.notInvert)
          {
            this.start += this.range;
            this.range *= -1;
          }
          //;;;if (typeof console != 'undefined') console.log(this.className, 'finish');
        },
        destroy: this.destroy
      }, this);
    },
    setRange: function(start, end){
      this.start = start;
      this.range = end - start;
    },
    destroy: function(){
      delete this.thread;
    }
  });


 /**
  * @enum
  */
  var FX = {
    CSS: {
      FadeIn: function(thread, element){
        return new Modificator(thread, function(value){ setStyle(element, { opacity: value }) }, 0, 1);
      },
      FadeOut: function(thread, element){
        return new Modificator(thread, function(value){ setStyle(element, { opacity: value }) }, 1, 0);
      }
    }
  };


  //
  // export names
  //

  global.requestAnimationFrame = requestAnimationFrame;
  global.cancelAnimationFrame = cancelAnimationFrame;

  basis.namespace(namespace).extend({
    Thread: Thread,
    Modificator: Modificator,
    FX: FX
  });

}(this, basis);
