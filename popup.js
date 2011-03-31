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

  (function(){

   /**
    * @namespace Basis.Controls.Popup
    */

    var namespace = 'Basis.Controls.Popup';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var Template = Basis.Html.Template;

    var getter = Function.getter;
    var cssClass = Basis.CSS.cssClass;
    var Cleaner = Basis.Cleaner;

    var nsWrappers = Basis.DOM.Wrapper;
    var nsLayout = Basis.Layout;

    var createBehaviour = Basis.EventObject.createBehaviour;

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

    var THREAD_HANDLER = {
      finish: function(){
        if (!this.visible)
        {
          DOM.remove(this.element);
          this.dispatch('cleanup', this);
        }
      }
    };

   /**
    * @class
    */
    var Popup = Class(nsWrappers.HtmlContainer, {
      className: namespace + '.Popup',

      template: new Template(
        '<div{element|selectedElement} class="Basis-Popup">' +
          '<div{closeButton} class="Basis-Popup-CloseButton"><span>Close</span></div>' +
          '<div{content|childNodesElement} class="Basis-Popup-Content"/>' +
        '</div>'
      ),

      behaviour: {
        layoutChanged: function(oldOrientation, oldDir){
          var oldClass = (oldOrientation + '-' + oldDir.qw().slice(2, 4).join('-')).toLowerCase();
          var newClass = (this.orientation + '-' + this.dir.qw().slice(2, 4).join('-')).toLowerCase();
          cssClass(this.element).replace(oldClass, newClass, this.cssLayoutPrefix)
        }
      },

      visible: false,
      autorotate: false,

      dir: '',
      defaultDir: [RIGHT, BOTTOM, RIGHT, TOP].join(' '),
      orientation: ORIENTATION.VERTICAL,

      hideOnAnyClick: true,
      hideOnKey: false,
      ignoreClickFor: [],

      cssLayoutPrefix: 'popup-',

      init: function(config){
        this.document = this;

        config = this.inherit(config);

        // add generic rule
        var genericRuleClassName = 'genericRule-' + this.eventObjectId;
        cssClass(this.element).add(genericRuleClassName);
        this.cssRule = DOM.Style.cssRule('.' + genericRuleClassName);

        // 
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

        if (config.thread)
        {
          this.thread = config.thread;
          this.thread.addHandler(THREAD_HANDLER, this);
        }

        //Event.addHandler(this.element, 'click', this.click, this);
        this.addEventListener('click', 'click', true);

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

          //Basis.DOM.Style.setStyle(this.element, style);
          this.cssRule.setStyle(style);
          /*this.cssRule.setStyle({
            right:  'auto',
            left:   parseInt(point.x - (dirH != LEFT) * (this.element.offsetWidth >> (dirH == CENTER))) + 'px',
            bottom: 'auto',
            top:    parseInt(point.y - (dirV != TOP) * (this.element.offsetHeight >> (dirV == CENTER))) + 'px'
          });*/

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
          cssClass(this.element).remove('pre-transition');
          DOM.visibility(this.element, false);

          PopupManager.appendChild(this);

          // dispatch `beforeShow` event, there we can fill popup with content
          this.dispatch.apply(this, ['beforeShow'].concat(args));

          // set visible flag to TRUE
          this.visible = true;

          // realign position and make it visible
          this.realign();
          if (this.thread) this.thread.start(1);
          DOM.visibility(this.element, true);
          cssClass(this.element).add('pre-transition');

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
            {
              DOM.remove(this.element);
              this.dispatch('cleanup', this);
            }
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

        this.cssRule.destroy();
        delete this.cssRule;

        Cleaner.remove(this);
      }
    });

   /**
    * @class
    */
    var Balloon = Class(Popup, {
      className: namespace + '.Balloon',

      cssLayoutPrefix: 'mode-',

      template: new Template(
        '<div{element|selectedElement} class="Basis-Balloon">' +
          '<div class="Basis-Balloon-Canvas">' +
            '<div class="corner-left-top"/>' +
            '<div class="corner-right-top"/>' +
            '<div class="side-top"><span class="helper"/><span class="tail"/><div class="filler"/></div>' +
            '<div class="side-left"><span class="helper"/><span class="tail"/><div class="filler"></div></div>' +
            '<div class="side-right"><span class="helper"/><span class="tail"/><div class="filler"></div></div>' +
            /*'<div class="vert-helper">' +
              '<div class="vert-filler"/>' +
            '</div>' +*/
            '<div class="content"/>' +
            '<div class="corner-left-bottom"/>' +
            '<div class="corner-right-bottom"/>' +
            '<div class="side-bottom"><span class="helper"/><span class="tail"/><div class="filler"/></div>' +
          '</div>' +
          '<div class="Basis-Balloon-Layout">' +
            '<div{closeButton} class="Basis-Balloon-CloseButton"><span>Close</span></div>' +
            '<div{content|childNodesElement} class="Basis-Balloon-Content"/>' +
          '</div>' +
        '</div>'
      )
    });

    //
    // Menu
    //

   /**
    * @class
    */
    var MenuItem = Class(nsWrappers.HtmlContainer, {
      className: namespace + '.MenuItem',

      childFactory: function(cfg){ return new this.childClass(cfg) },

      template: new Template(
        '<div{element} class="Basis-Menu-Item">' +
          '<a{content|selectedElement} href="#"><span>{captionText}</span></a>' +
        '</div>' +
        '<div{childNodesElement}/>'
      ),
      behaviour: {
        childNodesModified: function(){
          cssClass(this.element).bool('hasSubItems', this.hasChildNodes());
        }
      },

      groupId: 0,
      caption: '[untitled]',
      captionGetter: getter('caption'),
      handler: null,
      defaultHandler: function(node){
        if (this.parentNode)
          this.parentNode.defaultHandler(node);
      },

      init: function(config){
        // apply config
        if (typeof config == 'object')
        {
          if (config.caption)
            this.caption = config.caption;

          if (typeof config.captionGetter == 'function')
            this.captionGetter = config.captionGetter;

          if (config.groupId)
            this.groupId = config.groupId;

          if (typeof config.handler == 'function')
            this.handler = config.handler;

          if (typeof config.defaultHandler == 'function')
            this.defaultHandler = config.defaultHandler;
        }

        // inherit
        config = this.inherit(config);

        this.setCaption(this.caption);

        return config;
      },
      setCaption: function(newCaption){
        this.caption = newCaption;
        if (this.captionText)
          this.captionText.nodeValue = this.captionGetter(this);
      }
    });
    MenuItem.prototype.childClass = MenuItem;

    var MenuItemSet = Class(MenuItem, {
      className: namespace + '.MenuItemSet',
      behaviour: createBehaviour(nsWrappers.HtmlNode, {}),
      template: new Template(
        '<div{element|content|childNodesElement} class="Basis-Menu-ItemSet"/>'
      )
    });

   /**
    * @class
    */
    var MenuPartitionNode = Class(nsWrappers.HtmlPartitionNode, {
      className: namespace + '.MenuPartitionNode',
      template: new Template(
        '<div{element} class="Basis-Menu-ItemGroup">' +
          '<div{childNodesElement|content} class="Basis-Menu-ItemGroup-Content"></div>' +
        '</div>'
      )
    });

   /**
    * @class
    */
    var MenuGroupControl = Class(nsWrappers.HtmlGroupControl, {
      className: namespace + '.MenuGroupControl',
      childClass: MenuPartitionNode
    });

   /**
    * @class
    */
    var Menu = Class(Popup, {
      className: namespace + '.Menu',
      childClass: MenuItem,

      defaultDir: [LEFT, BOTTOM, LEFT, TOP].join(' '),
      subMenu: null,

      groupControlClass: MenuGroupControl,
      localGrouping: {
        groupGetter: getter('groupId')
      },

      defaultHandler: function(){
        this.hide();
      },
      behaviour: {
        click: function(event, node){
          if (node /*&& node.parentNode === this*/ && !node.isDisabled() && !(node instanceof MenuItemSet))
          {
            if (node.handler)
              node.handler(node);
            else
              node.defaultHandler(node);

            Event.kill(event);
          }
        }/*,
        mouseover: function(event, node){
          if (node instanceof MenuItem)
          {
            if (node.hasChildNodes() && !node.isDisabled())
            {
              if (!this.subMenu)
                this.subMenu = new Menu({ dir: [RIGHT, TOP, LEFT, TOP].join(' ') });

              this.subMenu.clear(true);

              
              DOM.insert(DOM.clear(this.subMenu.content), node.childNodesElement);
              this.subMenu.show(node.element);
            }
            else
            {
              if (this.subMenu)
                this.subMenu.hide();
            }
          }
        }*/
      },

      template: new Template(
        '<div{element|selectedElement} class="Basis-Menu">' +
          '<div{closeButton} class="Basis-Menu-CloseButton"><span>Close</span></div>' +
          '<div{content|childNodesElement} class="Basis-Menu-Content"/>' +
        '</div>'
      ),

      init: function(config){
        config = this.inherit(config);

        if (typeof config.defaultHandler == 'function')
          this.defaultHandler = config.defaultHandler;

        this.addEventListener('mouseover');

        return config;
      }
    });

    //
    //  Popup manager
    //

    // NOTE: PopupManager adds global event handlers dynamicaly because click event
    // that makes popup visible can also hide it (as click outside of popup).

    var PopupManagerClass = Class(nsWrappers.Control, {
      className: namespace + '.PopupManager',

      handheldMode: false,

      childClass: Popup,
      behaviour: createBehaviour(nsWrappers.Node, {
        childNodesModified: function(object, delta){
          if (delta.deleted)
            for (var i = delta.deleted.length - 1, item; item = delta.deleted[i]; i--)
              item.hide();

          if (delta.inserted && !delta.deleted && this.childNodes.length == delta.inserted.length)
          {
            cssClass(this.element).add('IsNotEmpty');
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
            cssClass(this.element).remove('IsNotEmpty');
            document.body.className = document.body.className; // BUGFIX: for IE7+ and webkit (chrome8/safari5)
                                                               // general sibling combinator (~) doesn't work otherwise
                                                               // (it's useful for handheld scenarios, when popups show on fullsreen)
            Event.removeGlobalHandler('click', this.hideByClick, this);
            Event.removeGlobalHandler('keydown', this.hideByKey, this);
            Event.removeGlobalHandler('scroll', this.hideByScroll, this);
            Event.removeHandler(window, 'resize', this.realignAll, this);
          }
        }
      }),

      insertBefore: function(newChild, refChild){
        // save documentElement (IE, mozilla and others) and body (webkit) scrollTop
        var documentST_ = document.documentElement.scrollTop;
        var bodyST_ = document.body.scrollTop;

        if (this.inherit(newChild, refChild))
        {
          // store saved scrollTop to popup and scroll viewport to top
          newChild.documentST_ = documentST_;
          newChild.bodyST_ = bodyST_;
          if (this.handheldMode)
          {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }

          // set zIndex
          newChild.element.style.zIndex = Basis.Controls.Window ? Basis.Controls.Window.getWindowTopZIndex() : 2001;
        }
      },
      removeChild: function(popup){
        if (popup)
        {
          if (popup.hideOnAnyClick && popup.nextSibling)
            this.removeChild(popup.nextSibling);

          this.inherit(popup);

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

        var popups = this.childNodes.filter(Function.getter('hideOnAnyClick')).reverse();

        for (var i = 0, popup; popup = popups[i]; i++)
        {
          if (sender === popup.closeButton || DOM.parentOf(popup.closeButton, sender))
          {
            this.removeChild(popup);
            return;
          }

          if (!ancestorAxis)
            ancestorAxis = DOM.axis(sender, DOM.AXIS_ANCESTOR_OR_SELF);

          if (ancestorAxis.has(popup.element) || ancestorAxis.some(Array.prototype.has, popup.ignoreClickFor))
          {
            this.removeChild(popups[i - 1]);
            return;
          }
        }

        this.removeChild(popups.last());
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

    var PopupManager = new PopupManagerClass({
      id: 'Basis-PopupStack'
    });

    Event.onLoad(function(){
      DOM.insert(document.body, PopupManager.element, DOM.INSERT_BEGIN);
      PopupManager.realignAll();
    });

    function setHandheldMode(mode){
      PopupManager.handheldMode = !!mode;
    }

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      // const
      ORIENTATION: ORIENTATION,

      // methods
      setHandheldMode: setHandheldMode,

      // classes
      Popup: Popup,
      Balloon: Balloon,
      Menu: Menu,
      MenuGroupControl: MenuGroupControl,
      MenuPartitionNode: MenuPartitionNode,
      MenuItem: MenuItem,
      MenuItemSet: MenuItemSet
    });

  })();
