module.exports = {
  open: function(){
    var File = require('type').File;
    return function(loc){
      File.open(basis.path.resolve(loc.replace(/(:\d+:\d+):\d+:\d+$/, '$1')));
    };
  },
  isOpenFileSupported: function(){
    var File = require('type').File;
    return function(){
      return File.openFileSupported;
    };
  }
};
