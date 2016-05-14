var Dataset = require('basis.data').Dataset;
var Subtract = require('basis.data.dataset').Subtract;
var wrap = require('basis.data').wrap;

module.exports = new Subtract({
  subtrahend: new Dataset({
    items: wrap([1, 2, 3, 4, 5], true)
  })
});
