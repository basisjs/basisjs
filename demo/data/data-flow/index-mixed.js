var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var Dataset = require('basis.data').Dataset;
var wrap = require('basis.data').wrap;
var count = require('basis.data.index').count;

var dataset = new Dataset({
  items: wrap([1, 2, 3, 4], true)
});
var countDataset = count(dataset);  // 1
var wrappedCount = new Value({ value: count(dataset) }).query('value');  // 2
var wrappedDataset = new basis.Token(dataset);

module.exports = new Expression(
  count(dataset, 'update', basis.fn.$true), // 3
  countDataset,
  wrappedCount,
  count(wrappedDataset), // 4
  function(a, b, c, d){
    return a + b + c + d;
  }
);
