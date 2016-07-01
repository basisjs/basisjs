var Dataset = require('basis.data').Dataset;
var wrap = require('basis.data').wrap;

module.exports = new Dataset({
  items: wrap([1, 2], true)
});
