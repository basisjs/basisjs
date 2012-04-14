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

  'use strict';

  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.html');
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

  var Class = basis.Class;
  var DOM = basis.dom;

  var UINode = basis.ui.Node;
  var UIControl = basis.ui.Control;


  //
  // main part
  //

 /**
  * @class
  */
  var Button = Class(UINode, {
    className: namespace + '.Button',

   /**
    * @inheritDoc
    */
    event_select: function(){
      UINode.prototype.event_select.call(this);
      DOM.focus(this.element);
    },

   /**
    * @inheritDoc
    */
    event_disable: function(){
      UINode.prototype.event_disable.call(this);
      this.tmpl.buttonElement.disabled = true;
    },

   /**
    * @inheritDoc
    */
    event_enable: function(){
      UINode.prototype.event_enable.call(this);
      this.tmpl.buttonElement.disabled = false;
    },

   /**
    * Button caption text.
    * @type {string}
    */
    caption: '[no caption]',

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
    * @inheritDoc
    */
    template:
      '<button{buttonElement} class="Basis-Button {selected} {disabled}" event-click="click">' +
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
    * @inheritDoc
    */
    init: function(config){
      ;;;if (typeof this.handler == 'function' && typeof console != 'undefined') console.warn(namespace + '.Button: this.handler must be an object. Use this.click instead.')

      // inherit
      UINode.prototype.init.call(this, config);
    },
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.tmpl.set('caption', this.binding.caption.getter(this));
    }
  });


 /**
  * @class
  */
  var ButtonPanel = Class(UIControl, {
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

  this.extend({
    Button: Button,
    ButtonPanel: ButtonPanel
  });
