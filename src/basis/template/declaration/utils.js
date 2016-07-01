var arrayAdd = basis.array.add;
var walk = require('./ast.js').walk;
var consts = require('../const.js');
var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
var TYPE_CONTENT = consts.TYPE_CONTENT;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var TOKEN_REFS = consts.TOKEN_REFS;


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

function refList(token){
  var array = token.refs;

  if (array && array.length)
    return array;

  return 0;
}

function bindingList(token){
  var refs = refList(token);

  return refs && refs.length == 1 ? refs[0] : 0;
}

function addTokenRef(token, refName){
  if (!token[TOKEN_REFS])
    token[TOKEN_REFS] = [];

  arrayAdd(token[TOKEN_REFS], refName);

  if (refName != 'element')
    token[TOKEN_BINDINGS] = token[TOKEN_REFS].length == 1 ? refName : 0;
}

function removeTokenRef(token, refName){
  var idx = token[TOKEN_REFS].indexOf(refName);
  if (idx != -1)
  {
    var indexBinding = token[TOKEN_BINDINGS] && typeof token[TOKEN_BINDINGS] == 'number';
    token[TOKEN_REFS].splice(idx, 1);

    if (indexBinding)
      // if binding is index in ref list and ref binding index points to is removing
      if (idx == token[TOKEN_BINDINGS] - 1)
      {
        // convert index to explicit binding value
        token[TOKEN_BINDINGS] = refName;
        indexBinding = false;
      }

    if (!token[TOKEN_REFS].length)
      token[TOKEN_REFS] = 0;
    else
    {
      if (indexBinding)
        token[TOKEN_BINDINGS] -= idx < (token[TOKEN_BINDINGS] - 1);
    }
  }
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


//
//
//

function normalizeRefs(nodes){
  var map = {};

  walk(nodes, function(type, node, parent){
    if (type === TYPE_CONTENT)
    {
      map[':content'] = {
        owner: parent,
        token: node
      };
    }
    else if (type !== TYPE_ATTRIBUTE_EVENT)
    {
      var refs = node[TOKEN_REFS];

      if (!refs)
        return;

      for (var j = refs.length - 1, refName; refName = refs[j]; j--)
      {
        if (refName.indexOf(':') != -1)
        {
          removeTokenRef(node, refName);
          continue;
        }

        if (map[refName])
          removeTokenRef(map[refName].token, refName);

        if (node[TOKEN_BINDINGS] == refName)
          node[TOKEN_BINDINGS] = j + 1;

        map[refName] = {
          owner: parent,
          token: node
        };
      }
    }
  });

  return map;
}

module.exports = {
  resourceHash: resourceHash,
  addUnique: addUnique,

  getTokenName: getTokenName,
  refList: refList,
  addTokenRef: addTokenRef,
  removeTokenRef: removeTokenRef,
  bindingList: bindingList,
  getTokenAttrValues: getTokenAttrValues,
  getTokenAttrs: getTokenAttrs,
  parseOptionsValue: parseOptionsValue,

  getLocation: getLocation,
  addTemplateWarn: addTemplateWarn,
  addTokenLocation: addTokenLocation,

  normalizeRefs: normalizeRefs
};
