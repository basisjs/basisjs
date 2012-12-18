
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.layout');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/popup.html
  * @namespace basis.ui.popup
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;

  var getter = Function.getter;
  var arrayFrom = basis.array.from;
  var createEvent = basis.event.create;

  var nsLayout = basis.layout;

  var UINode = basis.ui.Node;


  //
  // main part
  //

  var LEFT = 'LEFT';
  var RIGHT = 'RIGHT';
  var TOP = 'TOP';
  var BOTTOM = 'BOTTOM';
  var CENTER = 'CENTER';

  var ORIENTATION = {
    VERTICAL: 'V',
    HORIZONTAL: 'H'
  };

  var ROTATE_MATRIX = String('LTRTRBLBLCCTRCCBCCCCCCCC');

  var LETTER_TO_SIDE = {
    L: LEFT,
    R: RIGHT,
    T: TOP,
    B: BOTTOM,
    C: CENTER
  };

  var FLIP = {
    LEFT: RIGHT,
    RIGHT: LEFT,
    TOP: BOTTOM,
    BOTTOM: TOP,
    CENTER: CENTER
  };

  var THREAD_HANDLER = {
    finish: function(){
      if (!this.visible)
      {
        DOM.remove(this.element);
        this.event_cleanup();
      }
    }
  };

 /**
  * @class
  */
  var Popup = Class(UINode, {
    className: namespace + '.Popup',

    closeText: 'Close',

    template: resource('templates/popup/Popup.tmpl'),

    binding: {
      visible: {
        events: 'show hide',
        getter: function(node){
          return node.visible ? 'visible' : 'hidden';
        }
      },
      orientation: {
        events: 'layoutChanged',
        getter: function(node){
          return (node.orientation + '-' + node.dir.qw().slice(2, 4).join('-')).toLowerCase();
        }
      },
      closeText: function(node){
        return node.closeText;
      }
    },

    action: {
      hide: function(){
        this.hide();
      }
    },

    event_beforeShow: createEvent('beforeShow'),
    event_show: createEvent('show'),
    event_hide: createEvent('hide'),
    event_realign: createEvent('realign'),
    event_cleanup: createEvent('cleanup'),
    event_layoutChanged: createEvent('layoutChanged', 'oldOrientation', 'oldDir'),

    visible: false,
    autorotate: false,

    dir: '',
    defaultDir: [RIGHT, BOTTOM, RIGHT, TOP].join(' '),
    orientation: ORIENTATION.VERTICAL,

    hideOnAnyClick: true,
    hideOnKey: false,
    ignoreClickFor: null,

    init: function(){
      UINode.prototype.init.call(this);

      // add generic rule
      this.cssRule = cssom.uniqueRule(this.element);

      // 
      this.ignoreClickFor = arrayFrom(this.ignoreClickFor);

      if (this.dir)
        this.defaultDir = this.dir.toUpperCase();

      this.setLayout(this.defaultDir, this.orientation);
        
      if (this.thread)
        this.thread.addHandler(THREAD_HANDLER, this);
    },
    templateSync: function(noRecreate){
      UINode.prototype.templateSync.call(this, noRecreate);
      if (this.element)
      {
        cssom.classList(this.element).add(this.cssRule.token);
        this.realign();
      }
    },
    setLayout: function(dir, orientation, noRealign){
      var oldDir = this.dir;
      var oldOrientation = this.orientation;

      if (typeof dir == 'string')
        this.dir = dir.toUpperCase();

      if (typeof orientation == 'string')
        this.orientation = orientation;

      if (oldDir != this.dir || oldOrientation != this.orientation)
      {
        this.event_layoutChanged(oldOrientation, oldDir);
        if (!noRealign)
          this.realign();
      }
    },
    flip: function(orientation){
      var dir = this.dir.qw();
      var v = orientation == ORIENTATION.VERTICAL;

      dir[0 + v] = FLIP[dir[0 + v]];
      dir[2 + v] = FLIP[dir[2 + v]];
      
      this.setLayout(dir.join(' '));
    },
    rotate: function(offset){
      var dir = this.dir.qw();
      offset = ((offset % 4) + 4) % 4;

      var result = [];

      if (!offset)
        return dir;

      // point
      var a = dir[0].charAt(0);
      var b = dir[1].charAt(0);
      var idx = ROTATE_MATRIX.indexOf(a + b) >> 1;

      var index = ((idx & 0xFC) + (((idx & 0x03) + offset) & 0x03)) << 1;

      result.push(
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index)],
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index + 1)]
      );

      // direction
      var a = dir[2].charAt(0);
      var b = dir[3].charAt(0);
      var idx = ROTATE_MATRIX.indexOf(a + b) >> 1;

      offset = (a != 'C' && b != 'C') && ((dir[0] == dir[2]) != (dir[1] == dir[3])) ? -offset + 4 : offset;
      var index = ((idx & 0xFC) + (((idx & 0x03) + offset) & 0x03)) << 1;

      result.push(
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index)],
        LETTER_TO_SIDE[ROTATE_MATRIX.charAt(index + 1)]
      );

      return result;
    },
    isFitToViewport: function(dir){
      if (this.visible && this.relElement)
      {
        var box = new nsLayout.Box(this.relElement, false, this.element.offsetParent);
        var viewport = new nsLayout.Viewport(this.element.offsetParent);
        var width  = this.element.offsetWidth;
        var height = this.element.offsetHeight;

        dir = String(dir || this.dir).toUpperCase().qw();

        var pointX = dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()];
        var pointY = dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()];

        if (
            (dir[2] != LEFT) * (pointX < (width >> (dir[2] == CENTER)))
            ||
            (dir[2] != RIGHT) * ((viewport.width - pointX) < (width >> (dir[2] == CENTER)))
           )
          return false;

        if (
            (dir[3] != TOP) * (pointY < (height >> (dir[3] == CENTER)))
            ||
            (dir[3] != BOTTOM) * ((viewport.height - pointY) < (height >> (dir[3] == CENTER)))
           )
          return false;

        return {
          x: pointX,
          y: pointY
        };
      }
    },
    setZIndex: function(zIndex){
      this.zIndex = isNaN(zIndex) ? 'auto' : zIndex;
      //this.element.style.zIndex = zIndex;
      cssom.setStyle(this.element, {
        'z-index': zIndex
      });
    },
    realign: function(){
      this.setZIndex(this.zIndex);
      if (this.visible && this.relElement)
      {
        var dir = this.dir.qw();

        var point;
        var rotateOffset = 0;
        var curDir = dir;
        var dirH = dir[2];
        var dirV = dir[3];
        var maxRotate = typeof this.autorotate == 'number' || !this.autorotate.length ? 3 : this.autorotate.length;
        while (this.autorotate && rotateOffset <= maxRotate)
        {
          if (point = this.isFitToViewport(curDir.join(' ')))
          {
            dirH = curDir[2];
            dirV = curDir[3];
            this.setLayout(curDir.join(' '), null, true);
            break;
          }

          if (rotateOffset == maxRotate)
            break;

          if (Array.isArray(this.autorotate))
          {
            var rotate = this.autorotate[rotateOffset++];

            if (typeof rotate == 'string')
              curDir = rotate.toUpperCase().split(' ');
            else
              curDir = this.rotate(rotate);
          }
          else
            curDir = this.rotate(++rotateOffset * this.autorotate);
        }

        if (!point)
        {
          var box = new nsLayout.Box(this.relElement, false, this.element.offsetParent);
          point = {
            x: dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()],
            y: dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()]
          };
        }

        var offsetParentBox = new nsLayout.Box(this.element.offsetParent);

        var style = {
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto'
        };

        switch (dirH){
          case LEFT:
            style.left = point.x + 'px';
            break;
          case CENTER:
            style.left = Math.round(point.x - this.element.offsetWidth/2) + 'px';
            break;
          case RIGHT:
            style.right = (offsetParentBox.width - point.x) + 'px';
            break;
        }

        switch (dirV){
          case TOP:
            style.top = point.y + 'px';
            break;
          case CENTER:
            style.top = Math.round(point.y - this.element.offsetHeight/2) + 'px';
            break;
          case BOTTOM:
            style.bottom = (offsetParentBox.height - point.y) + 'px';
            break;
        }

        this.cssRule.setStyle(style);

        this.event_realign();
      }
    },
    show: function(relElement, dir, orientation){
      // assign new offset element
      this.relElement = DOM.get(relElement) || this.relElement;

      // set up direction and orientation
      this.setLayout(dir || this.defaultDir, orientation);

      // if not visible yet, make popup visible
      if (!this.visible)
      {
        // error on relElement no assigned
        if (!this.relElement)
        {
          ;;;if (typeof console != 'undefined') console.warn('Popup.show(): relElement missed');
          return;
        }

        // make element invisible & insert element into DOM
        cssom.visibility(this.element, false);

        popupManager.appendChild(this);

        // dispatch `beforeShow` event, there we can fill popup with content
        this.event_beforeShow();

        // set visible flag to TRUE
        this.visible = true;

        // realign position and make it visible
        this.realign();
        if (this.thread) this.thread.start(1);
        cssom.visibility(this.element, true);

        // dispatch `show` event, there we can set focus for elements etc.
        this.event_show();
      }
      else
        this.realign();
    },
    hide: function(){
      if (this.visible)
      {
        // remove from DOM
        if (DOM.parentOf(document.body, this.element))
        {
          if (this.thread)
            this.thread.start(1);
          else
          {
            DOM.remove(this.element);
            this.event_cleanup();
          }
        }

        // set visible flag to FALSE
        this.visible = false;
        if (this.parentNode)
          popupManager.removeChild(this);

        // dispatch event
        this.event_hide();
      }
    },
    hideAll: function(){
      popupManager.clear();
    },
    destroy: function(){
      if (this.thread)
      {
        this.thread.removeHandler(THREAD_HANDLER, this);
        this.thread = null;
      }

      this.hide();

      UINode.prototype.destroy.call(this);

      this.cssRule.destroy();
      this.cssRule = null;
    }
  });

 /**
  * @class
  */
  var Balloon = Class(Popup, {
    className: namespace + '.Balloon',

    template: resource('templates/popup/Balloon.tmpl')
  });


  //
  //  Popup manager
  //

  // NOTE: popupManager adds global event handlers dynamically because click event
  // which makes popup visible can also hide it (as click outside of popup).

  var popupManager = new UINode({
    template: resource('templates/popup/popupManager.tmpl'),

    handheldMode: false,

    selection: true,
    childClass: Popup,
    event_childNodesModified: function(delta){
      if (delta.deleted)
        for (var i = delta.deleted.length - 1, item; item = delta.deleted[i]; i--)
          item.hide();

      if (delta.inserted && !delta.deleted && this.childNodes.length == delta.inserted.length)
      {
        document.body.className = document.body.className; // BUGFIX: for IE7+ and webkit (chrome8/safari5)
                                                           // general sibling combinator (~) doesn't work otherwise
                                                           // (it's useful for handheld scenarios, when popups show on fullsreen)
        Event.addGlobalHandler('click', this.hideByClick, this);
        Event.addGlobalHandler('keydown', this.hideByKey, this);
        Event.addGlobalHandler('scroll', this.hideByScroll, this);
        Event.addHandler(window, 'resize', this.realignAll, this);
      }

      if (this.lastChild)
        this.lastChild.select();
      else
      {
        document.body.className = document.body.className; // BUGFIX: for IE7+ and webkit (chrome8/safari5)
                                                           // general sibling combinator (~) doesn't work otherwise
                                                           // (it's useful for handheld scenarios, when popups show on fullsreen)
        Event.removeGlobalHandler('click', this.hideByClick, this);
        Event.removeGlobalHandler('keydown', this.hideByKey, this);
        Event.removeGlobalHandler('scroll', this.hideByScroll, this);
        Event.removeHandler(window, 'resize', this.realignAll, this);
      }

      UINode.prototype.event_childNodesModified.call(this, delta);
    },

    insertBefore: function(newChild, refChild){
      // save documentElement (IE, mozilla and others) and body (webkit) scrollTop
      var documentScrollTop = document.documentElement.scrollTop;
      var bodyScrollTop = document.body.scrollTop;

      if (UINode.prototype.insertBefore.call(this,newChild, refChild))
      {
        // store saved scrollTop to popup and scroll viewport to top
        newChild.documentST_ = documentScrollTop;
        newChild.bodyST_ = bodyScrollTop;
        if (this.handheldMode)
        {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }

        // set zIndex
        newChild.setZIndex(basis.ui.window ? basis.ui.window.getWindowTopZIndex() : 2001);
      }
    },
    removeChild: function(popup){
      if (popup)
      {
        if (popup.hideOnAnyClick && popup.nextSibling)
          this.removeChild(popup.nextSibling);

        UINode.prototype.removeChild.call(this, popup);

        // restore documentElement (IE, mozilla and others) and body (webkit) scrollTop
        if (this.handheldMode)
        {
          document.documentElement.scrollTop = popup.documentST_;
          document.body.scrollTop = popup.bodyST_;
        }
      }
    },
    realignAll: function(){
      for (var popup = this.firstChild; popup; popup = popup.nextSibling)
        popup.realign();
    },
    clear: function(){
      if (this.firstChild)
        this.removeChild(this.firstChild);
    },
    hideByClick: function(event){
      var sender = Event.sender(event);
      var ancestorAxis;

      var popups = this.childNodes.filter(getter('hideOnAnyClick')).reverse();

      for (var i = 0, popup; popup = popups[i]; i++)
      {
        if (!ancestorAxis)
          ancestorAxis = DOM.axis(sender, DOM.AXIS_ANCESTOR_OR_SELF);

        if (ancestorAxis.has(popup.element) || ancestorAxis.some(Array.prototype.has, popup.ignoreClickFor))
        {
          this.removeChild(popups[i - 1]);
          return;
        }
      }

      this.removeChild(popups.pop());
      //this.clear();
    },
    hideByKey: function(event){
      var key = Event.key(event);
      var popup = this.lastChild;
      if (popup && popup.hideOnKey)
      {
        var result = false;

        if (typeof popup.hideOnKey == 'function')
          result = popup.hideOnKey(key);
        else
          if (Array.isArray(popup.hideOnKey))
            result = popup.hideOnKey.has(key);

        if (result)
          popup.hide();
      }
    },
    hideByScroll: function(event){
      var sender = Event.sender(event);

      if (DOM.parentOf(sender, this.element))
        return;

      var popup = this.lastChild;
      while (popup)
      {
        var next = popup.previousSibling;
        if (popup.relElement && popup.offsetParent !== sender && DOM.parentOf(sender, popup.relElement))
          popup.hide();
        popup = next;
      }
    }
  });

  basis.ready(function(){
    DOM.insert(document.body, popupManager.element, DOM.INSERT_BEGIN);
    popupManager.realignAll();
  });

  function setHandheldMode(mode){
    popupManager.handheldMode = !!mode;
  }

  //
  // export names
  //

  module.exports = {
    // const
    ORIENTATION: ORIENTATION,
    DIR: {
      LEFT: LEFT,
      RIGHT: RIGHT,
      TOP: TOP,
      BOTTOM: BOTTOM,
      CENTER: CENTER
    },

    // methods
    setHandheldMode: setHandheldMode,

    // classes
    Popup: Popup,
    Balloon: Balloon
  };
