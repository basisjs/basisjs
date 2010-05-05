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

    var namespace = 'Basis.Controls.Popup';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var Template = Basis.Html.Template;
    var Cleaner = Basis.Cleaner;

    var nsWrapers = DOM.Wrapers;
    var nsLayout = Basis.Layout;

    if (!nsLayout)
      throw 'Basis.Controls.Popup: Basis.Layout required';

    //
    // CONST
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


    //
    //  Popup manager
    //

    // NOTE: PopupManager adds global event handlers dynamicaly because click event
    // that makes popup visible can also hide it (as click outside of popup).

    var PopupManager = new (Class(nsWrapers.Node, {
      className: namespace + '.PopupManager',

      behaviour: nsWrapers.createBehaviour(nsWrapers.Node, {
        childNodesModified: function(node, delta){
          if (delta.deleted)
            for (var i = delta.deleted.length - 1, item; item = delta.deleted[i]; i--)
              item.node.hide();

          if (delta.inserted && !delta.deleted && this.childNodes.length == delta.inserted.length)
          {
            Event.addGlobalHandler('click', this.hideByClick, this);
            Event.addGlobalHandler('keydown', this.hideByKey, this);
          }

          if (node.lastChild)
            this.lastChild.select();
          else
          {
            Event.removeGlobalHandler('click', this.hideByClick, this);
            Event.removeGlobalHandler('keydown', this.hideByKey, this);
          }
        }
      }),

      init: function(){
        this.inherit();
        this.selection = new nsWrapers.Selection();

        Cleaner.add(PopupManager);
      },
      insertBefore: function(popup){
        if (this.inherit(popup))
          popup.element.style.zIndex = Basis.Controls.Window ? Basis.Controls.Window.getWindowTopZIndex() : 2001;
      },
      removeChild: function(popup){
        if (popup)
        {
          if (popup.nextSibling)
            this.removeChild(popup.nextSibling);

          this.inherit(popup);
        }
      },
      hideByClick: function(event){
        var sender = Event.sender(event);
        var popup = this.lastChild;
        var ancestorAxis;

        while (popup)
        {
          if (!popup.hideOnAnyClick)
            return;

          if (!ancestorAxis)
            ancestorAxis = DOM.axis(sender, DOM.AXIS_ANCESTOR_OR_SELF);

          if (ancestorAxis.has(popup.element) || ancestorAxis.some(Array.prototype.has, popup.ignoreClickFor))
          {
            this.removeChild(popup.nextSibling);
            return;
          }

          popup = popup.previousSibling;
        }

        this.clear();
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
            if (popup.hideOnKey instanceof Array)
              result = popup.hideOnKey.has(key);

          if (result)
            popup.hide();
        }
      },
      clear: function(){
        if (this.firstChild)
          this.removeChild(this.firstChild);
      },
      destroy: function(){
        Cleaner.remove(PopupManager);

        this.selection.destroy();
        delete this.selection;

        this.inherit();
      }
    }));

    /**
     * @class Popup
     */

    var THREAD_HANDLER = {
      finish: function(){
        if (!this.visible)
          DOM.remove(this.element);
      }
    };

    var Popup = Class(nsWrapers.HtmlContainer, {
      className: namespace + '.Popup',

      template: new Template(
        '<div{element|selectedElement} class="Basis-Popup">' +
          '<div{content|childNodesElement} class="Basis-Popup-Content"/>' +
        '</div>'
      ),

      behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlContainer, {
        layoutChanged: function(oldOrientation, oldDir){
          var oldClass = (oldOrientation + '-' + oldDir.qw().slice(2, 4).join('-')).toLowerCase();
          var newClass = (this.orientation + '-' + this.dir.qw().slice(2, 4).join('-')).toLowerCase();
          Basis.CSS.cssClass(this.element).replace(oldClass, newClass, this.cssLayoutPrefix)
        }
      }),

      visible: false,
      autorotate: false,

      dir: '',
      defaultDir: [RIGHT, BOTTOM, RIGHT, TOP].join(' '),
      orientation: ORIENTATION.VERTICAL,

      hideOnAnyClick: true,
      hideOnKey: false,

      cssLayoutPrefix: 'popup-',

      init: function(config){
        config = this.inherit(config);

        Event.addHandler(this.element, 'click', this.click, this);

        //if (config.id)
        //  this.element.id = config.id;

        this.ignoreClickFor = Array.from(config.ignoreClickFor);

        if (typeof config.hideOnAnyClick == 'boolean')
          this.hideOnAnyClick = config.hideOnAnyClick;

        if (config.hideOnKey)
          this.hideOnKey = config.hideOnKey;

        if (config.dir)
          this.defaultDir = config.dir.toUpperCase();

        this.setLayout(this.defaultDir, config.orientation);
          
        if (config.autorotate)
          this.autorotate = config.autorotate;

        //if (config.content)
        //  DOM.insert(this.content, config.content);

        if (config.relElement)
          this.relElement = DOM.get(config.relElement);

        //if (config.handlers)
        //  this.addHandler(config.handlers);

        if (config.thread)
        {
          this.thread = config.thread;
          this.thread.addHandler(THREAD_HANDLER, this);
        }

        Cleaner.add(this);

        return config;
      },
      click: function(event){
        this.dispatch('click', event);
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
          this.dispatch('layoutChanged', oldOrientation, oldDir);
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

        var result = new Array();

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

          var dir = String(dir || this.dir).toUpperCase().qw();

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
          }
        }
      },
      realign: function(){
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

            if (this.autorotate.constructor == Array)
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

          DOM.css(this.element, {
            right:  'auto',
            left:   Basis.CSS.px(point.x - (dirH != LEFT) * (this.element.offsetWidth >> (dirH == CENTER))),
            bottom: 'auto',
            top:    Basis.CSS.px(point.y - (dirV != TOP) * (this.element.offsetHeight >> (dirV == CENTER)))
          });

          this.dispatch('realign');
        }
      },
      show: function(relElement, dir, orientation, args){
        // assign new offset element
        this.relElement = DOM.get(relElement) || this.relElement;

        // set up direction and orientation
        this.setLayout(dir || this.defaultDir, orientation)

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
          DOM.visibility(this.element, false);
          if (!DOM.IS_ELEMENT_NODE(this.element.parentNode))
            DOM.insert(document.body, this.element);

          // dispatch `beforeShow` event, there we can fill popup with content
          this.dispatch.apply(this, ['beforeShow'].concat(args));

          // set visible flag to TRUE
          PopupManager.appendChild(this);
          this.visible = true;

          // realign position and make it visible
          this.realign();
          if (this.thread) this.thread.start(1);
          DOM.visibility(this.element, true);

          // dispatch `show` event, there we can set focus for elements etc.
          this.dispatch.apply(this, ['show'].concat(args));
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
              DOM.remove(this.element);
          }

          // set visible flag to FALSE
          this.visible = false;
          if (this.parentNode)
            PopupManager.removeChild(this);

          // dispatch event
          this.dispatch('hide');
        }
      },
      hideAll: function(){
        PopupManager.clear();
      },
      destroy: function(){
        if (this.thread)
        {
          this.thread.removeHandler(THREAD_HANDLER, this);
          delete this.thread;
        }

        this.hide();

        Event.removeHandler(this.element, 'click', this.click, this);

        this.inherit();

        Cleaner.remove(this);
      }
    });

   /**
    * @class Balloon
    */

    var Balloon = Class(Popup, {
      className: namespace + '.Balloon',

      cssLayoutPrefix: 'mode-',

      template: new Template(
        '<div{element} class="Basis-Balloon">' +
          '<div class="Basis-Balloon-Canvas">' +
            '<div class="corner-left-top"/>' +
            '<div class="corner-right-top"/>' +
            '<div class="side-top"/>' +
            '<div class="side-left"/>' +
            '<div class="side-right"/>' +
            '<div class="vert-helper">' +
              '<div class="vert-filler"/>' +
            '</div>' +
            '<div class="canvas-content"/>' +
            '<div class="corner-left-bottom"/>' +
            '<div class="corner-right-bottom"/>' +
            '<div class="side-bottom"/>' +
          '</div>' +
          '<div{content} class="Basis-Balloon-Content"/>' +
        '</div>'
      )
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      ORIENTATION: ORIENTATION,
      Popup: Popup,
      Balloon: Balloon
    });

  })();
