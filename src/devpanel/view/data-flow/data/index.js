var inspectBasis = require('devpanel').inspectBasis;
var Value = require('basis.data').Value;
var createTreeBuilder = require('./build-tree.js');

var selectedObject = new Value();
var tree = selectedObject
  .as(createTreeBuilder({
    sandbox: inspectBasis
  }));

module.exports = {
  input: selectedObject,
  output: tree
};
