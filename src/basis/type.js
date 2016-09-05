var namespace = 'basis.type';

// types map
var namedTypes = {};
var deferredTypeDef = {};
var pendingTypeNames = {};

function defineType(typeName, type){
  /** @cut */ if (typeof typeName !== 'string')
  /** @cut */   basis.dev.warn(namespace + ': defineType expects a string as a type name. `' + typeName + '` is not a string');

  var list = deferredTypeDef[typeName];

  if (list)
  {
    for (var i = 0, def; def = list[i]; i++)
    {
      var typeHost = def[0];
      var fieldName = def[1];

      typeHost[fieldName] = type;
    }

    delete deferredTypeDef[typeName];
  }

  delete pendingTypeNames[typeName];

  /** @cut */ if (namedTypes[typeName])
  /** @cut */   basis.dev.warn(namespace + ': type `' + typeName + '` is already defined. Redefined with new version');

  namedTypes[typeName] = type;
}

function getTypeByName(typeName, typeHost, field){
  if (namedTypes.hasOwnProperty(typeName))
    return namedTypes[typeName];

  if (typeHost && field)
  {
    var list = deferredTypeDef[typeName];

    if (!list)
      list = deferredTypeDef[typeName] = [];

    list.push([typeHost, field]);
  }
  else
    pendingTypeNames[typeName] = true;

  return function(value, oldValue){
    var Type = namedTypes.hasOwnProperty(typeName) ? namedTypes[typeName] : null;

    if (Type)
      return Type(value, oldValue);

    /** @cut */ if (arguments.length && value != null) // don't warn on default value calculation and wrapper call for null
    /** @cut */   basis.dev.warn(namespace + ': type `' + typeName + '` is not defined for `' + field + '`, but function called');
  };
}

function getTypeByNameIfDefined(typeName){
  if (namedTypes.hasOwnProperty(typeName))
    return namedTypes[typeName];
}

function validateScheme(){
  for (var typeName in pendingTypeNames)
    basis.dev.warn(namespace + ': type `' + typeName + '` is not defined, but used via type.getTypeByName()');

  for (var typeName in deferredTypeDef)
    basis.dev.warn(namespace + ': type `' + typeName + '` is not defined, but used by ' + deferredTypeDef[typeName].length + ' type(s)');
}

module.exports = {
  string: require('./type/string.js'),
  number: require('./type/number.js'),
  int: require('./type/int.js'),
  'enum': require('./type/enum.js'),
  array: require('./type/array.js'),
  object: require('./type/object.js'),
  date: require('./type/date.js'),

  validate: validateScheme,
  getTypeByName: getTypeByName,
  getTypeByNameIfDefined: getTypeByNameIfDefined,
  defineType: defineType
};
