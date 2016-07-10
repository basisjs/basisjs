var Dataset = require('basis.data').Dataset;
var Split = require('basis.data.dataset').Split;
var wrap = require('basis.data').wrap;

module.exports = new Split({
  source: new Dataset({ items: wrap([1, 2, 3, 4, 5], true) }),
  rule: function(item){
    return item.data.value % 2;
  }
});
