var highlight = require('basis.utils.highlight').highlight;

function getNodeType(value, resolvers){
  return resolvers.isDataset(value) ? 'set' : null;
}

function inspectValue(value, resolvers, map){
  var sourceInfo = resolvers.getInfo(value, 'sourceInfo');

  if (!map)
    map = [];

  if (!sourceInfo)
  {
    var marker = map.indexOf(value) + 1;

    if (!marker)
      marker = map.push(value);

    return [{
      nodeType: getNodeType(value, resolvers),
      source: true,
      marker: marker,
      value: value,
      loc: resolvers.getInfo(value, 'loc')
    }];
  }

  var nodes = [];

  if (Array.isArray(sourceInfo.source))
    nodes = [{
      nodeType: 'split',
      childNodes: sourceInfo.source.map(function(value){
        return {
          childNodes: inspectValue(value, resolvers, map)
        };
      })
    }];
  else
    nodes = inspectValue(sourceInfo.source, resolvers, map);

  var fn = resolvers.resolveFunction(sourceInfo.transform);
  var fnLoc = resolvers.getInfo(fn, 'loc');
  var info = fn ? resolvers.fnInfo(fn) : { source: null };

  nodes.push({
    nodeType: getNodeType(value, resolvers),
    type: sourceInfo.type,
    events: sourceInfo.events,
    transform: info.getter || (fnLoc
      ? resolvers.getColoredSource(fnLoc, 0, 0, 20)
      : info.source
        ? highlight(String(info.source), 'js', {
            wrapper: function(line){
              return '<div>' + line + '</div>';
            }
          })
        : ''),
    transformLoc: fnLoc,
    value: value,
    loc: resolvers.getInfo(value, 'loc')
  });

  return nodes;
}

module.exports = function buildTree(value, resolvers){
  var result = inspectValue(value, basis.object.extend({
    sandbox: basis,
    resolveFunction: function(fn){
      var sandbox = this.sandbox;

      if (typeof fn === 'function' && fn[sandbox.getter.ID])
        if (typeof fn[sandbox.getter.SOURCE] === 'function' && !fn[sandbox.getter.SOURCE][sandbox.getter.ID])
          return fn[sandbox.getter.SOURCE];

      return fn;
    },
    isDataset: basis.fn.$false,
    getInfo: function(){
      return this.sandbox.dev.getInfo.apply(this, arguments);
    },
    fnInfo: function(fn){
      var getFnInfo = this.sandbox.require('basis.utils.info').fn;

      this.fnInfo = function(fn){
        if (typeof fn.getDevSource === 'function')
          fn = fn.getDevSource();

        return getFnInfo(fn);
      };

      return this.fnInfo(fn);
    },
    getColoredSource: require('basis.utils.source').getColoredSource
  }, resolvers));

  if (result.length)
    result[result.length - 1].initial = true;

  return result;
};
