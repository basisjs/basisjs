module.exports = {
  name: 'selection',
  test: [
    {
      name: 'destroy child with own selection',
      test: function(){
        var selectedChild = new Node({ selected: true });
        var parent = new Node({
          selection: true,
          childNodes: [selectedChild, new Node, new Node]
        });

        assert(selectedChild.selected === true);
        assert(parent.selection.pick() === selectedChild);

        var selectedSubchild = new Node({ selected: true });
        var child = new Node({
          selection: true,
          childNodes: [selectedSubchild, new Node, new Node]
        });

        assert(selectedSubchild.selected === true);
        assert([selectedSubchild], child.selection.getItems());

        parent.appendChild(child);

        assert(selectedChild.selected === true);
        assert([selectedChild], parent.selection.getItems());
        assert(selectedSubchild.selected === true);
        assert([selectedSubchild], child.selection.getItems());

        child.destroy();
      }
    },
    {
      name: 'destroy selected child with own selection',
      test: function(){
        var parent = new Node({
          selection: true,
          childNodes: [new Node, new Node, new Node]
        });

        var child = new Node({
          selection: true,
          selected: true,
          childNodes: [new Node({ selected: true }), new Node, new Node]
        });

        parent.appendChild(child);

        assert(child.firstChild.selected === true);
        assert(parent.lastChild.selected === true);

        child.destroy();

        assert(parent.selection.itemCount == 0);
      }
    }
  ]
};
