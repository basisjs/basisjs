var hasOwnProperty = Object.prototype.hasOwnProperty;

function getKeys(dictionary) {
  var keys = {};

  for (var culture in dictionary.cultureValues)
    for (var path in dictionary.cultureValues[culture])
      keys[path] = true;

  return Object.keys(keys);
}

function getTokenValues(dictionary, culture) {
  return getKeys(dictionary).reduce(function(result, key){
    result[key] = dictionary.getValue(key);

    return result;
  }, {});
}

module.exports = {
  getTokenValues: getTokenValues
};
