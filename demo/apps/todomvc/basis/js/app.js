basis.require('basis.app');
basis.require('basis.ui');
basis.require('basis.router');
basis.require('basis.data.value');
basis.require('basis.data.index');
basis.require('app.type');

app.selectedDataset = new basis.data.value.Property(app.type.Todo.all);

module.exports = basis.app.create({
  replace: 'todoapp',

  init: function(){
    var layout = new basis.ui.Node({
      template: resource('app/template/layout.tmpl'),
      binding: {
        form: resource('module/form/index.js').fetch(),
        list: resource('module/list/index.js').fetch(),
        stat: resource('module/stat/index.js').fetch(),
        empty: basis.data.index.count(app.type.Todo.all).as(basis.bool.invert)
      }
    });

    basis.router.add(/^\/(active|completed)$/, {
      match: function(kind){
        app.selectedDataset.set(app.type.Todo[kind]);
      },
      leave: function(){
        app.selectedDataset.set(app.type.Todo.all);
      }
    });
    basis.router.start();

    return layout.element;
  }
});
