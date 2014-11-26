module.exports = {
  name: 'Dynamic scenarions',
  test: [
    {
      name: 'set sorting',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: getTestSet()
        });

        this.is(false, checkNode(node));

        node.setSorting(basis.getter('data.value'));
        this.is(false, checkNode(node));

        var order = basis.array.from(node.childNodes);
        node.setSorting(basis.getter('data.value * -1'), true);
        this.is(false, checkNode(node));
        this.is(order, node.childNodes);

        node.setSorting();
        this.is(false, checkNode(node));

        node.setSorting(basis.getter('data.value'), true);
        this.is(false, checkNode(node));

        var order = basis.array.from(node.childNodes);
        for (var i = 0; i < order.length; i++)
          order[i].update({ value: -order[i].data.value });
        this.is(false, checkNode(node));
        this.is(order.reverse(), node.childNodes);
      },
    },
    {
      name: 'set sorting #2',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          childNodes: getTestSet()
        });
        this.is(false, checkNode(node));

        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true,
          childNodes: getTestSet()
        });
        this.is(false, checkNode(node));

        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true
        });
        this.is(false, checkNode(node));
        node.setChildNodes(getTestSet());
        this.is(false, checkNode(node));
        node.clear();
        this.is(false, checkNode(node));
        node.setChildNodes(getTestSet());
        this.is(false, checkNode(node));
      }
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
            this.is(false, checkNode(node));

            node.setGrouping(basis.getter('data.group'));
            this.is(false, checkNode(node));
            this.is(4, getGroups(node).length);

            // change grouping
            node.setGrouping(basis.getter('data.value'));
            this.is(false, checkNode(node));
            this.is(10, getGroups(node).length);

            // drop grouping
            var order = basis.array.from(node.childNodes);
            node.setGrouping();
            this.is(false, checkNode(node));
            this.is(null, node.grouping);
            this.is(order, node.childNodes);

            node.setGrouping({
              rule: 'data.value',
              sorting: basis.getter('data.title')
            });
            this.is(false, checkNode(node));

            var order = basis.array.from(node.childNodes);
            // nothing changed
            node.grouping.setSorting(node.grouping.sorting);
            this.is(false, checkNode(node));
            this.is(order, node.childNodes);
            // reverse order
            node.grouping.setSorting(node.grouping.sorting, true);
            this.is(false, checkNode(node));
            this.is($values(order).reverse(), $values(node.childNodes));
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

            this.is(false, checkNode(node));
            this.is(false, checkNode(grouping));
            this.is(true, basis.Class.isClass(node.groupingClass));
            this.is(true, grouping instanceof node.groupingClass);
            this.is(true, grouping.owner === node);

            grouping.setOwner();
            this.is(false, checkNode(node));
            this.is(false, checkNode(grouping));
            this.is(false, groupingDestroyed);
            this.is(true, node.grouping === null);
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
            this.is(false, checkNode(node));

            node.setChildNodes(getTestSet());
            this.is(false, checkNode(node));

            node.clear();
            this.is(false, checkNode(node));

            node.setChildNodes(getTestSet());
            this.is(false, checkNode(node));
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
            this.is(true, node.grouping === null);
            this.is(false, checkNode(node));
            this.is(false, checkDestroyedObject(grouping));
          }
        },
        {
          name: 'set grouping and destroy grouping',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory
            });

            node.setGrouping('data.value');
            this.is(true, node.grouping !== null);

            var grouping = node.grouping;
            grouping.destroy();
            this.is(true, node.grouping === null);
            this.is(false, checkNode(node));
            this.is(false, checkDestroyedObject(grouping));
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
            this.is(false, checkNode(node));

            node.grouping.grouping.setGrouping();
            this.is(false, checkNode(node));

            node.grouping.setGrouping();
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));

            node.setGrouping('data.value');
            this.is(false, checkNode(node));

            node.grouping.setGrouping('data.id % 4');
            this.is(false, checkNode(node));

            node.grouping.grouping.setGrouping('data.id % 2');
            this.is(false, checkNode(node));
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
            this.is(false, checkNode(node));

            node.clear();
            this.is(false, checkNode(node));

            node.setChildNodes(getTestSet());
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'increase deep of nested grouping step by step and reset',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });
            this.is(false, checkNode(node));

            node.setGrouping('data.value');
            this.is(false, checkNode(node));

            node.grouping.setGrouping('data.id % 4');
            this.is(false, checkNode(node));

            node.grouping.grouping.setGrouping('data.id % 2');
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));
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
            this.is(false, checkNode(node));

            node.setGrouping('data.value');
            this.is(true, node.grouping !== null);

            node.setGrouping({
              rule: 'data.value',
              grouping: {
                rule: 'data.id % 4',
                grouping: basis.getter('data.id % 2')
              }
            });
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));
          }
        }
      ]
    },
    {
      name: 'mixing sorting & grouping',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: getTestSet()
        });

        node.setGrouping(basis.getter('data.group'));
        this.is(false, checkNode(node));

        node.setSorting(basis.getter('data.value'));
        this.is(false, checkNode(node));

        node.setGrouping({
          rule: 'data.group',
          sorting: basis.getter('data.id'),
          sortingDesc: true
        });
        this.is(false, checkNode(node));

        node.setGrouping();
        this.is(false, checkNode(node));

        node.setSorting(basis.getter('data.group'), true);
        this.is(false, checkNode(node));

        node.setGrouping(basis.getter('data.group'));
        this.is(false, checkNode(node));

        var order = basis.array.from(node.childNodes);
        node.setSorting();
        this.is(false, checkNode(node));
        node.setGrouping();
        this.is(false, checkNode(node));
        this.is(order, node.childNodes);
      }
    },
    {
      name: 'mixing sorting & grouping, wrong order on child group changing (issue #1)',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: getTestSet(),
          sorting: 'data.value',
          grouping: 'data.group'
        });

        var child = node.firstChild;
        var orginalGroupId = child.data.group;

        child.update({ group: orginalGroupId + 1 });
        this.is(false, checkNode(node));

        child.update({ group: orginalGroupId });
        this.is(false, checkNode(node));

        ///////

        var node = new Node({
          childFactory: nodeFactory,
          sorting: 'data.value',
          grouping: {
            rule: 'data.group',
            sorting: 'data.id'
          },
          childNodes: [
            { data: { value: 2, group: 1 } },
            { data: { value: 3, group: 1 } },
            { data: { value: 3, group: 2 } },
            { data: { value: 4, group: 2 } },
            { data: { value: 1, group: 3 } },
            { data: { value: 4, group: 3 } },
            { data: { value: 5, group: 3 } },
            { data: { value: 1, group: 4 } }
          ]
        });

        var child = node.firstChild;

        child.update({ group: 2 });
        this.is(1, node.childNodes.indexOf(child));
        this.is(false, checkNode(node));

        child.update({ group: 3 });
        this.is(4, node.childNodes.indexOf(child));
        this.is(false, checkNode(node));

        child.update({ group: 4 });
        this.is(7, node.childNodes.indexOf(child));
        this.is(false, checkNode(node));

        child.update({ group: 5 });
        this.is(7, node.childNodes.indexOf(child));
        this.is(false, checkNode(node));

        child.update({ group: 1 });
        this.is(0, node.childNodes.indexOf(child));
        this.is(false, checkNode(node));
      }
    },
    {
      name: 'mixed sorting & grouping, wrong order on moving last child inside the group (issue #2)',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: getTestSet(),
          sorting: 'data.value',
          grouping: 'data.group'
        });
        this.is(false, checkNode(node));

        node.lastChild.update({ value: 0 });
        this.is(false, checkNode(node));
      }
    },
    {
      name: 'partition manipulations',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          grouping: {
            rule: 'data.group'
          },
          childNodes: getTestSet()
        });
        this.is(false, checkNode(node));

        node.grouping.appendChild(node.grouping.firstChild);
        this.is(false, checkNode(node));
        node.grouping.appendChild(node.grouping.firstChild);
        this.is(false, checkNode(node));
        node.grouping.appendChild(node.grouping.firstChild);
        this.is(false, checkNode(node));
        node.grouping.appendChild(node.grouping.firstChild);
        this.is(false, checkNode(node));

        node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
        this.is(false, checkNode(node));

        node.grouping.insertBefore(node.grouping.childNodes[1], node.grouping.childNodes[2]);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.childNodes[1], node.grouping.childNodes[3]);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.childNodes[1], node.grouping.childNodes[0]);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.childNodes[2], node.grouping.childNodes[3]);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.childNodes[3], node.grouping.childNodes[2]);
        this.is(false, checkNode(node));
        node.grouping.insertBefore(node.grouping.childNodes[3], node.grouping.childNodes[1]);
        this.is(false, checkNode(node));
      }
    },
    {
      name: 'grouping & dataSource',
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

            node.setGrouping();
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
