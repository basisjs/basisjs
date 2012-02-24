/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.dom.wrapper');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * Table namespace
  *
  * @see ./test/speed-table.html
  * @see ./demo/common/match.html
  * @see ./demo/common/grouping.html
  *
  * @namespace basis.ui.table
  */

  var namespace = 'basis.ui.table';


  //
  // import names
  //

  var Class = basis.Class;
  var Event = basis.dom.event;
  var DOM = basis.dom;

  var getter = Function.getter;
  var nullGetter = Function.nullGetter;
  var extend = Object.extend;
  var classList = basis.cssom.classList;

  var nsData = basis.data;

  var nsWrapper = basis.dom.wrapper;
  var GroupingNode = nsWrapper.GroupingNode;
  var PartitionNode = nsWrapper.PartitionNode;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // Table header
  //

  var HEADERCELL_CSS_SORTABLE = 'Basis-Table-Header-SortableCell';
  var HEADERCELL_CSS_SORTDESC = 'sort-order-desc';

 /**
  * @class
  */
  var HeaderPartitionNode = Class(UINode, {
    className: namespace + '.HeaderPartitionNode',

    template: 
      '<th class="Basis-Table-Header-Cell {selected} {disabled}">' +
        '<div class="Basis-Table-Sort-Direction"/>' +
        '<div class="Basis-Table-Header-Cell-Content">' + 
          '<span{content} class="Basis-Table-Header-Cell-Title">{titleText}</span>' +
        '</div>' +
      '</th>',

    titleGetter: getter('data.title'),

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.titleText.nodeValue = this.titleGetter(this);
    }
  });

 /**
  * @class
  */
  var HeaderGroupingNode = Class(GroupingNode, {
    className: namespace + '.HeaderGroupingNode',
    event_ownerChanged: function(node, oldOwner){
      if (oldOwner)
        DOM.remove(this.headerRow);

      if (this.owner && this.owner.element)
      {
        var cursor = this;
        var element = this.owner.element;
        do
        {
          DOM.insert(element, cursor.headerRow, DOM.INSERT_BEGIN);
        } while (cursor = cursor.grouping);
      }
      
      GroupingNode.prototype.event_ownerChanged.call(this, node, oldOwner);
    },

   /**
    * @inheritDoc
    */
    childClass: {
      className: namespace + '.HeaderPartitionNode',
      init: function(config){
        PartitionNode.prototype.init.call(this, config);
        this.cell = new HeaderPartitionNode({
          delegate: this
        });
      },
      event_childNodesModified: function(object, delta){
        var colSpan = 0;
        if (this.nodes[0] && this.nodes[0] instanceof this.constructor)
        {
          for (var i = 0, node; node = this.nodes[i]; i++)
            colSpan += node.cell.element.colSpan;
        }
        else
          colSpan = this.nodes.length;

        this.cell.element.colSpan = colSpan;

        if (this.groupNode)
          this.groupNode.event_childNodesModified.call(this.groupNode, this.groupNode, {});

        PartitionNode.prototype.event_childNodesModified.call(this, object, delta);
      },
      destroy: function(){
        PartitionNode.prototype.destroy.call(this);
        
        this.cell.destroy();
      }
    },

   /**
    * @inheritDoc
    */
    groupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    init: function(config){
      GroupingNode.prototype.init.call(this, config);
      this.element = this.childNodesElement = this.headerRow = DOM.createElement('tr.Basis-Table-Header-GroupContent');
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      newChild = GroupingNode.prototype.insertBefore.call(this, newChild, refChild);

      var refElement = newChild.nextSibling && newChild.nextSibling.cell.element;
      DOM.insert(this.headerRow, newChild.cell.element, DOM.INSERT_BEFORE, refElement);

      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      DOM.remove(oldChild.cell.element);
      GroupingNode.prototype.removeChild.call(oldChild);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      GroupingNode.prototype.destroy.call(this);
      this.headerRow = null;
    }
  });

 /**
  * @class
  */
  var HeaderCell = Class(UINode, {
    className: namespace + '.HeaderCell',

    colSorting: null,
    defaultOrder: false,
    groupId: 0,

    template:
      '<th class="Basis-Table-Header-Cell {selected} {disabled}" event-click="sort">' +
        '<div class="Basis-Table-Sort-Direction"/>' +
        '<div class="Basis-Table-Header-Cell-Content">' + 
          '<span{content} class="Basis-Table-Header-Cell-Title"/>' +
        '</div>' +
      '</th>',

    action: {
      sort: function(event){
        if (this.selected)
        {
          var owner = this.parentNode && this.parentNode.owner;
          if (owner)
            owner.setSorting(owner.sorting, !owner.sortingDesc);
        }
        else
          this.select();         
      }
    },

   /**
    * @inheritDoc
    */
    init: function(config){
      UINode.prototype.init.call(this, config);

      this.selectable = !!this.colSorting;

      if (this.colSorting)
      {
        //this.colSorting = getter(this.colSorting);
        this.defaultOrder = this.defaultOrder == 'desc';
        classList(this.element).add(HEADERCELL_CSS_SORTABLE);
      }
    },

   /**
    * @inheritDoc
    */
    select: function(){
      if (!this.selected)
        this.order = this.defaultOrder;

      UINode.prototype.select.call(this);
    }
  });


 /**
  * @class
  */
  var Header = Class(UIContainer, {
    className: namespace + '.Header',

    childClass: HeaderCell,

    groupingClass: HeaderGroupingNode,

    template:
      '<thead{groupsElement} class="Basis-Table-Header {selected} {disabled}">' +
        '<tr{childNodesElement|content}/>' +
      '</thead>',

    listen: {
      owner: {
        sortingChanged: function(owner, oldSorting, oldSortingDesc){
          var cell = this.childNodes.search(owner.sorting, 'colSorting');
          if (cell)
          {
            cell.select();
            cell.order = owner.sortingDesc;
            classList(this.tmpl.content).bool(HEADERCELL_CSS_SORTDESC, cell.order);
          }
          else
            this.selection.clear();
        }
      }
    },

    init: function(config){
      this.selection = {
        owner: this,
        handlerContext: this,
        handler: {
          datasetChanged: function(dataset, delta){
            var cell = dataset.pick();
            if (cell && this.owner)
              this.owner.setSorting(cell.colSorting, cell.order);
          }
        }
      };

      UIContainer.prototype.init.call(this, config);

      this.applyConfig_(this.structure)
    },
    applyConfig_: function(structure){
      if (structure)
      {
        var cells = [];
        var autosorting = [];
        var ownerSorting = this.owner && this.owner.sorting;
        
        for (var i = 0; i < structure.length; i++)
        {
          var colConfig = structure[i];
          var headerConfig = colConfig.header;
          var config = {};
          
          if ('groupId' in colConfig)
            config.groupId = colConfig.groupId;

          // content
          config.content = (headerConfig == null || typeof headerConfig != 'object'
            ? headerConfig 
            : headerConfig.content) || String.Entity.nbsp;

          if (typeof config.content == 'function')
            config.content = config.content.call(this);

          // css classes
          config.cssClassName = (headerConfig.cssClassName || '') + ' ' + (colConfig.cssClassName || '');

          // sorting
          var sorting = getter(colConfig.colSorting || colConfig.sorting);

          if (sorting !== nullGetter)
          {
            config.colSorting = sorting;
            config.defaultOrder = colConfig.defaultOrder;
          
            if (colConfig.autosorting || sorting === ownerSorting)
              autosorting.push(config);
          }

          // store cell
          cells.push(config);
        };

        if (autosorting.length)
          autosorting[0].selected = true;

        this.setChildNodes(cells);
      }
    }
  });


  //
  // Table footer
  //

 /**
  * @class
  */
  var FooterCell = Class(UINode, {
    className: namespace + '.FooterCell',

    colSpan: 1,

    template:
      '<td{content} class="Basis-Table-Footer-Cell {selected} {disabled}">' +
        '\xA0' +
      '</td>',

    templateUpdate: function(tmpl){
      this.element.colSpan = this.colSpan;
    },

    setColSpan: function(colSpan){
      this.colSpan = colSpan || 1;
      this.templateUpdate(this.tmpl);
    }
  });

 /**
  * @class
  */
  var Footer = Class(UIContainer, {
    className: namespace + '.Footer',

    childClass: FooterCell,

    template:
      '<tfoot class="Basis-Table-Footer {selected} {disabled}">' +
        '<tr{content|childNodesElement}/>' +
      '</tfoot>',

    init: function(config){
      UIContainer.prototype.init.call(this, config);

      this.applyConfig_(this.structure);

      DOM.display(this.element, this.useFooter);
    },

    applyConfig_: function(structure){
      if (structure)
      {
        var prevCell = null;

        this.clear();
        this.useFooter = false;

        for (var i = 0; i < structure.length; i++)
        {
          var colConfig = structure[i];
          var cell;

          if ('footer' in colConfig)
          {
            var footerConfig = colConfig.footer != null ? colConfig.footer : {};

            if (typeof footerConfig != 'object')
              footerConfig = { content: footerConfig };

            var content = footerConfig.content;

            if (typeof content == 'function')
              content = content.call(this);
              
            this.useFooter = true;
            
            cell = this.appendChild({
              //colSpan: footerConfig.colSpan || 1,
              cssClassName: (colConfig.cssClassName || '') + ' ' + (footerConfig.cssClassName || ''),
              content: content,
              template: footerConfig.template || FooterCell.prototype.template
            });
          }
          else
          {
            if (prevCell)
              prevCell.setColSpan(prevCell.colSpan + 1);
            else
              cell = this.appendChild({});
          }

          if (cell)
            prevCell = cell;
        }
      }
    }
  });


  //
  // Table
  //

 /**
  * Base row class
  * @class
  */
  var Row = Class(UINode, {
    className: namespace + '.Row',
    
    childClass: null,
    repaintCount: 0,

    template:
      '<tr class="Basis-Table-Row {selected} {disabled}" event-click="select">' +
        '<!--{cells}-->' +
      '</tr>',

    action: { 
      select: function(event){
        this.select(Event(event).ctrlKey);
      }
    },

    templateUpdate: function(tmpl, eventName, delta){
      // update template
      this.repaintCount += 1;  // WARN: don't use this.repaintCount++
                               // on first call repaintCount is prototype member

      for (var i = 0, updater; updater = this.updaters[i]; i++)
      {
        var cell = this.element.childNodes[updater.cellIndex];
        var content = updater.getter.call(this, this, cell);

        if (this.repaintCount > 1)
          cell.innerHTML = '';
       
        if (!content || !Array.isArray(content))
          content = [content];

        for (var j = 0; j < content.length; j++)
        {
          var ins = content[j];
          cell.appendChild(
            ins && ins.nodeType
              ? ins
              : DOM.createText(ins != null && (typeof ins != 'string' || ins != '') ? ins : ' ')
          );
        }
      }
    }
  });

 /**
  * @class
  */
  var Body = Class(UIPartitionNode, {
    className: namespace + '.Body',

    template:
      '<tbody class="Basis-Table-Body {selected} {disabled}">' +
        '<tr class="Basis-Table-GroupHeader" event-click="click">' +
          '<td{content} colspan="100">' +
            '<span class="expander"/>' +
            '<span class="Basis-Table-GroupHeader-Title">{title}</span>' +
          '</td>'+ 
        '</tr>' +
        '<!--{childNodesHere}-->' +
      '</tbody>',

    action: {
      click: function(){
        classList(this.element).toggle('collapsed');
      }
    }
  });
  
 /**
  * @class
  */
  var Table = Class(UIControl, {
    className: namespace + '.Table',
    
    childClass: Row,

    groupingClass: {
      className: namespace + '.TableGroupingNode',
      childClass: Body
    },

    template:
      '<table{groupsElement} class="Basis-Table {selected} {disabled}" cellspacing="0">' +
        '<!--{header}-->' +
        '<tbody{content|childNodesElement} class="Basis-Table-Body"/>' +
        '<!--{footer}-->' +
      '</table>',

    headerClass: Header,
    footerClass: Footer,

    columnCount: 0,

    init: function(config){

      ;;;if (this.rowSatellite && typeof console != 'undefined') console.warn('rowSatellite is deprecated. Move all extensions into childClass');
      ;;;if (this.rowBehaviour && typeof console != 'undefined') console.warn('rowBehaviour is deprecated. Move all extensions into childClass');

      this.applyConfig_(this.structure);

      UIControl.prototype.init.call(this, config);

      this.headerConfig = this.header;
      this.footerConfig = this.footer;

      this.header = new this.headerClass(extend({ owner: this, structure: this.structure }, this.header));
      this.footer = new this.footerClass(extend({ owner: this, structure: this.structure }, this.footer));

      DOM.replace(this.tmpl.header, this.header.element);
      DOM.replace(this.tmpl.footer, this.footer.element);
    },

    applyConfig_: function(structure){
      if (structure)
      {
        var updaters = new Array();
        var template = '';

        if (this.firstChild)
          this.clear();

        for (var i = 0; i < structure.length; i++)
        {
          var col = structure[i];
          var cell = col.body || {};

          if (typeof cell == 'function' || typeof cell == 'string')
            cell = {
              content: cell
            };

          var className = [col.cssClassName || '', cell.cssClassName || ''].join(' ').trim();
          var content = cell.content;
          template += 
            '<td' + (cell.templateRef ? cell.templateRef.quote('{') : '') + (className ? ' class="' + className + '"' : '') + '>' + 
              (typeof content == 'string' ? cell.content : '') +
            '</td>';

          if (typeof content == 'function')
          {
            updaters.push({
              cellIndex: i,
              getter: content
            });
          }
        }

        this.columnCount = i;

        this.childClass = this.childClass.subclass({
          template: this.childClass.prototype.template.source.replace('<!--{cells}-->', template),
          updaters: updaters
        });
      }
    },

    loadData: function(items){
      this.setChildNodes(nsData(items));
    },

    destroy: function(){
      UIControl.prototype.destroy.call(this);

      this.header.destroy();
      this.header = null;

      this.footer.destroy();
      this.footer = null;
    }
  });    


  //
  // export names
  //

  basis.namespace(namespace).extend({
    Table: Table,
    Body: Body,
    Header: Header,
    HeaderCell: HeaderCell,
    Row: Row,
    Footer: Footer
  });

}(basis);
