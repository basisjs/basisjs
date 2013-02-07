
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
  // definitions
  //

  var templates = basis.template.define(namespace, {
    PageSlider: resource('templates/pageslider/PageSlider.tmpl')
  });


  //
  // main part
  //
  
  var PageSlider = PageControl.subclass({
    className: namespace + '.PageSlider',

    template: templates.PageSlider,

    listen: {
      selection: {
        datasetChanged: function(selection){
          this.scrollToPage(selection.pick());
        }
      }
    },

    event_childNodesModified: function(delta){
      PageControl.prototype.event_childNodesModified.call(this, delta);

      for (var i = 0, child; child = this.childNodes[i]; i++)
        cssom.setStyle(child.element, {
          left: (100 * i) + '%'
        });
    },

    init: function(){
      PageControl.prototype.init.call(this);

      this.scroller = new Scroller({
        targetElement: this.tmpl.childNodesElement,
        scrollY: false,
        minScrollDelta: 10,
        handler: {
          context: this,
          callbacks: {
            startInertia: this.setPage
          }
        }
      });

      this.scrollToPage(this.selection.pick());
    },

    setPage: function(){
      var currentPage = this.selection.pick();

      if (!currentPage)
        return;

      var pageWidth = currentPage.element.offsetWidth;
      var pagePosition = currentPage.element.offsetLeft;
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
      if (page && this.scroller)
      {
        page.select();
        this.scroller.setPositionX(page.element.offsetLeft, true);
      }
    },

    destroy: function(){
      PageControl.prototype.destroy.call(this);

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
