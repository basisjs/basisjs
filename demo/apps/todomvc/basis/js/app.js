var router = require('basis.router');
var Node = require('basis.ui').Node;
var Todo = require('app.type').Todo;


//
// Create app instance
//

module.exports = require('basis.app').create({
  // replace container with id="todoapp" by app root node element
  replace: 'todoapp',

  // init method invoke on document ready
  init: function(){
    // set up router
    router.add(/^\/(active|completed)$/, {
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
    router.start();

    // return app root node
    return new Node({
      template: resource('./app/template/layout.tmpl'),
      binding: {
        // nested views
        form: resource('./module/form/index.js'),
        list: resource('./module/list/index.js'),
        stat: resource('./module/stat/index.js')
      }
    });
  }
});
