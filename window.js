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

    // namespace

    var namespace = 'Basis.Controls.Window';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var CSS = Basis.CSS;
    var Cleaner = Basis.Cleaner;
    var Template = Basis.Html.Template;

    var nsWrapers = DOM.Wrapers;

   /**
    * @class
    * @extends Basis.DOM.Wrapers.HtmlPanel
    */
    var Blocker = Class(nsWrapers.HtmlPanel, {
      className: namespace + '.Blocker',

      captureElement: null,

      template: new Template(
        '<div{element} class="Basis-Blocker">' + 
          '<div{content} class="mate"/>' +
        '</div>'
      ),

      init: function(config){
        config = this.inherit(config);

        DOM.hide(this.element);
        this.element.style.position = 'absolute';

        Cleaner.add(this);

        return config;
      },
      capture: function(element, zIndex){
        this.captureElement = DOM.get(element || document.body);
        if (this.captureElement)
        {
          if (!DOM.IS_ELEMENT_NODE(this.element.parentNode))
            DOM.insert(document.body, this.element);

          this.captureElementBox = new Basis.Layout.Box(this.captureElement, false, this.element.parentNode);
          this.resize();
          if (zIndex || !this.element.style.zIndex)
            this.element.style.zIndex = zIndex || 1000;
          DOM.show(this.element);
          Event.addHandler(window, 'resize', this.resize, this);
        }
      },
      release: function(){
        if (this.captureElement)
        {
          if (this.element.parentNode == document.body)
            DOM.remove(this.element);

          this.captureElementBox.destroy();
          delete this.captureElement;
          delete this.captureElementBox;
          DOM.hide(this.element);
          Event.removeHandler(window, 'resize', this.resize, this);
        }
      },
      resize: function(){
        if (!this.captureElementBox)
          return;

        var box = this.captureElementBox;
        box.recalc(this.element.parentNode);
        if (box.defined)
          DOM.css(this.element, {
            top:    box.top  + 'px',
            left:   box.left + 'px',
            width:  (box.element == document.body ? document.documentElement.scrollWidth  : box.width) + 'px',
            height: (box.element == document.body ? document.documentElement.scrollHeight : box.height) + 'px'
          });
      },
      destroy: function(){
        this.release();

        this.inherit();

        Cleaner.remove(this);
      }
    });

    //
    //  Window
    //

    var windowManager = (function(){
      var stack = new Array();
      var blocker = new Blocker();
      var object = {
        add: function(win){
          stack.push(win) && this.rearrange();
        },
        remove: function(win){
          stack.remove(win) && this.rearrange();
        },
        getTopZIndex: function(){
          var topWindow = stack.last();
          return topWindow ? topWindow.element.style.zIndex : 2001;
        },
        activate: function(win){ // nove window on top of stack
          stack.remove(win) && this.add(win);
        },
        reposition: function(){
          for (var i = 0, win; win = stack[i]; i++)
          {
            //if (Basis.Browser.is('FF3-'))
            //{
              //win.content.style.overflow = 'hidden';
              //win.content.style.overflow = win.content.offsetWidth && '';
            //}
            if (win.autocenter && !win.minimized)
              win.realign();
          }
        },
        rearrange: function(){
          var topModalIndex = -1;
          for (var i = stack.length - 1; i >= 0; i--)
            if (stack[i].modal)
            {
              topModalIndex = i;
              break;
            }

          if (topModalIndex != -1 && !blocker.captureElement)
            blocker.capture(document.body, 2000);
          if (topModalIndex == -1 && blocker.captureElement)
            blocker.release();

          for (var i = 0, win; win = stack[i]; i++)
            win.element.style.zIndex = i < topModalIndex ? 2000 - topModalIndex + i : 2001 + i;

          if (stack.length)
            stack.last().dispatch('active');
        },
        destroy: function(){
          stack.clear();
          Event.removeHandler(window, 'resize', this.reposition, this);
        }
      };

      Cleaner.add(object);
      Event.addHandler(window, 'resize', object.reposition, object);

      return object;
    })();

    function buttonKeyPressHandler(event){
      var key = Event.key(event);
      var sender = Event.sender(event);
      switch (key){
        case Event.KEY.ESCAPE:
          this.close(0, true);
          break;
        case Event.KEY.ENTER:  
          if (DOM.is(sender, 'TEXTAREA'))
            return;
          Event.kill(event);
          break;
        default:
//          Event.kill(event);
      }
    }

   /**
    * @class
    * @extends Basis.DOM.Wrapers.HtmlContainer
    */
    var Window = Class(nsWrapers.HtmlContainer, {
      className: namespace + '.Window',

      template: new Template(
        '<div{element} class="Basis-Window">' +
          '<div class="Basis-Window-Canvas">' +
            '<div class="corner-left-top"/>' +
            '<div class="corner-right-top"/>' +
            '<div class="side-top"/>' +
            '<div class="side-left"/>' +
            '<div class="side-right"/>' +
            '<div class="content"/>' +
            '<div class="corner-left-bottom"/>' +
            '<div class="corner-right-bottom"/>' +
            '<div class="side-bottom"/>' +
          '</div>' +
          '<div{layout} class="Basis-Window-Layout">' +
            '<div{content|childNodesElement} class="Basis-Window-Content"/>' +
          '</div>' +
        '</div>'
      ),

      // properties

      blocker: null,
      closed: true,
      minimized: false,
      removeOnMinimize: true,

      autocenter: false,
      autocenter_: false,
      modal: false,

      title: null,

//      onOpen:  $false,
//      onClose: $false,

      init: function(config){
        config = this.inherit(config);

        DOM.hide(this.element);

        // modal window
        if (config.modal)
          this.modal = true;

        // process title
        if (config.title != null)
        {
          this.title = DOM.createElement('', config.title);
          DOM.insert(this.layout, DOM.createElement('.Basis-Window-Title', this.title), DOM.INSERT_BEGIN);
        }

        if (config.moveable)
          if (Basis.DragDrop)
          {
            /*this.dde = new Basis.DragDrop.DragDropElement({
              element: this.element,
              trigger: this.title.parentNode,
              fixRight: false,
              fixBottom: false
            });*/
            this.dde = new Basis.DragDrop.MoveableElement({
              element: this.element,
              trigger: this.title.parentNode,
              fixRight: false,
              fixBottom: false
            });
            this.dde.addHandler(
              {
                move: function(){
                  this.autocenter = false;
                  //console.log('move');
                }
              },
              this
            );
          }
          else
          {
            ;;;if(typeof console != 'undefined') console.warn('moveable property of Window is not allowed without Drag&Drop module')
          }

        // buttons
        var buttons = Array.from(config.buttons).map(function(button){ return Object.complete({ handler: button.handler ? button.handler.bind(this) : button.handler }, button); }, this);
        var _buttons = [config.buttonOk, config.buttonCancel];
        for (var i = 0; i < _buttons.length; i++)
        {
          var button = _buttons[i];
          if (button)
          {
            buttons.push({
              name: i ? 'cancel' : 'ok',
              caption: button.caption || button.title || button,
              handlers: {
                click: (button.handler || this.close).bind(this)
              }
            });
          }
        }

        if (buttons.length)
        {
          this.buttonPanel = new Basis.Controls.Button.ButtonPanel({
            cssClassName: 'Basis-Window-ButtonPlace',
            container: this.content,
            childNodes: buttons
          });
        }

        var tbClose = !config.titleButton || config.titleButton.close !== false;
        var tbMinimize = config.titleButton && config.titleButton.minimize;
        if (this.title && (tbClose || tbMinimize))
        {
          var titleButtonContainer = DOM.insert(this.title.parentNode, DOM.createElement('SPAN.Basis-Window-Title-ButtonPlace'), DOM.INSERT_BEGIN);
          CSS.cssClass(this.title.parentNode).add('Basis-Window-Title-ButtonPlace-' + (tbClose ? 'Close' : '') + (tbMinimize ? 'Minimize' : ''));
          if (tbMinimize)
            DOM.insert(
              titleButtonContainer,
              DOM.createElement(
                {
                  description: 'A[href=#].Basis-Window-Title-MinimizeButton',
                  click: new Event.Handler(function(event){
                    Event.kill(event);
                    if (this.minimized)
                      this.unminimize();
                    else
                      this.minimize();
                  }, this)
                },
                DOM.createElement('SPAN', 'Minimize')
              )
            );
          if (tbClose)
            DOM.insert(
              titleButtonContainer,
              DOM.createElement(
                {
                  description: 'A[href=#].Basis-Window-Title-CloseButton',
                  click: new Event.Handler(function(event){
                    Event.kill(event);
                    this.close(0);
                  }, this)
                },
                DOM.createElement('SPAN', 'Close')
              )
            );
        }

        if (config.autocenter !== false)
          this.autocenter = this.autocenter_ = true;

        // handlers
        if (config.onOpen)
          this.onOpen = config.onOpen;
        if (config.onClose)
          this.onClose = config.onClose;
        if (config.removeOnMinimize == false)
          this.removeOnMinimize = false;

        if (config.thread)
        {
          this.thread = config.thread;
          this.thread.addHandler({
            finish: function(){
              if (this.closed)
                DOM.remove(this.element);
            }
          }, this);
        }

        Event.addHandler(this.element, 'keypress', buttonKeyPressHandler, this);
        //addHandler(this.element, 'click', Event.kill);
        Event.addHandler(this.element, 'mousedown', function(e){
          windowManager.activate(this);
        }, this);


        Cleaner.add(this);

        return config;
      },
      setTitle: function(title){
        if (this.title)
          //this.title.firstChild.nodeValue = title;
          DOM.insert(DOM.clear(this.title), title);
      },
      realign: function(){
        if (this.autocenter)
          DOM.css(this.element, {
            left: CSS.px(Math.max(0, parseInt(0.5 * (document.body.clientWidth  - this.element.offsetWidth)))),
            top:  CSS.px(Math.max(0, parseInt(0.5 * (document.body.clientHeight - this.element.offsetHeight))))
          });
      },
      activate: function(){
        windowManager.activate(this);
      },
      open: function(params, x, y){
        if (this.minimized)
          this.unminimize();

        if (this.closed)
        {
          if (!this.onOpen || !this.onOpen())
          {
            DOM.insert(document.body, this.element);

            DOM.visibility(this.element, false);
            DOM.show(this.element);

            this.realign();

            if (this.thread)
              this.thread.start(true);

            this.dispatch('beforeShow', params);
            DOM.visibility(this.element, true);

            if (this.buttonPanel && this.buttonPanel.firstChild)
              this.buttonPanel.firstChild.select();

            windowManager.add(this);

            this.closed = false;
            this.dispatch('open', params);
            this.dispatch('active', params);
          }
        }
        else
        {
          //windowManager.activate(this);
          //;;;if (typeof console != 'undefined') console.warn('make window activate on window.open()');
          this.realign();
        }
      },
      close: function(modalResult, esc){
        if (!this.closed)
        {
          if (!this.onClose || !this.onClose(esc))
          {
            if (this.minimized)
              this.unminimize();

            if (this.thread)
              this.thread.start(1);
            else
              DOM.remove(this.element);
            windowManager.remove(this);

            this.autocenter = this.autocenter_;

            this.closed = true;
            this.dispatch('close', modalResult);
          }
        }
      },
      minimize: function(){
        if (!this.closed && !this.minimized)
        {
          this.minimized = true;
          this.dispatch('minimize');
          if (this.removeOnMinimize)
            DOM.remove(this.element);
        }
      },
      unminimize: function(){
        if (this.minimized)
        {
          this.minimized = false;
          if (this.removeOnMinimize)
            DOM.insert(document.body, this.element);
          this.dispatch('unminimize');
        }
      },
      destroy: function(){
        if (this.dde)
        {
          this.dde.destroy();
          delete this.dde;
        }

        this.inherit();
        delete this.title;
        delete this.blocker;

        Cleaner.remove(this);
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Window: Window,
      Blocker: Blocker,
      getWindowTopZIndex: windowManager.getTopZIndex
    });

  })();
