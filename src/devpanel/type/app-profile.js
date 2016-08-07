var STATE = require('basis.data').STATE;
var entity = require('basis.entity');
var api = require('api').ns('app');

var AppProfile = entity.createType({
  name: 'AppProfile',
  singleton: true,
  fields: {
    files: Array,
    links: Array,
    warns: Array,
    l10n: basis.fn.$self
  }
}).extendClass({
  syncAction: function(){
    this.setState(STATE.PROCESSING);
    api.getAppProfile(function(err, profile){
      if (err)
        return this.setState(STATE.ERROR, err);

      this.update(profile);
      this.setState(STATE.READY);
    }.bind(this));
  }
});

// api.output.link()

module.exports = AppProfile;
