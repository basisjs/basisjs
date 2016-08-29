var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');

function isObject(value) {
  if (!value)
    return false;

  if (Array.isArray(value))
    return false;

  return typeof value === 'object';
}

function objectTransform(defaultValue) {
  if (!isObject(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.object.default expected object as default value but got ' + defaultValue + '. Falling back to basis.type.object');
    return object;
  }

  return function(value, oldValue){
    if (value === DEFAULT_VALUE)
      return defaultValue;

    if (isObject(value))
      return value;

    /** @cut */ basis.dev.warn('basis.type.object expected object but got ' + value);

    return oldValue;
  };
}

function nullableObjectTransform(defaultValue) {
  if (defaultValue !== null && !isObject(defaultValue))
  {
    /** @cut */ basis.dev.warn('basis.type.object.nullable.default expected object as default value but got ' + defaultValue + '. Falling back to basis.type.object.nullable');
    return object.nullable;
  }

  return function(value, oldValue){
    if (value === DEFAULT_VALUE)
      return defaultValue;

    if (isObject(value))
      return value;

    if (value === null)
      return null;

    /** @cut */ basis.dev.warn('basis.type.object.nullable expected object or null but got ' + value);

    return oldValue;
  };
}

var object = objectTransform({});
object['default'] = objectTransform;
object.nullable = nullableObjectTransform(null);
object.nullable['default'] = nullableObjectTransform;

module.exports = object;
