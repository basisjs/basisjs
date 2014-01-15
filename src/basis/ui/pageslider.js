
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
        itemsChanged: function(selection, delta){
          if (this.scroller)
          {
            if (this.rotate && delta.deleted && delta.inserted)
            {
              var nextPosition = this.childNodes.indexOf(delta.deleted[0]);
              var prevPosition = this.childNodes.indexOf(delta.inserted[0]);
              this.adjustRotation(nextPosition > prevPosition);
            }

            this.scrollToPage(selection.pick());
          }
        }
      }
    },

    emit_childNodesModified: function(delta){
      PageControl.prototype.emit_childNodesModified.call(this, delta);

      for (var i = 0, child; child = this.childNodes[i]; i++)
        cssom.setStyle(child.element, {
          left: (100 * i) + '%'
        });
    },

    init: function(){
      PageControl.prototype.init.call(this);

      this.scroller = new Scroller(basis.object.extend({
        scrollY: false,
        minScrollDelta: 10,
        handler: {
          context: this,
          callbacks: {
            startInertia: this.setPage
          }
        }
      }, this.scrollerConfig));
    },

    templateSync: function(){
      PageControl.prototype.templateSync.call(this);

      if (this.childNodesElement)
      {
        this.scroller.setElement(this.childNodesElement);

        if (this.rotate && this.firstChild)
          this.adjustRotation(true);

        this.realign();
      }
    },

    realign: function(){
      this.scrollToPage(this.selection.pick(), true);
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

    scrollToPage: function(page, noSmooth){
      if (page && this.scroller)
      {
        page.select();

        if (page.element.offsetWidth > 0)
          this.scroller.setPositionX(page.element.offsetLeft, !noSmooth);
      }
    },

    adjustRotation: function(leftToRight){
      var selected = this.selection.pick();

      var shiftLength = 0;

      var childCount = this.childNodes.length;
      var index = this.childNodes.indexOf(selected);

      var delta = (leftToRight ? Math.ceil(childCount / 2) - 1 : Math.round(childCount / 2)) - index;

      var childWidth = this.firstChild.element.offsetWidth;

      for (var i = 0; i < Math.abs(delta); i++)
      {
        if (delta > 0)
        {
          this.insertBefore(this.lastChild, this.firstChild);
          shiftLength += childWidth;
        }
        else
        {
          this.appendChild(this.firstChild);
          shiftLength -= childWidth;
        }
      }

      this.scroller.addPositionX(shiftLength);
      this.emit_childNodesModified({});
    },

    selectNext: function(){
      if (this.rotate)
        this.adjustRotation(true);

      this.scrollToPage(this.selection.pick().nextSibling);
    },
    selectPrev: function(){
      if (this.rotate)
        this.adjustRotation(false);

      this.scrollToPage(this.selection.pick().previousSibling);
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
