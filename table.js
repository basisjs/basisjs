/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
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
    var Data = Basis.Data;
    var Template = Basis.Html.Template;

    var extend = Object.extend;
    var cssClass = Basis.CSS.cssClass;

    var nsWrapers = DOM.Wrapers;
    var HtmlNode = nsWrapers.HtmlNode;
    var HtmlControl = nsWrapers.HtmlControl;
    var HtmlPartitionNode = nsWrapers.HtmlPartitionNode;
    var HtmlGroupControl = nsWrapers.HtmlGroupControl;
    var createBehaviour = nsWrapers.createBehaviour;

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

      behaviour: createBehaviour(HtmlNode, {
        click: function(event){
          if (this.selected)
          {
            if (this.document)
              this.document.setLocalSorting(this.document.localSorting, !this.document.localSortingDesc);
          }
          else
            this.select();
        }
      }),

      template: new Template(
        '<th{element|selectedElement} class="Basis-Table-Header-Cell">' +
          '<div class="Basis-Table-Sort-Direction"></div>' +
          '<div class="Basis-Table-Header-Cell-Content">' + 
            '<span{content} class="Basis-Table-Header-Cell-Title"></span>' +
          '</div>' +
        '</th>'
      ),

      init: function(config){
        config = this.inherit(extend(config, { selectable: !!config.sorting }));

        DOM.insert(this.content, config.content || '');

        if (config.groupId)
          this.groupId = config.groupId;

        if (config.sorting)
        {
          this.sorting = Data.getter(config.sorting);
          this.defaultOrder = config.defaultOrder == 'desc';

          cssClass(this.element).add(HEADERCELL_CSS_SORTABLE);
        }

        return config;
      },
      select: function(){
        if (this.inherit())
          this.order = this.defaultOrder;
      }
    });

   /**
    * @class
    */
    var Header = Class(HtmlNode, {
      className: namespace + '.Header',

      canHaveChildren: true,
      childClass: HeaderCell,
      childFactory: function(config){
        return new this.childClass(config);
      },

      groupControlClass: Class(HtmlGroupControl, {
        childClass: Class(HtmlPartitionNode, {
          behaviour: createBehaviour(HtmlPartitionNode, {
            childNodesModified: function(){
              this.element.colSpan = this.childNodes.length;
            }
          }),
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
        config = this.inherit(config);

        // inherit create
        this.selection = new nsWrapers.Selection({
          thisObject: this,
          handlers: {
            change: function(){
              var cell = this.selection.items[0];
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

        // return config object
        return config;
      },
      applyConfig_: function(config){
        if (config && config.structure)
        {
          var structure = config.structure;

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
    var Footer = Class(HtmlNode, {
      className: namespace + '.Footer',

      template: new Template(
        '<tfoot{element} class="Basis-Table-Footer">' +
          '<tr{content|childNodesElement}></tr>' +
        '</tfoot>'
      ),

      applyConfig_: function(config){
        //console.dir(this);
        if (config && config.structure)
        {
          var structure = config.structure;
          var prevCell = null;

          DOM.clear(this.content);
          this.useFooter = false;

          for (var i = 0; i < structure.length; i++)
          {
            var colConfig = structure[i];
            var cell;

            if (colConfig.footer)
            {
              cell = DOM.createElement('TD.Basis-Table-Footer-Cell' + CSS.makeClassName(colConfig.cssClassName) + CSS.makeClassName(colConfig.footer.cssClassName));

              var content = colConfig.footer.content;

              if (typeof content == 'object' && nsWrapers.Register && content instanceof nsWrapers.Register.Register)
              {
                if (this.document)
                  content.attach(this.document);
                content = content.addLink(DOM.createText(), null, colConfig.footer.format);
              }
              else if (typeof content == 'function')
                content = content.call(this, this.document && this.document.registers);
                
              DOM.insert(cell, DOM.createElement('', content));
              this.useFooter = true;
            }
            else
              if (!prevCell)
                cell = DOM.createElement('TD.Basis-Table-Footer-Cell', DOM.createElement('', ''));
              else
                prevCell.colSpan = (prevCell.colSpan || 1) + 1;

            if (cell)
              this.content.appendChild(prevCell = cell);
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
      className:  namespace + '.Row',
      
      canHaveChildren: false,

      repaintCount: 0,
      getters: [],
      classNames: [],

      template: new Template(
        '<tr{element|content|childNodesContainer|selectedElement} class="Basis-Table-Row"></tr>'
      ),

      behaviour: createBehaviour(HtmlNode, {
        click: function(event){
          this.select(Event(event).ctrlKey);
        },
        update: function(node, oldInfo, newInfo, delta){
          this.repaint();
          this.inherit(node, oldInfo, newInfo, delta);
        }
      }),

      repaint: function(){
        this.repaintCount = this.repaintCount + 1;  // WARN: don't use this.repaintCount++
                                                    // on first call repaintCount is prototype member

        for (var i = 0, len = this.getters.length; i < len; i++)
        {
         
          var getter = this.getters[i];
          if (!getter)
            continue;
 
          var cell = this.element.childNodes[i];
          if (!cell)
            continue;

          /*/
          var cell = this.element.childNodes[i];
          if (!cell)
            continue;
          
          var getter = this.getters[i];
          if (!getter)
            continue; /**/ 

          var content = getter.call(this, this, cell);
          var className = this.classNames[i];

          if (this.repaintCount > 1)
            DOM.clear(cell.firstChild);

          if (className)
            cell.firstChild.className = className.call(this, this, cell);
          
          if (!content || !(content instanceof Array))
            content = [content];

          for (var j = 0; j < content.length; j++)
          {
            var ins = content[j];
            cell.firstChild.appendChild(
              ins && ins.nodeType
                ? ins
                : DOM.createText(ins != null && (typeof ins != 'string' || ins != '') ? ins : ' ')
            );
          }
          //cell.firstChild.firstChild.nodeValue = content;
        }
      }
    });

   /**
    * @class
    */
    var Body = Class(HtmlPartitionNode, {
      className: namespace + '.Body',

      behaviour: createBehaviour(HtmlPartitionNode, {
        click: function(){
          cssClass(this.element).toggle('collapsed');
        }
      }),
      
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

        this.applyConfig_(config);

        config = this.inherit(config);

        if (config.registers)
          this.attachRegisters_(config.registers);

        this.body = this; // backward capability

        this.header = new Header({ document: this });
        this.footer = new Footer({ document: this });

        //this.header.parentNode = this;
        //this.footer.parentNode = this;
        
        this.header.applyConfig_(config);
        this.footer.applyConfig_(config);

        if (!this.localSorting && config.structure && config.structure.search(true, function(item){ return item.sorting && ('autosorting' in item) }))
        {
          var col = config.structure[Array.lastSearchIndex];
          //console.log(col.sorting, col.defaultOrder == 'desc');
          this.setLocalSorting(col.sorting, col.defaultOrder == 'desc');
        }
        //this.header.traceSortingChanges();

        DOM.insert(this.element, this.header.element, DOM.INSERT_BEGIN);
        if (this.footer.useFooter)
          DOM.insert(this.element, this.footer.element, 1);

        // add event handlers
        this.addEventListener('click');
        this.addEventListener('contextmenu');

        // returns config
        return config;
      },

      attachRegisters_: function(registers){
        if (this.registers)
          for (var r in this.registers)
            this.registers[r].detach(this);

        this.registers = {};
        if (registers)
        {
          var k = Object.keys(registers);
          for (var i = 0; i < k.length; i++)
          {
            var register = registers[k[i]];
            if (register.attach)
            {
              register.attach(this);
              this.registers[k[i]] = register;
            }
          }
        }
      },

      applyConfig_: function(config){
        if (config && config.structure)
        {
          var structure  = config.structure;
          var getters    = new Array();
          var classNames = new Array();
          var template   = '';

          this.clear();

          for (var i = 0; i < structure.length; i++)
          {
            var colConfig = structure[i];
            var cellConfig = colConfig.body;

            if (typeof cellConfig == 'function')
              cellConfig = { content: cellConfig };

            var className = cellConfig.contentClassName;
            var elementClassName = ((colConfig.cssClassName || '') + ' ' + (cellConfig.cssClassName || '')).qw().join(' ');
            template += 
              '<td' + (elementClassName ? ' class="' + elementClassName + '"' : '') + '>' + 
                '<div' + (className && typeof className != 'function' ? ' class="' + className + '"' : '') + '>' + (cellConfig.template || '') + '</div>' +
              '</td>';

            var getter = cellConfig.content;
            getter = typeof getter == 'function' ? getter : (getter != null ? getter.toString.bind(getter) : null);

            getters.push(getter);

            classNames.push(typeof className == 'function' ? className : null);
          }

          var rowClass = Class(Row, {
            behaviour: createBehaviour(Row, config.rowBehaviour),
            template: new Template(Row.prototype.template.source.replace('><', '>' + template + '<')),
            getters: getters,
            classNames: classNames
          });

          this.childClass = rowClass;
        }
      },
      loadData: function(items, noCascadeDestroy){
        this.setChildNodes(items.map(Data.wrapper('info')))
        /*this.clear();

        var cascadeDestroy = !noCascadeDestroy;
        if ('length' in items == false)
          items = Array.from(items);

        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.groupControl || this;
        var container = target.childNodesElement;
        target.childNodesElement = domFragment;
        
        // switch off dispatch
        this.dispatch = Function.$undef;

        // insert nodes
        for (var i = 0; i < items.length; i++)
          this.insertBefore({
            cascadeDestroy: cascadeDestroy,
            info: items[i]
          });

        // restore event dispatch & dispatch child nodes changed event
        delete this.dispatch;
        this.dispatch('childNodesModified', this, { inserted: this.childNodes.map(function(node, index){ return { node: node, pos: index } }) });

        // restore childNodesElement
        container.appendChild(domFragment);
        target.childNodesElement = container;*/
      },

      destroy: function(){
        this.header.destroy();
        this.footer.destroy();

        this.inherit();
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
