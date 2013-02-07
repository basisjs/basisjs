
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

  var getter = basis.getter;

  var Class = basis.Class;
  var DOM = basis.dom;

  var UINode = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    TabControl: resource('templates/tabs/TabControl.tmpl'),
    TabGroup: resource('templates/tabs/TabGroup.tmpl'),
    Tab: resource('templates/tabs/Tab.tmpl'),

    PageControl: resource('templates/tabs/PageControl.tmpl'),
    Page: resource('templates/tabs/Page.tmpl'),

    TabSheetControl: resource('templates/tabs/TabSheetControl.tmpl'),
    TabSheet: resource('templates/tabs/TabSheet.tmpl'),
    AccordionControl: resource('templates/tabs/AccordionControl.tmpl')
  });


  //
  // main part
  //

  function findAndSelectActiveNode(){
    if (this.autoSelectChild && this.selection && !this.selection.itemCount)
    {
      // select first non-disabled child
      var node = this.childNodes.search(false, 'disabled');
      if (node)
        node.select();
    }
  }

 /**
  * @class
  */
  var AbstractTabsControl = Class(UINode, {
    className: namespace + '.AbstractTabsControl',

    selection: true,
    autoSelectChild: true,

    childClass: UINode,

    event_childNodesModified: function(delta){
      findAndSelectActiveNode.call(this);
      UINode.prototype.event_childNodesModified.call(this, delta);
    },

    listen: {
      childNode: {
        enable: findAndSelectActiveNode,
        disable: findAndSelectActiveNode
      }
    },

    //
    //  common methods
    //
    item: function(index){
      return this.childNodes[typeof index == 'number' ? index : this.indexOf(index)];
    },
    indexOf: function(item){
      // search for object
      if (item instanceof this.childClass)
        return this.childNodes.indexOf(item);

      // search by name
      if (this.childNodes.search(item, 'name'))
        return Array.lastSearchIndex;

      return -1;
    }
  });


 /**
  * @class
  */
  var Tab = Class(UINode, {
    className: namespace + '.Tab',

    template: templates.Tab,
    binding: {
      title: 'data:'
    },
    action: {
      select: function(){
        if (!this.isDisabled())
          this.select();
      }
    },

    childClass: null,

    unselectDisabled: true,
    event_disable: function(){
      if (this.unselectDisabled)
        this.unselect();

      UINode.prototype.event_disable.call(this);
    }
  });


 /**
  * @class
  */
  var TabControl = Class(AbstractTabsControl, {
    className: namespace + '.TabControl',

    template: templates.TabControl,

    childClass: Tab,

    groupingClass: {
      className: namespace + '.TabGroupingNode',

      childClass: {
        className: namespace + '.TabGroup',

        template: templates.TabGroup
      }
    }
  });


 /**
  * @class
  */
  var Page = Class(UINode, {
    className: namespace + '.Page',
    
    template: templates.Page
  });


 /**
  * @class
  */
  var PageControl = Class(AbstractTabsControl, {
    className: namespace + '.PageControl',
    
    template: templates.PageControl,

    childClass: Page
  });


 /**
  * @class
  */
  var TabSheet = Class(Tab, {
    className: namespace + '.TabSheet',

    template: templates.TabSheet,

    childClass: UINode,

    templateSync: function(noRecreate){
      var pageElement = this.tmpl.pageElement;
      Tab.prototype.templateSync.call(this, noRecreate);
      if (pageElement && this.tmpl.pageElement !== pageElement)
      {
        if (!this.tmpl.pageElement)
          DOM.remove(pageElement);
        else
          DOM.replace(pageElement, this.tmpl.pageElement);
      }
    },

    destroy: function(){
      DOM.remove(this.tmpl.pageElement);
      
      Tab.prototype.destroy.call(this);
    }
  });


 /**
  * @class
  */
  var TabSheetControl = Class(TabControl, {
    className: namespace + '.TabSheetControl',

    template: templates.TabSheetControl,

    childClass: TabSheet,

    insertBefore: function(newChild, refChild){
      if (newChild = TabControl.prototype.insertBefore.call(this, newChild, refChild))
      {
        if (this.tmpl.pagesElement)
          this.tmpl.pagesElement.insertBefore(newChild.tmpl.pageElement, newChild.nextSibling ? newChild.nextSibling.tmpl.pageElement : null);
      }

      return newChild;
    },
    removeChild: function(oldChild){
    	if (oldChild = TabControl.prototype.removeChild.call(this, oldChild))
      {
        if (this.tmpl.pagesElement)
          oldChild.element.appendChild(oldChild.tmpl.pageElement);
      }
      return oldChild;
    },
    clear: function(keepAlive){
      // put pageElement back to TabSheet root element
      this.childNodes.forEach(function(tabSheet){
        tabSheet.element.appendChild(tabSheet.tmpl.pageElement);
      });

      TabControl.prototype.clear.call(this, keepAlive);
    }
  });


 /**
  * @class
  */
  var AccordionControl = Class(TabControl, {
    className: namespace + '.AccordionControl',
    
    template: templates.AccordionControl,

    childClass: TabSheet
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
    
    TabSheetControl: TabSheetControl,
    AccordionControl: AccordionControl,
    TabSheet: TabSheet
  };
