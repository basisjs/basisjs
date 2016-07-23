var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.const').MARKER;

function parseDom(node){
  var root = node;
  var cursor = root.firstChild;
  var nodes = [root, [], {}];
  var nodesCursor = nodes;
  var nodesStack = [nodesCursor];
  var candidate;

  while (cursor && cursor !== root)
  {
    var node = [cursor, [], {}];
    nodesCursor[1].push(node);

    if (!cursor[inspectBasisTemplateMarker])
    {
      if (cursor.firstChild)
      {
        cursor = cursor.firstChild;
        nodesStack.push(nodesCursor);
        nodesCursor = node;
        continue;
      }
    }
    else
    {
      node[2].nestedView = true;
    }

    candidate = cursor.nextSibling;

    while (!candidate && cursor.parentNode !== root)
    {
      cursor = cursor.parentNode;
      nodesCursor = nodesStack.pop();
      if (cursor !== root)
        candidate = cursor.nextSibling;
    }

    cursor = candidate;
  }

  return nodes;
}

function buildAttribute(attr, attrBindings, actions){
  var value = [{
    type: 'static',
    value: attr.value
  }];

  switch (attr.name)
  {
    case 'class':
      var bindingMap = {};

      for (var i = 0, bind; bind = attrBindings[i]; i++)
        if (bind.val)
          bindingMap[bind.val] = bind;

      value = attr.value.split(/(\s+)/).map(function(part){
        var bind = bindingMap.hasOwnProperty(part) ? bindingMap[part] : null;
        return {
          type: bind ? 'binding' : 'static',
          value: part,
          bindingName: bind && bind.binding
        };
      });

      break;

    case 'style':
      // todo
      break;

    default:
      if (attr.value)
        if (/^event-/.test(attr.name))
          value = attr.value.split(/(\s+)/).map(function(value){
            return {
              type: /\S/.test(value) ? 'action' : 'static',
              value: value,
              loc: inspectBasis.dev.getInfo(actions[value], 'loc') || ''
            };
          });
        else
        {
          if (attrBindings.length)
          {
            var baseBinding = attrBindings[0];
            var bindingValues = {};

            // build value map
            for (var i = 0, bind; bind = attrBindings[i]; i++)
              if (bind.binding)
                bindingValues[bind.binding] = bind.raw;

            if (baseBinding.type == 'bool')
              value = [{
                type: 'binding',
                value: baseBinding.val,
                bindingName: attrBindings.length > 1 ? 'multiple' : baseBinding.binding
              }];
            else
              // convert expression to value parts
              if (baseBinding.expr)
              {
                var expr = baseBinding.expr[0];
                var bindingNames = baseBinding.expr[1];
                var bindingKeys = baseBinding.expr[2];
                var newValue = expr.map(function(item){
                  if (typeof item == 'number')
                  {
                    var name = bindingNames[item];
                    var value = String(bindingValues[bindingKeys[item]]);
                    if (/^l10n:/.test(name))
                      return {
                        type: 'l10n',
                        value: value,
                        l10n: name
                      };
                    else
                      return {
                        type: 'binding',
                        value: value,
                        bindingName: name
                      };
                  }

                  return {
                    type: 'static',
                    value: item
                  };
                });

                var newValueStr = newValue.map(function(item){
                  return item.value;
                }).join('');

                if (newValueStr == attr.value)
                  value = newValue;
              }
          }
        }
  }

  if (value.length == 1 && value[0].type == 'static' && !value[0].value)
    value = [];

  return {
    name: attr.name,
    childNodes: value
  };
}

module.exports = function buildDomTree(rootNode){
  function findBinding(node){
    return basis.array.search(bindings, node, 'dom');
  }

  function findNodeBinding(node){
    return basis.array.search(bindings, true, function(binding){
      return binding.val !== binding.dom && binding.val === node;
    });
  }

  function createNode(item){
    var node = item[0];
    var children = item[1];
    var properties = item[2];
    var binding;
    var result;

    switch (node.nodeType)
    {
      case 1:
        var binding = findNodeBinding(node);
        var nestedView = properties.nestedView;
        var attrs;
        var inline;

        if (binding && binding.binding == 'element')
          binding = null;

        attrs = binding || nestedView
          ? basis.array(node.attributes).map(function(attr){
              return {
                name: attr.name,
                childNodes: !attr.value ? [] : [
                  {
                    type: 'static',
                    value: attr.value
                  }
                ]
              };
            })
          : basis.array(node.attributes).map(function(attr){
              return buildAttribute(attr, bindings.filter(function(bind){
                return bind.dom === node && bind.attr === attr.name;
              }), actions);
            });

        children = children.map(createNode);

        inline =
          children.every(function(node){
            return node instanceof Text;
          }) &&
          children.reduce(function(res, node){
            return res + node.value.length;
          }, 0) < 32;

        result = {
          type: 'element',
          domNode: node,
          name: node.tagName.toLowerCase(),
          bindingName: binding ? binding.binding : null,
          childrenHidden: node.firstChild && !children.length,
          inlineChildren: inline,
          nestedView: nestedView,
          attributes: attrs,
          childNodes: children
        };
        break;

      case 3:
        binding = findBinding(node) || findNodeBinding(node);

        result = {
          type: 'text',
          domNode: node,
          bindingName: binding && !binding.l10n ? binding.binding : null,
          value: node.nodeValue,
          l10n: binding ? binding.l10n : false,
          nestedView: properties.nestedView
        };
        break;

      case 8:
        binding = findNodeBinding(node);

        result = {
          type: 'comment',
          domNode: node,
          bindingName: binding ? binding.binding : null,
          value: node.nodeValue,
          nestedView: properties.nestedView
        };
        break;
    }

    if (result)
    {
      var nodeId = basis.genUID();
      domNodesMap[nodeId] = result.domNode;
      result.domNode = nodeId;
    }

    return result || '';
  }

  var domNodesMap = {};
  var tree = null;

  if (rootNode)
  {
    var templateId = rootNode[inspectBasisTemplateMarker];
    var debugInfo = inspectBasisTemplate.getDebugInfoById(templateId) || {};
    var bindings = debugInfo.bindings || [];
    var object = inspectBasisTemplate.resolveObjectById(templateId) || {};
    var actions = object.action || {};

    tree = createNode(parseDom(rootNode));
  }

  return {
    map: domNodesMap,
    tree: tree
  };
};
