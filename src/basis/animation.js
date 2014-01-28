
  basis.require('basis.event');
  basis.require('basis.cssom');
  basis.require('basis.data.value');


 /**
  * @namespace basis.animation
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var Property = basis.data.value.Property;

  var setStyle = basis.cssom.setStyle;
  var createEvent = basis.event.create;


  //
  // MAIN PART
  //

  function timePosition(startTime, duration){
    return basis.number.fit(Date.now() - startTime, 0, duration) / duration;
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

    return fn ? fn.bind(global) : fallback;
  }

  var requestAnimationFrame = createMethod('requestAnimationFrame',
    function(callback){
      return setTimeout(callback, 1000 / 60);
    }
  );

  var cancelAnimationFrame = createMethod('cancelRequestAnimationFrame') || createMethod('cancelAnimationFrame',
    function(id){
      clearTimeout(id);
    }
  );


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

    emit_start: createEvent('start'),
    emit_finish: createEvent('finish'),
    emit_invert: createEvent('invert'),
    emit_change: function(prevValue){
      if (this.value == 0.0)
        this.emit_start();

      Property.prototype.emit_change.call(this, prevValue);

      if (this.value == 1.0)
        this.emit_finish();
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
      this.emit_invert();

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
        change: function(sender){
          this.setter(this.start + this.range * this.timeFunction(sender.value));
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
