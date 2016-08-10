module.exports = require('api').define('app', {
  getAppProfile: function(){
    var File = require('type').File;
    return function(callback){
      File.getAppProfile(function(err, profile){
        if (typeof profile == 'string')
          profile = JSON.parse(profile);

        if (typeof callback == 'function')
          callback(err, profile);
      });
    };
  }
});
