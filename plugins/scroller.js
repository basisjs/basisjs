
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

  var Scroller = Class(EventObject, {
    event_start: EventObject.createEvent('start'),
    event_finish: EventObject.createEvent('finish'),
    event_updatePosition: EventObject.createEvent('updatePosition'),

    init: function(config){
      this.lastMousePos = 0;
      this.currentVelocity = 0;
      this.currentDirection = 0;

      this.viewportPos = 0;
      this.viewportTargetPos = this.viewportPos;
      this.lastViewportTargetPos = this.viewportPos;

      this.updateFrameHandle = 0;
      this.processInertia = false;
      this.panningActive = false;
      this.lastMotionUpdate = 0;
      this.lastUpdateTime = 0;

      EventObject.prototype.init.call(this, config);

      if (this.targetElement)
      {
        Event.addHandler(this.targetElement, 'mousedown', this.onMouseDown.bind(this));
        Event.addHandler(this.targetElement, 'touchstart', this.onMouseDown.bind(this));
      }

      this.onMouseMoveHandler = this.onMouseMove.bind(this);
      this.onMouseUpHandler = this.onMouseUp.bind(this);
      this.onUpdateHandler = this.onUpdate.bind(this);
    },

    resetVariables: function(){
      this.viewportTargetPos = this.viewportPos;
      this.lastViewportTargetPos = this.viewportTargetPos;
      this.currentVelocity = 0;
      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      cancelRequestAnimFrame(this.updateFrameHandle);

      this.maxPosition = this.scrollType == 'vertical' ? 
        this.targetElement.scrollHeight - this.targetElement.offsetHeight : 
        this.targetElement.scrollWidth - this.targetElement.offsetWidth;

      this.isUpdating = true;
      this.targetElement.style.color = 'green';
      this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler);
      this.lastUpdateTime = Date.now();

      this.event_start(this);
    },

    stopUpdate: function(){
      if (!this.isUpdating)
        return;

      this.isUpdating = false;
      this.targetElement.style.color = 'black';
      cancelRequestAnimFrame(this.updateFrameHandle);

      this.event_finish(this);
    },

    onMouseDown: function(event){
      this.stopUpdate();
      this.resetVariables();

      this.panningActive = true;

      this.lastMousePos = this.scrollType == 'vertical' ? Event.mouseY(event) : Event.mouseX(event);

      Event.addHandler(document, 'mousemove', this.onMouseMoveHandler);
      Event.addHandler(document, 'mouseup',   this.onMouseUpHandler);
      Event.addHandler(this.targetElement, 'touchmove', this.onMouseMoveHandler);
      Event.addHandler(this.targetElement, 'touchup',   this.onMouseUpHandler);

      Event.kill(event);
    },

    onMouseMove: function(event){
      this.startUpdate();

      var curMousePos = this.scrollType == 'vertical' ? Event.mouseY(event) : Event.mouseX(event);
      var delta = curMousePos - this.lastMousePos;
      this.lastMousePos = curMousePos;
      this.viewportTargetPos += delta * 2;

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
      this.currentVelocity *= 1 - Math.min(1, Math.max(0, deltaTime/100));

      Event.removeHandler(document, 'mousemove', this.onMouseMoveHandler);
      Event.removeHandler(document, 'mouseup',   this.onMouseUpHandler);
    },

    onUpdate: function(time){
      this.targetElement.style.color = 'black';
      //var deltaTime = time - this.lastUpdateTime;
      //this.lastUpdateTime = time;
      if (this.panningActive)
      {
        var delta = (this.viewportTargetPos - this.lastViewportTargetPos);
        this.lastViewportTargetPos = this.viewportTargetPos;

        var velocity = Math.abs(delta);
        this.currentVelocity += (velocity - this.currentVelocity) * .3 * 4;
        this.currentVelocity = Math.min(170, this.currentVelocity);
        this.currentDirection = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
      }
      else if (this.processInertia)
      {
        this.viewportTargetPos += this.currentVelocity * this.currentDirection;
        this.currentVelocity *= .9;        
      }

      //fix target position if it gets out of bounds
      this.fixTargetPosition(this.viewportTargetPos);

      var deltaPos = (this.viewportTargetPos - this.viewportPos);
      this.viewportPos += deltaPos * 0.12;

      this.updateElementPosition(this.viewportPos);
      this.event_updatePosition(this, this.viewportPos);

      if (!this.panningActive && Math.abs(deltaPos) < 0.1)
      {
        this.stopUpdate();
        this.resetVariables();
      }

      if (this.isUpdating)
      {
        this.targetElement.style.color = 'green';
        this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler);
      }
    },

    fixTargetPosition: function(){
      if (this.viewportTargetPos < -this.maxPosition)
      {
        this.viewportTargetPos = -this.maxPosition;
        this.currentVelocity = 0;
      }
      else if (this.viewportTargetPos > 0)
      {
        this.viewportTargetPos = 0;
        this.currentVelocity = 0;
      }
    },

    setTargetPosition: function(targetPosition){
      this.viewportTargetPos = targetPosition;
      this.startUpdate();
    },
    
    updateElementPosition: function(viewportPos){
      if (this.scrollType == 'vertical')
        this.targetElement.scrollTop = (-viewportPos);
      else
        this.targetElement.scrollLeft = (-viewportPos);
    }
  });


  Basis.namespace(namespace).extend({
    Scroller: Scroller
  });

})();
