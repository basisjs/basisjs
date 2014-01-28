
  basis.require('basis.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.l10n');
  basis.require('basis.ui');


 /**
  * Table namespace
  *
  * @see ./demo/defile/table.html
  * @see ./demo/common/match.html
  * @see ./demo/common/grouping.html
  * @see ./test/speed/table.html
  *
  * @namespace basis.ui.table
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;

  var getter = basis.getter;
  var nullGetter = basis.fn.nullGetter;
  var extend = basis.object.extend;

  var GroupingNode = basis.dom.wrapper.GroupingNode;
  var PartitionNode = basis.dom.wrapper.PartitionNode;
  var UINode = basis.ui.Node;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    Table: resource('templates/table/Table.tmpl'),
    Body: resource('templates/table/Body.tmpl'),
    Row: resource('templates/table/Row.tmpl'),
    Cell: resource('templates/table/Cell.tmpl'),

    Header: resource('templates/table/Header.tmpl'),
    HeaderPartitionRow: resource('templates/table/HeaderPartitionRow.tmpl'),
    HeaderPartitionNode: resource('templates/table/HeaderPartitionNode.tmpl'),
    HeaderCell: resource('templates/table/HeaderCell.tmpl'),

    FooterCell: resource('templates/table/FooterCell.tmpl'),
    Footer: resource('templates/table/Footer.tmpl')
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
      title: 'data:',
      colSpan: 'delegate.colSpan'
    },

    listen: {
      delegate: {
        colSpanChanged: function(){
          this.updateBind('colSpan');
        }
      }
    }
  });

 /**
  * @class
  */
  var HeaderGroupingNode = Class(UIGroupingNode, {
    className: namespace + '.HeaderGroupingNode',

   /**
    * @inheritDoc
    */
    childClass: PartitionNode.subclass({
      className: namespace + '.AbstractHeaderPartitionNode',
      colSpan: 1,
      emit_colSpanChanged: basis.event.create('colSpanChanged'),
      emit_childNodesModified: function(delta){
        PartitionNode.prototype.emit_childNodesModified.call(this, delta);
        this.updateColSpan();
      },
      listen: {
        childNode: {
          colSpanChanged: function(){
            this.updateColSpan();
          }
        }
      },
      updateColSpan: function(){
        var colSpan = this.nodes.reduce(function(res, node){
          return res + (node instanceof HeaderGroupingNode.prototype.childClass ? node.colSpan : 1);
        }, 0);

        if (this.colSpan != colSpan)
        {
          this.colSpan = colSpan;
          this.emit_colSpanChanged();
        }
      }
    }),

   /**
    * @inheritDoc
    */
    groupingClass: Class.SELF,

   /**
    * @inheritDoc
    */
    satellite: {
      partitionRow: {
        dataSource: function(owner){
          return owner.getChildNodesDataset();
        },
        instanceOf: basis.ui.Node.subclass({
          template: templates.HeaderPartitionRow,
          childClass: HeaderPartitionNode
        })
      }
    },

   /**
    * @inheritDoc
    */
    insertBefore: GroupingNode.prototype.insertBefore,

   /**
    * @inheritDoc
    */
    removeChild: GroupingNode.prototype.removeChild,

   /**
    * @inheritDoc
    */
    syncDomRefs: function(){
      basis.ui.GroupingNode.prototype.syncDomRefs.call(this);

      var cursor = this;
      var element = this.owner ? (this.owner.tmpl && this.owner.tmpl.groupRowsElement) || this.owner.childNodesElement : null;

      do
      {
        var rowElement = cursor.satellite.partitionRow.element;

        if (element)
        {
          element.insertBefore(rowElement, element.firstChild);
        }
        else
        {
          if (rowElement.parentNode)
            rowElement.parentNode.removeChild(rowElement);
        }
      }
      while (cursor = cursor.grouping);
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
          var cell = basis.array.search(this.childNodes, owner.sorting, 'colSorting');
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

          if ('template' in headerConfig)
            config.template = headerConfig.template;

          if ('title' in headerConfig)
            config.title = headerConfig.title;

          if (typeof config.title == 'function')
            config.title = config.title.call(this);

          // css classes
          /** @cut */ if (headerConfig.cssClassName)
          /** @cut */   basis.dev.warn('cssClassName isn\'t supported in header cell config anymore, use template property instead');

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
            var config = {};

            /** @cut */ if (footerConfig.cssClassName)
            /** @cut */   basis.dev.warn('cssClassName isn\'t supported in footer cell config anymore, use template property instead');

            // content in footer config is deprecated
            if ('content' in footerConfig)
            {
              ;;;basis.dev.warn('`content` property in footer cell config is deprecated, use `value` instead');
              config.value = footerConfig.content;
            }

            if ('template' in footerConfig)
              config.value = footerConfig.template;

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

          var content = cell.content;
          var contentType = typeof content;
          var replaceContent = contentType == 'string' ? content : (contentType == 'function' ? '{__cell' + i + '}' : '');
          var cellTemplate = cell.template || '';
          var cellTemplateRef = namespace + '.Cell';

          /** @cut */ if (cell.cssClassName)
          /** @cut */   basis.dev.warn('cssClassName isn\'t supported in body cell config anymore, use template property instead');

          /** @cut */ if (colConfig.cssClassName)
          /** @cut */   basis.dev.warn('cssClassName isn\'t supported for table column config anymore, use template property instead');

          if (cellTemplate)
          {
            if (cellTemplate instanceof basis.template.Template)
              cellTemplateRef = '#' + cellTemplate.templateId;
            else
              if (typeof cellTemplate == 'function' && cellTemplate.url)
                cellTemplateRef = cellTemplate.url;
              else
                cellTemplateRef = null;
          }


          template +=
            cellTemplateRef
              ? '<b:include src="' + cellTemplateRef + '">' +
                  (cell.templateRef ? '<b:add-ref name="' + cell.templateRef + '"/>' : '') +
                  (replaceContent
                    ? '<b:replace ref="content">' + replaceContent + '</b:replace>'
                    : '') +
                '</b:include>'
              : cellTemplate; // todo: replace {content} for replaceContent

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
