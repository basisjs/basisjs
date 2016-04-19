var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;

module.exports = new Expression(
  new Value({ value: 1 }).as(x => x + x),
  new basis.Token(2),
  function(a, b){
    return a + b;
  }
);
