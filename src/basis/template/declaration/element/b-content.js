var consts = require('../../const.js');
var TYPE_CONTENT = consts.TYPE_CONTENT;

module.exports = function(template, options, token, result){
  var node = [
    TYPE_CONTENT,
    2             // explicit with high priority
  ];

  if (token.children)
    node.push.apply(node, options.process(token.children, template, options));

  result.push(node);
};
