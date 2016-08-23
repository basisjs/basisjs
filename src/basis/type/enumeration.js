var DEFAULT_VALUE = require('./DEFAULT_VALUE.js');

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

module.exports = enumeration;
