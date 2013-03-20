basis.require('basis.app');
basis.require('basis.ui');
basis.require('basis.router');
basis.require('app.type');


var view;
module.exports = basis.app({
  init: function(){
    view = new basis.ui.Node({
      template: resource('app/template/layout.tmpl'),

      selection: true,
      childClass: {
        template: resource('app/template/page.tmpl'),
        event_select: function(){
          basis.ui.Node.prototype.event_select.call(this);

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

    return view.element;
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

  var res = {};
  (view.data.files ? view.data.files.getItems() : []).forEach(function(file){
    res[file.data.name] = file.data.content;
    if (file.data.updatable)
    {
      updatableFiles.push(file);
      file.addHandler(updatableHandler);
    }
  });
  return res;
};
