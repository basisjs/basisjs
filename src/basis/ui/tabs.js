
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/tabs.html
  * @namespace basis.ui.tabs
  */

  var namespace = module.namespace;


  //
  // import names
  //

  var UINode = basis.ui.Node;


  //
  // main part
  //

  function findAndSelectActiveNode(){
    if (this.autoSelectChild && this.selection && !this.selection.itemCount)
    {
      // select first non-disabled child
      var node = basis.array.search(this.childNodes, false, 'disabled');
      if (node)
        node.select();
    }
  }

 /**
  * @class
  */
  var AbstractTabsControl = UINode.subclass({
    className: namespace + '.AbstractTabsControl',

    selection: true,
    autoSelectChild: true,

    childClass: UINode,

    emit_childNodesModified: function(delta){
      findAndSelectActiveNode.call(this);
      UINode.prototype.emit_childNodesModified.call(this, delta);
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
      if (basis.array.search(this.childNodes, item, 'name'))
        return this.childNodes.lastSearchIndex;

      return -1;
    }
  });


 /**
  * @class
  */
  var Tab = UINode.subclass({
    className: namespace + '.Tab',

    template: module.template('Tab'),
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
    emit_disable: function(){
      if (this.unselectDisabled)
        this.unselect();

      UINode.prototype.emit_disable.call(this);
    }
  });


 /**
  * @class
  */
  var TabControl = AbstractTabsControl.subclass({
    className: namespace + '.TabControl',

    template: module.template('TabControl'),

    childClass: Tab,

    groupingClass: {
      className: namespace + '.TabGroupingNode',

      childClass: {
        className: namespace + '.TabGroup',

        template: module.template('TabGroup')
      }
    }
  });


 /**
  * @class
  */
  var Page = UINode.subclass({
    className: namespace + '.Page',

    template: module.template('Page')
  });


 /**
  * @class
  */
  var PageControl = AbstractTabsControl.subclass({
    className: namespace + '.PageControl',

    template: module.template('PageControl'),

    childClass: Page
  });


 /**
  * @class
  */
  var TabSheet = Tab.subclass({
    className: namespace + '.TabSheet',

    template: module.template('TabSheet'),

    childClass: UINode
  });


 /**
  * @class
  */
  var TabSheetControl = TabControl.subclass({
    className: namespace + '.TabSheetControl',

    template: module.template('TabSheetControl'),

    childClass: TabSheet,

    satellite: {
      shadowPages: basis.ui.ShadowNodeList.subclass({
        className: namespace + '.ShadowPages',
        getChildNodesElement: function(host){
          return host.tmpl.pagesElement;
        },
        childClass: {
          className: namespace + '.ShadowPage',
          getElement: function(node){
            return node.tmpl.pageElement;
          }
        }
      })
    }
  });


 /**
  * @class
  */
  var AccordionControl = TabControl.subclass({
    className: namespace + '.AccordionControl',

    template: module.template('AccordionControl'),

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
