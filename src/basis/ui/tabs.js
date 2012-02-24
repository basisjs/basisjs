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

basis.require('basis.event');
basis.require('basis.dom');
basis.require('basis.dom.wrapper');
basis.require('basis.cssom');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @see ./demo/defile/tabs.html
  * @namespace basis.ui.tabs
  */

  var namespace = 'basis.ui.tabs';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var getter = Function.getter;
  var classList = basis.cssom.classList;
  var createEvent = basis.event.create;
  var events = basis.event.events;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

  function findAndSelectActiveNode(control){
    if (control.autoSelectChild && control.selection && !control.selection.itemCount)
    {
      // select first non-disabled child
      var node = control.childNodes.search(false, 'disabled');
      if (node)
        node.select();
    }
  }

 /**
  * @class
  */
  var AbstractTabsControl = Class(UIControl, {
    className: namespace + '.AbstractTabsControl',

    childClass: UINode,

    autoSelectChild: true,

    event_childNodesModified: function(node, delta){
      findAndSelectActiveNode(this);
      UIControl.prototype.event_childNodesModified.call(this, node, delta);
    },

    listen: {
      childNode: {
        enable: function(childNode){
          findAndSelectActiveNode(this);
        },
        disable: function(childNode){
          findAndSelectActiveNode(this);
        }
      }
    },

    //
    //  common methods
    //
    item: function(indexOrName){
      var index = isNaN(indexOrName) ? this.indexOf(indexOrName) : parseInt(indexOrName);
      return this.childNodes[index];
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
  // Tab
  //

 /**
  * @class
  */
  var Tab = Class(UIContainer, {
    className: namespace + '.Tab',

    childClass: null,

    event_disable: function(node){
      this.unselect();
      UIContainer.prototype.event_disable.call(this, node);
    },

    template: 
      '<div class="Basis-Tab {selected} {disabled}" event-click="select">' +
        '<span class="Basis-Tab-Start"/>' +
        '<span class="Basis-Tab-Content">' +
          '<span class="Basis-Tab-Caption">' +
            '{titleText}' +
          '</span>' +
        '</span>' + 
        '<span class="Basis-Tab-End"/>' +
      '</div>' +
      '<div{content}/>',

    templateUpdate: function(tmpl, eventName, delta){
      // set new title
      var title = this.titleGetter(this);
      tmpl.titleText.nodeValue = title == null || String(title) == '' ? '[no title]' : title;
    },
    
    action: {
      select: function(){
        if (!this.isDisabled())
          this.select();
      }
    },

   /**
    * Using to fetch title value.
    * @property {function(node)}
    */
    titleGetter: getter('data.title'),
    
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
  var TabControl = Class(AbstractTabsControl, {
    className: namespace + '.TabControl',

    childClass: Tab,
    groupingClass: {
      className: namespace + '.TabsGroupingNode',
      childClass: {
        className: namespace + '.TabsPartitionNode',
        template: 
          '<div class="Basis-TabControl-TabGroup {selected} {disabled}"/>'
      }
    },

    template: 
      '<div class="Basis-TabControl {selected} {disabled}">' +
        '<div class="Basis-TabControl-Start"/>' +
        '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
        '<div class="Basis-TabControl-End"/>' +
      '</div>'
  });


  //
  // Page Node
  //

 /**
  * @class
  */
  var Page = Class(UIContainer, {
    className: namespace + '.Page',

    event_select: function(node){
      classList(this.element).remove('Basis-Page-Hidden');
      UIContainer.prototype.event_select.call(this, node);
    },
    event_unselect: function(node){
      classList(this.element).add('Basis-Page-Hidden');
      UIContainer.prototype.event_unselect.call(this, node);
    },
    
    template: 
      '<div class="Basis-Page Basis-Page-Hidden {selected} {disabled}">' + 
        '<div{content|childNodesElement} class="Basis-Page-Content"/>' +
      '</div>'
  });


  //
  // Page Control
  //

 /**
  * @class
  */
  var PageControl = Class(AbstractTabsControl, {
    className: namespace + '.PageControl',

    childClass: Page,
    
    template: 
      '<div class="Basis-PageControl {selected} {disabled}"/>'
  });


  //
  // TabSheet Node
  //

 /**
  * @class
  */
  var TabSheet = Class(Tab, {
    className: namespace + '.TabSheet',

    childClass: UINode,

    event_select: function(node){
      Tab.prototype.event_select.call(this, node);
      classList(this.tmpl.pageElement).remove('Basis-Page-Hidden');
    },
    event_unselect: function(node){
      Tab.prototype.event_unselect.call(this, node);
      classList(this.tmpl.pageElement).add('Basis-Page-Hidden');
    },
    
    template: 
      '<div class="Basis-TabSheet {selected} {disabled}" event-click="select">' +
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
      '</div>',

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
    
    template: 
      '<div class="Basis-AccordionControl {selected} {disabled}">' +
        '<div{content|childNodesElement} class="Basis-AccordionControl-Content"/>' +
      '</div>'
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
    
    template: 
      '<div class="Basis-TabSheetControl {selected} {disabled}">' +
        '<div{tabsElement} class="Basis-TabControl">' +
          '<div class="Basis-TabControl-Start"/>' +
          '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
          '<div class="Basis-TabControl-End"/>' +
        '</div>' +
        '<div{pagesElement} class="Basis-PageControl"/>' +
      '</div>',

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
    clear: function(keepAlive){
      // put pageElement back to TabSheet root element
      this.childNodes.forEach(function(tabsheet){
        tabsheet.element.appendChild(tabsheet.tmpl.pageElement);
      });

      TabControl.prototype.clear.call(this, keepAlive);
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    AbstractTabsControl: AbstractTabsControl,

    TabControl: TabControl,
    Tab: Tab,

    PageControl: PageControl,
    Page: Page,
    
    AccordionControl: AccordionControl,
    TabSheetControl: TabSheetControl,
    TabSheet: TabSheet
  });

}(basis);
