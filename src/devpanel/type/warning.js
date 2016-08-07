var entity = require('basis.entity');
var AppProfile = require('./app-profile.js');

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

AppProfile.linkDataset('warns', Warning.all);

module.exports = Warning;
