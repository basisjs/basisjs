/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

   /**
    * Table namespace
    *
    * @link ./test/speed-table.html
    * @link ./demo/various/match.html
    * @link ./demo/various/grouping.html
    *
    * @namespace Basis.Controls.Table
    */

    var namespace = 'Basis.Controls.Table';

    // import names

    var Class = Basis.Class;
    var Event = Basis.Event;
    var DOM = Basis.DOM;
    var CSS = Basis.CSS;
    var Template = Basis.Html.Template;

    var getter = Function.getter;
    var extend = Object.extend;
    var cssClass = Basis.CSS.cssClass;

    var Property = Basis.Data.Property.Property;

    var nsWrappers = DOM.Wrapper;
    var HtmlNode = nsWrappers.HtmlNode;
    var HtmlContainer = nsWrappers.HtmlContainer;
    var HtmlControl = nsWrappers.HtmlControl;
    var HtmlPartitionNode = nsWrappers.HtmlPartitionNode;
    var HtmlGroupControl = nsWrappers.HtmlGroupControl;

    //
    // Main part
    //

    //
    // Table Header
    //

    var HEADERCELL_CSS_SORTABLE = 'sortable';
    var HEADERCELL_CSS_SORTDESC = 'sort-order-desc';

   /**
    * @class
    */

    var HeaderCell = Class(HtmlNode, {
      className: namespace + '.HeaderCell',

      sorting: null,
      defaultOrder: false,
      groupId: 0,

      behaviour: {
        click: function(event){
          if (this.selected)
          {
            if (this.document)
              this.document.setLocalSorting(this.document.localSorting, !this.document.localSortingDesc);
          }
          else
            this.select();
        }
      },

      template: new Template(
        '<th{element|selectedElement} class="Basis-Table-Header-Cell">' +
          '<div class="Basis-Table-Sort-Direction"></div>' +
          '<div class="Basis-Table-Header-Cell-Content">' + 
            '<span{content} class="Basis-Table-Header-Cell-Title"></span>' +
          '</div>' +
        '</th>'
      ),

      init: function(config){
        config = config || {};
        config.selectable = !!config.sorting;
        
        this.inherit(config);

        //DOM.insert(this.content, config.content || '');
        
        if (config.groupId)
          this.groupId = config.groupId;

        if (config.sorting)
        {
          this.sorting = getter(config.sorting);
          this.defaultOrder = config.defaultOrder == 'desc';

          cssClass(this.element).add(HEADERCELL_CSS_SORTABLE);
        }
      },
      select: function(){
        if (!this.selected)
          this.order = this.defaultOrder;

        this.inherit();
      }
    });

   /**
    * @class
    */
    var Header = Class(HtmlContainer, {
      className: namespace + '.Header',

      canHaveChildren: true,
      childClass: HeaderCell,
      childFactory: function(config){
        return new this.childClass(config);
      },

      groupControlClass: Class(HtmlGroupControl, {
        childClass: Class(HtmlPartitionNode, {
          className: namespace + '.HeaderPartitionNode',
          behaviour: {
            childNodesModified: function(){
              this.element.colSpan = this.childNodes.length;
            }
          },
          template: new Template(
            '<th{element|selectedElement} class="Basis-Table-Header-Cell">' +
              '<div class="Basis-Table-Sort-Direction"></div>' +
              '<div class="Basis-Table-Header-Cell-Content">' + 
                '<span{content} class="Basis-Table-Header-Cell-Title">{titleText}</span>' +
              '</div>' +
            '</th>'
          )
        })
      }),

      template: new Template(
        '<thead{element} class="Basis-Table-Header">' +
          '<tr{groupsElement} class="Basis-Table-Header-GroupContent"></tr>' +
          '<tr{childNodesElement|content}></tr>' +
        '</thead>'
      ),

      init: function(config){
        this.inherit(config);

        // inherit create
        this.selection = new nsWrappers.Selection({
          handlersContext: this,
          handlers: {
            change: function(){
              var cell = this.selection.pick();
              if (cell && this.document)
                this.document.setLocalSorting(cell.sorting, cell.order);
            }
          }
        });

        // add event handlers
        //this.addEventListener('click');
        if (this.document)
          this.document.addHandler({
            localSortingChanged: function(){
              var document = this.document;
              
              if (!document)
                return;
              
              var cell = this.childNodes.search(document.localSorting, 'sorting');
              if (cell)
              {
                cell.select();
                cell.order = document.localSortingDesc;
                cssClass(this.content).bool(HEADERCELL_CSS_SORTDESC, cell.order);
              }
              else
                this.selection.clear();

            }
          }, this);

        if (config)
          this.applyConfig_(config.structure)

        if (this.document)
          DOM.insert(this.document.element, this.element, DOM.INSERT_BEGIN);
      },
      applyConfig_: function(structure){
        if (structure)
        {
          this.clear();

          for (var i = 0; i < structure.length; i++)
          {
            var colConfig = structure[i];
            var headerConfig = colConfig.header;
            
            if (headerConfig == null || typeof headerConfig == 'string')
              headerConfig = {
                content: headerConfig || String.Entity.nbsp
              };

            var content = headerConfig.content;
            this.appendChild({
              content: typeof content == 'function' ? content.call(this) : content,
              sorting: colConfig.sorting,
              defaultOrder: colConfig.defaultOrder,
              groupId: colConfig.groupId,
              cssClassName: {
                element: (headerConfig.cssClassName || '') + ' ' + (colConfig.cssClassName || '')
              }
            });
          }
        }
      },
      destroy: function(){
        delete this.document;
        this.inherit();
      }
    });

    //
    // Table Footer
    //

   /**
    * @class
    */

    var FooterCell = Class(HtmlNode, {
      className: namespace + '.FooterCell',

      colSpan: 1,

      template: new Template(
        '<td{element} class="Basis-Table-Footer-Cell">' +
          '<div{content}>' + String.Entity.nbsp + '</div>' +
        '</td>'
      ),

      setColSpan: function(colSpan){
        this.element.colSpan = this.colSpan = colSpan || 1;
      }
    });

   /**
    * @class
    */
    var Footer = Class(HtmlContainer, {
      className: namespace + '.Footer',

      childClass: FooterCell,
      childFactory: function(config){
        return new this.childClass(config);
      },

      template: new Template(
        '<tfoot{element} class="Basis-Table-Footer">' +
          '<tr{content|childNodesElement}></tr>' +
        '</tfoot>'
      ),

      init: function(config){
        config = config || {};

        this.inherit(config);

        this.applyConfig_(config.structure);

        if (this.useFooter)
          DOM.insert(config.container || this.document.element, this.element, 1);
      },

      applyConfig_: function(structure){
        //console.dir(this);
        if (structure)
        {
          var prevCell = null;

          this.clear();
          this.useFooter = false;

          for (var i = 0; i < structure.length; i++)
          {
            var colConfig = structure[i];
            var cell;

            if (colConfig.footer)
            {
              var content = colConfig.footer.content;

              if (typeof content == 'object' && content instanceof Property)
              {
                if (this.document && typeof content.attach == 'function')
                  content.attach(this.document);
                content = content.addLink(DOM.createText(), null, colConfig.footer.format);
              }
              else
              {
                if (typeof content == 'function')
                  content = content.call(this, this.document && this.document.registers);
              }
                
              this.useFooter = true;

              cell = this.appendChild({
                cssClassName: (colConfig.cssClassName || '') + ' ' + (colConfig.footer.cssClassName || ''),
                content: content
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

    var Row = Class(HtmlNode, {
      className: namespace + '.Row',
      
      canHaveChildren: false,

      repaintCount: 0,
      getters: [],
      classNames: [],

      template: new Template(
        '<tr{element|content|childNodesElement} class="Basis-Table-Row"></tr>'
      ),

      behaviour: {
        click: function(event){
          this.select(Event(event).ctrlKey);
        },
        update: function(object, delta){
          this.inherit(object, delta);
          this.repaint();
        }
      },

      repaint: function(){
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
    var Body = Class(HtmlPartitionNode, {
      className: namespace + '.Body',

      behaviour: {
        click: function(){
          cssClass(this.element).toggle('collapsed');
        }
      },
      
      template: new Template(
        '<tbody{element|childNodesElement} class="Basis-Table-Body">' +
          '<tr class="Basis-Table-GroupHeader">' +
            '<td{content} colspan="100"><span class="expander"></span>{titleText}</td>'+ 
          '</tr>' +
        '</tbody>'
      )
    });
    
   /**
    * @class
    */
    var Table = Class(HtmlControl, {
      className: namespace + '.Table',
      
      canHaveChildren: true,
      childClass: Row,
      groupControlClass: Class(HtmlGroupControl, { childClass: Body }),

      registers: null,

      template: new Template(
        '<table{element|groupsElement} class="Basis-Table" cellspacing="0">' +
          '<tbody{content|childNodesElement} class="Basis-Table-Body"></tbody>' +
        '</table>'
      ),

      //canHaveChildren: false,

      init: function(config){
        config = config || {};

        this.applyConfig_(config);

        this.inherit(config);

        if (config.registers)
          this.attachRegisters_(config.registers);

        this.body = this; // backward capability

        this.header = new Header(Object.extend({ document: this, structure: config.structure }, config.header));
        this.footer = new Footer(Object.extend({ document: this, structure: config.structure }, config.footer));
      
        if (!this.localSorting && config.structure && config.structure.search(true, function(item){ return item.sorting && ('autosorting' in item) }))
        {
          var col = config.structure[Array.lastSearchIndex];
          //console.log(col.sorting, col.defaultOrder == 'desc');
          this.setLocalSorting(col.sorting, col.defaultOrder == 'desc');
        }
        //this.header.traceSortingChanges();

        // add event handlers
        this.addEventListener('click');
        this.addEventListener('contextmenu', 'contextmenu', true);
      },

      attachRegisters_: function(registers){
        Object.iterate(this.registers, function(key, register){
          register.detach(this);
        }, this);

        this.registers = {};

        Object.iterate(registers, function(key, register){
          if (typeof register.attach == 'function')
          {
            register.attach(this);
            this.registers[key] = register;
          }
        }, this);
      },

      applyConfig_: function(config){
        if (config && config.structure)
        {
          var structure = config.structure;
          var updaters = new Array();
          var template = '';

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

          this.childClass = Class(Row, {
            behaviour: config.rowBehaviour,
            satelliteConfig: config.rowSatellite,
            template: new Template(Row.prototype.template.source.replace('</tr>', template + '</tr>')),
            updaters: updaters
          });
        }
      },

      loadData: function(items, noCascadeDestroy){
        this.setChildNodes(items.map(Data.wrapper('info')))
      },

      destroy: function(){
        this.attachRegisters_({});

        this.inherit();

        this.header.destroy();
        this.footer.destroy();

        delete this.header;
        delete this.footer;
        delete this.registers;
      }
    });    

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Table: Table,
      Body: Body,
      Header: Header,
      HeaderCell: HeaderCell,
      Row: Row,
      Footer: Footer
    });

  })();
