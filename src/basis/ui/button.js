/**
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  basis.require('basis.dom');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/button.html
  * @namespace basis.ui.button
  */

  var namespace = this.path;


  //
  // import names
  //

  var getter = Function.getter;
  var dom = basis.dom;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;


  //
  // main part
  //

 /**
  * @class
  */
  var Button = UINode.subclass({
    className: namespace + '.Button',

   /**
    * @inheritDoc
    */
    event_select: function(){
      UINode.prototype.event_select.call(this);
      this.focus();
    },

   /**
    * Group indificator, using for grouping.
    * @type {any}
    */
    groupId: 0,

   /**
    * Name of button. Using by parent to fetch child button by name.
    * @type {string}
    */
    name: null,

   /**
    * Button caption text.
    * @type {string}
    */
    caption: '[no caption]',

   /**
    * @inheritDoc
    */
    template:
      '<button{buttonElement} class="Basis-Button {selected} {disabled}" disabled="{disabled}" event-click="click">' +
        '<span class="Basis-Button-Back"/>' +
        '<span class="Basis-Button-Caption">' +
          '{caption}' +
        '</span>' +
      '</button>',

   /**
    * @inheritDoc
    */
    binding: {
      caption: 'caption'
    },

   /**
    * @inheritDoc
    */
    action: {
      click: function(event){
        if (!this.isDisabled())
          this.click();
      }
    },

   /**
    * Actions on click.
    */
    click: function(){},

   /**
    * Set new caption and update binding.
    * @param {string} newCaption
    */
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.updateBind('caption');
    },

   /**
    * Set focus for button.
    */
    focus: function(){
      dom.focus(this.tmpl.buttonElement || this.element);
    }
  });


 /**
  * @class
  */
  var ButtonPanel = UIContainer.subclass({
    className: namespace + '.ButtonPanel',

    template:
      '<div class="Basis-ButtonPanel {disabled}">' +
        '<div{childNodesElement|content} class="Basis-ButtonPanel-Content"/>' +
      '</div>',

    childClass: Button,

    groupingClass: {
      className: namespace + '.ButtonGroupingNode',

      groupGetter: function(button){
        return button.groupId || -button.eventObjectId;
      },

      childClass: {
        className: namespace + '.ButtonPartitionNode',

        template:
          '<div class="Basis-ButtonGroup"/>'
      }
    },

    grouping: {}, // use grouping by default

   /**
    * Fetch button by name.
    * @param {string} name Name value of button.
    * @return {basis.ui.button.Button}
    */
    getButtonByName: function(name){
      return this.childNodes.search(name, getter('name'));
    }
  });


  //
  // export names
  //

  module.exports = {
    Button: Button,
    ButtonPanel: ButtonPanel
  };
