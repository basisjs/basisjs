function isNumber(value) {
  return value === 0 || typeof value !== 'object' && isFinite(value);
}

function numberTransform(defaultValue, nullable) {
  /** @cut */ var transformName = nullable ? 'basis.type.number.nullable' : 'basis.type.number';

  if (nullable)
  {
    if (defaultValue !== null && !isNumber(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected number or null as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return number.nullable;
    }
  }
  else
  {
    if (!isNumber(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected number as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return number;
    }
  }

  defaultValue = defaultValue === null ? null : Number(defaultValue);

  var transform = function(value, oldValue){
    if (isNumber(value))
      return Number(value);

    if (nullable && value === null)
      return null;

    /** @cut */ basis.dev.warn(transformName + ' expected number but got ', value);

    return oldValue;
  };

  transform.DEFAULT_VALUE = defaultValue;

  return transform;
}

var number = numberTransform(0, false);
number['default'] = function(defaultValue){
  return numberTransform(defaultValue, false);
};
number.nullable = numberTransform(null, true);
number.nullable['default'] = function(defaultValue){
  return numberTransform(defaultValue, true);
};

module.exports = number;
