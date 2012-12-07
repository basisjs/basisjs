
  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.dragdrop');
  basis.require('basis.ui');

  var styleRequired = Function.runOnce(function(){
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

  var DOM = basis.dom;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var DragDropElement = basis.dragdrop.DragDropElement;


  //
  // main part
  //

  var patchedComputedStyle;

  function getPixelValue(element, value) {
    if (IS_PIXEL.test(value))
      return parseInt(value, 10) + 'px';

    // The awesome hack by Dean Edwards
    // @see http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    var style = element.style.left;
    var runtimeStyle = element.runtimeStyle.left;

    // set new values
    element.runtimeStyle.left = element.currentStyle.left;
    element.style.left = value || 0;

    // fetch new value
    value = element.style.pixelLeft;

    // restore values
    element.style.left = style;
    element.runtimeStyle.left = runtimeStyle;

    // return value in pixels
    return value + 'px';
  }

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
    patchedComputedStyle = function(element, styleProp){
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
      var element = DOM.insert(document.body, DOM.createElement('[style="position:absolute;top:auto"]'));

      if (patchedComputedStyle(element, 'top') != 'auto')
        GETCOMPUTEDSTYLE_BUGGY = {
          top: true,
          bottom: true,
          left: true,
          right: true,
          height: true,
          width: true
        };

      DOM.remove(element);
    });
  }
  else
  {
    var VALUE_UNIT = /^-?(\d*\.)?\d+([a-z]+|%)?$/i;
    var IS_PIXEL = /\dpx$/i;

    // getComputedStyle function for non-W3C spec browsers (Internet Explorer 6-8)
    patchedComputedStyle = function(element, styleProp){
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
  }

  var resizerDisableRule = cssom.createRule('IFRAME');

  var PROPERTY_DELTA = {
    width: 'deltaX',/*
    left: 'deltaX',
    right: 'deltaX',*/

    height: 'deltaY'/*,
    top: 'deltaY',
    bottom: 'deltaY'*/
  };

  var PROPERTY_CURSOR = {
    width: { '-1': 'w-resize', '1': 'e-resize' },
    height: { '-1': 'n-resize', '1': 's-resize' }
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
        if (typeof console != 'undefined') console.warn('Property to change `' + this.property + '` is unsupported');
        this.stop();
        return;
      }

      resizerDisableRule.setProperty('pointerEvents', 'none'); // disable iframes to catch mouse events
      this.cursorOverloadRule_ = cssom.createRule('*');
    },
    event_start: function(cfg){
      super_.event_start.call(this, cfg);

      this.cursorOverloadRule_.setProperty('cursor', this.cursor + ' !important');

      cfg.delta = PROPERTY_DELTA[this.property];
      cfg.factor = this.factor;

      // determine dir
      var cssFloat = patchedComputedStyle(this.element, 'float');
      var cssPosition = patchedComputedStyle(this.element, 'position');

      var relToOffsetParent = cssPosition == 'absolute' || cssPosition == 'fixed';
      var parentNode = relToOffsetParent ? this.element.offsetParent : this.element.parentNode;
      var parentNodeSize;
      
      if (cfg.delta == 'deltaY')
      {
        cfg.offsetStart = this.element.clientHeight
          - parseFloat(patchedComputedStyle(this.element, 'padding-top'))
          - parseFloat(patchedComputedStyle(this.element, 'padding-bottom'));

        parentNodeSize = parentNode.clientHeight;
        if (!relToOffsetParent)
          parentNodeSize -= parseFloat(patchedComputedStyle(parentNode, 'padding-top')) + parseFloat(patchedComputedStyle(parentNode, 'padding-bottom'));

        if (isNaN(cfg.factor))
          cfg.factor = relToOffsetParent && patchedComputedStyle(this.element, 'bottom') != 'auto'
            ? -1
            : 1;
      }
      else
      {
        cfg.offsetStart = this.element.clientWidth
          - parseFloat(patchedComputedStyle(this.element, 'padding-left'))
          - parseFloat(patchedComputedStyle(this.element, 'padding-right'));

        parentNodeSize = parentNode.clientWidth;
        if (!relToOffsetParent)
          parentNodeSize -= parseFloat(patchedComputedStyle(parentNode, 'padding-left')) + parseFloat(patchedComputedStyle(parentNode, 'padding-right'));

        if (isNaN(cfg.factor))
        {
          if (cssFloat == 'right')
            cfg.factor = -1;
          else
            if (cssFloat == 'left')
              cfg.factor = 1;
            else
              cfg.factor = relToOffsetParent && patchedComputedStyle(this.element, 'right') != 'auto'
                ? -1
                : 1;
        }
      }

      cfg.offsetStartInPercent = 100 / parentNodeSize;
      classList(this.resizer).add('selected');
    },
    event_move: function(cfg){
      super_.event_move.call(this, cfg);

      this.element.style[this.property] = cfg.offsetStartInPercent * (cfg.offsetStart + cfg.factor * cfg[cfg.delta]) + '%';
    },
    event_over: function(cfg){
      super_.event_over.call(this, cfg);

      classList(this.resizer).remove('selected');
      resizerDisableRule.setProperty('pointerEvents', 'auto');

      this.cursorOverloadRule_.destroy();
      this.cursorOverloadRule_ = null;
    },

   /**
    * @constructor
    */
    init: function(){
      styleRequired();

      this.resizer = DOM.createElement('.Basis-Resizer');
      this.cursor = PROPERTY_CURSOR[this.property][1];
      this.resizer.style.cursor = this.cursor;
      
      super_.init.call(this);
    },
    setElement: function(element){
      var oldElement = this.element;
      
      super_.setElement.call(this, element, this.resizer);

      if (oldElement !== this.element)
      {
        if (oldElement)
          DOM.remove(this.resizer);
        if (this.element)
          DOM.insert(this.element, this.resizer);
      }
    },
    destroy: function(){
      super_.destroy.call(this);

      if (this.cursorOverloadRule_)
      {
        this.cursorOverloadRule_.destroy();
        this.cursorOverloadRule_ = null;
      }
    }
  }});


  //
  // export names
  //

  module.exports = {
    Resizer: Resizer
  };
