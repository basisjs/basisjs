var Value = require('basis.data').Value;
var getColoredSource = require('basis.utils.source').getColoredSource;

var selectedFragment = new Value();
var formattedSource = selectedFragment
  .as(function(loc){
    return {
      loc: loc,
      filename: loc ? loc.replace(/(:\d+){1,4}$/, '') : null,
      source: loc ? getColoredSource(loc, 0, 0, 20) : null
    };
  });

module.exports = {
  input: selectedFragment,
  output: formattedSource
};
