
  basis.require('basis.event');
  basis.require('basis.dragdrop');
  basis.require('basis.layout');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/paginator.html
  * @namespace basis.ui.paginator
  */
  var namespace = this.path;


  //
  // import names
  //

  var createArray = basis.array.create;
  var createEvent = basis.event.create;
  var events = basis.event.events;
  var getBoundingRect = basis.layout.getBoundingRect;

  var DragDropElement = basis.dragdrop.DragDropElement;
  var UINode = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Paginator: resource('templates/paginator/Paginator.tmpl'),
    PaginatorNode: resource('templates/paginator/PaginatorNode.tmpl')
  });


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
  var PaginatorNode = UINode.subclass({
    className: namespace + '.PaginatorNode',

    emit_pageNumberChanged: createEvent('pageNumberChanged', 'oldPageNumber'),

    template: templates.PaginatorNode,

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
        this.parentNode.setActivePage(this.pageNumber);
    },

    setPageNumber: function(pageNumber){
      if (this.pageNumber != pageNumber)
      {
        var oldPageNumber = this.pageNumber;
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
    },
    over: function(){
      this.scrollThumbLeft_ = NaN;
      this.setSpanStartPage(this.spanStartPage_);
    }
  };

 /**
  * Paginator
  * @class
  */
  var Paginator = UINode.subclass({
    className: namespace + '.Paginator',

    template: templates.Paginator,
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
          return percent(activePage / Math.max(node.pageCount - 1, 1))
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
        events: 'pageCountChanged pageSpanChanged',
        getter: function(node){
          return node.scrollThumbLeft_
              || percent(basis.number.fit(node.spanStartPage_ / Math.max(node.pageCount - node.pageSpan, 1), 0, 1));
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
          this.setSpanStartPage(this.spanStartPage_ + delta);

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

    pageOffset: 1,
    pageSpan: 5,
    pageCount: 1,
    activePage: 1,

    spanStartPage_: -1,
    scrollThumbLeft_: NaN,

    dde: null,

   /**
    * @constructor
    */
    init: function(){
      UINode.prototype.init.call(this);

      var pageSpan = this.pageSpan;
      var pageCount = this.pageCount;
      var activePage = this.activePage;

      this.pageSpan = NaN;
      this.pageCount = NaN;
      this.activePage = NaN;

      this.setPageCount(pageCount);
      this.setPageSpan(pageSpan);
      this.setActivePage(activePage, true);

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
      UINode.prototype.templateSync.call(this);

      this.dde.setElement(
        'scrollThumb' in this.tmpl && 'scrollThumbWrapper' in this.tmpl
          ? this.tmpl.scrollThumb
          : null
      );
    },

   /**
    * @param {number} pageCount
    */
    setPageCount: function(pageCount){
      var newPageCount = Number(pageCount) || 0;
      var oldPageCount = this.pageCount;

      if (newPageCount != oldPageCount)
      {
        // set new value
        this.pageCount = newPageCount;

        // sync
        this.syncPages();
        this.updateSelection();

        // emit event
        this.emit_pageCountChanged(oldPageCount);
      }
    },

   /**
    * @param {number} pageSpan
    */
    setPageSpan: function(pageSpan){
      var newPageSpan = Math.max(1, pageSpan);
      var oldPageSpan = this.pageSpan;

      if (newPageSpan != oldPageSpan)
      {
        // set new value
        this.pageSpan = newPageSpan;

        // sync
        this.syncPages();
        this.updateSelection();

        // emit event
        this.emit_pageSpanChanged(oldPageSpan);
      }
    },

   /**
    * @param {number} activePage
    * @param {boolean} spotlight
    */
    setActivePage: function(activePage, spotlight){
      var newActivePage = Math.ceil(activePage - this.pageOffset) || 0;
      var oldActivePage = this.activePage;

      if (newActivePage != oldActivePage)
      {
        this.activePage = newActivePage;
        this.emit_activePageChanged(oldActivePage);

        if (spotlight)
          this.spotlightPage(this.activePage);

        this.updateSelection();
      }
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
      pageNumber = basis.number.fit(pageNumber, 0, this.pageCount < this.pageSpan ? 0 : this.pageCount - this.pageSpan);

      if (pageNumber != this.spanStartPage_)
      {
        this.spanStartPage_ = pageNumber;

        for (var i = 0, child; child = this.childNodes[i]; i++)
          child.setPageNumber(this.pageOffset + pageNumber + i);

        this.updateSelection();
      }

      this.updateBind('scrollThumbLeft');
    },

   /**
    */
    updateSelection: function(){
      var node = basis.array.search(this.childNodes, this.activePage + this.pageOffset, 'pageNumber');

      if (node)
        node.select();
      else
        this.selection.clear();
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
          pageNumber: this.pageOffset + this.spanStartPage_ + i
        });

      this.setChildNodes(pages);
      this.setSpanStartPage(this.spanStartPage_);
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.dde.destroy();
      this.dde = null;

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Paginator: Paginator
  };
