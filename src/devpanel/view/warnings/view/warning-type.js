var Value = require('basis.data').Value;
var entity = require('basis.entity');
var AppProfile = require('./app-profile-type.js');
var DatasetWrapper = require('basis.data').DatasetWrapper;

function nullOrString(value){
  return typeof value == 'string' ? value : null;
}

var Warning = entity.createType({
  name: 'Warning',
  fields: {
    file: String,
    message: String,
    loc: function(value){
      if (Array.isArray(value))
        return value;
      if (value)
        return [value];
      return null;
    },
    theme: String,
    isolate: nullOrString,
    originator: nullOrString,
    fatal: Boolean
  }
});

var trigger = new DatasetWrapper({
  delegate: AppProfile(),
  handler: {
    update: function(sender, delta){
      if ('warns' in delta)
        Warning.all.set(this.data.warns || []);
    }
  }
});
Warning.all.setState(Value.state(AppProfile()));
Warning.all.setSyncAction(function(){
  trigger.setActive(true);
});

module.exports = Warning;
