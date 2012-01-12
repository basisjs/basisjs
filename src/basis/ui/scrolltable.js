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

  var nsTable = basis.ui.table;


  //
  // main part
  //

  /* caculate scroll width */
  var SCROLLBAR_WIDTH = 17;
  Event.onLoad(function(){
    var tester = DOM.createElement('');
    DOM.setStyle(tester, { height: '100px', overflow: 'scroll' });
    DOM.insert(document.body, tester);
    SCROLLBAR_WIDTH = (new Box(tester)).width - (new Viewport(tester)).width;
    cssom.cssRule('.ScrollBarWidthOwner').setStyle({ width: SCROLLBAR_WIDTH + 'px' });
    DOM.remove(tester);
  });

  function createHeaderExpandCell(){
    return DOM.createElement('.Basis-ScrollTable-ExpandHeaderCell', DOM.createElement('.Basis-ScrollTable-ExpandCell-Content')); 
  }

  function createFooterExpandCell(){
    return DOM.createElement('.Basis-ScrollTable-ExpandFooterCell');
  }

 /**
  * @class
  */
  var ScrollTable = Class(Table, {
    className: namespace + '.ScrollTable',

    template:
      '<div{element} class="Basis-Table Basis-ScrollTable">' +
        '<div{headerFooterContainer} class="Basis-ScrollTable-HeaderFooterContainer">' +
          //'<div{headerFooterWrapper} style="position: absolute; height: 100%; width: 100%; top: 0; left: 0">' +
            '<table{head} cellspacing="0" border="0" class="Basis-ScrollTable-Header"><!-- {headerElement} --></table>' +
            '<table{foot} cellspacing="0" border="0" class="Basis-ScrollTable-Footer"></table>' +
          //'</div>' +
        '</div>' +
        '<div{scrollContainer} class="Basis-ScrollTable-ScrollContainer">' +
          '<div{tableWrapperElement} class="Basis-ScrollTable-TableWrapper">' +
            '<table{tableElement|groupsElement} class="Basis-Table" cellspacing="0">' +
              '<tbody{content|childNodesElement} class="Basis-Table-Body"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>',

    event_childNodesModified: function(node, delta){
      Table.prototype.event_childNodesModified.call(this, node, delta);
      TimeEventManager.add(this, 'adjust', Date.now());
    },
    /*event_childUpdated: function(child, delta){
      Table.prototype.event_childUpdated.call(this, child, delta);
      TimeEventManager.add(this, 'adjust', Date.now());
    },*/

    init: function(config){
      Table.prototype.init.call(this, config);

      //DOM.insert(this.tmpl.head, this.header.element);

      /*create header clone*/
      this.headerClone = new nsTable.Header(Object.extend({ 
        owner: this.header.owner,
        container: this.tmpl.tableElement, 
        structure: this.structure
      }, this.headerConfig));

      /*get header cells including groupCells*/
      this.originalCells = this.header.childNodes;
      if (this.header.groupControl)
        this.originalCells = this.originalCells.concat(this.header.groupControl.childNodes);

      /*get cloned header cells including groupCells*/
      this.clonedCells   = this.headerClone.childNodes;
      if (this.headerClone.groupControl)
        this.clonedCells = this.clonedCells.concat(this.headerClone.groupControl.childNodes);
        
      this.headerExpandCell = DOM.insert(this.element, createHeaderExpandCell());

      this.headerBox = new Box(this.header.element);

      if (this.footer.useFooter)
      {
        /*create footer clone*/
        DOM.insert(this.tmpl.foot, this.footer.element);
        this.footerClone = new nsTable.Footer(Object.extend({ 
          owner: this.footer.owner,
          container: this.tmpl.tableElement, 
          structure: this.structure 
        }, this.footerConfig));

        this.originalCells = this.originalCells.concat(this.footer.childNodes);
        this.clonedCells = this.clonedCells.concat(this.footerClone.childNodes)
        DOM.setStyle(this.footerClone.element, { visibility: 'hidden' });

        //this.footer.expandCell = DOM.insert(this.footer.childNodesElement, createFooterExpandCell());
        
        this.footerBox = new Box(this.footer.element);

        this.footerExpandCell = DOM.insert(this.element, createFooterExpandCell());
      }

      this.cellsAdjustmentInfo = [];

      for (var i = 0, originalCell, clonedCell; originalCell = this.originalCells[i]; i++)
      {
        clonedCell = this.clonedCells[i]; 
        this.cellsAdjustmentInfo.push({
          element: clonedCell.element,
          boxChangeListener: originalCell.element,
          contentSource: originalCell.content,
          contentDestination: clonedCell.content
        });
      }

      this.tableBox = new Box(this.tmpl.tableElement);
      this.lastScrollLeftPosition = 0;

      Event.addHandler(this.tmpl.scrollContainer, 'scroll', this.onScroll.bind(this));
      Event.addHandler(window, 'resize', this.adjust.bind(this));

      this.sync();
      TimeEventManager.add(this, 'adjust', Date.now());
    },
    onScroll: function(event){
      var scrollLeft = this.tmpl.scrollContainer.scrollLeft;
      if (scrollLeft != this.lastScrollLeftPosition) 
      {
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'left', -scrollLeft + 'px');
        this.lastScrollLeftPosition = scrollLeft;
      }
    },
    adjust: function(event){
      this.onScroll();

      /*recalc table width*/
      this.tableBox.recalc();
      var tableWidth = this.tableBox.width || 0;

      if (this.tmpl.tableWrapperElement.scrollWidth > this.tmpl.scrollContainer.clientWidth)
      {
        DOM.setStyleProperty(this.tmpl.tableWrapperElement, 'width',  tableWidth + 'px');
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'width', tableWidth + SCROLLBAR_WIDTH + 'px');
      }
      else
      {
        DOM.setStyleProperty(this.tmpl.tableWrapperElement, 'width', '100%');
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'width', '100%');
      }

      /*adjust cells width*/
      this.cellsAdjustmentInfo.forEach(this.adjustCell);
      /*recalc expanderCell width*/
      var freeSpaceWidth = Math.max(0, this.tmpl.tableWrapperElement.clientWidth - this.tmpl.tableElement.offsetWidth + SCROLLBAR_WIDTH);

      /*recalc header heights*/
      this.headerBox.recalc();
      var headerHeight = this.headerBox.height || 0;

      cssom.setStyleProperty(this.element, 'paddingTop', headerHeight + 'px');
      cssom.setStyleProperty(this.tmpl.tableElement, 'marginTop', -headerHeight + 'px');
      cssom.setStyle(this.headerExpandCell, { width: freeSpaceWidth + 'px', height: headerHeight + 'px' });

      /*recalc footer heights*/
      if (this.footer.useFooter)
      {
        this.footerBox.recalc();
        var footerHeight = this.footerBox.height || 0;

        cssom.setStyleProperty(this.element, 'paddingBottom', footerHeight + 'px');
        cssom.setStyleProperty(this.tmpl.tableElement, 'marginBottom', -footerHeight + 'px');

        cssom.setStyle(this.footerExpandCell, { width: freeSpaceWidth + 'px', height: footerHeight + 'px' });
      }
    },
    sync: function(cellNumber){
      /*this.cellsAdjustmentInfo.forEach(function(cell){
        DOM.insert(DOM.clear(cell.contentDestination), DOM.axis(cell.contentSource, DOM.AXIS_CHILD).map(DOM.clone));
      });*/
      this.adjust();
    },
    adjustCell: function(cell){
      var width;

      if (document.defaultView && document.defaultView.getComputedStyle)
        width = document.defaultView.getComputedStyle(cell.element, null).width;
      else
        width = cell.element.clientWidth + 'px';

      cssom.setStyleProperty(cell.boxChangeListener, 'width', width);
    }
  });

  //
  // export names
  //

  basis.namespace(namespace).extend({
    ScrollTable: ScrollTable
  });
 
}(basis);
