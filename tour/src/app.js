var l10n = require('basis.l10n');
var router = require('basis.router');
var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var Slide = require('app.type').Slide;

// temporary here
l10n.setCultureList('en-US/ru-RU ru-RU');
l10n.setCulture('ru-RU');

var view;
var selectedSlide = router.route('*slide').param(0).as(function(slide){
  return slide && Slide.getSlot(slide);
});

module.exports = require('basis.app').create({
  init: function(){
    return new Node({
      template: resource('./app/template/layout.tmpl'),
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


//
// launcher callback
//

var updateResourceFn;
var updatableFiles = [];
var updatableHandler = {
  update: function(sender, delta){
    if ('content' in delta)
      updateResourceFn(this.data.name, this.data.content);
  }
};

global.launcherCallback = function(fn){
  updateResourceFn = fn;
  updatableFiles.splice(0).forEach(function(file){
    file.removeHandler(updatableHandler);
  });

  var result = {};
  var slide = selectedSlide.value.root;
  var files = slide ? slide.data.files : null;

  if (files)
    files.getItems().forEach(function(file){
      result[file.data.name] = file.data.content;
      if (file.data.updatable)
      {
        updatableFiles.push(file);
        file.addHandler(updatableHandler);
      }
    });

  return result;
};
