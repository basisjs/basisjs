module.exports = {
  name: 'basis.data.object',
  init: function(){
    basis.require('basis.entity');
    var DataObject = basis.require('basis.data').Object;
    var Merge = basis.require('basis.data.object').Merge;
  },

  test: [
    {
      name: 'create',
      test: [
        {
          name: 'empty',
          test: function(){
            var MyMerge = Merge.subclass({
              fields: {
                foo: 'a',
                '*': 'b'
              }
            });
            var instance = new MyMerge();

            assert({}, instance.data);
          }
        },
        {
          name: '1 sources',
          test: function(){
            var MyMerge = Merge.subclass({
              fields: {
                foo: 'a',
                bar: 'a',
                '*': 'b'
              }
            });
            var source = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });

            var instance = new MyMerge({
              sources: {
                a: source
              }
            });
            assert({ foo: 'a', bar: 'a' }, instance.data);

            var instance = new MyMerge({
              sources: {
                b: source
              }
            });
            assert({ baz: 'a' }, instance.data);
          }
        },
        {
          name: '2 sources',
          test: function(){
            var a = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var b = new DataObject({
              data: {
                foo: 'b',
                bar: 'b',
                baz: 'b'
              }
            });

            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a',
                '*': 'b'
              },
              sources: {
                a: a,
                b: b
              }
            });

            assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);
          }
        },
        {
          name: 'no sources, no field fields',
          test: function(){
            var instance = new Merge({
              data: {
                foo: 1,
                bar: 2
              }
            });

            assert({ foo: 1, bar: 2 }, instance.data);

            var instance = new Merge({
              fields: {
                '*': '-'
              },
              data: {
                foo: 1,
                bar: 2
              }
            });

            assert({ foo: 1, bar: 2 }, instance.data);
          }
        },
        {
          name: 'no sources, own properties',
          test: function(){
            var instance = new Merge({
              fields: {
                foo: '-',
                bar: '-'
              },
              data: {
                foo: 1,
                bar: 2,
                baz: 3
              }
            });

            assert({ foo: 1, bar: 2 }, instance.data);
          }
        },
        {
          name: 'no sources, own properties',
          test: function(){
            var instance = new Merge({
              fields: {
                foo: '-',
                bar: 'a'
              },
              data: {
                foo: 1,
                bar: 2,
                baz: 3
              },
              sources: {
                a: new basis.data.Object({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                })
              }
            });

            assert({ foo: 1, bar: 'a' }, instance.data);
          }
        }
      ]
    },
    {
      name: 'change sources',
      test: [
        {
          name: 'set for empty merge and reset',
          test: function(){
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a',
                '*': 'b'
              }
            });

            instance.setSources({
              a: new DataObject({
                data: {
                  foo: 'a',
                  bar: 'a',
                  baz: 'a'
                }
              }),
              b: new DataObject({
                data: {
                  foo: 'b',
                  bar: 'b',
                  baz: 'b'
                }
              })
            });
            assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

            instance.setSources();
            assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);
            assert(instance.sources.a == null);
            assert(instance.sources.b == null);
          }
        },
        {
          name: 'swap sources',
          test: function(){
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a',
                '*': 'b'
              }
            });
            var a = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var b = new DataObject({
              data: {
                foo: 'b',
                bar: 'b',
                baz: 'b'
              }
            });

            instance.setSources({ a: a, b: b });
            assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

            instance.setSources({ a: b, b: a });
            assert({ foo: 'b', bar: 'b', baz: 'a' }, instance.data);
          }
        },
        {
          name: 'source destroy',
          test: function(){
            var source = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a'
              },
              sources: {
                a: source
              }
            });

            assert({ foo: 'a', bar: 'a' }, instance.data);
            assert(instance.sources.a === source);

            source.destroy();
            assert({ foo: 'a', bar: 'a' }, instance.data);
            assert(instance.sources.a === null);
          }
        },
        {
          name: 'source and own properties',
          test: function(){
            var source = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: '-'
              },
              sources: {
                a: source
              }
            });

            assert({ foo: 'a' }, instance.data);

            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: '-'
              }
            });

            assert({ }, instance.data);

            instance.setSource('a', source);
            assert({ foo: 'a' }, instance.data);
          }
        }
      ]
    },
    {
      name: 'updates',
      test: [
        {
          name: 'source -> merge',
          test: function(){
            var a = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var b = new DataObject({
              data: {
                foo: 'b',
                bar: 'b',
                baz: 'b'
              }
            });
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a',
                '*': 'b'
              },
              sources: {
                a: a,
                b: b
              }
            });

            assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

            a.update({
              foo: 'c',
              bar: 'c',
              baz: 'c'
            });
            assert({ foo: 'c', bar: 'c', baz: 'b' }, instance.data);

            a.update({
              baz: 'd'
            });
            assert({ foo: 'c', bar: 'c', baz: 'b' }, instance.data);

            b.update({
              foo: 'e',
              bar: 'e',
              baz: 'e',
              asd: 'e'
            });
            assert({ foo: 'c', bar: 'c', baz: 'e', asd: 'e' }, instance.data);
          }
        },
        {
          name: 'merge -> sources',
          test: function(){
            var a = new DataObject({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var b = new DataObject({
              data: {
                foo: 'b',
                bar: 'b',
                baz: 'b'
              }
            });
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a',
                '*': 'b'
              },
              sources: {
                a: a,
                b: b
              }
            });

            assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

            // change foo, should change a.data.foo
            assert({ foo: 'a' }, instance.update({ foo: 1 }));
            assert({ foo: 1, bar: 'a', baz: 'b' }, instance.data);
            assert({ foo: 1, bar: 'a', baz: 'a' }, a.data);
            assert({ foo: 'b', bar: 'b', baz: 'b' }, b.data);

            // set foo the same value, should nothing change
            assert(instance.update({ foo: 1 }) == false);

            // change baz, should change b.data.baz
            assert({ baz: 'b' }, instance.update({ baz: 2 }));
            assert({ foo: 1, bar: 'a', baz: 2 }, instance.data);
            assert({ foo: 1, bar: 'a', baz: 'a' }, a.data);
            assert({ foo: 'b', bar: 'b', baz: 2 }, b.data);

            // change all fields, should change a.data & b.data
            assert({ foo: 1, bar: 'a', baz: 2 }, instance.update({ foo: 3, bar: 3, baz: 3 }));
            assert({ foo: 3, bar: 3, baz: 3 }, instance.data);
            assert({ foo: 3, bar: 3, baz: 'a' }, a.data);
            assert({ foo: 'b', bar: 'b', baz: 3 }, b.data);

            // change unknown field, should change b.data
            assert({ asd: undefined }, instance.update({ asd: 4 }));
            assert({ foo: 3, bar: 3, baz: 3, asd: 4 }, instance.data);
            assert({ foo: 3, bar: 3, baz: 'a' }, a.data);
            assert({ foo: 'b', bar: 'b', baz: 3, asd: 4 }, b.data);
          },
        },
        {
          name: 'un-existent fields',
          test: function(){
            var a = new basis.data.Object({
              data: {
                foo: 1
              }
            });
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: 'a'
              },
              sources: {
                a: a
              }
            });

            assert(instance.data.foo === 1);
            assert(instance.data.bar === undefined);
            assert('bar' in instance.data == false);
            assert(a.data.bar === undefined);
            assert('bar' in a.data == false);

            assert(instance.update({ baz: 123 }) === false);
            assert('baz' in instance.data === false);
            assert('baz' in a.data === false);
          }
        },
        {
          name: 'change field of not set source',
          test: function(){
            var instance = new Merge({
              fields: {
                foo: 'a'
              }
            });

            assert('foo' in instance.data == false);

            assert(instance.update({ foo: 123 }) === false);
            assert('foo' in instance.data === false);
          }
        },
        {
          name: 'source & own properties',
          test: function(){
            var source = new basis.data.Object({
              data: {
                foo: 'a',
                bar: 'a',
                baz: 'a'
              }
            });
            var instance = new Merge({
              fields: {
                foo: 'a',
                bar: '-'
              },
              sources: {
                a: source
              },
              data: {
                foo: 'own',
                bar: 'own',
                baz: 'own'
              }
            });

            assert({ foo: 'a', bar: 'own' }, instance.data);

            assert({ bar: 'own' }, instance.update({ bar: 123 }));
            assert({ foo: 'a', bar: 123 }, instance.data);

            source.update({ foo: 2, bar: 2, baz: 2 });
            assert({ foo: 2, bar: 123 }, instance.data);
          }
        },
        {
          name: 'merge & entity',
          test: function(){
            var Type = basis.entity.createType(null, {
              str: String,
              enum: [1, 2, 3]
            });

            var entity = Type({});
            var instance = new Merge({
              fields: {
                '*': 'a'
              },
              sources: {
                a: entity
              }
            });

            assert(entity.data, instance.data);
            assert(entity.data !== instance.data);

            // set correct value for enum field, should change
            assert({ str: '' }, instance.update({ str: '1' }));
            assert(instance.data.str === '1');
            assert(entity.data, instance.data);

            // should coerse to string, and no changes
            assert(false, instance.update({ str: 1 }));
            assert(instance.data.str === '1');
            assert(entity.data, instance.data);

            // set correct value for enum field, should change
            assert({ enum: 1 }, instance.update({ enum: 2 }));
            assert(instance.data.enum === 2);
            assert(entity.data, instance.data);

            // set wrong value for enum field, should not change
            assert(false, instance.update({ enum: 4 }));
            assert(instance.data.enum === 2);
            assert(entity.data, instance.data);

            // set correct value for enum field, should change
            assert(false, instance.update({ nonexists: 123 }));
            assert('nonexists' in instance.data === false);
            assert(entity.data, instance.data);
          }
        },
        {
          name: 'merge & entity id',
          test: function(){
            var Type = basis.entity.createType(null, {
              id: basis.entity.IntId
            });

            var lockIdEntity = Type({ id: 1 });
            var entity = Type({});
            var instance = new Merge({
              fields: {
                '*': 'a'
              },
              sources: {
                a: entity
              }
            });

            assert(entity.data, instance.data);
            assert(entity.data !== instance.data);

            // id is used by another entity, should no changes
            assert(false, instance.update({ id: 1 }));
            assert(instance.data.id === null);
            assert(entity.data, instance.data);

            // should coerce value, the same case, no changes
            assert(false, instance.update({ id: '1' }));
            assert(instance.data.id === null);
            assert(entity.data, instance.data);
          }
        },
        {
          name: 'merge & entity and calc',
          test: function(){
            var Type = basis.entity.createType(null, {
              id: basis.entity.IntId,
              calc: basis.entity.calc('id', basis.fn.$self)
            });

            var entity = Type({ id: 1 });
            var instance = new Merge({
              fields: {
                '*': 'a'
              },
              sources: {
                a: entity
              }
            });

            assert(entity.data, instance.data);
            assert(entity.data !== instance.data);

            // calc fields is read only and shouldn't be changed
            assert(false, instance.update({ calc: 123 }));
            assert(instance.data.calc === 1);
            assert(entity.data, instance.data);

            // delta should contains calc fields as well
            assert({ id: 1, calc: 1 }, instance.update({ id: 2 }));
            assert(instance.data.calc === 2);
            assert(entity.data, instance.data);
          }
        }
      ]
    }
  ]
};
