module.exports = {
  name: 'basis.entity',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var dateUtils = basis.require('basis.date');
    var nsData = basis.require('basis.data');
    var nsEntity = basis.require('basis.entity');
    var basisEvents = basis.require('basis.event').events;
    var Filter = basis.require('basis.data.dataset').Filter;

    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    (function(){
      var init_ = nsEntity.BaseEntity.prototype.init;
      nsEntity.BaseEntity.prototype.init = function(){
        this.history_ = [];
        this.historyAll_ = [];
        init_.apply(this, arguments);
      };

      nsEntity.BaseEntity.prototype.emit_update = function(delta){
        this.history_.push(delta);
        this.historyAll_.push(['update'].concat([this].concat(basis.array.from(arguments))));
        basisEvents.update.call(this, delta);
      };

      nsEntity.BaseEntity.prototype.emit_rollbackUpdate = function(delta){
        this.historyAll_.push(['rollbackUpdate'].concat([this].concat(basis.array.from(arguments))));
        basisEvents.rollbackUpdate.call(this, delta);
      };
    })();

    function resetHistory(obj){
      obj.history_ = [];
      obj.historyAll_ = [];
    }

    function rollbackEvents(entity){
      return entity.historyAll_.filter(function(arg){
        return arg[0] == 'rollbackUpdate';
      });
    }
  },

  test: [
    {
      name: 'construct',
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
            assert.deep({ id: 0, value: '' }, entityB.data);

            var entityC = EntityType({ id: '1', value: 'test' });
            assert(EntityType.all.itemCount === 2);
            assert.deep({ id: 1, value: 'test' }, entityC.data);

            var entityD = EntityType({ id: '1', value: 'test' });
            assert(EntityType.all.itemCount === 3);
            assert(entityD != entityC);
            assert.deep({ id: 1, value: 'test' }, entityD.data);
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

            this.is(true, EntityType.all !== null);
            this.is(true, EntityType.all instanceof nsData.ReadOnlyDataset);

            var entityA = EntityType();
            this.is(undefined, entityA);
            this.is(0, EntityType.all.itemCount);

            var entityB = EntityType({});
            this.is(true, entityB !== null);
            this.is(1, EntityType.all.itemCount);
            this.is({ id: null, value: '' }, entityB.data);

            var entityC = EntityType({});
            this.is(true, entityC !== entityB);
            this.is(2, EntityType.all.itemCount);
            this.is({ id: null, value: '' }, entityC.data);

            var entityD = EntityType({ id: '1', value: 'test' });
            this.is(3, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test' }, entityD.data);

            var entityE = EntityType({ id: 1, value: 'test2' });
            this.is(true, entityE === entityD);
            this.is(3, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test2' }, entityE.data);

            var entityF = EntityType({ id: 1 });
            this.is(true, entityF === entityD);
            this.is(3, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test2' }, entityF.data);

            var entityG = EntityType(1);
            this.is(true, entityG === entityD);
            this.is(3, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test2' }, entityG.data);

            var entityI = EntityType('1');
            this.is(true, entityI === entityD);
            this.is(3, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test2' }, entityI.data);

            var entityH = EntityType(entityD);
            this.is(true, entityH === entityD);
            this.is(3, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test2' }, entityH.data);

            var entityK = EntityType(entityC);
            this.is(true, entityK === entityC);
            this.is(3, EntityType.all.itemCount);
            this.is({ id: null, value: '' }, entityK.data);
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
            this.is(1, EntityType.all.itemCount);
            this.is({ id: null, value: '' }, entityA.data);

            var entityB = EntityType({ id: 1 });
            this.is(2, EntityType.all.itemCount);
            this.is({ id: 1, value: '' }, entityB.data);

            // try to change id for existing value, must be ignored
            entityA.update({ id: 1 });
            this.is(2, EntityType.all.itemCount);
            this.is(entityB, EntityType.get(1));
            this.is({ id: null, value: '' }, entityA.data);

            entityA.update({ id: 2 });
            this.is(2, EntityType.all.itemCount);
            this.is(entityA, EntityType.get(2));
            this.is({ id: 2, value: '' }, entityA.data);

            // destroy entityB
            entityB.destroy();
            this.is(1, EntityType.all.itemCount);
            this.is(undefined, EntityType.get(1));
            this.is({}, entityB.data);

            entityA.update({ id: 1 });
            this.is(1, EntityType.all.itemCount);
            this.is(entityA, EntityType.get(1));
            this.is(undefined, EntityType.get(2));
            this.is({ id: 1, value: '' }, entityA.data);

            entityA.update({ id: '1' });
            this.is(1, EntityType.all.itemCount);
            this.is(entityA, EntityType.get(1));
            this.is(entityA, EntityType.get('1'));
            this.is({ id: 1, value: '' }, entityA.data);

            // destroy entityA
            entityA.destroy();
            this.is(0, EntityType.all.itemCount);
            this.is(undefined, EntityType.get(1));
            this.is({}, entityA.data);
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
                this.is({ a: '', b: 0, c: '0', d: '00' }, entity.data);

                // values for calc fields in config must be ignored
                var entity = Type({ c: 'xxx' });
                this.is({ a: '', b: 0, c: '0', d: '00' }, entity.data);

                // calc values should be computed
                var entity = Type({ a: 'xxx' });
                this.is({ a: 'xxx', b: 0, c: 'xxx0', d: '0xxx0' }, entity.data);
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
                  assert.deep({ foo: 1, bar: 2 }, instance.data);
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
                  assert.deep({ foo: 1, bar: 2 }, instance.data);
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
                  assert.deep({ foo: 1, bar: 2 }, instance.data);
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

                  assert('baz' in Type.entityType.aliases == false);
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
                this.is({ a: 1, b: 'default', c: 'default', calcWithDefault: 5 }, entity.data);

                // #2 - set all values
                var entity = Type({ a: 2, b: 3, c: 4, calcWithDefault: 5 });
                this.is({ a: 2, b: 3, c: 4, calcWithDefault: 10 }, entity.data);

                // #3
                var entity = Type({ a: 2 });
                this.is({ a: 2, b: 'default', c: 'default', calcWithDefault: 10 }, entity.data);

                // #4
                var entity = Type({ a: 2, b: 3 });
                this.is({ a: 2, b: 3, c: 5, calcWithDefault: 10 }, entity.data);
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
    },
    {
      name: 'update with rollback',
      test: [
        {
          name: 'with no id field',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);
            this.is(0, rollbackEvents(entity).length);
            this.is({ id: 1, value: '1', self: false }, entity.data);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ id: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2 }, entity.history_[0]);
            this.is({ id: 2 }, entity.modified);
            this.is({ id: 3, value: '2', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: undefined }, rollbackEvents(entity)[0][2]);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 4 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ value: 5 });
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '5' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '2' }, rollbackEvents(entity)[0][2]);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ value: 6 });
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '5' }, rollbackEvents(entity)[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 7 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '4' }, entity.history_[0]);
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.update({ id: 4 });
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: 2 }, rollbackEvents(entity)[0][2]);
          }
        },
        {
          name: 'update rollback storage',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 4, value: '6', self: false });

            // prepare
            resetHistory(entity);
            entity.update({ id: 3, value: '7' }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: undefined, value: undefined }, rollbackEvents(entity)[0][2]);

            //
            // main part
            //

            // update in no rollback mode should check for existing key in rollback storage, but not value
            resetHistory(entity);
            entity.update({ self: true });
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            resetHistory(entity);
            entity.update({ self: false });
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            resetHistory(entity);
            entity.update({ self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ self: undefined }, rollbackEvents(entity)[0][2]);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ self: true }, true);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ self: true });
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ self: false }, rollbackEvents(entity)[0][2]);

            // update, rollbackUpdate
            resetHistory(entity);
            entity.update({ self: 1 });
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: 1 }, entity.data);
            this.is(0, rollbackEvents(entity).length);
          }
        },
        {
          name: 'updates with id field',
          test: function(){

            var EntityType = new nsEntity.EntityType({
              fields: {
                id: nsEntity.IntId,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);
            this.is(0, rollbackEvents(entity).length);

            // prepare
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            //
            // main part
            //

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ id: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2 }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 3, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.update({ id: 4 });
            this.is(1, entity.history_.length);
            this.is({ id: 3 }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 4, value: '3', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);
          }
        },
        {
          name: 'drop rollback storage when data has the same data, with no id',
          test: function(){

            var EntityType = new nsEntity.EntityType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });

            resetHistory(entity);
            entity.update({ id: 2, value: '2', self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1', self: false }, entity.history_[0]);
            this.is({ id: 1, value: '1', self: false }, entity.modified);
            this.is({ id: 2, value: '2', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: undefined, value: undefined, self: undefined }, rollbackEvents(entity)[0][2]);


            // should drop rollback storage
            resetHistory(entity);
            entity.update({ id: 1, value: '1', self: false }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2, value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '1', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: 1, value: '1', self: false }, rollbackEvents(entity)[0][2]);

            // must be no rollback mode
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(1, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // should do nothing
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(0, entity.history_.length);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '3' });
            this.is(0, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '2' }, rollbackEvents(entity)[0][2]);

            resetHistory(entity);
            entity.update({ value: '2' });

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '2' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '2' }, rollbackEvents(entity)[0][2]);
          }
        },
        {
          name: 'drop rollback storage when data has the same data, with id',
          test: function(){

            var EntityType = new nsEntity.EntityType({
              fields: {
                id: nsEntity.IntId,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });

            resetHistory(entity);
            entity.update({ id: 2, value: '2', self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1', self: false }, entity.history_[0]);
            this.is({ id: 2, value: '2', self: true }, entity.data);
            this.is({ value: '1', self: false }, entity.modified);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined, self: undefined }, rollbackEvents(entity)[0][2]);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ id: 1, value: '1', self: false }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2, value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '1', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '1', self: false }, rollbackEvents(entity)[0][2]);

            // must be no rollback mode
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(1, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // should do nothing
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(0, entity.history_.length);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '3' });
            this.is(0, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '2' }, rollbackEvents(entity)[0][2]);

            resetHistory(entity);
            entity.update({ value: '2' });

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '2' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '2' }, rollbackEvents(entity)[0][2]);

            // ----------------------------------------------
            /*
            // update with rollback
            entity.update({ value: '3' }, true);

            // should drop rollback storage
            entity.update({ value: '3' });
            this.is(9, entity.history_.length);
            this.is({ value: '3' }, entity.history_[5]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(8, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate' }).length);
            */
          }
        }
      ]
    },
    {
      name: 'set with rollback',
      test: [
        {
          name: 'with no id field',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);
            this.is(0, rollbackEvents(entity).length);

            // prepare
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            //
            // main part
            //

            // update and rollbackUpdate
            resetHistory(entity);
            entity.set('id', 3, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2 }, entity.history_[0]);
            this.is({ id: 2 }, entity.modified);
            this.is({ id: 3, value: '2', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: undefined }, rollbackEvents(entity)[0][2]);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.set('value', 3, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.set('value', 4, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.set('value', 5);
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '5' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '2' }, rollbackEvents(entity)[0][2]);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.set('value', 6);
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '5' }, rollbackEvents(entity)[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.set('value', 7, true);
            this.is(1, entity.history_.length);
            this.is({ value: '4' }, entity.history_[0]);
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.set('id', 4);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: 2 }, rollbackEvents(entity)[0][2]);
          }
        },
        {
          name: 'update rollback storage',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 4, value: '6', self: false });

            // prepare
            resetHistory(entity);
            entity.update({ id: 3, value: '7' }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: undefined, value: undefined }, rollbackEvents(entity)[0][2]);

            //
            // main part
            //

            // update in no rollback mode should check for existing key in rollback storage, but not value
            resetHistory(entity);
            entity.set('self', true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            resetHistory(entity);
            entity.set('self', false);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            resetHistory(entity);
            entity.set('self', true, true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ self: undefined }, rollbackEvents(entity)[0][2]);

            // no rollbackUpdate, no update
            resetHistory(entity);
            entity.set('self', true, true);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.set('self', true);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ self: false }, rollbackEvents(entity)[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.set('self', 1);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: 1 }, entity.data);
            this.is(0, rollbackEvents(entity).length);

          }
        },
        {
          name: 'updates with id field',
          test: function(){

            var EntityType = new nsEntity.EntityType({
              fields: {
                id: nsEntity.IntId,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);

            // prepare
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            //
            // main part
            //

            // update and rollbackUpdate
            resetHistory(entity);
            entity.set('id', 3, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2 }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 3, value: '2', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.set('value', 3, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined }, rollbackEvents(entity)[0][2]);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.set('id', 4);
            this.is(1, entity.history_.length);
            this.is({ id: 3 }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 4, value: '3', self: false }, entity.data);
            this.is(0, rollbackEvents(entity).length);
          }
        }
      ]
    },
    {
      name: 'rollback',
      test: [
        {
          name: 'with no id field, full rollback',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });

            resetHistory(entity);
            entity.update({ id: 2, value: 2, self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1', self: false }, entity.history_[0]);
            this.is({ id: 1, value: '1', self: false }, entity.modified);
            this.is({ id: 2, value: '2', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: undefined, value: undefined, self: undefined }, rollbackEvents(entity)[0][2]);

            resetHistory(entity);
            entity.rollback();
            this.is(1, entity.history_.length);
            this.is({ id: 2, value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '1', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ id: 1, value: '1', self: false }, rollbackEvents(entity)[0][2]);
          }
        },
        {
          name: 'with id field, full rollback',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: nsEntity.IntId,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });

            resetHistory(entity);
            entity.update({ id: 2, value: 2, self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1', self: false }, entity.history_[0]);
            this.is({ value: '1', self: false }, entity.modified);
            this.is({ id: 2, value: '2', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: undefined, self: undefined }, rollbackEvents(entity)[0][2]);

            resetHistory(entity);
            entity.rollback();
            this.is(1, entity.history_.length);
            this.is({ value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '1', self: false }, entity.data);
            this.is(1, rollbackEvents(entity).length);
            this.is({ value: '1', self: false }, rollbackEvents(entity)[0][2]);
          }
        },
        {
          name: 'must not change object state',
          test: function(){
            var EntityType = new nsEntity.EntityType({
              fields: {
                id: nsEntity.IntId,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });

            entity.update({ id: 2, value: 2, self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1', self: false }, entity.history_[0]);
            this.is({ value: '1', self: false }, entity.modified);
            this.is({ id: 2, value: '2', self: true }, entity.data);
            this.is(1, rollbackEvents(entity).length);

            entity.setState(nsData.STATE.UNDEFINED);

            entity.rollback();
            this.is(nsData.STATE.UNDEFINED, entity.state);
            this.is(2, entity.history_.length);
            this.is({ value: '2', self: true }, entity.history_[1]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '1', self: false }, entity.data);
            this.is(2, rollbackEvents(entity).length);
          }
        },
        {
          name: 'rollback custom fields',
          test: function(){
            var Type = nsEntity.createType(null, {
              id: nsEntity.StringId,
              a: String,
              b: Number,
              c: Number
            });

            // #1
            var entity = Type({});
            this.is({ id: null, a: '', b: 0, c: 0 }, entity.data);
            this.is(null, entity.modified);

            entity.update({ a: 'xx', b: 123 }, true);
            this.is({ id: null, a: 'xx', b: 123, c: 0 }, entity.data);
            this.is({ a: '', b: 0 }, entity.modified);

            entity.rollback('a');
            this.is({ id: null, a: '', b: 123, c: 0 }, entity.data);
            this.is({ b: 0 }, entity.modified);

            // #2
            var entity = Type({ c: 123 });

            entity.update({ a: 'xx', b: 123, c: 456 }, true);
            this.is({ id: null, a: 'xx', b: 123, c: 456 }, entity.data);
            this.is({ a: '', b: 0, c: 123 }, entity.modified);

            entity.rollback(['a', 'c']);
            this.is({ id: null, a: '', b: 123, c: 123 }, entity.data);
            this.is({ b: 0 }, entity.modified);

            // #3 - rollback non-existing fields
            var entity = Type({ c: 123 });

            entity.update({ a: 'xx', b: 123, c: 456 }, true);
            this.is({ id: null, a: 'xx', b: 123, c: 456 }, entity.data);
            this.is({ a: '', b: 0, c: 123 }, entity.modified);

            entity.rollback(['x', 'y']);
            this.is({ id: null, a: 'xx', b: 123, c: 456 }, entity.data);
            this.is({ a: '', b: 0, c: 123 }, entity.modified);

            entity.rollback(['a', 'x', 'b']);
            this.is({ id: null, a: '', b: 0, c: 456 }, entity.data);
            this.is({ c: 123 }, entity.modified);
          }
        },
        {
          name: 'rollback custom calc fields',
          test: function(){
            var Type = nsEntity.createType(null, {
              id: nsEntity.StringId,
              a: String,
              b: Number,
              c: nsEntity.calc('a', 'b', function(a, b){
                return a + b;
              }),
              d: nsEntity.calc('b', 'c', function(a, b){
                return a + b;
              }),
              e: nsEntity.calc('d', 'c', function(){
                return 1;
              })
            });

            // #1 - calc depends on fields only
            var entity = Type({});
            this.is({ id: null, a: '', b: 0, c: '0', d: '00', e: 1 }, entity.data);
            this.is(null, entity.modified);

            entity.update({ a: 'test' }, true);
            this.is({ id: null, a: 'test', b: 0, c: 'test0', d: '0test0', e: 1 }, entity.data);
            this.is({ a: '' }, entity.modified);

            entity.rollback('c');
            this.is({ id: null, a: '', b: 0, c: '0', d: '00', e: 1 }, entity.data);
            this.is(null, entity.modified);

            // #2 - calc depends on field and calc
            var entity = Type({});
            entity.update({ a: 'test' }, true);

            entity.rollback('d');
            this.is({ id: null, a: '', b: 0, c: '0', d: '00', e: 1 }, entity.data);
            this.is(null, entity.modified);

            // #3 - calc depends on calcs only
            var entity = Type({});
            entity.update({ a: 'test' }, true);

            entity.rollback('e');
            this.is({ id: null, a: '', b: 0, c: '0', d: '00', e: 1 }, entity.data);
            this.is(null, entity.modified);

            // #4 - mixed
            entity.update({ a: 'test', b: 2 }, true);
            this.is({ id: null, a: 'test', b: 2, c: 'test2', d: '2test2', e: 1 }, entity.data);
            this.is({ a: '', b: 0 }, entity.modified);

            entity.rollback(['a', 'e']);
            this.is({ id: null, a: '', b: 0, c: '0', d: '00', e: 1 }, entity.data);
            this.is(null, entity.modified);
          }
        }
      ]
    },
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
    },
    {
      name: 'field types',
      test: [
        {
          name: 'entity wrapper',
          test: [
            {
              name: 'entity type by name',
              test: [
                {
                  name: 'use name after type declared',
                  test: function(){
                    var Type1 = nsEntity.createType('fieldTypeTest-declaredTypeName', { value: Number });
                    var Type2 = nsEntity.createType(null, { nested: 'fieldTypeTest-declaredTypeName' });
                    var instance = Type2({ nested: { value: 123 } });

                    assert(typeof instance.data.nested != 'undefined');
                    assert(instance.data.nested.data.value == 123);
                  }
                },
                {
                  name: 'use name before type declared',
                  test: function(){
                    var Type1;
                    assert(catchWarnings(function(){
                      Type1 = nsEntity.createType(null, { nested: 'fieldTypeTest-nonDeclaredTypeName' });
                    }) === false);

                    var Type2 = nsEntity.createType('fieldTypeTest-nonDeclaredTypeName', { value: Number });
                    var instance = Type1({ nested: { value: 123 } });

                    assert(typeof instance.data.nested != 'undefined');
                    assert(instance.data.nested.data.value == 123);
                  }
                },
                {
                  name: 'create type instance with null/undefined value for non-declared type field should not produce warnings',
                  test: function(){
                    var Type1 = nsEntity.createType(null, { nested: 'fieldTypeTest-nonDeclaredTypeName-noWarnings' });;

                    assert(catchWarnings(function(){
                      Type1({});
                    }) === false);
                  }
                }
              ]
            },
            {
              name: 'entity set type by name',
              test: [
                {
                  name: 'use name after type declared',
                  test: function(){
                    var Type1 = nsEntity.createType(null, { value: Number });
                    var SetType1 = nsEntity.createSetType('fieldSetTypeTest-declaredTypeName', Type1);
                    var Type2 = nsEntity.createType(null, { items: 'fieldSetTypeTest-declaredTypeName' });
                    var instance = Type2({ items: [{ value: 123 }] });

                    assert(typeof instance.data.items != 'undefined');
                    assert(instance.data.items.itemCount == 1);
                    assert(instance.data.items.pick().data.value == 123);
                  }
                },
                {
                  name: 'use name before type declared',
                  test: function(){
                    var Type1 = nsEntity.createType(null, { value: Number });
                    var Type2 = nsEntity.createType(null, { items: 'fieldSetTypeTest-nonDeclaredTypeName' });
                    var SetType1 = nsEntity.createSetType('fieldSetTypeTest-nonDeclaredTypeName', Type1);
                    var instance = Type2({ items: [{ value: 123 }] });

                    assert(typeof instance.data.items != 'undefined');
                    assert(instance.data.items.itemCount == 1);
                    assert(instance.data.items.pick().data.value == 123);
                  }
                }
              ]
            }
          ]
        },
        {
          name: 'Array',
          test: [
            {
              name: 'undefined by default',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    array: Array
                  }
                });
                var obj = T({});

                this.is(null, obj.data.array);
              }
            },
            {
              name: 'set array',
              test: function(){
                var a = [1, 2, 3];
                var b = [1, 2, 3];
                var c = [4, 5, 6];

                var T = nsEntity.createType({
                  fields: {
                    array: Array
                  }
                });
                var obj = T({ array: a });

                this.is(a, obj.data.array);

                this.is(false, obj.set('array', a));
                this.is(a, obj.data.array);

                this.is(false, obj.set('array', b));
                this.is(a, obj.data.array);

                this.is('object', typeof obj.set('array', c));
                this.is(c, obj.data.array);

                this.is('object', typeof obj.set('array', b));
                this.is(b, obj.data.array);

                this.is(false, obj.set('array', a));
                this.is(b, obj.data.array);

                this.is('object', typeof obj.set('array', null));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is(a, obj.data.array);
              }
            },
            {
              name: 'everything non-array become null',
              test: function(){
                var a = [1, 2, 3];

                var T = nsEntity.createType({
                  fields: {
                    array: Array
                  }
                });
                var obj = T({ array: a });

                this.is('object', typeof obj.set('array', null));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is('object', typeof obj.set('array', undefined));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is('object', typeof obj.set('array', true));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is('object', typeof obj.set('array', 'whatever'));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is('object', typeof obj.set('array', 123));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is('object', typeof obj.set('array', {}));
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', a));
                this.is('object', typeof obj.set('array', function(){}));
                this.is(null, obj.data.array);

                this.is(false, obj.set('array', 'whatever'));
                this.is(null, obj.data.array);
              }
            },
            {
              name: 'update with rollback',
              test: function(){
                var a = [1, 2, 3];
                var b = [1, 2, 3];
                var c = [4, 5, 6];

                var T = nsEntity.createType({
                  fields: {
                    array: Array
                  }
                });
                var obj = T({ array: a });

                this.is(a, obj.data.array);

                this.is(false, obj.set('array', b, true));
                this.is(null, obj.modified);

                this.is('object', typeof obj.set('array', c, true));
                this.is({ array: a }, obj.modified);
                this.is(true, (obj.modified && obj.modified.array) === a);

                this.is('object', typeof obj.set('array', b, true));
                this.is(null, obj.modified);
                this.is(true, obj.data.array === a);
              }
            },
            {
              name: 'update to null with rollback',
              test: function(){
                var a = [1, 2, 3];
                var b = [1, 2, 3];

                var T = nsEntity.createType({
                  fields: {
                    array: Array
                  }
                });
                var obj = T({ array: a });

                this.is('object', typeof obj.set('array', null, true));
                this.is({ array: a }, obj.modified);
                this.is(true, (obj.modified && obj.modified.array) === a);
                this.is(null, obj.data.array);

                this.is('object', typeof obj.set('array', b, true));
                this.is(null, obj.modified);
                this.is(true, obj.data.array === a);
              }
            }
          ]
        },
        {
          name: 'enum',
          test: [
            {
              name: 'default value',
              test: [
                {
                  name: 'if no defValue get first variant as default',
                  test: function(){
                    var T = nsEntity.createType({
                      fields: {
                        enum: ['a', 'b']
                      }
                    });

                    this.is('a', T({}).data.enum);
                    this.is('b', T({ enum: 'b' }).data.enum);
                  }
                },
                {
                  name: 'take in account defValue as default value',
                  test: function(){
                    var T = nsEntity.createType({
                      fields: {
                        enum: {
                          type: ['a', 'b'],
                          defValue: 'b'
                        }
                      }
                    });

                    this.is('b', T({}).data.enum);
                    this.is('a', T({ enum: 'a' }).data.enum);
                  }
                },
                {
                  name: 'ignore defValue if value not in the list',
                  test: function(){
                    var T = nsEntity.createType({
                      fields: {
                        enum: {
                          type: ['a', 'b'],
                          defValue: 'c'
                        }
                      }
                    });

                    this.is('a', T({}).data.enum);
                    this.is('b', T({ enum: 'b' }).data.enum);

                    var T2 = nsEntity.createType({
                      fields: {
                        enum: {
                          type: ['1', '2'],
                          defValue: 2
                        }
                      }
                    });
                    this.is('1', T2({}).data.enum);
                    this.is('2', T2({ enum: '2' }).data.enum);
                  }
                }
              ]
            },
            {
              name: 'set',
              test: [
                {
                  name: 'only value from list can be set',
                  test: function(){
                    var T = nsEntity.createType({
                      fields: {
                        enum: ['a', 'b']
                      }
                    });

                    this.is('b', T({ enum: 'b' }).data.enum);
                    this.is('a', T({ enum: 'c' }).data.enum);

                    var obj = T({ enum: 'b' });
                    this.is(false, obj.set('enum', 'c'));
                    this.is(true, obj.set('enum', 'a') !== false);
                    this.is('a', obj.data.enum);
                  }
                },
                {
                  name: 'should not coerce values',
                  test: function(){
                    var T = nsEntity.createType({
                      fields: {
                        enum: ['1', '2']
                      }
                    });

                    this.is('1', T({ enum: 2 }).data.enum);
                    this.is('2', T({ enum: '2' }).data.enum);

                    var obj = T({ enum: '1' });
                    this.is(false, obj.set('enum', 2));
                    this.is(true, obj.set('enum', '2') !== false);
                    this.is('2', obj.data.enum);
                  }
                },
                {
                  name: 'changes of source array should not affect values list',
                  test: function(){
                    var variants = ['a', 'b'];
                    var T = nsEntity.createType({
                      fields: {
                        enum: variants
                      }
                    });

                    variants.push('c');
                    this.is(['a', 'b', 'c'], variants);

                    this.is('a', T({ }).data.enum);
                    this.is('a', T({ enum: 'c' }).data.enum);

                    variants.length = 0;
                    this.is([], variants);

                    var obj = T({ });
                    this.is('a', T({ }).data.enum);
                    this.is(false, obj.set('enum', 'c'));
                    this.is(true, obj.set('enum', 'b') !== false);
                    this.is('b', obj.data.enum);
                  }
                }
              ]
            },
            {
              name: 'one value treats as constant',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    enum: ['value']
                  }
                });
                var obj = T({});

                this.is('value', obj.data.enum);
                this.is(false, obj.set('enum', 123));
                this.is('value', obj.data.enum);
              }
            }
          ]
        },
        {
          name: 'Date',
          test: [
            {
              name: 'set correct values on init',
              test: function(){
                var T = basis.entity.createType({
                  fields: {
                    date: Date
                  }
                });

                var date = new Date;
                assert(T({ date: null }).data.date === null);
                assert(T({ date: date }).data.date === date);
                assert(T({ date: dateUtils.toISOString(date) }).data.date - date === 0);
                assert(T({ date: Number(date) }).data.date - date === 0);
              }
            },
            {
              name: 'set correct values on update',
              test: function(){
                var T = basis.entity.createType({
                  fields: {
                    date: Date
                  }
                });

                var date = new Date;
                var date2 = new Date(2014, 10, 15);

                // null
                var instance = T({ date: date });
                instance.set('date', null);
                assert(instance.data.date === null);

                instance = T({ date: null });
                assert(instance.set('date', null) === false);
                assert(instance.data.date === null);

                // string (the same value)
                var value = dateUtils.toISOString(date);
                var instance = T({ date: date });
                assert(instance.set('date', value) === false);
                assert(instance.data.date !== value);
                assert(instance.data.date === date);

                // another value
                var value = dateUtils.toISOString(date2);
                var instance = T({ date: date });
                assert(instance.set('date', value) !== false);
                assert(instance.data.date !== value);
                assert(instance.data.date !== date);
                assert(instance.data.date - date2 === 0);

                instance = T({ date: null });
                assert(instance.set('date', value) !== false);
                assert(instance.data.date !== value);
                assert(instance.data.date !== date2);
                assert(instance.data.date - date2 === 0);

                // number (the same value)
                var value = Number(date);
                var instance = T({ date: date });
                assert(instance.set('date', value) === false);
                assert(instance.data.date !== value);
                assert(instance.data.date === date);

                // another value
                var value = Number(date2);
                var instance = T({ date: date });
                assert(instance.set('date', value) !== false);
                assert(instance.data.date !== value);
                assert(instance.data.date !== date);
                assert(instance.data.date - date2 === 0);

                instance = T({ date: null });
                assert(instance.set('date', value) !== false);
                assert(instance.data.date !== value);
                assert(instance.data.date !== date);
                assert(instance.data.date - date2 === 0);

                // date
                var instance = T({ date: date });
                assert(instance.set('date', date) === false);
                assert(instance.data.date === date);

                var instance = T({ date: date });
                assert(instance.set('date', date2) !== false);
                assert(instance.data.date === date2);

                var instance = T({ date: null });
                assert(instance.set('date', date) !== false);
                assert(instance.data.date === date);
              }
            },
            {
              name: 'set wrong values on init',
              test: function(){
                var T = basis.entity.createType({
                  fields: {
                    date: Date
                  }
                });

                assert(T({ date: {} }).data.date === null);
                assert(T({ date: [] }).data.date === null);
                assert(T({ date: function(){} }).data.date === null);
                assert(T({ date: '' }).data.date === null);
                assert(T({ date: NaN }).data.date === null);
                assert(T({ date: true }).data.date === null);
                assert(T({ date: false }).data.date === null);
              }
            },
            {
              name: 'set wrong values',
              test: function(){
                var T = basis.entity.createType({
                  fields: {
                    date: Date
                  }
                });

                var date = new Date();
                assert(T({ date: date }).set('date', {}) === false);
                assert(T({ date: date }).set('date', []) === false);
                assert(T({ date: date }).set('date', function(){}) === false);
                assert(T({ date: date }).set('date', '') === false);
                assert(T({ date: date }).set('date', NaN) === false);
                assert(T({ date: date }).set('date', true) === false);
                assert(T({ date: date }).set('date', false) === false);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'destroy',
      test: [
        {
          name: 'no warnings about handler remove on destroy',
          test: function(){
            var Type = nsEntity.createType();
            var subset = new Filter({ source: Type.all });
            var instance = Type({});

            assert(subset.itemCount == 1);
            assert(catchWarnings(function(){
              instance.destroy();
            }) == false);

            assert(subset.itemCount == 0);
          }
        },
        {
          name: 'no warnings on all.sync([])',
          test: function(){
            var Type = nsEntity.createType();
            var subset = new Filter({ source: Type.all });
            var eventCount = 0;

            Type({});
            Type({});

            subset.addHandler({
              itemsChanged: function(){
                eventCount++;
              }
            });

            assert(subset.itemCount == 2);
            assert(catchWarnings(function(){
              Type.all.sync([]);
            }) == false);

            assert(subset.itemCount == 0);
            assert(eventCount == 1);
          }
        },
        {
          name: 'no warnings on subset sync',
          test: function(){
            var Type = nsEntity.createType('TestType', {
              id: nsEntity.IntId,
              group: Number
            });

            var split = new nsEntity.Grouping({
              wrapper: Type,
              source: Type.all,
              rule: 'data.group'
            });

            var wrapper = split.getSubset(1, true);
            var subset = new Filter({
              source: wrapper
            });

            assert(catchWarnings(function(){
              wrapper.dataset.sync([{ id: 1, group: 1 }]);
            }) == false);
            assert(wrapper.itemCount == 1);
            assert(subset.itemCount == 1);

            assert(catchWarnings(function(){
              wrapper.dataset.sync([{ id: 2, group: 1 }]);
            }) == false);
            assert(wrapper.itemCount == 1);
            assert(subset.itemCount == 1);
          }
        }
      ]
    },
    {
      name: 'helpers',
      test: [
        {
          name: 'is(value, type)',
          test: function(){
            var Type = nsEntity.createType('helpers-is');
            var Type2 = nsEntity.createType();

            assert(nsEntity.is(Type({}), Type));
            assert(nsEntity.is(Type({}), 'helpers-is'));
            assert(nsEntity.is(Type2({}), Type2));

            assert(nsEntity.is({}, Type) === false);
            assert(nsEntity.is({}, 'xxx') === false);
            assert(nsEntity.is(Type({}), Type2) === false);
            assert(nsEntity.is() === false);
          }
        }
      ]
    }
  ]
};
