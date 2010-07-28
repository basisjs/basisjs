/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
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
    var Data = Basis.Data;
    var Template = Basis.Html.Template;

    var extend = Object.extend;
    var complete = Object.complete;

    var nsWrapers = DOM.Wrapers;
    var STATE = nsWrapers.STATE;
    var createBehaviour = nsWrapers.createBehaviour;

    //
    // Main part
    //

   /**
    * @class Button
    */

    var Button = Class(nsWrapers.HtmlNode, {
      className: namespace + '.Button',

      /*behaviour: createBehaviour(HtmlNode, {
        stateChanged: function(object, newState, oldState, errorText){
          this.inherit(object, newState, oldState, errorText);

          if (newState == STATE.READY)
            this.enable();
          else
            this.disable();
        }
        /*,
        disable: function(){
          this.inherit();
          this.element.setAttribute('tabindex', -1);
        },
        enable: function(){
          this.inherit();
          //delete this.element.tabindex;
          this.element.removeAttribute('tabindex');
        }*//*
      }),*/

      template: new Template(
        '<div{element} class="Basis-Button">' + 
          '<div class="Basis-Button-Wraper">' +
            '<div class="Basis-Button-Wraper2">' +
              '<a{content} class="Basis-Button-Content" href="#">' + 
                '<em class="pre"/>' +
                '<span class="caption">{titleText}</span>' +
                '<em class="post"/>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>'
      ),

      behaviour: createBehaviour(nsWrapers.HtmlNode, {
        select: function(){
          DOM.focus(this.content);
        }
      }),

      titleGetter: Data('caption'),
      caption: '[no title]',
      groupId: 0,
      name: null,

      init: function(config){
        var config = extend({}, config);

        // add default handlers
        var handlers = extend({}, config.handlers);
        if (config.handler)
          complete(handlers, { click: config.handler });
        if (Object.keys(handlers))
          config.handlers = handlers;
        else
          delete config.handlers;

        // inherit
        this.inherit(config);

        if (config.groupId)
          this.groupId = config.groupId;

        if (config.name)
          this.name = config.name;

        this.setTitle('caption' in config ? config.caption : this.caption);

        Event.addHandler(this.element, 'click', function(event){
          this.click();
          Event.kill(event);
        }, this);
      },
      click: function(){
        if (!this.isDisabled())
          this.dispatch('click');
      },
      setTitle: function(caption){
        this.caption = caption;
        this.titleText.nodeValue = this.titleGetter(this);
      },
      destroy: function(){
        Event.clearHandlers(this.element);

        this.inherit();
      }
    });

   /**
    * @class ButtonGroupControl
    */
    var ButtonGroupControl = Class(nsWrapers.HtmlGroupControl, {
      childClass: Class(nsWrapers.HtmlPartitionNode, {
        behaviour: createBehaviour(nsWrapers.HtmlPartitionNode, {
          childNodesModified: function(node){
            for (var i = 0, child; child = this.childNodes[i]; i++)
              Basis.CSS.cssClass(child.element)
                .bool('first', child == node.firstChild)
                .bool('last', child == node.lastChild);
          }
        }),
        template: new Template(
          '<div{element|content|childNodesElement} class="Basis-ButtonGroup"></div>'
        )
      })
    });

   /**
    * @class ButtonPanel
    */
    var ButtonPanel = Class(nsWrapers.HtmlControl, {
      className: namespace + '.ButtonPanel',

      template: new Template(
        '<div{element} class="Basis-ButtonPanel">' +
          '<div{childNodesElement|content|disabledElement} class="Basis-ButtonPanel-Content"/>' +
        '</div>'
      ),

      childClass: Button,

      groupControlClass: ButtonGroupControl,
      localGrouping: {
        groupGetter: Data('groupId || -object.eventObjectId')
      },

      getButtonByName: function(name){
        return this.childNodes.search(name, Data('name'));
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Button: Button,
      ButtonPanel: ButtonPanel,
      ButtonGroupControl: ButtonGroupControl
    });

  })();
