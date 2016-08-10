module.exports = require('api').define('file', {
  open: function(File){
    return function(loc){
      File.open(basis.path.resolve(loc.replace(/(:\d+:\d+):\d+:\d+$/, '$1')));
    };
  }
});
