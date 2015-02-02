
 /**
  * @see ./demo/defile/scroller.html
  * @namespace basis.ui.scroller
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var Event = require('basis.dom.event');
  var cssom = require('basis.cssom');
  var anim = require('basis.animation');
  var basisEvent = require('basis.event');
  var createEvent = basisEvent.create;
  var Emitter = basisEvent.Emitter;
  var listenResize = require('basis.dom.resize').add;
  var Node = require('basis.ui').Node;


  //
  // definitions
  //

  var templates = require('basis.template').define(namespace, {
    Scrollbar: resource('./templates/scroller/Scrollbar.tmpl'),
    ScrollPanel: resource('./templates/scroller/ScrollPanel.tmpl'),
    ScrollGalleryItem: resource('./templates/scroller/ScrollGalleryItem.tmpl')
  });


  //
  // Main part
  //

  // constants
  var AVERAGE_TICK_TIME_INTERVAL = 15;
  var VELOCITY_DECREASE_FACTOR = 0.94;
  var MOVE_THRESHOLD = 5;

  // css transform/transform3d feature detection
  var TRANSFORM_SUPPORT = false;
  var TRANSFORM_3D_SUPPORT = false;
  var TRANSFORM_PROPERTY_NAME;

  (function(){
    var style = document.createElement('div').style;

    function testProps(properties){
      for (var i = 0, propertyName; propertyName = properties[i]; i++)
        if (typeof style[propertyName] != 'undefined')
          return propertyName;

      return false;
    }

    TRANSFORM_PROPERTY_NAME = testProps([
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
      var prop = testProps([
        'perspectiveProperty',
        'WebkitPerspective',
        'MozPerspective',
        'OPerspective',
        'msPerspective'
      ]);

      if (prop || 'webkitPerspective' in style)
        TRANSFORM_3D_SUPPORT = true;
    }
  })();


 /**
  * @class
  */
  var Scroller = Emitter.subclass({
    className: namespace + '.Scroller',

    minScrollDelta: 0,
    scrollX: true,
    scrollY: true,
    panning: true,

    emit_start: createEvent('start'),
    emit_finish: createEvent('finish'),
    emit_startInertia: createEvent('startInertia'),
    emit_updatePosition: createEvent('updatePosition', 'scrollPosition'),

    init: function(){
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;

      this.viewportX = 0;
      this.viewportY = 0;

      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      //this.lastViewportTargetX = this.viewportX;
      //this.lastViewportTargetY = this.viewportY;
      if (this.minScrollDelta == 0)
      {
        this.minScrollDeltaYReached = true;
        this.minScrollDeltaXReached = true;
      }

      //time
      this.updateFrameHandle = 0;
      this.lastMotionUpdateTime = 0;
      this.lastUpdateTime = 0;
      this.startTime = 0;

      //statuses
      this.processInertia = false;
      this.panningActive = false;

      //init
      Emitter.prototype.init.call(this);

      if (this.targetElement)
      {
        var element = this.targetElement;
        this.targetElement = null;
        this.setElement(element);
      }

      this.onUpdateHandler = this.onUpdate.bind(this);

      this.updateElementPosition = TRANSFORM_SUPPORT ? this.updatePositionByTransform : this.updatePositionByTopLeft;
    },
    setElement: function(element){
      if (this.targetElement && this.panning)
        this.removeTargetElementHandlers();

      this.targetElement = element;

      if (this.targetElement && this.panning)
        this.addTargetElementHandlers();
    },
    setPanning: function(panning){
      panning = !!panning;

      if (this.panning != panning)
      {
        this.panning = panning;

        if (panning)
          this.addTargetElementHandlers();
        else
          this.removeTargetElementHandlers();
      }
    },
    addTargetElementHandlers: function(){
      Event.addHandler(this.targetElement, 'mousedown', this.onMouseDown, this);
      Event.addHandler(this.targetElement, 'touchstart', this.onMouseDown, this);
    },
    removeTargetElementHandlers: function(){
      Event.removeHandler(this.targetElement, 'mousedown', this.onMouseDown, this);
      Event.removeHandler(this.targetElement, 'touchstart', this.onMouseDown, this);
    },

    updatePositionByTopLeft: function(){
      if (this.scrollX)
        this.targetElement.style.left = -this.viewportX + 'px';
      if (this.scrollY)
        this.targetElement.style.top = -this.viewportY + 'px';
    },

    updatePositionByTransform: function(){
      var deltaX = -(this.isUpdating ? this.viewportX : Math.round(this.viewportX)) + 'px';
      var deltaY = -(this.isUpdating ? this.viewportY : Math.round(this.viewportY)) + 'px';

      this.targetElement.style[TRANSFORM_PROPERTY_NAME] = 'translate(' + deltaX + ', ' + deltaY + ')' + (TRANSFORM_3D_SUPPORT ? ' translateZ(0)' : '');
    },

    resetVariables: function(){
      this.viewportTargetX = this.viewportX;
      this.viewportTargetY = this.viewportY;

      //this.lastViewportTargetX = this.viewportTargetX;
      //this.lastViewportTargetY = this.viewportTargetY;

      this.startX = this.viewportX;
      this.startY = this.viewportY;

      this.currentVelocityX = 0;
      this.currentVelocityY = 0;

      this.currentDirectionX = 0;
      this.currentDirectionY = 0;

      if (this.minScrollDelta != 0)
      {
        this.minScrollDeltaXReached = false;
        this.minScrollDeltaYReached = false;
      }

      this.processInertia = false;
    },

    startUpdate: function(){
      if (this.isUpdating)
        return;

      this.isUpdating = true;
      this.lastUpdateTime = Date.now();
      this.updateFrameHandle = this.nextFrame();

      this.emit_start();
    },

    stopUpdate: function(){
      if (!this.isUpdating)
        return;

      this.resetVariables();

      this.isUpdating = false;
      anim.cancelAnimationFrame(this.updateFrameHandle);

      this.updateElementPosition();

      this.emit_finish();

      Event.releaseEvent('click');
    },

    onMouseDown: function(event){
      this.stopUpdate();

      this.panningActive = true;
      this.isMoved = false;

      this.lastMouseX = event.mouseX;
      this.lastMouseY = event.mouseY;

      this.lastMotionUpdateTime = Date.now();

      Event.addGlobalHandler('mousemove', this.onMouseMove, this);
      Event.addGlobalHandler('touchmove', this.onMouseMove, this);
      Event.addGlobalHandler('mouseup', this.onMouseUp, this);
      Event.addGlobalHandler('touchend', this.onMouseUp, this);

      event.preventDefault();
    },

    onMouseMove: function(event){
      if (this.minScrollDelta == 0 || this.minScrollDeltaYReached || this.minScrollDeltaXReached)
        this.startUpdate();

      var time = Date.now();
      var deltaTime = time - this.lastMotionUpdateTime;
      this.lastMotionUpdateTime = time;

      if (!deltaTime)
        return;

      if (this.minScrollDeltaXReached || !this.minScrollDeltaYReached)
      {

        var curMouseX = event.mouseX;
        var deltaX = this.lastMouseX - curMouseX;
        this.lastMouseX = curMouseX;
        this.viewportTargetX += deltaX;

        if (!this.isMoved && Math.abs(this.startX - this.viewportTargetX) > MOVE_THRESHOLD)
          this.isMoved = true;
      }

      if (this.minScrollDeltaYReached || !this.minScrollDeltaXReached)
      {
        var curMouseY = event.mouseY;
        var deltaY = this.lastMouseY - curMouseY;
        this.lastMouseY = curMouseY;
        this.viewportTargetY += deltaY;

        if (!this.isMoved && Math.abs(this.startY - this.viewportTargetY) > MOVE_THRESHOLD)
          this.isMoved = true;
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

      event.preventDefault();
    },

    onMouseUp: function(event){
      this.panningActive = false;
      this.processInertia = true;

      var timeNow = Date.now();
      var deltaTime = timeNow - this.lastMotionUpdateTime;
      deltaTime = Math.max(10, deltaTime); // low-timer granularity compensation
      this.lastMotionUpdateTime = 0;

      if (this.scrollX)
      {
        // 100msec is a full hold gesture that complete zeroes out the velocity to be used as inertia
        this.currentVelocityX *= 1 - Math.min(1, Math.max(0, deltaTime / 100));
      }

      if (this.scrollY)
        this.currentVelocityY *= 1 - Math.min(1, Math.max(0, deltaTime / 100));

      Event.removeGlobalHandler('mousemove', this.onMouseMove, this);
      Event.removeGlobalHandler('touchmove', this.onMouseMove, this);
      Event.removeGlobalHandler('mouseup', this.onMouseUp, this);
      Event.removeGlobalHandler('touchend', this.onMouseUp, this);

      if (this.minScrollDeltaXReached || this.minScrollDeltaYReached)
        Event.captureEvent('click', basis.fn.$true);

      this.emit_startInertia();
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

        if (this.scrollX)
        {
          delta = this.viewportTargetX - this.viewportX;

          if (delta)
          {
            this.currentVelocityX = delta / deltaTime;
            this.currentDirectionX = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }

        if (this.scrollY)
        {
          delta = this.viewportTargetY - this.viewportY;

          if (delta)
          {
            this.currentVelocityY = delta / deltaTime;
            this.currentDirectionY = delta == 0 ? 0 : (delta < 0 ? -1 : 1);
          }
        }
      }
      else if (this.processInertia)
      {
        if (this.scrollX)
        {
          this.viewportTargetX += (this.currentVelocityX *  deltaTime);
          this.currentVelocityX *= VELOCITY_DECREASE_FACTOR;
        }
        if (this.scrollY)
        {
          this.viewportTargetY += (this.currentVelocityY *  deltaTime);
          this.currentVelocityY *= VELOCITY_DECREASE_FACTOR;
        }
      }

      var deltaX = 0;
      var deltaY = 0;

      if (this.scrollX)
      {
        deltaX = (this.viewportTargetX - this.viewportX);
        var smoothingFactorX = this.panningActive || Math.abs(this.currentVelocityX) > 0 ? 1 : 0.12;
        this.viewportX += deltaX * smoothingFactorX;
      }
      if (this.scrollY)
      {
        deltaY = (this.viewportTargetY - this.viewportY);
        var smoothingFactorY = this.panningActive || Math.abs(this.currentVelocityY) > 0 ? 1 : 0.12;
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
      this.emit_updatePosition(time, this.viewportX, this.viewportY);

      this.nextFrame();
    },

    nextFrame: function(){
      if (this.isUpdating)
        this.updateFrameHandle = anim.requestAnimationFrame(this.onUpdateHandler, this.targetElement);
    },

    setPosition: function(positionX, positionY, instantly){
      this.setPositionX(positionX, !instantly);
      this.setPositionY(positionY, !instantly);
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
        //this.stopUpdate();
        this.resetVariables();
        this.viewportX = positionX;
        this.viewportTargetX = positionX;
        this.updateElementPosition();
        this.emit_updatePosition(Date.now(), this.viewportX, this.viewportY);
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
        //this.stopUpdate();
        this.resetVariables();
        this.viewportY = positionY;
        this.viewportTargetY = positionY;
        this.updateElementPosition();
        this.emit_updatePosition(Date.now(), this.viewportX, this.viewportY);
      }
    },

    addPositionX: function(addX, smooth){
      this.setPositionX(this.viewportX + addX, smooth);
    },
    addPositionY: function(addY, smooth){
      this.setPositionY(this.viewportY + addY, smooth);
    },

    getCurrentDirection: function(axis){
      return axis == 'x' ? this.currentDirectionX : this.currentDirectionY;
    },

    calcExpectedPosition: function(axis){
      var expectedInertiaDelta = 0;

      var currentVelocity = axis == 'x' ? this.currentVelocityX : this.currentVelocityY;
      var viewportTargetPosition = axis == 'x' ? this.viewportTargetX : this.viewportTargetY;

      if (currentVelocity)
      {
        var expectedInertiaIterationCount = Math.log(0.001 / Math.abs(currentVelocity)) / Math.log(VELOCITY_DECREASE_FACTOR);
        var velocity = currentVelocity;
        for (var i = 0; i < expectedInertiaIterationCount; i++)
        {
          expectedInertiaDelta += velocity * AVERAGE_TICK_TIME_INTERVAL;
          velocity *= VELOCITY_DECREASE_FACTOR;
        }
      }

      // return expected position
      return viewportTargetPosition + expectedInertiaDelta;
    },/*,
    calcExpectedPositionX: function(){
      return this.calcExpectedPosition('x');
    },
    calcExpectedPositionY: function(){
      return this.calcExpectedPosition('y');
    }*/
    destroy: function(){
      this.setElement();
      Emitter.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var Scrollbar = Node.subclass({
    className: namespace + '.Scrollbar',

    orientation: '',

    template: templates.Scrollbar,
    binding: {
      orientation: 'orientation'
    },

    listen: {
      owner: {
        realign: function(){
          this.realign();
        },
        updatePosition: function(){
          if (!this.trackSize)
            this.realign();

          var scrollPosition = this.getScrollbarPosition();

          if (scrollPosition > 1)
            scrollPosition = 1 + (scrollPosition - 1) * 3;
          if (scrollPosition < 0)
            scrollPosition *= 3;

          var startPosition = Math.max(0, Math.min(this.trackSize  * scrollPosition, this.scrollbarSize - 4));
          var endPosition = Math.max(0, Math.min(this.trackSize - this.trackSize  * scrollPosition, this.scrollbarSize - 4));

          var style = {};
          style[this.startProperty] = startPosition + 'px';
          style[this.endProperty] = endPosition + 'px';

          cssom.setStyle(this.tmpl.trackElement, style);
        }
      }
    },
    realign: function(){
      this.scrollbarSize = this.getScrollbarSize();
      this.trackSize = this.scrollbarSize - this.scrollbarSize * this.getScrollbarPart();
    },
    getScrollbarSize: basis.fn.$null,
    getScrollbarPart: basis.fn.$null,
    getScrollbarPosition: basis.fn.$null
  });

  /**
   * @class
   */
  var HorizontalScrollbar = Scrollbar.subclass({
    className: namespace + '.HorizontalScrollbar',
    orientation: 'horizontal',
    startProperty: 'left',
    endProperty: 'right',
    getScrollbarSize: function(){
      return this.element.offsetWidth;
    },
    getScrollbarPart: function(){
      return this.owner.element.offsetWidth / (this.owner.maxPositionX - this.owner.minPositionX + this.owner.element.offsetWidth);
    },
    getScrollbarPosition: function(){
      return (this.owner.scroller.viewportX - this.owner.minPositionX) / (this.owner.maxPositionX - this.owner.minPositionX);
    }
  });

  /**
   * @class
   */
  var VerticalScrollbar = Scrollbar.subclass({
    className: namespace + '.VerticalScrollbar',
    orientation: 'vertical',
    startProperty: 'top',
    endProperty: 'bottom',
    getScrollbarSize: function(){
      return this.element.offsetHeight;
    },
    getScrollbarPart: function(){
      return this.owner.element.offsetHeight / (this.owner.maxPositionY - this.owner.minPositionY + this.owner.element.offsetHeight);
    },
    getScrollbarPosition: function(){
      return (this.owner.scroller.viewportY - this.owner.minPositionY) / (this.owner.maxPositionY - this.owner.minPositionY);
    }
  });


  //
  // Scroller
  //

 /**
  * @class
  */
  var ScrollPanel = Node.subclass({
    className: namespace + '.ScrollPanel',

    useScrollbars: true,
    scrollX: true,
    scrollY: true,
    wheelDelta: 40,
    inertia: true,
    panning: true,

    emit_realign: createEvent('realign'),
    emit_updatePosition: createEvent('updatePosition'),

    template: templates.ScrollPanel,

    binding: {
      horizontalScrollbar: 'satellite:',
      verticalScrollbar: 'satellite:',
      bothScrollbars: function(node){
        return node.scrollX && node.scrollY ? 'bothScrollbars' : '';
      },
      scrollProcess: function(node){
        return node.scroller && node.scroller.isUpdating ? 'scrollProcess' : '';
      }
    },

    action: {
      onwheel: function(event){
        var delta = event.wheelDelta;

        if (this.scrollY)
          this.scroller.setPositionY(this.scroller.viewportTargetY - this.wheelDelta * delta, this.inertia);
        else if (this.scrollX)
          this.scroller.setPositionX(this.scroller.viewportTargetX - this.wheelDelta * delta, this.inertia);

        if (!this.inertia)
          this.updatePosition();

        event.die();
      }
    },

    satellite: {
      horizontalScrollbar: {
        satelliteClass: HorizontalScrollbar,
        existsIf: function(object){
          return object.useScrollbars && object.scrollX;
        }
      },
      verticalScrollbar: {
        satelliteClass: VerticalScrollbar,
        existsIf: function(object){
          return object.useScrollbars && object.scrollY;
        }
      }
    },

    init: function(){
      Node.prototype.init.call(this);

      //init variables
      this.minPositionX = 0;
      this.minPositionY = 0;

      this.maxPositionX = 0;
      this.maxPositionY = 0;

      // create scroller
      var scrollerConfig = basis.object.complete({
        scrollX: this.scrollX,
        scrollY: this.scrollY,
        panning: this.panning
      }, this.scroller);

      this.scroller = new Scroller(scrollerConfig);
      this.scroller.addHandler({
        updatePosition: this.updatePosition,
        start: function(){
          if (!this.maxPositionX && !this.maxPositionY)
            this.realign();

          this.updateBind('scrollProcess');
        },
        finish: function(){
          this.updateBind('scrollProcess');
        }
      }, this);
    },

    templateSync: function(){
      Node.prototype.templateSync.call(this);

      var scrollElement = this.tmpl.scrollElement || this.element;

      this.scroller.setElement(scrollElement);

      // add resize handler
      listenResize(scrollElement, this.realign, this);
    },

    updatePosition: function(){
      if (!this.scroller.panningActive)
        this.fixPosition();

      this.emit_updatePosition();
    },

    fixPosition: function(){
      var scroller = this.scroller;

      if (this.scrollX && (scroller.viewportX < this.minPositionX || scroller.viewportX > this.maxPositionX))
      {
        var positionX = Math.min(this.maxPositionX, Math.max(this.minPositionX, scroller.viewportX));
        scroller.setPositionX(positionX, this.inertia);
      }

      if (this.scrollY && (scroller.viewportY < this.minPositionY || scroller.viewportY > this.maxPositionY))
      {
        var positionY = Math.min(this.maxPositionY, Math.max(this.minPositionY, scroller.viewportY));
        scroller.setPositionY(positionY, this.inertia);
      }
    },

    realign: function(){
      if (this.element.offsetWidth)
      {
        this.calcDimensions();
        this.updatePosition();
        this.emit_realign();
      }
    },

    calcDimensions: function(){
      if (this.scrollX)
      {
        var containerWidth = this.element.offsetWidth;
        var scrollWidth = this.tmpl.scrollElement.scrollWidth;
        this.maxPositionX = Math.max(0, scrollWidth - containerWidth);
      }

      if (this.scrollY)
      {
        var containerHeight = this.element.offsetHeight;
        var scrollHeight = this.tmpl.scrollElement.scrollHeight;
        this.maxPositionY = Math.max(0, scrollHeight - containerHeight);
      }
    },

    destroy: function(){
      this.scroller.destroy();
      this.scroller = null;

      Node.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var ScrollGallery = ScrollPanel.subclass({
    className: namespace + '.ScrollGallery',

    scrollX: false,
    scrollY: false,
    childTransform: basis.fn.$null,

    selection: true,

    action: {
      onwheel: function(event){
        var delta = event.wheelDelta;
        var selected = this.selection.pick();
        var nextChild = delta == -1 ? selected.nextSibling : selected.previousSibling;

        if (nextChild)
          nextChild.select();

        event.die();
      }
    },

    emit_childNodesModified: function(delta){
      ScrollPanel.prototype.emit_childNodesModified.call(this, delta);

      if (this.scroller && this.childNodes.length == delta.inserted.length)
      {
        this.scrollToChild(this.firstChild, true);
        this.firstChild.select();
      }
    },

    childClass: Node.subclass({
      className: namespace + '.ScrollGalleryItem',

      template: templates.ScrollGalleryItem,

      action: {
        select: function(){
          if (!this.parentNode.scroller.isMoved)
            this.select();
        }
      },

      emit_select: function(){
        Node.prototype.emit_select.call(this);
        this.parentNode.scrollToChild(this);
      }
    }),

    init: function(){
      ScrollPanel.prototype.init.call(this);

      this.scroller.addHandler({
        startInertia: this.adjustPosition
      }, this);

      if (this.childTransform != basis.fn.$null)
      {
        this.scroller.addHandler({
          updatePosition: this.applyPosition
        }, this);
      }
    },

    postInit: function(){
      ScrollPanel.prototype.postInit.call(this);

      if (!this.selection.itemCount && this.firstChild)
      {
        this.firstChild.select();
        this.scrollToChild(this.firstChild, true);
      }
    },

    setPosition: function(position, instantly){
      if (this.scrollX)
        this.scroller.setPositionX(position, !instantly);
      else
        this.scroller.setPositionY(position, !instantly);
    },

    adjustPosition: function(){
      var childSize = this.scrollX ? this.firstChild.element.offsetWidth : this.firstChild.element.offsetHeight;
      var startPosition = (this.scrollX ? this.element.offsetWidth : this.element.offsetHeight) / 2;

      var newPosition = startPosition - childSize / 2 + this.calcExpectedPosition();

      var childScrollTo = Math.max(0, Math.min(this.childNodes.length - 1, Math.round(newPosition / childSize)));
      this.scrollToChild(this.childNodes[childScrollTo]);
    },

    applyPosition: function(){
      var childSize = this.scrollX ? this.firstChild.element.offsetWidth : this.firstChild.element.offsetHeight;
      var startPosition = this.scrollX ? this.element.offsetWidth / 2 : this.element.offsetHeight / 2;

      var newPosition = startPosition - childSize / 2 + (this.scroller.viewportX || this.scroller.viewportY);

      var closestChildPos = Math.floor(newPosition / childSize);
      var offset = newPosition / childSize - closestChildPos;

      var closeness;
      for (var i = 0, child; child = this.childNodes[i]; i++)
      {
        closeness = i == closestChildPos ? 1 - offset : (i == closestChildPos + 1 ? offset : 0);
        this.childTransform(child, closeness);
      }
    },

    scrollToChild: function(child, instantly){
      var startPosition = this.scrollX ? this.element.offsetWidth / 2 : this.element.offsetHeight / 2;
      var childPosition = this.scrollX ? child.element.offsetLeft : child.element.offsetTop;
      var childSize = this.scrollX ? child.element.offsetWidth : child.element.offsetHeight;

      this.setPosition(childPosition + childSize / 2 - startPosition, instantly);
    },

    calcDimensions: function(){
      ScrollPanel.prototype.calcDimensions.call(this);

      if (this.scrollX)
      {
        this.minPositionX = (this.firstChild ? this.firstChild.element.offsetWidth / 2 : 0) - this.element.offsetWidth / 2;
        this.maxPositionX = this.maxPositionX + this.element.offsetWidth / 2 - (this.lastChild ? this.lastChild.element.offsetWidth / 2 : 0);
      }

      if (this.scrollY)
      {
        this.minPositionY = (this.firstChild ? this.firstChild.element.offsetHeight / 2 : 0) - this.element.offsetHeight / 2;
        this.maxPositionY = this.maxPositionY + this.element.offsetHeight / 2 - (this.lastChild ? this.lastChild.element.offsetHeight / 2 : 0);
      }
    },

    calcExpectedPosition: function(){
      return this.scroller.calcExpectedPosition(this.scrollX ? 'x' : 'y');
    }
  });


  //
  // export names
  //

  module.exports = {
    Scroller: Scroller,
    Scrollbar: Scrollbar,
    ScrollPanel: ScrollPanel,
    ScrollGallery: ScrollGallery
  };
