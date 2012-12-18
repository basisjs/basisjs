
  basis.require('basis.ui');
  basis.require('basis.ui.popup');


 /**
  * @namespace basis.ui.menu
  */
  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var getter = Function.getter;

  var DIR = basis.ui.popup.DIR;
  var Popup = basis.ui.popup.Popup;

  var UINode = basis.ui.Node;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // main part
  //

 /**
  * @class
  */
  var MenuItem = Class(UINode, {
    className: namespace + '.MenuItem',

    childClass: Class.SELF,

    template: resource('templates/menu/MenuItem.tmpl'),

    binding: {
      caption: 'caption'
    },

    action: {
      click: function(event){
        if (!this.isDisabled() && !(this instanceof MenuItemSet))
        {
          if (this.click)
            this.click();
          else
            this.defaultHandler(this);
        }
      }
    },

    caption: '[untitled]',

    defaultHandler: function(node){
      if (this.parentNode)
        this.parentNode.defaultHandler(node);
    },

    setCaption: function(newCaption){
      this.caption = newCaption;
      this.updateBind('caption');
    },
    click: null
  });

 /**
  * @class
  */
  var MenuItemSet = Class(MenuItem, {
    className: namespace + '.MenuItemSet',

    template: resource('templates/menu/MenuItemSet.tmpl')
  });

 /**
  * @class
  */
  var MenuPartitionNode = Class(UIPartitionNode, {
    className: namespace + '.PartitionNode',

    template: resource('templates/menu/PartitionNode.tmpl')
  });

 /**
  * @class
  */
  var MenuGroupingNode = Class(UIGroupingNode, {
    className: namespace + '.MenuGroupingNode',
    childClass: MenuPartitionNode
  });

 /**
  * @class
  */
  var Menu = Class(Popup, {
    className: namespace + '.Menu',
    childClass: MenuItem,

    defaultDir: [DIR.LEFT, DIR.BOTTOM, DIR.LEFT, DIR.TOP].join(' '),
    subMenu: null,

    groupingClass: MenuGroupingNode,
    grouping: getter('groupId'),

    defaultHandler: function(node){
      this.hide();
    },

    template: resource('templates/menu/Menu.tmpl')
  });

  //
  // export names
  //

  module.exports = {
    Menu: Menu,
    MenuGroupingNode: MenuGroupingNode,
    MenuPartitionNode: MenuPartitionNode,
    MenuItem: MenuItem,
    MenuItemSet: MenuItemSet
  };
