var STATE = require('basis.data').STATE;
var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;

var foo = new DataObject({
  state: STATE.READY
});
var bar = new DataObject({
  state: Value.state(foo)
});

module.exports = bar.stateRA_.source;
