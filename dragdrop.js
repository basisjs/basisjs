/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    var namespace = 'Basis.DragDrop';

    // import names

    var Event = Basis.Event;
    var DOM = Basis.DOM;
    var Data = Basis.Data;

    var cssClass = Basis.CSS.cssClass;
    var addGlobalHandler = Event.addGlobalHandler;
    var removeGlobalHandler = Event.removeGlobalHandler;

    var MLayout = Basis.Layout;
    var MWrapers = Basis.DOM.Wrapers;
    
    //
    // Main part
    //

    var isIE = Basis.Browser.is('IE8-');

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
      },
      move: function(e){  // `this` store DDE config
        var dde = DDEConfig.dde;

        if (!Event.mouseButton(e, Event.MOUSE_LEFT))
          return DDEHandler.over();

        if (!DDEConfig.run)
        {
          DDEConfig.run = true;
          dde.draging = true;
          dde.dispatch('start', DDEConfig.event);
        }

        if (dde.axisX)
          DDEConfig.event.deltaX = dde.axisXproxy(Event.mouseX(e) - DDEConfig.event.initX);

        if (dde.axisY)
          DDEConfig.event.deltaY = dde.axisYproxy(Event.mouseY(e) - DDEConfig.event.initY);

        dde.dispatch('move', DDEConfig.event);
      },
      over: function(){  // `this` store DDE config
        var dde = DDEConfig.dde;

        // remove document handler if exists
        removeGlobalHandler('mousemove', DDEHandler.move, DDEConfig);
        removeGlobalHandler('mouseup',   DDEHandler.over, DDEConfig);
        removeGlobalHandler('mousedown', DDEHandler.over, DDEConfig);

        dde.draging = false;

        if (DDEConfig.run)
          dde.dispatch('over', DDEConfig.event);
        
        DDEConfig = null;
      }
    };

    var DDCssClass = {
      dragable: 'Basis-Dragable',
      element: 'Basis-DragDrop-DragElement'
    };

    var DragDropElement = Basis.Class.create(MWrapers.EventObject, {
      className: namespace + '.DragDropElement',

      containerGetter: Data.getter('element'),

      element: null,
      trigger: null,            // element that trig a drag; if null element is trig drag itself
      baseElement: null,        // element that will be a base of offset; if null then document body is base

      fixTop:    true,
      fixRight:  true,
      fixBottom: true,
      fixLeft:   true,

      axisX: true,
      axisY: true,

      axisXproxy: Function.$self,
      axisYproxy: Function.$self,

      //
      // Constructor
      //
      init: function(config){
        this.inherit(config);

        if (typeof config == 'object')
        {
          var props = ['fixLeft', 'fixRight', 'fixTop', 'fixBottom', 'axisX', 'axisY'];
          for (var i = 0; i < props.length; i++)
            if (props[i] in config)
              this[props[i]] = !!config[props[i]];

          if (typeof config.axisXproxy == 'function')
            this.axisXproxy = config.axisXproxy;
          if (typeof config.axisYproxy == 'function')
            this.axisYproxy = config.axisYproxy;

          if (typeof config.containerGetter == 'function')
            this.containerGetter = config.containerGetter;

          this.setElement(config.element, config.trigger);
          this.setBase(config.baseElement);
        }

        Basis.Cleaner.add(this);
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
            cssClass(this.element).remove(DDCssClass.dragable);

          this.element = element;

          if (this.element)
            cssClass(this.element).add(DDCssClass.dragable);
        }
      },

      setBase: function(baseElement){
        this.baseElement = DOM.get(baseElement) || (Basis.Browser.is('IE7-') ? document.body : document.documentElement);
      },

      isDraging: function(){
        return !!(DDEConfig && DDEConfig.dde == this);
      },

      start: function(){
        if (!this.isDraging())
          DDEHandler.start.call(this);
      },
      stop: function(){
        if (this.isDraging())
          DDEHandler.over();
      },

      destroy: function(){
        Basis.Cleaner.remove(this);

        this.stop();

        this.inherit();
        
        this.setElement();
        this.setBase();
      }
    });

    var MoveableElement = Basis.Class.create(DragDropElement, {
      behaviour: MWrapers.createBehaviour(DragDropElement, {
        start: function(config){
          var element = this.containerGetter(this, config.initX, config.initY);

          if (element)
          {
            var box = new MLayout.Box(element);
            var viewport = new MLayout.Viewport(this.baseElement);

            // set class
            cssClass(element).add(DDCssClass.element);

            config.element = element;
            config.box = box;
            config.viewport = viewport;
          }
          else
            console.warn('sdfsf')
        },
        move: function(config){
          if (!config.element)
            return;

          if (this.axisX)
          {
            var newLeft = config.box.left + config.deltaX;
            
            if (this.fixLeft && newLeft < 0) //config.viewport.left)
              newLeft = 0;//config.viewport.left;
            else
              if (this.fixRight && newLeft + config.box.width > config.viewport.width)//config.viewport.right)
                newLeft = config.viewport.width - config.box.width;//config.viewport.right - config.box.width;

            config.element.style.left = newLeft + 'px';
          }

          if (this.axisY)
          {
            var newTop = config.box.top + config.deltaY;
            
            if (this.fixTop && newTop < 0) //config.viewport.top)
              newTop = 0;//config.viewport.top;
            else
              if (this.fixBottom && newTop + config.box.height > config.viewport.height)//config.viewport.bottom)
                newTop = config.viewport.height - config.box.height;//config.viewport.bottom - config.box.height;

            config.element.style.top = newTop + 'px';
          }
        },
        over: function(config){
          if (!config.element)
            return;

          // remove class
          cssClass(config.element).remove(DDCssClass.element);
        }
      })
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      DragDropElement: DragDropElement,
      MoveableElement: MoveableElement
    });

  })();
