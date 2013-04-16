
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.dom');
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

  var DOM = basis.dom;
  var Event = basis.dom.event;
  var addGlobalHandler = Event.addGlobalHandler;
  var removeGlobalHandler = Event.removeGlobalHandler;

  var Emitter = basis.event.Emitter;
  var createEvent = basis.event.create;

  var nsLayout = basis.layout;
  var ua = basis.ua;
  

  //
  // Main part
  //

  var SELECTSTART_SUPPORTED = Event.getEventInfo('selectstart').supported;
  var defaultBaseElement = ua.is('IE7-') ? document.body : document.documentElement;

  var dragging;
  var dragElement;
  var dragData;
  
  function startDrag(event){
    if (dragElement)
      stopDrag();

    dragElement = this;
    dragData = {
      // calculate point
      initX: Event.mouseX(event),
      initY: Event.mouseY(event),
      deltaX: 0,
      deltaY: 0
    };

    // add global handlers
    addGlobalHandler('mousedown', stopDrag);
    addGlobalHandler('mousemove', onDrag);
    addGlobalHandler('mouseup', stopDrag);
    if (SELECTSTART_SUPPORTED)
      addGlobalHandler('selectstart', Event.kill);

    // kill event
    Event.cancelDefault(event);

    // ready to drag start, make other preparations if need
    this.prepareDrag(dragData, event);
  }

  function onDrag(event){
    if (!dragging)
    {
      dragging = true;
      dragElement.emit_start(dragData, event);
    }

    if (dragElement.axisX)
      dragData.deltaX = dragElement.axisXproxy(Event.mouseX(event) - dragData.initX);

    if (dragElement.axisY)
      dragData.deltaY = dragElement.axisYproxy(Event.mouseY(event) - dragData.initY);

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

    Event.kill(event);
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


    //
    // public
    //

    setElement: function(element, trigger){
      this.element = DOM.get(element);
      trigger = DOM.get(trigger) || this.element;

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
      this.baseElement = DOM.get(baseElement) || defaultBaseElement;
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
      cleaner.remove(this);

      this.stop();

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
        dragData.box = new nsLayout.Box(element);
        dragData.viewport = new nsLayout.Viewport(this.baseElement);
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
