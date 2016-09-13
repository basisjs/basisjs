var reIsoStringSplit = /\D/;
var reIsoTimezoneDesignator = /(.{10,})([\-\+]\d{1,2}):?(\d{1,2})?$/;
var fromISOString = (function(){
  function fastDateParse(y, m, d, h, i, s, ms){
    var date = new Date(y, m - 1, d, h || 0, 0, s || 0, ms ? ms.substr(0, 3) : 0);
    date.setMinutes((i || 0) - tz - date.getTimezoneOffset());
    return date;
  }

  var tz;
  return function(isoDateString){
    tz = 0;
    return fastDateParse.apply(
      null,
      String(isoDateString || '')
        .replace(reIsoTimezoneDesignator, function(m, pre, h, i){
          // designator formats:
          //   <datetime>Z
          //   <datetime>±hh:mm
          //   <datetime>±hhmm
          //   <datetime>±hh
          // http://en.wikipedia.org/wiki/ISO_8601#Time_zone_designators
          tz = Number(h || 0) * 60 + Number(i || 0);
          return pre;
        })
        .split(reIsoStringSplit)
    );
  };
})();

/** @cut */ var ISO_REGEXP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}(:\d{2})?)|Z)?$/;
/** @cut */ var PARTIAL_ISO_REGEXP = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value) {
  if (typeof value === 'number' && isFinite(value))
    return new Date(value);

  if (value && typeof value === 'string')
  {
    /** @cut */ if (!ISO_REGEXP.test(value) && !PARTIAL_ISO_REGEXP.test(value))
    /** @cut */   basis.dev.warn('basis.type.date expected ISO string but got ', value, '. Try to parse as ISO string anyway');

    return fromISOString(value);
  }

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
      /** @cut */ basis.dev.warn(transformName + '.default ISO string, number or date object as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return date.nullable;
    }
  }
  else
  {
    if (defaultValueAsDate === undefined)
    {
      /** @cut */ basis.dev.warn(transformName + '.default ISO string, number, date object or null as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return date;
    }
  }

  var transform = function(value, oldValue){
    if (nullable && value === null)
      return null;

    var dateObject = toDate(value);

    if (dateObject === undefined){
      /** @cut */ basis.dev.warn('basis.type.date expected ISO string, number, date or null but got ', value);
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
