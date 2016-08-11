var entity = require('basis.entity');

var Devtools = entity.createType({
  name: 'Devtools',
  singleton: true,
  fields: {
    session: function(value){
      return typeof value == 'string' ? value : null;
    },
    connected: Boolean,
    features: {
      type: Array,
      defValue: []
    }
  }
});

module.exports = Devtools;
