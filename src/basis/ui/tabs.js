/*
  Basis javascript library 
  http://code.google.com/p/basis-js/
 
  @copyright
  Copyright (c) 2006-2012 Roman Dvornov.
 
  @license
  GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
*/

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/tabs.html
  * @namespace basis.ui.tabs
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var getter = Function.getter;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;


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
  var AbstractTabsControl = Class(UIContainer, {
    className: namespace + '.AbstractTabsControl',

    selection: true,
    childClass: UINode,

    autoSelectChild: true,

    event_childNodesModified: function(delta){
      findAndSelectActiveNode(this);
      UIContainer.prototype.event_childNodesModified.call(this, delta);
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

    unselectDisabled: true,
    event_disable: function(){
      if (this.unselectDisabled)
        this.unselect();

      UIContainer.prototype.event_disable.call(this);
    },

    template: resource('templates/tabs/Tab.tmpl'),

    binding: {
      title: 'data:'
    },

    action: {
      select: function(){
        if (!this.isDisabled())
          this.select();
      }
    }
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
      className: namespace + '.TabGroupingNode',
      childClass: {
        className: namespace + '.TabGroup',
        template: resource('templates/tabs/TabGroup.tmpl')
      }
    },

    template: resource('templates/tabs/TabControl.tmpl')
  });


  //
  // Page Node
  //

 /**
  * @class
  */
  var Page = Class(UIContainer, {
    className: namespace + '.Page',
    
    template: resource('templates/tabs/Page.tmpl')
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
    
    template: resource('templates/tabs/PageControl.tmpl')
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

    template: resource('templates/tabs/TabSheet.tmpl'),

    templateSync: function(noRecreate){
      var pageElement = this.tmpl.pageElement;
      Tab.prototype.templateSync.call(this, noRecreate);
      if (pageElement && this.tmpl.pageElement !== pageElement)
      {
        if (!this.tmpl.pageElement)
          DOM.remove(pageElement);
        else
          DOM.replace(pageElement, this.tmpl.pageElement)
      }
    },

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
    
    template: resource('templates/tabs/AccordionControl.tmpl')
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

    template: resource('templates/tabs/TabSheetControl.tmpl'),

    insertBefore: function(newChild, refChild){
      if (newChild = TabControl.prototype.insertBefore.call(this, newChild, refChild))
      {
        if (this.tmpl.pagesElement)
          this.tmpl.pagesElement.insertBefore(newChild.tmpl.pageElement, newChild.nextSibling ? newChild.nextSibling.tmpl.pageElement : null)
      }

      return newChild;
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

  module.exports = {
    AbstractTabsControl: AbstractTabsControl,

    TabControl: TabControl,
    Tab: Tab,

    PageControl: PageControl,
    Page: Page,
    
    AccordionControl: AccordionControl,
    TabSheetControl: TabSheetControl,
    TabSheet: TabSheet
  };
