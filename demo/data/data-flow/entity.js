var entity = require('basis.entity');
var max = require('basis.data.index').max;
var Example = entity.createType('Example', {
  id: entity.IntId,
  name: String
});

['foo', 'bar', 'baz', 'qux'].forEach(function(name, idx){
  Example({
    id: idx + 1,
    name: name
  });
});

module.exports = max(Example.all, 'update', 'data.name');
