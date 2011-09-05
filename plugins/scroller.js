
(function() {

 /**
  * @namespace App.Ext
  */
  var namespace = 'Basis.Plugin';

  var DOM = Basis.DOM;
  var EventObject = Basis.EventObject;
  var Class = Basis.Class;
  var Event = Basis.Event;

  var prefixes = ['webkit', 'moz', 'o', 'ms'];

  function createMethod(name, fallback){
    if (window[name])
      return window[name];

    name = name.charAt(0).toUpperCase() + name.substr(1);
    for (var i = 0, prefix; prefix = prefixes[i++];)
      if (window[prefix + name])
        return window[prefix + name];

    return fallback;
  }

  var requestAnimFrame = createMethod('requestAnimationFrame',
    function(callback, element){
      return window.setTimeout(callback, 15);
    }
  );

  var cancelRequestAnimFrame = createMethod('cancelRequestAnimFrame', clearInterval);

  var AVARAGE_TICK_TIME_INTERVAl = 15;
  var VELOCITY_DECREASE_FACTOR = 0.94;

  var Scroller = Class(EventObject, {
    event_start: EventObject.createEvent('start', 'scrollerObject'),
    event_finish: EventObject.createEvent('finish', 'scrollerObject'),
    event_startInertia: EventObject.createEvent('startInertia', 'scrollerObject'),
    event_updatePosition: EventObject.createEvent('updatePosition', 'scrollerObject', 'scrollPosition'),

    init: function(config){
      this.lastMousePos = 0;
      this.currentVelocity = 0;
      this.currentDirection = 0;

      this.minPosition = 0;
      this.maxPosition = 0;

      this.viewportPos = 0;
      this.viewportTargetPos = this.viewportPos;
      this.lastViewportTargetPos = this.viewportPos;

      this.updateFrameHandle = 0;
      this.lastMotionUpdate = 0;
      this.lastUpdateTime = 0;
      this.startTime = 0;
      this.processInertia = false;
      this.panningActive = false;

      EventObject.prototype.init.call(this, config);

      if (this.targetElement)
      {
        Event.addHandler(this.targetElement, 'mousedown', this.onMouseDown.bind(this));
        Event.addHandler(this.targetElement, 'touchstart', this.onMouseDown.bind(this));
      }

      this.scrollType = (this.scrollProperty == 'top' || this.scrollProperty == 'scrollTop') ? 'vertical' : 'horizontal';

      this.onMouseMoveHandler = this.onMouseMove.bind(this);
      this.onMouseUpHandler = this.onMouseUp.bind(this);
      this.onUpdateHandler = this.onUpdate.bind(this);
    },

    resetVariables: function(){
      this.viewportTargetPos = this.viewportPos;
      this.lastViewportTargetPos = this.viewportTargetPos;

      this.currentVelocity = 0;
      this.currentDirection = 0;

      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      this.minPosition = this.calcMinPosition();
      this.maxPosition = this.calcMaxPosition();

      this.isUpdating = true;
      this.updateFrameHandle = this.nextFrame();
      this.lastUpdateTime = Date.now();

      this.startTime = this.lastUpdateTime;

      this.event_start(this);
    },

    stopUpdate: function(){
      if (!this.isUpdating)
        return;

      this.resetVariables();

      this.isUpdating = false;
      cancelRequestAnimFrame(this.updateFrameHandle);

      this.event_finish(this);
    },

    nextFrame: function(){
      if (this.isUpdating)
        this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler, this.targetElement);
    },


    calcMinPosition: function(){
      return 0;
    },

    calcMaxPosition: function(){
      var max = 0;

      if (!this.targetElement.offsetWidth)
        return 0;

      switch (this.scrollProperty)
      {
        case 'left': 
          max = this.targetElement.offsetWidth - this.targetElement.offsetParent.offsetWidth;
          break;
        case 'scrollLeft':
          max = this.targetElement.scrollWidth - this.targetElement.offsetWidth;
          break;
        case 'top':
          max = this.targetElement.offsetHeight - this.targetElement.offsetParent.offsetHeight;
          break;
        case 'scrollTop':
          max = this.targetElement.scrollHeight - this.targetElement.offsetHeight;
          break;
      }

      return max;
    },

    onMouseDown: function(event){
      this.stopUpdate();

      this.panningActive = true;

      this.lastMousePos = this.scrollType == 'vertical' ? Event.mouseY(event) : Event.mouseX(event);

      Event.addHandler(document, 'mousemove', this.onMouseMoveHandler);
      Event.addHandler(document, 'mouseup',   this.onMouseUpHandler);
      Event.addHandler(document, 'touchmove', this.onMouseMoveHandler);
      Event.addHandler(document, 'touchend',   this.onMouseUpHandler);

      Event.kill(event);
    },

    onMouseMove: function(event){
      this.startUpdate();

      var curMousePos = this.scrollType == 'vertical' ? Event.mouseY(event) : Event.mouseX(event);

      var delta = curMousePos - this.lastMousePos;
      this.lastMousePos = curMousePos;
      this.viewportTargetPos -= delta;

      this.lastMotionUpdate = Date.now();
    },

    onMouseUp: function(){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdate;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdate = 0;
      
      // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia
      this.currentVelocity *= 1 - Math.min(1, Math.max(0, deltaTime / 100));

      this.event_startInertia(this);

      Event.removeHandler(document, 'mousemove', this.onMouseMoveHandler);
      Event.removeHandler(document, 'mouseup',   this.onMouseUpHandler);
      Event.removeHandler(document, 'touchmove', this.onMouseMoveHandler);
      Event.removeHandler(document, 'touchend',  this.onMouseUpHandler);
    },

    onUpdate: function(time){
      if (!time)
        time = Date.now();

      var deltaTime = time - this.lastUpdateTime;
      this.lastUpdateTime = time;

      if (!deltaTime)
      {
        this.nextFrame();
        return;
      }

      if (this.panningActive)
      {
        var delta = (this.viewportTargetPos - this.lastViewportTargetPos);
        this.lastViewportTargetPos = this.viewportTargetPos;

        var velocity = Math.abs(delta);
        //this.currentVelocity += (velocity - this.currentVelocity) * 0.3 / deltaTime;
        this.currentVelocity = velocity / deltaTime;
        this.currentDirection = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
      }
      else if (this.processInertia)
      {
        this.viewportTargetPos += this.currentDirection * (this.currentVelocity *  deltaTime);
        this.currentVelocity *= VELOCITY_DECREASE_FACTOR;

        if (this.currentVelocity < 0.001 || this.viewportPos < this.minPosition || this.viewportPos > this.maxPosition)
        {
          this.viewportTargetPos = Math.min(this.maxPosition, Math.max(this.minPosition, this.viewportTargetPos));
          this.currentVelocity = 0;
          this.processInertia = false;
        }
      }

      var deltaPos = (this.viewportTargetPos - this.viewportPos);
      var smoothingFactor = this.panningActive || this.currentVelocity > 0 ? 1 : 0.12;
      this.viewportPos += deltaPos * smoothingFactor;

      if (!this.panningActive && this.currentVelocity < 0.001 && Math.abs(deltaPos) < 0.1)
      {
        this.stopUpdate();
      }

      this.updateElementPosition();
      this.event_updatePosition(this, time, this.viewportPos);

      this.nextFrame();
    },

    calcExpectedPosition: function(){
      var expectedInertiaDelta = 0;

      if (this.currentVelocity)
      {
        var expectedInertiaIterationCount = Math.log(0.001 / this.currentVelocity) / Math.log(VELOCITY_DECREASE_FACTOR);
        var velocity = this.currentVelocity;
        for (var i = 0; i < expectedInertiaIterationCount; i++)
        {
          expectedInertiaDelta += this.currentDirection * velocity * AVARAGE_TICK_TIME_INTERVAl;
          velocity *= VELOCITY_DECREASE_FACTOR;
        }
      }
      var expectedPosition = this.viewportTargetPos + expectedInertiaDelta;

      return Math.max(this.minPosition, Math.min(this.maxPosition, expectedPosition));
    },

    setTargetPosition: function(targetPosition){
      this.viewportTargetPos = targetPosition;
      this.startUpdate();
    },
    
    updateElementPosition: function(){
      if (this.scrollProperty == 'left' || this.scrollProperty == 'top')
      {
        var scrollTop = this.scrollProperty == 'top';
        var position = Math.round(-this.viewportPos) + 'px';
        var translate2d = scrollTop ? 'translateY(' + position + ')' : 'translateX(' + position + ')';
        var translate3d = 'translate3d(' + (!scrollTop ? position : 0) + ', ' + (scrollTop ? position : 0) + ', 0)';

        DOM.setStyle(this.targetElement, {
          '-webkit-transform': translate3d, 
          '-moz-transform': translate2d,
          '-ms-transform': translate2d
        });

        //this.targetElement.style[this.scrollProperty] = (-this.viewportPos) + 'px';
      }
      else if (this.scrollProperty == 'scrollLeft' || this.scrollProperty == 'scrollTop')
      {
        this.targetElement[this.scrollProperty] = this.viewportPos;
      }
    }
  });


  Basis.namespace(namespace).extend({
    Scroller: Scroller
  });

})();
