module.exports = {
  name: 'grouping',
  test: [
    {
      name: 'grouping in config',
      test: function(){
        var testSet = getTestSet();
        var node = new Node({
          childFactory: nodeFactory,
          grouping: 'data.group'
        });

        for (var i = 0; i < testSet.length; i++)
          node.appendChild(testSet[i]);

        this.is(false, checkNode(node));
        this.is($values(basis.array.sort(testSet, 'data.group')), $values(node.childNodes));

        // =======================================
        var testSet = getTestSet();
        var node = new Node({
          childFactory: nodeFactory,
          grouping: {
            rule: 'data.group',
            sorting: basis.getter('data.id'),
            sortingDesc: true
          }
        });

        for (var i = 0; i < testSet.length; i++)
          node.appendChild(testSet[i]);

        this.is(false, checkNode(node));
        this.is($values([4, 3, 8, 1, 5, 6, 0, 2, 7, 9].map(convertToNode)), $values(node.childNodes));

        // ======================================
        var testSet = getTestSet();
        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true,
          grouping: {
            rule: 'data.group',
            sorting: basis.getter('data.id'),
            sortingDesc: true
          },
          childNodes: testSet
        });

        this.is(false, checkNode(node));
        this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));
      }
    },
    {
      name: 'update PartitionNode',
      test: function(){
        // ======================================
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

        this.is(false, checkNode(node));
        this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

        var groups = getGroups(node);
        for (var i = 0; i < groups.length; i++)
          groups[i].update({ title: 'group' + groups[i].data.title });

        this.is(false, checkNode(node));
        this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

        groups[0].update({ title: '-1' });
        this.is(false, checkNode(node));
        this.is($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

        groups[1].update({ title: '-2' });
        this.is(false, checkNode(node));
        this.is($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[2].update({ title: '-3' });
        this.is(false, checkNode(node));
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[3].update({ title: '-4' });
        this.is(false, checkNode(node));
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
      }
    },
    {
      name: 'update PartitionNode with delegate',
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

        this.is(false, checkNode(node));
        this.is(4, getGroups(node).length);
        this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

        var groups = getGroups(node);
        /*for (var i = 0; i < groups.length; i++)
          groups[i].update({ title: 'group' + i });*/

        groups[0].update({ title: -4 });
        this.is(false, checkNode(node));
        this.is($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

        groups[1].update({ title: -3 });
        this.is(false, checkNode(node));
        this.is($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[2].update({ title: -2 });
        this.is(false, checkNode(node));
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[3].update({ title: -1 });
        this.is(false, checkNode(node));
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

      }
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

        this.is(false, checkNode(node));

        node.setGrouping({
          rule: basis.getter('data.group').as(groupNodes),
          sorting: basis.getter('data.title'),
          sortingDesc: true
        });

        this.is(false, checkNode(node));
        this.is(4, getGroups(node).length);
        this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

        var groups = getGroups(node);
        /*for (var i = 0; i < groups.length; i++)
          groups[i].update({ title: 'group' + i });*/

        groups[0].update({ title: -4 });
        this.is(false, checkNode(node));
        this.is($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

        groups[1].update({ title: -3 });
        this.is(false, checkNode(node));
        this.is($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[2].update({ title: -2 });
        this.is(false, checkNode(node));
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

        groups[3].update({ title: -1 });
        this.is(false, checkNode(node));
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
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

        this.is(false, checkNode(node));

        node.setGrouping({
          rule: basis.getter('data.group').as(groupNodes),
          sorting: basis.getter('data.title'),
          sortingDesc: true
        });

        this.is(false, checkNode(node));
        this.is(4, getGroups(node).length);
        this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
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
        this.is(1, events.length);
      }
    }
  ]
};
