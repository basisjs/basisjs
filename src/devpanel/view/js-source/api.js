module.exports = require('api').define('js-source', {
  setSourceFragment: function(){
    return function(loc){
      require('./index.js').set(loc);
    };
  }
});
