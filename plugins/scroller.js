
(function() {

 /**
  * @namespace App.Ext
  */
  var namespace = 'Basis.Plugin';

  var DOM = Basis.DOM;
  var EventObject = Basis.EventObject;
  var Class = Basis.Class;
  var Event = Basis.Event;

  function getComputedStyle(element, styleProp){
    if (window.getComputedStyle)
    {
      var computedStyle = document.defaultView.getComputedStyle(element, null);
      if (computedStyle)
        return computedStyle.getPropertyValue(styleProp);
    }
    else
    {
      if (element.currentStyle)
        return element.currentStyle[styleProp];
    }
  }

  //css transform/transform3d feature detection
  var TRANSFORM_SUPPORT = false;
  var TRANSFORM_3D_SUPPORT = false;
  var TRANSFORM_PROPERTY_NAME;
  
  (function (){
    
    function testProps(element, properties) {
      var p;
      while (p = properties.shift()) {
        if (typeof element.style[p] != 'undefined') 
          return p;
      }
      return false;
    }

    var tester = DOM.createElement('');

    TRANSFORM_PROPERTY_NAME = testProps(tester, [
      'transform',
      'WebkitTransform',
      'msTransform',
      'MozTransform',
      'OTransform'
    ]);

    if (TRANSFORM_PROPERTY_NAME)
      TRANSFORM_SUPPORT = true;

    //transform3d
    if (TRANSFORM_SUPPORT)
    {
      var prop = testProps(tester, [
        'perspectiveProperty', 
        'WebkitPerspective', 
        'MozPerspective', 
        'OPerspective', 
        'msPerspective'
      ]);

      if (prop || 'webkitPerspective' in document.documentElement.style)
        TRANSFORM_3D_SUPPORT = true;
    }
  })();

  //requestAnimationFrame features
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

  //consts
  var AVARAGE_TICK_TIME_INTERVAl = 15;
  var VELOCITY_DECREASE_FACTOR = 0.94;

  //class
  var Scroller = Class(EventObject, {
    /*minScrollDeltaX: 0,
    minScrollDeltaY: 0,*/
    minScrollDelta: 0,
    scrollX: true,
    scrollY: true,
    scrollPropertyType: 'style',

    event_start: EventObject.createEvent('start', 'scrollerObject'),
    event_finish: EventObject.createEvent('finish', 'scrollerObject'),
    event_startInertia: EventObject.createEvent('startInertia', 'scrollerObject'),
    event_updatePosition: EventObject.createEvent('updatePosition', 'scrollerObject', 'scrollPosition'),

    init: function(config){
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;

      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.minPositionX = 0;
      this.minPositionY = 0;

      this.maxPositionX = 0;
      this.maxPositionY = 0;

      this.viewportX = 0;
      this.viewportY = 0;

      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      this.lastViewportTargetX = this.viewportX;
      this.lastViewportTargetY = this.viewportY;

      //time
      this.updateFrameHandle = 0;
      this.lastMotionUpdateTime = 0;
      this.lastUpdateTime = 0;
      this.startTime = 0;

      //statuses
      this.processInertia = false;
      this.panningActive = false;

      //init
      EventObject.prototype.init.call(this, config);

      if (this.targetElement)
      {
        Event.addHandler(this.targetElement, 'mousedown', this.onMouseDown.bind(this));
        Event.addHandler(this.targetElement, 'touchstart', this.onMouseDown.bind(this));
      }

      /*this.onMouseMoveHandler = this.onMouseMove.bind(this);
      this.onMouseUpHandler = this.onMouseUp.bind(this);*/
      this.onUpdateHandler = this.onUpdate.bind(this);

      if (this.scrollPropertyType == 'scroll')
      {
        DOM.setStyle(this.targetElement, { overflow: 'hidden' }); 
        this.updateElementPosition = this.updatePosition_scrollTopLeft;
        this.calcDimentions = this.calcDimentions_scrollTopLeft;
      }
      else
      {
        DOM.setStyle(this.targetElement, { position: 'relative' });
        this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePosition_styleTransform : this.updatePosition_styleTopLeft;
        this.calcDimentions = this.calcDimentions_styleTopLeft;
      }

      if (this.minScrollDelta == 0)
      {
        this.minScrollDeltaYReached = true;
        this.minScrollDeltaXReached = true;
      }
    },

    updatePosition_scrollTopLeft: function(){
      if (this.scrollX)
        this.targetElement.scrollLeft = this.viewportX;
      if (this.scrollY)
        this.targetElement.scrollTop = this.viewportY;
    },
    
    updatePosition_styleTopLeft: function(){
      if (this.scrollX)
        this.targetElement.style.left = -this.viewportX + 'px';
      if (this.scrollY)
        this.targetElement.style.top = -this.viewportY + 'px';
    },

    updatePosition_styleTransform: function(){
      var deltaX = Math.round(-this.viewportX) + 'px';
      var deltaY = Math.round(-this.viewportY) + 'px';

      var style = {};
      if (TRANSFORM_SUPPORT/* && this.isUpdating*/)
      {
        //style.left = 0;
        //style.top = 0;
        style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
      }
      /*else
      {
        style[TRANSFORM_PROPERTY_NAME] = '';
        if (this.scrollX)
          style.left = deltaX;

        if (this.scrollY)
          style.top = deltaY;
      }*/

      DOM.setStyle(this.targetElement, style);
    },

    calcDimentions_scrollTopLeft: function(){
      this.minPositionX = 0;
      this.maxPositionX = this.targetElement.scrollWidth - this.targetElement.offsetWidth;
      if (this.maxPositionX <= 0)
        this.scrollX = false;

      this.minPositionY = 0;
      this.maxPositionY = this.targetElement.scrollHeight - this.targetElement.offsetHeight;
      if (this.maxPositionY <= 0)
        this.scrollY = false;
    },

    calcDimentions_styleTopLeft: function(){
      this.minPositionX = 0;
      this.minPositionY = 0;

      //DOM.setStyle(this.targetElement, { overflow: 'hidden' });

      var scrollWidth = this.targetElement.scrollWidth;
      var scrollHeight = this.targetElement.scrollHeight;

      var offsetParent = this.targetElement.offsetParent;
      var offsetParentWidth = offsetParent.offsetWidth;
      var offsetParentHeight = offsetParent.offsetHeight;
      
      this.maxPositionX = this.targetElement.scrollWidth - offsetParent.offsetWidth;
      if (this.maxPositionX <= 0)
        this.scrollX = false;

      this.maxPositionY = this.targetElement.scrollHeight - offsetParent.offsetHeight;
      if (this.maxPositionY <= 0)
        this.scrollY = false;

      //DOM.setStyle(this.targetElement, { overflow: 'visible' });

    },

    resetVariables: function(){
      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      this.lastViewportTargetX = this.viewportTargetX;
      this.lastViewportTargetY = this.viewportTargetY;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;
      
      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.minScrollDeltaXReached = false;
      this.minScrollDeltaYReached = false;

      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      if (this.targetElement.offsetWidth)
        this.calcDimentions();

      this.startViewportX = this.viewportX;
      this.startViewportY = this.viewportY;

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

      this.updateElementPosition();

      this.event_finish(this);
    },

    onMouseDown: function(event){
      this.stopUpdate();

      this.panningActive = true;

      this.lastMouseX = Event.mouseX(event);
      this.lastMouseY = Event.mouseY(event);

      Event.addHandler(document, 'mousemove', this.onMouseMove, this);
      Event.addHandler(document, 'touchmove', this.onMouseMove, this);
      Event.addHandler(document, 'mouseup', this.onMouseUp, this);
      Event.addHandler(document, 'touchend', this.onMouseUp, this);

      //Event.kill(event);
      Event.cancelDefault(event);
    },

    onMouseMove: function(event){

      if (this.minScrollDeltaXReached || !this.minScrollDeltaYReached)
      {
        var curMouseX = Event.mouseX(event)
        var deltaX = this.lastMouseX - curMouseX;
        this.lastMouseX = curMouseX;
        this.viewportTargetX += deltaX;
        this.currentDirectionX = deltaX == 0 ? 0 : (deltaX < 0 ? -1 : 1);
      }

      if (this.minScrollDeltaYReached || !this.minScrollDeltaXReached)
      {
        var curMouseY = Event.mouseY(event)
        var deltaY = this.lastMouseY - curMouseY;
        this.lastMouseY = curMouseY;
        this.viewportTargetY += deltaY;
        this.currentDirectionY = deltaY == 0 ? 0 : (deltaY < 0 ? -1 : 1);
      }

      if (this.minScrollDelta > 0)
      {
        if (!this.minScrollDeltaXReached && !this.minScrollDeltaYReached)
        {
          if (Math.abs(this.viewportTargetX - this.viewportX) > this.minScrollDelta)
            this.minScrollDeltaXReached = true;

          if (Math.abs(this.viewportTargetY - this.viewportY) > this.minScrollDelta)
            this.minScrollDeltaYReached = true;          

          if (this.minScrollDeltaYReached)
          {
            this.viewportTargetX = this.viewportX;
            this.currentDirectionX = 0;
          }

          if (this.minScrollDeltaXReached)
          {
            this.viewportTargetY = this.viewportY;
            this.currentDirectionY = 0;
          }
        }
      }
      
      if (this.minScrollDelta == 0 || this.minScrollDeltaYReached || this.minScrollDeltaXReached)
      {
        this.startUpdate();
      }
      
      //console.log('x:' + this.minScrollDeltaXReached)
      //console.log('y:' + this.minScrollDeltaYReached);


      this.lastMotionUpdateTime = Date.now();
    },

    onMouseUp: function(){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdateTime;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdateTime = 0;
      
      // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia
      if (this.scrollX)
        this.currentVelocityX *= 1 - Math.min(1, Math.max(0, deltaTime / 100));
      if (this.scrollY)
        this.currentVelocityY *= 1 - Math.min(1, Math.max(0, deltaTime / 100));

      Event.removeHandler(document, 'mousemove', this.onMouseMove, this);
      Event.removeHandler(document, 'touchmove', this.onMouseMove, this);
      Event.removeHandler(document, 'mouseup',   this.onMouseUp, this);
      Event.removeHandler(document, 'touchend',  this.onMouseUp, this);

      this.event_startInertia(this);
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
        var delta;

        if (this.scrollX/* && this.minScrollDeltaXReached*/)
        {
          delta = (this.viewportTargetX - this.lastViewportTargetX);
          this.lastViewportTargetX = this.viewportTargetX;

          this.currentVelocityX = Math.abs(delta) / deltaTime;
          this.currentDirectionX = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
        }

        if (this.scrollY/* && this.minScrollDeltaYReached*/)
        {
          delta = (this.viewportTargetY - this.lastViewportTargetY);
          this.lastViewportTargetY = this.viewportTargetY;

          this.currentVelocityY = Math.abs(delta) / deltaTime;
          this.currentDirectionY = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
        }
      }
      else if (this.processInertia)
      {
        if (this.scrollX)
        {
          this.viewportTargetX += this.currentDirectionX * (this.currentVelocityX *  deltaTime);
          this.currentVelocityX *= VELOCITY_DECREASE_FACTOR;

          if (this.currentVelocityX < 0.001 || this.viewportX < this.minPositionX || this.viewportX > this.maxPositionX)
          {
            this.viewportTargetX = Math.min(this.maxPositionX, Math.max(this.minPositionX, this.viewportTargetX));
            this.currentVelocityX = 0;
          }
        }

        if (this.scrollY)
        {
          this.viewportTargetY += this.currentDirectionY * (this.currentVelocityY *  deltaTime);
          this.currentVelocityY *= VELOCITY_DECREASE_FACTOR;

          if (this.currentVelocityY < 0.001 || this.viewportY < this.minPositionY || this.viewportY > this.maxPositionY)
          {
            this.viewportTargetY = Math.min(this.maxPositionY, Math.max(this.minPositionY, this.viewportTargetY));
            this.currentVelocityY = 0;
          }          
        }

        if (this.currentVelocityX == 0 && this.currentVelocityY == 0)
          this.processInertia = false;          
      }

      var deltaX = 0;
      var deltaY = 0;

      if (this.scrollX)
      {
        deltaX = (this.viewportTargetX - this.viewportX);
        var smoothingFactorX = this.panningActive || this.currentVelocityX > 0 ? 1 : 0.12;
        this.viewportX += deltaX * smoothingFactorX;
      }

      if (this.scrollY)
      {
        deltaY = (this.viewportTargetY - this.viewportY);
        var smoothingFactorY = this.panningActive || this.currentVelocityY > 0 ? 1 : 0.12;
        this.viewportY += deltaY * smoothingFactorY;
      }

      var scrollXStop = !this.scrollX || (this.currentVelocityX < 0.001 && Math.abs(deltaX) < 0.1);
      var scrollYStop = !this.scrollY || (this.currentVelocityY < 0.001 && Math.abs(deltaY) < 0.1);

      if (!this.panningActive && scrollXStop && scrollYStop)
      {
        if (this.scrollX)
          this.viewportX = this.viewportTargetX;

        if (this.scrollY)
          this.viewportY = this.viewportTargetY;

        this.stopUpdate();
      }

      this.updateElementPosition();
      this.event_updatePosition(this, time, this.viewportX, this.viewportY);

      this.nextFrame();
    },

    nextFrame: function(){
      if (this.isUpdating)
        this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler, this.targetElement);
    },

    setTargetPosition: function(targetPositionX, targetPositionY){
      this.viewportTargetX = targetPositionX || 0;
      this.viewportTargetY = targetPositionY || 0;
      this.startUpdate();
      this.processInertia = true;
    },

    calcExpectedPosition: function(axis){
      var expectedInertiaDelta = 0;

      var currentVelocity = axis == 'x' ? this.currentVelocityX : this.currentVelocityY;
      var currentDirection = axis == 'x' ? this.currentDirectionX : this.currentDirectionY;
      var viewportTargetPosition = axis == 'x' ? this.viewportTargetX : this.viewportTargetY;
      var minPosition = axis == 'x' ? this.minPositionX : this.minPositionY;
      var maxPosition = axis == 'x' ? this.maxPositionX : this.maxPositionY;

      if (currentVelocity)
      {
        var expectedInertiaIterationCount = Math.log(0.001 / currentVelocity) / Math.log(VELOCITY_DECREASE_FACTOR);
        var velocity = currentVelocity;
        for (var i = 0; i < expectedInertiaIterationCount; i++)
        {
          expectedInertiaDelta += currentDirection * velocity * AVARAGE_TICK_TIME_INTERVAl;
          velocity *= VELOCITY_DECREASE_FACTOR;
        }
      }
      var expectedPosition = viewportTargetPosition + expectedInertiaDelta;

      return Math.max(minPosition, Math.min(maxPosition, expectedPosition));
    },
    calcExpectedPositionX: function(){
      return this.calcExpectedPosition('x');
    },
    calcExpectedPositionY: function(){
      return this.calcExpectedPosition('y');
    }
  });


  Basis.namespace(namespace).extend({
    Scroller: Scroller
  });

})();
