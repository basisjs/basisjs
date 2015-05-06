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
          name: 'correct order',
          test: [
            {
              name: 'ASC: nulls -> numbers -> strings',
              test: function(){
                var values = [
                  'Z',
                  2,
                  'A',
                  11,
                  undefined,
                  'z',
                  1,
                  null,
                  'a'
                ];

                var node = new Node({
                  sorting: 'data.value',
                  childNodes: values.map(function(value){
                    return new Node({
                      data: {
                        value: value
                      }
                    });
                  })
                });

                assert([null, undefined, 1, 2, 11, 'A', 'Z', 'a', 'z'], getChildValues(node));

                var changesCount = basis.array(node.childNodes).reduce(function(res, child, idx){
                  return res + Boolean(child.update({
                    value: values[idx]
                  }));
                }, 0);

                assert(changesCount === node.childNodes.length);
                assert([null, undefined, 1, 2, 11, 'A', 'Z', 'a', 'z'], getChildValues(node));
              }
            },
            {
              name: 'DESC: strings -> numbers -> nulls',
              test: function(){
                var values = [
                  'Z',
                  2,
                  'A',
                  11,
                  undefined,
                  'z',
                  null,
                  1,
                  'a'
                ];

                var node = new Node({
                  sorting: 'data.value',
                  sortingDesc: true,
                  lll: true,
                  childNodes: values.map(function(value){
                    return new Node({
                      data: {
                        value: value
                      }
                    });
                  })
                });

                assert(['z', 'a', 'Z', 'A', 11, 2, 1, null, undefined], getChildValues(node));

                var changesCount = basis.array(node.childNodes).reduce(function(res, child, idx){
                  return res + Boolean(child.update({
                    value: values[idx]
                  }));
                }, 0);

                assert(changesCount === node.childNodes.length);
                assert(['z', 'a', 'Z', 'A', 11, 2, 1, null, undefined], getChildValues(node));
              }
            }
          ]
        },
        {
          name: 'update nodes with undefined init value',
          test: [
            {
              name: 'ASC',
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
              name: 'DESC',
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
    },
    {
      name: '',
      test: function(){
        var node = new Node({
          grouping: {
            rule: 'data.year',
            sorting: 'data.title',
            sortingDesc: true
          },
          sorting: function(node){
            return Number(node.data.date);
          },
          sortingDesc: true,
          invertSorting: function(){
            debugger;
            this.setSorting(this.sorting, !this.sortingDesc);
            assert(checkNode(node) === false);
            this.grouping.setSorting(this.grouping.sorting, !this.grouping.sortingDesc);
            assert(checkNode(node) === false);
          },
          childNodes: [
            1402099200000,
            1404691200000,
            1407369600000,
            1410048000000,
            1412640000000,
            1415318400000,
            1417910400000,
            1420588800000,
            1423267200000
          ].map(function(time){
            var date = new Date(time);
            return new Node({
              data: {
                year: date.getFullYear(),
                date: date
              }
            });
          })
        });

        assert(checkNode(node) === false);
        assert(checkNode(node.grouping) === false);

        node.invertSorting();
        assert(checkNode(node) === false);
        assert(checkNode(node.grouping) === false);

        node.invertSorting();
        assert(checkNode(node) === false);
        assert(checkNode(node.grouping) === false);
      }
    }
  ]
};
