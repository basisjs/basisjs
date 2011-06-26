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
    * @link ./demo/common/match.html
    * @link ./demo/common/grouping.html
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

    var nsWrappers = DOM.Wrapper;
    var TmplNode = nsWrappers.TmplNode;
    var TmplContainer = nsWrappers.TmplContainer;
    var TmplControl = nsWrappers.TmplControl;
    var TmplPartitionNode = nsWrappers.TmplPartitionNode;
    var TmplGroupingNode = nsWrappers.TmplGroupingNode;

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

    var HeaderCell = Class(TmplNode, {
      className: namespace + '.HeaderCell',

      sorting: null,
      defaultOrder: false,
      groupId: 0,

      template: new Template(
        '<th{element|selected} class="Basis-Table-Header-Cell" event-click="click">' +
          '<div class="Basis-Table-Sort-Direction"/>' +
          '<div class="Basis-Table-Header-Cell-Content">' + 
            '<span{content} class="Basis-Table-Header-Cell-Title"/>' +
          '</div>' +
        '</th>'
      ),

      templateAction: function(actionName, event){
        if (actionName == 'click')
        {
          if (this.selected)
          {
            if (this.owner)
              this.owner.setLocalSorting(this.owner.localSorting, !this.owner.localSortingDesc);
          }
          else
            this.select();         
        }

        TmplNode.prototype.templateAction.call(this, actionName, event);
      },

      init: function(config){
        this.selectable = !!this.sorting;
        
        TmplNode.prototype.init.call(this, config);

        //DOM.insert(this.content, config.content || '');
        
        if (this.sorting)
        {
          this.defaultOrder = this.defaultOrder == 'desc';

          cssClass(this.element).add(HEADERCELL_CSS_SORTABLE);
        }
      },
      select: function(){
        if (!this.selected)
          this.order = this.defaultOrder;

        TmplNode.prototype.select.call(this);
      }
    });

   /**
    * @class
    */
    var Header = Class(TmplContainer, {
      className: namespace + '.Header',

      childClass: HeaderCell,

      localGroupingClass: Class(TmplGroupingNode, {
        className: namespace + '.HeaderGroupingNode',

        childClass: Class(TmplPartitionNode, {
          className: namespace + '.HeaderPartitionNode',

          event_childNodesModified: function(){
            this.element.colSpan = this.childNodes.length;
          },

          template: new Template(
            '<th{element|selected} class="Basis-Table-Header-Cell">' +
              '<div class="Basis-Table-Sort-Direction" />' +
              '<div class="Basis-Table-Header-Cell-Content">' + 
                '<span{content} class="Basis-Table-Header-Cell-Title">{titleText}</span>' +
              '</div>' +
            '</th>'
          )
        })
      }),

      template: new Template(
        '<thead{element} class="Basis-Table-Header">' +
          '<tr{groupsElement} class="Basis-Table-Header-GroupContent" />' +
          '<tr{childNodesElement|content} />' +
        '</thead>'
      ),

      init: function(config){
        this.selection = {
          owner: this,
          event_datasetChanged: function(dataset, delta){
            this.constructor.prototype.event_datasetChanged.call(this, dataset, delta);

            var cell = this.pick();
            if (cell && this.owner.owner)
              this.owner.owner.setLocalSorting(cell.sorting, cell.order);
          }
        };

        TmplContainer.prototype.init.call(this, config);

        this.applyConfig_(this.structure)

        // add event handlers
        if (this.owner)
        {
          this.owner.addHandler({
            localSortingChanged: function(owner){
              var cell = this.childNodes.search(owner.localSorting, 'sorting');
              if (cell)
              {
                cell.select();
                cell.order = owner.localSortingDesc;
                cssClass(this.tmpl.content).bool(HEADERCELL_CSS_SORTDESC, cell.order);
              }
              else
                this.selection.clear();
            }
          }, this);
        }
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
        this.owner = null;

        TmplContainer.prototype.destroy.call(this);
      }
    });

    //
    // Table Footer
    //

   /**
    * @class
    */

    var FooterCell = Class(TmplNode, {
      className: namespace + '.FooterCell',

      colSpan: 1,

      template: new Template(
        '<td{element} class="Basis-Table-Footer-Cell">' +
          '<div{content}>\xA0</div>' +
        '</td>'
      ),

      setColSpan: function(colSpan){
        this.element.colSpan = this.colSpan = colSpan || 1;
      }
    });

   /**
    * @class
    */
    var Footer = Class(TmplContainer, {
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
        TmplContainer.prototype.init.call(this, config);

        this.applyConfig_(this.structure);

        if (this.useFooter)
          DOM.insert(this.container || this.owner.element, this.element, 1);
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

              if (typeof content == 'function')
                content = content.call(this);
                
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

    var Row = Class(TmplNode, {
      className: namespace + '.Row',
      
      canHaveChildren: false,

      repaintCount: 0,
      getters: [],
      classNames: [],

      template: new Template(
        '<tr{element} class="Basis-Table-Row" event-click="select">' +
          '<!--{cells}-->' +
        '</tr>'
      ),

      templateAction: function(actionName, event){
        if (actionName == 'select')
          this.select(Event(event).ctrlKey);
      },

      event_update: function(object, delta){
        TmplNode.prototype.event_update.call(this, object, delta);
        this.repaint();
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
    var Body = Class(TmplPartitionNode, {
      className: namespace + '.Body',

      template: new Template(
        '<tbody{element} class="Basis-Table-Body" event-click="click">' +
          '<tr class="Basis-Table-GroupHeader">' +
            '<td{content} colspan="100"><span class="expander"/>{titleText}</td>'+ 
          '</tr>' +
          '<!-- {childNodesHere} -->' +
        '</tbody>'
      ),

      templateAction: function(actionName, event){
        if (actionName == 'click')
          cssClass(this.element).toggle('collapsed');

        TmplPartitionNode.prototype.templateAction.call(this, actionName, event);
      }
    });
    
   /**
    * @class
    */
    var Table = Class(TmplControl, {
      className: namespace + '.Table',
      
      canHaveChildren: true,
      childClass: Row,

      localGroupingClass: Class(TmplGroupingNode, {
        className: namespace + '.TableGroupingNode',
        childClass: Body
      }),

      template: new Template(
        '<table{element|groupsElement} class="Basis-Table" cellspacing="0" event-click="click">' +
          '<!-- {headerElement} -->' +
          '<tbody{content|childNodesElement} class="Basis-Table-Body"></tbody>' +
          '<!-- {footerElement} -->' +
        '</table>'
      ),

      templateAction: function(actionName, event){
        TmplControl.prototype.templateAction.call(this, actionName, event);
      },

      //canHaveChildren: false,

      init: function(config){

        this.applyConfig_(this.structure);

        TmplControl.prototype.init.call(this, config);

        var headerConfig = this.header;
        var footerConfig = this.footer;

        this.header = new Header(Object.extend({ owner: this, structure: this.structure }, headerConfig));
        this.footer = new Footer(Object.extend({ owner: this, structure: this.structure }, footerConfig));

        DOM.replace(this.tmpl.headerElement, this.header.element);
      
        if (!this.localSorting && this.structure && this.structure.search(true, function(item){ return item.sorting && ('autosorting' in item) }))
        {
          var col = this.structure[Array.lastSearchIndex];
          this.setLocalSorting(col.sorting, col.defaultOrder == 'desc');
        }

        // add event handlers
        /*this.addEventListener('click');
        this.addEventListener('contextmenu', 'contextmenu', true);*/
      },

      applyConfig_: function(structure){
        if (structure)
        {
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
            //behaviour: config.rowBehaviour,
            satelliteConfig: this.rowSatellite,
            template: new Template(Row.prototype.template.source.replace('<!--{cells}-->', template)),
            updaters: updaters
          });

          if (this.rowBehaviour)
          {
            for (var eventName in this.rowBehaviour){
              this.childClass[eventName] = function(){
                this.rowBehaviour[eventName].apply(this, arguments);
                Row.prototype[eventName].apply(this, arguments);
              }
            }
          }

        }
      },

      loadData: function(items){
        this.setChildNodes(items.map(Function.wrapper('info')))
      },

      destroy: function(){
        TmplControl.prototype.destroy.call(this);

        this.header.destroy();
        this.header = null;

        this.footer.destroy();
        this.footer = null;
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
