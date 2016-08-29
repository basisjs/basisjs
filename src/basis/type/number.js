var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');

function isNumber(value) {
  return value === 0 || typeof value !== 'object' && isFinite(value);
}

function numberTransform(defaultValue) {
  if (!isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.number.default expected number as default value but got ' + defaultValue + '. Falling back to basis.type.number');
    return number;
  }

  defaultValue = Number(defaultValue);

  return function(value, oldValue){
    if (isNumber(value))
      return Number(value);

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.number expected number but got ' + value);

    return oldValue;
  };
}

function nullableNumberTransform(defaultValue) {
  if (defaultValue !== null && !isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.number.nullable.default expected number or null as default value but got ' + defaultValue + '. Falling back to basis.type.number.nullable');
    return number.nullable;
  }

  defaultValue = defaultValue === null ? null : Number(defaultValue);

  return function(value, oldValue){
    if (isNumber(value))
      return Number(value);

    if (value === null)
      return null;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.number expected number or null but got ' + value);

    return oldValue;
  };
}

var number = numberTransform(0);
number['default'] = numberTransform;
number.nullable = nullableNumberTransform(null);
number.nullable['default'] = nullableNumberTransform;

module.exports = number;
