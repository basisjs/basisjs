
  basis.require('basis.event');
  basis.require('basis.cssom');
  basis.require('basis.data.property');


 /**
  * @namespace basis.animation
  */

  var namespace = this.path;


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
    return (Date.now() - startTime).fit(0, duration) / duration;
  }

  //
  // Add requestAnimationFrame/cancelAnimationFrame support
  //

  var prefixes = ['webkit', 'moz', 'o', 'ms'];

  function createMethod(name, fallback){
    var fn = global[name];

    if (!fn)
    {
      name = name.charAt(0).toUpperCase() + name.substr(1);
      for (var i = 0; !fn && i < prefixes.length; i++)
        fn = global[prefixes[i] + name];
    }

    if (!fn)
      fn = fallback;

    return fn && fn.bind(global);
  }

  var requestAnimationFrame = createMethod('requestAnimationFrame',
    function(callback){
      return setTimeout(callback, 1000 / 60);
    }
  );

  var cancelAnimationFrame = createMethod('cancelRequestAnimationFrame') || createMethod('cancelAnimationFrame', clearTimeout);


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
    init: function(){
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

      Property.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var Modificator = Class(null, {
    className: namespace + '.Modificator',
    thread: null,
    setter: basis.fn.$null,
    notRevert: false,
    timeFunction: basis.fn.$self,

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
        },
        invert: function(){
          this.start += this.range;
          this.range *= -1;
        },
        change: function(progress){
          this.setter(this.start + this.range * this.timeFunction(progress));
        },
        finish: function(){
          if (!this.notInvert)
          {
            this.start += this.range;
            this.range *= -1;
          }
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
        return new Modificator(thread, function(value){ setStyle(element, { opacity: value }); }, 0, 1);
      },
      FadeOut: function(thread, element){
        return new Modificator(thread, function(value){ setStyle(element, { opacity: value }); }, 1, 0);
      }
    }
  };


  //
  // export names
  //

  module.exports = {
    // cross-browser methods
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,

    // classes
    Thread: Thread,
    Modificator: Modificator,

    // pre-defined fx
    FX: FX
  };
