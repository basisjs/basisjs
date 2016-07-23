var router = require('basis.router');
var Node = require('basis.ui').Node;
var Todo = require('app.type').Todo;

// Create app instance
require('basis.app').create({
  // replace container with id="todoapp" by app root node element
  replace: 'todoapp',

  // init method invoke on document ready
  init: function(){
    // set up router
    router.route(/^\/(active|completed)$/).param(0).as(function(subset){
      Todo.selected.set(Todo[subset || 'all']);
    });

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
