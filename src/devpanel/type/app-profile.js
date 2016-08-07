var STATE = require('basis.data').STATE;
var Value = require('basis.data').Value;
var DatasetWrapper = require('basis.data').DatasetWrapper;
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

AppProfile.linkDataset = function(property, dataset, fn){
  dataset.setActive(basis.PROXY);
  dataset.setState(Value.state(new DatasetWrapper({
    active: Value.from(dataset, 'active'),
    delegate: AppProfile()
  })));

  Value.query(AppProfile(), 'data.' + property)
    .as(function(value){
      return fn && value ? fn(value) : value;
    })
    .link(dataset, dataset.set);
};

module.exports = AppProfile;
