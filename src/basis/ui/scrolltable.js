/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

basis.require('basis.timer');
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.layout');
basis.require('basis.ui.table');

!function(basis){

//  'use strict';

 /**
  * @namespace basis.ui.scrolltable
  */

  var namespace = 'basis.ui.scrolltable';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var cssom = basis.cssom;
  var TimeEventManager = basis.timer.TimeEventManager;
  var Table = basis.ui.table.Table;
  var Box = basis.layout.Box;
  var Viewport = basis.layout.Viewport;
  var layout = basis.layout;

  var nsTable = basis.ui.table;


  //
  // main part
  //

  /* caculate scroll width */
  var SCROLLBAR_WIDTH = 17;
  Event.onLoad(function(){
    var tester = DOM.createElement('');
    cssom.setStyle(tester, { height: '100px', overflow: 'scroll' });
    DOM.insert(document.body, tester);
    SCROLLBAR_WIDTH = (new Box(tester)).width - (new Viewport(tester)).width;
    DOM.remove(tester);
  });

  function createFooterExpandCell(){
    return DOM.createElement('.Basis-ScrollTable-ExpandFooterCell');
  }

  function adjustCell(cell){
    var width;

    if (document.defaultView && document.defaultView.getComputedStyle)
      width = document.defaultView.getComputedStyle(cell.element, null).width;
    else
      width = cell.element.clientWidth + 'px';

    cssom.setStyleProperty(cell.boxChangeListener, 'width', width);
  }

//  var mhtml = '<td style="padding:0;margin:0;border:0;width:auto;height:auto"><div style="border:0;margin:0;padding:0;width:auto;height:auto;position:relative;"><iframe style="border:0;margin:0;padding:0;width:100%;position:absolute;visibility:hidden" event-load="log"></iframe></div></td>';
//  var measureCell = DOM.createElement('tr');
//  measureCell.innerHTML = mhtml;
//  measureCell = measureCell.firstChild;

  var measureCell = DOM.createElement('td[style="padding:0;margin:0;border:0;width:auto;height:auto"]',
                      DOM.createElement('[style="padding:0;margin:0;border:0;width:auto;position:relative;"]',
                        DOM.createElement('IFRAME[style="border:0;margin:0;padding:0;width:100%;position:absolute;visibility:hidden"][event-load="log"]')
                      )
                    );

  var expanderCell = DOM.createElement('td[style="padding:0;margin:0;border:0;width:auto;height:auto"]', DOM.createElement('[style="border:0;margin:0;padding:0;width:auto;position:relative;"]'));

  //var src = DOM.createElement('style');
  //src.innerHTML = 'alert(123)';
  //console.log(src.outerHTML);


 /**
  * @class
  */
  var srcReplaced = false;
  var ScrollTable = Class(Table, {
    className: namespace + '.ScrollTable',

    scrollLeft_: 0,

    template:
      '<div{element} class="Basis-Table Basis-ScrollTable">' +
        //'<frame event-load="fireRecalc" src="about:blank" event-load="log"/>' +
        '<div class="Basis-ScrollTable-Header-Container">' +
          '<table{head|headerScroll} class="Basis-ScrollTable-Header"><!--{header}--><!--{headerExpanders}--></table>' +
          '<div{headerExpandCell} style="overflow: visible;" class="Basis-ScrollTable-ExpandHeaderCell">' +
            '<div class="Basis-ScrollTable-ExpandHeaderCell-B1">' +
              '<div class="Basis-ScrollTable-ExpandHeaderCell-B2"/>' +
            '</div>' +
          '</div>'+
        '</div>' +
        '<div{scrollContainer} class="Basis-ScrollTable-ScrollContainer" event-scroll="scroll">' +
          '<div{xx|tableWrapperElement} class="Basis-ScrollTable-TableWrapper" style="float: left; position: relative">' +
            '<table{tableElement|groupsElement} cellspacing="0">' +
              '<!--{shadowHeader}-->' +
              '<!--{measureRow}-->' +
              '<tbody{content|childNodesElement} class="Basis-Table-Body"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<div{headerFooterContainer} class="Basis-ScrollTable-Footer-Container">' +
          '<table{foot|footerScroll} class="Basis-ScrollTable-Footer"><!--{footer}--><!--{footerExpanders}--></table>' +
          '<div{footerExpandCell} style="overflow: visible;" class="Basis-ScrollTable-ExpandFooterCell">' +
            '<div class="Basis-ScrollTable-ExpandFooterCell-B1">' +
              '<div class="Basis-ScrollTable-ExpandFooterCell-B2"/>' +
            '</div>' +
          '</div>'+
        '</div>' +
      '</div>',

    action: {
      fireRecalc: function(event){
        this.requestRelayout('fireRecalc');
      },
      scroll: function(){
        this.onScroll();
      },
      log: function(event){
        console.log('event:', event.type);

        var sender = basis.dom.event.sender(event);
        var self = this;
        if (event.type == 'load')
        {
          sender.contentWindow.onresize = function(){
            console.log('iframe resize');
            self.requestRelayout('onresize')
          }
        }
        this.requestRelayout('onload');
      }
    },

    headerClass: {
      listen: {
        childNode: {
          '*': function(event){
            if (this.owner)
              this.owner.requestRelayout('header.ChildNode ' + event.type);
          }
        }
      }
    },

    init: function(config){
      Table.prototype.init.call(this, config);

      this.requestRelayout = this.requestRelayout.bind(this);
      this.genericRule = cssom.uniqueRule(this.element);
      //this.element.appendChild(DOM.createElement('STYLE', '.' + this.genericRule.token + '{border: 5px solid red !important}'));

      //DOM.insert(this.tmpl.head, this.header.element);

      var header = this.header;
      var footer = this.footer;

      header.addHandler({
        '*': function(){
          //console.log('adjust');
          this.requestRelayout('header ' + event.type);
        }
      }, this);

      DOM.replace(this.tmpl.measureRow,
        this.tmpl.measureRow = DOM.createElement('tbody',
          DOM.createElement('tr',
            Array.create(this.columnCount, function(){
              return measureCell.cloneNode(true);
            })
          )
        )
      );

      var expanders = DOM.createElement('tbody',
        DOM.createElement('tr',
          Array.create(this.columnCount, function(){
            return expanderCell.cloneNode(true);
          })
        )
      );
      DOM.replace(this.tmpl.headerExpanders, expanders);
      this.tmpl.headerExpanders = expanders.firstChild;

      this.headerBox = new Box(this.tmpl.head);

      if (footer.useFooter)
      {
        /*create footer clone*/
        DOM.insert(this.tmpl.foot, footer.element);
        this.footerClone = new nsTable.Footer(Object.extend({ 
          owner: footer.owner,
          container: this.tmpl.tableElement, 
          structure: this.structure 
        }, this.footerConfig));

        
        DOM.replace(this.tmpl.footerExpanders, expanders = expanders.cloneNode(true));
        this.tmpl.footerExpanders = expanders.firstChild;

        cssom.setStyle(this.footerClone.element, { visibility: 'hidden' });

        this.footerBox = new Box(footer.element);
      }

      this.tableBox = new Box(this.tmpl.tableElement);

      var self = this;
      layout.addBlockResizeHandler(this.tmpl.xx, function(){
        self.requestRelayout('xx resize')
      });

      //Event.addHandler(this.tmpl.scrollContainer, 'scroll', this.onScroll.bind(this));
      Event.addHandler(window, 'resize', this.adjust.bind(this));
      setTimeout(function(){
        self.requestRelayout('timer')
      },1);
    },
    onScroll: function(event){
      var scrollLeft = this.tmpl.scrollContainer.scrollLeft;
      if (this.scrollLeft_ != scrollLeft)
      {
        this.scrollLeft_ = scrollLeft;
        cssom.setStyleProperty(this.tmpl.headerScroll, 'left', -scrollLeft + 'px');
        cssom.setStyleProperty(this.tmpl.footerScroll, 'left', -scrollLeft + 'px');
      }
    },
    requestRelayout: function(name){
      console.log('request:', name);
      DOM.get('eventlog').value = (new Date).toFormat('%H:%M:%I.%S') + ' request: ' + name + '\n' + DOM.get('eventlog').value;
      if (!this.timer_)
        this.timer_ = setTimeout(this.adjust.bind(this), 0);
    },
    adjust: function(event){
      console.log('adjust');
      this.timer_ = clearTimeout(this.timer_);
      this.onScroll();

      var measureRow = this.tmpl.measureRow.firstChild.childNodes;
      for (var i = 0; i < this.columnCount; i++)
      {
        var cell = measureRow[i].firstChild;
        var w = cell.offsetWidth;

        this.tmpl.headerExpanders.childNodes[i].firstChild.style.width = w + 'px';
        if (this.tmpl.footerExpanders)
          this.tmpl.footerExpanders.childNodes[i].firstChild.style.width = w + 'px';
      }

      var headerClone = this.header.element.cloneNode(true)
      var headerOuterHTML = DOM.createElement('', headerClone).innerHTML;
      var yy;

      if (this.headerHtml_ != headerOuterHTML)
      {
        console.log('update header');
        this.headerHtml_ = headerOuterHTML;
        DOM.replace(this.tmpl.shadowHeader, headerClone);
        this.tmpl.shadowHeader = headerClone;
      }

      /*recalc table width*/
      this.tableBox.recalc();
      var tableWidth = this.tableBox.width || 0;

      var exp = this.tmpl.headerExpandCell;
      exp.style.left = tableWidth + 'px';

      /*recalc header heights*/
      this.headerBox.recalc();
      var headerHeight = this.headerBox.height || 0;
      var footerHeight = 0;

      cssom.setStyleProperty(this.tmpl.tableElement, 'marginTop', -headerHeight + 'px');

      /*recalc footer heights*/
      if (this.footerClone)
      {
        this.footerBox.recalc();
        footerHeight = this.footerBox.height;

        cssom.setStyleProperty(this.tmpl.tableElement, 'marginBottom', -footerHeight + 'px');

        this.tmpl.footerExpandCell.style.left = tableWidth + 'px';
      }

      cssom.setStyleProperty(this.element, 'paddingBottom', (headerHeight + footerHeight) + 'px');
    },
    destroy: function(){
      this.timer_ = clearTimeout(this.timer_);

      Table.prototype.destroy.call(this);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    ScrollTable: ScrollTable
  });
 
}(basis);
