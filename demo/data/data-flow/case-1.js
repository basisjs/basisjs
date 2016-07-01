var Dataset = require('basis.data').Dataset;
var Expression = require('basis.data.value').Expression;
var wrap = require('basis.data').wrap;
var count = require('basis.data.index').count;

var foo = new Dataset({
  items: wrap([1, 2, 3], true)
});
var bar = new Dataset({
  items: wrap([3, 4, 5], true)
});

module.exports = new Expression(
  count(foo),
  count(bar, 'update', function(item){
    return item.data.value % 2;
  }),
  function(a, b){
    return a + b;
  }
);
