
  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.dragdrop');
  basis.require('basis.ui');

  var styleRequired = basis.fn.runOnce(function(){
    resource('templates/resizer/style.css')().startUse();
  });


 /**
  * @see ./demo/defile/resizer.html
  * @namespace basis.ui.resizer
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var parseFloat = global.parseFloat;

  var dom = basis.dom;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var DragDropElement = basis.dragdrop.DragDropElement;


  //
  // main part
  //

  var computedStyle;

  if ('getComputedStyle' in global)
  {
    // Gecko's getComputedStyle returns computed values for top/bottom/left/right/height/width, but 
    // according to W3C spec getComputedStyle should returns used values.
    //
    // https://developer.mozilla.org/en/DOM/window.getComputedStyle:
    //   The returned object actually represents the CSS 2.1 used values, not the computed values.
    //   Originally, CSS 2.0 defined the computed values to be the "ready to be used" values of properties
    //   after cascading and inheritance, but CSS 2.1 redefined computed values as pre-layout, and used
    //   values as post-layout. The getComputedStyle function returns the old meaning of computed values,
    //   now called used values. There is no DOM API to get CSS 2.1 computed values.
    // 
    // This workaround helps fetch used values instead of computed. It doesn't work with some pseudo-classes
    // like :empty, :only-child, :nth-child and so on, but in general cases it should works fine.
    // The main idea that getComputedStyle returns used values for elements which not in document, because layout
    // properties can't calculated outside of document. But it still returns style according rule set that will be
    // applied to element when it in document. Based on this, we clone element's ancestor vector and get computed
    // style on cloned element. Ancestor cloning is necessary, because it influence on rule set that apply to element.
    var GETCOMPUTEDSTYLE_BUGGY = {};

    // getComputedStyle function using W3C spec
    computedStyle = function(element, styleProp){
      if (GETCOMPUTEDSTYLE_BUGGY[styleProp])
      {
        // clone ancestor vector
        var axis = [];
        while (element && element.nodeType == 1)
        {
          axis.push(element.cloneNode(false));
          element = element.parentNode;
        }

        element = axis.pop();
        while (axis.length)
          element = element.appendChild(axis.pop());
      }

      var style = global.getComputedStyle(element, null);
      if (style)
        return style.getPropertyValue(styleProp);
    };

    // test for computed style bug
    basis.ready(function(){
      var element = dom.insert(document.body, dom.createElement('[style="position:absolute;top:auto"]'));

      if (computedStyle(element, 'top') != 'auto')
        GETCOMPUTEDSTYLE_BUGGY = {
          top: true,
          bottom: true,
          left: true,
          right: true,
          height: true,
          width: true
        };

      dom.remove(element);
    });
  }
  else
  {
    var VALUE_UNIT = /^-?(\d*\.)?\d+([a-z]+|%)?$/i;
    var IS_PIXEL = /\dpx$/i;

    // getComputedStyle function for non-W3C spec browsers (Internet Explorer 6-8)
    computedStyle = function(element, styleProp){
      var style = element.currentStyle;

      if (style)
      {
        var value = style[styleProp];
        var unit = value.match(VALUE_UNIT);

        if (unit && unit[2] && unit[2] != 'px')
          value = getPixelValue(element, value);

        return value;
      }
    };

    // css value to pixel convertor
    var getPixelValue = function(element, value) {
      if (IS_PIXEL.test(value))
        return parseInt(value, 10) + 'px';

      // The awesome hack by Dean Edwards
      // @see http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

      var style = element.style;
      var runtimeStyle = element.runtimeStyle;

      var left = style.left;
      var runtimeLeft = runtimeStyle.left;

      // set new values
      runtimeStyle.left = element.currentStyle.left;
      style.left = value || 0;

      // fetch new value
      value = style.pixelLeft;

      // restore values
      style.left = left;
      runtimeStyle.left = runtimeLeft;

      // return value in pixels
      return value + 'px';
    };
  }

  var resizerDisableRule = cssom.createRule('IFRAME');
  var cursorOverrideRule;

  var PROPERTY_DELTA = {
    width: 'deltaX',
    height: 'deltaY'
  };

  var PROPERTY_CURSOR = {
    width: {
      '-1': 'w-resize',
      '1': 'e-resize'
    },
    height: {
      '-1': 'n-resize',
      '1': 's-resize'
    }
  };


 /**
  * @class
  */
  var Resizer = DragDropElement.subclass(function(super_){ return {
    className: namespace + '.Resizer',

   /**
    * Direction of grow depends on delta changes.
    * If value is NaN direction calculate automatically according to related element style.
    * @type {number}
    */
    factor: NaN,
    property: 'width',

    event_prepare: function(){
      if (!PROPERTY_DELTA[this.property])
      {
        ;;;basis.dev.warn('Property to change `' + this.property + '` is unsupported');
        this.stop();
        return;
      }

      resizerDisableRule.setProperty('pointerEvents', 'none'); // disable iframes to catch mouse events
      cursorOverrideRule = cssom.createRule('*');
      cursorOverrideRule.creator = this;
    },
    event_start: function(cfg){
      super_.event_start.call(this, cfg);

      cursorOverrideRule.setProperty('cursor', this.cursor + ' !important');

      cfg.delta = PROPERTY_DELTA[this.property];
      cfg.factor = this.factor;

      // determine dir
      var cssFloat = computedStyle(this.element, 'float');
      var cssPosition = computedStyle(this.element, 'position');

      var relToOffsetParent = cssPosition == 'absolute' || cssPosition == 'fixed';
      var parentNode = relToOffsetParent ? this.element.offsetParent : this.element.parentNode;
      var parentNodeSize;
      
      if (cfg.delta == 'deltaY')
      {
        cfg.offsetStart = this.element.clientHeight
          - parseFloat(computedStyle(this.element, 'padding-top'))
          - parseFloat(computedStyle(this.element, 'padding-bottom'));

        parentNodeSize = parentNode.clientHeight;
        if (!relToOffsetParent)
          parentNodeSize -= parseFloat(computedStyle(parentNode, 'padding-top')) + parseFloat(computedStyle(parentNode, 'padding-bottom'));

        if (isNaN(cfg.factor))
          cfg.factor = -(relToOffsetParent && computedStyle(this.element, 'bottom') != 'auto') || 1;
      }
      else
      {
        cfg.offsetStart = this.element.clientWidth
          - parseFloat(computedStyle(this.element, 'padding-left'))
          - parseFloat(computedStyle(this.element, 'padding-right'));

        parentNodeSize = parentNode.clientWidth;
        if (!relToOffsetParent)
          parentNodeSize -= parseFloat(computedStyle(parentNode, 'padding-left')) + parseFloat(computedStyle(parentNode, 'padding-right'));

        if (isNaN(cfg.factor))
        {
          if (cssFloat == 'right')
            cfg.factor = -1;
          else
            if (cssFloat == 'left')
              cfg.factor = 1;
            else
              cfg.factor = -(relToOffsetParent && computedStyle(this.element, 'right') != 'auto') || 1;
        }
      }

      cfg.offsetStartInPercent = 100 / parentNodeSize;
      classList(this.resizer).add('selected');
    },
    event_move: function(cfg){
      super_.event_move.call(this, cfg);

      var metricName = cfg.delta == 'deltaX' ? 'offsetWidth' : 'offsetHeight';
      var metricValue = this.element[metricName];
      var curValue = this.element.style[this.property];

      this.element.style[this.property] = cfg.offsetStartInPercent * (cfg.offsetStart + cfg.factor * cfg[cfg.delta]) + '%';

      // restore value if new value takes no effect
      if (this.element[metricName] == metricValue)
        this.element.style[this.property] = curValue;
    },
    event_over: function(cfg){
      super_.event_over.call(this, cfg);

      classList(this.resizer).remove('selected');
      resizerDisableRule.setProperty('pointerEvents', 'auto');

      cursorOverrideRule.destroy();
      cursorOverrideRule = null;
    },

   /**
    * @constructor
    */
    init: function(){
      styleRequired();

      this.resizer = dom.createElement('.Basis-Resizer');
      this.cursor = PROPERTY_CURSOR[this.property][1];
      this.resizer.style.cursor = this.cursor;
      
      super_.init.call(this);
    },
    setElement: function(element){
      super_.setElement.call(this, element, this.resizer);

      if (!this.element)
        dom.remove(this.resizer);
      else
        if (this.resizer.parentNode != this.element)
          dom.insert(this.element, this.resizer);
    },
    destroy: function(){
      super_.destroy.call(this);

      if (cursorOverrideRule && cursorOverrideRule.creator == this)
      {
        cursorOverrideRule.destroy();
        cursorOverrideRule = null;
      }
    }
  }});


  //
  // export names
  //

  module.exports = {
    Resizer: Resizer
  };
