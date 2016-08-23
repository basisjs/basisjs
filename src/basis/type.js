var fromISOString = require('basis.date').fromISOString;

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
    /** @cut */ basis.dev.warn('type.number.nullable.default expected number or null as default value but got ' + defaultValue + '. Falling back to type.number.nullable');
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

function Int(value) {
  return parseInt(value, 10);
}

function intTransform(defaultValue) {
  if (!isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('type.int.default expected number as default value but got ' + defaultValue + '. Falling back to type.int');
    return int;
  }

  defaultValue = Int(defaultValue);

  return function(value, oldValue){
    if (isNumber(value))
      return Int(value);

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('type.int expected int but got ' + value);

    return oldValue;
  };
}

function nullableIntTransform(defaultValue) {
  if (defaultValue !== null && !isNumber(defaultValue))
  {
    /** @cut */ basis.dev.warn('type.int.nullable.default expected number or null as default value but got ' + defaultValue + '. Falling back to type.int.nullable');
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

    /** @cut */ basis.dev.warn('type.int expected int or null but got ' + value);

    return oldValue;
  };
}

var int = intTransform(0);
int.default = intTransform;
int.nullable = nullableIntTransform(null);
int.nullable.default = nullableIntTransform;

function arrayTransform(defaultValue) {
  if (!Array.isArray(defaultValue))
  {
    /** @cut */ basis.dev.warn('type.array.default expected array as default value but got ' + defaultValue + '. Falling back to type.array');
    return array;
  }

  return function(value, oldValue){
    if (Array.isArray(value))
      return value;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('type.array expected array but got ' + value);

    return oldValue;
  };
}

function nullableArrayTransform(defaultValue) {
  if (defaultValue !== null && !Array.isArray(defaultValue))
  {
    /** @cut */ basis.dev.warn('type.array.nullable.default expected array as default value but got ' + defaultValue + '. Falling back to type.array.nullable');
    return array.nullable;
  }

  return function(value, oldValue){
    if (Array.isArray(value))
      return value;

    if (value === null)
      return null;

    if (value === DEFAULT_VALUE)
      return defaultValue;

    /** @cut */ basis.dev.warn('type.array expected array or null but got ' + value);

    return oldValue;
  };
}

var array = arrayTransform([]);
array.default = arrayTransform;
array.nullable = nullableArrayTransform(null);
array.nullable.default = nullableArrayTransform;

function enumeration(values) {
  if (!Array.isArray(values))
  {
    /** @cut */ basis.dev.warn('type.enum constructor expected array but got ' + values + '. Wrapping into array');
    values = [values];
  }

  if (!values.length)
  {
    /** @cut */ basis.dev.warn('type.enum constructor expected non-empty array but got empty. Falling back to [null]');
    values = [null];
  }

  var transform = function(value, oldValue){
    if (values.indexOf(value) !== -1)
      return value;

    if (value === DEFAULT_VALUE)
      return values[0];

    /** @cut */ basis.dev.warn('type.enum expected one of values from the list (' + values + ') but got ' + value);

    return oldValue;
  };

  transform.default = function(defaultValue){
    if (values.indexOf(defaultValue) === -1)
    {
      /** @cut */ basis.dev.warn('type.enum.default expected one of values from the list (' + values + ') but got ' + defaultValue + '. Ignoring default value');
      return transform;
    }

    return function(value){
      return value === DEFAULT_VALUE ? defaultValue : transform.apply(this, arguments);
    };
  };

  return transform;
}

var ISO_REGEXP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
var PARTIAL_ISO_REGEXP = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value, defaultValue) {
  if (value === DEFAULT_VALUE)
    return defaultValue;

  if (value === null)
    return null;

  if (typeof value === 'number' && isFinite(value))
    return new Date(value);

  if (typeof value === 'string' && (value.match(ISO_REGEXP) || value.match(PARTIAL_ISO_REGEXP)))
    return fromISOString(value);

  if (value instanceof Date)
    return value;

  return undefined;
}

function dateTransform(defaultValue){
  defaultValue = toDate(defaultValue);

  if (defaultValue === undefined)
  {
    /** @cut */ basis.dev.warn('type.date.default expected ISO string, number, date or null as default value but got ' + defaultValue + '. Falling back to type.date');
    return date;
  }

  return function(value, oldValue){
    var dateObject = toDate(value, defaultValue);

    if (dateObject === undefined){
      /** @cut */ basis.dev.warn('type.date.default expected ISO string, number, date or null but got ' + value);
      return oldValue;
    }

    if (dateObject && oldValue && dateObject.getTime() === oldValue.getTime())
      return oldValue;

    return dateObject;
  };
}

var date = dateTransform(null);
date.default = dateTransform;

module.exports = {
  string: string,
  number: number,
  int: int,
  enumeration: enumeration,
  array: array,
  date: date,
  DEFAULT_VALUE: DEFAULT_VALUE
};
