var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');
var fromISOString = require('basis.date').fromISOString;

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
    /** @cut */ basis.dev.warn('basis.type.date.default expected ISO string, number, date or null as default value but got ' + defaultValue + '. Falling back to basis.type.date');
    return date;
  }

  return function(value, oldValue){
    var dateObject = toDate(value, defaultValue);

    if (dateObject === undefined){
      /** @cut */ basis.dev.warn('basis.type.date expected ISO string, number, date or null but got ' + value);
      return oldValue;
    }

    if (dateObject && oldValue && dateObject.getTime() === oldValue.getTime())
      return oldValue;

    return dateObject;
  };
}

var date = dateTransform(null);
date['default'] = dateTransform;

module.exports = date;
