module.exports = {
  name: 'EntitySet',
  test: [
    {
      name: 'Various create arguments configuration',
      test: [
        {
          name: 'wrapper as function',
          test: function(){
            var wrapper = function(){};
            var entityTypeName = basis.genUID();
            var entityType = nsEntity.createType(entityTypeName, {});

            var entitySetType = nsEntity.createSetType(wrapper);
            assert(entitySetType.type.entitySetClass.prototype.wrapper === wrapper);

            var name = basis.genUID();
            var entitySetType = nsEntity.createSetType(name, wrapper);
            assert(entitySetType.typeName === name);
            assert(entitySetType.type.entitySetClass.prototype.wrapper === wrapper);

            var name = basis.genUID();
            var entitySetType = nsEntity.createSetType({
              name: name,
              type: wrapper
            });
            assert(entitySetType.typeName === name);
            assert(entitySetType.type.entitySetClass.prototype.wrapper === wrapper);
          }
        },
        {
          name: 'wrapper as type name',
          test: function(){
            var wrapper = function(){};
            var entityTypeName = basis.genUID();
            var entityType = nsEntity.createType(entityTypeName, {});

            var entitySetType = nsEntity.createSetType(entityTypeName);
            assert(entitySetType.type.entitySetClass.prototype.wrapper === entityType);

            var name = basis.genUID();
            var entitySetType = nsEntity.createSetType(name, entityTypeName);
            assert(entitySetType.typeName === name);
            assert(entitySetType.type.entitySetClass.prototype.wrapper === entityType);

            var name = basis.genUID();
            var entitySetType = nsEntity.createSetType({
              name: name,
              type: entityTypeName
            });
            assert(entitySetType.typeName === name);
            assert(entitySetType.type.entitySetClass.prototype.wrapper === entityType);
          }
        }
      ]
    },
    {
      name: 'entity set API',
      test: [
        {
          name: 'EntityTyle.all sync issue',
          test: function(){
            var entityType = nsEntity.createType(null, { id: nsEntity.NumberId });

            [{ id: 1 }, { id: 2 }].map(entityType);
            assert(entityType.all.itemCount === 2);

            var allChangesCount = 0;
            entityType.all.addHandler({
              itemsChanged: function(entitySet, delta){
                // there are could one or two events
                allChangesCount += Array.isArray(delta.inserted);
                allChangesCount += Array.isArray(delta.deleted);
              }
            });

            var inserted = entityType.all.setAndDestroyRemoved([{ id: 1 }, { id: 3 }]);
            assert(entityType.all.itemCount === 2);
            assert([1, 3], entityType.all.getValues('data.id').sort());
            assert(allChangesCount === 2);
            assert(Array.isArray(inserted));
            assert(inserted.length === 1);
            assert([3], inserted.map(function(item){
              return item.data.id;
            }));
          }
        },
        {
          name: 'EntitySet#sync issue',
          test: function(){
            var entityType = nsEntity.createType(null, { id: nsEntity.NumberId });
            var entitySetType = nsEntity.createSetType(entityType);
            var entitySet = entitySetType([{ id: 1 }, { id: 2 }]);
            var itemsChanged = 0;
            var deltaHasDeleted = false;
            var deltaHasInserted = false;
            var allChangesCount = 0;

            entityType.all.addHandler({
              itemsChanged: function(entitySet, delta){
                // there are could one or two events
                allChangesCount += Array.isArray(delta.inserted);
                allChangesCount += Array.isArray(delta.deleted);
              }
            });

            entitySet.addHandler({
              itemsChanged: function(entitySet, delta){
                itemsChanged++;
                if (Array.isArray(delta.inserted))
                  deltaHasInserted = true;
                if (Array.isArray(delta.deleted))
                  deltaHasDeleted = true;
              }
            });

            var inserted = entitySet.setAndDestroyRemoved([{ id: 1 }, { id: 3 }]);
            assert(entitySet.itemCount === 2);
            assert([1, 3], entitySet.getValues('data.id').sort());
            assert(itemsChanged === 1);
            assert(allChangesCount === 2);
            assert(deltaHasInserted);
            assert(deltaHasDeleted);
            assert(Array.isArray(inserted));
            assert(inserted && inserted.length === 1);
          }
        },
        {
          name: 'ReadOnlyEntitySet#emit_itemsChanged issue',
          test: function(){
            var fireCount = 0;

            var entityType = nsEntity.createType(null, { id: nsEntity.NumberId, type: String });
            var entityGrouping = new nsEntity.Grouping({
              wrapper: entityType,
              source: entityType.all,
              rule: 'data.type',
              subsetWrapperClass: function(super_){
                return {
                  emit_itemsChanged: function(delta){
                    fireCount++;
                    super_.emit_itemsChanged.call(this, delta);
                  }
                };
              }
            });

            entityGrouping.getSubset('foo', true).dataset.setAndDestroyRemoved([{ id: 1, type: 'foo' }]);
            assert(fireCount === 1);
          }
        }
      ]
    },
    {
      name: 'EntitySet as field type',
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
    },
    {
      name: 'localId',
      test: [
        {
          name: 'define in entity set type',
          test: [
            {
              name: 'should be possible set in set type create',
              test: function(){
                var wrapper = function(){};
                var localId = function(){};

                var entitySetType = nsEntity.createSetType(wrapper, { localId: localId });
                assert(entitySetType.type.entitySetClass.prototype.wrapper === wrapper);
                assert(entitySetType.type.entitySetClass.prototype.localId === localId);

                var name = basis.genUID();
                var entitySetType = nsEntity.createSetType(name, wrapper, { localId: localId });
                assert(entitySetType.typeName === name);
                assert(entitySetType.type.entitySetClass.prototype.wrapper === wrapper);
                assert(entitySetType.type.entitySetClass.prototype.localId === localId);

                var name = basis.genUID();
                var entitySetType = nsEntity.createSetType({
                  name: name,
                  type: wrapper,
                  localId: localId
                });
                assert(entitySetType.typeName === name);
                assert(entitySetType.type.entitySetClass.prototype.wrapper === wrapper);
                assert(entitySetType.type.entitySetClass.prototype.localId === localId);
              }
            },
            {
              name: 'string value for localId should be converted to function',
              test: function(){
                var entitySetType = nsEntity.createSetType({
                  type: Function,
                  localId: 'id'
                });
                var localId = entitySetType.type.entitySetClass.prototype.localId;

                assert(typeof localId === 'function');
                assert(localId({ id: 1 }, { data: { id: 1 } }));
                assert(localId({ id: 1 }, { data: { id: '1' } }));
                assert(localId({ id: 1 }, { data: { id: 2 } }) === false);
              }
            }
          ]
        },
        {
          name: 'runtime',
          test: [
            {
              name: 'should not re-create items with simple local id function',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });
                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = basis.array.search(entitySet.getItems(), 1, 'data.id');
                var two = basis.array.search(entitySet.getItems(), 2, 'data.id');

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                // change set
                entitySetType([{ id: 1, value: 2 }, { id: 3, value: 2 }], entitySet);
                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert({ id: 1, value: 2 }, one.data);
                assert(entitySet.has(two) === false);
              }
            },
            {
              name: 'should not re-create items with custom local id function',
              test: function(){
                var entityType = nsEntity.createType({
                  fields: {
                    id: function(value){
                      return value * 2;
                    },
                    value: Number
                  }
                });
                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: function(data, item){
                    return data.id * 2 == item.data.id;
                  }
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = basis.array.search(entitySet.getItems(), 2, 'data.id');
                var two = basis.array.search(entitySet.getItems(), 4, 'data.id');

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                // change set
                entitySetType([{ id: 1, value: 2 }, { id: 3, value: 2 }], entitySet);
                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert({ id: 2, value: 2 }, one.data);
                assert(entitySet.has(two) === false);
              }
            },
            {
              name: 'should not re-create items by sync method',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });
                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = basis.array.search(entitySet.getItems(), 1, 'data.id');
                var two = basis.array.search(entitySet.getItems(), 2, 'data.id');

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                // change set
                entitySet.setAndDestroyRemoved([{ id: 1, value: 2 }, { id: 3, value: 2 }]);
                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two) === false);
              }
            },
            {
              name: 'should always use type wrapper',
              test: function(){
                var wrapper = function(data, item){
                  return item || new nsData.Object({
                    data: data
                  });
                };

                var entitySetType = nsEntity.createSetType({
                  type: wrapper,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = basis.array.search(entitySet.getItems(), 1, 'data.id');
                var two = basis.array.search(entitySet.getItems(), 2, 'data.id');

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                // change set
                entitySetType([{ id: 1, value: 2 }, { id: 2, value: 2 }], entitySet);
                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));
                assert(one.data.value === 1);
                assert(two.data.value === 1);
              }
            },
            {
              name: 'should call wrapper for each item only once',
              test: function(){
                var count = 0;
                var wrapper = function(data, item){
                  count++;
                  return new nsData.Object({
                    data: data
                  });
                };

                var entitySetType = nsEntity.createSetType({
                  type: wrapper,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);

                assert(entitySet.itemCount === 2);
                assert(count === 2);
              }
            },
            {
              name: 'should roll up items on set create',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });

                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 1, value: 2 }]);
                var one = basis.array.search(entitySet.getItems(), 1, 'data.id');
                var two = basis.array.search(entitySet.getItems(), 2, 'data.id');

                assert(entitySet.itemCount === 1);
                assert(entitySet.has(one));
                assert(one.data.value === 2);
                assert(two === undefined);
              }
            },
            {
              name: 'should roll up items on set update',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });

                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 2 }]);
                var one = basis.array.search(entitySet.getItems(), 1, 'data.id');
                var two = basis.array.search(entitySet.getItems(), 2, 'data.id');

                entitySetType([{ id: 2, value: 3 }, { id: 2, value: 4 }], entitySet);
                assert(entitySet.itemCount === 1);
                assert(entitySet.pick().data.value === 4);
              }
            },
            {
              name: 'should destroy removed items',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });
                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = entitySet.getItems()[0];
                var two = entitySet.getItems()[1];

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                var oneDestroyed = false;
                var twoDestroyed = false;
                one.addHandler({
                  destroy: function(){
                    oneDestroyed = true;
                  }
                });
                two.addHandler({
                  destroy: function(){
                    twoDestroyed = true;
                  }
                });

                // change set
                entitySetType([{ id: 1, value: 2 }, { id: 3, value: 2 }], entitySet);
                assert(entitySet.itemCount == 2);
                assert(oneDestroyed === false);
                assert(twoDestroyed === true);

                // change set
                entitySetType([], entitySet);
                assert(entitySet.itemCount == 0);
                assert(oneDestroyed === true);
              }
            },
            {
              name: 'should destroy items on remove',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });
                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = entitySet.getItems()[0];
                var two = entitySet.getItems()[1];

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                var oneDestroyed = false;
                var twoDestroyed = false;
                one.addHandler({
                  destroy: function(){
                    oneDestroyed = true;
                  }
                });
                two.addHandler({
                  destroy: function(){
                    twoDestroyed = true;
                  }
                });

                // change set
                entitySet.remove(entitySet.pick());
                entitySet.remove(entitySet.pick());
                assert(entitySet.itemCount == 0);
                assert(entitySet.has(one) === false);
                assert(oneDestroyed === true);
                assert(entitySet.has(two) === false);
                assert(twoDestroyed === true);
              }
            },
            {
              name: 'should destroy all members on set destroy',
              test: function(){
                var entityType = nsEntity.createType(null, {
                  id: Number,
                  value: Number
                });
                var entitySetType = nsEntity.createSetType({
                  type: entityType,
                  localId: 'id'
                });

                var entitySet = entitySetType([{ id: 1, value: 1 }, { id: 2, value: 1 }]);
                var one = entitySet.getItems()[0];
                var two = entitySet.getItems()[1];

                assert(entitySet.itemCount === 2);
                assert(entitySet.has(one));
                assert(entitySet.has(two));

                var oneDestroyed = false;
                var twoDestroyed = false;
                one.addHandler({
                  destroy: function(){
                    oneDestroyed = true;
                  }
                });
                two.addHandler({
                  destroy: function(){
                    twoDestroyed = true;
                  }
                });

                // destroy set
                entitySet.destroy();
                assert(oneDestroyed === true);
                assert(twoDestroyed === true);
              }
            }
          ]
        }
      ]
    }
  ]
};
