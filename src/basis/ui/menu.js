
 /**
  * @namespace basis.ui.menu
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var getter = basis.getter;

  var basisUi = require('basis.ui');
  var UINode = basisUi.Node;
  var UIPartitionNode = basisUi.PartitionNode;
  var UIGroupingNode = basisUi.GroupingNode;
  var basisUiPopup = require('basis.ui.popup');
  var DIR = basisUiPopup.DIR;
  var Popup = basisUiPopup.Popup;


  //
  // main part
  //

 /**
  * @class
  */
  var MenuItem = Class(UINode, {
    className: namespace + '.MenuItem',

    childClass: Class.SELF,

    template: module.template('MenuItem'),
    binding: {
      caption: 'caption'
    },
    action: {
      click: function(event){
        if (!this.isDisabled())
        {
          if (this.click)
            this.click();
          else
            this.defaultHandler(this);
        }
      }
    },

    defaultHandler: function(node){
      if (this.parentNode)
        this.parentNode.defaultHandler(node);
    },

    caption: '[untitled]',
    setCaption: function(caption){
      this.caption = caption;
      this.updateBind('caption');
    },

    click: null
  });

 /**
  * @class
  */
  var MenuItemSet = Class(MenuItem, {
    className: namespace + '.MenuItemSet',

    template: module.template('MenuItemSet')
  });

 /**
  * @class
  */
  var MenuPartitionNode = Class(UIPartitionNode, {
    className: namespace + '.PartitionNode',

    template: module.template('PartitionNode')
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

    template: module.template('Menu'),

    defaultDir: [DIR.LEFT, DIR.BOTTOM, DIR.LEFT, DIR.TOP].join(' '),

    childClass: MenuItem,

    groupingClass: MenuGroupingNode,
    grouping: getter('groupId'),

    defaultHandler: function(node){
      this.hide();
    }
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
