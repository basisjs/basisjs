module.exports = require('api').define('file', {
  open: function(fileApi){
    return function(loc){
      fileApi.openFile(loc);
    };
  }
});
