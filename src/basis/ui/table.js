
  basis.require('basis.data');
  basis.require('basis.dom');
  basis.require('basis.dom.wrapper');
  basis.require('basis.l10n');
  basis.require('basis.ui');


 /**
  * Table namespace
  *
  * @see ./test/speed/table.html
  * @see ./demo/common/match.html
  * @see ./demo/common/grouping.html
  *
  * @namespace basis.ui.table
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var nsData = basis.data;

  var getter = basis.getter;
  var nullGetter = basis.fn.nullGetter;
  var extend = basis.object.extend;

  var GroupingNode = basis.dom.wrapper.GroupingNode;
  var PartitionNode = basis.dom.wrapper.PartitionNode;
  var UINode = basis.ui.Node;
  var UIPartitionNode = basis.ui.PartitionNode;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Table: resource('templates/table/Table.tmpl'),
    Body: resource('templates/table/Body.tmpl'),
    Row: resource('templates/table/Row.tmpl'),

    Header: resource('templates/table/Header.tmpl'),
    HeaderPartitionNode: resource('templates/table/HeaderPartitionNode.tmpl'),
    HeaderCell: resource('templates/table/HeaderCell.tmpl'),
    
    FooterCell: resource('templates/table/FooterCell.tmpl'),
    Footer: resource('templates/table/Footer.tmpl'),
  });


  //
  // Table header
  //

 /**
  * @class
  */
  var HeaderPartitionNode = Class(UINode, {
    className: namespace + '.HeaderPartitionNode',

    template: templates.HeaderPartitionNode,
    binding: {
      title: 'data:'
    }
  });

 /**
  * @class
  */
  var HeaderGroupingNode = Class(GroupingNode, {
    className: namespace + '.HeaderGroupingNode',
    event_ownerChanged: function(oldOwner){
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
      
      GroupingNode.prototype.event_ownerChanged.call(this, oldOwner);
    },

   /**
    * @inheritDoc
    */
    childClass: {
      className: namespace + '.HeaderPartitionNode',
      init: function(){
        PartitionNode.prototype.init.call(this);

        this.cell = new HeaderPartitionNode({
          delegate: this,
          binding: this.binding || {}
        });
      },
      event_childNodesModified: function(delta){
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
          this.groupNode.event_childNodesModified({});

        PartitionNode.prototype.event_childNodesModified.call(this, delta);
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
    init: function(){
      GroupingNode.prototype.init.call(this);
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

    template: templates.HeaderCell,

    binding: {
      sortable: function(node){
        return node.colSorting ? 'sortable' : '';
      }
    },

    action: {
      setColumnSorting: function(){
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
    init: function(){
      this.selectable = !!this.colSorting;

      UINode.prototype.init.call(this);

      if (this.colSorting)
      {
        //this.colSorting = getter(this.colSorting);
        this.defaultOrder = this.defaultOrder == 'desc';
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
  var Header = Class(UINode, {
    className: namespace + '.Header',

    childClass: HeaderCell,

    groupingClass: HeaderGroupingNode,

    template: templates.Header,

    binding: {
      order: function(node){
        return node.owner.sortingDesc ? 'desc' : 'asc';
      }
    },

    listen: {
      owner: {
        sortingChanged: function(owner){
          var cell = this.childNodes.search(owner.sorting, 'colSorting');
          if (cell)
          {
            cell.select();
            cell.order = owner.sortingDesc;
          }
          else
            this.selection.clear();

          this.updateBind('order');
        }
      }
    },

    init: function(){
      this.selection = {
        owner: this,
        handlerContext: this,
        handler: {
          datasetChanged: function(dataset){
            var cell = dataset.pick();
            if (cell && this.owner)
              this.owner.setSorting(cell.colSorting, cell.order);
          }
        }
      };

      UINode.prototype.init.call(this);

      this.applyConfig_(this.structure);
    },
    applyConfig_: function(structure){
      if (structure)
      {
        var cells = [];
        var autoSorting = [];
        var ownerSorting = this.owner && this.owner.sorting;
        
        for (var i = 0; i < structure.length; i++)
        {
          var colConfig = structure[i];
          var headerConfig = colConfig.header;
          var config = {};
          
          if ('groupId' in colConfig)
            config.groupId = colConfig.groupId;

          // content
          config.content = (headerConfig == null || typeof headerConfig != 'object' || headerConfig instanceof basis.l10n.Token
            ? headerConfig 
            : headerConfig.content) || '\xA0';

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
              autoSorting.push(config);
          }

          // store cell
          cells.push(config);
        }

        if (autoSorting.length)
          autoSorting[0].selected = true;

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

    value: '',

    template: templates.FooterCell,
    binding: {
      colSpan: 'colSpan',
      value: function(node){
        return node.value || String(node.value) || '\xA0';
      }
    },

    colSpan: 1,
    setColSpan: function(colSpan){
      this.colSpan = colSpan || 1;
      this.updateBind('colSpan');
    }
  });

 /**
  * @class
  */
  var Footer = Class(UINode, {
    className: namespace + '.Footer',

    template: templates.Footer,

    childClass: FooterCell,

    init: function(){
      UINode.prototype.init.call(this);

      this.applyConfig_(this.structure);
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

            // fill config

            var config = {
              cssClassName: (colConfig.cssClassName || '') + ' ' + (footerConfig.cssClassName || ''),
              content: content
            };

            if (footerConfig.template)
              config.template = footerConfig.template;
            if (footerConfig.binding)
              config.binding = footerConfig.binding;
            if ('value' in footerConfig)
              config.value = footerConfig.value;

            // create instace of cell
           
            cell = this.appendChild(config);
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

    template: templates.Row,

    action: { 
      select: function(event){
        if (!this.isDisabled())
          this.select(event.ctrlKey || event.metaKey);
      }
    }
  });

 /**
  * @class
  */
  var Body = Class(UIPartitionNode, {
    className: namespace + '.Body',

    collapsed: false,

    template: templates.Body,

    binding: {
      collapsed: function(node){
        return node.collapsed ? 'collapsed' : '';
      }
    },

    action: {
      toggle: function(){
        this.collapsed = !this.collapsed;
        this.updateBind('collapsed');
      }
    }
  });
  
 /**
  * @class
  */
  var Table = Class(UINode, {
    className: namespace + '.Table',

    template: templates.Table,

    headerClass: Header,
    footerClass: Footer,

    columnCount: 0,

    selection: true, 
    childClass: Row,

    groupingClass: {
      className: namespace + '.TableGroupingNode',
      childClass: Body
    },

    init: function(){
      this.applyConfig_(this.structure);

      UINode.prototype.init.call(this);

      this.header = new this.headerClass(extend({ owner: this, structure: this.structure }, this.header));
      this.footer = new this.footerClass(extend({ owner: this, structure: this.structure }, this.footer));
    },

    templateSync: function(noRecreate){
      UINode.prototype.templateSync.call(this, noRecreate);

      DOM.replace(this.tmpl.header, this.header.element);
      if (this.footer.useFooter)
        DOM.replace(this.tmpl.footer, this.footer.element);      
    },

    applyConfig_: function(structure){
      if (structure)
      {
        var template = '';
        var binding = {};

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
          var contentType = typeof content;

          template += 
            '<td' + (cell.templateRef ? '{' + cell.templateRef + '}' : '') + (className ? ' class="' + className + '"' : '') + '>' + 
              (contentType == 'string' ? content : (contentType == 'function' ? '{__cell' + i + '}' : '')) +
            '</td>';

          if (contentType == 'function')
          {
            binding['__cell' + i] = {
              events: 'update',
              getter: content
            };
          }
        }

        this.columnCount = i;

        this.childClass = this.childClass.subclass({
          template:
            '<b:include src="#' + this.childClass.prototype.template.templateId + '">' +
              '<b:replace ref="cells">' +
                template +
              '</b:replace>' +
            '</b:include>',

          binding: binding
        });
      }
    },

    loadData: function(items){
      this.setChildNodes(nsData(items));
    },

    destroy: function(){
      UINode.prototype.destroy.call(this);

      this.header.destroy();
      this.header = null;

      this.footer.destroy();
      this.footer = null;
    }
  });    


  //
  // export names
  //

  module.exports = {
    Table: Table,
    Body: Body,
    Header: Header,
    HeaderCell: HeaderCell,
    Row: Row,
    Footer: Footer
  };
