
 /**
  * @see ./demo/defile/popup.html
  * @namespace basis.ui.popup
  */

  var namespace = this.path;


  //
  // import names
  //


  var window = global;
  var document = global.document;
  var arrayFrom = basis.array.from;

  var domUtils = require('basis.dom');
  var eventUtils = require('basis.dom.event');
  var cssom = require('basis.cssom');
  var createEvent = require('basis.event').create;
  var getOffsetParent = require('basis.layout').getOffsetParent;
  var getBoundingRect = require('basis.layout').getBoundingRect;
  var getViewportRect = require('basis.layout').getViewportRect;
  var Node = require('basis.ui').Node;


  //
  // definitions
  //

  var templates = require('basis.template').define(namespace, {
    Popup: resource('./templates/popup/Popup.tmpl'),
    Balloon: resource('./templates/popup/Balloon.tmpl'),
    popupManager: resource('./templates/popup/popupManager.tmpl')
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

  function resolveRelBox(relPoint, offsetParent){
    if (Array.isArray(relPoint))
      return {
        left: relPoint[0],
        right: relPoint[0],
        width: 0,
        top: relPoint[1],
        bottom: relPoint[1],
        height: 0
      };

    return getBoundingRect(relPoint, offsetParent);
  }

  function getTopZIndex(){
    var basisUiWindow = basis.resource.get(basis.resolveNSFilename('basis.ui.window'));
    return basisUiWindow ? basisUiWindow.fetch().getWindowTopZIndex() : 2001;
  }


  //
  // Popup manager
  //
  // NOTE: popupManager adds global event handlers dynamically because click event
  // which makes popup visible can also hide it (as click outside of popup).

  var popupManager = basis.object.extend([], {
    body: NaN,

    add: function(popup){
      if (!this.length)
      {
        eventUtils.addGlobalHandler('click', this.hideByClick, this);
        eventUtils.addGlobalHandler('keydown', this.hideByKey, this);
        eventUtils.addGlobalHandler('scroll', this.hideByScroll, this);
        eventUtils.addHandler(window, 'resize', this.realignAll, this);
      }

      this.unshift(popup);
      popup.setZIndex(getTopZIndex());

      if (this.body && !domUtils.parentOf(document, popup.element))
        this.body.appendChild(popup.element);
    },
    remove: function(popup){
      var popupIndex = this.indexOf(popup);

      if (popupIndex == -1)
        return;

      if (popup.hideOnAnyClick)
      {
        var nextPopup = this[popupIndex - 1];
        if (nextPopup)
          nextPopup.hide();
      }

      basis.array.remove(this, popup);
      if (popup.element.parentNode === this.body)
        domUtils.remove(popup.element);

      if (!this.length)
      {
        eventUtils.removeGlobalHandler('click', this.hideByClick, this);
        eventUtils.removeGlobalHandler('keydown', this.hideByKey, this);
        eventUtils.removeGlobalHandler('scroll', this.hideByScroll, this);
        eventUtils.removeHandler(window, 'resize', this.realignAll, this);
      }
    },
    clear: function(){
      arrayFrom(this).forEach(function(popup){
        popup.hide();
      });
    },

    realignAll: function(){
      this.forEach(function(popup){
        if (popup.autoRealign)
          popup.realign();
      });
    },

    hideByClick: function(event){
      if (!this.length)
        return;

      var ancestors = domUtils.axis(event.sender, domUtils.AXIS_ANCESTOR_OR_SELF);

      for (var i = 0, popup; popup = this[i]; i++)
      {
        if (ancestors.indexOf(popup.element) != -1 || ancestors.some(function(element){
          return popup.ignoreClickFor.indexOf(element) != -1;
        }))
        {
          for (var j = i - 1; popup = this[j]; j--)
            if (popup.hideOnAnyClick)
            {
              popup.hide();
              break;
            }

          return;
        }
      }

      // remove first hideOnAnyClick:true popup
      var firstOnAnyClickPopup = basis.array.lastSearch(this, true, 'hideOnAnyClick');
      if (firstOnAnyClickPopup)
        firstOnAnyClickPopup.hide();
    },
    hideByKey: function(event){
      var popup = this[0];

      if (popup)
      {
        var hideOnKey = popup.hideOnKey;
        var hide;

        if (typeof hideOnKey == 'function')
          hide = hideOnKey.call(this, event.key);

        if (Array.isArray(hideOnKey))
          hide = hideOnKey.indexOf(event.key) != -1;

        if (hide)
          popup.hide();
      }
    },
    hideByScroll: function(event){
      var sender = event.sender;

      if (domUtils.parentOf(sender, this.element))
        return;

      arrayFrom(this)
        .forEach(function(popup){
          if (popup.hideOnScroll &&
              popup.relElement_ && !Array.isArray(popup.relElement_) &&
              popup.offsetParent !== sender &&
              domUtils.parentOf(sender, popup.relElement_))
            popup.hide();
        });
    }
  });

  // async document.body ready
  basis.doc.body.ready(function(body){
    popupManager.body = body;
    popupManager.forEach(function(popup){
      if (!domUtils.parentOf(document, popup.element))
      {
        body.appendChild(popup.element);
        popup.realign();
      }
    });
  });


  //
  // popups
  //

 /**
  * @class
  */
  var Popup = Node.subclass({
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
    listen: {
      owner: {
        templateChanged: function(owner){
          if (this.visible)
            this.show.apply(this, this.visibleArgs_);
        }
      }
    },

    visible: false,
    visibleArgs_: null,
    autorotate: false,
    autoRealign: true,
    zIndex: 0,

    dir: '',
    defaultDir: DEFAULT_DIR,
    orientation: ORIENTATION.VERTICAL,
    relElement: null,
    relElement_: null,

    hideOnAnyClick: true,
    hideOnKey: false,
    hideOnScroll: true,
    ignoreClickFor: null,

    init: function(){
      Node.prototype.init.call(this);

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
      Node.prototype.templateSync.call(this);

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
    isFitToViewport: function(dir, relElement){
      if (this.visible && relElement)
      {
        var offsetParent = getOffsetParent(this.element);
        var box = resolveRelBox(relElement, offsetParent);
        var width = this.element.offsetWidth;
        var height = this.element.offsetHeight;

        // NOTE: temporary solution addresses to app where document or body
        // could be scrolled; for now it works, because popups lay into
        // popupManager layer and documentElement or body could be a offset parent;
        // but it would be broken when we allow popups to place in any layer in future;
        // don't forget to implement univesal solution in this case
        var viewport = getViewportRect(global, offsetParent);

        dir = normalizeDir(dir, this.dir).split(' ');

        var pointX = dir[0] == CENTER ? box.left + (box.width >> 1) : box[dir[0].toLowerCase()];
        var pointY = dir[1] == CENTER ? box.top + (box.height >> 1) : box[dir[1].toLowerCase()];

        if (
            (dir[2] != LEFT && pointX < (width >> (dir[2] == CENTER))) ||
            (dir[2] != RIGHT && (viewport.width - pointX + viewport.left) < (width >> (dir[2] == CENTER))) ||
            (dir[3] != TOP && pointY < (height >> (dir[3] == CENTER))) ||
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

      var relElement = this.visible && this.relElement_;
      if (relElement)
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
          if (point = this.isFitToViewport(curDir.join(' '), relElement))
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
          var box = resolveRelBox(relElement, offsetParent);

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
    resolveRelElement: function(value){
      if (typeof value == 'string')
      {
        if (value.substr(0, 6) != 'owner:')
          return domUtils.get(value);

        if (this.owner)
          return (this.owner.tmpl && this.owner.tmpl[value.substr(6)]) || this.owner.element;
        else
          return null;
      }

      if (Array.isArray(value))
        return value;

      return value || null;
    },
    show: function(relElement, dir, orientation){
      // store arguments for re-apply settings
      this.visibleArgs_ = basis.array(arguments);

      // assign new offset element
      this.relElement_ = this.resolveRelElement(relElement || this.relElement);

      // set up direction and orientation
      this.setLayout(normalizeDir(dir, this.defaultDir), orientation);

      // if not visible yet, make popup visible
      if (!this.visible)
      {
        // error on relElement no assigned
        if (!this.relElement_)
        {
          /** @cut */ basis.dev.warn('Popup#show(): relElement missed');
          return;
        }

        // make element invisible & insert element into DOM
        cssom.visibility(this.element, false);

        popupManager.add(this);

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
      this.visibleArgs_ = null;
      this.relElement_ = null;

      if (this.visible)
      {
        // set visible flag
        this.visible = false;

        popupManager.remove(this);

        // dispatch event
        this.emit_hide();
      }
    },
    hideAll: function(){
      popupManager.clear();
    },
    destroy: function(){
      this.hide();
      this.relElement = null;

      Node.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var Balloon = Popup.subclass({
    className: namespace + '.Balloon',

    template: templates.Balloon
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
