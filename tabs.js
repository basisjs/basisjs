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

    // namespace

    var namespace = 'Basis.Controls.Tabs';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Data = Basis.Data;

    var Template = Basis.Html.Template;

    var nsWrapers = DOM.Wrapers;
    var createBehaviour = nsWrapers.createBehaviour;

    //
    //  behaviour handlers
    //

    function baseSelectHandler(child){
      if (this.selection && !this.selection.items.length)
        child.select();
    }

    function baseUnselectHandler(){
      if (this.selection && !this.selection.items.length)
      {
        var node = this.childNodes.search(false, 'isDisabled()');
        if (node)
          node.select();
      }
    }

    //
    //  Pages Controls prototype
    //

    var AbstractTabsControl = Class(nsWrapers.HtmlControl, {
      className: namespace + '.AbstractTabsControl',

      canHaveChildren: true,
      childClass: nsWrapers.HtmlNode,

      behaviour: createBehaviour(nsWrapers.HtmlControl, {
        childEnabled: baseSelectHandler,
        childDisabled: baseUnselectHandler,
        childNodesModified: baseUnselectHandler
      }),

      //
      //  common methods
      //
      item: function(indexOrName){
        var index = isNaN(indexOrName) ? this.indexOf(indexOrName) : parseInt(indexOrName);
        return index.between(0, this.childNodes.length - 1) ? this.childNodes[index] : null;
      },
      indexOf: function(objectOrName){
        // search for object
        if (objectOrName instanceof this.childClass)
          return this.childNodes.indexOf(objectOrName);

        // search by name
        if (this.childNodes.search(objectOrName, 'name'))
          return Array.lastSearchIndex;

        return -1;
      }
    });

    //
    // Tab node
    //

    function tabCaptionFormat(value){ 
      return value == null || value == '' ? '[no title]' : value;
    };

    var Tab = Class(nsWrapers.HtmlNode, {
      className: namespace + '.Tab',

      canHaveChildren: false,

      behaviour: createBehaviour(nsWrapers.HtmlNode, { 
        disable: function(){ 
          this.inherit();

          if (this.document)
            this.document.dispatch('childDisabled', this);
        },
        enable: function(){ 
          this.inherit();

          if (this.document)
            this.document.dispatch('childEnabled', this);
        },
        click: function(event){
          this.select();
        },
        update: function(node, newInfo, oldInfo, delta){
          this.inherit(node, newInfo, oldInfo, delta);

          var title = this.titleGetter(this);
          if (title !== this._title)
            // set new title
            this.titleText.nodeValue = tabCaptionFormat(this._title = title);
        }
      }),

      template: new Template(
        '<div{element|selectedElement} class="Basis-Tab">' +
          '<span class="Basis-Tab-Start"/>' +
          '<span class="Basis-Tab-Content">' +
            '<span{content} class="Basis-Tab-Caption">' +
              '{titleText}' +
            '</span>' +
          '</span>' + 
          '<span class="Basis-Tab-End"/>' +
        '</div>'
      ),

     /**
      * Using to fetch title value.
      * @property {function(node)}
      */
      titleGetter: Data.getter('info.title'),
      
     /**
      * Using for tab default grouping.
      * @property {number}
      */
      groupId: 0,

      init: function(config){
        // create node
        config = this.inherit(config);

        // add name if exists
        if (config.name != '')
          this.name = config.name;

        // add groupId if exists
        if (config.groupId != '')
          this.groupId = config.groupId;

        // return config object
        return config;
      }
    });

    //
    // Tabs control
    //

    var TabsGroupControl = Class(nsWrapers.HtmlGroupControl, {
      childClass: Class(nsWrapers.HtmlPartitionNode, {
        template: new Template(
          '<div{element|content|childNodesElement} class="Basis-TabControl-TabGroup"></div>'
        )
      })
    });

    var TabControl = Class(AbstractTabsControl, {
      className: namespace + '.TabControl',

      childClass: Tab,
      groupControlClass: TabsGroupControl,

      template: new Template(
        '<div{element} class="Basis-TabControl">' +
          '<div class="Basis-TabControl-Start"/>' +
          '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
          '<div class="Basis-TabControl-End"/>' +
        '</div>'
      ),

      init: function(config){
        // create control
        config = this.inherit(config);

        // add event listners
        this.addEventListener('click');

        return config;
      }

      /* no custom destructor actions */

    });

    //
    //  Page Node
    //

    var Page = Class(nsWrapers.HtmlContainer, {
      className: namespace + '.Page',

      canHaveChildren: true,

      behaviour: createBehaviour(nsWrapers.HtmlContainer, { 
        select: function(){
          DOM.display(this.element, true);
          this.inherit();
        },
        unselect: function(){
          DOM.display(this.element, false);
          this.inherit();
        }
      }),
      
      template: new Template(
        '<div{element} class="Basis-Page" style="display: none">' + 
          '<div{content|childNodesElement} class="Basis-Page-Content"/>' +
        '</div>'
      ),

      init: function(config){
        config = this.inherit(config);
        
        // add name if exists
        if (config.name != '')
          this.name = config.name;

        return config;
      }
    });

    //
    //  Page Control
    //

    var PageControl = Class(AbstractTabsControl, {
      className: namespace + '.PageControl',

      childClass: Page,
      
      template: new Template(
        '<div{element|content|childNodesElement} class="Basis-PageControl"/>'
      )
    });

    //
    //  TabSheet Node
    //

    var TabSheet = Class(Tab, {
      className: namespace + '.TabSheet',

      canHaveChildren: true,
      childClass: nsWrapers.HtmlNode,
      childFactory: function(config){
        return new (this.childClass === nsWrapers.HtmlNode ? nsWrapers.HtmlPanel : this.childClass)(config);
      },

      behaviour: createBehaviour(Tab, {
        select: function(){
          this.inherit();
          DOM.display(this.pageElement, true);
        },
        unselect: function(){
          this.inherit();
          DOM.display(this.pageElement, false);
        }
      }),
      
      template: new Template(
        '<div{element|selectedElement} class="Basis-TabSheet">' +
          '<div{tabElement} class="Basis-Tab">' +
            '<span class="Basis-Tab-Start"/>' +
            '<span class="Basis-Tab-Content">' +
              '<span{content} class="Basis-Tab-Caption">' +
                '{titleText}' +
              '</span>' +
            '</span>' + 
            '<span class="Basis-Tab-End"/>' +
          '</div>' +
          '<div{pageElement} class="Basis-Page" style="display: none">' + 
            '<div{pageContent|childNodesElement} class="Basis-Page-Content"/>' +
          '</div>' +
        '</div>'
      ),

      init: function(config){
        config = this.inherit(config);

//        DOM.display(this.pageElement, false);

        if (config.content)
          DOM.insert(this.childNodesElement, config.content);

        return config;
      },
      destroy: function(){
        DOM.remove(this.pageElement);
        this.inherit();
      }
    });

    //
    // AccordionControl
    //

    var AccordionControl = Class(TabControl, {
      className: namespace + '.AccordionControl',

      childClass: TabSheet,
      
      template: new Template(
        '<div{element|content} class="Basis-AccordionControl">' +
          '<div{content|childNodesElement} class="Basis-AccordionControl-Content"/>' +
        '</div>'
      )
    });

    //
    //  TabSheetControl
    //

    var TabSheetControl = Class(TabControl, {
      className: namespace + '.TabSheetControl',

      childClass: TabSheet,
      
      template: new Template(
        '<div{element|content} class="Basis-TabSheetControl">' +
          '<div class="Basis-TabControl">' +
            '<div class="Basis-TabControl-Start"/>' +
            '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
            '<div class="Basis-TabControl-End"/>' +
          '</div>' +
          '<div{pagesElement} class="Basis-PageControl"/>' +
        '</div>'
      ),

      insertBefore: function(newChild, refChild){
        if (newChild = this.inherit(newChild, refChild))
        {
          if (this.pagesElement)
            this.pagesElement.insertBefore(newChild.pageElement, this.nextSibling ? this.nextSibling.pageElement : null)

          return newChild;
        }
      },
      removeChild: function(oldChild){
      	if (oldChild = this.inherit(oldChild))
        {
          if (this.pagesElement)
            oldChild.element.appendChild(oldChild.pageElement);

          return oldChild;
        }
      },
      clear: function(){
        // put pageElement back to TabSheet root element
        this.childNodes.forEach(function(tabsheet){
          tabsheet.element.appendChild(tabsheet.pageElement);
        });

        this.inherit();
      }
    });

    //
    // 
    //

    Basis.namespace(namespace).extend({
      AbstractTabsControl: AbstractTabsControl,

      TabControl: TabControl,
      Tab: Tab,

      PageControl: PageControl,
      Page: Page,
      
      AccordionControl: AccordionControl,
      TabSheetControl: TabSheetControl,
      TabSheet: TabSheet
    });

  })();
