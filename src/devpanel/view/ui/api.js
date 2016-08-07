module.exports = require('api').define('ui', {
  init: function(data){
    return function(){
      data.input.set(data.init());
    };
  },
  hover: function(){
    var overlay = basis.resource.buildCloak(__dirname + '/data/overlay.js').fetch();
    return function(id){
      overlay.set(id);
    };
  }
});
