var arrayAdd = basis.array.add;

//
// common
//

function resourceHash(resource){
  return [
    resource.type,
    resource.url,
    resource.isolate
  ].join(';');
}

function addUnique(array, items){
  for (var i = 0; i < items.length; i++)
    arrayAdd(array, items[i]);
}


//
// tokens
//

function getTokenName(token){
  return (token.prefix ? token.prefix + ':' : '') + token.name;
}

function bindingList(token){
  var refs = token.refs;

  return refs && refs.length == 1 ? refs[0] : 0;
}

function getTokenAttrValues(token){
  var result = {};

  if (token.attrs)
    for (var i = 0, attr; attr = token.attrs[i]; i++)
      result[getTokenName(attr)] = attr.value;

  return result;
}

function getTokenAttrs(token){
  var result = {};

  if (token.attrs)
    for (var i = 0, attr; attr = token.attrs[i]; i++)
      result[getTokenName(attr)] = attr;

  return result;
}

function parseOptionsValue(str){
  var result = {};
  var pairs = (str || '').trim().split(/\s*,\s*/);

  for (var i = 0; i < pairs.length; i++)
  {
    var pair = pairs[i].split(/\s*:\s*/);

    if (pair.length != 2)
    {
      // error
      return {};
    }

    result[pair[0]] = pair[1];
  }

  return result;
}


//
// location and debug
//

function getLocation(template, loc){
  if (loc)
    return (template.sourceUrl || '') + ':' + loc.start.line + ':' + (loc.start.column + 1);
}

function addTemplateWarn(template, options, message, loc){
  if (loc && options.loc)
  {
    message = Object(message);
    message.loc = typeof loc == 'string' ? loc : getLocation(template, loc);
  }

  template.warns.push(message);
}

function addTokenLocation(template, options, dest, source){
  if (options.loc && source && source.loc && !dest.loc)
    dest.loc = getLocation(template, source.loc);
}

module.exports = {
  resourceHash: resourceHash,
  addUnique: addUnique,

  getTokenName: getTokenName,
  bindingList: bindingList,
  getTokenAttrValues: getTokenAttrValues,
  getTokenAttrs: getTokenAttrs,
  parseOptionsValue: parseOptionsValue,

  getLocation: getLocation,
  addTemplateWarn: addTemplateWarn,
  addTokenLocation: addTokenLocation
};
