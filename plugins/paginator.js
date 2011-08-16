/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * Inspired on Paginator 3000
 * - idea by ecto (ecto.ru)
 * - coded by karaboz (karaboz.ru)
 *
 * Basis.js adaptation by Roman Dvornov
 */

(function(Basis){

  'strict mode';

 /**
  * @namespace Basis.Plugin
  */ 
  
  var namespace = 'Basis.Plugin';

  // import names

  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;

  var createEvent = Basis.EventObject.createEvent;
  var classList = Basis.CSS.classList;

  var nsWrapper = Basis.DOM.Wrapper;

  //
  // main part
  //

  function percent(value){
    return (100 * value).toFixed(4) + '%';
  }

  function updateSelection(paginator){
    var node = paginator.childNodes.search(paginator.activePage_, 'data.pageNumber');
    if (node)
      node.select();
    else
      paginator.selection.clear();
  }

 /**
  * Base child node class for Paginator
  * @class
  */
  var PaginatorNode = nsWrapper.TmplNode.subclass({
    className: namespace + '.PaginatorNode',

    pageGetter: Function.getter('data.pageNumber'),
    urlGetter: Function.$self,

    template:
      '<td{element} class="Basis-PaginatorNode">' +
        '<span>' +
          '<a{link|selected} event-click="click" href="#">{pageNumber}</a>' +
        '</span>' +
      '</td>',

    action: {
      click: function(event){
        Event.kill(event);
        if (!this.isDisabled())
          this.click();
      }
    },

    click: function(){
      if (this.parentNode)
        this.parentNode.setActivePage(this.pageGetter(this));
    },

    event_update: function(object, delta){
      nsWrapper.TmplNode.prototype.event_update.call(this, object, delta);

      var page = this.pageGetter(this);
      this.tmpl.pageNumber.nodeValue = page + 1;
      this.tmpl.link.href = this.urlGetter(page);
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
      var pos = ((this.initOffset + config.deltaX)/this.tmpl.scrollTrumbWrapper.offsetWidth).fit(0, 1);
      this.setSpanStartPage(Math.round(pos * (this.pageCount_ - this.pageSpan_)));
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
  var Paginator = nsWrapper.Control.subclass({
    className: namespace + '.Paginator',

    childClass: PaginatorNode,

    template:
    	'<div{element} class="Basis-Paginator" event-mousewheel="scroll">' +
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

    action: {
      jumpTo: function(actionName, event, node){
        var scrollbar = this.tmpl.scrollbar;
        var pos = (Event.mouseX(event) - (new Basis.Layout.Box(scrollbar)).left) / scrollbar.offsetWidth;
        this.setSpanStartPage(Math.floor(pos * this.pageCount_) - Math.floor(this.pageSpan_ / 2));
      },
      scroll: function(event){
        var delta = Event.wheelDelta(event);
        if (delta)
          this.setSpanStartPage(this.spanStartPage_ + delta);
      }
    },

    event_activePageChanged: createEvent('activePageChanged'),
    event_pageCountChanged: createEvent('pageCountChanged'),

    pageSpan_: 0,
    pageCount_: 0,
    activePage_: 0,
    spanStartPage_: -1,

    init: function(config){
      nsWrapper.Control.prototype.init.call(this, config);

      this.setProperties(config.pageCount || 0, config.pageSpan);
      this.setActivePage(Math.max(config.activePage - 1, 0), true);

      this.scrollbarDD = new Basis.DragDrop.DragDropElement({
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

      if (pageSpan != this.pageSpan_)
      {
        this.pageSpan_ = pageSpan;
        this.setChildNodes(Array.create(pageSpan, function(idx){
          return {
            data: {
              pageNumber: idx
            }
          }
        }));
      }

      if (this.pageCount_ != pageCount)
      {
        this.pageCount_ = pageCount;

        var rangeWidth = 1 / pageCount;
        var activePageMarkWidth = rangeWidth / (1 - rangeWidth);

        this.tmpl.activePageMark.style.width = percent(activePageMarkWidth);
        this.tmpl.activePageMarkWrapper.style.width = percent(1 - rangeWidth);

        this.event_pageCountChanged(this.pageCount_);
      }

      // spanWidth : (1 - spanWidth)
      // scrollThumbWidth : 1
      // ---
      // scrollThumbWidth = spanWidth * 1 / (1 - spanWidth)

      var spanWidth = pageSpan / pageCount;
      var scrollTrumbWidth = spanWidth / (1 - spanWidth);

      this.tmpl.scrollTrumbWrapper.style.width = percent(1 - spanWidth);
      this.tmpl.scrollTrumb.style.width = percent(scrollTrumbWidth);

      classList(this.element).bool('Basis-Paginator-WithNoScroll', pageSpan >= pageCount);

      this.setSpanStartPage(this.spanStartPage_);
      this.setActivePage(arguments.length == 3 ? activePage : this.activePage_);
    },
    setActivePage: function(newActivePage, spotlightActivePage){
      newActivePage = newActivePage.fit(0, this.pageCount_ - 1);
      if (newActivePage != this.activePage_)
      {
        this.activePage_ = Number(newActivePage);
        updateSelection(this);
        this.event_activePageChanged(newActivePage);
      }

      this.tmpl.activePageMark.style.left = percent(newActivePage / Math.max(this.pageCount_ - 1, 1));

      if (spotlightActivePage)
        this.spotlightPage(this.activePage_);
    },
    spotlightPage: function(pageNumber){
      this.setSpanStartPage(pageNumber - Math.round(this.pageSpan_/2) + 1);
    },
    setSpanStartPage: function(pageNumber){
      pageNumber = pageNumber.fit(0, this.pageCount_ - this.pageSpan_);
      if (pageNumber != this.spanStartPage_)
      {
        this.spanStartPage_ = pageNumber;

        for (var i = this.childNodes.length; i --> 0;)
          this.childNodes[i].update({ pageNumber: pageNumber + i });

        updateSelection(this);
      }

      this.tmpl.scrollTrumb.style.left = percent((pageNumber/Math.max(this.pageCount_ - this.pageSpan_, 1)).fit(0, 1));
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      nsWrapper.Control.prototype.destroy.call(this);
    }
  });

  // export names

  Basis.namespace(namespace).extend({
    Paginator: Paginator
  });

})(Basis);
