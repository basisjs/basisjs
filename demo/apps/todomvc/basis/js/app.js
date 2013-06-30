basis.require('basis.app');
basis.require('basis.ui');
basis.require('basis.router');
basis.require('basis.data.index');
basis.require('app.type');

module.exports = basis.app({
  replace: 'todoapp',

  init: function(){
    var application = new basis.ui.Node({
      delegate: app.type.Todo.all,
      template: resource('app/template/layout.tmpl'),
      binding: {
        form: resource('module/form/index.js').fetch(),
        list: resource('module/list/index.js').fetch(),
        stat: resource('module/stat/index.js').fetch(),
        empty: 'empty'
      }
    });

    basis.data.index.count(app.type.Todo.all).addLink(application, function(value){
      this.empty = value == 0;
      this.updateBind('empty');
    });

    basis.router.add(/^\/(active|completed)$/, {
      match: function(kind){
        application.setDelegate(app.type.Todo[kind]);
      },
      leave: function(){
        application.setDelegate(app.type.Todo.all);
      }
    });
    basis.router.start();

    return application.element;
  }
});
