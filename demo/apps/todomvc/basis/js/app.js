require('basis.app');
require('basis.ui');
require('basis.router');
require('basis.data.index');

//
// Import names
//

var Todo = require('app.type').Todo;


//
// Create app instance
//

module.exports = basis.app.create({
  // replace container with id="todoapp" by app root node element
  replace: 'todoapp',

  // init method invoke on document ready
  init: function(){
    // set up router
    basis.router.add(/^\/(active|completed)$/, {
      // Triggered every time when path starts to match the rule on change.
      // Analogy with onmouseenter 
      // No need to define it by default.
      enter: function(){
      },

      // Triggered every time when path changes and path matches the rule. 
      match: function(kind){
        Todo.selected.set(Todo[kind]);
      },

      // Triggered every time when path stops to match the rule on change.
      // Analogy with onmouseleave 
      leave: function(){
        Todo.selected.set(Todo.all);
      }
    });

    // start router
    basis.router.start();    

    // return app root node
    return new basis.ui.Node({
      template: resource('app/template/layout.tmpl'),
      binding: {
        // nested views
        form: resource('module/form/index.js'),
        list: resource('module/list/index.js'),
        stat: resource('module/stat/index.js'),

        // this is dynamic construction for !Todo.all.itemCount
        empty: basis.data.index.count(Todo.all).as(basis.bool.invert)
      }
    });
  }
});
