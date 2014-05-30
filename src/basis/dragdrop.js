
  basis.require('basis.event');
  basis.require('basis.dom.event');
  basis.require('basis.dom.computedStyle');
  basis.require('basis.layout');


 /**
  * @namespace basis.dragdrop
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var cleaner = basis.cleaner;

  var Event = basis.dom.event;
  var addGlobalHandler = Event.addGlobalHandler;
  var removeGlobalHandler = Event.removeGlobalHandler;

  var Emitter = basis.event.Emitter;
  var createEvent = basis.event.create;

  var getComputedStyle = basis.dom.computedStyle.get;
  var getOffsetParent = basis.layout.getOffsetParent;
  var getBoundingRect = basis.layout.getBoundingRect;
  var getViewportRect = basis.layout.getViewportRect;


  //
  // Main part
  //

  var SELECTSTART_SUPPORTED = Event.getEventInfo('selectstart').supported;

  var dragging;
  var dragElement;
  var dragData;

  function resolveElement(value){
    return typeof value == 'string' ? document.getElementById(value) : value;
  }

  function startDrag(event){
    if (dragElement || this.ignoreTarget(event.sender, event))
      return;

    // Some browsers (IE, Opera) wrongly fires mousedown event on scrollbars,
    // but not mouseup. This check helps ignore that events.
    var viewport = getViewportRect(event.sender);
    if (event.mouseX < viewport.left || event.mouseX > viewport.right ||
        event.mouseY < viewport.top || event.mouseY > viewport.bottom)
      return;

    dragElement = this;
    dragData = {
      // calculate point
      initX: event.mouseX,
      initY: event.mouseY,

      deltaX: 0,
      minDeltaX: -Infinity,
      maxDeltaX: Infinity,

      deltaY: 0,
      minDeltaY: -Infinity,
      maxDeltaY: Infinity
    };

    // add global handlers
    addGlobalHandler('mousemove', onDrag);
    addGlobalHandler('mouseup', stopDrag);

    // recover mode: if mouseup missed for some reason, new mousedown stops dragging
    addGlobalHandler('mousedown', stopDrag);

    // avoid text selection in IE
    if (SELECTSTART_SUPPORTED)
      addGlobalHandler('selectstart', Event.kill);

    // cancel event default action
    event.preventDefault();

    // ready to drag start, make other preparations if need
    this.prepareDrag(dragData, event);
  }

  function onDrag(event){
    var deltaX = event.mouseX - dragData.initX;
    var deltaY = event.mouseY - dragData.initY;

    if (!dragging)
    {
      // if not dragging, check could we start to drag
      if (!dragElement.startRule(deltaX, deltaY))
        return;

      // start dragging
      dragging = true;
      dragElement.emit_start(dragData, event);  // deltaX & deltaY will be equal to zero
    }

    // calculate delta
    if (dragElement.axisX)
      dragData.deltaX = dragElement.axisXproxy(basis.number.fit(deltaX, dragData.minDeltaX, dragData.maxDeltaX));

    if (dragElement.axisY)
      dragData.deltaY = dragElement.axisYproxy(basis.number.fit(deltaY, dragData.minDeltaY, dragData.maxDeltaY));

    // emit drag event
    dragElement.emit_drag(dragData, event);
  }

  function stopDrag(event){
    // remove global handlers
    removeGlobalHandler('mousemove', onDrag);
    removeGlobalHandler('mouseup', stopDrag);
    removeGlobalHandler('mousedown', stopDrag);

    if (SELECTSTART_SUPPORTED)
      removeGlobalHandler('selectstart', Event.kill);

    // store current values for event emit
    var element = dragElement;
    var data = dragData;

    // reset values
    dragElement = null;
    dragData = null;

    if (dragging)
    {
      dragging = false;
      element.emit_over(data, event);
    }

    event.die();
  }


 /**
  * @class
  */
  var DragDropElement = Emitter.subclass({
    className: namespace + '.DragDropElement',

    element: null,
    trigger: null,            // element that init a dragging; if null then element init dragging itself
    baseElement: null,        // element that bounds dragging element movements; if null then document body is base

    axisX: true,
    axisY: true,

    axisXproxy: basis.fn.$self,
    axisYproxy: basis.fn.$self,

    prepareDrag: basis.fn.$undef,
    startRule: basis.fn.$true,
    ignoreTarget: function(target, event){
      return /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName);
    },

    emit_start: createEvent('start'), // occure on first mouse move
    emit_drag: createEvent('drag'),
    emit_over: createEvent('over'),

    //
    // Constructor
    //
    init: function(){
      Emitter.prototype.init.call(this);

      var element = this.element;
      var trigger = this.trigger;

      this.element = null;
      this.trigger = null;

      this.setElement(element, trigger);
      this.setBase(this.baseElement);

      cleaner.add(this);
    },

    setElement: function(element, trigger){
      this.element = resolveElement(element);
      trigger = resolveElement(trigger) || this.element;

      if (this.trigger !== trigger)
      {
        if (this.trigger)
          Event.removeHandler(this.trigger, 'mousedown', startDrag, this);

        this.trigger = trigger;

        if (this.trigger)
          Event.addHandler(this.trigger, 'mousedown', startDrag, this);
      }
    },
    setBase: function(baseElement){
      this.baseElement = resolveElement(baseElement);
    },
    getBase: function(){
      return this.baseElement || (document.compatMode == 'CSS1Compat' ? document.documentElement : document.body);
    },

    isDragging: function(){
      return dragElement === this;
    },
    start: function(event){
      if (!this.isDragging())
        startDrag.call(this, event);
    },
    stop: function(){
      if (this.isDragging())
        stopDrag();
    },

    destroy: function(){
      this.stop();
      cleaner.remove(this);

      Emitter.prototype.destroy.call(this);

      this.setElement();
      this.setBase();
    }
  });

 /**
  * @class
  */
  var DeltaWriter = basis.Class(null, {
    className: namespace + '.DeltaWriter',
    property: null,
    invert: false,
    format: basis.fn.$self,
    init: function(element){
      if (typeof this.property == 'function')
        this.property = this.property(element);

      if (typeof this.invert == 'function')
        this.invert = this.invert(this.property);

      this.value = this.read(element);
    },
    read: function(){
      return element[this.property];
    },
    write: function(element, formattedValue){
      element[this.property] = formattedValue;
    },
    applyDelta: function(element, delta){
      if (this.invert)
        delta = -delta;

      this.write(element, this.format(this.value + delta, delta));
    }
  });

 /**
  * @class
  */
  var StyleDeltaWriter = DeltaWriter.subclass({
    className: namespace + '.StyleDeltaWriter',
    format: function(value, delta){
      return value + 'px';
    },
    read: function(element){
      return parseFloat(getComputedStyle(element, this.property));
    },
    write: function(element, formattedValue){
      element.style[this.property] = formattedValue;
    }
  });

 /**
  * @class
  */
  var StylePositionX = StyleDeltaWriter.subclass({
    property: function(element){
      return getComputedStyle(element, 'left') == 'auto' ? 'right' : 'left';
    },
    invert: function(property){
      return property != 'left';
    }
  });

 /**
  * @class
  */
  var StylePositionY = StyleDeltaWriter.subclass({
    property: function(element){
      return getComputedStyle(element, 'top') == 'auto' ? 'bottom' : 'top';
    },
    invert: function(property){
      return property != 'top';
    }
  });

 /**
  * @class
  */
  var MoveableElement = DragDropElement.subclass({
    className: namespace + '.MoveableElement',

    fixTop: true,
    fixRight: true,
    fixBottom: true,
    fixLeft: true,

    axisX: StylePositionX,
    axisY: StylePositionY,

    emit_start: function(dragData, event){
      var element = this.element;

      if (element)
      {
        var viewport = getViewportRect(this.getBase());
        var box = getBoundingRect(element);

        dragData.element = element;

        if (this.axisX)
        {
          dragData.axisX = new this.axisX(element);

          if (this.fixLeft)
            dragData.minDeltaX = viewport.left - box.left;

          if (this.fixRight)
            dragData.maxDeltaX = viewport.right - box.right;
        }

        if (this.axisY)
        {
          dragData.axisY = new this.axisY(element);

          if (this.fixTop)
            dragData.minDeltaY = viewport.top - box.top;

          if (this.fixBottom)
            dragData.maxDeltaY = viewport.bottom - box.bottom;
        }
      }

      DragDropElement.prototype.emit_start.call(this, dragData, event);
    },

    emit_drag: function(dragData, event){
      if (!dragData.element)
        return;

      if (dragData.axisX)
        dragData.axisX.applyDelta(dragData.element, dragData.deltaX);

      if (dragData.axisY)
        dragData.axisY.applyDelta(dragData.element, dragData.deltaY);

      DragDropElement.prototype.emit_drag.call(this, dragData, event);
    }
  });


  //
  // export names
  //

  module.exports = {
    DragDropElement: DragDropElement,
    MoveableElement: MoveableElement,
    DeltaWriter: DeltaWriter,
    StyleDeltaWriter: StyleDeltaWriter
  };
