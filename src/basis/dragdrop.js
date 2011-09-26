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

basis.require('basis.ua');
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.layout');

!function(basis){

  'use strict';

 /**
  * @namespace basis.dragdrop
  */
  var namespace = 'basis.dragdrop';

  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var addGlobalHandler = Event.addGlobalHandler;
  var removeGlobalHandler = Event.removeGlobalHandler;

  var EventObject = basis.EventObject;

  var createEvent = EventObject.createEvent;

  var nsWrappers = basis.dom.wrapper;
  var nsLayout = basis.layout;
  var ua = basis.ua;
  
  //
  // Main part
  //

  var isIE = basis.ua.is('IE9-');

  var DDEConfig;
  var DDEHandler = {
    start: function(event){
      if (DDEConfig)
        DDEHandler.over();

      DDEConfig = {
        dde: this,
        run: false,
        event: {
          // calculate point
          initX: Event.mouseX(event),
          initY: Event.mouseY(event),
          deltaX: 0,
          deltaY: 0
        }
      };

      // set handlers
      addGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
      addGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
      addGlobalHandler('mousedown', DDEHandler.over, DDEConfig);

      // kill event
      Event.cancelDefault(event);

      // ready to drag start, make other preparations if need
      this.event_prepare(DDEConfig.event);
    },
    move: function(event){  // `this` store DDE config
      var dde = DDEConfig.dde;

      //if (!Event.mouseButton(e, Event.MOUSE_LEFT))
      //  return DDEHandler.over();

      if (!DDEConfig.run)
      {
        DDEConfig.run = true;
        dde.draging = true;
        dde.event_start(DDEConfig.event);
      }

      if (dde.axisX)
        DDEConfig.event.deltaX = dde.axisXproxy(Event.mouseX(event) - DDEConfig.event.initX);

      if (dde.axisY)
        DDEConfig.event.deltaY = dde.axisYproxy(Event.mouseY(event) - DDEConfig.event.initY);

      dde.event_move(DDEConfig.event);
    },
    over: function(event){  // `this` store DDE config
      var dde = DDEConfig.dde;

      // remove document handler if exists
      removeGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
      removeGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
      removeGlobalHandler('mousedown', DDEHandler.over, DDEConfig);

      dde.draging = false;

      if (DDEConfig.run)
        dde.event_over(DDEConfig.event);
      
      DDEConfig = null;
      Event.kill(event);
    }
  };

  var DDCssClass = {
    dragable: 'Basis-Dragable',
    element: 'Basis-DragDrop-DragElement'
  };

 /**
  * @class
  */
  var DragDropElement = Class(EventObject, {
    className: namespace + '.DragDropElement',

    containerGetter: getter('element'),

    element: null,
    trigger: null,            // element that trig a drag; if null element is trig drag itself
    baseElement: null,        // element that will be a base of offset; if null then document body is base

    fixTop: true,
    fixRight: true,
    fixBottom: true,
    fixLeft: true,

    axisX: true,
    axisY: true,

    axisXproxy: Function.$self,
    axisYproxy: Function.$self,

    event_prepare: createEvent('prepare'), // occure before drag start
    event_start: createEvent('start'), // occure on first mouse move
    event_move: createEvent('move'),
    event_over: createEvent('over'),

    //
    // Constructor
    //
    init: function(config){
      //this.inherit(config);
      EventObject.prototype.init.call(this, config);

      var element = this.element;
      var trigger = this.trigger;

      this.element = null;
      this.trigger = null;

      this.setElement(element, trigger);
      this.setBase(this.baseElement);

      basis.Cleaner.add(this);
    },


    //
    // public
    //

    setElement: function(element, trigger){
      var element = element && DOM.get(element);
      var trigger = (trigger && DOM.get(trigger)) || element;

      if (this.trigger != trigger)
      {
        if (this.trigger)
        {
          Event.removeHandler(this.trigger, 'mousedown', DDEHandler.start, this);
          if (isIE)
            Event.removeHandler(this.trigger, 'selectstart', DDEHandler.start, this);
        }

        this.trigger = trigger;

        if (this.trigger)
        {
          //if (isIE) Event.kill(this.trigger, 'selectstart'); // ?
          Event.addHandler(this.trigger, 'mousedown', DDEHandler.start, this);
          if (isIE)
            Event.addHandler(this.trigger, 'selectstart', DDEHandler.start, this);
        }
      }


      if (this.element != element)
      {
        if (this.element)
          classList(this.element).remove(DDCssClass.dragable);

        this.element = element;

        if (this.element)
          classList(this.element).add(DDCssClass.dragable);
      }
    },

    setBase: function(baseElement){
      this.baseElement = DOM.get(baseElement) || (ua.is('IE7-') ? document.body : document.documentElement);
    },

    isDraging: function(){
      return !!(DDEConfig && DDEConfig.dde == this);
    },

    start: function(event){
      if (!this.isDraging())
        DDEHandler.start.call(this, event);
    },
    stop: function(){
      if (this.isDraging())
        DDEHandler.over();
    },

    destroy: function(){
      basis.Cleaner.remove(this);

      this.stop();

      EventObject.prototype.destroy.call(this);
      
      this.setElement();
      this.setBase();
    }
  });

 /**
  * @class
  */
  var MoveableElement = Class(DragDropElement, {
    className: namespace + '.MoveableElement',
    
    event_start: function(config){
      var element = this.containerGetter(this, config.initX, config.initY);

      if (element)
      {
        var box = new nsLayout.Box(element);
        var viewport = new nsLayout.Viewport(this.baseElement);

        // set class
        classList(element).add(DDCssClass.element);

        config.element = element;
        config.box = box;
        config.viewport = viewport;
      }

      DragDropElement.prototype.event_start.call(this, config);
    },

    event_move: function(config){
      if (!config.element)
        return;

      if (this.axisX)
      {
        var newLeft = config.box.left + config.deltaX;
        
        if (this.fixLeft && newLeft < 0)
          newLeft = 0;
        else
          if (this.fixRight && newLeft + config.box.width > config.viewport.width)
            newLeft = config.viewport.width - config.box.width;

        config.element.style.left = newLeft + 'px';
      }

      if (this.axisY)
      {
        var newTop = config.box.top + config.deltaY;
       
        if (this.fixTop && newTop < 0)
          newTop = 0;
        else
          if (this.fixBottom && newTop + config.box.height > config.viewport.height)
            newTop = config.viewport.height - config.box.height;

        config.element.style.top = newTop + 'px';
      }

      DragDropElement.prototype.event_move.call(this, config);
    },

    event_over: function(config){
      if (!config.element)
        return;

      // remove class
      classList(config.element).remove(DDCssClass.element);

      DragDropElement.prototype.event_over.call(this, config);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    DragDropElement: DragDropElement,
    MoveableElement: MoveableElement
  });

}(basis);
