var inspectBasis = require('devpanel').inspectBasis;
var Value = require('basis.data').Value;
var createTreeBuilder = require('./build-tree.js');

var input = new Value();
var selectedObject = new basis.Token();

var tree = selectedObject
  .as(createTreeBuilder({
    sandbox: inspectBasis
  }))
  // pass through stringify/parse to avoid notification about the same structure
  .as(JSON.stringify)
  .as(JSON.parse);

// rebuild graph by timer
input.link(selectedObject, selectedObject.set);
setInterval(function(){
  if (selectedObject.value)
    selectedObject.apply();
}, 100);

module.exports = {
  input: input,
  output: Value.from(tree)
};
