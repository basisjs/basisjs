module.exports = {
  name: 'basis.data.index',

  sandbox: true,
  init: function(){
    basis = basis.createSandbox();

    var wrap = basis.require('basis.data').wrap;
    var Value = basis.require('basis.data').Value;
    var Dataset = basis.require('basis.data').Dataset;
    var IndexMap = basis.require('basis.data.index').IndexMap;
    var countIndex = basis.require('basis.data.index').count;
    var avgIndex = basis.require('basis.data.index').avg;
    var sumIndex = basis.require('basis.data.index').sum;
    var minIndex = basis.require('basis.data.index').min;
    var maxIndex = basis.require('basis.data.index').max;
    var distinctIndex = basis.require('basis.data.index').distinct;

    var indexes = [
      {
        create: countIndex,
        defaultValue: 0
      },
      {
        create: avgIndex,
        defaultValue: 0
      },
      {
        create: sumIndex,
        defaultValue: 0
      },
      {
        create: minIndex,
        defaultValue: undefined
      },
      {
        create: maxIndex,
        defaultValue: undefined
      },
      {
        create: distinctIndex,
        defaultValue: 0
      },
    ];

    if (!Dataset.from)
      Dataset.from = function(value){
        return new Dataset({
          items: value
        });
      };

    function range(min, max){
      var result = [];
      if (arguments.length == 1)
      {
        max = min;
        min = 1;
      }

      while (min <= max)
        result.push({
          value: min++
        });

      return wrap(result, true);
    }
  },

  test: [
    {
      name: 'IndexMap',
      test: [
        {
          name: 'create & destroy',
          test: function(){
            var map = new IndexMap({
              source: Dataset.from(range(0, 2)),
              indexes: {
                sum: sumIndex('data.value')
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
      name: 'indexes',
      test: [
        {
          name: 'common',
          test: [
            // {
            //   name: 'should not listen for items if no events',
            //   test: function(){
            //     var dataset = new Dataset({
            //       items: range(3)
            //     });
            //     var listenerCountBefore = dataset.getItems().reduce(function(res, item){
            //       return res + item.debug_handlers().length;
            //     }, 0);
            //     var sum = sumIndex(dataset, 'data.value');
            //     var listenerCountAfter = dataset.getItems().reduce(function(res, item){
            //       return res + item.debug_handlers().length;
            //     }, 0);

            //     assert(listenerCountAfter === listenerCountBefore);
            //     assert(sum.value === 6);

            //     dataset.forEach(function(item){
            //       item.update({ value: item.data.value + 1 });
            //     });
            //     assert(sum.value === 6);

            //     dataset.add(range(4, 4));
            //     assert(sum.value === 10);
            //   }
            // },
            {
              name: 'create',
              test: [
                {
                  name: 'should has correct default value on empty dataset',
                  test: function(){
                    var dataset = new Dataset;

                    indexes.forEach(function(descriptor){
                      var index = descriptor.create(dataset, 'update', 'data.value');

                      assert(index.value === descriptor.defaultValue);
                    });
                  }
                }
              ]
            },
            {
              name: 'destroy',
              test: [
                {
                  name: 'should destroy on dataset destroy',
                  test: function(){
                    indexes.forEach(function(descriptor){
                      var dataset = new Dataset;
                      var index = descriptor.create(dataset, 'update', 'data.value');
                      var destroyed = false;

                      index.addHandler({
                        destroy: function(){
                          destroyed = true;
                        }
                      });

                      dataset.destroy();
                      assert(destroyed);
                    });
                  }
                }
              ]
            },
            {
              name: 'dynamic',
              test: [
                {
                  name: 'create',
                  test: [
                    {
                      name: 'should returns the same index wrapper for the same source',
                      test: function(){
                        var source = new Value();
                        var index = sumIndex(source, 'update', 'data.value');

                        assert(sumIndex(source, 'update', 'data.value') === index);
                      }
                    },
                    {
                      name: 'should returns the new index wrapper if previous wrapper destroyed',
                      test: function(){
                        var source = new Value();
                        var index = sumIndex(source, 'update', 'data.value');

                        index.destroy();

                        assert(sumIndex(source, 'update', 'data.value') !== index);
                      }
                    },
                    {
                      name: 'should has correct default value for non-dataset source',
                      test: function(){
                        var source = new Value();

                        indexes.forEach(function(descriptor){
                          var index = descriptor.create(source, 'update', 'data.value');

                          assert(index.source === source);
                          assert(index.dataset === null);
                          assert(index.value === descriptor.defaultValue);
                        });
                      }
                    },
                    {
                      name: 'should has correct default value for empty dataset',
                      test: function(){
                        var dataset = new Dataset;
                        var source = new Value({ value: dataset });

                        indexes.forEach(function(descriptor){
                          var index = descriptor.create(source, 'update', 'data.value');

                          assert(index.source === source);
                          assert(index.dataset === dataset);
                          assert(index.value === descriptor.defaultValue);
                        });
                      }
                    }
                  ]
                },
                {
                  name: 'should resolve dataset from bb-value',
                  test: function(){
                    var foo = Dataset.from(range(3));
                    var bar = Dataset.from(range(4, 6));
                    var value = new Value({ value: foo });
                    var sum = sumIndex(value, 'update', 'data.value');

                    assert(sum.value === 6);
                    assert(sum.index !== null);
                    assert(sum.dataset === foo);

                    value.set(bar);
                    assert(sum.value === 15);
                    assert(sum.index !== null);
                    assert(sum.dataset === bar);

                    bar.destroy();
                    assert(sum.value === 0);
                    assert(sum.index === null);
                    assert(sum.source.value === null);
                    assert(sum.dataset === null);

                    value.set(foo);
                    assert(sum.value === 6);
                    assert(sum.index !== null);
                    assert(sum.dataset === foo);
                  }
                },
                {
                  name: 'destroy',
                  test: [
                    {
                      name: 'should destroy on source destroy',
                      test: function(){
                        var source = new basis.Token(Dataset.from(range(3)));
                        var sum = sumIndex(source, 'update', 'data.value');
                        var destroyed = false;

                        sum.addHandler({
                          destroy: function(){
                            destroyed = true;
                          }
                        });

                        source.destroy();
                        assert(destroyed);
                      }
                    },
                    {
                      name: 'should reset value to default index value',
                      test: function(){
                        indexes.forEach(function(descriptor){
                          var dataset = Dataset.from(range(3));
                          var source = new Value({ value: dataset });
                          var index = descriptor.create(source, 'update', 'data.value');
                          var destroyed = false;

                          index.addHandler({
                            destroy: function(){
                              destroyed = true;
                            }
                          });

                          dataset.destroy();
                          assert(!destroyed);
                          assert(index.value === descriptor.defaultValue);
                        });
                      }
                    },
                    {
                      name: 'should destroy index if used only by wrappers and last one detach',
                      test: function(){
                        indexes.forEach(function(descriptor){
                          var dataset = Dataset.from(range(3));
                          var source = new Value({ value: dataset });
                          var indexWrapper = descriptor.create(source, 'update', 'data.value');
                          var datasetIndex = indexWrapper.index;
                          var destroyed = false;

                          datasetIndex.addHandler({
                            destroy: function(){
                              destroyed = true;
                            }
                          });

                          source.set();
                          assert(destroyed);
                          assert(indexWrapper.index === null);
                          assert(indexWrapper.value === descriptor.defaultValue);
                        });
                      }
                    },
                    {
                      name: 'should destroy index if used only by wrappers and last one destroy',
                      test: function(){
                        indexes.forEach(function(descriptor){
                          var dataset = Dataset.from(range(3));
                          var source = new Value({ value: dataset });
                          var indexWrapper = descriptor.create(source, 'update', 'data.value');
                          var datasetIndex = indexWrapper.index;
                          var destroyed = false;

                          datasetIndex.addHandler({
                            destroy: function(){
                              destroyed = true;
                            }
                          });

                          indexWrapper.destroy();
                          assert(destroyed);
                        });
                      }
                    },
                    {
                      name: 'should destroy index if used not only by wrappers and last one detach',
                      test: function(){
                        indexes.forEach(function(descriptor){
                          var dataset = Dataset.from(range(3));
                          var source = new Value({ value: dataset });
                          var indexWrapper = descriptor.create(source, 'update', 'data.value');
                          var regularIndex = descriptor.create(dataset, 'update', 'data.value');
                          var datasetIndex = indexWrapper.index;
                          var destroyed = false;

                          datasetIndex.addHandler({
                            destroy: function(){
                              destroyed = true;
                            }
                          });

                          assert(regularIndex === datasetIndex);

                          source.set();
                          assert(!destroyed);
                          assert(indexWrapper.index === null);
                          assert(indexWrapper.value === descriptor.defaultValue);
                        });
                      }
                    },
                    {
                      name: 'should destroy index if used not only by wrappers and last one destroy',
                      test: function(){
                        indexes.forEach(function(descriptor){
                          var dataset = Dataset.from(range(3));
                          var source = new Value({ value: dataset });
                          var indexWrapper = descriptor.create(source, 'update', 'data.value');
                          var regularIndex = descriptor.create(dataset, 'update', 'data.value');
                          var datasetIndex = indexWrapper.index;
                          var destroyed = false;

                          datasetIndex.addHandler({
                            destroy: function(){
                              destroyed = true;
                            }
                          });

                          assert(regularIndex === datasetIndex);

                          indexWrapper.destroy();
                          assert(!destroyed);
                        });
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'types',
          test: [
            {
              name: 'sum',
              test: function(){
                var dataset = Dataset.from(range(10));
                var sum = sumIndex(dataset, 'update', 'data.value');

                assert(sum.value === 55);

                dataset.forEach(function(item){
                  item.update({ value: item.data.value % 2 });
                });
                assert(sum.value === 5);

                dataset.getItems().forEach(function(item, idx){
                  item.update({ value: idx + 10 });
                });
                assert(sum.value === 145);

                dataset.clear();
                assert(sum.value === 0);
              }
            },
            {
              name: 'distinct',
              test: function(){
                var dataset = Dataset.from(range(10));
                var distinct = distinctIndex(dataset, 'update', 'data.value');

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
        }
      ]
    }
  ]
};
