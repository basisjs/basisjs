function isNumber(value) {
  return value === 0 || typeof value !== 'object' && isFinite(value);
}

function intTransform(defaultValue, nullable) {
  /** @cut */ var transformName = nullable ? 'basis.type.int.nullable' : 'basis.type.int';

  if (nullable)
  {
    if (defaultValue !== null && !isNumber(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected number or null as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return int.nullable;
    }
  }
  else
  {
    if (!isNumber(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected number as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return int;
    }
  }

  defaultValue = defaultValue === null ? null : parseInt(defaultValue, 10);

  var transform = function(value, oldValue){
    if (isNumber(value))
      return parseInt(value, 10);

    if (nullable && value === null)
      return null;

    /** @cut */ basis.dev.warn(transformName + ' expected number but got ', value);

    return oldValue;
  };

  transform.DEFAULT_VALUE = defaultValue;

  return transform;
}

var int = intTransform(0, false);
int['default'] = function(defaultValue){
  return intTransform(defaultValue, false);
};
int.nullable = intTransform(null, true);
int.nullable['default'] = function(defaultValue){
  return intTransform(defaultValue, true);
};

module.exports = int;
