/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 *
 * Inspired on Paginator 3000 (http://karaboz.ru/?p=12)
 */

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

  var createEvent = basis.event.create;
  var events = basis.event.events;

  var Box = basis.layout.Box;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var UIControl = basis.ui.Control;
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

    event_pageNumberChanged: createEvent('pageNumberChanged', 'node', 'oldPageNumber'),

    template:
      '<td class="Basis-PaginatorNode">' +
        '<span>' +
          '<a{link} class="{selected} {disabled}" event-click="click" href="#">{pageNumber}</a>' +
        '</span>' +
      '</td>',

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

        this.event_pageNumberChanged(this, oldPageNumber);
      }
    }
  });

  //
  // Paginator
  //

  var DRAGDROP_HANDLER = {
    start: function(config){
      this.initOffset = this.tmpl.scrollTrumb.offsetLeft;
    },
    move: function(config){
      var pos = ((this.initOffset + config.deltaX) / this.tmpl.scrollTrumbWrapper.offsetWidth).fit(0, 1);
      this.setSpanStartPage(Math.round(pos * (this.pageCount - this.pageSpan)));
      this.tmpl.scrollTrumb.style.left = percent(pos);
    },
    over: function(config){
      this.setSpanStartPage(this.spanStartPage_);
    }
  };

 /**
  * Paginator
  * @class
  */
  var Paginator = UIControl.subclass({
    className: namespace + '.Paginator',

    childClass: PaginatorNode,

    template:
    	'<div class="Basis-Paginator Basis-Paginator-{noScroll} {selected} {disabled}" event-mousewheel="scroll">' +
        '<table><tbody><tr{childNodesElement}/></tbody></table>' +
        '<div{scrollbarContainer} class="Basis-Paginator-ScrollbarContainer">' +
          '<div{scrollbar} class="Basis-Paginator-Scrollbar" event-click="jumpTo">' +
            '<div{activePageMarkWrapper}>' +
              '<div{activePageMark} class="Basis-Paginator-ActivePageMark"><div/></div>' +
            '</div>' +
            '<div{scrollTrumbWrapper}>' + 
              '<div{scrollTrumb} class="Basis-Paginator-ScrollbarSlider"><div{scrollTrumbElement}><span/></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
    	'</div>',

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

    init: function(config){
      UIControl.prototype.init.call(this, config);

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
        this.setChildNodes(Array.create(pageSpan, function(idx){
          return {
            pageNumber: idx
          }
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

        for (var i = this.childNodes.length; i --> 0;)
          this.childNodes[i].setPageNumber(pageNumber + i);

        updateSelection(this);
      }

      this.tmpl.scrollTrumb.style.left = percent((pageNumber / Math.max(this.pageCount - this.pageSpan, 1)).fit(0, 1));
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UIControl.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Paginator: Paginator
  };
