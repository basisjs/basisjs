var l10n = require('basis.l10n');
var router = require('basis.router');
var Node = require('basis.ui').Node;
var types = require('app.type');

// temporary here
l10n.setCultureList('en-US/ru-RU ru-RU');
l10n.setCulture('ru-RU');
l10n.enableMarkup = true;

var view;
module.exports = require('basis.app').create({
  init: function(){
    view = new Node({
      template: resource('./app/template/layout.tmpl'),

      delegate: router.route('*slide').param(0).as(function(slide){
        return slide && app.type.Slide.getSlot(slide);
      }),

      selection: {
        handler: {
          itemsChanged: function(){
            var selected = this.pick();
            if (selected && selected.lazyChildNodes)
            {
              selected.setChildNodes(selected.lazyChildNodes());
              selected.lazyChildNodes = null;
            }
          }
        }
      },
      childClass: {
        template: resource('./app/template/page.tmpl')
      },

      handler: {
        targetChanged: function(){
          this.getChildByName(this.target ? 'slide' : 'toc').select();
        }
      },

      childNodes: [
        {
          name: 'toc',
          selected: true,
          lazyChildNodes: resource('./module/toc/index.js')
        },
        {
          name: 'slide',
          autoDelegate: true,
          lazyChildNodes: resource('./module/slide/index.js')
        }
      ]
    });

    router.start();

    return view;
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
  var files = view.data.files ? view.data.files.getItems() : null;

  if (files)
    files.forEach(function(file){
      result[file.data.name] = file.data.content;
      if (file.data.updatable)
      {
        updatableFiles.push(file);
        file.addHandler(updatableHandler);
      }
    });

  return result;
};
