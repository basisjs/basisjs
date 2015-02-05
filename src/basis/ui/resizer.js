
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

  var cssom = require('basis.cssom');
  var classList = cssom.classList;
  var computedStyle = require('basis.dom.computedStyle').get;
  var DragDropElement = require('basis.dragdrop').DragDropElement;


  //
  // main part
  //


  var resizerDisableRule = cssom.createRule('IFRAME');
  var cursorOverrideRule;

  var styleRequired = basis.fn.runOnce(function(){
    resource('./templates/resizer/style.css').fetch().startUse();
  });

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
  var Resizer = DragDropElement.subclass(function(super_){
    return {
      className: namespace + '.Resizer',

     /**
      * Direction of grow depends on delta changes.
      * If value is NaN direction calculate automatically according to related element style.
      * @type {number}
      */
      factor: NaN,
      property: 'width',

      prepareDrag: function(dragData, event){
        super_.prepareDrag.call(this, dragData, event);

        if (!PROPERTY_DELTA[this.property])
        {
          /** @cut */ basis.dev.warn('Property to change `' + this.property + '` is unsupported');
          this.stop();
          return;
        }

        resizerDisableRule.setProperty('pointerEvents', 'none'); // disable iframes to catch mouse events
        cursorOverrideRule = cssom.createRule('*');
        cursorOverrideRule.creator = this;
      },
      emit_start: function(dragData, event){
        super_.emit_start.call(this, dragData, event);

        cursorOverrideRule.setProperty('cursor', this.cursor + ' !important');

        dragData.delta = PROPERTY_DELTA[this.property];
        dragData.factor = this.factor;

        // determine dir
        var cssFloat = computedStyle(this.element, 'float');
        var cssPosition = computedStyle(this.element, 'position');

        var relToOffsetParent = cssPosition == 'absolute' || cssPosition == 'fixed';
        var parentNode = relToOffsetParent ? this.element.offsetParent || document.body : this.element.parentNode;
        var parentNodeSize;

        if (dragData.delta == 'deltaY')
        {
          dragData.offsetStart = this.element.clientHeight
            - parseFloat(computedStyle(this.element, 'padding-top'))
            - parseFloat(computedStyle(this.element, 'padding-bottom'));

          parentNodeSize = parentNode.clientHeight;
          if (!relToOffsetParent)
            parentNodeSize -= parseFloat(computedStyle(parentNode, 'padding-top')) + parseFloat(computedStyle(parentNode, 'padding-bottom'));

          if (isNaN(dragData.factor))
            dragData.factor = -(relToOffsetParent && computedStyle(this.element, 'bottom') != 'auto') || 1;
        }
        else
        {
          dragData.offsetStart = this.element.clientWidth
            - parseFloat(computedStyle(this.element, 'padding-left'))
            - parseFloat(computedStyle(this.element, 'padding-right'));

          parentNodeSize = parentNode.clientWidth;
          if (!relToOffsetParent)
            parentNodeSize -= parseFloat(computedStyle(parentNode, 'padding-left')) + parseFloat(computedStyle(parentNode, 'padding-right'));

          if (isNaN(dragData.factor))
          {
            if (cssFloat == 'right')
              dragData.factor = -1;
            else
              if (cssFloat == 'left')
                dragData.factor = 1;
              else
                dragData.factor = -(relToOffsetParent && computedStyle(this.element, 'right') != 'auto') || 1;
          }
        }

        dragData.offsetStartInPercent = 100 / parentNodeSize;
        classList(this.resizer).add('selected');
      },
      emit_drag: function(dragData, event){
        super_.emit_drag.call(this, dragData, event);

        var metricName = dragData.delta == 'deltaX' ? 'offsetWidth' : 'offsetHeight';
        var metricValue = this.element[metricName];
        var curValue = this.element.style[this.property];

        try {
          this.element.style[this.property] = dragData.offsetStartInPercent * (dragData.offsetStart + dragData.factor * dragData[dragData.delta]) + '%';
        } catch(e) {}

        // restore value if new value takes no effect
        if (this.element[metricName] == metricValue)
          this.element.style[this.property] = curValue;
      },
      emit_over: function(dragData, event){
        super_.emit_over.call(this, dragData, event);

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

        this.resizer = document.createElement('div');
        this.resizer.className = 'Basis-Resizer';
        this.cursor = PROPERTY_CURSOR[this.property][1];
        this.resizer.style.cursor = this.cursor;

        super_.init.call(this);
      },
      setElement: function(element){
        super_.setElement.call(this, element, this.resizer);

        if (!this.element)
          basis.doc.remove(this.resizer);
        else
          if (this.resizer.parentNode != this.element)
            this.element.appendChild(this.resizer);
      },
      destroy: function(){
        super_.destroy.call(this);

        if (cursorOverrideRule && cursorOverrideRule.creator == this)
        {
          cursorOverrideRule.destroy();
          cursorOverrideRule = null;
        }
      }
    };
  });


  //
  // export names
  //

  module.exports = {
    Resizer: Resizer
  };
