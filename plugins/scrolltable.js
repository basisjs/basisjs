(function(){

 /**
  * @namespace Basis.Controls.Table
  */

  var namespace = 'Basis.Controls.Table';

  // import names

  var Class = Basis.Class;
  var Event = Basis.Event;
  var DOM = Basis.DOM;
  var Template = Basis.Html.Template;

  var nsTable = Basis.Controls.Table;
  var nsWrappers = Basis.DOM.Wrapper;

  var Box = Basis.Layout.Box;
  var Viewport = Basis.Layout.Viewport;

  var TimeEventManager = Basis.TimeEventManager;

  /* caculate scroll width */
  var ScrollBarWidth = 17;
  Event.onLoad(function(){
    var tester = DOM.createElement('');
    DOM.setStyle(tester, { height: '100px', overflow: 'scroll' });
    DOM.insert(document.body, tester);
    ScrollBarWidth = (new Box(tester)).width - (new Viewport(tester)).width;
    Basis.DOM.Style.cssRule('.ScrollBarWidthOwner').setStyle({ width: ScrollBarWidth + 'px' });
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
  var ScrollTable = Class(nsTable.Table, {
    className: namespace + '.ScrollTable',

    template: new Template(
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
      '</div>'
    ),

    event_childNodesModified: function(node, delta){
      nsTable.Table.prototype.event_childNodesModified.call(this, node, delta);
      TimeEventManager.add(this, 'adjust', Date.now());
    },
    event_childUpdated: function(child, delta){
      nsTable.Table.prototype.event_childUpdated.call(this, child, delta);
      TimeEventManager.add(this, 'adjust', Date.now());
    },

    init: function(config){
      nsTable.Table.prototype.init.call(this, config);

      //DOM.insert(this.tmpl.head, this.header.element);

      /*create header clone*/
      this.headerClone = new nsTable.Header(Object.extend({ container: this.tmpl.tableElement, structure: this.structure }, this.headerConfig));

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
        this.footerClone = new nsTable.Footer(Object.extend({ container: this.tmpl.tableElement, structure: this.structure }, this.footerConfig));

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
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'width', tableWidth + ScrollBarWidth + 'px');
      }
      else
      {
        DOM.setStyleProperty(this.tmpl.tableWrapperElement, 'width', '100%');
        DOM.setStyleProperty(this.tmpl.headerFooterContainer, 'width', '100%');
      }

      /*adjust cells width*/
      this.cellsAdjustmentInfo.forEach(this.adjustCell);
      /*recalc expanderCell width*/
      var freeSpaceWidth = Math.max(0, this.tmpl.tableWrapperElement.clientWidth - this.tmpl.tableElement.offsetWidth + ScrollBarWidth);

      /*recalc header heights*/
      this.headerBox.recalc();
      var headerHeight = this.headerBox.height || 0;

      DOM.setStyleProperty(this.element, 'paddingTop', headerHeight + 'px');
      DOM.setStyleProperty(this.tmpl.tableElement, 'marginTop', -headerHeight + 'px');
      DOM.setStyle(this.headerExpandCell, { width: freeSpaceWidth + 'px', height: headerHeight + 'px' });

      /*recalc footer heights*/
      if (this.footer.useFooter)
      {
        this.footerBox.recalc();
        var footerHeight = this.footerBox.height || 0;

        DOM.setStyleProperty(this.element, 'paddingBottom', footerHeight + 'px');
        DOM.setStyleProperty(this.tmpl.tableElement, 'marginBottom', -footerHeight + 'px');

        DOM.setStyle(this.footerExpandCell, { width: freeSpaceWidth + 'px', height: footerHeight + 'px' });
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

      DOM.setStyleProperty(cell.boxChangeListener, 'width', width);
    }
  });

  // export names

  Basis.namespace(namespace).extend({
    ScrollTable: ScrollTable
  });
 
})();
