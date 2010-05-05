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

    var namespace = 'Basis.Layout';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var CSS = Basis.CSS;

    var Browser = Basis.Browser;
    var extend = Object.extend;
    var cssClass = Basis.CSS.cssClass;

    var nsWrapers = DOM.Wrapers;

    var Property = nsWrapers.Property;
    var DataObjectSet = nsWrapers.DataObjectSet;

    //
    // Main part
    //

    var Helper = function(){
      return DOM.createElement({
        css: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          padding: 0,
          margin: 0,
          border: 0
        }
      });
    };
    Helper.className = 'Basis.Layout.Helper';

    /* - Layout modes -------------------------------- */

    /*
    var LAYOUT_MODE = {};

    function makeLayoutModeTest(){
      var testElement = new Helper();
      var style = testElement.style;

      var testElement2 = new Helper();
      DOM.css(testElement2, {
        width: '1px',
        height: '1px'
      });

      extend(style, {
        width: 'auto',
        right: 0
      });
      DOM.insert(document.body, testElement);

      // left+right test
      LAYOUT_MODE.is2SideLayoutSupport = testElement.offsetWidth > 1;

      // min/max test
      extend(style, {
        right: 'auto',
        maxWidth: '100px',
        width: '101px'
      })
      LAYOUT_MODE.min_max = testElement.offsetWidth == 100;

      // border sizing test
      extend(style, {
        border: '1px solid red',
        padding: '1px'
      });
      if (testElement.offsetWidth == 105)
      {
        var boxSizing = ['boxSizing', 'MozBoxSizing'];
        for (var i = 0; i < boxSizing.length; i++)
          if (typeof style[boxSizing[i]] != 'undefined')
            style[boxSizing[i]] = 'border-box';

        LAYOUT_MODE.border_sizing = testElement.offsetWidth == 101;
      }
      else
        LAYOUT_MODE.border_sizing = true;

      DOM.remove(testElement);
    }
    */

    /* ----------------------------------------------- */

    var protoFixed = DOM.createElement({
      css: {
        position: 'fixed',
        margin: 0
      }
    });

    var protoAbsolute = DOM.createElement({
      css: {
        position: 'absolute',
        margin: 0
      }
    });

    var undefinedBox = {
      top: Number.NaN,
      left: Number.NaN,
      bottom: Number.NaN,
      right: Number.NaN,
      width: Number.NaN,
      height: Number.NaN,
      defined: false
    };

    /* ----------------------------------------------- */

    var Box = Class(null, {
      className: namespace + '.Box',

      init: function(element, woCalc, offsetElement){
        this.reset();
        this.setElement(element, woCalc, offsetElement);
      },
      setElement: function(element, woCalc, offsetElement){
        this.element = DOM.get(element);
        this.offsetElement = offsetElement;
        if (!woCalc) this.recalc(this.offsetElement);
      },
      copy: function(box){
        ['top', 'left', 'bottom', 'right', 'height', 'width', 'defined'].forEach(function(prop){ this[prop] = box[prop] }, this);
      },
      reset: function(){
        extend(this, undefinedBox);
      },
      set: function(property, value){
        if (this.defined)
        {
          switch(property.toLowerCase()){
            case 'left':   this.left   = value; this.right = this.left  + this.width; break;
            case 'right':  this.right  = value; this.left  = this.right - this.width; break;
            case 'width':  this.width  = value; this.right = this.left  + this.width; break;
            case 'top':    this.top    = value; this.bottom = this.top  + this.height; break;
            case 'bottom': this.bottom = value; this.top    = this.bottom - this.height; break;
            case 'height': this.height = value; this.bottom = this.top  + this.height; break;
          }
          if (this.width <= 0 || this.height <= 0)
            this.reset();
        }

        return this;
      },
      recalc: function(offsetElement){
        this.reset();

        if (this.element)
        {
          var offsetParent = this.element;

          if (this.element.getBoundingClientRect)
          {
            // Internet Explorer, FF3, Opera9.50 sheme
            var box = this.element.getBoundingClientRect();

            this.top = box.top;
            this.left = box.left;

            // offset fix
            if (Browser.test('IE7+'))
            {
              // IE7
              this.top  += document.documentElement.scrollTop  - document.documentElement.clientTop;
              this.left += document.documentElement.scrollLeft - document.documentElement.clientLeft;
            }
            else
              // IE6 and lower
              if (this.element != document.body)
              {
                this.top  -= document.body.clientTop  - document.body.scrollTop;
                this.left -= document.body.clientLeft - document.body.scrollLeft;
              }

            // coords relative of offsetElement
            if (offsetElement)
            {
              var relBox = new Box(offsetElement);
              this.top  -= relBox.top;
              this.left -= relBox.left;
              relBox.destroy();
            }
          }
          else
            if (document.getBoxObjectFor)
            {
              // Mozilla sheme
              var oPageBox = document.getBoxObjectFor(document.documentElement);
              var box = document.getBoxObjectFor(this.element);

              this.top  = box.screenY - oPageBox.screenY;
              this.left = box.screenX - oPageBox.screenX;

              if (Browser.test('FF1.5-'))
              {
                // offsetParent offset fix
                if (this.element.offsetParent)
                {
                  this.top  -= this.element.offsetParent.scrollTop;
                  this.left -= this.element.offsetParent.scrollLeft;
                }

                // document.documentElement offset fix
                if (this.element.offsetParent != document.body)
                {
                  this.top  += document.documentElement.scrollTop;
                  this.left += document.documentElement.scrollLeft;
                }
              }

              if (Browser.test('FF2+'))
              {
                if (this.top)
                {
                  var top = document.documentElement.scrollTop;
                  if (top > 2)
                  {
                    var end = 0;
                    for (var k = Math.floor(Math.log(top)/Math.LN2); k >= 0; k -= 3)
                      end += 1 << k;
                    if (top > end)
                      this.top -= 1;
                  }
                }
                if (this.left)
                  this.left -= document.documentElement.scrollLeft > 1;
              }

              // coords relative of offsetElement
              if (offsetElement)
              {
                var relBox = new Box(offsetElement);
                this.top  -= relBox.top;
                this.left -= relBox.left;
                relBox.destroy();
              }
            }
            else
            {
              // Other browser sheme
              if (this.element != offsetElement)
              {
                this.top  = this.element.offsetTop;
                this.left = this.element.offsetLeft;

                // Body offset fix
                this.top  -= document.body.clientTop  - document.body.scrollTop;
                this.left -= document.body.clientLeft - document.body.scrollLeft;

                while ((offsetParent = offsetParent.offsetParent) && offsetParent != offsetElement)
                {
                  this.top  += offsetParent.offsetTop  + offsetParent.clientTop  - offsetParent.scrollTop;
                  this.left += offsetParent.offsetLeft + offsetParent.clientLeft - offsetParent.scrollLeft;
                }
              }
              else
                this.top = this.left = 0;
            }

          this.width  = this.element.offsetWidth;
          this.height = this.element.offsetHeight;

          if (this.width <= 0 || this.height <= 0)
            this.reset();
          else
          {
            this.bottom = this.top  + this.height;
            this.right  = this.left + this.width;

            this.defined = true;
          }
        }

        return this.defined;
      },
      intersection: function(box){
        if (!this.defined)
          return false;

        if (box instanceof Box == false)
          box = new Box(box);

        return box.defined &&
               box.right  > this.left && 
               box.left   < this.right &&
               box.bottom > this.top &&
               box.top    < this.bottom;
      },
      inside: function(box){
        if (!this.defined)
          return false;

        if (box instanceof Box == false)
          box = new Box(box);

        return box.defined &&
               box.left   >= this.left && 
               box.right  <= this.right &&
               box.bottom >= this.bottom &&
               box.top    <= this.top;
      },
      point: function(point){
        if (!this.defined)
          return false;

        var x = point.left || point.x || 0;
        var y = point.top  || point.y || 0;

        return x >= this.left  &&
               x <  this.right &&
               y >= this.top   &&
               y <  this.bottom;
      },
      power: function(element){
        if (!this.defined)
          return false;

        var element = DOM.get(element) || this.element;
        if (element)
        {
          DOM.css(element, {
            top: this.top + 'px',
            left: this.left + 'px',
            width: this.width + 'px',
            height: this.height + 'px'
          });
          return true;
        }
      },
      destroy: function(){
        delete this.element;
      }
    });

    /* ----------------------------------------------- */

    var Intersection = Class(Box, {
      className: namespace + '.Intersection',

      init: function(boxA, boxB, bWoCalc){
        this.setBoxes(boxA, boxB, bWoCalc);
      },
      setBoxes: function(boxA, boxB, bWoCalc){
        if (boxA instanceof Box == false) boxA = new Box(boxA, true);
        if (boxB instanceof Box == false) boxB = new Box(boxB, true);

        this.boxA = boxA;
        this.boxB = boxB;

        if (!bWoCalc)
          this.recalc();
      },
      recalc: function(){
        this.reset();

        if (!this.boxA.recalc() ||
            !this.boxB.recalc())
          return false;

        if (this.boxA.intersection(this.boxB))
        {
          this.top     = Math.max(this.boxA.top, this.boxB.top);
          this.left    = Math.max(this.boxA.left, this.boxB.left);
          this.bottom  = Math.min(this.boxA.bottom, this.boxB.bottom);
          this.right   = Math.min(this.boxA.right, this.boxB.right);
          this.width   = this.right - this.left;
          this.height  = this.bottom - this.top;

          if (this.width <= 0 || this.height <= 0)
            this.reset();
          else
            this.defined = true;
        }

        return this.defined;
      }
    });

    /* ----------------------------------------------- */

    var Viewport = Class(Box, {
      className: namespace + '.Viewport',

      recalc: function(){
        this.reset();

        if (this.element)
        {
          this.width = this.element.clientWidth;
          this.height = this.element.clientHeight;

          var offsetParent = this.element;

          if (this.element.getBoundingClientRect)
          {
            // Internet Explorer, FF3, Opera9.50 sheme
            var box = this.element.getBoundingClientRect();

            this.top = box.top;
            this.left = box.left;

            while (offsetParent = offsetParent.offsetParent)
            {
              this.top -= offsetParent.scrollTop;
              this.left -= offsetParent.scrollLeft;
            }
          }
          else
            if (document.getBoxObjectFor)
            {
              // Mozilla sheme
              var box = document.getBoxObjectFor(this.element);

              this.top = box.y;
              this.left = box.x;

              while (offsetParent = offsetParent.offsetParent)
              {
                this.top -= offsetParent.scrollTop;
                this.left -= offsetParent.scrollLeft;
              }
            }
            else
            {
              // Other browsers sheme
              var box = new Box(this.element);
              this.top = box.top + this.element.clientTop;
              this.left = box.left + this.element.clientLeft;
            }

          this.bottom = this.top + this.height;
          this.right = this.left + this.width;

          this.defined = true;
        }

        return this.defined;
      }
    });

    /* ----------------------------------------------- */

    var VisibleBox = Class(Box, {
      className: namespace + '.VisibleBox',

      recalc: function(){
        this.reset();

        if (this.element)
        {
          // intersection of element box and client area of offset parent
          var offsetParent = this.element;
          var box = new Box(this.element);
          var viewport;
          while (box.defined && (offsetParent = offsetParent.offsetParent))
          {
            biewport = new Viewport(offsetParent);
            box = new Intersection(box, viewport);
          }
          this.copy(box);
        }

        return this.defined;
      }
    });

    //
    //  Layout
    //

    var ALIGN_TOP    = 0x01;
    var ALIGN_LEFT   = 0x02;
    var ALIGN_RIGHT  = 0x04;
    var ALIGN_BOTTOM = 0x08;
    var ALIGN_CLIENT = 0x10;

    var ALIGN_BY_NAME = {
      'top':    ALIGN_TOP,
      'left':   ALIGN_LEFT,
      'right':  ALIGN_RIGHT,
      'bottom': ALIGN_BOTTOM,
      'client': ALIGN_CLIENT
    };
    var ALIGN_NAME_BY_CODE = {};
    Object.keys(ALIGN_BY_NAME).forEach(function(key){ ALIGN_NAME_BY_CODE[ALIGN_BY_NAME[key]] = key });

    var isTwoSideLayoutSupport = !Browser.is('IE7-');

    var LayoutHelper = DOM.createElement('DIV');
    extend(LayoutHelper.style, {
      visibility: 'hidden',
      position: 'absolute',
      width: '1px',
      height: '1px'
    });

    var RealignManager = {
      layout: [],
      realign: function(){
        //;;; if (typeof console != 'undefined') console.log('start fallback realign');
        var realignQueue = [];
        for (var i = 0; i < this.layout.length; i++)
        {
          if (this.layout[i].isVisible())
          {
            realignQueue.push(this.layout[i]);
          }
        }
        //;;; console.log(realignQueue.sortAsObject(function(item){ return DOM.deep(item.element) }).map(function(item){ return DOM.deep(item.element) }).join(' '));
        //alert(realignQueue.sortAsObject(function(item){ return DOM.deep(item.element) }).map(function(item){ return DOM.deep(item.element)}));
        realignQueue.sortAsObject(function(item){ return DOM.deep(item.element) }).forEach(function(item){ item.realign() });
      }
    };

    var Layout = Class(nsWrapers.EventObject, {
      className: namespace + '.Layout',

      init: function(config){
        config = config || {};

        //var asd = { change: function(value){console.log('changed to ' + value)} };
        var anchors = {
          top: new Property(0),
          left: new Property(0),
          right: new Property(0),
          bottom: new Property(0),
          width: new Property(0),
          height: new Property(0),
          clientWidth: new Property(0),
          clientHeight: new Property(0)
        };
        var layoutConfig = {
          realign: new Property(false),
          realignFactors: new DataObjectSet(),
          anchor:  anchors
        };
        layoutConfig.realignFactors.add(layoutConfig.realign);

        this.clientWidth  = new DataObjectSet(anchors.left, anchors.right, anchors.width);
        this.clientWidth.addHandler({
          change: function(){
            var value = anchors.width - anchors.left - anchors.right;
            anchors.clientWidth.set(value < 0 ? 0 : value);
          }
        });
        this.clientHeight = new DataObjectSet(anchors.top, anchors.bottom, anchors.height);
        this.clientHeight.addHandler({
          change: function(){
            var value = anchors.height - anchors.top - anchors.bottom;
            anchors.clientHeight.set(value < 0 ? 0 : value);
          }
        });

        layoutConfig.realignFactors.addHandler({ change: this.realign }, this);
        this.layoutConfig = layoutConfig;

        this.side = {};
        var sideElement = [];
        for (var side in ALIGN_BY_NAME)
        {
          this.side[side] = {};
          var buildSideConfig = config[side];
          if (buildSideConfig)
          {
            var content  = typeof buildSideConfig == 'object' && 'content' in buildSideConfig ? buildSideConfig.content : buildSideConfig;
            var isConfig = content != buildSideConfig;

            var sideConfig = this.addSide(side, true);
            if (isConfig)
              this.applySideProperties(side, buildSideConfig);

            sideElement.push(sideConfig.element);

            if (Function.$isNotNull(content))
              if (content instanceof Layout)
                content.attach(sideConfig.element);
              else
                this.insert(side, content, sideConfig.position || DOM.INSERT_END, sideConfig.relElement || null);
          }
        }

        if (config.container)
          this.attach(config.container);

        if (this.element)
          DOM.insert(this.element, sideElement);

        RealignManager.layout.push(this);

        //Cleaner.add(this);
      },
      
      attach: function(element){
        this.detach();

        // determine offsetParent
        var parent;
        if (element = DOM.get(element))
        {
          // find really parent; it must be block with relative, fixed or absolute position
          if (element.firstChild)
            parent = element.firstChild.offsetParent;
          else
          {
            parent = DOM.insert(element, LayoutHelper).offsetParent;
            DOM.remove(LayoutHelper);
          }
          parent = element;
        }

        if (!parent)
          parent = document.body;

        // only one Layout must be attached to element
        if (parent.basisLayoutConfig)
          throw new Error('Some Layout already attached to current element');

        // attach elements to new parent
        this.element = parent;
        this.element.basisLayoutConfig = this;
        var sideElement = [];
        for (var side in this.side)
        {
          if (this.side[side].element)
            sideElement.push(this.side[side].element);
            //DOM.insert(parent, this.side[side].element);
        }
        DOM.insert(parent, sideElement);

        this.layoutConfig.realign.set(true);
      },
      detach: function(){
        if (this.element)
        {
          for (var side in this.side)
            if (this.side[side].element)
              DOM.remove(this.side[side].element);
          this.element.basisLayoutConfig = undefined;  // IE6 crush on property delete
          delete this.element;
        }
      },

      isVisible: function(){
        return this.element && this.element.ownerDocument == document && this.element.offsetHeight && this.element.offsetWidth;
      },
      realign: function(){
        this.layoutConfig.realign.value = false;

        if (this.isVisible())
        {
          //;;; if (typeof console != 'undefined') console.log(this.element, ' realign');

          var anchors = this.layoutConfig.anchor;

          anchors.width.set(this.element.clientWidth);
          anchors.height.set(this.element.clientHeight);

          for (var side in this.side)
          {
            var sideConfig = this.side[side];

            if (sideConfig.element)
            {
              sideConfig.realign.value = false;

              if (!sideConfig.emptyAllow && !sideConfig.element.firstChild)
                this.removeSide(side);
              else
                if (side != 'client')
                  anchors[side].set(sideConfig.element[ALIGN_BY_NAME[side] & (ALIGN_LEFT | ALIGN_RIGHT) ? 'offsetWidth' : 'offsetHeight']);
            }
          }
        }
        else {
        //;;; if (typeof console != 'undefined') console.log('realign aborted');
        }
      },

      addSide: function(side, notInsert){
        var config = this.side[side];

        if (!config)
          return;

        if (!config.element)
        {
          var element = DOM.createElement('.Basis-Layout-Panel-' + side.capitalize());

          config.element = element;
          config.realign = new Property(false);
          this.layoutConfig.realignFactors.add(config.realign); // triger main realign

          if (side != 'client')
            element.style[side] = '0px';

          var style = element.style;
          //style.position = 'absolute';
          style.overflow = 'hidden';
          //style.padding  = '0';
          style.margin   = '0';
          //style.border   = '0';
          switch (side)
          {
            case 'top': 
            case 'bottom':
              style.width = '100%';
              style.left  = '0';
              break;
            case 'left':
            case 'right':
            case 'client':
              this.layoutConfig.anchor.top.addLink(style, 'top', CSS.px);
              if (isTwoSideLayoutSupport)
                this.layoutConfig.anchor.bottom.addLink(style, 'bottom', CSS.px);
              else
                this.layoutConfig.anchor.clientHeight.addLink(style, 'height', CSS.px);
              break;
            default:
          }
          if (side == 'client')
          {
            this.layoutConfig.anchor.left.addLink(style, 'left', CSS.px);
            if (isTwoSideLayoutSupport)
              this.layoutConfig.anchor.right.addLink(style, 'right', CSS.px);
            else
            {
              this.layoutConfig.anchor.clientWidth.addLink(style, 'width', CSS.px);
            }
          }

          // save config to element
          element.basisLayoutSideConfig = {
            parent: this,
            align:  side
          };

          this.applySideProperties();

          // attach to element
          if (this.element)
          {
            if (!notInsert)
            {
              DOM.insert(this.element, element);
              config.realign.set(true);
            }
          }
        }
        return config;
      },
      removeSide: function(side){
        var config = this.side[side];

        if (!config)
          return;

        if (config.element)
        {
          for (var name in this.layoutConfig.anchor)
            this.layoutConfig.anchor[name].removeLink(config.element.style);
/*            if (!isTwoSideLayoutSupport)
          {
            config.element.style.removeExpression('height');
            config.element.style.removeExpression('width');
          }*/

          config.realign.destroy();  // doing this.layoutConfig.realign.remove(config.realign) on destroy
          config.element.basisLayoutSideConfig = undefined;
          DOM.remove(config.element);
          delete config.element;
          delete config.realign;
        }
      },
      applySideProperties: function(side, properties){
        var config = this.side[side];

        if (!config)
          return;

        if (properties)
          extend(config.properties = {}, properties);

        if ('emptyAllow' in config.properties)
        {
          config.emptyAllow = !!config.properties.emptyAllow;
          delete config.properties.emptyAllow;
          if (config.emptyAllow && !config.element)
          {
            this.addSide(side);
            return;
          }
        }

        if (config.element)
        {
          for (var name in config.properties)
          {
            var value = config.properties[name];
            switch (name){
              case 'overflow':
              case 'overflowX':
              case 'overflowY':
                config.element.style[name] = value;
              break;
              case 'cssClassName':
                cssClass(config.element).add(value);
              break;
              case 'id':
                config.element.id = value;
              break;
              case 'size':
                if (side == 'left' || side == 'right')
                  config.element.style.width  = value;
                if (side == 'top' || side == 'bottom')
                  config.element.style.height = value;
              break;
              default:
                delete config.properties[name];
            }
          }
          if (Object.keys(config.properties).length)
            this.realign();
        }
      },

      insert: function(side, content, position, rel){
        var sideConfig = this.addSide(side);
        if (sideConfig && sideConfig.element)
        {
          DOM.insert(sideConfig.element, content, position, rel);
          this.layoutConfig.realign.set(true);
        }
      },
      remove: function(element){
        DOM.remove(element);
        this.layoutConfig.realign.set(true);
      },

      destroy: function(){
        RealignManager.layout.remove(this);
        //Cleaner.remove(this);

        this.layoutConfig.realign.destroy();
        this.layoutConfig.realignFactors.destroy();
        for (var side in this.side)
          this.removeSide(side);
        this.detach();

        this.inherit();
      }
    });

    Event.onLoad(function(){
      // init LAYOUT_MODE (make tests)
//      makeLayoutModeTest();
//      makeLayoutModeTest = Function.$undef;

      Event.addHandler(window, 'resize', RealignManager.realign, RealignManager);
      setTimeout(function(){ RealignManager.realign(); }, 20);
    });
    Event.onUnload(function(){
      Event.removeHandler(window, 'resize', RealignManager.realign, RealignManager);
    });     

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Box: Box,
      Intersection: Intersection,
      Viewport: Viewport,
      VisibleBox: VisibleBox,
      Layout: Layout,
      Helper: Helper,
      protoFixed: protoFixed,
      protoAbsolute: protoAbsolute
    });

  })();
