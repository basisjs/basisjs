var l10n = require('basis.l10n');
var router = require('basis.router');
var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var Slide = require('./type/index.js').Slide;

// temporary here
l10n.setCultureList('en-US/ru-RU ru-RU');
l10n.setCulture('ru-RU');

Slide.linkWithResource(basis.resource('./slide/index.json'));

var selectedSlide = router.route('*slide').param(0).as(function(slide){
  return slide && Slide.getSlot(slide);
});

module.exports = require('basis.app').create({
  init: function(){
    return new Node({
      template: resource('./template/layout.tmpl'),
      binding: {
        content: 'satellite:'
      },

      satellite: {
        content: {
          delegate: selectedSlide,
          instance: selectedSlide.as(function(slide){
            return slide
              ? resource('./module/slide/index.js')
              : resource('./module/toc/index.js');
          })
        }
      }
    });
  }
});
