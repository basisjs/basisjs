var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;

var value = new Value({ value: 1 });
var object = new DataObject({
  data: {
    foo: 1
  }
});

module.exports = value.compute('update', function(object, value){
  return object.data.foo === value;
})(object);
