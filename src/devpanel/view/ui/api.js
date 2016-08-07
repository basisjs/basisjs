module.exports = require('api').define('ui', {
  init: function(data){
    return function(){
      data.input.set(data.init());
    };
  }
});
