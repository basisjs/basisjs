/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.event');
basis.require('basis.ui');

!function() {

 /**
  * @namespace App.Ext
  */

  var namespace = 'basis.ui.scroller';


  //
  // import names
  //

  var Class = basis.Class;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var DOM = basis.dom;
  var Event = basis.dom.event;

  var classList = basis.cssom.classList;


  //
  // Main part
  //

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


 /**
  * @class
  */
  var Scroller = Class(EventObject, {
    className: namespace + '.Scroller',

    //className: namespace + '.Scroller',
    minScrollDelta: 0,
    scrollX: true,
    scrollY: true,

    event_start: createEvent('start', 'scrollerObject'),
    event_finish: createEvent('finish', 'scrollerObject'),
    event_startInertia: createEvent('startInertia', 'scrollerObject'),
    event_updatePosition: createEvent('updatePosition', 'scrollerObject', 'scrollPosition'),

    init: function(config){
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;

      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

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
        Event.addHandler(this.targetElement, 'mousedown', this.onMouseDown, this);
        Event.addHandler(this.targetElement, 'touchstart', this.onMouseDown, this);
      }

      /*this.onMouseMoveHandler = this.onMouseMove.bind(this);
      this.onMouseUpHandler = this.onMouseUp.bind(this);*/
      this.onUpdateHandler = this.onUpdate.bind(this);

      /*if (this.scrollPropertyType == 'scroll')
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
      }*/

      this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePosition_styleTransform : this.updatePosition_styleTopLeft;

      if (this.minScrollDelta == 0)
      {
        this.minScrollDeltaYReached = true;
        this.minScrollDeltaXReached = true;
      }
    },

    /*updatePosition_scrollTopLeft: function(){
      if (this.scrollX)
        this.targetElement.scrollLeft = this.viewportX;
      if (this.scrollY)
        this.targetElement.scrollTop = this.viewportY;
    },*/
    
    updatePosition_styleTopLeft: function(){
      if (this.scrollX)
        this.targetElement.style.left = -this.viewportX + 'px';
      if (this.scrollY)
        this.targetElement.style.top = -this.viewportY + 'px';
    },

    updatePosition_styleTransform: function(){
      var deltaX = -(this.isUpdating ? this.viewportX : Math.round(this.viewportX)) + 'px';
      var deltaY = -(this.isUpdating ? this.viewportY : Math.round(this.viewportY)) + 'px';

      /*var style = {};
      style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
      DOM.setStyle(this.targetElement, style);*/

      this.targetElement.style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
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

      /*if (this.targetElement.offsetWidth)
        this.calcDimentions();*/

      /*this.startViewportX = this.viewportX;
      this.startViewportY = this.viewportY;*/

      this.isUpdating = true;
      this.updateFrameHandle = this.nextFrame();
      this.lastUpdateTime = Date.now();

      //this.startTime = this.lastUpdateTime;

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

      this.lastMotionUpdateTime = Date.now();

      Event.addHandler(document, 'mousemove', this.onMouseMove, this);
      Event.addHandler(document, 'touchmove', this.onMouseMove, this);
      Event.addHandler(document, 'mouseup', this.onMouseUp, this);
      Event.addHandler(document, 'touchend', this.onMouseUp, this);

      //Event.kill(event);
      Event.cancelDefault(event);
    },

    onMouseMove: function(event){
      if (this.minScrollDelta == 0 || this.minScrollDeltaYReached || this.minScrollDeltaXReached)
      {
        this.startUpdate();
      }

      var time = Date.now();
      var deltaTime = time - this.lastMotionUpdateTime;
      this.lastMotionUpdateTime = time;

      if (!deltaTime)
        return;
     
      if (this.minScrollDeltaXReached || !this.minScrollDeltaYReached)
      {
        var curMouseX = Event.mouseX(event)
        var deltaX = this.lastMouseX - curMouseX;
        this.lastMouseX = curMouseX;
        this.viewportTargetX += deltaX;

        /*if (deltaX)
        {
          this.currentVelocityX = Math.abs(deltaX) / deltaTime;
          this.currentDirectionX = deltaX == 0 ? 0 : (deltaX < 0 ? -1 : 1);

          console.log('deltaX: ' + Math.abs(deltaX));
          console.log('time: ' + deltaTime);
          console.log('velocity: ' + this.currentVelocityX);
        }*/
      }

      if (this.minScrollDeltaYReached || !this.minScrollDeltaXReached)
      {
        var curMouseY = Event.mouseY(event)
        var deltaY = this.lastMouseY - curMouseY;
        this.lastMouseY = curMouseY;
        this.viewportTargetY += deltaY;
        
        /*if (deltaY)
        {
          this.currentVelocityY = Math.abs(deltaY) / deltaTime;
          this.currentDirectionY = deltaY == 0 ? 0 : (deltaY < 0 ? -1 : 1);
        }*/
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
    },

    onMouseUp: function(){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdateTime;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdateTime = 0;
      

      //var distance = this.viewportTargetX - this.startViewportX;
      //var time = timeNow - this.startTime;
      //console.log('distance: ' + distance);
      //console.log('time: ' + time);
      /*if (time)
        console.log('expected speed: ' + (Math.abs(distance) / time));
      else
        console.log('zero time');*/

      //console.log('real speed: ' + this.currentVelocityX);

      if (this.scrollX)
      {
        // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia
        this.currentVelocityX *= 1 - Math.min(1, Math.max(0, deltaTime / 100));
        //console.log('inertia speed: ' + this.currentVelocityX);
      }


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

        //console.log('update');
        //console.log(time);
        if (this.scrollX)
        {
          delta = (this.viewportTargetX - this.lastViewportTargetX);
          this.lastViewportTargetX = this.viewportTargetX;

          if (delta)
          {
            this.currentVelocityX = Math.abs(delta) / deltaTime;
            this.currentDirectionX = delta == 0 ? 0 : (delta < 0 ? -1 : 1);

            /*
            console.log('deltaX: ' + Math.abs(delta));
            console.log('time: ' + deltaTime);
            console.log('velocity: ' + this.currentVelocityX);
            */
          }
        }

        if (this.scrollY)
        {
          delta = (this.viewportTargetY - this.lastViewportTargetY);
          this.lastViewportTargetY = this.viewportTargetY;

          if (delta)
          {
            this.currentVelocityY = Math.abs(delta) / deltaTime;
            this.currentDirectionY = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }
      }
      else if (this.processInertia)
      {
        if (this.scrollX)
        {
          //console.log(this.currentVelocityX);
          this.viewportTargetX += this.currentDirectionX * (this.currentVelocityX *  deltaTime);
          this.currentVelocityX *= VELOCITY_DECREASE_FACTOR;

          /*if (this.currentVelocityX < 0.001)
            this.currentVelocityX = 0;*/
        }

        if (this.scrollY)
        {
          this.viewportTargetY += this.currentDirectionY * (this.currentVelocityY *  deltaTime);
          this.currentVelocityY *= VELOCITY_DECREASE_FACTOR;

          /*if (this.currentVelocityY < 0.001)
            this.currentVelocityY = 0;*/
        }

        /*if (this.currentVelocityX == 0 && this.currentVelocityY == 0)
        {
          this.processInertia = false;          
        }*/
      }

      var deltaX = 0;
      var deltaY = 0;

      
      if (this.scrollX)
      {
        deltaX = (this.viewportTargetX - this.viewportX);
        var smoothingFactorX = this.panningActive || this.currentVelocityX > 0 ? 1 : 0.12;
        this.viewportX += deltaX * smoothingFactorX;
      }
      //console.log(this.scrollX);
      //console.log(this.viewportX);

      if (this.scrollY)
      {
        deltaY = (this.viewportTargetY - this.viewportY);
        var smoothingFactorY = this.panningActive || this.currentVelocityY > 0 ? 1 : 0.12;
        this.viewportY += deltaY * smoothingFactorY;
      }

      var scrollXStop = !this.scrollX || (/*this.currentVelocityX < 0.01 &&*/ Math.abs(deltaX) < 0.5);
      var scrollYStop = !this.scrollY || (/*this.currentVelocityY < 0.01 &&*/ Math.abs(deltaY) < 0.5);

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

      /*console.log(this.viewportX);
      console.log(this.currentVelocityX);*/
    },

    nextFrame: function(){
      if (this.isUpdating)
        this.updateFrameHandle = requestAnimFrame(this.onUpdateHandler, this.targetElement);
    },

    setPositionX: function(positionX, smooth){
      if (smooth)
      {
        this.viewportTargetX = positionX || 0;
        this.currentVelocityX = 0;
        this.startUpdate();
      }
      else
      {
        this.stopUpdate();
        this.viewportX = positionX;
        this.viewportTargetX = positionX;
        this.updateElementPosition();
      }
    },

    setPositionY: function(positionY, smooth){
      if (smooth)
      {
        this.viewportTargetY = positionY || 0;
        this.currentVelocityY = 0;
        this.startUpdate();
      }
      else
      {
        this.stopUpdate();
        this.viewportY = positionY;
        this.viewportTargetY = positionY;
        this.updateElementPosition();
      }
    },

    /*setTargetPosition: function(targetPositionX, targetPositionY){
      this.viewportTargetX = targetPositionX || 0;
      this.viewportTargetY = targetPositionY || 0;
      this.startUpdate();
      this.processInertia = true;
    }, */

    calcExpectedPosition: function(axis){
      var expectedInertiaDelta = 0;

      var currentVelocity = axis == 'x' ? this.currentVelocityX : this.currentVelocityY;
      var currentDirection = axis == 'x' ? this.currentDirectionX : this.currentDirectionY;
      var viewportTargetPosition = axis == 'x' ? this.viewportTargetX : this.viewportTargetY;

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

      return expectedPosition;
    },
    calcExpectedPositionX: function(){
      return this.calcExpectedPosition('x');
    },
    calcExpectedPositionY: function(){
      return this.calcExpectedPosition('y');
    }
  });

 /**
  * @class
  */
  var Scrollbar = Class(basis.ui.Node, {
    className: namespace + '.Scrollbar',

    cssClassName: 'Basis-ScrollPanel-Scrollbar',

    template: 
      '<div class="Basis-Scrollbar">' +
        '<div{trackElement} class="Basis-Scrollbar-Track"></div>' +
      '</div>',

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);

      this.startProperty = this.type == 'horizontal' ? 'left' : 'top';
      this.endProperty = this.type == 'horizontal' ? 'right' : 'bottom';

      classList(this.element).add(this.type);
    },

    recalcSize: function(sizePercentage){
      DOM.display(this.element, sizePercentage < 1);

      var scrollbarSize = this.type == 'horizontal' ?  this.element.offsetWidth : this.element.offsetHeight;
      this.trackSize = scrollbarSize - scrollbarSize * sizePercentage;
    },

    updatePosition: function(positionPercentage){
      var startPosition = this.trackSize  * positionPercentage;
      var endPosition = this.trackSize - this.trackSize  * positionPercentage;

      if (startPosition < 0)
        startPosition = 0;

      if (endPosition < 0)
        endPosition = 0;

      var style = {};
      style[this.startProperty] = startPosition + 'px';
      style[this.endProperty] = endPosition + 'px';
      
      DOM.setStyle(this.tmpl.trackElement, style);
    }
  });

 /**
  * @class
  */
  var ScrollPanel = Class(basis.ui.Container, {
    className: namespace + '.ScrollPanel',

    useScrollbars: true,
    scrollX: true, 
    scrollY: true,
    wheelDelta: 40,

    event_realign: createEvent('realign'),

    template: 
      '<div{element} class="Basis-ScrollPanel" event-mousewheel="onwheel">' +
        '<div{scrollElement|childNodesElement|content} class="Basis-ScrollPanel-Content"></div>' +
      '</div>',


    action: {
      onwheel: function(event){
        var delta = Event.wheelDelta(event);

        if (this.scrollX)
          this.scroller.setPositionX(this.scroller.viewportTargetX - this.wheelDelta * delta, true);
        else if (this.scrollY)
          this.scroller.setPositionY(this.scroller.viewportTargetY - this.wheelDelta * delta, true);
      }
    },

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);

      //init variables
      this.minPositionX = 0;
      this.minPositionY = 0;

      this.maxPositionX = 0;
      this.maxPositionY = 0;

      this.oldOffsetWidth = 0;
      this.oldOffsetHeight = 0;

      // create scroller
      var scrollerConfig = Object.extend(this.scroller || {}, {
        targetElement: this.tmpl.scrollElement,
        scrollX: this.scrollX,
        scrollY: this.scrollY
      });

      this.scroller = new Scroller(scrollerConfig);

      this.scroller.addHandler({
        updatePosition: this.scrollUpdatePosition
      }, this);

      // add resize handler
      basis.layout.addBlockResizeHandler(this.tmpl.scrollElement, this.realign.bind(this));

      if (this.useScrollbars)
      {
        if (this.scrollX)
        {
          this.hScrollbar = new Scrollbar({
            type: 'horizontal',
            container: this.element
          });
        }
        
        if (this.scrollY)
        {
          this.vScrollbar = new Scrollbar({
            type: 'vertical',
            container: this.element
          });
        }

        this.scroller.addHandler({
          start: function(){
            classList(this.element).add('scrollProcess');
          },
          finish: function(){
            classList(this.element).remove('scrollProcess');
          }
        }, this);
      }
    },

    scrollUpdatePosition: function(){
      var scroller = this.scroller;
      if (!scroller.panningActive)
      {
        this.fixPosition();
        /*if (scroller.scrollX)
        {
          if (scroller.viewportX < this.minPositionX || scroller.viewportX > this.maxPositionX)
          {
            scroller.viewportTargetX = Math.min(this.maxPositionX, Math.max(this.minPositionX, scroller.viewportTargetX));
            scroller.currentVelocityX = 0;
            scroller.startUpdate();
          }
        }

        if (scroller.scrollY)
        {
          if (scroller.viewportY < this.minPositionY || scroller.viewportY > this.maxPositionY)
          {
            scroller.viewportTargetY = Math.min(this.maxPositionY, Math.max(this.minPositionY, scroller.viewportTargetY));
            scroller.currentVelocityY = 0;
            scroller.startUpdate();
          }          
        }*/

        //scroller.startUpdate();
      }

      if (this.useScrollbars)
      {
        if (this.scrollX)
          this.hScrollbar.updatePosition(scroller.viewportX / this.maxPositionX);

        if (this.scrollY)
          this.vScrollbar.updatePosition(scroller.viewportY / this.maxPositionY);
      }
    },

    fixPosition: function(){
      var scroller = this.scroller;

      /*var positionX = scroller.viewportX;
      var positionY = scroller.viewportY;
      var needFix = false;*/

      if (this.scrollX && (scroller.viewportX < this.minPositionX || scroller.viewportX > this.maxPositionX))
      {
        var positionX = Math.min(this.maxPositionX, Math.max(this.minPositionX, scroller.viewportX));
        //needFix = true;
        scroller.setPositionX(positionX, true);
      }

      if (this.scrollY && (scroller.viewportY < this.minPositionY || this.scroller.viewportY > this.maxPositionY))
      {
        var positionY = Math.min(this.maxPositionY, Math.max(this.minPositionY, scroller.viewportY));
        scroller.setPositionY(positionY, true);
        //needFix = true;
      }

      /*if (needFix)
        scroller.setPosition(positionX, positionY, smooth);*/
    },

    realign: function(){
      this.calcDimentions();

      this.scrollUpdatePosition();
      this.event_realign();
    },
    
    calcDimentions: function(){
      if (!this.element.parentNode)
        return;

      if (this.scrollX)
      {
        //DOM.setStyle(this.tmpl.scrollElement, { overflowX: 'hidden' });

        var containerWidth = this.element.offsetWidth;
        var scrollWidth = this.tmpl.scrollElement.scrollWidth;
        this.maxPositionX = Math.max(0, scrollWidth - containerWidth);

        //DOM.setStyle(this.tmpl.scrollElement, { overflowX: 'visible' });
      }

      if (this.scrollY)
      {
        var containerHeight = this.element.offsetHeight;
        var scrollHeight = this.tmpl.scrollElement.scrollHeight;
        this.maxPositionY = Math.max(0, scrollHeight - containerHeight);
      }

      //var scrollX = !this.preventScrollX && this.maxPositionX > 0;

      //var scrollY = !this.preventScrollY && this.maxPositionY > 0;

      if (this.useScrollbars)
      {
        /*DOM.display(this.hScrollbar.element, scrollX);
        DOM.display(this.vScrollbar.element, scrollY);*/

        if (this.scrollX)
          this.hScrollbar.recalcSize(containerWidth / scrollWidth);

        if (this.scrollY)
          this.vScrollbar.recalcSize(containerHeight / scrollHeight);
      }

      /*this.scroller.scrollX = scrollX;
      this.scroller.scrollY = scrollY;*/
    },

    destroy: function(){
      this.scroller.destroy();

      basis.ui.Node.prototype.destroy.call(this);
    }
  });



  //
  // export names
  //

  basis.namespace(namespace).extend({
    Scroller: Scroller,
    Scrollbar: Scrollbar,
    ScrollPanel: ScrollPanel
  });

}(basis);
