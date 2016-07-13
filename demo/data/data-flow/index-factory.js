var Value = require('basis.data').Value;
var DataObject = require('basis.data').Object;
var Dataset = require('basis.data').Dataset;
var wrap = require('basis.data').wrap;
var sum = require('basis.data.index').sum;

var object = new DataObject({
  data: {
    foo: new Dataset({
      items: wrap([1, 2, 3, 4], true)
    })
  }
});
var indexFactory = sum(Value.query('data.foo'), 'update', 'data.value');

module.exports = indexFactory(object);
