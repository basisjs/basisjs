var Dataset = require('basis.data').Dataset;
var wrap = require('basis.data').wrap;
var sum = require('basis.data.index').sum;
var dataset = new Dataset({
  items: wrap([1, 2, 3, 4], true)
});

module.exports = sum(dataset, 'update', 'data.value');
