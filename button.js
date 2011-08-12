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

  'use strict';

 /**
  * @link ./demo/defile/button.html
  * @namespace Basis.Controls.Button
  */

  var namespace = 'Basis.Controls.Button';

  // import names

  var Class = Basis.Class;
  var Event = Basis.Event;
  var DOM = Basis.DOM;
  var Template = Basis.Html.Template;

  var getter = Function.getter;

  var nsWrapper = Basis.DOM.Wrapper;

  var TmplNode = nsWrapper.TmplNode;
  var TmplControl = nsWrapper.TmplControl;

  //
  // Main part
  //

 /**
  * @class
  */
  var Button = Class(TmplNode, {
    className: namespace + '.Button',

    captionGetter: getter('caption'),
    caption: '[no caption]',
    groupId: 0,
    name: null,

    template:
      '<button{buttonElement} class="Basis-Button" event-click="click">' +
        '<span class="Basis-Button-Back"/>' +
        '<div class="Basis-Button-Caption">{captionText}</div>' +
      '</button>',

    action: {
      click: function(event){
        if (!this.isDisabled())
          this.click();
      }
    },

   /**
    * Actions on click.
    */
    click: function(){
    },

    event_select: function(){
      TmplNode.prototype.event_select.call(this);
      DOM.focus(this.element);
    },
    event_disable: function(){
      TmplNode.prototype.event_disable.call(this);
      this.tmpl.buttonElement.disabled = true;
    },
    event_enable: function(){
      TmplNode.prototype.event_enable.call(this);
      this.tmpl.buttonElement.disabled = false;
    },

    init: function(config){
      ;;;if (typeof this.handler == 'function' && typeof console != 'undefined') console.warn(namespace + '.Button: this.handler must be an object. Use this.click instead.')

      // inherit
      TmplNode.prototype.init.call(this, config);

      //this.setCaption('caption' in config ? config.caption : this.caption);
      this.setCaption(this.caption);
    },
    setCaption: function(newCaption){
      this.caption = newCaption;
      this.tmpl.captionText.nodeValue = this.captionGetter(this);
    }
  });

 /**
  * @class
  */
  //var ButtonGrouping = Class(TmplGroupingNode, );

 /**
  * @class
  */
  var ButtonPanel = Class(TmplControl, {
    className: namespace + '.ButtonPanel',

    template:
      '<div class="Basis-ButtonPanel">' +
        '<div{childNodesElement|content} class="Basis-ButtonPanel-Content"/>' +
      '</div>',

    childClass: Button,
    getButtonByName: function(name){
      return this.childNodes.search(name, getter('name'));
    },

    localGrouping: {},
    localGroupingClass: {
      className: namespace + '.ButtonGroupingNode',

      groupGetter: function(button){
        return button.groupId || -button.eventObjectId;
      },

      childClass: {
        className: namespace + '.ButtonPartitionNode',

        template:
          '<div class="Basis-ButtonGroup"/>'
      }
    }
  });

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    Button: Button,
    ButtonPanel: ButtonPanel
  });

  // new naming

  Basis.namespace('basis.ui').extend({
    Button: Button,
    ButtonPanel: ButtonPanel
  });

})();
