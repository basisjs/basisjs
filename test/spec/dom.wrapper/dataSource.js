module.exports = {
  name: 'dataSource',
  test: [
    {
      name: 'dataSource in config',
      test: function(){
        var dataset = getDataset();
        var length = dataset.itemCount;
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        assert(checkNode(node) === false);
        assert(length > 0);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === length);
        assert(dataset.itemCount === length);
      }
    },
    {
      name: 'dataSource should be drop on source destroy',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);

        dataset.destroy();

        assert(checkNode(node) === false);
        assert(node.dataSource === null);
      }
    },
    {
      name: 'DatasetWrapper instance as dataSource in config',
      test: function(){
        var dataset = getDataset();
        var length = dataset.itemCount;
        var datasetWrapper = new DatasetWrapper({ dataset: dataset });
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: datasetWrapper
        });

        assert(checkNode(node) === false);
        assert(length > 0);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === length);
        assert(dataset.itemCount === length);
      }
    },
    {
      name: 'Value instance as dataSource in config',
      test: function(){
        var dataset = getDataset();
        var length = dataset.itemCount;
        var datasetWrapper = new DatasetWrapper({ dataset: dataset });
        var value = new Value({ value: datasetWrapper });
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        assert(checkNode(node) === false);
        assert(length > 0);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === length);
        assert(dataset.itemCount === length);
      }
    },
    {
      name: 'dataSource adapter should be removed on destroy',
      test: function(){
        // non-empty dataSource
        var dataset = getDataset();
        var value = new Value({ value: dataset });
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.dataSourceRA_.source === value);

        node.destroy();

        assert(node.dataSource === null);
        assert(node.dataSourceRA_ === null);

        // empty dataSource
        var value = new Value();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.dataSourceRA_.source === value);

        node.destroy();

        assert(node.dataSource === null);
        assert(node.dataSourceRA_ === null);
      }
    },
    {
      name: 'dataSource adapter shouldn\'t be removed on source destroy',
      test: function(){
        // non-empty dataSource
        var dataset = new Dataset({
          handler: {
            destroy: function(){
              value.set(null);
            }
          }
        });
        var value = new Value({ value: dataset });
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.dataSourceRA_.source === value);

        dataset.destroy();
        assert(node.dataSource === null);
        assert(value.value === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_ !== null && node.dataSourceRA_.source === value);
      }
    },
    {
      name: 'if dataSource in config, childNodes should be ignored',
      test: function(){
        var testSet = getTestSet();
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: testSet,
          dataSource: dataset
        });

        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);
      }
    },
    {
      name: 'if dataSource adapter in config, childNodes should be ignored',
      test: function(){
        var testSet = getTestSet();
        var value = new Value();
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: testSet,
          dataSource: value
        });

        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.dataSourceRA_ != null);
        assert(node.firstChild == null);
      }
    },
    {
      name: 'if dataSource set than node modify methods should throw an exception and should not to change childNodes or dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        assert(node.dataSource === dataset);

        var itemCount = dataset.itemCount;

        assert.exception(function(){
          node.appendChild(new Node);
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.insertBefore(new Node);
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.removeChild(node.firstChild);
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.replaceChild(new Node, node.firstChild);
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'node modify methods should throw an exception and should not to change childNodes or dataSource if dataSource adapter used',
      test: function(){
        var value = new Value();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);

        assert.exception(function(){
          node.appendChild(new Node);
        });
        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.insertBefore(new Node);
        });
        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.removeChild(node.firstChild);
        });
        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.replaceChild(new Node, node.firstChild);
        });
        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'clear with dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        var itemCount = dataset.itemCount;
        assert(node.dataSource === dataset);

        assert.exception(function(){
          node.clear();
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);

        // should no exception if dataSource is empty
        dataset.clear();
        node.clear();
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === 0);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'setChildNodes with dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        var itemCount = dataset.itemCount;
        assert(node.dataSource === dataset);

        assert.exception(function(){
          node.setChildNodes([new Node]);
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'setChildNodes with no dataSource but with dataSource adapter',
      test: function(){
        var value = new Value;
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);

        assert.exception(function(){
          node.setChildNodes([new Node]);
        });
        assert(node.dataSource === null);
        assert(node.dataSourceRA_ !== null);
        assert(node.dataSourceRA_.source === value);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'insertBefore(node/config) should throw exception if child with delegate->dataSource.item already exists',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        var itemCount = dataset.itemCount;
        assert(node.dataSource === dataset);
        assert(itemCount > 0 === true);

        assert.exception(function(){
          node.insertBefore(dataset.pick());
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.insertBefore({ delegate: dataset.pick() });
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);

        assert.exception(function(){
          node.insertBefore(new Node({ delegate: dataset.pick() }));
        });
        assert(node.dataSource === dataset);
        assert(dataset.itemCount === itemCount);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'set/reset/set dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory
        });

        node.setDataSource(dataset);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

        node.setDataSource();
        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.childNodes.length === 0);

        node.setDataSource(dataset);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);
      }
    },
    {
      name: 'set/reset/set DatasetWrapper instance as dataSource',
      test: function(){
        var dataset = getDataset();
        var datasetWrapper = new DatasetWrapper({ dataset: dataset });
        var node = new Node({
          childFactory: nodeFactory
        });

        node.setDataSource(datasetWrapper);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

        node.setDataSource();
        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.childNodes.length === 0);

        node.setDataSource(datasetWrapper);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

        datasetWrapper.setDataset();
        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.childNodes.length === 0);
      }
    },
    {
      name: 'set/reset/set Value instance as dataSource',
      test: function(){
        var dataset = getDataset();
        var datasetWrapper = new DatasetWrapper({ dataset: dataset });
        var value = new Value({ value: datasetWrapper });
        var node = new Node({
          childFactory: nodeFactory
        });

        node.setDataSource(value);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

        node.setDataSource();
        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.childNodes.length === 0);

        node.setDataSource(value);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

        value.set();
        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.childNodes.length === 0);
      }
    },
    {
      name: 'dynamic test for Value/DatasetWrapper as dataSource',
      test: function(){
        var dataset = new Dataset();
        var anotherDataset = new Dataset();
        var selectedDataset = new Value({ value: dataset });
        var node = new Node({
          dataSource: selectedDataset
        });

        assert(node.dataSource === dataset);  // true
        assert(node.dataSourceRA_.source === selectedDataset);  // true

        selectedDataset.set(null);

        assert(node.dataSource === null);  // true
        assert(node.dataSourceRA_.source === selectedDataset);  // true

        selectedDataset.set(new DatasetWrapper({ dataset: anotherDataset }));

        assert(node.dataSource === anotherDataset);  // true
        assert(node.dataSourceRA_.source === selectedDataset);  // true

        selectedDataset.value.setDataset(null);

        assert(node.dataSource === null);  // true
        assert(node.dataSourceRA_.source === selectedDataset);  // true
      }
    },
    {
      name: 'set/reset dataSource/childNodes',
      test: function(){
        var testSet = getTestSet();
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: testSet
        });
        assert(checkNode(node) === false);
        assert(node.childNodes.length === testSet.length);

        node.setDataSource(dataset);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

        node.setDataSource();
        assert(checkNode(node) === false);
        assert(node.dataSource === null);
        assert(node.childNodes.length === 0);

        node.setChildNodes(testSet);
        assert(checkNode(node) === false);
        assert(node.childNodes.length === testSet.length);

        node.setDataSource(dataset);
        assert(checkNode(node) === false);
        assert(node.dataSource === dataset);
        assert(node.childNodes.length === dataset.itemCount);

      }
    },
    {
      name: 'set dataSource and destroy dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        var itemCount = dataset.itemCount;

        assert(node.dataSource === dataset);
        assert(itemCount > 0);
        assert(checkNode(node) === false);

        dataset.destroy();

        assert(node.dataSource === null);
        assert(checkNode(node) === false);
      }
    },
    {
      name: 'destroy node with dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        var target = dataset.pick();
        var targetNode = basis.array.search(node.childNodes, target, 'root');

        node.destroy();

        var hasHandler = false;
        var cursor = target;
        while (cursor = cursor.handler)
        {
          if (cursor.context == targetNode)
            hasHandler = true;
        }

        assert(targetNode.delegate === null);
        assert(hasHandler === false);
      }
    },
    {
      name: 'clear dataSource',
      test: function(){
        var dataset = getDataset();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: dataset
        });

        var target = dataset.pick();
        var targetNode = basis.array.search(node.childNodes, target, 'root');

        dataset.clear();

        var hasHandler = false;
        var cursor = target;
        while (cursor = cursor.handler)
        {
          if (cursor.context == targetNode)
            hasHandler = true;
        }

        assert(targetNode.delegate === null);
        assert(hasHandler === false);
      }
    },
    {
      name: 'dataSource via Value.factory and subscription on node destroy',
      test: function(){
        var dataset = new Dataset;
        var node = new Node({
          active: true,
          dataSource: Value.factory(function(){
            return dataset;
          })
        });

        assert(dataset.subscriberCount == 1);
        assert(node.dataSource === dataset);

        var warn = basis.dev.warn;
        var warning = false;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.destroy();
        } finally {
          basis.dev.warn = warn;
        }

        assert(warning === false);
      }
    },
    {
      name: 'destroy active node with dataSource should not produce warnings',
      test: function(){
        var dataset = new Dataset;
        var node = new Node({
          active: true,
          dataSource: dataset
        });

        assert(dataset.subscriberCount == 1);
        assert(node.dataSource === dataset);

        var warn = basis.dev.warn;
        var warning = false;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.destroy();
        } finally {
          basis.dev.warn = warn;
        }

        assert(warning === false);
      }
    },
    {
      name: 'destroyDataSourceMember',
      test: [
        {
          name: 'should be true by default',
          test: function(){
            var node = new Node();

            assert(node.destroyDataSourceMember === true);
          }
        },
        {
          name: 'if true, child nodes produced by dataSource should be destroyed when remove from dataSource',
          test: function(){
            var objectDestroyCount = 0;
            var nodeDestroyCount = 0;
            var dataset = new Dataset({
              items: basis.array.create(3, function(){
                return new DataObject({
                  handler: {
                    destroy: function(){
                      objectDestroyCount++;
                    }
                  }
                });
              })
            });
            var node = new Node({
              dataSource: dataset,
              childClass: Node.subclass({
                handler: {
                  destroy: function(){
                    nodeDestroyCount++;
                  }
                }
              }),
              childFactory: function(config){
                return new this.childClass(config);
              }
            });

            assert(dataset.itemCount === 3);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 3);
            assert(nodeDestroyCount === 0);

            dataset.clear();
            assert(dataset.itemCount === 0);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 0);
            assert(nodeDestroyCount === 3);
          }
        },
        {
          name: 'if true, child nodes produced by dataSource should be destroyed on dataSource change',
          test: function(){
            var objectDestroyCount = 0;
            var nodeDestroyCount = 0;
            var dataset = new Dataset({
              items: basis.array.create(3, function(){
                return new DataObject({
                  handler: {
                    destroy: function(){
                      objectDestroyCount++;
                    }
                  }
                });
              })
            });
            var node = new Node({
              dataSource: dataset,
              childClass: Node.subclass({
                handler: {
                  destroy: function(){
                    nodeDestroyCount++;
                  }
                }
              }),
              childFactory: function(config){
                return new this.childClass(config);
              }
            });

            assert(dataset.itemCount === 3);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 3);
            assert(nodeDestroyCount === 0);

            node.setDataSource();
            assert(dataset.itemCount === 3);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 0);
            assert(nodeDestroyCount === 3);
          }
        },
        {
          name: 'if false, child nodes produced by dataSource should not be destroyed when remove from dataSource',
          test: function(){
            var objectDestroyCount = 0;
            var nodeDestroyCount = 0;
            var dataset = new Dataset({
              items: basis.array.create(3, function(){
                return new DataObject({
                  handler: {
                    destroy: function(){
                      objectDestroyCount++;
                    }
                  }
                });
              })
            });
            var node = new Node({
              destroyDataSourceMember: false,
              dataSource: dataset,
              childClass: Node.subclass({
                handler: {
                  destroy: function(){
                    nodeDestroyCount++;
                  }
                }
              }),
              childFactory: function(config){
                return new this.childClass(config);
              }
            });

            assert(dataset.itemCount === 3);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 3);
            assert(nodeDestroyCount === 0);

            dataset.clear();
            assert(dataset.itemCount === 0);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 0);
            assert(nodeDestroyCount === 0);
          }
        },
        {
          name: 'if false, child nodes produced by dataSource should not be destroyed on dataSource change',
          test: function(){
            var objectDestroyCount = 0;
            var nodeDestroyCount = 0;
            var dataset = new Dataset({
              items: basis.array.create(3, function(){
                return new DataObject({
                  handler: {
                    destroy: function(){
                      objectDestroyCount++;
                    }
                  }
                });
              })
            });
            var node = new Node({
              destroyDataSourceMember: false,
              dataSource: dataset,
              childClass: Node.subclass({
                handler: {
                  destroy: function(){
                    nodeDestroyCount++;
                  }
                }
              }),
              childFactory: function(config){
                return new this.childClass(config);
              }
            });

            assert(dataset.itemCount === 3);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 3);
            assert(nodeDestroyCount === 0);

            node.setDataSource();
            assert(dataset.itemCount === 3);
            assert(objectDestroyCount === 0);
            assert(node.childNodes.length === 0);
            assert(nodeDestroyCount === 0);
          }
        }
      ]
    }
  ]
};
