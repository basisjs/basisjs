var DataObject = require('basis.data').Object;
var Value = require('basis.data').Value;

var target = new DataObject({
  target: true,
  data: {
    foo: 123
  }
});
var object = new DataObject({
  delegate: target
});

module.exports = Value.query(object, 'data.foo');
