module.exports = {
  name: 'Rollback',
  test: [
    {
      name: 'update',
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
      name: 'Set',
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
      name: 'Common',
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
    }
  ]
};
