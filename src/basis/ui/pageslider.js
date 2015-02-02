
 /**
  * @namespace basis.ui.pageslider
  */

  var namespace = this.path;


  //
  // import names
  //

  var PageControl = require('basis.ui.tabs').PageControl;
  var Scroller = require('basis.ui.scroller').Scroller;
  var resize = require('basis.dom.resize');


  //
  // definitions
  //

  var templates = require('basis.template').define(namespace, {
    PageSlider: resource('./templates/pageslider/PageSlider.tmpl')
  });

  var DIRECTIONS  = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
  };
  var PROPERTIES = {
    horizontal: {
      position: 'left',
      offset: 'offsetLeft',
      size: 'offsetWidth',
      currentVelocity: 'currentVilocityX',
      viewport: 'viewportX',
      setPosition: 'setPositionX',
      addPosition: 'addPositionX'
    },
    vertical: {
      position: 'top',
      offset: 'offsetTop',
      size: 'offsetHeight',
      currentVelocity: 'currentVilocityY',
      viewport: 'viewportY',
      setPosition: 'setPositionY',
      addPosition: 'addPositionY'
    }
  };

  //
  // main part
  //

  var PageSlider = PageControl.subclass({
    className: namespace + '.PageSlider',

    rotate: false,
    direction: DIRECTIONS.HORIZONTAL,
    properties: PROPERTIES[DIRECTIONS.HORIZONTAL],

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
        child.element.style[this.properties.position] = (100 * i) + '%';
    },

    init: function(){
      this.properties = PROPERTIES[this.direction];

      PageControl.prototype.init.call(this);

      this.scroller = new Scroller(basis.object.extend({
        scrollY: this.direction == DIRECTIONS.VERTICAL,
        scrollX: this.direction == DIRECTIONS.HORIZONTAL,
        minScrollDelta: 10,
        handler: {
          context: this,
          callbacks: {
            startInertia: this.setPage
          }
        }
      }, this.scrollerConfig));
    },

    syncOffset: function(){
      var selected = this.selection.pick();
      this.scroller[this.properties.setPosition](
        selected ? selected.element[this.properties.offset] : 0
      );
    },

    templateSync: function(){
      if (this.tmpl)
        resize.remove(this.element, this.syncOffset, this);

      PageControl.prototype.templateSync.call(this);

      if (this.childNodesElement)
      {
        this.scroller.setElement(this.childNodesElement);

        if (this.rotate && this.firstChild)
          this.adjustRotation(true);

        this.realign();
      }

      if (this.tmpl)
        resize.add(this.element, this.syncOffset, this);
    },

    isHorizontal: function(){
      return this.direction == DIRECTIONS.HORIZONTAL;
    },

    realign: function(){
      this.scrollToPage(this.selection.pick(), true);
    },

    setPage: function(){
      var currentPage = this.selection.pick();

      if (!currentPage)
        return;

      var currentElement = currentPage.element;
      var pageSize = currentElement[this.properties.size];
      var pagePosition = currentElement[this.properties.offset];
      var pageScrollTo;

      var scroller = this.scroller;
      var currentVelocity = scroller[this.properties.currentVelocity];
      var viewPort = scroller[this.properties.viewport];
      if (currentVelocity)
      {
        pageScrollTo = currentVelocity > 0
          ? currentPage.nextSibling
          : currentPage.previousSibling;
      }
      else
        if ((viewPort > (pagePosition + pageSize / 2)) ||
            (viewPort < (pagePosition - pageSize / 2)))
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
        var offsetSize = element[this.properties.size];

        if (offsetSize > 0)
          this.scroller[this.properties.setPosition](element[this.properties.offset], !noSmooth);
      }
    },

    adjustRotation: function(leftToRight){
      var selected = this.selection.pick();

      var childCount = this.childNodes.length;
      var index = this.childNodes.indexOf(selected);

      if (childCount < 2 || index == -1)
        return;

      var delta = (leftToRight ? Math.ceil(childCount / 2) - 1 : Math.round(childCount / 2)) - index;

      var firstElement = this.firstChild.element;
      var childSize = firstElement[this.properties.size];
      var offset = 0;

      for (var i = 0; i < Math.abs(delta); i++)
      {
        if (delta > 0)
        {
          this.insertBefore(this.lastChild, this.firstChild);
          offset += childSize;
        }
        else
        {
          this.appendChild(this.firstChild);
          offset -= childSize;
        }
      }

      this.scroller[this.properties.addPosition](offset);

      this.emit_childNodesModified({});
    },

    selectNext: function(){
      if (this.childNodes.length < 2)
        return;

      if (this.rotate)
        this.adjustRotation(true);

      this.scrollToPage(this.selection.pick().nextSibling);
    },
    selectPrev: function(){
      if (this.childNodes.length < 2)
        return;

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
