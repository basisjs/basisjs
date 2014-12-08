var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.html').marker;

var Dataset = require('basis.data').Dataset;
var Node = require('basis.ui').Node;
var Window = require('basis.ui.window').Window;
var selectedDomNode = new basis.Token();
var bindingDataset = new Dataset();
var isolatePrefix;

selectedDomNode.attach(function(node){
  var items = [];
  var id = node[inspectBasisTemplateMarker];
  var object = inspectBasisTemplate.resolveObjectById(id);
  var objectBinding = object.binding;
  var template = inspectBasisTemplate.resolveTemplateById(id);
  var templateBinding = template.getBinding();

  for (var key in objectBinding)
    if (key != '__extend__' && key != 'bindingId')
    {
      var used = templateBinding.names.indexOf(key) != -1;
      items.push({
        name: key,
        value: used ? String(objectBinding[key].getter(object)) : null,
        used: used
      });
    }

  this.set(basis.data.wrap(items, true));
}, bindingDataset);

// dom mutation observer

var observer = (function(){
  var names = ['MutationObserver', 'WebKitMutationObserver'];

  for (var i = 0, name; name = names[i]; i++)
  {
    var ObserverClass = global[name];
    if (typeof ObserverClass == 'function')
    {
      var observer = new ObserverClass(function(){
        selectedDomNode.apply();
      });
      return observer;
    }
  }

  // fallback for case if MutationObserver doesn't support
  setInterval(function(){
    selectedDomNode.apply();
  }, 100);
})();

function nodeToHtml(node){
  if (observer)
    observer.disconnect();

  if (!node)
    return '';

  if (observer)
    observer.observe(node, {
      subtree: true,
      attributes: true,
      characterData: true,
      childList: true
    });

  var root = node;
  var cursor = root.firstChild;
  var nodes = [root, []];
  var nodesCursor = nodes;
  var nodesStack = [nodesCursor];
  var candidate;

  while (cursor && cursor !== root)
  {
    var node = [cursor, []];
    nodesCursor[1].push(node);

    if (!cursor[inspectBasisTemplateMarker] && cursor.firstChild)
    {
      cursor = cursor.firstChild;
      nodesStack.push(nodesCursor);
      nodesCursor = node;
      continue;
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

  function walk(item, bindings){
    function findBinding(node){
      return basis.array.search(bindings, node, function(item){
        return item.dom;
      });
    }

    var result = [];
    var node = item[0];
    var childrenCount = item[1].length;
    var nonTextCount = 0;
    var binding;

    for (var i = 0; i < childrenCount; i++)
    {
      nonTextCount = item[1][i][0].nodeType != 3;
      result.push(walk(item[1][i], bindings));
    }

    switch (node.nodeType)
    {
      case 1:
        var attrs = Array.prototype.slice.call(node.attributes).map(function(attr){
          var value = attr.value;

          if (attr.name == 'class')
            for (var i = 0; i < bindings.length; i++)
            {
              var bind = bindings[i];
              var val = bind.dom === node && bind.attr === attr.name && bind.val;
              if (val)
                value = value.replace(new RegExp('\\b' + val + '\\b'), '<span class="' + isolatePrefix + 'binding" title="' + bind.binding + '">$&</span>');
            }

          return attr.name + '="' + value + '"';
        }).join(' ');

        if (nonTextCount)
          result = '\n  ' + result.map(function(str){
            return str.replace(/\n/g, '\n  ');
          }).join('\n  ') + '\n';
        else
          result = result.join('');

        return (
          '&lt;' + node.tagName.toLowerCase() +
          (attrs ? ' ' + attrs : '') +
          (childrenCount ? '' : '/') +
          '>' +
            result +
          (childrenCount ? '&lt;/' + node.tagName.toLowerCase() + '>' : '')
        );

        break;
      case 3:
        binding = findBinding(node);
        return binding
          ? '<span class="' + isolatePrefix + 'binding" title="' + binding.binding + '">' + node.nodeValue + '</span>'
          : node.nodeValue;

      case 8:
        return '&lt;!--' + node.nodeValue + '-->';
    }

    return '';
  }

  return walk(nodes, inspectBasisTemplate.getDebugInfoById(nodes[0][inspectBasisTemplateMarker]) || []);
}

var view = new Window({
  template: resource('./template/template-info.tmpl'),
  selectedDomNode: selectedDomNode,
  visible: selectedDomNode.as(Boolean),
  binding: {
    code: selectedDomNode.as(nodeToHtml),
    bindings: new Node({
      dataSource: bindingDataset,
      sorting: 'data.name',
      grouping: {
        rule: 'data.used',
        childClass: {
          template: resource('./template/template-info-binding-group.tmpl'),
          binding: {
            name: function(node){
              return node.data.id ? 'used' : 'notUsed';
            }
          }
        },
        sorting: function(node){
          return Number(!node.data.id);
        }
      },
      childClass: {
        template: resource('./template/template-info-binding.tmpl'),
        binding: {
          name: 'data:',
          value: 'data:',
          used: 'data:'
        },
        action: {
          pickValue: function(){
            if (this.data.used)
            {
              var object = inspectBasisTemplate.resolveObjectById(selectedDomNode.value[inspectBasisTemplateMarker]);
              console.log(object.binding[this.data.name].getter(object));
            }
          }
        }
      }
    })
  }
});

isolatePrefix = view.template.getIsolatePrefix();

module.exports = view;
