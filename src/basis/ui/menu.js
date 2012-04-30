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

  basis.require('basis.dom.event');
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
  var Event = basis.dom.event;
  var getter = Function.getter;

  var DIR = basis.ui.popup.DIR;
  var Popup = basis.ui.popup.Popup;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // main part
  //

 /**
  * @class
  */
  var MenuItem = Class(UIContainer, {
    className: namespace + '.MenuItem',

    childClass: Class.SELF,

    template:
      '<div class="Basis-Menu-Item {selected} {disabled}" event-click="click">' +
        '<a{content} href="#"><span>{caption}</span></a>' +
      '</div>',

    binding: {
      caption: 'caption'
    },

    action: {
      click: function(event){
        this.click();
        Event.kill(event); // prevent default for <a>
      }
    },


    groupId: 0,
    caption: '[untitled]',

    handler: null,
    defaultHandler: function(node){
      if (this.parentNode)
        this.parentNode.defaultHandler(node);
    },

    setCaption: function(newCaption){
      this.caption = newCaption;
      this.updateBind('caption');
    },
    click: function(){
      if (!this.isDisabled() && !(this instanceof MenuItemSet))
      {
        if (this.handler)
          this.handler(this);
        else
          this.defaultHandler(this);
      }
    }
  });

 /**
  * @class
  */
  var MenuItemSet = Class(MenuItem, {
    className: namespace + '.MenuItemSet',

    template: 
      '<div class="Basis-Menu-ItemSet {selected} {disabled}"/>'
  });

 /**
  * @class
  */
  var MenuPartitionNode = Class(UIPartitionNode, {
    className: namespace + '.MenuPartitionNode',

    template:
      '<div class="Basis-Menu-ItemGroup">' +
        '<div{childNodesElement|content} class="Basis-Menu-ItemGroup-Content"></div>' +
      '</div>'
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

    defaultHandler: function(){
      this.hide();
    },

    template:
      '<div class="Basis-Menu popup-{orientation} {anim:visible} {selected} {disabled}">' +
        '<div{closeButton} class="Basis-Menu-CloseButton"><span>Close</span></div>' +
        '<div{content|childNodesElement} class="Basis-Menu-Content"/>' +
      '</div>'
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
