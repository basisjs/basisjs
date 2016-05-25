var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;

var satellite = new Node({
  selected: Value.query('owner.data.foo').as(function(foo){
    return foo > 0;
  })
});

var owner = new Node({
  satellite: {
    foo: satellite
  },
  data: {
    foo: 123
  }
});

module.exports = satellite.selectedRA_.source;
