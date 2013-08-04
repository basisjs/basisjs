
  basis.require('basis.event');
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
    emit_ownerChanged: function(oldOwner){
      if (oldOwner && !this.owner)
        DOM.remove(this.headerRow);

      this.syncDomRefs();
      
      GroupingNode.prototype.emit_ownerChanged.call(this, oldOwner);
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
      emit_childNodesModified: function(delta){
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
          this.groupNode.emit_childNodesModified({});

        PartitionNode.prototype.emit_childNodesModified.call(this, delta);
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
      this.nullElement = DOM.createFragment();
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

    syncDomRefs: function(){
      var cursor = this;
      var owner = this.owner;
      var element = null;

      if (owner)
      {
        element = (owner.tmpl && owner.tmpl.groupsElement) || owner.childNodesElement;
        element.appendChild(this.nullElement);
      }

      do
      {
        cursor.element = cursor.childNodesElement = element;
        if (element)
          DOM.insert(element, cursor.headerRow, DOM.INSERT_BEGIN);
      }
      while (cursor = cursor.grouping);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      GroupingNode.prototype.destroy.call(this);
      this.headerRow = null;
      this.element = null;
      this.childNodesElement = null;
      this.nullElement;
    }
  });

 /**
  * @class
  */
  var HeaderCell = Class(UINode, {
    className: namespace + '.HeaderCell',

    colSorting: null,
    defaultOrder: false,
    title: '\xA0',

    template: templates.HeaderCell,

    binding: {
      sortable: function(node){
        return node.colSorting ? 'sortable' : '';
      },
      title: function(node){
        return node.title || String(node.title) || '\xA0';
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

    selection: {},
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
      },
      selection: {
        itemsChanged: function(selection){
          var cell = selection.pick();
          if (cell && this.owner)
            this.owner.setSorting(cell.colSorting, cell.order);
        }
      }
    },

    init: function(){
      UINode.prototype.init.call(this);

      if (this.structure)
      {
        var cells = [];
        var autoSorting = [];
        var ownerSorting = this.owner && this.owner.sorting;
        
        for (var i = 0, colConfig; colConfig = this.structure[i]; i++)
        {
          var headerConfig = colConfig.header;
          var config = {};

          if (headerConfig == null || typeof headerConfig != 'object' || headerConfig instanceof basis.Token || headerConfig instanceof basis.event.Emitter)
            headerConfig = {
              title: headerConfig
            };
          
          if ('groupId' in colConfig)
            config.groupId = colConfig.groupId;

          // content in header config is deprecated
          if ('content' in headerConfig)
          {
            ;;;basis.dev.warn('`content` property in header cell config is deprecated, use `title` instead');
            config.title = headerConfig.content;
          }

          if ('title' in headerConfig)
            config.title = headerConfig.title;

          if (typeof config.title == 'function')
            config.title = config.title.call(this);

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

      if (this.structure)
      {
        var prevCell = null;
        for (var i = 0, colConfig; colConfig = this.structure[i]; i++)
        {
          if ('footer' in colConfig)
          {
            var footerConfig = colConfig.footer != null ? colConfig.footer : {};

            if (typeof footerConfig != 'object' || footerConfig instanceof basis.Token || footerConfig instanceof basis.event.Emitter)
              footerConfig = {
                value: footerConfig
              };

            // fulfill config
            var config = {
              cssClassName: (colConfig.cssClassName || '') + ' ' + (footerConfig.cssClassName || '')
            };

            // content in footer config is deprecated
            if ('content' in footerConfig)
            {
              ;;;basis.dev.warn('`content` property in footer cell config is deprecated, use `value` instead');
              config.value = footerConfig.content;
            }

            if ('value' in footerConfig)
              config.value = footerConfig.value;

            if (typeof config.value == 'function')
              config.value = config.value.call(this);

            if (footerConfig.template)
              config.template = footerConfig.template;

            if (footerConfig.binding)
              config.binding = footerConfig.binding;

            // create instace of cell
            prevCell = this.appendChild(config);
          }
          else
          {
            if (prevCell)
              prevCell.setColSpan(prevCell.colSpan + 1);
            else
              prevCell = this.appendChild({});
          }
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
    binding: {
      header: 'satellite:',
      footer: 'satellite:'
    },

    headerClass: Header,
    footerClass: Footer,

    header: null,
    footer: null,

    columnCount: 0,

    selection: true, 
    childClass: Row,

    groupingClass: {
      className: namespace + '.TableGroupingNode',
      childClass: Body
    },

    init: function(){
      var useFooter = false;

      // apply structure config
      if (this.structure)
      {
        var template = '';
        var binding = {};

        for (var i = 0, colConfig; colConfig = this.structure[i]; i++)
        {
          var cell = colConfig.body || {};

          if ('footer' in colConfig)
            useFooter = true;

          if (typeof cell == 'function' || typeof cell == 'string')
            cell = {
              content: cell
            };

          var className = [colConfig.cssClassName || '', cell.cssClassName || ''].join(' ').trim();
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

      // inherit
      UINode.prototype.init.call(this);

      // header
      this.header = new this.headerClass(extend({ owner: this, structure: this.structure }, this.header));
      this.setSatellite('header', this.header);

      // footer
      if (useFooter || this.footer)
      {
        this.footer = new this.footerClass(extend({ owner: this, structure: this.structure }, this.footer));
        this.setSatellite('footer', this.footer);
      }
    },

    destroy: function(){
      UINode.prototype.destroy.call(this);

      this.header = null;
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
