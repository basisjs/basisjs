var Value = require('basis.data').Value;
var input = new Value();
var output = new Value();

input.link(output, output.set);

module.exports = {
  input: input,
  output: output
};
