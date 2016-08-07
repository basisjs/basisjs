module.exports = require('api').define('app-profile', {
  getAppProfile: function(remote){
    var File = remote.File;
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
