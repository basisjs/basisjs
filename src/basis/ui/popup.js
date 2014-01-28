
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.layout');
  basis.require('basis.l10n');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/popup.html
  * @namespace basis.ui.popup
  */

  var namespace = this.path;


  //
  // import names
  //


  var document = global.document;
  var documentElement = document && document.documentElement;
  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var cssom = basis.cssom;
  var layout = basis.layout;

  var getter = basis.getter;
  var arrayFrom = basis.array.from;
  var createEvent = basis.event.create;
  var getOffsetParent = basis.layout.getOffsetParent;
  var getBoundingRect = basis.layout.getBoundingRect;
  var getViewportRect = basis.layout.getViewportRect;

  var UINode = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Popup: resource('templates/popup/Popup.tmpl'),
    Balloon: resource('templates/popup/Balloon.tmpl'),
    popupManager: resource('templates/popup/popupManager.tmpl')
  });


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

  var DEFAULT_DIR = [RIGHT, BOTTOM, RIGHT, TOP].join(' ');
  // all possible correct dir values
  var DIR_MAP = (function(){
    var h = [LEFT, CENTER, RIGHT];
    var v = [TOP, CENTER, BOTTOM];
    var result = {};
    var perm = {};

    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++)
      {
        perm[h[i] + ' ' + v[j]] = h[i] + ' ' + v[j];
        perm[v[j] + ' ' + h[i]] = h[i] + ' ' + v[j];
      }

    for (var p1 in perm)
      for (var p2 in perm)
        result[p1 + ' ' + p2] = perm[p1] + ' ' + perm[p2];

    return result;
  })();

  function normalizeDir(value, valueOnFailure){
    return DIR_MAP[typeof value == 'string' && value.toUpperCase()] || valueOnFailure;
  }


 /**
  * @class
  */
  var Popup = Class(UINode, {
    className: namespace + '.Popup',

    template: templates.Popup,
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
          return (node.orientation + '-' + node.dir.split(' ').slice(2, 4).join('-')).toLowerCase();
        }
      }
    },
    action: {
      hide: function(){
        this.hide();
      }
    },

    emit_beforeShow: createEvent('beforeShow'),
    emit_show: createEvent('show'),
    emit_hide: createEvent('hide'),
    emit_realign: createEvent('realign'),
    emit_layoutChanged: createEvent('layoutChanged', 'oldOrientation', 'oldDir'),

    visible: false,
    autorotate: false,
    zIndex: 0,

    dir: '',
    defaultDir: DEFAULT_DIR,
    orientation: ORIENTATION.VERTICAL,

    hideOnAnyClick: true,
    hideOnKey: false,
    hideOnScroll: true,
    ignoreClickFor: null,

    init: function(){
      UINode.prototype.init.call(this);

      this.ignoreClickFor = arrayFrom(this.ignoreClickFor);

      if (this.dir)
      {
        this.dir = normalizeDir(this.dir, DEFAULT_DIR);
        this.defaultDir = this.dir;
      }
      else
      {
        this.defaultDir = normalizeDir(this.defaultDir, DEFAULT_DIR);
        this.dir = this.defaultDir;
      }

      this.setLayout(this.defaultDir, this.orientation);
    },
    templateSync: function(){
      UINode.prototype.templateSync.call(this);

      this.realign();
    },
    setLayout: function(dir, orientation, noRealign){
      var oldDir = this.dir;
      var oldOrientation = this.orientation;

      this.dir = normalizeDir(dir, this.dir);

      if (typeof orientation == 'string')
        this.orientation = orientation;

      if (oldDir != this.dir || oldOrientation != this.orientation)
      {
        this.emit_layoutChanged(oldOrientation, oldDir);
        if (!noRealign)
          this.realign();
      }
    },
    flip: function(orientation){
      var dir = this.dir.split(' ');
      var v = orientation == ORIENTATION.VERTICAL;

      dir[0 + v] = FLIP[dir[0 + v]];
      dir[2 + v] = FLIP[dir[2 + v]];

      this.setLayout(dir.join(' '));
    },
    rotate: function(offset){
      var dir = this.dir.split(' ');
      var result = [];

      offset = ((offset % 4) + 4) % 4;

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

      offset = a != 'C' && b != 'C' && (dir[0] == dir[2]) != (dir[1] == dir[3]) ? -offset + 4 : offset;

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
        var offsetParent = getOffsetParent(this.element);
        var box = getBoundingRect(this.relElement, offsetParent);
        var viewport = getViewportRect(offsetParent);
        var width = this.element.offsetWidth;
        var height = this.element.offsetHeight;

        dir = normalizeDir(dir, this.dir).split(' ');

        var pointX = dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()];
        var pointY = dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()];

        if (
            (dir[2] != LEFT && pointX < (width >> (dir[2] == CENTER)))
            ||
            (dir[2] != RIGHT && (viewport.width - pointX + viewport.left) < (width >> (dir[2] == CENTER)))
            ||
            (dir[3] != TOP && pointY < (height >> (dir[3] == CENTER)))
            ||
            (dir[3] != BOTTOM && (viewport.height - pointY + viewport.top) < (height >> (dir[3] == CENTER)))
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
      cssom.setStyle(this.element, {
        'z-index': zIndex
      });
    },
    realign: function(){
      this.setZIndex(this.zIndex);

      if (this.visible && this.relElement)
      {
        var dir = this.dir.split(' ');
        var point;
        var rotateOffset = 0;
        var curDir = dir;
        var dirH = dir[2];
        var dirV = dir[3];
        var maxRotate = typeof this.autorotate == 'number' || !this.autorotate.length ? 3 : this.autorotate.length;
        var offsetParent = getOffsetParent(this.element);

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
              curDir = normalizeDir(rotate, curDir.join(' ')).split(' ');
            else
              curDir = this.rotate(rotate);
          }
          else
            curDir = this.rotate(++rotateOffset * this.autorotate);
        }

        if (!point)
        {
          var box = getBoundingRect(this.relElement, offsetParent);

          point = {
            x: dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()],
            y: dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()]
          };
        }

        var style = {
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto'
        };

        switch (dirH)
        {
          case LEFT:
            style.left = point.x + 'px';
            break;
          case CENTER:
            style.left = Math.round(point.x - this.element.offsetWidth / 2) + 'px';
            break;
          case RIGHT:
            style.right = (offsetParent.clientWidth - point.x) + 'px';
            break;
        }

        switch (dirV)
        {
          case TOP:
            style.top = point.y + 'px';
            break;
          case CENTER:
            style.top = Math.round(point.y - this.element.offsetHeight / 2) + 'px';
            break;
          case BOTTOM:
            style.bottom = (offsetParent.clientHeight - point.y) + 'px';
            break;
        }

        cssom.setStyle(this.element, style);

        this.emit_realign();
      }
    },
    show: function(relElement, dir, orientation){
      // assign new offset element
      this.relElement = DOM.get(relElement) || this.relElement;

      // set up direction and orientation
      this.setLayout(normalizeDir(dir, this.defaultDir), orientation);

      // if not visible yet, make popup visible
      if (!this.visible)
      {
        // error on relElement no assigned
        if (!this.relElement)
        {
          ;;;basis.dev.warn('Popup#show(): relElement missed');
          return;
        }

        // make element invisible & insert element into DOM
        cssom.visibility(this.element, false);

        popupManager.appendChild(this);

        // dispatch `beforeShow` event, there we can fill popup with content
        this.emit_beforeShow();

        // set visible flag
        this.visible = true;

        // realign position and make it visible
        this.realign();

        cssom.visibility(this.element, true);

        // dispatch `show` event, there we can set focus for elements etc.
        this.emit_show();
      }
      else
        this.realign();
    },
    hide: function(){
      if (this.visible)
      {
        // set visible flag
        this.visible = false;

        if (this.parentNode)
          popupManager.removeChild(this);

        // dispatch event
        this.emit_hide();
      }
    },
    hideAll: function(){
      popupManager.clear();
    },
    destroy: function(){
      this.hide();

      UINode.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var Balloon = Class(Popup, {
    className: namespace + '.Balloon',

    template: templates.Balloon
  });


  //
  //  Popup manager
  //

  // NOTE: popupManager adds global event handlers dynamically because click event
  // which makes popup visible can also hide it (as click outside of popup).

  var popupManager = new UINode({
    template: templates.popupManager,

    selection: true,

    emit_childNodesModified: function(delta){
      if (delta.deleted)
        for (var i = delta.deleted.length - 1, item; item = delta.deleted[i]; i--)
          item.hide();

      if (delta.inserted && !delta.deleted && this.childNodes.length == delta.inserted.length)
      {
        Event.addGlobalHandler('click', this.hideByClick, this);
        Event.addGlobalHandler('keydown', this.hideByKey, this);
        Event.addGlobalHandler('scroll', this.hideByScroll, this);
        Event.addHandler(window, 'resize', this.realignAll, this);
      }

      if (this.lastChild)
        this.lastChild.select();
      else
      {
        Event.removeGlobalHandler('click', this.hideByClick, this);
        Event.removeGlobalHandler('keydown', this.hideByKey, this);
        Event.removeGlobalHandler('scroll', this.hideByScroll, this);
        Event.removeHandler(window, 'resize', this.realignAll, this);
      }

      UINode.prototype.emit_childNodesModified.call(this, delta);
    },

    insertBefore: function(newChild, refChild){
      if (UINode.prototype.insertBefore.call(this, newChild, refChild))
        newChild.setZIndex(basis.ui.window ? basis.ui.window.getWindowTopZIndex() : 2001);
    },
    removeChild: function(popup){
      if (popup)
      {
        if (popup.hideOnAnyClick && popup.nextSibling)
          this.removeChild(popup.nextSibling);

        UINode.prototype.removeChild.call(this, popup);
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
      if (!this.firstChild)
        return;

      var ancestorAxis = DOM.axis(event.sender, DOM.AXIS_ANCESTOR_OR_SELF);

      for (var popup = this.lastChild; popup; popup = popup.previousSibling)
      {
        if (ancestorAxis.indexOf(popup.element) != -1 || ancestorAxis.some(function(element){
          return popup.ignoreClickFor.indexOf(element) != -1;
        }))
        {
          while (popup = popup.nextSibling)
          {
            if (popup.hideOnAnyClick)
            {
              this.removeChild(popup);
              break;
            }
          }

          return;
        }
      }

      // remove first hideOnAnyClick:true popup
      this.removeChild(this.getChild(true, 'hideOnAnyClick'));
    },
    hideByKey: function(event){
      var popup = this.lastChild;
      if (popup && popup.hideOnKey)
      {
        var result = false;

        if (typeof popup.hideOnKey == 'function')
          result = popup.hideOnKey(event.key);
        else
          if (Array.isArray(popup.hideOnKey))
            result = popup.hideOnKey.indexOf(event.key) != -1;

        if (result)
          popup.hide();
      }
    },
    hideByScroll: function(event){
      var sender = event.sender;

      if (DOM.parentOf(sender, this.element))
        return;

      var popup = this.lastChild;
      while (popup)
      {
        var next = popup.previousSibling;
        if (popup.hideOnScroll && popup.relElement && popup.offsetParent !== sender && DOM.parentOf(sender, popup.relElement))
          popup.hide();
        popup = next;
      }
    }
  });

  basis.doc.body.ready(function(body){
    DOM.insert(body, popupManager.element, DOM.INSERT_BEGIN);
    popupManager.realignAll();
  });


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

    // classes
    Popup: Popup,
    Balloon: Balloon
  };
