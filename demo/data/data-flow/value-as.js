var Value = require('basis.data').Value;

module.exports = new Value({
  value: 3
}).as(function(n){
  return n * n;
});
