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
      caption: '[no title]',
      groupId: 0,
      name: null,

      template: new Template(
        '<button{element|buttonElement} class="Basis-Button" event-click="click" event-keydown="keydown" event-mousedown="mousedown">' + 
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
        //var config = extend({}, config);

        // add default handlers
        /*var handlers = extend({}, config.handlers);

        if (config.handler)
          complete(handlers, { click: config.handler });

        if (Object.keys(handlers))
          config.handlers = handlers;
        else
          delete config.handlers;*/

        /*if (config.captionGetter)
          this.captionGetter = Function.getter(config.captionGetter);*/

        // inherit
        TmplNode.prototype.init.call(this, config);

        //this.setCaption('caption' in config ? config.caption : this.caption);
        this.setCaption(this.caption);

        /*Event.addHandlers(this.element, {
          click: function(event){
            this.click();
            Event.kill(event);
          },
          keydown: function(event){
            if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER, Event.KEY.SPACE].has(Event.key(event)))
            {
              this.click();
              Event.kill(event);
            }
          }
        }, this);*/
      },
      setCaption: function(newCaption){
        this.caption = newCaption;
        this.tmpl.captionText.nodeValue = this.captionGetter(this);
      }/*,
      destroy: function(){
        Event.clearHandlers(this.element);

        TmplNode.prototype.destroy.call(this);
      }*/
    });

   /**
    * @class
    */
    var ButtonGrouping = Class(TmplGroupingNode, {
      className: namespace + '.ButtonGrouping',

      groupGetter: getter('groupId || -object.eventObjectId'),

      childClass: Class(TmplPartitionNode, {
        className: namespace + '.ButtonPartitionNode',

        event_childNodesModified: function(node){
          for (var i = 0, child; child = this.nodes[i]; i++)
          {
            cssClass(child.element)
              .bool('first', child == node.first)
              .bool('last', child == node.last);
          }

          TmplPartitionNode.prototype.event_childNodesModified.call(this, node);
        },
        
        template: new Template(
          '<div{element|content|childNodesElement} class="Basis-ButtonGroup"></div>'
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
      localGrouping: {}, /*{
        groupGetter: getter('groupId || -object.eventObjectId')
      },*/

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
