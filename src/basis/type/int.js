var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');

function isNumber(value) {
  return value === 0 || typeof value !== 'object' && isFinite(value);
}

function Int(value) {
  return parseInt(value, 10);
}

function intTransform(defaultValue) {
  if (!isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.int.default expected number as default value but got ' + defaultValue + '. Falling back to basis.type.int');
    return int;
  }

  defaultValue = Int(defaultValue);

  return function(value, oldValue){
    if (isNumber(value))
      return Int(value);

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.int expected int but got ' + value);

    return oldValue;
  };
}

function nullableIntTransform(defaultValue) {
  if (defaultValue !== null && !isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.int.nullable.default expected number or null as default value but got ' + defaultValue + '. Falling back to basis.type.int.nullable');
    return int.nullable;
  }

  defaultValue = defaultValue === null ? null : Int(defaultValue);

  return function(value, oldValue){
    if (isNumber(value))
      return Int(value);

    if (value === null)
      return null;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.int expected int or null but got ' + value);

    return oldValue;
  };
}

var int = intTransform(0);
int['default'] = intTransform;
int.nullable = nullableIntTransform(null);
int.nullable['default'] = nullableIntTransform;

module.exports = int;
