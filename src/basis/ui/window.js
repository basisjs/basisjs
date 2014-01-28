
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
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
  // definitions
  //

  var dict = basis.l10n.dictionary(__filename);

  var templates = basis.template.define(namespace, {
    Blocker: resource('templates/window/Blocker.tmpl'),
    Window: resource('templates/window/Window.tmpl'),
    TitleButton: resource('templates/window/TitleButton.tmpl'),
    ButtonPanel: resource('templates/window/ButtonPanel.tmpl'),
    windowManager: resource('templates/window/windowManager.tmpl')
  });


  //
  // main part
  //

 /**
  * @class
  */
  var Blocker = Class(UINode, {
    className: namespace + '.Blocker',

    template: templates.Blocker,

    captureElement: null,
    capture: function(element, zIndex){
      this.captureElement = DOM.get(element || document.body);
      if (this.captureElement)
      {
        DOM.insert(this.captureElement, this.element);
        this.element.style.zIndex = zIndex || 1000;
      }
    },
    release: function(){
      if (this.captureElement)
      {
        if (this.element.parentNode == this.captureElement)
          DOM.remove(this.element);

        this.captureElement = null;
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
    start: function(){
      this.autocenter = false;
      this.element.style.margin = 0;
    }
  };

 /**
  * @class
  */
  var Window = Class(UINode, {
    className: namespace + '.Window',

    emit_beforeShow: createEvent('beforeShow'),
    emit_open: createEvent('open'),
    emit_close: createEvent('close'),
    emit_active: createEvent('active'),

    closeOnEscape: true,

    autocenter: true,
    autocenter_: false,
    modal: false,
    closed: true,
    moveable: true,
    zIndex: 0,

    dde: null,

    title: dict.token('emptyTitle'),

    template: templates.Window,
    binding: {
      title: 'title',
      titleButtons: 'satellite:',
      moveable: 'moveable'
    },
    action: {
      close: function(){
        this.close();
      },
      mousedown: function(){
        this.activate();
      },
      keydown: function(event){
        switch (event.key)
        {
          case event.KEY.ESCAPE:
            if (this.closeOnEscape)
              this.close();
            break;

          case event.KEY.ENTER:
            if (event.sender.tagName != 'TEXTAREA')
              event.die();
            break;
        }
      }
    },

    buttonPanelClass: ButtonPanel.subclass({
      className: namespace + '.ButtonPanel',

      template: templates.ButtonPanel,
      listen: {
        owner: {
          select: function(){
            if (this.firstChild)
              this.firstChild.focus();
          }
        }
      }
    }),

    satellite: {
      titleButtons: {
        existsIf: function(owner){
          return !owner.titleButton || owner.titleButton.close !== false;
        },
        instanceOf: UINode.subclass({
          className: namespace + '.TitleButton',

          template: templates.TitleButton,
          action: {
            close: function(){
              this.owner.close();
            }
          }
        })
      }
    },

    init: function(){
      UINode.prototype.init.call(this);

      // make window moveable
      if (this.moveable)
        this.dde = new basis.dragdrop.MoveableElement({
          fixRight: false,
          fixBottom: false,
          handler: {
            context: this,
            callbacks: DD_HANDLER
          }
        });

      // common buttons
      var commonButtons = basis.object.iterate(basis.object.slice(this, ['buttonOk', 'buttonCancel']), function(key, button){
        return {
          name: key == 'buttonOk' ? 'ok' : 'cancel',
          caption: button.caption || button.title || button
        };
      }, this);

      // buttons
      var buttons = arrayFrom(this.buttons).concat(commonButtons).map(function(button){
        return basis.object.complete({
          click: (button.click || this.close).bind(this)
        }, button);
      }, this);

      // build button panel
      if (buttons.length)
        this.buttonPanel = new this.buttonPanelClass({
          owner: this,
          childNodes: buttons
        });

      if (this.autocenter !== false)
      {
        this.autocenter = true;
        this.autocenter_ = true;
      }
    },
    setTitle: function(title){
      this.title = title;
      this.updateBind('title');
    },
    templateSync: function(){
      var style;
      if (!this.autocenter && this.element.nodeType == 1)
        style = basis.object.slice(this.element.style, ['left', 'top', 'margin']);

      UINode.prototype.templateSync.call(this);

      if (this.element.nodeType == 1)
      {
        if (style)
          cssom.setStyle(this.element, style);

        if (this.dde)
          this.dde.setElement(this.element, this.tmpl.ddtrigger || (this.tmpl.title && this.tmpl.title.parentNode) || this.element);

        if (this.buttonPanel)
          DOM.insert(this.tmpl.content || this.element, this.buttonPanel.element);
      }

      this.realign();
    },
    setZIndex: function(zIndex){
      this.zIndex = zIndex;
      if (this.tmpl && this.element.style)
        this.element.style.zIndex = zIndex;
    },
    realign: function(){
      this.setZIndex(this.zIndex);
      if (this.tmpl && this.autocenter)
      {
        cssom.setStyle(this.element,
          this.element.offsetWidth
            ? {
                left: '50%',
                top: '50%',
                marginLeft: -this.element.offsetWidth / 2 + 'px',
                marginTop: -this.element.offsetHeight / 2 + 'px'
              }
            : {
                left: 0,
                top: 0,
                margin: 0
              }
        );
      }
    },
    activate: function(){
      this.select();
    },
    open: function(params){
      if (this.closed)
      {
        cssom.visibility(this.element, false);

        windowManager.appendChild(this);
        this.closed = false;

        this.realign();

        this.emit_beforeShow(params);
        cssom.visibility(this.element, true);

        this.emit_open(params);
        //this.emit_active(params);
      }
      else
      {
        this.realign();
      }
    },
    close: function(){
      if (!this.closed)
      {
        windowManager.removeChild(this);
        this.closed = true;

        this.autocenter = this.autocenter_;

        this.emit_close();
      }
    },
    destroy: function(){
      if (this.dde)
      {
        this.dde.destroy();
        this.dde = null;
      }

      if (this.buttonPanel)
      {
        this.buttonPanel.destroy();
        this.buttonPanel = null;
      }

      UINode.prototype.destroy.call(this);
    }
  });

  //
  // Window manager
  //

  var windowManager = new UINode({
    template: templates.windowManager,
    selection: true,
    blocker: basis.fn.lazyInit(function(){
      return new Blocker();
    })
  });

  windowManager.addHandler({
    childNodesModified: function(){
      var modalIndex = -1;

      if (this.lastChild)
      {
        for (var i = 0, node; node = this.childNodes[i]; i++)
        {
          node.setZIndex(2001 + i * 2);

          if (node.modal)
            modalIndex = i;
        }

        this.lastChild.select();
      }

      if (modalIndex != -1)
        this.blocker().capture(this.element, 2000 + modalIndex * 2);
      else
        this.blocker().release();
    }
  });

  windowManager.selection.addHandler({
    itemsChanged: function(){
      var selected = this.pick();
      var lastWin = windowManager.lastChild;

      if (selected)
      {
        if (selected.parentNode == windowManager && selected != lastWin)
        {
          // put selected on top
          windowManager.insertBefore(selected);
          windowManager.emit_childNodesModified({});
        }
      }
      else
      {
        if (lastWin)
          this.add([lastWin]);
      }
    }
  });

  basis.doc.body.ready(function(body){
    DOM.insert(body, windowManager.element, DOM.INSERT_BEGIN);
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
