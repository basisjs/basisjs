var STATE = require('basis.data').STATE;
var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;

var bar = new DataObject({
  state: Value.factory('update', function(object){
    return object.data.foo > 0 ? STATE.READY : STATE.ERROR;
  }),
  data: {
    foo: 123
  }
});

module.exports = bar.stateRA_.source;
