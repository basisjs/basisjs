module.exports = {
  name: 'basis.dom.wrapper',

  init: function(){
    var Class = basis.Class;
    var DOM = basis.require('basis.dom');
    var AbstractNode = basis.require('basis.dom.wrapper').AbstractNode;
    var Node = basis.require('basis.dom.wrapper').Node;
    var Selection = basis.require('basis.dom.wrapper').Selection;
    var Value = basis.require('basis.data').Value;
    var DataObject = basis.require('basis.data').Object;
    var Dataset = basis.require('basis.data').Dataset;
    var DatasetWrapper = basis.require('basis.data').DatasetWrapper;
    var READY = basis.require('basis.data').STATE.READY;

    Node.extend({
      listen: basis.object.extend({
        parentNode: {},
        childNode: {},
        satellite: {},
        owner: {}
      }, Node.prototype.listen)
    });

    var domHelpers = basis.require('./helpers/dom_wrapper_node.js');
    var checkNode = domHelpers.checkNode;
    var getGroups = domHelpers.getGroups;

    var groupDatasetByGroupMap = {};
    var groupDatasetByGroup10 = new Dataset({
      items: basis.array.create(10, function(idx){
        return groupDatasetByGroupMap[idx + 1] = new DataObject({
          data: {
            id: idx + 1,
            title: idx + 1
          }
        });
      })
    });
    var groupDatasetByGroup = new Dataset({
      items: basis.array.create(4, function(idx){
        return groupDatasetByGroupMap[idx + 1];
      })
    });


    var testSet = [
      { title: 'node0', value: 0, group: 1 },
      { title: 'node1', value: 1, group: 2 },
      { title: 'node2', value: 2, group: 1 },
      { title: 'node3', value: 3, group: 3 },
      { title: 'node4', value: 4, group: 4 },
      { title: 'node5', value: 5, group: 2 },
      { title: 'node6', value: 6, group: 2 },
      { title: 'node7', value: 7, group: 1 },
      { title: 'node8', value: 8, group: 3 },
      { title: 'node9', value: 9, group: 1 }
    ].map(function(item){
      item.groupObj = groupDatasetByGroupMap[item.group];
      return { data: item };
    });

    var convertToNode = basis.getter(basis.fn.$self).as(testSet);

    function getTestSet(){
      return testSet.map(function(item){
        return {
          data: basis.object.slice(item.data)
        };
      });
    }

    function getDataset(){
      return new Dataset({
        items: testSet.map(function(item){
          return new DataObject({
            data: basis.object.slice(item.data)
          });
        })
      });
    }

    function nodeFactory(cfg){
      return new Node(cfg);
    };

    function checkDestroyedObject(object){
      var proto = object.constructor.prototype;
      var properties = [];

      for (var key in object)
      {
        var value = object[key];
        if (key !== 'data' && value !== proto[key] && typeof value == 'object' && value !== null)
          properties.push(key);
      }

      return properties.length
        ? 'properties are not reset in destroyed object: ' + properties.join(', ')
        : false;
    }

    function $values(ar){
      return ar.map(function(node){
        return node.data.value + '(' + node.data.group + ')';
      });
    }
  },

  test: [
    {
      name: 'Basic',
      test: [
        {
          name: 'create',
          test: function(){
            var node = new Node();
            assert(checkNode(node) === false);

            var node = new Node({ data: { a: 1, b: 2 } });
            assert({ a: 1, b: 2 }, node.data);
          }
        },
        {
          name: 'create with childNodes',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({ childNodes: testSet.map(nodeFactory) });
            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet), $values(node.childNodes));

            var testSet = getTestSet();
            var node = new Node({ childFactory: nodeFactory, childNodes: testSet });
            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet), $values(node.childNodes));
          }
        },
        {
          name: 'appendChild',
          test: function(){
            var node = new Node();
            var testSet = getTestSet();
            for (var i = 0; i < testSet.length; i++)
              node.appendChild(new Node(testSet[i]));
            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet), $values(node.childNodes));
          }
        },
        {
          name: 'insertBefore',
          test: function(){
            var testSet = getTestSet();
            var node = new Node();
            for (var i = 0; i < testSet.length; i++)
              node.insertBefore(new Node(testSet[i]));

            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet), $values(node.childNodes));

            var testSet = getTestSet();
            var node = new Node();
            for (var i = 0; i < testSet.length; i++)
              node.insertBefore(new Node(testSet[i]), node.firstChild);

            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet).reverse(), $values(node.childNodes));
          }
        },
        {
          name: 'DOM.insert',
          test: function(){
            var testSet = getTestSet();
            var node = new Node();
            DOM.insert(node, testSet.map(nodeFactory));
            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet), $values(node.childNodes));

            var testSet = getTestSet();
            var node = new Node({ childFactory: nodeFactory });
            DOM.insert(node, testSet);
            assert(checkNode(node) === false);
            assert(node.childNodes.length === testSet.length);
            assert($values(testSet), $values(node.childNodes));
          }
        }
      ]
    },
    {
      name: 'Owner',
      test: [
        {
          name: 'drop owner on owner destroy',
          test: function(){
            var owner = new Node();
            var node = new Node({
              owner: owner
            });

            assert(checkNode(node) === false);
            assert(checkNode(owner) === false);
            assert(node.owner === owner);

            owner.destroy();

            assert(checkNode(node) === false);
            assert(checkNode(owner) === false);
            assert(node.owner === null);
          }
        }
      ]
    },
    require('./dom.wrapper/satellite.js'),
    require('./dom.wrapper/dataSource.js'),
    require('./dom.wrapper/grouping.js'),
    require('./dom.wrapper/selection.js'),
    require('./dom.wrapper/dynamic.js')
  ]
};
