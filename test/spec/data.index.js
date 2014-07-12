module.exports = {
  name: 'basis.data.index',

  init: function(){
    var wrap = basis.require('basis.data').wrap;
    var Dataset = basis.require('basis.data').Dataset;
    var sum = basis.require('basis.data.index').sum;
    var IndexMap = basis.require('basis.data.index').IndexMap;
  },

  test: [
    {
      name: 'IndexMap',
      test: [
        {
          name: 'create & destroy',
          test: function(){
            var map = new IndexMap({
              source: new Dataset({
                items: wrap(basis.array.create(3, basis.fn.$self).map(basis.fn.wrapper('value')), true)
              }),
              indexes: {
                sum: sum('data.value')
              }
            });

            assert(basis.object.keys(map.indexes).length === 1);
            assert(map.indexes.sum.value === 3);

            map.destroy();

            assert(basis.object.keys(map.indexes).length === 0);
          }
        }
      ]
    },
    {
      name: 'Distinct',
      test: function(){
        var dataset = new basis.data.Dataset({
          items: basis.data.wrap(basis.array.create(10, function(idx){ return { value: idx }; }), true)
        });
        var distinct = basis.data.index.distinct(dataset, 'update', 'data.value');

        assert(distinct.value === 10);

        dataset.forEach(function(item){
          item.update({ value: item.data.value % 2 });
        });
        assert(distinct.value === 2);

        dataset.getItems().forEach(function(item, idx){
          item.update({ value: idx + 10 });
        });
        assert(distinct.value === 10);

        dataset.clear();
        assert(distinct.value === 0);
      }
    }
  ]
};
