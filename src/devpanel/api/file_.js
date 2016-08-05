module.exports = require('api').extend('file', {
  open: function(fileApi){
    return function(loc){
      fileApi.openFile(loc);
    };
  }
});
