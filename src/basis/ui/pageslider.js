
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
    PageSlider: resource('./templates/pageslider/PageSlider.tmpl')
  });

  var DIRECTIONS  = {
    HORIZONTAL:'horizontal',
    VERTICAL:'vertical'
  };

  //
  // main part
  //

  var PageSlider = PageControl.subclass({
    className: namespace + '.PageSlider',

    template: templates.PageSlider,
    direction: DIRECTIONS.HORIZONTAL,
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

      for (var i = 0, child; child = this.childNodes[i]; i++) {
        var style = this.isHorizontal() ? {
          left: (100 * i) + '%'
        } : {
          top: (100 * i) + '%'
        };
        cssom.setStyle(child.element, style);
      }

    },
    isHorizontal: function() {
      return this.direction === DIRECTIONS.HORIZONTAL;
    },
    init: function(){
      PageControl.prototype.init.call(this);
      this.scroller = new Scroller(basis.object.extend({
        scrollY: !this.isHorizontal(),
        scrollX: this.isHorizontal(),
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

      var currentElement = currentPage.element;
      var pageSize = this.isHorizontal() ? currentElement.offsetWidth : currentElement.offsetHeight;
      var pagePosition = this.isHorizontal() ? currentElement.offsetLeft : currentElement.offsetTop;
      var pageScrollTo;

      var scroller = this.scroller;
      var currentVelocity = this.isHorizontal() ? scroller.currentVelocityX : scroller.currentVelocityY;
      var viewPort = this.isHorizontal() ? scroller.viewportX : scroller.viewportY;
      if (currentVelocity)
      {
        pageScrollTo = currentVelocity > 0
          ? currentPage.nextSibling
          : currentPage.previousSibling;
      }
      else
        if ((viewPort > (pagePosition + pageSize / 2))
            || (viewPort < (pagePosition - pageSize / 2)))
        {
          pageScrollTo = viewPort - pagePosition > 0
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

        var element = page.element;
        var offsetSize = this.isHorizontal() ? element.offsetWidth : element.offsetHeight;
        if (offsetSize > 0)
        {
          var offsetPosition = this.isHorizontal() ? element.offsetLeft : element.offsetTop;
          if (this.isHorizontal())
            this.scroller.setPositionX(offsetPosition, !noSmooth);
          else
            this.scroller.setPositionY(offsetPosition, !noSmooth);
        }

      }
    },

    adjustRotation: function(leftToRight){
      var selected = this.selection.pick();

      var shiftLength = 0;

      var childCount = this.childNodes.length;
      var index = this.childNodes.indexOf(selected);

      var delta = (leftToRight ? Math.ceil(childCount / 2) - 1 : Math.round(childCount / 2)) - index;

      var firstElement = this.firstChild.element;
      var childSize = this.isHorizontal() ? firstElement.offsetWidth : firstElement.offsetHeight;

      for (var i = 0; i < Math.abs(delta); i++)
      {
        if (delta > 0)
        {
          this.insertBefore(this.lastChild, this.firstChild);
          shiftLength += childSize;
        }
        else
        {
          this.appendChild(this.firstChild);
          shiftLength -= childSize;
        }
      }

      if (this.isHorizontal())
        this.scroller.addPositionX(shiftLength);
      else
        this.scroller.addPositionY(shiftLength);


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
    PageSlider: PageSlider,
    DIRECTIONS: DIRECTIONS
  };
