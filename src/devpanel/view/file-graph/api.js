module.exports = require('api').define('graph', {
  init: function(data){
    return function(callback){
      callback(data.init());
    };
  }
});
