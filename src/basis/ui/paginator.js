
 /**
  * @see ./demo/defile/paginator.html
  * @namespace basis.ui.paginator
  */
  var namespace = this.path;


  //
  // import names
  //

  var basisEvent = require('basis.event');
  var createEvent = basisEvent.create;
  var resolveValue = require('basis.data').resolveValue;
  var getBoundingRect = require('basis.layout').getBoundingRect;
  var DragDropElement = require('basis.dragdrop').DragDropElement;
  var Node = require('basis.ui').Node;


  //
  // main part
  //

  function percent(value){
    return (100 * value || 0).toFixed(4) + '%';
  }


 /**
  * Base child node class for Paginator
  * @class
  */
  var PaginatorNode = Node.subclass({
    className: namespace + '.PaginatorNode',

    propertyDescriptors: {
      pageNumber: 'pageNumberChanged'
    },

    emit_pageNumberChanged: createEvent('pageNumberChanged', 'oldPageNumber'),

    template: module.template('PaginatorNode'),
    binding: {
      pageNumber: {
        events: 'pageNumberChanged',
        getter: function(node){
          return node.pageNumber;
        }
      }
    },
    action: {
      click: function(event){
        event.die();
        if (!this.isDisabled())
          this.click();
      }
    },

    click: function(){
      if (this.parentNode)
        this.parentNode.selectPage(this.pageNumber);
    },

    setPageNumber: function(pageNumber){
      var oldPageNumber = this.pageNumber;

      if (oldPageNumber != pageNumber)
      {
        this.pageNumber = pageNumber;
        this.emit_pageNumberChanged(oldPageNumber);
      }
    }
  });

  //
  // Paginator
  //

  var DRAGDROP_HANDLER = {
    start: function(){
      this.initOffset = this.tmpl.scrollThumb.offsetLeft;
    },
    drag: function(sender, dragData){
      var pos = basis.number.fit((this.initOffset + dragData.deltaX) / this.tmpl.scrollThumbWrapper.offsetWidth, 0, 1);
      this.scrollThumbLeft_ = percent(pos);
      this.setSpanStartPage(Math.round(pos * (this.pageCount - this.pageSpan)));
      this.emit_scrollThumbChanged();
    },
    over: function(){
      this.scrollThumbLeft_ = NaN;
      this.emit_scrollThumbChanged();
    }
  };

 /**
  * Paginator
  * @class
  */
  var Paginator = Node.subclass({
    className: namespace + '.Paginator',

    propertyDescriptors: {
      pageSpan: 'pageSpanChanged',
      pageCount: 'pageCountChanged',
      activePage: 'activePageChanged',
      spanStartPage: 'spanStartPageChanged'
    },

    template: module.template('Paginator'),
    binding: {
      noScroll: {
        events: 'pageCountChanged pageSpanChanged',
        getter: function(node){
          return node.pageSpan >= node.pageCount ? 'noScroll' : '';
        }
      },
      outOfRange: {
        events: 'pageCountChanged activePageChanged',
        getter: function(node){
          return node.activePage < 0 || node.activePage >= node.pageCount;
        }
      },
      activePageMarkWrapperWidth: {
        events: 'pageCountChanged',
        getter: function(node){
          return percent(1 - (1 / node.pageCount));
        }
      },
      activePageMarkWidth: {
        events: 'pageCountChanged',
        getter: function(node){
          var rangeWidth = 1 / node.pageCount;

          return percent(rangeWidth / (1 - rangeWidth));
        }
      },
      activePageMarkLeft: {
        events: 'pageCountChanged activePageChanged',
        getter: function(node){
          var activePage = basis.number.fit(node.activePage, 0, node.pageCount - 1);

          return percent(activePage / Math.max(node.pageCount - 1, 1));
        }
      },
      scrollThumbWrapperWidth: {
        events: 'pageCountChanged pageSpanChanged',
        getter: function(node){
          return percent(1 - (node.pageSpan / node.pageCount));
        }
      },
      scrollThumbWidth: {
        events: 'pageCountChanged pageSpanChanged',
        getter: function(node){
          // spanWidth        : 1 - spanWidth
          // scrollThumbWidth : 1
          // ---
          // scrollThumbWidth = spanWidth / (1 - spanWidth)
          var spanWidth = node.pageSpan / node.pageCount;

          return percent(spanWidth / (1 - spanWidth));
        }
      },
      scrollThumbLeft: {
        events: 'pageCountChanged pageSpanChanged spanStartPageChanged scrollThumbChanged',
        getter: function(node){
          return node.scrollThumbLeft_ ||
                 percent(basis.number.fit(node.spanStartPage / Math.max(node.pageCount - node.pageSpan, 1), 0, 1));
        }
      }
    },
    action: {
      jumpTo: function(event){
        var scrollbar = this.tmpl.scrollbar || this.element;
        var pos = (event.mouseX - getBoundingRect(scrollbar).left) / scrollbar.offsetWidth;

        this.setSpanStartPage(Math.floor(pos * this.pageCount) - Math.floor(this.pageSpan / 2));
      },
      scroll: function(event){
        var delta = event.wheelDelta;

        if (delta)
        {
          // set new offset
          this.setSpanStartPage(this.spanStartPage + delta);

          // prevent page scrolling
          event.die();
        }
      }
    },

    selection: true,
    childClass: PaginatorNode,

    emit_activePageChanged: createEvent('activePageChanged', 'oldActivePahe'),
    emit_pageCountChanged: createEvent('pageCountChanged', 'oldPageCount'),
    emit_pageSpanChanged: createEvent('pageSpanChanged', 'oldPageSpan'),
    emit_spanStartPageChanged: createEvent('spanStartPageChanged', 'oldSpanStartPage'),
    emit_scrollThumbChanged: createEvent('scrollThumbChanged'),

    pageOffset: 1,
    pageSpan: 5,
    pageSpanRA_: null,
    pageCount: 1,
    pageCountRA_: null,
    activePage: 1,
    activePageRA_: null,
    spanStartPage: 1,

    scrollThumbLeft_: NaN,

    dde: null,

   /**
    * @constructor
    */
    init: function(){
      Node.prototype.init.call(this);

      var pageSpan = this.pageSpan;
      var pageCount = this.pageCount;
      var activePage = this.activePage;

      this.pageSpan = NaN;
      this.pageCount = NaN;
      this.activePage = NaN;

      this.setPageCount(pageCount);
      this.setPageSpan(pageSpan);
      this.setActivePage(activePage);

      this.dde = new DragDropElement({
        handler: {
          context: this,
          callbacks: DRAGDROP_HANDLER
        }
      });
    },

   /**
    * @inheritDoc
    */
    templateSync: function(){
      Node.prototype.templateSync.call(this);

      this.dde.setElement(
        'scrollThumb' in this.tmpl && 'scrollThumbWrapper' in this.tmpl
          ? this.tmpl.scrollThumb
          : null
      );
    },

   /**
    * @param {number} pageCount
    */
    setPageCount: function(pageCount, spotlight){
      pageCount = resolveValue(this, this.setPageCount, pageCount, 'pageCountRA_');

      var newPageCount = Number(pageCount) || 0;
      var oldPageCount = this.pageCount;

      if (newPageCount != oldPageCount)
      {
        // set new value
        this.pageCount = newPageCount;
        this.emit_pageCountChanged(oldPageCount);

        // sync
        this.syncPages();

        if (spotlight || !this.getActivePageChild())
          this.spotlightPage(this.activePage);

        this.updateSelection();
     }
    },

   /**
    * @param {number} pageSpan
    */
    setPageSpan: function(pageSpan, spotlight){
      pageSpan = resolveValue(this, this.setPageSpan, pageSpan, 'pageSpanRA_');

      var newPageSpan = Math.max(1, pageSpan);
      var oldPageSpan = this.pageSpan;

      if (newPageSpan != oldPageSpan)
      {
        // set new value
        this.pageSpan = newPageSpan;
        this.emit_pageSpanChanged(oldPageSpan);

        // sync
        this.syncPages();

        if (spotlight || !this.getActivePageChild())
          this.spotlightPage(this.activePage);

        this.updateSelection();
      }
    },

   /**
    * @param {number} activePage
    * @param {boolean} spotlight
    */
    setActivePage: function(activePage, spotlight){
      activePage = resolveValue(this, this.setActivePage, activePage, 'activePageRA_');

      var newActivePage = Math.ceil(activePage - this.pageOffset) || 0;
      var oldActivePage = this.activePage;

      if (newActivePage != oldActivePage)
      {
        this.activePage = newActivePage;
        this.emit_activePageChanged(oldActivePage);

        if (spotlight || !this.getActivePageChild())
          this.spotlightPage(this.activePage);

        this.updateSelection();
      }
    },

   /**
    * @return {basis.ui.paginator.PaginatorNode}
    */
    getActivePageChild: function(){
      return this.getChild(this.pageOffset + this.activePage, 'pageNumber');
    },

   /**
    * @param {number} pageNumber
    */
    selectPage: function(pageNumber){
      this.setActivePage(pageNumber);
    },

   /**
    * @param {number} pageNumber
    */
    spotlightPage: function(pageNumber){
      this.setSpanStartPage(pageNumber - Math.round(this.pageSpan / 2) + 1);
    },

   /**
    * @param {number} pageNumber
    */
    setSpanStartPage: function(pageNumber){
      var oldSpanStartPage = this.spanStartPage;
      var newSpanStartPage = basis.number.fit(pageNumber, 0, this.pageCount < this.pageSpan ? 0 : this.pageCount - this.pageSpan);

      if (newSpanStartPage != oldSpanStartPage)
      {
        this.spanStartPage = newSpanStartPage;
        this.emit_spanStartPageChanged(oldSpanStartPage);

        for (var i = 0, child; child = this.childNodes[i]; i++)
          child.setPageNumber(this.pageOffset + this.spanStartPage + i);

        this.updateSelection();
      }
    },

   /**
    */
    updateSelection: function(){
      this.selection.set(this.getActivePageChild());
    },

   /**
    */
    syncPages: function(){
      if (!this.pageSpan || !this.pageCount)
        this.clear();

      var pages = [];
      var pageCount = Math.min(this.pageSpan, this.pageCount);

      for (var i = 0; i < pageCount; i++)
        pages.push({
          pageNumber: this.pageOffset + this.spanStartPage + i
        });

      this.setChildNodes(pages);
      this.setSpanStartPage(this.spanStartPage);
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.dde.destroy();
      this.dde = null;

      if (this.pageSpanRA_)
        resolveValue(this, null, null, 'pageSpanRA_');
      if (this.pageCountRA_)
        resolveValue(this, null, null, 'pageCountRA_');
      if (this.activePageRA_)
        resolveValue(this, null, null, 'activePageRA_');

      Node.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Paginator: Paginator
  };
