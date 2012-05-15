/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.ui');


 /**
  * @namespace basis.layout
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var defaultView = document.defaultView;

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var Browser = basis.ua;
  var extend = Object.extend;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;

  var nsWrappers = DOM.wrapper;

  var UIContainer = basis.ui.Container;


  //
  // Main part
  //

  // tests

  var IS_IE = Browser.test('IE');
  var IS_IE7_UP = Browser.test('IE7+');

  var SUPPORT_DISPLAYBOX = false;

  var testElement = DOM.createElement('');
  var prefixes = ['', '-webkit-'];
  for (var i = 0; i < prefixes.length; i++)
  {
    try
    {
      var value = prefixes[i] + 'box';
      testElement.style.display = value;
      if (testElement.style.display == value)
      {
        SUPPORT_DISPLAYBOX = prefixes[i];
        break;
      }
    } catch(e) {}
  }

  var SUPPORT_ONRESIZE = typeof testElement.onresize != 'undefined';
  var SUPPORT_COMPUTESTYLE = defaultView && defaultView.getComputedStyle;

  //
  // functions
  //

  function getComputedProperty(element, what){
    if (SUPPORT_COMPUTESTYLE)
      try {
        return parseFloat(defaultView.getComputedStyle(element, null)[what]);
      } catch(e){
        return 0;
      }
    else
      return 0;
  }

  function getHeight(element, ruller){
    if (SUPPORT_COMPUTESTYLE)
    {
      return getComputedProperty(element, 'height');
    }
    else
    {
      cssom.setStyle(ruller, {
        borderTop: element.currentStyle.borderTopWidth + ' solid red',
        borderBottom: element.currentStyle.borderBottomWidth + ' solid red',
        paddingTop: element.currentStyle.paddingTop,
        paddingBottom: element.currentStyle.paddingBottom,
        fontSize: 0.01,
        height: 0,
        overflow: 'hidden'
      });

      return element.offsetHeight - ruller.offsetHeight;
    }
  }

  function addBlockResizeHandler(element, handler){
    // element.style.position = 'relative';
    if (SUPPORT_ONRESIZE)
    {
      classList(element).add('Basis-Layout-OnResizeElement');
      element.onresize = handler;
    }
    else
    {
      var iframe = DOM.createElement({
        description: 'IFRAME.Basis-Layout-OnResizeFrame',
        css: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: 'none',
          //border: '1px solid red',
          left: 0,
          zIndex: -1,
          top: '-2000px'
        }
      });

      DOM.insert(element, iframe);

      iframe.onload = function(){
        (iframe.contentWindow.onresize = handler)();
      }
    }
  }

  // other stuff

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
  Helper.className = 'basis.Layout.Helper';

  var BOX_UNDEFINED = {
    top: Number.NaN,
    left: Number.NaN,
    bottom: Number.NaN,
    right: Number.NaN,
    width: Number.NaN,
    height: Number.NaN,
    defined: false
  };

  //
  // Boxes
  //

 /**
  * @class
  */
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
      extend(this, BOX_UNDEFINED);
    },
    set: function(property, value){
      if (this.defined)
      {
        switch(property.toLowerCase()){
          case 'left':   this.left   = value; this.right  = this.left  + this.width; break;
          case 'right':  this.right  = value; this.left   = this.right - this.width; break;
          case 'width':  this.width  = value; this.right  = this.left  + this.width; break;
          case 'top':    this.top    = value; this.bottom = this.top    + this.height; break;
          case 'bottom': this.bottom = value; this.top    = this.bottom - this.height; break;
          case 'height': this.height = value; this.bottom = this.top    + this.height; break;
        }
        if (this.width <= 0 || this.height <= 0)
          this.reset();
      }

      return this;
    },
    recalc: function(offsetElement){
      this.reset();

      var element = this.element;

      if (element)
      {
        var offsetParent = element;
        var documentElement = document.documentElement;

        if (element.getBoundingClientRect)
        {
          // Internet Explorer, FF3, Opera9.50 sheme
          var box = element.getBoundingClientRect();

          this.top = box.top;
          this.left = box.left;

          // offset fix
          if (IS_IE)
          {
            if (IS_IE7_UP)
            {
              // IE7
              this.top  += documentElement.scrollTop  - documentElement.clientTop;
              this.left += documentElement.scrollLeft - documentElement.clientLeft;
            }
            else
              // IE6 and lower
              if (element != document.body)
              {
                this.top  -= document.body.clientTop  - document.body.scrollTop;
                this.left -= document.body.clientLeft - document.body.scrollLeft;
              }
          }

          // coords relative of offsetElement
          if (offsetElement)
          {
            /*if (element.offsetParent == offsetElement)
            {
              this.top = element.offsetTop - offsetElement.scrollTop;
              this.left = element.offsetLeft - offsetElement.scrollLeft;
            }
            else
            {*/
            //if (offsetElement && offsetElement.nodeType == 11) debugger;
              var relBox = new Box(offsetElement);
              this.top  -= relBox.top;
              this.left -= relBox.left;
              relBox.destroy();
            //}
          }
        }
        else
          if (document.getBoxObjectFor)
          {
            // Mozilla sheme
            var oPageBox = document.getBoxObjectFor(documentElement);
            var box = document.getBoxObjectFor(element);

            this.top  = box.screenY - oPageBox.screenY;
            this.left = box.screenX - oPageBox.screenX;

            if (Browser.test('FF1.5-'))
            {
              offsetParent = element.offsetParent;
              // offsetParent offset fix
              if (offsetParent)
              {
                this.top  -= offsetParent.scrollTop;
                this.left -= offsetParent.scrollLeft;
              }

              // documentElement offset fix
              if (offsetParent != document.body)
              {
                this.top  += documentElement.scrollTop;
                this.left += documentElement.scrollLeft;
              }
            }

            if (Browser.test('FF2+'))
            {
              if (this.top)
              {
                var top = documentElement.scrollTop;
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
                this.left -= documentElement.scrollLeft > 1;
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
            if (element != offsetElement)
            {
              this.top  = element.offsetTop;
              this.left = element.offsetLeft;

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

        this.width  = element.offsetWidth;
        this.height = element.offsetHeight;

        //if (this.width <= 0 || this.height <= 0)
        //  this.reset();
        //else
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

      element = DOM.get(element) || this.element;

      if (element)
      {
        cssom.setStyle(element, {
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


 /**
  * @class
  */
  var Intersection = Class(Box, {
    className: namespace + '.Intersection',

    init: function(boxA, boxB, bWoCalc){
      this.setBoxes(boxA, boxB, bWoCalc);
    },
    setBoxes: function(boxA, boxB, bWoCalc){
      this.boxA = boxA instanceof Box ? boxA : new Box(boxA, true);
      this.boxB = boxB instanceof Box ? boxB : new Box(boxB, true);

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


 /**
  * @class
  */
  var Viewport = Class(Box, {
    className: namespace + '.Viewport',

    recalc: function(){
      this.reset();

      var element = this.element;
      if (element)
      {
        var offsetParent = element;

        this.width = element.clientWidth;
        this.height = element.clientHeight;

        if (element.getBoundingClientRect)
        {
          // Internet Explorer, FF3, Opera9.50 sheme
          var box = element.getBoundingClientRect();

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
            var box = document.getBoxObjectFor(element);

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
            var box = new Box(element);
            this.top = box.top + element.clientTop;
            this.left = box.left + element.clientLeft;
          }

        this.bottom = this.top + this.height;
        this.right = this.left + this.width;

        this.defined = true;
      }

      return this.defined;
    }
  });


  //
  // Vertical stack panel
  //

  var stackPanelId = 0;

  var VerticalPanelRule = cssom.createRule('.Basis-VerticalPanel');
  VerticalPanelRule.setStyle({
    position: 'relative'
  });

  var VerticalPanelStackRule = cssom.createRule('.Basis-VerticalPanelStack');
  VerticalPanelStackRule.setStyle({
    overflow: 'hidden'
  });
  if (SUPPORT_DISPLAYBOX !== false)
  {
    VerticalPanelStackRule.setProperty('display', SUPPORT_DISPLAYBOX + 'box');
    VerticalPanelStackRule.setProperty(SUPPORT_DISPLAYBOX + 'box-orient', 'vertical');
  }

 /**
  * @class
  */
  var VerticalPanel = Class(UIContainer, {
    className: namespace + '.VerticalPanel',

    template: 
      '<div class="Basis-VerticalPanel"/>',

    flex: 0,

    init: function(){
      UIContainer.prototype.init.call(this);

      if (this.flex)
      {
        //cssom.setStyleProperty(this.element, 'overflow', 'auto');

        if (SUPPORT_DISPLAYBOX !== false)
          cssom.setStyleProperty(this.element, SUPPORT_DISPLAYBOX + 'box-flex', this.flex);
      }
      else
      {
        if (SUPPORT_DISPLAYBOX === false)
        {
          addBlockResizeHandler(this.element, (function(){
            if (this.parentNode)
              this.parentNode.realign();
          }).bind(this));
        }
      }
    }
  });

 /**
  * @class
  */
  var VerticalPanelStack = Class(UIContainer, {
    className: namespace + '.VerticalPanelStack',

    childClass: VerticalPanel,
    template:
      '<div class="Basis-VerticalPanelStack">' + 
        (SUPPORT_DISPLAYBOX ? '' : '<div{ruller} style="position: absolute; visibility: hidden; top: -1000px; width: 10px;"/>') +
      '</div>',

    init: function(){
      //if (SUPPORT_DISPLAYBOX === false)
      //{
        //this.ruleClassName = 'Basis-FlexStackPanel-' + ++stackPanelId;
        //this.cssRule = cssom.cssRule('.' + this.ruleClassName);
        this.cssRule = cssom.uniqueRule();
        this.ruleClassName = this.cssRule.token;
        this.cssRule.setProperty('overflow', 'auto');
      //}

      UIContainer.prototype.init.call(this);

      if (SUPPORT_DISPLAYBOX === false)
      {
        //this.box = new Box(this.childNodesElement, true);
        this.realign();

        addBlockResizeHandler(this.childNodesElement, (function(){
          this.realign();
        }).bind(this));
      }
    },
    insertBefore: function(newChild, refChild){
      if (newChild = UIContainer.prototype.insertBefore.call(this, newChild, refChild))
      {
        if (newChild.flex && this.cssRule)
          classList(newChild.element).add(this.ruleClassName);

        this.realign();

        return newChild;
      }
    },
    removeChild: function(oldChild){
      if (UIContainer.prototype.removeChild.call(this, oldChild))
      {
        if (oldChild.flex && this.cssRule)
          classList(oldChild.element).remove(this.ruleClassName);

        this.realign();

        return oldChild;
      }
    },
    realign: function(){
      if (SUPPORT_DISPLAYBOX !== false)
        return;

      var element = this.element;
      var lastElement = this.lastChild.element;
      var ruller = this.tmpl.ruller;

      var lastBox = new Box(lastElement, false, element);
      var bottom = (lastBox.bottom - getComputedProperty(element, 'paddingTop') - getComputedProperty(element, 'borderTopWidth')) || 0;
      var height = getHeight(element, ruller);

      if (!SUPPORT_COMPUTESTYLE)
      {
        var _height = ruller.offsetHeight;
        ruller.style.height = lastElement.currentStyle.marginBottom;
        bottom += ruller.offsetHeight - _height;
      }
      else
      {
        bottom += getComputedProperty(lastElement, 'marginBottom');
      }

      var delta = height - bottom;

      if (!delta)
        return;

      var flexNodeCount = 0;
      var flexHeight = delta;
      for (var i = 0, node; node = this.childNodes[i]; i++)
      {
        if (node.flex)
        {
          flexNodeCount++;
          flexHeight += getHeight(node.element, ruller);
        }
      }

      if (flexNodeCount)
        this.cssRule.setProperty('height', Math.max(0, flexHeight/flexNodeCount) + 'px');
    },
    destroy: function(){
      UIContainer.prototype.destroy.call(this);

      this.cssRule.destroy();
      this.cssRule = null;
    }
  });


  //
  // export names
  //

  module.exports = {
    Box: Box,
    Intersection: Intersection,
    Viewport: Viewport,

    VerticalPanel: VerticalPanel,
    VerticalPanelStack: VerticalPanelStack,

    Helper: Helper,
    addBlockResizeHandler: addBlockResizeHandler
  };
