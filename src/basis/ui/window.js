
 /**
  * @see ./demo/defile/window.html
  * @namespace basis.ui.window
  */

  var namespace = 'basis.ui.window';


  //
  // import names
  //

  var document = global.document;
  var Class = basis.Class;
  var arrayFrom = basis.array.from;
  var resolveValue = require('../data.js').resolveValue;
  var DOM = require('../dom.js');
  var cssom = require('../cssom.js');
  var createEvent = require('../event.js').create;
  var Node = require('../ui.js').Node;
  var ButtonPanel = require('./button.js').ButtonPanel;
  var MoveableElement = require('../dragdrop.js').MoveableElement;


  //
  // definitions
  //

  var dict = require('../l10n.js').dictionary(__filename);

  var templates = require('../template.js').define(namespace, {
    Blocker: resource('./templates/window/Blocker.tmpl'),
    Window: resource('./templates/window/Window.tmpl'),
    TitleButton: resource('./templates/window/TitleButton.tmpl'),
    ButtonPanel: resource('./templates/window/ButtonPanel.tmpl'),
    windowManager: resource('./templates/window/windowManager.tmpl')
  });


  //
  // main part
  //

 /**
  * @class
  */
  var Blocker = Class(Node, {
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

      Node.prototype.destroy.call(this);
    }
  });

  //
  //  Window
  //

  var DD_HANDLER = {
    start: function(){
      this.autocenter = false;
    }
  };

 /**
  * @class
  */
  var Window = Class(Node, {
    className: namespace + '.Window',

    propertyDescriptors: {
      visible: 'open close'
    },

    emit_open: createEvent('open'),
    emit_close: createEvent('close'),

    closeOnEscape: true,
    autocenter: true,
    autocenter_: false,
    modal: false,
    closed: true,
    moveable: true,
    zIndex: 0,

    visible: false,
    visibleRA_: null,

    dde: null,

    title: '',
    titleRA_: null,

    template: templates.Window,
    binding: {
      title: 'title',
      moveable: 'moveable',
      titleButtons: 'satellite:'
    },
    action: {
      close: function(){
        if (this.visibleRA_)
        {
          /** @cut */ basis.dev.warn('`visible` property is under bb-value and can\'t be changed by user action. Override `close` action to make your logic working.');
          return;
        }

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
              this.action.close.call(this, event);
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
        instance: Node.subclass({
          className: namespace + '.TitleButton',

          template: templates.TitleButton,
          action: {
            close: function(event){
              this.owner.action.close.call(this.owner, event);
            }
          }
        })
      }
    },

    init: function(){
      Node.prototype.init.call(this);

      this.setTitle(this.title || dict.token('emptyTitle'));

      // make window moveable
      if (this.moveable)
        this.dde = new MoveableElement({
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

      /** @deprecated 1.4 */
      /** @cut */ if (this.closed !== true)
      /** @cut */   basis.dev.warn(namespace + '.Window: `closed` property can\'t be set on create and deprecated (use `visible` instead)');
      /** @cut */ this.closed = true;
      /** @cut */ basis.dev.warnPropertyAccess(this, 'closed', true, namespace + '.Window: `closed` property is deprecated, use `visible` instead');

      var visible = this.visible;
      this.visible = false;

      if (visible)
      {
        // it's a hack to propertly add to window stack, when visible on init
        // TODO: find out better solution
        this.element = document.createComment('');

        // no custom code, as `open` event emit is desired behaviour
        this.setVisible(visible);
      }
    },
    setTitle: function(title){
      title = resolveValue(this, this.setTitle, title, 'titleRA_');

      if (this.title != title)
      {
        this.title = title;

        // for backward capability
        if (this.tmpl)
          this.updateBind('title');
      }
    },
    templateSync: function(){
      var style;

      if (!this.autocenter && this.element.nodeType == 1)
        style = basis.object.slice(this.element.style, ['left', 'top', 'margin']);

      Node.prototype.templateSync.call(this);

      if (this.element.nodeType == 1)
      {
        if (style)
          cssom.setStyle(this.element, style);

        if (this.dde)
          this.dde.setElement(this.tmpl.ddelement || this.element, this.tmpl.ddtrigger || (this.tmpl.title && this.tmpl.title.parentNode) || this.element);

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
    setVisible: function(visible){
      visible = !!resolveValue(this, this.setVisible, visible, 'visibleRA_');

      if (this.visible !== visible)
      {
        if (visible)
        {
          windowManager.appendChild(this);

          this.visible = true;
          this.closed = false;

          this.realign();

          this.emit_open();
        }
        else
        {
          windowManager.removeChild(this);

          this.visible = false;
          this.closed = true;

          this.autocenter = this.autocenter_;

          this.emit_close();
        }
      }

      if (visible)
        this.realign();
    },
    open: function(){
      if (this.visibleRA_)
      {
        /** @cut */ basis.dev.warn('`visible` property is under bb-value and can\'t be changed by `open()` method. Use `setVisible()` instead.');
        return false;
      }

      this.setVisible(true);
    },
    close: function(){
      if (this.visibleRA_)
      {
        /** @cut */ basis.dev.warn('`visible` property is under bb-value and can\'t be changed by `close()` method. Use `setVisible()` instead.');
        return false;
      }

      this.setVisible(false);
    },
    destroy: function(){
      // NOTE: no resolveValue required, as on this.setVisible(false)
      // resolve adapter will be destroyed
      this.setVisible(false);

      if (this.titleRA_)
        resolveValue(this, null, null, 'titleRA_');

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

      Node.prototype.destroy.call(this);
    }
  });

  //
  // Window manager
  //

  var windowManager = new Node({
    role: 'basis-window-manager',

    template: templates.windowManager,
    blocker: basis.fn.lazyInit(function(){
      return new Blocker({
        role: 'basis-modal-window-mate'
      });
    }),

    selection: true,
    listen: {
      selection: {
        itemsChanged: function(selection){
          var selected = selection.pick();
          var lastWin = this.lastChild;

          if (selected)
          {
            if (selected.parentNode == this && selected != lastWin)
            {
              // put selected on top
              this.insertBefore(selected);
              this.emit_childNodesModified({});
            }
          }
          else
          {
            if (lastWin)
              selection.add([lastWin]);
          }
        }
      }
    },
    handler: {
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
    }
  });

  basis.doc.body.ready(function(body){
    body.insertBefore(windowManager.element, body.firstChild);
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
