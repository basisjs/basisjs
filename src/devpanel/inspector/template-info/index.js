var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisTemplateMarker = inspectBasis.require('basis.template.html').marker;

var fileAPI = require('../../api/file.js');
var parseDom = require('./parse-dom.js');
var buildTree = require('./build-tree.js');
var Value = require('basis.data').Value;
var Dataset = require('basis.data').Dataset;
var Node = require('basis.ui').Node;
var Window = require('basis.ui.window').Window;
var selectedDomNode = new basis.Token();
var hoveredBinding = new Value();
var bindingDataset = new Dataset();
var isolatePrefix;

function valueToString(val){
  if (typeof val == 'string')
    return '\'' + val.replace(/\'/g, '\\\'') + '\'';

  if (val && typeof val == 'object' && val.constructor.className)
    return '[object ' + val.constructor.className + ']';

  return String(val);
}

selectedDomNode.attach(function(node){
  var items = [];

  if (node)
  {
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
          value: used ? valueToString(objectBinding[key].getter(object)) : null,
          used: used,
          loc: objectBinding[key].loc
        });
      }
  }

  this.set(basis.data.wrap(items, true));
}, bindingDataset);

var selectedObject = selectedDomNode.as(function(node){
  return node ? inspectBasisTemplate.resolveObjectById(node[inspectBasisTemplateMarker]) : null;
});

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

selectedDomNode.attach(function(node){
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

  var nodes = parseDom(node);
  var bindings = inspectBasisTemplate.getDebugInfoById(nodes[0][inspectBasisTemplateMarker]) || [];

  view.setChildNodes(buildTree(nodes, bindings));
});

var view = new Window({
  modal: true,
  visible: selectedDomNode.as(Boolean),
  template: resource('./template/template-info.tmpl'),
  binding: {
    upName: selectedObject.as(function(object){
      if (object)
        return object.parentNode ? 'parent' : object.owner ? 'owner' : '';
    }),
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
          },
          action: {
            log: function(){
              if (selectedDomNode.value)
              {
                var id = selectedDomNode.value[inspectBasisTemplateMarker];
                var object = inspectBasisTemplate.resolveObjectById(id);
                var objectBinding = object.binding;
                var templateBinding = inspectBasisTemplate.resolveTemplateById(id).getBinding();
                var result = {};

                for (var key in objectBinding)
                  if (key != '__extend__' && key != 'bindingId')
                    if (templateBinding.names.indexOf(key) != -1)
                      result[key] = objectBinding[key].getter(object);  // TODO: return real template values

                global.$lastInspectValue = result;
                console.log(result);
              }
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
          used: 'data:',
          loc: 'data:',
          highlight: hoveredBinding.compute('update', function(node, value){
            return node.data.used ? !value || node.data.name === value : false;
          })
        },
        action: {
          enter: function(){
            if (this.data.used)
              hoveredBinding.set(this.data.name);
          },
          leave: function(){
            hoveredBinding.set();
          },
          pickValue: function(){
            if (this.data.loc)
              fileAPI.openFile(this.data.loc);

            // if (this.data.used)
            // {
            //   var object = selectedObject.value;
            //   console.log('Value for `' + this.data.name + '` binding:\n', object.binding[this.data.name].getter(object));
            // }
          }
        }
      }
    })
  },
  action: {
    up: function(){
      var object = selectedObject.value;
      selectedDomNode.set((object.parentNode || object.owner).element);
    },
    enter: function(e){
      hoveredBinding.set(e.sender.getAttribute('data-binding'));
    },
    leave: function(){
      hoveredBinding.set();
    },
    down: function(e){
      //if (e.sender.title)
    },
    close: function(){
      selectedDomNode.set();
    }
  },

  realign: function(){},
  setZIndex: function(){},
  init: function(){
    Window.prototype.init.call(this);
    this.dde.fixLeft = false;
    this.dde.fixTop = false;
  }
});

isolatePrefix = view.template.getIsolatePrefix();

module.exports = selectedDomNode;
