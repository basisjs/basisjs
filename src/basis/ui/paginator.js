
  basis.require('basis.event');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.dragdrop');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/paginator.html
  * @namespace basis.ui.paginator
  */ 
  var namespace = this.path;


  //
  // import names
  //

  var Event = basis.dom.event;

  var createArray = basis.array.create;
  var createEvent = basis.event.create;
  var events = basis.event.events;

  var Box = basis.layout.Box;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var UINode = basis.ui.Node;


  //
  // main part
  //

  function percent(value){
    return (100 * value || 0).toFixed(4) + '%';
  }

  function updateSelection(paginator){
    var node = paginator.childNodes.search(paginator.activePage, 'pageNumber');
    if (node)
      node.select();
    else
      paginator.selection.clear();
  }

 /**
  * Base child node class for Paginator
  * @class
  */
  var PaginatorNode = UINode.subclass({
    className: namespace + '.PaginatorNode',

    event_pageNumberChanged: createEvent('pageNumberChanged', 'oldPageNumber'),

    template: resource('templates/paginator/PaginatorNode.tmpl'),

    binding: {
      pageNumber: {
        events: 'pageNumberChanged',
        getter: function(node){
          return node.pageNumber + 1;
        }
      }
    },

    action: {
      click: function(event){
        Event.kill(event);
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

        this.event_pageNumberChanged(oldPageNumber);
      }
    }
  });

  //
  // Paginator
  //

  var DRAGDROP_HANDLER = {
    start: function(sender, config){
      this.initOffset = this.tmpl.scrollTrumb.offsetLeft;
    },
    move: function(sender, config){
      var pos = ((this.initOffset + config.deltaX) / this.tmpl.scrollTrumbWrapper.offsetWidth).fit(0, 1);
      this.setSpanStartPage(Math.round(pos * (this.pageCount - this.pageSpan)));
      this.tmpl.scrollTrumb.style.left = percent(pos);
    },
    over: function(sender, config){
      this.setSpanStartPage(this.spanStartPage_);
    }
  };

 /**
  * Paginator
  * @class
  */
  var Paginator = UINode.subclass({
    className: namespace + '.Paginator',

    selection: true,
    childClass: PaginatorNode,

    template: resource('templates/paginator/Paginator.tmpl'),

    binding: {
      noScroll: {
        events: 'pageCountChanged',
        getter: function(node){
          return node.pageSpan >= node.pageCount ? 'noScroll' : '';
        }
      }
    },

    action: {
      jumpTo: function(actionName, event, node){
        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
        this.setSpanStartPage(Math.floor(pos * this.pageCount) - Math.floor(this.pageSpan / 2));
      },
      scroll: function(event){
        var delta = Event.wheelDelta(event);
        if (delta)
          this.setSpanStartPage(this.spanStartPage_ + delta);
      }
    },

    event_activePageChanged: createEvent('activePageChanged'),
    event_pageCountChanged: createEvent('pageCountChanged'),

    pageSpan: NaN,
    pageCount: NaN,
    activePage: NaN,

    defaultPageSpan: 5,
    defaultPageCount: 1,
    defaultActivePage: 0,

    spanStartPage_: -1,

    init: function(){
      UINode.prototype.init.call(this);

      var pageSpan = this.pageSpan || this.defaultPageSpan;
      var pageCount = this.pageCount || this.defaultPageCount;
      var activePage = this.activePage || this.defaultActivePage;

      this.pageSpan = NaN;
      this.pageCount = NaN;
      this.activePage = NaN;

      this.setProperties(pageCount, pageSpan);
      this.setActivePage(activePage, true);

      this.scrollbarDD = new DragDropElement({
        element: this.tmpl.scrollTrumb,
        handler: DRAGDROP_HANDLER,
        handlerContext: this
      });
    },

   /**
    * @param {number} pageCount
    * @param {number} pageSpan
    * @param {number} activePage
    */
    setProperties: function(pageCount, pageSpan, activePage){
      pageCount = pageCount || 1;
      pageSpan = Math.min(pageSpan || 10, pageCount);

      if (pageSpan != this.pageSpan)
      {
        this.pageSpan = pageSpan;
        this.setChildNodes(createArray(pageSpan, function(idx){
          return {
            pageNumber: idx
          };
        }));
      }

      if (this.pageCount != pageCount)
      {
        this.pageCount = pageCount;

        var rangeWidth = 1 / pageCount;
        var activePageMarkWidth = rangeWidth / (1 - rangeWidth);

        this.tmpl.activePageMark.style.width = percent(activePageMarkWidth);
        this.tmpl.activePageMarkWrapper.style.width = percent(1 - rangeWidth);

        this.event_pageCountChanged(this.pageCount);
      }

      // spanWidth : (1 - spanWidth)
      // scrollThumbWidth : 1
      // ---
      // scrollThumbWidth = spanWidth * 1 / (1 - spanWidth)

      var spanWidth = pageSpan / pageCount;
      var scrollTrumbWidth = spanWidth / (1 - spanWidth);

      this.tmpl.scrollTrumbWrapper.style.width = percent(1 - spanWidth);
      this.tmpl.scrollTrumb.style.width = percent(scrollTrumbWidth);

      this.setSpanStartPage(this.spanStartPage_);
      this.setActivePage(arguments.length == 3 ? activePage : this.activePage);
    },
    setActivePage: function(newActivePage, spotlightActivePage){
      newActivePage = newActivePage.fit(0, this.pageCount - 1);
      if (newActivePage != this.activePage)
      {
        this.activePage = Number(newActivePage);
        this.event_activePageChanged(newActivePage);
      }

      updateSelection(this);

      this.tmpl.activePageMark.style.left = percent(newActivePage / Math.max(this.pageCount - 1, 1));

      if (spotlightActivePage)
        this.spotlightPage(this.activePage);
    },
    spotlightPage: function(pageNumber){
      this.setSpanStartPage(pageNumber - Math.round(this.pageSpan / 2) + 1);
    },
    setSpanStartPage: function(pageNumber){
      pageNumber = pageNumber.fit(0, this.pageCount - this.pageSpan);
      if (pageNumber != this.spanStartPage_)
      {
        this.spanStartPage_ = pageNumber;

        for (var i = this.childNodes.length; i-- > 0;)
          this.childNodes[i].setPageNumber(pageNumber + i);

        updateSelection(this);
      }

      this.tmpl.scrollTrumb.style.left = percent((pageNumber / Math.max(this.pageCount - this.pageSpan, 1)).fit(0, 1));
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UINode.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Paginator: Paginator
  };
