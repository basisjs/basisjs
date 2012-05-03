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


 /**
  * @namespace basis.ui.pageslider
  */ 

  var namespace = this.path;


  //
  // import names
  //

  var cssom = basis.cssom;
  var PageControl = basis.ui.tabs.PageControl;
  var Scroller = basis.ui.scroller.Scroller;


  //
  // main part
  //
  
  var PageSlider = PageControl.subclass({
    className: namespace + '.PageSlider',

    template: 
      '<div class="Basis-PageControl Basis-PageSlider {selected} {disabled}">' +
        '<div{childNodesElement} class="Basis-PageSlider-Content"/>' +
      '</div>',

    childClass: {
      className: namespace + '.Page',
      event_select: function(){
        PageControl.prototype.childClass.prototype.event_select.apply(this, arguments);
        this.parentNode.scrollToPage(this);
      }
    },

    event_childNodesModified: function(node, delta){
      PageControl.prototype.event_childNodesModified.call(this, node, delta);

      for (var i = 0, child; child = this.childNodes[i]; i++)
        cssom.setStyle(child.element, { left: (100 * i) + '%' });
    },

    init: function(config){
      PageControl.prototype.init.call(this, config);

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
      var pageScrollTo;

      if (this.scroller.currentVelocityX)
      {
        pageScrollTo = this.scroller.currentVelocityX > 0
          ? currentPage.nextSibling
          : currentPage.previousSibling;
      }
      else
        if ((this.scroller.viewportX > (pagePosition + pageWidth / 2)) 
            || (this.scroller.viewportX < (pagePosition - pageWidth / 2)))
        {
          pageScrollTo = this.scroller.viewportX - pagePosition > 0
            ? currentPage.nextSibling
            : currentPage.previousSibling;
        }

      if (!pageScrollTo)
        pageScrollTo = currentPage;

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

      this.scroller.destroy();
      this.scroller = null;
    }
  });


  //
  // export names
  //

  module.exports = {
    PageSlider: PageSlider
  };
