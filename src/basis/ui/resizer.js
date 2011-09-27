/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 * Vladimir Ratsev <wuzykk@gmail.com>
 * Vladimir Fateev <vnfateev@gmail.com>
 *
 */

basis.require('basis.dom');
basis.require('basis.cssom');
basis.require('basis.dragdrop');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.resizer
  */
  var namespace = 'basis.ui.resizer';

  var DOM = basis.dom;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var DragDropElement = basis.dragdrop.DragDropElement;

  //
  // Resizer
  //

  function getComputedStyle(element, styleProp){
    if (window.getComputedStyle)
    {
      var computedStyle = document.defaultView.getComputedStyle(element, null);
      if (computedStyle)
        return computedStyle.getPropertyValue(styleProp);
    }
    else
    {
      if (element.currentStyle)
        return element.currentStyle[styleProp];
    }
  }

  var resizerDisableRule = cssom.cssRule('IFRAME');

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
    },
    event_start: function(cfg){
      super_.event_start.call(this, cfg);

      cfg.delta = PROPERTY_DELTA[this.property];
      cfg.factor = this.factor;

      var parentNode = this.element.parentNode;
      var parentNodeSize;

      // determine dir
      var cssFloat = getComputedStyle(this.element, 'float');
      var cssPosition = getComputedStyle(this.element, 'position');
      
      if (cfg.delta == 'deltaY')
      {
        parentNodeSize = parentNode.clientHeight - parseFloat(getComputedStyle(parentNode, 'padding-top')) - parseFloat(getComputedStyle(parentNode, 'padding-bottom'));
        cfg.offsetStart = this.element.offsetHeight;
        if (isNaN(cfg.factor))
          cfg.factor = cssPosition != 'static' && getComputedStyle(this.element, 'bottom') != 'auto'
            ? -1
            : 1;
      }
      else
      {
        parentNodeSize = parentNode.clientWidth - parseFloat(getComputedStyle(parentNode, 'padding-left')) - parseFloat(getComputedStyle(parentNode, 'padding-right'));
        cfg.offsetStart = this.element.offsetWidth;

        if (isNaN(cfg.factor))
          cfg.factor = cssFloat == 'right' || (cssPosition != 'static' && getComputedStyle(this.element, 'right') != 'auto')
            ? -1
            : 1;
      }

      cfg.offsetStartInPercent = 100/parentNodeSize;
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
    },

   /**
    * @constructor
    */
    init: function(config){
      this.resizer = DOM.createElement('.Basis-Resizer');
      this.resizer.style.cursor = PROPERTY_CURSOR[this.property][1];
      
      super_.init.call(this, config);
    },
    setElement: function(element, trigger){
      var oldElement = this.element;
      
      super_.setElement.call(this, element, this.resizer);

      if (oldElement !== this.element)
      {
        if (oldElement)
          DOM.remove(this.resizer);
        if (this.element)
          DOM.insert(this.element, this.resizer);
      }
    }
  }});

  //
  // export names
  //

  basis.namespace(namespace).extend({
    Resizer: Resizer
  });

}(basis);