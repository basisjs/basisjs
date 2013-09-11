basis.require('basis.l10n');
basis.require('basis.app');
basis.require('basis.ui');
basis.require('basis.router');
basis.require('app.type');


basis.l10n.setCultureList('en-US/ru-RU ru-RU');
basis.l10n.setCulture('ru-RU'); // temporary here
basis.l10n.enableMarkup = true; // temporary here

var view;
module.exports = basis.app.create({
  init: function(){
    view = new basis.ui.Node({
      template: resource('app/template/layout.tmpl'),

      selection: true,
      childClass: {
        template: resource('app/template/page.tmpl'),
        emit_select: function(){
          basis.ui.Node.prototype.emit_select.call(this);

          if (this.lazyChildNodes)
          {
            this.setChildNodes(this.lazyChildNodes());
            this.lazyChildNodes = null;
          }
        }
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
          lazyChildNodes: resource('module/toc/index.js')
        },
        {
          name: 'slide',
          autoDelegate: true,
          lazyChildNodes: resource('module/slide/index.js')
        }
      ]
    });

    basis.router.add('*slide', function(slide){
      view.setDelegate(slide ? app.type.Slide.getSlot(slide) : null);
    });
    basis.router.start();

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
