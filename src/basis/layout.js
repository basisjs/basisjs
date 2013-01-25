
  basis.require('basis.ua');
  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.template');
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

  var browser = basis.ua;
  var extend = basis.object.extend;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;

  var UINode = basis.ui.Node;


  //
  // Main part
  //

  // tests

  var IS_IE = browser.test('IE');
  var IS_IE7_UP = browser.test('IE7+');
  var IS_IE8_DOWN = browser.test('IE8-');

  var SUPPORT_DISPLAYBOX = false;

  var testElement = DOM.createElement('');
  var prefixes = ['', '-webkit-'];
  for (var i = 0; i < prefixes.length; i++)
  {
    try
    {
      // Opera tries to use -webkit-box but doesn't set "-webkit-box-orient" dynamically for cssRule
      if (prefixes[i] == '-webkit-' && basis.ua.is('opera'))
        continue;

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
      } catch(e){}
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
      element.onresize = handler;
    else
    {
      var iframe = DOM.createElement({
        description: 'iframe',
        css: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: 'none',
          left: 0,
          zIndex: -1,
          top: '-2000px'
        }
      });

      DOM.insert(element, iframe);

      iframe.onload = function(){
        (iframe.contentWindow.onresize = handler)();
      };
    }
  }

  // other stuff

  var BOX_UNDEFINED = {
    top: NaN,
    left: NaN,
    bottom: NaN,
    right: NaN,
    width: NaN,
    height: NaN,
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
      this.element = DOM.get(element);
      this.offsetElement = offsetElement;
      if (!woCalc)
        this.recalc(this.offsetElement);
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
              if (IS_IE8_DOWN)
              {
                // IE7-8
                this.top  += documentElement.scrollTop  - documentElement.clientTop;
                this.left += documentElement.scrollLeft - documentElement.clientLeft;
              }
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
          if (offsetElement) // TODO: check for body.style === 'static', not bug if body is not static
          {
            if (offsetElement !== document.body)
            {
              var relBox = new Box(offsetElement);
              this.top  -= relBox.top;
              this.left -= relBox.left;
              relBox.destroy();
            }
            else
            {
              this.top += offsetElement.scrollTop + documentElement.scrollTop;
              this.left += offsetElement.scrollLeft + documentElement.scrollLeft;
            }
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

            if (browser.test('FF1.5-'))
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

            if (browser.test('FF2+'))
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
    intersect: function(box){
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
    destroy: function(){
      this.element = null;
      this.offsetElement = null;
    }
  });


 /**
  * @class
  */
  var Intersection = Class(Box, {
    className: namespace + '.Intersection',

    init: function(boxA, boxB, bWoCalc){
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

      if (this.boxA.intersect(this.boxB))
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
    },
    destroy: function(){
      Box
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

  var templates = basis.template.define(namespace, {
    Panel: resource('ui/templates/layout/VerticalPanel.tmpl'),
    Stack: resource('ui/templates/layout/VerticalPanelStack.tmpl')
  });

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
  var VerticalPanel = Class(UINode, {
    className: namespace + '.VerticalPanel',

    template: templates.Panel,

    flex: 0,

    init: function(){
      UINode.prototype.init.call(this);

      if (this.flex)
      {
        if (SUPPORT_DISPLAYBOX !== false)
          cssom.setStyleProperty(this.element, SUPPORT_DISPLAYBOX + 'box-flex', this.flex);
      }
      else
      {
        if (SUPPORT_DISPLAYBOX === false)
          addBlockResizeHandler(this.element, (function(){
            if (this.parentNode)
              this.parentNode.realign();
          }).bind(this));
      }
    }
  });

 /**
  * @class
  */
  var VerticalPanelStack = Class(UINode, {
    className: namespace + '.VerticalPanelStack',

    template: templates.Stack,

    childClass: VerticalPanel,

    init: function(){
      this.cssRule = cssom.uniqueRule();
      this.cssRule.setProperty('overflow', 'auto');
      this.ruleClassName = this.cssRule.token;

      UINode.prototype.init.call(this);

      if (SUPPORT_DISPLAYBOX === false)
      {
        this.realign();
        addBlockResizeHandler(this.childNodesElement, this.realign.bind(this));
      }
    },
    insertBefore: function(newChild, refChild){
      newChild = UINode.prototype.insertBefore.call(this, newChild, refChild);
      if (newChild)
      {
        if (newChild.flex)
          classList(newChild.element).add(this.ruleClassName);

        this.realign();

        return newChild;
      }
    },
    removeChild: function(oldChild){
      if (UINode.prototype.removeChild.call(this, oldChild))
      {
        if (oldChild.flex)
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
      var ruler = this.tmpl.ruller;

      var lastBox = new Box(lastElement, false, element);
      var bottom = (lastBox.bottom - getComputedProperty(element, 'paddingTop') - getComputedProperty(element, 'borderTopWidth')) || 0;
      var height = getHeight(element, ruler);

      if (!SUPPORT_COMPUTESTYLE)
      {
        var offsetHeight = ruler.offsetHeight;
        ruler.style.height = lastElement.currentStyle.marginBottom;
        bottom += ruler.offsetHeight - offsetHeight;
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
          flexHeight += getHeight(node.element, ruler);
        }
      }

      if (flexNodeCount)
        this.cssRule.setProperty('height', Math.max(0, flexHeight/flexNodeCount) + 'px');
    },
    destroy: function(){
      UINode.prototype.destroy.call(this);

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

    addBlockResizeHandler: addBlockResizeHandler
  };
