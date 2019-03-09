module.exports = {
  name: 'basis.ui',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var domUtils = basis.require('basis.dom');
    var Node = basis.require('basis.ui').Node;
    var Template = basis.require('basis.template.html').Template;
    var DataObject = basis.require('basis.data').Object;
    var Dataset = basis.require('basis.data').Dataset;
    var dataWrap = basis.require('basis.data').wrap;

    var domHelpers = basis.require('./helpers/dom_wrapper_node.js');

    function getTestNodes(count){
      return dataWrap(basis.array.create(count || 10, basis.fn.$self), true);
    }

    function getTopGrouping(node){
      var cursor = node;
      while (cursor.grouping)
        cursor = cursor.grouping;
      return cursor !== node ? cursor : null;
    }

    function checkNode(node, groupingLevel){
      var res;

      if (!groupingLevel)
        groupingLevel = 0;

      if (res = domHelpers.checkNode(node))
        return 'basis.dom.wrapper: ' + res;

      if (node.childNodes)
      {
        var nestedElements = domUtils.axis(node.element, domUtils.AXIS_DESCENDANT);
        var lastChildElementIndex = -1;

        for (var i = 0; i < node.childNodes.length; i++)
        {
          var child = node.childNodes[i];
          var target = child.groupNode || node;
          var containerElement = target.childNodesElement || node.childNodesElement;

          if (child.element.parentNode !== containerElement)
            return 'Child #' + i + ' element has wrong container (parentNode element reference)';

          // check position
          var childElementIndex = nestedElements.indexOf(child.element);

          if (childElementIndex == -1)
            return 'Child #' + i + ' element has not found in parent DOM fragment';

          if (childElementIndex < lastChildElementIndex)
            return 'Child #' + i + ' element has wrong position';

          lastChildElementIndex = childElementIndex;
        }
      }

      if (node.grouping)
        if (res = checkNode(node.grouping, groupingLevel + 1))
          return 'Grouping level ' + (groupingLevel + 1) + ': ' + res;

      return false;
    }
  },

  test: [
    {
      name: 'Template update',
      test: [
        {
          name: 'grouping, node template update',
          test: function(){
            var node = new Node({
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2'
              }
            });

            assert(checkNode(node) === false);
            assert(node.childNodes.length === 10);

            node.setTemplate(new Template('<div/>'));
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'node with groupsElement, grouping, node template update',
          test: function(){
            var node = new Node({
              template:
                '<div>' +
                  '<div{childNodesElement}></div>' +
                  '<div{groupsElement}></div>' +
                '</div>',
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2'
              }
            });

            assert(checkNode(node) === false);
            assert(node.childNodesElement.childNodes.length === 0);
            assert(node.tmpl.groupsElement.childNodes.length === 2);

            node.setTemplate(new Template(
              '<div>' +
                '<div{groupsElement}></div>' +
                '<div{childNodesElement}></div>' +
              '</div>'
            ));
            assert(checkNode(node) === false);
            assert(node.childNodesElement.childNodes.length === 0);
            assert(node.tmpl.groupsElement.childNodes.length === 2);
          }
        },
        {
          name: 'grouping with null group, no groups, node template update',
          test: function(){
            var node = new Node({
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2',
                dataSource: new Dataset()
              }
            });

            assert(checkNode(node) === false);
            assert(node.grouping.firstChild === null);

            node.setTemplate(new Template('<div/>'));
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'grouping with null group, with groups, node template update',
          test: function(){
            var node = new Node({
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2',
                dataSource: new Dataset({
                  items: [new DataObject()]
                })
              }
            });

            assert(checkNode(node) === false);
            assert(node.grouping.firstChild !== null);

            node.setTemplate(new Template('<div/>'));
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'node with groupsElement, grouping with null group, no groups, node template update',
          test: function(){
            // null group nodes put to childNodesElement
            var node = new Node({
              template:
                '<div>' +
                  '<div{childNodesElement}></div>' +
                  '<div{groupsElement}></div>' +
                '</div>',
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2',
                dataSource: new Dataset()
              }
            });

            assert(checkNode(node) === false);
            assert(node.childNodesElement.childNodes.length === 10);
            assert(node.tmpl.groupsElement.childNodes.length === 0);
            assert(node.grouping.firstChild === null === true);

            node.setTemplate(new Template(
              '<div>' +
                '<div{groupsElement}></div>' +
                '<div{childNodesElement}></div>' +
              '</div>'
            ));
            assert(checkNode(node) === false);
            assert(node.childNodesElement.childNodes.length === 10);
            assert(node.tmpl.groupsElement.childNodes.length === 0);
          }
        },
        {
          name: 'node with groupsElement, grouping with null group, has groups, node template update',
          test: function(){
            // null group nodes put to childNodesElement
            var node = new Node({
              template:
                '<div>' +
                  '<div{childNodesElement}></div>' +
                  '<div{groupsElement}></div>' +
                '</div>',
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2',
                dataSource: new Dataset({
                  items: [new DataObject()]
                })
              }
            });

            assert(checkNode(node) === false);
            assert(node.childNodesElement.childNodes.length === 10);
            assert(node.tmpl.groupsElement.childNodes.length === 1);
            assert(node.grouping.firstChild !== null);

            node.setTemplate(new Template(
              '<div>' +
                '<div{groupsElement}></div>' +
                '<div{childNodesElement}></div>' +
              '</div>'
            ));
            assert(checkNode(node) === false);
            assert(node.childNodesElement.childNodes.length === 10);
            assert(node.tmpl.groupsElement.childNodes.length === 1);
          }
        },
        {
          name: 'nested grouping, node template update',
          test: function(){
            var node = new Node({
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2',
                grouping: {
                  rule: 'data.id % 2'
                }
              }
            });

            assert(checkNode(node) === false);

            node.setTemplate(new Template('<div/>'));
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'grouping, partition node template update',
          test: function(){
            var node = new Node({
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2'
              }
            });

            assert(checkNode(node) === false);
            assert(node.grouping.firstChild.nodes.length === 5);

            node.grouping.firstChild.setTemplate(new Template('<span/>'));
            assert(checkNode(node) === false);
            assert(node.grouping.firstChild.element.tagName === 'SPAN');
          }
        },
        {
          name: 'nested grouping, partition template update',
          test: function(){
            var node = new Node({
              childNodes: getTestNodes(10),
              grouping: {
                rule: 'data.value % 2',
                grouping: {
                  rule: 'data.id % 2'
                }
              }
            });

            assert(false, checkNode(node));

            // 1st level grouping partition node change
            var partitionNode = node.grouping.firstChild;
            partitionNode.setTemplate(new Template('<span/>'));
            assert(checkNode(node) === false);
            assert(partitionNode.element.tagName === 'SPAN');

            // 2st level grouping partition node change
            var partitionNode = node.grouping.grouping.firstChild;
            partitionNode.setTemplate(new Template('<span/>'));
            assert(checkNode(node) === false);
            assert(partitionNode.element.tagName === 'SPAN');
          }
        },
        {
          name: 'When template instance changing, old handlers should be removed',
          test: function(){
            var node = new Node({
              template: '{x}',
              binding: {
                x: 'data:'
              }
            });

            // one handler for bindings
            assert(node.debug_handlers().length === 1);

            // set template with no bindings should lead to empty handler list
            node.setTemplate(new Template('bar'));
            assert(node.debug_handlers().length === 0);
          }
        }
      ]
    },
    {
      name: 'Bindings',
      test: [
        {
          name: 'resource as binding instance',
          test: function(){
            var resource = basis.resource.virtual('js', function(exports, module){
              module.exports = new Node();
            });

            var node = new Node({
              template: '<!--{x}-->',
              binding: {
                x: resource
              }
            });

            assert(node.binding.x.getter(node) === resource.fetch().element);
          }
        },
        {
          name: 'transpiled es6-module resource as binding instance',
          test: function(){
            var resource = basis.resource.virtual('js', function(exports, module){
              Object.defineProperty(module.exports, '__esModule', { value: true });
              module.exports.default = new Node();
            });

            var node = new Node({
              template: '<!--{x}-->',
              binding: {
                x: resource
              }
            });

            assert(node.binding.x.getter(node) === resource.fetch().default.element);
          }
        }
      ]
    },
    require('./ui/field.js'),
    require('./ui/calendar.js')
  ]
};
