module.exports = {
  name: 'grouping',
  test: [
    {
      name: 'grouping in config',
      test: [
        {
          name: 'as string',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              grouping: 'data.group'
            });

            for (var i = 0; i < testSet.length; i++)
              node.appendChild(testSet[i]);

            assert(checkNode(node) === false);
            assert($values(basis.array.sort(testSet, 'data.group')), $values(node.childNodes));
          }
        },
        {
          name: 'as object with no child nodes and sorting',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.group',
                sorting: 'data.id',
                sortingDesc: true
              }
            });

            for (var i = 0; i < testSet.length; i++)
              node.appendChild(testSet[i]);

            assert(checkNode(node) === false);
            assert($values([4, 3, 8, 1, 5, 6, 0, 2, 7, 9].map(convertToNode)), $values(node.childNodes));
          }
        },
        {
          name: 'as object with child nodes and sorting',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              sorting: 'data.value',
              sortingDesc: true,
              grouping: {
                rule: 'data.group',
                sorting: 'data.id',
                sortingDesc: true
              },
              childNodes: testSet
            });

            assert(checkNode(node) === false);
            assert($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));
          }
        }
      ]
    },
    {
      name: 'update PartitionNode and order',
      test: [
        {
          name: 'simple value',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              grouping: {
                rule: 'data.group',
                sorting: basis.getter('data.title').as(String),
                sortingDesc: true
              },
              childNodes: testSet
            });

            assert(checkNode(node) === false);
            assert($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            var groups = getGroups(node);
            for (var i = 0; i < groups.length; i++)
              groups[i].update({ title: 'group' + groups[i].data.title });

            assert(checkNode(node) === false);
            assert($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            groups[0].update({ title: '-1' });
            assert(checkNode(node) === false);
            assert($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

            groups[1].update({ title: '-2' });
            assert(checkNode(node) === false);
            assert($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[2].update({ title: '-3' });
            assert(checkNode(node) === false);
            assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[3].update({ title: '-4' });
            assert(checkNode(node) === false);
            assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
          }
        },
        {
          name: 'with delegate',
          test: function(){
            var groupNodes = {};
            for (var i = 1; i <= 4; i++)
              groupNodes[i] = new Node({
                data: {
                  title: i
                }
              });

            // ======================================
            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              grouping: {
                rule: basis.getter('data.group').as(groupNodes),
                sorting: basis.getter('data.title'),
                sortingDesc: true
              },
              childNodes: testSet//.filter(basis.getter('data.group >= 3'))
            });

            assert(checkNode(node) === false);
            assert(getGroups(node).length === 4);
            assert($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            var groups = getGroups(node);
            /*for (var i = 0; i < groups.length; i++)
              groups[i].update({ title: 'group' + i });*/

            groups[0].update({ title: -4 });
            assert(checkNode(node) === false);
            assert($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

            groups[1].update({ title: -3 });
            assert(checkNode(node) === false);
            assert($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[2].update({ title: -2 });
            assert(checkNode(node) === false);
            assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[3].update({ title: -1 });
            assert(checkNode(node) === false);
            assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
          }
        }
      ]
    },
    {
      name: 'set grouping',
      test: [
        {
          name: 'set/remove, change grouping',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });
            assert(checkNode(node) === false);

            node.setGrouping(basis.getter('data.group'));
            assert(checkNode(node) === false);
            assert(getGroups(node).length === 4);

            // change grouping
            node.setGrouping(basis.getter('data.value'));
            assert(checkNode(node) === false);
            assert(getGroups(node).length === 10);

            // drop grouping
            var order = basis.array.from(node.childNodes);
            node.setGrouping();
            assert(checkNode(node) === false);
            assert(node.grouping === null);
            assert(order, node.childNodes);

            node.setGrouping({
              rule: 'data.value',
              sorting: basis.getter('data.title')
            });
            assert(checkNode(node) === false);

            var order = basis.array.from(node.childNodes);
            // nothing changed
            node.grouping.setSorting(node.grouping.sorting);
            assert(checkNode(node) === false);
            assert(order, node.childNodes);
            // reverse order
            node.grouping.setSorting(node.grouping.sorting, true);
            assert(checkNode(node) === false);
            assert($values(order).reverse(), $values(node.childNodes));
          }
        },
        {
          name: 'set/remove grouping via setOwner',
          test: function(){
            var groupingDestroyed = false;
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              grouping: {
                autoDestroyWithNoOwner: false,
                handler: {
                  destroy: function(){
                    groupingDestroyed = true;
                  }
                }
              }
            });
            var grouping = node.grouping;

            assert(checkNode(node) === false);
            assert(checkNode(grouping) === false);
            assert(basis.Class.isClass(node.groupingClass));
            assert(grouping instanceof node.groupingClass);
            assert(grouping.owner === node);

            grouping.setOwner();
            assert(checkNode(node) === false);
            assert(checkNode(grouping) === false);
            assert(groupingDestroyed === false);
            assert(node.grouping === null);
          }
        },
        {
          name: 'changing grouping with no alive flag should destroy old grouping',
          test: function(){
            var groupingDestroyed = false;
            var node = new Node({
              grouping: {
                handler: {
                  destroy: function(){
                    groupingDestroyed = true;
                  }
                }
              }
            });
            var grouping = node.grouping;

            assert(checkNode(node) === false);
            assert(checkNode(grouping) === false);
            assert(basis.Class.isClass(node.groupingClass));
            assert(grouping instanceof node.groupingClass);
            assert(grouping.owner === node);

            node.setGrouping();
            assert(checkNode(node) === false);
            assert(node.grouping === null);
            assert(groupingDestroyed === true);
          }
        },
        {
          name: 'set grouping and clear childNodes',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.value'
              }
            });
            assert(checkNode(node) === false);

            node.setChildNodes(getTestSet());
            assert(checkNode(node) === false);

            node.clear();
            assert(checkNode(node) === false);

            node.setChildNodes(getTestSet());
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'create with grouping and destroy grouping',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.value'
              }
            });

            var grouping = node.grouping;
            grouping.destroy();
            assert(node.grouping === null);
            assert(checkNode(node) === false);
            assert(checkDestroyedObject(grouping) === false);
          }
        },
        {
          name: 'set grouping and destroy grouping',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory
            });

            node.setGrouping('data.value');
            assert(node.grouping !== null);

            var grouping = node.grouping;
            grouping.destroy();
            assert(node.grouping === null);
            assert(checkNode(node) === false);
            assert(checkDestroyedObject(grouping) === false);
          }
        }
      ]
    },
    {
      name: 'nesting grouping',
      test: [
        {
          name: 'create with nested grouping, decrease deep step by step, and increase back step by step',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.value',
                grouping: {
                  rule: 'data.id % 4',
                  grouping: basis.getter('data.id % 2')
                }
              },
              childNodes: getTestSet()
            });
            assert(checkNode(node) === false);

            node.grouping.grouping.setGrouping();
            assert(checkNode(node) === false);

            node.grouping.setGrouping();
            assert(checkNode(node) === false);

            node.setGrouping();
            assert(checkNode(node) === false);

            node.setGrouping('data.value');
            assert(checkNode(node) === false);

            node.grouping.setGrouping('data.id % 4');
            assert(checkNode(node) === false);

            node.grouping.grouping.setGrouping('data.id % 2');
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'set childs for node with nested grouping',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.value',
                grouping: {
                  rule: 'data.id % 4',
                  grouping: basis.getter('data.id % 2')
                }
              }
            });

            node.setChildNodes(getTestSet());
            assert(checkNode(node) === false);

            node.clear();
            assert(checkNode(node) === false);

            node.setChildNodes(getTestSet());
            assert(checkNode(node) === false);

            node.setGrouping();
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'increase deep of nested grouping step by step and reset',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });
            assert(checkNode(node) === false);

            node.setGrouping('data.value');
            assert(checkNode(node) === false);

            node.grouping.setGrouping('data.id % 4');
            assert(checkNode(node) === false);

            node.grouping.grouping.setGrouping('data.id % 2');
            assert(checkNode(node) === false);

            node.setGrouping();
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'replace nested grouping by other',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });
            node.setGrouping({
              rule: 'data.value',
              grouping: {
                rule: 'data.id % 4',
                grouping: basis.getter('data.id % 2')
              }
            });
            assert(checkNode(node) === false);

            node.setGrouping('data.value');
            assert(node.grouping !== null);

            node.setGrouping({
              rule: 'data.value',
              grouping: {
                rule: 'data.id % 4',
                grouping: basis.getter('data.id % 2')
              }
            });
            assert(checkNode(node) === false);

            node.setGrouping();
            assert(checkNode(node) === false);
          }
        }
      ]
    },
    {
      name: 'setGrouping after create and update PartitionNode with delegate',
      test: function(){
        var groupNodes = {};
        for (var i = 1; i <= 4; i++)
          groupNodes[i] = new Node({
            data: {
              title: i
            }
          });


        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true,
          childNodes: testSet//.filter(basis.getter('data.group >= 3'))
        });

        assert(checkNode(node) === false);

        node.setGrouping({
          rule: basis.getter('data.group').as(groupNodes),
          sorting: basis.getter('data.title'),
          sortingDesc: true
        });

        assert(checkNode(node) === false);
        assert(getGroups(node).length === 4);
        assert($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

        var groups = getGroups(node);
        /*for (var i = 0; i < groups.length; i++)
          groups[i].update({ title: 'group' + i });*/

        groups[0].update({ title: -4 });
        assert(checkNode(node) === false);
        assert($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

        groups[1].update({ title: -3 });
        assert(checkNode(node) === false);
        assert($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[2].update({ title: -2 });
        assert(checkNode(node) === false);
        assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[3].update({ title: -1 });
        assert(checkNode(node) === false);
        assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
      }
    },
    {
      name: 'setGrouping after create and update PartitionNode with delegate & subscription',
      test: function(){
        var GroupDelegateClass = Class(Node, {
          emit_subscribersChanged: function(){
            Node.prototype.emit_subscribersChanged.call(this);
            if (this.subscriberCount)
              this.update({ title: this.data.title_ });
          }
        });

        var groupNodes = {};
        for (var i = 1; i <= 4; i++)
          groupNodes[i] = new GroupDelegateClass({
            data: {
              title_: -i,
              title: i
            }
          });


        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true,
          groupingClass: {
            childClass: {
              active: true
            }
          },
          childNodes: testSet//.filter(basis.getter('data.group >= 3'))
        });

        assert(checkNode(node) === false);

        node.setGrouping({
          rule: basis.getter('data.group').as(groupNodes),
          sorting: basis.getter('data.title'),
          sortingDesc: true
        });

        assert(checkNode(node) === false);
        assert(getGroups(node).length === 4);
        assert($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
      }
    },
    {
      name: 'grouping change events (issue #8)',
      test: function(){
        // preparation
        var events;
        var node = new Node({
          grouping: {},
          handler: {
            '*': function(e){
              if (events && e.type == 'groupingChanged')
                events.push(e);
            }
          }
        });

        // test
        events = [];
        node.setGrouping({});
        assert(events.length === 1);
      }
    },
    {
      name: 'using dataSource for grouping node',
      test: [
        {
          name: 'childNodes + group dataset',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });

            node.setGrouping({
              rule: 'data.groupObj',
              dataSource: groupDatasetByGroup
            });
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));

            node.setGrouping({
              rule: 'data.groupObj',
              dataSource: groupDatasetByGroup
            });
            this.is(false, checkNode(node));

            node.grouping.setDataSource();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'childNodes + group dataset #2',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              grouping: {
                rule: 'data.groupObj'
              }
            });
            this.is(false, checkNode(node));

            node.grouping.setDataSource(groupDatasetByGroup);
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'childNodes + empty group dataset + fill/clear the dataset',
          test: function(){
            var groupDataSource = new Dataset();
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              grouping: {
                rule: 'data.groupObj',
                dataSource: groupDataSource
              }
            });
            this.is(false, checkNode(node));

            groupDataSource.add(groupDatasetByGroup.getItems());
            this.is(false, checkNode(node));

            groupDataSource.clear();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'childNodes + empty group dataset + fill/clear the dataset + destroy dataset',
          test: function(){
            var groupDataSource = new Dataset();
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              grouping: {
                rule: 'data.groupObj',
                dataSource: groupDataSource
              }
            });
            this.is(false, checkNode(node));

            groupDataSource.add(groupDatasetByGroup.getItems());
            this.is(false, checkNode(node));

            groupDataSource.destroy();
            this.is(null, node.grouping.dataSource);
            this.is(4, node.grouping.childNodes.length);
            this.is(false, checkNode(node));

            var dataset2 = new Dataset({ items: groupDatasetByGroup.getItems() });
            var itemCount = dataset2.itemCount;
            this.is(true, itemCount > 0);

            node.grouping.setDataSource(dataset2);
            this.is(dataset2, node.grouping.dataSource);
            this.is(itemCount, dataset2.itemCount);
            this.is(false, checkNode(node));

            node.clear();
            this.is(dataset2, node.grouping.dataSource);
            this.is(itemCount, dataset2.itemCount);
            this.is(0, node.childNodes.length);
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'childNodes + group dataset 10',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });

            node.setGrouping({
              rule: 'data.groupObj',
              dataSource: groupDatasetByGroup10
            });
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));

            node.setGrouping({
              rule: 'data.groupObj',
              dataSource: groupDatasetByGroup10
            });
            this.is(false, checkNode(node));

            node.grouping.setDataSource();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'group dataset + child nodes on init',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              grouping: {
                rule: 'data.groupObj',
                dataSource: groupDatasetByGroup
              }
            });
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'group dataset + child nodes after init',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.groupObj',
                dataSource: groupDatasetByGroup
              }
            });
            this.is(false, checkNode(node));

            node.setChildNodes(getTestSet());
            this.is(false, checkNode(node));

            node.setChildNodes();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'set grouping and remove grouping with nullGroup',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: basis.array.create(10, basis.fn.$self),
              grouping: {
                rule: 'data.value',
                dataSource: new Dataset(),
                autoDestroyWithNoOwner: false
              }
            });
            var grouping = node.grouping;

            this.is(false, checkNode(node));
            this.is(false, checkNode(grouping));
            this.is(10, node.childNodes.length);
            this.is(10, grouping.nullGroup.nodes.length);

            node.setGrouping(null, true);
            this.is(false, checkNode(node));
            this.is(false, checkNode(grouping));
            this.is(10, node.childNodes.length);
            this.is(0, grouping.nullGroup.nodes.length);
          }
        }
      ]
    }
  ]
};
