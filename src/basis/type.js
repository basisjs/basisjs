var DEFAULT_VALUE = {};

function stringTransform(defaultValue) {
  if (typeof defaultValue !== 'string')
  {
    /** @cut */ basis.dev.warn('type.string.default expected string as default value but got ' + defaultValue + '. Falling back to type.string');
    return string;
  }

  return function(value, oldValue){
    if (typeof value === 'string')
      return value;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('type.string expected string but got ' + value);

    return oldValue;
  };
}

function nullableStringTransform(defaultValue) {
  if (defaultValue !== null && typeof defaultValue !== 'string')
  {
    /** @cut */ basis.dev.warn('type.string.nullable.default expected string as default value but got ' + defaultValue + '. Falling back to type.string.nullable');
    return string.nullable;
  }

  return function(value, oldValue){
    if (typeof value === 'string')
      return value;

    if (value === null)
      return null;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('type.string expected string or null but got ' + value);

    return oldValue;
  };
}

var string = stringTransform('');
string.default = stringTransform;
string.nullable = nullableStringTransform(null);
string.nullable.default = nullableStringTransform;

function isNumber(value) {
  return value === 0 || typeof value !== 'object' && isFinite(value);
}

function numberTransform(defaultValue) {
  if (!isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('type.number.default expected number as default value but got ' + defaultValue + '. Falling back to type.number');
    return number;
  }

  defaultValue = Number(defaultValue);

  return function(value, oldValue){
    if (isNumber(value))
      return Number(value);

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('type.number expected number but got ' + value);

    return oldValue;
  };
}

function nullableNumberTransform(defaultValue) {
  if (defaultValue !== null && !isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('type.number.nullable.default expected number as default value but got ' + defaultValue + '. Falling back to type.number.nullable');
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

    /** @cut */ basis.dev.warn('type.number expected number or null but got ' + value);

    return oldValue;
  };
}

var number = numberTransform(0);
number.default = numberTransform;
number.nullable = nullableNumberTransform(null);
number.nullable.default = nullableNumberTransform;

module.exports = {
  string: string,
  number: number,
  DEFAULT_VALUE: DEFAULT_VALUE
};
