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
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 *
 * Inspired on Paginator 3000 (http://karaboz.ru/?p=12)
 */

basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.dragdrop');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.paginator
  */ 
  

  var namespace = 'basis.ui.paginator';

  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var createEvent = basis.EventObject.createEvent;
  var classList = basis.cssom.classList;

  var Box = basis.layout.Box;
  var DragDropElement = basis.dragdrop.DragDropElement;
  var UIControl = basis.ui.Control;
  var UINode = basis.ui.Node;


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
  var PaginatorNode = UINode.subclass({
    className: namespace + '.PaginatorNode',

    pageGetter: Function.getter('data.pageNumber'),
    urlGetter: Function.$self,

    template:
      '<td{element} class="Basis-PaginatorNode">' +
        '<span>' +
          '<a{link|selected} event-click="click" href="#">{pageNumber}</a>' +
        '</span>' +
      '</td>',

    templateUpdate: function(tmpl, event, delta){
      var page = this.pageGetter(this);

      tmpl.pageNumber.nodeValue = page + 1;
      tmpl.link.href = this.urlGetter(page);
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
        this.parentNode.setActivePage(this.pageGetter(this));
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
  var Paginator = UIControl.subclass({
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
        var pos = (Event.mouseX(event) - (new Box(scrollbar)).left) / scrollbar.offsetWidth;
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
      UIControl.prototype.init.call(this, config);

      this.setProperties(config.pageCount || 0, config.pageSpan);
      this.setActivePage(Math.max(config.activePage - 1, 0), true);

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
      this.setSpanStartPage(pageNumber - Math.round(this.pageSpan_ / 2) + 1);
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

      this.tmpl.scrollTrumb.style.left = percent((pageNumber / Math.max(this.pageCount_ - this.pageSpan_, 1)).fit(0, 1));
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      this.scrollbarDD = null;

      UIControl.prototype.destroy.call(this);
    }
  });

  // export names

  basis.namespace(namespace).extend({
    Paginator: Paginator
  });

}(basis);
