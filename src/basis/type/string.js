function stringTransform(defaultValue, nullable) {
  /** @cut */ var transformName = nullable ? 'basis.type.string.nullable' : 'basis.type.string';

  if (nullable)
  {
    if (defaultValue !== null && typeof defaultValue !== 'string')
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected string or null as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return string.nullable;
    }
  }
  else
  {
    if (typeof defaultValue !== 'string')
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected string as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return string;
    }
  }

  var transform = function(value, oldValue){
    if (typeof value === 'string')
      return value;

    if (nullable && value === null)
      return null;

    /** @cut */ basis.dev.warn(transformName + ' expected string or null but got ', value);

    return oldValue;
  };

  transform.DEFAULT_VALUE = defaultValue;

  return transform;
}

var string = stringTransform('', false);
string['default'] = function(defaultValue){
  return stringTransform(defaultValue, false);
};
string.nullable = stringTransform(null, true);
string.nullable['default'] = function(defaultValue){
  return stringTransform(defaultValue, true);
};

module.exports = string;
