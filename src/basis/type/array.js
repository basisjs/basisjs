var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');

function equalArrays(a, b) {
  if (a === b)
    return true;

  if (a.length != b.length)
    return false;

  for (var i = 0; i < a.length; ++i)
    if (a[i] !== b[i])
      return false;

  return true;
}

function arrayTransform(defaultValue) {
  if (!Array.isArray(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.array.default expected array as default value but got ' + defaultValue + '. Falling back to basis.type.array');
    return array;
  }

  return function(value, oldValue){
    if (Array.isArray(value))
      // We don't check oldValue for being an array
      // because it is supposed to be used by internal purposes,
      // so it should contain only correct values
      return oldValue && equalArrays(value, oldValue) ? oldValue : value;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.array expected array but got ' + value);

    return oldValue;
  };
}

function nullableArrayTransform(defaultValue) {
  if (defaultValue !== null && !Array.isArray(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.array.nullable.default expected array as default value but got ' + defaultValue + '. Falling back to basis.type.array.nullable');
    return array.nullable;
  }

  return function(value, oldValue){
    if (Array.isArray(value))
      return oldValue && equalArrays(value, oldValue) ? oldValue : value;

    if (value === null)
      return null;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.array.nullable expected array or null but got ' + value);

    return oldValue;
  };
}

var array = arrayTransform([]);
array['default'] = arrayTransform;
array.nullable = nullableArrayTransform(null);
array.nullable['default'] = nullableArrayTransform;

module.exports = array;
