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

        this.is(false, checkNode(node));
        this.is(true, length > 0);
        this.is(true, node.dataSource === dataset);
        this.is(length, node.childNodes.length);
        this.is(length, dataset.itemCount);
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

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === dataset);

        dataset.destroy();

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === null);
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

        this.is(false, checkNode(node));
        this.is(true, length > 0);
        this.is(true, node.dataSource === dataset);
        this.is(length, node.childNodes.length);
        this.is(length, dataset.itemCount);
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

        this.is(false, checkNode(node));
        this.is(true, length > 0);
        this.is(true, node.dataSource === dataset);
        this.is(length, node.childNodes.length);
        this.is(length, dataset.itemCount);
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

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === dataset);
        this.is(true, node.dataSourceRA_.source === value);

        node.destroy();

        this.is(null, node.dataSource);
        this.is(null, node.dataSourceRA_);

        // empty dataSource
        var value = new Value();
        var node = new Node({
          childFactory: nodeFactory,
          dataSource: value
        });

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_.source === value);

        node.destroy();

        this.is(null, node.dataSource);
        this.is(null, node.dataSourceRA_);
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

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === dataset);
        this.is(true, node.dataSourceRA_.source === value);

        dataset.destroy();
        this.is(null, node.dataSource);
        this.is(null, value.value);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_ !== null && node.dataSourceRA_.source === value);
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

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === dataset);
        this.is(dataset.itemCount, node.childNodes.length);
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

        this.is(false, checkNode(node));
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ != null);
        this.is(true, node.firstChild == null);
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

        this.is(dataset, node.dataSource);

        var itemCount = dataset.itemCount;

        var exceptionHere = false;
        try {
          node.appendChild(new Node);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === dataset);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.insertBefore(new Node);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === dataset);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.removeChild(node.firstChild);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === dataset);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.replaceChild(new Node, node.firstChild);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === dataset);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);
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

        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);

        var exceptionHere = false;
        try {
          node.appendChild(new Node);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.insertBefore(new Node);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.removeChild(node.firstChild);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.replaceChild(new Node, node.firstChild);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);
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

        this.is(dataset, node.dataSource);

        var exceptionHere = false;
        try {
          node.clear();
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === dataset);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        // no exception if dataSource is empty
        dataset.clear();
        var exceptionHere = false;
        try {
          node.clear();
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === dataset);
        this.is(0, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(false, exceptionHere);
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
        this.is(dataset, node.dataSource);

        var exceptionHere = false;
        try {
          node.setChildNodes([new Node]);
        } catch(e){
          exceptionHere = true;
        }
        this.is(dataset, node.dataSource);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);
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

        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);

        var exceptionHere = false;
        try {
          node.setChildNodes([new Node]);
        } catch(e){
          exceptionHere = true;
        }
        this.is(true, node.dataSource === null);
        this.is(true, node.dataSourceRA_ !== null);
        this.is(true, node.dataSourceRA_.source === value);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);
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
        this.is(dataset, node.dataSource);
        this.is(true, itemCount > 0);

        var exceptionHere = false;
        try {
          node.insertBefore(dataset.pick());
        } catch(e){
          exceptionHere = true;
        }
        this.is(dataset, node.dataSource);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.insertBefore({ delegate: dataset.pick() });
        } catch(e){
          exceptionHere = true;
        }
        this.is(dataset, node.dataSource);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);

        var exceptionHere = false;
        try {
          node.insertBefore(new Node({ delegate: dataset.pick() }));
        } catch(e){
          exceptionHere = true;
        }
        this.is(dataset, node.dataSource);
        this.is(itemCount, dataset.itemCount);
        this.is(false, checkNode(node));
        this.is(true, exceptionHere);
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
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

        node.setDataSource();
        this.is(false, checkNode(node));
        this.is(null, node.dataSource);
        this.is(0, node.childNodes.length);

        node.setDataSource(dataset);
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);
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
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

        node.setDataSource();
        this.is(false, checkNode(node));
        this.is(null, node.dataSource);
        this.is(0, node.childNodes.length);

        node.setDataSource(datasetWrapper);
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

        datasetWrapper.setDataset();
        this.is(false, checkNode(node));
        this.is(null, node.dataSource);
        this.is(0, node.childNodes.length);
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
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

        node.setDataSource();
        this.is(false, checkNode(node));
        this.is(null, node.dataSource);
        this.is(0, node.childNodes.length);

        node.setDataSource(value);
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

        value.set();
        this.is(false, checkNode(node));
        this.is(null, node.dataSource);
        this.is(0, node.childNodes.length);
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

        this.is(true, node.dataSource === dataset);  // true
        this.is(true, node.dataSourceRA_.source === selectedDataset);  // true

        selectedDataset.set(null);

        this.is(true, node.dataSource === null);  // true
        this.is(true, node.dataSourceRA_.source === selectedDataset);  // true

        selectedDataset.set(new DatasetWrapper({ dataset: anotherDataset }));

        this.is(true, node.dataSource === anotherDataset);  // true
        this.is(true, node.dataSourceRA_.source === selectedDataset);  // true

        selectedDataset.value.setDataset(null);

        this.is(true, node.dataSource === null);  // true
        this.is(true, node.dataSourceRA_.source === selectedDataset);  // true
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
        this.is(false, checkNode(node));
        this.is(testSet.length, node.childNodes.length);

        node.setDataSource(dataset);
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

        node.setDataSource();
        this.is(false, checkNode(node));
        this.is(null, node.dataSource);
        this.is(0, node.childNodes.length);

        node.setChildNodes(testSet);
        this.is(false, checkNode(node));
        this.is(testSet.length, node.childNodes.length);

        node.setDataSource(dataset);
        this.is(false, checkNode(node));
        this.is(dataset, node.dataSource);
        this.is(dataset.itemCount, node.childNodes.length);

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

        this.is(dataset, node.dataSource);
        this.is(true, itemCount > 0);
        this.is(false, checkNode(node));

        dataset.destroy();

        this.is(null, node.dataSource);
        this.is(false, checkNode(node));
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

        this.is(true, !targetNode.delegate);
        this.is(false, hasHandler);
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

        this.is(true, !targetNode.delegate);
        this.is(false, hasHandler);
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
