module.exports = {
  name: 'Dynamic scenarions',
  test: [
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
    }
  ]
};
