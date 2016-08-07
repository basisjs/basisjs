module.exports = require('api').define('ui', {
  init: function(data){
    return function(){
      data.input.set(data.init());
    };
  },
  hover: function(){
    var overlay = require('./data/overlay.js');
    return function(id){
      overlay.set(id);
    };
  }
});
