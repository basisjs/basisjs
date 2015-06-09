module.exports = {
  name: 'Indicies',
  test: [
    {
      name: 'multiple indexes',
      test: [
        {
          name: 'test #1',
          test: function(){
            var index = new nsEntity.Index();
            var t = nsEntity.createType(null, {
              x: nsEntity.IntId,
              y: { type: Number, index: index }
            });

            var foo = t({ x: 1, y: 2 });
            var bar = t({ x: 2, y: 2 });
            var baz = t({ x: 2, y: 3 });
            assert({ x: 1, y: 2 }, foo.data);
            assert({ x: undefined, y: undefined }, bar.data);
            assert({ x: 2, y: 3 }, baz.data);

            bar.set('x', 3);
            bar.set('y', 3);
            assert({ x: 3, y: undefined }, bar.data);

            bar.set('y', 4);
            assert({ x: 3, y: 4 }, bar.data);

            baz.set('y', 4);
            assert({ x: 2, y: 3 }, baz.data);
          }
        },
        {
          name: 'test #1',
          test: function(){
            var index = new nsEntity.Index();
            var t = nsEntity.createType(null, {
              id: { type: Number, index: index }
            });

            var foo = t(1);
            var bar = t(1);
            assert(foo === bar);
          }
        },
        {
          name: 'named indexes',
          test: function(){
            var index = new nsEntity.Index();
            var t1 = nsEntity.createType(null, {
              id: { type: Number, index: 'test_1' }
            });
            var t2 = nsEntity.createType(null, {
              id: { type: Number, index: 'test_1' }
            });

            var foo = t1(1);
            var bar = t2(1);
            assert(foo !== bar);
            assert({ id: 1 }, foo.data);
            assert({ id: undefined }, bar.data);

            bar.set('id', 2);
            foo.set('id', 2);
            assert({ id: 1 }, foo.data);
            assert({ id: 2 }, bar.data);
          }
        }
      ]
    }
  ]
};
