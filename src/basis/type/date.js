var fromISOString = require('basis.date').fromISOString;

var ISO_REGEXP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
var PARTIAL_ISO_REGEXP = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value) {
  if (typeof value === 'number' && isFinite(value))
    return new Date(value);

  if (typeof value === 'string' && (value.match(ISO_REGEXP) || value.match(PARTIAL_ISO_REGEXP)))
    return fromISOString(value);

  if (value instanceof Date)
    return value;

  return undefined;
}

function dateTransform(defaultValue, nullable){
  /** @cut */ var transformName = nullable ? 'basis.type.date.nullable' : 'basis.type.date';

  var defaultValueAsDate = toDate(defaultValue);

  if (nullable)
  {
    if (defaultValue !== null && defaultValueAsDate === undefined)
    {
      /** @cut */ basis.dev.warn(transformName + '.default ISO string, number or date object as default value but got ' + defaultValue + '. Falling back to ' + transformName);
      return date.nullable;
    }
  }
  else
  {
    if (defaultValueAsDate === undefined)
    {
      /** @cut */ basis.dev.warn(transformName + '.default ISO string, number, date object or null as default value but got ' + defaultValue + '. Falling back to ' + transformName);
      return date;
    }
  }

  var transform = function(value, oldValue){
    if (nullable && value === null)
      return null;

    var dateObject = toDate(value);

    if (dateObject === undefined){
      /** @cut */ basis.dev.warn('basis.type.date expected ISO string, number, date or null but got ' + value);
      return oldValue;
    }

    if (dateObject && oldValue && dateObject.getTime() === oldValue.getTime())
      return oldValue;

    return dateObject;
  };

  transform.DEFAULT_VALUE = defaultValueAsDate || null;

  return transform;
}

var date = dateTransform(new Date(0), false);
date['default'] = function(defaultValue){
  return dateTransform(defaultValue, false);
};
date.nullable = dateTransform(null, true);
date.nullable['default'] = function(defaultValue){
  return dateTransform(defaultValue, true);
};

module.exports = date;
