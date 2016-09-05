function equalArrays(a, b) {
  if (a === b)
    return true;

  if (a.length != b.length)
    return false;

  for (var i = 0; i < a.length; ++i)
    if (a[i] !== b[i])
      return false;

  return true;
}

function arrayTransform(defaultValue, nullable) {
  /** @cut */ var transformName = nullable ? 'basis.type.array.nullable' : 'basis.type.array';

  if (nullable)
  {
    if (defaultValue !== null && !Array.isArray(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected array or null as default value but got ', defaultValue, '. Falling back to ', defaultValue);
      return array.nullable;
    }
  }
  else
  {
    if (!Array.isArray(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected array as default value but got ', defaultValue, '. Falling back to ', defaultValue);
      return array;
    }
  }

  var transform = function(value, oldValue){
    if (Array.isArray(value))
      return oldValue && equalArrays(value, oldValue) ? oldValue : value;

    if (nullable && value === null)
      return null;

    /** @cut */ basis.dev.warn('basis.type.array.nullable expected array or null but got ', value);

    return oldValue;
  };

  transform.DEFAULT_VALUE = defaultValue;

  return transform;
}

var defValue = [];
/** @cut */ if (typeof Object.freeze === 'function')
/** @cut */   Object.freeze(defValue);
/** @cut */ if (typeof Proxy === 'function')
/** @cut */   defValue = new Proxy(defValue, {
/** @cut */     set: function(){
/** @cut */       basis.dev.warn('Ignored attempt to modify basis.type.array read-only default value');
/** @cut */     }
/** @cut */   });

var array = arrayTransform(defValue, false);
array['default'] = function(defaultValue){
  return arrayTransform(defaultValue, false);
};
array.nullable = arrayTransform(null, true);
array.nullable['default'] = function(defaultValue){
  return arrayTransform(defaultValue, true);
};

module.exports = array;
