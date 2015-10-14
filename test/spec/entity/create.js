module.exports = {
  name: 'Create',
  test: [
    {
      name: 'simple create',
      test: function(){
        var EntityType = nsEntity.createType({
          fields: {
            id: Number,
            value: String
          }
        });

        assert(EntityType.all !== null);
        assert(EntityType.all instanceof nsData.ReadOnlyDataset);

        var entityA = EntityType();
        assert(entityA === undefined);
        assert(EntityType.all.itemCount === 0);

        var entityB = EntityType({});
        assert(entityB !== null);
        assert(EntityType.all.itemCount === 1);
        assert({ id: 0, value: '' }, entityB.data);

        var entityC = EntityType({ id: '1', value: 'test' });
        assert(EntityType.all.itemCount === 2);
        assert({ id: 1, value: 'test' }, entityC.data);

        var entityD = EntityType({ id: '1', value: 'test' });
        assert(EntityType.all.itemCount === 3);
        assert(entityD != entityC);
        assert({ id: 1, value: 'test' }, entityD.data);
      }
    },
    {
      name: 'resolving by id',
      test: function(){
        var Type = nsEntity.createType(basis.genUID(), {
          id: nsEntity.IntId
        });

        var result = Type(1, 1);
        assert(result instanceof Type.type.entityClass);
        assert(result.type === Type);
        assert({ id: 1 }, result.data);

        var result = Type('2', 2);
        assert(result instanceof Type.type.entityClass);
        assert(result.type === Type);
        assert({ id: 2 }, result.data);

        var result = Type(3, 4);
        assert(result instanceof Type.type.entityClass);
        assert({ id: 3 }, result.data);
        assert(Type.get(4) == null);

        var data = { id: 5 };
        var result = Type(data, data);
        assert(result instanceof Type.type.entityClass);
        assert(result.type === Type);
        assert({ id: 5 }, result.data);
      }
    },
    {
      name: 'resolving by entity instance',
      test: function(){
        var Type = nsEntity.createType(basis.genUID(), {
          id: nsEntity.IntId
        });
        var Type2 = nsEntity.createType(basis.genUID(), {
          id: nsEntity.IntId
        });

        var result = Type(1, Type2(1));
        assert(result instanceof Type.type.entityClass);
        assert(result.type === Type);
        assert({ id: 1 }, result.data);

        var result = Type(Type2(2), Type2(2));
        assert(result instanceof Type.type.entityClass);
        assert(result.type === Type);
        assert({ id: null }, result.data);
      }
    },
    {
      name: 'keys test #1',
      test: function(){
        var EntityType = new nsEntity.EntityType({
          fields: {
            id: nsEntity.IntId,
            value: String
          }
        });

        assert(EntityType.all !== null);
        assert(EntityType.all instanceof nsData.ReadOnlyDataset);

        var entityA = EntityType();
        assert(entityA === undefined);
        assert(EntityType.all.itemCount === 0);

        var entityB = EntityType({});
        assert(entityB !== null);
        assert(EntityType.all.itemCount === 1);
        assert({ id: null, value: '' }, entityB.data);

        var entityC = EntityType({});
        assert(entityC !== entityB);
        assert(EntityType.all.itemCount === 2);
        assert({ id: null, value: '' }, entityC.data);

        var entityD = EntityType({ id: '1', value: 'test' });
        assert(EntityType.all.itemCount === 3);
        assert({ id: 1, value: 'test' }, entityD.data);

        var entityE = EntityType({ id: 1, value: 'test2' });
        assert(entityE === entityD);
        assert(EntityType.all.itemCount === 3);
        assert({ id: 1, value: 'test2' }, entityE.data);

        var entityF = EntityType({ id: 1 });
        assert(entityF === entityD);
        assert(EntityType.all.itemCount === 3);
        assert({ id: 1, value: 'test2' }, entityF.data);

        var entityG = EntityType(1);
        assert(entityG === entityD);
        assert(EntityType.all.itemCount === 3);
        assert({ id: 1, value: 'test2' }, entityG.data);

        var entityI = EntityType('1');
        assert(entityI === entityD);
        assert(EntityType.all.itemCount === 3);
        assert({ id: 1, value: 'test2' }, entityI.data);

        var entityH = EntityType(entityD);
        assert(entityH === entityD);
        assert(EntityType.all.itemCount === 3);
        assert({ id: 1, value: 'test2' }, entityH.data);

        var entityK = EntityType(entityC);
        assert(entityK === entityC);
        assert(EntityType.all.itemCount === 3);
        assert({ id: null, value: '' }, entityK.data);
      }
    },
    {
      name: 'keys test #2 (change id)',
      test: function(){
        var EntityType = new nsEntity.EntityType({
          fields: {
            id: nsEntity.IntId,
            value: String
          }
        });

        // base test made in previous test

        var entityA = EntityType({});
        assert(EntityType.all.itemCount === 1);
        assert({ id: null, value: '' }, entityA.data);

        var entityB = EntityType({ id: 1 });
        assert(EntityType.all.itemCount === 2);
        assert({ id: 1, value: '' }, entityB.data);

        // try to change id for existing value, must be ignored
        entityA.update({ id: 1 });
        assert(EntityType.all.itemCount === 2);
        assert(EntityType.get(1) === entityB);
        assert({ id: null, value: '' }, entityA.data);

        entityA.update({ id: 2 });
        assert(EntityType.all.itemCount === 2);
        assert(EntityType.get(2) === entityA);
        assert({ id: 2, value: '' }, entityA.data);

        // destroy entityB
        entityB.destroy();
        assert(EntityType.all.itemCount === 1);
        assert(EntityType.get(1) === undefined);
        assert({}, entityB.data);

        entityA.update({ id: 1 });
        assert(EntityType.all.itemCount === 1);
        assert(EntityType.get(1) === entityA);
        assert(EntityType.get(2) === undefined);
        assert({ id: 1, value: '' }, entityA.data);

        entityA.update({ id: '1' });
        assert(EntityType.all.itemCount === 1);
        assert(EntityType.get(1) === entityA);
        assert(EntityType.get('1') === entityA);
        assert({ id: 1, value: '' }, entityA.data);

        // destroy entityA
        entityA.destroy();
        assert(EntityType.all.itemCount === 0);
        assert(EntityType.get(1) === undefined);
        assert({}, entityA.data);
      }
    },
    {
      name: 'calc',
      test: [
        {
          name: 'base behaviour',
          test: function(){
            var Type = nsEntity.createType(null, {
              a: String,
              b: Number,
              c: nsEntity.calc('a', 'b', function(a, b){
                return a + b;
              }),
              d: nsEntity.calc('b', 'c', function(a, b){
                return a + b;
              })
            });

            // calc values should be computed even if empty config
            var entity = Type({});
            assert({ a: '', b: 0, c: '0', d: '00' }, entity.data);

            // values for calc fields in config must be ignored
            var entity = Type({ c: 'xxx' });
            assert({ a: '', b: 0, c: '0', d: '00' }, entity.data);

            // calc values should be computed
            var entity = Type({ a: 'xxx' });
            assert({ a: 'xxx', b: 0, c: 'xxx0', d: '0xxx0' }, entity.data);
          }
        },
        {
          name: 'should not warn when calc field not in init data',
          test: function(){
            var Type = nsEntity.createType(null, {
              foo: Number,
              bar: {
                calc: nsEntity.calc(function(){
                  return 2;
                })
              }
            });

            assert(catchWarnings(function(){
              var instance = Type({ foo: 1 });
              assert({ foo: 1, bar: 2 }, instance.data);
            }) === false);
          }
        },
        {
          name: 'should warn when set value for calc field on init',
          test: function(){
            var Type = nsEntity.createType(null, {
              foo: Number,
              bar: {
                calc: nsEntity.calc(function(){
                  return 2;
                })
              }
            });

            assert(catchWarnings(function(){
              var instance = Type({ foo: 1, bar: 3 });
              assert({ foo: 1, bar: 2 }, instance.data);
            }) !== false);
          }
        },
        {
          name: 'should not warn when instance init with data filtered by reader',
          test: function(){
            var Type = nsEntity.createType(null, {
              foo: Number,
              bar: nsEntity.calc(function(){
                return 2;
              })
            });

            assert(catchWarnings(function(){
              var instance = Type(Type.reader({ foo: 1, bar: 3 }));
              assert({ foo: 1, bar: 2 }, instance.data);
            }) === false);
          }
        },
        {
          name: 'should not define alias for calc field',
          test: function(){
            assert(catchWarnings(function(){
              var Type = nsEntity.createType({
                fields: {
                  foo: Number,
                  bar: nsEntity.calc(function(){
                    return 2;
                  })
                },
                aliases: {
                  baz: 'bar'
                }
              });

              assert('baz' in Type.type.aliases == false);
            }) !== false);
          }
        }
      ]
    },
    {
      name: 'default values',
      test: [
        {
          name: 'base behaviour',
          test: function(){
            var Type = nsEntity.createType(null, {
              a: {
                type: Number,
                defValue: 1
              },
              b: {
                defValue: 'default'
              },
              c: {
                defValue: function(initData){
                  if ('a' in initData && 'b' in initData)
                    return initData.a + initData.b;
                  else
                    return 'default';
                }
              },
              calcWithDefault: {
                defValue: 777,
                calc: nsEntity.calc('a', function(a){
                  return a * 5;
                })
              }
            });

            // #1 - defaults only
            var entity = Type({});
            assert({ a: 1, b: 'default', c: 'default', calcWithDefault: 5 }, entity.data);

            // #2 - set all values
            var entity = Type({ a: 2, b: 3, c: 4, calcWithDefault: 5 });
            assert({ a: 2, b: 3, c: 4, calcWithDefault: 10 }, entity.data);

            // #3
            var entity = Type({ a: 2 });
            assert({ a: 2, b: 'default', c: 'default', calcWithDefault: 10 }, entity.data);

            // #4
            var entity = Type({ a: 2, b: 3 });
            assert({ a: 2, b: 3, c: 5, calcWithDefault: 10 }, entity.data);
          }
        },
        {
          name: 'defValue function should be invoked only when no key in init data',
          test: function(){
            var callCount = 0;
            var Type = nsEntity.createType(null, {
              a: {
                defValue: function(initData){
                  callCount++;
                }
              }
            });

            Type({});
            assert(callCount == 1);
            Type({ a: 123 });
            assert(callCount == 1);
            Type({ a: undefined });
            assert(callCount == 1);
          }
        },
        {
          name: 'default value should be passed through field wrapper',
          test: function(){
            var fooCount = 0;
            var barCount = 0;
            var Type = nsEntity.createType(null, {
              foo: {
                type: function(value){
                  fooCount++;
                  return Number(value);
                },
                defValue: '1'
              },
              bar: {
                type: function(value){
                  barCount++;
                  return Number(value);
                },
                defValue: function(){
                  return '1';
                }
              }
            });

            var instance = Type({});
            assert(instance.data.foo === 1);
            assert(instance.data.bar === 1);
            assert(fooCount === 1);
            assert(barCount === 1);

            var instance = Type({});
            assert(instance.data.foo === 1);
            assert(instance.data.bar === 1);
            assert(fooCount === 2);
            assert(barCount === 2);
          }
        }
      ]
    }
  ]
};
