/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 *
 * @author
 * Roman Dvornov <rdvornov@gmail.com>
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

(function(Basis){
 /**
  * @namespace Basis.Plugin
  */ 

  var DOM = Basis.DOM;
  var Class = Basis.Class;

  var classList = Basis.CSS.classList;
  
  var namespace = 'Basis.Plugin';

  var PageSlider = Class(Basis.Controls.Tabs.PageControl, {
    template: 
        '<div class="Basis-PageControl Basis-PageSlider"/>',

    event_childNodesModified: function(){
      this.constructor.superClass_.prototype.event_childNodesModified.apply(this, arguments);

      this.pageSliderCssRule.setStyle({
        width: (100/ this.childNodes.length) + '%'
      });

      DOM.setStyle(this.element, {
        width: (100 * this.childNodes.length) + '%'
      });
    },

    init: function(config){
      var cssClassName = 'gerericRule_' + this.eventObjectId;
      this.pageSliderCssRule = DOM.Style.cssRule('.' + cssClassName + ' > .Basis-Page');

      this.constructor.superClass_.prototype.init.call(this, config);

      classList(this.element).add(cssClassName);

      this.scroller = new Basis.Plugin.Scroller({
        targetElement: this.element,
        scrollProperty: 'left',
        handler: {
          startInertia: function(scroller){
            var selectedItem = this.selection.pick();
            if (selectedItem)
            {
              var slideToItem = selectedItem;
              if (scroller.currentDirection == 0)
              {
                var slideToItemPosition = Math.round(scroller.viewportPos / selectedItem.element.offsetWidth);
                slideToItem = this.childNodes[slideToItemPosition];
              }
              else
                slideToItem = scroller.currentDirection == 1 ? selectedItem.nextSibling : selectedItem.previousSibling;

              if (!slideToItem)
                slideToItem = selectedItem;

              if (slideToItem == selectedItem)
                this.slideToPage(selectedItem);
              else
                slideToItem.select();
            }

            scroller.currentVelocity = 0;
          }
        },
        handlerContext: this
      });

      this.selection.addHandler({
        datasetChanged: function(){
          var item = this.pick();
          if (item)
            item.parentNode.slideToPage(item);
        }
      });
    },

    slideToPage: function(page){
      this.scroller.setTargetPosition(page.element.offsetLeft);
    },

    destroy: function(){
      this.constructor.superClass_.prototype.init.call(this, config);

      DOM.Style.getStyleSheet().removeCssRule(this.pageSliderCssRule.rule);
      this.pageSliderCssRule = null;

      this.scroller.destroy();
    }
  });

  Basis.namespace(namespace).extend({
    PageSlider: PageSlider
  });

})(Basis);