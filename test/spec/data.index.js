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

            this.is(1, basis.object.keys(map.indexes).length);
            this.is(3, map.indexes.sum.value);

            map.destroy();

            this.is(0, basis.object.keys(map.indexes).length);
          }
        }
      ]
    }
  ]
};
