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
 * Basis adaptation by Roman Dvornov
 */

(function(Basis){

  // namespace
  
  var namespace = 'Basis.Plugin';

  // import names

  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;

  var Template = Basis.Html.Template;

  var cssClass = Basis.CSS.cssClass;

  var nsWrappers = Basis.DOM.Wrapper;

  //
  // main part
  //

  function percent(value){
    return (100 * value).toFixed(4) + '%';
  }

 /**
  * Base child node class for Paginator
  * @class
  */
  var PaginatorNode = Class(nsWrappers.HtmlNode, {
    className: namespace + '.PaginatorNode',

    template: new Template(
      '<td{element} class="Basis-PaginatorNode">' +
        '<span>' +
          '<a{link|selectedElement} href="#">{pageNumber}</a>' +
        '</span>' +
      '</td>'
    ),

    behaviour: nsWrappers.createBehaviour(nsWrappers.HtmlNode, {
      update: function(object, delta){
        this.inherit(object, delta);

        this.pageNumber.nodeValue = this.info.pageNumber + 1;
        this.link.href = this.urlGetter(this.info.pageNumber);
      }
    }),

    urlGetter: Function.$self
  });

 /**
  * Paginator
  * @class
  */
  var Paginator = Class(nsWrappers.Control, {
    className: namespace + '.Paginator',

    childClass: PaginatorNode,

    template: new Template(
    	'<table{element} class="Basis-Paginator">' +
    	  '<tbody>' +
          '<tr{childNodesElement}></tr>' +
          '<tr{scrollbarContainer}>' +
            '<td colspan{spanAttr}="1">' +
              '<div{scrollbar} class="Basis-Paginator-Scrollbar">' +
                '<div{activePageMark} class="ActivePage"></div>' +
                '<div{scrollTrumb} class="Slider"><span/></div>' +
              '</div>' +
            '</td>' +
          '</tr>' +
        '</tbody>' +
    	'</table>'
    ),

    behaviour: nsWrappers.createBehaviour(nsWrappers.Control, {
      click: function(event, node){
        if (node)
          this.setActivePage(node.info.pageNumber);
        else
        {
          var sender = Event.sender(event);
          if (sender == this.scrollbar)
          {
            var pos = ((Event.mouseX(event) - (new Basis.Layout.Box(sender)).left) - this.scrollTrumb.offsetWidth/2)/sender.offsetWidth;
            this.scrollTrumb.style.left = percent(pos);
            this.setSpanStartPage(Math.round(pos/this.pageWidth_), true);
          }
        }
        Event.kill(event);
      },
      childNodesModified: function(){
        this.spanAttr.nodeValue = this.childNodes.length;
      },
      activePageChanged: function(){
        this.updateSelection();
      }
    }),

    pageSpan_: 0,
    pageCount_: 0,
    activePage_: 0,
    spanStartPage_: -1,
    pageWidth_: 0,

    init: function(config){
      config = this.inherit(config);

      this.setProperties(config.pageCount || 0, config.pageSpan);
      this.setActivePage((config.activePage || 1) - 1, true);

      this.scrollbarDD = new Basis.DragDrop.DragDropElement({
        element: this.scrollTrumb,
        //axisY: false,
        //baseElement: this.scrollbar,
        handlersContext: this,
        handlers: {
          start: function(){
            this.ddPos = this.scrollTrumb.offsetLeft;
          },
          move: function(cfg){
            var pos = ((this.ddPos + cfg.deltaX)/this.scrollTrumb.offsetParent.offsetWidth).fit(0, 1 - parseInt(this.scrollTrumb.style.width)/100);
            this.scrollTrumb.style.left = percent(pos);
            this.setSpanStartPage(Math.round(pos/this.pageWidth_), true);
          }
        }
      });

      this.addEventListener('click');

      return config;
    },

    setProperties: function(pageCount, pageSpan, activePage){
      pageSpan = Math.min(pageSpan || 10, pageCount);

      if (pageSpan != this.pageSpan_)
      {
        this.pageSpan_ = pageSpan;
        this.setChildNodes(Array.create(pageSpan, function(idx){
          return {
            info: {
              pageNumber: idx
            }
          }
        }));
      }

      this.pageWidth_ = 1/(pageCount || 1);

      if (this.pageCount_ != pageCount)
      {
        this.pageCount_ = pageCount;

        this.activePageMark.style.width = percent(this.pageWidth_);
        //this.activePageMark.style.marginLeft = '-{0:.4}%'.format(width/2);

        this.dispatch('pageCountChanged', this.pageCount_);
      }

      this.scrollTrumb.style.width = percent(pageSpan/(pageCount || 1));
      DOM.display(this.scrollbarContainer, pageSpan < pageCount);

      this.setSpanStartPage(this.spanStartPage_);
      this.setActivePage(arguments.length == 3 ? activePage : this.activePage_);
    },
    setActivePage: function(newActivePage, spotlightActivePage){
      newActivePage = newActivePage.fit(0, this.pageCount_ - 1);
      if (newActivePage != this.activePage_)
      {
        this.activePage_ = Number(newActivePage);

        this.dispatch('activePageChanged', newActivePage);
      }

      this.activePageMark.style.left = percent(newActivePage * this.pageWidth_);

      if (spotlightActivePage)
        this.setSpanStartPage(this.activePage_ - Math.round(this.pageSpan_/2) + 1);
    },
    setSpanStartPage: function(pageNumber, noUpdateSlider){
      pageNumber = pageNumber.fit(0, this.pageCount_ - this.pageSpan_);
      if (pageNumber != this.spanStartPage_)
      {
        this.spanStartPage_ = pageNumber;

        for (var i = 0, node; node = this.childNodes[i]; i++)
          node.update({ pageNumber: pageNumber + i });

        this.updateSelection();
      }

      if (!noUpdateSlider)
        this.scrollTrumb.style.left = percent(pageNumber/(this.pageCount_ || 1));
    },
    updateSelection: function(){
      var selectedIndex = this.childNodes.binarySearch(this.activePage_, 'info.pageNumber');
      if (selectedIndex != -1)
        this.childNodes[selectedIndex].select();
      else
        this.selection.clear();
    },

    destroy: function(){
      this.scrollbarDD.destroy();
      delete this.scrollbarDD;

      this.inherit();
    }
  });

  // export names

  Basis.namespace(namespace).extend({
    Paginator: Paginator
  });

})(Basis);
