var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;

var object = new DataObject({
  data: {
    foo: 1,
    bar: 2
  }
});

module.exports = Value.query('data.foo').compute('update', function(object, value){
  return object.data.bar + value;
})(object);
