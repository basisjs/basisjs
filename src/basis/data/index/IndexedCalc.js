var calcIndexPresetSeed = 1;

/**
* @class
*/
var IndexedCalc = function(indexes, calc){
  this.indexes = indexes;
  this.calc = calc;
};

IndexedCalc.getId = function(prefix){
  return prefix + '_calc-index-preset-' + basis.number.lead(calcIndexPresetSeed++, 4);
};

module.exports = IndexedCalc;
