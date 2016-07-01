var Dataset = require('basis.data').Dataset;
var Subtract = require('basis.data.dataset').Subtract;
var wrap = require('basis.data').wrap;
var items = wrap([1, 2, 3, 4, 5], true);

module.exports = new Subtract({
  minuend: new Dataset({ items: items.slice(0, 4) }),
  subtrahend: new Dataset({ items: [items[0], items[3], items[4]] })
});
