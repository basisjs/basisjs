basis.require('basis.app');
basis.require('basis.ui');
basis.require('basis.router');
basis.require('basis.data.index');
basis.require('app.type');

var Todo = app.type.Todo;

module.exports = basis.app.create({
  replace: 'todoapp',

  init: function(){
    // set up router
    basis.router.add(/^\/(active|completed)$/, {
      match: function(kind){
        this.set(Todo[kind]);
      },
      leave: function(){
        this.set(Todo.all);
      }
    }, Todo.selected);

    // start router
    basis.router.start();    

    // return app root node
    return new basis.ui.Node({
      template: resource('app/template/layout.tmpl'),
      binding: {
        form: resource('module/form/index.js').fetch(),
        list: resource('module/list/index.js').fetch(),
        stat: resource('module/stat/index.js').fetch(),
        empty: basis.data.index.count(Todo.all).as(basis.bool.invert)
      }
    });
  }
});
