var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');

function stringTransform(defaultValue) {
  if (typeof defaultValue !== 'string')
  {
    /** @cut */ basis.dev.warn('basis.type.string.default expected string as default value but got ' + defaultValue + '. Falling back to basis.type.string');
    return string;
  }

  return function(value, oldValue){
    if (typeof value === 'string')
      return value;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.string expected string but got ' + value);

    return oldValue;
  };
}

function nullableStringTransform(defaultValue) {
  if (defaultValue !== null && typeof defaultValue !== 'string')
  {
    /** @cut */ basis.dev.warn('basis.type.string.nullable.default expected string as default value but got ' + defaultValue + '. Falling back to basis.type.string.nullable');
    return string.nullable;
  }

  return function(value, oldValue){
    if (typeof value === 'string')
      return value;

    if (value === null)
      return null;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('basis.type.string expected string or null but got ' + value);

    return oldValue;
  };
}

var string = stringTransform('');
string['default'] = stringTransform;
string.nullable = nullableStringTransform(null);
string.nullable['default'] = nullableStringTransform;

module.exports = string;
