module.exports = {
  name: 'parsePath',
  init: function(){
    var parsePath = basis.require('basis.router.ast').parsePath;
  },
  test: function(){
    // var ESCAPE_FOR_REGEXP = /([\/\\\(\)\[\]\?\{\}\|\*\+\-\.\^\$])/g;
    // escaped chars: /\()[]?{}|*+-.^$
  }
};
