var arrayAdd = basis.array.add;
var walk = require('./ast.js').walk;
var consts = require('../const.js');
var TYPE_ATTRIBUTE_EVENT = consts.TYPE_ATTRIBUTE_EVENT;
var TYPE_CONTENT = consts.TYPE_CONTENT;
var CONTENT_PRIORITY = consts.CONTENT_PRIORITY;
var TOKEN_BINDINGS = consts.TOKEN_BINDINGS;
var TOKEN_REFS = consts.TOKEN_REFS;

function refList(token){
  var array = token.refs;

  if (array && array.length)
    return array;

  return 0;
}

function addTokenRef(token, refName){
  if (!token[TOKEN_REFS])
    token[TOKEN_REFS] = [];

  arrayAdd(token[TOKEN_REFS], refName);

  if (refName != 'element' && !token[TOKEN_BINDINGS])
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

function normalizeRefs(nodes){
  var map = {};

  walk(nodes, function(type, node, parent){
    if (type === TYPE_CONTENT)
    {
      var contentNodeRef = map[':content'];

      if (!contentNodeRef)
      {
        map[':content'] = {
          parent: parent,
          node: node,
          overrided: []
        };
      }
      else
      {
        // last or with greater priority wins
        if (node[CONTENT_PRIORITY] >= contentNodeRef.node[CONTENT_PRIORITY])
        {
          // remove old node, use new
          contentNodeRef.overrided.push({
            parent: contentNodeRef.parent,
            node: contentNodeRef.node
          });
          contentNodeRef.parent = parent;
          contentNodeRef.node = node;
        }
        else
        {
          // remove new node, use old
          contentNodeRef.overrided.push({
            parent: parent,
            node: node
          });
        }
      }
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
          removeTokenRef(map[refName].node, refName);

        if (node[TOKEN_BINDINGS] == refName)
          node[TOKEN_BINDINGS] = j + 1;

        map[refName] = {
          parent: parent,
          node: node
        };
      }
    }
  });

  return map;
}

module.exports = {
  refList: refList,
  addTokenRef: addTokenRef,
  removeTokenRef: removeTokenRef,
  normalizeRefs: normalizeRefs
};
