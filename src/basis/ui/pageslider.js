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
 * Vladimir Ratsev <wuzykk@gmail.com>
 *
 */

basis.require('basis.dom');
basis.require('basis.cssom');
basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.ui.scroller');

!function(basis){

  'use strict';

 /**
  * @namespace Basis.Plugin
  */ 

  var namespace = 'basis.ui.pageslider';


  //
  // import names
  //

  var DOM = basis.dom;
  var Class = basis.Class;

  var classList = basis.cssom.classList;


  //
  // main part
  //
  
  var namespace = 'basis.ui';

  var PageSlider = Class(basis.ui.tabs.PageControl, {
    className: namespace + '.PageSlider',

    template: 
      '<div class="Basis-PageControl Basis-PageSlider">' +
        '<div/>' +
      '</div>',

    event_childNodesModified: function(){
      this.constructor.superClass_.prototype.event_childNodesModified.apply(this, arguments);

      /*this.pageSliderCssRule.setStyle({
        width: (100 / this.childNodes.length) + '%'
      });*/

      /*DOM.setStyle(this.element, {
        width: (100 * this.childNodes.length) + '%'
      });*/

      for (var i = 0, child; child = this.childNodes[i]; i++)
        basis.cssom.setStyle(child.element, { left: (100 * i) + '%' });
    },

    init: function(config){
      var cssClassName = 'gerericRule_' + this.eventObjectId;
      this.pageSliderCssRule = basis.cssom.cssRule('.' + cssClassName + ' > .Basis-Page');

      this.constructor.superClass_.prototype.init.call(this, config);

      classList(this.element).add(cssClassName);

      this.scroller = new basis.ui.Scroller({
        targetElement: this.element,
        preventScrollY: true,
        minScrollDelta: 10,
        handler: {
          startInertia: function(scroller){
            var selectedItem = this.selection.pick();
            if (selectedItem)
            {
              var slideToItem = selectedItem;
              if (scroller.currentDirectionX == 0 || 
                (scroller.currentDirectionX == 1 && scroller.viewportX < selectedItem.element.offsetLeft) || 
                (scroller.currentDirectionX == -1 && scroller.viewportX > selectedItem.element.offsetLeft)
              )
              {
                scroller.minScrollDeltaXReached = true;
                var slideToItemPosition = Math.round(scroller.viewportX / selectedItem.element.offsetWidth);
                slideToItem = this.childNodes[slideToItemPosition];
              }
              else
                slideToItem = scroller.currentDirectionX == 1 ? selectedItem.nextSibling : selectedItem.previousSibling;

              if (!slideToItem)
                slideToItem = selectedItem;

              if (slideToItem == selectedItem)
                this.slideToPage(selectedItem);
              else
                slideToItem.select();
            }

            scroller.currentVelocityX = 0;
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

      if (this.selection.itemCount)
      {
        var self = this;
        setTimeout(function(){
          self.slideToPage(self.selection.pick())
        }, 0);
      }
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


  //
  // export names
  //

  basis.namespace(namespace).extend({
    PageSlider: PageSlider
  });

}(basis);