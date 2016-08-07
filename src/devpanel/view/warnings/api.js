module.exports = require('api').define('app-profile', {
  getAppProfile: function(){
    var File = require('../../basisjs-tools-sync.js').File;
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
