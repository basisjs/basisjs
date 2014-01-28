
  basis.require('basis.event');
  basis.require('basis.dom.event');
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
    if (dragElement)
      stopDrag();

    dragElement = this;
    dragData = {
      // calculate point
      initX: event.mouseX,
      initY: event.mouseY,
      deltaX: 0,
      deltaY: 0
    };

    // add global handlers
    addGlobalHandler('mousedown', stopDrag);
    addGlobalHandler('mousemove', onDrag);
    addGlobalHandler('mouseup', stopDrag);
    if (SELECTSTART_SUPPORTED)
      addGlobalHandler('selectstart', Event.kill);

    // cancel event default action
    event.preventDefault();

    // ready to drag start, make other preparations if need
    this.prepareDrag(dragData, event);
  }

  function onDrag(event){
    if (dragElement.axisX)
      dragData.deltaX = dragElement.axisXproxy(event.mouseX - dragData.initX);

    if (dragElement.axisY)
      dragData.deltaY = dragElement.axisYproxy(event.mouseY - dragData.initY);

    if (!dragging && dragElement.startRule(dragData.deltaX, dragData.deltaY))
    {
      dragging = true;
      dragElement.emit_start(dragData, event);
    }

    if (dragging)
      dragElement.emit_drag(dragData, event);
  }

  function stopDrag(event){
    // remove global handlers
    removeGlobalHandler('mousedown', stopDrag);
    removeGlobalHandler('mousemove', onDrag);
    removeGlobalHandler('mouseup', stopDrag);
    if (SELECTSTART_SUPPORTED)
      removeGlobalHandler('selectstart', Event.kill);

    if (dragging)
    {
      dragging = false;
      dragElement.emit_over(dragData, event);
    }

    dragElement = null;
    dragData = null;

    event.die();
  }


 /**
  * @class
  */
  var DragDropElement = Emitter.subclass({
    className: namespace + '.DragDropElement',

    containerGetter: basis.getter('element'),

    element: null,
    trigger: null,            // element that trig a drag; if null element is trig drag itself
    baseElement: null,        // element that will be a base of offset; if null then document body is base

    fixTop: true,
    fixRight: true,
    fixBottom: true,
    fixLeft: true,

    axisX: true,
    axisY: true,

    axisXproxy: basis.fn.$self,
    axisYproxy: basis.fn.$self,

    startRule: basis.fn.$true,

    prepareDrag: function(){},
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
  var MoveableElement = DragDropElement.subclass({
    className: namespace + '.MoveableElement',

    emit_start: function(dragData, event){
      var element = this.containerGetter(this, dragData.initX, dragData.initY);

      if (element)
      {
        dragData.element = element;
        dragData.box = getBoundingRect(element);  // relative to offsetParent?
        dragData.viewport = getViewportRect(this.getBase());
      }

      DragDropElement.prototype.emit_start.call(this, dragData, event);
    },

    emit_drag: function(dragData, event){
      if (!dragData.element)
        return;

      if (this.axisX)
      {
        var newLeft = dragData.box.left + dragData.deltaX;

        if (this.fixLeft && newLeft < 0)
          newLeft = 0;
        else
          if (this.fixRight && newLeft + dragData.box.width > dragData.viewport.width)
            newLeft = dragData.viewport.width - dragData.box.width;

        dragData.element.style.left = newLeft + 'px';
      }

      if (this.axisY)
      {
        var newTop = dragData.box.top + dragData.deltaY;

        if (this.fixTop && newTop < 0)
          newTop = 0;
        else
          if (this.fixBottom && newTop + dragData.box.height > dragData.viewport.height)
            newTop = dragData.viewport.height - dragData.box.height;

        dragData.element.style.top = newTop + 'px';
      }

      DragDropElement.prototype.emit_drag.call(this, dragData, event);
    }
  });


  //
  // export names
  //

  module.exports = {
    DragDropElement: DragDropElement,
    MoveableElement: MoveableElement
  };
