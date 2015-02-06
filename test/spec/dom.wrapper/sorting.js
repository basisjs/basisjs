module.exports = {
  name: 'Sorting',
  test: [
    {
      name: 'set sorting',
      test: function(){
        var node = new Node({
          childFactory: nodeFactory,
          childNodes: getTestSet()
        });

        assert(checkNode(node) === false);

        node.setSorting(basis.getter('data.value'));
        assert(checkNode(node) === false);

        var order = basis.array.from(node.childNodes);
        node.setSorting(basis.getter('data.value * -1'), true);
        assert(checkNode(node) === false);
        assert(order, node.childNodes);

        node.setSorting();
        assert(checkNode(node) === false);

        node.setSorting(basis.getter('data.value'), true);
        assert(checkNode(node) === false);

        var order = basis.array.from(node.childNodes);
        for (var i = 0; i < order.length; i++)
          order[i].update({ value: -order[i].data.value });
        assert(checkNode(node) === false);
        assert(order.reverse(), node.childNodes);
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
        assert(checkNode(node) === false);

        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true,
          childNodes: getTestSet()
        });
        assert(checkNode(node) === false);

        var node = new Node({
          childFactory: nodeFactory,
          sorting: basis.getter('data.value'),
          sortingDesc: true
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
      name: 'mixed type values',
      test: [
        {
          name: 'update nodes with undefined init value ASC',
          test: function(){
            var models = basis.array.create(5, function(){
              return new DataObject();
            });
            var node = new Node({
              sorting: 'data.value',
              childNodes: basis.array.create(5, function(idx){
                return new Node({
                  delegate: models[idx]
                });
              })
            });

            models[0].update({ value: 'b' });
            models[1].update({ value: 'a' });
            models[2].update({ value: 's' });
            models[3].update({ value: 'i' });
            models[4].update({ value: 's' });

            var valueOrder = node.childNodes.map(function(child){
              return child.data.value;
            }).join('');
            assert(valueOrder === 'abiss');
            assert(checkNode(node) === false);

            models[0].update({ value: 55 });
            models[1].update({ value: 7 });
            models[2].update({ value: 0 });
            models[3].update({ value: 1 });
            models[4].update({ value: 7 });

            var valueOrder = node.childNodes.map(function(child){
              return child.data.value;
            }).join('');
            assert(valueOrder === '017755');
            assert(checkNode(node) === false);
          }
        },
        {
          name: 'update nodes with undefined init value DESC',
          test: function(){
            var models = basis.array.create(5, function(){
              return new DataObject();
            });
            var node = new Node({
              sorting: 'data.value',
              sortingDesc: true,
              childNodes: basis.array.create(5, function(idx){
                return new Node({
                  delegate: models[idx]
                });
              })
            });

            models[0].update({ value: 'b' });
            models[1].update({ value: 'a' });
            models[2].update({ value: 's' });
            models[3].update({ value: 'i' });
            models[4].update({ value: 's' });

            var valueOrder = node.childNodes.map(function(child){
              return child.data.value;
            }).join('');
            assert(valueOrder === 'ssiba');
            assert(checkNode(node) === false);

            models[0].update({ value: 55 });
            models[1].update({ value: 7 });
            models[2].update({ value: 0 });
            models[3].update({ value: 1 });
            models[4].update({ value: 7 });

            var valueOrder = node.childNodes.map(function(child){
              return child.data.value;
            }).join('');
            assert(valueOrder === '557710');
            assert(checkNode(node) === false);
          }
        }
      ]
    }
  ]
};
