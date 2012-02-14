/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

basis.require('basis.dom');
basis.require('basis.cssom');
basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.ui.scroller');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.pageslider
  */ 

  var namespace = 'basis.ui.pageslider';


  //
  // import names
  //

  var DOM = basis.dom;
  var Class = basis.Class;

  var PageControl = basis.ui.tabs.PageControl;
  var Scroller = basis.ui.scroller.Scroller;
  var classList = basis.cssom.classList;


  //
  // main part
  //
  
  var PageSlider = Class(PageControl, {
    className: namespace + '.PageSlider',

    template: 
      '<div class="Basis-PageControl Basis-PageSlider">' +
        '<div{childNodesElement} class="Basis-PageSlider-Content"/>' +
      '</div>',

    childClass: {
      event_select: function(){
        this.constructor.superClass_.prototype.event_select.apply(this, arguments);
        this.parentNode.scrollToPage(this);
      }
    },

    event_childNodesModified: function(node, delta){
      PageControl.prototype.event_childNodesModified.call(this, node, delta);

      for (var i = 0, child; child = this.childNodes[i]; i++)
        basis.cssom.setStyle(child.element, { left: (100 * i) + '%' });
    },

    init: function(config){
      PageControl.prototype.init.call(this, config);

      /*var cssClassName = 'gerericRule_' + this.eventObjectId;
      this.pageSliderCssRule = basis.cssom.cssRule('.' + cssClassName + ' > .Basis-Page');
      classList(this.element).add(cssClassName);*/

      this.scroller = new Scroller({
        targetElement: this.tmpl.childNodesElement,
        scrollY: false,
        minScrollDelta: 10,
        handler: {
          startInertia: this.setPage
        },
        handlerContext: this
      });

      if (this.selection.itemCount)
        this.scrollToPage(this.selection.pick())
    },

    setPage: function(scroller){
      var currentPage = this.selection.pick();
      if (!currentPage)
        return;

      var pageWidth = currentPage.element.offsetWidth;
      var pagePosition = currentPage.element.offsetLeft
      var pageScrollTo = currentPage;

      if (this.scroller.currentVelocityX)
      {
        pageScrollTo = (this.scroller.currentVelocityX > 0 ? currentPage.nextSibling : currentPage.previousSibling) || currentPage;
      }
      else if ((this.scroller.viewportX > (pagePosition + pageWidth / 2)) 
        || (this.scroller.viewportX < (pagePosition - pageWidth / 2))
      )
      {
        var dir = this.scroller.viewportX - pagePosition;
        pageScrollTo = (dir > 0 ? currentPage.nextSibling : currentPage.previousSibling) || currentPage;
      }

      this.scrollToPage(pageScrollTo);
    },

    scrollToPage: function(page){
      if (this.scroller)
      {
        page.select();
        this.scroller.setPositionX(page.element.offsetLeft, true);
      }
    },

    destroy: function(){
      PageControl.prototype.init.call(this, config);

      /*DOM.Style.getStyleSheet().removeCssRule(this.pageSliderCssRule.rule);
      this.pageSliderCssRule = null;*/

      this.scroller.destroy();
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    PageSlider: PageSlider
  });

}(basis);