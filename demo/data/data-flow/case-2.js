var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;

function square(n){
  return n * n;
}

var expr = new Expression(
  new basis.Token(1),
  new basis.Token(2).as(square),
  function(a, b){
    return a + b;
  }
);

module.exports = new Expression(
  new Value({ value: 1 }),
  expr,
  new Value({ value: 2 }).as(square),
  new Value({ value: 2 }).as(square).as(square).as(square),
  function(a, b, c){
    return a + b + c;
  }
);
