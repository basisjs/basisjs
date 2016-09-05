function enumeration(values) {
  if (!Array.isArray(values))
  {
    /** @cut */ basis.dev.warn('basis.type.enum constructor expected array but got ', values, '. Wrapping into array');
    values = [values];
  }

  if (!values.length)
    throw new Error('basis.type.enum constructor expected non-empty array but got empty.');

  var transform = function(value, oldValue){
    if (values.indexOf(value) !== -1)
      return value;

    /** @cut */ basis.dev.warn('basis.type.enum expected one of values from the list ', values, ' but got ', value);

    return oldValue;
  };

  transform.DEFAULT_VALUE = values[0];

  transform['default'] = function(defaultValue){
    if (values.indexOf(defaultValue) === -1)
    {
      /** @cut */ basis.dev.warn('basis.type.enum.default expected one of values from the list ', values, ' but got ', defaultValue, '. Ignoring default value');
      return transform;
    }

    var transformWithDefaultValue = function(){
      return transform.apply(this, arguments);
    };

    transformWithDefaultValue.DEFAULT_VALUE = defaultValue;

    return transformWithDefaultValue;
  };

  return transform;
}

module.exports = enumeration;
