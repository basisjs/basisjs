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

    var extend = Object.extend;
    var complete = Object.complete;
    var getter = Function.getter;
    var cssClass = Basis.CSS.cssClass;

    var nsWrappers = DOM.Wrapper;
    var STATE = Basis.Data.STATE;

    //
    // Main part
    //

   /**
    * @class Button
    */

    var Button = Class(nsWrappers.HtmlNode, {
      className: namespace + '.Button',

      template: new Template(
        '<div{element} class="Basis-Button">' + 
          '<div class="Basis-Button-Wraper">' +
            '<div class="Basis-Button-Wraper2">' +
              '<a{content} class="Basis-Button-Content" href="#">' + 
                '<em class="pre"/>' +
                '<span class="caption">{captionText}</span>' +
                '<em class="post"/>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>'
      ),

      behaviour: {
        select: function(){
          DOM.focus(this.content);
        }
      },

      captionGetter: getter('caption'),
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

        this.setCaption('caption' in config ? config.caption : this.caption);

        Event.addHandler(this.element, 'click', function(event){
          this.click();
          Event.kill(event);
        }, this);

        Event.addHandler(this.element, 'keydown', function(event){
          if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER, Event.KEY.SPACE].has(Event.key(event)))
          {
            this.click();
            Event.kill(event);
          }
        }, this);
      },
      click: function(){
        if (!this.isDisabled())
          this.dispatch('click');
      },
      setCaption: function(newCaption){
        this.caption = newCaption;
        this.captionText.nodeValue = this.captionGetter(this);
      },
      setTitle: function(caption){
        ;;;if (typeof console != 'undefined') console.warn("Button.setTitle is deprecated. Use Button.setCaption instead");
        return this.setCaption(caption);
      },
      destroy: function(){
        Event.clearHandlers(this.element);

        this.inherit();
      }
    });

   /**
    * @class ButtonGroupControl
    */
    var ButtonGroupControl = Class(nsWrappers.HtmlGroupControl, {
      className: namespace + '.ButtonGroupControl',
      childClass: Class(nsWrappers.HtmlPartitionNode, {
        className: namespace + '.ButtonPartitionNode',
        behaviour: {
          childNodesModified: function(node){
            for (var i = 0, child; child = this.childNodes[i]; i++)
            {
              cssClass(child.element)
                .bool('first', child == node.firstChild)
                .bool('last', child == node.lastChild);
            }
          }
        },
        template: new Template(
          '<div{element|content|childNodesElement} class="Basis-ButtonGroup"></div>'
        )
      })
    });

   /**
    * @class ButtonPanel
    */
    var ButtonPanel = Class(nsWrappers.HtmlControl, {
      className: namespace + '.ButtonPanel',

      template: new Template(
        '<div{element} class="Basis-ButtonPanel">' +
          '<div{childNodesElement|content|disabledElement} class="Basis-ButtonPanel-Content"/>' +
        '</div>'
      ),

      childClass: Button,

      groupControlClass: ButtonGroupControl,
      localGrouping: {
        groupGetter: getter('groupId || -object.eventObjectId')
      },

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
      ButtonGroupControl: ButtonGroupControl
    });

  })();
