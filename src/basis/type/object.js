function isObject(value) {
  if (!value)
    return false;

  if (Array.isArray(value))
    return false;

  return typeof value === 'object';
}

function objectTransform(defaultValue, nullable) {
  /** @cut */ var transformName = nullable ? 'basis.type.object.nullable' : 'basis.type.object';

  if (nullable)
  {
    if (defaultValue !== null && !isObject(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected object or null as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return object.nullable;
    }
  }
  else
  {
    if (!isObject(defaultValue))
    {
      /** @cut */ basis.dev.warn(transformName + '.default expected object as default value but got ', defaultValue, '. Falling back to ' + transformName);
      return object;
    }
  }

  var transform = function(value, oldValue){
    if (isObject(value))
      return value;

    if (nullable && value === null)
      return null;

    /** @cut */ basis.dev.warn(transformName + ' expected object but got ', value);

    return oldValue;
  };

  transform.DEFAULT_VALUE = defaultValue;

  return transform;
}

var defValue = {};
/** @cut */ if (typeof Object.freeze === 'function')
/** @cut */   Object.freeze(defValue);
/** @cut */ if (typeof Proxy === 'function')
/** @cut */   defValue = new Proxy(defValue, {
/** @cut */     set: function(){
/** @cut */       basis.dev.warn('Ignored attempt to modify basis.type.object read-only default value');
/** @cut */     }
/** @cut */   });

var object = objectTransform(defValue, false);
object['default'] = function(defaultValue){
  return objectTransform(defaultValue, false);
};
object.nullable = objectTransform(null, true);
object.nullable['default'] = function(defaultValue){
  return objectTransform(defaultValue, true);
};

module.exports = object;
