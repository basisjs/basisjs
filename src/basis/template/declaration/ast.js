var consts = require('../const.js');
var TYPE_ELEMENT = consts.TYPE_ELEMENT;
var TYPE_CONTENT = consts.TYPE_CONTENT;
var TOKEN_TYPE = consts.TOKEN_TYPE;
var ELEMENT_ATTRIBUTES_AND_CHILDREN = consts.ELEMENT_ATTRIBUTES_AND_CHILDREN;
var CONTENT_CHILDREN = consts.CONTENT_CHILDREN;

function walker(nodes, fn){
  function walk(nodes, offset){
    for (var i = offset, node; node = nodes[i]; i++)
    {
      var type = node[TOKEN_TYPE];

      fn(type, node, nodes);

      switch (type)
      {
        case TYPE_ELEMENT:
          walk(node, ELEMENT_ATTRIBUTES_AND_CHILDREN);
          break;

        case TYPE_CONTENT:
          walk(node, CONTENT_CHILDREN);
          break;
      }
    }
  }

  walk(nodes, 0);
};

module.exports = {
  walk: walker
};
