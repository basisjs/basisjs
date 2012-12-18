
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.l10n');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.dragdrop');


 /**
  * @see ./demo/defile/window.html
  * @namespace basis.ui.window
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;

  var arrayFrom = basis.array.from;
  var createEvent = basis.event.create;

  var UINode = basis.ui.Node;
  var ButtonPanel = basis.ui.button.ButtonPanel;


  //
  // localization
  //

  basis.l10n.createDictionary(namespace, __dirname + 'l10n/window', {
    "emptyTitle": "[no title]",
    "closeButton": "Close"
  });

  //
  // main part
  //

 /**
  * @class
  */
  var Blocker = Class(UINode, {
    className: namespace + '.Blocker',

    captureElement: null,

    template: resource('templates/window/Blocker.tmpl'),

    init: function(){
      UINode.prototype.init.call(this);

      cssom.setStyle(this.element, {
        display: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      });
    },
    capture: function(element, zIndex){
      this.captureElement = DOM.get(element || document.body);
      if (this.captureElement)
      {
        DOM.insert(this.captureElement, this.element);
        this.element.style.zIndex = zIndex || 1000;
        cssom.show(this.element);
      }
    },
    release: function(){
      if (this.captureElement)
      {
        if (this.element.parentNode == this.captureElement)
          DOM.remove(this.element);

        this.captureElement = null;
        cssom.hide(this.element);
      }
    },
    destroy: function(){
      this.release();
      
      UINode.prototype.destroy.call(this);
    }
  });

  //
  //  Window
  //

  var DD_HANDLER = {
    move: function(){
      this.autocenter = false;
      this.element.style.margin = 0;
    },
    over: function(){
      this.cssRule.setStyle(Object.slice(this.element.style, 'left top'.qw()));
      cssom.setStyle(this.element, {
        top: '',
        left: ''
      });
    }
  };

 /**
  * @class
  */
  var Window = Class(UINode, {
    className: namespace + '.Window',

    template: resource('templates/window/Window.tmpl'),

    binding: {
      title: 'title',
      titleButtons: 'satellite:',
      titleButtonClass: function(node){
        return !node.titleButton || node.titleButton.close !== false
          ? 'Basis-Window-Title-ButtonPlace-Close'
          : '';
      }
    },

    satelliteConfig: {
      titleButtons: {
        existsIf: function(owner){
          return !owner.titleButton || owner.titleButton.close !== false;
        },
        instanceOf: UINode.subclass({
          className: namespace + '.TitleButton',

          template: resource('templates/window/TitleButton.tmpl'),

          action: {
            close: function(){
              this.owner.close();
            }
          }
        })
      }
    },

    action: {
      close: function(){
        this.close();
      },
      mousedown: function(){
        this.activate();
      },
      keypress: function(event){
        var key = Event.key(event);

        if (key == Event.KEY.ESCAPE)
        {
          if (this.closeOnEscape)
            this.close(0);
        }
        else if (key == Event.KEY.ENTER)
        {
          if (Event.sender(event).tagName != 'TEXTAREA')
            Event.kill(event);
        }
      }
    },

    // properties

    event_beforeShow: createEvent('beforeShow'),
    event_open: createEvent('open'),
    event_close: createEvent('close'),
    event_active: createEvent('active'),

    closeOnEscape: true,

    autocenter: true,
    autocenter_: false,
    modal: false,
    closed: true,
    moveable: true,
    zIndex: 0,

    title: basis.l10n.getToken(namespace, 'emptyTitle'),

    buttonPanelClass: ButtonPanel.subclass({
      template: resource('templates/window/ButtonPanel.tmpl')
    }),

    init: function(){
      // add generic rule
      this.cssRule = cssom.uniqueRule();

      UINode.prototype.init.call(this);

      // make main element invisible by default
      cssom.hide(this.element);

      // make window moveable
      if (this.moveable)
      {
        this.dde = new basis.dragdrop.MoveableElement({
          element: this.element,
          trigger: this.tmpl.ddtrigger || (this.tmpl.title && this.tmpl.title.parentNode) || this.element,
          fixRight: false,
          fixBottom: false,
          handler: DD_HANDLER,
          handlerContext: this
        });
      }

      // buttons
      var buttons = arrayFrom(this.buttons).map(function(button){
        return Object.complete({
          click: (button.click || this.close).bind(this)
        }, button);
      }, this);

      // common buttons
      var buttons_ = Object.slice(this, ['buttonOk', 'buttonCancel']);
       
      for (var buttonId in buttons_)
      {
        var button = buttons_[buttonId];
        buttons.push({
          name: buttonId == 'buttonOk' ? 'ok' : 'cancel',
          caption: button.caption || button.title || button,
          click: (button.click || this.close).bind(this)
        });
      }

      if (buttons.length)
      {
        this.buttonPanel = new this.buttonPanelClass({
          childNodes: buttons
        });
      }

      if (this.autocenter !== false)
        this.autocenter = this.autocenter_ = true;

      // handlers
      if (this.thread)
      {
        this.thread.addHandler({
          finish: function(){
            if (this.closed)
              DOM.remove(this.element);
          }
        }, this);
      }
    },
    setTitle: function(title){
      this.title = title;
      this.updateBind('title');
    },
    templateSync: function(noRecreate){
      UINode.prototype.templateSync.call(this, noRecreate);
      if (this.element)
      {
        if (this.dde)
          this.dde.setElement(this.element, this.tmpl.ddtrigger || (this.tmpl.title && this.tmpl.title.parentNode) || this.element);

        if (this.buttonPanel)
          DOM.insert(this.tmpl.content || this.element, this.buttonPanel.element);

        cssom.classList(this.element).add(this.cssRule.token);

        this.realign();
      }
    },
    setZIndex: function(zIndex){
      this.zIndex = zIndex;
      this.element.style.zIndex = zIndex;
    },
    realign: function(){
      this.setZIndex(this.zIndex);
      if (this.autocenter)
      {
        //this.autocenter = false;
        this.element.style.margin = '';
        this.cssRule.setStyle(this.element.offsetWidth ? {
          left: '50%',
          top: '50%',
          marginLeft: -this.element.offsetWidth / 2 + 'px',
          marginTop: -this.element.offsetHeight / 2 + 'px'
        } : { left: 0, top: 0 });
      }
    },
    activate: function(){
      this.select();
    },
    open: function(params){
      if (this.closed)
      {
        cssom.visibility(this.element, false);
        cssom.show(this.element);

        windowManager.appendChild(this);
        this.closed = false;

        this.realign();

        if (this.thread)
          this.thread.start(true);

        this.event_beforeShow(params);
        cssom.visibility(this.element, true);

        if (this.buttonPanel && this.buttonPanel.firstChild)
          this.buttonPanel.firstChild.select();

        this.event_open(params);
        this.event_active(params);
      }
      else
      {
        //windowManager.activate(this);
        //;;;if (typeof console != 'undefined') console.warn('make window activate on window.open()');
        this.realign();
      }
    },
    close: function(modalResult){
      if (!this.closed)
      {
        if (this.thread)
          this.thread.start(1);
        else
          DOM.remove(this.element);

        windowManager.removeChild(this);

        this.autocenter = this.autocenter_;

        this.closed = true;
        this.event_close(modalResult);
      }
    },
    destroy: function(){
      if (this.dde)
      {
        this.dde.destroy();
        delete this.dde;
      }

      UINode.prototype.destroy.call(this);

      this.cssRule.destroy();
      this.cssRule = null;
    }
  });

  //
  // Window manager
  //

  var wmBlocker = new Blocker();
  var windowManager = new UINode({
    template: resource('templates/window/windowManager.tmpl'),
    selection: true,
    childClass: Window
  });

  windowManager.addHandler({
    childNodesModified: function(){
      var modalIndex = -1;

      if (this.lastChild)
      {
        for (var i = 0, node; node = this.childNodes[i]; i++)
        {
          node.setZIndex(2001 + i * 2);
          //node.element.style.zIndex = 2001 + i * 2;
          if (node.modal)
            modalIndex = i;
        }

        this.lastChild.select();
      }

      if (modalIndex != -1)
        wmBlocker.capture(this.element, 2000 + modalIndex * 2);
      else
        wmBlocker.release();
    }
  });

  windowManager.selection.addHandler({
    datasetChanged: function(){
      var selected = this.pick();
      var lastWin = windowManager.lastChild;
      if (selected)
      {
        if (selected.parentNode == windowManager && selected != lastWin)
        {
          // put selected on top
          windowManager.insertBefore(selected);
          windowManager.event_childNodesModified({});
        }
      }
      else
      {
        if (lastWin)
          this.add([lastWin]);
      }
    }      
  });

  basis.ready(function(){
    DOM.insert(document.body, windowManager.element, DOM.INSERT_BEGIN);
    for (var node = windowManager.firstChild; node; node = node.nextSibling)
      node.realign();
  });


  //
  // export names
  //

  module.exports = {
    Window: Window,
    Blocker: Blocker,
    getWindowTopZIndex: function(){
      return windowManager.childNodes.length * 2 + 2001;
    }
  };
