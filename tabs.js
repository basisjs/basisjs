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
    * @namespace Basis.Controls.Tabs
    */

    var namespace = 'Basis.Controls.Tabs';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;

    var cssClass = Basis.CSS.cssClass;
    var getter = Function.getter;

    var nsWrappers = DOM.Wrapper;

    var Template = Basis.Html.Template;
    var TmplNode = nsWrappers.TmplNode;
    var TmplContainer = nsWrappers.TmplContainer;

    var createEvent = Basis.EventObject.createEvent;

    //
    //  behaviour handlers
    //

    function baseSelectHandler(child){
      if (this.selection && !this.selection.itemCount)
        child.select();
    }

    function baseUnselectHandler(){
      if (this.selection && !this.selection.itemCount)
      {
        // select first non-disabled child
        var node = this.childNodes.search(false, 'disabled');
        if (node)
          node.select();
      }
    }

    //
    //  Pages Controls prototype
    //

   /**
    * @class
    */
    var AbstractTabsControl = Class(nsWrappers.TmplControl, {
      className: namespace + '.AbstractTabsControl',

      canHaveChildren: true,
      childClass: TmplNode,

      event_childEnabled: createEvent('childEnabled') && baseSelectHandler,
      event_childDisabled: createEvent('childDisabled') && baseUnselectHandler,
      event_childNodesModified: baseUnselectHandler,

      //
      //  common methods
      //
      item: function(indexOrName){
        var index = isNaN(indexOrName) ? this.indexOf(indexOrName) : parseInt(indexOrName);
        return index.between(0, this.childNodes.length - 1) ? this.childNodes[index] : null;
      },
      indexOf: function(objectOrName){
        // search for object
        if (objectOrName instanceof this.childClass)
          return this.childNodes.indexOf(objectOrName);

        // search by name
        if (this.childNodes.search(objectOrName, 'name'))
          return Array.lastSearchIndex;

        return -1;
      }
    });

    //
    // Tab node
    //

    function tabCaptionFormat(value){ 
      return value == null || value == '' ? '[no title]' : value;
    };

   /**
    * @class
    */
    var Tab = Class(TmplContainer, {
      className: namespace + '.Tab',

      canHaveChildren: false,

      event_disable: function(){ 
        TmplContainer.prototype.event_disable.call(this);

        this.unselect();
        if (this.document)
          //this.document.dispatch('childDisabled', this);
          this.document.event_childDisabled(this.document, this);
      },
      event_enable: function(){ 
        TmplContainer.prototype.event_enable.call(this);

        if (this.document)
          //this.document.dispatch('childEnabled', this);
          this.document.event_childEnabled(this.document, this);
      },
      event_update: function(node, delta){
        TmplContainer.prototype.event_update.call(this, node, delta);

        // set new title
        this.tmpl.titleText.nodeValue = tabCaptionFormat(this.titleGetter(this));
      },

      template: new Template(
        '<div{element|selectedElement} class="Basis-Tab" event-click="select">' +
          '<span class="Basis-Tab-Start"/>' +
          '<span class="Basis-Tab-Content">' +
            '<span class="Basis-Tab-Caption">' +
              '{titleText}' +
            '</span>' +
          '</span>' + 
          '<span class="Basis-Tab-End"/>' +
        '</div>' +
        '<div{content}/>'
      ),
      
      templateAction: function(actionName, event){
        if (actionName == 'select')
        {
          if (!this.isDisabled())
            this.select();
        }

        TmplContainer.prototype.templateAction.call(this, actionName, event);
      },

     /**
      * Using to fetch title value.
      * @property {function(node)}
      */
      titleGetter: getter('info.title'),
      
     /**
      * Using for tab default grouping.
      * @property {number}
      */
      groupId: 0
    });

    //
    // Tabs control
    //

   /**
    * @class
    */
    var TabsGroupingNode = Class(nsWrappers.TmplGroupingNode, {
      className: namespace + '.TabsGroupingNode',

      childClass: Class(nsWrappers.TmplPartitionNode, {
        className: namespace + '.TabsPartitionNode',

        template: new Template(
          '<div{element|content|childNodesElement} class="Basis-TabControl-TabGroup"></div>'
        )
      })
    });

   /**
    * @class
    */
    var TabControl = Class(AbstractTabsControl, {
      className: namespace + '.TabControl',

      childClass: Tab,
      localGroupingClass: TabsGroupingNode,

      template: new Template(
        '<div{element} class="Basis-TabControl">' +
          '<div class="Basis-TabControl-Start"/>' +
          '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
          '<div class="Basis-TabControl-End"/>' +
        '</div>'
      )
    });

    //
    //  Page Node
    //

   /**
    * @class
    */
    var Page = Class(TmplContainer, {
      className: namespace + '.Page',

      event_select: function(){
        cssClass(this.element).remove('Basis-Page-Hidden');
        TmplContainer.prototype.event_select.call(this);
      },
      event_unselect: function(){
        cssClass(this.element).add('Basis-Page-Hidden');
        TmplContainer.prototype.event_unselect.call(this);
      },
      
      template: new Template(
        '<div{element} class="Basis-Page Basis-Page-Hidden">' + 
          '<div{content|childNodesElement} class="Basis-Page-Content"/>' +
        '</div>'
      )
    });

    //
    //  Page Control
    //

   /**
    * @class
    */
    var PageControl = Class(AbstractTabsControl, {
      className: namespace + '.PageControl',

      childClass: Page,
      
      template: new Template(
        '<div{element|content|childNodesElement} class="Basis-PageControl"/>'
      )
    });

    //
    //  TabSheet Node
    //

   /**
    * @class
    */
    var TabSheet = Class(Tab, {
      className: namespace + '.TabSheet',

      canHaveChildren: true,
      childClass: TmplNode,

      event_select: function(){
        Tab.prototype.event_select.call(this);
        cssClass(this.tmpl.pageElement).remove('Basis-Page-Hidden');
      },
      event_unselect: function(){
        Tab.prototype.event_unselect.call(this);
        cssClass(this.tmpl.pageElement).add('Basis-Page-Hidden');
      },
      
      template: new Template(
        '<div{element|selectedElement} class="Basis-TabSheet" event-click="select">' +
          '<div{tabElement} class="Basis-Tab">' +
            '<span class="Basis-Tab-Start"/>' +
            '<span class="Basis-Tab-Content">' +
              '<span class="Basis-Tab-Caption">' +
                '{titleText}' +
              '</span>' +
            '</span>' + 
            '<span class="Basis-Tab-End"/>' +
          '</div>' +
          '<div{pageElement} class="Basis-Page Basis-Page-Hidden">' +
            '<div{content|pageContent|childNodesElement} class="Basis-Page-Content"/>' +
          '</div>' +
        '</div>'
      ),

      destroy: function(){
        DOM.remove(this.tmpl.pageElement);
        
        Tab.prototype.destroy.call(this);
      }
    });

    //
    // AccordionControl
    //

   /**
    * @class
    */
    var AccordionControl = Class(TabControl, {
      className: namespace + '.AccordionControl',

      childClass: TabSheet,
      
      template: new Template(
        '<div{element|content} class="Basis-AccordionControl">' +
          '<div{content|childNodesElement} class="Basis-AccordionControl-Content"/>' +
        '</div>'
      )
    });

    //
    //  TabSheetControl
    //

   /**
    * @class
    */
    var TabSheetControl = Class(TabControl, {
      className: namespace + '.TabSheetControl',

      childClass: TabSheet,
      
      template: new Template(
        '<div{element|content} class="Basis-TabSheetControl">' +
          '<div{tabsElement} class="Basis-TabControl">' +
            '<div class="Basis-TabControl-Start"/>' +
            '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
            '<div class="Basis-TabControl-End"/>' +
          '</div>' +
          '<div{pagesElement} class="Basis-PageControl"/>' +
        '</div>'
      ),

      insertBefore: function(newChild, refChild){
        if (newChild = TabControl.prototype.insertBefore.call(this, newChild, refChild))
        {
          if (this.tmpl.pagesElement)
            this.tmpl.pagesElement.insertBefore(newChild.tmpl.pageElement, this.nextSibling ? this.nextSibling.tmpl.pageElement : null)

          return newChild;
        }
      },
      removeChild: function(oldChild){
      	if (oldChild = TabControl.prototype.removeChild.call(this, oldChild))
        {
          if (this.tmpl.pagesElement)
            oldChild.element.appendChild(oldChild.tmpl.pageElement);

          return oldChild;
        }
      },
      clear: function(){
        // put pageElement back to TabSheet root element
        this.childNodes.forEach(function(tabsheet){
          tabsheet.element.appendChild(tabsheet.tmpl.pageElement);
        });

        TabControl.prototype.clear.call(this);
      }
    });

    //
    // 
    //

    Basis.namespace(namespace).extend({
      AbstractTabsControl: AbstractTabsControl,

      TabControl: TabControl,
      Tab: Tab,

      PageControl: PageControl,
      Page: Page,
      
      AccordionControl: AccordionControl,
      TabSheetControl: TabSheetControl,
      TabSheet: TabSheet
    });

  })();
