module.exports = {
  name: 'nsEntity',

  init: function(){
    var nsData = basis.require('basis.data');
    var nsEntity = basis.require('basis.entity');
    var createType = nsEntity.createType;    

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
        basis.require('basis.event').events.update.call(this, delta);
      };

      nsEntity.BaseEntity.prototype.emit_rollbackUpdate = function(delta){
        this.historyAll_.push(['rollbackUpdate'].concat([this].concat(basis.array.from(arguments))));
        basis.require('basis.event').events.rollbackUpdate.call(this, delta);
      };
    })();    

    function resetHistory(obj){
      obj.history_ = [];
      obj.historyAll_ = [];
    }

    function catchWarnings(fn){
      var warn = basis.dev.warn;
      var warnings = [];

      try {
        basis.dev.warn = function(message){
          warnings.push(message);
        };

        fn();
      } finally {
        basis.dev.warn = warn;
      }

      return warnings.length ? warnings : false;
    }

    function getIds(dataset){
      return dataset instanceof nsData.ReadOnlyDataset ? dataset.getValues('data.id').sort() : null;
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

            this.is(true, EntityType.all !== null);
            this.is(true, EntityType.all instanceof nsData.ReadOnlyDataset);

            var entityA = EntityType();
            this.is(undefined, entityA);
            this.is(0, EntityType.all.itemCount);

            var entityB = EntityType({});
            this.is(true, entityB !== null);
            this.is(1, EntityType.all.itemCount);
            this.is({ id: 0, value: '' }, entityB.data);

            var entityC = EntityType({ id: '1', value: 'test' });
            this.is(2, EntityType.all.itemCount);
            this.is({ id: 1, value: 'test' }, entityC.data);

            var entityD = EntityType({ id: '1', value: 'test' });
            this.is(3, EntityType.all.itemCount);
            this.is(true, entityD != entityC);
            this.is({ id: 1, value: 'test' }, entityD.data);
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
            var EntityType = nsEntity.createType({
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
            var EntityType = nsEntity.createType({
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
          test: function(){
            var Type = createType(null, {
              a: String,
              b: Number,
              c: nsEntity.calc('a', 'b', function(a, b){ return a + b; }),
              d: nsEntity.calc('b', 'c', function(a, b){ return a + b; })
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
          name: 'default values',
          test: function(){
            var Type = createType(null, {
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
                calc: nsEntity.calc('a', function(a){ return a * 5; })
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

            // =========================

            var callCount = 0;
            var Type2 = createType(null, {
              a: {
                defValue: function(initData){
                  callCount++;
                }
              }
            });

            Type2({});
            assert(callCount == 1);
            Type2({ a: 123 });
            assert(callCount == 1);
          }
        }
      ]
    },
    {
      name: 'update with rollback',
      test: [
        {
          name: 'with no id field',
          test: function(){
            var EntityType = nsEntity.createType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: 1, value: '1', self: false }, entity.data);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ id: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2 }, entity.history_[0]);
            this.is({ id: 2 }, entity.modified);
            this.is({ id: 3, value: '2', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 4 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ value: 5 });
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '5' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '2' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ value: 6 });
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '5' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 7 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '4' }, entity.history_[0]);
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.update({ id: 4 });
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: 2 }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);
          }
        },
        {
          name: 'update rollback storage',
          test: function(){
            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: undefined, value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            //
            // main part
            //

            // update in no rollback mode should check for existing key in rollback storage, but not value
            resetHistory(entity);
            entity.update({ self: true });
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            resetHistory(entity);
            entity.update({ self: false });
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            resetHistory(entity);
            entity.update({ self: true }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ self: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ self: true }, true);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.update({ self: true });
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ self: false }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update, rollbackUpdate
            resetHistory(entity);
            entity.update({ self: 1 });
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: 1 }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
          }
        },
        {
          name: 'updates with id field',
          test: function(){

            var EntityType = nsEntity.createType({
              fields: {
                id: nsEntity.IntId,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // prepare
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

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
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.update({ value: 3 }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.update({ id: 4 });
            this.is(1, entity.history_.length);
            this.is({ id: 3 }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 4, value: '3', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
          }
        },
        {
          name: 'drop rollback storage when data has the same data, with no id',
          test: function(){

            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: undefined, value: undefined, self: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);


            // should drop rollback storage
            resetHistory(entity);
            entity.update({ id: 1, value: '1', self: false }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2, value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '1', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: 1, value: '1', self: false }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // must be no rollback mode
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(1, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // should do nothing
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(0, entity.history_.length);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '3' });
            this.is(0, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '2' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            resetHistory(entity);
            entity.update({ value: '2' });

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '2' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '2' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

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
        },
        {
          name: 'drop rollback storage when data has the same data, with id',
          test: function(){

            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined, self: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ id: 1, value: '1', self: false }, true);
            this.is(1, entity.history_.length);
            this.is({ id: 2, value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '1', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '1', self: false }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // must be no rollback mode
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(1, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // should do nothing
            resetHistory(entity);
            entity.update({ value: '2' });
            this.is(0, entity.history_.length);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '3' });
            this.is(0, entity.history_.length);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '2' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            resetHistory(entity);
            entity.update({ value: '2' });

            // update with rollback
            resetHistory(entity);
            entity.update({ value: '3' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 1, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // should drop rollback storage
            resetHistory(entity);
            entity.update({ value: '2' }, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '2', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '2' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

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
            var EntityType = nsEntity.createType({
              fields: {
                id: Number,
                value: String,
                self: basis.fn.$self
              }
            });

            var entity = EntityType({ id: 1, value: '1', self: false });
            this.is(0, entity.history_.length);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // prepare
            resetHistory(entity);
            entity.update({ id: 2, value: '2' });
            this.is(1, entity.history_.length);
            this.is({ id: 1, value: '1' }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '2', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.set('value', 3, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.set('value', 4, true);
            this.is(1, entity.history_.length);
            this.is({ value: '3' }, entity.history_[0]);
            this.is({ id: 2, value: '2' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.set('value', 5);
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '5' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '2' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.set('value', 6);
            this.is(0, entity.history_.length); // no update
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '4', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '5' }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.set('value', 7, true);
            this.is(1, entity.history_.length);
            this.is({ value: '4' }, entity.history_[0]);
            this.is({ id: 2, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.set('id', 4);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: 2 }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);
          }
        },
        {
          name: 'update rollback storage',
          test: function(){
            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: undefined, value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            //
            // main part
            //

            // update in no rollback mode should check for existing key in rollback storage, but not value
            resetHistory(entity);
            entity.set('self', true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            resetHistory(entity);
            entity.set('self', false);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            resetHistory(entity);
            entity.set('self', true, true);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ self: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // no rollbackUpdate, no update
            resetHistory(entity);
            entity.set('self', true, true);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6', self: false }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // rollbackUpdate, no update
            resetHistory(entity);
            entity.set('self', true);
            this.is(0, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: true }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ self: false }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // update, no rollbackUpdate
            resetHistory(entity);
            entity.set('self', 1);
            this.is(1, entity.history_.length);
            this.is({ id: 4, value: '6' }, entity.modified);
            this.is({ id: 3, value: '7', self: 1 }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

          }
        },
        {
          name: 'updates with id field',
          test: function(){

            var EntityType = nsEntity.createType({
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
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

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
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            // update and rollbackUpdate
            resetHistory(entity);
            entity.set('value', 3, true);
            this.is(1, entity.history_.length);
            this.is({ value: '2' }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 3, value: '3', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            // when change id field in no rollback mode -> update and no rollbackUpdate (in other cases otherwise)
            // in this case entity has no id
            resetHistory(entity);
            entity.set('id', 4);
            this.is(1, entity.history_.length);
            this.is({ id: 3 }, entity.history_[0]);
            this.is({ value: '2' }, entity.modified);
            this.is({ id: 4, value: '3', self: false }, entity.data);
            this.is(0, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
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
            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: undefined, value: undefined, self: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            resetHistory(entity);
            entity.rollback();
            this.is(1, entity.history_.length);
            this.is({ id: 2, value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 1, value: '1', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ id: 1, value: '1', self: false }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);
          }
        },
        {
          name: 'with id field, full rollback',
          test: function(){
            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: undefined, self: undefined }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);

            resetHistory(entity);
            entity.rollback();
            this.is(1, entity.history_.length);
            this.is({ value: '2', self: true }, entity.history_[0]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '1', self: false }, entity.data);
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
            this.is({ value: '1', self: false }, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; })[0][2]);
          }
        },
        {
          name: 'must not change object state',
          test: function(){
            var EntityType = nsEntity.createType({
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
            this.is(1, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);

            entity.setState(nsData.STATE.UNDEFINED);

            entity.rollback();
            this.is(nsData.STATE.UNDEFINED, entity.state);
            this.is(2, entity.history_.length);
            this.is({ value: '2', self: true }, entity.history_[1]);
            this.is(null, entity.modified);
            this.is({ id: 2, value: '1', self: false }, entity.data);
            this.is(2, entity.historyAll_.filter(function(arg){ return arg[0] == 'rollbackUpdate'; }).length);
          }
        },
        {
          name: 'rollback custom fields',
          test: function(){
            var Type = createType(null, {
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
            var Type = createType(null, {
              id: nsEntity.StringId,
              a: String,
              b: Number,
              c: nsEntity.calc('a', 'b', function(a, b){ return a + b; }),
              d: nsEntity.calc('b', 'c', function(a, b){ return a + b; }),
              e: nsEntity.calc('d', 'c', function(){ return 1; })
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
            var t = createType(null, {
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
            var t = createType(null, {
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
            var t1 = createType(null, {
              id: { type: Number, index: 'test_1' }
            });
            var t2 = createType(null, {
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
                    var Type1 = createType('fieldTypeTest-declaredTypeName', { value: Number });
                    var Type2 = createType(null, { nested: 'fieldTypeTest-declaredTypeName' });
                    var instance = Type2({ nested: { value: 123 } });

                    assert(typeof instance.data.nested != 'undefined');
                    assert(instance.data.nested.data.value == 123);
                  }
                },
                {
                  name: 'use name before type declared',
                  test: function(){
                    var Type1 = createType(null, { nested: 'fieldTypeTest-nonDeclaredTypeName' });
                    var Type2 = createType('fieldTypeTest-nonDeclaredTypeName', { value: Number });
                    var instance = Type1({ nested: { value: 123 } });

                    assert(typeof instance.data.nested != 'undefined');
                    assert(instance.data.nested.data.value == 123);
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
                    var Type1 = createType(null, { value: Number });
                    var SetType1 = nsEntity.createSetType('fieldSetTypeTest-declaredTypeName', Type1);
                    var Type2 = createType(null, { items: 'fieldSetTypeTest-declaredTypeName' });
                    var instance = Type2({ items: [{ value: 123 }] });

                    assert(typeof instance.data.items != 'undefined');
                    assert(instance.data.items.itemCount == 1);
                    assert(instance.data.items.pick().data.value == 123);
                  }
                },
                {
                  name: 'use name before type declared',
                  test: function(){
                    var Type1 = createType(null, { value: Number });
                    var Type2 = createType(null, { items: 'fieldSetTypeTest-nonDeclaredTypeName' });
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
                var T = createType({
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

                var T = createType({
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

                var T = createType({
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

                var T = createType({
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

                var T = createType({
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
                    var T = createType({
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
                    var T = createType({
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
                    var T = createType({
                      fields: {
                        enum: {
                          type: ['a', 'b'],
                          defValue: 'c'
                        }
                      }
                    });

                    this.is('a', T({}).data.enum);
                    this.is('b', T({ enum: 'b' }).data.enum);

                    var T2 = createType({
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
                    var T = createType({
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
                    var T = createType({
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
                    var T = createType({
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
                var T = createType({
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
          name: 'entity set',
          test: [
            {
              name: 'new value should produce new dataset',
              test: function(){
                var Item = createType(null, {
                  id: nsEntity.IntId
                });
                var T = createType(null, {
                  items: nsEntity.createSetType(Item)
                });

                var entity = T({ items: [1, 2, 3] });
                var base = entity.data.items;

                entity.set('items', [2, 3]);
                assert(entity.data.items !== base);

                entity.set('items', null);
                assert(entity.data.items === null);

                entity.set('items', [1, 2, 3]);
                assert(entity.data.items !== base);
              }
            },
            {
              name: 'should produce new dataset for the same set',
              test: function(){
                var Item = createType(null, {
                  id: nsEntity.IntId
                });
                var T = createType(null, {
                  items: nsEntity.createSetType(Item)
                });

                var entity = T({ items: [1, 2, 3] });
                var base = entity.data.items;

                entity.set('items', [2, 3, 1]);
                assert(entity.data.items === base);

                entity.set('items', [1, 2, 3, 2, 1]);
                assert(entity.data.items === base);
              }
            },
            {
              name: 'rollback',
              test: [
                {
                  name: 'should store original value in modified when update with rollback',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;

                    entity.set('items', [2, 3], true);

                    assert(entity.data.items !== base);
                    assert([2, 3], getIds(entity.data.items));
                    assert(entity.modified.items === base);
                    assert([1, 2, 3], getIds(entity.modified.items));
                  }
                },
                {
                  name: 'should update data if modified exists when update with rollback',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;

                    entity.set('items', [2, 3], true);
                    var data = entity.data.items;

                    entity.set('items', [3, 1], true);

                    assert(entity.data.items !== data);
                    assert([1, 3], getIds(entity.data.items));
                    assert(entity.modified.items === base);
                    assert([1, 2, 3], getIds(entity.modified.items));
                  }
                },
                {
                  name: 'should update modified if exists when update with no rollback',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;

                    entity.set('items', [2, 3], true);
                    var data = entity.data.items;

                    entity.set('items', [3, 1]);

                    assert(entity.data.items === data);
                    assert([2, 3], getIds(entity.data.items));
                    assert(entity.modified.items !== base);
                    assert([1, 3], getIds(entity.modified.items));
                  }
                },
                {
                  name: 'should remove value from modified if new value similar to original value in rollback mode',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;

                    entity.set('items', [2, 3], true);
                    var data = entity.data.items;

                    entity.set('items', [3, 2, 1], true);

                    assert(entity.data.items === base);
                    assert([1, 2, 3], getIds(entity.data.items));
                    assert(entity.modified == null);
                  }
                },
                {
                  name: 'should remove value from modified if new value similar to user value in non-rollback mode',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });

                    entity.set('items', [2, 3], true);
                    var base = entity.data.items;

                    entity.set('items', [3, 2]);

                    assert(entity.data.items === base);
                    assert([2, 3], getIds(entity.data.items));
                    assert(entity.modified == null);
                  }
                },
                {
                  name: 'should restore value from modified when rollback',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;

                    entity.set('items', [2, 3], true);

                    entity.rollback();

                    assert(entity.data.items === base);
                    assert([1, 2, 3], getIds(entity.data.items));
                    assert(entity.modified == null);
                  }
                },
                {
                  name: 'should restore value from modified when rollback #2',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;

                    entity.set('items', [2, 3], true);
                    entity.set('items', [3, 4, 5]);

                    var data = entity.modified.items;
                    entity.rollback();

                    assert(entity.data.items === data);
                    assert([3, 4, 5], getIds(entity.data.items));
                    assert(entity.modified == null);
                  }
                },
                {
                  name: 'should re-check modified when set in data is changing',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });

                    entity.set('items', [2, 3], true);
                    var base = entity.data.items;

                    assert(entity.modified != null);

                    entity.data.items.set([2, 3, 4]);
                    assert(entity.data.items === base);
                    assert([2, 3, 4], getIds(entity.data.items));
                    assert(entity.modified != null);

                    entity.data.items.set([1, 2, 3]);
                    assert(entity.data.items === base);
                    assert([1, 2, 3], getIds(entity.data.items));
                    assert(entity.modified == null);

                    // just in case
                    var entity = T({ items: [1, 2, 3] });
                    var base = entity.data.items;
                    entity.data.items.set([2, 3, 4]);
                    assert([2, 3, 4], getIds(entity.data.items));
                    assert(entity.data.items === base);
                    assert(entity.modified == null);
                  }
                },
                {
                  name: 'should re-check modified when set in modified is changing',
                  test: function(){
                    var Item = createType(null, {
                      id: nsEntity.IntId
                    });
                    var T = createType(null, {
                      items: nsEntity.createSetType(Item)
                    });

                    var entity = T({ items: [1, 2, 3] });

                    entity.set('items', [2, 3], true);
                    var base = entity.data.items;

                    assert(entity.modified != null);

                    entity.modified.items.set([2, 3, 4]);
                    assert(entity.data.items === base);
                    assert([2, 3], getIds(entity.data.items));
                    assert([2, 3, 4], getIds(entity.modified.items));
                    assert(entity.modified != null);

                    entity.modified.items.set([2, 3]);
                    assert(entity.data.items === base);
                    assert([2, 3], getIds(entity.data.items));
                    assert(entity.modified == null);
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'external rules to update values',
      test: [
        {
          name: 'should set null as value when value is Emitter instance and destroy',
          test: function(){
            var T = createType(null, {
              value: basis.fn.$self
            });

            var emitter = new nsData.Object();
            var entity = T({ value: emitter });

            assert(entity.data.value === emitter);

            emitter.destroy();
            assert(entity.data.value === null);
          }
        },
        {
          name: 'should set null to modified when value is Emitter instance and destroy',
          test: function(){
            var T = createType(null, {
              value: basis.fn.$self
            });

            var emitter1 = new nsData.Object();
            var emitter2 = new nsData.Object();
            var entity = T({ value: emitter1 });

            entity.set('value', emitter2, true);
            assert(entity.data.value === emitter2);
            assert(entity.modified.value === emitter1);

            emitter1.destroy();
            assert(entity.data.value === emitter2);
            assert(entity.modified.value === null);
          }
        },
        {
          name: 'should drop modified if it contains null value for field and Emitter instance in data destroy',
          test: function(){
            var T = createType(null, {
              value: basis.fn.$self
            });

            var emitter = new nsData.Object();
            var entity = T({ value: null });

            entity.set('value', emitter, true);
            assert(entity.data.value === emitter);
            assert('value' in entity.modified === true);
            assert(entity.modified.value === null);

            emitter.destroy();
            assert(entity.data.value === null);
            assert(entity.modified === null);
          }
        },
        {
          name: 'should drop modified when Emitter instance destroy and field in data stores null',
          test: function(){
            var T = createType(null, {
              value: basis.fn.$self
            });

            var emitter = new nsData.Object();
            var entity = T({ value: emitter });

            entity.set('value', null, true);
            assert(entity.data.value === null);
            assert(entity.modified.value === emitter);

            emitter.destroy();
            assert(entity.data.value === null);
            assert(entity.modified === null);
          }
        }
      ]
    },
    {
      name: 'destroy',
      test: [
        {
          name: 'no warnings about handler remove on destroy',
          test: function(){
            var Type = createType();
            var subset = new basis.data.dataset.Filter({ source: Type.all });
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
            var Type = createType();
            var subset = new basis.data.dataset.Filter({ source: Type.all });
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
            var Type = createType('TestType', {
              id: nsEntity.IntId,
              group: Number
            });

            var split = new nsEntity.Grouping({
              wrapper: Type,
              source: Type.all,
              rule: 'data.group'
            });

            var wrapper = split.getSubset(1, true);
            var subset = new basis.data.dataset.Filter({
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
    }
  ]
};
