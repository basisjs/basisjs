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

   /**
    * @namespace Basis.Controls.Button
    */

    var namespace = 'Basis.Controls.Button';

    // import names

    var Class = Basis.Class;
    var Event = Basis.Event;
    var DOM = Basis.DOM;
    var Template = Basis.Html.Template;

    var getter = Function.getter;
    var cssClass = Basis.CSS.cssClass;

    var nsWrappers = Basis.DOM.Wrapper;

    var TmplNode = nsWrappers.TmplNode;
    var TmplGroupingNode = nsWrappers.TmplGroupingNode;
    var TmplPartitionNode = nsWrappers.TmplPartitionNode;

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

      template: new Template(
        '<button{element|buttonElement} class="Basis-Button" event-click="click" event-keydown="keydown" event-mousedown="mousedown">' + 
          '<span class="Basis-Button-Back" />' +
          '<div class="Basis-Button-Caption">{captionText}</div>' +
        '</button>'
      ),

      templateAction: function(actionName, event){
        if (actionName == 'mousedown')
          this.leftButtonPressed_ = Event.mouseButton(event, Event.MOUSE_LEFT);

        if (actionName == 'click' && this.leftButtonPressed_)
          this.click();

        if (actionName == 'keydown' && [Event.KEY.ENTER, Event.KEY.CTRL_ENTER, Event.KEY.SPACE].has(Event.key(event)))
          this.click();


        TmplNode.prototype.templateAction.call(this, actionName, event);
      },

      click: function(){
        if (!this.isDisabled() && typeof this.handler == 'function')
          this.handler.call(this);
      },

      event_select: function(){
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
    var ButtonGrouping = Class(TmplGroupingNode, {
      className: namespace + '.ButtonGrouping',

      groupGetter: function(button){
        return button.groupId || -button.eventObjectId;
      },

      childClass: Class(TmplPartitionNode, {
        className: namespace + '.ButtonPartitionNode',

        template: new Template(
          '<div{element} class="Basis-ButtonGroup"></div>'
        )
      })
    });

   /**
    * @class
    */
    var ButtonPanel = Class(nsWrappers.TmplControl, {
      className: namespace + '.ButtonPanel',

      template: new Template(
        '<div{element} class="Basis-ButtonPanel">' +
          '<div{childNodesElement|content|disabledElement} class="Basis-ButtonPanel-Content"/>' +
        '</div>'
      ),

      childClass: Button,

      localGroupingClass: ButtonGrouping,
      localGrouping: {},

      getButtonByName: function(name){
        return this.childNodes.search(name, getter('name'));
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Button: Button,
      ButtonPanel: ButtonPanel,
      ButtonGrouping: ButtonGrouping
    });

  })();
